import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type InsightType = "info" | "warning" | "success";

interface InsightCardProps {
  type: InsightType;
  title: string;
  description: string;
  icon: React.ReactNode;
}

export const InsightCard: React.FC<InsightCardProps> = ({
  type,
  title,
  description,
  icon,
}) => {
  const getBackgroundClass = (type: InsightType) => {
    switch (type) {
      case "info":
        return "bg-blue-50";
      case "warning":
        return "bg-amber-50";
      case "success":
        return "bg-green-50";
    }
  };

  const getIconClass = (type: InsightType) => {
    switch (type) {
      case "info":
        return "text-blue-500";
      case "warning":
        return "text-amber-500";
      case "success":
        return "text-green-500";
    }
  };

  return (
    <div className={cn("p-3 rounded-lg mb-4", getBackgroundClass(type))}>
      <div className="flex">
        <div className={cn("mr-3", getIconClass(type))}>
          {icon}
        </div>
        <div>
          <p className="text-sm font-medium text-gray-800">{title}</p>
          <p className="text-xs text-gray-600 mt-1">{description}</p>
        </div>
      </div>
    </div>
  );
};

export const InsightsWidget: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-semibold text-gray-800">Insights</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {children}
      </CardContent>
    </Card>
  );
};
