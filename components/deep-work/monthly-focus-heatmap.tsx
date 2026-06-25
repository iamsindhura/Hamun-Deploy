"use client";

import React, { useState, useMemo } from "react";
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from "lucide-react";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isToday, isFuture, subMonths, addMonths, startOfWeek, endOfWeek } from "date-fns";
import { HeatmapCell } from "./heatmap-cell";
import { HeatmapLegend } from "./heatmap-legend";
import { DaySummaryModal } from "./day-summary-modal";

interface MonthlyFocusHeatmapProps {
  focusSessions: any[];
}

export function MonthlyFocusHeatmap({ focusSessions }: MonthlyFocusHeatmapProps) {
  const [currentMonthDate, setCurrentMonthDate] = useState(new Date());
  const [selectedDayData, setSelectedDayData] = useState<{ date: Date, totalMs: number, sessions: any[] } | null>(null);

  const monthStart = startOfMonth(currentMonthDate);
  const monthEnd = endOfMonth(currentMonthDate);
  const calendarStart = startOfWeek(monthStart);
  const calendarEnd = endOfWeek(monthEnd);

  const daysInCalendar = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

  // Pre-process sessions into a map by date string for O(1) lookup
  const sessionMap = useMemo(() => {
    const map = new Map<string, { totalMs: number, sessions: any[] }>();
    
    focusSessions.forEach(session => {
      if (!session.startTime) return;
      const dateStr = format(new Date(session.startTime), "yyyy-MM-dd");
      
      const durationMs = session.endTime 
        ? new Date(session.endTime).getTime() - new Date(session.startTime).getTime() 
        : 0;

      if (!map.has(dateStr)) {
        map.set(dateStr, { totalMs: 0, sessions: [] });
      }
      
      const dayData = map.get(dateStr)!;
      dayData.totalMs += durationMs;
      dayData.sessions.push({ ...session, durationMs });
    });
    return map;
  }, [focusSessions]);

  const handlePrevMonth = () => setCurrentMonthDate(subMonths(currentMonthDate, 1));
  const handleNextMonth = () => setCurrentMonthDate(addMonths(currentMonthDate, 1));

  return (
    <div className="bg-card rounded-2xl border border-border p-6 sm:p-8 shadow-sm hover:border-[#8B5CF6]/30 transition-colors">
      
      {/* Header and Navigation */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-8">
        <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2.5">
          <CalendarIcon className="w-4 h-4 text-[#8B5CF6]" /> Focus Heatmap
        </h2>
        
        <div className="flex items-center gap-4 bg-muted/50 rounded-full px-2 py-1 border border-border">
          <button 
            onClick={handlePrevMonth}
            className="p-1.5 hover:bg-background rounded-full transition-colors text-muted-foreground hover:text-foreground"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="font-bold text-sm w-28 text-center text-foreground">
            {format(currentMonthDate, "MMMM yyyy")}
          </span>
          <button 
            onClick={handleNextMonth}
            className="p-1.5 hover:bg-background rounded-full transition-colors text-muted-foreground hover:text-foreground"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="max-w-xl mx-auto">
        <div className="grid grid-cols-7 gap-2 mb-2">
          {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(day => (
            <div key={day} className="text-center text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              {day}
            </div>
          ))}
        </div>
        
        <div className="grid grid-cols-7 gap-2 place-items-center">
          {daysInCalendar.map((date, idx) => {
            const isCurrentMonth = isSameMonth(date, currentMonthDate);
            const dateStr = format(date, "yyyy-MM-dd");
            const dayData = sessionMap.get(dateStr) || { totalMs: 0, sessions: [] };
            const isDayFuture = isFuture(date) && !isToday(date);
            const isDayToday = isToday(date);
            
            // If it's not the current month, we render a placeholder to keep the grid aligned
            if (!isCurrentMonth) {
              return <div key={`empty-${idx}`} className="w-10 h-10 sm:w-12 sm:h-12" />;
            }

            // Derive productivity based on duration
            let productivity = "Low";
            const hours = dayData.totalMs / (1000 * 60 * 60);
            if (hours >= 4) productivity = "Exceptional";
            else if (hours >= 2) productivity = "Excellent";
            else if (hours >= 1) productivity = "Good";
            else if (hours > 0) productivity = "Light";

            return (
              <HeatmapCell
                key={dateStr}
                date={date}
                totalMs={dayData.totalMs}
                sessionCount={dayData.sessions.length}
                productivityScore={productivity}
                isFuture={isDayFuture}
                isToday={isDayToday}
                onClick={() => setSelectedDayData({ date, ...dayData })}
              />
            );
          })}
        </div>
      </div>

      {/* Legend */}
      <HeatmapLegend />

      {/* Modal */}
      <DaySummaryModal 
        isOpen={selectedDayData !== null}
        onClose={() => setSelectedDayData(null)}
        date={selectedDayData?.date || null}
        dayData={selectedDayData}
      />
    </div>
  );
}
