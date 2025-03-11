/**
 * AI Agent Integration Module
 * 
 * This module provides functionality for the Replit AI Agent to interact with
 * the application's debug infrastructure. It processes special commands from the
 * AI agent, calls the appropriate debug APIs, and formats the responses for display.
 * 
 * Usage:
 * The AI Agent can use these commands to monitor, test, and analyze the application:
 * 
 * !debug feature <feature_name> - Get info about a specific feature
 * !debug test <feature_name> [--all] - Run tests for a feature or all features
 * !debug perf <endpoint_or_feature> [--period=<time_period>] - Analyze performance
 * !debug report [--detailed] [--format=<format>] - Generate a status report
 * !debug error <error_id_or_message> - Analyze a specific error
 */

import logger, { FeatureArea, LogLevel } from './logger';
import * as enhancedLogger from './enhancedLogger';

// Base URL for AI debug API
const AI_DEBUG_API_BASE = '/api/debug/ai';

/**
 * Process a debug command from the AI agent and return a formatted response
 */
export async function processAiAgentCommand(command: string): Promise<string> {
  // Create a context for tracking this command execution
  const contextId = enhancedLogger.createContext('ai-agent', 'command-execution').id;
  
  try {
    enhancedLogger.logStep(
      contextId,
      `Processing AI agent command: ${command}`,
      LogLevel.INFO,
      FeatureArea.UI
    );
    
    // Parse the command
    if (!command.trim().startsWith('!debug')) {
      return 'Commands must start with !debug. Try !debug help for a list of available commands.';
    }
    
    const parts = command.trim().split(' ');
    const action = parts[1]?.toLowerCase();
    const params = parts.slice(2);
    
    let result = '';
    
    // Process different types of commands
    switch (action) {
      case 'feature':
        result = await handleFeatureCommand(contextId, params);
        break;
      case 'test':
        result = await handleTestCommand(contextId, params);
        break;
      case 'perf':
        result = await handlePerfCommand(contextId, params);
        break;
      case 'report':
        result = await handleReportCommand(contextId, params);
        break;
      case 'error':
        result = await handleErrorCommand(contextId, params);
        break;
      case 'help':
      case undefined:
        result = generateHelpText();
        break;
      default:
        result = `Unknown debug command: ${action}\n\nUse one of the following commands:\n` + generateHelpText();
    }
    
    enhancedLogger.completeContext(contextId, true, { responseLength: result.length });
    return result;
  } catch (error) {
    enhancedLogger.completeContext(contextId, false, { 
      error: error instanceof Error ? error.message : String(error) 
    });
    
    logger.error(FeatureArea.UI, `Error processing AI agent command: ${error instanceof Error ? error.message : String(error)}`);
    return `Error processing command: ${error instanceof Error ? error.message : String(error)}`;
  }
}

/**
 * Handle the 'feature' command to get information about a specific feature
 */
async function handleFeatureCommand(contextId: string, params: string[]): Promise<string> {
  if (params.length === 0) {
    return 'Please specify a feature name. Example: !debug feature goal-tracking';
  }
  
  const featureName = params[0].toLowerCase();
  const detailed = params.includes('--detailed');
  
  enhancedLogger.logStep(
    contextId,
    `Getting feature info for: ${featureName}`,
    LogLevel.INFO,
    FeatureArea.UI
  );
  
  try {
    // Call API endpoint
    const queryParams = new URLSearchParams({
      name: featureName,
      detailed: detailed ? 'true' : 'false'
    });
    
    const url = `${AI_DEBUG_API_BASE}/feature-status?${queryParams.toString()}`;
    enhancedLogger.logApiRequest(contextId, 'GET', url);
    
    const startTime = performance.now();
    const response = await fetch(url);
    const duration = performance.now() - startTime;
    
    if (!response.ok) {
      const errorText = await response.text();
      enhancedLogger.logApiResponse(contextId, response.status, url, errorText, duration);
      return `Error getting feature information: ${response.status} ${response.statusText}\n${errorText}`;
    }
    
    const data = await response.json();
    enhancedLogger.logApiResponse(contextId, response.status, url, data, duration);
    
    // Format the response as a nice markdown message
    return formatFeatureResponse(data);
  } catch (error) {
    logger.error(FeatureArea.API, `Error in feature command: ${error instanceof Error ? error.message : String(error)}`);
    return `Failed to get feature information: ${error instanceof Error ? error.message : String(error)}`;
  }
}

