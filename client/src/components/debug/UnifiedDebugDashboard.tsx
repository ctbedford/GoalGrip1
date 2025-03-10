import React, { createContext, useState, useContext, useMemo } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FeatureArea, LogLevel } from '@/lib/logger';
import { TestStatus } from '@/lib/featureTester';
import { runFeatureTest, runAllFeatureTests } from '@/lib/featureTester';
import { useFeatureTests } from '@/hooks/use-feature-tests';
import { createContext as createLoggingContext, completeContext } from '@/lib/enhancedLogger';
import { 
  EnhancedFeatureStatus, 
  FeatureTestInfo, 
  TestResultSummary
} from '@/lib/types/featureTypes';
import { 
  CheckCircle2 as LuCheckCircle2, 
  XCircle as LuXCircle, 
  AlertCircle as LuAlertCircle, 
  Clock as LuClock, 
  SlidersHorizontal as LuSlidersHorizontal,
  BarChart as LuBarChart, 
  Code as LuCode, 
  FileCog as LuFileCog, 
  FilePlus as LuFilePlus, 
  Filter as LuFilter, 
  Info as LuInfo, 
  LifeBuoy as LuLifeBuoy,
  Layout as LuLayout, 
  PieChart as LuPieChart, 
  Play as LuPlay, 
  RefreshCw as LuRefreshCw, 
  Search as LuSearch, 
  Settings as LuSettings, 
  Smartphone as LuSmartphone 
} from 'lucide-react';

// Feature context for sharing selected feature state across components
interface FeatureContextType {
  selectedFeature: EnhancedFeatureStatus | null;
  selectFeature: (feature: EnhancedFeatureStatus | null) => void;
  selectedTab: string;
  setSelectedTab: (tab: string) => void;
}

const FeatureContext = createContext<FeatureContextType>({
  selectedFeature: null,
  selectFeature: () => {},
  selectedTab: 'features',
  setSelectedTab: () => {}
});

export const useFeatureContext = () => useContext(FeatureContext);

// Filter state for filtering features
interface FilterState {
  area: FeatureArea | 'all';
  implementationStatus: 'all' | 'implemented' | 'not-implemented';
  testStatus: 'all' | 'tested' | 'not-tested';
  searchQuery: string;
}

