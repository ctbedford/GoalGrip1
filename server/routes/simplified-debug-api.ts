import { Router, Request, Response } from 'express';
import fs from 'fs';
import path from 'path';
import { serverLogger, FeatureArea, LogLevel } from '../utils/server-logger';
import { serverTestTypes, TestStatus } from '../utils/server-test-types';

const router = Router();

/**
 * Root endpoint providing overview of available debug endpoints
 */
router.get('/', (req: Request, res: Response) => {
  res.json({
    availableEndpoints: {
      '/api/debug': 'Overview of debug endpoints',
      '/api/debug/features': 'List all features and their implementation status',
      '/api/debug/features/:name': 'Get detailed info about a specific feature',
      '/api/debug/tests': 'List all tests and their status',
      '/api/debug/tests/run/:id': 'Run a specific test',
      '/api/debug/tests/run-all': 'Run all tests',
      '/api/debug/logs': 'Get application logs with optional filters',
      '/api/debug/performance': 'Get performance metrics',
      '/api/debug/markdown': 'List available markdown documentation files',
      '/api/debug/markdown/:filename': 'Get content of a specific markdown file',
      '/api/debug/query': 'Execute a custom debug query',
    },
    documentationUrl: '/api/debug/markdown/DEBUG_INFRASTRUCTURE.md'
  });
});

/**
 * Get all feature implementation status
 */
router.get('/features', (req: Request, res: Response) => {
  try {
    // For the simplified API approach, we'll include the feature information
    // that was logged at application startup
    const features: Record<string, any> = {};
    
    // In a real implementation, we would fetch these from logger.getFeatureVerificationStatus()
    // For now, we'll hardcode the features we know exist from our CLI logs
    const knownFeatures = [
      'dashboard-stats',
      'goal-creation',
      'goal-progress-tracking',
      'analytics-charts',
      'achievements-badges',
      'settings-profile',
      'settings-appearance',
      'settings-notifications',
      'settings-security'
    ];
    
    // Create feature status objects
    knownFeatures.forEach(featureName => {
      features[featureName] = {
        name: featureName,
        implemented: true,
        tested: false,
        lastVerified: new Date(),
        notes: [`Feature registered through CLI infrastructure`]
      };
    });
    
    // Format for API response
    const response = {
      features,
      stats: {
        total: Object.keys(features).length,
        implemented: Object.values(features).filter(f => (f as any).implemented).length,
        tested: Object.values(features).filter(f => (f as any).tested).length,
        complete: Object.values(features).filter(f => (f as any).implemented && (f as any).tested).length,
      },
      timestamp: new Date().toISOString()
    };
    
    res.json(response);
  } catch (error: any) {
    console.error('Error fetching features:', error);
    res.status(500).json({ 
      error: 'Failed to fetch features',
      details: error.message || 'Unknown error'
    });
  }
});

/**
 * Get detailed information about a specific feature
 */
router.get('/features/:name', (req: Request, res: Response) => {
  try {
    const featureName = req.params.name;
    
    // In a real implementation, we would fetch these from logger.getFeatureVerificationStatus()
    // For now, we'll use the same approach as the /features endpoint for consistency
    const knownFeatures = [
      'dashboard-stats',
      'goal-creation',
      'goal-progress-tracking',
      'analytics-charts',
      'achievements-badges',
      'settings-profile',
      'settings-appearance',
      'settings-notifications',
      'settings-security'
    ];
    
    // Create feature status objects
    const features: Record<string, any> = {};
    knownFeatures.forEach(fname => {
      features[fname] = {
        name: fname,
        implemented: true, 
        tested: false,
        lastVerified: new Date(),
        notes: [`Feature registered through CLI infrastructure`]
      };
    });
    
    // Find the requested feature
    const feature = Object.entries(features).find(
      ([key]) => key.toLowerCase() === featureName.toLowerCase()
    );
    
    if (!feature) {
      return res.status(404).json({ 
        error: 'Feature not found',
        suggestion: 'Use /api/debug/features to see a list of all available features'
      });
    }
    
    // Get related test results for this feature (placeholder)
    const relatedTests: any[] = [];
    
    // Get related logs for this feature from server-side logger
    const logs = serverLogger.getLogs();
    const relatedLogs = logs.filter(log => 
      log.message.toLowerCase().includes(featureName.toLowerCase()) ||
      (log.data && JSON.stringify(log.data).toLowerCase().includes(featureName.toLowerCase()))
    );
    
    // Format response
    const response = {
      name: feature[0],
      status: feature[1],
      relatedTests,
      recentLogs: relatedLogs.slice(-20),
      recommendations: generateRecommendations(feature[0], feature[1], relatedTests),
      timestamp: new Date().toISOString()
    };
    
    res.json(response);
  } catch (error) {
    console.error('Error fetching feature details:', error);
    res.status(500).json({ 
      error: 'Failed to fetch feature details',
      details: error instanceof Error ? error.message : String(error)
    });
  }
});

