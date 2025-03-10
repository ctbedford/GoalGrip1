# Debug Infrastructure Documentation

## Overview

The GOAL:SYNC application implements a robust debug infrastructure to facilitate development, testing, and maintenance. This infrastructure provides comprehensive logging, feature testing, API testing, and persistent storage of debug information.

## Components

### 1. Logger System (`client/src/lib/logger.ts`)

The Logger provides consistent logging functionality with support for different log levels, feature tagging, and automatic persistence.

#### Features:

- **Log Levels**: DEBUG, INFO, WARN, ERROR
- **Feature Area Tagging**: Categorize logs by application area (UI, API, STORAGE, etc.)
- **Feature Verification**: Track implementation and testing status of features
- **Performance Measurement**: Utility functions to measure and log operation durations
- **Configuration**: Runtime adjustable logging levels and enabled areas

#### Usage:

```typescript
import { debug, info, warn, error, FeatureArea } from '@/lib/logger';

// Basic logging
debug(FeatureArea.UI, 'Button component mounted');
info(FeatureArea.API, 'API call completed', { endpoint: '/api/goals', duration: 42 });
warn(FeatureArea.STORAGE, 'Storage quota nearing limit');
error(FeatureArea.AUTH, 'Authentication failed', { reason: 'Invalid token' });

// Feature verification
registerFeature('goal-creation', 'Create new goals', FeatureArea.GOAL);
markFeatureImplemented('goal-creation');
markFeatureTested('goal-creation');

// Performance measurement
const id = startPerformanceMeasurement('fetch-goals', FeatureArea.API);
// ...operation...
const result = endPerformanceMeasurement(id);
console.log(`Operation took ${result.duration}ms`);

// Wrap a function for performance measurement
const data = await measurePerformance(
  () => fetchGoalsFromAPI(),
  'fetch-goals',
  FeatureArea.API
);
```

### 2. Debug Storage (`client/src/lib/debugStorage.ts`)

Persistent storage for debug information, logs, and test results using localStorage.

#### Features:

- **Log Persistence**: Stores logs across sessions
- **Test Result Storage**: Maintains history of feature and API test results
- **Filtering**: Retrieve logs by level, area, date range
- **Export/Import**: Save and load debug data as JSON

#### Usage:

```typescript
import { 
  addLogEntry, 
  getLogEntries, 
  clearLogs,
  updateFeatureTestResult,
  addApiTestResult,
  exportDebugData,
  importDebugData
} from '@/lib/debugStorage';

// Get filtered logs
const errorLogs = getLogEntries({ 
  level: LogLevel.ERROR,
  area: FeatureArea.API,
  fromDate: new Date('2025-01-01')
});

// Export debug data
const jsonData = exportDebugData();

// Clear all logs
clearLogs();
```

### 3. Feature Testing (`client/src/lib/featureTester.tsx`)

Framework for implementing and running tests on application features.

#### Features:

- **Dependency Management**: Specify test dependencies to ensure proper test order
- **Status Tracking**: NOT_STARTED, RUNNING, PASSED, FAILED, SKIPPED
- **Feature Area Tagging**: Group tests by application area
- **Performance Metrics**: Track test execution duration
- **React Component**: UI for running and viewing test results

#### Usage:

```typescript
import { 
  registerFeatureTest, 
  runFeatureTest,
  runAllFeatureTests,
  FeatureTest,
  TestStatus
} from '@/lib/featureTester';

// Register a test
const goalCreationTest: FeatureTest = {
  id: 'goal-creation',
  name: 'Goal Creation',
  description: 'Tests the goal creation functionality',
  area: FeatureArea.GOAL,
  dependencies: ['categories-list'],
  test: async () => {
    // Test implementation
    return true; // or false if test fails
  }
};

registerFeatureTest(goalCreationTest);

// Run a specific test
const result = await runFeatureTest('goal-creation');
console.log(`Test status: ${result.status}`);

// Run all tests
const allResults = await runAllFeatureTests();
```

### 4. API Testing (`client/src/lib/apiTester.ts`)

Utilities for testing API endpoints and monitoring their functionality.

#### Features:

- **Endpoint Testing**: Test individual API endpoints
- **Full API Suite Testing**: Run tests on all critical endpoints
- **Performance Tracking**: Measure response times
- **Result History**: Store test results for trend analysis
- **Test Reporting**: Generate formatted test reports

#### Usage:

```typescript
import { 
  testEndpoint, 
  testAllEndpoints,
  testGoalLifecycle,
  ApiEndpoint
} from '@/lib/apiTester';

// Test a specific endpoint
const result = await testEndpoint({
  endpoint: ApiEndpoint.GOALS,
  method: 'GET',
  body: null,
  expectedStatus: 200
});

// Test all endpoints
const allResults = await testAllEndpoints();

// Test a full lifecycle
const success = await testGoalLifecycle();
```

### 5. Debug Console (`client/src/pages/debug.tsx`)

Comprehensive UI for viewing logs, running tests, and analyzing debug information.

#### Features:

- **Log Viewer**: Filter and view logs from the application
- **Feature Test Runner**: Run and view results of feature tests
- **API Test Runner**: Run and view results of API tests
- **Export/Import**: Export and import debug data
- **Clear Functions**: Clear logs and test results

## Initialization and Configuration

The debug infrastructure is automatically initialized when the application loads:

1. **Logger Configuration**: Default configuration loaded at startup
2. **Debug Storage**: Initializes and loads from localStorage
3. **Feature Tests**: Registered during component initialization
4. **API Tests**: Ready to run from the Debug Console

## Best Practices

### 1. Logging

- Use appropriate log levels:
  - **DEBUG**: Detailed development information
  - **INFO**: General operational events
  - **WARN**: Potential issues or unexpected behavior
  - **ERROR**: Errors that prevent normal operation

- Always include feature area to facilitate filtering
- Include relevant data objects for context

### 2. Feature Testing

- Create small, focused tests for specific functionality
- Specify dependencies to ensure proper test order
- Include clear error messages when tests fail

### 3. API Testing

- Test both happy path and error scenarios
- Verify response status codes and payload structures
- Use test lifecycle functions for end-to-end testing

### 4. Performance Monitoring

- Use performance measurement for critical operations
- Track trends over time to identify performance regressions
- Set performance budgets for important operations

## Extending the Infrastructure

### Adding New Log Areas

Add new area types to the `FeatureArea` enum in `logger.ts`:

```typescript
export enum FeatureArea {
  // Existing areas...
  NEW_AREA = 'new-area',
}
```

### Adding New Feature Tests

Create and register new tests following the `FeatureTest` interface:

```typescript
const newTest: FeatureTest = {
  id: 'unique-test-id',
  name: 'Human-readable test name',
  description: 'Detailed test description',
  area: FeatureArea.RELEVANT_AREA,
  dependencies: ['any-dependent-tests'],
  test: async () => {
    // Test implementation
    return successResult; // boolean
  }
};

registerFeatureTest(newTest);
```

### Adding New API Tests

Add new endpoints to the `ApiEndpoint` enum in `apiTester.ts`:

```typescript
export enum ApiEndpoint {
  // Existing endpoints...
  NEW_ENDPOINT = '/api/new-endpoint',
}
```

## Conclusion

The debug infrastructure provides a robust foundation for developing, testing, and maintaining the GOAL:SYNC application. By leveraging these tools, developers can more easily identify issues, verify functionality, and ensure the reliability of the application as it continues to evolve.