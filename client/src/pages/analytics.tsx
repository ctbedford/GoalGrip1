import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { 
  BarChart2, 
  PieChart, 
  LineChart, 
  Calendar as CalendarIcon, 
  Activity, 
  TrendingUp, 
  Filter, 
  Download,
  ArrowUp,
  ArrowDown,
  Zap,
  Clock,
  Target
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { GoalWithCategory, ProgressLog } from "@shared/schema";
import {
  BarChart,
  Bar,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  AreaChart,
  Area,
  PieChart as RechartsPieChart,
  Pie
} from "recharts";

const Analytics: React.FC = () => {
  const [timeFrame, setTimeFrame] = useState<string>("week");
  const [activeTab, setActiveTab] = useState<string>("progress");
  
  // Fetch goals
  const { data: goals, isLoading: isGoalsLoading } = useQuery<GoalWithCategory[]>({
    queryKey: ['/api/goals'],
  });
  
  // Sample data for charts (would be derived from real data in production)
  const progressData = [
    { day: 'Mon', value: 7 },
    { day: 'Tue', value: 5 },
    { day: 'Wed', value: 12 },
    { day: 'Thu', value: 8 },
    { day: 'Fri', value: 10 },
    { day: 'Sat', value: 6 },
    { day: 'Sun', value: 9 },
  ];
  
  const categoryData = [
    { name: 'Fitness', value: 35 },
    { name: 'Education', value: 25 },
    { name: 'Career', value: 15 },
    { name: 'Finance', value: 15 },
    { name: 'Personal', value: 10 },
  ];
  
  const completionData = [
    { month: 'Jan', completed: 2, active: 5 },
    { month: 'Feb', completed: 3, active: 6 },
    { month: 'Mar', completed: 4, active: 4 },
    { month: 'Apr', completed: 5, active: 3 },
    { month: 'May', completed: 2, active: 7 },
    { month: 'Jun', completed: 6, active: 4 },
  ];
  
  const COLORS = ['#3b82f6', '#10b981', '#8b5cf6', '#f59e0b', '#ef4444'];
  
  // Calculate some basic stats (would use real data in production)
  const activeGoals = goals?.filter(goal => !goal.completed).length || 0;
  const completedGoals = goals?.filter(goal => goal.completed).length || 0;
  const topCategory = "Fitness"; // In production, calculate this from real data
  const streak = 5; // In production, calculate this from real data
  
  return (
    <div>
      {/* Enhanced Page Header */}
      <div className="mb-8 rounded-lg overflow-hidden relative">
        <div className="bg-gradient-to-r from-gray-900 via-purple-900 to-gray-900 p-6 border border-gray-800">
          <div className="relative z-10 max-w-3xl">
            <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-100 to-purple-100 bg-clip-text text-transparent mb-2">
              Performance Analytics
            </h2>
            <p className="text-gray-300 mb-6">Visualize your progress and identify patterns</p>
            
            <div className="flex flex-col sm:flex-row gap-3">
              <Select value={timeFrame} onValueChange={setTimeFrame}>
                <SelectTrigger className="w-[180px] bg-gray-900 bg-opacity-50 border-gray-800 text-gray-200">
                  <SelectValue placeholder="Select timeframe" />
                </SelectTrigger>
                <SelectContent className="bg-gray-900 border-gray-800 text-gray-200">
                  <SelectItem value="week">Past Week</SelectItem>
                  <SelectItem value="month">Past Month</SelectItem>
                  <SelectItem value="quarter">Past 3 Months</SelectItem>
                  <SelectItem value="year">Past Year</SelectItem>
                  <SelectItem value="all">All Time</SelectItem>
                </SelectContent>
              </Select>
              
              <Button 
                variant="outline" 
                className="border border-purple-700 text-purple-100 bg-transparent hover:bg-purple-900 hover:bg-opacity-30 flex items-center"
              >
                <Download className="h-4 w-4 mr-2" />
                Export Data
              </Button>
            </div>
          </div>
          
          {/* Decorative Elements */}
          <div className="absolute top-0 right-0 w-1/2 h-full pointer-events-none opacity-20">
            <div className="absolute top-6 right-8 w-24 h-24 rounded-full bg-purple-500 blur-3xl"></div>
            <div className="absolute bottom-8 right-16 w-32 h-32 rounded-full bg-blue-400 blur-3xl"></div>
          </div>
        </div>
        
        {/* Glow Effect */}
        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-purple-500 to-transparent"></div>
      </div>
      
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-5 mb-8">
        <div className="stats-card group hover:translate-y-[-5px] transition-all duration-300 p-6">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="text-blue-100 text-sm font-medium mb-1">ACTIVE GOALS</h3>
              <div className="flex items-baseline">
                <span className="text-3xl font-bold text-white mr-2">{activeGoals}</span>
                <span className="text-xs text-blue-300 uppercase font-mono">In Progress</span>
              </div>
            </div>
            <div className="w-12 h-12 rounded-md bg-blue-900 bg-opacity-40 flex items-center justify-center border border-blue-800 shadow-inner">
              <Target className="h-6 w-6 text-blue-300" />
            </div>
          </div>
        </div>
        
        <div className="stats-card group hover:translate-y-[-5px] transition-all duration-300 p-6">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="text-green-100 text-sm font-medium mb-1">COMPLETED GOALS</h3>
              <div className="flex items-baseline">
                <span className="text-3xl font-bold text-white mr-2">{completedGoals}</span>
                <span className="text-xs text-green-300 uppercase font-mono">Success</span>
              </div>
            </div>
            <div className="w-12 h-12 rounded-md bg-green-900 bg-opacity-40 flex items-center justify-center border border-green-800 shadow-inner">
              <TrendingUp className="h-6 w-6 text-green-300" />
            </div>
          </div>
        </div>
        
        <div className="stats-card group hover:translate-y-[-5px] transition-all duration-300 p-6">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="text-purple-100 text-sm font-medium mb-1">TOP CATEGORY</h3>
              <div className="flex items-baseline">
                <span className="text-3xl font-bold text-white mr-2">{topCategory}</span>
                <span className="text-xs text-purple-300 uppercase font-mono">Focus</span>
              </div>
            </div>
            <div className="w-12 h-12 rounded-md bg-purple-900 bg-opacity-40 flex items-center justify-center border border-purple-800 shadow-inner">
              <PieChart className="h-6 w-6 text-purple-300" />
            </div>
          </div>
        </div>
        
        <div className="stats-card group hover:translate-y-[-5px] transition-all duration-300 p-6">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="text-amber-100 text-sm font-medium mb-1">CURRENT STREAK</h3>
              <div className="flex items-baseline">
                <span className="text-3xl font-bold text-white mr-2">{streak}</span>
                <span className="text-xs text-amber-300 uppercase font-mono">Days</span>
              </div>
            </div>
            <div className="w-12 h-12 rounded-md bg-amber-900 bg-opacity-40 flex items-center justify-center border border-amber-800 shadow-inner">
              <Zap className="h-6 w-6 text-amber-300" />
            </div>
          </div>
        </div>
      </div>
      
      {/* Analytics Tabs */}
      <Tabs defaultValue="progress" onValueChange={setActiveTab} className="mb-8">
        <TabsList className="border border-gray-800 bg-gray-900 p-1">
          <TabsTrigger 
            value="progress" 
            className="data-[state=active]:bg-blue-900 data-[state=active]:text-gray-100 data-[state=active]:shadow-none"
          >
            <Activity className="h-4 w-4 mr-2 text-blue-400" />
            Progress
          </TabsTrigger>
          <TabsTrigger 
            value="categories" 
            className="data-[state=active]:bg-purple-900 data-[state=active]:text-gray-100 data-[state=active]:shadow-none"
          >
            <PieChart className="h-4 w-4 mr-2 text-purple-400" />
            Categories
          </TabsTrigger>
          <TabsTrigger 
            value="completion" 
            className="data-[state=active]:bg-green-900 data-[state=active]:text-gray-100 data-[state=active]:shadow-none"
          >
            <TrendingUp className="h-4 w-4 mr-2 text-green-400" />
            Completion Rates
          </TabsTrigger>
          <TabsTrigger 
            value="activity" 
            className="data-[state=active]:bg-amber-900 data-[state=active]:text-gray-100 data-[state=active]:shadow-none"
          >
            <CalendarIcon className="h-4 w-4 mr-2 text-amber-400" />
            Activity
          </TabsTrigger>
        </TabsList>
        
        {/* Progress Tab */}
        <TabsContent value="progress" className="pt-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            <Card className="card border border-blue-900 border-opacity-30 lg:col-span-2">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg font-semibold text-gray-100">Goal Progress Trends</CardTitle>
                <CardDescription className="text-gray-400">Your progress over time</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[350px] w-full">
                  {isGoalsLoading ? (
                    <div className="h-full w-full flex items-center justify-center">
                      <Skeleton className="h-[300px] w-full" />
                    </div>
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart
                        data={progressData}
                        margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                      >
                        <defs>
                          <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.1}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                        <XAxis dataKey="day" stroke="#94a3b8" />
                        <YAxis stroke="#94a3b8" />
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: '#0f172a', 
                            borderColor: '#334155',
                            color: '#e2e8f0'
                          }}
                          itemStyle={{ color: '#e2e8f0' }}
                          labelStyle={{ color: '#e2e8f0' }}
                        />
                        <Area 
                          type="monotone" 
                          dataKey="value" 
                          stroke="#3b82f6" 
                          fillOpacity={1} 
                          fill="url(#colorValue)" 
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </CardContent>
            </Card>
            
            <Card className="card border border-blue-900 border-opacity-30">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg font-semibold text-gray-100">Progress Insights</CardTitle>
                <CardDescription className="text-gray-400">Analysis of your progress patterns</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="p-4 border border-blue-900 border-opacity-20 rounded-md bg-blue-900 bg-opacity-10">
                    <div className="flex items-start">
                      <div className="w-8 h-8 rounded-md bg-blue-900 bg-opacity-30 mr-3 flex items-center justify-center">
                        <ArrowUp className="h-4 w-4 text-green-400" />
                      </div>
                      <div>
                        <h4 className="text-sm font-medium text-blue-100">Most Productive Day</h4>
                        <p className="text-xs text-gray-400 mt-1">Wednesday shows the highest activity</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="p-4 border border-blue-900 border-opacity-20 rounded-md bg-blue-900 bg-opacity-10">
                    <div className="flex items-start">
                      <div className="w-8 h-8 rounded-md bg-blue-900 bg-opacity-30 mr-3 flex items-center justify-center">
                        <Clock className="h-4 w-4 text-amber-400" />
                      </div>
                      <div>
                        <h4 className="text-sm font-medium text-blue-100">Top Activity Time</h4>
                        <p className="text-xs text-gray-400 mt-1">Most progress logged between 6-8pm</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="p-4 border border-blue-900 border-opacity-20 rounded-md bg-blue-900 bg-opacity-10">
                    <div className="flex items-start">
                      <div className="w-8 h-8 rounded-md bg-blue-900 bg-opacity-30 mr-3 flex items-center justify-center">
                        <Zap className="h-4 w-4 text-purple-400" />
                      </div>
                      <div>
                        <h4 className="text-sm font-medium text-blue-100">Consistency Score</h4>
                        <p className="text-xs text-gray-400 mt-1">8.5/10 - You're maintaining steady progress</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="p-4 border border-blue-900 border-opacity-20 rounded-md bg-blue-900 bg-opacity-10">
                    <div className="flex items-start">
                      <div className="w-8 h-8 rounded-md bg-blue-900 bg-opacity-30 mr-3 flex items-center justify-center">
                        <ArrowDown className="h-4 w-4 text-red-400" />
                      </div>
                      <div>
                        <h4 className="text-sm font-medium text-blue-100">Areas for Improvement</h4>
                        <p className="text-xs text-gray-400 mt-1">Weekend activity appears to drop significantly</p>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        {/* Categories Tab */}
        <TabsContent value="categories" className="pt-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            <Card className="card border border-purple-900 border-opacity-30">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg font-semibold text-gray-100">Category Distribution</CardTitle>
                <CardDescription className="text-gray-400">Your goals by category</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px] w-full flex items-center justify-center">
                  {isGoalsLoading ? (
                    <Skeleton className="h-[250px] w-full" />
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <RechartsPieChart>
                        <Pie
                          data={categoryData}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          outerRadius={100}
                          fill="#8884d8"
                          dataKey="value"
                          label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                        >
                          {categoryData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: '#0f172a', 
                            borderColor: '#334155',
                            color: '#e2e8f0'
                          }}
                          itemStyle={{ color: '#e2e8f0' }}
                          labelStyle={{ color: '#e2e8f0' }}
                        />
                      </RechartsPieChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </CardContent>
            </Card>
            
            <Card className="card border border-purple-900 border-opacity-30 lg:col-span-2">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg font-semibold text-gray-100">Category Performance</CardTitle>
                <CardDescription className="text-gray-400">Completion rates by category</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px] w-full">
                  {isGoalsLoading ? (
                    <Skeleton className="h-[250px] w-full" />
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={[
                          {name: 'Fitness', completed: 75, inProgress: 25},
                          {name: 'Education', completed: 60, inProgress: 40},
                          {name: 'Career', completed: 40, inProgress: 60},
                          {name: 'Finance', completed: 80, inProgress: 20},
                          {name: 'Personal', completed: 50, inProgress: 50},
                        ]}
                        margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                        <XAxis dataKey="name" stroke="#94a3b8" />
                        <YAxis stroke="#94a3b8" />
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: '#0f172a', 
                            borderColor: '#334155',
                            color: '#e2e8f0'
                          }}
                          itemStyle={{ color: '#e2e8f0' }}
                          labelStyle={{ color: '#e2e8f0' }}
                        />
                        <Legend />
                        <Bar dataKey="completed" name="Completed %" fill="#10b981" />
                        <Bar dataKey="inProgress" name="In Progress %" fill="#3b82f6" />
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        {/* Completion Rates Tab */}
        <TabsContent value="completion" className="pt-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            <Card className="card border border-green-900 border-opacity-30 lg:col-span-2">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg font-semibold text-gray-100">Goal Completion Trends</CardTitle>
                <CardDescription className="text-gray-400">Completed vs. active goals over time</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[350px] w-full">
                  {isGoalsLoading ? (
                    <Skeleton className="h-[300px] w-full" />
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={completionData}
                        margin={{
                          top: 20,
                          right: 30,
                          left: 20,
                          bottom: 5,
                        }}
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                        <XAxis dataKey="month" stroke="#94a3b8" />
                        <YAxis stroke="#94a3b8" />
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: '#0f172a', 
                            borderColor: '#334155',
                            color: '#e2e8f0'
                          }}
                          itemStyle={{ color: '#e2e8f0' }}
                          labelStyle={{ color: '#e2e8f0' }}
                        />
                        <Legend />
                        <Bar dataKey="completed" name="Completed" fill="#10b981" />
                        <Bar dataKey="active" name="Active" fill="#3b82f6" />
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </CardContent>
            </Card>
            
            <Card className="card border border-green-900 border-opacity-30">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg font-semibold text-gray-100">Completion Stats</CardTitle>
                <CardDescription className="text-gray-400">Analysis of your completion patterns</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="p-4 border border-green-900 border-opacity-20 rounded-md bg-green-900 bg-opacity-10">
                    <div className="flex items-start">
                      <div className="w-8 h-8 rounded-md bg-green-900 bg-opacity-30 mr-3 flex items-center justify-center">
                        <TrendingUp className="h-4 w-4 text-green-400" />
                      </div>
                      <div>
                        <h4 className="text-sm font-medium text-green-100">Completion Rate</h4>
                        <p className="text-xs text-gray-400 mt-1">68% of goals completed on time</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="p-4 border border-green-900 border-opacity-20 rounded-md bg-green-900 bg-opacity-10">
                    <div className="flex items-start">
                      <div className="w-8 h-8 rounded-md bg-green-900 bg-opacity-30 mr-3 flex items-center justify-center">
                        <Clock className="h-4 w-4 text-green-400" />
                      </div>
                      <div>
                        <h4 className="text-sm font-medium text-green-100">Avg. Time to Complete</h4>
                        <p className="text-xs text-gray-400 mt-1">24 days on average per goal</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="p-4 border border-green-900 border-opacity-20 rounded-md bg-green-900 bg-opacity-10">
                    <div className="flex items-start">
                      <div className="w-8 h-8 rounded-md bg-green-900 bg-opacity-30 mr-3 flex items-center justify-center">
                        <Target className="h-4 w-4 text-green-400" />
                      </div>
                      <div>
                        <h4 className="text-sm font-medium text-green-100">Most Completed Category</h4>
                        <p className="text-xs text-gray-400 mt-1">Finance goals have highest completion</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="p-4 border border-green-900 border-opacity-20 rounded-md bg-green-900 bg-opacity-10">
                    <div className="flex items-start">
                      <div className="w-8 h-8 rounded-md bg-green-900 bg-opacity-30 mr-3 flex items-center justify-center">
                        <ArrowUp className="h-4 w-4 text-green-400" />
                      </div>
                      <div>
                        <h4 className="text-sm font-medium text-green-100">Improvement Trend</h4>
                        <p className="text-xs text-gray-400 mt-1">15% increase in completion rate this month</p>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        {/* Activity Tab */}
        <TabsContent value="activity" className="pt-6">
          <Card className="card border border-amber-900 border-opacity-30">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg font-semibold text-gray-100">Activity Heat Map</CardTitle>
              <CardDescription className="text-gray-400">Your goal activity pattern</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-7 gap-2 mt-4">
                {Array.from({ length: 28 }).map((_, i) => {
                  // Generate random activity levels for demo
                  const activityLevel = Math.floor(Math.random() * 4); // 0-3
                  let bgColorClass = '';
                  
                  if (activityLevel === 0) bgColorClass = 'bg-gray-800';
                  else if (activityLevel === 1) bgColorClass = 'bg-amber-900';
                  else if (activityLevel === 2) bgColorClass = 'bg-amber-700';
                  else bgColorClass = 'bg-amber-500';
                  
                  // Get day name (Sun, Mon, etc.)
                  const dayIndex = i % 7;
                  const days = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
                  const showDay = i < 7;
                  
                  return (
                    <div key={i} className="flex flex-col items-center">
                      {showDay && (
                        <div className="text-xs text-gray-500 mb-1">{days[dayIndex]}</div>
                      )}
                      <div 
                        className={`w-full h-8 rounded ${bgColorClass} hover:opacity-80 transition-opacity`}
                        title={`Activity Level: ${activityLevel}`}
                      />
                    </div>
                  );
                })}
              </div>
              
              <div className="flex items-center justify-end mt-4 space-x-2">
                <span className="text-xs text-gray-400">Less</span>
                <div className="w-4 h-4 bg-gray-800 rounded"></div>
                <div className="w-4 h-4 bg-amber-900 rounded"></div>
                <div className="w-4 h-4 bg-amber-700 rounded"></div>
                <div className="w-4 h-4 bg-amber-500 rounded"></div>
                <span className="text-xs text-gray-400">More</span>
              </div>
            </CardContent>
          </Card>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mt-5">
            <Card className="card border border-amber-900 border-opacity-30">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg font-semibold text-gray-100">Daily Activity Pattern</CardTitle>
                <CardDescription className="text-gray-400">When you're most active</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[250px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={[
                        {hour: 'Morning', activity: 30},
                        {hour: 'Afternoon', activity: 20},
                        {hour: 'Evening', activity: 40},
                        {hour: 'Night', activity: 10},
                      ]}
                      margin={{top: 20, right: 30, left: 20, bottom: 5}}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                      <XAxis dataKey="hour" stroke="#94a3b8" />
                      <YAxis stroke="#94a3b8" />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: '#0f172a', 
                          borderColor: '#334155',
                          color: '#e2e8f0'
                        }}
                        itemStyle={{ color: '#e2e8f0' }}
                        labelStyle={{ color: '#e2e8f0' }}
                      />
                      <Bar dataKey="activity" name="Activity %" fill="#f59e0b" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
            
            <Card className="card border border-amber-900 border-opacity-30">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg font-semibold text-gray-100">Weekly Activity Pattern</CardTitle>
                <CardDescription className="text-gray-400">Your most active days</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[250px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={[
                        {day: 'Sun', activity: 15},
                        {day: 'Mon', activity: 25},
                        {day: 'Tue', activity: 30},
                        {day: 'Wed', activity: 45},
                        {day: 'Thu', activity: 35},
                        {day: 'Fri', activity: 20},
                        {day: 'Sat', activity: 10},
                      ]}
                      margin={{top: 20, right: 30, left: 20, bottom: 5}}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                      <XAxis dataKey="day" stroke="#94a3b8" />
                      <YAxis stroke="#94a3b8" />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: '#0f172a', 
                          borderColor: '#334155',
                          color: '#e2e8f0'
                        }}
                        itemStyle={{ color: '#e2e8f0' }}
                        labelStyle={{ color: '#e2e8f0' }}
                      />
                      <Bar dataKey="activity" name="Activity %" fill="#f59e0b" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Analytics;