/**
 * Get all test results
 */
router.get('/tests', (req: Request, res: Response) => {
  try {
    const testResults = serverTestTypes.getTestResults();
    
    // Format response
    const response = {
      tests: testResults,
      stats: {
        total: Object.keys(testResults).length,
        passed: Object.values(testResults).filter(t => t.status === TestStatus.PASSED).length,
        failed: Object.values(testResults).filter(t => t.status === TestStatus.FAILED).length,
        notStarted: Object.values(testResults).filter(t => t.status === TestStatus.NOT_STARTED).length,
        skipped: Object.values(testResults).filter(t => t.status === TestStatus.SKIPPED).length,
      },
      timestamp: new Date().toISOString()
    };
    
    res.json(response);
  } catch (error) {
    console.error('Error fetching tests:', error);
    res.status(500).json({ 
      error: 'Failed to fetch tests',
      details: error instanceof Error ? error.message : String(error)
    });
  }
});

/**
 * Run a specific test
 */
router.post('/tests/run/:id', async (req: Request, res: Response) => {
  try {
    const testId = req.params.id;
    
    // Placeholder for actual test execution
    // This would call runFeatureTest(testId) from featureTester.ts
    
    res.json({
      message: `Test ${testId} execution requested`,
      status: 'pending',
      note: 'This is a placeholder. Actual test execution to be implemented.'
    });
  } catch (error) {
    console.error(`Error running test ${req.params.id}:`, error);
    res.status(500).json({ 
      error: 'Failed to run test',
      details: error instanceof Error ? error.message : String(error)
    });
  }
});

/**
 * Run all tests
 */
router.post('/tests/run-all', async (req: Request, res: Response) => {
  try {
    // Placeholder for actual test execution
    // This would call runAllFeatureTests() from featureTester.ts
    
    res.json({
      message: 'All tests execution requested',
      status: 'pending',
      note: 'This is a placeholder. Actual test execution to be implemented.'
    });
  } catch (error) {
    console.error('Error running all tests:', error);
    res.status(500).json({ 
      error: 'Failed to run all tests',
      details: error instanceof Error ? error.message : String(error)
    });
  }
});

/**
 * Get application logs with optional filters
 */
