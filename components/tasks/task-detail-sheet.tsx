"use client";

import { useEffect, useState, useRef } from "react";
import { Task, TaskPriority, TaskType } from "@prisma/client";
import { updateTask, deleteTask, createSubtask, updateSubtask, deleteSubtask, checkTimeConflict } from "@/app/actions/tasks";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Flag, Trash2, CheckCircle2, Circle, Plus } from "lucide-react";

interface TaskDetailSheetProps {
  task: any | null; // Using any to accept included subtasks
  onClose: () => void;
  onUpdate: (updatedTask: any) => void;
  onDelete: (taskId: string) => void;
  projectId: string;
}

export function TaskDetailSheet({ task, onClose, onUpdate, onDelete, projectId }: TaskDetailSheetProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<TaskPriority>("NONE");
  const [dueDate, setDueDate] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [taskType, setTaskType] = useState<TaskType>("GENERAL");
  const [subtasks, setSubtasks] = useState<any[]>([]);
  const [newSubtaskTitle, setNewSubtaskTitle] = useState("");
  const [error, setError] = useState("");
  const saveTimeout = useRef<NodeJS.Timeout | null>(null);
  
  useEffect(() => {
    if (task) {
      setTitle(task.title);
      setDescription(task.description || "");
      setPriority(task.priority);
      setTaskType(task.taskType || "GENERAL");
      setSubtasks(task.subtasks || []);
      if (task.dueDate) {
        const d = new Date(task.dueDate);
        const year = d.getUTCFullYear();
        const month = String(d.getUTCMonth() + 1).padStart(2, "0");
        const day = String(d.getUTCDate()).padStart(2, "0");
        setDueDate(`${year}-${month}-${day}`);
      } else {
        setDueDate("");
      }
      
      const formatLocalTime = (dateStr: string) => {
        const d = new Date(dateStr);
        // Format to YYYY-MM-DDThh:mm
        const offset = d.getTimezoneOffset() * 60000;
        const localISOTime = (new Date(d.getTime() - offset)).toISOString().slice(0, 16);
        return localISOTime;
      };

      setStartTime(task.startTime ? formatLocalTime(task.startTime) : "");
      setEndTime(task.endTime ? formatLocalTime(task.endTime) : "");
      setError("");
      setConflictError("");
    }
  }, [task]);

  const [conflictError, setConflictError] = useState("");

  useEffect(() => {
    if (startTime && endTime && task?.id) {
      const start = new Date(startTime);
      const end = new Date(endTime);
      if (start > new Date() && end > start) {
        checkTimeConflict(start, end, task.id).then(res => {
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
  }, [startTime, endTime, task?.id]);

  if (!task) return null;

  const handleSave = async (updates: Partial<any> = {}) => {
    const finalTitle = updates.title !== undefined ? updates.title : title;
    const finalDesc = updates.description !== undefined ? updates.description : description;
    const finalPriority = updates.priority !== undefined ? updates.priority : priority;
    const finalTaskType = updates.taskType !== undefined ? updates.taskType : taskType;
    
    let finalDueDate: Date | null = null;
    if (updates.dueDate !== undefined) {
      finalDueDate = updates.dueDate;
    } else {
      finalDueDate = dueDate ? new Date(dueDate) : null;
    }

    let finalStartTime: Date | null = updates.startTime !== undefined ? updates.startTime : (startTime ? new Date(startTime) : null);
    let finalEndTime: Date | null = updates.endTime !== undefined ? updates.endTime : (endTime ? new Date(endTime) : null);

    if (finalStartTime && finalStartTime <= new Date()) {
      setError("Tasks can only be scheduled in the future.");
      return;
    }

    if (finalStartTime && finalEndTime && finalEndTime <= finalStartTime) {
      setError("End time must be after start time.");
      return;
    }

    if (finalStartTime && finalEndTime && (updates.startTime !== undefined || updates.endTime !== undefined)) {
      const conflictRes = await checkTimeConflict(finalStartTime, finalEndTime, task.id);
      if (!conflictRes.success) {
        setConflictError(conflictRes.error || "Scheduling Conflict");
        return;
      }
      setConflictError("");
    }

    const updated = { 
      ...task, 
      title: finalTitle, 
      description: finalDesc, 
      priority: finalPriority, 
      dueDate: finalDueDate,
      taskType: finalTaskType,
      startTime: finalStartTime,
      endTime: finalEndTime
    };

    onUpdate(updated);

    if (saveTimeout.current) clearTimeout(saveTimeout.current);
    saveTimeout.current = setTimeout(async () => {
      const result = await updateTask(task.id, projectId, { 
        title: finalTitle, 
        description: finalDesc, 
        priority: finalPriority,
        dueDate: finalDueDate,
        taskType: finalTaskType,
        startTime: finalStartTime,
        endTime: finalEndTime
      });
      if (!result.success) {
        setError(result.error || "Failed to update task");
      } else {
        setError("");
      }
    }, 500);
  };

  const handleDueDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setDueDate(val);
    const parsedDate = val ? new Date(val) : null;
    handleSave({ dueDate: parsedDate });
  };

  const handlePriorityChange = (newPriority: TaskPriority) => {
    setPriority(newPriority);
    handleSave({ priority: newPriority });
  };

  const handleTaskTypeChange = (newType: string | null) => {
    if (!newType) return;
    setTaskType(newType as TaskType);
    handleSave({ taskType: newType as TaskType });
  };

  const handleTimeChange = (type: "start" | "end", val: string) => {
    if (type === "start") {
      setStartTime(val);
      handleSave({ startTime: val ? new Date(val) : null });
    } else {
      setEndTime(val);
      handleSave({ endTime: val ? new Date(val) : null });
    }
  };

  const handleDelete = async () => {
    onDelete(task.id); // optimistic
    await deleteTask(task.id, projectId);
    onClose();
  };

  const handleAddSubtask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubtaskTitle.trim()) return;
    const tempId = `temp-sub-${Date.now()}`;
    const newSubtask = { id: tempId, title: newSubtaskTitle.trim(), isCompleted: false, taskId: task.id, position: subtasks.length };
    setSubtasks([...subtasks, newSubtask]);
    setNewSubtaskTitle("");

    const res = await createSubtask({ title: newSubtask.title, taskId: task.id, projectId, position: newSubtask.position });
    if (res.success && res.data) {
      setSubtasks(prev => prev.map(s => s.id === tempId ? res.data : s));
      onUpdate({ ...task, subtasks: [...subtasks.filter(s => s.id !== tempId), res.data] });
    }
  };

  const toggleSubtask = async (subtaskId: string, isCompleted: boolean) => {
    const updatedSubtasks = subtasks.map(s => s.id === subtaskId ? { ...s, isCompleted: !isCompleted } : s);
    setSubtasks(updatedSubtasks);
    onUpdate({ ...task, subtasks: updatedSubtasks });
    await updateSubtask(subtaskId, projectId, { isCompleted: !isCompleted });
  };

  const handleDeleteSubtask = async (subtaskId: string) => {
    const updatedSubtasks = subtasks.filter(s => s.id !== subtaskId);
    setSubtasks(updatedSubtasks);
    onUpdate({ ...task, subtasks: updatedSubtasks });
    await deleteSubtask(subtaskId, projectId);
  };

  const getMinDateTime = () => {
    const now = new Date();
    now.setMinutes(now.getMinutes() + 1);
    const offset = now.getTimezoneOffset() * 60000;
    return (new Date(now.getTime() - offset)).toISOString().slice(0, 16);
  };
  const minDateTime = getMinDateTime();

  return (
    <Sheet open={!!task} onOpenChange={(open) => !open && onClose()}>
      <SheetContent 
        overlayClassName="bg-black/95" 
        darkHeader={true}
        className="data-[side=right]:sm:max-w-3xl flex flex-col h-full z-[100] p-0 overflow-hidden bg-white"
      >
        <div className="px-6 py-2 bg-gradient-to-r from-primary to-blue-800 border-none shrink-0 shadow-sm">
          <SheetHeader className="p-0">
            <SheetTitle className="text-lg font-black tracking-tight text-white">Task Details</SheetTitle>
            <SheetDescription className="sr-only">Edit your task details</SheetDescription>
          </SheetHeader>
        </div>
        
        <div className="flex-1 overflow-y-auto px-6 py-6 space-y-8">
          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-700">Task Title</label>
            <Input 
              className="text-base font-medium h-12 bg-white"
              value={title} 
              onChange={(e) => setTitle(e.target.value)} 
              onBlur={() => handleSave({ title })}
              placeholder="Task title..."
            />
          </div>

          {task.contact && (
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700">Linked Contact</label>
              <div className="flex items-center gap-2 p-3 bg-slate-50 border rounded-lg">
                <div className="h-8 w-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-sm">
                  {task.contact.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <div className="text-sm font-medium">{task.contact.name}</div>
                  {task.contact.company && <div className="text-xs text-muted-foreground">{task.contact.company}</div>}
                </div>
              </div>
            </div>
          )}

          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-700">Description</label>
            <textarea 
              className="flex min-h-[120px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              placeholder="Add details..."
              value={description} 
              onChange={(e) => setDescription(e.target.value)}
              onBlur={() => handleSave({ description })}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-700">Due Date</label>
            <Input 
              type="date"
              className="text-base font-medium h-12 bg-white"
              value={dueDate}
              onChange={handleDueDateChange}
              min={new Date().toISOString().split('T')[0]}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700">Start Time</label>
              <Input 
                type="datetime-local"
                className="text-base font-medium h-12 bg-white"
                value={startTime}
                onChange={(e) => handleTimeChange("start", e.target.value)}
                min={minDateTime}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700">End Time</label>
              <Input 
                type="datetime-local"
                className="text-base font-medium h-12 bg-white"
                value={endTime}
                onChange={(e) => handleTimeChange("end", e.target.value)}
                min={startTime || minDateTime}
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-700">Task Type</label>
            <Select value={taskType} onValueChange={(val) => {
              console.log("Dropdown selected value:", val, "Current taskType state:", taskType);
              handleTaskTypeChange(val);
            }}>
              <SelectTrigger className="h-12 bg-white">
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
                variant={priority === "HIGH" ? "default" : "outline"}
                className={priority === "HIGH" ? "bg-red-500 hover:bg-red-600 text-white" : "bg-white"}
                onClick={() => handlePriorityChange("HIGH")}
                size="sm"
              >
                <Flag className="w-3 h-3 mr-2" /> High
              </Button>
              <Button 
                variant={priority === "MEDIUM" ? "default" : "outline"}
                className={priority === "MEDIUM" ? "bg-yellow-500 hover:bg-yellow-600 text-white" : "bg-white"}
                onClick={() => handlePriorityChange("MEDIUM")}
                size="sm"
              >
                <Flag className="w-3 h-3 mr-2" /> Medium
              </Button>
              <Button 
                variant={priority === "LOW" ? "default" : "outline"}
                className={priority === "LOW" ? "bg-blue-500 hover:bg-blue-600 text-white" : "bg-white"}
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

          <div className="space-y-3">
            <label className="text-sm font-semibold text-slate-700">Subtasks</label>
            <div className="space-y-2">
              {subtasks.map((st: any) => (
                <div key={st.id} className="flex items-center gap-2 group bg-white border p-2 rounded-lg shadow-sm">
                  <button onClick={() => toggleSubtask(st.id, st.isCompleted)} className="text-muted-foreground hover:text-primary transition-colors flex-shrink-0">
                    {st.isCompleted ? <CheckCircle2 className="h-5 w-5 text-primary" /> : <Circle className="h-5 w-5" />}
                  </button>
                  <span className={`flex-1 text-sm ${st.isCompleted ? 'text-muted-foreground line-through' : 'text-foreground'}`}>
                    {st.title}
                  </span>
                  <button onClick={() => handleDeleteSubtask(st.id)} className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-all">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
            <form onSubmit={handleAddSubtask} className="flex items-center gap-2 mt-2">
              <Input
                placeholder="Add a new subtask..."
                value={newSubtaskTitle}
                onChange={(e) => setNewSubtaskTitle(e.target.value)}
                className="bg-white"
              />
              <Button type="submit" size="icon" disabled={!newSubtaskTitle.trim()}>
                <Plus className="h-4 w-4" />
              </Button>
            </form>
          </div>
          {error && <div className="text-sm text-red-500 font-medium p-2 bg-red-50 rounded-md">{error}</div>}
          {conflictError && <div className="text-sm text-amber-600 bg-amber-50 p-3 rounded-md border border-amber-200 font-medium whitespace-pre-wrap">{conflictError}</div>}
        </div>

        <div className="p-4 border-t bg-white flex items-center justify-between mt-auto">
          <Button variant="destructive" onClick={handleDelete}>
            <Trash2 className="w-4 h-4 mr-2" /> Delete Task
          </Button>
          <Button onClick={onClose} disabled={!!conflictError}>Save</Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
