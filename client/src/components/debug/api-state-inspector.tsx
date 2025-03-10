import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { 
  RefreshCw as LuRefreshCw, 
  Database as LuDatabase, 
  Server as LuServer, 
  Code as LuCode, 
  Eye as LuEye,
  Check as LuCheck,
  AlertCircle as LuAlertCircle,
  Save as LuSave,
  Copy as LuCopy
} from 'lucide-react';
import { ApiEndpoint } from '@/lib/apiTester';

import { FeatureArea, info } from '@/lib/logger';

/**
 * API State Inspector Component
 * 
 * This component provides a real-time view of the application's state through its API endpoints.
 * It allows developers to:
 * 1. View the current state of each API resource
 * 2. Inspect the data structure 
 * 3. Monitor changes to data in real-time
 */
export function ApiStateInspector() {
  const [selectedEndpoint, setSelectedEndpoint] = useState<string>('dashboard');
  const [apiData, setApiData] = useState<Record<string, any>>({});
  const [isLoading, setIsLoading] = useState<Record<string, boolean>>({});
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());
  const [error, setError] = useState<Record<string, string | null>>({});
  const { toast } = useToast();

  // Define the endpoints we want to monitor
  const endpoints = [
    { id: 'dashboard', label: 'Dashboard', path: '/api/dashboard/stats' },
    { id: 'goals', label: 'Goals', path: '/api/goals' },
    { id: 'categories', label: 'Categories', path: '/api/categories' },
    { id: 'progress-logs', label: 'Progress Logs', path: '/api/progress-logs' },
    { id: 'action-items', label: 'Action Items', path: '/api/action-items' },
    { id: 'badges', label: 'Badges', path: '/api/badges' },
    { id: 'users', label: 'Users', path: '/api/users' },
  ];

  // Fetch data for a specific endpoint
  const fetchEndpointData = async (endpointId: string) => {
    const endpoint = endpoints.find(e => e.id === endpointId);
    if (!endpoint) return;

    setIsLoading(prev => ({ ...prev, [endpointId]: true }));
    setError(prev => ({ ...prev, [endpointId]: null }));

    try {
      info(FeatureArea.API, `Fetching data for ${endpoint.label}`, { path: endpoint.path });
      const response = await fetch(endpoint.path).then(res => {
        if (!res.ok) throw new Error(`HTTP error ${res.status}`);
        return res.json();
      });
      
      setApiData(prev => ({ 
        ...prev, 
        [endpointId]: response 
      }));
      
      info(FeatureArea.API, `Successfully fetched data for ${endpoint.label}`, { 
        path: endpoint.path,
        dataSize: JSON.stringify(response).length
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(prev => ({ ...prev, [endpointId]: message }));
      
      info(FeatureArea.API, `Error fetching data for ${endpoint.label}`, { 
        path: endpoint.path,
        error: message
      });
    } finally {
      setIsLoading(prev => ({ ...prev, [endpointId]: false }));
    }
  };

  // Fetch all endpoint data
  const fetchAllData = async () => {
    for (const endpoint of endpoints) {
      await fetchEndpointData(endpoint.id);
    }
    
    toast({
      title: "API State Refreshed",
      description: "All endpoint data has been refreshed",
      duration: 3000,
    });
  };

  // Load initial data
  useEffect(() => {
    fetchAllData();
    
    // Set up polling for auto-refresh (every 10 seconds)
    const intervalId = setInterval(() => {
      fetchEndpointData(selectedEndpoint);
    }, 10000);
    
    return () => clearInterval(intervalId);
  }, [selectedEndpoint]);

  // Toggle a node's expanded state
  const toggleNode = (path: string) => {
    const newExpandedNodes = new Set(expandedNodes);
    if (newExpandedNodes.has(path)) {
      newExpandedNodes.delete(path);
    } else {
      newExpandedNodes.add(path);
    }
    setExpandedNodes(newExpandedNodes);
  };

  // Copy data to clipboard
  const copyToClipboard = (data: any) => {
    navigator.clipboard.writeText(JSON.stringify(data, null, 2));
    toast({
      title: "Copied to Clipboard",
      description: "The selected data has been copied to your clipboard",
      duration: 2000,
    });
  };

  // Render JSON tree recursively
  const renderJsonTree = (data: any, path: string = '', level: number = 0) => {
    if (data === null) return <span className="text-gray-500">null</span>;
    if (data === undefined) return <span className="text-gray-500">undefined</span>;
    
    const isArray = Array.isArray(data);
    const isObject = typeof data === 'object' && data !== null && !isArray;
    
    if (isObject || isArray) {
      const itemCount = isArray ? data.length : Object.keys(data).length;
      const isExpanded = expandedNodes.has(path);
      
      return (
        <div className="pl-4 border-l border-gray-200">
          <div 
            className="flex items-center cursor-pointer hover:bg-gray-50 py-0.5 px-1 rounded"
            onClick={() => toggleNode(path)}
          >
            <span className="mr-1 font-mono text-xs">
              {isExpanded ? '▼' : '▶'}
            </span>
            <span className="font-semibold text-sm">
              {isArray ? `Array(${itemCount})` : `Object{${itemCount}}`}
            </span>
            {!isExpanded && (
              <Button 
                variant="ghost" 
                size="sm" 
                className="ml-2 h-6"
                onClick={(e) => {
                  e.stopPropagation();
                  copyToClipboard(data);
                }}
              >
                <LuCopy className="h-3 w-3" />
              </Button>
            )}
          </div>
          
          {isExpanded && (
            <div className="pl-2">
              {isArray ? (
                data.map((item: any, index: number) => (
                  <div key={`${path}-${index}`} className="flex items-start py-0.5">
                    <span className="text-gray-500 mr-2 font-mono text-xs">[{index}]</span>
                    <div className="flex-1">
                      {renderJsonTree(item, `${path}-${index}`, level + 1)}
                    </div>
                  </div>
                ))
              ) : (
                Object.entries(data).map(([key, value]: [string, any]) => (
                  <div key={`${path}-${key}`} className="flex items-start py-0.5">
                    <span className="text-blue-600 mr-2 font-mono text-xs">"{key}":</span>
                    <div className="flex-1">
                      {renderJsonTree(value, `${path}-${key}`, level + 1)}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      );
    }
    
    // Render primitive value
    const valueClass = typeof data === 'string'
      ? 'text-green-600'
      : typeof data === 'number'
        ? 'text-purple-600'
        : typeof data === 'boolean'
          ? 'text-orange-600'
          : 'text-gray-600';
    
    return (
      <span className={`${valueClass} font-mono text-xs`}>
        {typeof data === 'string' ? `"${data}"` : String(data)}
      </span>
    );
  };

  return (
    <Card className="w-full h-full">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-center">
          <div>
            <CardTitle className="text-xl flex items-center">
              <LuDatabase className="mr-2 h-5 w-5" />
              API State Inspector
            </CardTitle>
            <CardDescription>
              Monitor and inspect application state through API endpoints
            </CardDescription>
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={fetchAllData}
            disabled={Object.values(isLoading).some(Boolean)}
          >
            <LuRefreshCw className={`mr-2 h-4 w-4 ${Object.values(isLoading).some(Boolean) ? 'animate-spin' : ''}`} />
            Refresh All
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs value={selectedEndpoint} onValueChange={setSelectedEndpoint}>
          <TabsList className="grid grid-cols-7 mb-4">
            {endpoints.map(endpoint => (
              <TabsTrigger key={endpoint.id} value={endpoint.id}>
                {endpoint.label}
                {isLoading[endpoint.id] && (
                  <LuRefreshCw className="ml-2 h-3 w-3 animate-spin" />
                )}
              </TabsTrigger>
            ))}
          </TabsList>
          
          {endpoints.map(endpoint => (
            <TabsContent key={endpoint.id} value={endpoint.id} className="space-y-4">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-lg font-semibold flex items-center">
                    <LuServer className="mr-2 h-5 w-5" />
                    {endpoint.label} Data
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    API Endpoint: <code className="bg-gray-100 px-1 py-0.5 rounded">{endpoint.path}</code>
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={error[endpoint.id] ? "destructive" : "outline"}>
                    {error[endpoint.id] ? (
                      <LuAlertCircle className="mr-1 h-3 w-3" />
                    ) : (
                      <LuCheck className="mr-1 h-3 w-3" />
                    )}
                    {error[endpoint.id] ? 'Error' : 'OK'}
                  </Badge>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => fetchEndpointData(endpoint.id)}
                    disabled={isLoading[endpoint.id]}
                  >
                    <LuRefreshCw className={`mr-1 h-3 w-3 ${isLoading[endpoint.id] ? 'animate-spin' : ''}`} />
                    Refresh
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => copyToClipboard(apiData[endpoint.id])}
                    disabled={!apiData[endpoint.id] || isLoading[endpoint.id]}
                  >
                    <LuCopy className="mr-1 h-3 w-3" />
                    Copy
                  </Button>
                </div>
              </div>
              
              <Separator />
              
              {error[endpoint.id] ? (
                <div className="p-4 bg-red-50 border border-red-200 rounded-md text-red-800">
                  <p className="font-medium">Error fetching data:</p>
                  <p className="text-sm mt-1">{error[endpoint.id]}</p>
                </div>
              ) : isLoading[endpoint.id] && !apiData[endpoint.id] ? (
                <div className="flex justify-center items-center py-8">
                  <LuRefreshCw className="animate-spin h-6 w-6 text-muted-foreground" />
                  <span className="ml-2 text-muted-foreground">Loading data...</span>
                </div>
              ) : !apiData[endpoint.id] ? (
                <div className="text-center py-8 text-muted-foreground">
                  No data available for this endpoint
                </div>
              ) : (
                <div className="border rounded-md p-4 bg-gray-50 overflow-auto max-h-[500px]">
                  <div className="font-mono text-sm">
                    {renderJsonTree(apiData[endpoint.id], endpoint.id)}
                  </div>
                </div>
              )}
            </TabsContent>
          ))}
        </Tabs>
      </CardContent>
    </Card>
  );
}