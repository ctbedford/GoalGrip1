import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Search, RefreshCw, Download, X, CheckCircle, XCircle, Clock, Play, AlertTriangle, Copy } from 'lucide-react';
import { ApiEndpoint } from '@/lib/apiTester';
import apiTester from '@/lib/apiTester';
import logger, { FeatureArea } from '@/lib/logger';
import * as debugStorage from '@/lib/debugStorage';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

// Types
export interface ApiTestResult {
  endpoint: string;
  method: string;
  status: number;
  success: boolean;
  data: any;
  error?: any;
  duration: number;
  timestamp: Date;
}

interface EndpointStats {
  endpoint: string;
  totalTests: number;
  successCount: number;
  failureCount: number;
  successRate: number;
  avgDuration: number;
  maxDuration: number;
  minDuration: number;
  lastTested: Date | null;
}

export function EnhancedApiDashboard() {
  const [testResults, setTestResults] = useState<ApiTestResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [searchQuery, setSearchQuery] = useState('');
  const [methodFilter, setMethodFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [endpointFilter, setEndpointFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('timestamp');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [selectedTest, setSelectedTest] = useState<ApiTestResult | null>(null);
  const [requestBody, setRequestBody] = useState<string>('');
  const [selectedEndpoint, setSelectedEndpoint] = useState<string>(Object.values(ApiEndpoint)[0]);
  const [selectedMethod, setSelectedMethod] = useState<string>('GET');
  
  // All available API endpoints
  const apiEndpoints = Object.values(ApiEndpoint);
  
  // Get unique HTTP methods from test results
  const httpMethods = useMemo(() => {
    const methods = new Set<string>();
    testResults.forEach(result => methods.add(result.method));
    return Array.from(methods);
  }, [testResults]);
  
  // Filter and sort test results
  const filteredResults = useMemo(() => {
    let results = [...testResults];
    
    // Apply search query
    if (searchQuery) {
      const lowerQuery = searchQuery.toLowerCase();
      results = results.filter(result => 
        result.endpoint.toLowerCase().includes(lowerQuery) || 
        result.method.toLowerCase().includes(lowerQuery) ||
        result.status.toString().includes(lowerQuery)
      );
    }
    
    // Apply method filter
    if (methodFilter !== 'all') {
      results = results.filter(result => result.method === methodFilter);
    }
    
    // Apply status filter
    if (statusFilter !== 'all') {
      if (statusFilter === 'success') {
        results = results.filter(result => result.success);
      } else if (statusFilter === 'failure') {
        results = results.filter(result => !result.success);
      } else {
        // Filter by specific status code
        results = results.filter(result => result.status.toString() === statusFilter);
      }
    }
    
    // Apply endpoint filter
    if (endpointFilter !== 'all') {
      results = results.filter(result => result.endpoint === endpointFilter);
    }
    
    // Apply sorting
    results.sort((a, b) => {
      if (sortBy === 'timestamp') {
        return sortDirection === 'asc' 
          ? new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
          : new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
      } else if (sortBy === 'duration') {
        return sortDirection === 'asc' ? a.duration - b.duration : b.duration - a.duration;
      } else if (sortBy === 'status') {
        return sortDirection === 'asc' ? a.status - b.status : b.status - a.status;
      } else if (sortBy === 'endpoint') {
        return sortDirection === 'asc'
          ? a.endpoint.localeCompare(b.endpoint)
          : b.endpoint.localeCompare(a.endpoint);
      } else if (sortBy === 'method') {
        return sortDirection === 'asc'
          ? a.method.localeCompare(b.method)
          : b.method.localeCompare(a.method);
      }
      
      return 0;
    });
    
    return results;
  }, [testResults, searchQuery, methodFilter, statusFilter, endpointFilter, sortBy, sortDirection]);
  
  // Calculate endpoint statistics
  const endpointStats = useMemo(() => {
    const endpointMap = new Map<string, EndpointStats>();
    
    // Initialize with all known endpoints
    apiEndpoints.forEach(endpoint => {
      endpointMap.set(endpoint, {
        endpoint,
        totalTests: 0,
        successCount: 0,
        failureCount: 0,
        successRate: 0,
        avgDuration: 0,
        maxDuration: 0,
        minDuration: Infinity,
        lastTested: null
      });
    });
    
    // Aggregate stats from test results
    testResults.forEach(result => {
      const endpointKey = result.endpoint.split('?')[0]; // Remove query params
      const stats = endpointMap.get(endpointKey) || {
        endpoint: endpointKey,
        totalTests: 0,
        successCount: 0,
        failureCount: 0,
        successRate: 0,
        avgDuration: 0,
        maxDuration: 0,
        minDuration: Infinity,
        lastTested: null
      };
      
      stats.totalTests++;
      if (result.success) {
        stats.successCount++;
      } else {
        stats.failureCount++;
      }
      
      stats.successRate = (stats.successCount / stats.totalTests) * 100;
      stats.avgDuration = ((stats.avgDuration * (stats.totalTests - 1)) + result.duration) / stats.totalTests;
      stats.maxDuration = Math.max(stats.maxDuration, result.duration);
      
      if (result.duration < stats.minDuration) {
        stats.minDuration = result.duration;
      }
      
      const timestamp = new Date(result.timestamp);
      if (!stats.lastTested || timestamp > stats.lastTested) {
        stats.lastTested = timestamp;
      }
      
      endpointMap.set(endpointKey, stats);
    });
    
    // Convert to array and sort by total tests
    return Array.from(endpointMap.values())
      .filter(stats => stats.totalTests > 0)
      .sort((a, b) => b.totalTests - a.totalTests);
  }, [testResults, apiEndpoints]);
  
  // Global statistics
  const globalStats = useMemo(() => {
    if (testResults.length === 0) {
      return {
        totalTests: 0,
        successCount: 0,
        failureCount: 0,
        successRate: 0,
        avgDuration: 0,
        uniqueEndpoints: 0
      };
    }
    
    const successCount = testResults.filter(r => r.success).length;
    const uniqueEndpoints = new Set(testResults.map(r => r.endpoint)).size;
    const totalDuration = testResults.reduce((sum, r) => sum + r.duration, 0);
    
    return {
      totalTests: testResults.length,
      successCount,
      failureCount: testResults.length - successCount,
      successRate: (successCount / testResults.length) * 100,
      avgDuration: totalDuration / testResults.length,
      uniqueEndpoints
    };
  }, [testResults]);
  
  // Status code distribution
  const statusCodeDistribution = useMemo(() => {
    const distribution: Record<string, number> = {};
    
    testResults.forEach(result => {
      const statusCode = result.status.toString();
      distribution[statusCode] = (distribution[statusCode] || 0) + 1;
    });
    
    return distribution;
  }, [testResults]);
  
  // Run all API tests
  const runApiTests = async () => {
    setIsLoading(true);
    try {
      logger.info(FeatureArea.API, 'Starting comprehensive API tests');
      await apiTester.testAllEndpoints();
      await apiTester.testGoalLifecycle();
      await apiTester.testCompleteUserJourney();
      loadTestResults();
      setActiveTab('results');
      logger.info(FeatureArea.API, 'API tests completed successfully');
    } catch (error) {
      logger.error(FeatureArea.API, 'Error running API tests', error);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Load saved test results
  const loadTestResults = () => {
    const apiTests = debugStorage.getApiTestResults();
    if (apiTests && apiTests.length > 0) {
      // Convert timestamp strings to Date objects
      const processedTests = apiTests.map(test => ({
        ...test,
        timestamp: test.timestamp instanceof Date ? test.timestamp : new Date(test.timestamp)
      }));
      
      setTestResults(processedTests);
      logger.info(FeatureArea.API, `Loaded ${apiTests.length} API test results`);
    } else {
      logger.info(FeatureArea.API, 'No API test results found');
    }
  };
  
  // Clear test results
  const clearTestResults = () => {
    debugStorage.clearApiTestResults();
    setTestResults([]);
    setSelectedTest(null);
    logger.info(FeatureArea.API, 'API test results cleared');
  };
  
  // Handle test selection for viewing details
  const handleTestSelection = (test: ApiTestResult) => {
    setSelectedTest(test);
    // Format JSON for display
    if (test.data) {
      const formatted = JSON.stringify(test.data, null, 2);
      setRequestBody(formatted);
    } else {
      setRequestBody('');
    }
  };
  
  // Run a custom API test
  const runCustomTest = async () => {
    setIsLoading(true);
    try {
      logger.info(FeatureArea.API, `Running custom API test: ${selectedMethod} ${selectedEndpoint}`);
      
      let data = undefined;
      try {
        // Parse JSON body if provided
        if (requestBody.trim()) {
          data = JSON.parse(requestBody);
        }
      } catch (e) {
        logger.error(FeatureArea.API, 'Invalid JSON in request body', e);
        return;
      }
      
      // Ensure method is compatible with apiTester
      const httpMethod = ['GET', 'POST', 'PATCH', 'DELETE'].includes(selectedMethod) 
        ? selectedMethod as 'GET' | 'POST' | 'PATCH' | 'DELETE'
        : 'GET';
        
      const result = await apiTester.testEndpoint(
        selectedEndpoint as ApiEndpoint,
        httpMethod,
        data
      );
      
      loadTestResults();
      setSelectedTest(result);
      logger.info(FeatureArea.API, `Custom API test completed with status ${result.status}`);
    } catch (error) {
      logger.error(FeatureArea.API, 'Error running custom API test', error);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Copy to clipboard
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    logger.info(FeatureArea.UI, 'Copied to clipboard');
  };
  
  // Reset filters
  const resetFilters = () => {
    setSearchQuery('');
    setMethodFilter('all');
    setStatusFilter('all');
    setEndpointFilter('all');
    setSortBy('timestamp');
    setSortDirection('desc');
  };
  
  // Export test results to JSON
  const exportResults = () => {
    try {
      const data = JSON.stringify(testResults, null, 2);
      const blob = new Blob([data], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `api-test-results-${format(new Date(), 'yyyy-MM-dd-HH-mm')}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      logger.error(FeatureArea.API, 'Error exporting test results', error);
    }
  };
  
  // Initialize
  useEffect(() => {
    loadTestResults();
  }, []);
  
  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle>Enhanced API Test Dashboard</CardTitle>
          <div className="flex space-x-2">
            <Button 
              variant="default" 
              onClick={runApiTests} 
              disabled={isLoading}
              title="Run All API Tests"
            >
              {isLoading ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Running...
                </>
              ) : (
                <>
                  <Play className="h-4 w-4 mr-2" />
                  Run Tests
                </>
              )}
            </Button>
            <Button 
              variant="outline" 
              size="icon" 
              onClick={loadTestResults} 
              title="Refresh Results"
            >
              <RefreshCw className="h-4 w-4" />
            </Button>
            <Button 
              variant="outline" 
              size="icon" 
              onClick={exportResults} 
              disabled={testResults.length === 0}
              title="Export Results"
            >
              <Download className="h-4 w-4" />
            </Button>
            <Button 
              variant="outline" 
              size="icon" 
              onClick={clearTestResults} 
              title="Clear Results"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
        <CardDescription>
          Comprehensive API testing and analysis dashboard
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid grid-cols-4 w-full max-w-md">
            <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
            <TabsTrigger value="results">Test Results</TabsTrigger>
            <TabsTrigger value="custom">Custom Tests</TabsTrigger>
            <TabsTrigger value="insights">Insights</TabsTrigger>
          </TabsList>
          
          {/* Dashboard Tab */}
          <TabsContent value="dashboard" className="mt-4 space-y-6">
            {/* Summary Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center">
                    <h3 className="text-lg font-semibold mb-2">Tests Run</h3>
                    <div className="text-3xl font-bold">{globalStats.totalTests}</div>
                    <div className="text-xs text-gray-500 mt-1">
                      {globalStats.uniqueEndpoints} unique endpoints
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center">
                    <h3 className="text-lg font-semibold mb-2">Success Rate</h3>
                    <div className="text-3xl font-bold">
                      {globalStats.totalTests > 0 ? globalStats.successRate.toFixed(1) : 0}%
                    </div>
                    <div className="flex justify-center items-center space-x-2 text-xs text-gray-500 mt-1">
                      <span className="flex items-center">
                        <CheckCircle className="h-3 w-3 text-green-500 mr-1" />
                        {globalStats.successCount} passed
                      </span>
                      <span className="flex items-center">
                        <XCircle className="h-3 w-3 text-red-500 mr-1" />
                        {globalStats.failureCount} failed
                      </span>
                    </div>
                    <Progress 
                      value={globalStats.successRate} 
                      className={`h-2 mt-2 ${globalStats.successRate >= 80 ? "bg-green-500" : "bg-red-500"}`}
                    />
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center">
                    <h3 className="text-lg font-semibold mb-2">Avg Response Time</h3>
                    <div className="text-3xl font-bold">
                      {globalStats.totalTests > 0 ? globalStats.avgDuration.toFixed(1) : 0} ms
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      across all endpoints
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
            
            {/* Status Code Distribution */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Status Code Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-3">
                  {Object.entries(statusCodeDistribution).map(([code, count]) => {
                    const isSuccess = code.startsWith('2');
                    const isRedirect = code.startsWith('3');
                    const isClientError = code.startsWith('4');
                    const isServerError = code.startsWith('5');
                    
                    let variant = 'outline';
                    if (isSuccess) variant = 'success';
                    if (isRedirect) variant = 'secondary';
                    if (isClientError) variant = 'warning';
                    if (isServerError) variant = 'destructive';
                    
                    return (
                      <Badge 
                        key={code} 
                        variant={variant as any} 
                        className="text-sm px-3 py-1"
                        onClick={() => {
                          setStatusFilter(code);
                          setActiveTab('results');
                        }}
                      >
                        {code}: {count}
                      </Badge>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
            
            {/* Endpoint Performance Table */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Endpoint Performance</CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[300px]">
                  <div className="min-w-full">
                    <table className="w-full border-collapse">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left p-2 font-medium text-sm">Endpoint</th>
                          <th className="text-center p-2 font-medium text-sm">Tests</th>
                          <th className="text-center p-2 font-medium text-sm">Success Rate</th>
                          <th className="text-center p-2 font-medium text-sm">Avg (ms)</th>
                          <th className="text-center p-2 font-medium text-sm">Min (ms)</th>
                          <th className="text-center p-2 font-medium text-sm">Max (ms)</th>
                          <th className="text-right p-2 font-medium text-sm">Last Tested</th>
                        </tr>
                      </thead>
                      <tbody>
                        {endpointStats.map((stats, index) => (
                          <tr 
                            key={index} 
                            className="border-b hover:bg-slate-800/50 cursor-pointer"
                            onClick={() => {
                              setEndpointFilter(stats.endpoint);
                              setActiveTab('results');
                            }}
                          >
                            <td className="text-left p-2 font-mono text-xs">{stats.endpoint}</td>
                            <td className="text-center p-2">{stats.totalTests}</td>
                            <td className="text-center p-2">
                              <div className="flex items-center justify-center">
                                <span className={`mr-1 ${stats.successRate >= 80 ? 'text-green-500' : 'text-red-500'}`}>
                                  {stats.successRate.toFixed(1)}%
                                </span>
                              </div>
                            </td>
                            <td className="text-center p-2">{stats.avgDuration.toFixed(1)}</td>
                            <td className="text-center p-2">{stats.minDuration === Infinity ? 'N/A' : stats.minDuration.toFixed(1)}</td>
                            <td className="text-center p-2">{stats.maxDuration.toFixed(1)}</td>
                            <td className="text-right p-2 text-xs text-gray-500">
                              {stats.lastTested ? format(stats.lastTested, 'MMM d, HH:mm:ss') : 'N/A'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>
          
          {/* Test Results Tab */}
          <TabsContent value="results" className="mt-4 space-y-4">
            {/* Filters */}
            <div className="flex flex-col space-y-4 md:flex-row md:space-y-0 md:space-x-4">
              <div className="relative flex-grow">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-500" />
                <Input
                  placeholder="Search in test results..."
                  className="pl-8"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              
              <div className="flex space-x-2">
                <Select value={methodFilter} onValueChange={setMethodFilter}>
                  <SelectTrigger className="w-[120px]">
                    <SelectValue placeholder="Method" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Methods</SelectItem>
                    {httpMethods.map(method => (
                      <SelectItem key={method} value={method}>{method}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-[120px]">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="success">Success</SelectItem>
                    <SelectItem value="failure">Failure</SelectItem>
                    {Object.keys(statusCodeDistribution).map(code => (
                      <SelectItem key={code} value={code}>{code}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={resetFilters}
                  title="Reset Filters"
                >
                  Reset
                </Button>
              </div>
            </div>
            
            {/* Results and Details Split View */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Results List */}
              <Card>
                <CardHeader className="py-2">
                  <CardTitle className="text-sm">Test Results ({filteredResults.length})</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <ScrollArea className="h-[600px]">
                    <div className="min-w-full">
                      <table className="w-full border-collapse text-sm">
                        <thead>
                          <tr className="border-b">
                            <th className="text-left p-2 font-medium">
                              <Button 
                                variant="ghost" 
                                className="h-auto p-0 font-medium"
                                onClick={() => {
                                  setSortBy('method');
                                  setSortDirection(sortBy === 'method' && sortDirection === 'asc' ? 'desc' : 'asc');
                                }}
                              >
                                Method
                              </Button>
                            </th>
                            <th className="text-left p-2 font-medium">
                              <Button 
                                variant="ghost" 
                                className="h-auto p-0 font-medium"
                                onClick={() => {
                                  setSortBy('endpoint');
                                  setSortDirection(sortBy === 'endpoint' && sortDirection === 'asc' ? 'desc' : 'asc');
                                }}
                              >
                                Endpoint
                              </Button>
                            </th>
                            <th className="text-center p-2 font-medium">
                              <Button 
                                variant="ghost" 
                                className="h-auto p-0 font-medium"
                                onClick={() => {
                                  setSortBy('status');
                                  setSortDirection(sortBy === 'status' && sortDirection === 'asc' ? 'desc' : 'asc');
                                }}
                              >
                                Status
                              </Button>
                            </th>
                            <th className="text-right p-2 font-medium">
                              <Button 
                                variant="ghost" 
                                className="h-auto p-0 font-medium"
                                onClick={() => {
                                  setSortBy('duration');
                                  setSortDirection(sortBy === 'duration' && sortDirection === 'asc' ? 'desc' : 'asc');
                                }}
                              >
                                Duration
                              </Button>
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredResults.length === 0 ? (
                            <tr>
                              <td colSpan={4} className="text-center p-4 text-gray-500">
                                No test results found matching the filters
                              </td>
                            </tr>
                          ) : (
                            filteredResults.map((result, index) => (
                              <tr 
                                key={index} 
                                className={`border-b hover:bg-slate-800/50 cursor-pointer ${
                                  selectedTest === result ? 'bg-slate-800/50' : ''
                                }`}
                                onClick={() => handleTestSelection(result)}
                              >
                                <td className="text-left p-2">
                                  <Badge
                                    variant={
                                      result.method === 'GET' ? 'outline' :
                                      result.method === 'POST' ? 'secondary' :
                                      result.method === 'PUT' || result.method === 'PATCH' ? 'default' :
                                      result.method === 'DELETE' ? 'destructive' :
                                      'outline'
                                    }
                                  >
                                    {result.method}
                                  </Badge>
                                </td>
                                <td className="text-left p-2 font-mono text-xs truncate max-w-[150px]">
                                  {result.endpoint}
                                </td>
                                <td className="text-center p-2">
                                  <Badge
                                    variant={
                                      result.status >= 200 && result.status < 300 ? 'success' :
                                      result.status >= 300 && result.status < 400 ? 'secondary' :
                                      result.status >= 400 && result.status < 500 ? 'warning' :
                                      'destructive'
                                    }
                                  >
                                    {result.status}
                                  </Badge>
                                </td>
                                <td className="text-right p-2">
                                  <span className="text-gray-400">{result.duration.toFixed(1)} ms</span>
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
              
              {/* Test Details */}
              <Card>
                <CardHeader className="py-2">
                  <CardTitle className="text-sm">Test Details</CardTitle>
                </CardHeader>
                <CardContent>
                  {selectedTest ? (
                    <div className="space-y-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <Badge 
                            variant={selectedTest.success ? "success" : "destructive"}
                            className="mb-2"
                          >
                            {selectedTest.success ? 'Success' : 'Failed'}
                          </Badge>
                          <h3 className="text-lg font-mono">{selectedTest.method} {selectedTest.endpoint}</h3>
                          <div className="flex items-center text-xs text-gray-500 mt-1">
                            <Clock className="h-3 w-3 mr-1" />
                            {format(new Date(selectedTest.timestamp), 'yyyy-MM-dd HH:mm:ss')}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-lg font-bold">{selectedTest.status}</div>
                          <div className="text-sm text-gray-400">{selectedTest.duration.toFixed(2)} ms</div>
                        </div>
                      </div>
                      
                      <Separator />
                      
                      <Accordion type="single" collapsible defaultValue="response">
                        <AccordionItem value="response">
                          <AccordionTrigger>Response Data</AccordionTrigger>
                          <AccordionContent>
                            <div className="flex justify-between items-center mb-2">
                              <div className="text-xs text-gray-500">
                                {
                                  typeof selectedTest.data === 'object' 
                                    ? Object.keys(selectedTest.data || {}).length + ' keys'
                                    : '0 keys'
                                }
                              </div>
                              <Button 
                                variant="outline" 
                                size="sm" 
                                className="h-7"
                                onClick={() => copyToClipboard(JSON.stringify(selectedTest.data, null, 2))}
                              >
                                <Copy className="h-3 w-3 mr-1" /> Copy
                              </Button>
                            </div>
                            <ScrollArea className="h-[350px] w-full">
                              <pre className="bg-slate-900 p-4 rounded-md text-xs overflow-x-auto">
                                {JSON.stringify(selectedTest.data, null, 2) || 'No data'}
                              </pre>
                            </ScrollArea>
                          </AccordionContent>
                        </AccordionItem>
                        
                        {selectedTest.error && (
                          <AccordionItem value="error">
                            <AccordionTrigger>Error Details</AccordionTrigger>
                            <AccordionContent>
                              <div className="bg-red-900/20 border border-red-800 rounded-md p-4">
                                <div className="flex items-start">
                                  <AlertTriangle className="h-4 w-4 text-red-500 mr-2 mt-1" />
                                  <div>
                                    <h4 className="font-medium text-red-500">Error Information</h4>
                                    <ScrollArea className="h-[200px] w-full mt-2">
                                      <pre className="text-xs overflow-x-auto text-red-300">
                                        {JSON.stringify(selectedTest.error, null, 2) || 'No error details available'}
                                      </pre>
                                    </ScrollArea>
                                  </div>
                                </div>
                              </div>
                            </AccordionContent>
                          </AccordionItem>
                        )}
                      </Accordion>
                    </div>
                  ) : (
                    <div className="h-[500px] flex items-center justify-center text-gray-500">
                      Select a test result to view details
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          
          {/* Custom Test Tab */}
          <TabsContent value="custom" className="mt-4 space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Custom API Test</CardTitle>
                <CardDescription>Create and execute a custom API test</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-col md:flex-row space-y-4 md:space-y-0 md:space-x-4">
                  <div className="w-full md:w-1/3">
                    <label className="text-sm font-medium mb-1 block">HTTP Method</label>
                    <Select value={selectedMethod} onValueChange={setSelectedMethod}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select method" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="GET">GET</SelectItem>
                        <SelectItem value="POST">POST</SelectItem>
                        <SelectItem value="PUT">PUT</SelectItem>
                        <SelectItem value="PATCH">PATCH</SelectItem>
                        <SelectItem value="DELETE">DELETE</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="w-full md:w-2/3">
                    <label className="text-sm font-medium mb-1 block">API Endpoint</label>
                    <Select value={selectedEndpoint} onValueChange={setSelectedEndpoint}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select endpoint" />
                      </SelectTrigger>
                      <SelectContent>
                        {apiEndpoints.map(endpoint => (
                          <SelectItem key={endpoint} value={endpoint}>{endpoint}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <div>
                  <label className="text-sm font-medium mb-1 block">Request Body (JSON)</label>
                  <div className="relative">
                    <textarea
                      className="w-full h-[300px] border rounded-md p-4 font-mono text-sm bg-slate-900"
                      value={requestBody}
                      onChange={(e) => setRequestBody(e.target.value)}
                      placeholder={`{\n  "key": "value"\n}`}
                    />
                    {
                      selectedMethod === 'GET' && requestBody.trim() !== '' && (
                        <div className="absolute bottom-2 right-2 text-xs text-yellow-500 bg-yellow-900/50 p-2 rounded-md">
                          <AlertTriangle className="h-3 w-3 inline-block mr-1" />
                          GET requests typically don't have a body
                        </div>
                      )
                    }
                  </div>
                </div>
                
                <div className="flex justify-end">
                  <Button
                    variant="default"
                    onClick={runCustomTest}
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <>
                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                        Running...
                      </>
                    ) : (
                      <>
                        <Play className="h-4 w-4 mr-2" />
                        Run Test
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          {/* Insights Tab */}
          <TabsContent value="insights" className="mt-4 space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>API Performance Insights</CardTitle>
                <CardDescription>Analysis and recommendations for API performance</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {testResults.length === 0 ? (
                  <div className="text-center p-8 text-gray-500">
                    Run API tests to generate insights
                  </div>
                ) : (
                  <>
                    {/* Performance Thresholds */}
                    <div className="border rounded-md p-4">
                      <h3 className="text-lg font-semibold mb-4">Response Time Analysis</h3>
                      
                      <div className="space-y-4">
                        {/* Fast Endpoints */}
                        <div>
                          <h4 className="text-sm font-medium mb-2 flex items-center">
                            <Badge variant="success" className="mr-2">Fast</Badge>
                            Endpoints responding in &lt; 100ms
                          </h4>
                          <ScrollArea className="h-[100px]">
                            <div className="space-y-2">
                              {endpointStats
                                .filter(stat => stat.avgDuration < 100)
                                .map((stat, idx) => (
                                  <div key={idx} className="flex justify-between items-center text-sm">
                                    <span className="font-mono text-xs">{stat.endpoint}</span>
                                    <span className="text-green-500">{stat.avgDuration.toFixed(1)} ms</span>
                                  </div>
                                ))
                              }
                              {endpointStats.filter(stat => stat.avgDuration < 100).length === 0 && (
                                <div className="text-center text-gray-500 py-2">No endpoints in this category</div>
                              )}
                            </div>
                          </ScrollArea>
                        </div>
                        
                        {/* Medium Endpoints */}
                        <div>
                          <h4 className="text-sm font-medium mb-2 flex items-center">
                            <Badge variant="warning" className="mr-2">Medium</Badge>
                            Endpoints responding in 100-500ms
                          </h4>
                          <ScrollArea className="h-[100px]">
                            <div className="space-y-2">
                              {endpointStats
                                .filter(stat => stat.avgDuration >= 100 && stat.avgDuration < 500)
                                .map((stat, idx) => (
                                  <div key={idx} className="flex justify-between items-center text-sm">
                                    <span className="font-mono text-xs">{stat.endpoint}</span>
                                    <span className="text-yellow-500">{stat.avgDuration.toFixed(1)} ms</span>
                                  </div>
                                ))
                              }
                              {endpointStats.filter(stat => stat.avgDuration >= 100 && stat.avgDuration < 500).length === 0 && (
                                <div className="text-center text-gray-500 py-2">No endpoints in this category</div>
                              )}
                            </div>
                          </ScrollArea>
                        </div>
                        
                        {/* Slow Endpoints */}
                        <div>
                          <h4 className="text-sm font-medium mb-2 flex items-center">
                            <Badge variant="destructive" className="mr-2">Slow</Badge>
                            Endpoints responding in &gt; 500ms
                          </h4>
                          <ScrollArea className="h-[100px]">
                            <div className="space-y-2">
                              {endpointStats
                                .filter(stat => stat.avgDuration >= 500)
                                .map((stat, idx) => (
                                  <div key={idx} className="flex justify-between items-center text-sm">
                                    <span className="font-mono text-xs">{stat.endpoint}</span>
                                    <span className="text-red-500">{stat.avgDuration.toFixed(1)} ms</span>
                                  </div>
                                ))
                              }
                              {endpointStats.filter(stat => stat.avgDuration >= 500).length === 0 && (
                                <div className="text-center text-gray-500 py-2">No endpoints in this category</div>
                              )}
                            </div>
                          </ScrollArea>
                        </div>
                      </div>
                    </div>
                    
                    {/* Success Rate Analysis */}
                    <div className="border rounded-md p-4">
                      <h3 className="text-lg font-semibold mb-4">Success Rate Analysis</h3>
                      
                      <div className="space-y-4">
                        {/* Problematic Endpoints */}
                        <div>
                          <h4 className="text-sm font-medium mb-2 flex items-center">
                            <Badge variant="destructive" className="mr-2">Issues</Badge>
                            Endpoints with &lt; 80% success rate
                          </h4>
                          <ScrollArea className="h-[100px]">
                            <div className="space-y-2">
                              {endpointStats
                                .filter(stat => stat.successRate < 80)
                                .map((stat, idx) => (
                                  <div key={idx} className="flex justify-between items-center text-sm">
                                    <span className="font-mono text-xs">{stat.endpoint}</span>
                                    <div className="flex items-center">
                                      <CheckCircle className="h-3 w-3 text-green-500 mr-1" />
                                      <span className="mr-2">{stat.successCount}</span>
                                      <XCircle className="h-3 w-3 text-red-500 mr-1" />
                                      <span>{stat.failureCount}</span>
                                      <span className="ml-2 text-red-500">{stat.successRate.toFixed(1)}%</span>
                                    </div>
                                  </div>
                                ))
                              }
                              {endpointStats.filter(stat => stat.successRate < 80).length === 0 && (
                                <div className="text-center text-gray-500 py-2">No problematic endpoints</div>
                              )}
                            </div>
                          </ScrollArea>
                        </div>
                      </div>
                    </div>
                    
                    {/* Recommendations */}
                    <div className="border rounded-md p-4">
                      <h3 className="text-lg font-semibold mb-2">Recommendations</h3>
                      <div className="space-y-2">
                        {endpointStats.filter(stat => stat.avgDuration >= 500).length > 0 && (
                          <div className="flex items-start p-2 border-l-4 border-yellow-500 bg-yellow-500/10">
                            <AlertTriangle className="h-4 w-4 text-yellow-500 mr-2 mt-0.5" />
                            <div>
                              <p className="font-medium">Slow Endpoints Detected</p>
                              <p className="text-sm text-gray-400">
                                {endpointStats.filter(stat => stat.avgDuration >= 500).length} endpoints are responding slowly. 
                                Consider optimizing database queries or adding caching.
                              </p>
                            </div>
                          </div>
                        )}
                        
                        {endpointStats.filter(stat => stat.successRate < 80).length > 0 && (
                          <div className="flex items-start p-2 border-l-4 border-red-500 bg-red-500/10">
                            <AlertTriangle className="h-4 w-4 text-red-500 mr-2 mt-0.5" />
                            <div>
                              <p className="font-medium">Reliability Issues</p>
                              <p className="text-sm text-gray-400">
                                {endpointStats.filter(stat => stat.successRate < 80).length} endpoints have low success rates. 
                                Check validation logic and error handling.
                              </p>
                            </div>
                          </div>
                        )}
                        
                        {endpointStats.filter(stat => stat.avgDuration < 500 && stat.successRate >= 80).length === endpointStats.length && (
                          <div className="flex items-start p-2 border-l-4 border-green-500 bg-green-500/10">
                            <CheckCircle className="h-4 w-4 text-green-500 mr-2 mt-0.5" />
                            <div>
                              <p className="font-medium">API Status: Healthy</p>
                              <p className="text-sm text-gray-400">
                                All endpoints are responding quickly with good success rates. No immediate issues detected.
                              </p>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </CardContent>
      
      <CardFooter className="flex justify-between">
        <div className="text-xs text-gray-500">
          Data from {testResults.length} API tests
        </div>
        
        <div className="text-xs text-gray-500 flex items-center">
          <Clock className="h-3 w-3 mr-1" />
          Last updated: {testResults.length > 0 
            ? format(new Date(Math.max(...testResults.map(r => new Date(r.timestamp).getTime()))), 'yyyy-MM-dd HH:mm:ss')
            : 'Never'
          }
        </div>
      </CardFooter>
    </Card>
  );
}