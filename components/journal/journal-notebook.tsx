"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { format } from "date-fns";
import { Sparkles, Edit2, ChevronDown, Camera, Lightbulb, Target, Heart, HeartHandshake, Download, FileText, Check, Clock, Lock } from "lucide-react";
import { cn } from "@/lib/utils";
import { generateJournal, getJournal, saveJournal } from "@/app/actions/journal";
import Image from "next/image";
import { TiptapEditor } from "@/components/journal/editor/TiptapEditor";
import { parseJournalContent, extractTextFromTiptap } from "@/lib/tiptap-utils";
import { toast } from "sonner";
import { EMOTIONS } from "@/lib/emotions";
import { exportToPDF, generateMarkdown, generatePlainText } from "@/lib/export-utils";

interface JournalNotebookProps {
  selectedDate: Date;
  activeJournal: any;
  onUpdateJournal: (updates: any) => void;
  editMode: boolean;
  setEditMode: (mode: boolean) => void;
  editorSticker: string | null;
  setEditorSticker: (sticker: string | null) => void;
  onRegenerate: () => void;
  loadingPhase: string | null;
  editorRef?: any;
  isToday: boolean;
  isBeforeUnlock?: boolean;
  remainingTimeStr?: string;
  unlockPreference?: string;
  onAddMemories?: () => void;
  onFinalizeJournal?: () => void;
}

