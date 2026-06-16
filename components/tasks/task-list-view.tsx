"use client";

import { useState } from "react";
import { CheckCircle2, Circle, Calendar, Flag } from "lucide-react";
import { cn } from "@/lib/utils";
import { TaskDetailSheet } from "./task-detail-sheet";
import { updateTask, deleteTask } from "@/app/actions/tasks";
import { createActivity } from "@/app/actions/activities";
import { FollowUpDialog } from "@/components/tasks/follow-up-dialog";

interface TaskListViewProps {
  tasks: any[];
  showDate?: boolean;
}

export function TaskListView({ tasks: initialTasks, showDate = false }: TaskListViewProps) {
  const [tasks, setTasks] = useState(initialTasks);
  const [selectedTask, setSelectedTask] = useState<any | null>(null);

  const [showFollowUpDialog, setShowFollowUpDialog] = useState(false);
  const [activeFollowUpTask, setActiveFollowUpTask] = useState<any | null>(null);

  const handleToggleCompletion = async (taskId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;

    const isCompleting = !task.isCompleted;

    if (isCompleting && task.project?.name === "Follow Ups" && task.contactId) {
      setActiveFollowUpTask(task);
      setShowFollowUpDialog(true);
      return;
    }

    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, isCompleted: isCompleting } : t));
    await updateTask(taskId, task.projectId, { isCompleted: isCompleting });
  };

  const handleFollowUpMethod = async (method: "CALL" | "EMAIL" | "MEETING" | "NONE", notes?: string) => {
    setShowFollowUpDialog(false);
    if (!activeFollowUpTask) return;

    const task = activeFollowUpTask;
    setTasks(prev => prev.map(t => t.id === task.id ? { ...t, isCompleted: true } : t));
    
    if (method === "NONE") {
      await updateTask(task.id, task.projectId, { isCompleted: true });
    } else {
      const baseContent = method === "CALL" ? "Follow-up call completed" 
                    : method === "EMAIL" ? "Follow-up email sent" 
                    : "Follow-up meeting completed";
      
      const content = notes ? `${baseContent}\n\n${notes}` : baseContent;
      // Cast to any to bypass strict type checking for the Prisma enum imported in the actions file
      await createActivity(task.contactId, method as any, content);
    }
    setActiveFollowUpTask(null);
  };

  const handleDeleteTask = async (taskId: string) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;
    
    setTasks(prev => prev.filter(t => t.id !== taskId));
    // The actual deletion API call happens inside TaskDetailSheet's handleDelete
    // which calls the passed onDelete callback and the server action.
  };

  if (tasks.length === 0) {
    return (
      <div className="text-center text-muted-foreground mt-10">
        No tasks found.
      </div>
    );
  }

  return (
    <>
      <div className="mx-auto max-w-3xl space-y-4">
        {tasks.map(task => (
          <div 
            key={task.id} 
            onClick={() => setSelectedTask(task)}
            className="flex items-center justify-between rounded-lg border bg-card p-4 shadow-sm hover:shadow-md hover:border-primary/20 cursor-pointer transition-all"
          >
            <div className="flex items-center gap-3">
              <button 
                onClick={(e) => handleToggleCompletion(task.id, e)}
                className="text-muted-foreground hover:text-primary transition-colors"
              >
                {task.isCompleted ? <CheckCircle2 className="h-5 w-5 text-primary" /> : <Circle className="h-5 w-5" />}
              </button>
              <div>
                <div className={cn("font-medium transition-all", task.isCompleted && "text-muted-foreground line-through")}>
                  {task.title}
                </div>
                <div className="text-xs text-muted-foreground flex items-center gap-2 mt-1">
                  {showDate && task.dueDate && (
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {new Date(task.dueDate).toLocaleDateString()}
                    </span>
                  )}
                  {task.project?.name && (
                    <span className="bg-muted px-1.5 py-0.5 rounded text-primary/80">
                      {task.project.name}
                    </span>
                  )}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              {task.priority !== "NONE" && (
                <Flag className={cn("h-4 w-4", task.priority === "HIGH" ? "text-red-500" : task.priority === "MEDIUM" ? "text-yellow-500" : "text-blue-500")} />
              )}
            </div>
          </div>
        ))}
      </div>

      {selectedTask && (
        <TaskDetailSheet
          task={selectedTask}
          projectId={selectedTask.projectId}
          onClose={() => setSelectedTask(null)}
          onUpdate={(taskId, updates) => {
            setTasks(prev => prev.map(t => t.id === taskId ? { ...t, ...updates } : t));
          }}
          onDelete={handleDeleteTask}
        />
      )}

      {showFollowUpDialog && activeFollowUpTask && (
        <FollowUpDialog 
          isOpen={showFollowUpDialog} 
          onOpenChange={setShowFollowUpDialog} 
          onSelectMethod={handleFollowUpMethod} 
          contactName={activeFollowUpTask.title.replace("Follow up with ", "")} 
        />
      )}
    </>
  );
}
