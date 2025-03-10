import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardContent, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Check, 
  RefreshCw, 
  Code, 
  Wrench,
  ArrowRight,
  Eye,
  Bug,
  Search,
  FileJson,
  AlertCircle,
  Save,
  Copy
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

// Import all the debug utilities for direct access to their state
import logger, { FeatureArea, LogLevel, getFeatureVerificationStatus } from '@/lib/logger';
import * as apiTester from '@/lib/apiTester';
import * as featureTester from '@/lib/featureTester';
import * as debugStorage from '@/lib/debugStorage';
import * as enhancedLogger from '@/lib/enhancedLogger';
import { featureTestService } from '@/lib/featureTestService';
import { createContext } from '@/lib/enhancedLogger';

/**
 * Debug Toolchain Inspector Component
 * 
 * A specialized component that allows inspection of the debug infrastructure itself
 * through direct toolchain calls. This provides a meta-debugging capability where
 * the debug tools can be used to debug themselves.
 */
export function DebugToolchainInspector() {
  const [activeTab, setActiveTab] = useState('query');
  const [queryText, setQueryText] = useState('');
  const [queryResult, setQueryResult] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedQueries, setSavedQueries] = useState<Array<{name: string, query: string}>>([
    { name: 'All Feature Status', query: 'getFeatureVerificationStatus()' },
    { name: 'All Test Results', query: 'featureTester.getTestResults()' },
    { name: 'Test Registry', query: 'featureTester.getRegisteredTests()' },
    { name: 'Enhanced Feature Status', query: 'featureTestService.getEnhancedFeatures()' },
    { name: 'API Test Results', query: 'apiTester.getTestResults()' },
    { name: 'Debug Contexts', query: 'getAllContexts()' },
    { name: 'Log Entries', query: 'debugStorage.getLogEntries()' },
  ]);
  const { toast } = useToast();

  // Create a mapping of available functions from the imported modules
  // Helper function to get debug contexts
  function getAllContexts() {
    // This function is not part of the original API but we add it for convenience
    // in the toolchain inspector
    return Object.values(enhancedLogger);
  }

  const availableFunctions = {
    // Logger functions
    getFeatureVerificationStatus,
    markFeatureImplemented: logger.markFeatureImplemented,
    markFeatureTested: logger.markFeatureTested,
    registerFeature: logger.registerFeature,
    
    // API Tester functions
    apiTester,
    
    // Feature Tester functions
    featureTester,
    
    // Debug Storage functions
    debugStorage,
    
    // Enhanced Logger functions
    enhancedLogger,
    createExecutionContext: enhancedLogger.createContext,
    getAllContexts,
    
    // Feature Test Service
    featureTestService,
  };

  // Execute the toolchain query
  const executeQuery = async () => {
    if (!queryText.trim()) {
      setError('Please enter a query');
      return;
    }

    setIsLoading(true);
    setError(null);
    
    try {
      // Create a function that will execute the query with access to all the debug utilities
      const evaluateQuery = new Function(
        ...Object.keys(availableFunctions),
        `try {
          return ${queryText};
        } catch (err) {
          throw new Error(\`Query execution failed: \${err.message}\`);
        }`
      );
      
      // Execute the query with the available functions passed as arguments
      const result = await evaluateQuery(...Object.values(availableFunctions));
      
      // Log the successful query execution
      logger.info(FeatureArea.UI, 'Debug toolchain query executed', {
        query: queryText,
        resultSize: result ? JSON.stringify(result).length : 0,
        timestamp: new Date()
      });
      
      setQueryResult(result);
      
      // Create a tracking context for this debugging session
      const contextId = enhancedLogger.createContext('debug-infrastructure', 'toolchain-query').id;
      enhancedLogger.logStep(
        contextId,
        `Executed toolchain query: ${queryText}`,
        LogLevel.INFO,
        FeatureArea.UI
      );
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error executing query';
      setError(errorMessage);
      
      logger.error(FeatureArea.UI, 'Debug toolchain query failed', {
        query: queryText,
        error: errorMessage,
        timestamp: new Date()
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Load a saved query
  const loadSavedQuery = (query: string) => {
    setQueryText(query);
    setActiveTab('query');
  };

  // Save the current query
  const saveCurrentQuery = () => {
    if (!queryText.trim()) return;
    
    const queryName = prompt('Enter a name for this query');
    if (!queryName) return;
    
    setSavedQueries([...savedQueries, { name: queryName, query: queryText }]);
    
    toast({
      title: 'Query Saved',
      description: `"${queryName}" has been saved to your query library`,
      duration: 3000,
    });
  };

  // Copy result to clipboard
  const copyResultToClipboard = () => {
    if (!queryResult) return;
    
    navigator.clipboard.writeText(JSON.stringify(queryResult, null, 2));
    
    toast({
      title: 'Copied to Clipboard',
      description: 'The query result has been copied to your clipboard',
      duration: 2000,
    });
  };

  // Format JSON for display
  const formatJsonForDisplay = (data: any): string => {
    try {
      return JSON.stringify(data, null, 2);
    } catch (error) {
      return `[Error Formatting Data: ${error instanceof Error ? error.message : 'Unknown error'}]`;
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle className="text-xl flex items-center">
              <Bug className="mr-2 h-5 w-5" />
              Debug Toolchain Inspector
            </CardTitle>
            <CardDescription>
              Inspect and interact with the debug infrastructure through direct toolchain calls
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Button 
              variant="outline"
              size="sm"
              onClick={saveCurrentQuery}
              disabled={!queryText.trim()}
            >
              <Save className="mr-2 h-4 w-4" />
              Save Query
            </Button>
            <Button 
              variant="outline"
              size="sm"
              onClick={copyResultToClipboard}
              disabled={!queryResult}
            >
              <Copy className="mr-2 h-4 w-4" />
              Copy Result
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="grid grid-cols-3 w-full max-w-md">
            <TabsTrigger value="query">
              <Code className="mr-2 h-4 w-4" />
              Query Editor
            </TabsTrigger>
            <TabsTrigger value="library">
              <Search className="mr-2 h-4 w-4" />
              Query Library
            </TabsTrigger>
            <TabsTrigger value="docs">
              <FileJson className="mr-2 h-4 w-4" />
              Documentation
            </TabsTrigger>
          </TabsList>
          
          {/* Query Editor Tab */}
          <TabsContent value="query" className="space-y-4">
            <div className="flex flex-col space-y-2">
              <div className="flex items-center space-x-2">
                <div className="flex-1">
                  <Input
                    placeholder="Enter a debug toolchain query (e.g., getFeatureVerificationStatus())"
                    value={queryText}
                    onChange={(e) => setQueryText(e.target.value)}
                    className="font-mono text-sm"
                  />
                </div>
                <Button 
                  onClick={executeQuery}
                  disabled={isLoading || !queryText.trim()}
                >
                  {isLoading ? (
                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <ArrowRight className="mr-2 h-4 w-4" />
                  )}
                  Execute
                </Button>
              </div>
              
              {error && (
                <div className="bg-red-50 border border-red-200 p-3 rounded-md text-red-800 text-sm">
                  <div className="flex items-start">
                    <AlertCircle className="h-5 w-5 mr-2 text-red-600 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium">Error Executing Query</p>
                      <p className="mt-1">{error}</p>
                    </div>
                  </div>
                </div>
              )}
              
              <div className="bg-slate-50 border rounded-md p-4">
                <div className="flex justify-between items-center mb-2">
                  <h3 className="font-medium text-slate-700">Result:</h3>
                  <Badge variant={queryResult ? "outline" : "secondary"}>
                    {queryResult ? "Data Available" : "No Data"}
                  </Badge>
                </div>
                <Separator className="mb-3" />
                <ScrollArea className="h-96 w-full rounded-md">
                  <pre className="text-sm font-mono whitespace-pre-wrap break-all">
                    {queryResult 
                      ? formatJsonForDisplay(queryResult)
                      : 'Execute a query to see results here'}
                  </pre>
                </ScrollArea>
              </div>
            </div>
          </TabsContent>
          
          {/* Query Library Tab */}
          <TabsContent value="library" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {savedQueries.map((item, index) => (
                <Card key={index} className="border-slate-200 bg-slate-50 hover:bg-slate-100 transition-colors cursor-pointer" onClick={() => loadSavedQuery(item.query)}>
                  <CardHeader className="py-3">
                    <CardTitle className="text-base flex items-center">
                      <Eye className="h-4 w-4 mr-2 text-slate-500" />
                      {item.name}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="py-0 pb-3">
                    <code className="text-xs text-slate-600 bg-slate-100 px-2 py-1 rounded font-mono block truncate">
                      {item.query}
                    </code>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
          
          {/* Documentation Tab */}
          <TabsContent value="docs" className="space-y-4">
            <Card className="border-slate-200">
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Debug Toolchain Functions</CardTitle>
                <CardDescription>
                  Available functions to use in your queries
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-80 w-full rounded-md">
                  <div className="space-y-4">
                    <div>
                      <h3 className="font-medium text-sm mb-2">Logger Functions</h3>
                      <ul className="text-sm space-y-1 pl-5 list-disc text-slate-700">
                        <li><code className="bg-slate-100 px-1 rounded">getFeatureVerificationStatus()</code> - Get the status of all features</li>
                        <li><code className="bg-slate-100 px-1 rounded">markFeatureImplemented(featureName, note)</code> - Mark a feature as implemented</li>
                        <li><code className="bg-slate-100 px-1 rounded">markFeatureTested(featureName, note)</code> - Mark a feature as tested</li>
                      </ul>
                    </div>
                    
                    <div>
                      <h3 className="font-medium text-sm mb-2">API Tester Functions</h3>
                      <ul className="text-sm space-y-1 pl-5 list-disc text-slate-700">
                        <li><code className="bg-slate-100 px-1 rounded">apiTester.getTestResults()</code> - Get all API test results</li>
                        <li><code className="bg-slate-100 px-1 rounded">apiTester.testEndpoint(...)</code> - Test a specific API endpoint</li>
                        <li><code className="bg-slate-100 px-1 rounded">apiTester.testAllEndpoints()</code> - Test all API endpoints</li>
                      </ul>
                    </div>
                    
                    <div>
                      <h3 className="font-medium text-sm mb-2">Feature Tester Functions</h3>
                      <ul className="text-sm space-y-1 pl-5 list-disc text-slate-700">
                        <li><code className="bg-slate-100 px-1 rounded">featureTester.getTestResults()</code> - Get all feature test results</li>
                        <li><code className="bg-slate-100 px-1 rounded">featureTester.getRegisteredTests()</code> - Get all registered tests</li>
                        <li><code className="bg-slate-100 px-1 rounded">featureTester.runFeatureTest(testId)</code> - Run a specific feature test</li>
                      </ul>
                    </div>
                    
                    <div>
                      <h3 className="font-medium text-sm mb-2">Debug Storage Functions</h3>
                      <ul className="text-sm space-y-1 pl-5 list-disc text-slate-700">
                        <li><code className="bg-slate-100 px-1 rounded">debugStorage.getLogEntries()</code> - Get all log entries</li>
                        <li><code className="bg-slate-100 px-1 rounded">debugStorage.getFeatureTestResults()</code> - Get feature test results from storage</li>
                        <li><code className="bg-slate-100 px-1 rounded">debugStorage.getApiTestResults()</code> - Get API test results from storage</li>
                      </ul>
                    </div>
                    
                    <div>
                      <h3 className="font-medium text-sm mb-2">Enhanced Logger Functions</h3>
                      <ul className="text-sm space-y-1 pl-5 list-disc text-slate-700">
                        <li><code className="bg-slate-100 px-1 rounded">createExecutionContext(feature, testId)</code> - Create a new execution context</li>
                        <li><code className="bg-slate-100 px-1 rounded">enhancedLogger.getContextsByFeature(feature)</code> - Get contexts for a feature</li>
                        <li><code className="bg-slate-100 px-1 rounded">enhancedLogger.getLogsByContext(contextId)</code> - Get logs for a context</li>
                      </ul>
                    </div>
                    
                    <div>
                      <h3 className="font-medium text-sm mb-2">Feature Test Service Functions</h3>
                      <ul className="text-sm space-y-1 pl-5 list-disc text-slate-700">
                        <li><code className="bg-slate-100 px-1 rounded">featureTestService.getEnhancedFeatures()</code> - Get enhanced feature statuses</li>
                        <li><code className="bg-slate-100 px-1 rounded">featureTestService.getFeatureTests()</code> - Get all feature tests</li>
                        <li><code className="bg-slate-100 px-1 rounded">featureTestService.getTestsForFeature(featureName)</code> - Get tests for a feature</li>
                      </ul>
                    </div>
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}