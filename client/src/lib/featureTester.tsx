/**
 * Feature Testing utility for Goal Tracker application
 * 
 * This module provides components and functions to test and verify
 * UI features and components in the application.
 */

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, Info, Play, RefreshCw, AlertTriangle, XCircle, CheckSquare } from 'lucide-react';
import logger, { FeatureArea, LogLevel } from './logger';
import { updateFeatureTestResult, getFeatureTestResults } from './debugStorage';
import { markFeatureImplemented, markFeatureTested } from './logger';
import enhancedLogger from './enhancedLogger';

// Test status enum
export enum TestStatus {
  NOT_STARTED = 'not_started',
  RUNNING = 'running',
  PASSED = 'passed',
  FAILED = 'failed',
  SKIPPED = 'skipped',
}

// Test result interface
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

// Feature test interface
export interface FeatureTest {
  id: string;
  name: string;
  description: string;
  area: FeatureArea;
  dependencies?: string[];
  featureName?: string; // Explicitly link test to a feature
  test: (contextId?: string) => Promise<boolean> | boolean;
}

// Track registered tests
const registeredTests: FeatureTest[] = [];
// Track test results
const testResults: Record<string, FeatureTestResult> = {};

/**
 * Helper to determine feature name from test
 * This mapping is critical for the "Run all tests" button to work correctly
 */
function getFeatureNameFromTest(test: FeatureTest): string | null {
  // First check if the test has an explicit feature name
  if (test.featureName) {
    return test.featureName;
  }
  
  // Map of test areas to feature names
  const areaToFeatureMap: Record<FeatureArea, string> = {
    [FeatureArea.DASHBOARD]: 'Dashboard',
    [FeatureArea.GOAL]: 'Goal Creation',
    [FeatureArea.PROGRESS]: 'Progress Logging',
    [FeatureArea.ANALYTICS]: 'Analytics',
    [FeatureArea.ACHIEVEMENT]: 'Achievements',
    [FeatureArea.SETTINGS]: 'User Settings',
    [FeatureArea.AUTH]: 'Authentication',
    [FeatureArea.API]: 'API Infrastructure',
    [FeatureArea.STORAGE]: 'Data Storage',
    [FeatureArea.UI]: 'UI Components',
    [FeatureArea.NOTIFICATION]: 'Notifications',
    [FeatureArea.PERFORMANCE]: 'Performance Metrics'
  };
  
  // Direct mappings for specific test IDs to feature names
  const testIdToFeatureMap: Record<string, string> = {
    'dashboard-stats': 'Dashboard',
    'dashboard-ui': 'Dashboard',
    'dashboard-api': 'Dashboard',
    'goal-creation': 'Goal Creation',
    'create-goal-modal': 'Goal Creation',
    'goal-tracking-ui': 'Goal Tracking',
    'goal-progress': 'Goal Tracking',
    'progress-log': 'Progress Logging',
    'log-progress-modal': 'Progress Logging',
    'analytics-chart': 'Analytics',
    'analytics-data': 'Analytics',
    'achievement-badges': 'Achievements',
    'achievement-ui': 'Achievements',
    'action-items-creation': 'Action Items',
    'action-items-completion': 'Action Items',
    'category-creation': 'Category Management',
    'category-list': 'Category Management',
    'settings-update': 'User Settings',
    'settings-ui': 'User Settings',
    'performance-metrics': 'Performance Metrics',
    'memory-usage': 'Performance Metrics',
    'enhanced-logger': 'Debug Infrastructure',
    'api-tester': 'Debug Infrastructure',
    'feature-tester': 'Debug Infrastructure',
    'log-viewer': 'Debug Infrastructure',
    'api-dashboard': 'Debug Infrastructure',
    'feature-dashboard': 'Debug Infrastructure',
    'debug-infrastructure': 'Debug Infrastructure'
  };
  
  // First check for direct mapping by ID
  if (test.id in testIdToFeatureMap) {
    return testIdToFeatureMap[test.id];
  }
  
  // Then fall back to area mapping
  if (test.area in areaToFeatureMap) {
    return areaToFeatureMap[test.area];
  }
  
  // No mapping found
  return null;
}

