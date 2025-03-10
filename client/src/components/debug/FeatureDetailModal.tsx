import React, { useState, useEffect } from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter
} from '@/components/ui/dialog';
import { 
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger
} from '@/components/ui/tabs';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle, 
  CardDescription 
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  ArrowRight, 
  CheckCircle2, 
  XCircle, 
  Calendar, 
  Code,
  FileText,
  Activity,
  Terminal,
  Play,
  Circle,
  AlertTriangle,
  AlertCircle,
  Plus,
  Clock
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { LogLevel, FeatureArea } from '@/lib/logger';
import { getTestResults, TestStatus, runFeatureTest, getRegisteredTests } from '@/lib/featureTester';
import * as debugStorage from '@/lib/debugStorage';
import { useFeatureContext } from './UnifiedDebugDashboard';
import { EnhancedLogViewer } from './enhanced-log-viewer';

interface FeatureStatus {
  name: string;
  implemented: boolean;
  tested: boolean;
  lastVerified: Date | null;
  notes: string[];
  area?: FeatureArea;
}

interface FeatureTestItem {
  id: string;
  name: string;
  description: string;
  status: TestStatus;
  duration?: number;
  error?: string;
}

interface FeatureDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function FeatureDetailModal({ isOpen, onClose }: FeatureDetailModalProps) {
  const { selectedFeature } = useFeatureContext();
  const [selectedTab, setSelectedTab] = useState('overview');
  const [featureTests, setFeatureTests] = useState<FeatureTestItem[]>([]);
  const [featureLogs, setFeatureLogs] = useState<any[]>([]);
  const [isRunningTests, setIsRunningTests] = useState(false);
  
  // Get tests that relate to this feature
  useEffect(() => {
    if (selectedFeature) {
      // Get all test results
      const allResults = getTestResults();
      const allTests = getRegisteredTests();
      
      // Filter tests by feature area or name
      const relatedTests = allTests.filter(test => {
        // Match by feature area if available
        if (selectedFeature.area && test.area === selectedFeature.area) {
          return true;
        }
        
        // Match by name similarity (simple check)
        const featureName = selectedFeature.name.toLowerCase();
        const testName = test.name.toLowerCase();
        const testId = test.id.toLowerCase();
        
        return testName.includes(featureName) || 
               featureName.includes(testName) ||
               testId.includes(featureName) ||
               featureName.includes(testId);
      });
      
      // Map tests to include their result status
      const testsWithStatus = relatedTests.map(test => {
        const result = allResults[test.id];
        return {
          id: test.id,
          name: test.name,
          description: test.description,
          status: result ? result.status : TestStatus.NOT_STARTED,
          duration: result?.duration,
          error: result?.error
        };
      });
      
      setFeatureTests(testsWithStatus);
      
      // Get logs related to this feature
      if (selectedFeature.area) {
        const logs = debugStorage.getLogEntries({ area: selectedFeature.area });
        setFeatureLogs(logs);
      } else {
        // Try to get logs by feature name
        const logs = debugStorage.getLogEntries().filter((log: any) => {
          return log.message.toLowerCase().includes(selectedFeature.name.toLowerCase());
        });
        setFeatureLogs(logs);
      }
    }
  }, [selectedFeature]);
  
