import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Progress } from '@/components/ui/progress';
import { 
  Search,
  Filter,
  RefreshCw,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Info,
  X,
  ArrowRight,
  Code,
  FileText,
  History,
  Calendar
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import logger, { FeatureArea } from '@/lib/logger';
import * as debugStorage from '@/lib/debugStorage';
import { TestStatus } from '@/lib/featureTester';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';

interface FeatureStatus {
  name: string;
  implemented: boolean;
  tested: boolean;
  lastVerified: Date | null;
  notes: string[];
  area?: FeatureArea;
}

export function FeatureStatusDashboard() {
  const [features, setFeatures] = useState<Record<string, FeatureStatus>>({});
  const [filteredFeatures, setFilteredFeatures] = useState<Record<string, FeatureStatus>>({});
  const [searchQuery, setSearchQuery] = useState('');
  const [areaFilter, setAreaFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedFeature, setSelectedFeature] = useState<FeatureStatus | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  
  // Get all feature areas for filtering
  const featureAreas = Object.values(FeatureArea).filter(area => typeof area === 'string');
  
  // Calculate statistics
  const totalFeatures = Object.keys(filteredFeatures).length;
  const implementedFeatures = Object.values(filteredFeatures).filter(f => f.implemented).length;
  const testedFeatures = Object.values(filteredFeatures).filter(f => f.tested).length;
  const implementedPercentage = totalFeatures > 0 ? (implementedFeatures / totalFeatures) * 100 : 0;
  const testedPercentage = totalFeatures > 0 ? (testedFeatures / totalFeatures) * 100 : 0;
  const completePercentage = totalFeatures > 0 ? 
    (Object.values(filteredFeatures).filter(f => f.implemented && f.tested).length / totalFeatures) * 100 : 0;
  
  // Load feature verification status
  const loadFeatureStatus = async () => {
    setIsLoading(true);
    
    try {
      // Fetch feature status from server API
      const response = await fetch('/api/debug/query', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: 'getFeatureVerificationStatus'
        })
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch feature status');
      }
      
      const data = await response.json();
      const serverFeatures = data.result || {};
      
      // Convert to our component's data structure
      const featureStatusMap: Record<string, FeatureStatus> = {};
      
      Object.entries(serverFeatures).forEach(([name, status]: [string, any]) => {
        featureStatusMap[name] = {
          name,
          implemented: status.implemented,
          tested: status.tested,
          lastVerified: status.lastVerified ? new Date(status.lastVerified) : null,
          notes: status.notes || [],
          // Try to determine the area from the name
          area: determineFeatureArea(name)
        };
      });
      
      // If API call fails, fall back to local storage
      if (Object.keys(featureStatusMap).length === 0) {
        const verificationStatus = logger.getFeatureVerificationStatus();
        
        Object.entries(verificationStatus).forEach(([name, status]) => {
          featureStatusMap[name] = {
            name,
            implemented: status.implemented,
            tested: status.tested,
            lastVerified: status.lastVerified,
            notes: status.notes,
            area: determineFeatureArea(name)
          };
        });
      }
      
      console.log('Loaded features from server:', featureStatusMap);
      setFeatures(featureStatusMap);
      applyFilters(featureStatusMap, searchQuery, areaFilter, statusFilter);
    } catch (error) {
      console.error('Error loading feature status:', error);
      
      // Fall back to local feature verification
      const verificationStatus = logger.getFeatureVerificationStatus();
      const featureStatusMap: Record<string, FeatureStatus> = {};
      
      Object.entries(verificationStatus).forEach(([name, status]) => {
        featureStatusMap[name] = {
          name,
          implemented: status.implemented,
          tested: status.tested,
          lastVerified: status.lastVerified,
          notes: status.notes,
          area: determineFeatureArea(name)
        };
      });
      
      setFeatures(featureStatusMap);
      applyFilters(featureStatusMap, searchQuery, areaFilter, statusFilter);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Determine feature area from name (best guess based on name)
  const determineFeatureArea = (name: string): FeatureArea => {
    const nameLower = name.toLowerCase();
    
    if (nameLower.includes('goal')) return FeatureArea.GOAL;
    if (nameLower.includes('progress')) return FeatureArea.PROGRESS;
    if (nameLower.includes('dashboard')) return FeatureArea.DASHBOARD;
    if (nameLower.includes('analytics') || nameLower.includes('chart')) return FeatureArea.ANALYTICS;
    if (nameLower.includes('achievement') || nameLower.includes('badge')) return FeatureArea.ACHIEVEMENT;
    if (nameLower.includes('settings')) return FeatureArea.SETTINGS;
    if (nameLower.includes('auth') || nameLower.includes('login')) return FeatureArea.AUTH;
    if (nameLower.includes('api')) return FeatureArea.API;
    if (nameLower.includes('storage') || nameLower.includes('database')) return FeatureArea.STORAGE;
    if (nameLower.includes('ui') || nameLower.includes('component')) return FeatureArea.UI;
    if (nameLower.includes('notification')) return FeatureArea.NOTIFICATION;
    if (nameLower.includes('performance')) return FeatureArea.PERFORMANCE;
    
    return FeatureArea.UI; // Default
  };
  
  // Apply filters to the features
  const applyFilters = (
    allFeatures: Record<string, FeatureStatus>,
    query: string,
    area: string,
    status: string
  ) => {
    let result = { ...allFeatures };
    
    // Apply search query
    if (query) {
      const lowerQuery = query.toLowerCase();
      result = Object.entries(result).reduce((filtered, [key, feature]) => {
        if (
          feature.name.toLowerCase().includes(lowerQuery) ||
          feature.notes.some(note => note.toLowerCase().includes(lowerQuery))
        ) {
          filtered[key] = feature;
        }
        return filtered;
      }, {} as Record<string, FeatureStatus>);
    }
    
    // Apply area filter
    if (area !== 'all') {
      result = Object.entries(result).reduce((filtered, [key, feature]) => {
        if (feature.area === area) {
          filtered[key] = feature;
        }
        return filtered;
      }, {} as Record<string, FeatureStatus>);
    }
    
    // Apply status filter
    if (status !== 'all') {
      result = Object.entries(result).reduce((filtered, [key, feature]) => {
        if (
          (status === 'implemented' && feature.implemented) ||
          (status === 'tested' && feature.tested) ||
          (status === 'complete' && feature.implemented && feature.tested) ||
          (status === 'in-progress' && feature.implemented && !feature.tested) ||
          (status === 'not-started' && !feature.implemented && !feature.tested)
        ) {
          filtered[key] = feature;
        }
        return filtered;
      }, {} as Record<string, FeatureStatus>);
    }
    
    setFilteredFeatures(result);
  };
  
  // Handle search input changes
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchQuery(query);
    applyFilters(features, query, areaFilter, statusFilter);
  };
  
  // Handle area filter changes
  const handleAreaFilterChange = (value: string) => {
    setAreaFilter(value);
    applyFilters(features, searchQuery, value, statusFilter);
  };
  
  // Handle status filter changes
  const handleStatusFilterChange = (value: string) => {
    setStatusFilter(value);
    applyFilters(features, searchQuery, areaFilter, value);
  };
  
  // Initial load
  useEffect(() => {
    // Call the async function within useEffect
    const fetchFeatures = async () => {
      await loadFeatureStatus();
    };
    
    fetchFeatures();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  
  // Handle modal close
  const handleCloseModal = () => {
    setIsDetailModalOpen(false);
  };

  // Get feature test results if available
  const getFeatureTestData = (featureName: string) => {
    const testResults = debugStorage.getFeatureTestResults();
    const relevantTests = Object.values(testResults).filter(
      test => test.name.includes(featureName) || test.description.includes(featureName)
    );
    return relevantTests;
  };

  // Get related logs for a feature
  const getFeatureLogs = (featureName: string) => {
    const allLogs = debugStorage.getLogEntries();
    return allLogs.filter(log => 
      log.message.includes(featureName) || 
      (log.data && JSON.stringify(log.data).includes(featureName))
    );
  };

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Feature Implementation Status</CardTitle>
            <Button 
              variant="outline" 
              size="icon" 
              onClick={() => {
                const fetchFeatures = async () => {
                  await loadFeatureStatus();
                };
                fetchFeatures();
              }} 
              disabled={isLoading}
            >
              <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
          <CardDescription>Track the implementation and testing status of application features</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center">
                    <h3 className="text-lg font-semibold mb-2">Implementation</h3>
                    <div className="flex justify-center items-center space-x-2 mb-2">
                      <span className="text-2xl font-bold">{implementedFeatures}</span>
                      <span className="text-sm text-gray-500">/ {totalFeatures}</span>
                    </div>
                    <Progress value={implementedPercentage} className="h-2" />
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center">
                    <h3 className="text-lg font-semibold mb-2">Tested</h3>
                    <div className="flex justify-center items-center space-x-2 mb-2">
                      <span className="text-2xl font-bold">{testedFeatures}</span>
                      <span className="text-sm text-gray-500">/ {totalFeatures}</span>
                    </div>
                    <Progress value={testedPercentage} className="h-2" />
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center">
                    <h3 className="text-lg font-semibold mb-2">Complete</h3>
                    <div className="flex justify-center items-center space-x-2 mb-2">
                      <span className="text-2xl font-bold">
                        {Object.values(filteredFeatures).filter(f => f.implemented && f.tested).length}
                      </span>
                      <span className="text-sm text-gray-500">/ {totalFeatures}</span>
                    </div>
                    <Progress value={completePercentage} className="h-2" />
                  </div>
                </CardContent>
              </Card>
            </div>
            
            {/* Filters */}
            <div className="flex flex-col space-y-4 md:flex-row md:space-y-0 md:space-x-4">
              <div className="relative flex-grow">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-500" />
                <Input
                  placeholder="Search features..."
                  className="pl-8"
                  value={searchQuery}
                  onChange={handleSearchChange}
                />
              </div>
              
              <div className="flex space-x-2">
                <Select value={areaFilter} onValueChange={handleAreaFilterChange}>
                  <SelectTrigger className="w-[180px]">
                    <Filter className="h-4 w-4 mr-2" />
                    <SelectValue placeholder="Filter by area" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Areas</SelectItem>
                    {featureAreas.map(area => (
                      <SelectItem key={area as string} value={area as string}>
                        {(area as string).charAt(0).toUpperCase() + (area as string).slice(1)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                
                <Select value={statusFilter} onValueChange={handleStatusFilterChange}>
                  <SelectTrigger className="w-[180px]">
                    <Filter className="h-4 w-4 mr-2" />
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="implemented">Implemented</SelectItem>
                    <SelectItem value="tested">Tested</SelectItem>
                    <SelectItem value="complete">Complete</SelectItem>
                    <SelectItem value="in-progress">In Progress</SelectItem>
                    <SelectItem value="not-started">Not Started</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            {/* Feature List */}
            <ScrollArea className="h-[400px] border rounded-md p-4">
              <div className="space-y-4">
                {Object.keys(filteredFeatures).length === 0 ? (
                  <div className="text-center p-8 text-gray-500">
                    {isLoading ? 'Loading features...' : 'No features found matching the filters'}
                  </div>
                ) : (
                  Object.entries(filteredFeatures).map(([name, feature]) => (
                    <div 
                      key={name} 
                      className="flex justify-between items-start p-4 border rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer transition-colors"
                      onClick={() => {
                        setSelectedFeature(feature);
                        setIsDetailModalOpen(true);
                      }}
                    >
                      <div className="flex-grow">
                        <div className="flex items-center mb-1">
                          <h3 className="font-medium text-lg">{feature.name}</h3>
                          <div className="ml-2">
                            <Badge variant="outline">
                              {feature.area || 'Unknown Area'}
                            </Badge>
                          </div>
                        </div>
                        
                        {feature.notes.length > 0 && (
                          <div className="text-sm text-gray-500 mt-1">
                            <div className="font-semibold">Notes:</div>
                            <ul className="list-disc list-inside">
                              {feature.notes.slice(0, 2).map((note, i) => (
                                <li key={i}>{note}</li>
                              ))}
                              {feature.notes.length > 2 && (
                                <li className="text-blue-500">+ {feature.notes.length - 2} more...</li>
                              )}
                            </ul>
                          </div>
                        )}
                        
                        {feature.lastVerified && (
                          <div className="text-xs text-gray-400 mt-1">
                            Last updated: {feature.lastVerified.toLocaleString()}
                          </div>
                        )}
                      </div>
                      
                      <div className="flex flex-col items-end space-y-2">
                        <div className="flex space-x-2">
                          <Badge variant={feature.implemented ? "success" : "outline"}>
                            {feature.implemented ? (
                              <><CheckCircle2 className="h-3 w-3 mr-1" /> Implemented</>
                            ) : (
                              <><XCircle className="h-3 w-3 mr-1" /> Not Implemented</>
                            )}
                          </Badge>
                          
                          <Badge variant={feature.tested ? "success" : "outline"}>
                            {feature.tested ? (
                              <><CheckCircle2 className="h-3 w-3 mr-1" /> Tested</>
                            ) : (
                              <><AlertTriangle className="h-3 w-3 mr-1" /> Not Tested</>
                            )}
                          </Badge>
                        </div>
                        
                        <div>
                          <Badge 
                            variant={
                              feature.implemented && feature.tested 
                                ? "success" 
                                : feature.implemented 
                                  ? "warning" 
                                  : "destructive"
                            }
                          >
                            {feature.implemented && feature.tested 
                              ? "Complete" 
                              : feature.implemented 
                                ? "In Progress" 
                                : "Not Started"}
                          </Badge>
                        </div>

                        <Button variant="ghost" size="sm" className="mt-1">
                          <Info className="h-4 w-4 mr-1" /> Details
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </ScrollArea>
          </div>
        </CardContent>
      </Card>
      
      {/* Feature Detail Modal */}
      <Dialog open={isDetailModalOpen} onOpenChange={setIsDetailModalOpen}>
        <DialogContent className="sm:max-w-[700px] max-h-[80vh] overflow-y-auto">
          {selectedFeature && (
            <>
              <DialogHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <DialogTitle className="text-xl font-bold mr-2">{selectedFeature.name}</DialogTitle>
                    <Badge variant="outline">{selectedFeature.area}</Badge>
                  </div>
                  <Badge 
                    variant={
                      selectedFeature.implemented && selectedFeature.tested 
                        ? "success" 
                        : selectedFeature.implemented 
                          ? "warning" 
                          : "destructive"
                    }
                    className="ml-2"
                  >
                    {selectedFeature.implemented && selectedFeature.tested 
                      ? "Complete" 
                      : selectedFeature.implemented 
                        ? "In Progress" 
                        : "Not Started"}
                  </Badge>
                </div>
                <DialogDescription>
                  Detailed implementation and testing information
                </DialogDescription>
              </DialogHeader>
              
              <Tabs defaultValue="overview" className="mt-4">
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="overview">Overview</TabsTrigger>
                  <TabsTrigger value="implementation">Implementation</TabsTrigger>
                  <TabsTrigger value="tests">Tests</TabsTrigger>
                  <TabsTrigger value="logs">Logs</TabsTrigger>
                </TabsList>
                
                <TabsContent value="overview" className="space-y-4 mt-4">
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
                                {selectedFeature.lastVerified.toLocaleDateString()}
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
                            {selectedFeature.area}
                          </Badge>
                          <div className="text-sm text-gray-500">
                            Features in this area: {
                              Object.values(features).filter(f => f.area === selectedFeature.area).length
                            }
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                  
                  {selectedFeature.notes.length > 0 && (
                    <Card>
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
                </TabsContent>
                
                <TabsContent value="implementation" className="space-y-4 mt-4">
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
                          <div className="space-y-2">
                            <h4 className="font-semibold">Implementation Date</h4>
                            <p>{selectedFeature.lastVerified ? selectedFeature.lastVerified.toLocaleString() : 'Unknown'}</p>
                          </div>
                          <Separator />
                          <div className="space-y-2">
                            <h4 className="font-semibold">Implementation Notes</h4>
                            {selectedFeature.notes.length > 0 ? (
                              <ul className="space-y-2 pl-6 list-disc">
                                {selectedFeature.notes.map((note, i) => (
                                  <li key={i}>{note}</li>
                                ))}
                              </ul>
                            ) : (
                              <p className="text-gray-500 italic">No notes available</p>
                            )}
                          </div>
                        </>
                      ) : (
                        <div className="flex flex-col items-center justify-center py-8 text-center">
                          <XCircle className="h-16 w-16 text-gray-400 mb-4" />
                          <h3 className="text-lg font-semibold">Not Implemented Yet</h3>
                          <p className="text-gray-500 max-w-md mt-2">
                            This feature has not been implemented yet. Check back later for implementation details.
                          </p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>
                
                <TabsContent value="tests" className="mt-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center">
                        <FileText className="h-5 w-5 mr-2" />
                        Test Results
                      </CardTitle>
                      <CardDescription>
                        View the test results for this feature
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      {selectedFeature.tested ? (
                        (() => {
                          const testData = getFeatureTestData(selectedFeature.name);
                          return testData.length > 0 ? (
                            <div className="space-y-4">
                              {testData.map((test, i) => (
                                <div key={i} className="border rounded-md p-4">
                                  <div className="flex justify-between items-start">
                                    <div>
                                      <h4 className="font-semibold">{test.name}</h4>
                                      <p className="text-sm text-gray-500">{test.description}</p>
                                    </div>
                                    <Badge variant={
                                      typeof test.status === 'string' 
                                        ? test.status.toLowerCase() === 'passed' ? 'success' : 'destructive'
                                        : test.status === TestStatus.PASSED ? 'success' : 'destructive'
                                    }>
                                      {test.status}
                                    </Badge>
                                  </div>
                                  {test.error && (
                                    <div className="mt-2 p-2 bg-red-50 dark:bg-red-900/20 rounded text-sm">
                                      <p className="font-semibold text-red-700 dark:text-red-400">Error:</p>
                                      <p className="font-mono">{test.error}</p>
                                    </div>
                                  )}
                                  {test.timestamp && (
                                    <div className="text-xs text-gray-500 mt-2">
                                      Run at: {new Date(test.timestamp).toLocaleString()}
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="text-center py-8">
                              <p className="text-gray-500">No test data found for this feature.</p>
                            </div>
                          );
                        })()
                      ) : (
                        <div className="flex flex-col items-center justify-center py-8 text-center">
                          <AlertTriangle className="h-16 w-16 text-gray-400 mb-4" />
                          <h3 className="text-lg font-semibold">Not Tested Yet</h3>
                          <p className="text-gray-500 max-w-md mt-2">
                            This feature has not been tested yet. Check back later for test results.
                          </p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>
                
                <TabsContent value="logs" className="mt-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center">
                        <History className="h-5 w-5 mr-2" />
                        Development Logs
                      </CardTitle>
                      <CardDescription>
                        Activity logs related to this feature
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      {(() => {
                        const logs = getFeatureLogs(selectedFeature.name);
                        return logs.length > 0 ? (
                          <ScrollArea className="h-[300px]">
                            <div className="space-y-2">
                              {logs.map((log, i) => (
                                <div key={i} className="border-b pb-2 last:border-0">
                                  <div className="flex justify-between items-start">
                                    <span className="text-sm font-semibold">{log.message}</span>
                                    <Badge variant="outline">{log.level}</Badge>
                                  </div>
                                  {log.data && (
                                    <pre className="mt-1 text-xs bg-gray-100 dark:bg-gray-800 p-2 rounded overflow-x-auto">
                                      {JSON.stringify(log.data, null, 2)}
                                    </pre>
                                  )}
                                  <div className="text-xs text-gray-500 mt-1">
                                    {new Date(log.timestamp).toLocaleString()} - Area: {log.area}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </ScrollArea>
                        ) : (
                          <div className="text-center py-8">
                            <p className="text-gray-500">No logs found for this feature.</p>
                          </div>
                        );
                      })()}
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}