/**
 * Register a feature test
 */
export function registerFeatureTest(test: FeatureTest): void {
  const existing = registeredTests.find(t => t.id === test.id);
  if (existing) {
    logger.warn(FeatureArea.UI, `Test with ID ${test.id} already registered, overwriting`);
    // Remove existing test
    const index = registeredTests.indexOf(existing);
    if (index !== -1) {
      registeredTests.splice(index, 1);
    }
  }
  
  registeredTests.push(test);
  logger.info(FeatureArea.UI, `Registered feature test: ${test.name}`, { id: test.id });
  
  // Get the feature name - prefer explicit feature name first
  const featureName = test.featureName || getFeatureNameFromTest(test);
  
  // Explicitly mark the test feature as implemented when registering a test
  // This creates the proper association between tests and features
  if (featureName) {
    // Register the feature with the appropriate area
    logger.registerFeature(
      featureName, 
      test.area as unknown as string, // Convert FeatureArea to string for compatibility
      `Feature registered via test: ${test.name}`
    );
    
    // Mark the feature as implemented - this helps ensure we have the proper status
    logger.markFeatureImplemented(featureName, `Test registered: ${test.name}`);
    
    // If the test already has a result and it passed, mark the feature as tested too
    const result = testResults[test.id];
    if (result && result.status === TestStatus.PASSED) {
      logger.markFeatureTested(featureName, true, `Test passed: ${test.name}`);
    }
  }
  
  // Update feature test service to ensure mappings are current
  import('./featureTestService').then(module => {
    const { featureTestService } = module;
    // Give a small delay to ensure all registrations are complete
    setTimeout(() => {
      if (typeof featureTestService.refreshMapping === 'function') {
        featureTestService.refreshMapping();
      }
    }, 100);
  });
}

