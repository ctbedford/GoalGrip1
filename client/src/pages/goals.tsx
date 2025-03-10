import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { GoalCard } from "@/components/dashboard/goal-card";
import { CreateGoalModal } from "@/components/modals/create-goal-modal";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Flag } from "lucide-react";
import type { GoalWithCategory, Goal } from "@shared/schema";

const Goals: React.FC = () => {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<string>("active");
  
  // Fetch goals
  const { data: goals, isLoading } = useQuery<GoalWithCategory[]>({
    queryKey: ['/api/goals'],
  });
  
  // Filter goals based on active tab
  const filteredGoals = goals ? goals.filter(goal => 
    activeTab === "active" ? !goal.completed : goal.completed
  ) : [];
  
  return (
    <div>
      {/* Page Header */}
      <div className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">My Goals</h2>
          <p className="text-gray-600">Manage and track all your goals</p>
        </div>
        
        <div className="mt-4 md:mt-0">
          <Button 
            onClick={() => setIsCreateModalOpen(true)}
            className="flex items-center"
          >
            <Flag className="h-4 w-4 mr-1" />
            Create Goal
          </Button>
        </div>
      </div>
      
      {/* Tabs */}
      <Tabs defaultValue="active" onValueChange={setActiveTab} className="mb-6">
        <TabsList>
          <TabsTrigger value="active">Active Goals</TabsTrigger>
          <TabsTrigger value="completed">Completed Goals</TabsTrigger>
        </TabsList>
        
        <TabsContent value="active" className="pt-4">
          {isLoading ? (
            <div className="space-y-4">
              <Skeleton className="h-32 w-full" />
              <Skeleton className="h-32 w-full" />
            </div>
          ) : filteredGoals.length > 0 ? (
            filteredGoals.map(goal => (
              <GoalCard key={goal.id} goal={goal} />
            ))
          ) : (
            <Card>
              <CardContent className="p-6 text-center">
                <p className="text-gray-500">
                  {activeTab === "active" 
                    ? "No active goals yet. Create your first goal to get started!" 
                    : "You don't have any completed goals yet."}
                </p>
                {activeTab === "active" && (
                  <Button 
                    className="mt-4"
                    onClick={() => setIsCreateModalOpen(true)}
                  >
                    Create Goal
                  </Button>
                )}
              </CardContent>
            </Card>
          )}
        </TabsContent>
        
        <TabsContent value="completed" className="pt-4">
          {isLoading ? (
            <div className="space-y-4">
              <Skeleton className="h-32 w-full" />
              <Skeleton className="h-32 w-full" />
            </div>
          ) : filteredGoals.length > 0 ? (
            filteredGoals.map(goal => (
              <GoalCard key={goal.id} goal={goal} />
            ))
          ) : (
            <Card>
              <CardContent className="p-6 text-center">
                <p className="text-gray-500">You don't have any completed goals yet.</p>
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
