import { Request, Response, Router } from 'express';
import { ErrorCode } from '../errorHandler';
import { storage } from '../storage';
import z from 'zod';

const router = Router();

// Debug query schema
const debugQuerySchema = z.object({
  query: z.string(),
});

// Define a simple registry of available functions for documentation purposes
const availableFunctionNames = [
  // Logger functions
  'getFeatureVerificationStatus',
  'markFeatureImplemented',
  'markFeatureTested',
  
  // API Tester functions
  'getApiTestResults',
  'testAllApiEndpoints',
  
  // Feature Tester functions
  'getFeatureTestResults',
  'getRegisteredTests',
  'runFeatureTest',
  'runAllFeatureTests',
  
  // Debug Storage functions
  'getLogEntries',
  'getFeatureTestResultsFromStorage',
  'getApiTestResultsFromStorage',
  'exportDebugData',
  
  // Feature Test Service functions
  'getEnhancedFeatures',
  'getFeatureTests',
  'getTestsForFeature'
];

// Get available debug functions
router.get('/', (req: Request, res: Response) => {
  const availableFunctions = availableFunctionNames.map(name => ({
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
  
  if (!availableFunctionNames.includes(functionName)) {
    return res.status(404).json({
      error: {
        code: ErrorCode.NOT_FOUND,
        message: `Debug function '${functionName}' not found`,
        availableFunctions: availableFunctionNames
      }
    });
  }
  
  // This is a simplified implementation just to get things working
  // In a full implementation, we would dynamically load and execute the function
  res.json({
    message: 'Debug API endpoint registered and available',
    functionName,
    status: 'This function is recognized but execution is handled by the client',
    timestamp: new Date()
  });
});

// Execute a custom debug query
router.post('/query', async (req: Request, res: Response) => {
  try {
    const { query } = debugQuerySchema.parse(req.body);

    // In a production implementation, this would execute the query safely
    // For now, we just acknowledge receipt of the query
    res.json({
      message: 'Debug query received',
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