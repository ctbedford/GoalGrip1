/**
 * Enhanced Logger for GOAL:SYNC Application
 * 
 * Provides advanced logging capabilities with correlation IDs for tracing test execution,
 * request/response logging for APIs, and structured logging for feature tests.
 */

import { v4 as uuidv4 } from 'uuid';
import { FeatureArea, LogLevel, debug, info, warn, error } from './logger';
import * as debugStorage from './debugStorage';

// Execution context interface
export interface ExecutionContext {
  id: string;
  feature?: string;
  testId?: string;
  startTime: number;
  endTime?: number;
  status?: 'running' | 'success' | 'failure';
  data?: Record<string, any>;
}

// Store active execution contexts
const activeContexts: Map<string, ExecutionContext> = new Map();

/**
 * Create a new execution context for tracing a test or operation
 */
export function createContext(feature?: string, testId?: string): ExecutionContext {
  const context: ExecutionContext = {
    id: uuidv4(),
    feature,
    testId,
    startTime: performance.now(),
    status: 'running',
    data: {}
  };
  
  activeContexts.set(context.id, context);
  return context;
}

/**
 * Complete an execution context
 */
export function completeContext(
  contextId: string, 
  success: boolean = true, 
  data?: Record<string, any>
): ExecutionContext | null {
  const context = activeContexts.get(contextId);
  if (!context) return null;
  
  context.endTime = performance.now();
  context.status = success ? 'success' : 'failure';
  
  if (data) {
    context.data = { ...context.data, ...data };
  }
  
  // Store in debug storage for later retrieval
  debugStorage.addLogEntry(
    success ? LogLevel.INFO : LogLevel.ERROR,
    FeatureArea.STORAGE,
    `Execution context completed: ${context.feature || ''} ${context.testId || ''}`,
    {
      context,
      duration: context.endTime - context.startTime,
      status: context.status
    }
  );
  
  activeContexts.delete(contextId);
  return context;
}

/**
 * Log a step within an execution context
 */
export function logStep(
  contextId: string,
  step: string,
  level: LogLevel = LogLevel.INFO,
  area: FeatureArea = FeatureArea.PERFORMANCE,
  data?: any
): void {
  const context = activeContexts.get(contextId);
  if (!context) {
    warn(FeatureArea.STORAGE, `Trying to log to non-existent context: ${contextId}`);
    return;
  }
  
  // Log with the context ID for correlation
  const logData = {
    contextId,
    feature: context.feature,
    testId: context.testId,
    step,
    ...data
  };
  
  switch (level) {
    case LogLevel.DEBUG:
      debug(area, `[${contextId.slice(0, 8)}] ${step}`, logData);
      break;
    case LogLevel.INFO:
      info(area, `[${contextId.slice(0, 8)}] ${step}`, logData);
      break;
    case LogLevel.WARN:
      warn(area, `[${contextId.slice(0, 8)}] ${step}`, logData);
      break;
    case LogLevel.ERROR:
      error(area, `[${contextId.slice(0, 8)}] ${step}`, logData);
      break;
  }
}

/**
 * Log API request information
 */
export function logApiRequest(
  contextId: string,
  method: string,
  url: string,
  data?: any
): void {
  logStep(
    contextId,
    `API Request: ${method} ${url}`,
    LogLevel.INFO,
    FeatureArea.API,
    {
      method,
      url,
      requestData: data
    }
  );
}

/**
 * Log API response information
 */
export function logApiResponse(
  contextId: string,
  status: number,
  data: any,
  duration: number
): void {
  const level = status >= 200 && status < 300 ? LogLevel.INFO : LogLevel.ERROR;
  
  logStep(
    contextId,
    `API Response: ${status}`,
    level,
    FeatureArea.API,
    {
      status,
      responseData: data,
      durationMs: duration
    }
  );
}

/**
 * Log test input data
 */
export function logTestInput(
  contextId: string,
  inputData: any
): void {
  logStep(
    contextId,
    'Test Input',
    LogLevel.INFO,
    FeatureArea.UI,
    { input: inputData }
  );
}

/**
 * Log test output data with expected vs actual results
 */
