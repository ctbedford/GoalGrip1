import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Progress } from '@/components/ui/progress';
import { 
  CheckCircle2, 
  XCircle, 
  Info, 
  Calendar, 
  FileText, 
  Code, 
  Activity, 
  Terminal, 
  Play,
  ChevronRight,
  Circle,
  AlertCircle
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { FeatureArea, LogLevel } from '@/lib/logger';
import { TestStatus } from '@/lib/featureTester';
import { getTestResults, runFeatureTest, getRegisteredTests } from '@/lib/featureTester';
import * as debugStorage from '@/lib/debugStorage';
import { useFeatureContext } from './UnifiedDebugDashboard';

export interface FeatureStatus {
  name: string;
  implemented: boolean;
  tested: boolean;
  lastVerified: Date | null;
  notes: string[];
  area?: FeatureArea;
}

export interface FeatureTest {
  id: string;
  name: string;
  description: string;
  area: FeatureArea;
  dependencies?: string[];
  status?: TestStatus;
  error?: string;
  duration?: number;
  timestamp?: Date;
}

interface FeatureDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function FeatureDetailModal({ isOpen, onClose }: FeatureDetailModalProps) {
  const { selectedFeature } = useFeatureContext();
  const [activeTab, setActiveTab] = useState('overview');
  const [isRunningTests, setIsRunningTests] = useState(false);
  const [featureTests, setFeatureTests] = useState<FeatureTest[]>([]);
  const [testResults, setTestResults] = useState<Record<string, any>>({});
  
  // Get logs specific to this feature
  const featureLogs = React.useMemo(() => {
    if (!selectedFeature) return [];
    
    // Get logs from storage filtered by feature area
    const allLogs = debugStorage.getLogEntries({
      area: selectedFeature.area
    });
    
    // Also include logs that mention this feature in the message
    const featureName = selectedFeature.name.toLowerCase();
    const relevantLogs = debugStorage.getLogEntries().filter(log => 
      log.message.toLowerCase().includes(featureName) || 
      (log.data && JSON.stringify(log.data).toLowerCase().includes(featureName))
    );
    
    // Combine, deduplicate by timestamp, and sort
    const combinedLogs = [...allLogs, ...relevantLogs];
    const uniqueLogs = combinedLogs.filter((log, index, self) => 
      index === self.findIndex(l => l.timestamp.getTime() === log.timestamp.getTime())
    );
    
    return uniqueLogs.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }, [selectedFeature]);
  
  // Get tests specific to this feature
  React.useEffect(() => {
    if (!selectedFeature) return;
    
    // Get all registered tests
    const allTests = getRegisteredTests();
    
    // Filter tests related to this feature
    const matchingTests = allTests.filter(test => {
      // Match by area
      if (test.area === selectedFeature.area) return true;
      
      // Match by name similarity
      const featureName = selectedFeature.name.toLowerCase();
      const testName = test.name.toLowerCase();
      const testDesc = test.description.toLowerCase();
      
      return testName.includes(featureName) || 
             featureName.includes(testName) ||
             testDesc.includes(featureName);
    });
    
    // Get the test results to show current status
    const results = getTestResults();
    setTestResults(results);
    
    // Add status to tests from results
    const testsWithStatus = matchingTests.map(test => {
      const result = results[test.id];
      if (result) {
        return {
          ...test,
          status: result.status,
          error: result.error,
          duration: result.duration,
          timestamp: result.timestamp
        };
      }
      return {
        ...test,
        status: TestStatus.NOT_STARTED
      };
    });
    
    setFeatureTests(testsWithStatus);
  }, [selectedFeature]);
  
  // Function to run a specific test
  const runTest = async (testId: string) => {
    if (!selectedFeature || isRunningTests) return;
    
    setIsRunningTests(true);
    
    try {
      // Log that we're running a test
      debugStorage.addLogEntry(
        LogLevel.INFO,
        selectedFeature.area || FeatureArea.UI,
        `Running test for feature: ${selectedFeature.name}`,
        { testId, feature: selectedFeature.name }
      );
      
      // Run the test
      const result = await runFeatureTest(testId);
      
      // Update the test results
      setTestResults(prev => ({
        ...prev,
        [testId]: result
      }));
      
      // Update the feature tests with new status
      setFeatureTests(prev => 
        prev.map(test => 
          test.id === testId ? {
            ...test,
            status: result.status,
            error: result.error,
            duration: result.duration,
            timestamp: result.timestamp
          } : test
        )
      );
      
      // Log the result
      debugStorage.addLogEntry(
        result.status === TestStatus.PASSED ? LogLevel.INFO : LogLevel.ERROR,
        selectedFeature.area || FeatureArea.UI,
        `Test ${result.status === TestStatus.PASSED ? 'passed' : 'failed'}: ${result.name}`,
        { 
          testId, 
          feature: selectedFeature.name,
          status: result.status,
          duration: result.duration,
          error: result.error
        }
      );
    } catch (error) {
      // Log any errors
      debugStorage.addLogEntry(
        LogLevel.ERROR,
        selectedFeature.area || FeatureArea.UI,
        `Error running test for feature: ${selectedFeature.name}`,
        { testId, feature: selectedFeature.name, error }
      );
    } finally {
      setIsRunningTests(false);
    }
  };
  
  // Run all tests for this feature
  const runAllTests = async () => {
    if (!selectedFeature || isRunningTests || featureTests.length === 0) return;
    
    setIsRunningTests(true);
    
    try {
      // Log that we're running all tests
      debugStorage.addLogEntry(
        LogLevel.INFO,
        selectedFeature.area || FeatureArea.UI,
        `Running all tests for feature: ${selectedFeature.name}`,
        { feature: selectedFeature.name, testCount: featureTests.length }
      );
      
      // Run each test sequentially
      for (const test of featureTests) {
        // Log that we're running this specific test
        debugStorage.addLogEntry(
          LogLevel.INFO,
          selectedFeature.area || FeatureArea.UI,
          `Running test: ${test.name}`,
          { testId: test.id, feature: selectedFeature.name }
        );
        
        // Run the test
        const result = await runFeatureTest(test.id);
        
        // Update the test results
        setTestResults(prev => ({
          ...prev,
          [test.id]: result
        }));
        
        // Update the feature tests with new status
        setFeatureTests(prev => 
          prev.map(t => 
            t.id === test.id ? {
              ...t,
              status: result.status,
              error: result.error,
              duration: result.duration,
              timestamp: result.timestamp
            } : t
          )
        );
        
        // Log the result
        debugStorage.addLogEntry(
          result.status === TestStatus.PASSED ? LogLevel.INFO : LogLevel.ERROR,
          selectedFeature.area || FeatureArea.UI,
          `Test ${result.status === TestStatus.PASSED ? 'passed' : 'failed'}: ${result.name}`,
          { 
            testId: test.id, 
            feature: selectedFeature.name,
            status: result.status,
            duration: result.duration,
            error: result.error
          }
        );
      }
      
      // Log completion
      debugStorage.addLogEntry(
        LogLevel.INFO,
        selectedFeature.area || FeatureArea.UI,
        `Completed running all tests for feature: ${selectedFeature.name}`,
        { 
          feature: selectedFeature.name, 
          testCount: featureTests.length,
          passedCount: featureTests.filter(t => 
            testResults[t.id]?.status === TestStatus.PASSED
          ).length
        }
      );
    } catch (error) {
      // Log any errors
      debugStorage.addLogEntry(
        LogLevel.ERROR,
        selectedFeature.area || FeatureArea.UI,
        `Error running tests for feature: ${selectedFeature.name}`,
        { feature: selectedFeature.name, error }
      );
    } finally {
      setIsRunningTests(false);
    }
  };
  
  // If no feature is selected, don't render anything
  if (!selectedFeature) return null;
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center text-xl">
            <span className="flex items-center space-x-2">
              {selectedFeature.implemented ? (
                <CheckCircle2 className="h-5 w-5 text-green-500 mr-2" />
              ) : (
                <XCircle className="h-5 w-5 text-red-500 mr-2" />
              )}
              <span>{selectedFeature.name}</span>
            </span>
          </DialogTitle>
          <DialogDescription>
            Detailed information about this feature, including implementation, tests, and logs
          </DialogDescription>
        </DialogHeader>
        
        <Tabs defaultValue="overview" value={activeTab} onValueChange={setActiveTab} className="flex-1 overflow-hidden flex flex-col">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="implementation">Implementation</TabsTrigger>
            <TabsTrigger value="tests">Tests</TabsTrigger>
            <TabsTrigger value="run-test">Run Tests</TabsTrigger>
            <TabsTrigger value="logs">Logs</TabsTrigger>
          </TabsList>
          
          <div className="flex-1 overflow-auto">
            {/* Overview Tab */}
            <TabsContent value="overview" className="p-4 h-full">
              <div className="grid grid-cols-2 gap-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Status</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-col space-y-2">
                      <div className="flex justify-between items-center">
                        <span>Implementation</span>
                        {selectedFeature.implemented ? (
                          <Badge variant="default" className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                            <CheckCircle2 className="h-3 w-3 mr-1" /> Complete
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-red-800 dark:text-red-400">
                            <XCircle className="h-3 w-3 mr-1" /> Not Started
                          </Badge>
                        )}
                      </div>
                      <div className="flex justify-between items-center">
                        <span>Testing</span>
                        {selectedFeature.tested ? (
                          <Badge variant="default" className="bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400">
                            <CheckCircle2 className="h-3 w-3 mr-1" /> Complete
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-red-800 dark:text-red-400">
                            <XCircle className="h-3 w-3 mr-1" /> Not Started
                          </Badge>
                        )}
                      </div>
                      {selectedFeature.lastVerified && (
                        <div className="flex justify-between items-center">
                          <span>Last Updated</span>
                          <Badge variant="outline">
                            <Calendar className="h-3 w-3 mr-1" />
                            {new Date(selectedFeature.lastVerified).toLocaleDateString()}
                          </Badge>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Area</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center space-x-2">
                      <Badge variant="outline" className="text-lg py-2 px-4">
                        {selectedFeature.area || 'Unknown'}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              </div>
              
              {selectedFeature.notes && selectedFeature.notes.length > 0 && (
                <Card className="mt-4">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Implementation Notes</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {selectedFeature.notes.map((note, i) => (
                        <li key={i} className="flex items-start">
                          <ChevronRight className="h-4 w-4 mr-2 mt-0.5 text-gray-500 shrink-0" />
                          <span>{note}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              )}
              
              <div className="mt-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Test Status</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {featureTests.length > 0 ? (
                      <div className="space-y-4">
                        <div className="flex flex-col space-y-2">
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-500">Tests Available</span>
                            <span className="font-medium">{featureTests.length}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-500">Tests Passed</span>
                            <span className="font-medium text-green-600 dark:text-green-400">
                              {featureTests.filter(t => t.status === TestStatus.PASSED).length}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-500">Tests Failed</span>
                            <span className="font-medium text-red-600 dark:text-red-400">
                              {featureTests.filter(t => t.status === TestStatus.FAILED).length}
                            </span>
                          </div>
                        </div>
                        
                        <div className="mt-2">
                          <div className="text-sm text-gray-500 mb-1">Test Coverage</div>
                          <Progress 
                            value={(featureTests.filter(t => 
                              t.status === TestStatus.PASSED || t.status === TestStatus.FAILED
                            ).length / featureTests.length) * 100} 
                            className="h-2"
                          />
                        </div>
                        
                        <Button 
                          size="sm" 
                          className="w-full mt-2" 
                          onClick={() => setActiveTab('run-test')}
                        >
                          <Play className="h-4 w-4 mr-2" /> Run Tests
                        </Button>
                      </div>
                    ) : (
                      <div className="text-center p-4 text-gray-500">
                        <p>No tests found for this feature</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
            
            {/* Implementation Tab */}
            <TabsContent value="implementation" className="p-4 h-full">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Code className="h-5 w-5 mr-2" />
                    Implementation Details
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {selectedFeature.implemented ? (
                    <>
                      <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded-md">
                        <div className="flex items-center">
                          <CheckCircle2 className="h-5 w-5 text-green-500 dark:text-green-400 mr-2" />
                          <span className="font-medium text-green-800 dark:text-green-300">Feature successfully implemented</span>
                        </div>
                        {selectedFeature.lastVerified && (
                          <div className="mt-1 pl-7 text-sm text-green-800/70 dark:text-green-300/70">
                            Implemented on {new Date(selectedFeature.lastVerified).toLocaleDateString()} at {new Date(selectedFeature.lastVerified).toLocaleTimeString()}
                          </div>
                        )}
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                        <div className="space-y-2 border p-3 rounded-md">
                          <h4 className="font-semibold flex items-center">
                            <Calendar className="h-4 w-4 mr-2 text-blue-500" />
                            Implementation Timeline
                          </h4>
                          <div className="space-y-2">
                            <div className="flex justify-between items-center">
                              <span className="text-sm text-gray-500">Status:</span>
                              <Badge variant="default" className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                                Implemented
                              </Badge>
                            </div>
                            
                            <div className="flex justify-between items-center">
                              <span className="text-sm text-gray-500">Last Updated:</span>
                              <span className="text-sm">
                                {selectedFeature.lastVerified 
                                  ? new Date(selectedFeature.lastVerified).toLocaleDateString() 
                                  : 'Not recorded'}
                              </span>
                            </div>
                            
                            <div className="flex justify-between items-center">
                              <span className="text-sm text-gray-500">Testing Status:</span>
                              <Badge variant={selectedFeature.tested ? "default" : "outline"} className={selectedFeature.tested ? "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400" : ""}>
                                {selectedFeature.tested ? "Tested" : "Untested"}
                              </Badge>
                            </div>
                          </div>
                        </div>
                        
                        <div className="space-y-2 border p-3 rounded-md">
                          <h4 className="font-semibold flex items-center">
                            <Activity className="h-4 w-4 mr-2 text-blue-500" />
                            Feature Classification
                          </h4>
                          <div className="space-y-2">
                            <div className="flex justify-between items-center">
                              <span className="text-sm text-gray-500">Area:</span>
                              <Badge className="capitalize bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 hover:bg-blue-100">
                                {selectedFeature.area || "Unknown"}
                              </Badge>
                            </div>
                          </div>
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="bg-amber-50 dark:bg-amber-900/20 p-4 rounded-md">
                      <div className="flex items-center">
                        <AlertCircle className="h-5 w-5 text-amber-500 dark:text-amber-400 mr-2" />
                        <span className="font-medium text-amber-800 dark:text-amber-300">Feature not yet implemented</span>
                      </div>
                      <p className="mt-2 text-amber-700 dark:text-amber-400 text-sm">
                        This feature is recorded in the system but has not been marked as implemented yet.
                        Implementation status will be updated once the feature is developed and verified.
                      </p>
                    </div>
                  )}
                  
                  {selectedFeature.notes && selectedFeature.notes.length > 0 && (
                    <div className="mt-4">
                      <h4 className="font-semibold mb-2">Implementation Notes</h4>
                      <ul className="space-y-2 pl-5 list-disc">
                        {selectedFeature.notes.map((note, idx) => (
                          <li key={idx}>{note}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
            
            {/* Tests Tab */}
            <TabsContent value="tests" className="p-4 h-full">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <FileText className="h-5 w-5 mr-2" />
                    Test Results
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {featureTests.length > 0 ? (
                    <div className="space-y-4">
                      <div className="grid grid-cols-3 gap-4">
                        <Card className="bg-gray-50 dark:bg-gray-800">
                          <CardContent className="p-4">
                            <div className="flex justify-between items-center">
                              <div>
                                <div className="text-sm font-medium text-gray-500 dark:text-gray-400">Tests</div>
                                <div className="text-2xl font-bold">{featureTests.length}</div>
                              </div>
                              <div className="h-10 w-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                                <FileText className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                        
                        <Card className="bg-gray-50 dark:bg-gray-800">
                          <CardContent className="p-4">
                            <div className="flex justify-between items-center">
                              <div>
                                <div className="text-sm font-medium text-gray-500 dark:text-gray-400">Passed</div>
                                <div className="text-2xl font-bold">
                                  {featureTests.filter(t => t.status === TestStatus.PASSED).length}
                                </div>
                              </div>
                              <div className="h-10 w-10 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                                <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                        
                        <Card className="bg-gray-50 dark:bg-gray-800">
                          <CardContent className="p-4">
                            <div className="flex justify-between items-center">
                              <div>
                                <div className="text-sm font-medium text-gray-500 dark:text-gray-400">Failed</div>
                                <div className="text-2xl font-bold">
                                  {featureTests.filter(t => t.status === TestStatus.FAILED).length}
                                </div>
                              </div>
                              <div className="h-10 w-10 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                                <XCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </div>
                      
                      <ScrollArea className="h-[300px] rounded-md border p-4">
                        <div className="space-y-4">
                          {featureTests.map((test, idx) => (
                            <div 
                              key={idx}
                              className={cn(
                                "p-4 rounded-md border",
                                test.status === TestStatus.PASSED && "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-900",
                                test.status === TestStatus.FAILED && "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-900",
                                (test.status === TestStatus.NOT_STARTED || !test.status) && "bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700"
                              )}
                            >
                              <div className="flex justify-between items-start mb-2">
                                <div>
                                  <h4 className="font-medium flex items-center">
                                    {test.status === TestStatus.PASSED && <CheckCircle2 className="h-4 w-4 text-green-500 mr-2" />}
                                    {test.status === TestStatus.FAILED && <XCircle className="h-4 w-4 text-red-500 mr-2" />}
                                    {(test.status === TestStatus.NOT_STARTED || !test.status) && <Circle className="h-4 w-4 text-gray-300 mr-2" />}
                                    {test.name}
                                  </h4>
                                  <p className="text-sm text-gray-500 mt-1">{test.description}</p>
                                </div>
                                <Badge variant={
                                  test.status === TestStatus.PASSED ? "default" : 
                                  test.status === TestStatus.FAILED ? "destructive" : 
                                  "outline"
                                } className={
                                  test.status === TestStatus.PASSED ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400" : ""
                                }>
                                  {test.status || "Not Run"}
                                </Badge>
                              </div>
                              
                              {test.timestamp && (
                                <div className="flex justify-between text-xs text-gray-500 mt-2">
                                  <span>Last run: {new Date(test.timestamp).toLocaleString()}</span>
                                  {test.duration !== undefined && (
                                    <span>Duration: {test.duration.toFixed(2)}ms</span>
                                  )}
                                </div>
                              )}
                              
                              {test.error && (
                                <div className="mt-2 p-2 bg-red-50 dark:bg-red-900/30 text-red-800 dark:text-red-300 text-sm rounded-md">
                                  {test.error}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </ScrollArea>
                      
                      <div className="flex justify-end">
                        <Button 
                          onClick={() => setActiveTab('run-test')}
                          className="flex items-center"
                        >
                          <Play className="h-4 w-4 mr-2" />
                          Run Tests
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center p-8 text-gray-500">
                      <p>No tests found for this feature</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
            
            {/* Run Tests Tab */}
            <TabsContent value="run-test" className="p-4 h-full">
              <Card>
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <CardTitle className="flex items-center">
                      <Play className="h-5 w-5 mr-2" />
                      Run Tests
                    </CardTitle>
                    {featureTests.length > 0 && (
                      <Button 
                        onClick={runAllTests} 
                        disabled={isRunningTests}
                        className="flex items-center"
                      >
                        <Play className="h-4 w-4 mr-2" />
                        Run All Tests
                      </Button>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  {featureTests.length > 0 ? (
                    <div className="space-y-4">
                      <ScrollArea className="h-[400px] rounded-md border p-4">
                        <div className="space-y-4">
                          {featureTests.map((test, idx) => (
                            <div 
                              key={idx}
                              className={cn(
                                "p-4 rounded-md border",
                                test.status === TestStatus.PASSED && "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-900",
                                test.status === TestStatus.FAILED && "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-900",
                                (test.status === TestStatus.NOT_STARTED || !test.status) && "bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700"
                              )}
                            >
                              <div className="flex justify-between items-start">
                                <div>
                                  <h4 className="font-medium flex items-center">
                                    {test.status === TestStatus.PASSED && <CheckCircle2 className="h-4 w-4 text-green-500 mr-2" />}
                                    {test.status === TestStatus.FAILED && <XCircle className="h-4 w-4 text-red-500 mr-2" />}
                                    {(test.status === TestStatus.NOT_STARTED || !test.status) && <Circle className="h-4 w-4 text-gray-300 mr-2" />}
                                    {test.name}
                                  </h4>
                                  <p className="text-sm text-gray-500 mt-1">{test.description}</p>
                                  {test.timestamp && (
                                    <div className="text-xs text-gray-500 mt-1">
                                      Last run: {new Date(test.timestamp).toLocaleString()}
                                      {test.duration !== undefined && (
                                        <span className="ml-2">Duration: {test.duration.toFixed(2)}ms</span>
                                      )}
                                    </div>
                                  )}
                                </div>
                                <Button 
                                  size="sm" 
                                  onClick={() => runTest(test.id)}
                                  disabled={isRunningTests}
                                >
                                  Run Test
                                </Button>
                              </div>
                              
                              {test.error && (
                                <div className="mt-2 p-2 bg-red-50 dark:bg-red-900/30 text-red-800 dark:text-red-300 text-sm rounded-md">
                                  {test.error}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </ScrollArea>
                    </div>
                  ) : (
                    <div className="text-center p-8 text-gray-500">
                      <p>No tests found for this feature</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
            
            {/* Logs Tab */}
            <TabsContent value="logs" className="p-4 h-full">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Terminal className="h-5 w-5 mr-2" />
                    Feature Logs
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {featureLogs.length === 0 ? (
                      <div className="text-center p-8 text-gray-500">
                        <p>No logs found for this feature</p>
                      </div>
                    ) : (
                      <ScrollArea className="h-[400px] rounded-md border p-4">
                        <div className="space-y-2">
                          {featureLogs.map((log, idx) => (
                            <div 
                              key={idx}
                              className={cn(
                                "p-2 rounded-md text-sm",
                                log.level === LogLevel.ERROR && "bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-300",
                                log.level === LogLevel.WARN && "bg-yellow-50 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-300",
                                log.level === LogLevel.INFO && "bg-blue-50 dark:bg-blue-900/20 text-blue-800 dark:text-blue-300",
                                log.level === LogLevel.DEBUG && "bg-gray-50 dark:bg-gray-800 text-gray-800 dark:text-gray-300"
                              )}
                            >
                              <div className="flex justify-between items-start mb-1">
                                <span className="font-medium">{log.area}</span>
                                <span className="text-xs opacity-70">{log.timestamp.toLocaleTimeString()}</span>
                              </div>
                              <p>{log.message}</p>
                              {log.data && (
                                <pre className="mt-1 text-xs bg-white/50 dark:bg-black/20 p-1 rounded overflow-x-auto">
                                  {JSON.stringify(log.data, null, 2)}
                                </pre>
                              )}
                            </div>
                          ))}
                        </div>
                      </ScrollArea>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </div>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}