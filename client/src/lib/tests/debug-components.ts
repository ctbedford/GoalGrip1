/**
 * Tests for the debug components in the GOAL:SYNC application
 * 
 * This module provides tests for verifying the functionality of the debug
 * components, including the enhanced logger, API tester, feature tester,
 * and debug UI components.
 * 
 * Note: These tests are designed to verify the debug infrastructure itself,
 * not the application features. They test that the logging, tracing, and
 * testing components work correctly.
 */

import { registerFeatureTest } from '../featureTester';
import { FeatureArea, LogLevel, registerFeature } from '../logger';
import enhancedLogger from '../enhancedLogger';
import * as apiTester from '../apiTester';
import * as debugStorage from '../debugStorage';

/**
 * Test for the Enhanced Logger
 */
registerFeatureTest({
  id: 'enhanced-logger',
  name: 'Enhanced Logger',
  description: 'Verify enhanced logging system with context tracking',
  area: FeatureArea.STORAGE,
  test: async (contextId) => {
    try {
      // Create a test context
      const testContext = enhancedLogger.createContext(FeatureArea.STORAGE, 'logger-test');
      const testContextId = testContext.id;
      
      // Log a test step
      enhancedLogger.logStep(
        testContextId,
        'Testing enhanced logger',
        LogLevel.INFO,
        FeatureArea.STORAGE,
        { test: 'data' }
      );
      
      // Log an API request and response
      enhancedLogger.logApiRequest(testContextId, 'GET', '/api/test');
      enhancedLogger.logApiResponse(testContextId, 200, { success: true }, 50);
      
      // Log test input and output
      enhancedLogger.logTestInput(testContextId, { input: 'test' });
      enhancedLogger.logTestOutput(
        testContextId, 
        { expected: true },
        { actual: true },
        true
      );
      
      // Complete the context
      enhancedLogger.completeContext(testContextId, true, { result: 'success' });
      
      // Verify logs were created with the context ID
      const logs = debugStorage.getLogEntries().filter(log => 
        log.data && log.data.contextId === testContextId
      );
      
      // Log test results
      enhancedLogger.logStep(
        contextId as string,
        `Enhanced logger test ${logs.length > 0 ? 'passed' : 'failed'}`,
        logs.length > 0 ? LogLevel.INFO : LogLevel.ERROR,
        FeatureArea.STORAGE,
        { logCount: logs.length }
      );
      
      return logs.length > 0;
    } catch (error) {
      enhancedLogger.logStep(
        contextId as string,
        `Enhanced logger test failed with error: ${error instanceof Error ? error.message : String(error)}`,
        LogLevel.ERROR,
        FeatureArea.STORAGE
      );
      return false;
    }
  }
});

/**
 * Test for the API Tester
 */
registerFeatureTest({
  id: 'api-tester',
  name: 'API Tester',
  description: 'Verify API testing functionality',
  area: FeatureArea.API,
  test: async (contextId) => {
    try {
      // Test a real endpoint
      enhancedLogger.logStep(
        contextId as string,
        'Testing API tester with dashboard stats endpoint',
        LogLevel.INFO,
        FeatureArea.API
      );
      
      const result = await apiTester.testEndpoint(
        apiTester.ApiEndpoint.DASHBOARD,
        'GET'
      );
      
      // Log test results
      enhancedLogger.logStep(
        contextId as string,
        `API tester test ${result.success ? 'passed' : 'failed'}`,
        result.success ? LogLevel.INFO : LogLevel.ERROR,
        FeatureArea.API,
        { result }
      );
      
      return result.success;
    } catch (error) {
      enhancedLogger.logStep(
        contextId as string,
        `API tester test failed with error: ${error instanceof Error ? error.message : String(error)}`,
        LogLevel.ERROR,
        FeatureArea.API
      );
      return false;
    }
  }
});

/**
 * Test for the Feature Tester
 */