  // Handle test run for specific feature
  const handleRunFeatureTests = async () => {
    if (!selectedFeature || featureTests.length === 0 || isRunningTests) {
      return;
    }
    
    setIsRunningTests(true);
    
    try {
      // Log test run
      debugStorage.addLogEntry(
        LogLevel.INFO,
        selectedFeature.area || FeatureArea.UI,
        `Running tests for feature: ${selectedFeature.name}`,
        { featureName: selectedFeature.name, timestamp: new Date() }
      );
      
      // Run each test and collect results
      const results = [];
      
      for (const test of featureTests) {
        try {
          debugStorage.addLogEntry(
            LogLevel.INFO,
            selectedFeature.area || FeatureArea.UI,
            `Running test: ${test.id} for feature: ${selectedFeature.name}`,
            { testId: test.id, featureName: selectedFeature.name }
          );
          
          // Run the test
          const result = await runFeatureTest(test.id);
          results.push(result);
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : String(error);
          debugStorage.addLogEntry(
            LogLevel.ERROR,
            selectedFeature.area || FeatureArea.UI,
            `Error running test ${test.id} for feature: ${selectedFeature.name}`,
            { testId: test.id, featureName: selectedFeature.name, error: errorMessage }
          );
        }
      }
      
      // Update feature tests with new results
      const allResults = getTestResults();
      const updatedTests = featureTests.map(test => ({
        ...test,
        status: allResults[test.id]?.status || test.status,
        duration: allResults[test.id]?.duration || test.duration,
        error: allResults[test.id]?.error || test.error
      }));
      
      setFeatureTests(updatedTests);
      
      // Log completion
      const passedCount = results.filter(r => r.status === TestStatus.PASSED).length;
      const failedCount = results.filter(r => r.status === TestStatus.FAILED).length;
      const skippedCount = results.filter(r => r.status === TestStatus.SKIPPED).length;
      
      debugStorage.addLogEntry(
        LogLevel.INFO,
        selectedFeature.area || FeatureArea.UI,
        `Feature test run complete: ${passedCount} passed, ${failedCount} failed, ${skippedCount} skipped`,
        { 
          featureName: selectedFeature.name, 
          passed: passedCount, 
          failed: failedCount, 
          skipped: skippedCount 
        }
      );
      
      // Refresh logs for this feature
      if (selectedFeature.area) {
        const logs = debugStorage.getLogEntries({ area: selectedFeature.area });
        setFeatureLogs(logs);
      } else {
        const logs = debugStorage.getLogEntries().filter((log: any) => {
          return log.message.toLowerCase().includes(selectedFeature.name.toLowerCase());
        });
        setFeatureLogs(logs);
      }
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      debugStorage.addLogEntry(
        LogLevel.ERROR,
        selectedFeature.area || FeatureArea.UI,
        `Error running tests for feature: ${selectedFeature.name}`,
        { featureName: selectedFeature.name, error: errorMessage }
      );
    } finally {
      setIsRunningTests(false);
    }
  };
  
  const handleRunSingleTest = async (testId: string) => {
    if (isRunningTests) return;
    
    setIsRunningTests(true);
    
    try {
      debugStorage.addLogEntry(
        LogLevel.INFO,
        selectedFeature?.area || FeatureArea.UI,
        `Running single test: ${testId} for feature: ${selectedFeature?.name}`,
        { testId, featureName: selectedFeature?.name }
      );
      
      const result = await runFeatureTest(testId);
      
      // Update the specific test with new results
      const allResults = getTestResults();
      const updatedTests = featureTests.map(test => {
        if (test.id === testId) {
          return {
            ...test,
            status: allResults[testId]?.status || test.status,
            duration: allResults[testId]?.duration || test.duration,
            error: allResults[testId]?.error || test.error
          };
        }
        return test;
      });
      
      setFeatureTests(updatedTests);
      
      // Refresh logs for this feature
      if (selectedFeature?.area) {
        const logs = debugStorage.getLogEntries({ area: selectedFeature.area });
        setFeatureLogs(logs);
      } else if (selectedFeature) {
        const logs = debugStorage.getLogEntries().filter((log: any) => {
          return log.message.toLowerCase().includes(selectedFeature.name.toLowerCase());
        });
        setFeatureLogs(logs);
      }
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      debugStorage.addLogEntry(
        LogLevel.ERROR,
        selectedFeature?.area || FeatureArea.UI,
        `Error running test ${testId}`,
        { testId, error: errorMessage }
      );
    } finally {
      setIsRunningTests(false);
    }
  };
  
