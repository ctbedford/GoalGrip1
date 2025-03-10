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
  AlertTriangle
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { FeatureArea, getFeatureVerificationStatus } from '@/lib/logger';
import * as debugStorage from '@/lib/debugStorage';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

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
    const verificationStatus = getFeatureVerificationStatus();
    
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
  
  // Initial load
  useEffect(() => {
    loadFeatureStatus();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  
  return (
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
                  <div key={name} className="flex justify-between items-start p-4 border rounded-md">
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
                            {feature.notes.map((note, i) => (
                              <li key={i}>{note}</li>
                            ))}
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
                    </div>
                  </div>
                ))
              )}
            </div>
          </ScrollArea>
        </div>
      </CardContent>
    </Card>
  );
}