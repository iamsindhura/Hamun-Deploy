"use client";

import { useState } from "react";
import { updateWorkdaySettings } from "@/app/actions/user";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Edit2 } from "lucide-react";

interface WorkdaySettingsCardProps {
  initialStart: string;
  initialEnd: string;
}

export function WorkdaySettingsCard({ initialStart, initialEnd }: WorkdaySettingsCardProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [start, setStart] = useState(initialStart);
  const [end, setEnd] = useState(initialEnd);
  const [isSaving, setIsSaving] = useState(false);

  const formatTime = (timeStr: string) => {
    const [h, m] = timeStr.split(":");
    const hour = parseInt(h, 10);
    const ampm = hour >= 12 ? "PM" : "AM";
    const formattedHour = hour % 12 || 12;
    return `${formattedHour.toString().padStart(2, "0")}:${m} ${ampm}`;
  };

  const handleSave = async () => {
    setIsSaving(true);
    const result = await updateWorkdaySettings(start, end);
    setIsSaving(false);

    if (result.success) {
      setIsOpen(false);
      toast.success("Workday settings updated");
    } else {
      toast.error(result.error || "Failed to update settings");
    }
  };

  return (
    <>
      <div 
        className="bg-indigo-50/50 rounded-2xl border border-indigo-100 p-6 shadow-sm flex flex-col justify-center min-h-[120px] group relative cursor-pointer hover:bg-indigo-50 hover:border-indigo-200 transition-colors"
        onClick={() => setIsOpen(true)}
      >
        <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
          <Edit2 className="h-4 w-4 text-indigo-400" />
        </div>
        <div className="text-xs font-semibold text-indigo-600/80 uppercase tracking-wider mb-2">Workday</div>
        <div className="text-xl font-bold text-indigo-900 leading-tight">
          {formatTime(initialStart)} <br />
          <span className="text-indigo-600/60 text-lg">to</span> {formatTime(initialEnd)}
        </div>
      </div>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Edit Workday</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="start" className="text-right">
                Start Time
              </Label>
              <Input
                id="start"
                type="time"
                value={start}
                onChange={(e) => setStart(e.target.value)}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="end" className="text-right">
                End Time
              </Label>
              <Input
                id="end"
                type="time"
                value={end}
                onChange={(e) => setEnd(e.target.value)}
                className="col-span-3"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsOpen(false)} disabled={isSaving}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
