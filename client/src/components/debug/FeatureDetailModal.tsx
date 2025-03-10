import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FeatureArea } from '@/lib/logger';
import { TestStatus, runFeatureTest } from '@/lib/featureTester';
import { useFeatureTests } from '@/hooks/use-feature-tests';
import { 
  CheckCircle2 as LuCheckCircle2, 
  XCircle as LuXCircle, 
  AlertCircle as LuAlertCircle, 
  Clock as LuClock, 
  Info as LuInfo, 
  Play as LuPlay, 
  RefreshCw as LuRefreshCw,
  FileText as LuFileText,
  FileCog as LuFileCog,
  Beaker as LuBeaker,
  CheckSquare as LuCheckSquare
} from 'lucide-react';
import { useFeatureContext } from './UnifiedDebugDashboard';
import { Separator } from '@/components/ui/separator';

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
  const [selectedTab, setSelectedTab] = useState('overview');
  
  if (!selectedFeature) return null;
  
  const tests = getFeatureTests(selectedFeature.name);
  
  // Process notes to remove duplicates and categorize them
  const processedNotes = useMemo(() => {
    if (!selectedFeature.notes) return { implementation: [], test: [], manual: [], other: [] };
    
    const implementationPattern = /^(Feature (registered|implemented))/i;
    const testRegistrationPattern = /^(Test registered)/i;
    const manualTestPattern = /^(Manual test)/i;
    
    // First deduplicate notes - many are duplicated due to test registration
    const uniqueNotes = new Set<string>();
    selectedFeature.notes.forEach(note => uniqueNotes.add(note));
    
    // Then categorize notes into different types
    const result = {
      implementation: [] as string[],
      test: [] as string[],
      manual: [] as string[],
      other: [] as string[]
    };
    
    uniqueNotes.forEach(note => {
      if (implementationPattern.test(note)) {
        result.implementation.push(note);
      } else if (testRegistrationPattern.test(note)) {
        result.test.push(note);
      } else if (manualTestPattern.test(note)) {
        result.manual.push(note);
      } else {
        result.other.push(note);
      }
    });
    
    return result;
  }, [selectedFeature.notes]);
  
  const handleRunTest = async (testId: string) => {
    if (runningTest) return;
    
    setRunningTest(testId);
    try {
      await runFeatureTest(testId);
    } finally {
      setRunningTest(null);
    }
  };
  
  // Render test status badge with appropriate styling
  const renderTestStatusBadge = (status: TestStatus | 'not_tested' | 'passed' | 'failed' | 'partially_passed' | 'skipped') => {
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
          <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-200">
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
  };
  
  return (
    <div className={`fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 ${isOpen ? 'block' : 'hidden'}`}>
      <div className="bg-background rounded-lg shadow-lg w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col">
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
        
        <div className="flex-1 overflow-auto p-4">
          <Tabs defaultValue="overview" value={selectedTab} onValueChange={setSelectedTab}>
            <TabsList className="grid grid-cols-4 mb-4">
              <TabsTrigger value="overview">
                <LuInfo className="h-4 w-4 mr-2" />
                Overview
              </TabsTrigger>
              <TabsTrigger value="implementation">
                <LuFileCog className="h-4 w-4 mr-2" />
                Implementation
              </TabsTrigger>
              <TabsTrigger value="tests">
                <LuBeaker className="h-4 w-4 mr-2" />
                Automated Tests
              </TabsTrigger>
              <TabsTrigger value="manual">
                <LuCheckSquare className="h-4 w-4 mr-2" />
                Manual Tests
              </TabsTrigger>
            </TabsList>
            
            {/* Overview Tab - Shows a summary of all aspects */}
            <TabsContent value="overview">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Status card */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base flex items-center">
                      <LuInfo className="h-4 w-4 mr-2" />
                      Status Summary
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">Implementation:</span>
                        {selectedFeature.implemented ? (
                          <Badge className="bg-green-100 text-green-800">Implemented</Badge>
                        ) : (
                          <Badge variant="outline">Not Implemented</Badge>
                        )}
                      </div>
                      
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">Test Status:</span>
                        {renderTestStatusBadge(selectedFeature.testStatus)}
                      </div>
                      
                      {selectedFeature.implementedAt && (
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-muted-foreground">Implemented At:</span>
                          <span className="text-sm">
                            {new Date(selectedFeature.implementedAt).toLocaleString()}
                          </span>
                        </div>
                      )}
                      
                      {selectedFeature.lastTested && (
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-muted-foreground">Last Tested:</span>
                          <span className="text-sm">
                            {new Date(selectedFeature.lastTested).toLocaleString()}
                          </span>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
                
                {/* Test counts card */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base flex items-center">
                      <LuBeaker className="h-4 w-4 mr-2" />
                      Test Summary
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-3 gap-2">
                      <div className="flex flex-col items-center justify-center p-3 bg-green-50 rounded-md">
                        <span className="text-xl font-bold text-green-700">
                          {tests.filter(t => t.status === TestStatus.PASSED).length}
                        </span>
                        <span className="text-xs text-green-600 mt-1">Passed</span>
                      </div>
                      <div className="flex flex-col items-center justify-center p-3 bg-red-50 rounded-md">
                        <span className="text-xl font-bold text-red-700">
                          {tests.filter(t => t.status === TestStatus.FAILED).length}
                        </span>
                        <span className="text-xs text-red-600 mt-1">Failed</span>
                      </div>
                      <div className="flex flex-col items-center justify-center p-3 bg-blue-50 rounded-md">
                        <span className="text-xl font-bold text-blue-700">
                          {tests.filter(t => (
                            t.status === TestStatus.SKIPPED || 
                            t.status === TestStatus.NOT_STARTED
                          )).length}
                        </span>
                        <span className="text-xs text-blue-600 mt-1">Pending</span>
                      </div>
                    </div>
                    
                    <div className="mt-4 text-center">
                      <span className="text-sm text-muted-foreground">
                        {tests.length} total tests associated with this feature
                      </span>
                    </div>
                  </CardContent>
                </Card>
                
                {/* Recent test results */}
                <Card className="md:col-span-2">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base flex items-center">
                      <LuFileText className="h-4 w-4 mr-2" />
                      Recent Test Results
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {tests.length === 0 ? (
                      <div className="text-center py-4 text-muted-foreground">
                        No tests available for this feature
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {tests.filter(t => t.lastRun).slice(0, 3).map(test => (
                          <div key={test.id} className="flex items-center justify-between p-2 rounded-md border">
                            <div>
                              <div className="font-medium">{test.name}</div>
                              <div className="text-xs text-muted-foreground">
                                {test.lastRun ? new Date(test.lastRun).toLocaleString() : 'Never run'}
                              </div>
                            </div>
                            <div className="flex items-center">
                              {renderTestStatusBadge(test.status)}
                              <Button 
                                variant="ghost" 
                                size="sm"
                                className="ml-2"
                                onClick={() => {
                                  setSelectedTab('tests');
                                }}
                              >
                                Details
                              </Button>
                            </div>
                          </div>
                        ))}
                        
                        {tests.filter(t => t.lastRun).length === 0 && (
                          <div className="text-center py-2 text-muted-foreground">
                            No tests have been run yet
                          </div>
                        )}
                        
                        {tests.filter(t => t.lastRun).length > 0 && (
                          <div className="text-center mt-2">
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => setSelectedTab('tests')}
                            >
                              View All Test Results
                            </Button>
                          </div>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
            
            {/* Implementation Tab - Focuses on detailed implementation notes */}
            <TabsContent value="implementation">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center">
                    <LuFileCog className="h-5 w-5 mr-2" />
                    Implementation Details
                  </CardTitle>
                  <CardDescription>
                    Information about how this feature was implemented
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-base font-medium mb-2 flex items-center">
                        <LuInfo className="h-4 w-4 mr-2" />
                        Implementation Status
                      </h3>
                      <div className="pl-6 space-y-2">
                        <div className="flex items-center">
                          <div className="w-40 text-sm text-muted-foreground">Status:</div>
                          <div>
                            {selectedFeature.implemented ? (
                              <Badge className="bg-green-100 text-green-800">Implemented</Badge>
                            ) : (
                              <Badge variant="outline">Not Implemented</Badge>
                            )}
                          </div>
                        </div>
                        {selectedFeature.implementedAt && (
                          <div className="flex items-center">
                            <div className="w-40 text-sm text-muted-foreground">Implemented At:</div>
                            <div>{new Date(selectedFeature.implementedAt).toLocaleString()}</div>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <Separator />
                    
                    <div>
                      <h3 className="text-base font-medium mb-2 flex items-center">
                        <LuFileText className="h-4 w-4 mr-2" />
                        Implementation Notes
                      </h3>
                      
                      {processedNotes.implementation.length === 0 ? (
                        <div className="pl-6 text-muted-foreground italic">
                          No implementation notes available
                        </div>
                      ) : (
                        <ul className="list-disc pl-10 space-y-1">
                          {processedNotes.implementation.map((note, index) => (
                            <li key={index} className="text-sm">{note}</li>
                          ))}
                        </ul>
                      )}
                    </div>
                    
                    {processedNotes.other.length > 0 && (
                      <>
                        <Separator />
                        <div>
                          <h3 className="text-base font-medium mb-2 flex items-center">
                            <LuFileText className="h-4 w-4 mr-2" />
                            Additional Notes
                          </h3>
                          <ul className="list-disc pl-10 space-y-1">
                            {processedNotes.other.map((note, index) => (
                              <li key={index} className="text-sm">{note}</li>
                            ))}
                          </ul>
                        </div>
                      </>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            {/* Automated Tests Tab - Shows automated test details and results */}
            <TabsContent value="tests">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center">
                    <LuBeaker className="h-5 w-5 mr-2" />
                    Automated Tests
                  </CardTitle>
                  <CardDescription>
                    View and run automated tests for this feature
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 mb-4">
                    <div className="grid grid-cols-3 gap-2 mb-4">
                      <div className="flex flex-col items-center justify-center p-3 bg-green-50 rounded-md">
                        <span className="text-xl font-bold text-green-700">
                          {tests.filter(t => t.status === TestStatus.PASSED).length}
                        </span>
                        <span className="text-xs text-green-600 mt-1">Passed</span>
                      </div>
                      <div className="flex flex-col items-center justify-center p-3 bg-red-50 rounded-md">
                        <span className="text-xl font-bold text-red-700">
                          {tests.filter(t => t.status === TestStatus.FAILED).length}
                        </span>
                        <span className="text-xs text-red-600 mt-1">Failed</span>
                      </div>
                      <div className="flex flex-col items-center justify-center p-3 bg-blue-50 rounded-md">
                        <span className="text-xl font-bold text-blue-700">
                          {tests.filter(t => (
                            t.status === TestStatus.SKIPPED || 
                            t.status === TestStatus.NOT_STARTED
                          )).length}
                        </span>
                        <span className="text-xs text-blue-600 mt-1">Pending</span>
                      </div>
                    </div>
                    
                    <div>
                      <h3 className="text-base font-medium mb-3">Test Registrations</h3>
                      
                      {processedNotes.test.length === 0 ? (
                        <div className="pl-6 text-muted-foreground italic">
                          No test registration information available
                        </div>
                      ) : (
                        <ul className="list-disc pl-10 space-y-1 mb-4">
                          {processedNotes.test.map((note, index) => (
                            <li key={index} className="text-sm">{note}</li>
                          ))}
                        </ul>
                      )}
                    </div>
                  </div>
                  
                  <Separator className="my-4" />
                  
                  <div>
                    <h3 className="text-base font-medium mb-3">Test Results</h3>
                    {tests.length === 0 ? (
                      <div className="text-muted-foreground italic">No tests available for this feature</div>
                    ) : (
                      <div className="space-y-4">
                        {tests.map((test) => (
                          <Card key={test.id} className="border-l-4" style={{
                            borderLeftColor: test.status === TestStatus.PASSED 
                              ? 'rgb(34 197 94)' // Green-500
                              : test.status === TestStatus.FAILED 
                                ? 'rgb(239 68 68)' // Red-500
                                : 'rgb(229 231 235)' // Gray-200
                          }}>
                            <CardHeader className="pb-2">
                              <CardTitle className="text-base flex items-center justify-between">
                                <span>{test.name}</span>
                                {renderTestStatusBadge(test.status)}
                              </CardTitle>
                              <CardDescription>{test.description}</CardDescription>
                            </CardHeader>
                            <CardContent className="pb-2">
                              <div className="grid grid-cols-2 gap-4">
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
                </CardContent>
              </Card>
            </TabsContent>
            
            {/* Manual Tests Tab - Shows manual test documentation */}
            <TabsContent value="manual">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center">
                    <LuCheckSquare className="h-5 w-5 mr-2" />
                    Manual Test Documentation
                  </CardTitle>
                  <CardDescription>
                    Documentation for manual testing procedures for this feature
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {processedNotes.manual.length === 0 ? (
                    <div className="p-4 text-center">
                      <div className="text-muted-foreground mb-2">
                        No manual test documentation available for this feature
                      </div>
                      <div className="text-sm text-muted-foreground">
                        You can add manual test documentation by adding notes that begin with "Manual test:".
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <h3 className="text-base font-medium">Manual Test Procedures</h3>
                      <ul className="list-decimal pl-5 space-y-3">
                        {processedNotes.manual.map((note, index) => (
                          <li key={index}>
                            <div className="font-medium">Test Case #{index + 1}</div>
                            <div className="text-sm pl-2 mt-1">{note.replace(/^Manual test: /i, '')}</div>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  
                  <div className="mt-8">
                    <h3 className="text-base font-medium mb-3">Add Manual Test Documentation</h3>
                    <div className="bg-amber-50 p-3 rounded-md border border-amber-200 text-amber-800 text-sm">
                      To add manual test documentation, update the feature notes through the logger API by adding notes that begin with "Manual test:".
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
        
        <div className="p-4 border-t flex justify-end">
          <Button onClick={onClose}>Close</Button>
        </div>
      </div>
    </div>
  );
}