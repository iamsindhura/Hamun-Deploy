"use client";

import React, { useState, useEffect } from "react";
import { JournalCalendar } from "@/components/journal/journal-calendar";
import { JournalNotebook } from "@/components/journal/journal-notebook";
import { JournalRightSidebar } from "@/components/journal/journal-right-sidebar";
import { Plus, Search, Command } from "lucide-react";
import { getJournalHistory } from "@/app/actions/journal";
import { format } from "date-fns";

export function JournalPageClient() {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedEmotion, setSelectedEmotion] = useState("Calm & Focused");
  const [editMode, setEditMode] = useState(false);
  const [journalHistory, setJournalHistory] = useState<any[]>([]);
  const [editorSticker, setEditorSticker] = useState<string | null>(null);

  // Fetch history for timeline
  useEffect(() => {
    async function loadHistory() {
      try {
        const history = await getJournalHistory();
        setJournalHistory(history);
      } catch (err) {
        console.error("Failed to load history", err);
      }
    }
    loadHistory();
  }, []);

  const mockJournalDates = journalHistory.map(j => new Date(j.date));

  return (
    <div className="flex h-[calc(100vh-64px)] w-full bg-background overflow-hidden">
      
      {/* Left Sidebar */}
      <aside className="w-[320px] shrink-0 border-r border-border bg-[#FCFAF6] h-full overflow-y-auto px-5 pt-6 pb-8 space-y-6 flex flex-col hidden lg:flex">
        
        <div className="flex items-center justify-between">
          <h2 className="text-[13px] font-black tracking-wide text-[#1A1A1A]">MY JOURNALS</h2>
          <button className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-[#E5E7EB] rounded-full text-[12px] font-medium text-[#4B5563] shadow-sm hover:bg-gray-50 transition-colors">
            <Plus className="w-3.5 h-3.5 text-[#9CA3AF]" />
            New
          </button>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9CA3AF]" />
          <input 
            type="text" 
            placeholder="Search journals..." 
            className="w-full pl-9 pr-12 py-2.5 bg-white border border-[#E5E7EB] rounded-2xl text-[13px] text-[#1A1A1A] placeholder-[#9CA3AF] shadow-sm focus:outline-none focus:ring-2 focus:ring-[#7A5AF8]/20 focus:border-[#7A5AF8] transition-all"
          />
          <div className="absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center gap-1 px-1.5 py-0.5 bg-[#F9FAFB] border border-[#E5E7EB] rounded text-[10px] font-medium text-[#6B7280]">
            <Command className="w-2.5 h-2.5" /> K
          </div>
        </div>

        <JournalCalendar journalDates={mockJournalDates} onDateSelect={setSelectedDate} />

        {/* Filters */}
        <div className="flex gap-2">
          <button className="px-3 py-1 text-xs font-medium bg-[#7A5AF8] text-white rounded-full">All</button>
          <button className="px-3 py-1 text-xs font-medium bg-white border border-border text-muted-foreground rounded-full hover:bg-gray-50 transition-colors">Favorites</button>
          <button className="px-3 py-1 text-xs font-medium bg-white border border-border text-muted-foreground rounded-full hover:bg-gray-50 transition-colors">Pinned</button>
        </div>

        {/* Timeline */}
        <div className="flex-1 overflow-y-auto space-y-3 pb-8">
          <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">Timeline</h3>
          {journalHistory.length === 0 ? (
            <p className="text-xs text-muted-foreground italic">No past journals found.</p>
          ) : (
            journalHistory.map((j) => (
              <div 
                key={j.id} 
                onClick={() => setSelectedDate(new Date(j.date))}
                className={`p-3 rounded-xl border cursor-pointer transition-all ${
                  new Date(j.date).toDateString() === selectedDate.toDateString() 
                    ? 'border-[#7A5AF8] bg-white shadow-sm ring-1 ring-[#7A5AF8]/10' 
                    : 'border-transparent bg-white/50 hover:bg-white hover:shadow-sm'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[11px] font-semibold text-muted-foreground">
                    {format(new Date(j.date), "MMM d, yyyy")}
                  </span>
                  <span className="text-sm">{j.sticker || "📓"}</span>
                </div>
                <h4 className="font-serif font-medium text-[#111827] text-sm line-clamp-1 mb-1">
                  {j.insights?.title || "Journal Entry"}
                </h4>
                <p className="text-xs text-muted-foreground line-clamp-2">
                  {j.originalText?.replace(/<[^>]*>?/gm, '') || "No preview available..."}
                </p>
              </div>
            ))
          )}
        </div>
      </aside>

      {/* Center Content (Journal Notebook) */}
      <main className="flex-1 flex flex-col items-center justify-start bg-muted/10 overflow-y-auto w-full relative">
        <JournalNotebook 
          date={selectedDate} 
          emotion={selectedEmotion}
          setEmotion={setSelectedEmotion}
          editMode={editMode}
          setEditMode={setEditMode}
          editorSticker={editorSticker}
          setEditorSticker={setEditorSticker}
        />
      </main>

      {/* Right Sidebar */}
      <aside className="w-[320px] shrink-0 border-l border-border bg-[#FCFAF6] h-full overflow-y-auto px-5 pt-6 pb-8 space-y-6 flex flex-col hidden xl:flex">
        <JournalRightSidebar 
          emotion={selectedEmotion}
          onStickerClick={(sticker) => setEditorSticker(sticker)}
        />
      </aside>

    </div>
  );
}
