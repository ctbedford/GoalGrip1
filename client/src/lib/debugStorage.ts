/**
 * Debug Storage - Persistence layer for debug information
 * 
 * This module provides functionality to save and retrieve debug information,
 * including logs, test results, and API test results for better debugging and QA.
 */

import { LogLevel, FeatureArea } from './logger';
import { TestStatus } from './featureTester';

// Type from apiTester to avoid circular import
interface ApiTestResult {
  endpoint: string;
  method: string;
  status: number;
  success: boolean;
  data: any;
  error?: any;
  duration: number;
  timestamp: Date;
}

// Type from featureTester to avoid circular import
interface FeatureTestResult {
  id: string;
  name: string;
  description: string;
  status: TestStatus;
  error?: string;
  duration?: number;
  details?: any;
  timestamp?: Date;
  contextId?: string;
}

// Storage data structure
interface DebugStorage {
  logs: DebugLogEntry[];
  featureTestResults: Record<string, FeatureTestResult>;
  apiTestResults: ApiTestResult[];
}

// Debug log entry structure
interface DebugLogEntry {
  level: LogLevel;
  area: FeatureArea;
  message: string;
  timestamp: Date;
  data?: any;
}

// Initialize empty storage
let storage: DebugStorage = {
  logs: [],
  featureTestResults: {},
  apiTestResults: []
};

// Maximum number of log entries to keep
const MAX_LOG_ENTRIES = 1000;

/**
 * Initialize debug storage from localStorage if available
 */
export function initDebugStorage(): void {
  try {
    if (typeof localStorage !== 'undefined') {
      const storedData = localStorage.getItem('debug_storage');
      if (storedData) {
        const parsed = JSON.parse(storedData);
        
        // Convert string timestamps back to Date objects
        if (parsed.logs) {
          parsed.logs.forEach((log: any) => {
            log.timestamp = new Date(log.timestamp);
          });
        }
        
        if (parsed.apiTestResults) {
          parsed.apiTestResults.forEach((result: any) => {
            result.timestamp = new Date(result.timestamp);
          });
        }
        
        storage = parsed;
      }
    }
  } catch (error) {
    console.warn('Failed to initialize debug storage:', error);
  }
}

/**
 * Save debug storage to localStorage if available
 */
export function saveDebugStorage(): void {
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('debug_storage', JSON.stringify(storage));
    }
  } catch (error) {
    console.warn('Failed to save debug storage:', error);
  }
}

/**
 * Add a log entry to debug storage
 */
export function addLogEntry(level: LogLevel, area: FeatureArea, message: string, data?: any): void {
  const entry: DebugLogEntry = {
    level,
    area,
    message,
    timestamp: new Date(),
    data
  };
  
  storage.logs.unshift(entry);
  
  // Trim logs if they exceed the maximum size
  if (storage.logs.length > MAX_LOG_ENTRIES) {
    storage.logs = storage.logs.slice(0, MAX_LOG_ENTRIES);
  }
}

/**
 * Get all log entries
 */
export function getLogEntries(filters?: {
  level?: LogLevel, 
  area?: FeatureArea,
  fromDate?: Date,
  toDate?: Date
}): DebugLogEntry[] {
  if (!filters) {
    return storage.logs;
  }
  
  return storage.logs.filter(log => {
    if (filters.level !== undefined && log.level < filters.level) {
      return false;
    }
    
    if (filters.area !== undefined && log.area !== filters.area) {
      return false;
    }
    
    if (filters.fromDate && log.timestamp < filters.fromDate) {
      return false;
    }
    
    if (filters.toDate && log.timestamp > filters.toDate) {
      return false;
    }
    
    return true;
  });
}

/**
 * Clear all log entries
 */
export function clearLogs(): void {
  storage.logs = [];
  saveDebugStorage();
}

/**
 * Update feature test results
 */
export function updateFeatureTestResult(testId: string, result: FeatureTestResult | Record<string, FeatureTestResult>): void {
  if ('id' in result) {
    // Single test result
    storage.featureTestResults[testId] = result;
  } else {
    // Multiple test results
    storage.featureTestResults = {
      ...storage.featureTestResults,
      ...result
    };
  }
  
  saveDebugStorage();
}

/**
 * Get all feature test results
 */
export function getFeatureTestResults(): Record<string, FeatureTestResult> {
  return storage.featureTestResults;
}

/**
 * Clear feature test results
 */
export function clearFeatureTestResults(): void {
  storage.featureTestResults = {};
  saveDebugStorage();
}

/**
 * Add API test result
 */
export function addApiTestResult(result: ApiTestResult): void {
  storage.apiTestResults.unshift(result);
  
  // Limit the number of stored results
  if (storage.apiTestResults.length > 100) {
    storage.apiTestResults = storage.apiTestResults.slice(0, 100);
  }
  
  saveDebugStorage();
}

/**
 * Get API test results
 */
export function getApiTestResults(): ApiTestResult[] {
  return storage.apiTestResults;
}

/**
 * Clear API test results
 */
export function clearApiTestResults(): void {
  storage.apiTestResults = [];
  saveDebugStorage();
}

/**
 * Export all debug data as JSON
 */
export function exportDebugData(): string {
  return JSON.stringify(storage, null, 2);
}

/**
 * Import debug data from JSON
 */
export function importDebugData(jsonString: string): boolean {
  try {
    const parsed = JSON.parse(jsonString);
    
    // Validate the structure minimally
    if (!parsed.logs || !Array.isArray(parsed.logs)) {
      return false;
    }
    
    // Convert string timestamps back to Date objects
    parsed.logs.forEach((log: any) => {
      log.timestamp = new Date(log.timestamp);
    });
    
    if (parsed.apiTestResults) {
      parsed.apiTestResults.forEach((result: any) => {
        result.timestamp = new Date(result.timestamp);
      });
    }
    
    storage = parsed;
    saveDebugStorage();
    return true;
  } catch (error) {
    console.error('Failed to import debug data:', error);
    return false;
  }
}