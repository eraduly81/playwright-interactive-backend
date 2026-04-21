import { APIRequestContext, request } from '@playwright/test';
import { TestSpec, TestResult, EndpointResult, AssertionResult, TestMetrics } from '../specs/types';
import { AuthManager } from '../auth/AuthManager';
import { Logger } from '../config/Logger';

export class TestRunner {
  private authManager: AuthManager;
  private logger: Logger;

  constructor() {
    this.authManager = new AuthManager();
    this.logger = new Logger('TestRunner');
  }

  async runTest(spec: TestSpec): Promise<TestResult> {
    const result: TestResult = {
      id: `test-${Date.now()}`,
      specId: spec.id,
      status: 'running',
      startTime: new Date(),
      results: [],
      metrics: {
        totalEndpoints: spec.endpoints.length,
        passedEndpoints: 0,
        failedEndpoints: 0,
        skippedEndpoints: 0,
        totalAssertions: 0,
        passedAssertions: 0,
        failedAssertions: 0,
        averageResponseTime: 0,
        minResponseTime: Infinity,
        maxResponseTime: 0,
      },
    };

    try {
      // Setup authentication if required
      if (spec.authFlows.length > 0) {
        await this.authManager.setupAuth(spec.authFlows);
      }

      // Execute endpoints in order respecting dependencies
      const orderedEndpoints = this.resolveDependencies(spec.endpoints);
      
      for (const endpoint of orderedEndpoints) {
        const endpointResult = await this.executeEndpoint(endpoint, spec);
        result.results.push(endpointResult);
        
        // Update metrics
        result.metrics.totalAssertions += endpointResult.assertions.length;
        result.metrics.passedAssertions += endpointResult.assertions.filter(a => a.status === 'passed').length;
        result.metrics.failedAssertions += endpointResult.assertions.filter(a => a.status === 'failed').length;
        
        if (endpointResult.status === 'passed') {
          result.metrics.passedEndpoints++;
        } else if (endpointResult.status === 'failed') {
          result.metrics.failedEndpoints++;
        } else {
          result.metrics.skippedEndpoints++;
        }

        if (endpointResult.response?.responseTime) {
          result.metrics.minResponseTime = Math.min(result.metrics.minResponseTime, endpointResult.response.responseTime);
          result.metrics.maxResponseTime = Math.max(result.metrics.maxResponseTime, endpointResult.response.responseTime);
        }
      }

      // Calculate average response time
      const responseTimes = result.results
        .filter(r => r.response?.responseTime)
        .map(r => r.response!.responseTime);
      
      if (responseTimes.length > 0) {
        result.metrics.averageResponseTime = responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length;
      }

      result.status = result.metrics.failedEndpoints === 0 ? 'passed' : 'failed';
      
    } catch (error) {
      this.logger.error('Test execution failed', error);
      result.status = 'failed';
      result.errors = [{
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        timestamp: new Date(),
      }];
    } finally {
      result.endTime = new Date();
      result.duration = result.endTime.getTime() - result.startTime.getTime();
    }

    return result;
  }

