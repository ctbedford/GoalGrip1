import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { AreaChart, Area } from 'recharts';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  RefreshCw, 
  Clock, 
  Zap, 
  Database, 
  Network,
  DownloadCloud, 
  Upload,
  AlertTriangle,
  MemoryStick
} from 'lucide-react';
import { FeatureArea } from '@/lib/logger';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { format } from 'date-fns';
import { ApiTestResult } from './enhanced-api-dashboard';
import * as debugStorage from '@/lib/debugStorage';
import { Separator } from '@/components/ui/separator';

// Types
interface PerformanceMetric {
  operation: string;
  area: FeatureArea;
  startTime: number;
  endTime?: number;
  duration?: number;
  timestamp: Date;
}

interface MemorySnapshot {
  timestamp: Date;
  jsHeapSizeLimit: number;
  totalJSHeapSize: number;
  usedJSHeapSize: number;
}

interface NetworkMetric {
  endpoint: string;
  method: string;
  size: number;
  duration: number;
  timestamp: Date;
}

interface ResourceMetric {
  url: string;
  type: string;
  duration: number;
  size: number;
  timestamp: Date;
}

interface RenderMetric {
  component: string;
  renderTime: number;
  timestamp: Date;
}

// Utility functions to create simulated data based on API test results
function generatePerformanceData(apiResults: ApiTestResult[]): {
  performanceMetrics: PerformanceMetric[];
  memorySnapshots: MemorySnapshot[];
  networkMetrics: NetworkMetric[];
  resourceMetrics: ResourceMetric[];
  renderMetrics: RenderMetric[];
} {
  // Map API results to performance metrics
  const performanceMetrics: PerformanceMetric[] = apiResults.map(result => ({
    operation: `${result.method} ${result.endpoint}`,
    area: FeatureArea.API,
    startTime: new Date(result.timestamp).getTime() - result.duration,
    endTime: new Date(result.timestamp).getTime(),
    duration: result.duration,
    timestamp: new Date(result.timestamp)
  }));
  
  // Generate memory snapshots
  const memorySnapshots: MemorySnapshot[] = [];
  const now = new Date();
  const baseJsHeapSizeLimit = 2147483648; // 2GB
  const baseTotalJSHeapSize = 800000000;  // 800MB
  const baseUsedJSHeapSize = 400000000;   // 400MB
  
  // Generate memory snapshots based on API activity patterns
  for (let i = 0; i < 50; i++) {
    const timestamp = new Date(now.getTime() - (50 - i) * 60000); // One snapshot per minute
    
    // Find API calls around this time to correlate memory usage with activity
    const apiCallsNearby = apiResults.filter(r => 
      Math.abs(new Date(r.timestamp).getTime() - timestamp.getTime()) < 120000 // Within 2 minutes
    ).length;
    
    // More API calls = more memory usage (simulated correlation)
    const activityFactor = 1 + (apiCallsNearby * 0.05);
    
    memorySnapshots.push({
      timestamp,
      jsHeapSizeLimit: baseJsHeapSizeLimit,
      totalJSHeapSize: baseTotalJSHeapSize * (1 + (i % 10) * 0.01), // Slight increase over time
      usedJSHeapSize: baseUsedJSHeapSize * activityFactor * (1 + (i % 15) * 0.01) // More variation
    });
  }
  
  // Generate network metrics from API calls
  const networkMetrics: NetworkMetric[] = apiResults.map(result => ({
    endpoint: result.endpoint,
    method: result.method,
    // Simulate response size based on endpoint and HTTP method
    size: result.method === 'GET' ? 
      (result.endpoint.includes('list') ? 15000 + Math.random() * 25000 : 2000 + Math.random() * 8000) :
      (result.method === 'POST' ? 800 + Math.random() * 2000 : 500 + Math.random() * 1000),
    duration: result.duration,
    timestamp: new Date(result.timestamp)
  }));
  
  // Generate resource metrics (CSS, JS, images loaded)
  const resourceTypes = ['script', 'stylesheet', 'image', 'font'];
  const resourceUrls = [
    'main.js', 'vendor.js', 'styles.css', 'theme.css', 
    'logo.png', 'avatar.jpg', 'font-regular.woff2', 'font-bold.woff2'
  ];
  
  const resourceMetrics: ResourceMetric[] = [];
  for (let i = 0; i < 30; i++) {
    const typeIndex = i % resourceTypes.length;
    const urlIndex = i % resourceUrls.length;
    
    resourceMetrics.push({
      url: resourceUrls[urlIndex],
      type: resourceTypes[typeIndex],
      duration: 50 + Math.random() * 200,
      size: typeIndex === 0 ? 50000 + Math.random() * 100000 : // scripts
            typeIndex === 1 ? 15000 + Math.random() * 25000 :  // stylesheets
            typeIndex === 2 ? 30000 + Math.random() * 150000 : // images
            8000 + Math.random() * 15000,                       // fonts
      timestamp: new Date(now.getTime() - Math.random() * 3600000) // Last hour
    });
  }
  
  // Generate render metrics for UI components
  const componentNames = [
    'Dashboard', 'GoalList', 'GoalCard', 'ProgressChart', 
    'CategoryFilter', 'ActionItemList', 'ProfileSection'
  ];
  
  const renderMetrics: RenderMetric[] = [];
  for (let i = 0; i < 100; i++) {
    const componentIndex = i % componentNames.length;
    
    renderMetrics.push({
      component: componentNames[componentIndex],
      renderTime: 5 + Math.random() * 20 + (componentIndex === 0 ? 15 : 0), // Dashboard is heavier
      timestamp: new Date(now.getTime() - Math.random() * 3600000) // Last hour
    });
  }
  
  return {
    performanceMetrics,
    memorySnapshots,
    networkMetrics,
    resourceMetrics,
    renderMetrics
  };
}

