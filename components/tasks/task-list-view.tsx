"use client";

import { useState, useEffect } from "react";
import { CheckCircle2, Circle, Calendar, Flag, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { TaskDetailSheet } from "./task-detail-sheet";
import { updateTask, deleteTask, recoverOverdueTask } from "@/app/actions/tasks";
import { toast } from "sonner";
import { ArrowRight, Clock, X, Play, ArrowDown } from "lucide-react";
import { createActivity } from "@/app/actions/activities";
import { FollowUpDialog } from "@/components/tasks/follow-up-dialog";
import { useTaskReminders } from "@/components/providers/task-reminder-provider";
import Link from "next/link";

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

  const { setGlobalTasks } = useTaskReminders();

  useEffect(() => {
    setGlobalTasks(tasks);
  }, [tasks, setGlobalTasks]);

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
          
          let cardStyles = "border-slate-200 bg-white hover:border-primary/40 hover:shadow-lg";

          return (
            <div 
              key={task.id} 
              onClick={() => setSelectedTask(task)}
              className="flex flex-row rounded-2xl border border-slate-200/80 bg-white overflow-hidden shadow-sm cursor-pointer transition-all duration-300 ease-in-out hover:-translate-y-[1px] hover:shadow-md hover:border-slate-300 group"
            >
              {/* LEFT PANEL */}
              <div className="w-[110px] sm:w-[130px] shrink-0 bg-[#FFF6CC] text-[#B8860B] p-3 sm:p-4 flex flex-col justify-center items-center border-r border-[#FDE68A]/60">
                <div className="flex flex-col items-center justify-center gap-1.5 text-sm font-bold tracking-tight">
                  <span className="text-[14px] leading-none">{task.startTime ? new Date(task.startTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : "--:--"}</span>
                  <div className="h-4 flex items-center justify-center opacity-50">
                    <ArrowDown className="w-4 h-4" />
                  </div>
                  <span className="text-[14px] leading-none">{task.endTime ? new Date(task.endTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : "--:--"}</span>
                </div>
              </div>

              {/* RIGHT PANEL */}
              <div className="flex-1 p-3 sm:p-4 flex flex-col min-w-0 bg-white justify-center">
                <div className="flex items-start gap-3">
                  {isCompleted ? (
                    <div className="mt-[2px] shrink-0 cursor-pointer" onClick={(e) => handleToggleCompletion(task.id, e as any)}>
                      <CheckCircle2 className="h-5 w-5 text-[#22C55E]" />
                    </div>
                  ) : (
                    <button 
                      onClick={(e) => handleToggleCompletion(task.id, e as any)}
                      className="mt-[2px] text-slate-400 hover:text-primary transition-colors shrink-0"
                    >
                      <Circle className="h-5 w-5" />
                    </button>
                  )}
                  <div className={cn("font-bold text-[18px] leading-snug break-all", isCompleted ? "text-slate-500 line-through opacity-70" : "text-slate-800")}>
                    {task.title}
                  </div>
                </div>

                <div className="pl-8 flex flex-col gap-1.5 mt-1.5">
                  {/* Row 2: Project */}
                  {task.project?.name && (
                    <div className="flex items-center gap-1.5 text-[14.5px] font-medium text-slate-500">
                      🏢 {task.project.name}
                    </div>
                  )}

                  {/* Row 3: Priority Badge + Optional Variants */}
                  <div className="flex flex-wrap items-center gap-2 mt-1">
                    <span className="bg-[#F8FAFC] text-slate-600 border border-slate-200 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider flex items-center gap-1">
                       {task.taskType || "GENERAL"}
                    </span>

                    {task.priority !== "NONE" ? (
                      <span className={cn(
                        "px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider flex items-center gap-1",
                        task.priority === "HIGH" ? "bg-[#FEE2E2] text-[#DC2626]" :
                        task.priority === "MEDIUM" ? "bg-[#FEF3C7] text-[#D97706]" :
                        "bg-[#DCFCE7] text-[#16A34A]"
                      )}>
                        {task.priority}
                      </span>
                    ) : (
                      <span className="bg-[#F3F4F6] text-[#6B7280] px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider flex items-center gap-1">
                        NONE
                      </span>
                    )}

                    {variant === "completed" && task.completedAt && (
                      <div className="flex items-center gap-1.5 text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-100">
                        <CheckCircle2 className="h-3 w-3" />
                        Done {new Date(task.completedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                      </div>
                    )}
                    {variant === "overdue" && task.endTime && (
                      <div className="flex items-center gap-1.5 text-[11px] font-bold text-red-600 bg-red-50 px-2.5 py-0.5 rounded-full border border-red-100">
                        <AlertCircle className="h-3 w-3" />
                        Late {Math.max(1, Math.floor((Date.now() - new Date(task.endTime).getTime()) / (1000 * 60 * 60 * 24)))}d
                      </div>
                    )}
                    
                    {task.taskType === "DEEP_WORK" && !isCompleted && !isOverdue && task.startTime && task.endTime && (
                      <Link 
                        href={`/focus/${task.id}`} 
                        onClick={(e) => e.stopPropagation()}
                        className="flex items-center gap-1.5 px-3 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 text-xs font-bold rounded-full transition-colors shadow-sm ml-auto"
                      >
                        <Play className="h-3 w-3 fill-current" /> Focus
                      </Link>
                    )}
                  </div>
                </div>

                {/* Recovery Options Bar */}
                {showRecoveryOptions && (
                  <div className="mt-3 pt-3 border-t border-red-100 flex flex-wrap items-center gap-2 pl-8" onClick={e => e.stopPropagation()}>
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
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-red-100 hover:bg-red-200 text-red-700 text-xs font-bold rounded-lg transition-colors"
                    >
                      {recoveringTaskId === task.id ? "Moving..." : <><ArrowRight className="h-3.5 w-3.5" /> Tomorrow</>}
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
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-red-200 hover:bg-red-50 text-red-700 text-xs font-bold rounded-lg transition-colors"
                    >
                      {recoveringTaskId === task.id ? "Moving..." : <><Clock className="h-3.5 w-3.5" /> Next Free</>}
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
                      className="flex items-center gap-1.5 px-3 py-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-700 text-xs font-bold rounded-lg transition-colors ml-auto"
                    >
                      <X className="h-3.5 w-3.5" /> Ignore
                    </button>
                  </div>
                )}
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
