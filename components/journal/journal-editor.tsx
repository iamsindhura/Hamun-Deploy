"use client";

import { useState, useEffect } from "react";
import { generateJournal, saveJournal } from "@/app/actions/journal";
import { Button } from "@/components/ui/button";
import { Loader2, Sparkles, Save, Edit2, CheckCircle2, CalendarDays, Share2 } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { TiptapEditor } from "./editor/TiptapEditor";
import { parseJournalContent } from "@/lib/tiptap-utils";

const MOODS = [
  { emoji: "😊", label: "Amazing", value: "Amazing" },
  { emoji: "🙂", label: "Good", value: "Good" },
  { emoji: "😐", label: "Okay", value: "Okay" },
  { emoji: "😔", label: "Tired", value: "Tired" },
  { emoji: "😢", label: "Bad", value: "Bad" }
];

interface JournalEditorProps {
  journal: any;
  isHistorical?: boolean;
}

export function JournalEditor({ journal: initialJournal, isHistorical = false }: JournalEditorProps) {
  const [journal, setJournal] = useState(initialJournal);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [content, setContent] = useState("");
  const [selectedMood, setSelectedMood] = useState("Good");

  // Read-only mode by default for historical journals
  useEffect(() => {
    if (isHistorical) {
      setIsEditing(false);
    }
  }, [isHistorical]);

  useEffect(() => {
    setJournal(initialJournal);
    if (initialJournal) {
      const parsed = parseJournalContent(initialJournal.content || initialJournal.originalText);
      setContent(JSON.stringify(parsed));
      
      // Auto-migrate if it was empty or legacy plain text and we successfully converted it
      // but we ONLY auto-migrate if we have an ID and it hasn't been saved as content yet.
      // (Optional requirement #7 from user)
      if (!initialJournal.content && initialJournal.originalText && initialJournal.id) {
        saveJournal(initialJournal.date, parsed, {
          quote: initialJournal.quote,
          sticker: initialJournal.sticker,
          tags: initialJournal.tags,
          productivityScore: initialJournal.productivityScore,
          focusStreak: initialJournal.focusStreak,
          insights: initialJournal.insights
        }).catch(console.error);
      }
    }
  }, [initialJournal]);

  const handleGenerate = async () => {
    try {
      setIsGenerating(true);
      const res = await generateJournal(selectedMood);
      if (res.success && res.journal) {
        setJournal(res.journal);
        const parsed = parseJournalContent(res.journal.content || res.journal.originalText);
        setContent(JSON.stringify(parsed));
        toast.success("Journal generated successfully!");
      } else {
        toast.error(res.error || "Failed to generate journal");
      }
    } catch (e: any) {
      toast.error(e.message || "Failed to generate journal");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSave = async () => {
    if (!journal) return;
    try {
      setIsSaving(true);
      const parsedContent = content ? JSON.parse(content) : null;
      const res = await saveJournal(journal.date, parsedContent, {
        quote: journal.quote,
        sticker: journal.sticker,
        tags: journal.tags,
        productivityScore: journal.productivityScore,
        focusStreak: journal.focusStreak,
        insights: journal.insights
      });
      if (res.success && res.journal) {
        setJournal(res.journal);
        setIsEditing(false);
        toast.success("Journal saved successfully!");
      }
    } catch (e) {
      toast.error("Failed to save journal");
    } finally {
      setIsSaving(false);
    }
  };

  if (!journal && !isGenerating) {
    return (
      <div className="p-8 rounded-2xl bg-card border border-border shadow-sm flex flex-col items-center text-center">
        <Sparkles className="h-12 w-12 text-purple-500 mb-4" />
        <h3 className="text-xl font-bold text-foreground mb-2">Write Today's Story</h3>
        <p className="text-muted-foreground max-w-md mb-8">
          Reflect on your deep work, tasks, and relationships. How are you feeling today?
        </p>
        
        <div className="flex gap-3 mb-8 flex-wrap justify-center">
          {MOODS.map(mood => (
            <button
              key={mood.value}
              onClick={() => setSelectedMood(mood.value)}
              className={cn(
                "px-4 py-2 rounded-full border text-sm font-medium transition-colors",
                selectedMood === mood.value 
                  ? "bg-purple-100 border-purple-500 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300"
                  : "bg-background border-border hover:bg-muted text-muted-foreground"
              )}
            >
              <span className="mr-2">{mood.emoji}</span>
              {mood.label}
            </button>
          ))}
        </div>

        <Button onClick={handleGenerate} size="lg" className="bg-purple-600 hover:bg-purple-700 text-white rounded-full px-8">
          Generate AI Journal
        </Button>
      </div>
    );
  }

  if (isGenerating) {
    return (
      <div className="p-12 rounded-2xl bg-card border border-border shadow-sm flex flex-col items-center text-center justify-center min-h-[400px]">
        <Loader2 className="h-10 w-10 text-purple-500 animate-spin mb-4" />
        <h3 className="text-lg font-bold text-foreground">Reflecting on your day...</h3>
        <p className="text-muted-foreground text-sm mt-2">Analyzing your tasks, deep work, and connections.</p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl bg-card border border-border shadow-sm overflow-hidden flex flex-col">
      {/* Toolbar Layer */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-6 sm:p-8 shrink-0 gap-4 border-b border-border bg-card/50">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 px-3 py-1.5 bg-muted rounded-full text-sm font-medium">
            <span>{isHistorical ? initialJournal?.sticker || "Past Memory" : "Today's Emotion:"}</span>
            {!isHistorical && (
              <select 
                value={selectedMood}
                onChange={(e) => setSelectedMood(e.target.value)}
                className="bg-transparent border-none focus:ring-0 cursor-pointer p-0 pr-6 text-foreground font-semibold"
                disabled={isEditing}
              >
                {MOODS.map(m => <option key={m.value} value={m.value}>{m.emoji} {m.label}</option>)}
              </select>
            )}
          </div>
          {isHistorical && (
            <div className="text-sm text-muted-foreground flex items-center gap-2">
              <CalendarDays className="h-4 w-4" />
              {new Date(initialJournal.date).toLocaleDateString()}
            </div>
          )}
        </div>

        <div className="flex items-center gap-3">
          {/* Historical Viewing Toolbar */}
          {isHistorical && !isEditing && (
            <>
              <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
                <Edit2 className="w-4 h-4 mr-2" />
                Edit Journal
              </Button>
              <Button variant="ghost" size="sm">
                <Share2 className="w-4 h-4 mr-2" />
                Share
              </Button>
            </>
          )}

          {/* Active Editing Toolbar (Today or Historical) */}
          {isEditing && (
            <>
              <Button variant="ghost" size="sm" onClick={() => {
                setIsEditing(false);
                const parsed = parseJournalContent(journal?.content || journal?.originalText);
                setContent(JSON.stringify(parsed));
              }} className="text-xs">
                Cancel
              </Button>
              <Button 
                onClick={handleSave} 
                disabled={isSaving}
                className="shadow-sm bg-primary hover:bg-primary/90 text-primary-foreground font-medium"
              >
                {isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                Save Changes
              </Button>
            </>
          )}

          {/* Today's Reading Toolbar */}
          {!isHistorical && !isEditing && journal && (
            <>
              <Button variant="outline" size="sm" onClick={() => setIsEditing(true)} className="bg-background">
                <Edit2 className="w-4 h-4 mr-2" />
                Edit
              </Button>
              <Button 
                onClick={handleGenerate} 
                disabled={isGenerating}
                variant="default"
                className="shadow-sm"
              >
                {isGenerating ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Sparkles className="w-4 h-4 mr-2" />}
                Regenerate
              </Button>
            </>
          )}
        </div>
      </div>

      <div className="p-8 sm:p-12 flex-1 flex flex-col min-h-[70vh]">
        {isEditing ? (
          <TiptapEditor 
            initialContent={parseJournalContent(content)} 
            onUpdate={(json) => setContent(JSON.stringify(json))}
            editable={true}
          />
        ) : (
          <div className="prose prose-slate dark:prose-invert max-w-none space-y-6">
            <TiptapEditor 
              initialContent={parseJournalContent(content)} 
              onUpdate={() => {}}
              editable={false}
            />
          </div>
        )}

        {/* Decorative Elements Section (Rendered below journal text) */}
        {!isEditing && journal && (
          <div className="mt-16 space-y-12 border-t border-border/50 pt-12">
            {/* Gallery placeholder */}
            <div className="space-y-4">
              <h4 className="text-sm font-semibold tracking-wider text-muted-foreground uppercase">Moments & Vibes</h4>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                <div className="aspect-square bg-muted/30 rounded-xl border border-border/50 flex items-center justify-center text-muted-foreground/50 text-xs">
                  Photo Space
                </div>
                <div className="aspect-square bg-muted/30 rounded-xl border border-border/50 flex items-center justify-center text-muted-foreground/50 text-xs">
                  Photo Space
                </div>
              </div>
            </div>

            {/* Content Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              <div className="p-6 bg-purple-500/5 dark:bg-purple-500/10 border border-purple-100 dark:border-purple-900/30 rounded-2xl flex flex-col justify-between">
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-purple-600 dark:text-purple-400 mb-3">Daily Insight</h4>
                  <p className="text-sm text-foreground leading-relaxed">
                    {journal.insights?.[0] || "Every day is an opportunity to learn something new about yourself and your process."}
                  </p>
                </div>
              </div>
              
              <div className="p-6 bg-blue-500/5 dark:bg-blue-500/10 border border-blue-100 dark:border-blue-900/30 rounded-2xl flex flex-col justify-between">
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400 mb-3">Tomorrow's Intention</h4>
                  <p className="text-sm text-foreground leading-relaxed">
                    "Maintain the momentum and approach challenges with a clear, focused mind."
                  </p>
                </div>
              </div>

              <div className="p-6 bg-amber-500/5 dark:bg-amber-500/10 border border-amber-100 dark:border-amber-900/30 rounded-2xl flex flex-col justify-between">
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400 mb-3">Gratitude</h4>
                  <p className="text-sm text-foreground leading-relaxed">
                    "Grateful for the progress made today and the clarity that comes from deep, uninterrupted focus."
                  </p>
                </div>
              </div>
            </div>

            {/* Favorite Quote */}
            <div className="p-8 text-center italic text-muted-foreground border-y border-border/30">
              "{journal.quote || "The future depends on what you do today."}"
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