export function UnifiedDebugDashboard() {
  const { features, isLoading, getFeatureTests, getFeatureTestSummary, overallStats } = useFeatureTests();
  const [selectedFeature, setSelectedFeature] = useState<EnhancedFeatureStatus | null>(null);
  const [selectedTab, setSelectedTab] = useState('features');
  const [isTestRunning, setIsTestRunning] = useState<Record<string, boolean>>({});
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [filters, setFilters] = useState<FilterState>({
    area: 'all',
    implementationStatus: 'all',
    testStatus: 'all',
    searchQuery: ''
  });

  const openFeatureDetail = (feature: EnhancedFeatureStatus) => {
    setSelectedFeature(feature);
    setDetailModalOpen(true);
  };

  // Apply filters to features
  const filteredFeatures = useMemo(() => {
    return features.filter(feature => {
      // Apply area filter
      if (filters.area !== 'all' && feature.area !== filters.area) {
        return false;
      }
      
      // Apply implementation status filter
      if (filters.implementationStatus === 'implemented' && !feature.implemented) {
        return false;
      }
      if (filters.implementationStatus === 'not-implemented' && feature.implemented) {
        return false;
      }
      
      // Apply test status filter
      if (filters.testStatus === 'tested' && feature.testStatus === 'not_tested') {
        return false;
      }
      if (filters.testStatus === 'not-tested' && feature.testStatus !== 'not_tested') {
        return false;
      }
      
      // Apply search query
      if (filters.searchQuery && !feature.name.toLowerCase().includes(filters.searchQuery.toLowerCase())) {
        return false;
      }
      
      return true;
    });
  }, [features, filters]);

  // Run a feature test
  const handleRunTest = async (testId: string) => {
    if (isTestRunning[testId]) return;
    
    setIsTestRunning(prev => ({ ...prev, [testId]: true }));
    const contextId = createLoggingContext('Feature Test', testId);
    
    try {
      await runFeatureTest(testId);
    } finally {
      if (typeof contextId === 'string') completeContext(contextId, true);
      setIsTestRunning(prev => ({ ...prev, [testId]: false }));
    }
  };

  // Run all tests for a feature
  const handleRunFeatureTests = async (featureName: string) => {
    const tests = getFeatureTests(featureName);
    if (!tests.length) return;
    
    // Mark all as running
    const newRunningState: Record<string, boolean> = {};
    tests.forEach(test => {
      newRunningState[test.id] = true;
    });
    setIsTestRunning(prev => ({ ...prev, ...newRunningState }));
    
    const contextId = createLoggingContext('Feature Tests', featureName);
    
    try {
      // Run each test in sequence
      for (const test of tests) {
        await runFeatureTest(test.id);
      }
    } finally {
      if (typeof contextId === 'string') completeContext(contextId, true);
      
      // Mark all as not running
      const completedState: Record<string, boolean> = {};
      tests.forEach(test => {
        completedState[test.id] = false;
      });
      setIsTestRunning(prev => ({ ...prev, ...completedState }));
    }
  };

  // Run all tests
  const handleRunAllTests = async () => {
    const contextId = createLoggingContext('All Feature Tests', 'global');
    
    try {
      await runAllFeatureTests();
    } finally {
      if (typeof contextId === 'string') completeContext(contextId, true);
    }
  };

  // Context value
  const contextValue = {
    selectedFeature,
    selectFeature: setSelectedFeature,
    selectedTab,
    setSelectedTab
  };

  return (
    <FeatureContext.Provider value={contextValue}>
      <div className="flex flex-col h-full bg-background rounded-lg shadow-md">
        <div className="p-4 border-b">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold">Unified Debug Dashboard</h1>
              <p className="text-muted-foreground">Integrated feature status and test management</p>
            </div>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                onClick={handleRunAllTests}
                className="flex items-center gap-1"
              >
                <LuPlay className="h-4 w-4" />
                Run All Tests
              </Button>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Total Features</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{overallStats.totalFeatures}</div>
                <div className="text-xs text-muted-foreground mt-1">
                  {overallStats.implemented} implemented, {overallStats.notImplemented} not implemented
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Tests Passed</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-500">{overallStats.fullyTested}</div>
                <Progress 
                  value={overallStats.totalFeatures > 0 ? (overallStats.fullyTested / overallStats.totalFeatures) * 100 : 0} 
                  className="h-2 mt-2" 
                />
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Tests Failed</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-500">{overallStats.failed}</div>
                <Progress 
                  value={overallStats.totalFeatures > 0 ? (overallStats.failed / overallStats.totalFeatures) * 100 : 0}
                  className="h-2 mt-2 bg-red-200" 
                  indicatorClassName="bg-red-500"
                />
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Not Tested</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-yellow-500">{overallStats.notTested}</div>
                <Progress 
                  value={overallStats.totalFeatures > 0 ? (overallStats.notTested / overallStats.totalFeatures) * 100 : 0}
                  className="h-2 mt-2 bg-yellow-200" 
                  indicatorClassName="bg-yellow-500"
                />
              </CardContent>
            </Card>
          </div>
        </div>
        
        <div className="p-4 flex gap-2 border-b">
          <div className="flex-1">
            <Input
              placeholder="Search features..."
              value={filters.searchQuery}
              onChange={(e) => setFilters({ ...filters, searchQuery: e.target.value })}
              className="w-full"
            />
          </div>
          
          <Select value={filters.area} onValueChange={(value) => setFilters({ ...filters, area: value as FeatureArea | 'all' })}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select Area" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Areas</SelectItem>
              {Object.values(FeatureArea).map((area) => (
                <SelectItem key={area} value={area}>{area}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <Select value={filters.implementationStatus} onValueChange={(value) => setFilters({ ...filters, implementationStatus: value as any })}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Implementation Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="implemented">Implemented</SelectItem>
              <SelectItem value="not-implemented">Not Implemented</SelectItem>
            </SelectContent>
          </Select>
          
          <Select value={filters.testStatus} onValueChange={(value) => setFilters({ ...filters, testStatus: value as any })}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Test Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="tested">Tested</SelectItem>
              <SelectItem value="not-tested">Not Tested</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div className="flex-1 p-4 overflow-hidden">
          <Tabs defaultValue="features" value={selectedTab} onValueChange={setSelectedTab} className="h-full">
            <TabsList>
              <TabsTrigger value="features">Features</TabsTrigger>
              <TabsTrigger value="tests">Tests</TabsTrigger>
              <TabsTrigger value="status">Status</TabsTrigger>
            </TabsList>
            
            <TabsContent value="features" className="h-full">
              <Card className="h-full flex flex-col">
                <CardHeader className="pb-2">
                  <CardTitle>Feature Status</CardTitle>
                  <CardDescription>Implementation and test status for all features</CardDescription>
                </CardHeader>
                <CardContent className="flex-1 p-0 overflow-hidden">
                  <ScrollArea className="h-full">
                    <div className="p-4">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b">
                            <th className="text-left p-2">Feature</th>
                            <th className="text-left p-2">Area</th>
                            <th className="text-left p-2">Implementation</th>
                            <th className="text-left p-2">Tests</th>
                            <th className="text-left p-2">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {isLoading ? (
                            <tr>
                              <td colSpan={5} className="text-center p-4">Loading features...</td>
                            </tr>
                          ) : filteredFeatures.length === 0 ? (
                            <tr>
                              <td colSpan={5} className="text-center p-4">No features found matching filters</td>
                            </tr>
                          ) : (
                            filteredFeatures.map((feature) => {
                              const testSummary = getFeatureTestSummary(feature.name);
                              return (
                                <tr key={feature.name} className="border-b hover:bg-muted/50 cursor-pointer" onClick={() => openFeatureDetail(feature)}>
                                  <td className="p-2">
                                    <div className="font-medium">{feature.name}</div>
                                  </td>
                                  <td className="p-2">
                                    <Badge variant="outline">{feature.area || 'Unknown'}</Badge>
                                  </td>
                                  <td className="p-2">
                                    {feature.implemented ? (
                                      <Badge className="bg-green-100 text-green-800 hover:bg-green-200">Implemented</Badge>
                                    ) : (
                                      <Badge variant="outline">Not Implemented</Badge>
                                    )}
                                  </td>
                                  <td className="p-2">
                                    {renderTestStatusBadge(feature.testStatus)}
                                    <div className="text-xs text-muted-foreground mt-1">
                                      {testSummary.passed}/{testSummary.total} passed
                                    </div>
                                  </td>
                                  <td className="p-2">
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      disabled={testSummary.total === 0}
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleRunFeatureTests(feature.name);
                                      }}
                                    >
                                      <LuPlay className="h-3 w-3 mr-1" />
                                      Run Tests
                                    </Button>
                                  </td>
                                </tr>
                              );
                            })
                          )}
                        </tbody>
                      </table>
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="tests" className="h-full">
              <Card className="h-full flex flex-col">
                <CardHeader className="pb-2">
                  <CardTitle>Feature Tests</CardTitle>
                  <CardDescription>All registered feature tests with execution status</CardDescription>
                </CardHeader>
                <CardContent className="flex-1 p-0 overflow-hidden">
                  <ScrollArea className="h-full">
                    <div className="p-4">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b">
                            <th className="text-left p-2">Test Name</th>
                            <th className="text-left p-2">Feature</th>
                            <th className="text-left p-2">Area</th>
                            <th className="text-left p-2">Status</th>
                            <th className="text-left p-2">Last Run</th>
                            <th className="text-left p-2">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {isLoading ? (
                            <tr>
                              <td colSpan={6} className="text-center p-4">Loading tests...</td>
                            </tr>
                          ) : (
                            features.flatMap(feature => 
                              getFeatureTests(feature.name).map(test => (
                                <tr key={test.id} className="border-b hover:bg-muted/50">
                                  <td className="p-2">
                                    <div className="font-medium">{test.name}</div>
                                    <div className="text-xs text-muted-foreground">{test.description}</div>
                                  </td>
                                  <td className="p-2">
                                    <div>{test.featureName || 'Unknown'}</div>
                                  </td>
                                  <td className="p-2">
                                    <Badge variant="outline">{test.area || 'Unknown'}</Badge>
                                  </td>
                                  <td className="p-2">
                                    {renderTestStatusBadge(test.status)}
                                  </td>
                                  <td className="p-2">
                                    {test.lastRun ? new Date(test.lastRun).toLocaleString() : 'Never'}
                                    {test.duration !== undefined && (
                                      <div className="text-xs text-muted-foreground">{test.duration.toFixed(2)}ms</div>
                                    )}
                                  </td>
                                  <td className="p-2">
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      disabled={isTestRunning[test.id]}
                                      onClick={() => handleRunTest(test.id)}
                                    >
                                      {isTestRunning[test.id] ? (
                                        <>
                                          <LuRefreshCw className="h-3 w-3 mr-1 animate-spin" />
                                          Running...
                                        </>
                                      ) : (
                                        <>
                                          <LuPlay className="h-3 w-3 mr-1" />
                                          Run
                                        </>
                                      )}
                                    </Button>
                                  </td>
                                </tr>
                              ))
                            )
                          )}
                        </tbody>
                      </table>
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="status" className="h-full">
              <Card className="h-full flex flex-col">
                <CardHeader className="pb-2">
                  <CardTitle>Status Overview</CardTitle>
                  <CardDescription>Global implementation and test status</CardDescription>
                </CardHeader>
                <CardContent className="flex-1 p-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h3 className="text-lg font-medium mb-2">Implementation Status</h3>
                      <div className="space-y-2">
                        <div>
                          <div className="flex justify-between items-center mb-1">
                            <div>Implemented</div>
                            <div className="font-medium">{overallStats.implemented}/{overallStats.totalFeatures}</div>
                          </div>
                          <Progress value={(overallStats.implemented / overallStats.totalFeatures) * 100} className="h-2" />
                        </div>
                        <div>
                          <div className="flex justify-between items-center mb-1">
                            <div>Not Implemented</div>
                            <div className="font-medium">{overallStats.notImplemented}/{overallStats.totalFeatures}</div>
                          </div>
                          <Progress 
                            value={(overallStats.notImplemented / overallStats.totalFeatures) * 100} 
                            className="h-2" 
                            indicatorClassName="bg-orange-500"
                          />
                        </div>
                      </div>
                    </div>
                    
                    <div>
                      <h3 className="text-lg font-medium mb-2">Test Status</h3>
                      <div className="space-y-2">
                        <div>
                          <div className="flex justify-between items-center mb-1">
                            <div>Fully Tested</div>
                            <div className="font-medium">{overallStats.fullyTested}/{overallStats.totalFeatures}</div>
                          </div>
                          <Progress 
                            value={(overallStats.fullyTested / overallStats.totalFeatures) * 100} 
                            className="h-2"
                            indicatorClassName="bg-green-500"
                          />
                        </div>
                        <div>
                          <div className="flex justify-between items-center mb-1">
                            <div>Partially Tested</div>
                            <div className="font-medium">{overallStats.partiallyTested}/{overallStats.totalFeatures}</div>
                          </div>
                          <Progress 
                            value={(overallStats.partiallyTested / overallStats.totalFeatures) * 100}
                            className="h-2"
                            indicatorClassName="bg-blue-500"
                          />
                        </div>
                        <div>
                          <div className="flex justify-between items-center mb-1">
                            <div>Failed</div>
                            <div className="font-medium">{overallStats.failed}/{overallStats.totalFeatures}</div>
                          </div>
                          <Progress 
                            value={(overallStats.failed / overallStats.totalFeatures) * 100}
                            className="h-2"
                            indicatorClassName="bg-red-500"
                          />
                        </div>
                        <div>
                          <div className="flex justify-between items-center mb-1">
                            <div>Not Tested</div>
                            <div className="font-medium">{overallStats.notTested}/{overallStats.totalFeatures}</div>
                          </div>
                          <Progress 
                            value={(overallStats.notTested / overallStats.totalFeatures) * 100}
                            className="h-2"
                            indicatorClassName="bg-yellow-500"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <Separator className="my-6" />
                  
                  <div>
                    <h3 className="text-lg font-medium mb-4">Implementation vs Test Status</h3>
                    <table className="w-full border-collapse">
                      <thead>
                        <tr>
                          <th className="border p-2 text-left">Status</th>
                          <th className="border p-2 text-center">Not Tested</th>
                          <th className="border p-2 text-center">Partially Tested</th>
                          <th className="border p-2 text-center">Fully Tested</th>
                          <th className="border p-2 text-center">Failed</th>
                          <th className="border p-2 text-center">Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td className="border p-2 font-medium">Implemented</td>
                          <td className="border p-2 text-center">
                            {features.filter(f => f.implemented && f.testStatus === 'not_tested').length}
                          </td>
                          <td className="border p-2 text-center">
                            {features.filter(f => f.implemented && f.testStatus === 'partially_passed').length}
                          </td>
                          <td className="border p-2 text-center">
                            {features.filter(f => f.implemented && f.testStatus === 'passed').length}
                          </td>
                          <td className="border p-2 text-center">
                            {features.filter(f => f.implemented && f.testStatus === 'failed').length}
                          </td>
                          <td className="border p-2 text-center font-medium">
                            {features.filter(f => f.implemented).length}
                          </td>
                        </tr>
                        <tr>
                          <td className="border p-2 font-medium">Not Implemented</td>
                          <td className="border p-2 text-center">
                            {features.filter(f => !f.implemented && f.testStatus === 'not_tested').length}
                          </td>
                          <td className="border p-2 text-center">
                            {features.filter(f => !f.implemented && f.testStatus === 'partially_passed').length}
                          </td>
                          <td className="border p-2 text-center">
                            {features.filter(f => !f.implemented && f.testStatus === 'passed').length}
                          </td>
                          <td className="border p-2 text-center">
                            {features.filter(f => !f.implemented && f.testStatus === 'failed').length}
                          </td>
                          <td className="border p-2 text-center font-medium">
                            {features.filter(f => !f.implemented).length}
                          </td>
                        </tr>
                        <tr>
                          <td className="border p-2 font-medium">Total</td>
                          <td className="border p-2 text-center font-medium">
                            {features.filter(f => f.testStatus === 'not_tested').length}
                          </td>
                          <td className="border p-2 text-center font-medium">
                            {features.filter(f => f.testStatus === 'partially_passed').length}
                          </td>
                          <td className="border p-2 text-center font-medium">
                            {features.filter(f => f.testStatus === 'passed').length}
                          </td>
                          <td className="border p-2 text-center font-medium">
                            {features.filter(f => f.testStatus === 'failed').length}
                          </td>
                          <td className="border p-2 text-center font-bold">
                            {features.length}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
      
      {detailModalOpen && selectedFeature && (
        <FeatureDetailModal isOpen={detailModalOpen} onClose={() => setDetailModalOpen(false)} />
      )}
    </FeatureContext.Provider>
  );
}

// Utility function to render test status badge with appropriate styling
function renderTestStatusBadge(status: TestStatus | 'not_tested' | 'passed' | 'failed' | 'partially_passed' | 'skipped') {
  switch (status) {
    case TestStatus.PASSED:
    case 'passed':
      return (
        <Badge className="bg-green-100 text-green-800 hover:bg-green-200">
          <LuCheckCircle2 className="h-3 w-3 mr-1" />
          Passed
        </Badge>
      );
    case TestStatus.FAILED:
    case 'failed':
      return (
        <Badge className="bg-red-100 text-red-800 hover:bg-red-200">
          <LuXCircle className="h-3 w-3 mr-1" />
          Failed
        </Badge>
      );
    case TestStatus.SKIPPED:
    case 'skipped':
      return (
        <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-200">
          <LuAlertCircle className="h-3 w-3 mr-1" />
          Skipped
        </Badge>
      );
    case 'partially_passed':
      return (
        <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-200">
          <LuInfo className="h-3 w-3 mr-1" />
          Partially Passed
        </Badge>
      );
    case TestStatus.NOT_STARTED:
    case 'not_tested':
    default:
      return (
        <Badge variant="outline">
          <LuClock className="h-3 w-3 mr-1" />
          Not Tested
        </Badge>
      );
  }
}

// Feature Detail Modal
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
  const { getFeatureTests } = useFeatureTests();
  const [runningTest, setRunningTest] = useState<string | null>(null);
  
  if (!selectedFeature) return null;
  
  const tests = getFeatureTests(selectedFeature.name);
  
  const handleRunTest = async (testId: string) => {
    if (runningTest) return;
    
    setRunningTest(testId);
    try {
      await runFeatureTest(testId);
    } finally {
      setRunningTest(null);
    }
  };
  
  return (
    <div className={`fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 ${isOpen ? 'block' : 'hidden'}`}>
      <div className="bg-background rounded-lg shadow-lg w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <div className="p-4 border-b flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold">{selectedFeature.name}</h2>
            <div className="flex gap-2 mt-1">
              <Badge variant="outline">{selectedFeature.area || 'Unknown Area'}</Badge>
              {selectedFeature.implemented ? (
                <Badge className="bg-green-100 text-green-800">Implemented</Badge>
              ) : (
                <Badge variant="outline">Not Implemented</Badge>
              )}
              {renderTestStatusBadge(selectedFeature.testStatus)}
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <LuXCircle className="h-5 w-5" />
          </Button>
        </div>
        
        <div className="flex-1 overflow-auto">
          <div className="p-4">
            <Tabs defaultValue="tests">
              <TabsList>
                <TabsTrigger value="tests">Tests</TabsTrigger>
                <TabsTrigger value="notes">Notes</TabsTrigger>
                <TabsTrigger value="dependencies">Dependencies</TabsTrigger>
              </TabsList>
              
              <TabsContent value="tests" className="p-4">
                <div className="mb-4">
                  <h3 className="text-lg font-medium mb-2">Feature Tests</h3>
                  {tests.length === 0 ? (
                    <div className="text-muted-foreground italic">No tests available for this feature</div>
                  ) : (
                    <div className="space-y-4">
                      {tests.map((test) => (
                        <Card key={test.id}>
                          <CardHeader className="pb-2">
                            <CardTitle className="text-base">{test.name}</CardTitle>
                            <CardDescription>{test.description}</CardDescription>
                          </CardHeader>
                          <CardContent className="pb-2">
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <div className="text-sm text-muted-foreground">Status</div>
                                <div>{renderTestStatusBadge(test.status)}</div>
                              </div>
                              <div>
                                <div className="text-sm text-muted-foreground">Last Run</div>
                                <div>{test.lastRun ? new Date(test.lastRun).toLocaleString() : 'Never'}</div>
                              </div>
                              {test.duration !== undefined && (
                                <div>
                                  <div className="text-sm text-muted-foreground">Duration</div>
                                  <div>{test.duration.toFixed(2)}ms</div>
                                </div>
                              )}
                              {test.error && (
                                <div className="col-span-2">
                                  <div className="text-sm text-muted-foreground">Error</div>
                                  <div className="text-red-500 text-sm p-2 bg-red-50 rounded border border-red-100 mt-1">
                                    {test.error}
                                  </div>
                                </div>
                              )}
                            </div>
                          </CardContent>
                          <CardFooter>
                            <Button 
                              variant="outline" 
                              size="sm"
                              disabled={runningTest !== null}
                              onClick={() => handleRunTest(test.id)}
                            >
                              {runningTest === test.id ? (
                                <>
                                  <LuRefreshCw className="h-3 w-3 mr-1 animate-spin" />
                                  Running...
                                </>
                              ) : (
                                <>
                                  <LuPlay className="h-3 w-3 mr-1" />
                                  Run Test
                                </>
                              )}
                            </Button>
                          </CardFooter>
                        </Card>
                      ))}
                    </div>
                  )}
                </div>
              </TabsContent>
              
              <TabsContent value="notes" className="p-4">
                <h3 className="text-lg font-medium mb-2">Implementation Notes</h3>
                {selectedFeature.notes.length === 0 ? (
                  <div className="text-muted-foreground italic">No notes available for this feature</div>
                ) : (
                  <ul className="list-disc pl-5 space-y-2">
                    {selectedFeature.notes.map((note, index) => (
                      <li key={index}>{note}</li>
                    ))}
                  </ul>
                )}
                
                <div className="mt-4">
                  <h4 className="font-medium">Implementation Status</h4>
                  <div className="mt-2">
                    <div className="flex items-center">
                      <div className="w-40 text-sm text-muted-foreground">Status:</div>
                      <div>{selectedFeature.implemented ? 'Implemented' : 'Not Implemented'}</div>
                    </div>
                    {selectedFeature.implementedAt && (
                      <div className="flex items-center mt-1">
                        <div className="w-40 text-sm text-muted-foreground">Implemented At:</div>
                        <div>{new Date(selectedFeature.implementedAt).toLocaleString()}</div>
                      </div>
                    )}
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="dependencies" className="p-4">
                <h3 className="text-lg font-medium mb-2">Dependencies</h3>
                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium mb-2">Test Dependencies</h4>
                    {tests.filter(t => t.dependencies && t.dependencies.length > 0).length === 0 ? (
                      <div className="text-muted-foreground italic">No dependencies found for tests of this feature</div>
                    ) : (
                      <ul className="space-y-2">
                        {tests.filter(t => t.dependencies && t.dependencies.length > 0).map(test => (
                          <li key={test.id}>
                            <span className="font-medium">{test.name}</span> depends on:
                            <ul className="list-disc pl-5 mt-1">
                              {test.dependencies?.map(dep => (
                                <li key={dep}>{dep}</li>
                              ))}
                            </ul>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </div>
        
        <div className="p-4 border-t flex justify-end">
          <Button onClick={onClose}>Close</Button>
        </div>
      </div>
    </div>
  );
}