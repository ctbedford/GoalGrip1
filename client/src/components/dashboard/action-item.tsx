import React, { useState } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import { cn } from "@/lib/utils";
import type { ActionItem } from "@shared/schema";

interface ActionItemProps {
  item: ActionItem & { goalDescription: string };
  icon: React.ReactNode;
}

export const ActionItemCard: React.FC<ActionItemProps> = ({ item, icon }) => {
  const [isChecked, setIsChecked] = useState(item.completed);
  const [isUpdating, setIsUpdating] = useState(false);
  const { toast } = useToast();

  const handleToggle = async (checked: boolean) => {
    setIsUpdating(true);
    try {
      setIsChecked(checked);
      await apiRequest('PATCH', `/api/action-items/${item.id}`, { completed: checked });
      
      // Invalidate queries that might have changed
      queryClient.invalidateQueries({ queryKey: ['/api/action-items'] });
      
      if (checked) {
        toast({
          title: "Task Completed",
          description: "Great job on completing this task!",
        });
      }
    } catch (error) {
      // Revert the UI state if the API call fails
      setIsChecked(!checked);
      toast({
        title: "Error",
        description: "Failed to update action item. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <li className="flex items-center p-2 hover:bg-gray-50 rounded-lg">
      <Checkbox
        checked={isChecked}
        disabled={isUpdating}
        onCheckedChange={handleToggle}
        className="h-4 w-4 text-primary-600 rounded border-gray-300 mr-3"
      />
      <div className="flex-1">
        <p 
          className={cn(
            "text-sm font-medium text-gray-800",
            isChecked && "line-through"
          )}
        >
          {item.description}
        </p>
        <p className="text-xs text-gray-500">{item.goalDescription}</p>
      </div>
      <div className="text-success-500">
        {icon}
      </div>
    </li>
  );
};