export function logTestOutput(
  contextId: string,
  expected: any,
  actual: any,
  success: boolean
): void {
  logStep(
    contextId,
    'Test Output',
    success ? LogLevel.INFO : LogLevel.ERROR,
    FeatureArea.UI,
    {
      expected,
      actual,
      success,
      difference: success ? null : findDifferences(expected, actual)
    }
  );
}

/**
 * Find differences between expected and actual objects
 */
function findDifferences(expected: any, actual: any): Record<string, any> {
  const differences: Record<string, any> = {};
  
  if (typeof expected !== typeof actual) {
    return { typeMismatch: { expected: typeof expected, actual: typeof actual } };
  }
  
  if (Array.isArray(expected) && Array.isArray(actual)) {
    if (expected.length !== actual.length) {
      differences.lengthMismatch = { expected: expected.length, actual: actual.length };
    }
    
    // Find differences in array items
    const minLength = Math.min(expected.length, actual.length);
    for (let i = 0; i < minLength; i++) {
      const itemDiff = findDifferences(expected[i], actual[i]);
      if (Object.keys(itemDiff).length > 0) {
        differences[`item${i}`] = itemDiff;
      }
    }
    
    return differences;
  }
  
  if (expected !== null && actual !== null && typeof expected === 'object' && typeof actual === 'object') {
    // Compare objects
    const allKeys = new Set([...Object.keys(expected), ...Object.keys(actual)]);
    
    for (const key of allKeys) {
      if (!(key in expected)) {
        differences[key] = { type: 'missing_in_expected', value: actual[key] };
      } else if (!(key in actual)) {
        differences[key] = { type: 'missing_in_actual', value: expected[key] };
      } else if (expected[key] !== actual[key]) {
        if (typeof expected[key] === 'object' && typeof actual[key] === 'object' && 
            expected[key] !== null && actual[key] !== null) {
          const nestedDiff = findDifferences(expected[key], actual[key]);
          if (Object.keys(nestedDiff).length > 0) {
            differences[key] = nestedDiff;
          }
        } else {
          differences[key] = { expected: expected[key], actual: actual[key] };
        }
      }
    }
    
    return differences;
  }
  
  // Simple value comparison
  if (expected !== actual) {
    return { valueMismatch: { expected, actual } };
  }
  
  return differences;
}

/**
 * Get all contexts for a specific feature or test
 */
export function getContextsByFeature(feature: string): ExecutionContext[] {
  // Retrieve from debug storage
  const logs = debugStorage.getLogEntries({
    area: FeatureArea.STORAGE
  });
  
  // Extract contexts from log data
  const contexts: ExecutionContext[] = [];
  logs.forEach(log => {
    if (log.data?.context?.feature === feature) {
      contexts.push(log.data.context);
    }
  });
  
  return contexts;
}

/**
 * Get all logs for a specific execution context
 */
export function getLogsByContext(contextId: string): any[] {
  const logs = debugStorage.getLogEntries();
  return logs.filter(log => log.data?.contextId === contextId);
}

/**
 * Create and return a test execution wrapper function
 * This provides automatic context creation, logging, and context completion
 */
export function createTestExecutor(feature: string, testId: string) {
  return async function executeTest<T>(
    testFn: (contextId: string) => Promise<T>
  ): Promise<{ result: T | null, success: boolean, contextId: string }> {
    // Create execution context
    const context = createContext(feature, testId);
    const contextId = context.id;
    
    // Log test start
    logStep(contextId, `Starting test: ${feature} - ${testId}`, LogLevel.INFO);
    
    try {
      // Execute test function with context
      const result = await testFn(contextId);
      
      // Log success and complete context
      logStep(contextId, `Test completed successfully: ${feature} - ${testId}`, LogLevel.INFO);
      completeContext(contextId, true, { result });
      
      return { result, success: true, contextId };
    } catch (error) {
      // Log error and complete context with failure
      logStep(
        contextId, 
        `Test failed: ${feature} - ${testId}`,
        LogLevel.ERROR,
        FeatureArea.UI,
        { error }
      );
      
      completeContext(contextId, false, { error });
      return { result: null, success: false, contextId };
    }
  };
}

export default {
  createContext,
  completeContext,
  logStep,
  logApiRequest,
  logApiResponse,
  logTestInput,
  logTestOutput,
  getContextsByFeature,
  getLogsByContext,
  createTestExecutor
};