/**
 * Enhanced Logger for GOAL:SYNC Application
 * 
 * Provides advanced logging capabilities with correlation IDs for tracing test execution,
 * request/response logging for APIs, and structured logging for feature tests.
 */

import logger, { LogLevel, FeatureArea } from './logger';

// Store active execution contexts
const activeContexts: Record<string, ExecutionContext> = {};

// Store logs with context associations
const contextLogs: Record<string, any[]> = {};

// Generate a unique ID
function generateId(): string {
  return `ctx_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

export interface ExecutionContext {
  id: string;
  feature?: string;
  testId?: string;
  startTime: number;
  endTime?: number;
  status?: 'running' | 'success' | 'failure';
  data?: Record<string, any>;
}

/**
 * Create a new execution context for tracing a test or operation
 */
export function createContext(feature?: string, testId?: string): ExecutionContext {
  const context: ExecutionContext = {
    id: generateId(),
    feature,
    testId,
    startTime: performance.now(),
    status: 'running',
    data: {}
  };
  
  activeContexts[context.id] = context;
  contextLogs[context.id] = [];
  
  // Log context creation
  logger.debug(FeatureArea.PERFORMANCE, `Created execution context: ${context.id}`, {
    feature,
    testId,
    timestamp: new Date()
  });
  
  return context;
}

/**
 * Complete an execution context
 */
export function completeContext(
  contextId: string,
  success: boolean,
  data?: Record<string, any>
): ExecutionContext | null {
  const context = activeContexts[contextId];
  
  if (!context) {
    logger.warn(FeatureArea.PERFORMANCE, `Attempted to complete unknown context: ${contextId}`);
    return null;
  }
  
  context.endTime = performance.now();
  context.status = success ? 'success' : 'failure';
  
  if (data) {
    context.data = { ...context.data, ...data };
  }
  
  // Log context completion
  logger.info(
    FeatureArea.PERFORMANCE,
    `Completed execution context: ${contextId}`,
    {
      feature: context.feature,
      testId: context.testId,
      duration: `${(context.endTime - context.startTime).toFixed(2)}ms`,
      status: context.status,
      data: context.data
    }
  );
  
  return context;
}

/**
 * Log a step within an execution context
 */
export function logStep(
  contextId: string,
  message: string,
  level: LogLevel = LogLevel.INFO,
  area: FeatureArea = FeatureArea.PERFORMANCE,
  data?: any
): void {
  // Check if context exists
  const context = activeContexts[contextId];
  
  if (!context) {
    // Still log the message, but warn about missing context
    logger.warn(area, `Logging to unknown context: ${contextId}. ${message}`, data);
    return;
  }
  
  // Create log entry
  const entry = {
    contextId,
    message,
    level,
    area,
    timestamp: new Date(),
    data
  };
  
  // Store in context logs
  if (contextLogs[contextId]) {
    contextLogs[contextId].push(entry);
  } else {
    contextLogs[contextId] = [entry];
  }
  
  // Also log through main logger
  logger[LogLevel[level].toLowerCase() as 'debug' | 'info' | 'warn' | 'error'](
    area,
    `[Context: ${contextId}] ${message}`,
    data
  );
}

/**
 * Log API request information
 */
export function logApiRequest(
  contextId: string,
  method: string,
  url: string,
  body?: any,
  headers?: Record<string, string>
): void {
  logStep(
    contextId,
    `API Request: ${method} ${url}`,
    LogLevel.DEBUG,
    FeatureArea.API,
    {
      method,
      url,
      body: body ? JSON.stringify(body).substring(0, 1000) : undefined,
      headers: headers ? JSON.stringify(headers) : undefined
    }
  );
}

/**
 * Log API response information
 */
export function logApiResponse(
  contextId: string,
  status: number,
  url: string,
  data?: any,
  duration?: number
): void {
  const isError = status >= 400;
  
  logStep(
    contextId,
    `API Response: ${status} for ${url}`,
    isError ? LogLevel.ERROR : LogLevel.DEBUG,
    FeatureArea.API,
    {
      status,
      url,
      data: data ? JSON.stringify(data).substring(0, 1000) : undefined,
      duration
    }
  );
}

/**
 * Log test input data
 */
export function logTestInput(
  contextId: string,
  input: any
): void {
  logStep(
    contextId,
    `Test input data`,
    LogLevel.DEBUG,
    FeatureArea.PERFORMANCE,
    {
      input
    }
  );
}

/**
 * Log test output data with expected vs actual results
 */
export function logTestOutput(
  contextId: string,
  expected: any,
  actual: any,
  isEqual: boolean
): void {
  if (isEqual) {
    logStep(
      contextId,
      `Test output matches expected result`,
      LogLevel.INFO,
      FeatureArea.PERFORMANCE,
      {
        expected,
        actual
      }
    );
  } else {
    const differences = findDifferences(expected, actual);
    
    logStep(
      contextId,
      `Test output does not match expected result`,
      LogLevel.WARN,
      FeatureArea.PERFORMANCE,
      {
        expected,
        actual,
        differences
      }
    );
  }
}

/**
 * Find differences between expected and actual objects
 */
function findDifferences(expected: any, actual: any): Record<string, any> {
  const differences: Record<string, any> = {};
  
  // Simple implementation for primitive comparisons
  if (typeof expected !== typeof actual) {
    return { 
      typeExpected: typeof expected,
      typeActual: typeof actual
    };
  }
  
  if (typeof expected !== 'object' || expected === null || actual === null) {
    if (expected !== actual) {
      return {
        expected,
        actual 
      };
    }
    return {};
  }
  
  // Compare objects
  if (Array.isArray(expected)) {
    if (!Array.isArray(actual)) {
      return { 
        typeExpected: 'array',
        typeActual: typeof actual 
      };
    }
    
    if (expected.length !== actual.length) {
      return {
        lengthExpected: expected.length,
        lengthActual: actual.length
      };
    }
    
    // Full deep comparison would be more complex
    // This is a simplified version
    return {};
  }
  
  // Compare object properties
  Object.keys(expected).forEach(key => {
    if (!(key in actual)) {
      differences[key] = { 
        expected: expected[key],
        actual: 'missing'
      };
    } else if (typeof expected[key] === 'object' && expected[key] !== null) {
      const nestedDiffs = findDifferences(expected[key], actual[key]);
      if (Object.keys(nestedDiffs).length > 0) {
        differences[key] = nestedDiffs;
      }
    } else if (expected[key] !== actual[key]) {
      differences[key] = {
        expected: expected[key],
        actual: actual[key]
      };
    }
  });
  
  return differences;
}

/**
 * Get all contexts for a specific feature or test
 */
export function getContextsByFeature(feature: string): ExecutionContext[] {
  return Object.values(activeContexts).filter(ctx => ctx.feature === feature);
}

/**
 * Get all logs for a specific execution context
 */
export function getLogsByContext(contextId: string): any[] {
  return contextLogs[contextId] || [];
}

/**
 * Create and return a test execution wrapper function
 * This provides automatic context creation, logging, and context completion
 */
export function createTestExecutor(feature: string, testId: string) {
  return async function executeTest<T>(
    testFn: () => Promise<T> | T
  ): Promise<T> {
    const context = createContext(feature, testId);
    const contextId = context.id;
    
    try {
      logStep(contextId, `Starting test execution: ${testId}`, LogLevel.INFO, FeatureArea.PERFORMANCE);
      
      const result = await Promise.resolve(testFn());
      
      logStep(contextId, `Completed test execution: ${testId}`, LogLevel.INFO, FeatureArea.PERFORMANCE);
      completeContext(contextId, true, { result });
      
      return result;
    } catch (error) {
      logStep(
        contextId,
        `Test execution failed: ${testId}`,
        LogLevel.ERROR,
        FeatureArea.PERFORMANCE,
        { error: error instanceof Error ? error.message : String(error) }
      );
      
      completeContext(contextId, false, { error: error instanceof Error ? error.message : String(error) });
      throw error;
    }
  };
}

// Create a singleton object to encapsulate the enhanced logger functionality
const enhancedLogger = {
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

export default enhancedLogger;