  private async executeEndpoint(endpoint: any, spec: TestSpec): Promise<EndpointResult> {
    const result: EndpointResult = {
      endpointId: endpoint.id,
      status: 'running',
      request: {
        method: endpoint.method,
        url: this.resolveUrl(endpoint.url, spec.environment),
        headers: { ...endpoint.headers },
        body: endpoint.body,
      },
      assertions: [],
    };

    try {
      // Add authentication headers
      const authHeaders = await this.authManager.getAuthHeaders();
      result.request.headers = { ...result.request.headers, ...authHeaders };

      // Execute the request using Playwright's APIRequestContext
      const requestContext = await request.newContext();
      
      const startTime = Date.now();
      let response;
      
      switch (result.request.method.toLowerCase()) {
        case 'get':
          response = await requestContext.get(result.request.url, {
            headers: result.request.headers,
            params: endpoint.params,
            timeout: endpoint.timeout || spec.environment.timeouts.request,
          });
          break;
        case 'post':
          response = await requestContext.post(result.request.url, {
            headers: result.request.headers,
            data: result.request.body,
            params: endpoint.params,
            timeout: endpoint.timeout || spec.environment.timeouts.request,
          });
          break;
        case 'put':
          response = await requestContext.put(result.request.url, {
            headers: result.request.headers,
            data: result.request.body,
            params: endpoint.params,
            timeout: endpoint.timeout || spec.environment.timeouts.request,
          });
          break;
        case 'delete':
          response = await requestContext.delete(result.request.url, {
            headers: result.request.headers,
            params: endpoint.params,
            timeout: endpoint.timeout || spec.environment.timeouts.request,
          });
          break;
        case 'patch':
          response = await requestContext.patch(result.request.url, {
            headers: result.request.headers,
            data: result.request.body,
            params: endpoint.params,
            timeout: endpoint.timeout || spec.environment.timeouts.request,
          });
          break;
        default:
          throw new Error(`Unsupported HTTP method: ${result.request.method}`);
      }
      
      const responseTime = Date.now() - startTime;

      result.response = {
        status: response.status(),
        statusText: response.statusText(),
        headers: response.headers(),
        body: await response.json(),
        responseTime,
      };

      // Execute assertions
      const endpointAssertions = spec.assertions.filter(a => 
        endpoint.assertions?.includes(a.id) || !endpoint.assertions
      );

      for (const assertion of endpointAssertions) {
        const assertionResult = await this.executeAssertion(assertion, result.response);
        result.assertions.push(assertionResult);
      }

      result.status = result.assertions.every(a => a.status === 'passed') ? 'passed' : 'failed';
      
      await requestContext.dispose();

    } catch (error) {
      this.logger.error(`Endpoint ${endpoint.id} failed`, error);
      result.status = 'failed';
      result.errors = [error instanceof Error ? error.message : 'Unknown error'];
    }

    return result;
  }

  private async executeAssertion(assertion: any, response: any): Promise<AssertionResult> {
    const result: AssertionResult = {
      assertionId: assertion.id,
      status: 'failed',
      expected: assertion.expected,
      actual: null,
      message: '',
    };

    try {
      let actual: any;

      switch (assertion.type) {
        case 'status':
          actual = response.status;
          break;
        case 'header':
          actual = assertion.path ? response.headers[assertion.path] : response.headers;
          break;
        case 'body':
          actual = assertion.path ? this.getNestedValue(response.body, assertion.path) : response.body;
          break;
        case 'response_time':
          actual = response.responseTime;
          break;
        default:
          throw new Error(`Unknown assertion type: ${assertion.type}`);
      }

      result.actual = actual;

      // Evaluate assertion
      const passed = this.evaluateAssertion(actual, assertion.expected, assertion.operator);
      result.status = passed ? 'passed' : 'failed';
      
      if (!passed) {
        result.message = `Expected ${assertion.expected} ${assertion.operator} ${actual}`;
      }

    } catch (error) {
      result.status = 'failed';
      result.message = error instanceof Error ? error.message : 'Assertion error';
    }

    return result;
  }

  private evaluateAssertion(actual: any, expected: any, operator: string): boolean {
    switch (operator) {
      case 'equals':
        return actual === expected;
      case 'not_equals':
        return actual !== expected;
      case 'contains':
        return typeof actual === 'string' && actual.includes(expected);
      case 'greater_than':
        return Number(actual) > Number(expected);
      case 'less_than':
        return Number(actual) < Number(expected);
      case 'exists':
        return actual !== undefined && actual !== null;
      case 'not_exists':
        return actual === undefined || actual === null;
      default:
        throw new Error(`Unknown operator: ${operator}`);
    }
  }

  private resolveDependencies(endpoints: any[]): any[] {
    // Simple dependency resolution - in production, use topological sort
    const resolved: any[] = [];
    const visited = new Set<string>();

    const visit = (endpoint: any) => {
      if (visited.has(endpoint.id)) return;
      visited.add(endpoint.id);

      // Visit dependencies first
      if (endpoint.dependencies) {
        for (const depId of endpoint.dependencies) {
          const dep = endpoints.find(e => e.id === depId);
          if (dep) visit(dep);
        }
      }

      resolved.push(endpoint);
    };

    for (const endpoint of endpoints) {
      visit(endpoint);
    }

    return resolved;
  }

  private resolveUrl(url: string, environment: any): string {
    // Replace environment variables in URL
    return url.replace(/\{\{(\w+)\}\}/g, (match, key) => {
      return environment.variables[key] || match;
    });
  }

  private getNestedValue(obj: any, path: string): any {
    return path.split('.').reduce((current, key) => current?.[key], obj);
  }
}
