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
import { Edit2, Clock } from "lucide-react";

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
 onClick={() => setIsOpen(true)}
 className="rounded-2xl border border-border border-l-[4px] border-l-[#6366F1] bg-card hover:bg-muted p-5 shadow-sm flex flex-col justify-between gap-3 min-h-[100px] cursor-pointer transition-all hover:shadow-lg hover:-translate-y-1 group relative"
 >
 <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
 <Edit2 className="h-4 w-4 text-muted-foreground" />
 </div>
 <div className="flex items-center gap-2">
 <Clock className="w-4 h-4 text-[#6366F1]" />
 <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Workday</span>
 </div>
 <div className="flex flex-col mt-1">
 <span className="text-2xl font-black text-foreground leading-none">
 {formatTime(initialStart)}
 </span>
 <span className="text-sm font-bold text-muted-foreground mt-1.5">
 to {formatTime(initialEnd)}
 </span>
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