/**
 * Run a specific feature test with enhanced logging and status tracking
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
    
    // Store the test result for consistency
    testResults[testId] = failedResult;
    updateFeatureTestResult(testId, failedResult);
    
    return failedResult;
  }
  
  // Create execution context for this test using enhanced logger
  const context = enhancedLogger.createContext(test.area, test.id);
  const contextId = context.id;
  
  // Log test initiation with metadata
  enhancedLogger.logStep(
    contextId, 
    `Initiating test: ${test.name}`, 
    LogLevel.INFO,
    FeatureArea.UI,
    { 
      testId: test.id,
      testName: test.name,
      testDescription: test.description,
      testArea: test.area,
      dependencies: test.dependencies || [] 
    }
  );
  
  // Check dependencies
  if (test.dependencies && test.dependencies.length > 0) {
    enhancedLogger.logStep(
      contextId,
      `Checking dependencies: ${test.dependencies.join(', ')}`,
      LogLevel.INFO
    );
    
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
        contextId // Add context ID for tracing
      };
      
      enhancedLogger.logStep(
        contextId,
        `Test skipped: dependencies not met: ${unmetDependencies.join(', ')}`,
        LogLevel.WARN,
        FeatureArea.UI,
        { 
          unmetDependencies,
          dependencyStatus: unmetDependencies.reduce((acc, depId) => {
            acc[depId] = testResults[depId]?.status || 'not run';
            return acc;
          }, {} as Record<string, string>)
        }
      );
      
      // Store the test result
      testResults[test.id] = skippedResult;
      updateFeatureTestResult(test.id, skippedResult);
      
      // Complete the context with skipped status
      enhancedLogger.completeContext(contextId, false, {
        status: TestStatus.SKIPPED,
        reason: `Unmet dependencies: ${unmetDependencies.join(', ')}`
      });
      
      // Update feature test status via service
      import('./featureTestService').then(module => {
        const { featureTestService } = module;
        if (typeof featureTestService.updateFeatureTestStatus === 'function') {
          featureTestService.updateFeatureTestStatus([test.id]);
        }
      });
      
      return skippedResult;
    }
    
    enhancedLogger.logStep(contextId, "All dependencies satisfied", LogLevel.INFO);
  }
  
  // Update status to running
  const runningResult: FeatureTestResult = {
    id: test.id,
    name: test.name,
    description: test.description,
    status: TestStatus.RUNNING,
    timestamp: new Date(),
    contextId // Add context ID for tracing
  };
  
  // Store running status
  testResults[test.id] = runningResult;
  updateFeatureTestResult(test.id, runningResult);
  
  const startTime = performance.now();
  
  try {
    // Log input parameters or conditions for the test
    enhancedLogger.logStep(
      contextId,
      "Executing test function",
      LogLevel.INFO,
      FeatureArea.UI
    );
    
    // Execute the test function
    // If the test function accepts parameters, pass the context ID
    const success = typeof test.test === 'function' && test.test.length > 0
      ? await Promise.resolve(test.test(contextId))
      : await Promise.resolve(test.test());
    
    const endTime = performance.now();
    const duration = endTime - startTime;
    
    // Log detailed test execution outcome
    enhancedLogger.logStep(
      contextId,
      `Test execution ${success ? 'succeeded' : 'failed'}`,
      success ? LogLevel.INFO : LogLevel.ERROR,
      FeatureArea.UI,
      { 
        success,
        durationMs: duration,
        result: success
      }
    );
    
    const result: FeatureTestResult = {
      id: test.id,
      name: test.name,
      description: test.description,
      status: success ? TestStatus.PASSED : TestStatus.FAILED,
      duration,
      timestamp: new Date(),
      contextId // Add context ID for tracing
    };
    
    // Store the test result
    testResults[test.id] = result;
    updateFeatureTestResult(test.id, result);
    
    // Get the associated feature name
    const featureName = test.featureName || getFeatureNameFromTest(test);
    
    if (featureName) {
      if (success) {
        // Mark the feature as tested successfully
        markFeatureTested(featureName, true, `Test executed successfully: ${test.name}`);
      } else {
        // Mark the feature test as failed
        markFeatureTested(featureName, false, `Test execution failed: ${test.name}`);
      }
    }
    
    // Update feature test status via service
    import('./featureTestService').then(module => {
      const { featureTestService } = module;
      if (typeof featureTestService.updateFeatureTestStatus === 'function') {
        featureTestService.updateFeatureTestStatus([test.id]);
      }
    });
    
    // Complete the execution context
    enhancedLogger.completeContext(contextId, success, { 
      status: success ? TestStatus.PASSED : TestStatus.FAILED,
      durationMs: duration
    });
    
    return result;
  } catch (error) {
    const endTime = performance.now();
    const duration = endTime - startTime;
    
    const errorMessage = error instanceof Error ? error.message : String(error);
    
    // Log detailed error information
    enhancedLogger.logStep(
      contextId,
      `Test execution threw exception: ${errorMessage}`,
      LogLevel.ERROR,
      FeatureArea.UI,
      { 
        error: error instanceof Error ? {
          message: error.message,
          stack: error.stack,
          name: error.name
        } : String(error),
        durationMs: duration
      }
    );
    
    const result: FeatureTestResult = {
      id: test.id,
      name: test.name,
      description: test.description,
      status: TestStatus.FAILED,
      error: errorMessage,
      duration,
      timestamp: new Date(),
      contextId // Add context ID for tracing
    };
    
    // Store the test result
    testResults[test.id] = result;
    updateFeatureTestResult(test.id, result);
    
    // Get the associated feature name and mark test as failed
    const featureName = test.featureName || getFeatureNameFromTest(test);
    if (featureName) {
      markFeatureTested(featureName, false, `Test failed with error: ${errorMessage}`);
    }
    
    // Update feature test status via service
    import('./featureTestService').then(module => {
      const { featureTestService } = module;
      if (typeof featureTestService.updateFeatureTestStatus === 'function') {
        featureTestService.updateFeatureTestStatus([test.id]);
      }
    });
    
    // Complete the execution context with failure
    enhancedLogger.completeContext(contextId, false, { 
      status: TestStatus.FAILED,
      error: errorMessage,
      durationMs: duration
    });
    
    return result;
  }
}

/**
 * Run all registered feature tests
 */
