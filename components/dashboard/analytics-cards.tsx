"use client";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Users, IndianRupee, Target, TrendingUp } from "lucide-react";

interface AnalyticsCardsProps {
  stats: {
    totalContacts: number;
    pipelineValue: number;
    convertedValue: number;
    conversionRate: number;
    avgDealSize: number;
  };
}

export function AnalyticsCards({ stats }: AnalyticsCardsProps) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(value);
  };

  const items = [
    {
      title: "Total Contacts",
      value: stats.totalContacts.toString(),
      icon: Users,
      description: "People in your CRM",
      color: "text-blue-600",
    },
    {
      title: "Pipeline Value",
      value: formatCurrency(stats.pipelineValue),
      icon: IndianRupee,
      description: "Potential revenue",
      color: "text-purple-600",
    },
    {
      title: "Converted Value",
      value: formatCurrency(stats.convertedValue),
      icon: Target,
      description: "Closed deals",
      color: "text-green-600",
    },
    {
      title: "Avg Deal Size",
      value: formatCurrency(stats.avgDealSize),
      icon: Target, // Alternatively reuse another icon like IndianRupee or something else, but let's stick to simple ones.
      description: "Per deal value",
      color: "text-blue-600",
    },
    {
      title: "Conversion Rate",
      value: `${stats.conversionRate}%`,
      icon: TrendingUp,
      description: "Leads to Customers",
      color: "text-orange-600",
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
      {items.map((item) => (
        <Card key={item.title}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {item.title}
            </CardTitle>
            <item.icon className={`h-4 w-4 ${item.color}`} />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{item.value}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {item.description}
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
