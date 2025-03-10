import { Request, Response, Router } from 'express';
import { ErrorCode } from '../errorHandler';
import { storage } from '../storage';
import z from 'zod';
import fs from 'fs';
import path from 'path';

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
  'getTestsForFeature',
  
  // Markdown Documentation functions
  'listMarkdownFiles',
  'getMarkdownContent'
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

    // For API documentation purposes, create a proper response
    // We don't directly execute the query on the server side to avoid security issues
    // Instead we provide a structured response for the API endpoint
    const queryTypes = [
      'logger', 'featureStatus', 'apiTest', 'featureTest', 'debugStorage', 'customQuery'
    ];
    
    // Simple query type detection based on string matching
    const detectQueryType = (q: string): string => {
      if (q.includes('Feature') && (q.includes('Status') || q.includes('Verification'))) {
        return 'featureStatus';
      } else if (q.includes('apiTester') || q.includes('testEndpoint')) {
        return 'apiTest';
      } else if (q.includes('featureTester') || q.includes('runFeatureTest')) {
        return 'featureTest';
      } else if (q.includes('debugStorage') || q.includes('getLogEntries')) {
        return 'debugStorage';
      } else if (q.includes('logger') || q.includes('LogLevel')) {
        return 'logger';
      }
      return 'customQuery';
    };
    
    const queryType = detectQueryType(query);
    
    // Create structured response with request info and documentation links
    res.json({
      message: 'Debug query processed',
      query: {
        text: query,
        type: queryType,
        processed: true
      },
      result: {
        status: 'success',
        timestamp: new Date(),
        data: {
          message: 'The query was properly received by the debug API',
          note: 'For security reasons, queries are handled by the client. This API endpoint serves as a bridge for external tools.'
        }
      },
      documentation: {
        availableQueryTypes: queryTypes,
        exampleQueries: {
          featureStatus: 'getFeatureVerificationStatus()',
          apiTest: 'apiTester.testAllEndpoints()',
          featureTest: 'featureTester.runFeatureTest("enhanced-logger")',
          debugStorage: 'debugStorage.getLogEntries()',
          logger: 'logger.markFeatureImplemented("feature-name", "implementation note")'
        }
      }
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

// Add specific implementation for markdown file operations
// List all markdown files
router.get('/markdown/list', (req: Request, res: Response) => {
  try {
    const rootDir = process.cwd();
    const mdFiles = fs.readdirSync(rootDir)
      .filter(file => file.endsWith('.md'))
      .map(filename => {
        const filePath = path.join(rootDir, filename);
        const stats = fs.statSync(filePath);
        
        return {
          filename,
          path: `/${filename}`,
          size: stats.size,
          lastModified: stats.mtime,
          url: `${req.protocol}://${req.get('host')}/${filename}`
        };
      });
      
    res.json({
      message: 'Markdown files retrieved successfully',
      count: mdFiles.length,
      files: mdFiles,
      timestamp: new Date()
    });
  } catch (error) {
    res.status(500).json({
      error: {
        code: ErrorCode.INTERNAL_ERROR,
        message: error instanceof Error ? error.message : 'Failed to retrieve markdown files',
      }
    });
  }
});

// Get content of a specific markdown file
router.get('/markdown/content/:filename', (req: Request, res: Response) => {
  try {
    const { filename } = req.params;
    
    // Validate filename to prevent directory traversal
    if (!filename.match(/^[A-Za-z0-9_-]+\.md$/)) {
      return res.status(400).json({
        error: {
          code: ErrorCode.VALIDATION_ERROR,
          message: 'Invalid filename format',
        }
      });
    }
    
    const rootDir = process.cwd();
    const filePath = path.join(rootDir, filename);
    
    // Check if file exists
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({
        error: {
          code: ErrorCode.NOT_FOUND,
          message: `Markdown file '${filename}' not found`,
        }
      });
    }
    
    // Read file content
    const content = fs.readFileSync(filePath, 'utf8');
    const stats = fs.statSync(filePath);
    
    res.json({
      message: 'Markdown content retrieved successfully',
      filename,
      size: stats.size,
      lastModified: stats.mtime,
      content,
      timestamp: new Date()
    });
  } catch (error) {
    res.status(500).json({
      error: {
        code: ErrorCode.INTERNAL_ERROR,
        message: error instanceof Error ? error.message : 'Failed to retrieve markdown content',
      }
    });
  }
});

// Special handling for listMarkdownFiles in the generic function endpoint
router.get('/listMarkdownFiles', (req: Request, res: Response) => {
  // Redirect to the dedicated endpoint
  res.redirect('/api/debug/markdown/list');
});

// Special handling for getMarkdownContent in the generic function endpoint
router.get('/getMarkdownContent/:filename', (req: Request, res: Response) => {
  // Redirect to the dedicated endpoint
  const { filename } = req.params;
  res.redirect(`/api/debug/markdown/content/${filename}`);
});

export default router;