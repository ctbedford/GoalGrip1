import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { 
  Terminal, 
  Search, 
  Filter,
  RefreshCw, 
  Download, 
  Upload,
  AlertCircle, 
  Braces, 
  Info,
  Clock,
  Calendar,
  ArrowDownUp,
  X
} from 'lucide-react';
import { LogLevel, FeatureArea } from '@/lib/logger';
import * as debugStorage from '@/lib/debugStorage';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Label } from '@/components/ui/label';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { format } from 'date-fns';

interface LogEntry {
  level: LogLevel;
  area: FeatureArea;
  message: string;
  timestamp: Date;
  data?: any;
  contextId?: string; // For correlation with execution contexts
}

export function EnhancedLogViewer() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [levelFilter, setLevelFilter] = useState<string>('all');
  const [areaFilter, setAreaFilter] = useState<string>('all');
  const [fromDate, setFromDate] = useState<Date | undefined>(undefined);
  const [toDate, setToDate] = useState<Date | undefined>(undefined);
  const [activeTab, setActiveTab] = useState('all-logs');
  const [groupBy, setGroupBy] = useState<string>('none');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [isExporting, setIsExporting] = useState(false);
  const [expandedLogs, setExpandedLogs] = useState<Set<number>>(new Set());
  
  // Calculate stats
  const totalLogs = logs.length;
  const errorCount = logs.filter(log => log.level === LogLevel.ERROR).length;
  const warningCount = logs.filter(log => log.level === LogLevel.WARN).length;
  const infoCount = logs.filter(log => log.level === LogLevel.INFO).length;
  const debugCount = logs.filter(log => log.level === LogLevel.DEBUG).length;
  
  // Filtered logs
  const filteredLogs = useMemo(() => {
    let result = [...logs];
    
    // Apply search query
    if (searchQuery) {
      const lowerQuery = searchQuery.toLowerCase();
      result = result.filter(log => 
        log.message.toLowerCase().includes(lowerQuery) || 
        (log.data && JSON.stringify(log.data).toLowerCase().includes(lowerQuery)) ||
        (log.contextId && log.contextId.toLowerCase().includes(lowerQuery))
      );
    }
    
    // Apply level filter
    if (levelFilter !== 'all') {
      const levelValue = parseInt(levelFilter);
      result = result.filter(log => log.level === levelValue);
    }
    
    // Apply area filter
    if (areaFilter !== 'all') {
      result = result.filter(log => log.area === areaFilter);
    }
    
    // Apply date filters
    if (fromDate) {
      result = result.filter(log => log.timestamp >= fromDate);
    }
    
    if (toDate) {
      const endOfDay = new Date(toDate);
      endOfDay.setHours(23, 59, 59, 999);
      result = result.filter(log => log.timestamp <= endOfDay);
    }
    
    // Apply tab filter
    if (activeTab === 'errors') {
      result = result.filter(log => log.level === LogLevel.ERROR);
    } else if (activeTab === 'warnings') {
      result = result.filter(log => log.level === LogLevel.WARN);
    } else if (activeTab === 'context-traces') {
      // Only show logs with context IDs for tracing
      result = result.filter(log => log.contextId && log.contextId.length > 0);
    }
    
    // Apply sorting
    result.sort((a, b) => {
      const timeA = a.timestamp.getTime();
      const timeB = b.timestamp.getTime();
      return sortDirection === 'asc' ? timeA - timeB : timeB - timeA;
    });
    
    return result;
  }, [logs, searchQuery, levelFilter, areaFilter, fromDate, toDate, activeTab, sortDirection]);
  
  // Grouped logs for display
  const groupedLogs = useMemo(() => {
    if (groupBy === 'none') {
      return { 'All Logs': filteredLogs };
    }
    
    return filteredLogs.reduce((groups, log) => {
      let groupKey: string;
      
      if (groupBy === 'level') {
        groupKey = LogLevel[log.level];
      } else if (groupBy === 'area') {
        groupKey = log.area as string;
      } else if (groupBy === 'day') {
        groupKey = format(log.timestamp, 'yyyy-MM-dd');
      } else if (groupBy === 'hour') {
        groupKey = format(log.timestamp, 'yyyy-MM-dd HH:00');
      } else if (groupBy === 'context') {
        // Group by contextId (for tracing execution)
        groupKey = log.contextId && log.contextId.length > 0 
          ? `Context: ${log.contextId.substring(0, 8)}...` 
          : 'No Context ID';
      } else {
        groupKey = 'All Logs';
      }
      
      if (!groups[groupKey]) {
        groups[groupKey] = [];
      }
      
      groups[groupKey].push(log);
      return groups;
    }, {} as Record<string, LogEntry[]>);
  }, [filteredLogs, groupBy]);
  
  // Load all logs
  const loadLogs = () => {
    const storedLogs = debugStorage.getLogEntries();
    if (storedLogs && storedLogs.length > 0) {
      // Convert timestamp strings to Date objects
      const processedLogs = storedLogs.map(log => ({
        ...log,
        // Ensure timestamp is a Date object
        timestamp: log.timestamp instanceof Date ? log.timestamp : new Date(log.timestamp)
      }));
      
      setLogs(processedLogs);
    }
  };
  
  // Clear all logs
  const clearLogs = () => {
    debugStorage.clearLogs();
    setLogs([]);
  };
  
  // Export logs to JSON file
  const exportLogs = () => {
    setIsExporting(true);
    try {
      const data = JSON.stringify(logs, null, 2);
      const blob = new Blob([data], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `goal-sync-logs-${format(new Date(), 'yyyy-MM-dd-HH-mm')}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Error exporting logs', error);
    } finally {
      setIsExporting(false);
    }
  };
  
  // Toggle log expansion
  const toggleLogExpansion = (index: number) => {
    const newExpanded = new Set(expandedLogs);
    if (newExpanded.has(index)) {
      newExpanded.delete(index);
    } else {
      newExpanded.add(index);
    }
    setExpandedLogs(newExpanded);
  };
  
  // Reset all filters
  const resetFilters = () => {
    setSearchQuery('');
    setLevelFilter('all');
    setAreaFilter('all');
    setFromDate(undefined);
    setToDate(undefined);
    setGroupBy('none');
    setSortDirection('desc');
  };
  
  // Initialize
  useEffect(() => {
    loadLogs();
  }, []);
  
  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle>Enhanced Log Viewer</CardTitle>
          <div className="flex space-x-2">
            <Button 
              variant="outline" 
              size="icon" 
              onClick={loadLogs} 
              title="Refresh Logs"
            >
              <RefreshCw className="h-4 w-4" />
            </Button>
            <Button 
              variant="outline" 
              size="icon" 
              onClick={exportLogs} 
              disabled={isExporting || logs.length === 0}
              title="Export Logs"
            >
              <Download className="h-4 w-4" />
            </Button>
            <Button 
              variant="outline" 
              size="icon" 
              onClick={clearLogs} 
              title="Clear Logs"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
        <CardDescription>
          Advanced log filtering, grouping, and analysis
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Stats Overview */}
        <div className="flex flex-wrap gap-2">
          <Badge 
            variant="outline" 
            className="flex items-center" 
            onClick={() => { setActiveTab('all-logs'); setLevelFilter('all'); }}
          >
            <Terminal className="h-3 w-3 mr-1" /> 
            Total: {totalLogs}
          </Badge>
          
          <Badge 
            variant="destructive" 
            className="flex items-center cursor-pointer"
            onClick={() => { setActiveTab('errors'); setLevelFilter(LogLevel.ERROR.toString()); }}
          >
            <AlertCircle className="h-3 w-3 mr-1" /> 
            Errors: {errorCount}
          </Badge>
          
          <Badge 
            variant="warning" 
            className="flex items-center cursor-pointer"
            onClick={() => { setActiveTab('warnings'); setLevelFilter(LogLevel.WARN.toString()); }}
          >
            <AlertCircle className="h-3 w-3 mr-1" /> 
            Warnings: {warningCount}
          </Badge>
          
          <Badge 
            variant="secondary" 
            className="flex items-center"
            onClick={() => { setActiveTab('all-logs'); setLevelFilter(LogLevel.INFO.toString()); }}
          >
            <Info className="h-3 w-3 mr-1" /> 
            Info: {infoCount}
          </Badge>
          
          <Badge 
            variant="outline" 
            className="flex items-center"
            onClick={() => { setActiveTab('all-logs'); setLevelFilter(LogLevel.DEBUG.toString()); }}
          >
            <Braces className="h-3 w-3 mr-1" /> 
            Debug: {debugCount}
          </Badge>
        </div>
        
        {/* Filters */}
        <div className="flex flex-col space-y-4">
          <div className="flex flex-col space-y-4 md:flex-row md:space-y-0 md:space-x-4">
            <div className="relative flex-grow">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-500" />
              <Input
                placeholder="Search in logs..."
                className="pl-8"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            
            {/* Level filter */}
            <Select value={levelFilter} onValueChange={setLevelFilter}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Filter level" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Levels</SelectItem>
                <SelectItem value={LogLevel.ERROR.toString()}>Errors</SelectItem>
                <SelectItem value={LogLevel.WARN.toString()}>Warnings</SelectItem>
                <SelectItem value={LogLevel.INFO.toString()}>Info</SelectItem>
                <SelectItem value={LogLevel.DEBUG.toString()}>Debug</SelectItem>
              </SelectContent>
            </Select>
            
            {/* Area filter */}
            <Select value={areaFilter} onValueChange={setAreaFilter}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Filter area" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Areas</SelectItem>
                {Object.values(FeatureArea)
                  .filter(area => typeof area === 'string')
                  .map(area => (
                    <SelectItem key={area as string} value={area as string}>
                      {(area as string).charAt(0).toUpperCase() + (area as string).slice(1)}
                    </SelectItem>
                  ))
                }
              </SelectContent>
            </Select>
          </div>
          
          <div className="flex flex-col space-y-4 md:flex-row md:space-y-0 md:space-x-4">
            {/* Date range picker */}
            <div className="flex space-x-2">
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="flex items-center justify-start w-[170px]">
                    <Calendar className="h-4 w-4 mr-2" />
                    {fromDate ? format(fromDate, 'PP') : 'From Date'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <CalendarComponent
                    mode="single"
                    selected={fromDate}
                    onSelect={setFromDate}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
              
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="flex items-center justify-start w-[170px]">
                    <Calendar className="h-4 w-4 mr-2" />
                    {toDate ? format(toDate, 'PP') : 'To Date'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <CalendarComponent
                    mode="single"
                    selected={toDate}
                    onSelect={setToDate}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
            
            <div className="flex space-x-2">
              {/* Group by */}
              <Select value={groupBy} onValueChange={setGroupBy}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Group by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No Grouping</SelectItem>
                  <SelectItem value="level">Group by Level</SelectItem>
                  <SelectItem value="area">Group by Area</SelectItem>
                  <SelectItem value="day">Group by Day</SelectItem>
                  <SelectItem value="hour">Group by Hour</SelectItem>
                  <SelectItem value="context">Group by Context ID</SelectItem>
                </SelectContent>
              </Select>
              
              {/* Sort direction */}
              <Button 
                variant="outline" 
                size="icon" 
                onClick={() => setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')}
                title={sortDirection === 'asc' ? 'Sort Newest First' : 'Sort Oldest First'}
              >
                <ArrowDownUp className="h-4 w-4" />
              </Button>
              
              {/* Reset filters */}
              <Button 
                variant="outline" 
                size="sm" 
                onClick={resetFilters}
                title="Reset All Filters"
              >
                Reset
              </Button>
            </div>
          </div>
        </div>
        
        {/* Log tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="all-logs">All Logs</TabsTrigger>
            <TabsTrigger value="errors">Errors</TabsTrigger>
            <TabsTrigger value="warnings">Warnings</TabsTrigger>
            <TabsTrigger value="context-traces">Context Traces</TabsTrigger>
          </TabsList>
          
          <TabsContent value="all-logs" className="mt-4">
            <ScrollArea className="h-[500px]">
              <div className="space-y-2 p-2">
                {Object.entries(groupedLogs).map(([group, groupLogs]) => (
                  <div key={group} className="mb-4">
                    {groupBy !== 'none' && (
                      <h3 className="text-sm font-semibold mb-2 text-gray-400">{group} ({groupLogs.length})</h3>
                    )}
                    
                    {groupLogs.length === 0 ? (
                      <div className="text-center p-8 text-gray-500">
                        No logs found matching the current filters
                      </div>
                    ) : (
                      groupLogs.map((log, index) => (
                        <Alert
                          key={index}
                          variant={
                            log.level === LogLevel.ERROR ? "destructive" :
                            log.level === LogLevel.WARN ? "default" :
                            log.level === LogLevel.INFO ? "default" :
                            null
                          }
                          className="mb-2 cursor-pointer"
                          onClick={() => toggleLogExpansion(index)}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center">
                              {log.level === LogLevel.ERROR ? (
                                <AlertCircle className="h-4 w-4 mr-2 text-red-500" />
                              ) : log.level === LogLevel.WARN ? (
                                <AlertCircle className="h-4 w-4 mr-2 text-yellow-500" />
                              ) : log.level === LogLevel.DEBUG ? (
                                <Braces className="h-4 w-4 mr-2 text-blue-500" />
                              ) : (
                                <Info className="h-4 w-4 mr-2 text-blue-500" />
                              )}
                              <AlertTitle className="text-sm">
                                {LogLevel[log.level]} | {log.area} | {format(log.timestamp, 'HH:mm:ss')}
                              </AlertTitle>
                            </div>
                            <div className="text-xs text-gray-500">
                              {format(log.timestamp, 'yyyy-MM-dd')}
                            </div>
                          </div>
                          
                          <AlertDescription className="text-sm mt-1 font-mono">
                            {log.message}
                            {expandedLogs.has(index) && log.data && (
                              <div className="mt-2 border-t pt-2 text-xs overflow-auto max-h-[200px]">
                                <pre className="whitespace-pre-wrap">
                                  {typeof log.data === 'object' 
                                    ? JSON.stringify(log.data, null, 2)
                                    : String(log.data)
                                  }
                                </pre>
                              </div>
                            )}
                          </AlertDescription>
                          
                          {!expandedLogs.has(index) && log.data && (
                            <div className="text-xs text-gray-500 mt-1">
                              Click to view details...
                            </div>
                          )}
                        </Alert>
                      ))
                    )}
                  </div>
                ))}
              </div>
            </ScrollArea>
          </TabsContent>
          
          <TabsContent value="errors" className="mt-4">
            <ScrollArea className="h-[500px]">
              <div className="space-y-2 p-2">
                {filteredLogs.length === 0 ? (
                  <div className="text-center p-8 text-gray-500">
                    No error logs found
                  </div>
                ) : (
                  filteredLogs.map((log, index) => (
                    <Alert
                      key={index}
                      variant="destructive"
                      className="mb-2 cursor-pointer"
                      onClick={() => toggleLogExpansion(index)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <AlertCircle className="h-4 w-4 mr-2" />
                          <AlertTitle className="text-sm">
                            {log.area} | {format(log.timestamp, 'HH:mm:ss')}
                          </AlertTitle>
                        </div>
                        <div className="text-xs text-gray-500">
                          {format(log.timestamp, 'yyyy-MM-dd')}
                        </div>
                      </div>
                      
                      <AlertDescription className="text-sm mt-1 font-mono">
                        {log.message}
                        {expandedLogs.has(index) && log.data && (
                          <div className="mt-2 border-t pt-2 text-xs overflow-auto max-h-[200px]">
                            <pre className="whitespace-pre-wrap">
                              {typeof log.data === 'object' 
                                ? JSON.stringify(log.data, null, 2)
                                : String(log.data)
                              }
                            </pre>
                          </div>
                        )}
                      </AlertDescription>
                      
                      {!expandedLogs.has(index) && log.data && (
                        <div className="text-xs text-gray-500 mt-1">
                          Click to view details...
                        </div>
                      )}
                    </Alert>
                  ))
                )}
              </div>
            </ScrollArea>
          </TabsContent>
          
          <TabsContent value="warnings" className="mt-4">
            <ScrollArea className="h-[500px]">
              <div className="space-y-2 p-2">
                {filteredLogs.length === 0 ? (
                  <div className="text-center p-8 text-gray-500">
                    No warning logs found
                  </div>
                ) : (
                  filteredLogs.map((log, index) => (
                    <Alert
                      key={index}
                      variant="default"
                      className="mb-2 cursor-pointer"
                      onClick={() => toggleLogExpansion(index)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <AlertCircle className="h-4 w-4 mr-2" />
                          <AlertTitle className="text-sm">
                            {log.area} | {format(log.timestamp, 'HH:mm:ss')}
                          </AlertTitle>
                        </div>
                        <div className="text-xs text-gray-500">
                          {format(log.timestamp, 'yyyy-MM-dd')}
                        </div>
                      </div>
                      
                      <AlertDescription className="text-sm mt-1 font-mono">
                        {log.message}
                        {expandedLogs.has(index) && log.data && (
                          <div className="mt-2 border-t pt-2 text-xs overflow-auto max-h-[200px]">
                            <pre className="whitespace-pre-wrap">
                              {typeof log.data === 'object' 
                                ? JSON.stringify(log.data, null, 2)
                                : String(log.data)
                              }
                            </pre>
                          </div>
                        )}
                      </AlertDescription>
                      
                      {!expandedLogs.has(index) && log.data && (
                        <div className="text-xs text-gray-500 mt-1">
                          Click to view details...
                        </div>
                      )}
                    </Alert>
                  ))
                )}
              </div>
            </ScrollArea>
          </TabsContent>
          
          <TabsContent value="context-traces" className="mt-4">
            <ScrollArea className="h-[500px]">
              <div className="space-y-2 p-2">
                {filteredLogs.length === 0 ? (
                  <div className="text-center p-8 text-gray-500">
                    No context trace logs found
                  </div>
                ) : (
                  // Group logs by context ID for better tracing
                  Object.entries(
                    filteredLogs.reduce((acc, log) => {
                      const contextId = log.contextId || 'unknown';
                      if (!acc[contextId]) {
                        acc[contextId] = [];
                      }
                      acc[contextId].push(log);
                      return acc;
                    }, {} as Record<string, LogEntry[]>)
                  ).map(([contextId, contextLogs]) => (
                    <div key={contextId} className="mb-6 border border-gray-800 rounded-md p-3">
                      <h3 className="text-sm font-semibold mb-2 text-blue-400 flex items-center">
                        <span className="bg-blue-900/30 px-2 py-1 rounded mr-2">Context ID: {contextId.substring(0, 12)}...</span>
                        <span className="text-xs text-gray-400">
                          {contextLogs.length} logs from {format(contextLogs[0].timestamp, 'HH:mm:ss')} 
                          to {format(contextLogs[contextLogs.length - 1].timestamp, 'HH:mm:ss')}
                        </span>
                      </h3>
                      
                      {contextLogs.map((log, index) => (
                        <Alert
                          key={index}
                          variant={
                            log.level === LogLevel.ERROR ? "destructive" :
                            log.level === LogLevel.WARN ? "default" :
                            null
                          }
                          className="mb-2 cursor-pointer border-l-4 pl-3 border-l-blue-500"
                          onClick={() => toggleLogExpansion(index)}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center">
                              {log.level === LogLevel.ERROR ? (
                                <AlertCircle className="h-4 w-4 mr-2 text-red-500" />
                              ) : log.level === LogLevel.WARN ? (
                                <AlertCircle className="h-4 w-4 mr-2 text-yellow-500" />
                              ) : log.level === LogLevel.DEBUG ? (
                                <Braces className="h-4 w-4 mr-2 text-blue-500" />
                              ) : (
                                <Info className="h-4 w-4 mr-2 text-blue-500" />
                              )}
                              <AlertTitle className="text-sm">
                                {LogLevel[log.level]} | {log.area} | {format(log.timestamp, 'HH:mm:ss.SSS')}
                              </AlertTitle>
                            </div>
                          </div>
                          
                          <AlertDescription className="text-sm mt-1 font-mono">
                            {log.message}
                            {expandedLogs.has(index) && log.data && (
                              <div className="mt-2 border-t pt-2 text-xs overflow-auto max-h-[200px]">
                                <pre className="whitespace-pre-wrap">
                                  {typeof log.data === 'object' 
                                    ? JSON.stringify(log.data, null, 2)
                                    : String(log.data)
                                  }
                                </pre>
                              </div>
                            )}
                          </AlertDescription>
                        </Alert>
                      ))}
                    </div>
                  ))
                )}
              </div>
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </CardContent>
      
      <CardFooter className="flex justify-between">
        <div className="text-xs text-gray-500">
          Displaying {filteredLogs.length} of {logs.length} logs
        </div>
        
        <div className="text-xs text-gray-500 flex items-center">
          <Clock className="h-3 w-3 mr-1" />
          Last updated: {logs.length > 0 ? format(new Date(), 'HH:mm:ss') : 'Never'}
        </div>
      </CardFooter>
    </Card>
  );
}