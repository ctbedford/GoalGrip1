/**
 * Debug Storage - Persistence layer for debug information
 * 
 * This module provides functionality to save and retrieve debug information,
 * including logs, test results, and API test results for better debugging and QA.
 */

import { FeatureTestResult, TestStatus } from './featureTester';
import { ApiTestResult } from './apiTester';
import { FeatureArea, LogLevel } from './logger';

interface DebugLogEntry {
  level: LogLevel;
  area: FeatureArea;
  message: string;
  timestamp: Date;
  data?: any;
}

// In-memory storage (will be persisted to localStorage when in browser)
let debugLogs: DebugLogEntry[] = [];
let featureTestResults: Record<string, FeatureTestResult> = {};
let apiTestResults: ApiTestResult[] = [];

// Maximum logs to keep in memory
const MAX_LOGS = 1000;

/**
 * Initialize debug storage from localStorage if available
 */
export function initDebugStorage(): void {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      const savedLogs = localStorage.getItem('debug_logs');
      const savedFeatureTests = localStorage.getItem('feature_test_results');
      const savedApiTests = localStorage.getItem('api_test_results');
      
      if (savedLogs) {
        debugLogs = JSON.parse(savedLogs);
      }
      
      if (savedFeatureTests) {
        featureTestResults = JSON.parse(savedFeatureTests);
      }
      
      if (savedApiTests) {
        apiTestResults = JSON.parse(savedApiTests);
      }
      
      console.log(`[Debug Storage] Loaded ${debugLogs.length} logs, ${Object.keys(featureTestResults).length} feature tests, ${apiTestResults.length} API tests`);
    }
  } catch (error) {
    console.error('[Debug Storage] Error initializing from localStorage', error);
  }
}

/**
 * Save debug storage to localStorage if available
 */
export function saveDebugStorage(): void {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      localStorage.setItem('debug_logs', JSON.stringify(debugLogs));
      localStorage.setItem('feature_test_results', JSON.stringify(featureTestResults));
      localStorage.setItem('api_test_results', JSON.stringify(apiTestResults));
    }
  } catch (error) {
    console.error('[Debug Storage] Error saving to localStorage', error);
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
  
  debugLogs.unshift(entry); // Add to beginning for most recent first
  
  // Limit size
  if (debugLogs.length > MAX_LOGS) {
    debugLogs = debugLogs.slice(0, MAX_LOGS);
  }
  
  saveDebugStorage();
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
  let filteredLogs = [...debugLogs];
  
  if (filters) {
    if (typeof filters.level === 'number') {
      filteredLogs = filteredLogs.filter(log => log.level >= filters.level!);
    }
    
    if (filters.area) {
      filteredLogs = filteredLogs.filter(log => log.area === filters.area);
    }
    
    if (filters.fromDate) {
      filteredLogs = filteredLogs.filter(log => log.timestamp >= filters.fromDate!);
    }
    
    if (filters.toDate) {
      filteredLogs = filteredLogs.filter(log => log.timestamp <= filters.toDate!);
    }
  }
  
  return filteredLogs;
}

/**
 * Clear all log entries
 */
export function clearLogs(): void {
  debugLogs = [];
  saveDebugStorage();
}

/**
 * Update feature test results
 */
export function updateFeatureTestResult(testId: string, result: FeatureTestResult): void {
  featureTestResults[testId] = result;
  saveDebugStorage();
}

/**
 * Get all feature test results
 */
export function getFeatureTestResults(): Record<string, FeatureTestResult> {
  return { ...featureTestResults };
}

/**
 * Clear feature test results
 */
export function clearFeatureTestResults(): void {
  featureTestResults = {};
  saveDebugStorage();
}

/**
 * Add API test result
 */
export function addApiTestResult(result: ApiTestResult): void {
  apiTestResults.unshift(result);
  
  // Limit size
  if (apiTestResults.length > MAX_LOGS) {
    apiTestResults = apiTestResults.slice(0, MAX_LOGS);
  }
  
  saveDebugStorage();
}

/**
 * Get API test results
 */
export function getApiTestResults(): ApiTestResult[] {
  return [...apiTestResults];
}

/**
 * Clear API test results
 */
export function clearApiTestResults(): void {
  apiTestResults = [];
  saveDebugStorage();
}

/**
 * Export all debug data as JSON
 */
export function exportDebugData(): string {
  const data = {
    logs: debugLogs,
    featureTests: featureTestResults,
    apiTests: apiTestResults,
    exportTime: new Date()
  };
  
  return JSON.stringify(data, null, 2);
}

/**
 * Import debug data from JSON
 */
export function importDebugData(jsonString: string): boolean {
  try {
    const data = JSON.parse(jsonString);
    
    if (data.logs) debugLogs = data.logs;
    if (data.featureTests) featureTestResults = data.featureTests;
    if (data.apiTests) apiTestResults = data.apiTests;
    
    saveDebugStorage();
    return true;
  } catch (error) {
    console.error('[Debug Storage] Error importing data', error);
    return false;
  }
}

// Initialize on module load
if (typeof window !== 'undefined') {
  initDebugStorage();
}

export default {
  addLogEntry,
  getLogEntries,
  clearLogs,
  updateFeatureTestResult,
  getFeatureTestResults,
  clearFeatureTestResults,
  addApiTestResult,
  getApiTestResults,
  clearApiTestResults,
  exportDebugData,
  importDebugData
};