export function JournalNotebook({ selectedDate, activeJournal, onUpdateJournal, editMode, setEditMode, editorSticker, setEditorSticker, onRegenerate, loadingPhase, editorRef, isToday, isBeforeUnlock = false, remainingTimeStr = "", unlockPreference = "20:00", onAddMemories, onFinalizeJournal }: JournalNotebookProps) {
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved">("idle");
  const [isEmotionDropdownOpen, setIsEmotionDropdownOpen] = useState(false);
  const [isExportMenuOpen, setIsExportMenuOpen] = useState(false);
  const exportMenuRef = useRef<HTMLDivElement>(null);

  const formattedUnlockTime = useMemo(() => {
    const hours = parseInt(unlockPreference.split(":")[0], 10);
    const suffix = hours >= 12 ? "PM" : "AM";
    const formattedHours = hours % 12 || 12;
    return `${formattedHours}:00 ${suffix}`;
  }, [unlockPreference]);
  
  // Dragging state
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStart = useRef({ x: 0, y: 0, startPosX: 0, startPosY: 0 });
  const stickyRef = useRef<HTMLDivElement>(null);
  const paperRef = useRef<HTMLDivElement>(null);
  const latestPosition = useRef(position);

  // Helper state flags to determine flow stages
  const hasAiDraft = useMemo(() => {
    return !!(activeJournal && activeJournal.originalText !== "" && activeJournal.insights?.title !== "");
  }, [activeJournal]);

  const hasSavedMemories = useMemo(() => {
    return !!(activeJournal && activeJournal.personalMemories && activeJournal.personalMemories.length > 0);
  }, [activeJournal]);

  const isFinalized = useMemo(() => {
    return !!(activeJournal && activeJournal.isFinalized);
  }, [activeJournal]);

  useEffect(() => {
    latestPosition.current = position;
  }, [position]);

  const dropdownRef = useRef<HTMLDivElement>(null);
  const debouncedSaveRef = useRef<NodeJS.Timeout | null>(null);
  const titleInputRef = useRef<HTMLInputElement>(null);

  // Auto-focus logic when entering edit mode
  useEffect(() => {
    if (editMode) {
      setTimeout(() => {
        const titleVal = activeJournal?.insights?.title;
        if (!titleVal || titleVal === "A Day of Reflection") {
          titleInputRef.current?.focus();
        }
      }, 50);
    }
  }, [editMode, activeJournal]);

  // Handle click outside to close emotion dropdown and export dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsEmotionDropdownOpen(false);
      }
      if (exportMenuRef.current && !exportMenuRef.current.contains(event.target as Node)) {
        setIsExportMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Sync content when activeJournal changes (only if it's a different journal or content updated externally)
  const contentHash = activeJournal ? JSON.stringify(activeJournal.content || activeJournal.originalText) : null;
  
  const derivedContent = useMemo(() => {
    if (!activeJournal && !editMode) return null;
    return parseJournalContent(activeJournal?.content || activeJournal?.originalText);
  }, [activeJournal?.id, contentHash, editMode]);
  
  useEffect(() => {
    if (activeJournal) {
      if (activeJournal.insights?.stickyNotePosition) {
        setPosition(activeJournal.insights.stickyNotePosition);
      } else {
        setPosition({ x: 0, y: 0 });
      }
    } else {
      setEditMode(false);
      setPosition({ x: 0, y: 0 });
    }
  }, [activeJournal?.id]);

  const handleExport = (formatType: "pdf" | "markdown" | "txt") => {
    setIsExportMenuOpen(false);
    if (!activeJournal) return;

    try {
      if (formatType === "pdf") {
        exportToPDF(activeJournal);
        toast.success("PDF Export initialized successfully.");
      } else if (formatType === "markdown") {
        const mdContent = generateMarkdown(activeJournal);
        const blob = new Blob([mdContent], { type: "text/markdown;charset=utf-8" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        const formattedDate = format(new Date(activeJournal.date), "yyyy-MM-dd");
        link.href = url;
        link.download = `journal-${formattedDate}.md`;
        link.click();
        URL.revokeObjectURL(url);
        toast.success("Markdown exported successfully.");
      } else if (formatType === "txt") {
        const txtContent = generatePlainText(activeJournal);
        const blob = new Blob([txtContent], { type: "text/plain;charset=utf-8" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        const formattedDate = format(new Date(activeJournal.date), "yyyy-MM-dd");
        link.href = url;
        link.download = `journal-${formattedDate}.txt`;
        link.click();
        URL.revokeObjectURL(url);
        toast.success("Plain text exported successfully.");
      }
    } catch (err) {
      console.error("Export failed", err);
      toast.error("Failed to export journal.");
    }
  };

  const triggerAutoSave = (updatedFields: any, newContent: any) => {
    setSaveStatus("saving");
    
    // Optimistic update
    onUpdateJournal(updatedFields);

    if (debouncedSaveRef.current) clearTimeout(debouncedSaveRef.current);
    debouncedSaveRef.current = setTimeout(async () => {
      try {
        const fullJournal = { ...activeJournal, ...updatedFields };
        const safeContent = JSON.parse(JSON.stringify(newContent || fullJournal.content || {}));
        const safeMetadata = JSON.parse(JSON.stringify({
          quote: fullJournal.quote,
          sticker: fullJournal.sticker,
          tags: fullJournal.tags,
          productivityScore: fullJournal.productivityScore,
          focusStreak: fullJournal.focusStreak,
          insights: fullJournal.insights
        }));

        await saveJournal(new Date(fullJournal.date).toISOString(), safeContent, safeMetadata);
        setSaveStatus("saved");
        setTimeout(() => setSaveStatus("idle"), 2000);
      } catch (e) {
        console.error("Auto-save failed", e);
      }
    }, 1000);
  };

  const handleUpdate = (field: string, value: any) => {
    if (!activeJournal) return;
    
    let updates: any = {};
    if (field === 'title') {
      updates = { insights: { ...activeJournal.insights, title: value } };
    } else if (field === 'emotion') {
      updates = { sticker: value, insights: { ...activeJournal.insights, emotion: value } };
    } else if (field === 'quote') {
      updates = { quote: value };
    } else if (field === 'stickyNotePosition') {
      updates = { insights: { ...activeJournal.insights, stickyNotePosition: value } };
    }
    
    triggerAutoSave(updates, derivedContent);
  };

  // Safe getters for complex nested data
  const insights = activeJournal?.insights || {};
  const quote = activeJournal?.quote || "Not every day needs to be a sprint; sometimes, the quiet days are just as crucial for recharging and realigning.";
  const title = insights?.title || "A Day of Reflection";
  const emotion = activeJournal?.sticker || "Neutral";
  
  // Dragging Logic
  const handlePointerDown = (e: React.PointerEvent) => {
    if ((e.target as HTMLElement).tagName.toLowerCase() === 'textarea') return;
    
    e.preventDefault();
    setIsDragging(true);
    dragStart.current = {
      x: e.clientX,
      y: e.clientY,
      startPosX: position.x,
      startPosY: position.y
    };
    
    const handleMove = (moveEvent: PointerEvent) => {
      const deltaX = moveEvent.clientX - dragStart.current.x;
      const deltaY = moveEvent.clientY - dragStart.current.y;
      
      let newX = dragStart.current.startPosX + deltaX;
      let newY = dragStart.current.startPosY + deltaY;
      
      if (paperRef.current && stickyRef.current) {
        const paperRect = paperRef.current.getBoundingClientRect();
        const currentRect = stickyRef.current.getBoundingClientRect();
        
        const baseX = currentRect.left - latestPosition.current.x;
        const baseY = currentRect.top - latestPosition.current.y;
        
        const minX = paperRect.left - baseX + 24;
        const maxX = paperRect.right - currentRect.width - baseX - 24;
        const minY = paperRect.top - baseY + 24;
        const maxY = paperRect.bottom - currentRect.height - baseY - 24;
        
        newX = Math.max(minX, Math.min(newX, maxX));
        newY = Math.max(minY, Math.min(newY, maxY));
      }
      
      setPosition({ x: newX, y: newY });
    };

    const handleUp = () => {
      setIsDragging(false);
      document.removeEventListener('pointermove', handleMove);
      document.removeEventListener('pointerup', handleUp);
      handleUpdate('stickyNotePosition', latestPosition.current);
    };

    document.addEventListener('pointermove', handleMove);
    document.addEventListener('pointerup', handleUp);
  };

  // Extract images from tipTap content
  const extractImages = (content: any) => {
    if (!content || !content.content) return [];
    return content.content
      .filter((node: any) => node.type === 'image')
      .map((node: any) => node.attrs.src);
  };
  
  const images = extractImages(activeJournal?.content);

  return (
    <div className="flex-1 max-w-[1000px] w-full mx-auto px-4 md:px-8 py-8 md:py-12 relative h-full overflow-y-auto">
      
      {loadingPhase ? (
        <div className="w-full h-[800px] bg-[#FDFBF7] rounded-[24px] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-[#E5E7EB]/50 flex flex-col items-center justify-center animate-in fade-in zoom-in-95 duration-500">
          <div className="w-16 h-16 mb-8 relative">
            <div className="absolute inset-0 rounded-full border-4 border-[#7A5AF8]/20"></div>
            <div className="absolute inset-0 rounded-full border-4 border-[#7A5AF8] border-t-transparent animate-spin"></div>
          </div>
          <h2 className="text-2xl font-serif italic text-[#4B5563] mb-2 animate-pulse">{loadingPhase}</h2>
          <p className="text-sm text-[#9CA3AF]">This might take a moment.</p>
        </div>
      ) : (
      <div 
        ref={paperRef}
        className="relative w-full bg-[#FDFBF7] rounded-[24px] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-[#E5E7EB]/50 px-8 pt-5 pb-8 md:px-14 md:pt-6 md:pb-14 min-h-[800px] font-serif text-[#374151] animate-in fade-in duration-1000"
      >
        


        {/* Date Header */}
        <div className="text-[11px] font-bold tracking-[0.2em] text-[#9CA3AF] uppercase mb-3 font-sans">
          {format(activeJournal?.date ? new Date(activeJournal.date) : selectedDate, "EEEE, MMMM do, yyyy")}
        </div>

        {/* Title & Subtitle */}
        <div className="relative inline-block mb-8 w-full max-w-2xl">
          {editMode ? (
            <div className="flex flex-col gap-2">
              <input
                ref={titleInputRef}
                value={title === "A Day of Reflection" ? "" : title}
                onChange={(e) => handleUpdate('title', e.target.value)}
                className="text-4xl md:text-5xl font-medium tracking-tight text-[#111827] italic bg-transparent focus:outline-none border-b border-dashed border-[#7A5AF8]/30 w-full pb-1"
                placeholder="Journal Title"
              />
              <input
                value={activeJournal?.subtitle || ""}
                onChange={(e) => handleUpdate('subtitle', e.target.value)}
                className="text-lg md:text-xl font-medium text-muted-foreground bg-transparent focus:outline-none border-b border-dashed border-[#7A5AF8]/30 w-full pb-1"
                placeholder="Subtitle"
              />
            </div>
          ) : (
            <div className="flex flex-col gap-1">
              <h1 className="text-4xl md:text-5xl font-medium tracking-tight text-[#111827] italic">
                {title}
              </h1>
              {activeJournal?.subtitle && (
                <p className="text-lg md:text-xl font-medium text-muted-foreground">
                  {activeJournal.subtitle}
                </p>
              )}
            </div>
          )}
          <div className="absolute -bottom-2 left-0 w-[110%] h-2 bg-[#E9D5FF] -rotate-1 -z-10 rounded-full opacity-60" />
        </div>

        {/* Toolbar & Sticky Note Area */}
        <div className="flex flex-col gap-5 mb-4 font-sans w-full">
          
          {/* Row 1: Emotion */}
          <div className="flex">
            <div className="relative" ref={dropdownRef}>
              <div 
                onClick={() => isToday && setIsEmotionDropdownOpen(!isEmotionDropdownOpen)}
                className={cn(
                  "flex items-center gap-2 bg-white border border-[#E5E7EB] rounded-full px-4 py-2 text-sm text-[#4B5563] shadow-sm transition-all inline-flex",
                  isToday ? "cursor-pointer hover:bg-gray-50" : "cursor-default"
                )}
              >
                <span className="text-xs text-muted-foreground font-medium">Today's Emotion:</span>
                <div className="flex items-center gap-1.5 font-semibold pr-2 text-foreground">
                  {EMOTIONS.find(e => e.label === (emotion.includes(" ") ? emotion.split(" ")[1] : emotion))?.emoji || "😌"} {emotion.includes(" ") ? emotion.split(" ")[1] : emotion}
                  {isToday && <ChevronDown className="w-3.5 h-3.5 text-muted-foreground ml-1" />}
                </div>
              </div>

              {/* Dropdown Menu */}
              {isEmotionDropdownOpen && (
                <div className="absolute top-full mt-2 left-0 w-56 max-h-80 overflow-y-auto custom-scrollbar bg-white rounded-2xl shadow-xl border border-gray-100 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                  <div className="p-2 space-y-1">
                    {EMOTIONS.map((m) => {
                      const isSelected = emotion.includes(m.label);
                      return (
                        <button
                          key={m.label}
                          onClick={() => {
                            handleUpdate('emotion', `${m.emoji} ${m.label}`);
                            setIsEmotionDropdownOpen(false);
                          }}
                          className={cn(
                            "w-full flex items-center justify-between text-left px-3 py-2.5 rounded-xl text-sm transition-colors",
                            isSelected ? "bg-[#F3E8FF] text-[#6B21A8] font-bold" : "text-gray-700 hover:bg-gray-50"
                          )}
                        >
                          <span className="flex items-center gap-2.5">
                            <span className="text-lg">{m.emoji}</span>
                            <span>{m.label}</span>
                          </span>
                          {isSelected && <Check className="w-4 h-4 text-[#7A5AF8]" />}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Row 2: Edit, Regenerate & Sticky Note */}
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-5 w-full">
            
            {/* Left Column: Edit & Regenerate */}
            <div className="flex flex-col gap-4 shrink-0 font-sans">
              
              {/* 1. Edit Button */}
              {isToday && (
                <div>
                  {editMode ? (
                    <div className="flex items-center gap-3">
                      <button 
                        onClick={() => setEditMode(false)}
                        className="flex items-center gap-2 bg-white border border-[#E5E7EB] hover:bg-gray-50 rounded-full px-5 py-2 text-sm font-medium text-[#4B5563] shadow-sm transition-colors"
                      >
                        Done
                      </button>
                      {saveStatus === "saving" && <span className="text-sm text-muted-foreground font-medium animate-pulse">Saving...</span>}
                      {saveStatus === "saved" && <span className="text-sm text-green-600 font-medium">Saved</span>}
                    </div>
                  ) : (
                    <button 
                      onClick={() => setEditMode(true)}
                      className="flex items-center gap-2 bg-white border border-[#E5E7EB] hover:bg-gray-50 rounded-full px-5 py-2 text-sm font-medium text-[#4B5563] shadow-sm transition-colors"
                    >
                      <Edit2 className="w-4 h-4" /> Edit
                    </button>
                  )}
                </div>
              )}

              {/* 2. Generate Journal / Finalize Journal Button */}
              {isToday && !editMode && (
                <div>
                  {isFinalized ? (
                    // State 5: Final Journal Completed
                    <div className="flex items-center gap-2 bg-gray-50 text-gray-600 px-4 py-2 rounded-full border border-gray-200 text-xs font-bold shadow-sm select-none">
                      <Lock className="w-3.5 h-3.5 text-gray-500" /> Final Journal Completed
                    </div>
                  ) : isBeforeUnlock ? (
                    // Locked state: it is before the configured unlock time
                    <div className="flex flex-col gap-1 items-start">
                      {!hasAiDraft ? (
                        <button 
                          onClick={onRegenerate}
                          disabled={true}
                          className="flex items-center gap-2 bg-[#7A5AF8] hover:bg-[#6346E0] rounded-full px-5 py-2 text-sm font-medium text-white shadow-sm transition-colors disabled:opacity-50"
                        >
                          <Sparkles className="w-4 h-4" /> Generate Journal
                        </button>
                      ) : !hasSavedMemories ? (
                        <button 
                          onClick={onRegenerate}
                          disabled={true}
                          className="flex items-center gap-2 bg-[#7A5AF8] hover:bg-[#6346E0] rounded-full px-5 py-2 text-sm font-medium text-white shadow-sm transition-colors disabled:opacity-50"
                        >
                          <Sparkles className="w-4 h-4" /> 🔄 Regenerate Journal
                        </button>
                      ) : (
                        <button
                          onClick={onFinalizeJournal}
                          disabled={true}
                          className="flex items-center gap-2 bg-[#7A5AF8] hover:bg-[#6346E0] rounded-full px-5 py-2 text-sm font-medium text-white shadow-sm transition-colors disabled:opacity-50"
                        >
                          <Sparkles className="w-4 h-4" /> ✨ Finalize Journal
                        </button>
                      )}
                      <span className="text-[11px] text-[#7A5AF8] font-semibold italic">
                        Unlocks at {formattedUnlockTime} {remainingTimeStr ? `(${remainingTimeStr})` : ""}
                      </span>
                    </div>
                  ) : !hasAiDraft ? (
                    // State 2: After unlock time, no draft exists
                    <button 
                      onClick={onRegenerate}
                      disabled={!!loadingPhase}
                      className="flex items-center gap-2 bg-[#7A5AF8] hover:bg-[#6346E0] rounded-full px-5 py-2 text-sm font-medium text-white shadow-sm transition-colors disabled:opacity-50"
                    >
                      <Sparkles className="w-4 h-4" /> Generate Journal
                    </button>
                  ) : !hasSavedMemories ? (
                    // State 3: First AI draft generated, 0 memories
                    <button 
                      onClick={onRegenerate}
                      disabled={!!loadingPhase}
                      className="flex items-center gap-2 bg-[#7A5AF8] hover:bg-[#6346E0] rounded-full px-5 py-2 text-sm font-medium text-white shadow-sm transition-colors disabled:opacity-50"
                    >
                      <Sparkles className="w-4 h-4" /> 🔄 Regenerate Journal
                    </button>
                  ) : (
                    // State 4: Draft exists, at least 1 memory saved
                    <button
                      onClick={onFinalizeJournal}
                      disabled={!!loadingPhase}
                      className="flex items-center gap-2 bg-[#7A5AF8] hover:bg-[#6346E0] rounded-full px-5 py-2 text-sm font-medium text-white shadow-sm transition-colors disabled:opacity-50"
                    >
                      <Sparkles className="w-4 h-4" /> ✨ Finalize Journal
                    </button>
                  )}
                </div>
              )}

              {/* 3. Add Personal Memories Button */}
              {isToday && !editMode && !isFinalized && (
                <div className="flex flex-col gap-1 items-start">
                  <button
                    onClick={onAddMemories}
                    disabled={!!loadingPhase}
                    className="flex items-center gap-2 bg-white border border-[#E5E7EB] hover:bg-gray-50 disabled:hover:bg-white rounded-full px-5 py-2 text-sm font-medium text-[#4B5563] shadow-sm transition-colors disabled:opacity-50"
                  >
                    <Sparkles className="w-4 h-4 text-purple-500" /> Add Personal Memories
                  </button>
                  
                  {!hasAiDraft && (
                    <span className="text-[11px] text-muted-foreground italic text-left">
                      {isBeforeUnlock 
                        ? `Add personal memories now. They will be merged when the journal unlocks at ${formattedUnlockTime}.`
                        : "Add personal memories now. They will be merged when you generate today's journal."
                      }
                    </span>
                  )}

                  {hasSavedMemories && (
                    <span className="text-[11px] text-emerald-600 font-semibold italic">
                      ✓ {activeJournal.personalMemories.length} Personal Memories Saved
                    </span>
                  )}
                </div>
              )}

              {/* 4. Export Journal Button */}
              {activeJournal && !editMode && (
                <div className="relative" ref={exportMenuRef}>
                  <button 
                    onClick={() => setIsExportMenuOpen(!isExportMenuOpen)}
                    className="flex items-center gap-2 bg-white border border-[#E5E7EB] hover:bg-gray-50 rounded-full px-5 py-2 text-sm font-medium text-[#4B5563] shadow-sm transition-colors"
                  >
                    <Download className="w-4 h-4" /> Export Journal
                    <ChevronDown className="w-3.5 h-3.5 text-muted-foreground ml-0.5" />
                  </button>

                  {isExportMenuOpen && (
                    <div className="absolute top-full mt-2 left-0 w-48 bg-white rounded-2xl shadow-xl border border-gray-100 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                      <div className="p-2 space-y-1">
                        <button
                          onClick={() => handleExport("pdf")}
                          className="w-full text-left px-4 py-2.5 rounded-xl text-sm text-gray-700 hover:bg-gray-50 transition-colors font-medium flex items-center gap-2"
                        >
                          <FileText className="w-4 h-4 text-red-500" />
                          PDF Document
                        </button>
                        <button
                          onClick={() => handleExport("markdown")}
                          className="w-full text-left px-4 py-2.5 rounded-xl text-sm text-gray-700 hover:bg-gray-50 transition-colors font-medium flex items-center gap-2"
                        >
                          <FileText className="w-4 h-4 text-blue-500" />
                          Markdown (.md)
                        </button>
                        <button
                          onClick={() => handleExport("txt")}
                          className="w-full text-left px-4 py-2.5 rounded-xl text-sm text-gray-700 hover:bg-gray-50 transition-colors font-medium flex items-center gap-2"
                        >
                          <FileText className="w-4 h-4 text-gray-500" />
                          Plain Text (.txt)
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Sticky Note */}
            <div 
              ref={stickyRef}
              onPointerDown={handlePointerDown}
              style={{
                transform: `translate3d(${position.x}px, ${position.y}px, 0) rotate(2deg) scale(${isDragging ? 1.02 : 1})`,
                cursor: isDragging ? 'grabbing' : 'grab',
                transition: isDragging ? 'none' : 'transform 0.2s cubic-bezier(0.2, 0, 0, 1)'
              }}
              className={cn(
                "relative w-64 bg-[#F3E8FF] rounded-sm p-5 shrink-0 z-40 touch-none select-none",
                isDragging ? "shadow-xl" : "shadow-md"
              )}
            >
              {/* Push pin */}
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-4 h-4 rounded-full bg-[#D4AF37] shadow-sm flex items-center justify-center pointer-events-none">
                <div className="w-1.5 h-1.5 rounded-full bg-white/40" />
              </div>
              {editMode ? (
                <textarea
                  value={quote}
                  onChange={(e) => handleUpdate('quote', e.target.value)}
                  className="w-full bg-transparent resize-none text-[13px] leading-relaxed text-[#581C87] font-medium italic focus:outline-none placeholder-[#581C87]/50"
                  placeholder="Sticky note text..."
                  rows={4}
                />
              ) : (
                <p className="text-[13px] leading-relaxed text-[#581C87] font-medium italic whitespace-pre-wrap pointer-events-none">
                  "{quote}"
                </p>
              )}
              <div className="flex justify-end mt-2 pointer-events-none">
                <Heart className="w-4 h-4 text-[#A855F7]" />
              </div>
            </div>
          </div>
        </div>

        {/* Journal Content */}
        <div className="relative">
          {/* Decorative Flowers */}
          <div className="absolute -left-12 top-0 text-[#FCA5A5] opacity-80 text-3xl hidden md:block z-0 pointer-events-none">🌸</div>
          <div className="absolute -right-8 bottom-10 text-[#86EFAC] opacity-80 text-4xl hidden md:block z-0 pointer-events-none">🌿</div>

          {!activeJournal && !loadingPhase && !editMode && (
            <div className="py-10 text-center z-10 relative flex flex-col items-center justify-center gap-6 max-w-lg mx-auto w-full px-4">
              {isToday ? (
                isBeforeUnlock ? (
                  <>
                    <div className="bg-gradient-to-b from-white to-[#F9FAFB] rounded-3xl border border-[#E5E7EB] shadow-sm p-8 flex flex-col items-center text-center w-full">
                      <div className="w-14 h-14 bg-amber-50 rounded-2xl flex items-center justify-center mb-5 text-amber-500 border border-amber-100 shadow-sm animate-pulse">
                        <Clock className="w-7 h-7" />
                      </div>
                      
                      <h3 className="text-base font-bold text-gray-900 mb-2 flex items-center gap-2 justify-center">
                        <Lock className="w-4 h-4 text-muted-foreground" /> AI Journal Locked
                      </h3>
                      
                      <p className="text-xs text-gray-600 leading-relaxed mb-6 not-italic">
                        Your AI Journal becomes available after your configured unlock time ({formattedUnlockTime}) so it can reflect your complete day.
                      </p>
                      
                      {remainingTimeStr && (
                        <div className="bg-[#F5F3FF] border border-[#DDD6FE] rounded-2xl py-3 px-6 mb-6">
                          <span className="text-[10px] text-purple-600 font-bold uppercase tracking-wider block mb-1 not-italic">⏳ Unlocks in:</span>
                          <span className="text-2xl font-black text-purple-700 tracking-tight not-italic">{remainingTimeStr.replace(" remaining", "")}</span>
                        </div>
                      )}
                      
                      <div className="flex items-start gap-3 bg-gray-50 border border-gray-150 rounded-2xl p-4 text-left w-full">
                        <span className="text-lg shrink-0 mt-0.5">✍️</span>
                        <p className="text-xs text-gray-600 leading-relaxed not-italic">
                          You can continue writing, adding images, voice notes, and organizing today's journal manually while you wait.
                        </p>
                      </div>
                    </div>

                    {/* Manual Journal Reminder / Tip Card */}
                    <div className="bg-[#FEFCE8] border border-[#FEF08A] rounded-2xl p-5 flex items-start gap-4 shadow-sm w-full">
                      <div className="text-xl shrink-0">💡</div>
                      <div className="text-left">
                        <h4 className="text-xs font-bold text-yellow-800 uppercase tracking-wider mb-1 not-italic">Tip</h4>
                        <p className="text-xs text-yellow-900/90 leading-relaxed not-italic">
                          Keep writing throughout the day. The AI will use everything you've written to generate a richer and more personalized journal after your unlock time.
                        </p>
                      </div>
                    </div>
                  </>
                ) : (
                  <p className="text-muted-foreground italic">
                    No journal entry found for this date. Click Edit to manually write one, or Generate Journal to use AI.
                  </p>
                )
              ) : (
                <p className="text-muted-foreground italic">
                  No journal entry found for this date.
                </p>
              )}
            </div>
          )}

          {(activeJournal || editMode) && !loadingPhase && derivedContent && (
            <div className="relative z-10 w-full min-h-[300px]">
              <TiptapEditor 
                ref={editorRef}
                initialContent={derivedContent} 
                onUpdate={(json) => {
                  triggerAutoSave({ 
                    content: json,
                    originalText: extractTextFromTiptap(json)
                  }, json);
                }}
                editable={editMode}
                editorSticker={editorSticker}
                onStickerInserted={() => setEditorSticker(null)}
              />
            </div>
          )}

          {activeJournal && !editMode && activeJournal.personalMemories && activeJournal.personalMemories.length > 0 && (
            <div className="mt-8 border-t border-gray-150 pt-6 relative z-10 w-full font-sans">
              <h4 className="text-xs font-bold text-gray-900 uppercase tracking-wider mb-3 flex items-center gap-1.5 justify-start">
                ✨ Personal Memories
              </h4>
              <ul className="space-y-2">
                {activeJournal.personalMemories.map((m: any) => (
                  <li key={m.id} className="text-xs text-gray-600 bg-gray-50 border border-gray-200 rounded-xl p-3 flex items-start gap-2.5 text-left font-medium">
                    <span className="text-purple-500 mt-0.5">•</span>
                    <span className="whitespace-pre-wrap flex-1">{m.content}</span>
                  </li>
                ))}
              </ul>
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
        {activeJournal && (
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
        {activeJournal && (
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
      )}
    </div>
  );
}