router.get('/logs', (req: Request, res: Response) => {
  try {
    const { level, area, from, to, limit = '100' } = req.query;
    
    // Parse filters
    const filters: any = {};
    if (level) filters.level = parseInt(level as string);
    if (area) filters.area = area;
    if (from) filters.fromDate = new Date(from as string);
    if (to) filters.toDate = new Date(to as string);
    
    // Get logs with filters
    const logs = serverLogger.getLogs(filters);
    
    // Apply limit - get most recent logs first
    const limitedLogs = logs.slice(-parseInt(limit as string));
    
    res.json({
      logs: limitedLogs,
      count: limitedLogs.length,
      totalAvailable: logs.length,
      filters: filters,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error fetching logs:', error);
    res.status(500).json({ 
      error: 'Failed to fetch logs',
      details: error instanceof Error ? error.message : String(error)
    });
  }
});

/**
 * Get performance metrics
 */
router.get('/performance', (req: Request, res: Response) => {
  try {
    // Placeholder for actual performance metrics gathering
    // This would gather performance data from appropriate sources
    
    const mockPerformanceData = {
      apiLatency: {
        endpoints: [
          { path: '/api/goals', avgResponseTime: 42, requests: 156 },
          { path: '/api/dashboard/stats', avgResponseTime: 37, requests: 312 },
          { path: '/api/progress-logs', avgResponseTime: 58, requests: 89 }
        ]
      },
      memory: {
        usage: process.memoryUsage(),
      },
      uptime: process.uptime()
    };
    
    res.json({
      metrics: mockPerformanceData,
      timestamp: new Date().toISOString(),
      note: 'Some metrics are placeholders. Actual metrics collection to be implemented.'
    });
  } catch (error) {
    console.error('Error fetching performance metrics:', error);
    res.status(500).json({ 
      error: 'Failed to fetch performance metrics',
      details: error instanceof Error ? error.message : String(error)
    });
  }
});

/**
 * List available markdown documentation files
 */
router.get('/markdown', (req: Request, res: Response) => {
  try {
    const markdownFiles = fs.readdirSync('.')
      .filter(file => file.endsWith('.md'))
      .map(file => ({
        filename: file,
        path: `/api/debug/markdown/${file}`,
        title: getMarkdownTitle(file),
        updatedAt: fs.statSync(file).mtime
      }));
    
    res.json({
      files: markdownFiles,
      count: markdownFiles.length,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error listing markdown files:', error);
    res.status(500).json({ 
      error: 'Failed to list markdown files',
      details: error instanceof Error ? error.message : String(error)
    });
  }
});

/**
 * Get content of a specific markdown file
 */
router.get('/markdown/:filename', (req: Request, res: Response) => {
  try {
    const filename = req.params.filename;
    const filePath = path.join('.', filename);
    
    // Check if file exists
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ 
        error: 'Markdown file not found',
        suggestion: 'Use /api/debug/markdown to see a list of all available markdown files'
      });
    }
    
    // Read file content
    const content = fs.readFileSync(filePath, 'utf8');
    
    // Return as formatted JSON with raw content and HTML rendering
    res.json({
      filename,
      title: getMarkdownTitle(filename),
      rawContent: content,
      updatedAt: fs.statSync(filePath).mtime,
      size: fs.statSync(filePath).size,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error(`Error reading markdown file ${req.params.filename}:`, error);
    res.status(500).json({ 
      error: 'Failed to read markdown file',
      details: error instanceof Error ? error.message : String(error)
    });
  }
});

/**
 * Execute a custom debug query
 */
router.post('/query', (req: Request, res: Response) => {
  try {
    const { query } = req.body;
    
    if (!query) {
      return res.status(400).json({ 
        error: 'Missing query parameter',
        suggestion: 'Provide a query parameter with a valid debug function call'
      });
    }

    // For now, we'll return a predefined set of feature data
    // since evaluating arbitrary code on the server side would be a security risk
    if (query.includes('getFeatureVerificationStatus')) {
      // Return the same feature data we use in the /features endpoint
      const features: Record<string, any> = {};
      const knownFeatures = [
        'dashboard-stats',
        'goal-creation',
        'goal-progress-tracking',
        'analytics-charts',
        'achievements-badges',
        'settings-profile',
        'settings-appearance',
        'settings-notifications',
        'settings-security',
        'log-viewer',
        'debug-infrastructure',
        'enhanced-logger',
        'api-tester',
        'feature-tester',
        'api-dashboard',
        'feature-dashboard',
        'performance-metrics'
      ];
      
      knownFeatures.forEach(featureName => {
        features[featureName] = {
          name: featureName,
          implemented: true,
          tested: false,
          lastVerified: new Date(),
          notes: [`Feature registered through debug infrastructure`]
        };
      });
      
      return res.json({
        result: features,
        query,
        executedAt: new Date().toISOString()
      });
    } else if (query.includes('getLogs')) {
      // Return logs from the server logger
      const logs = serverLogger.getLogs();
      return res.json({
        result: logs,
        query,
        executedAt: new Date().toISOString()
      });
    } else if (query.includes('getTestResults')) {
      // Return test results
      const testResults = serverTestTypes.getTestResults();
      return res.json({
        result: testResults,
        query,
        executedAt: new Date().toISOString()
      });
    } else {
      // For any other query, return a not implemented response
      return res.json({
        result: null,
        query,
        executedAt: new Date().toISOString(),
        status: 'not_implemented',
        message: 'This query is not currently supported by the server-side debug API'
      });
    }
  } catch (error) {
    console.error('Error executing debug query:', error);
    res.status(500).json({ 
      error: 'Failed to execute debug query',
      details: error instanceof Error ? error.message : String(error)
    });
  }
});

// Helper functions

/**
 * Extract title from markdown file
 */
function getMarkdownTitle(filename: string): string {
  try {
    const filePath = path.join('.', filename);
    const content = fs.readFileSync(filePath, 'utf8');
    const titleMatch = content.match(/^#\s+(.*)/m);
    return titleMatch ? titleMatch[1].trim() : filename.replace('.md', '');
  } catch (error) {
    console.error(`Error extracting title from ${filename}:`, error);
    return filename.replace('.md', '');
  }
}

/**
 * Generate recommendations based on feature status
 */
function generateRecommendations(featureName: string, status: any, tests: any[]): string[] {
  const recommendations: string[] = [];
  
  if (!status.implemented) {
    recommendations.push(`Implement the ${featureName} feature`);
  } else if (!status.tested) {
    recommendations.push(`Add tests for the ${featureName} feature`);
  }
  
  // Add test-specific recommendations
  const failedTests = tests.filter(t => t.status === TestStatus.FAILED);
  if (failedTests.length > 0) {
    recommendations.push(`Fix ${failedTests.length} failing tests for ${featureName}`);
    failedTests.forEach(test => {
      if (test.error) {
        recommendations.push(`Fix test "${test.name}": ${test.error}`);
      }
    });
  }
  
  return recommendations;
}

export default router;