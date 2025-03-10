import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { 
  Terminal, 
  CheckCircle2, 
  AlertCircle, 
  Braces, 
  Database, 
  FileText, 
  ActivitySquare,
  BarChart4,
  LineChart,
  ChevronRight,
  ServerCog,
  Wrench,
  Bug
} from 'lucide-react';
import { FeatureTester } from '@/lib/featureTester';
import logger, { FeatureArea, LogLevel } from '@/lib/logger';
import apiTester from '@/lib/apiTester';
import * as debugStorage from '@/lib/debugStorage';
import { registerDebugTests } from '@/lib/tests/debug-components';
import { MarkdownViewer } from '@/components/debug/markdown-viewer';
import { FeatureStatusDashboard } from '@/components/debug/FeatureStatusDashboard';
import { EnhancedLogViewer } from '@/components/debug/enhanced-log-viewer';
import { EnhancedApiDashboard } from '@/components/debug/enhanced-api-dashboard';
import { ApiStateInspector } from '@/components/debug/api-state-inspector';
import { PerformanceMetricsPanel } from '@/components/debug/performance-metrics-panel';
import { Separator } from '@/components/ui/separator';

// Debug logs
interface LogEntry {
  level: LogLevel;
  area: FeatureArea;
  message: string;
  timestamp: Date;
  data?: any;
}

const DebugPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState('unified-dashboard');
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
    
    // Also add to persistent storage
    debugStorage.addLogEntry(level, area, String(message), data);
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
  
  // Initialize log interception, load persisted logs, and register debug tests
  React.useEffect(() => {
    interceptLogs();
    loadPersistedLogs();
    
    // Register the debug component tests
    if (typeof registerDebugTests === 'function') {
      registerDebugTests();
      
      // Log that debug tests are registered
      logger.info(FeatureArea.UI, 'Debug component tests registered and implementation marked');
    }
  }, []);
  
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="space-y-2">
        <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-400 via-cyan-500 to-indigo-500 bg-clip-text text-transparent">
          Advanced Debug Console
        </h2>
        <p className="text-gray-400">
          Comprehensive toolset for monitoring, testing, and debugging the application
        </p>
      </div>
      
      {/* Debug Interface */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-6 w-full">
          <TabsTrigger value="unified-dashboard">
            <ActivitySquare className="h-4 w-4 mr-2" />
            Feature Dashboard
          </TabsTrigger>
          <TabsTrigger value="logs">
            <Terminal className="h-4 w-4 mr-2" />
            Logs
          </TabsTrigger>
          <TabsTrigger value="api-dashboard">
            <Database className="h-4 w-4 mr-2" />
            API Tests
          </TabsTrigger>
          <TabsTrigger value="api-state">
            <ServerCog className="h-4 w-4 mr-2" />
            API State
          </TabsTrigger>
          <TabsTrigger value="performance">
            <BarChart4 className="h-4 w-4 mr-2" />
            Performance
          </TabsTrigger>
          <TabsTrigger value="docs">
            <FileText className="h-4 w-4 mr-2" />
            Documentation
          </TabsTrigger>
        </TabsList>
        
        {/* Unified Feature Dashboard - combines feature status and testing */}
        <TabsContent value="unified-dashboard" className="mt-4">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle className="text-xl">
                  <CheckCircle2 className="h-5 w-5 inline mr-2 text-green-500" />
                  Unified Feature Dashboard
                </CardTitle>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => {
                    // This button will be visible to run all tests directly from the dashboard view
                    logger.info(FeatureArea.UI, "Initiated running all tests from unified dashboard");
                  }}
                >
                  Run All Tests
                </Button>
              </div>
              <CardDescription>
                Monitor implementation status and run tests for all application features
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Feature Status Dashboard */}
              <div className="mb-6">
                <FeatureStatusDashboard />
              </div>
              
              {/* Feature Tests section */}
              <div>
                <h3 className="text-lg font-semibold mb-3 flex items-center">
                  <CheckCircle2 className="h-4 w-4 mr-2 text-green-500" />
                  Feature Tests
                </h3>
                <p className="text-gray-500 text-sm mb-4">
                  Run tests to verify implementation and update feature status
                </p>
                
                <FeatureTester />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Enhanced Log Viewer */}
        <TabsContent value="logs" className="mt-4">
          <EnhancedLogViewer />
        </TabsContent>
        
        {/* Enhanced API Dashboard */}
        <TabsContent value="api-dashboard" className="mt-4">
          <EnhancedApiDashboard />
        </TabsContent>
        
        {/* API State Inspector */}
        <TabsContent value="api-state" className="mt-4">
          <ApiStateInspector />
        </TabsContent>
        
        {/* Performance Metrics */}
        <TabsContent value="performance" className="mt-4">
          <PerformanceMetricsPanel />
        </TabsContent>
        
        {/* Documentation Tab */}
        <TabsContent value="docs" className="mt-4">
          <MarkdownViewer />
        </TabsContent>
      </Tabs>
      
      {/* Legacy Debug Interface - Kept for compatibility */}
      <div className="mt-8 pt-8 space-y-6">
        <Separator />
        
        <div className="flex justify-between items-center">
          <h3 className="text-xl font-semibold text-gray-300">Legacy Debug Tools</h3>
          <Button variant="ghost" size="sm" onClick={() => setActiveTab('unified-dashboard')}>
            <ChevronRight className="h-4 w-4 mr-2" />
            Access Feature Dashboard
          </Button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="bg-slate-900/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Console Logs</CardTitle>
              <CardDescription>View application logs in the enhanced viewer</CardDescription>
            </CardHeader>
            <CardContent>
              <Button 
                className="w-full"
                variant="outline"
                onClick={() => setActiveTab('logs')}
              >
                <Terminal className="h-4 w-4 mr-2" />
                Open Log Viewer
              </Button>
            </CardContent>
          </Card>
          
          <Card className="bg-slate-900/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">API Testing</CardTitle>
              <CardDescription>Test API endpoints with advanced dashboard</CardDescription>
            </CardHeader>
            <CardContent>
              <Button 
                className="w-full"
                variant="outline"
                onClick={() => setActiveTab('api-dashboard')}
              >
                <Database className="h-4 w-4 mr-2" />
                Open API Dashboard
              </Button>
            </CardContent>
          </Card>
          
          <Card className="bg-slate-900/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">API State Inspector</CardTitle>
              <CardDescription>View real-time application state from API endpoints</CardDescription>
            </CardHeader>
            <CardContent>
              <Button 
                className="w-full"
                variant="outline"
                onClick={() => setActiveTab('api-state')}
              >
                <ServerCog className="h-4 w-4 mr-2" />
                Open State Inspector
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default DebugPage;