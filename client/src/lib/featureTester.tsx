/**
 * Feature Testing utility for Goal Tracker application
 * 
 * This module provides components and functions to test and verify
 * UI features and components in the application.
 */

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import logger, { FeatureArea } from './logger';
import apiTester, { ApiEndpoint } from './apiTester';
import * as debugStorage from './debugStorage';

// Feature test status
export enum TestStatus {
  NOT_STARTED = 'not_started',
  RUNNING = 'running',
  PASSED = 'passed',
  FAILED = 'failed',
  SKIPPED = 'skipped',
}

// Feature test result
export interface FeatureTestResult {
  id: string;
  name: string;
  description: string;
  status: TestStatus;
  error?: string;
  duration?: number;
  details?: any;
  timestamp?: Date;
}

// Feature test definition
export interface FeatureTest {
  id: string;
  name: string;
  description: string;
  area: FeatureArea;
  dependencies?: string[];
  test: () => Promise<boolean> | boolean;
}

// Store all registered tests
const registeredTests: FeatureTest[] = [];

// Store test results
const testResults: Record<string, FeatureTestResult> = {};

/**
 * Register a feature test
 */
export function registerFeatureTest(test: FeatureTest): void {
  if (registeredTests.find(t => t.id === test.id)) {
    logger.warn(FeatureArea.UI, `Test with ID ${test.id} already registered, overwriting`);
    const index = registeredTests.findIndex(t => t.id === test.id);
    registeredTests[index] = test;
  } else {
    registeredTests.push(test);
    logger.info(FeatureArea.UI, `Registered feature test: ${test.name}`, { id: test.id });
  }
  
  // Initialize result
  testResults[test.id] = {
    id: test.id,
    name: test.name,
    description: test.description,
    status: TestStatus.NOT_STARTED,
  };
}

/**
 * Run a specific feature test
 */
export async function runFeatureTest(testId: string): Promise<FeatureTestResult> {
  const test = registeredTests.find(t => t.id === testId);
  if (!test) {
    const failedResult: FeatureTestResult = {
      id: testId,
      name: 'Unknown Test',
      description: 'Test not found',
      status: TestStatus.FAILED,
      error: `Test with ID ${testId} not found`,
      timestamp: new Date(),
    };
    
    logger.error(FeatureArea.UI, `Test with ID ${testId} not found`);
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
        id: test.id,
        name: test.name,
        description: test.description,
        status: TestStatus.SKIPPED,
        error: `Unmet dependencies: ${unmetDependencies.join(', ')}`,
        timestamp: new Date(),
      };
      
      logger.warn(
        FeatureArea.UI,
        `Skipping test ${test.name} due to unmet dependencies`,
        { dependencies: unmetDependencies }
      );
      
      testResults[test.id] = skippedResult;
      return skippedResult;
    }
  }
  
  // Update status to running
  const runningResult: FeatureTestResult = {
    id: test.id,
    name: test.name,
    description: test.description,
    status: TestStatus.RUNNING,
    timestamp: new Date(),
  };
  
  testResults[test.id] = runningResult;
  logger.info(FeatureArea.UI, `Running feature test: ${test.name}`);
  
  const startTime = performance.now();
  
  try {
    const success = await Promise.resolve(test.test());
    const endTime = performance.now();
    const duration = endTime - startTime;
    
    const result: FeatureTestResult = {
      id: test.id,
      name: test.name,
      description: test.description,
      status: success ? TestStatus.PASSED : TestStatus.FAILED,
      duration,
      timestamp: new Date(),
    };
    
    testResults[test.id] = result;
    
    // Store result in debug storage for persistence
    debugStorage.updateFeatureTestResult(test.id, result);
    
    if (success) {
      logger.info(
        FeatureArea.UI,
        `Feature test passed: ${test.name}`,
        { duration: `${duration.toFixed(2)}ms` }
      );
      
      // Mark feature as tested in the logger
      logger.markFeatureTested(test.name, true);
    } else {
      logger.warn(
        FeatureArea.UI,
        `Feature test failed: ${test.name}`,
        { duration: `${duration.toFixed(2)}ms` }
      );
      
      // Mark feature as tested but failed in the logger
      logger.markFeatureTested(test.name, false);
    }
    
    return result;
  } catch (error: any) {
    const endTime = performance.now();
    const duration = endTime - startTime;
    
    const result: FeatureTestResult = {
      id: test.id,
      name: test.name,
      description: test.description,
      status: TestStatus.FAILED,
      error: error.message || String(error),
      duration,
      timestamp: new Date(),
    };
    
    testResults[test.id] = result;
    
    // Store result in debug storage for persistence
    debugStorage.updateFeatureTestResult(test.id, result);
    
    logger.error(
      FeatureArea.UI,
      `Error in feature test ${test.name}`,
      { error, duration: `${duration.toFixed(2)}ms` }
    );
    
    // Mark feature as tested but failed in the logger
    logger.markFeatureTested(test.name, false, error.message);
    
    return result;
  }
}

