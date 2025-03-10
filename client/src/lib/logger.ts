/**
 * Logger utility for the Goal Tracker application
 * 
 * This module provides consistent logging and debugging functionality
 * across the application, with support for different log levels,
 * feature tags, and production/development modes.
 */

// Log levels
export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
}

// Feature areas for categorizing logs
export enum FeatureArea {
  GOAL = 'goal',
  PROGRESS = 'progress',
  DASHBOARD = 'dashboard',
  ANALYTICS = 'analytics',
  ACHIEVEMENT = 'achievement',
  SETTINGS = 'settings',
  AUTH = 'auth',
  API = 'api',
  STORAGE = 'storage',
  UI = 'ui',
  NOTIFICATION = 'notification',
  PERFORMANCE = 'performance',
}

// Logger configuration
interface LoggerConfig {
  minLevel: LogLevel;
  enabledAreas: FeatureArea[] | 'all';
  enableConsole: boolean;
  enableFeatureVerification: boolean;
  enablePerformanceMetrics: boolean;
}

// Default configuration
const defaultConfig: LoggerConfig = {
  minLevel: import.meta.env.DEV ? LogLevel.DEBUG : LogLevel.INFO,
  enabledAreas: 'all',
  enableConsole: import.meta.env.DEV,
  enableFeatureVerification: true,
  enablePerformanceMetrics: import.meta.env.DEV,
};

// Current configuration (initialized with default)
let config: LoggerConfig = { ...defaultConfig };

// Feature verification tracking
interface FeatureVerification {
  [feature: string]: {
    implemented: boolean;
    tested: boolean;
    lastVerified: Date | null;
    notes: string[];
  };
}

// Store feature verification status
const featureVerification: FeatureVerification = {};

// Performance metrics tracking
interface PerformanceMetric {
  operation: string;
  area: FeatureArea;
  startTime: number;
  endTime?: number;
  duration?: number;
}

// Store active performance measurements
const activePerformanceMetrics: Map<string, PerformanceMetric> = new Map();

/**
 * Configure the logger
 */
export function configureLogger(newConfig: Partial<LoggerConfig>): void {
  config = { ...config, ...newConfig };
}

/**
 * Reset logger to default configuration
 */
export function resetLogger(): void {
  config = { ...defaultConfig };
}

/**
 * Internal logging function
 */
function logInternal(
  level: LogLevel,
  area: FeatureArea,
  message: string,
  data?: any
): void {
  // Check if this log should be processed based on level and area
  if (
    level < config.minLevel || 
    (config.enabledAreas !== 'all' && !config.enabledAreas.includes(area))
  ) {
    return;
  }

  // Format the log message
  const timestamp = new Date().toISOString();
  const levelString = LogLevel[level];
  const formattedMessage = `[${timestamp}] [${levelString}] [${area}] ${message}`;
  
  // Log to console if enabled
  if (config.enableConsole) {
    const consoleData = data !== undefined ? data : '';
    
    switch (level) {
      case LogLevel.DEBUG:
        console.debug(formattedMessage, consoleData);
        break;
      case LogLevel.INFO:
        console.info(formattedMessage, consoleData);
        break;
      case LogLevel.WARN:
        console.warn(formattedMessage, consoleData);
        break;
      case LogLevel.ERROR:
        console.error(formattedMessage, consoleData);
        break;
    }
  }
}

/**
 * Debug level logging
 */
export function debug(area: FeatureArea, message: string, data?: any): void {
  logInternal(LogLevel.DEBUG, area, message, data);
}

/**
 * Info level logging
 */
export function info(area: FeatureArea, message: string, data?: any): void {
  logInternal(LogLevel.INFO, area, message, data);
}

/**
 * Warning level logging
 */
export function warn(area: FeatureArea, message: string, data?: any): void {
  logInternal(LogLevel.WARN, area, message, data);
}

/**
 * Error level logging
 */
export function error(area: FeatureArea, message: string, data?: any): void {
  logInternal(LogLevel.ERROR, area, message, data);
}

/**
 * Register a feature for verification
 */
export function registerFeature(
  featureName: string,
  implemented: boolean = false,
  tested: boolean = false,
  notes: string = ''
): void {
  if (!config.enableFeatureVerification) return;
  
  if (!featureVerification[featureName]) {
    featureVerification[featureName] = {
      implemented,
      tested,
      lastVerified: null,
      notes: notes ? [notes] : [],
    };
  } else {
    if (implemented) {
      featureVerification[featureName].implemented = true;
    }
    if (tested) {
      featureVerification[featureName].tested = true;
    }
    if (notes) {
      featureVerification[featureName].notes.push(notes);
    }
  }
  
  info(FeatureArea.UI, `Feature registered: ${featureName}`, { implemented, tested });
}

