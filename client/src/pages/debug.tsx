import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Terminal, CheckCircle2, AlertCircle, Braces, Database, FileText } from 'lucide-react';
import { FeatureTester } from '@/lib/featureTester';
import logger, { FeatureArea, LogLevel } from '@/lib/logger';
import apiTester from '@/lib/apiTester';
import * as debugStorage from '@/lib/debugStorage';
import { MarkdownViewer } from '@/components/debug/markdown-viewer';

// Debug logs
interface LogEntry {
  level: LogLevel;
  area: FeatureArea;
  message: string;
  timestamp: Date;
  data?: any;
}

const DebugPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState('feature-tests');
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [apiTestReport, setApiTestReport] = useState<string>('');
  const [isApiTesting, setIsApiTesting] = useState(false);
  
  // Intercept logs for display
  const interceptLogs = () => {
    // Store original console methods
    const originalConsole = {
      log: console.log,
      info: console.info,
      warn: console.warn,
      error: console.error,
      debug: console.debug,
    };
    
    // Override console methods
    console.log = (...args: any[]) => {
      originalConsole.log(...args);
      addLog(LogLevel.INFO, FeatureArea.UI, args[0], args.slice(1));
    };
    
    console.info = (...args: any[]) => {
      originalConsole.info(...args);
      addLog(LogLevel.INFO, FeatureArea.UI, args[0], args.slice(1));
    };
    
    console.warn = (...args: any[]) => {
      originalConsole.warn(...args);
      addLog(LogLevel.WARN, FeatureArea.UI, args[0], args.slice(1));
    };
    
    console.error = (...args: any[]) => {
      originalConsole.error(...args);
      addLog(LogLevel.ERROR, FeatureArea.UI, args[0], args.slice(1));
    };
    
    console.debug = (...args: any[]) => {
      originalConsole.debug(...args);
      addLog(LogLevel.DEBUG, FeatureArea.UI, args[0], args.slice(1));
    };
    
    // Configure logger to intercept logs
    logger.configureLogger({
      enableConsole: true,
      minLevel: LogLevel.DEBUG,
      enabledAreas: 'all',
    });
    
    // Add a test log
    logger.info(FeatureArea.UI, 'Debug console initialized');
  };
  
  // Add a log entry
  const addLog = (level: LogLevel, area: FeatureArea, message: string, data?: any) => {
    setLogs(prevLogs => [
      {
        level,
        area,
        message: String(message),
        timestamp: new Date(),
        data,
      },
      ...prevLogs.slice(0, 999), // Keep last 1000 logs
    ]);
  };
  
  // Clear logs
  const clearLogs = () => {
    setLogs([]);
    debugStorage.clearLogs();
    logger.info(FeatureArea.UI, 'Debug console cleared');
  };
  
  // Load persisted logs
  const loadPersistedLogs = () => {
    const storedLogs = debugStorage.getLogEntries();
    if (storedLogs && storedLogs.length > 0) {
      // Convert timestamp strings to Date objects
      const processedLogs = storedLogs.map(log => ({
        ...log,
        // Ensure timestamp is a Date object
        timestamp: log.timestamp instanceof Date ? log.timestamp : new Date(log.timestamp)
      }));
      
      setLogs(processedLogs);
      logger.info(FeatureArea.UI, `Loaded ${storedLogs.length} log entries from storage`);
    } else {
      logger.info(FeatureArea.UI, 'No persisted logs found');
    }
  };
  
  // Run API tests
  const runApiTests = async () => {
    setIsApiTesting(true);
    try {
      logger.info(FeatureArea.API, 'Starting API tests');
      await apiTester.testAllEndpoints();
      // Optionally test goal lifecycle
      await apiTester.testGoalLifecycle();
      const report = apiTester.generateTestReport();
      setApiTestReport(report);
      logger.info(FeatureArea.API, 'API tests completed');
    } catch (error) {
      logger.error(FeatureArea.API, 'Error running API tests', error);
    } finally {
      setIsApiTesting(false);
    }
  };
  
  // Clear API test results
  const clearApiTestResults = () => {
    debugStorage.clearApiTestResults();
    setApiTestReport('');
    logger.info(FeatureArea.API, 'API test results cleared');
  };
  
  // Load saved API test results
  const loadApiTestResults = () => {
    const apiTests = debugStorage.getApiTestResults();
    if (apiTests && apiTests.length > 0) {
      // Simulate a report from the saved tests
      const successCount = apiTests.filter(r => r.success).length;
      const failCount = apiTests.length - successCount;
      const successRate = apiTests.length > 0 
        ? (successCount / apiTests.length * 100).toFixed(2) 
        : 'N/A';
      
      let report = `# API Test Report (Loaded from Storage)\n\n`;
      report += `Generated: ${new Date().toLocaleString()}\n\n`;
      report += `## Summary\n\n`;
      report += `- Total tests: ${apiTests.length}\n`;
      report += `- Successful: ${successCount}\n`;
      report += `- Failed: ${failCount}\n`;
      report += `- Success rate: ${successRate}%\n\n`;
      report += `## Test Results\n\n`;
      
      report += `| Endpoint | Method | Status | Success | Duration (ms) |\n`;
      report += `|----------|--------|--------|---------|---------------|\n`;
      
      apiTests.forEach(result => {
        report += `| ${result.endpoint} | ${result.method} | ${result.status} | ${result.success ? '✓' : '✗'} | ${result.duration.toFixed(2)} |\n`;
      });
      
      setApiTestReport(report);
      logger.info(FeatureArea.API, `Loaded ${apiTests.length} API test results from storage`);
    } else {
      logger.info(FeatureArea.API, 'No API test results found in storage');
    }
  };
  
  // Initialize log interception and load persisted logs on first render
  React.useEffect(() => {
    interceptLogs();
    loadPersistedLogs();
  }, []);
  
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="space-y-2">
        <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-100 to-gray-100 bg-clip-text text-transparent">
          Debug Console
        </h2>
        <p className="text-gray-400">
          Test, verify, and debug application features
        </p>
      </div>
      
      {/* Debug Interface */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-4 w-full max-w-md">
          <TabsTrigger value="feature-tests">
            <CheckCircle2 className="h-4 w-4 mr-2" />
            Feature Tests
          </TabsTrigger>
          <TabsTrigger value="api-tests">
            <Database className="h-4 w-4 mr-2" />
            API Tests
          </TabsTrigger>
          <TabsTrigger value="console">
            <Terminal className="h-4 w-4 mr-2" />
            Console
          </TabsTrigger>
          <TabsTrigger value="docs">
            <FileText className="h-4 w-4 mr-2" />
            Docs
          </TabsTrigger>
        </TabsList>
        
        {/* Feature Tests Tab */}
        <TabsContent value="feature-tests" className="mt-4">
          <FeatureTester />
        </TabsContent>
        
        {/* API Tests Tab */}
        <TabsContent value="api-tests" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>API Endpoint Tests</CardTitle>
              <CardDescription>
                Test and verify the application's API endpoints
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex space-x-2">
                  <Button 
                    onClick={runApiTests} 
                    disabled={isApiTesting}
                  >
                    {isApiTesting ? 'Running Tests...' : 'Run API Tests'}
                  </Button>
                  
                  <Button 
                    variant="outline"
                    onClick={loadApiTestResults}
                    disabled={isApiTesting}
                  >
                    Load Saved Results
                  </Button>
                  
                  <Button 
                    variant="outline"
                    onClick={clearApiTestResults}
                    disabled={isApiTesting}
                  >
                    Clear Results
                  </Button>
                </div>
                
                {apiTestReport && (
                  <div className="mt-4">
                    <ScrollArea className="h-[400px] w-full rounded-md border p-4 bg-gray-900">
                      <pre className="text-sm text-gray-300 whitespace-pre-wrap">
                        {apiTestReport}
                      </pre>
                    </ScrollArea>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Console Tab */}
        <TabsContent value="console" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Debug Console</CardTitle>
              <CardDescription>
                View application logs and debug information
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <div className="text-sm text-gray-400">
                    Displaying {logs.length} log entries
                  </div>
                  <div className="flex space-x-2">
                    <Button variant="outline" size="sm" onClick={loadPersistedLogs}>
                      Load Saved Logs
                    </Button>
                    <Button variant="outline" size="sm" onClick={clearLogs}>
                      Clear Logs
                    </Button>
                  </div>
                </div>
                
                <ScrollArea className="h-[500px] w-full rounded-md border">
                  <div className="p-2 space-y-2">
                    {logs.length === 0 ? (
                      <div className="flex items-center justify-center h-20 text-gray-500">
                        No logs to display
                      </div>
                    ) : (
                      logs.map((log, index) => (
                        <Alert
                          key={index}
                          variant={
                            log.level === LogLevel.ERROR ? "destructive" :
                            log.level === LogLevel.WARN ? "default" :
                            log.level === LogLevel.INFO ? "default" :
                            null
                          }
                        >
                          <div className="flex items-center">
                            {log.level === LogLevel.ERROR ? (
                              <AlertCircle className="h-4 w-4 mr-2" />
                            ) : log.level === LogLevel.DEBUG ? (
                              <Braces className="h-4 w-4 mr-2" />
                            ) : (
                              <Terminal className="h-4 w-4 mr-2" />
                            )}
                            <AlertTitle className="text-sm">
                              {LogLevel[log.level]} | {log.area} | {log.timestamp.toLocaleTimeString()}
                            </AlertTitle>
                          </div>
                          <AlertDescription className="text-sm mt-1 font-mono">
                            {log.message}
                            {log.data && (
                              <div className="mt-1 text-xs">
                                {typeof log.data === 'object' 
                                  ? JSON.stringify(log.data, null, 2)
                                  : String(log.data)
                                }
                              </div>
                            )}
                          </AlertDescription>
                        </Alert>
                      ))
                    )}
                  </div>
                </ScrollArea>
              </div>
            </CardContent>
            <CardFooter>
              <div className="text-xs text-gray-500">
                The console displays logs from both the application and testing utilities
              </div>
            </CardFooter>
          </Card>
        </TabsContent>
        
        {/* Documentation Tab */}
        <TabsContent value="docs" className="mt-4">
          <MarkdownViewer />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default DebugPage;