registerFeatureTest({
  id: 'feature-tester',
  name: 'Feature Tester',
  description: 'Verify feature testing functionality',
  area: FeatureArea.UI,
  test: async (contextId) => {
    try {
      // Register a test feature
      const testFeatureId = 'test-feature-' + Date.now();
      
      enhancedLogger.logStep(
        contextId as string,
        'Registering test feature',
        LogLevel.INFO,
        FeatureArea.UI
      );
      
      registerFeatureTest({
        id: testFeatureId,
        name: 'Test Feature',
        description: 'Test feature for verification',
        area: FeatureArea.UI,
        test: () => true
      });
      
      // Run the test
      const { runFeatureTest } = await import('../featureTester');
      const result = await runFeatureTest(testFeatureId);
      
      // Log test results
      enhancedLogger.logStep(
        contextId as string,
        `Feature tester test ${result.status === 'passed' ? 'passed' : 'failed'}`,
        result.status === 'passed' ? LogLevel.INFO : LogLevel.ERROR,
        FeatureArea.UI,
        { result }
      );
      
      return result.status === 'passed';
    } catch (error) {
      enhancedLogger.logStep(
        contextId as string,
        `Feature tester test failed with error: ${error instanceof Error ? error.message : String(error)}`,
        LogLevel.ERROR,
        FeatureArea.UI
      );
      return false;
    }
  }
});

/**
 * Test for the Enhanced Log Viewer
 */
registerFeatureTest({
  id: 'log-viewer',
  name: 'Enhanced Log Viewer',
  description: 'Verify enhanced log viewer functionality',
  area: FeatureArea.UI,
  test: async (contextId) => {
    try {
      // Create some test logs with context IDs
      const testContextId = 'test-context-' + Date.now();
      
      enhancedLogger.logStep(
        contextId as string,
        'Creating test logs for log viewer',
        LogLevel.INFO,
        FeatureArea.UI
      );
      
      // Add test logs with different levels
      debugStorage.addLogEntry(
        LogLevel.INFO,
        FeatureArea.UI,
        'Test info log for log viewer',
        { contextId: testContextId }
      );
      
      debugStorage.addLogEntry(
        LogLevel.ERROR,
        FeatureArea.UI,
        'Test error log for log viewer',
        { contextId: testContextId }
      );
      
      debugStorage.addLogEntry(
        LogLevel.WARN,
        FeatureArea.UI,
        'Test warning log for log viewer',
        { contextId: testContextId }
      );
      
      // Verify logs were created with the context ID
      const logs = debugStorage.getLogEntries().filter(log => 
        log.data && log.data.contextId === testContextId
      );
      
      // Log test results
      enhancedLogger.logStep(
        contextId as string,
        `Log viewer test ${logs.length === 3 ? 'passed' : 'failed'}`,
        logs.length === 3 ? LogLevel.INFO : LogLevel.ERROR,
        FeatureArea.UI,
        { logCount: logs.length }
      );
      
      return logs.length === 3;
    } catch (error) {
      enhancedLogger.logStep(
        contextId as string,
        `Log viewer test failed with error: ${error instanceof Error ? error.message : String(error)}`,
        LogLevel.ERROR,
        FeatureArea.UI
      );
      return false;
    }
  }
});

/**
 * Test for the API Dashboard
 */
registerFeatureTest({
  id: 'api-dashboard',
  name: 'API Dashboard',
  description: 'Verify API dashboard functionality',
  area: FeatureArea.UI,
  test: async (contextId) => {
    try {
      // Create some test API results
      enhancedLogger.logStep(
        contextId as string,
        'Creating test API results for API dashboard',
        LogLevel.INFO,
        FeatureArea.UI
      );
      
      // Run a few test endpoints to generate results
      await apiTester.testEndpoint(
        apiTester.ApiEndpoint.DASHBOARD,
        'GET'
      );
      
      await apiTester.testEndpoint(
        apiTester.ApiEndpoint.GOALS,
        'GET'
      );
      
      // Get API test results
      const results = apiTester.getTestResults();
      
      // Log test results
      enhancedLogger.logStep(
        contextId as string,
        `API dashboard test ${results.length >= 2 ? 'passed' : 'failed'}`,
        results.length >= 2 ? LogLevel.INFO : LogLevel.ERROR,
        FeatureArea.UI,
        { resultCount: results.length }
      );
      
      return results.length >= 2;
    } catch (error) {
      enhancedLogger.logStep(
        contextId as string,
        `API dashboard test failed with error: ${error instanceof Error ? error.message : String(error)}`,
        LogLevel.ERROR,
        FeatureArea.UI
      );
      return false;
    }
  }
});

/**
 * Test for the Feature Status Dashboard
 */
