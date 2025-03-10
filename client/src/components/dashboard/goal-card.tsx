import React, { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Edit, Trash2, PlusCircle, BarChart2 } from "lucide-react";
import { LogProgressModal } from "@/components/modals/log-progress-modal";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Goal, GoalWithCategory } from "@shared/schema";
import { queryClient } from "@/lib/queryClient";
import { format } from "date-fns";

interface GoalCardProps {
  goal: GoalWithCategory;
  onEdit?: (goal: Goal) => void;
}

export const GoalCard: React.FC<GoalCardProps> = ({ goal, onEdit }) => {
  const [isLoggingProgress, setIsLoggingProgress] = useState(false);
  const { toast } = useToast();
  
  const progressPercentage = goal.targetValue > 0 
    ? Math.min(Math.round((goal.currentValue / goal.targetValue) * 100), 100)
    : 0;
  
  const progressColor = 
    progressPercentage >= 66 ? 'bg-green-500' : 
    progressPercentage >= 33 ? 'bg-amber-500' : 
    'bg-primary-600';
  
  const handleDelete = async () => {
    if (window.confirm("Are you sure you want to delete this goal?")) {
      try {
        await apiRequest('DELETE', `/api/goals/${goal.id}`);
        toast({
          title: "Goal Deleted",
          description: "Your goal has been deleted successfully.",
        });
        queryClient.invalidateQueries({ queryKey: ['/api/goals'] });
        queryClient.invalidateQueries({ queryKey: ['/api/dashboard/stats'] });
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to delete the goal. Please try again.",
          variant: "destructive",
        });
      }
    }
  };
  
  return (
    <>
      <Card className="mb-4">
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-3">
            <div>
              <div className="flex items-center">
                {goal.category && (
                  <Badge 
                    className="mr-2" 
                    style={{ backgroundColor: goal.category.color }}
                  >
                    {goal.category.name}
                  </Badge>
                )}
                <h4 className="text-lg font-semibold text-gray-800">{goal.description}</h4>
              </div>
              <p className="text-sm text-gray-500 mt-1">
                Deadline: {format(new Date(goal.deadline), "MMMM d, yyyy")}
              </p>
            </div>
            <div className="mt-3 md:mt-0 flex">
              <Button
                variant="ghost" 
                size="icon"
                className="mr-2 hover:bg-gray-100" 
                onClick={() => onEdit && onEdit(goal)}
                title="Edit Goal"
              >
                <Edit className="h-5 w-5 text-gray-500" />
              </Button>
              <Button 
                variant="ghost" 
                size="icon"
                className="hover:bg-gray-100" 
                onClick={handleDelete}
                title="Delete Goal"
              >
                <Trash2 className="h-5 w-5 text-gray-500" />
              </Button>
            </div>
          </div>
          
          <div className="mb-3">
            <div className="flex justify-between mb-1">
              <span className="text-sm font-medium text-gray-700">
                Progress: {goal.currentValue.toFixed(1)} / {goal.targetValue} {goal.unit}
              </span>
              <span 
                className={`text-sm font-medium ${
                  progressPercentage >= 66 ? 'text-green-600' : 
                  progressPercentage >= 33 ? 'text-amber-600' : 
                  'text-primary-600'
                }`}
              >
                {progressPercentage}%
              </span>
            </div>
            <Progress value={progressPercentage} className="h-2" indicatorClassName={progressColor} />
          </div>
          
          <div className="flex flex-col md:flex-row space-y-2 md:space-y-0 md:space-x-3">
            <Button 
              variant="default" 
              className="md:flex-1 flex items-center justify-center"
              onClick={() => setIsLoggingProgress(true)}
            >
              <PlusCircle className="h-4 w-4 mr-1" />
              Log Progress
            </Button>
            
            <Button 
              variant="outline" 
              className="md:flex-1 flex items-center justify-center"
              onClick={() => {
                // View Details functionality would go here
                toast({
                  title: "Coming Soon",
                  description: "Detailed goal view is coming soon!",
                });
              }}
            >
              <BarChart2 className="h-4 w-4 mr-1" />
              View Details
            </Button>
          </div>
        </CardContent>
      </Card>
      
      {isLoggingProgress && (
        <LogProgressModal
          goal={goal}
          isOpen={isLoggingProgress}
          onClose={() => setIsLoggingProgress(false)}
        />
      )}
    </>
  );
};
