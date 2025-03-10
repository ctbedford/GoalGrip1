import React, { useState, createContext, useContext, useMemo } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  ChevronRight, 
  CheckCircle2, 
  XCircle, 
  Search, 
  LayoutDashboard, 
  FileText, 
  Activity, 
  Terminal, 
  Code, 
  Play, 
  RefreshCw,
  Filter
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { LogLevel, FeatureArea } from '@/lib/logger';
import { getFeatureVerificationStatus } from '@/lib/logger';
import { TestStatus } from '@/lib/featureTester';
import { getTestResults, runFeatureTest, getRegisteredTests } from '@/lib/featureTester';
import * as debugStorage from '@/lib/debugStorage';
import { getTestResults as getApiTestResults } from '@/lib/apiTester';
import { FeatureStatusDashboard } from './feature-status-dashboard';
import { EnhancedLogViewer } from './enhanced-log-viewer';
import { EnhancedApiDashboard } from './enhanced-api-dashboard';
import { PerformanceMetricsPanel } from './performance-metrics-panel';

// Feature context to share selected feature across components
interface FeatureStatus {
  name: string;
  implemented: boolean;
  tested: boolean;
  lastVerified: Date | null;
  notes: string[];
  area?: FeatureArea;
}

interface FeatureTestStatus {
  id: string;
  name: string;
  description: string;
  status: TestStatus;
  error?: string;
  duration?: number;
  timestamp?: Date;
}

interface FeatureContextType {
  selectedFeature: FeatureStatus | null;
  selectFeature: (feature: FeatureStatus | null) => void;
  selectedTab: string;
  setSelectedTab: (tab: string) => void;
}

// Create the context
const FeatureContext = createContext<FeatureContextType>({
  selectedFeature: null,
  selectFeature: () => {},
  selectedTab: 'feature-dashboard',
  setSelectedTab: () => {}
});

// Custom hook to use the feature context
export const useFeatureContext = () => useContext(FeatureContext);

// Filter state interface
interface FilterState {
  area: FeatureArea | 'all';
  implementationStatus: 'all' | 'implemented' | 'not-implemented';
  testStatus: 'all' | 'tested' | 'not-tested';
  searchQuery: string;
}