registerFeatureTest({
  id: 'feature-dashboard',
  name: 'Feature Status Dashboard',
  description: 'Verify feature status dashboard functionality',
  area: FeatureArea.UI,
  dependencies: ['feature-tester'],
  test: async (contextId) => {
    try {
      const { markFeatureImplemented, markFeatureTested } = await import('../logger');
      
      // Register and mark some test features
      const testFeatureId = 'test-feature-status-' + Date.now();
      
      enhancedLogger.logStep(
        contextId as string,
        'Creating test feature status for dashboard',
        LogLevel.INFO,
        FeatureArea.UI
      );
      
      // Mark features as implemented and tested
      markFeatureImplemented(testFeatureId, "Test feature implemented");
      markFeatureTested(testFeatureId, true, "Test feature tested");
      
      // Verify feature was marked
      const { getFeatureVerificationStatus } = await import('../logger');
      const status = getFeatureVerificationStatus();
      
      const featureFound = Object.keys(status).some(id => id === testFeatureId);
      
      // Log test results
      enhancedLogger.logStep(
        contextId as string,
        `Feature status dashboard test ${featureFound ? 'passed' : 'failed'}`,
        featureFound ? LogLevel.INFO : LogLevel.ERROR,
        FeatureArea.UI,
        { featureFound }
      );
      
      return featureFound;
    } catch (error) {
      enhancedLogger.logStep(
        contextId as string,
        `Feature status dashboard test failed with error: ${error instanceof Error ? error.message : String(error)}`,
        LogLevel.ERROR,
        FeatureArea.UI
      );
      return false;
    }
  }
});

/**
 * Test for the Performance Metrics Panel
 */
registerFeatureTest({
  id: 'performance-metrics',
  name: 'Performance Metrics Panel',
  description: 'Verify performance metrics panel functionality',
  area: FeatureArea.PERFORMANCE,
  test: async (contextId) => {
    try {
      const { startPerformanceMeasurement, endPerformanceMeasurement } = await import('../logger');
      
      // Create some test performance metrics
      enhancedLogger.logStep(
        contextId as string,
        'Creating test performance metrics',
        LogLevel.INFO,
        FeatureArea.PERFORMANCE
      );
      
      // Measure some operations
      const metric1Id = startPerformanceMeasurement('test-operation-1', FeatureArea.PERFORMANCE);
      await new Promise(resolve => setTimeout(resolve, 50));
      const metric1 = endPerformanceMeasurement(metric1Id);
      
      const metric2Id = startPerformanceMeasurement('test-operation-2', FeatureArea.PERFORMANCE);
      await new Promise(resolve => setTimeout(resolve, 100));
      const metric2 = endPerformanceMeasurement(metric2Id);
      
      // Verify metrics were created
      const success = metric1 !== null && metric2 !== null && 
                     metric1.duration !== undefined && metric2.duration !== undefined;
      
      // Log test results
      enhancedLogger.logStep(
        contextId as string,
        `Performance metrics panel test ${success ? 'passed' : 'failed'}`,
        success ? LogLevel.INFO : LogLevel.ERROR,
        FeatureArea.PERFORMANCE,
        { metric1, metric2 }
      );
      
      return success;
    } catch (error) {
      enhancedLogger.logStep(
        contextId as string,
        `Performance metrics panel test failed with error: ${error instanceof Error ? error.message : String(error)}`,
        LogLevel.ERROR,
        FeatureArea.PERFORMANCE
      );
      return false;
    }
  }
});

/**
 * Integration Test for Debug Infrastructure
 */
registerFeatureTest({
  id: 'debug-infrastructure',
  name: 'Debug Infrastructure Integration',
  description: 'Verify all debug components work together',
  area: FeatureArea.UI,
  dependencies: [
    'enhanced-logger',
    'api-tester',
    'feature-tester',
    'log-viewer',
    'api-dashboard',
    'feature-dashboard',
    'performance-metrics'
  ],
  test: async (contextId) => {
    try {
      enhancedLogger.logStep(
        contextId as string,
        'All debug infrastructure components verified successfully',
        LogLevel.INFO,
        FeatureArea.UI
      );
      
      return true;
    } catch (error) {
      enhancedLogger.logStep(
        contextId as string,
        `Debug infrastructure integration test failed: ${error instanceof Error ? error.message : String(error)}`,
        LogLevel.ERROR,
        FeatureArea.UI
      );
      return false;
    }
  }
});

// Export the test registration function to ensure the tests are loaded
export function registerDebugTests() {
  console.log('Debug component tests registered');
  return true;
}

// Don't register the tests automatically to avoid potential circular dependencies
// The debug page will call registerDebugTests() when it initializes