/**
 * Handle the 'test' command to run tests for a feature or all features
 */
async function handleTestCommand(contextId: string, params: string[]): Promise<string> {
  const all = params.includes('--all');
  const featureOrTestId = all ? undefined : params[0];
  
  if (!all && !featureOrTestId) {
    return 'Please specify a feature name or use --all. Example: !debug test goal-tracking';
  }
  
  enhancedLogger.logStep(
    contextId,
    `Running tests${featureOrTestId ? ` for: ${featureOrTestId}` : ' for all features'}`,
    LogLevel.INFO,
    FeatureArea.UI
  );
  
  try {
    // Call API endpoint
    const url = `${AI_DEBUG_API_BASE}/run-tests`;
    const body = {
      all,
      target: featureOrTestId
    };
    
    enhancedLogger.logApiRequest(contextId, 'POST', url, body);
    
    const startTime = performance.now();
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    });
    const duration = performance.now() - startTime;
    
    if (!response.ok) {
      const errorText = await response.text();
      enhancedLogger.logApiResponse(contextId, response.status, url, errorText, duration);
      return `Error running tests: ${response.status} ${response.statusText}\n${errorText}`;
    }
    
    const data = await response.json();
    enhancedLogger.logApiResponse(contextId, response.status, url, data, duration);
    
    // Format the response as a nice markdown message
    return formatTestResponse(data);
  } catch (error) {
    logger.error(FeatureArea.API, `Error in test command: ${error instanceof Error ? error.message : String(error)}`);
    return `Failed to run tests: ${error instanceof Error ? error.message : String(error)}`;
  }
}

/**
 * Handle the 'perf' command to analyze performance metrics
 */
async function handlePerfCommand(contextId: string, params: string[]): Promise<string> {
  if (params.length === 0) {
    return 'Please specify an endpoint or feature. Example: !debug perf /api/goals';
  }
  
  const target = params[0];
  let period = '1d';
  
  // Check for period parameter
  const periodParam = params.find(p => p.startsWith('--period='));
  if (periodParam) {
    period = periodParam.split('=')[1] || '1d';
  }
  
  enhancedLogger.logStep(
    contextId,
    `Analyzing performance for: ${target} (period: ${period})`,
    LogLevel.INFO,
    FeatureArea.UI
  );
  
  try {
    // Call API endpoint
    const queryParams = new URLSearchParams({
      target,
      period
    });
    
    const url = `${AI_DEBUG_API_BASE}/performance?${queryParams.toString()}`;
    enhancedLogger.logApiRequest(contextId, 'GET', url);
    
    const startTime = performance.now();
    const response = await fetch(url);
    const duration = performance.now() - startTime;
    
    if (!response.ok) {
      const errorText = await response.text();
      enhancedLogger.logApiResponse(contextId, response.status, url, errorText, duration);
      return `Error analyzing performance: ${response.status} ${response.statusText}\n${errorText}`;
    }
    
    const data = await response.json();
    enhancedLogger.logApiResponse(contextId, response.status, url, data, duration);
    
    // Format the response as a nice markdown message
    return formatPerformanceResponse(data);
  } catch (error) {
    logger.error(FeatureArea.API, `Error in perf command: ${error instanceof Error ? error.message : String(error)}`);
    return `Failed to analyze performance: ${error instanceof Error ? error.message : String(error)}`;
  }
}

/**
 * Handle the 'report' command to generate a status report
 */
async function handleReportCommand(contextId: string, params: string[]): Promise<string> {
  const detailed = params.includes('--detailed');
  
  let format = 'markdown';
  const formatParam = params.find(p => p.startsWith('--format='));
  if (formatParam) {
    format = formatParam.split('=')[1] || 'markdown';
  }
  
  enhancedLogger.logStep(
    contextId,
    `Generating status report (detailed: ${detailed}, format: ${format})`,
    LogLevel.INFO,
    FeatureArea.UI
  );
  
  try {
    // Call API endpoint
    const queryParams = new URLSearchParams({
      detailed: detailed ? 'true' : 'false',
      format
    });
    
    const url = `${AI_DEBUG_API_BASE}/status-report?${queryParams.toString()}`;
    enhancedLogger.logApiRequest(contextId, 'GET', url);
    
    const startTime = performance.now();
    const response = await fetch(url);
    const duration = performance.now() - startTime;
    
    if (!response.ok) {
      const errorText = await response.text();
      enhancedLogger.logApiResponse(contextId, response.status, url, errorText, duration);
      return `Error generating report: ${response.status} ${response.statusText}\n${errorText}`;
    }
    
    const data = await response.json();
    enhancedLogger.logApiResponse(contextId, response.status, url, data, duration);
    
    // Format the response as a nice markdown message
    return formatReportResponse(data);
  } catch (error) {
    logger.error(FeatureArea.API, `Error in report command: ${error instanceof Error ? error.message : String(error)}`);
    return `Failed to generate report: ${error instanceof Error ? error.message : String(error)}`;
  }
}