/**
 * Run all registered feature tests
 */
export async function runAllFeatureTests(): Promise<FeatureTestResult[]> {
  logger.info(FeatureArea.UI, 'Starting all feature tests');
  
  const results: FeatureTestResult[] = [];
  
  // Sort tests by dependencies
  const sortedTests = [...registeredTests].sort((a, b) => {
    if (a.dependencies?.includes(b.id)) return 1;
    if (b.dependencies?.includes(a.id)) return -1;
    return 0;
  });
  
  for (const test of sortedTests) {
    const result = await runFeatureTest(test.id);
    results.push(result);
  }
  
  const passed = results.filter(r => r.status === TestStatus.PASSED).length;
  const failed = results.filter(r => r.status === TestStatus.FAILED).length;
  const skipped = results.filter(r => r.status === TestStatus.SKIPPED).length;
  
  logger.info(
    FeatureArea.UI,
    `Feature testing complete: ${passed} passed, ${failed} failed, ${skipped} skipped`,
    { results }
  );
  
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
  Object.keys(testResults).forEach(id => {
    testResults[id] = {
      id,
      name: registeredTests.find(t => t.id === id)?.name || 'Unknown',
      description: registeredTests.find(t => t.id === id)?.description || '',
      status: TestStatus.NOT_STARTED,
    };
    
    // Update in debug storage
    debugStorage.updateFeatureTestResult(id, testResults[id]);
  });
  
  // Clear feature test results in debug storage
  debugStorage.clearFeatureTestResults();
  
  logger.info(FeatureArea.UI, 'Reset all test results');
}

/**
 * Generate a test report
 */
export function generateTestReport(): string {
  const results = Object.values(testResults);
  const total = results.length;
  const passed = results.filter(r => r.status === TestStatus.PASSED).length;
  const failed = results.filter(r => r.status === TestStatus.FAILED).length;
  const skipped = results.filter(r => r.status === TestStatus.SKIPPED).length;
  const notStarted = results.filter(r => r.status === TestStatus.NOT_STARTED).length;
  const passRate = total > 0 ? (passed / total * 100).toFixed(2) : 'N/A';
  
  let report = `# Feature Test Report\n\n`;
  report += `Generated: ${new Date().toLocaleString()}\n\n`;
  report += `## Summary\n\n`;
  report += `- Total tests: ${total}\n`;
  report += `- Passed: ${passed}\n`;
  report += `- Failed: ${failed}\n`;
  report += `- Skipped: ${skipped}\n`;
  report += `- Not started: ${notStarted}\n`;
  report += `- Pass rate: ${passRate}%\n\n`;
  report += `## Test Results\n\n`;
  
  if (total === 0) {
    report += `No tests have been registered yet.\n`;
  } else {
    report += `| ID | Name | Status | Duration (ms) | Error |\n`;
    report += `|----|------|--------|--------------|-------|\n`;
    
    results.forEach(result => {
      const status = result.status === TestStatus.PASSED ? '✓ PASSED' :
                     result.status === TestStatus.FAILED ? '✗ FAILED' :
                     result.status === TestStatus.SKIPPED ? '⚠ SKIPPED' : '- NOT STARTED';
      
      const duration = result.duration ? result.duration.toFixed(2) : 'N/A';
      const error = result.error || '';
      
      report += `| ${result.id} | ${result.name} | ${status} | ${duration} | ${error} |\n`;
    });
  }
  
  return report;
}

