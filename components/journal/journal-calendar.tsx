"use client";

import { useState, useEffect } from "react";
import { format, subMonths, addMonths, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isToday, isFuture, startOfWeek, endOfWeek, isSameDay } from "date-fns";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface JournalCalendarProps {
  selectedDate: Date | null;
  onDateSelect?: (date: Date) => void;
  // Array of dates that have journal entries
  journalDates?: Date[];
}

export function JournalCalendar({ selectedDate, onDateSelect, journalDates = [] }: JournalCalendarProps) {
  const [currentDate, setCurrentDate] = useState(selectedDate || new Date());

  // Update current month view if selectedDate changes externally
  useEffect(() => {
    if (selectedDate && !isSameMonth(currentDate, selectedDate)) {
      setCurrentDate(selectedDate);
    }
  }, [selectedDate]);

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const startDate = startOfWeek(monthStart);
  const endDate = endOfWeek(monthEnd);

  const dateFormat = "MMMM yyyy";
  const daysInCalendar = eachDayOfInterval({ start: startDate, end: endDate });

  const nextMonth = () => setCurrentDate(addMonths(currentDate, 1));
  const prevMonth = () => setCurrentDate(subMonths(currentDate, 1));

  const hasJournalEntry = (day: Date) => {
    return journalDates.some(journalDate => isSameDay(journalDate, day));
  };

  const onDateClick = (day: Date) => {
    if (hasJournalEntry(day)) {
      if (onDateSelect) {
        onDateSelect(day);
      }
    }
  };

  return (
    <div className="bg-white rounded-xl border border-transparent shadow-[0_2px_12px_rgba(0,0,0,0.04)] p-2 w-full max-w-[200px] mx-auto md:mx-0">
      
      {/* Calendar Header */}
      <div className="flex justify-between items-center mb-2 px-1">
        <button 
          onClick={prevMonth}
          className="hover:bg-gray-50 rounded p-1 transition-colors text-[#4B5563]"
        >
          <ChevronLeft className="w-3.5 h-3.5" />
        </button>
        <span className="font-bold text-[12px] tracking-wide text-[#111827]">
          {format(currentDate, dateFormat)}
        </span>
        <button 
          onClick={nextMonth}
          className="hover:bg-gray-50 rounded p-1 transition-colors text-[#4B5563]"
        >
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Week Days Header */}
      <div className="grid grid-cols-7 gap-1 mb-2">
        {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((day) => (
          <div key={day} className="text-center text-[9px] font-medium text-[#9CA3AF]">
            {day}
          </div>
        ))}
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-y-1 gap-x-1 place-items-center">
        {daysInCalendar.map((day, idx) => {
          const isSelected = selectedDate ? isSameDay(day, selectedDate) : false;
          const isCurrentMonth = isSameMonth(day, monthStart);
          const isDayToday = isToday(day);
          const isDayFuture = isFuture(day) && !isDayToday;
          const hasJournal = hasJournalEntry(day);

          return (
            <div key={idx} className="relative flex flex-col items-center justify-center w-6 h-7">
              <button
                disabled={isDayFuture || (!hasJournal && !isDayToday)} 
                onClick={() => onDateClick(day)}
                className={cn(
                  "w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-semibold transition-all duration-200",
                  isSelected 
                    ? "bg-[#7A5AF8] text-white shadow-md hover:bg-[#6b4ce6]" 
                    : isDayToday 
                      ? "border border-[#7A5AF8] text-[#7A5AF8] shadow-[0_0_8px_rgba(122,90,248,0.2)] hover:bg-[#7A5AF8]/5"
                      : !isCurrentMonth 
                        ? "text-[#E5E7EB]" 
                        : "text-[#4B5563] hover:bg-gray-100",
                  (isDayFuture || (!hasJournal && !isDayToday)) ? "cursor-not-allowed opacity-40 hover:bg-transparent" : "cursor-pointer" 
                )}
              >
                <span>{format(day, "d")}</span>
              </button>
            </div>
          );
        })}
      </div>

    </div>
  );
}
