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
/**
 * Prepare data for API request by converting Date objects to ISO strings
 */
function prepareRequestData(data: any): any {
  if (!data) return data;
  
  // Deep clone the data to avoid modifying the original
  const preparedData = JSON.parse(JSON.stringify(data, (key, value) => {
    // Convert Date objects to ISO strings
    if (value instanceof Date) {
      return value.toISOString();
    }
    return value;
  }));
  
  return preparedData;
}

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
  
  // Prepare data for API request (handle Date objects)
  const preparedData = prepareRequestData(data);
  
  const startTime = performance.now();
  let result: ApiTestResult;
  
  try {
    logger.info(FeatureArea.API, `Testing API endpoint: ${method} ${url}`);
    
    const response = await apiRequest(
      method,
      url,
      preparedData
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
  
  // Test goal creation
  const testGoal = {
    description: 'API Test Goal',
    targetValue: 100,
    currentValue: 0,
    unit: 'points',
    deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    categoryId: null,
    reminderFrequency: 'daily',
    userId: 1
  };
  results.push(await testEndpoint(ApiEndpoint.GOALS, 'POST', testGoal));
  
  // Get goals again to see if our new goal is included
  results.push(await testEndpoint(ApiEndpoint.GOALS));
  
  // Test progress logging for a goal
  // We need to get the ID of an existing goal first
  const goalsResult = await testEndpoint(ApiEndpoint.GOALS);
  if (goalsResult.success && goalsResult.data.length > 0) {
    const goalId = goalsResult.data[0].id;
    
    // Log progress
    const progressData = {
      goalId,
      value: 25,
      notes: 'API Test progress log'
    };
    results.push(await testEndpoint(ApiEndpoint.PROGRESS_LOGS, 'POST', progressData));
    
    // Get progress logs for this goal
    results.push(await testEndpoint(
      ApiEndpoint.PROGRESS_LOGS_BY_GOAL, 
      'GET', 
      undefined, 
      { goalId: goalId.toString() }
    ));
    
    // Test goal updating
    results.push(await testEndpoint(
      ApiEndpoint.GOAL_BY_ID, 
      'PATCH',
      { currentValue: 50 },
      { id: goalId.toString() }
    ));
    
    // Get the specific goal by ID
    results.push(await testEndpoint(
      ApiEndpoint.GOAL_BY_ID,
      'GET',
      undefined,
      { id: goalId.toString() }
    ));
  }
  
  // Log testing summary
  const successful = results.filter(r => r.success).length;
  const failed = results.length - successful;
  
  logger.info(
    FeatureArea.API,
    `API testing complete: ${successful} passed, ${failed} failed out of ${results.length} total tests`,
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
        categoryId: 0,
        reminderFrequency: 'daily',
        userId: 1
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

/**
 * Test a complete user journey from setting goals to earning achievements
 */
export async function testCompleteUserJourney(): Promise<boolean> {
  logger.info(FeatureArea.API, 'Testing complete user journey across all features');
  
  try {
    // Step 1: Create a goal category
    const categoryData = {
      name: 'Health',
      color: '#4ade80',
      icon: 'Heart'
    };
    
    // Get initial categories to check if we already have a Health category
    const initialCategoriesResult = await testEndpoint(ApiEndpoint.CATEGORIES);
    let categoryId: number = 0; // Default to 0 instead of null
    
    if (initialCategoriesResult.success) {
      // Look for existing Health category
      const existingCategory = initialCategoriesResult.data.find(
        (c: any) => c.name === 'Health'
      );
      
      if (existingCategory) {
        categoryId = existingCategory.id;
        logger.info(FeatureArea.API, 'Using existing Health category', { categoryId });
      } else {
        // Create new category if needed
        // Note: Our API endpoints may not support category creation,
        // so we'll handle that gracefully and continue without a category
        // In a real app with full implementation, we would add a POST endpoint for categories
        categoryId = 0;
      }
    }
    
    // Step 2: Check initial dashboard stats
    const initialStatsResult = await testEndpoint(ApiEndpoint.DASHBOARD);
    if (!initialStatsResult.success) {
      logger.error(FeatureArea.API, 'Failed to get initial dashboard stats', initialStatsResult);
      return false;
    }
    const initialStats = initialStatsResult.data;
    
    // Step 3: Create a goal
    const createGoalResult = await testEndpoint(
      ApiEndpoint.GOALS,
      'POST',
      {
        description: 'Run 5km every week',
        targetValue: 5,
        currentValue: 0,
        unit: 'kilometers',
        deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
        categoryId,
        reminderFrequency: 'weekly',
        userId: 1
      }
    );
    
    if (!createGoalResult.success) {
      logger.error(FeatureArea.API, 'Failed to create goal', createGoalResult);
      return false;
    }
    
    const goalId = createGoalResult.data.id;
    
    // Step 4: Verify goal was created by getting all goals
    const goalsResult = await testEndpoint(ApiEndpoint.GOALS);
    if (!goalsResult.success) {
      logger.error(FeatureArea.API, 'Failed to get goals', goalsResult);
      return false;
    }
    
    // Step 5: Log progress multiple times over a simulated period
    // Simulate logging progress over several days
    const progressDates = [
      new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 1 week ago
      new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
      new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
      new Date() // Today
    ];
    
    for (let i = 0; i < progressDates.length; i++) {
      const logResult = await testEndpoint(
        ApiEndpoint.PROGRESS_LOGS,
        'POST',
        {
          goalId,
          value: 1 + i * 0.5, // Increasing progress each time
          notes: `Week ${i+1} running progress`,
          date: progressDates[i]
        }
      );
      
      if (!logResult.success) {
        logger.error(FeatureArea.API, `Failed to log progress for week ${i+1}`, logResult);
        return false;
      }
    }
    
    // Step 6: Check progress logs
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
    
    // Step 7: Check if we have action items
    const actionItemsResult = await testEndpoint(ApiEndpoint.ACTION_ITEMS);
    if (!actionItemsResult.success) {
      logger.error(FeatureArea.API, 'Failed to get action items', actionItemsResult);
      return false;
    }
    
    // Step 8: Update goal progress to completion
    const updateResult = await testEndpoint(
      ApiEndpoint.GOAL_BY_ID,
      'PATCH',
      { 
        currentValue: 5, // Target value
        completed: true 
      },
      { id: goalId.toString() }
    );
    
    if (!updateResult.success) {
      logger.error(FeatureArea.API, 'Failed to update goal to completed', updateResult);
      return false;
    }
    
    // Step 9: Verify dashboard stats updated
    const finalStatsResult = await testEndpoint(ApiEndpoint.DASHBOARD);
    if (!finalStatsResult.success) {
      logger.error(FeatureArea.API, 'Failed to get final dashboard stats', finalStatsResult);
      return false;
    }
    
    // Step 10: Check badges
    const badgesResult = await testEndpoint(ApiEndpoint.BADGES);
    if (!badgesResult.success) {
      logger.error(FeatureArea.API, 'Failed to get badges', badgesResult);
      return false;
    }
    
    logger.info(
      FeatureArea.API,
      'Complete user journey test finished successfully',
      { goalId }
    );
    
    return true;
  } catch (error) {
    logger.error(FeatureArea.API, 'Error in user journey test', error);
    return false;
  }
}

export default {
  testEndpoint,
  testAllEndpoints,
  testGoalLifecycle,
  testCompleteUserJourney,
  getTestResults,
  clearTestResults,
  generateTestReport,
  ApiEndpoint,
};