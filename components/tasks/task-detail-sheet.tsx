"use client";

import { useEffect, useState, useRef } from "react";
import { Task, TaskPriority } from "@prisma/client";
import { updateTask, deleteTask } from "@/app/actions/tasks";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Flag, Trash2 } from "lucide-react";

interface TaskDetailSheetProps {
  task: Task | null;
  onClose: () => void;
  onUpdate: (updatedTask: Task) => void;
  onDelete: (taskId: string) => void;
  projectId: string;
}

export function TaskDetailSheet({ task, onClose, onUpdate, onDelete, projectId }: TaskDetailSheetProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<TaskPriority>("NONE");
  const saveTimeout = useRef<NodeJS.Timeout | null>(null);
  
  useEffect(() => {
    if (task) {
      setTitle(task.title);
      setDescription(task.description || "");
      setPriority(task.priority);
    }
  }, [task]);

  if (!task) return null;

  const handleSave = async (updates: Partial<Task> = {}) => {
    const finalTitle = updates.title !== undefined ? updates.title : title;
    const finalDesc = updates.description !== undefined ? updates.description : description;
    const finalPriority = updates.priority !== undefined ? updates.priority : priority;

    const updated = { ...task, title: finalTitle, description: finalDesc, priority: finalPriority };
    onUpdate(updated); // optimistic

    if (saveTimeout.current) clearTimeout(saveTimeout.current);
    saveTimeout.current = setTimeout(async () => {
      await updateTask(task.id, projectId, { 
        title: finalTitle, 
        description: finalDesc, 
        priority: finalPriority 
      });
    }, 500);
  };

  const handlePriorityChange = (newPriority: TaskPriority) => {
    setPriority(newPriority);
    handleSave({ priority: newPriority });
  };

  const handleDelete = async () => {
    onDelete(task.id); // optimistic
    await deleteTask(task.id, projectId);
    onClose();
  };

  return (
    <Sheet open={!!task} onOpenChange={(open) => !open && onClose()}>
      <SheetContent className="sm:max-w-md flex flex-col h-full z-[100]">
        <SheetHeader>
          <SheetTitle>Task Details</SheetTitle>
          <SheetDescription className="sr-only">Edit your task details</SheetDescription>
        </SheetHeader>
        
        <div className="flex-1 overflow-y-auto py-4 space-y-6">
          <div className="space-y-2">
            <label className="text-sm font-medium">Title</label>
            <Input 
              value={title} 
              onChange={(e) => setTitle(e.target.value)} 
              onBlur={() => handleSave({ title })}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Description</label>
            <textarea 
              className="flex min-h-[120px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              placeholder="Add details..."
              value={description} 
              onChange={(e) => setDescription(e.target.value)}
              onBlur={() => handleSave({ description })}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Priority</label>
            <div className="flex flex-wrap gap-2">
              <Button 
                variant={priority === "HIGH" ? "default" : "outline"}
                className={priority === "HIGH" ? "bg-red-500 hover:bg-red-600 text-white" : ""}
                onClick={() => handlePriorityChange("HIGH")}
                size="sm"
              >
                <Flag className="w-3 h-3 mr-2" /> High
              </Button>
              <Button 
                variant={priority === "MEDIUM" ? "default" : "outline"}
                className={priority === "MEDIUM" ? "bg-yellow-500 hover:bg-yellow-600 text-white" : ""}
                onClick={() => handlePriorityChange("MEDIUM")}
                size="sm"
              >
                <Flag className="w-3 h-3 mr-2" /> Medium
              </Button>
              <Button 
                variant={priority === "LOW" ? "default" : "outline"}
                className={priority === "LOW" ? "bg-blue-500 hover:bg-blue-600 text-white" : ""}
                onClick={() => handlePriorityChange("LOW")}
                size="sm"
              >
                <Flag className="w-3 h-3 mr-2" /> Low
              </Button>
              {priority !== "NONE" && (
                <Button 
                  variant="ghost"
                  onClick={() => handlePriorityChange("NONE")}
                  size="sm"
                >
                  Clear
                </Button>
              )}
            </div>
          </div>
        </div>

        <div className="border-t pt-4 flex justify-between">
          <Button variant="destructive" onClick={handleDelete}>
            <Trash2 className="w-4 h-4 mr-2" /> Delete Task
          </Button>
          <Button onClick={onClose}>Done</Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
