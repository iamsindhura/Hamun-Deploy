import React from "react";
import { Paperclip, Image as ImageIcon, Mic, FileText, Smile } from "lucide-react";
import { EMOTIONS } from "@/lib/emotions";

import { AiAnalysisCard } from "./ai-analysis-card";
import { JournalAttachments } from "./journal-attachments";

interface JournalRightSidebarProps {
  emotion: string;
  onStickerClick: (sticker: string) => void;
  activeJournal?: any;
  onRegenerateAnalysis?: () => void;
  isGeneratingAnalysis?: boolean;
  onAttachmentUploaded?: (attachment: any) => void;
  onEnsureJournal?: () => Promise<string | undefined>;
  onInsertAttachment?: (attachment: any) => void;
}

const stickers = ["🌸", "🌿", "☕", "✨", "📚", "🚀", "💻", "🌅", "💡", "🎯", "❤️", "🔥", "💪", "🧘", "🎵", "🎨"];

export function JournalRightSidebar({ emotion, onStickerClick, activeJournal, onRegenerateAnalysis, isGeneratingAnalysis, onAttachmentUploaded, onEnsureJournal, onInsertAttachment }: JournalRightSidebarProps) {
  // Extract label if it's in format "emoji Label", else try to match
  const matchedEmotion = EMOTIONS.find(e => 
    emotion.includes(e.label) || emotion.includes(e.emoji)
  ) || EMOTIONS.find(e => e.label === "Neutral");

  return (
    <div className="space-y-6 w-full">
      {/* Insights Card */}
      {activeJournal ? (
        <AiAnalysisCard 
          initialAnalysis={activeJournal.insights?.aiAnalysis} 
          onRegenerate={onRegenerateAnalysis}
          isGenerating={isGeneratingAnalysis}
        />
      ) : (
        <div className="bg-white rounded-2xl p-5 border border-[#E5E7EB] shadow-sm text-center">
          <p className="text-xs text-muted-foreground italic">Select a journal entry to view analysis.</p>
        </div>
      )}

      {/* Today's Mood */}
      <div>
        <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">Today's Mood</h3>
        <div className="bg-gradient-to-br from-[#FEFCE8] to-[#FEF3C7] rounded-2xl p-6 border border-[#FDE047]/30 shadow-sm flex flex-col items-center text-center">
          <div className="text-5xl mb-3">{matchedEmotion?.emoji}</div>
          <h4 className="font-bold text-[#854D0E] mb-1">{matchedEmotion?.label}</h4>
          <p className="text-xs text-[#A16207]">
            {matchedEmotion?.description}
          </p>
        </div>
      </div>

      {/* Stickers */}
      <div>
        <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1.5">
          <Smile className="w-3.5 h-3.5" /> Stickers
        </h3>
        <div className="bg-white rounded-2xl p-4 border border-[#E5E7EB] shadow-sm">
          <p className="text-[10px] text-muted-foreground mb-3 text-center">Click to insert into your journal</p>
          <div className="grid grid-cols-4 gap-2">
            {stickers.map((s, i) => (
              <button 
                key={i} 
                onClick={() => onStickerClick(s)}
                className="text-2xl hover:bg-gray-50 rounded-xl aspect-square flex items-center justify-center transition-transform hover:scale-110 active:scale-95"
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Attachments panel */}
      <JournalAttachments 
        journalId={activeJournal?.id} 
        initialAttachments={activeJournal?.attachments || []} 
        onUploadComplete={onAttachmentUploaded}
        onEnsureJournal={onEnsureJournal}
        onInsertAttachment={onInsertAttachment}
      />

    </div>
  );
}
