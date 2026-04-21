export interface TestSpec {
  id: string;
  name: string;
  description: string;
  endpoints: EndpointSpec[];
  authFlows: AuthFlowSpec[];
  assertions: AssertionSpec[];
  environment: EnvironmentSpec;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface EndpointSpec {
  id: string;
  name: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' | 'HEAD' | 'OPTIONS';
  url: string;
  headers?: Record<string, string>;
  body?: any;
  params?: Record<string, string>;
  query?: Record<string, string>;
  timeout?: number;
  retries?: number;
  dependencies?: string[];
}

export interface AuthFlowSpec {
  id: string;
  name: string;
  type: 'oauth2' | 'jwt' | 'basic' | 'apikey' | 'custom';
  config: AuthConfig;
  endpoints?: string[];
}

export interface AuthConfig {
  oauth2?: {
    grantType: 'authorization_code' | 'client_credentials' | 'password';
    authUrl: string;
    tokenUrl: string;
    clientId: string;
    clientSecret?: string;
    scopes?: string[];
    redirectUri?: string;
  };
  jwt?: {
    token: string;
    refreshUrl?: string;
    refreshField?: string;
  };
  basic?: {
    username: string;
    password: string;
  };
  apikey?: {
    key: string;
    value: string;
    location: 'header' | 'query';
    name?: string;
  };
  custom?: {
    headers?: Record<string, string>;
    body?: any;
    steps?: CustomAuthStep[];
  };
}

export interface CustomAuthStep {
  name: string;
  method: string;
  url: string;
  headers?: Record<string, string>;
  body?: any;
  extractToken?: string;
}

export interface AssertionSpec {
  id: string;
  type: 'status' | 'header' | 'body' | 'response_time' | 'custom';
  expected: any;
  actual?: string;
  operator: 'equals' | 'contains' | 'not_equals' | 'greater_than' | 'less_than' | 'exists' | 'not_exists';
  path?: string;
}

export interface EnvironmentSpec {
  name: string;
  baseUrl: string;
  variables: Record<string, string>;
  timeouts: {
    request: number;
    response: number;
  };
}

export interface TestResult {
  id: string;
  specId: string;
  status: 'passed' | 'failed' | 'skipped' | 'running';
  startTime: Date;
  endTime?: Date;
  duration?: number;
  results: EndpointResult[];
  errors?: TestError[];
  metrics: TestMetrics;
}

export interface EndpointResult {
  endpointId: string;
  status: 'passed' | 'failed' | 'skipped' | 'running';
  request: {
    method: string;
    url: string;
    headers: Record<string, string>;
    body?: any;
  };
  response?: {
    status: number;
    statusText: string;
    headers: Record<string, string>;
    body: any;
    responseTime: number;
  };
  assertions: AssertionResult[];
  errors?: string[];
}

export interface AssertionResult {
  assertionId: string;
  status: 'passed' | 'failed';
  expected: any;
  actual: any;
  message?: string;
}

export interface TestError {
  endpointId?: string;
  assertionId?: string;
  message: string;
  stack?: string;
  timestamp: Date;
}

export interface TestMetrics {
  totalEndpoints: number;
  passedEndpoints: number;
  failedEndpoints: number;
  skippedEndpoints: number;
  totalAssertions: number;
  passedAssertions: number;
  failedAssertions: number;
  averageResponseTime: number;
  minResponseTime: number;
  maxResponseTime: number;
}
