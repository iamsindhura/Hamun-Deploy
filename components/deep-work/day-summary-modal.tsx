"use client";

import React from "react";
import { format } from "date-fns";
import { X, Clock, Zap, Target, BookOpen, Smile } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface DaySummaryModalProps {
  isOpen: boolean;
  onClose: () => void;
  date: Date | null;
  dayData: {
    totalMs: number;
    sessions: any[];
  } | null;
}

function formatDuration(totalMs: number) {
  if (totalMs <= 0) return "0h 0m";
  const totalMinutes = Math.round(totalMs / (1000 * 60));
  const h = Math.floor(totalMinutes / 60);
  const m = Math.round(totalMinutes % 60);
  if (h > 0 && m > 0) return `${h}h ${m}m`;
  if (h > 0) return `${h}h`;
  return `${m}m`;
}

export function DaySummaryModal({ isOpen, onClose, date, dayData }: DaySummaryModalProps) {
  if (!date || !dayData) return null;

  const totalMs = dayData.totalMs;
  const sessions = dayData.sessions || [];
  const sessionCount = sessions.length;

  const longestSessionMs = sessions.reduce((max, s) => Math.max(max, s.durationMs || 0), 0);
  const averageSessionMs = sessionCount > 0 ? totalMs / sessionCount : 0;

  // Assuming we might attach tasks or journal insights later based on real data
  const completedTasks = sessions
    .filter(s => s.task)
    .map(s => s.task?.title)
    .filter((v, i, a) => a.indexOf(v) === i); // Unique tasks

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md bg-card text-card-foreground p-0 overflow-hidden border border-border">
        <div className="p-6 bg-gradient-to-br from-purple-500/10 to-transparent border-b border-border relative">
          <button 
            onClick={onClose}
            className="absolute top-4 right-4 p-2 bg-background/50 hover:bg-background rounded-full transition-colors"
          >
            <X className="w-4 h-4 text-muted-foreground" />
          </button>
          <p className="text-sm font-bold tracking-widest text-purple-500 uppercase mb-1">
            Day Summary
          </p>
          <DialogTitle className="text-3xl font-serif text-foreground">
            {format(date, "MMMM do, yyyy")}
          </DialogTitle>
        </div>

        <div className="p-6 space-y-6">
          
          {/* Quick Stats Grid */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-muted/50 p-4 rounded-xl border border-border flex items-center gap-3">
              <div className="bg-purple-100 dark:bg-purple-900/30 p-2 rounded-lg">
                <Clock className="w-5 h-5 text-purple-500" />
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold">Total Focus</p>
                <p className="text-lg font-bold">{formatDuration(totalMs)}</p>
              </div>
            </div>
            <div className="bg-muted/50 p-4 rounded-xl border border-border flex items-center gap-3">
              <div className="bg-blue-100 dark:bg-blue-900/30 p-2 rounded-lg">
                <Target className="w-5 h-5 text-blue-500" />
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold">Sessions</p>
                <p className="text-lg font-bold">{sessionCount}</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-muted-foreground font-medium mb-1">Longest Session</p>
              <p className="font-bold text-sm">{formatDuration(longestSessionMs)}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground font-medium mb-1">Average Session</p>
              <p className="font-bold text-sm">{formatDuration(averageSessionMs)}</p>
            </div>
          </div>

          {/* Tasks Addressed */}
          {completedTasks.length > 0 && (
            <div className="space-y-3 pt-4 border-t border-border">
              <h4 className="text-xs font-bold tracking-widest text-muted-foreground uppercase flex items-center gap-2">
                <Zap className="w-3.5 h-3.5" /> Tasks Addressed
              </h4>
              <ul className="space-y-2">
                {completedTasks.map((task, i) => (
                  <li key={i} className="text-sm font-medium flex items-start gap-2 before:content-['•'] before:text-purple-500">
                    {task}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Productivity & Mood */}
          <div className="space-y-3 pt-4 border-t border-border">
            <h4 className="text-xs font-bold tracking-widest text-muted-foreground uppercase flex items-center gap-2">
              <Smile className="w-3.5 h-3.5" /> Energy & Productivity
            </h4>
            <div className="bg-muted/30 rounded-xl p-4 border border-border flex justify-between items-center">
              <div>
                <p className="text-xs text-muted-foreground mb-1">Productivity Score</p>
                <p className="font-bold text-purple-500">Excellent</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-muted-foreground mb-1">Recorded Mood</p>
                <p className="text-2xl filter drop-shadow-sm">😌</p>
              </div>
            </div>
          </div>

        </div>
      </DialogContent>
    </Dialog>
  );
}