// Register core feature tests
registerFeatureTest({
  id: 'dashboard-stats',
  name: 'Dashboard Statistics',
  description: 'Verify dashboard statistics are correctly displayed',
  area: FeatureArea.DASHBOARD,
  async test() {
    const result = await apiTester.testEndpoint(ApiEndpoint.DASHBOARD);
    return result.success;
  }
});

registerFeatureTest({
  id: 'goal-creation',
  name: 'Goal Creation',
  description: 'Verify goals can be created successfully',
  area: FeatureArea.GOAL,
  async test() {
    // This is a placeholder that would be replaced with actual UI interaction test
    // For now, we'll use the API test as a proxy
    const testGoal = {
      description: 'Test Goal',
      targetValue: 100,
      currentValue: 0, 
      unit: 'items',
      deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      categoryId: null,
      reminderFrequency: 'daily'
    };
    
    const result = await apiTester.testEndpoint(ApiEndpoint.GOALS, 'POST', testGoal);
    return result.success;
  }
});

registerFeatureTest({
  id: 'goal-progress',
  name: 'Goal Progress Tracking',
  description: 'Verify goal progress can be updated',
  area: FeatureArea.GOAL,
  dependencies: ['goal-creation'],
  async test() {
    // Create a goal first
    const createResult = await apiTester.testEndpoint(
      ApiEndpoint.GOALS,
      'POST',
      {
        description: 'Test Progress Goal',
        targetValue: 100,
        currentValue: 0,
        unit: 'points',
        deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        categoryId: null,
        reminderFrequency: 'daily'
      }
    );
    
    if (!createResult.success) return false;
    
    const goalId = createResult.data.id;
    
    // Log progress for the goal
    const logResult = await apiTester.testEndpoint(
      ApiEndpoint.PROGRESS_LOGS,
      'POST',
      {
        goalId,
        value: 25,
        notes: 'Test progress'
      }
    );
    
    return logResult.success;
  }
});

registerFeatureTest({
  id: 'categories-list',
  name: 'Categories List',
  description: 'Verify categories can be retrieved',
  area: FeatureArea.GOAL,
  async test() {
    const result = await apiTester.testEndpoint(ApiEndpoint.CATEGORIES);
    return result.success;
  }
});

registerFeatureTest({
  id: 'action-items',
  name: 'Action Items',
  description: 'Verify action items can be retrieved',
  area: FeatureArea.DASHBOARD,
  async test() {
    const result = await apiTester.testEndpoint(ApiEndpoint.ACTION_ITEMS);
    return result.success;
  }
});

registerFeatureTest({
  id: 'user-badges',
  name: 'User Badges',
  description: 'Verify user badges can be retrieved',
  area: FeatureArea.ACHIEVEMENT,
  async test() {
    const result = await apiTester.testEndpoint(ApiEndpoint.BADGES);
    return result.success;
  }
});