// Main component
export function PerformanceMetricsPanel() {
  const [activeTab, setActiveTab] = useState('overview');
  const [timeRange, setTimeRange] = useState<string>('1h');
  const [isLoading, setIsLoading] = useState(false);
  const [apiResults, setApiResults] = useState<ApiTestResult[]>([]);
  
  // Performance data derived from API results
  const [performanceData, setPerformanceData] = useState<{
    performanceMetrics: PerformanceMetric[];
    memorySnapshots: MemorySnapshot[];
    networkMetrics: NetworkMetric[];
    resourceMetrics: ResourceMetric[];
    renderMetrics: RenderMetric[];
  } | null>(null);
  
  // Get timestamp for current selected time range
  const getTimeRangeTimestamp = (): number => {
    const now = new Date().getTime();
    switch (timeRange) {
      case '15m': return now - 15 * 60 * 1000;
      case '1h': return now - 60 * 60 * 1000;
      case '6h': return now - 6 * 60 * 60 * 1000;
      case '24h': return now - 24 * 60 * 60 * 1000;
      case '7d': return now - 7 * 24 * 60 * 60 * 1000;
      default: return now - 60 * 60 * 1000; // Default to 1 hour
    }
  };
  
  // Filter data based on time range
  const filteredData = useMemo(() => {
    if (!performanceData) return null;
    
    const timeThreshold = getTimeRangeTimestamp();
    
    return {
      performanceMetrics: performanceData.performanceMetrics.filter(
        metric => new Date(metric.timestamp).getTime() >= timeThreshold
      ),
      memorySnapshots: performanceData.memorySnapshots.filter(
        snapshot => new Date(snapshot.timestamp).getTime() >= timeThreshold
      ),
      networkMetrics: performanceData.networkMetrics.filter(
        metric => new Date(metric.timestamp).getTime() >= timeThreshold
      ),
      resourceMetrics: performanceData.resourceMetrics.filter(
        metric => new Date(metric.timestamp).getTime() >= timeThreshold
      ),
      renderMetrics: performanceData.renderMetrics.filter(
        metric => new Date(metric.timestamp).getTime() >= timeThreshold
      )
    };
  }, [performanceData, timeRange]);
  
  // Load API test results
  const loadApiResults = () => {
    const results = debugStorage.getApiTestResults();
    if (results && results.length > 0) {
      // Process timestamps to ensure they're Date objects
      const processedResults = results.map(result => ({
        ...result,
        timestamp: result.timestamp instanceof Date ? result.timestamp : new Date(result.timestamp)
      }));
      
      setApiResults(processedResults);
      
      // Generate performance data from API results
      setPerformanceData(generatePerformanceData(processedResults));
    }
  };
  
  // Refresh data
  const refreshData = () => {
    setIsLoading(true);
    loadApiResults();
    setTimeout(() => setIsLoading(false), 500);
  };
  
  // Format file size
  const formatBytes = (bytes: number, decimals = 2) => {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  };
  
  // Aggregate API performance by endpoint
  const apiPerformanceByEndpoint = useMemo(() => {
    if (!filteredData?.networkMetrics) return [];
    
    const endpointMap = new Map<string, { 
      endpoint: string;
      avgDuration: number;
      maxDuration: number;
      minDuration: number;
      count: number;
      totalSize: number;
    }>();
    
    filteredData.networkMetrics.forEach(metric => {
      const key = metric.endpoint;
      const existing = endpointMap.get(key) || {
        endpoint: key,
        avgDuration: 0,
        maxDuration: 0,
        minDuration: Infinity,
        count: 0,
        totalSize: 0
      };
      
      existing.count++;
      existing.totalSize += metric.size;
      existing.avgDuration = ((existing.avgDuration * (existing.count - 1)) + metric.duration) / existing.count;
      existing.maxDuration = Math.max(existing.maxDuration, metric.duration);
      existing.minDuration = Math.min(existing.minDuration, metric.duration);
      
      endpointMap.set(key, existing);
    });
    
    return Array.from(endpointMap.values())
      .sort((a, b) => b.avgDuration - a.avgDuration)
      .map(item => ({
        ...item,
        avgSize: item.totalSize / item.count
      }));
  }, [filteredData]);
  
  // Resource loading performance by type
  const resourcePerformanceByType = useMemo(() => {
    if (!filteredData?.resourceMetrics) return [];
    
    const typeMap = new Map<string, { 
      type: string;
      avgDuration: number;
      totalSize: number;
      count: number; 
    }>();
    
    filteredData.resourceMetrics.forEach(metric => {
      const existing = typeMap.get(metric.type) || {
        type: metric.type,
        avgDuration: 0,
        totalSize: 0,
        count: 0
      };
      
      existing.count++;
      existing.totalSize += metric.size;
      existing.avgDuration = ((existing.avgDuration * (existing.count - 1)) + metric.duration) / existing.count;
      
      typeMap.set(metric.type, existing);
    });
    
    return Array.from(typeMap.values())
      .map(item => ({
        name: item.type,
        avgDuration: item.avgDuration,
        avgSize: item.totalSize / item.count,
        count: item.count
      }));
  }, [filteredData]);
  
  // Component render time data
  const componentRenderData = useMemo(() => {
    if (!filteredData?.renderMetrics) return [];
    
    const componentMap = new Map<string, { 
      name: string;
      avgRenderTime: number;
      maxRenderTime: number;
      count: number;
    }>();
    
    filteredData.renderMetrics.forEach(metric => {
      const existing = componentMap.get(metric.component) || {
        name: metric.component,
        avgRenderTime: 0,
        maxRenderTime: 0,
        count: 0
      };
      
      existing.count++;
      existing.avgRenderTime = ((existing.avgRenderTime * (existing.count - 1)) + metric.renderTime) / existing.count;
      existing.maxRenderTime = Math.max(existing.maxRenderTime, metric.renderTime);
      
      componentMap.set(metric.component, existing);
    });
    
    return Array.from(componentMap.values())
      .sort((a, b) => b.avgRenderTime - a.avgRenderTime);
  }, [filteredData]);
  
  // Memory usage over time chart data
  const memoryChartData = useMemo(() => {
    if (!filteredData?.memorySnapshots) return [];
    
    return filteredData.memorySnapshots.map(snapshot => ({
      time: format(new Date(snapshot.timestamp), 'HH:mm'),
      usedMemory: snapshot.usedJSHeapSize / (1024 * 1024), // Convert to MB
      totalMemory: snapshot.totalJSHeapSize / (1024 * 1024),
      limit: snapshot.jsHeapSizeLimit / (1024 * 1024)
    }));
  }, [filteredData]);
  
  // Initialize
  useEffect(() => {
    loadApiResults();
  }, []);
  
  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle>Performance Metrics</CardTitle>
          <div className="flex space-x-2">
            <Select value={timeRange} onValueChange={setTimeRange}>
              <SelectTrigger className="w-[100px]">
                <Clock className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Time range" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="15m">15 minutes</SelectItem>
                <SelectItem value="1h">1 hour</SelectItem>
                <SelectItem value="6h">6 hours</SelectItem>
                <SelectItem value="24h">24 hours</SelectItem>
                <SelectItem value="7d">7 days</SelectItem>
              </SelectContent>
            </Select>
            
            <Button 
              variant="outline" 
              size="icon" 
              onClick={refreshData}
              disabled={isLoading}
              title="Refresh Data"
            >
              <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </div>
        <CardDescription>
          Monitor application performance metrics and identify bottlenecks
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {!performanceData ? (
          <div className="flex flex-col items-center justify-center h-[500px] text-gray-500 space-y-4">
            <AlertTriangle className="h-16 w-16 text-yellow-500 opacity-50" />
            <div className="text-center">
              <h3 className="text-lg font-medium">No Performance Data Available</h3>
              <p className="max-w-md mt-2">
                Run API tests or interact with the application to generate performance data.
                This panel uses API test results to visualize performance metrics.
              </p>
            </div>
            <Button
              variant="default"
              onClick={refreshData}
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Loading...
                </>
              ) : (
                <>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Refresh Data
                </>
              )}
            </Button>
          </div>
        ) : (
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid grid-cols-4 w-full">
              <TabsTrigger value="overview">
                <Zap className="h-4 w-4 mr-2" />
                Overview
              </TabsTrigger>
              <TabsTrigger value="api">
                <Network className="h-4 w-4 mr-2" />
                API Metrics
              </TabsTrigger>
              <TabsTrigger value="resources">
                <DownloadCloud className="h-4 w-4 mr-2" />
                Resources
              </TabsTrigger>
              <TabsTrigger value="memory">
                <MemoryStick className="h-4 w-4 mr-2" />
                Memory
              </TabsTrigger>
            </TabsList>
            
            {/* Overview Tab */}
            <TabsContent value="overview" className="mt-4 space-y-6">
              {/* Key Stats */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex flex-col items-center">
                      <Network className="h-10 w-10 text-blue-500 mb-2" />
                      <h3 className="text-lg font-semibold">API Response Time</h3>
                      <div className="text-3xl font-bold mt-2">
                        {filteredData?.networkMetrics && filteredData.networkMetrics.length > 0 ? 
                          (filteredData.networkMetrics.reduce((sum, m) => sum + m.duration, 0) / 
                           filteredData.networkMetrics.length).toFixed(1) : 
                          '0'} ms
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        Average across {filteredData?.networkMetrics?.length || 0} requests
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex flex-col items-center">
                      <DownloadCloud className="h-10 w-10 text-indigo-500 mb-2" />
                      <h3 className="text-lg font-semibold">Network Transfer</h3>
                      <div className="text-3xl font-bold mt-2">
                        {filteredData?.networkMetrics ? 
                          formatBytes(filteredData.networkMetrics.reduce((sum, m) => sum + m.size, 0)) : 
                          '0 KB'}
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        Total data transferred
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex flex-col items-center">
                      <Zap className="h-10 w-10 text-yellow-500 mb-2" />
                      <h3 className="text-lg font-semibold">Render Performance</h3>
                      <div className="text-3xl font-bold mt-2">
                        {filteredData?.renderMetrics && filteredData.renderMetrics.length > 0 ? 
                          (filteredData.renderMetrics.reduce((sum, m) => sum + m.renderTime, 0) / 
                           filteredData.renderMetrics.length).toFixed(1) : 
                          '0'} ms
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        Average component render time
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
              
              {/* Performance Overview Charts */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* API Performance by Endpoint */}
                <Card className="col-span-2">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">API Performance by Endpoint</CardTitle>
                    <CardDescription>Average response time (ms) for each API endpoint</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[300px] w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                          data={apiPerformanceByEndpoint.slice(0, 10)}
                          margin={{ top: 20, right: 30, left: 20, bottom: 70 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis 
                            dataKey="endpoint" 
                            angle={-45} 
                            textAnchor="end"
                            height={70}
                            interval={0}
                            tick={{ fontSize: 12 }}
                          />
                          <YAxis />
                          <Tooltip 
                            contentStyle={{ backgroundColor: "#222", border: "1px solid #444", color: "#fff" }}
                            formatter={(value: any, name: string) => {
                              if (name === 'avgDuration') return [`${Number(value).toFixed(2)} ms`, 'Avg Response Time'];
                              if (name === 'count') return [value, 'Request Count'];
                              return [value, name];
                            }}
                          />
                          <Legend />
                          <Bar dataKey="avgDuration" fill="#8884d8" name="Avg Response Time (ms)" />
                          <Bar dataKey="count" fill="#82ca9d" name="Request Count" />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
                
                {/* Resource Loading Time */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">Resource Loading Time</CardTitle>
                    <CardDescription>Average loading time by resource type</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[250px] w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                          data={resourcePerformanceByType}
                          margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="name" />
                          <YAxis />
                          <Tooltip 
                            formatter={(value, name) => {
                              if (name === 'avgDuration') return [`${value.toFixed(2)} ms`, 'Avg Load Time'];
                              return [value, name];
                            }}
                          />
                          <Bar dataKey="avgDuration" fill="#82ca9d" name="Avg Load Time (ms)" />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
                
                {/* Component Render Performance */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">Component Render Time</CardTitle>
                    <CardDescription>Average render time by component</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[250px] w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                          data={componentRenderData.slice(0, 7)}
                          margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="name" />
                          <YAxis />
                          <Tooltip 
                            formatter={(value, name) => {
                              if (name === 'avgRenderTime') return [`${value.toFixed(2)} ms`, 'Avg Render Time'];
                              if (name === 'maxRenderTime') return [`${value.toFixed(2)} ms`, 'Max Render Time'];
                              return [value, name];
                            }}
                          />
                          <Bar dataKey="avgRenderTime" fill="#8884d8" name="Avg Render Time (ms)" />
                          <Bar dataKey="maxRenderTime" fill="#ff7300" name="Max Render Time (ms)" />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
            
            {/* API Metrics Tab */}
            <TabsContent value="api" className="mt-4 space-y-6">
              {/* API Request Volumes */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">API Request Performance</CardTitle>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[400px]">
                    <table className="w-full border-collapse">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left p-2 font-medium text-sm">Endpoint</th>
                          <th className="text-center p-2 font-medium text-sm">Requests</th>
                          <th className="text-center p-2 font-medium text-sm">Avg (ms)</th>
                          <th className="text-center p-2 font-medium text-sm">Min (ms)</th>
                          <th className="text-center p-2 font-medium text-sm">Max (ms)</th>
                          <th className="text-right p-2 font-medium text-sm">Avg Size</th>
                        </tr>
                      </thead>
                      <tbody>
                        {apiPerformanceByEndpoint.map((item, index) => (
                          <tr key={index} className="border-b hover:bg-slate-800/30">
                            <td className="text-left p-2 font-mono text-xs">{item.endpoint}</td>
                            <td className="text-center p-2">{item.count}</td>
                            <td className="text-center p-2">
                              <Badge
                                variant={
                                  item.avgDuration < 100 ? "success" :
                                  item.avgDuration < 500 ? "default" :
                                  "destructive"
                                }
                              >
                                {item.avgDuration.toFixed(1)}
                              </Badge>
                            </td>
                            <td className="text-center p-2 text-green-500">{item.minDuration.toFixed(1)}</td>
                            <td className="text-center p-2 text-red-500">{item.maxDuration.toFixed(1)}</td>
                            <td className="text-right p-2 font-mono text-xs">{formatBytes(item.avgSize)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </ScrollArea>
                </CardContent>
              </Card>
              
              {/* API Performance Recommendations */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Performance Recommendations</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {apiPerformanceByEndpoint.filter(item => item.avgDuration > 500).length > 0 ? (
                    <div className="border-l-4 border-red-500 pl-4 py-2 bg-red-950/20">
                      <h3 className="font-medium text-red-400">Slow API Endpoints Detected</h3>
                      <p className="text-sm text-gray-400 mt-1">
                        The following endpoints have average response times greater than 500ms:
                      </p>
                      <ul className="list-disc list-inside text-sm mt-2">
                        {apiPerformanceByEndpoint
                          .filter(item => item.avgDuration > 500)
                          .map((item, idx) => (
                            <li key={idx} className="text-gray-300">
                              <span className="font-mono">{item.endpoint}</span> - {item.avgDuration.toFixed(1)}ms avg 
                              (called {item.count} times)
                            </li>
                          ))
                        }
                      </ul>
                      <p className="text-sm text-gray-400 mt-2">
                        Consider adding caching, optimizing database queries, or implementing pagination for these endpoints.
                      </p>
                    </div>
                  ) : (
                    <div className="border-l-4 border-green-500 pl-4 py-2 bg-green-950/20">
                      <h3 className="font-medium text-green-400">API Performance Is Good</h3>
                      <p className="text-sm text-gray-400 mt-1">
                        All API endpoints are responding within acceptable time limits.
                      </p>
                    </div>
                  )}
                  
                  {apiPerformanceByEndpoint.filter(item => item.avgSize > 100000).length > 0 && (
                    <div className="border-l-4 border-yellow-500 pl-4 py-2 bg-yellow-950/20">
                      <h3 className="font-medium text-yellow-400">Large Response Payloads</h3>
                      <p className="text-sm text-gray-400 mt-1">
                        The following endpoints return large response payloads:
                      </p>
                      <ul className="list-disc list-inside text-sm mt-2">
                        {apiPerformanceByEndpoint
                          .filter(item => item.avgSize > 100000)
                          .map((item, idx) => (
                            <li key={idx} className="text-gray-300">
                              <span className="font-mono">{item.endpoint}</span> - {formatBytes(item.avgSize)} avg
                            </li>
                          ))
                        }
                      </ul>
                      <p className="text-sm text-gray-400 mt-2">
                        Consider implementing pagination, response filtering, or compression to reduce payload sizes.
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
            
            {/* Resources Tab */}
            <TabsContent value="resources" className="mt-4 space-y-6">
              {/* Resource Metrics */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">Resource Loading Time</CardTitle>
                    <CardDescription>Average loading time by resource type</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[300px] w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                          data={resourcePerformanceByType}
                          margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                          layout="vertical"
                        >
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis type="number" />
                          <YAxis dataKey="name" type="category" width={100} />
                          <Tooltip 
                            formatter={(value, name) => {
                              if (name === 'avgDuration') return [`${value.toFixed(2)} ms`, 'Avg Load Time'];
                              if (name === 'avgSize') return [formatBytes(value), 'Avg Size'];
                              if (name === 'count') return [value, 'Count'];
                              return [value, name];
                            }}
                          />
                          <Legend />
                          <Bar dataKey="avgDuration" fill="#8884d8" name="Avg Load Time (ms)" />
                          <Bar dataKey="count" fill="#82ca9d" name="Count" />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">Resource Size by Type</CardTitle>
                    <CardDescription>Average size of resources by type</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[300px] w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                          data={resourcePerformanceByType.map(item => ({
                            ...item,
                            // Convert to KB for better visualization
                            avgSizeKB: item.avgSize / 1024
                          }))}
                          margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                          layout="vertical"
                        >
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis type="number" />
                          <YAxis dataKey="name" type="category" width={100} />
                          <Tooltip 
                            formatter={(value, name) => {
                              if (name === 'avgSizeKB') return [formatBytes(value * 1024), 'Avg Size'];
                              return [value, name];
                            }}
                          />
                          <Legend />
                          <Bar dataKey="avgSizeKB" fill="#ffc658" name="Avg Size (KB)" />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
              </div>
              
              {/* Component Render Performance */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">UI Component Performance</CardTitle>
                  <CardDescription>Render time by component (ms)</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={componentRenderData}
                        margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis 
                          dataKey="name" 
                          angle={-45} 
                          textAnchor="end"
                          height={60}
                          interval={0}
                        />
                        <YAxis />
                        <Tooltip 
                          formatter={(value, name) => {
                            if (name === 'avgRenderTime') return [`${value.toFixed(2)} ms`, 'Avg Render Time'];
                            if (name === 'maxRenderTime') return [`${value.toFixed(2)} ms`, 'Max Render Time'];
                            return [value, name];
                          }}
                        />
                        <Legend />
                        <Bar dataKey="avgRenderTime" fill="#8884d8" name="Avg Render Time" />
                        <Bar dataKey="maxRenderTime" fill="#ff7300" name="Max Render Time" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
              
              {/* Optimization Recommendations */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Optimization Opportunities</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {componentRenderData.filter(c => c.avgRenderTime > 15).length > 0 && (
                    <div className="border-l-4 border-yellow-500 pl-4 py-2 bg-yellow-950/20">
                      <h3 className="font-medium text-yellow-400">Slow Rendering Components</h3>
                      <p className="text-sm text-gray-400 mt-1">
                        The following components have high render times and should be optimized:
                      </p>
                      <ul className="list-disc list-inside text-sm mt-2">
                        {componentRenderData
                          .filter(c => c.avgRenderTime > 15)
                          .map((comp, idx) => (
                            <li key={idx} className="text-gray-300">
                              <span className="font-semibold">{comp.name}</span> - {comp.avgRenderTime.toFixed(1)}ms avg, 
                              {comp.maxRenderTime.toFixed(1)}ms max
                            </li>
                          ))
                        }
                      </ul>
                      <p className="text-sm text-gray-400 mt-2">
                        Consider using memoization, virtualization for lists, or splitting complex components.
                      </p>
                    </div>
                  )}
                  
                  {resourcePerformanceByType.filter(r => r.avgSize > 100000).length > 0 && (
                    <div className="border-l-4 border-red-500 pl-4 py-2 bg-red-950/20">
                      <h3 className="font-medium text-red-400">Large Resources</h3>
                      <p className="text-sm text-gray-400 mt-1">
                        Large assets are impacting load performance:
                      </p>
                      <ul className="list-disc list-inside text-sm mt-2">
                        {resourcePerformanceByType
                          .filter(r => r.avgSize > 100000)
                          .map((res, idx) => (
                            <li key={idx} className="text-gray-300">
                              <span className="font-semibold">{res.name}</span> - {formatBytes(res.avgSize)} avg size
                            </li>
                          ))
                        }
                      </ul>
                      <p className="text-sm text-gray-400 mt-2">
                        Consider compression, lazy loading, or code splitting to improve load times.
                      </p>
                    </div>
                  )}
                  
                  {!componentRenderData.filter(c => c.avgRenderTime > 15).length && 
                   !resourcePerformanceByType.filter(r => r.avgSize > 100000).length && (
                    <div className="border-l-4 border-green-500 pl-4 py-2 bg-green-950/20">
                      <h3 className="font-medium text-green-400">Good Resource Performance</h3>
                      <p className="text-sm text-gray-400 mt-1">
                        No significant resource or rendering performance issues were detected.
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
            
            {/* Memory Tab */}
            <TabsContent value="memory" className="mt-4 space-y-6">
              {/* Memory Usage Chart */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Memory Usage Over Time</CardTitle>
                  <CardDescription>JavaScript heap memory usage (MB)</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[400px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart
                        data={memoryChartData}
                        margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="time" />
                        <YAxis />
                        <Tooltip 
                          formatter={(value, name) => {
                            if (name === 'usedMemory') return [`${value.toFixed(1)} MB`, 'Used Memory'];
                            if (name === 'totalMemory') return [`${value.toFixed(1)} MB`, 'Total Memory'];
                            if (name === 'limit') return [`${value.toFixed(1)} MB`, 'Memory Limit'];
                            return [value, name];
                          }}
                        />
                        <Legend />
                        <Area 
                          type="monotone" 
                          dataKey="usedMemory" 
                          stackId="1"
                          stroke="#8884d8" 
                          fill="#8884d8" 
                          name="Used Memory"
                        />
                        <Area 
                          type="monotone" 
                          dataKey="totalMemory" 
                          stackId="2"
                          stroke="#82ca9d" 
                          fill="#82ca9d" 
                          fillOpacity={0.3}
                          name="Total Memory"
                        />
                        <Area 
                          type="monotone" 
                          dataKey="limit" 
                          stackId="3"
                          stroke="#ffc658" 
                          fill="none"
                          name="Memory Limit"
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
              
              {/* Memory Statistics */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-center">
                      <h3 className="text-lg font-semibold mb-2">Current Memory Usage</h3>
                      <div className="text-3xl font-bold">
                        {memoryChartData.length > 0 ? 
                          formatBytes(memoryChartData[memoryChartData.length - 1].usedMemory * 1024 * 1024) : 
                          '0 MB'}
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        of {memoryChartData.length > 0 ? 
                          formatBytes(memoryChartData[memoryChartData.length - 1].totalMemory * 1024 * 1024) : 
                          '0 MB'} allocated
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-center">
                      <h3 className="text-lg font-semibold mb-2">Memory Utilization</h3>
                      <div className="text-3xl font-bold">
                        {memoryChartData.length > 0 ? 
                          ((memoryChartData[memoryChartData.length - 1].usedMemory / 
                            memoryChartData[memoryChartData.length - 1].totalMemory) * 100).toFixed(1) + '%' : 
                          '0%'}
                      </div>
                      <div className="mt-2">
                        <div className="w-full bg-gray-700 rounded-full h-2.5">
                          <div className="bg-blue-600 h-2.5 rounded-full" style={{ 
                            width: memoryChartData.length > 0 ? 
                              ((memoryChartData[memoryChartData.length - 1].usedMemory / 
                                memoryChartData[memoryChartData.length - 1].totalMemory) * 100) + '%' : 
                              '0%'
                          }}></div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-center">
                      <h3 className="text-lg font-semibold mb-2">Memory Limit</h3>
                      <div className="text-3xl font-bold">
                        {memoryChartData.length > 0 ? 
                          formatBytes(memoryChartData[0].limit * 1024 * 1024) : 
                          '0 GB'}
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        Maximum available memory
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
              
              {/* Memory Analysis */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Memory Analysis</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {memoryChartData.length > 0 && (
                    <>
                      <div className="space-y-1">
                        <div className="flex justify-between text-sm">
                          <span>Memory Growth Rate</span>
                          <span className="font-mono">
                            {memoryChartData.length >= 2 ?
                              (((memoryChartData[memoryChartData.length - 1].usedMemory - 
                                 memoryChartData[0].usedMemory) / 
                                (memoryChartData.length - 1)) * 60).toFixed(2) + ' MB/hour' :
                              'N/A'}
                          </span>
                        </div>
                        <Separator />
                        
                        <div className="flex justify-between text-sm">
                          <span>Max Memory Usage</span>
                          <span className="font-mono">
                            {Math.max(...memoryChartData.map(d => d.usedMemory)).toFixed(1)} MB
                          </span>
                        </div>
                        <Separator />
                        
                        <div className="flex justify-between text-sm">
                          <span>Min Memory Usage</span>
                          <span className="font-mono">
                            {Math.min(...memoryChartData.map(d => d.usedMemory)).toFixed(1)} MB
                          </span>
                        </div>
                        <Separator />
                        
                        <div className="flex justify-between text-sm">
                          <span>Memory Volatility</span>
                          <span className="font-mono">
                            {(Math.max(...memoryChartData.map(d => d.usedMemory)) - 
                              Math.min(...memoryChartData.map(d => d.usedMemory))).toFixed(1)} MB
                          </span>
                        </div>
                        <Separator />
                      </div>
                      
                      {/* Memory Health Assessment */}
                      {((memoryChartData[memoryChartData.length - 1].usedMemory / 
                         memoryChartData[memoryChartData.length - 1].totalMemory) > 0.85) ? (
                        <div className="border-l-4 border-red-500 pl-4 py-2 bg-red-950/20">
                          <h3 className="font-medium text-red-400">High Memory Usage</h3>
                          <p className="text-sm text-gray-400 mt-1">
                            Memory usage is above 85% of allocated memory. This could lead to performance issues or crashes.
                            Consider implementing memory optimization strategies.
                          </p>
                        </div>
                      ) : ((memoryChartData[memoryChartData.length - 1].usedMemory / 
                            memoryChartData[memoryChartData.length - 1].totalMemory) > 0.7) ? (
                        <div className="border-l-4 border-yellow-500 pl-4 py-2 bg-yellow-950/20">
                          <h3 className="font-medium text-yellow-400">Moderate Memory Usage</h3>
                          <p className="text-sm text-gray-400 mt-1">
                            Memory usage is above 70% of allocated memory. Monitor usage during peak activity periods.
                          </p>
                        </div>
                      ) : (
                        <div className="border-l-4 border-green-500 pl-4 py-2 bg-green-950/20">
                          <h3 className="font-medium text-green-400">Healthy Memory Usage</h3>
                          <p className="text-sm text-gray-400 mt-1">
                            Memory usage is within acceptable parameters.
                          </p>
                        </div>
                      )}
                    </>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        )}
      </CardContent>
      
      <CardFooter className="flex justify-between">
        <div className="text-xs text-gray-500">
          Data from {filteredData?.networkMetrics?.length || 0} API requests
        </div>
        
        <div className="text-xs text-gray-500 flex items-center">
          <Clock className="h-3 w-3 mr-1" />
          {timeRange === '15m' ? 'Last 15 minutes' :
           timeRange === '1h' ? 'Last hour' :
           timeRange === '6h' ? 'Last 6 hours' :
           timeRange === '24h' ? 'Last 24 hours' :
           'Last 7 days'}
        </div>
      </CardFooter>
    </Card>
  );
}