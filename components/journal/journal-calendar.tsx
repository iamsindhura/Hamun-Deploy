"use client";

import React, { useState } from "react";
import { format, subMonths, addMonths, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isToday, isFuture, startOfWeek, endOfWeek, isSameDay } from "date-fns";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface JournalCalendarProps {
  onDateSelect?: (date: Date) => void;
  // Mock array of dates that have journal entries
  journalDates?: Date[];
}

export function JournalCalendar({ onDateSelect, journalDates = [] }: JournalCalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const startDate = startOfWeek(monthStart);
  const endDate = endOfWeek(monthEnd);

  const dateFormat = "MMMM yyyy";
  const daysInCalendar = eachDayOfInterval({ start: startDate, end: endDate });

  const nextMonth = () => setCurrentDate(addMonths(currentDate, 1));
  const prevMonth = () => setCurrentDate(subMonths(currentDate, 1));

  const onDateClick = (day: Date) => {
    setSelectedDate(day);
    if (onDateSelect) {
      onDateSelect(day);
    }
  };

  const hasJournalEntry = (day: Date) => {
    return journalDates.some(journalDate => isSameDay(journalDate, day));
  };

  return (
    <div className="bg-white rounded-2xl border border-transparent shadow-[0_2px_12px_rgba(0,0,0,0.04)] p-4 w-full max-w-[280px] mx-auto md:mx-0">
      
      {/* Calendar Header */}
      <div className="flex justify-between items-center mb-6 px-2">
        <button 
          onClick={prevMonth}
          className="hover:bg-gray-50 rounded p-1 transition-colors text-[#4B5563]"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        <span className="font-bold text-[15px] tracking-wide text-[#111827]">
          {format(currentDate, dateFormat)}
        </span>
        <button 
          onClick={nextMonth}
          className="hover:bg-gray-50 rounded p-1 transition-colors text-[#4B5563]"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* Week Days Header */}
      <div className="grid grid-cols-7 gap-1 mb-4">
        {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((day) => (
          <div key={day} className="text-center text-[12px] font-medium text-[#9CA3AF]">
            {day}
          </div>
        ))}
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-y-3 gap-x-1 place-items-center">
        {daysInCalendar.map((day, idx) => {
          const isSelected = isSameDay(day, selectedDate);
          const isCurrentMonth = isSameMonth(day, monthStart);
          const isDayToday = isToday(day);
          const isDayFuture = isFuture(day) && !isDayToday;
          const hasJournal = hasJournalEntry(day);

          return (
            <div key={idx} className="relative flex flex-col items-center justify-center w-9 h-10">
              <button
                disabled={isDayFuture}
                onClick={() => onDateClick(day)}
                className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center text-[13px] font-bold transition-all duration-200",
                  !isCurrentMonth ? "text-[#D1D5DB] hover:bg-gray-50" : "text-[#111827] hover:bg-[#F3F4F6]",
                  isSelected ? "bg-[#6366F1] text-white hover:bg-[#4F46E5] shadow-sm" : "",
                  isDayFuture ? "cursor-not-allowed opacity-50" : ""
                )}
              >
                <span>{format(day, "d")}</span>
              </button>
              
              {/* Journal Indicator Dot */}
              {hasJournal && (
                <div className="absolute bottom-0 w-1 h-1 rounded-full bg-[#8B5CF6]" />
              )}
            </div>
          );
        })}
      </div>

    </div>
  );
}
