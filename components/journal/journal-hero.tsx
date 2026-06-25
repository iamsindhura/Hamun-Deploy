"use client";

import { cn } from "@/lib/utils";
import { Sparkles, Activity, Flame, Quote } from "lucide-react";

export function JournalHero({ journal }: { journal: any }) {
  if (!journal) return null;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {/* Date & Sticker */}
      <div className="p-6 rounded-2xl bg-card border border-border flex flex-col justify-center items-start shadow-sm hover:shadow-md transition-shadow">
        <div className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-2">
          {new Date(journal.date).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
        </div>
        <div className="text-2xl font-bold text-foreground">
          {journal.sticker}
        </div>
      </div>

      {/* Productivity Score & Streak */}
      <div className="flex gap-4">
        <div className="flex-1 p-6 rounded-2xl bg-card border border-border flex flex-col justify-center items-center text-center shadow-sm hover:shadow-md transition-shadow">
          <Activity className="h-6 w-6 text-purple-500 mb-2" />
          <div className="text-2xl font-bold text-foreground">{journal.productivityScore}</div>
          <div className="text-xs text-muted-foreground font-medium uppercase tracking-wider mt-1">Productivity</div>
        </div>
        
        <div className="flex-1 p-6 rounded-2xl bg-card border border-border flex flex-col justify-center items-center text-center shadow-sm hover:shadow-md transition-shadow">
          <Flame className="h-6 w-6 text-orange-500 mb-2" />
          <div className="text-2xl font-bold text-foreground">{journal.focusStreak} <span className="text-sm font-normal text-muted-foreground">days</span></div>
          <div className="text-xs text-muted-foreground font-medium uppercase tracking-wider mt-1">Focus Streak</div>
        </div>
      </div>

      {/* Quote */}
      <div className="md:col-span-2 p-6 rounded-2xl bg-gradient-to-r from-purple-500/10 via-background to-background border border-border shadow-sm flex items-start gap-4">
        <Quote className="h-6 w-6 text-purple-500 shrink-0" />
        <div className="flex flex-col">
          <span className="text-lg font-medium italic text-foreground leading-snug">
            "{journal.quote}"
          </span>
          <span className="text-sm text-muted-foreground mt-2 font-medium">
            — Daily Reflection
          </span>
        </div>
      </div>
    </div>
  );
}
