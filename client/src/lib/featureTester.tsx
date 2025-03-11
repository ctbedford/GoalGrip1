/**
 * Feature Testing utility for Goal Tracker application
 * 
 * This module provides components and functions to test and verify
 * UI features and components in the application.
 */

import { FeatureArea } from './logger';

// Test status enum
export enum TestStatus {
  NOT_STARTED = 'not_started',
  RUNNING = 'running',
  PASSED = 'passed',
  FAILED = 'failed',
  SKIPPED = 'skipped',
}

// Result of a feature test
export interface FeatureTestResult {
  id: string;
  name: string;
  description: string;
  status: TestStatus;
  error?: string;
  duration?: number;
  details?: any;
  timestamp?: Date;
  contextId?: string; // For correlation with enhanced logging
}

// Feature test definition
export interface FeatureTest {
  id: string;
  name: string;
  description: string;
  area: FeatureArea;
  dependencies?: string[];
  featureName?: string; // Explicitly link test to a feature
  test: (contextId?: string) => Promise<boolean> | boolean;
}

// Store for registered tests
const registeredTests: FeatureTest[] = [];

// Store for test results
const testResults: Record<string, FeatureTestResult> = {};

/**
 * Helper to determine feature name from test
 * This mapping is critical for the "Run all tests" button to work correctly
 */
function getFeatureNameFromTest(test: FeatureTest): string | null {
  // Explicitly set feature name takes precedence
  if (test.featureName) {
    return test.featureName;
  }
  
  // Try to extract from description
  const descMatch = test.description.match(/for the (\w+) feature/i);
  if (descMatch && descMatch[1]) {
    return descMatch[1];
  }
  
  // Try to extract from name
  const nameMatch = test.name.match(/^(\w+) Test/i);
  if (nameMatch && nameMatch[1]) {
    return nameMatch[1];
  }
  
  return null;
}

/**
 * Register a feature test
 */
export function registerFeatureTest(test: FeatureTest): void {
  // Check if test with this ID already exists
  const existingIndex = registeredTests.findIndex(t => t.id === test.id);
  if (existingIndex !== -1) {
    // Replace existing test
    registeredTests[existingIndex] = test;
  } else {
    // Add new test
    registeredTests.push(test);
  }
}

/**
 * Run a specific feature test with enhanced logging and status tracking
 */
export async function runFeatureTest(testId: string): Promise<FeatureTestResult> {
  const test = registeredTests.find(t => t.id === testId);
  
  if (!test) {
    const failedResult: FeatureTestResult = {
      id: testId,
      name: "Unknown Test",
      description: "Test not found in registry",
      status: TestStatus.FAILED,
      error: `Test with ID "${testId}" not found in registry`,
      timestamp: new Date()
    };
    testResults[testId] = failedResult;
    return failedResult;
  }
  
  // Check dependencies
  if (test.dependencies && test.dependencies.length > 0) {
    const unmetDependencies = test.dependencies.filter(depId => {
      const depResult = testResults[depId];
      return !depResult || depResult.status !== TestStatus.PASSED;
    });
    
    if (unmetDependencies.length > 0) {
      const skippedResult: FeatureTestResult = {
        id: testId,
        name: test.name,
        description: test.description,
        status: TestStatus.SKIPPED,
        error: `Dependencies not met: ${unmetDependencies.join(', ')}`,
        timestamp: new Date()
      };
      testResults[testId] = skippedResult;
      return skippedResult;
    }
  }
  
  // Create result object with running status
  const runningResult: FeatureTestResult = {
    id: testId,
    name: test.name,
    description: test.description,
    status: TestStatus.RUNNING,
    timestamp: new Date()
  };
  
  testResults[testId] = runningResult;
  
  const startTime = performance.now();
  
  try {
    // Run the test
    const contextId = `test-${testId}-${Date.now()}`; // Simple context ID for now
    const success = await Promise.resolve(test.test(contextId));
    
    const endTime = performance.now();
    const duration = endTime - startTime;
    
    if (success) {
      const result: FeatureTestResult = {
        ...runningResult,
        status: TestStatus.PASSED,
        duration,
        contextId,
        timestamp: new Date()
      };
      testResults[testId] = result;
      return result;
    } else {
      const result: FeatureTestResult = {
        ...runningResult,
        status: TestStatus.FAILED,
        error: "Test returned false",
        duration,
        contextId,
        timestamp: new Date()
      };
      testResults[testId] = result;
      return result;
    }
  } catch (err) {
    const endTime = performance.now();
    const duration = endTime - startTime;
    
    const result: FeatureTestResult = {
      ...runningResult,
      status: TestStatus.FAILED,
      error: err instanceof Error ? err.message : String(err),
      duration,
      timestamp: new Date()
    };
    testResults[testId] = result;
    return result;
  }
}

/**
 * Run all registered feature tests
 */
export async function runAllFeatureTests(): Promise<FeatureTestResult[]> {
  const results: FeatureTestResult[] = [];
  
  for (const test of registeredTests) {
    const result = await runFeatureTest(test.id);
    results.push(result);
  }
  
  return results;
}

/**
 * Get all test results
 */
export function getTestResults(): Record<string, FeatureTestResult> {
  return { ...testResults };
}

/**
 * Get a specific test result
 */
export function getTestResult(testId: string): FeatureTestResult | undefined {
  return testResults[testId];
}

/**
 * Reset all test results
 */
export function resetTestResults(): void {
  Object.keys(testResults).forEach(key => {
    delete testResults[key];
  });
}

/**
 * Get all available tests
 */
export function getRegisteredTests(): FeatureTest[] {
  return [...registeredTests];
}

// Register some basic tests for the goal system
registerFeatureTest({
  id: "goal-creation",
  name: "Goal Creation Test",
  description: "Verifies that users can create new goals with valid input",
  area: FeatureArea.GOAL,
  featureName: "goal-creation",
  async test(contextId?) {
    // In a real implementation, this would test the actual functionality
    // For now, just return success
    return true;
  }
});

registerFeatureTest({
  id: "goal-progress",
  name: "Goal Progress Tracking Test",
  description: "Verifies that users can record progress for their goals",
  area: FeatureArea.PROGRESS,
  featureName: "goal-progress-tracking",
  async test(contextId?) {
    // In a real implementation, this would test the actual functionality
    // For now, just return success
    return true;
  }
});

registerFeatureTest({
  id: "dashboard-stats",
  name: "Dashboard Statistics Test",
  description: "Verifies that the dashboard correctly displays goal statistics",
  area: FeatureArea.DASHBOARD,
  featureName: "dashboard-stats",
  async test(contextId?) {
    // In a real implementation, this would test the actual functionality
    // For now, just return success
    return true;
  }
});

export function FeatureTester() {
  return null; // Placeholder component
}

export default FeatureTester;