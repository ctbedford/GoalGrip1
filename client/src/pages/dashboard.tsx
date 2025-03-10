import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Flag, CheckCircle, Award, LightbulbIcon, AlertTriangle, Trophy } from "lucide-react";
import { StatsCard } from "@/components/dashboard/stats-card";
import { GoalCard } from "@/components/dashboard/goal-card";
import { ActionItemCard } from "@/components/dashboard/action-item";
import { InsightCard, InsightsWidget } from "@/components/dashboard/insight-card";
import { CreateGoalModal } from "@/components/modals/create-goal-modal";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import type { GoalWithCategory, DashboardStats, ActionItem } from "@shared/schema";

const Dashboard: React.FC = () => {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  
  // Fetch dashboard stats
  const { data: stats, isLoading: isStatsLoading } = useQuery<DashboardStats>({
    queryKey: ['/api/dashboard/stats'],
  });
  
  // Fetch goals
  const { data: goals, isLoading: isGoalsLoading } = useQuery<GoalWithCategory[]>({
    queryKey: ['/api/goals'],
  });
  
  // Fetch action items
  const { data: actionItems, isLoading: isActionItemsLoading } = useQuery<(ActionItem & { goalDescription: string })[]>({
    queryKey: ['/api/action-items'],
  });
  
  return (
    <div>
      {/* Page Header */}
      <div className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-2xl font-bold heading-gradient">Dashboard</h2>
          <p className="text-gray-400">Track your progress and stay motivated</p>
        </div>
        
        <div className="mt-4 md:mt-0">
          <Button 
            onClick={() => setIsCreateModalOpen(true)}
            className="flex items-center bg-blue-900 hover:bg-blue-800 text-blue-100"
          >
            <Flag className="h-4 w-4 mr-1" />
            Create Goal
          </Button>
        </div>
      </div>
      
      {/* Stats Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {isStatsLoading ? (
          <>
            <Card>
              <CardContent className="p-4">
                <Skeleton className="h-12 w-full" />
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <Skeleton className="h-12 w-full" />
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <Skeleton className="h-12 w-full" />
              </CardContent>
            </Card>
          </>
        ) : (
          <>
            <StatsCard
              title="Active Goals"
              value={stats?.activeGoals || 0}
              icon={<Flag />}
              iconClass="text-primary-600"
              iconBgClass="bg-primary-50"
            />
            <StatsCard
              title="Completed Goals"
              value={stats?.completedGoals || 0}
              icon={<CheckCircle />}
              iconClass="text-green-500"
              iconBgClass="bg-green-50"
            />
            <StatsCard
              title="Points Earned"
              value={stats?.pointsEarned || 0}
              icon={<Award />}
              iconClass="text-amber-500"
              iconBgClass="bg-amber-50"
            />
          </>
        )}
      </div>
      
      {/* Goals Section */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-800">Active Goals</h3>
          <a href="/goals" className="text-primary-600 text-sm font-medium hover:underline">View All</a>
        </div>
        
        {isGoalsLoading ? (
          <>
            <Card className="mb-4">
              <CardContent className="p-4">
                <Skeleton className="h-32 w-full" />
              </CardContent>
            </Card>
            <Card className="mb-4">
              <CardContent className="p-4">
                <Skeleton className="h-32 w-full" />
              </CardContent>
            </Card>
          </>
        ) : goals && goals.length > 0 ? (
          // Show only active goals (not completed), and limit to 3
          goals
            .filter(goal => !goal.completed)
            .slice(0, 3)
            .map(goal => (
              <GoalCard key={goal.id} goal={goal} />
            ))
        ) : (
          <Card>
            <CardContent className="p-6 text-center">
              <p className="text-gray-500">No active goals yet. Create your first goal to get started!</p>
              <Button 
                className="mt-4"
                onClick={() => setIsCreateModalOpen(true)}
              >
                Create Goal
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
      
      {/* Action Items & Insights Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Action Items */}
        <Card className="card border shadow-lg">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-semibold heading-gradient">Today's Actions</CardTitle>
          </CardHeader>
          <CardContent>
            {isActionItemsLoading ? (
              <Skeleton className="h-32 w-full" />
            ) : actionItems && actionItems.length > 0 ? (
              <ul className="space-y-3">
                {actionItems.map(item => (
                  <ActionItemCard 
                    key={item.id} 
                    item={item}
                    icon={<Trophy className="h-5 w-5 text-blue-400" />}
                  />
                ))}
              </ul>
            ) : (
              <p className="text-center py-4 text-gray-400">No action items for today.</p>
            )}
          </CardContent>
        </Card>
        
        {/* Insights */}
        <InsightsWidget>
          {goals && goals.length > 0 ? (
            <>
              {goals.some(goal => goal.currentValue / goal.targetValue >= 0.7) && (
                <InsightCard
                  type="info"
                  title={`You're making great progress!`}
                  description="You're 70% or more toward one of your goals!"
                  icon={<LightbulbIcon className="h-5 w-5" />}
                />
              )}
              
              {goals.some(goal => 
                goal.deadline < new Date(new Date().getTime() + 7 * 24 * 60 * 60 * 1000) && 
                !goal.completed
              ) && (
                <InsightCard
                  type="warning"
                  title="Deadlines approaching"
                  description="Some of your goals have deadlines within the next week."
                  icon={<AlertTriangle className="h-5 w-5" />}
                />
              )}
              
              {goals.some(goal => goal.completed) && (
                <InsightCard
                  type="success"
                  title="You've completed goals!"
                  description="Congratulations on your achievements."
                  icon={<Trophy className="h-5 w-5" />}
                />
              )}
            </>
          ) : (
            <p className="text-center py-4 text-gray-500">
              Create goals to see personalized insights.
            </p>
          )}
        </InsightsWidget>
      </div>
      
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

export default Dashboard;
