"use client";

import React, { useState, useEffect } from "react";
import { format } from "date-fns";
import { Sparkles, Edit2, ChevronDown, Camera, Lightbulb, Target, Heart, HeartHandshake } from "lucide-react";
import { cn } from "@/lib/utils";
import { generateJournal, getJournal, saveJournal } from "@/app/actions/journal";
import Image from "next/image";
import { TiptapEditor } from "@/components/journal/editor/TiptapEditor";
import { parseJournalContent } from "@/lib/tiptap-utils";
import { toast } from "sonner";

interface JournalNotebookProps {
  date: Date;
  emotion: string;
  setEmotion: (emotion: string) => void;
  editMode: boolean;
  setEditMode: (mode: boolean) => void;
  editorSticker: string | null;
  setEditorSticker: (sticker: string | null) => void;
}

const MOODS = [
  { emoji: "😊", label: "Amazing", value: "Amazing" },
  { emoji: "🙂", label: "Good", value: "Good" },
  { emoji: "😐", label: "Okay", value: "Okay" },
  { emoji: "😔", label: "Tired", value: "Tired" },
  { emoji: "😢", label: "Bad", value: "Bad" }
];

export function JournalNotebook({ date, emotion, setEmotion, editMode, setEditMode, editorSticker, setEditorSticker }: JournalNotebookProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [journalData, setJournalData] = useState<any>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [content, setContent] = useState<any>(null);

  // Load existing journal on date change
  useEffect(() => {
    async function loadJournal() {
      setIsLoading(true);
      try {
        const existing = await getJournal(date);
        if (existing) {
          setJournalData(existing);
          setContent(parseJournalContent(existing.content || existing.originalText));
        } else {
          setJournalData(null);
          setContent(null);
          setEditMode(false);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    }
    loadJournal();
  }, [date]);

  const handleRegenerate = async () => {
    setIsLoading(true);
    try {
      const response = await generateJournal(emotion);
      if (response.success && response.journal) {
        setJournalData(response.journal);
        setContent(parseJournalContent(response.journal.content || response.journal.originalText));
      } else {
        alert(response.error || "Failed to generate journal");
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    if (!journalData) return;
    try {
      setIsSaving(true);
      const res = await saveJournal(journalData.date, content, {
        quote: journalData.quote,
        sticker: journalData.sticker,
        tags: journalData.tags,
        productivityScore: journalData.productivityScore,
        focusStreak: journalData.focusStreak,
        insights: journalData.insights
      });
      if (res.success && res.journal) {
        setJournalData(res.journal);
        setEditMode(false);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsSaving(false);
    }
  };

  // Safe getters for complex nested data
  const originalText = journalData?.originalText || "";
  const insights = journalData?.insights || {};
  const quote = journalData?.quote || "Not every day needs to be a sprint; sometimes, the quiet days are just as crucial for recharging and realigning.";
  const title = insights?.title || "A Day of Reflection";
  
  // Extract images from tipTap content
  const extractImages = (content: any) => {
    if (!content || !content.content) return [];
    return content.content
      .filter((node: any) => node.type === 'image')
      .map((node: any) => node.attrs.src);
  };
  
  const images = extractImages(journalData?.content);

  return (
    <div className="flex-1 max-w-[1000px] w-full mx-auto px-4 md:px-8 py-8 md:py-12 relative h-full overflow-y-auto">
      
      {/* Paper Container */}
      <div className="relative w-full bg-[#FDFBF7] rounded-[24px] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-[#E5E7EB]/50 p-8 md:p-14 min-h-[800px] font-serif text-[#374151]">
        
        {/* Sticky Note */}
        <div className="absolute top-8 right-8 w-64 bg-[#F3E8FF] rounded-sm p-5 shadow-md transform rotate-2 z-10 font-sans">
          {/* Push pin */}
          <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-4 h-4 rounded-full bg-[#D4AF37] shadow-sm flex items-center justify-center">
            <div className="w-1.5 h-1.5 rounded-full bg-white/40" />
          </div>
          <p className="text-[13px] leading-relaxed text-[#581C87] font-medium italic">
            "{quote}"
          </p>
          <div className="flex justify-end mt-2">
            <Heart className="w-4 h-4 text-[#A855F7]" />
          </div>
        </div>

        {/* Date Header */}
        <div className="text-[11px] font-bold tracking-[0.2em] text-[#9CA3AF] uppercase mb-4 font-sans">
          {format(date, "EEEE, MMMM do, yyyy")}
        </div>

        {/* Title */}
        <div className="relative inline-block mb-10">
          <h1 className="text-4xl md:text-5xl font-medium tracking-tight text-[#111827] italic">
            {title}
          </h1>
          <div className="absolute -bottom-2 left-0 w-[110%] h-2 bg-[#E9D5FF] -rotate-1 -z-10 rounded-full opacity-60" />
        </div>

        {/* Toolbar */}
        <div className="flex flex-wrap items-center gap-3 mb-12 font-sans">
          <div className="flex items-center gap-2 bg-white border border-[#E5E7EB] rounded-full px-4 py-2 text-sm text-[#4B5563] shadow-sm">
            <span className="text-xs text-muted-foreground font-medium">Today's Emotion:</span>
            <select 
              value={emotion}
              onChange={(e) => setEmotion(e.target.value)}
              className="bg-transparent border-none focus:ring-0 cursor-pointer p-0 text-foreground font-semibold flex items-center gap-1.5 outline-none appearance-none pr-4"
              disabled={editMode}
            >
              <option value={emotion}>😌 {emotion}</option>
              {MOODS.map(m => (
                <option key={m.value} value={m.label}>{m.emoji} {m.label}</option>
              ))}
            </select>
          </div>

          {editMode ? (
            <>
              <button 
                onClick={() => setEditMode(false)}
                className="flex items-center gap-2 bg-white border border-[#E5E7EB] hover:bg-gray-50 rounded-full px-5 py-2 text-sm font-medium text-[#4B5563] shadow-sm transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={handleSave}
                disabled={isSaving}
                className="flex items-center gap-2 bg-[#15803D] hover:bg-[#166534] rounded-full px-5 py-2 text-sm font-medium text-white shadow-sm transition-colors"
              >
                {isSaving ? "Saving..." : "Save Changes"}
              </button>
            </>
          ) : (
            <button 
              onClick={() => setEditMode(true)}
              disabled={!journalData}
              className="flex items-center gap-2 bg-white border border-[#E5E7EB] hover:bg-gray-50 rounded-full px-5 py-2 text-sm font-medium text-[#4B5563] shadow-sm transition-colors disabled:opacity-50"
            >
              <Edit2 className="w-4 h-4" /> Edit
            </button>
          )}

          {!editMode && (

          <button 
            onClick={handleRegenerate}
            disabled={isLoading}
            className="flex items-center gap-2 bg-[#7A5AF8] hover:bg-[#6346E0] rounded-full px-5 py-2 text-sm font-medium text-white shadow-sm transition-colors ml-auto md:ml-2"
          >
            {isLoading ? (
              <span className="flex items-center gap-2"><div className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin"/> Generating...</span>
            ) : (
              <><Sparkles className="w-4 h-4" /> Regenerate</>
            )}
          </button>
          )}
        </div>

        {/* Journal Content */}
        <div className="relative">
          {/* Decorative Flowers */}
          <div className="absolute -left-12 top-0 text-[#FCA5A5] opacity-80 text-3xl hidden md:block z-0 pointer-events-none">🌸</div>
          <div className="absolute -right-8 bottom-10 text-[#86EFAC] opacity-80 text-4xl hidden md:block z-0 pointer-events-none">🌿</div>

          {!journalData && !isLoading && !editMode && (
            <div className="py-20 text-center text-muted-foreground italic z-10 relative">
              No journal entry found for this date. Click Regenerate to write one using AI.
            </div>
          )}

          {(journalData || editMode) && (
            <div className="relative z-10 w-full min-h-[300px]">
              <TiptapEditor 
                initialContent={content} 
                onUpdate={(json) => setContent(json)}
                editable={editMode}
                editorSticker={editorSticker}
                onStickerInserted={() => setEditorSticker(null)}
              />
            </div>
          )}
        </div>

        {/* Moments & Vibes Gallery */}
        {images.length > 0 && (
          <div className="mt-16 font-sans">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2 text-[#4B5563] font-bold text-sm">
                <Camera className="w-4 h-4" /> Moments & Vibes
              </div>
              <button className="text-[#7A5AF8] text-xs font-bold hover:underline">View all</button>
            </div>
            <div className="flex gap-4 overflow-x-auto pb-4 snap-x">
              {images.map((img: string, i: number) => (
                <div key={i} className="relative w-48 h-32 shrink-0 rounded-xl overflow-hidden shadow-sm snap-start">
                  <Image src={img} alt="Moment" fill className="object-cover" />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Insights Section */}
        {journalData && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-12 font-sans">
            <div className="bg-[#F3E8FF] rounded-2xl p-6 relative overflow-hidden">
              <div className="flex items-center gap-2 text-[#6B21A8] font-bold text-xs mb-3">
                <Lightbulb className="w-4 h-4" /> Daily Insight
              </div>
              <p className="text-[13px] text-[#4C1D95] font-medium leading-relaxed">
                {insights.dailyInsight || "Peace comes when I choose presence over pressure."}
              </p>
              <div className="absolute -bottom-4 -right-4 text-4xl opacity-20">🌿</div>
            </div>

            <div className="bg-[#FEF3C7] rounded-2xl p-6 relative overflow-hidden">
              <div className="flex items-center gap-2 text-[#B45309] font-bold text-xs mb-3">
                <Target className="w-4 h-4" /> Tomorrow's Intention
              </div>
              <p className="text-[13px] text-[#92400E] font-medium leading-relaxed">
                {insights.tomorrowIntention || "Focus on depth over distraction. Protect my morning."}
              </p>
              <div className="absolute -bottom-2 -right-2 text-3xl opacity-20">✨</div>
            </div>

            <div className="bg-[#DCFCE7] rounded-2xl p-6 relative overflow-hidden">
              <div className="flex items-center gap-2 text-[#15803D] font-bold text-xs mb-3">
                <HeartHandshake className="w-4 h-4" /> Gratitude
              </div>
              <p className="text-[13px] text-[#166534] font-medium leading-relaxed">
                {insights.gratitude || "Grateful for the people around me and the clarity that comes with stillness."}
              </p>
              <div className="absolute -bottom-4 -right-2 text-4xl opacity-20">🌿</div>
            </div>
          </div>
        )}

        {/* Bottom Favorite Quote */}
        {journalData && (
          <div className="mt-6 bg-[#FAF5FF] rounded-2xl p-6 flex justify-between items-center relative overflow-hidden font-sans border border-[#F3E8FF]">
            <div>
              <div className="flex items-center gap-2 text-[#7A5AF8] font-bold text-xs mb-2">
                <Heart className="w-4 h-4 fill-current" /> Favorite Quote
              </div>
              <p className="text-lg font-serif italic text-[#4B5563]">
                "Sometimes the most productive thing you can do is relax."
              </p>
              <p className="text-[10px] text-muted-foreground uppercase tracking-widest mt-2">— Mark Black</p>
            </div>
            <div className="hidden md:block opacity-80 text-6xl mr-4">☕</div>
          </div>
        )}

      </div>
    </div>
  );
}
