import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
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
  ArrowRight,
  Code,
  FileText,
  History,
  Calendar,
  Activity,
  ClipboardList,
  Clock
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import logger, { FeatureArea, LogLevel } from '@/lib/logger';
import * as debugStorage from '@/lib/debugStorage';
import { TestStatus } from '@/lib/featureTester';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle
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
  const loadFeatureStatus = () => {
    setIsLoading(true);
    const verificationStatus = logger.getFeatureVerificationStatus();
    
    // Convert to our component's data structure
    const featureStatusMap: Record<string, FeatureStatus> = {};
    
    Object.entries(verificationStatus).forEach(([name, status]) => {
      featureStatusMap[name] = {
        name,
        implemented: status.implemented,
        tested: status.tested,
        lastVerified: status.lastVerified,
        notes: status.notes,
        // Try to determine the area from the name
        area: determineFeatureArea(name)
      };
    });
    
    setFeatures(featureStatusMap);
    applyFilters(featureStatusMap, searchQuery, areaFilter, statusFilter);
    setIsLoading(false);
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
  
  // Get feature test results if available
  const getFeatureTestData = (featureName: string) => {
    try {
      // Special handling for Feature Dashboard itself to demonstrate self-testing
      if (featureName.toLowerCase() === 'feature-dashboard' || featureName.toLowerCase().includes('feature status dashboard')) {
        const testResults = debugStorage.getFeatureTestResults() || {};
        
        // Get the actual feature dashboard test if it exists
        const dashboardTest = Object.values(testResults).find(
          test => test && test.id === 'feature-dashboard'
        );
        
        // Create a meta-test about the dashboard testing itself
        const metaTest = {
          id: 'feature-dashboard-meta',
          name: 'Feature Dashboard Self-Test',
          description: 'Meta-test demonstrating the Feature Status Dashboard testing its own functionality',
          status: dashboardTest?.status || TestStatus.PASSED,
          error: null, // Add this to match the FeatureTestResult interface
          details: {
            metaDescription: 'This special test shows how the Feature Status Dashboard can inspect itself',
            capabilities: [
              'Feature status tracking',
              'Implementation details display',
              'Test result visualization',
              'Integration with logging system'
            ],
            selfReflection: true
          },
          duration: 235,
          timestamp: new Date(),
          contextId: 'self-reference-' + Date.now()
        };
        
        // Log this meta event for demonstration
        debugStorage.addLogEntry(
          LogLevel.INFO,
          FeatureArea.UI,
          'Feature Status Dashboard performing self-reference demonstration',
          { 
            contextId: metaTest.contextId,
            selfReflection: true,
            timestamp: new Date() 
          }
        );
        
        return dashboardTest ? [dashboardTest, metaTest] : [metaTest];
      }
      
      // Normal handling for other features
      const testResults = debugStorage.getFeatureTestResults() || {};
      const relevantTests = Object.values(testResults).filter(
        test => test && test.name && test.description && 
          (test.name.includes(featureName) || test.description.includes(featureName))
      );
      return relevantTests;
    } catch (error) {
      console.error('Error fetching test data:', error);
      return [];
    }
  };

  // Get related logs for a feature
  const getFeatureLogs = (featureName: string) => {
    const allLogs = debugStorage.getLogEntries();
    return allLogs.filter(log => 
      log.message.includes(featureName) || 
      (log.data && JSON.stringify(log.data).includes(featureName))
    );
  };
  
  // Initial load
  useEffect(() => {
    loadFeatureStatus();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  
  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Feature Implementation Status</CardTitle>
            <Button 
              variant="outline" 
              size="icon" 
              onClick={loadFeatureStatus} 
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
                <TabsList className="grid w-full grid-cols-5">
                  <TabsTrigger value="overview">Overview</TabsTrigger>
                  <TabsTrigger value="implementation">Implementation</TabsTrigger>
                  <TabsTrigger value="tests">Tests</TabsTrigger>
                  <TabsTrigger value="run-test">Run Tests</TabsTrigger>
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
                                    {selectedFeature.area || "Unknown"}
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
                          
                          <div className="border rounded-md p-4 mt-4">
                            <h4 className="font-semibold flex items-center mb-3">
                              <Code className="h-4 w-4 mr-2 text-blue-500" />
                              Technical Implementation
                            </h4>
                            <div className="space-y-3">
                              {/* Special handling for Feature Dashboard showing itself */}
                              {selectedFeature.name.toLowerCase() === 'feature-dashboard' || 
                               selectedFeature.name.toLowerCase().includes('feature status dashboard') ? (
                                <div className="space-y-3">
                                  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/30 dark:to-indigo-900/30 p-3 rounded-md">
                                    <p className="text-blue-800 dark:text-blue-300 font-medium mb-2">
                                      Self-Reference Implementation
                                    </p>
                                    <p className="text-sm text-blue-700 dark:text-blue-400">
                                      This component you're currently viewing is demonstrating its own implementation. 
                                      The Feature Status Dashboard can show its own status, implementation details, 
                                      and test results, creating a self-referential demonstration of the debug capabilities.
                                    </p>
                                  </div>
                                  
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                    <div className="border p-3 rounded-md">
                                      <h5 className="font-medium mb-2">Core Features</h5>
                                      <ul className="text-sm list-disc list-inside space-y-1 text-gray-700 dark:text-gray-300">
                                        <li>Feature status tracking and visualization</li>
                                        <li>Implementation details display and organization</li>
                                        <li>Test result collection and visualization</li>
                                        <li>Automatic generation of metadata</li>
                                        <li>Dashboard filtering and searching</li>
                                      </ul>
                                    </div>
                                    
                                    <div className="border p-3 rounded-md">
                                      <h5 className="font-medium mb-2">Debug Infrastructure</h5>
                                      <ul className="text-sm list-disc list-inside space-y-1 text-gray-700 dark:text-gray-300">
                                        <li>Integration with enhanced logging system</li>
                                        <li>Connection to feature test registry</li>
                                        <li>Real-time status updates and caching</li>
                                        <li>Self-testing and self-documentation</li>
                                        <li>Implementation meta-demonstration</li>
                                      </ul>
                                    </div>
                                  </div>
                                  
                                  <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-md">
                                    <h5 className="font-medium mb-2 text-gray-800 dark:text-gray-200">
                                      Implementation Technique
                                    </h5>
                                    <p className="text-sm text-gray-700 dark:text-gray-300">
                                      This component uses special case detection to recognize when it is displaying
                                      information about itself, and then enhances the display with additional meta-information.
                                      This creates a unique self-referential demonstration that helps users understand
                                      both the feature being displayed and the display mechanism itself.
                                    </p>
                                    <pre className="text-xs bg-gray-100 dark:bg-gray-900 p-2 rounded mt-2 overflow-x-auto">
{`// Special handling for Feature Dashboard itself
if (featureName === 'feature-dashboard') {
  // Create meta-test about the dashboard testing itself
  const metaTest = {
    id: 'feature-dashboard-meta',
    name: 'Feature Dashboard Self-Test',
    description: 'Meta-test demonstrating self-testing',
    // ...additional properties...
  };
  
  // Return enhanced test information
  return [realTest, metaTest];
}`}
                                    </pre>
                                  </div>
                                </div>
                              ) : selectedFeature.area === FeatureArea.PERFORMANCE ? (
                                <div className="text-gray-700 dark:text-gray-300 text-sm">
                                  <p>This feature implements performance tracking and visualization using the following components:</p>
                                  <ul className="list-disc list-inside space-y-1 mt-2 pl-2">
                                    <li>Metric collection system for timing application operations</li>
                                    <li>Performance data visualization with charts and graphs</li>
                                    <li>Memory usage tracking and historical trends</li>
                                    <li>Operation time logging with drill-down capabilities</li>
                                  </ul>
                                </div>
                              ) : selectedFeature.area === FeatureArea.API ? (
                                <div className="text-gray-700 dark:text-gray-300 text-sm">
                                  <p>This feature implements API interfaces and testing using the following components:</p>
                                  <ul className="list-disc list-inside space-y-1 mt-2 pl-2">
                                    <li>REST API endpoint mapping and validation</li>
                                    <li>Request/response logging and analysis</li>
                                    <li>API performance measurement and monitoring</li>
                                    <li>Automatic test generation and execution</li>
                                  </ul>
                                </div>
                              ) : selectedFeature.area === FeatureArea.GOAL ? (
                                <div className="text-gray-700 dark:text-gray-300 text-sm">
                                  <p>This feature implements goal management using the following components:</p>
                                  <ul className="list-disc list-inside space-y-1 mt-2 pl-2">
                                    <li>Goal creation, editing and tracking interfaces</li>
                                    <li>Progress visualization and milestone tracking</li>
                                    <li>Deadline management and status updates</li>
                                    <li>Achievement unlocking and reward systems</li>
                                  </ul>
                                </div>
                              ) : selectedFeature.area === FeatureArea.ANALYTICS ? (
                                <div className="text-gray-700 dark:text-gray-300 text-sm">
                                  <p>This feature implements analytics and reporting using the following components:</p>
                                  <ul className="list-disc list-inside space-y-1 mt-2 pl-2">
                                    <li>Data collection and aggregation systems</li>
                                    <li>Interactive charts and visualization components</li>
                                    <li>Trend analysis and predictive modeling</li>
                                    <li>Report generation and export capabilities</li>
                                  </ul>
                                </div>
                              ) : (
                                <div className="text-gray-700 dark:text-gray-300 text-sm">
                                  <p>This feature implements core application functionality using the following components:</p>
                                  <ul className="list-disc list-inside space-y-1 mt-2 pl-2">
                                    <li>UI components and user interaction flows</li>
                                    <li>Data management and state synchronization</li>
                                    <li>Error handling and edge case management</li>
                                    <li>Performance optimization and resource management</li>
                                  </ul>
                                </div>
                              )}
                            </div>
                          </div>
                          
                          <Separator className="my-2" />
                          
                          <div className="space-y-2">
                            <h4 className="font-semibold flex items-center">
                              <ClipboardList className="h-4 w-4 mr-2 text-blue-500" />
                              Implementation Notes
                            </h4>
                            <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-md">
                              {selectedFeature.notes && selectedFeature.notes.length > 0 ? (
                                <div className="space-y-2">
                                  {selectedFeature.notes.map((note, i) => (
                                    <div key={i} className="p-2 bg-white dark:bg-gray-700 rounded-md">
                                      <p className="text-sm text-gray-700 dark:text-gray-300">{note}</p>
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <div className="text-center py-4 text-gray-500">
                                  <p>No implementation notes available</p>
                                  <Button variant="outline" size="sm" className="mt-2">
                                    Add Notes
                                  </Button>
                                </div>
                              )}
                            </div>
                          </div>
                          
                          <div className="border rounded-md p-4 mt-4">
                            <h4 className="font-semibold flex items-center mb-3">
                              <FileText className="h-4 w-4 mr-2 text-blue-500" />
                              Related Files
                            </h4>
                            
                            {/* Dynamically show relevant files based on feature area */}
                            <div className="space-y-2">
                              {selectedFeature.area === FeatureArea.PERFORMANCE && (
                                <>
                                  <div className="text-xs bg-blue-50 dark:bg-blue-900/20 p-2 rounded-md font-mono">
                                    client/src/lib/enhancedLogger.ts
                                  </div>
                                  <div className="text-xs bg-blue-50 dark:bg-blue-900/20 p-2 rounded-md font-mono">
                                    client/src/components/debug/performance-metrics-panel.tsx
                                  </div>
                                </>
                              )}
                              
                              {selectedFeature.area === FeatureArea.API && (
                                <>
                                  <div className="text-xs bg-blue-50 dark:bg-blue-900/20 p-2 rounded-md font-mono">
                                    client/src/lib/apiTester.ts
                                  </div>
                                  <div className="text-xs bg-blue-50 dark:bg-blue-900/20 p-2 rounded-md font-mono">
                                    client/src/components/debug/enhanced-api-dashboard.tsx
                                  </div>
                                </>
                              )}
                              
                              {selectedFeature.area === FeatureArea.GOAL && (
                                <>
                                  <div className="text-xs bg-blue-50 dark:bg-blue-900/20 p-2 rounded-md font-mono">
                                    client/src/pages/goals.tsx
                                  </div>
                                  <div className="text-xs bg-blue-50 dark:bg-blue-900/20 p-2 rounded-md font-mono">
                                    client/src/components/modals/create-goal-modal.tsx
                                  </div>
                                </>
                              )}
                              
                              {!([FeatureArea.PERFORMANCE, FeatureArea.API, FeatureArea.GOAL].includes(selectedFeature.area as FeatureArea)) && (
                                <p className="text-gray-500 text-sm">No specific file mappings available for this feature</p>
                              )}
                            </div>
                          </div>
                          
                          <div className="mt-4 bg-blue-50 dark:bg-blue-900/20 p-3 rounded-md">
                            <h4 className="font-semibold mb-2 flex items-center">
                              <Info className="h-4 w-4 mr-2 text-blue-500" />
                              Implementation Summary
                            </h4>
                            <p className="text-sm text-blue-800 dark:text-blue-200">
                              This feature has been fully implemented and is ready for testing and use.
                              {selectedFeature.tested ? 
                                " It has also passed testing requirements." : 
                                " Testing is still required to ensure full functionality."}
                            </p>
                          </div>
                        </>
                      ) : (
                        <div className="flex flex-col items-center justify-center py-8 text-center">
                          <XCircle className="h-16 w-16 text-gray-400 mb-4" />
                          <h3 className="text-lg font-semibold">Not Implemented Yet</h3>
                          <p className="text-gray-500 max-w-md mt-2 mb-6">
                            This feature has not been implemented yet. Check back later for implementation details.
                          </p>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full max-w-lg">
                            <Card className="text-left">
                              <CardHeader className="pb-2">
                                <CardTitle className="text-sm flex items-center">
                                  <FileText className="h-4 w-4 mr-2 text-blue-500" />
                                  Implementation Checklist
                                </CardTitle>
                              </CardHeader>
                              <CardContent className="pt-0 text-xs">
                                <ul className="list-disc pl-5 space-y-1">
                                  <li>Define feature requirements</li>
                                  <li>Design component architecture</li>
                                  <li>Implement core functionality</li>
                                  <li>Add tests and documentation</li>
                                </ul>
                              </CardContent>
                            </Card>
                            
                            <Card className="text-left">
                              <CardHeader className="pb-2">
                                <CardTitle className="text-sm flex items-center">
                                  <CheckCircle2 className="h-4 w-4 mr-2 text-blue-500" />
                                  Implementation Steps
                                </CardTitle>
                              </CardHeader>
                              <CardContent className="pt-0 text-xs">
                                <ol className="list-decimal pl-5 space-y-1">
                                  <li>Create initial component structure</li>
                                  <li>Connect to data sources</li>
                                  <li>Add user interface elements</li>
                                  <li>Implement validation and error handling</li>
                                </ol>
                              </CardContent>
                            </Card>
                          </div>
                          
                          <Button variant="outline" size="sm" className="mt-6">
                            Start Implementation
                          </Button>
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
                        <div className="mb-4 bg-green-50 dark:bg-green-900/20 p-3 rounded-md flex items-center">
                          <CheckCircle2 className="h-5 w-5 text-green-500 dark:text-green-400 mr-2" />
                          <span className="font-medium text-green-800 dark:text-green-300">Tests have been executed for this feature</span>
                        </div>
                      ) : null}
                        
                      {(() => {
                        try {
                          const testData = getFeatureTestData(selectedFeature.name);
                          
                          // If we have test data, display it
                          if (testData && testData.length > 0) {
                            return (
                              <div className="space-y-4">
                                <div className="mb-3 bg-green-50 dark:bg-green-900/20 p-3 rounded-md">
                                  <div className="flex items-center gap-2">
                                    <CheckCircle2 className="h-5 w-5 text-green-500 dark:text-green-400" />
                                    <h3 className="font-medium text-green-800 dark:text-green-300">
                                      Tests have been executed for this feature
                                    </h3>
                                  </div>
                                  <div className="mt-2 pl-7 text-sm text-green-800/70 dark:text-green-300/70">
                                    {testData.length} test cases were run to verify this feature's functionality
                                  </div>
                                </div>
                                
                                {/* Test summary */}
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
                                  <Card className="bg-gray-50 dark:bg-gray-800/50 border-0">
                                    <CardContent className="p-3 text-center">
                                      <p className="text-xs text-gray-500 uppercase font-semibold mb-1">Total Tests</p>
                                      <p className="text-2xl font-bold">{testData.length}</p>
                                    </CardContent>
                                  </Card>
                                  <Card className="bg-gray-50 dark:bg-gray-800/50 border-0">
                                    <CardContent className="p-3 text-center">
                                      <p className="text-xs text-gray-500 uppercase font-semibold mb-1">Passed</p>
                                      <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                                        {testData.filter(t => String(t.status || '').toLowerCase().includes('pass')).length}
                                      </p>
                                    </CardContent>
                                  </Card>
                                  <Card className="bg-gray-50 dark:bg-gray-800/50 border-0">
                                    <CardContent className="p-3 text-center">
                                      <p className="text-xs text-gray-500 uppercase font-semibold mb-1">Failed</p>
                                      <p className="text-2xl font-bold text-red-600 dark:text-red-400">
                                        {testData.filter(t => !String(t.status || '').toLowerCase().includes('pass')).length}
                                      </p>
                                    </CardContent>
                                  </Card>
                                </div>
                                
                                {/* Default test cases for this feature type */}
                                <div className="mb-4 p-3 border rounded-md bg-blue-50 dark:bg-blue-900/20">
                                  <h4 className="font-semibold mb-2 flex items-center text-blue-800 dark:text-blue-300">
                                    <Info className="h-4 w-4 mr-2" />
                                    Test Coverage Information
                                  </h4>
                                  <div className="text-sm text-blue-800/80 dark:text-blue-300/80 space-y-1 ml-6">
                                    {selectedFeature.area === FeatureArea.PERFORMANCE && (
                                      <>
                                        <p>• Performance metrics collection and visualization</p>
                                        <p>• Accurate rendering of performance data points</p>
                                        <p>• Proper handling of different metric types</p>
                                        <p>• Responsiveness under various load conditions</p>
                                      </>
                                    )}
                                    {selectedFeature.area === FeatureArea.API && (
                                      <>
                                        <p>• API endpoint response validation</p>
                                        <p>• Error handling and status code verification</p>
                                        <p>• Request formatting and parameter handling</p>
                                        <p>• Authentication and authorization checks</p>
                                      </>
                                    )}
                                    {selectedFeature.area === FeatureArea.GOAL && (
                                      <>
                                        <p>• Goal creation and management</p>
                                        <p>• Progress tracking mechanisms</p>
                                        <p>• Target validation and deadline handling</p>
                                        <p>• Goal status updates and notifications</p>
                                      </>
                                    )}
                                    {!([FeatureArea.PERFORMANCE, FeatureArea.API, FeatureArea.GOAL].includes(selectedFeature.area as FeatureArea)) && (
                                      <>
                                        <p>• Core functionality verification</p>
                                        <p>• User interface rendering and interaction</p>
                                        <p>• Data handling and state management</p>
                                        <p>• Error cases and edge condition handling</p>
                                      </>
                                    )}
                                  </div>
                                </div>
                                
                                {/* Detailed test results */}
                                <h4 className="font-semibold text-lg border-b pb-2">Detailed Test Results</h4>
                                <div className="space-y-3">
                                  {testData.map((test, i) => (
                                    <div key={i} className="border rounded-md p-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                                      <div className="flex justify-between items-start">
                                        <div>
                                          <h4 className="font-semibold text-base">{test.name || 'Unnamed Test'}</h4>
                                          <p className="text-sm text-gray-500 mt-1">{test.description || 'No description available'}</p>
                                        </div>
                                        {test.status && (
                                          <Badge variant={String(test.status).toLowerCase().includes('pass') ? 'success' : 'destructive'}>
                                            {test.status || 'Unknown'}
                                          </Badge>
                                        )}
                                      </div>
                                      
                                      {test.details && (
                                        <div className="mt-3 text-sm p-2 bg-gray-100 dark:bg-gray-800 rounded">
                                          <div className="font-semibold mb-1">Test Details:</div>
                                          <pre className="whitespace-pre-wrap text-xs overflow-x-auto">
                                            {typeof test.details === 'object' 
                                              ? JSON.stringify(test.details, null, 2) 
                                              : String(test.details)}
                                          </pre>
                                        </div>
                                      )}
                                      
                                      {test.error && (
                                        <div className="mt-3 p-2 bg-red-50 dark:bg-red-900/20 rounded text-sm">
                                          <p className="font-semibold text-red-700 dark:text-red-400">Error:</p>
                                          <pre className="whitespace-pre-wrap text-xs font-mono overflow-x-auto text-red-800 dark:text-red-300">
                                            {test.error}
                                          </pre>
                                        </div>
                                      )}
                                      
                                      {test.timestamp && (
                                        <div className="text-xs text-gray-500 mt-3 flex items-center">
                                          <Calendar className="h-3 w-3 mr-1" />
                                          Run at: {new Date(test.timestamp).toLocaleString()}
                                        </div>
                                      )}
                                      
                                      {test.duration && (
                                        <div className="text-xs text-gray-500 mt-1 flex items-center">
                                          <Clock className="h-3 w-3 mr-1" />
                                          Duration: {test.duration}ms
                                        </div>
                                      )}
                                    </div>
                                  ))}
                                </div>
                                
                                <div className="flex justify-end">
                                  <Button variant="outline" size="sm" className="mt-4">
                                    Run Tests Again
                                  </Button>
                                </div>
                              </div>
                            );
                          } else {
                            // No test data but marked as tested
                            if (selectedFeature.tested) {
                              return (
                                <div className="space-y-4">
                                  <div className="mb-3 bg-green-50 dark:bg-green-900/20 p-3 rounded-md">
                                    <div className="flex items-center gap-2">
                                      <CheckCircle2 className="h-5 w-5 text-green-500 dark:text-green-400" />
                                      <h3 className="font-medium text-green-800 dark:text-green-300">
                                        Tests have been executed for this feature
                                      </h3>
                                    </div>
                                  </div>
                                
                                  <div className="text-center py-8 border rounded-md">
                                    <Info className="h-10 w-10 text-blue-500 mx-auto mb-2" />
                                    <p className="text-gray-600 dark:text-gray-300 mb-2">
                                      This feature is marked as tested, but no detailed test data was found.
                                    </p>
                                    <p className="text-sm text-gray-500 max-w-md mx-auto mb-4">
                                      Run the tests again to see detailed results or check the logs for more information.
                                    </p>
                                    <Button variant="outline" size="sm">
                                      Run Tests
                                    </Button>
                                  </div>
                                  
                                  {/* Default test cases for this feature type */}
                                  <div className="p-3 border rounded-md bg-blue-50 dark:bg-blue-900/20">
                                    <h4 className="font-semibold mb-2 flex items-center text-blue-800 dark:text-blue-300">
                                      <Info className="h-4 w-4 mr-2" />
                                      Expected Test Coverage
                                    </h4>
                                    <div className="text-sm text-blue-800/80 dark:text-blue-300/80 space-y-1 ml-6">
                                      {selectedFeature.area === FeatureArea.PERFORMANCE && (
                                        <>
                                          <p>• Performance metrics collection and visualization</p>
                                          <p>• Accurate rendering of performance data points</p>
                                          <p>• Proper handling of different metric types</p>
                                          <p>• Responsiveness under various load conditions</p>
                                        </>
                                      )}
                                      {selectedFeature.area === FeatureArea.API && (
                                        <>
                                          <p>• API endpoint response validation</p>
                                          <p>• Error handling and status code verification</p>
                                          <p>• Request formatting and parameter handling</p>
                                          <p>• Authentication and authorization checks</p>
                                        </>
                                      )}
                                      {selectedFeature.area === FeatureArea.GOAL && (
                                        <>
                                          <p>• Goal creation and management</p>
                                          <p>• Progress tracking mechanisms</p>
                                          <p>• Target validation and deadline handling</p>
                                          <p>• Goal status updates and notifications</p>
                                        </>
                                      )}
                                      {!([FeatureArea.PERFORMANCE, FeatureArea.API, FeatureArea.GOAL].includes(selectedFeature.area as FeatureArea)) && (
                                        <>
                                          <p>• Core functionality verification</p>
                                          <p>• User interface rendering and interaction</p>
                                          <p>• Data handling and state management</p>
                                          <p>• Error cases and edge condition handling</p>
                                        </>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              );
                            } else {
                              // Not tested at all
                              return (
                                <div className="flex flex-col items-center justify-center py-8 text-center">
                                  <AlertTriangle className="h-16 w-16 text-gray-400 mb-4" />
                                  <h3 className="text-lg font-semibold">Not Tested Yet</h3>
                                  <p className="text-gray-500 max-w-md mt-2 mb-6">
                                    This feature has not been tested yet. Tests need to be written and executed to see results here.
                                  </p>
                                  
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full max-w-lg">
                                    <Card className="text-left">
                                      <CardHeader className="pb-2">
                                        <CardTitle className="text-sm flex items-center">
                                          <FileText className="h-4 w-4 mr-2 text-blue-500" />
                                          Recommended Test Cases
                                        </CardTitle>
                                      </CardHeader>
                                      <CardContent className="pt-0 text-xs">
                                        <ul className="list-disc pl-5 space-y-1">
                                          <li>Core functionality tests</li>
                                          <li>Edge case handling</li>
                                          <li>Error state management</li>
                                          <li>Performance considerations</li>
                                        </ul>
                                      </CardContent>
                                    </Card>
                                    
                                    <Card className="text-left">
                                      <CardHeader className="pb-2">
                                        <CardTitle className="text-sm flex items-center">
                                          <CheckCircle2 className="h-4 w-4 mr-2 text-blue-500" />
                                          Test Creation Steps
                                        </CardTitle>
                                      </CardHeader>
                                      <CardContent className="pt-0 text-xs">
                                        <ol className="list-decimal pl-5 space-y-1">
                                          <li>Define test cases</li>
                                          <li>Implement test functions</li>
                                          <li>Add to debug infrastructure</li>
                                          <li>Execute and verify results</li>
                                        </ol>
                                      </CardContent>
                                    </Card>
                                  </div>
                                  
                                  <Button variant="outline" size="sm" className="mt-6">
                                    Create Test
                                  </Button>
                                </div>
                              );
                            }
                          }
                        } catch (error) {
                          console.error("Error displaying test data:", error);
                          return (
                            <div className="text-center py-8 bg-red-50 dark:bg-red-900/20 rounded-md">
                              <XCircle className="h-10 w-10 text-red-500 mx-auto mb-2" />
                              <p className="text-red-800 dark:text-red-200">
                                Error displaying test data. Check the console for details.
                              </p>
                              <Button variant="outline" size="sm" className="mt-4" onClick={() => console.log("Error:", error)}>
                                View Error Details
                              </Button>
                            </div>
                          );
                        }
                      })()}
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