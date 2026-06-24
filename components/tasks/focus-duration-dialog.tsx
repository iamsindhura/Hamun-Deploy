"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Play } from "lucide-react";

interface FocusDurationDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  taskTitle: string;
  defaultDuration?: number | null;
  onStart: (durationMinutes: number) => void;
}

const DURATIONS = [
  { value: 15, label: "15m" },
  { value: 25, label: "25m" },
  { value: 30, label: "30m" },
  { value: 45, label: "45m" },
  { value: 60, label: "60m" },
  { value: 90, label: "90m" },
  { value: 120, label: "120m" },
];

export function FocusDurationDialog({ isOpen, onOpenChange, taskTitle, defaultDuration, onStart }: FocusDurationDialogProps) {
  const [duration, setDuration] = useState<string>("30");

  useEffect(() => {
    if (isOpen) {
      if (defaultDuration && DURATIONS.some(d => d.value === defaultDuration)) {
        setDuration(String(defaultDuration));
      } else {
        setDuration("30");
      }
    }
  }, [isOpen, defaultDuration]);

  const handleStart = () => {
    onStart(parseInt(duration, 10));
    onOpenChange(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Start Focus Session</DialogTitle>
          <DialogDescription className="text-sm font-medium text-slate-800 break-words mt-2">
            {taskTitle}
          </DialogDescription>
        </DialogHeader>

        <div className="py-4 space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-700">Select Duration</label>
            <Select value={duration} onValueChange={(val) => setDuration(val || "")}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select duration" />
              </SelectTrigger>
              <SelectContent className="z-[200]">
                {DURATIONS.map(d => (
                  <SelectItem key={d.value} value={String(d.value)}>{d.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <Button onClick={handleStart} className="w-full font-bold bg-indigo-600 hover:bg-indigo-700 text-white">
            <Play className="w-4 h-4 mr-2 fill-current" /> Start Focus Session
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