export function UnifiedDebugDashboard() {
  // State for the selected feature
  const [selectedFeature, setSelectedFeature] = useState<FeatureStatus | null>(null);
  
  // State for the selected tab
  const [selectedTab, setSelectedTab] = useState('feature-dashboard');
  
  // State for filtering
  const [filters, setFilters] = useState<FilterState>({
    area: 'all',
    implementationStatus: 'all',
    testStatus: 'all',
    searchQuery: ''
  });

  // Get feature data
  const features = useMemo(() => {
    const featureData = getFeatureVerificationStatus();
    return Object.entries(featureData).map(([name, data]) => ({
      name,
      ...data
    }));
  }, []);

  // Get test results
  const testResults = useMemo(() => getTestResults(), []);

  // Filter features based on current filters
  const filteredFeatures = useMemo(() => {
    return features.filter(feature => {
      // Filter by area (safely check if area exists)
      if (filters.area !== 'all' && (!feature.area || feature.area !== filters.area)) {
        return false;
      }
      
      // Filter by implementation status
      if (
        filters.implementationStatus === 'implemented' && !feature.implemented ||
        filters.implementationStatus === 'not-implemented' && feature.implemented
      ) {
        return false;
      }
      
      // Filter by test status
      if (
        filters.testStatus === 'tested' && !feature.tested ||
        filters.testStatus === 'not-tested' && feature.tested
      ) {
        return false;
      }
      
      // Filter by search query
      if (filters.searchQuery && !feature.name.toLowerCase().includes(filters.searchQuery.toLowerCase())) {
        return false;
      }
      
      return true;
    });
  }, [features, filters]);

  // Function to handle feature selection
  const selectFeature = (feature: FeatureStatus | null) => {
    setSelectedFeature(feature);
  };

  // Feature context value
  const featureContextValue = {
    selectedFeature,
    selectFeature,
    selectedTab,
    setSelectedTab
  };

  // Handle search input change
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFilters(prev => ({ ...prev, searchQuery: e.target.value }));
  };

  // Handle area filter change
  const handleAreaFilterChange = (area: FeatureArea | 'all') => {
    setFilters(prev => ({ ...prev, area }));
  };

  // Handle implementation status filter change
  const handleImplementationStatusChange = (status: 'all' | 'implemented' | 'not-implemented') => {
    setFilters(prev => ({ ...prev, implementationStatus: status }));
  };

  // Handle test status filter change
  const handleTestStatusChange = (status: 'all' | 'tested' | 'not-tested') => {
    setFilters(prev => ({ ...prev, testStatus: status }));
  };

  // Function to run all tests
  const handleRunAllTests = async () => {
    // Log that all tests are being run
    debugStorage.addLogEntry(
      LogLevel.INFO,
      FeatureArea.UI,
      "Running all feature tests from the Debug Dashboard",
      { timestamp: new Date() }
    );
    
    try {
      // Get registered tests
      const testsToRun = getRegisteredTests();
      
      // Log how many tests will be run
      debugStorage.addLogEntry(
        LogLevel.INFO,
        FeatureArea.UI,
        `Initiating ${testsToRun.length} feature tests`,
        { testCount: testsToRun.length }
      );
      
      // Create a context for this test run
      const contextId = `all-tests-${Date.now()}`;
      
      // Run each test sequentially and collect results
      const results = [];
      
      for (const test of testsToRun) {
        try {
          debugStorage.addLogEntry(
            LogLevel.INFO,
            FeatureArea.UI,
            `Running test: ${test.id}`,
            { testId: test.id, testName: test.name }
          );
          
          // Run the test
          const result = await runFeatureTest(test.id);
          results.push(result);
          
          // Update the UI to reflect the new test status
          // This will force a refresh of the test results in the UI
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : String(error);
          debugStorage.addLogEntry(
            LogLevel.ERROR,
            FeatureArea.UI,
            `Error running test ${test.id}`,
            { testId: test.id, error: errorMessage }
          );
        }
      }
      
      // Log completion
      const passedCount = results.filter(r => r.status === TestStatus.PASSED).length;
      const failedCount = results.filter(r => r.status === TestStatus.FAILED).length;
      const skippedCount = results.filter(r => r.status === TestStatus.SKIPPED).length;
      
      debugStorage.addLogEntry(
        LogLevel.INFO,
        FeatureArea.UI,
        `Test run complete: ${passedCount} passed, ${failedCount} failed, ${skippedCount} skipped`,
        { passed: passedCount, failed: failedCount, skipped: skippedCount }
      );
      
      // Force a refresh of the component by setting a state variable
      // This is just a temporary solution until we implement proper state management
      setSelectedTab(selectedTab);
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      debugStorage.addLogEntry(
        LogLevel.ERROR,
        FeatureArea.UI,
        "Error running all tests",
        { error: errorMessage }
      );
    }
  };

  return (
    <FeatureContext.Provider value={featureContextValue}>
      <div className="container mx-auto p-4 space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">Unified Debug Dashboard</h1>
          <Button 
            onClick={handleRunAllTests}
            className="flex items-center space-x-2"
          >
            <Play className="h-4 w-4" />
            <span>Run All Tests</span>
          </Button>
        </div>
        
        <Tabs value={selectedTab} onValueChange={setSelectedTab} className="w-full">
          <TabsList className="grid grid-cols-5 mb-4">
            <TabsTrigger value="feature-dashboard" className="flex items-center">
              <LayoutDashboard className="h-4 w-4 mr-2" />
              Feature Dashboard
            </TabsTrigger>
            <TabsTrigger value="logs" className="flex items-center">
              <Terminal className="h-4 w-4 mr-2" />
              Logs
            </TabsTrigger>
            <TabsTrigger value="api-dashboard" className="flex items-center">
              <Code className="h-4 w-4 mr-2" />
              API Dashboard
            </TabsTrigger>
            <TabsTrigger value="performance" className="flex items-center">
              <Activity className="h-4 w-4 mr-2" />
              Performance
            </TabsTrigger>
            <TabsTrigger value="documentation" className="flex items-center">
              <FileText className="h-4 w-4 mr-2" />
              Documentation
            </TabsTrigger>
          </TabsList>
          
          {/* Feature Dashboard Tab */}
          <TabsContent value="feature-dashboard" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Feature Implementation Status</CardTitle>
                <CardDescription>
                  Monitor implementation status and run tests for all application features
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex justify-between mb-6">
                  <div className="flex items-center space-x-2 w-1/3">
                    <Search className="h-4 w-4 text-gray-500" />
                    <Input 
                      placeholder="Search features..." 
                      value={filters.searchQuery}
                      onChange={handleSearchChange}
                      className="h-9"
                    />
                  </div>
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-2">
                      <Filter className="h-4 w-4 text-gray-500" />
                      <select 
                        className="bg-transparent border rounded px-2 py-1 text-sm"
                        value={filters.area}
                        onChange={(e) => handleAreaFilterChange(e.target.value as FeatureArea | 'all')}
                      >
                        <option value="all">All Areas</option>
                        {Object.values(FeatureArea).map(area => (
                          <option key={area} value={area}>{area}</option>
                        ))}
                      </select>
                    </div>
                    <div className="flex items-center space-x-2">
                      <select 
                        className="bg-transparent border rounded px-2 py-1 text-sm"
                        value={filters.implementationStatus}
                        onChange={(e) => handleImplementationStatusChange(e.target.value as 'all' | 'implemented' | 'not-implemented')}
                      >
                        <option value="all">All Implementation</option>
                        <option value="implemented">Implemented</option>
                        <option value="not-implemented">Not Implemented</option>
                      </select>
                    </div>
                    <div className="flex items-center space-x-2">
                      <select 
                        className="bg-transparent border rounded px-2 py-1 text-sm"
                        value={filters.testStatus}
                        onChange={(e) => handleTestStatusChange(e.target.value as 'all' | 'tested' | 'not-tested')}
                      >
                        <option value="all">All Test Status</option>
                        <option value="tested">Tested</option>
                        <option value="not-tested">Not Tested</option>
                      </select>
                    </div>
                    <Button variant="outline" size="sm" onClick={() => setFilters({
                      area: 'all',
                      implementationStatus: 'all',
                      testStatus: 'all',
                      searchQuery: ''
                    })}>
                      <RefreshCw className="h-3 w-3 mr-1" />
                      Reset
                    </Button>
                  </div>
                </div>
                
                {/* Status Summary */}
                <div className="grid grid-cols-3 gap-4 mb-6">
                  <Card className="bg-gray-50 dark:bg-gray-800">
                    <CardContent className="p-4">
                      <div className="flex justify-between items-center">
                        <div>
                          <div className="text-sm font-medium text-gray-500 dark:text-gray-400">Implemented</div>
                          <div className="text-2xl font-bold">
                            {features.filter(f => f.implemented).length}/{features.length}
                          </div>
                        </div>
                        <div className="h-10 w-10 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                          <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
                        </div>
                      </div>
                      <div className="mt-2 h-2 rounded-full bg-gray-200 dark:bg-gray-700">
                        <div 
                          className="h-full rounded-full bg-green-500" 
                          style={{ width: `${(features.filter(f => f.implemented).length / features.length) * 100}%` }}
                        ></div>
                      </div>
                    </CardContent>
                  </Card>
                  <Card className="bg-gray-50 dark:bg-gray-800">
                    <CardContent className="p-4">
                      <div className="flex justify-between items-center">
                        <div>
                          <div className="text-sm font-medium text-gray-500 dark:text-gray-400">Tested</div>
                          <div className="text-2xl font-bold">
                            {features.filter(f => f.tested).length}/{features.length}
                          </div>
                        </div>
                        <div className="h-10 w-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                          <FileText className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                        </div>
                      </div>
                      <div className="mt-2 h-2 rounded-full bg-gray-200 dark:bg-gray-700">
                        <div 
                          className="h-full rounded-full bg-blue-500" 
                          style={{ width: `${(features.filter(f => f.tested).length / features.length) * 100}%` }}
                        ></div>
                      </div>
                    </CardContent>
                  </Card>
                  <Card className="bg-gray-50 dark:bg-gray-800">
                    <CardContent className="p-4">
                      <div className="flex justify-between items-center">
                        <div>
                          <div className="text-sm font-medium text-gray-500 dark:text-gray-400">Complete</div>
                          <div className="text-2xl font-bold">
                            {features.filter(f => f.implemented && f.tested).length}/{features.length}
                          </div>
                        </div>
                        <div className="h-10 w-10 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                          <CheckCircle2 className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                        </div>
                      </div>
                      <div className="mt-2 h-2 rounded-full bg-gray-200 dark:bg-gray-700">
                        <div 
                          className="h-full rounded-full bg-purple-500" 
                          style={{ width: `${(features.filter(f => f.implemented && f.tested).length / features.length) * 100}%` }}
                        ></div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
                
                {/* Feature List */}
                <ScrollArea className="h-[400px] rounded-md border p-4">
                  <div className="space-y-2">
                    {filteredFeatures.length > 0 ? (
                      filteredFeatures.map((feature, idx) => (
                        <div 
                          key={idx} 
                          className="border rounded-md p-3 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer transition-colors"
                          onClick={() => selectFeature(feature)}
                        >
                          <div className="flex items-center">
                            <div>
                              <div className="font-medium">{feature.name}</div>
                              <div className="text-sm text-gray-500">
                                {feature.area || 'General'} • Last updated: {feature.lastVerified ? new Date(feature.lastVerified).toLocaleDateString() : 'Never'}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Badge variant={feature.implemented ? "default" : "outline"} className={feature.implemented ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400" : ""}>
                              {feature.implemented ? (
                                <><CheckCircle2 className="h-3 w-3 mr-1" /> Implemented</>
                              ) : (
                                <><XCircle className="h-3 w-3 mr-1" /> Not Implemented</>
                              )}
                            </Badge>
                            <Badge variant={feature.tested ? "default" : "outline"} className={feature.tested ? "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400" : ""}>
                              {feature.tested ? (
                                <><CheckCircle2 className="h-3 w-3 mr-1" /> Tested</>
                              ) : (
                                <><XCircle className="h-3 w-3 mr-1" /> Not Tested</>
                              )}
                            </Badge>
                            <Button variant="ghost" size="sm">
                              <ChevronRight className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center p-8 text-gray-500">
                        <p>No features found matching your filters</p>
                      </div>
                    )}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
            
            {/* For now, include the old FeatureStatusDashboard for reference - will be removed later */}
            <div className="opacity-0 h-0 overflow-hidden">
              <FeatureStatusDashboard />
            </div>
          </TabsContent>
          
          {/* Logs Tab */}
          <TabsContent value="logs" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Terminal className="h-5 w-5 mr-2" />
                  Application Logs
                </CardTitle>
                <CardDescription>
                  {selectedFeature 
                    ? `Viewing logs for feature: ${selectedFeature.name}`
                    : "View and filter application logs across all features"}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {/* For now, include the old EnhancedLogViewer - will be updated later */}
                <EnhancedLogViewer />
              </CardContent>
            </Card>
          </TabsContent>
          
          {/* API Dashboard Tab */}
          <TabsContent value="api-dashboard" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Code className="h-5 w-5 mr-2" />
                  API Dashboard
                </CardTitle>
                <CardDescription>
                  {selectedFeature 
                    ? `Viewing API endpoints for feature: ${selectedFeature.name}`
                    : "Monitor and test API endpoints across all features"}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {/* For now, include the old EnhancedApiDashboard - will be updated later */}
                <EnhancedApiDashboard />
              </CardContent>
            </Card>
          </TabsContent>
          
          {/* Performance Tab */}
          <TabsContent value="performance" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Activity className="h-5 w-5 mr-2" />
                  Performance Metrics
                </CardTitle>
                <CardDescription>
                  {selectedFeature 
                    ? `Viewing performance metrics for feature: ${selectedFeature.name}`
                    : "Monitor application performance across all features"}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {/* For now, include the old PerformanceMetricsPanel - will be updated later */}
                <PerformanceMetricsPanel />
              </CardContent>
            </Card>
          </TabsContent>
          
          {/* Documentation Tab */}
          <TabsContent value="documentation" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <FileText className="h-5 w-5 mr-2" />
                  Feature Documentation
                </CardTitle>
                <CardDescription>
                  {selectedFeature 
                    ? `Viewing documentation for feature: ${selectedFeature.name}`
                    : "Browse documentation for all application features"}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {selectedFeature ? (
                  <div className="space-y-4">
                    <h3 className="text-xl font-semibold">{selectedFeature.name}</h3>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm font-medium">Implementation Details</CardTitle>
                        </CardHeader>
                        <CardContent>
                          {selectedFeature.notes.length > 0 ? (
                            <ul className="list-disc pl-5 space-y-1">
                              {selectedFeature.notes.map((note, idx) => (
                                <li key={idx}>{note}</li>
                              ))}
                            </ul>
                          ) : (
                            <p className="text-gray-500">No implementation notes available</p>
                          )}
                        </CardContent>
                      </Card>
                      
                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm font-medium">Status</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <span>Implementation:</span>
                              <Badge variant={selectedFeature.implemented ? "default" : "outline"} className={selectedFeature.implemented ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400" : ""}>
                                {selectedFeature.implemented ? "Complete" : "Incomplete"}
                              </Badge>
                            </div>
                            <div className="flex items-center justify-between">
                              <span>Testing:</span>
                              <Badge variant={selectedFeature.tested ? "default" : "outline"} className={selectedFeature.tested ? "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400" : ""}>
                                {selectedFeature.tested ? "Complete" : "Incomplete"}
                              </Badge>
                            </div>
                            <div className="flex items-center justify-between">
                              <span>Last Updated:</span>
                              <span className="text-sm">
                                {selectedFeature.lastVerified 
                                  ? new Date(selectedFeature.lastVerified).toLocaleDateString() 
                                  : 'Never'}
                              </span>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                    
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">Technical Documentation</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-gray-500">Detailed technical documentation will be implemented in future batches.</p>
                      </CardContent>
                    </Card>
                  </div>
                ) : (
                  <div className="text-center p-8">
                    <p className="text-gray-500">Select a feature to view its documentation</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </FeatureContext.Provider>
  );
}