/**
 * Handle the 'error' command to analyze a specific error
 */
async function handleErrorCommand(contextId: string, params: string[]): Promise<string> {
  if (params.length === 0) {
    return 'Please specify an error ID or message. Example: !debug error TypeError';
  }
  
  const query = params.join(' ');
  
  enhancedLogger.logStep(
    contextId,
    `Analyzing error: ${query}`,
    LogLevel.INFO,
    FeatureArea.UI
  );
  
  try {
    // Call API endpoint
    const queryParams = new URLSearchParams({
      query
    });
    
    const url = `${AI_DEBUG_API_BASE}/error-search?${queryParams.toString()}`;
    enhancedLogger.logApiRequest(contextId, 'GET', url);
    
    const startTime = performance.now();
    const response = await fetch(url);
    const duration = performance.now() - startTime;
    
    if (!response.ok) {
      const errorText = await response.text();
      enhancedLogger.logApiResponse(contextId, response.status, url, errorText, duration);
      return `Error analyzing error: ${response.status} ${response.statusText}\n${errorText}`;
    }
    
    const data = await response.json();
    enhancedLogger.logApiResponse(contextId, response.status, url, data, duration);
    
    // Format the response as a nice markdown message
    return formatErrorResponse(data);
  } catch (error) {
    logger.error(FeatureArea.API, `Error in error command: ${error instanceof Error ? error.message : String(error)}`);
    return `Failed to analyze error: ${error instanceof Error ? error.message : String(error)}`;
  }
}

/**
 * Format the feature information response
 */
function formatFeatureResponse(response: any): string {
  if (!response.data || !response.data.feature) {
    return `No information available for the requested feature.`;
  }
  
  const { feature, testResults, recentLogs, potentialIssues, recommendations } = response.data;
  
  let output = `## ${feature.name} Feature Status\n\n`;
  output += `**Implementation**: ${feature.implemented ? '✅ Complete' : '🔄 In Progress'}\n`;
  output += `**Test Status**: ${feature.testStatus || (feature.tested ? '✅ Tested' : '⚠️ Not tested')}\n`;
  output += `**Last Updated**: ${feature.implementedAt || feature.lastVerified ? new Date(feature.implementedAt || feature.lastVerified).toLocaleDateString() : 'Not recorded'}\n\n`;
  
  if (feature.notes && feature.notes.length > 0) {
    output += `### Notes\n`;
    feature.notes.forEach((note: string) => {
      output += `- ${note}\n`;
    });
    output += `\n`;
  }
  
  if (testResults && testResults.length > 0) {
    output += `### Test Results\n`;
    testResults.forEach((test: any) => {
      const icon = test.status === 'passed' ? '✅' : test.status === 'failed' ? '❌' : '⚠️';
      output += `${icon} **${test.name}**: ${test.status.toUpperCase()}${test.duration ? ` (${test.duration.toFixed(2)}ms)` : ''}\n`;
      if (test.error) {
        output += `   Error: ${test.error}\n`;
      }
    });
    output += `\n`;
  }
  
  if (potentialIssues && potentialIssues.length > 0) {
    output += `### Potential Issues\n`;
    potentialIssues.forEach((issue: string) => {
      output += `- ${issue}\n`;
    });
    output += `\n`;
  }
  
  if (recommendations && recommendations.length > 0) {
    output += `### Recommendations\n`;
    recommendations.forEach((rec: string) => {
      output += `- ${rec}\n`;
    });
    output += `\n`;
  }
  
  if (recentLogs && recentLogs.length > 0) {
    output += `### Recent Activity\n`;
    recentLogs.slice(0, 5).forEach((log: any) => {
      const date = new Date(log.timestamp).toLocaleString();
      output += `- [${date}] ${log.message}\n`;
    });
  }
  
  return output;
}

