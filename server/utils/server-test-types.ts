/**
 * Server-side Test Types for Debug Infrastructure
 * 
 * These types define the structure for test results and test status in the server-side
 * debug infrastructure, independent of client-side implementations.
 */

// Test status enum
export enum TestStatus {
  NOT_STARTED = 'not_started',
  RUNNING = 'running',
  PASSED = 'passed',
  FAILED = 'failed',
  SKIPPED = 'skipped',
}

// Test result interface
export interface TestResult {
  id: string;
  name: string;
  description: string;
  status: TestStatus;
  error?: string;
  duration?: number;
  details?: any;
  timestamp: Date;
}

// In-memory store for test results
const testResults: Record<string, TestResult> = {};

/**
 * Record a test result
 */
export function recordTestResult(result: TestResult): void {
  testResults[result.id] = result;
}

/**
 * Get all test results
 */
export function getTestResults(): Record<string, TestResult> {
  return { ...testResults };
}

/**
 * Get a specific test result by ID
 */
export function getTestResult(id: string): TestResult | undefined {
  return testResults[id];
}

/**
 * Clear all test results
 */
export function clearTestResults(): void {
  for (const key in testResults) {
    delete testResults[key];
  }
}

// Export the module
export const serverTestTypes = {
  recordTestResult,
  getTestResults,
  getTestResult,
  clearTestResults
};