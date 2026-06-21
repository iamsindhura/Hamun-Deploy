"use client";

import { useState } from "react";
import { CheckCircle2, Circle, Calendar, Flag, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { TaskDetailSheet } from "./task-detail-sheet";
import { updateTask, deleteTask, recoverOverdueTask } from "@/app/actions/tasks";
import { toast } from "sonner";
import { ArrowRight, Clock, X } from "lucide-react";
import { createActivity } from "@/app/actions/activities";
import { FollowUpDialog } from "@/components/tasks/follow-up-dialog";

interface TaskListViewProps {
  tasks: any[];
  showDate?: boolean;
  variant?: "default" | "completed" | "overdue";
}

export function TaskListView({ tasks: initialTasks, showDate = false, variant = "default" }: TaskListViewProps) {
  const [tasks, setTasks] = useState(initialTasks);
  const [selectedTask, setSelectedTask] = useState<any | null>(null);
  const [ignoredTaskIds, setIgnoredTaskIds] = useState<Set<string>>(new Set());
  const [recoveringTaskId, setRecoveringTaskId] = useState<string | null>(null);

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
        {tasks.map((task) => {
          const isOverdue = !task.isCompleted && task.endTime && new Date(task.endTime) < new Date();
          const isCompleted = task.isCompleted;
          const isIgnored = ignoredTaskIds.has(task.id);
          const showRecoveryOptions = isOverdue && !isIgnored;
          
          let cardStyles = "border-slate-200 bg-white hover:border-primary/20 hover:shadow-md";
          if (isCompleted) {
            cardStyles = "bg-[#ECFDF5] border-[#22C55E]";
          } else if (isOverdue) {
            cardStyles = "bg-[#FEF2F2] border-[#EF4444]";
          }

          return (
            <div 
              key={task.id} 
              onClick={() => setSelectedTask(task)}
              className={cn("flex flex-col rounded-xl border p-4 shadow-sm cursor-pointer transition-all gap-3 min-h-[120px] justify-center", cardStyles)}
            >
              <div className="flex items-start gap-3">
                {isCompleted ? (
                  <div className="mt-0.5 shrink-0 cursor-pointer" onClick={(e) => handleToggleCompletion(task.id, e as any)}>
                    <CheckCircle2 className="h-5 w-5 text-[#22C55E]" />
                  </div>
                ) : (
                  <button 
                    onClick={(e) => handleToggleCompletion(task.id, e as any)}
                    className="mt-0.5 text-slate-400 hover:text-primary transition-colors shrink-0"
                  >
                    <Circle className="h-5 w-5" />
                  </button>
                )}
                
                <div className="flex flex-col gap-2.5 flex-1 min-w-0">
                  {/* 1. Task Title */}
                  <div className={cn("font-bold text-[16px] leading-snug break-all", isCompleted ? "text-emerald-900" : isOverdue ? "text-red-900" : "text-slate-800")}>
                    {task.title}
                  </div>

                  {/* 2. Time Block */}
                  {(task.startTime && task.endTime) ? (
                    <div className="flex items-center gap-1.5 text-sm font-medium text-slate-600">
                      <Calendar className="h-4 w-4 opacity-70" />
                      {new Date(task.startTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})} - {new Date(task.endTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                    </div>
                  ) : showDate && !task.startTime && task.dueDate ? (
                    <div className="flex items-center gap-1.5 text-sm font-medium text-slate-600">
                      <Calendar className="h-4 w-4 opacity-70" />
                      {new Date(task.dueDate).toLocaleDateString()}
                    </div>
                  ) : null}

                  {/* Optional Badges (Variant tracking) */}
                  {variant === "completed" && task.completedAt && (
                    <div className="flex items-center gap-1.5 text-sm font-bold text-emerald-700">
                      <CheckCircle2 className="h-4 w-4" />
                      Completed: {new Date(task.completedAt).toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' })} {new Date(task.completedAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                    </div>
                  )}
                  {variant === "overdue" && task.endTime && (
                    <div className="flex items-center gap-1.5 text-sm font-bold text-red-700">
                      <AlertCircle className="h-4 w-4" />
                      Delayed: {Math.max(1, Math.floor((Date.now() - new Date(task.endTime).getTime()) / (1000 * 60 * 60 * 24)))} Days
                    </div>
                  )}

                  {/* 3. Project Name */}
                  {task.project?.name && (
                    <div className="flex items-center gap-1.5 text-sm font-medium text-slate-500">
                      📁 {task.project.name}
                    </div>
                  )}

                  {/* 4. Metadata Row */}
                  {(task.taskType && task.taskType !== "GENERAL" || task.priority !== "NONE") && (
                    <div className="flex items-center gap-2 mt-1">
                      {task.taskType && task.taskType !== "GENERAL" && (
                        <span className="bg-white/60 px-2 py-0.5 rounded border text-xs font-bold text-slate-600 tracking-wide uppercase">
                          [{task.taskType}]
                        </span>
                      )}
                      {task.priority !== "NONE" && (
                        <span className="bg-white/60 px-2 py-0.5 rounded border text-xs font-bold text-slate-600 tracking-wide uppercase flex items-center gap-1">
                          <Flag className={cn("h-3 w-3", task.priority === "HIGH" ? "text-red-500" : task.priority === "MEDIUM" ? "text-yellow-500" : "text-blue-500")} />
                          [{task.priority}]
                        </span>
                      )}
                    </div>
                  )}

                  {/* Recovery Options Bar */}
                  {showRecoveryOptions && (
                    <div className="mt-2 pt-3 border-t border-red-200/60 flex items-center gap-2" onClick={e => e.stopPropagation()}>
                      <button
                        onClick={async (e) => {
                          e.stopPropagation();
                          setRecoveringTaskId(task.id);
                          const result = await recoverOverdueTask(task.id, 'MOVE_TOMORROW');
                          setRecoveringTaskId(null);
                          if (result.success) {
                            toast.success("Task moved to tomorrow successfully");
                            setTasks(prev => prev.filter(t => t.id !== task.id));
                          } else {
                            toast.error(result.error);
                          }
                        }}
                        disabled={recoveringTaskId === task.id}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-red-100 hover:bg-red-200 text-red-700 text-xs font-bold rounded-md transition-colors"
                      >
                        {recoveringTaskId === task.id ? "Moving..." : <><ArrowRight className="h-3.5 w-3.5" /> Move to Tomorrow</>}
                      </button>
                      <button
                        onClick={async (e) => {
                          e.stopPropagation();
                          setRecoveringTaskId(task.id);
                          const result = await recoverOverdueTask(task.id, 'MOVE_NEXT_FREE_SLOT');
                          setRecoveringTaskId(null);
                          if (result.success) {
                            toast.success("Task moved to next free slot successfully");
                            setTasks(prev => prev.filter(t => t.id !== task.id));
                          } else {
                            toast.error(result.error);
                          }
                        }}
                        disabled={recoveringTaskId === task.id}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-red-200 hover:bg-red-50 text-red-700 text-xs font-bold rounded-md transition-colors"
                      >
                        {recoveringTaskId === task.id ? "Moving..." : <><Clock className="h-3.5 w-3.5" /> Move to Next Free Slot</>}
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setIgnoredTaskIds(prev => {
                            const next = new Set(prev);
                            next.add(task.id);
                            return next;
                          });
                        }}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-700 text-xs font-bold rounded-md transition-colors ml-auto"
                      >
                        <X className="h-3.5 w-3.5" /> Ignore
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {selectedTask && (
        <TaskDetailSheet
          task={selectedTask}
          projectId={selectedTask.projectId}
          onClose={() => setSelectedTask(null)}
          onUpdate={(updatedTask) => {
            setTasks(prev => prev.map(t => t.id === updatedTask.id ? { ...t, ...updatedTask } : t));
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
