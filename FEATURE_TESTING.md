# Feature Testing Documentation for GOAL:SYNC

This document outlines the feature testing framework and best practices for the GOAL:SYNC application.

## Overview

The feature testing framework in GOAL:SYNC provides tools for verifying application functionality at the feature level. The framework is designed to:

1. Verify all application features are implemented correctly
2. Test features in isolation and as part of workflows
3. Track feature implementation and test status
4. Provide detailed test results and tracing

## Core Components

### Feature Testing Framework (`featureTester.tsx`)

The feature testing framework provides:

- **Declarative Test Definition**: Define tests with dependencies and execution criteria
- **Dependency Resolution**: Tests with unsatisfied dependencies are automatically skipped
- **Test Status Tracking**: Track implementation and test status for all features
- **Execution Context Tracing**: Each test execution is tracked with a unique context ID

### Feature Status Dashboard (`feature-status-dashboard.tsx`)

The Feature Status Dashboard visualizes:

- **Implementation Status**: Track which features have been implemented
- **Test Status**: Track which features have been tested
- **Test Results**: View detailed test results for each feature
- **Feature Areas**: Group features by functional area

### Integration with Enhanced Logging

Feature tests are integrated with the enhanced logging system:

- **Context-Based Tracing**: Each test creates a unique execution context
- **Detailed Logs**: Each test step is logged with context information
- **Error Correlation**: Errors are correlated with test contexts
- **Performance Tracking**: Test execution time is tracked and reported

## Test Status Types

```typescript
export enum TestStatus {
  NOT_STARTED = 'not_started',
  RUNNING = 'running',
  PASSED = 'passed',
  FAILED = 'failed',
  SKIPPED = 'skipped',
}
```

## Feature Test Interface

```typescript
export interface FeatureTest {
  id: string;
  name: string;
  description: string;
  area: FeatureArea;
  dependencies?: string[];
  test: (contextId?: string) => Promise<boolean> | boolean;
}
```

## Test Result Interface

```typescript
export interface FeatureTestResult {
  id: string;
  name: string;
  description: string;
  status: TestStatus;
  error?: string;
  duration?: number;
  details?: any;
  timestamp?: Date;
  contextId?: string;
}
```

## Feature Testing Process

### 1. Test Registration

Register tests for each feature:

```typescript
registerFeatureTest({
  id: 'feature-1',
  name: 'Feature Name',
  description: 'Tests a specific feature',
  area: FeatureArea.DASHBOARD,
  dependencies: ['dependency-feature'],
  test: async (contextId) => {
    // Test implementation
    return true; // or false on failure
  }
});
```

### 2. Test Execution

Execute tests individually or as a group:

```typescript
// Run a single test
const result = await runFeatureTest('feature-1');

// Run all tests
const results = await runAllFeatureTests();
```

### 3. Test Results

View test results:

```typescript
// Get all test results
const results = getTestResults();

// Get a specific test result
const result = getTestResult('feature-1');
```

## Writing Effective Feature Tests

### 1. Basic Feature Test

```typescript
registerFeatureTest({
  id: 'dashboard-stats',
  name: 'Dashboard Statistics',
  description: 'Verify dashboard statistics are correctly displayed',
  area: FeatureArea.DASHBOARD,
  test: async (contextId) => {
    try {
      // Use the context ID for tracing
      enhancedLogger.logStep(
        contextId as string,
        'Testing dashboard statistics',
        LogLevel.INFO
      );
      
      // Test implementation
      const response = await fetch('/api/dashboard/stats');
      if (!response.ok) return false;
      
      const data = await response.json();
      return data && typeof data.activeGoals === 'number';
    } catch (error) {
      return false;
    }
  }
});
```

### 2. Test with Dependencies