/**
 * Format the test execution response
 */
function formatTestResponse(response: any): string {
  if (!response.data || !response.data.results) {
    return `No test results available.`;
  }
  
  const { results, summary, recommendations } = response.data;
  
  let output = `## Test Execution Results\n\n`;
  
  if (summary) {
    output += `**Summary**: ${summary.passed}/${summary.total} tests passed `;
    output += `(${summary.failed} failed, ${summary.skipped} skipped)\n\n`;
  }
  
  if (results && results.length > 0) {
    output += `### Test Details\n`;
    results.forEach((test: any) => {
      const icon = test.status === 'passed' ? '✅' : test.status === 'failed' ? '❌' : test.status === 'skipped' ? '⏭️' : '⚠️';
      output += `${icon} **${test.name}**: ${test.status.toUpperCase()}${test.duration ? ` (${test.duration.toFixed(2)}ms)` : ''}\n`;
      if (test.description) {
        output += `   ${test.description}\n`;
      }
      if (test.error) {
        output += `   Error: ${test.error}\n`;
      }
    });
    output += `\n`;
  }
  
  if (recommendations && recommendations.length > 0) {
    output += `### Recommendations\n`;
    recommendations.forEach((rec: string) => {
      output += `- ${rec}\n`;
    });
  }
  
  return output;
}

/**
 * Format the performance analysis response
 */
function formatPerformanceResponse(response: any): string {
  if (!response.data) {
    return `No performance data available.`;
  }
  
  const { target, period, metrics, baseline, anomalies, recommendations } = response.data;
  
  let output = `## Performance Analysis: ${target}\n\n`;
  output += `**Time Period**: ${period}\n\n`;
  
  if (metrics) {
    output += `### Metrics\n`;
    output += `- **Average Response Time**: ${metrics.avgResponseTime}ms${baseline?.avgResponseTime ? ` (${metrics.avgResponseTime > baseline.avgResponseTime ? '↑' : '↓'}${Math.abs(((metrics.avgResponseTime - baseline.avgResponseTime) / baseline.avgResponseTime) * 100).toFixed(1)}% from baseline)` : ''}\n`;
    output += `- **95th Percentile**: ${metrics.p95ResponseTime}ms${baseline?.p95ResponseTime ? ` (${metrics.p95ResponseTime > baseline.p95ResponseTime ? '↑' : '↓'}${Math.abs(((metrics.p95ResponseTime - baseline.p95ResponseTime) / baseline.p95ResponseTime) * 100).toFixed(1)}% from baseline)` : ''}\n`;
    output += `- **Error Rate**: ${metrics.errorRate}%${baseline?.errorRate ? ` (${metrics.errorRate > baseline.errorRate ? '↑' : '↓'}${Math.abs(((metrics.errorRate - baseline.errorRate) / baseline.errorRate) * 100).toFixed(1)}% from baseline)` : ''}\n`;
    output += `- **Throughput**: ${metrics.throughput} req/min\n\n`;
  }
  
  if (anomalies && anomalies.length > 0) {
    output += `### Anomalies Detected\n`;
    anomalies.forEach((anomaly: string) => {
      output += `- ${anomaly}\n`;
    });
    output += `\n`;
  }
  
  if (recommendations && recommendations.length > 0) {
    output += `### Recommendations\n`;
    recommendations.forEach((rec: string) => {
      output += `- ${rec}\n`;
    });
  }
  
  return output;
}

/**
 * Format the status report response
 */
