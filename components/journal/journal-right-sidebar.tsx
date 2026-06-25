import React from "react";
import { Paperclip, Image as ImageIcon, Mic, FileText, Smile } from "lucide-react";

interface JournalRightSidebarProps {
  emotion: string;
  onStickerClick: (sticker: string) => void;
}

const stickers = ["🌸", "🌿", "☕", "✨", "📚", "🚀", "💻", "🌅", "💡", "🎯", "❤️", "🔥", "💪", "🧘", "🎵", "🎨"];

export function JournalRightSidebar({ emotion, onStickerClick }: JournalRightSidebarProps) {
  return (
    <div className="space-y-6 w-full">
      {/* Insights Card */}
      <div>
        <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">Insights</h3>
        <div className="bg-white rounded-2xl p-5 border border-[#E5E7EB] shadow-sm relative overflow-hidden">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 rounded-full bg-[#F3E8FF] flex items-center justify-center">
              <span className="text-[#7A5AF8] text-sm">✨</span>
            </div>
            <div>
              <p className="text-xs font-bold text-[#1A1A1A]">AI Analysis</p>
              <p className="text-[10px] text-muted-foreground">Coming in Phase 2</p>
            </div>
          </div>
          <p className="text-xs text-[#4B5563] leading-relaxed">
            Your CRM activities and Deep Work focus data will be analyzed here to surface hidden patterns in your productivity.
          </p>
        </div>
      </div>

      {/* Today's Mood */}
      <div>
        <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">Today's Mood</h3>
        <div className="bg-gradient-to-br from-[#FEFCE8] to-[#FEF3C7] rounded-2xl p-6 border border-[#FDE047]/30 shadow-sm flex flex-col items-center text-center">
          <div className="text-5xl mb-3">{emotion.split(" ")[0] || "😊"}</div>
          <h4 className="font-bold text-[#854D0E] mb-1">{emotion.replace(/^[^\w\s]+/, '').trim() || "Good"}</h4>
          <p className="text-xs text-[#A16207]">
            Feeling {emotion.replace(/^[^\w\s]+/, '').trim().toLowerCase()} and ready for whatever the day brings.
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

      {/* Attachments */}
      <div>
        <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1.5">
          <Paperclip className="w-3.5 h-3.5" /> Attachments
        </h3>
        <div className="bg-white rounded-2xl p-5 border border-[#E5E7EB] shadow-sm">
          <div className="grid grid-cols-3 gap-2 mb-4">
            <button className="flex flex-col items-center justify-center gap-1.5 py-3 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors border border-dashed border-gray-200">
              <ImageIcon className="w-4 h-4 text-muted-foreground" />
              <span className="text-[9px] font-medium text-muted-foreground uppercase tracking-wider">Image</span>
            </button>
            <button className="flex flex-col items-center justify-center gap-1.5 py-3 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors border border-dashed border-gray-200">
              <FileText className="w-4 h-4 text-muted-foreground" />
              <span className="text-[9px] font-medium text-muted-foreground uppercase tracking-wider">PDF</span>
            </button>
            <button className="flex flex-col items-center justify-center gap-1.5 py-3 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors border border-dashed border-gray-200">
              <Mic className="w-4 h-4 text-muted-foreground" />
              <span className="text-[9px] font-medium text-muted-foreground uppercase tracking-wider">Voice</span>
            </button>
          </div>
          <div className="text-center">
            <p className="text-xs text-muted-foreground italic">No attachments yet.</p>
          </div>
        </div>
      </div>

    </div>
  );
}