  // If no feature is selected, don't render
  if (!selectedFeature) {
    return null;
  }
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-xl flex items-center">
            {selectedFeature.name}
            <div className="ml-2 flex space-x-1">
              <Badge variant={selectedFeature.implemented ? "default" : "outline"} className={selectedFeature.implemented ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400" : ""}>
                {selectedFeature.implemented ? "Implemented" : "Not Implemented"}
              </Badge>
              <Badge variant={selectedFeature.tested ? "default" : "outline"} className={selectedFeature.tested ? "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400" : ""}>
                {selectedFeature.tested ? "Tested" : "Not Tested"}
              </Badge>
            </div>
          </DialogTitle>
          <DialogDescription>
            {selectedFeature.area ? `Area: ${selectedFeature.area}` : 'General Feature'} • Last Updated: {selectedFeature.lastVerified ? new Date(selectedFeature.lastVerified).toLocaleDateString() : 'Never'}
          </DialogDescription>
        </DialogHeader>
        
        <Tabs value={selectedTab} onValueChange={setSelectedTab} className="flex-1 flex flex-col">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="implementation">Implementation</TabsTrigger>
            <TabsTrigger value="tests">Tests</TabsTrigger>
            <TabsTrigger value="run-test">Run Tests</TabsTrigger>
            <TabsTrigger value="logs">Logs</TabsTrigger>
          </TabsList>
          
          <div className="flex-1 overflow-auto">
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
                          <Badge variant="success"><CheckCircle2 className="h-3 w-3 mr-1" /> Complete</Badge>
                        ) : (
                          <Badge variant="destructive"><XCircle className="h-3 w-3 mr-1" /> Not Started</Badge>
                        )}
                      </div>
                      <div className="flex justify-between items-center">
                        <span>Testing</span>
                        {selectedFeature.tested ? (
                          <Badge variant="success"><CheckCircle2 className="h-3 w-3 mr-1" /> Complete</Badge>
                        ) : (
                          <Badge variant="destructive"><XCircle className="h-3 w-3 mr-1" /> Not Started</Badge>
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
                        {selectedFeature.area || 'General'}
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
                          <ArrowRight className="h-4 w-4 mr-2 mt-0.5 text-gray-500 shrink-0" />
                          <span>{note}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              )}

              <Card className="mt-4">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Related Tests</CardTitle>
                </CardHeader>
                <CardContent>
                  {featureTests.length > 0 ? (
                    <div className="space-y-2">
                      {featureTests.slice(0, 3).map((test) => (
                        <div key={test.id} className="flex justify-between items-center">
                          <span>{test.name}</span>
                          <Badge 
                            variant={
                              test.status === TestStatus.PASSED ? "success" :
                              test.status === TestStatus.FAILED ? "destructive" :
                              test.status === TestStatus.SKIPPED ? "warning" :
                              "outline"
                            }
                          >
                            {test.status}
                          </Badge>
                        </div>
                      ))}
                      {featureTests.length > 3 && (
                        <Button 
                          variant="link" 
                          size="sm" 
                          className="p-0"
                          onClick={() => setSelectedTab('tests')}
                        >
                          View all {featureTests.length} tests
                        </Button>
                      )}
                    </div>
                  ) : (
                    <div className="text-center p-2 text-gray-500">
                      <p>No tests found for this feature</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="implementation" className="p-4 h-full">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Code className="h-5 w-5 mr-2" />
                    Implementation Details
                  </CardTitle>
                  <CardDescription>
                    Key parts of the implementation process and code structures
                  </CardDescription>
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
                              <Badge variant="success">
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
                              <Badge variant={selectedFeature.tested ? "success" : "outline"}>
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
                                {selectedFeature.area || "General"}
                              </Badge>
                            </div>
                            
                            <div className="flex justify-between items-center">
                              <span className="text-sm text-gray-500">Type:</span>
                              <Badge variant="outline">
                                {selectedFeature.name.toLowerCase().includes('api') ? 'Backend' : 
                                 selectedFeature.name.toLowerCase().includes('ui') ? 'Frontend' : 
                                 'Full Stack'}
                              </Badge>
                            </div>
                            
                            <div className="flex justify-between items-center">
                              <span className="text-sm text-gray-500">Priority:</span>
                              <Badge variant="outline" className={
                                selectedFeature.name.toLowerCase().includes('core') || 
                                ['goal', 'dashboard', 'api'].includes(String(selectedFeature.area).toLowerCase()) 
                                  ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300' 
                                  : ''
                              }>
                                {selectedFeature.name.toLowerCase().includes('core') || 
                                 ['goal', 'dashboard', 'api'].includes(String(selectedFeature.area).toLowerCase()) 
                                  ? 'High' : 'Medium'}
                              </Badge>
                            </div>
                          </div>
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="bg-yellow-50 dark:bg-yellow-900/20 p-3 rounded-md">
                      <div className="flex items-center">
                        <AlertCircle className="h-5 w-5 text-yellow-500 dark:text-yellow-400 mr-2" />
                        <span className="font-medium text-yellow-800 dark:text-yellow-300">Feature not yet implemented</span>
                      </div>
                      <div className="mt-2 pl-7 space-y-2">
                        <p className="text-sm text-yellow-800/70 dark:text-yellow-300/70">
                          This feature is currently in the planning or development phase and has not been fully implemented.
                        </p>
                        <div className="flex items-center space-x-2">
                          <Button 
                            size="sm" 
                            variant="outline" 
                            className="bg-yellow-100 text-yellow-800 border-yellow-300 dark:bg-yellow-900/30 dark:text-yellow-300 dark:border-yellow-800/30"
                          >
                            Mark as Implemented
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="tests" className="p-4 h-full">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <FileText className="h-5 w-5 mr-2" />
                    Test Results
                  </CardTitle>
                  <CardDescription>
                    View test results for this feature
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {featureTests.length > 0 ? (
                    <ScrollArea className="h-[300px]">
                      <div className="space-y-3">
                        {featureTests.map((test) => (
                          <Card key={test.id} className={cn(
                            "border overflow-hidden",
                            test.status === TestStatus.PASSED && "border-green-200 dark:border-green-900/50",
                            test.status === TestStatus.FAILED && "border-red-200 dark:border-red-900/50",
                            test.status === TestStatus.SKIPPED && "border-yellow-200 dark:border-yellow-900/50"
                          )}>
                            <div className={cn(
                              "py-1 px-3 text-xs font-medium",
                              test.status === TestStatus.PASSED && "bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-100",
                              test.status === TestStatus.FAILED && "bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-100",
                              test.status === TestStatus.SKIPPED && "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-100",
                              test.status === TestStatus.NOT_STARTED && "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-100",
                            )}>
                              {test.status}
                            </div>
                            <CardContent className="p-3">
                              <div className="mb-2">
                                <h4 className="font-medium">{test.name}</h4>
                                <p className="text-sm text-gray-500">{test.description}</p>
                              </div>
                              {test.duration !== undefined && (
                                <div className="flex items-center text-xs text-gray-500 space-x-1">
                                  <Clock className="h-3 w-3 mr-1" />
                                  <span>Duration: {test.duration.toFixed(2)}ms</span>
                                </div>
                              )}
                              {test.error && (
                                <div className="mt-2 p-2 bg-red-50 dark:bg-red-900/20 rounded text-sm text-red-800 dark:text-red-300">
                                  <p className="font-medium">Error:</p>
                                  <p className="font-mono text-xs">{test.error}</p>
                                </div>
                              )}
                              <div className="mt-2 flex justify-end">
                                <Button 
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleRunSingleTest(test.id)}
                                  disabled={isRunningTests}
                                >
                                  {isRunningTests ? (
                                    <>Running<span className="ml-1 animate-pulse">...</span></>
                                  ) : (
                                    <>
                                      <Play className="h-3 w-3 mr-1" />
                                      Run Test
                                    </>
                                  )}
                                </Button>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </ScrollArea>
                  ) : (
                    <div className="text-center p-8 text-gray-500">
                      <p>No tests found for this feature</p>
                      <Button className="mt-4" variant="outline" size="sm">
                        <Plus className="h-3 w-3 mr-1" />
                        Create Test
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="run-test" className="p-4 h-full">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-lg font-semibold">Run Tests for {selectedFeature.name}</h3>
                    <Button
                      size="sm"
                      className="flex items-center space-x-1"
                      onClick={handleRunFeatureTests}
                      disabled={isRunningTests || featureTests.length === 0}
                    >
                      {isRunningTests ? (
                        <>Running<span className="ml-1 animate-pulse">...</span></>
                      ) : (
                        <>
                          <Play className="h-4 w-4 mr-1" />
                          <span>Run All Tests</span>
                        </>
                      )}
                    </Button>
                  </div>
                  
                  <div className="border rounded-md p-3 bg-slate-50 dark:bg-slate-900/50 mb-4">
                    <h4 className="font-medium mb-2 text-sm">Test Configuration</h4>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-500">Auto-update status:</span>
                        <Badge variant="outline" className="bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-400">Enabled</Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-500">Test dependencies:</span>
                        <Badge variant="outline" className="bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">Required</Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-500">Test count:</span>
                        <Badge variant="outline" className="bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">{featureTests.length} Tests</Badge>
                      </div>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 gap-2">
                    {featureTests.length === 0 ? (
                      <div className="text-center p-4 text-gray-500 border rounded-md">
                        <p>No specific tests found for this feature</p>
                        <p className="text-xs mt-1">Consider creating tests for this feature</p>
                      </div>
                    ) : (
                      featureTests.map(test => (
                        <div 
                          key={test.id}
                          className={cn(
                            "border rounded-md p-3 flex justify-between items-center",
                            test.status === TestStatus.PASSED && "border-green-200 bg-green-50/50 dark:bg-green-900/10",
                            test.status === TestStatus.FAILED && "border-red-200 bg-red-50/50 dark:bg-red-900/10",
                            test.status === TestStatus.SKIPPED && "border-yellow-200 bg-yellow-50/50 dark:bg-yellow-900/10",
                          )}
                        >
                          <div>
                            <p className="font-medium flex items-center">
                              {test.status === TestStatus.PASSED && <CheckCircle2 className="h-4 w-4 text-green-500 mr-2" />}
                              {test.status === TestStatus.FAILED && <XCircle className="h-4 w-4 text-red-500 mr-2" />}
                              {test.status === TestStatus.SKIPPED && <AlertTriangle className="h-4 w-4 text-yellow-500 mr-2" />}
                              {(test.status === TestStatus.NOT_STARTED || !test.status) && <Circle className="h-4 w-4 text-gray-300 mr-2" />}
                              {test.name}
                            </p>
                            <p className="text-xs text-gray-500 mt-1">{test.description}</p>
                          </div>
                          <Button 
                            size="sm" 
                            variant="ghost"
                            onClick={() => handleRunSingleTest(test.id)}
                            disabled={isRunningTests}
                          >
                            {isRunningTests ? 'Running...' : 'Run'}
                          </Button>
                        </div>
                      ))
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="logs" className="p-4 h-full">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Terminal className="h-5 w-5 mr-2" />
                    Feature Logs
                  </CardTitle>
                  <CardDescription>
                    View logs specific to this feature
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {featureLogs.length === 0 ? (
                    <div className="text-center p-8 text-gray-500">
                      <p>No logs found for this feature</p>
                    </div>
                  ) : (
                    <ScrollArea className="h-[300px] border rounded-md p-4">
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
                              <span className="text-xs opacity-70">{new Date(log.timestamp).toLocaleTimeString()}</span>
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
                </CardContent>
              </Card>
            </TabsContent>
          </div>
        </Tabs>
        
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Close</Button>
          {featureTests.length > 0 && (
            <Button 
              onClick={handleRunFeatureTests}
              disabled={isRunningTests}
            >
              {isRunningTests ? (
                <>Running Tests<span className="ml-1 animate-pulse">...</span></>
              ) : (
                <>
                  <Play className="h-4 w-4 mr-1" />
                  Run Tests
                </>
              )}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}