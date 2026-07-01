"use client";

import React, { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { JournalCalendar } from "@/components/journal/journal-calendar";
import { JournalNotebook } from "@/components/journal/journal-notebook";
import { JournalRightSidebar } from "@/components/journal/journal-right-sidebar";
import { Plus, Search, Command, Heart, Settings } from "lucide-react";
import { getJournalHistory, getJournal, createEmptyJournal, generateJournal, toggleFavorite, generateDailyAnalysis, savePersonalMemories, finalizeJournalAction } from "@/app/actions/journal";
import { getUserJournalSettings, updateJournalUnlockTime } from "@/app/actions/user";
import { PersonalMemoriesModal } from "./personal-memories-modal";
import { format, isSameDay } from "date-fns";
import { toast } from "sonner";
import { parseJournalContent } from "@/lib/tiptap-utils";

export function JournalPageClient() {
  const editorRef = React.useRef<any>(null);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [activeJournal, setActiveJournal] = useState<any>(null);
  const [editMode, setEditMode] = useState(false);
  const [journalHistory, setJournalHistory] = useState<any[]>([]);
  const [editorSticker, setEditorSticker] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<"all" | "favorites">("all");
  const [loadingPhase, setLoadingPhase] = useState<string | null>(null);
  const [showConfirmRegenerate, setShowConfirmRegenerate] = useState(false);
  const [isGeneratingAnalysis, setIsGeneratingAnalysis] = useState(false);
  const [isMemoriesModalOpen, setIsMemoriesModalOpen] = useState(false);
  const [isSavingMemories, setIsSavingMemories] = useState(false);

  const [mounted, setMounted] = useState(false);
  const [currentTime, setCurrentTime] = useState<Date>(new Date());
  const [unlockPreference, setUnlockPreference] = useState<string>("20:00");
  const prevIsBeforeUnlockRef = useRef<boolean | null>(null);

  useEffect(() => {
    setMounted(true);
    setCurrentTime(new Date());
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 10000); // Update every 10 seconds
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    async function loadSettings() {
      try {
        const res = await getUserJournalSettings();
        if (res.success && res.unlockTime) {
          setUnlockPreference(res.unlockTime);
        }
      } catch (err) {
        console.error("Failed to load journal unlock preference", err);
      }
    }
    loadSettings();
  }, []);

  const isToday = useMemo(() => {
    if (activeJournal?.date) {
      return isSameDay(new Date(activeJournal.date), new Date());
    }
    return isSameDay(selectedDate, new Date());
  }, [activeJournal?.date, selectedDate]);

  const isBeforeUnlock = useMemo(() => {
    if (!mounted) return true; // Default to locked on server side to prevent hydration mismatches
    const [prefHours, prefMins] = unlockPreference.split(":").map(Number);
    const unlockTime = new Date(currentTime);
    unlockTime.setHours(prefHours, prefMins, 0, 0); // Today at custom PM local time
    return currentTime.getTime() < unlockTime.getTime();
  }, [mounted, currentTime, unlockPreference]);

  const remainingTimeStr = useMemo(() => {
    if (!isBeforeUnlock || !mounted) return "";
    const [prefHours, prefMins] = unlockPreference.split(":").map(Number);
    const target = new Date(currentTime);
    target.setHours(prefHours, prefMins, 0, 0);
    const diffMs = target.getTime() - currentTime.getTime();
    if (diffMs <= 0) return "";
    
    const diffHrs = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    const diffSecs = Math.floor((diffMs % (1000 * 60)) / 1000);
    
    if (diffHrs > 0) {
      return `${diffHrs}h ${diffMins}m remaining`;
    }
    if (diffMins > 0) {
      return `${diffMins}m ${diffSecs}s remaining`;
    }
    return `${diffSecs}s remaining`;
  }, [isBeforeUnlock, currentTime, mounted, unlockPreference]);

  // Unlock toast notifier effect
  useEffect(() => {
    if (prevIsBeforeUnlockRef.current === null) {
      prevIsBeforeUnlockRef.current = isBeforeUnlock;
      return;
    }

    // Transition from locked to unlocked
    if (prevIsBeforeUnlockRef.current === true && isBeforeUnlock === false && isToday) {
      const dateStr = format(selectedDate, "yyyy-MM-dd");
      const storageKey = `unlocked-notify-${dateStr}`;
      const hasNotified = localStorage.getItem(storageKey);
      
      if (!hasNotified) {
        toast("🔓 AI Journal Unlocked", {
          description: "Your daily AI journal is now available. Generate today's reflection whenever you're ready.",
          duration: 6000,
        });
        localStorage.setItem(storageKey, "true");
      }
    }

    prevIsBeforeUnlockRef.current = isBeforeUnlock;
  }, [isBeforeUnlock, isToday, selectedDate]);

  const handleUnlockPreferenceChange = async (newTime: string) => {
    setUnlockPreference(newTime);
    try {
      const res = await updateJournalUnlockTime(newTime);
      if (res.success) {
        const hours = parseInt(newTime.split(":")[0], 10);
        const suffix = hours >= 12 ? "PM" : "AM";
        const formattedHours = hours % 12 || 12;
        toast.success(`Preferred unlock time updated to ${formattedHours}:00 ${suffix}.`);
      } else {
        toast.error(res.error || "Failed to update unlock time preference");
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to update unlock time preference");
    }
  };

  const handleRegenerateAnalysis = useCallback(async () => {
    if (!activeJournal?.id) return;
    setIsGeneratingAnalysis(true);
    try {
      const hadInsights = !!activeJournal?.insights?.aiAnalysis;
      const res = await generateDailyAnalysis(activeJournal.id);
      if (res.success && res.journal) {
        handleUpdateJournal(res.journal);
        toast.success(hadInsights ? "AI Insights Regenerated" : "AI Insights Generated Successfully", { duration: 2000 });
      } else {
        if (res.errorType === 'QUOTA_EXCEEDED') {
          toast.warning("⚠️ Daily AI limit reached. Please try again in a few minutes.", { duration: 4000 });
        } else {
          toast.error(res.error || "Failed to generate analysis");
        }
      }
    } catch (e) {
      toast.error("Failed to generate analysis");
    } finally {
      setIsGeneratingAnalysis(false);
    }
  }, [activeJournal?.id, activeJournal?.insights?.aiAnalysis]);

  const loadHistory = async () => {
    try {
      const history = await getJournalHistory();
      setJournalHistory(history);
    } catch (err) {
      console.error("Failed to load history", err);
    }
  };

  useEffect(() => {
    loadHistory();
  }, []);

  useEffect(() => {
    async function loadActive() {
      try {
        const j = await getJournal(selectedDate);
        setActiveJournal(j || null);
      } catch (err) {
        console.error("Unable to load journal", err);
      }
    }
    loadActive();
  }, [selectedDate]);

  const handleCreateNew = async () => {
    const today = new Date();
    const existing = journalHistory.find(j => isSameDay(new Date(j.date), today));
    
    if (existing) {
      toast.info("Today's journal already exists. Continuing today's journal.");
      setSelectedDate(today);
      return;
    }
    
    try {
      const res = await createEmptyJournal(today.toISOString());
      if (res.success && res.journal) {
        toast.success("New journal created successfully.");
        await loadHistory();
        setSelectedDate(today);
        setEditMode(true);
      }
    } catch (error) {
      toast.error("Unable to create journal. Please try again.");
    }
  };

  const handleSetEditMode = async (mode: boolean) => {
    if (mode && !activeJournal) {
      // Create empty journal dynamically when they enter Edit Mode on an empty day
      const res = await createEmptyJournal(selectedDate.toISOString());
      if (res.success && res.journal) {
        setActiveJournal(res.journal);
        await loadHistory();
      }
    }
    setEditMode(mode);
  };

  const handleEnsureJournal = async (): Promise<string | undefined> => {
    if (activeJournal?.id) return activeJournal.id;
    
    // Create empty journal dynamically
    const res = await createEmptyJournal(selectedDate.toISOString());
    if (res.success && res.journal) {
      setActiveJournal(res.journal);
      await loadHistory();
      return res.journal.id;
    }
    return undefined;
  };

  const handleUpdateJournal = (updates: any) => {
    setActiveJournal((prev: any) => {
      const updated = prev ? { ...prev, ...updates } : updates;
      
      // Optimistically update history for Timeline
      setJournalHistory((history) => {
        const exists = history.some(j => j.id === updated.id);
        if (exists) {
          return history.map(j => j.id === updated.id ? updated : j);
        } else {
          return [updated, ...history].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        }
      });
      
      return updated;
    });
  };

  const handleRegenerate = async () => {
    setShowConfirmRegenerate(false);
    setLoadingPhase("Reviewing today's journey...");
    
    // Sequence the loading text
    const phases = [
      "Generating Journal...",
      "Writing Reflection...",
      "Finalizing Journal..."
    ];
    let phaseIndex = 0;
    const interval = setInterval(() => {
      phaseIndex = (phaseIndex + 1) % phases.length;
      setLoadingPhase(phases[phaseIndex]);
    }, 2000);

    try {
      const mood = activeJournal?.sticker || "Neutral";
      const response = await generateJournal(mood);
      if (response.success && response.journal) {
        handleUpdateJournal(response.journal);
        toast.success("✨ Journal Created Successfully", {
          description: "Today's journal has been thoughtfully crafted from your work, focus, relationships, and progress.",
          duration: 2000,
        });
      } else {
        if (response.errorType === 'QUOTA_EXCEEDED') {
          toast.warning("⚠️ Daily AI limit reached. Please try again in a few minutes.", {
            duration: 4000
          });
        } else {
          toast.error(response.error || "Failed to generate journal");
        }
      }
    } catch (error) {
      console.error(error);
      toast.error("Failed to generate journal");
    } finally {
      clearInterval(interval);
      setLoadingPhase(null);
    }
  };

  const handleSaveMemories = async (memories: string[]) => {
    setIsSavingMemories(true);
    try {
      const journalId = await handleEnsureJournal();
      if (!journalId) {
        toast.error("Failed to prepare journal for today.");
        return;
      }

      const res = await savePersonalMemories(journalId, memories);
      if (res.success && res.journal) {
        handleUpdateJournal(res.journal);
        toast.success(`✓ ${memories.length} Personal Memories Saved`, { duration: 2500 });
        setIsMemoriesModalOpen(false);
      } else {
        toast.error(res.error || "Failed to save memories");
      }
    } catch (error) {
      console.error(error);
      toast.error("Failed to save memories");
    } finally {
      setIsSavingMemories(false);
    }
  };

  const handleFinalizeJournal = async () => {
    if (!activeJournal?.id) return;
    setLoadingPhase("Polishing final narrative...");

    const phases = [
      "Integrating personal memories...",
      "Improving emotional flow...",
      "Structuring finalized reflection...",
      "Polishing final journal..."
    ];
    let phaseIndex = 0;
    const interval = setInterval(() => {
      phaseIndex = (phaseIndex + 1) % phases.length;
      setLoadingPhase(phases[phaseIndex]);
    }, 2200);

    try {
      const res = await finalizeJournalAction(activeJournal.id);
      if (res.success && res.journal) {
        handleUpdateJournal(res.journal);
        toast.success("✓ Final Journal Created", {
          description: "Your daily journal is now permanently finalized with all your personal memories.",
          duration: 3500,
        });
      } else {
        toast.error(res.error || "Failed to finalize journal");
      }
    } catch (error) {
      console.error(error);
      toast.error("Failed to finalize journal");
    } finally {
      clearInterval(interval);
      setLoadingPhase(null);
    }
  };

  const handleToggleFavorite = async (e: React.MouseEvent, journalId: string, currentStatus: boolean) => {
    e.stopPropagation(); // prevent card click
    const newStatus = !currentStatus;
    
    // Optimistic UI update
    setJournalHistory(history => history.map(j => j.id === journalId ? { ...j, isFavorite: newStatus } : j));
    if (activeJournal?.id === journalId) {
      setActiveJournal({ ...activeJournal, isFavorite: newStatus });
    }

    try {
      await toggleFavorite(journalId, newStatus);
    } catch (err) {
      // Revert on failure
      setJournalHistory(history => history.map(j => j.id === journalId ? { ...j, isFavorite: currentStatus } : j));
      if (activeJournal?.id === journalId) {
        setActiveJournal({ ...activeJournal, isFavorite: currentStatus });
      }
      toast.error("Failed to update favorite status");
    }
  };

  const filteredHistory = useMemo(() => {
    let result = journalHistory;
    if (filterType === "favorites") {
      result = result.filter(j => j.isFavorite);
    }
    
    if (!searchQuery.trim()) return result;
    const query = searchQuery.toLowerCase();
    
    return result.filter(j => {
      const dateStr = format(new Date(j.date), "MMMM d yyyy").toLowerCase();
      const title = j.insights?.title?.toLowerCase() || "";
      const text = j.originalText?.toLowerCase() || "";
      return dateStr.includes(query) || title.includes(query) || text.includes(query);
    });
  }, [searchQuery, journalHistory, filterType]);

  const mockJournalDates = journalHistory.map(j => new Date(j.date));

  if (!mounted) {
    return (
      <div className="flex h-full w-full bg-background overflow-hidden items-center justify-center">
        <div className="w-8 h-8 rounded-full border-4 border-[#7A5AF8] border-t-transparent animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="absolute inset-0 flex bg-background overflow-hidden">
      
      {/* Left Sidebar */}
      <aside className="w-[320px] shrink-0 border-r border-border bg-[#FCFAF6] h-full overflow-hidden px-5 pt-6 flex flex-col hidden lg:flex">
        
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-[13px] font-black tracking-wide text-[#1A1A1A]">MY JOURNALS</h2>
          <button 
            onClick={handleCreateNew}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-[#E5E7EB] rounded-full text-[12px] font-medium text-[#4B5563] shadow-sm hover:bg-gray-50 transition-colors"
          >
            <Plus className="w-3.5 h-3.5 text-[#9CA3AF]" />
            New
          </button>
        </div>

        <div className="relative mb-5 shrink-0">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9CA3AF]" />
          <input 
            type="text" 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search journals..." 
            className="w-full pl-9 pr-12 py-2.5 bg-white border border-[#E5E7EB] rounded-2xl text-[13px] text-[#1A1A1A] placeholder-[#9CA3AF] shadow-sm focus:outline-none focus:ring-2 focus:ring-[#7A5AF8]/20 focus:border-[#7A5AF8] transition-all"
          />
          <div className="absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center gap-1 px-1.5 py-0.5 bg-[#F9FAFB] border border-[#E5E7EB] rounded text-[10px] font-medium text-[#6B7280]">
            <Command className="w-2.5 h-2.5" /> K
          </div>
        </div>

        <div className="mb-5 shrink-0 flex justify-center w-full">
          <JournalCalendar 
            journalDates={mockJournalDates} 
            selectedDate={activeJournal?.date ? new Date(activeJournal.date) : null} 
            onDateSelect={setSelectedDate} 
          />
        </div>

        {/* Filters */}
        <div className="flex gap-2 mb-4 shrink-0">
          <button 
            onClick={() => setFilterType("all")}
            className={`px-3 py-1 text-xs font-medium rounded-full shadow-sm transition-colors ${filterType === "all" ? "bg-[#7A5AF8] text-white" : "bg-white border border-border text-muted-foreground hover:bg-gray-50"}`}
          >
            All
          </button>
          <button 
            onClick={() => setFilterType("favorites")}
            className={`px-3 py-1 text-xs font-medium rounded-full shadow-sm transition-colors flex items-center gap-1 ${filterType === "favorites" ? "bg-[#7A5AF8] text-white" : "bg-white border border-border text-muted-foreground hover:bg-gray-50"}`}
          >
            <Heart className={`w-3 h-3 ${filterType === "favorites" ? "fill-white" : ""}`} /> Favorites
          </button>
        </div>

        {/* Timeline */}
        <div className="flex-1 overflow-y-auto space-y-2.5 pb-6 pr-1 custom-scrollbar">
          <h3 className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-3 sticky top-0 bg-[#FCFAF6] py-1 z-10">Timeline</h3>
          {filteredHistory.length === 0 ? (
            <p className="text-xs text-muted-foreground italic">No journals found.</p>
          ) : (
            filteredHistory.map((j) => (
              <div 
                key={j.id} 
                onClick={() => setSelectedDate(new Date(j.date))}
                className={`p-3 rounded-xl border cursor-pointer transition-all ${
                  isSameDay(new Date(j.date), selectedDate)
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
                <div className="flex items-start justify-between gap-2 mb-1">
                  <h4 className="font-serif font-medium text-[#111827] text-[13px] leading-tight line-clamp-1 flex-1">
                    {j.insights?.title || "Journal Entry"}
                  </h4>
                  <button 
                    onClick={(e) => handleToggleFavorite(e, j.id, !!j.isFavorite)}
                    className="shrink-0 p-0.5 hover:bg-gray-100 rounded transition-colors group"
                  >
                    <Heart 
                      className={`w-3.5 h-3.5 transition-all ${
                        j.isFavorite 
                          ? "fill-red-500 text-red-500" 
                          : "text-gray-400 group-hover:text-red-400"
                      }`} 
                    />
                  </button>
                </div>
                <p className="text-[11px] text-muted-foreground line-clamp-2 leading-relaxed">
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
          editorRef={editorRef}
          selectedDate={selectedDate}
          activeJournal={activeJournal}
          onUpdateJournal={handleUpdateJournal}
          editMode={editMode}
          setEditMode={handleSetEditMode}
          editorSticker={editorSticker}
          setEditorSticker={setEditorSticker}
          onRegenerate={() => setShowConfirmRegenerate(true)}
          loadingPhase={loadingPhase}
          isToday={isToday}
          isBeforeUnlock={isBeforeUnlock}
          remainingTimeStr={remainingTimeStr}
          unlockPreference={unlockPreference}
          onAddMemories={() => setIsMemoriesModalOpen(true)}
          onFinalizeJournal={handleFinalizeJournal}
        />
        
        {/* Confirm Regenerate Dialog */}
        {showConfirmRegenerate && (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 animate-in fade-in zoom-in duration-200">
              <h3 className="text-lg font-bold text-gray-900 mb-2">Regenerate Journal?</h3>
              <p className="text-sm text-gray-600 mb-6">
                This will generate a brand new AI journal for today. 
                Your manually edited journal has already been auto-saved.
                <br/><br/>
                Do you want to continue?
              </p>
              <div className="flex items-center justify-end gap-3">
                <button 
                  onClick={() => setShowConfirmRegenerate(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleRegenerate}
                  className="px-4 py-2 text-sm font-medium text-white bg-[#7A5AF8] hover:bg-[#6346E0] rounded-full transition-colors shadow-sm"
                >
                  Generate
                </button>
              </div>
            </div>
          </div>
        )}
      </main>

      <PersonalMemoriesModal
        isOpen={isMemoriesModalOpen}
        onClose={() => setIsMemoriesModalOpen(false)}
        initialMemories={activeJournal?.personalMemories?.map((m: any) => m.content) || []}
        onSave={handleSaveMemories}
        isSaving={isSavingMemories}
      />

      {/* Right Sidebar */}
      <aside className="w-[320px] shrink-0 border-l border-border bg-[#FCFAF6] h-full overflow-y-auto px-5 pt-6 pb-8 space-y-6 flex flex-col hidden xl:flex">
        <JournalRightSidebar 
          emotion={activeJournal?.sticker || "Neutral"}
          onStickerClick={(sticker) => setEditorSticker(sticker)}
          activeJournal={activeJournal}
          onRegenerateAnalysis={handleRegenerateAnalysis}
          isGeneratingAnalysis={isGeneratingAnalysis}
          onAttachmentUploaded={(attachment) => {
            if (activeJournal) {
              const currentAttachments = activeJournal.attachments || [];
              handleUpdateJournal({
                attachments: [...currentAttachments, attachment]
              });
            }
            // Ensure edit mode is available
            handleSetEditMode(true);
          }}
          onInsertAttachment={(attachment) => {
            handleSetEditMode(true);
            setTimeout(() => {
              if (editorRef.current) {
                editorRef.current.insertAttachment(attachment);
              }
            }, 100);
          }}
          onEnsureJournal={handleEnsureJournal}
          isToday={isToday}
          isBeforeUnlock={isBeforeUnlock}
          remainingTimeStr={remainingTimeStr}
          unlockPreference={unlockPreference}
          onUnlockPreferenceChange={handleUnlockPreferenceChange}
        />
      </aside>

    </div>
  );
}