export async function runAllFeatureTests(): Promise<FeatureTestResult[]> {
  const results: FeatureTestResult[] = [];
  
  // Create a master context for this test run
  const masterContext = enhancedLogger.createContext(FeatureArea.UI, 'all-tests');
  const masterContextId = masterContext.id;
  
  enhancedLogger.logStep(
    masterContextId,
    `Starting test run for ${registeredTests.length} tests`,
    LogLevel.INFO,
    FeatureArea.UI,
    { testCount: registeredTests.length, testIds: registeredTests.map(t => t.id) }
  );
  
  let passCount = 0;
  let failCount = 0;
  let skipCount = 0;
  
  for (const test of registeredTests) {
    enhancedLogger.logStep(
      masterContextId,
      `Running test: ${test.id}`,
      LogLevel.INFO,
      FeatureArea.UI
    );
    
    const result = await runFeatureTest(test.id);
    results.push(result);
    
    enhancedLogger.logStep(
      masterContextId,
      `Test ${test.id} completed with status: ${result.status}`,
      result.status === TestStatus.PASSED ? LogLevel.INFO : 
        result.status === TestStatus.SKIPPED ? LogLevel.WARN : LogLevel.ERROR,
      FeatureArea.UI,
      { result }
    );
    
    if (result.status === TestStatus.PASSED) passCount++;
    else if (result.status === TestStatus.FAILED) failCount++;
    else if (result.status === TestStatus.SKIPPED) skipCount++;
  }
  
  enhancedLogger.logStep(
    masterContextId,
    `Feature testing complete: ${passCount} passed, ${failCount} failed, ${skipCount} skipped`,
    LogLevel.INFO,
    FeatureArea.UI,
    { results }
  );
  
  enhancedLogger.completeContext(masterContextId, failCount === 0, {
    passCount,
    failCount,
    skipCount,
    results
  });
  
  // Update the feature test service after running all tests
  import('./featureTestService').then(module => {
    const { featureTestService } = module;
    if (typeof featureTestService.updateFeatureTestStatus === 'function') {
      featureTestService.updateFeatureTestStatus(results.map(r => r.id));
    }
  });
  
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
  for (const id in testResults) {
    delete testResults[id];
  }
}

/**
 * Get all available tests
 */
export function getRegisteredTests(): FeatureTest[] {
  return [...registeredTests];
}

