"use client";

import { useState, useEffect } from "react";
import { generateJournal, saveJournal } from "@/app/actions/journal";
import { Button } from "@/components/ui/button";
import { Loader2, Sparkles, Save, Edit2, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const MOODS = [
  { emoji: "😊", label: "Amazing", value: "Amazing" },
  { emoji: "🙂", label: "Good", value: "Good" },
  { emoji: "😐", label: "Okay", value: "Okay" },
  { emoji: "😔", label: "Tired", value: "Tired" },
  { emoji: "😢", label: "Bad", value: "Bad" }
];

export function JournalEditor({ journal: initialJournal }: { journal: any }) {
  const [journal, setJournal] = useState(initialJournal);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editedText, setEditedText] = useState("");
  const [selectedMood, setSelectedMood] = useState("Good");

  useEffect(() => {
    setJournal(initialJournal);
    if (initialJournal) {
      setEditedText(initialJournal.editedText || initialJournal.originalText);
    }
  }, [initialJournal]);

  const handleGenerate = async () => {
    try {
      setIsGenerating(true);
      const res = await generateJournal(selectedMood);
      if (res.success) {
        setJournal(res.journal);
        setEditedText(res.journal.originalText);
        toast.success("Journal generated successfully!");
      }
    } catch (e) {
      toast.error("Failed to generate journal");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSave = async () => {
    if (!journal) return;
    try {
      setIsSaving(true);
      const res = await saveJournal(journal.id, editedText);
      if (res.success) {
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
      <div className="p-4 border-b border-border flex items-center justify-between bg-muted/30">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-purple-500" />
          <span className="font-bold text-sm tracking-wide uppercase text-foreground">Today's Reflection</span>
        </div>
        <div className="flex gap-2">
          {!isEditing ? (
            <>
              <Button variant="outline" size="sm" onClick={handleGenerate} className="text-xs">
                <Sparkles className="h-3 w-3 mr-2" /> Regenerate
              </Button>
              <Button variant="outline" size="sm" onClick={() => setIsEditing(true)} className="text-xs">
                <Edit2 className="h-3 w-3 mr-2" /> Edit
              </Button>
            </>
          ) : (
            <>
              <Button variant="ghost" size="sm" onClick={() => {
                setIsEditing(false);
                setEditedText(journal.editedText || journal.originalText);
              }} className="text-xs">
                Cancel
              </Button>
              <Button size="sm" onClick={handleSave} disabled={isSaving} className="text-xs bg-purple-600 hover:bg-purple-700 text-white">
                {isSaving ? <Loader2 className="h-3 w-3 mr-2 animate-spin" /> : <Save className="h-3 w-3 mr-2" />}
                Save Changes
              </Button>
            </>
          )}
        </div>
      </div>

      <div className="p-6 sm:p-8">
        {isEditing ? (
          <textarea
            value={editedText}
            onChange={(e) => setEditedText(e.target.value)}
            className="w-full min-h-[400px] p-4 bg-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 text-base leading-relaxed text-foreground resize-y"
          />
        ) : (
          <div className="prose prose-slate dark:prose-invert max-w-none space-y-6">
            {(journal.editedText || journal.originalText).split('\n\n').map((paragraph: string, i: number) => (
              <p key={i} className="text-[17px] leading-relaxed text-foreground/90 font-medium">
                {paragraph}
              </p>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
