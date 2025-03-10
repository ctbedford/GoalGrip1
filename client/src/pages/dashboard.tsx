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
      {/* Enhanced Welcome Section */}
      <div className="mb-8 rounded-lg overflow-hidden relative">
        <div className="bg-gradient-to-r from-gray-900 via-blue-900 to-gray-900 p-6 border border-gray-800">
          <div className="relative z-10 max-w-3xl">
            <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-100 to-gray-100 bg-clip-text text-transparent mb-2">
              Welcome to GOAL:SYNC
            </h2>
            <p className="text-gray-300 mb-6">Track your progress, achieve your ambitions, and unlock your potential</p>
            
            <div className="flex flex-col sm:flex-row gap-3">
              <Button 
                onClick={() => setIsCreateModalOpen(true)}
                className="btn-primary flex items-center justify-center group"
              >
                <Flag className="h-4 w-4 mr-2 group-hover:animate-pulse" />
                Create New Goal
              </Button>
              <Button 
                variant="outline" 
                className="border border-blue-700 text-blue-100 bg-transparent hover:bg-blue-900 hover:bg-opacity-30"
              >
                View Progress Report
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
      
      {/* Stats Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {isStatsLoading ? (
          <>
            <Card className="border border-gray-800 bg-black bg-opacity-50">
              <CardContent className="p-6">
                <Skeleton className="h-20 w-full" />
              </CardContent>
            </Card>
            <Card className="border border-gray-800 bg-black bg-opacity-50">
              <CardContent className="p-6">
                <Skeleton className="h-20 w-full" />
              </CardContent>
            </Card>
            <Card className="border border-gray-800 bg-black bg-opacity-50">
              <CardContent className="p-6">
                <Skeleton className="h-20 w-full" />
              </CardContent>
            </Card>
          </>
        ) : (
          <>
            <div className="stats-card group hover:translate-y-[-5px] transition-all duration-300 p-6">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-blue-100 text-sm font-medium mb-1">ACTIVE GOALS</h3>
                  <div className="flex items-baseline">
                    <span className="text-3xl font-bold text-white mr-2">{stats?.activeGoals || 0}</span>
                    <span className="text-xs text-blue-300 uppercase font-mono">In Progress</span>
                  </div>
                  <p className="text-xs text-gray-400 mt-2">Goals currently being tracked</p>
                </div>
                <div className="w-12 h-12 rounded-md bg-blue-900 bg-opacity-40 flex items-center justify-center border border-blue-800 shadow-inner shadow-blue-900/10 group-hover:shadow-blue-500/20 transition-all">
                  <Flag className="h-6 w-6 text-blue-300" />
                </div>
              </div>
              <div className="mt-4 h-1 w-full bg-gray-800 rounded-full overflow-hidden">
                <div className="h-full bg-blue-600 rounded-full" style={{ width: `${stats?.activeGoals ? Math.min(stats.activeGoals * 10, 100) : 0}%` }}></div>
              </div>
            </div>
            
            <div className="stats-card group hover:translate-y-[-5px] transition-all duration-300 p-6">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-green-100 text-sm font-medium mb-1">COMPLETED GOALS</h3>
                  <div className="flex items-baseline">
                    <span className="text-3xl font-bold text-white mr-2">{stats?.completedGoals || 0}</span>
                    <span className="text-xs text-green-300 uppercase font-mono">Success</span>
                  </div>
                  <p className="text-xs text-gray-400 mt-2">Goals successfully achieved</p>
                </div>
                <div className="w-12 h-12 rounded-md bg-green-900 bg-opacity-40 flex items-center justify-center border border-green-800 shadow-inner shadow-green-900/10 group-hover:shadow-green-500/20 transition-all">
                  <CheckCircle className="h-6 w-6 text-green-300" />
                </div>
              </div>
              <div className="mt-4 h-1 w-full bg-gray-800 rounded-full overflow-hidden">
                <div className="h-full bg-green-600 rounded-full" style={{ width: `${stats?.completedGoals ? Math.min(stats.completedGoals * 10, 100) : 0}%` }}></div>
              </div>
            </div>
            
            <div className="stats-card group hover:translate-y-[-5px] transition-all duration-300 p-6">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-amber-100 text-sm font-medium mb-1">POINTS EARNED</h3>
                  <div className="flex items-baseline">
                    <span className="text-3xl font-bold text-white mr-2">{stats?.pointsEarned || 0}</span>
                    <span className="text-xs text-amber-300 uppercase font-mono">XP</span>
                  </div>
                  <p className="text-xs text-gray-400 mt-2">Progress toward next level</p>
                </div>
                <div className="w-12 h-12 rounded-md bg-amber-900 bg-opacity-40 flex items-center justify-center border border-amber-800 shadow-inner shadow-amber-900/10 group-hover:shadow-amber-500/20 transition-all">
                  <Award className="h-6 w-6 text-amber-300" />
                </div>
              </div>
              <div className="mt-4 h-1 w-full bg-gray-800 rounded-full overflow-hidden">
                <div className="h-full bg-amber-600 rounded-full" style={{ width: `${stats?.pointsEarned ? Math.min(stats.pointsEarned / 2, 100) : 0}%` }}></div>
              </div>
            </div>
          </>
        )}
      </div>
      
      {/* Goals Section */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center">
            <div className="w-1 h-6 bg-blue-600 rounded-full mr-3 shadow-glow"></div>
            <h3 className="text-lg font-semibold text-gray-100">ACTIVE GOALS</h3>
          </div>
          <a 
            href="/goals" 
            className="text-blue-400 text-sm font-medium hover:text-blue-300 transition-colors flex items-center"
          >
            View All
            <span className="ml-1 text-xs">→</span>
          </a>
        </div>
        
        {isGoalsLoading ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            <Card className="border border-gray-800 bg-black bg-opacity-50">
              <CardContent className="p-6">
                <Skeleton className="h-32 w-full" />
              </CardContent>
            </Card>
            <Card className="border border-gray-800 bg-black bg-opacity-50">
              <CardContent className="p-6">
                <Skeleton className="h-32 w-full" />
              </CardContent>
            </Card>
            <Card className="border border-gray-800 bg-black bg-opacity-50">
              <CardContent className="p-6">
                <Skeleton className="h-32 w-full" />
              </CardContent>
            </Card>
          </div>
        ) : goals && goals.length > 0 ? (
          // Show only active goals (not completed), and limit to 3
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            {goals
              .filter(goal => !goal.completed)
              .slice(0, 3)
              .map(goal => (
                <GoalCard key={goal.id} goal={goal} />
              ))}
          </div>
        ) : (
          <Card className="card border border-blue-900 border-opacity-50">
            <CardContent className="p-8 text-center">
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
                <Flag className="h-4 w-4 mr-2" />
                Create Your First Goal
              </Button>
            </CardContent>
          </Card>
        )}
        
        {/* Quick Goal Progress Update */}
        {goals && goals.length > 0 && (
          <div className="mt-6 p-4 border border-blue-900 border-opacity-30 bg-blue-900 bg-opacity-10 rounded-lg">
            <div className="flex items-center text-blue-100 mb-3">
              <h4 className="text-sm font-medium">QUICK UPDATE</h4>
              <div className="ml-2 px-2 py-0.5 bg-blue-900 bg-opacity-50 rounded text-xs font-mono">NEW</div>
            </div>
            <p className="text-sm text-gray-400 mb-3">
              Track progress on your most active goal without opening the details.
            </p>
            <div className="flex flex-wrap gap-3">
              <Button variant="outline" size="sm" className="border-blue-800 text-blue-300 hover:bg-blue-900 hover:bg-opacity-30">
                +5 Pages Read
              </Button>
              <Button variant="outline" size="sm" className="border-blue-800 text-blue-300 hover:bg-blue-900 hover:bg-opacity-30">
                +1 Hour Practiced
              </Button>
              <Button variant="outline" size="sm" className="border-blue-800 text-blue-300 hover:bg-blue-900 hover:bg-opacity-30">
                +10 Minutes Exercised
              </Button>
              <Button variant="outline" size="sm" className="border-blue-800 text-blue-300 hover:bg-blue-900 hover:bg-opacity-30">
                +1 Task Completed
              </Button>
            </div>
          </div>
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