// Add Dashboard Statistics Test
registerFeatureTest({
  id: 'dashboard-stats',
  name: 'Dashboard Statistics',
  description: 'Verify dashboard statistics are correctly displayed',
  area: FeatureArea.DASHBOARD,
  async test(contextId?) {
    if (contextId) {
      enhancedLogger.logStep(
        contextId,
        "Testing dashboard statistics endpoint",
        LogLevel.INFO,
        FeatureArea.API
      );
    }
    
    // Test dashboard stats API
    try {
      if (contextId) {
        enhancedLogger.logApiRequest(contextId, 'GET', '/api/dashboard/stats');
      }
      const startTime = performance.now();
      const response = await fetch('/api/dashboard/stats');
      const endTime = performance.now();
      
      if (!response.ok) {
        if (contextId) {
          enhancedLogger.logApiResponse(
            contextId, 
            response.status, 
            await response.text(), 
            endTime - startTime
          );
          enhancedLogger.logStep(
            contextId,
            `Dashboard stats API failed with status ${response.status}`,
            LogLevel.ERROR,
            FeatureArea.API
          );
        }
        return false;
      }
      
      const data = await response.json();
      
      if (contextId) {
        enhancedLogger.logApiResponse(
          contextId, 
          response.status, 
          data, 
          endTime - startTime
        );
        
        // Verify structure of response
        enhancedLogger.logStep(
          contextId,
          "Validating dashboard stats response structure",
          LogLevel.INFO,
          FeatureArea.API
        );
        
        const expectedKeys = ['activeGoals', 'completedGoals', 'pointsEarned'];
        const missingKeys = expectedKeys.filter(key => !(key in data));
        
        if (missingKeys.length > 0) {
          enhancedLogger.logStep(
            contextId,
            `Dashboard stats API response missing keys: ${missingKeys.join(', ')}`,
            LogLevel.ERROR,
            FeatureArea.API,
            { expectedKeys, actualKeys: Object.keys(data) }
          );
          return false;
        }
        
        enhancedLogger.logStep(
          contextId,
          "Dashboard stats API response validated successfully",
          LogLevel.INFO,
          FeatureArea.API,
          { stats: data }
        );
      }
      
      // Mark as implemented if passes
      markFeatureImplemented('dashboard-stats', 'Passed API test');
      
      return true;
    } catch (error) {
      if (contextId) {
        enhancedLogger.logStep(
          contextId,
          `Dashboard stats API test failed with error: ${error instanceof Error ? error.message : String(error)}`,
          LogLevel.ERROR,
          FeatureArea.API,
          { error }
        );
      }
      return false;
    }
  }
});

// Add Goal Creation Test
registerFeatureTest({
  id: 'goal-creation',
  name: 'Goal Creation',
  description: 'Verify goals can be created successfully',
  area: FeatureArea.GOAL,
  async test(contextId?) {
    if (contextId) {
      enhancedLogger.logStep(
        contextId,
        "Testing goal creation workflow",
        LogLevel.INFO,
        FeatureArea.GOAL
      );
    }
    
    try {
      const testGoal = {
        userId: 1,
        description: 'Test Goal',
        targetValue: 100,
        currentValue: 0,
        deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        category: 0, // Using 0 for "no category"
        completed: false
      };
      
      if (contextId) {
        enhancedLogger.logTestInput(contextId, testGoal);
        enhancedLogger.logApiRequest(contextId, 'POST', '/api/goals', testGoal);
      }
      
      const startTime = performance.now();
      const response = await fetch('/api/goals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(testGoal)
      });
      const endTime = performance.now();
      
      const data = await response.json();
      
      if (contextId) {
        enhancedLogger.logApiResponse(
          contextId,
          response.status,
          data,
          endTime - startTime
        );
      }
      
      const success = response.ok && data && data.id && data.description === testGoal.description;
      
      if (contextId) {
        if (success) {
          enhancedLogger.logStep(
            contextId,
            "Goal creation succeeded",
            LogLevel.INFO,
            FeatureArea.GOAL,
            { createdGoal: data }
          );
        } else {
          enhancedLogger.logStep(
            contextId,
            "Goal creation failed",
            LogLevel.ERROR,
            FeatureArea.GOAL,
            { 
              statusCode: response.status,
              response: data,
              expectedDescription: testGoal.description,
              actualDescription: data?.description
            }
          );
        }
        
        enhancedLogger.logTestOutput(
          contextId,
          { success: true, description: testGoal.description },
          { success, description: data?.description },
          success
        );
      }
      
      // Mark as implemented if passes
      if (success) {
        markFeatureImplemented('goal-creation', 'Passed goal creation test');
      }
      
      return success;
    } catch (error) {
      if (contextId) {
        enhancedLogger.logStep(
          contextId,
          `Goal creation test failed with error: ${error instanceof Error ? error.message : String(error)}`,
          LogLevel.ERROR,
          FeatureArea.GOAL,
          { error }
        );
      }
      return false;
    }
  }
});