function formatReportResponse(response: any): string {
  if (!response.data) {
    return `No report data available.`;
  }
  
  const { summary, featureStatus, criticalIssues, recommendations, format } = response.data;
  
  // If a format other than markdown was requested, and the response includes the formatted report, return it directly
  if (format && format !== 'markdown' && response.data.formattedReport) {
    return response.data.formattedReport;
  }
  
  let output = `# Application Status Report\n\n`;
  
  if (summary) {
    output += `## Summary\n`;
    Object.entries(summary).forEach(([key, value]: [string, any]) => {
      output += `- **${key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1')}**: ${value}\n`;
    });
    output += `\n`;
  }
  
  if (featureStatus && featureStatus.length > 0) {
    output += `## Feature Status\n`;
    output += `| Feature | Implementation | Tests | Last Updated |\n`;
    output += `|---------|---------------|-------|---------------|\n`;
    
    featureStatus.forEach((feature: any) => {
      const implemented = feature.implemented ? 'Complete' : 'In Progress';
      const tested = feature.testStatus || (feature.tested ? 'Tested' : 'Not Tested');
      const lastUpdated = feature.lastVerified ? new Date(feature.lastVerified).toLocaleDateString() : 'Not recorded';
      
      output += `| ${feature.name} | ${implemented} | ${tested} | ${lastUpdated} |\n`;
    });
    output += `\n`;
  }
  
  if (criticalIssues && criticalIssues.length > 0) {
    output += `## Critical Issues\n`;
    criticalIssues.forEach((issue: string, index: number) => {
      output += `${index + 1}. ${issue}\n`;
    });
    output += `\n`;
  }
  
  if (recommendations && recommendations.length > 0) {
    output += `## Recommendations\n`;
    recommendations.forEach((rec: string, index: number) => {
      output += `${index + 1}. ${rec}\n`;
    });
  }
  
  output += `\n---\n`;
  output += `Generated on ${new Date().toLocaleString()}\n`;
  
  return output;
}

/**
 * Format the error analysis response
 */
function formatErrorResponse(response: any): string {
  if (!response.data) {
    return `No error analysis data available.`;
  }
  
  const { error, frequency, affectedComponents, analysis, suggestedFix, relatedIssues } = response.data;
  
  let output = `## Error Analysis\n\n`;
  
  if (error) {
    output += `**Type**: ${error.type || 'Unknown'}\n`;
    output += `**Message**: ${error.message || 'No message'}\n`;
    
    if (error.stack) {
      output += `**Stack**: \`\`\`\n${error.stack}\n\`\`\`\n`;
    }
    
    if (frequency) {
      output += `**Frequency**: ${frequency.count} occurrences in last ${frequency.period}\n`;
    }
    
    if (affectedComponents && affectedComponents.length > 0) {
      output += `**Affected Components**: ${affectedComponents.join(', ')}\n`;
    }
    
    output += `\n`;
  }
  
  if (analysis) {
    output += `### Analysis\n`;
    output += `${analysis}\n\n`;
  }
  
  if (suggestedFix) {
    output += `### Recommended Fix\n`;
    
    if (suggestedFix.description) {
      output += `${suggestedFix.description}\n\n`;
    }
    
    if (suggestedFix.code) {
      output += "```typescript\n";
      if (suggestedFix.beforeCode) {
        output += "// Before\n";
        output += `${suggestedFix.beforeCode}\n\n`;
      }
      
      output += "// After\n";
      output += `${suggestedFix.code}\n`;
      output += "```\n\n";
    }
  }
  
  if (relatedIssues && relatedIssues.length > 0) {
    output += `### Related Issues\n`;
    relatedIssues.forEach((issue: string) => {
      output += `- ${issue}\n`;
    });
  }
  
  return output;
}

/**
 * Extract meaningful context from an error signature
 */
function extractErrorContext(signature: string, message: string): string {
  // Simple context extraction heuristic
  const errorType = signature.split(':')[0] || 'Error';
  const component = signature.match(/\[(.*?)\]/)?.[1] || 'Unknown component';
  
  return `${errorType} in ${component}: ${message}`;
}

/**
 * Generate help text for AI Agent debug commands
 */
function generateHelpText(): string {
  return `
# AI Agent Debug Commands

Use these commands to debug and analyze the application:

## Feature Status
\`!debug feature <feature_name> [--detailed]\`
Get information about a specific feature, including implementation status, test results, and potential issues.

## Run Tests
\`!debug test <feature_name> [--all]\`
Run tests for a specific feature, or use --all to run all tests.

## Performance Analysis
\`!debug perf <endpoint_or_feature> [--period=<1d|7d|30d>]\`
Analyze performance metrics for a specific endpoint or feature.

## Status Report
\`!debug report [--detailed] [--format=markdown|json|text]\`
Generate a comprehensive status report of the application.

## Error Analysis
\`!debug error <error_id_or_message>\`
Analyze a specific error and get recommendations for fixing it.

## Help
\`!debug help\`
Show this help text.
`;
}

/**
 * Interface for the AI Agent
 * This function would be called by the AI Agent to process debug commands
 */
export function processCommand(command: string): Promise<string> {
  return processAiAgentCommand(command);
}

// Export the help text for use in other components
export { generateHelpText };