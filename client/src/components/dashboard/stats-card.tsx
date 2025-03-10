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
  iconClass = "text-blue-400",
  iconBgClass = "bg-blue-900",
}) => {
  return (
    <Card className="stats-card border border-gray-800 shadow-lg hover:shadow-xl transition-all">
      <CardContent className="p-4">
        <div className="flex items-center">
          <div className={cn("rounded-full p-2", iconBgClass)}>
            <div className={cn("h-5 w-5", iconClass)}>{icon}</div>
          </div>
          <div className="ml-3">
            <p className="text-sm font-medium text-gray-400">{title}</p>
            <p className="text-xl font-semibold heading-gradient">{value}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