// Add Goal Progress Tracking Test
registerFeatureTest({
  id: 'goal-progress',
  name: 'Goal Progress Tracking',
  description: 'Verify goal progress can be updated',
  area: FeatureArea.PROGRESS,
  dependencies: ['goal-creation'],
  async test(contextId?) {
    if (contextId) {
      enhancedLogger.logStep(
        contextId,
        "Testing goal progress tracking workflow",
        LogLevel.INFO,
        FeatureArea.PROGRESS
      );
    }
    
    try {
      // First create a test goal
      const testGoal = {
        userId: 1,
        description: 'Test Progress Goal',
        targetValue: 100,
        currentValue: 0,
        deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        category: 0,
        completed: false
      };
      
      if (contextId) {
        enhancedLogger.logStep(
          contextId,
          "Creating test goal for progress tracking",
          LogLevel.INFO,
          FeatureArea.GOAL
        );
        enhancedLogger.logApiRequest(contextId, 'POST', '/api/goals', testGoal);
      }
      
      const goalResponse = await fetch('/api/goals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(testGoal)
      });
      
      if (!goalResponse.ok) {
        if (contextId) {
          enhancedLogger.logStep(
            contextId,
            "Failed to create test goal for progress tracking",
            LogLevel.ERROR,
            FeatureArea.GOAL,
            { status: goalResponse.status, response: await goalResponse.text() }
          );
        }
        return false;
      }
      
      const goal = await goalResponse.json();
      
      if (contextId) {
        enhancedLogger.logStep(
          contextId,
          "Successfully created test goal for progress tracking",
          LogLevel.INFO,
          FeatureArea.GOAL,
          { goal }
        );
      }
      
      // Now log progress
      const progress = {
        goalId: goal.id,
        value: 25,
        notes: 'Test progress update'
      };
      
      if (contextId) {
        enhancedLogger.logStep(
          contextId,
          "Logging progress for test goal",
          LogLevel.INFO,
          FeatureArea.PROGRESS
        );
        enhancedLogger.logApiRequest(contextId, 'POST', '/api/progress-logs', progress);
      }
      
      const progressResponse = await fetch('/api/progress-logs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(progress)
      });
      
      if (!progressResponse.ok) {
        if (contextId) {
          enhancedLogger.logStep(
            contextId,
            "Failed to log progress",
            LogLevel.ERROR,
            FeatureArea.PROGRESS,
            { status: progressResponse.status, response: await progressResponse.text() }
          );
        }
        return false;
      }
      
      // Check if progress logs can be retrieved for the goal
      if (contextId) {
        enhancedLogger.logStep(
          contextId,
          "Retrieving progress logs for goal",
          LogLevel.INFO,
          FeatureArea.PROGRESS
        );
        enhancedLogger.logApiRequest(contextId, 'GET', `/api/progress-logs/${goal.id}`);
      }
      
      const logsResponse = await fetch(`/api/progress-logs/${goal.id}`);
      
      if (!logsResponse.ok) {
        if (contextId) {
          enhancedLogger.logStep(
            contextId,
            "Failed to retrieve progress logs",
            LogLevel.ERROR,
            FeatureArea.PROGRESS,
            { status: logsResponse.status, response: await logsResponse.text() }
          );
        }
        return false;
      }
      
      const logs = await logsResponse.json();
      
      if (contextId) {
        enhancedLogger.logStep(
          contextId,
          "Retrieved progress logs successfully",
          LogLevel.INFO,
          FeatureArea.PROGRESS,
          { logs }
        );
        
        // Verify the logs contain our update
        const found = logs.some((log: any) => log.value === progress.value && log.goalId === progress.goalId);
        
        enhancedLogger.logTestOutput(
          contextId,
          { found: true, value: progress.value },
          { found, logs },
          found
        );
        
        if (!found) {
          enhancedLogger.logStep(
            contextId,
            "Progress log not found in returned logs",
            LogLevel.ERROR,
            FeatureArea.PROGRESS,
            { expected: progress, logs }
          );
          return false;
        }
      }
      
      // Mark as implemented if passes
      markFeatureImplemented('goal-progress-tracking', 'Passed progress tracking test');
      
      return true;
    } catch (error) {
      if (contextId) {
        enhancedLogger.logStep(
          contextId,
          `Goal progress test failed with error: ${error instanceof Error ? error.message : String(error)}`,
          LogLevel.ERROR,
          FeatureArea.PROGRESS,
          { error }
        );
      }
      return false;
    }
  }
});

