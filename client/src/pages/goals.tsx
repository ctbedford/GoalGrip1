import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { GoalCard } from "@/components/dashboard/goal-card";
import { CreateGoalModal } from "@/components/modals/create-goal-modal";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { 
  Flag, 
  Search, 
  Plus, 
  Filter, 
  Calendar, 
  BarChart2, 
  Trophy, 
  CheckCircle, 
  Award,
  FilterX,
  SlidersHorizontal,
  LayoutGrid,
  List
} from "lucide-react";
import type { GoalWithCategory, Goal } from "@shared/schema";

const Goals: React.FC = () => {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<string>("active");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [searchQuery, setSearchQuery] = useState("");
  
  // Fetch goals
  const { data: goals, isLoading } = useQuery<GoalWithCategory[]>({
    queryKey: ['/api/goals'],
  });
  
  // Filter goals based on active tab and search query
  const filteredGoals = goals 
    ? goals.filter(goal => {
        // First filter by active/completed status
        const statusMatch = activeTab === "active" ? !goal.completed : goal.completed;
        
        // Then filter by search query if there is one
        if (searchQuery.trim() === "") return statusMatch;
        
        return statusMatch && goal.description.toLowerCase().includes(searchQuery.toLowerCase());
      })
    : [];
  
  return (
    <div>
      {/* Enhanced Page Header */}
      <div className="mb-8 rounded-lg overflow-hidden relative">
        <div className="bg-gradient-to-r from-gray-900 via-blue-900 to-gray-900 p-6 border border-gray-800">
          <div className="relative z-10 max-w-3xl">
            <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-100 to-gray-100 bg-clip-text text-transparent mb-2">
              Your Goal Journey
            </h2>
            <p className="text-gray-300 mb-6">Plan, track, and celebrate your achievements</p>
            
            <div className="flex flex-col sm:flex-row gap-3">
              <Button 
                onClick={() => setIsCreateModalOpen(true)}
                className="btn-primary flex items-center justify-center group"
              >
                <Plus className="h-4 w-4 mr-2 group-hover:animate-pulse" />
                Create New Goal
              </Button>
              <Button 
                variant="outline" 
                className="border border-blue-700 text-blue-100 bg-transparent hover:bg-blue-900 hover:bg-opacity-30 flex items-center"
              >
                <Trophy className="h-4 w-4 mr-2" />
                View Achievements
              </Button>
            </div>
          </div>
          
          {/* Decorative Elements */}
          <div className="absolute top-0 right-0 w-1/2 h-full pointer-events-none opacity-20">
            <div className="absolute top-6 right-8 w-24 h-24 rounded-full bg-blue-500 blur-3xl"></div>
            <div className="absolute bottom-8 right-16 w-32 h-32 rounded-full bg-blue-400 blur-3xl"></div>
          </div>
        </div>
        
        {/* Glow Effect */}
        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-blue-500 to-transparent"></div>
      </div>
      
      {/* Search and Filter Bar */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center space-y-3 sm:space-y-0 sm:space-x-3">
        <div className="relative flex-grow">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-4 w-4 text-gray-400" />
          </div>
          <Input
            type="text"
            placeholder="Search goals..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-gray-900 border-gray-800 text-gray-200"
          />
        </div>
        
        <div className="flex space-x-2">
          <Button variant="outline" size="icon" className="border-gray-800 text-gray-400 hover:text-gray-200 hover:bg-gray-800">
            <Filter className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon" className="border-gray-800 text-gray-400 hover:text-gray-200 hover:bg-gray-800">
            <SlidersHorizontal className="h-4 w-4" />
          </Button>
          <div className="bg-gray-900 border border-gray-800 rounded-md flex p-1">
            <Button 
              variant={viewMode === "grid" ? "default" : "ghost"} 
              size="icon" 
              className={`h-8 w-8 ${viewMode === "grid" ? "bg-gray-800" : "hover:bg-gray-800"}`}
              onClick={() => setViewMode("grid")}
            >
              <LayoutGrid className="h-4 w-4" />
            </Button>
            <Button 
              variant={viewMode === "list" ? "default" : "ghost"} 
              size="icon" 
              className={`h-8 w-8 ${viewMode === "list" ? "bg-gray-800" : "hover:bg-gray-800"}`}
              onClick={() => setViewMode("list")}
            >
              <List className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
      
      {/* Enhanced Tabs */}
      <Tabs defaultValue="active" onValueChange={setActiveTab} className="mb-8">
        <TabsList className="border border-gray-800 bg-gray-900 p-1">
          <TabsTrigger 
            value="active" 
            className="data-[state=active]:bg-blue-900 data-[state=active]:text-gray-100 data-[state=active]:shadow-none"
          >
            <Flag className="h-4 w-4 mr-2 text-blue-400" />
            Active Goals
          </TabsTrigger>
          <TabsTrigger 
            value="completed" 
            className="data-[state=active]:bg-green-900 data-[state=active]:text-gray-100 data-[state=active]:shadow-none"
          >
            <CheckCircle className="h-4 w-4 mr-2 text-green-400" />
            Completed Goals
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="active" className="pt-6">
          {isLoading ? (
            <div className={viewMode === "grid" ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5" : "space-y-4"}>
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <Card key={i} className="border border-gray-800 bg-black bg-opacity-50">
                  <CardContent className="p-6">
                    <Skeleton className="h-32 w-full" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : filteredGoals.length > 0 ? (
            <div className={viewMode === "grid" ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5" : "space-y-4"}>
              {filteredGoals.map(goal => (
                <GoalCard key={goal.id} goal={goal} />
              ))}
            </div>
          ) : (
            <Card className="card border border-blue-900 border-opacity-50">
              <CardContent className="p-8 text-center">
                {searchQuery ? (
                  <>
                    <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-blue-900 bg-opacity-20 flex items-center justify-center border border-blue-800">
                      <Search className="h-8 w-8 text-blue-400 opacity-70" />
                    </div>
                    <h3 className="text-xl font-semibold text-gray-100 mb-2">No Matching Goals</h3>
                    <p className="text-gray-400 mb-6 max-w-md mx-auto">
                      We couldn't find any active goals matching "{searchQuery}"
                    </p>
                    <div className="flex justify-center gap-3">
                      <Button 
                        variant="outline" 
                        className="border-blue-800 text-blue-100"
                        onClick={() => setSearchQuery("")}
                      >
                        <FilterX className="h-4 w-4 mr-2" />
                        Clear Filter
                      </Button>
                      <Button 
                        className="btn-primary"
                        onClick={() => setIsCreateModalOpen(true)}
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Create Goal
                      </Button>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-blue-900 bg-opacity-20 flex items-center justify-center border border-blue-800">
                      <Flag className="h-8 w-8 text-blue-400 opacity-70" />
                    </div>
                    <h3 className="text-xl font-semibold text-gray-100 mb-2">No Active Goals</h3>
                    <p className="text-gray-400 mb-6 max-w-md mx-auto">
                      Set your first goal to start tracking progress and achieving your ambitions.
                    </p>
                    <Button 
                      className="btn-primary px-6"
                      onClick={() => setIsCreateModalOpen(true)}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Create Your First Goal
                    </Button>
                  </>
                )}
              </CardContent>
            </Card>
          )}
        </TabsContent>
        
        <TabsContent value="completed" className="pt-6">
          {isLoading ? (
            <div className={viewMode === "grid" ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5" : "space-y-4"}>
              {[1, 2, 3].map((i) => (
                <Card key={i} className="border border-gray-800 bg-black bg-opacity-50">
                  <CardContent className="p-6">
                    <Skeleton className="h-32 w-full" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : filteredGoals.length > 0 ? (
            <div className={viewMode === "grid" ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5" : "space-y-4"}>
              {filteredGoals.map(goal => (
                <GoalCard key={goal.id} goal={goal} />
              ))}
            </div>
          ) : (
            <Card className="card border border-green-900 border-opacity-50">
              <CardContent className="p-8 text-center">
                {searchQuery ? (
                  <>
                    <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-green-900 bg-opacity-20 flex items-center justify-center border border-green-800">
                      <Search className="h-8 w-8 text-green-400 opacity-70" />
                    </div>
                    <h3 className="text-xl font-semibold text-gray-100 mb-2">No Matching Goals</h3>
                    <p className="text-gray-400 mb-6 max-w-md mx-auto">
                      We couldn't find any completed goals matching "{searchQuery}"
                    </p>
                    <Button 
                      variant="outline" 
                      className="border-green-800 text-green-100"
                      onClick={() => setSearchQuery("")}
                    >
                      <FilterX className="h-4 w-4 mr-2" />
                      Clear Filter
                    </Button>
                  </>
                ) : (
                  <>
                    <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-green-900 bg-opacity-20 flex items-center justify-center border border-green-800">
                      <Trophy className="h-8 w-8 text-green-400 opacity-70" />
                    </div>
                    <h3 className="text-xl font-semibold text-gray-100 mb-2">No Completed Goals Yet</h3>
                    <p className="text-gray-400 mb-6 max-w-md mx-auto">
                      As you achieve your goals, they will appear here to celebrate your successes.
                    </p>
                    <Button 
                      variant="outline" 
                      className="border-green-800 text-green-100"
                      onClick={() => setActiveTab("active")}
                    >
                      <Flag className="h-4 w-4 mr-2" />
                      View Active Goals
                    </Button>
                  </>
                )}
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
      
      {/* Create Goal Modal */}
      {isCreateModalOpen && (
        <CreateGoalModal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
        />
      )}
    </div>
  );
};

export default Goals;
