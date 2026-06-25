"use client";

import { CheckCircle2, TrendingUp, Users, FolderKanban, Clock } from "lucide-react";

export function JournalInsights({ journal }: { journal: any }) {
  if (!journal || !journal.insights) return null;

  const { insights } = journal;

  const items = [
    { label: "Best Project", value: insights.bestProject || "General", icon: FolderKanban, color: "text-blue-500" },
    { label: "Peak Focus Time", value: insights.peakFocusTime || "None", icon: Clock, color: "text-orange-500" },
    { label: "Completion Rate", value: insights.completionRate || "Medium", icon: CheckCircle2, color: "text-emerald-500" },
    { label: "Relationship Growth", value: insights.relationshipGrowth || "Steady", icon: Users, color: "text-purple-500" },
    { label: "Most Improved Metric", value: insights.mostImprovedMetric || "Consistency", icon: TrendingUp, color: "text-rose-500" }
  ];

  return (
    <div className="rounded-2xl bg-card border border-border shadow-sm overflow-hidden">
      <div className="p-4 border-b border-border bg-muted/30">
        <span className="font-bold text-sm tracking-wide uppercase text-foreground">Insights</span>
      </div>
      <div className="p-4 flex flex-col gap-4">
        {items.map((item, idx) => {
          const Icon = item.icon;
          return (
            <div key={idx} className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-muted border border-border">
                  <Icon className={`h-4 w-4 ${item.color}`} />
                </div>
                <span className="text-sm font-medium text-muted-foreground">{item.label}</span>
              </div>
              <span className="text-sm font-bold text-foreground text-right">{item.value}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
