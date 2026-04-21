import { AuthFlowSpec, AuthConfig } from '../specs/types';
import { Logger } from '../config/Logger';
import { APIRequestContext } from '@playwright/test';

export class AuthManager {
  private logger: Logger;
  private authTokens: Map<string, any> = new Map();
  private authHeaders: Map<string, Record<string, string>> = new Map();

  constructor() {
    this.logger = new Logger('AuthManager');
  }

  async setupAuth(authFlows: AuthFlowSpec[]): Promise<void> {
    for (const authFlow of authFlows) {
      try {
        await this.executeAuthFlow(authFlow);
        this.logger.info(`Authentication flow ${authFlow.name} completed successfully`);
      } catch (error) {
        this.logger.error(`Authentication flow ${authFlow.name} failed`, error);
        throw error;
      }
    }
  }

  async getAuthHeaders(): Promise<Record<string, string>> {
    const headers: Record<string, string> = {};
    
    for (const [flowName, flowHeaders] of this.authHeaders) {
      Object.assign(headers, flowHeaders);
    }
    
    return headers;
  }

  private async executeAuthFlow(authFlow: AuthFlowSpec): Promise<void> {
    switch (authFlow.type) {
      case 'oauth2':
        await this.handleOAuth2(authFlow.config.oauth2!);
        break;
      case 'jwt':
        await this.handleJWT(authFlow.config.jwt!);
        break;
      case 'basic':
        await this.handleBasicAuth(authFlow.config.basic!);
        break;
      case 'apikey':
        await this.handleApiKey(authFlow.config.apikey!);
        break;
      case 'custom':
        await this.handleCustomAuth(authFlow.config.custom!);
        break;
      default:
        throw new Error(`Unsupported auth type: ${authFlow.type}`);
    }
  }

  private async handleOAuth2(config: NonNullable<AuthConfig['oauth2']>): Promise<void> {
    const tokenUrl = config.tokenUrl;
    const body: any = {
      grant_type: config.grantType,
      client_id: config.clientId,
    };

    if (config.clientSecret) {
      body.client_secret = config.clientSecret;
    }

    if (config.scopes) {
      body.scope = config.scopes.join(' ');
    }

    // For client credentials flow
    if (config.grantType === 'client_credentials') {
      const response = await this.makeTokenRequest(tokenUrl, body);
      const tokenData = await response.json() as { access_token?: string; token_type?: string; expires_in?: number };
      
      if (tokenData.access_token) {
        this.authTokens.set('oauth2', tokenData);
        this.authHeaders.set('oauth2', {
          'Authorization': `Bearer ${tokenData.access_token}`,
        });
      }
    }
    // For other flows, would need browser automation - simplified for now
  }

  private async handleJWT(config: NonNullable<AuthConfig['jwt']>): Promise<void> {
    this.authTokens.set('jwt', { token: config.token });
    this.authHeaders.set('jwt', {
      'Authorization': `Bearer ${config.token}`,
    });

    // Setup token refresh if refresh URL provided
    if (config.refreshUrl) {
      // TODO: Implement token refresh logic
    }
  }

  private async handleBasicAuth(config: NonNullable<AuthConfig['basic']>): Promise<void> {
    const credentials = Buffer.from(`${config.username}:${config.password}`).toString('base64');
    this.authHeaders.set('basic', {
      'Authorization': `Basic ${credentials}`,
    });
  }

  private async handleApiKey(config: NonNullable<AuthConfig['apikey']>): Promise<void> {
    const headers: Record<string, string> = {};
    
    if (config.location === 'header') {
      const headerName = config.name || 'X-API-Key';
      headers[headerName] = config.value;
    }
    
    this.authHeaders.set('apikey', headers);
  }

  private async handleCustomAuth(config: NonNullable<AuthConfig['custom']>): Promise<void> {
    if (!config.steps || config.steps.length === 0) {
      throw new Error('Custom auth requires steps configuration');
    }

    const headers: Record<string, string> = { ...config.headers };
    let token: string | null = null;

    for (const step of config.steps) {
      const response = await this.makeAuthRequest(step.method, step.url, headers, step.body);
      
      if (step.extractToken) {
        const responseData = await response.json();
        token = this.extractTokenValue(responseData, step.extractToken);
        
        if (token) {
          headers['Authorization'] = `Bearer ${token}`;
        }
      }
    }

    if (token) {
      this.authTokens.set('custom', { token });
      this.authHeaders.set('custom', headers);
    }
  }

  private async makeTokenRequest(url: string, body: any): Promise<Response> {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams(body),
    });

    if (!response.ok) {
      throw new Error(`Token request failed: ${response.status} ${response.statusText}`);
    }

    return response;
  }

  private async makeAuthRequest(method: string, url: string, headers: Record<string, string>, body?: any): Promise<Response> {
    const response = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...headers,
      },
      body: body ? JSON.stringify(body) : undefined,
    });

    if (!response.ok) {
      throw new Error(`Auth request failed: ${response.status} ${response.statusText}`);
    }

    return response;
  }

  private extractTokenValue(data: any, path: string): string | null {
    return path.split('.').reduce((current: any, key: string) => current?.[key], data);
  }

  clearAuth(): void {
    this.authTokens.clear();
    this.authHeaders.clear();
  }

  getAuthToken(flowName: string): any {
    return this.authTokens.get(flowName);
  }
}