/**
 * Mark a feature as implemented
 */
export function markFeatureImplemented(
  featureName: string,
  notes: string = ''
): void {
  if (!config.enableFeatureVerification) return;
  
  if (!featureVerification[featureName]) {
    registerFeature(featureName, true, false, notes);
    return;
  }
  
  featureVerification[featureName].implemented = true;
  featureVerification[featureName].lastVerified = new Date();
  
  if (notes) {
    featureVerification[featureName].notes.push(notes);
  }
  
  info(FeatureArea.UI, `Feature implemented: ${featureName}`, { timestamp: new Date() });
}

/**
 * Mark a feature as tested
 */
export function markFeatureTested(
  featureName: string,
  passed: boolean = true,
  notes: string = ''
): void {
  if (!config.enableFeatureVerification) return;
  
  if (!featureVerification[featureName]) {
    registerFeature(featureName, false, passed, notes);
    return;
  }
  
  featureVerification[featureName].tested = passed;
  featureVerification[featureName].lastVerified = new Date();
  
  if (notes) {
    featureVerification[featureName].notes.push(`Test ${passed ? 'PASSED' : 'FAILED'}: ${notes}`);
  }
  
  if (passed) {
    info(FeatureArea.UI, `Feature test passed: ${featureName}`, { timestamp: new Date() });
  } else {
    warn(FeatureArea.UI, `Feature test failed: ${featureName}`, { timestamp: new Date(), notes });
  }
}

/**
 * Get feature verification status
 */
export function getFeatureVerificationStatus(): FeatureVerification {
  return { ...featureVerification };
}

/**
 * Start measuring performance for an operation
 */
export function startPerformanceMeasurement(
  operation: string,
  area: FeatureArea
): string {
  if (!config.enablePerformanceMetrics) return '';
  
  const id = `${area}-${operation}-${Date.now()}`;
  const metric: PerformanceMetric = {
    operation,
    area,
    startTime: performance.now(),
  };
  
  activePerformanceMetrics.set(id, metric);
  debug(FeatureArea.PERFORMANCE, `Started measuring: ${operation}`, { id, area });
  
  return id;
}

/**
 * End measuring performance for an operation
 */
export function endPerformanceMeasurement(id: string): PerformanceMetric | null {
  if (!config.enablePerformanceMetrics || !id) return null;
  
  const metric = activePerformanceMetrics.get(id);
  if (!metric) {
    warn(FeatureArea.PERFORMANCE, `No active measurement found for id: ${id}`);
    return null;
  }
  
  metric.endTime = performance.now();
  metric.duration = metric.endTime - metric.startTime;
  
  activePerformanceMetrics.delete(id);
  
  info(
    FeatureArea.PERFORMANCE,
    `Completed measuring: ${metric.operation}`,
    { duration: `${metric.duration.toFixed(2)}ms`, area: metric.area }
  );
  
  return metric;
}

/**
 * Measure the performance of a function
 */
export async function measurePerformance<T>(
  operation: string,
  area: FeatureArea,
  fn: () => T | Promise<T>
): Promise<T> {
  if (!config.enablePerformanceMetrics) {
    return fn();
  }
  
  const id = startPerformanceMeasurement(operation, area);
  
  try {
    const result = await Promise.resolve(fn());
    endPerformanceMeasurement(id);
    return result;
  } catch (err) {
    endPerformanceMeasurement(id);
    throw err;
  }
}

// Initialize common features for tracking
registerFeature('dashboard-stats', true, false);
registerFeature('goal-creation', true, false);
registerFeature('goal-progress-tracking', true, false);
registerFeature('analytics-charts', true, false);
registerFeature('achievements-badges', true, false);
registerFeature('settings-profile', true, false);
registerFeature('settings-appearance', true, false);
registerFeature('settings-notifications', true, false);
registerFeature('settings-security', true, false);

// Export a default logger instance
export default {
  debug,
  info,
  warn,
  error,
  registerFeature,
  markFeatureImplemented,
  markFeatureTested,
  getFeatureVerificationStatus,
  startPerformanceMeasurement,
  endPerformanceMeasurement,
  measurePerformance,
  configureLogger,
  resetLogger,
  FeatureArea,
  LogLevel,
};