// Register more tests here...

// UI Component for Feature Testing
export function FeatureTester() {
  const [results, setResults] = useState<Record<string, FeatureTestResult>>(getTestResults());
  const [isRunning, setIsRunning] = useState(false);
  const [showDetails, setShowDetails] = useState<string | null>(null);
  
  // Load persisted test results 
  useEffect(() => {
    const persistedResults = getFeatureTestResults();
    if (Object.keys(persistedResults).length > 0) {
      for (const id in persistedResults) {
        testResults[id] = persistedResults[id];
      }
      setResults({...testResults});
    }
    
    logger.info(FeatureArea.UI, `Loaded ${Object.keys(persistedResults).length} feature test results from storage`);
  }, []);
  
  const handleRunAllTests = async () => {
    setIsRunning(true);
    await runAllFeatureTests();
    setResults({...testResults});
    setIsRunning(false);
  };
  
  const handleReset = () => {
    resetTestResults();
    setResults({});
  };
  
  const handleRunTest = async (testId: string) => {
    setIsRunning(true);
    await runFeatureTest(testId);
    setResults({...testResults});
    setIsRunning(false);
  };
  
  const toggleDetails = (testId: string) => {
    setShowDetails(showDetails === testId ? null : testId);
  };
  
  // Group tests by area
  const testsByArea = registeredTests.reduce((acc, test) => {
    const area = test.area || 'Other';
    if (!acc[area]) {
      acc[area] = [];
    }
    acc[area].push(test);
    return acc;
  }, {} as Record<string, FeatureTest[]>);
  
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Feature Tester</CardTitle>
          <CardDescription>
            Run tests to verify the functionality of application features
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex space-x-2">
              <Button onClick={handleRunAllTests} disabled={isRunning}>
                {isRunning ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Running...
                  </>
                ) : (
                  <>
                    <Play className="h-4 w-4 mr-2" />
                    Run All Tests
                  </>
                )}
              </Button>
              <Button variant="outline" onClick={handleReset} disabled={isRunning}>
                Reset
              </Button>
              <Button variant="outline" 
                onClick={() => Object.keys(results).length > 0 && updateFeatureTestResult('all', results)} 
                disabled={isRunning || Object.keys(results).length === 0}>
                Save Results
              </Button>
            </div>
            
            <ScrollArea className="h-[600px] border rounded-md p-4">
              {Object.entries(testsByArea).map(([area, areaTests]) => (
                <div key={area} className="mb-6">
                  <h3 className="text-lg font-semibold mb-2">{area}</h3>
                  <div className="space-y-4">
                    {areaTests.map(test => {
                      const result = results[test.id];
                      const status = result?.status || TestStatus.NOT_STARTED;
                      
                      return (
                        <Card key={test.id} className="overflow-hidden">
                          <div className={`p-4 ${
                            status === TestStatus.PASSED ? 'bg-green-900/20' :
                            status === TestStatus.FAILED ? 'bg-red-900/20' :
                            status === TestStatus.SKIPPED ? 'bg-yellow-900/20' :
                            status === TestStatus.RUNNING ? 'bg-blue-900/20' :
                            'bg-gray-900/10'
                          }`}>
                            <div className="flex justify-between items-start">
                              <div>
                                <h4 className="font-medium flex items-center">
                                  {status === TestStatus.PASSED ? (
                                    <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                                  ) : status === TestStatus.FAILED ? (
                                    <XCircle className="h-4 w-4 text-red-500 mr-2" />
                                  ) : status === TestStatus.SKIPPED ? (
                                    <AlertTriangle className="h-4 w-4 text-yellow-500 mr-2" />
                                  ) : status === TestStatus.RUNNING ? (
                                    <RefreshCw className="h-4 w-4 text-blue-500 mr-2 animate-spin" />
                                  ) : (
                                    <Info className="h-4 w-4 text-gray-500 mr-2" />
                                  )}
                                  {test.name}
                                </h4>
                                <p className="text-sm text-gray-500 mt-1">{test.description}</p>
                                
                                {result?.duration && (
                                  <p className="text-xs text-gray-400 mt-1">
                                    Duration: {result.duration.toFixed(2)}ms
                                  </p>
                                )}
                                
                                {result?.error && (
                                  <div className="mt-2 text-sm text-red-400 bg-red-900/20 p-2 rounded">
                                    {result.error}
                                  </div>
                                )}
                                
                                {showDetails === test.id && result?.contextId && (
                                  <div className="mt-4 space-y-2">
                                    <h5 className="text-sm font-medium">Test Execution Log</h5>
                                    <div className="text-xs bg-gray-900/50 p-2 rounded max-h-[200px] overflow-y-auto">
                                      {enhancedLogger.getLogsByContext(result.contextId).map((log, i) => (
                                        <div key={i} className="mb-2">
                                          <div className={`
                                            ${log.level === LogLevel.ERROR ? 'text-red-400' : 
                                              log.level === LogLevel.WARN ? 'text-yellow-400' : 
                                              log.level === LogLevel.INFO ? 'text-blue-400' : 'text-gray-400'} 
                                            font-mono
                                          `}>
                                            [{new Date(log.timestamp).toLocaleTimeString()}] [{LogLevel[log.level]}] {log.message}
                                          </div>
                                          {log.data && (
                                            <pre className="text-xs text-gray-500 ml-4 mt-1 whitespace-pre-wrap">
                                              {JSON.stringify(log.data, null, 2)}
                                            </pre>
                                          )}
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                )}
                              </div>
                              <div className="flex space-x-2">
                                {result?.contextId && (
                                  <Button 
                                    variant="ghost" 
                                    size="sm" 
                                    onClick={() => toggleDetails(test.id)} 
                                    className="text-xs"
                                  >
                                    {showDetails === test.id ? 'Hide Details' : 'Show Details'}
                                  </Button>
                                )}
                                <Button 
                                  size="sm" 
                                  onClick={() => handleRunTest(test.id)} 
                                  disabled={isRunning}
                                >
                                  Run
                                </Button>
                              </div>
                            </div>
                            {test.dependencies && test.dependencies.length > 0 && (
                              <div className="mt-2 flex items-center flex-wrap gap-1">
                                <span className="text-xs text-gray-500">Dependencies:</span>
                                {test.dependencies.map(depId => {
                                  const depResult = results[depId];
                                  const passed = depResult?.status === TestStatus.PASSED;
                                  
                                  return (
                                    <Badge 
                                      key={depId} 
                                      variant={passed ? "outline" : "secondary"}
                                      className={passed ? "bg-green-900/20" : "bg-gray-900/20"}
                                    >
                                      {depId}
                                      {passed && <CheckSquare className="h-3 w-3 ml-1 text-green-500" />}
                                    </Badge>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        </Card>
                      );
                    })}
                  </div>
                </div>
              ))}
            </ScrollArea>
          </div>
        </CardContent>
        <CardFooter>
          <div className="text-xs text-gray-500">
            {Object.values(results).filter(r => r.status === TestStatus.PASSED).length} passed, 
            {Object.values(results).filter(r => r.status === TestStatus.FAILED).length} failed, 
            {Object.values(results).filter(r => r.status === TestStatus.SKIPPED).length} skipped
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}