"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TaskPriority, TaskType } from "@prisma/client";
import { Flag, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { checkTimeConflict } from "@/app/actions/tasks";

interface CreateTaskDialogProps {
 isOpen: boolean;
 onOpenChange: (open: boolean) => void;
 onSubmit: (data: {
 title: string;
 startTime?: Date;
 endTime?: Date;
 priority: TaskPriority;
 taskType: TaskType;
 estimatedDurationMinutes?: number | null;
 }) => Promise<{ success: boolean; error?: string }>;
}

export function CreateTaskDialog({ isOpen, onOpenChange, onSubmit }: CreateTaskDialogProps) {
 const [title, setTitle] = useState("");
 const [startTime, setStartTime] = useState("");
 const [endTime, setEndTime] = useState("");
 const [priority, setPriority] = useState<TaskPriority>("NONE");
 const [taskType, setTaskType] = useState<TaskType>("GENERAL");
 const [estimatedDurationMinutes, setEstimatedDurationMinutes] = useState<string>("30");
 const [error, setError] = useState("");
 const [conflictError, setConflictError] = useState("");
 const [isSubmitting, setIsSubmitting] = useState(false);

 const getMinDateTime = () => {
 const now = new Date();
 now.setMinutes(now.getMinutes() + 1);
 const offset = now.getTimezoneOffset() * 60000;
 return (new Date(now.getTime() - offset)).toISOString().slice(0, 16);
 };
 const minDateTime = getMinDateTime();

 useEffect(() => {
 if (startTime && endTime) {
 const start = new Date(startTime);
 const end = new Date(endTime);
 if (start > new Date() && end > start) {
 checkTimeConflict(start, end).then(res => {
 if (!res.success && res.error) {
 setConflictError(res.error);
 } else {
 setConflictError("");
 }
 });
 } else {
 setConflictError("");
 }
 } else {
 setConflictError("");
 }
 }, [startTime, endTime]);

 const handleSubmit = async (e: React.FormEvent) => {
 e.preventDefault();
 setError("");

 if (!title.trim() || !taskType || !priority) {
 setError("Task name, type, and priority are required.");
 return;
 }

 let start: Date | undefined = undefined;
 let end: Date | undefined = undefined;

 if (startTime && endTime) {
 start = new Date(startTime);
 end = new Date(endTime);

 if (start <= new Date()) {
 setError("Tasks can only be scheduled in the future.");
 return;
 }

 if (end <= start) {
 setError("End time must be after start time.");
 return;
 }
 } else if (startTime || endTime) {
 setError("Both start and end time must be provided to schedule a task.");
 return;
 }

 setIsSubmitting(true);
 const result = await onSubmit({
 title: title.trim(),
 startTime: start,
 endTime: end,
 priority,
 taskType,
 estimatedDurationMinutes: estimatedDurationMinutes ? parseInt(estimatedDurationMinutes) : null,
 });
 setIsSubmitting(false);

 if (result.success) {
 setTitle("");
 setStartTime("");
 setEndTime("");
 setPriority("NONE");
 setTaskType("GENERAL");
 setEstimatedDurationMinutes("30");
 onOpenChange(false);
 } else {
 setError(result.error || "An error occurred.");
 }
 };

 return (
 <Dialog open={isOpen} onOpenChange={onOpenChange}>
 <DialogContent className="sm:max-w-md">
 <DialogHeader>
 <DialogTitle>Create Task</DialogTitle>
 <DialogDescription>
 Fill in the details below to create a new timeboxed task.
 </DialogDescription>
 </DialogHeader>

 <form onSubmit={handleSubmit} className="space-y-4 py-4">
 <div className="space-y-2">
 <label className="text-sm font-semibold text-muted-foreground">Task Name</label>
 <Input
 value={title}
 onChange={(e) => setTitle(e.target.value)}
 placeholder="What needs to be done?"
 required
 />
 </div>

 <div className="grid grid-cols-2 gap-4">
 <div className="space-y-2">
 <label className="text-sm font-semibold text-muted-foreground">Start Time (Optional)</label>
 <Input
 type="datetime-local"
 value={startTime}
 onChange={(e) => setStartTime(e.target.value)}
 min={minDateTime}
 />
 </div>
 <div className="space-y-2">
 <label className="text-sm font-semibold text-muted-foreground">End Time (Optional)</label>
 <Input
 type="datetime-local"
 value={endTime}
 onChange={(e) => setEndTime(e.target.value)}
 min={startTime || minDateTime}
 />
 </div>
 </div>

 <div className="space-y-2">
 <label className="text-sm font-semibold text-muted-foreground">Task Type</label>
 <Select value={taskType} onValueChange={(value) => setTaskType(value as TaskType)}>
 <SelectTrigger>
 <SelectValue placeholder="Select type" />
 </SelectTrigger>
 <SelectContent className="z-[200]">
 <SelectItem value="GENERAL">General</SelectItem>
 <SelectItem value="CRM">CRM</SelectItem>
 <SelectItem value="MEETING">Meeting</SelectItem>
 <SelectItem value="DEEP_WORK">Deep Work</SelectItem>
 <SelectItem value="HABIT">Habit</SelectItem>
 </SelectContent>
 </Select>
 </div>

 {!startTime && !endTime && (
 <div className="space-y-2">
 <label className="text-sm font-semibold text-muted-foreground">Estimated Duration (for auto-scheduling)</label>
 <Select value={estimatedDurationMinutes} onValueChange={(val) => setEstimatedDurationMinutes(val || "")}>
 <SelectTrigger>
 <SelectValue placeholder="Select duration" />
 </SelectTrigger>
 <SelectContent className="z-[200]">
 <SelectItem value="15">15m</SelectItem>
 <SelectItem value="30">30m</SelectItem>
 <SelectItem value="45">45m</SelectItem>
 <SelectItem value="60">1h</SelectItem>
 <SelectItem value="90">1h 30m</SelectItem>
 <SelectItem value="120">2h</SelectItem>
 </SelectContent>
 </Select>
 </div>
 )}

 <div className="space-y-2">
 <label className="text-sm font-semibold text-muted-foreground">Priority</label>
 <div className="flex flex-wrap gap-2">
 <Button
 type="button"
 variant={priority === "HIGH" ? "default" : "outline"}
 className={priority === "HIGH" ? "bg-red-500 hover:bg-red-600 text-white" : "bg-background"}
 onClick={() => setPriority("HIGH")}
 size="sm"
 >
 <Flag className="w-3 h-3 mr-2" /> High
 </Button>
 <Button
 type="button"
 variant={priority === "MEDIUM" ? "default" : "outline"}
 className={priority === "MEDIUM" ? "bg-yellow-500 hover:bg-yellow-600 text-white" : "bg-background"}
 onClick={() => setPriority("MEDIUM")}
 size="sm"
 >
 <Flag className="w-3 h-3 mr-2" /> Medium
 </Button>
 <Button
 type="button"
 variant={priority === "LOW" ? "default" : "outline"}
 className={priority === "LOW" ? "bg-blue-500 hover:bg-blue-600 text-white" : "bg-background"}
 onClick={() => setPriority("LOW")}
 size="sm"
 >
 <Flag className="w-3 h-3 mr-2" /> Low
 </Button>
 <Button
 type="button"
 variant={priority === "NONE" ? "default" : "outline"}
 className={priority === "NONE" ? "bg-slate-500 hover:bg-slate-600 text-white" : "bg-background"}
 onClick={() => setPriority("NONE")}
 size="sm"
 >
 <Flag className="w-3 h-3 mr-2" /> None
 </Button>
 </div>
 </div>

 {error && <div className="text-sm text-red-500 font-medium">{error}</div>}
 {conflictError && <div className="text-sm text-amber-500 bg-amber-500/10 p-3 rounded-md border border-amber-500/20 font-medium whitespace-pre-wrap">{conflictError}</div>}

 <div className="pt-2 flex justify-end gap-2">
 <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
 Cancel
 </Button>
 <Button type="submit" disabled={isSubmitting || !!conflictError}>
 {isSubmitting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
 Create Task
 </Button>
 </div>
 </form>
 </DialogContent>
 </Dialog>
 );
}
