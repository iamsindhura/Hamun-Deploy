"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TaskPriority, TaskType } from "@prisma/client";
import { Flag, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface CreateTaskDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: {
    title: string;
    startTime: Date;
    endTime: Date;
    priority: TaskPriority;
    taskType: TaskType;
  }) => Promise<{ success: boolean; error?: string }>;
}

export function CreateTaskDialog({ isOpen, onOpenChange, onSubmit }: CreateTaskDialogProps) {
  const [title, setTitle] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [priority, setPriority] = useState<TaskPriority>("NONE");
  const [taskType, setTaskType] = useState<TaskType>("GENERAL");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!title.trim() || !startTime || !endTime || !taskType || !priority) {
      setError("All fields are required.");
      return;
    }

    const start = new Date(startTime);
    const end = new Date(endTime);

    if (end <= start) {
      setError("End time must be after start time.");
      return;
    }

    setIsSubmitting(true);
    const result = await onSubmit({
      title: title.trim(),
      startTime: start,
      endTime: end,
      priority,
      taskType,
    });
    setIsSubmitting(false);

    if (result.success) {
      setTitle("");
      setStartTime("");
      setEndTime("");
      setPriority("NONE");
      setTaskType("GENERAL");
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
            <label className="text-sm font-semibold text-slate-700">Task Name</label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="What needs to be done?"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700">Start Time</label>
              <Input
                type="datetime-local"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700">End Time</label>
              <Input
                type="datetime-local"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-700">Task Type</label>
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

          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-700">Priority</label>
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant={priority === "HIGH" ? "default" : "outline"}
                className={priority === "HIGH" ? "bg-red-500 hover:bg-red-600 text-white" : "bg-white"}
                onClick={() => setPriority("HIGH")}
                size="sm"
              >
                <Flag className="w-3 h-3 mr-2" /> High
              </Button>
              <Button
                type="button"
                variant={priority === "MEDIUM" ? "default" : "outline"}
                className={priority === "MEDIUM" ? "bg-yellow-500 hover:bg-yellow-600 text-white" : "bg-white"}
                onClick={() => setPriority("MEDIUM")}
                size="sm"
              >
                <Flag className="w-3 h-3 mr-2" /> Medium
              </Button>
              <Button
                type="button"
                variant={priority === "LOW" ? "default" : "outline"}
                className={priority === "LOW" ? "bg-blue-500 hover:bg-blue-600 text-white" : "bg-white"}
                onClick={() => setPriority("LOW")}
                size="sm"
              >
                <Flag className="w-3 h-3 mr-2" /> Low
              </Button>
              <Button
                type="button"
                variant={priority === "NONE" ? "default" : "outline"}
                className={priority === "NONE" ? "bg-slate-500 hover:bg-slate-600 text-white" : "bg-white"}
                onClick={() => setPriority("NONE")}
                size="sm"
              >
                <Flag className="w-3 h-3 mr-2" /> None
              </Button>
            </div>
          </div>

          {error && <div className="text-sm text-red-500 font-medium">{error}</div>}

          <div className="pt-2 flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
              Create Task
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
