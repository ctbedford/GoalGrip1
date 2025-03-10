import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FeatureArea } from '@/lib/logger';
import { TestStatus, runFeatureTest } from '@/lib/featureTester';
import { useFeatureTests } from '@/hooks/use-feature-tests';
import { LuCheckCircle2, LuXCircle, LuAlertCircle, LuClock, LuInfo, LuPlay, LuRefreshCw } from 'react-icons/lu';
import { useFeatureContext } from './UnifiedDebugDashboard';

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