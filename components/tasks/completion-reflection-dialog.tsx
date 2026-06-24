"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

interface CompletionReflectionDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (note: string) => void;
  onSkip: () => void;
}

export function CompletionReflectionDialog({
  isOpen,
  onClose,
  onSave,
  onSkip
}: CompletionReflectionDialogProps) {
  const [note, setNote] = useState("");

  const handleSave = () => {
    onSave(note);
    setNote("");
  };

  const handleSkip = () => {
    onSkip();
    setNote("");
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      if (!open) {
        setNote("");
        onClose();
      }
    }}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">Task Completed 🎉</DialogTitle>
          <DialogDescription className="text-slate-500">
            Take a moment to reflect. What did you accomplish?
          </DialogDescription>
        </DialogHeader>
        
        <div className="py-4">
          <Textarea 
            placeholder="Write your completion note here..."
            className="min-h-[150px] resize-y"
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />
        </div>

        <DialogFooter className="flex justify-between items-center sm:justify-between">
          <Button variant="ghost" onClick={handleSkip} className="text-slate-500 hover:text-slate-700">
            Skip
          </Button>
          <Button onClick={handleSave} className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold">
            Save & Complete
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
