import { Request, Response, Router } from 'express';
import { ErrorCode } from '../errorHandler';
import { storage } from '../storage';
import z from 'zod';
import * as loggerModule from '../../client/src/lib/logger';
import * as apiTester from '../../client/src/lib/apiTester';
import * as featureTester from '../../client/src/lib/featureTester';
import * as debugStorage from '../../client/src/lib/debugStorage';
import * as enhancedLogger from '../../client/src/lib/enhancedLogger';
import { featureTestService } from '../../client/src/lib/featureTestService';

// Extract utilities from logger module
const { 
  debug, info, warn, error, registerFeature, 
  markFeatureImplemented, markFeatureTested, getFeatureVerificationStatus,
  FeatureArea, LogLevel 
} = loggerModule;

const router = Router();

// Debug query schema
const debugQuerySchema = z.object({
  query: z.string(),
});

// Function registry for available toolchain functions
const functionRegistry: Record<string, (...args: any[]) => any> = {
  // Logger functions
  'getFeatureVerificationStatus': () => getFeatureVerificationStatus(),
  'markFeatureImplemented': (feature: string, note: string) => logger.markFeatureImplemented(feature, note),
  'markFeatureTested': (feature: string, note: string) => logger.markFeatureTested(feature, note),
  
  // API Tester functions
  'getApiTestResults': () => apiTester.getTestResults(),
  'testAllApiEndpoints': () => apiTester.testAllEndpoints(),
  
  // Feature Tester functions
  'getFeatureTestResults': () => featureTester.getTestResults(),
  'getRegisteredTests': () => featureTester.getRegisteredTests(),
  'runFeatureTest': (testId: string) => featureTester.runFeatureTest(testId),
  'runAllFeatureTests': () => featureTester.runAllFeatureTests(),
  
  // Debug Storage functions
  'getLogEntries': (filters?: any) => debugStorage.getLogEntries(filters),
  'getFeatureTestResultsFromStorage': () => debugStorage.getFeatureTestResults(),
  'getApiTestResultsFromStorage': () => debugStorage.getApiTestResults(),
  'exportDebugData': () => debugStorage.exportDebugData(),
  
  // Feature Test Service functions
  'getEnhancedFeatures': () => featureTestService.getEnhancedFeatures(),
  'getFeatureTests': () => featureTestService.getFeatureTests(),
  'getTestsForFeature': (featureName: string) => featureTestService.getTestsForFeature(featureName),
};

// Get available debug functions
router.get('/', (req: Request, res: Response) => {
  const availableFunctions = Object.keys(functionRegistry).map(name => ({
    name,
    description: `Execute the ${name} debug function`,
  }));
  
  res.json({
    availableFunctions,
    usage: {
      GET: '/api/debug/:functionName - Execute a specific debug function',
      POST: '/api/debug/query - Execute a custom debug query'
    }
  });
});

// Execute a specific debug function
router.get('/:functionName', async (req: Request, res: Response) => {
  const { functionName } = req.params;
  const args = req.query.args ? JSON.parse(String(req.query.args)) : [];
  
  if (!functionRegistry[functionName]) {
    return res.status(404).json({
      error: {
        code: ErrorCode.NOT_FOUND,
        message: `Debug function '${functionName}' not found`,
        availableFunctions: Object.keys(functionRegistry)
      }
    });
  }
  
  try {
    const result = await functionRegistry[functionName](...(Array.isArray(args) ? args : [args]));
    res.json(result);
  } catch (error) {
    res.status(500).json({
      error: {
        code: ErrorCode.INTERNAL_ERROR,
        message: error instanceof Error ? error.message : 'Unknown error executing debug function',
        function: functionName,
        args,
      }
    });
  }
});

// Execute a custom debug query
router.post('/query', async (req: Request, res: Response) => {
  try {
    const { query } = debugQuerySchema.parse(req.body);
    
    // Create a function that will execute the query with access to all the debug utilities
    const evaluateQuery = new Function(
      ...Object.keys(functionRegistry),
      `try {
        return ${query};
      } catch (err) {
        throw new Error(\`Query execution failed: \${err.message}\`);
      }`
    );
    
    // Execute the query with the available functions passed as arguments
    const result = await evaluateQuery(...Object.values(functionRegistry));
    
    res.json({
      result,
      query,
      timestamp: new Date()
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: {
          code: ErrorCode.VALIDATION_ERROR,
          message: 'Invalid query format',
          details: error.errors
        }
      });
    }
    
    res.status(500).json({
      error: {
        code: ErrorCode.INTERNAL_ERROR,
        message: error instanceof Error ? error.message : 'Unknown error executing debug query',
      }
    });
  }
});

export default router;