```typescript
registerFeatureTest({
  id: 'goal-progress',
  name: 'Goal Progress Tracking',
  description: 'Verify goal progress can be updated',
  area: FeatureArea.PROGRESS,
  dependencies: ['goal-creation'],
  test: async (contextId) => {
    try {
      // This test will only run if 'goal-creation' test passed
      // Test implementation
      return true;
    } catch (error) {
      return false;
    }
  }
});
```

### 3. Using Enhanced Logging

```typescript
registerFeatureTest({
  id: 'feature-test',
  name: 'Feature Test',
  description: 'Tests a specific feature',
  area: FeatureArea.DASHBOARD,
  test: async (contextId) => {
    // Log test input data
    enhancedLogger.logTestInput(contextId as string, { param1: 'value1' });
    
    // Log API request
    enhancedLogger.logApiRequest(contextId as string, 'GET', '/api/resource');
    
    // Test implementation
    const result = { success: true, value: 'test' };
    
    // Log test output
    enhancedLogger.logTestOutput(
      contextId as string,
      { success: true, value: 'test' },
      result,
      result.success
    );
    
    return result.success;
  }
});
```

## Best Practices

### 1. Test Independence

- **Isolated Tests**: Make each test as independent as possible
- **Clean Test State**: Reset application state between tests
- **Handle Dependencies**: Use the dependency system for tests that depend on others

### 2. Test Coverage

- **Test All Features**: Create tests for all application features
- **Test Edge Cases**: Include tests for edge cases and error conditions
- **Test User Workflows**: Test complete user workflows

### 3. Test Organization

- **Group by Area**: Group tests by functional area
- **Clear Naming**: Use clear and consistent test names
- **Detailed Descriptions**: Provide detailed test descriptions

### 4. Logging and Tracing

- **Use Context IDs**: Always use the provided context ID for tracing
- **Log Key Steps**: Log each important step in a test
- **Log Inputs and Outputs**: Log test inputs and outputs
- **Handle Errors**: Log detailed error information

### 5. Test Maintenance

- **Update Tests**: Keep tests updated as features change
- **Review Failed Tests**: Regular review failed tests
- **Improve Tests**: Continuously improve test coverage and quality

## Feature Test UI Component

The Feature Tester component provides a user interface for:

- **Running Tests**: Run individual tests or test suites
- **Viewing Results**: View test results with detailed information
- **Debugging Tests**: Debug tests with detailed logs
- **Tracking Status**: Track feature implementation and test status

## Advanced Usage

### 1. Test Execution Wrapper

```typescript
const testExecutor = enhancedLogger.createTestExecutor('feature', 'test-id');

const { result, success, contextId } = await testExecutor(async (contextId) => {
  // Test implementation
  return { success: true, data: 'test' };
});
```

### 2. Custom Test Validation

```typescript
registerFeatureTest({
  id: 'custom-validation',
  name: 'Custom Validation Test',
  description: 'Test with custom validation',
  area: FeatureArea.UI,
  test: async (contextId) => {
    // Get data to validate
    const response = await fetch('/api/resource');
    const data = await response.json();
    
    // Custom validation function
    const validateData = (data) => {
      const valid = data && 
                 data.required && 
                 Array.isArray(data.items) && 
                 data.items.length > 0;
                 
      // Log validation results
      enhancedLogger.logStep(
        contextId as string,
        `Data validation ${valid ? 'passed' : 'failed'}`,
        valid ? LogLevel.INFO : LogLevel.ERROR,
        FeatureArea.UI,
        { 
          valid, 
          data, 
          validationErrors: valid ? null : 'Missing required fields or empty items' 
        }
      );
      
      return valid;
    };
    
    return validateData(data);
  }
});
```

### 3. Feature Implementation Tracking

```typescript
// Register a feature for tracking
logger.registerFeature('feature-id', 'Feature Name', 'Feature Description');

// Mark a feature as implemented
logger.markFeatureImplemented('feature-id', true);

// Mark a feature as tested
logger.markFeatureTested('feature-id', true);

// Get feature verification status
const status = logger.getFeatureVerificationStatus();
```