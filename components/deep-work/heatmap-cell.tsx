"use client";

import React, { useState } from "react";
import { cn } from "@/lib/utils";

interface HeatmapCellProps {
  date: Date;
  totalMs: number;
  sessionCount: number;
  productivityScore: string;
  isFuture: boolean;
  isToday: boolean;
  onClick: () => void;
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

function getColorClass(totalMs: number) {
  if (totalMs <= 0) return "bg-gradient-to-b from-slate-600 to-slate-800 shadow-[inset_0_1px_1px_rgba(255,255,255,0.2)]";
  const hours = totalMs / (1000 * 60 * 60);
  if (hours >= 4) return "bg-gradient-to-b from-[#FCD34D] to-[#D97706] shadow-[0_0_10px_rgba(217,119,6,0.6),inset_0_1px_1px_rgba(255,255,255,0.4)]";
  if (hours >= 2) return "bg-gradient-to-b from-[#FDE68A] to-[#F59E0B] shadow-[inset_0_1px_1px_rgba(255,255,255,0.4)]";
  if (hours >= 1) return "bg-gradient-to-b from-[#FEF3C7] to-[#FCD34D] shadow-[inset_0_1px_1px_rgba(255,255,255,0.5)]";
  if (hours >= 0.5) return "bg-gradient-to-b from-slate-200 to-[#FDE68A] shadow-[inset_0_1px_1px_rgba(255,255,255,0.5)]";
  return "bg-gradient-to-b from-slate-400 to-slate-500 shadow-[inset_0_1px_1px_rgba(255,255,255,0.3)]";
}

export function HeatmapCell({
  date,
  totalMs,
  sessionCount,
  productivityScore,
  isFuture,
  isToday,
  onClick,
}: HeatmapCellProps) {
  const [showTooltip, setShowTooltip] = useState(false);

  const displayDate = date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  
  if (isFuture) {
    return (
      <div 
        className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg bg-muted/50 cursor-not-allowed flex items-center justify-center relative group"
      >
        <div className="w-4 h-4 sm:w-5 sm:h-5 rounded-full bg-border/40" />
        {/* Future Tooltip */}
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-max px-3 py-1.5 bg-popover text-popover-foreground text-xs rounded-md shadow-lg border border-border opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
          No data yet
        </div>
      </div>
    );
  }

  const hasData = totalMs > 0;

  return (
    <div 
      className="relative w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center group"
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
    >
      <button
        onClick={() => hasData && onClick()}
        className={cn(
          "w-4 h-4 sm:w-5 sm:h-5 rounded-full transition-all duration-300",
          getColorClass(totalMs),
          hasData ? "hover:scale-125 cursor-pointer" : "cursor-default",
          isToday && "ring-2 ring-[#F59E0B] ring-offset-2 ring-offset-card animate-pulse scale-110"
        )}
      />

      {/* Custom Tooltip */}
      {showTooltip && (
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 bg-popover text-popover-foreground rounded-xl shadow-xl border border-border p-3 z-50 pointer-events-none animate-in fade-in zoom-in-95 duration-200">
          <div className="font-bold text-sm mb-2 border-b border-border pb-1">
            {displayDate}
          </div>
          <div className="space-y-1 text-xs">
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Focus Time</span>
              <span className="font-bold">{formatDuration(totalMs)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Sessions</span>
              <span className="font-bold">{sessionCount}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Productivity</span>
              <span className="font-bold">{productivityScore}</span>
            </div>
          </div>
          {/* Tooltip Arrow */}
          <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-popover border-b border-r border-border rotate-45" />
        </div>
      )}
    </div>
  );
}
