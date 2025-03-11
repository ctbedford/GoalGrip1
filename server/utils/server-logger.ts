/**
 * Server-side Logger for Debug Infrastructure
 * 
 * Provides logging functionality for server-side debug operations with support
 * for different log levels, feature tags, and production/development modes.
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

interface LogEntry {
  level: LogLevel;
  area: FeatureArea;
  message: string;
  timestamp: Date;
  data?: any;
}

// Store logs in memory (can be extended to use database or file storage)
const logs: LogEntry[] = [];

// Maximum number of logs to keep in memory
const MAX_LOGS = 1000;

/**
 * Add a log entry
 */
function addLog(level: LogLevel, area: FeatureArea, message: string, data?: any): void {
  // Create the log entry
  const entry: LogEntry = {
    level,
    area,
    message,
    timestamp: new Date(),
    data
  };
  
  // Add to memory store
  logs.unshift(entry);
  
  // Trim logs if needed
  if (logs.length > MAX_LOGS) {
    logs.length = MAX_LOGS;
  }
  
  // Also log to console in development mode
  if (process.env.NODE_ENV !== 'production') {
    const areaPrefix = `[${area.toUpperCase()}]`;
    const levelPrefix = getLevelPrefix(level);
    console.log(`${levelPrefix} ${areaPrefix} ${message}`, data || '');
  }
}

/**
 * Get level prefix for console logging
 */
function getLevelPrefix(level: LogLevel): string {
  switch (level) {
    case LogLevel.DEBUG:
      return '[DEBUG]';
    case LogLevel.INFO:
      return '[INFO]';
    case LogLevel.WARN:
      return '[WARN]';
    case LogLevel.ERROR:
      return '[ERROR]';
    default:
      return '[LOG]';
  }
}

/**
 * Debug level logging
 */
function debug(area: FeatureArea, message: string, data?: any): void {
  addLog(LogLevel.DEBUG, area, message, data);
}

/**
 * Info level logging
 */
function info(area: FeatureArea, message: string, data?: any): void {
  addLog(LogLevel.INFO, area, message, data);
}

/**
 * Warning level logging
 */
function warn(area: FeatureArea, message: string, data?: any): void {
  addLog(LogLevel.WARN, area, message, data);
}

/**
 * Error level logging
 */
function error(area: FeatureArea, message: string, data?: any): void {
  addLog(LogLevel.ERROR, area, message, data);
}

/**
 * Get logs with optional filters
 */
function getLogs(filters?: {
  level?: LogLevel;
  area?: FeatureArea;
  fromDate?: Date;
  toDate?: Date;
  limit?: number;
}): LogEntry[] {
  let filteredLogs = [...logs];
  
  if (filters) {
    // Filter by level
    if (filters.level !== undefined) {
      filteredLogs = filteredLogs.filter(log => log.level >= filters.level!);
    }
    
    // Filter by area
    if (filters.area !== undefined) {
      filteredLogs = filteredLogs.filter(log => log.area === filters.area);
    }
    
    // Filter by date range
    if (filters.fromDate) {
      filteredLogs = filteredLogs.filter(log => log.timestamp >= filters.fromDate!);
    }
    
    if (filters.toDate) {
      filteredLogs = filteredLogs.filter(log => log.timestamp <= filters.toDate!);
    }
    
    // Apply limit
    if (filters.limit) {
      filteredLogs = filteredLogs.slice(0, filters.limit);
    }
  }
  
  return filteredLogs;
}

/**
 * Clear all logs
 */
function clearLogs(): void {
  logs.length = 0;
}

// Export the logger functions
export const serverLogger = {
  debug,
  info,
  warn,
  error,
  getLogs,
  clearLogs
};