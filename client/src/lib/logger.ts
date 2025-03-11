/**
 * Logger utility for the Goal Tracker application
 * 
 * This module provides consistent logging and debugging functionality
 * across the application, with support for different log levels,
 * feature tags, and production/development modes.
 * 
 * Logs are also persisted to localStorage via the debugStorage module
 * for better debugging and QA across sessions.
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

// Minimal implementation of debug storage
const debugStorage = {
  addLogEntry: (level: LogLevel, area: FeatureArea, message: string, data?: any) => {},
  saveDebugStorage: () => {},
  initDebugStorage: () => {
    console.log('Debug storage initialized (stub)');
  }
};

// Logger configuration
interface LoggerConfig {
  minLevel: LogLevel;
  enabledAreas: FeatureArea[] | 'all';
  enableConsole: boolean;
  enableFeatureVerification: boolean;
  enablePerformanceMetrics: boolean;
}

// Check if we're in development mode
// Default to true to enable easier debugging
const isDev = true;

// Default configuration
const defaultConfig: LoggerConfig = {
  minLevel: isDev ? LogLevel.DEBUG : LogLevel.INFO,
  enabledAreas: 'all',
  enableConsole: isDev,
  enableFeatureVerification: true,
  enablePerformanceMetrics: isDev,
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

// Placeholder for initialization
let initialized = false;

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
  
  // Persist log to debug storage (this is a stub implementation)
  debugStorage.addLogEntry(level, area, message, data);
}

// Logger class
class Logger {
  /**
   * Configure the logger
   */
  configureLogger(newConfig: Partial<LoggerConfig>): void {
    config = { ...config, ...newConfig };
  }

  /**
   * Reset logger to default configuration
   */
  resetLogger(): void {
    config = { ...defaultConfig };
  }

  /**
   * Debug level logging
   */
  debug(area: FeatureArea, message: string, data?: any): void {
    logInternal(LogLevel.DEBUG, area, message, data);
  }

  /**
   * Info level logging
   */
  info(area: FeatureArea, message: string, data?: any): void {
    logInternal(LogLevel.INFO, area, message, data);
  }

  /**
   * Warning level logging
   */
  warn(area: FeatureArea, message: string, data?: any): void {
    logInternal(LogLevel.WARN, area, message, data);
  }

  /**
   * Error level logging
   */
  error(area: FeatureArea, message: string, data?: any): void {
    logInternal(LogLevel.ERROR, area, message, data);
  }

  /**
   * Register a feature for verification
   */
  registerFeature(
    featureName: string,
    implementedOrArea: boolean | FeatureArea = false,
    tested: boolean = false,
    notes: string = ''
  ): void {
    // Handle the case where the second parameter is a FeatureArea
    const implemented = typeof implementedOrArea === 'boolean' ? implementedOrArea : false;
    const area = typeof implementedOrArea !== 'boolean' ? implementedOrArea : undefined;
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
    
    this.info(FeatureArea.UI, `Feature registered: ${featureName}`, { implemented, tested });
  }

  /**
   * Mark a feature as implemented
   */
  markFeatureImplemented(
    featureName: string,
    notes: string = ''
  ): void {
    if (!config.enableFeatureVerification) return;
    
    if (!featureVerification[featureName]) {
      this.registerFeature(featureName, true, false, notes);
      return;
    }
    
    featureVerification[featureName].implemented = true;
    featureVerification[featureName].lastVerified = new Date();
    
    if (notes) {
      featureVerification[featureName].notes.push(notes);
    }
    
    this.info(FeatureArea.UI, `Feature implemented: ${featureName}`, { timestamp: new Date() });
  }

  /**
   * Mark a feature as tested
   */
  markFeatureTested(
    featureName: string,
    passed: boolean = true,
    notes: string = ''
  ): void {
    if (!config.enableFeatureVerification) return;
    
    if (!featureVerification[featureName]) {
      this.registerFeature(featureName, false, passed, notes);
      return;
    }
    
    featureVerification[featureName].tested = passed;
    featureVerification[featureName].lastVerified = new Date();
    
    if (notes) {
      featureVerification[featureName].notes.push(`Test ${passed ? 'PASSED' : 'FAILED'}: ${notes}`);
    }
    
    if (passed) {
      this.info(FeatureArea.UI, `Feature test passed: ${featureName}`, { timestamp: new Date() });
    } else {
      this.warn(FeatureArea.UI, `Feature test failed: ${featureName}`, { timestamp: new Date(), notes });
    }
  }

  /**
   * Get feature verification status
   */
  getFeatureVerificationStatus(): FeatureVerification {
    return { ...featureVerification };
  }

  /**
   * Start measuring performance for an operation
   */
  startPerformanceMeasurement(
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
    this.debug(FeatureArea.PERFORMANCE, `Started measuring: ${operation}`, { id, area });
    
    return id;
  }

  /**
   * End measuring performance for an operation
   */
  endPerformanceMeasurement(id: string): PerformanceMetric | null {
    if (!config.enablePerformanceMetrics || !id) return null;
    
    const metric = activePerformanceMetrics.get(id);
    if (!metric) {
      this.warn(FeatureArea.PERFORMANCE, `No active measurement found for id: ${id}`);
      return null;
    }
    
    metric.endTime = performance.now();
    metric.duration = metric.endTime - metric.startTime;
    
    activePerformanceMetrics.delete(id);
    
    this.info(
      FeatureArea.PERFORMANCE,
      `Completed measuring: ${metric.operation}`,
      { duration: `${metric.duration.toFixed(2)}ms`, area: metric.area }
    );
    
    return metric;
  }

  /**
   * Measure the performance of a function
   */
  async measurePerformance<T>(
    operation: string,
    area: FeatureArea,
    fn: () => T | Promise<T>
  ): Promise<T> {
    if (!config.enablePerformanceMetrics) {
      return fn();
    }
    
    const id = this.startPerformanceMeasurement(operation, area);
    
    try {
      const result = await Promise.resolve(fn());
      this.endPerformanceMeasurement(id);
      return result;
    } catch (err) {
      this.endPerformanceMeasurement(id);
      throw err;
    }
  }
}

// Create a singleton instance
const logger = new Logger();

// Initialize common features for tracking
logger.registerFeature('dashboard-stats', true, false);
logger.registerFeature('goal-creation', true, false);
logger.registerFeature('goal-progress-tracking', true, false);
logger.registerFeature('analytics-charts', true, false);
logger.registerFeature('achievements-badges', true, false);
logger.registerFeature('settings-profile', true, false);
logger.registerFeature('settings-appearance', true, false);
logger.registerFeature('settings-notifications', true, false);
logger.registerFeature('settings-security', true, false);

// Initialize logger
if (!initialized) {
  debugStorage.initDebugStorage();
  initialized = true;
  logInternal(LogLevel.INFO, FeatureArea.UI, 'Logger initialized');
}

export default logger;