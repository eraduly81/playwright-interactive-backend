# Playwright Spec Kit - Help Guide

## Overview

Playwright Spec Kit is an interactive API testing framework built with TypeScript, Node.js, and Playwright. It provides a specification-driven approach to testing REST APIs with authentication flows, real-time monitoring, and comprehensive reporting.

## Quick Start

### 1. Start the Backend Service
```bash
npm run dev:backend
```

The server will start on `http://localhost:3000`

### 2. Check Health Status
```bash
curl http://localhost:3000/health
```

### 3. Run a Test
Send a POST request to `/api/tests/run` with a test specification.

## API Endpoints

### Health Check
- **URL**: `GET /health`
- **Response**: `{ "status": "ok", "timestamp": "..." }`

### Run Test
- **URL**: `POST /api/tests/run`
- **Content-Type**: `application/json`
- **Body**: Test specification JSON

### Get Test List
- **URL**: `GET /api/tests`
- **Response**: List of all tests

### Get Test Result
- **URL**: `GET /api/tests/:id`
- **Response**: Test execution results

## Test Specification Format

### Basic Test Structure
```json
{
  "id": "test-1",
  "name": "User API Test",
  "description": "Testing user endpoints",
  "endpoints": [...],
  "authFlows": [...],
  "assertions": [...],
  "environment": {...},
  "tags": ["users", "api"]
}
```

### Endpoint Specification
```json
{
  "id": "endpoint-1",
  "name": "Get Users",
  "method": "GET",
  "url": "https://api.example.com/users",
  "headers": {
    "Content-Type": "application/json"
  },
  "params": {},
  "query": {},
  "timeout": 30000,
  "retries": 3
}
```

### Authentication Flows

#### JWT Token
```json
{
  "id": "auth-1",
  "name": "JWT Auth",
  "type": "jwt",
  "config": {
    "jwt": {
      "token": "eyJhbGciOiJIUzI1NiIs..."
    }
  }
}
```

#### OAuth2 Client Credentials
```json
{
  "id": "auth-2",
  "name": "OAuth2",
  "type": "oauth2",
  "config": {
    "oauth2": {
      "grantType": "client_credentials",
      "tokenUrl": "https://api.example.com/oauth/token",
      "clientId": "your-client-id",
      "clientSecret": "your-client-secret",
      "scopes": ["read", "write"]
    }
  }
}
```

#### API Key
```json
{
  "id": "auth-3",
  "name": "API Key",
  "type": "apikey",
  "config": {
    "apikey": {
      "key": "X-API-Key",
      "value": "your-api-key",
      "location": "header"
    }
  }
}
```

### Assertions

#### Status Code Assertion
```json
{
  "id": "assert-1",
  "type": "status",
  "expected": 200,
  "operator": "equals"
}
```

#### Response Body Assertion
```json
{
  "id": "assert-2",
  "type": "body",
  "path": "data.users.length",
  "expected": 5,
  "operator": "greater_than"
}
```

#### Header Assertion
```json
{
  "id": "assert-3",
  "type": "header",
  "path": "content-type",
  "expected": "application/json",
  "operator": "contains"
}
```

#### Response Time Assertion
```json
{
  "id": "assert-4",
  "type": "response_time",
  "expected": 1000,
  "operator": "less_than"
}
```

### Environment Configuration
```json
{
  "environment": {
    "name": "production",
    "baseUrl": "https://api.example.com",
    "variables": {
      "apiVersion": "v1",
      "tenantId": "12345"
    },
    "timeouts": {
      "request": 30000,
      "response": 30000
    }
  }
}
```

## Example Test Request

```bash
curl -X POST http://localhost:3000/api/tests/run \
  -H "Content-Type: application/json" \
  -d '{
    "id": "test-example",
    "name": "Example API Test",
    "description": "Testing basic API functionality",
    "endpoints": [
      {
        "id": "endpoint-1",
        "name": "Get Users",
        "method": "GET",
        "url": "https://jsonplaceholder.typicode.com/users"
      }
    ],
    "authFlows": [],
    "assertions": [
      {
        "id": "assert-1",
        "type": "status",
        "expected": 200,
        "operator": "equals"
      },
      {
        "id": "assert-2",
        "type": "body",
        "path": "length",
        "expected": 0,
        "operator": "greater_than"
      }
    ],
    "environment": {
      "name": "test",
      "baseUrl": "https://jsonplaceholder.typicode.com",
      "variables": {},
      "timeouts": {
        "request": 30000,
        "response": 30000
      }
    },
    "tags": ["example", "users"]
  }'
```

