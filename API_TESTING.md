# API Testing Documentation for GOAL:SYNC

This document outlines the API testing infrastructure and best practices for the GOAL:SYNC application.

## Overview

The API testing framework in GOAL:SYNC provides comprehensive tools for verifying API functionality, performance, and reliability. The framework is designed to:

1. Verify all API endpoints function correctly
2. Validate response formats and data integrity
3. Test API behavior with different inputs
4. Monitor performance and detect issues

## Core Components

### API Testing Utility (`apiTester.ts`)

The API testing utility provides functions for testing API endpoints, including:

- **Individual endpoint testing**: Test specific endpoints with custom parameters
- **Full API test suite**: Run tests on all critical endpoints
- **User journey testing**: Test complete workflows across multiple endpoints
- **Performance monitoring**: Track API response times and reliability

### API Dashboard (`enhanced-api-dashboard.tsx`)

The API Dashboard visualizes test results and provides:

- **Test result visualization**: View success/failure status for all endpoints
- **Performance metrics**: Track response times and success rates
- **Request/response inspection**: Examine detailed request and response data
- **Error analysis**: Analyze API errors with detailed context

### Integration with Enhanced Logging

API tests are integrated with the enhanced logging system to provide:

- **Context correlation**: Link API tests with execution contexts
- **Detailed tracing**: Trace API calls through the system
- **Error correlation**: Correlate API errors with system logs

## Available API Endpoints

```typescript
export enum ApiEndpoint {
  USERS = '/api/users',
  DASHBOARD = '/api/dashboard/stats',
  GOALS = '/api/goals',
  GOAL_BY_ID = '/api/goals/:id',
  CATEGORIES = '/api/categories',
  PROGRESS_LOGS = '/api/progress-logs',
  PROGRESS_LOGS_BY_GOAL = '/api/progress-logs/:goalId',
  ACTION_ITEMS = '/api/action-items',
  BADGES = '/api/badges',
}
```

## Testing Functions

### Test Single Endpoint

```typescript
const result = await testEndpoint({
  endpoint: ApiEndpoint.GOALS,
  method: 'GET',
  data: null,  // Optional request body
  params: {},  // Optional URL parameters
  expectedStatus: 200,
  validateResponse: (data) => {
    // Optional validation function
    return data && Array.isArray(data);
  }
});
```

### Test All Endpoints

```typescript
const results = await testAllEndpoints();
console.log(`${results.filter(r => r.success).length} of ${results.length} tests passed`);
```

### Test Goal Lifecycle

```typescript
const success = await testGoalLifecycle();
// Tests goal creation, updating, progress tracking, and deletion
```

### Test Complete User Journey

```typescript
const success = await testCompleteUserJourney();
// Tests a complete user journey from goal creation to achievement earning
```

## Test Result Structure

```typescript
export interface ApiTestResult {
  endpoint: string;
  method: string;
  status: number;
  success: boolean;
  data: any;
  error?: any;
  duration: number;
  timestamp: Date;
}
```

## Best Practices

### 1. Test Data Management

- **Use predictable test data**: Use consistent naming patterns for test data
- **Clean up after tests**: Delete test data after tests complete
- **Avoid ID collisions**: Use unique identifiers for test resources

### 2. Test Organization

- **Group related tests**: Organize tests by feature or resource type
- **Test dependencies**: Handle dependencies between tests appropriately
- **Isolate tests**: Ensure tests can run independently when possible

### 3. Response Validation

- **Validate structure**: Check response structure against expected schema
- **Validate data types**: Ensure fields have correct data types
- **Validate business rules**: Verify business logic is correctly applied

### 4. Error Testing

- **Test error cases**: Verify API returns appropriate errors
- **Test validation**: Verify validation rules are enforced
- **Test edge cases**: Test boundary conditions and edge cases

### 5. Performance Testing

- **Monitor response times**: Track and analyze response times
- **Test under load**: Test API behavior under increased load
- **Test resource usage**: Monitor resource usage during tests

## Example: Testing Goal Creation

```typescript
// Test goal creation
const goalData = {
  description: "Test Goal",
  targetValue: 100,
  currentValue: 0,
  deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
  categoryId: 1
};

const result = await testEndpoint({
  endpoint: ApiEndpoint.GOALS,
  method: 'POST',
  data: goalData,
  expectedStatus: 201,
  validateResponse: (data) => {
    return data && 
           data.description === goalData.description &&
           data.id !== undefined;
  }
});

console.log(`Goal creation test ${result.success ? 'passed' : 'failed'}`);
```

## Advanced Usage

### Generating Test Reports

```typescript
const report = generateTestReport();
console.log(report);
```

### Integrating with CI/CD

The API testing framework can be integrated with CI/CD pipelines to:

1. Run tests automatically on code changes
2. Block deployments if tests fail
3. Generate test reports for review

### Custom Test Extensions

Extend the testing framework for specific needs:

```typescript
// Add a custom test for a specific feature
export async function testCustomFeature(): Promise<boolean> {
  const contextId = enhancedLogger.createContext('api', 'custom-feature-test').id;
  
  try {
    // Custom test implementation
    enhancedLogger.logStep(contextId, 'Testing custom feature', LogLevel.INFO);
    
    // Test implementation...
    
    enhancedLogger.completeContext(contextId, true);
    return true;
  } catch (error) {
    enhancedLogger.logStep(contextId, `Test failed: ${error}`, LogLevel.ERROR);
    enhancedLogger.completeContext(contextId, false, { error });
    return false;
  }
}
```