// Feature test component for debugging
export function FeatureTester() {
  const [results, setResults] = useState<Record<string, FeatureTestResult>>({});
  const [loading, setLoading] = useState(false);
  
  // Load feature test results on initialization
  useEffect(() => {
    // First check if we have any saved results in debug storage
    const savedResults = debugStorage.getFeatureTestResults();
    
    if (Object.keys(savedResults).length > 0) {
      // Convert timestamp strings to Date objects if necessary
      const processedResults = Object.entries(savedResults).reduce((acc, [id, result]) => {
        acc[id] = {
          ...result,
          // Ensure timestamp is a Date object if it exists
          timestamp: result.timestamp ? 
            (result.timestamp instanceof Date ? result.timestamp : new Date(result.timestamp)) 
            : undefined
        };
        return acc;
      }, {} as Record<string, FeatureTestResult>);
      
      // Update the test results in memory with saved values
      Object.entries(processedResults).forEach(([id, result]) => {
        testResults[id] = result;
      });
      
      logger.info(FeatureArea.UI, `Loaded ${Object.keys(savedResults).length} feature test results from storage`);
      setResults(processedResults);
    } else {
      // If no saved results, use the current in-memory state
      setResults(getTestResults());
    }
  }, []);
  
  const handleRunAll = async () => {
    setLoading(true);
    await runAllFeatureTests();
    setResults(getTestResults());
    setLoading(false);
  };
  
  const handleReset = () => {
    resetTestResults();
    setResults(getTestResults());
  };
  
  const handleRunTest = async (testId: string) => {
    await runFeatureTest(testId);
    setResults(getTestResults());
  };
  
  const handleLoadSaved = () => {
    const savedResults = debugStorage.getFeatureTestResults();
    
    if (Object.keys(savedResults).length > 0) {
      // Process timestamp strings to Date objects
      const processedResults = Object.entries(savedResults).reduce((acc, [id, result]) => {
        acc[id] = {
          ...result,
          timestamp: result.timestamp ? 
            (result.timestamp instanceof Date ? result.timestamp : new Date(result.timestamp)) 
            : undefined
        };
        return acc;
      }, {} as Record<string, FeatureTestResult>);
      
      setResults(processedResults);
      logger.info(FeatureArea.UI, `Loaded ${Object.keys(savedResults).length} feature test results from storage`);
    } else {
      logger.info(FeatureArea.UI, 'No saved feature test results found');
    }
  };
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Feature Tester</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex space-x-2">
            <Button onClick={handleRunAll} disabled={loading}>
              {loading ? 'Running...' : 'Run All Tests'}
            </Button>
            <Button variant="outline" onClick={handleReset} disabled={loading}>
              Reset
            </Button>
            <Button 
              variant="outline" 
              onClick={handleLoadSaved}
              disabled={loading}
            >
              Load Saved
            </Button>
          </div>
          
          <Separator />
          
          <div className="space-y-2">
            {Object.values(results).map(result => (
              <div 
                key={result.id}
                className="flex items-center justify-between p-3 border rounded-md"
              >
                <div>
                  <div className="font-medium">{result.name}</div>
                  <div className="text-sm text-gray-500">{result.description}</div>
                  {result.timestamp && (
                    <div className="text-xs text-gray-400 mt-1">
                      Last run: {result.timestamp.toLocaleString()}
                    </div>
                  )}
                  {result.error && (
                    <div className="text-sm text-red-500 mt-1">{result.error}</div>
                  )}
                </div>
                <div className="flex items-center space-x-2">
                  <div className="flex flex-col items-end mr-2">
                    <Badge
                      variant={
                        result.status === TestStatus.PASSED ? "success" :
                        result.status === TestStatus.FAILED ? "destructive" :
                        result.status === TestStatus.SKIPPED ? "warning" :
                        result.status === TestStatus.RUNNING ? "secondary" :
                        "outline"
                      }
                    >
                      {result.status}
                    </Badge>
                    {result.duration && (
                      <div className="text-xs text-gray-400 mt-1">
                        {result.duration.toFixed(2)} ms
                      </div>
                    )}
                  </div>
                  <Button 
                    size="sm" 
                    onClick={() => handleRunTest(result.id)}
                    disabled={loading || result.status === TestStatus.RUNNING}
                  >
                    Run
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
      <CardFooter>
        <div className="text-sm text-gray-500">
          Total: {Object.values(results).length} tests
        </div>
      </CardFooter>
    </Card>
  );
}

export default {
  registerFeatureTest,
  runFeatureTest,
  runAllFeatureTests,
  getTestResults,
  getTestResult,
  resetTestResults,
  generateTestReport,
  FeatureTester,
  TestStatus,
};