## Real-time Monitoring with WebSocket

Connect to WebSocket at `ws://localhost:3000` for real-time test updates:

### Events
- `testStarted` - Emitted when a test begins
- `testCompleted` - Emitted when a test finishes
- `subscribeToTest` - Subscribe to a specific test ID

### JavaScript Example
```javascript
const socket = io('http://localhost:3000');

socket.on('connect', () => {
  console.log('Connected to server');
});

socket.on('testStarted', (data) => {
  console.log('Test started:', data);
});

socket.on('testCompleted', (result) => {
  console.log('Test completed:', result);
});

// Subscribe to a specific test
socket.emit('subscribeToTest', 'test-1');
```

## Test Results Format

```json
{
  "id": "test-result-1",
  "specId": "test-1",
  "status": "passed",
  "startTime": "2026-04-21T10:00:00.000Z",
  "endTime": "2026-04-21T10:00:02.345Z",
  "duration": 2345,
  "results": [
    {
      "endpointId": "endpoint-1",
      "status": "passed",
      "request": {
        "method": "GET",
        "url": "https://api.example.com/users",
        "headers": {}
      },
      "response": {
        "status": 200,
        "statusText": "OK",
        "headers": {},
        "body": [...],
        "responseTime": 1234
      },
      "assertions": [
        {
          "assertionId": "assert-1",
          "status": "passed",
          "expected": 200,
          "actual": 200
        }
      ]
    }
  ],
  "metrics": {
    "totalEndpoints": 1,
    "passedEndpoints": 1,
    "failedEndpoints": 0,
    "skippedEndpoints": 0,
    "totalAssertions": 1,
    "passedAssertions": 1,
    "failedAssertions": 0,
    "averageResponseTime": 1234,
    "minResponseTime": 1234,
    "maxResponseTime": 1234
  }
}
```

## Operators Reference

| Operator | Description |
|----------|-------------|
| `equals` | Exact match |
| `not_equals` | Not equal |
| `contains` | String contains |
| `greater_than` | Greater than |
| `less_than` | Less than |
| `exists` | Value exists |
| `not_exists` | Value does not exist |

## Environment Variables

Create a `.env` file in the project root:

```env
PORT=3000
LOG_LEVEL=info
UI_URL=http://localhost:5173
NODE_ENV=development
```

## Project Structure

```
playwright-interactive-backend/
├── src/
│   ├── backend/       # Express server
│   ├── engine/        # Test execution engine
│   ├── auth/          # Authentication handlers
│   ├── specs/         # Type definitions
│   ├── config/        # Configuration & logging
│   └── ui/            # React frontend
├── tests/             # Test suites
├── logs/              # Log files
└── package.json
```

## Troubleshooting

### Port Already in Use
```bash
# Find process using port 3000
netstat -ano | findstr :3000
# Kill the process
taskkill /PID <PID> /F
```

### Module Resolution Issues
Ensure all dependencies are installed:
```bash
npm install
```

### Database Issues
If using SQLite features, ensure the database file exists and has proper permissions.

## Development Commands

```bash
# Start backend only
npm run dev:backend

# Start UI only (requires UI dependencies)
npm run dev:ui

# Start both
npm run dev

# Build for production
npm run build

# Run Playwright tests
npm test

# Lint code
npm run lint

# Type check
npm run type-check
```

## Next Steps

1. **Create UI**: Install UI dependencies with `cd src/ui && npm install`
2. **Add Tests**: Create test specifications in the `tests/` directory
3. **Configure CI/CD**: Integrate with your CI pipeline
4. **Customize**: Extend the framework with custom assertions and auth flows

## Support

For issues or questions, refer to the project documentation or create an issue in the repository.

---

**Version**: 1.0.0  
**License**: MIT  
**Built with**: TypeScript, Node.js, Express, Playwright, Socket.io
