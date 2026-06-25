"use client";

import { History } from "lucide-react";

export function JournalTimeline({ history }: { history: any[] }) {
  if (!history || history.length === 0) return null;

  return (
    <div className="rounded-2xl bg-card border border-border shadow-sm overflow-hidden flex flex-col h-[400px]">
      <div className="p-4 border-b border-border bg-muted/30 shrink-0">
        <span className="font-bold text-sm tracking-wide uppercase text-foreground">Previous Journals</span>
      </div>
      <div className="p-4 flex flex-col gap-4 overflow-y-auto flex-1">
        {history.map((entry, idx) => (
          <div key={idx} className="flex gap-4 relative">
            {/* Timeline Line */}
            {idx !== history.length - 1 && (
              <div className="absolute left-[11px] top-6 bottom-[-16px] w-[2px] bg-border" />
            )}
            
            <div className="shrink-0 mt-1 relative z-10">
              <div className="w-6 h-6 rounded-full bg-muted border-2 border-background flex items-center justify-center">
                <div className="w-2 h-2 rounded-full bg-purple-500" />
              </div>
            </div>
            
            <div className="flex flex-col flex-1 pb-4">
              <span className="text-sm font-bold text-foreground">
                {new Date(entry.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
              </span>
              <span className="text-xs text-muted-foreground mt-0.5 font-medium line-clamp-1">{entry.sticker}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
