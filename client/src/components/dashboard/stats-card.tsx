import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface StatsCardProps {
  title: string;
  value: number | string;
  icon: React.ReactNode;
  iconClass?: string;
  iconBgClass?: string;
}

export const StatsCard: React.FC<StatsCardProps> = ({
  title,
  value,
  icon,
  iconClass = "text-primary-600",
  iconBgClass = "bg-primary-50",
}) => {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center">
          <div className={cn("rounded-full p-2", iconBgClass)}>
            <div className={cn("h-5 w-5", iconClass)}>{icon}</div>
          </div>
          <div className="ml-3">
            <p className="text-sm font-medium text-gray-500">{title}</p>
            <p className="text-xl font-semibold">{value}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
