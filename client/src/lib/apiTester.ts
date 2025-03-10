/**
 * API Testing utility for Goal Tracker application
 * 
 * This module provides functions to test and verify API endpoints
 * and monitor their functionality and performance.
 */

import { apiRequest } from './queryClient';
import logger, { FeatureArea } from './logger';
import * as debugStorage from './debugStorage';

// API endpoint groups for testing
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

// Test result interface
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

// Store test results
const testResults: ApiTestResult[] = [];

/**
 * Run a test on a specific API endpoint
 */
export async function testEndpoint(
  endpoint: string,
  method: 'GET' | 'POST' | 'PATCH' | 'DELETE' = 'GET',
  data?: any,
  params: Record<string, string> = {}
): Promise<ApiTestResult> {
  // Replace path parameters
  let url = endpoint;
  Object.entries(params).forEach(([key, value]) => {
    url = url.replace(`:${key}`, value);
  });
  
  const startTime = performance.now();
  let result: ApiTestResult;
  
  try {
    logger.info(FeatureArea.API, `Testing API endpoint: ${method} ${url}`);
    
    const response = await apiRequest(
      method,
      url,
      data
    );
    
    const endTime = performance.now();
    const duration = endTime - startTime;
    
    const responseData = await response.json().catch(() => null);
    
    result = {
      endpoint: url,
      method,
      status: response.status,
      success: response.status >= 200 && response.status < 300,
      data: responseData,
      duration,
      timestamp: new Date(),
    };
    
    logger.info(
      FeatureArea.API,
      `API test successful: ${method} ${url}`,
      { status: response.status, duration: `${duration.toFixed(2)}ms` }
    );
  } catch (error: any) {
    const endTime = performance.now();
    const duration = endTime - startTime;
    
    result = {
      endpoint: url,
      method,
      status: error.response?.status || 0,
      success: false,
      data: error.response?.data,
      error,
      duration,
      timestamp: new Date(),
    };
    
    logger.error(
      FeatureArea.API,
      `API test failed: ${method} ${url}`,
      { error, duration: `${duration.toFixed(2)}ms` }
    );
  }
  
  testResults.push(result);
  // Store result in debug storage for persistence
  debugStorage.addApiTestResult(result);
  return result;
}

/**
 * Run tests on all critical API endpoints
 */
export async function testAllEndpoints(): Promise<ApiTestResult[]> {
  logger.info(FeatureArea.API, 'Starting comprehensive API endpoint testing');
  
  const results: ApiTestResult[] = [];
  
  // Dashboard stats
  results.push(await testEndpoint(ApiEndpoint.DASHBOARD));
  
  // Goals endpoints
  results.push(await testEndpoint(ApiEndpoint.GOALS));
  
  // Categories
  results.push(await testEndpoint(ApiEndpoint.CATEGORIES));
  
  // Action items
  results.push(await testEndpoint(ApiEndpoint.ACTION_ITEMS));
  
  // Badges 
  results.push(await testEndpoint(ApiEndpoint.BADGES));
  
  // Log testing summary
  const successful = results.filter(r => r.success).length;
  const failed = results.length - successful;
  
  logger.info(
    FeatureArea.API,
    `API testing complete: ${successful} passed, ${failed} failed`,
    { results }
  );
  
  return results;
}

/**
 * Test goal creation and lifecycle
 */
export async function testGoalLifecycle(): Promise<boolean> {
  logger.info(FeatureArea.API, 'Testing goal lifecycle (create, read, update, delete)');
  
  try {
    // 1. Create a test goal
    const createResult = await testEndpoint(
      ApiEndpoint.GOALS,
      'POST',
      {
        description: 'Test Goal ' + new Date().toISOString(),
        targetValue: 100,
        currentValue: 0,
        unit: 'points',
        deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 1 week from now
        categoryId: null,
        reminderFrequency: 'daily'
      }
    );
    
    if (!createResult.success) {
      logger.error(FeatureArea.API, 'Failed to create test goal', createResult);
      return false;
    }
    
    const goalId = createResult.data.id;
    
    // 2. Read the created goal
    const readResult = await testEndpoint(
      ApiEndpoint.GOAL_BY_ID,
      'GET',
      undefined,
      { id: goalId.toString() }
    );
    
    if (!readResult.success) {
      logger.error(FeatureArea.API, 'Failed to read test goal', readResult);
      return false;
    }
    
    // 3. Update the goal
    const updateResult = await testEndpoint(
      ApiEndpoint.GOAL_BY_ID,
      'PATCH',
      { currentValue: 50 },
      { id: goalId.toString() }
    );
    
    if (!updateResult.success) {
      logger.error(FeatureArea.API, 'Failed to update test goal', updateResult);
      return false;
    }
    
    // 4. Log progress for the goal
    const logResult = await testEndpoint(
      ApiEndpoint.PROGRESS_LOGS,
      'POST',
      {
        goalId,
        value: 25,
        notes: 'Test progress log'
      }
    );
    
    if (!logResult.success) {
      logger.error(FeatureArea.API, 'Failed to create progress log', logResult);
      return false;
    }
    
    // 5. Get progress logs for the goal
    const logsResult = await testEndpoint(
      ApiEndpoint.PROGRESS_LOGS_BY_GOAL,
      'GET',
      undefined,
      { goalId: goalId.toString() }
    );
    
    if (!logsResult.success) {
      logger.error(FeatureArea.API, 'Failed to get progress logs', logsResult);
      return false;
    }
    
    // 6. Delete the goal
    const deleteResult = await testEndpoint(
      ApiEndpoint.GOAL_BY_ID,
      'DELETE',
      undefined,
      { id: goalId.toString() }
    );
    
    if (!deleteResult.success) {
      logger.error(FeatureArea.API, 'Failed to delete test goal', deleteResult);
      return false;
    }
    
    logger.info(
      FeatureArea.API,
      'Goal lifecycle test completed successfully',
      { goalId }
    );
    
    return true;
  } catch (error) {
    logger.error(FeatureArea.API, 'Error in goal lifecycle test', error);
    return false;
  }
}

/**
 * Get all test results
 */
export function getTestResults(): ApiTestResult[] {
  return [...testResults];
}

/**
 * Clear test results
 */
export function clearTestResults(): void {
  testResults.length = 0;
}

/**
 * Generate a test report
 */
export function generateTestReport(): string {
  const successCount = testResults.filter(r => r.success).length;
  const failCount = testResults.length - successCount;
  const successRate = testResults.length > 0 
    ? (successCount / testResults.length * 100).toFixed(2) 
    : 'N/A';
  
  let report = `# API Test Report\n\n`;
  report += `Generated: ${new Date().toLocaleString()}\n\n`;
  report += `## Summary\n\n`;
  report += `- Total tests: ${testResults.length}\n`;
  report += `- Successful: ${successCount}\n`;
  report += `- Failed: ${failCount}\n`;
  report += `- Success rate: ${successRate}%\n\n`;
  report += `## Test Results\n\n`;
  
  if (testResults.length === 0) {
    report += `No tests have been run yet.\n`;
  } else {
    report += `| Endpoint | Method | Status | Success | Duration (ms) |\n`;
    report += `|----------|--------|--------|---------|---------------|\n`;
    
    testResults.forEach(result => {
      report += `| ${result.endpoint} | ${result.method} | ${result.status} | ${result.success ? '✓' : '✗'} | ${result.duration.toFixed(2)} |\n`;
    });
  }
  
  return report;
}

export default {
  testEndpoint,
  testAllEndpoints,
  testGoalLifecycle,
  getTestResults,
  clearTestResults,
  generateTestReport,
  ApiEndpoint,
};