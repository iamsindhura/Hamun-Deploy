"use client";

import { useState, useEffect } from "react";
import { CheckCircle2, Circle, Calendar, Flag, AlertCircle, ArrowRight, Clock, X, Play, ArrowDown, MoreHorizontal, FileText, Trash2, RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils";
import { TaskDetailSheet } from "./task-detail-sheet";
import { updateTask, recoverOverdueTask, scheduleUnscheduledTask, deleteTask } from "@/app/actions/tasks";
import { toast } from "sonner";
import { createActivity } from "@/app/actions/activities";
import { FollowUpDialog } from "@/components/tasks/follow-up-dialog";
import { CompletionReflectionDialog } from "./completion-reflection-dialog";
import { useTaskReminders } from "@/components/providers/task-reminder-provider";
import { useRouter } from "next/navigation";
import { FocusDurationDialog } from "@/components/tasks/focus-duration-dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { TaskActionConfirmations, TaskActionType } from "./task-action-confirmations";

interface TaskListViewProps {
 tasks: any[];
 showDate?: boolean;
 variant?: "default" | "completed" | "overdue" | "unscheduled";
 workdayStart?: string;
 workdayEnd?: string;
}

export function TaskListView({ tasks: initialTasks, showDate = false, variant = "default", workdayStart = "09:00", workdayEnd = "18:00" }: TaskListViewProps) {
 const [tasks, setTasks] = useState(initialTasks);
 const [selectedTask, setSelectedTask] = useState<any | null>(null);
 const [focusTask, setFocusTask] = useState<any | null>(null);
 const [ignoredTaskIds, setIgnoredTaskIds] = useState<Set<string>>(new Set());
 const [recoveringTaskId, setRecoveringTaskId] = useState<string | null>(null);
 const [completingTask, setCompletingTask] = useState<any | null>(null);

 const [confirmTask, setConfirmTask] = useState<any | null>(null);
 const [confirmAction, setConfirmAction] = useState<TaskActionType>(null);

 const [showFollowUpDialog, setShowFollowUpDialog] = useState(false);
 const [activeFollowUpTask, setActiveFollowUpTask] = useState<any | null>(null);

 const { setGlobalTasks } = useTaskReminders();
 const router = useRouter();

 useEffect(() => {
 setGlobalTasks(tasks);
 }, [tasks, setGlobalTasks]);

 const handleToggleCompletion = async (taskId: string, e: React.MouseEvent) => {
 e.stopPropagation();
 const task = tasks.find(t => t.id === taskId);
 if (!task) return;

 if (task.isCompleted) {
 setTasks(prev => prev.map(t => t.id === taskId ? { ...t, isCompleted: false } : t));
 await updateTask(taskId, task.projectId, { isCompleted: false });
 } else {
 if (task.project?.name === "Follow Ups" && task.contactId) {
 setActiveFollowUpTask(task);
 setShowFollowUpDialog(true);
 return;
 }
 setCompletingTask(task);
 }
 };

 const executeCompletion = async (note?: string) => {
 if (!completingTask) return;
 
 const taskId = completingTask.id;
 const task = completingTask;
 setCompletingTask(null);

 let newDescription = task.description || "";
 if (note) {
 const dateObj = new Date();
 const datePart = dateObj.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
 const timePart = dateObj.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
 const timestamp = `${datePart} • ${timePart}`;
 
 const noteBlock = `${timestamp}\n${note}`;
 
 if (!newDescription.includes("Completion History")) {
 newDescription = newDescription.trim() + (newDescription.trim() ? "\n\n" : "") + "Completion History\n\n" + noteBlock;
 } else {
 newDescription = newDescription.trim() + "\n\n" + noteBlock;
 }
 }

 setTasks(prev => prev.map(t => t.id === taskId ? { 
 ...t, 
 isCompleted: true,
 description: newDescription,
 completedAt: new Date()
 } : t));

 await updateTask(taskId, task.projectId, { 
 isCompleted: true,
 description: newDescription,
 completedAt: new Date()
 });
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
 await createActivity(task.contactId, method as any, content);
 }
 setActiveFollowUpTask(null);
 };

 const handleDeleteTask = async (taskId: string) => {
 const task = tasks.find(t => t.id === taskId);
 if (!task) return;
 
 setTasks(prev => prev.filter(t => t.id !== taskId));
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
 const showRecoveryOptions = isOverdue && !isIgnored && variant === "overdue";
 const showUnscheduledOptions = variant === "unscheduled";
 
 let isWithinWorkday = false;
 if (task.startTime && task.endTime) {
 const startH = new Date(task.startTime).getHours();
 const startM = new Date(task.startTime).getMinutes();
 const endH = new Date(task.endTime).getHours();
 const endM = new Date(task.endTime).getMinutes();
 
 const [wsH, wsM] = workdayStart.split(':').map(Number);
 const [weH, weM] = workdayEnd.split(':').map(Number);
 
 const startMins = startH * 60 + startM;
 const endMins = endH * 60 + endM;
 const wsMins = wsH * 60 + wsM;
 const weMins = weH * 60 + weM;
 
 const crossesMidnight = endMins <= startMins;
 isWithinWorkday = startMins >= wsMins && endMins <= weMins && !crossesMidnight;
 }

 let timePanelColor = "";
 if (task.startTime && task.endTime) {
 timePanelColor = isWithinWorkday
 ? "bg-[#FACC15]/10 text-[#FACC15] border-r border-[#FACC15]/20" // Yellow
 : "bg-[#8B5CF6]/10 text-[#8B5CF6] border-r border-[#8B5CF6]/20"; // Purple
 } else {
 timePanelColor = "bg-[#FACC15]/10 text-[#FACC15] border-r border-[#FACC15]/20"; // Yellow for Unscheduled
 }

 return (
 <div 
 key={task.id} 
 className="flex flex-row rounded-2xl border border-border bg-card overflow-hidden shadow-sm transition-all duration-300 ease-in-out hover:-translate-y-1 hover:shadow-lg hover:border-[#8B5CF6]/50 group"
 >
 {task.startTime && task.endTime ? (
 <div className={cn("w-[110px] sm:w-[130px] shrink-0 p-3 sm:p-4 flex flex-col justify-center items-center", timePanelColor)}>
 <div className="flex flex-col items-center justify-center gap-1.5 text-sm font-bold tracking-tight">
 <span className="text-[14px] leading-none">{new Date(task.startTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
 <div className="h-4 flex items-center justify-center opacity-50">
 <ArrowDown className="w-4 h-4" />
 </div>
 <span className="text-[14px] leading-none">{new Date(task.endTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
 </div>
 </div>
 ) : (
 <div className={cn("w-[110px] sm:w-[130px] shrink-0 p-3 sm:p-4 flex flex-col justify-center items-center", timePanelColor)}>
 <div className="flex flex-col items-center justify-center gap-1.5 text-sm font-bold tracking-tight">
 <span className="text-xl">📌</span>
 <span className="text-[11px] uppercase tracking-wider opacity-80">Unscheduled</span>
 </div>
 </div>
 )}

 <div className="flex-1 p-3 sm:p-4 flex flex-row items-center justify-between min-w-0 bg-card">
 <div className="flex items-start gap-3 min-w-0">
 {isCompleted ? (
 <div className="shrink-0 cursor-pointer mt-0.5" onClick={(e) => handleToggleCompletion(task.id, e as any)}>
 <CheckCircle2 className="h-5 w-5 text-[#22C55E]" />
 </div>
 ) : (
 <button 
 onClick={(e) => handleToggleCompletion(task.id, e as any)}
 className="text-muted-foreground hover:text-[#8B5CF6] transition-colors shrink-0 mt-0.5"
 >
 <Circle className="h-5 w-5" />
 </button>
 )}
 <div className="flex flex-col min-w-0">
 <div className={cn("font-bold text-[18px] leading-snug truncate", isCompleted ? "text-muted-foreground line-through opacity-70" : "text-foreground")}>
 {task.title}
 </div>
 
 {(task.project?.name || task.priority !== "NONE") && (
 <div className="flex flex-col gap-0.5 mt-0.5">
 {task.project?.name && (
 <span className="text-xs font-semibold text-muted-foreground truncate bg-muted px-2 py-0.5 rounded-md border border-border w-fit">
 {task.project.name}
 </span>
 )}
 {task.priority !== "NONE" && (
 <span className={cn(
 "text-[9px] font-bold uppercase tracking-wider w-fit px-1.5 py-0.5 rounded-sm leading-none mt-0.5 border",
 task.priority === "HIGH" ? "bg-[#EF4444]/10 text-[#EF4444] border-[#EF4444]/20" :
 task.priority === "MEDIUM" ? "bg-[#FACC15]/10 text-[#FACC15] border-[#FACC15]/20" :
 "bg-[#22C55E]/10 text-[#22C55E] border-[#22C55E]/20"
 )}>
 {task.priority}
 </span>
 )}
 </div>
 )}
 </div>
 </div>

 <div className="flex items-center gap-2 shrink-0 ml-4">
 {!isCompleted && (
 <button 
 onClick={(e) => {
 e.stopPropagation();
 if (!task.startTime || !task.endTime) {
 setFocusTask(task);
 } else {
 router.push(`/focus/${task.id}`);
 }
 }}
 className="flex items-center gap-1.5 px-3.5 py-1.5 bg-gradient-to-r from-[#8B5CF6] to-[#7C3AED] hover:from-[#7C3AED] hover:to-[#6D28D9] text-white text-xs font-bold rounded-full transition-all duration-300 shadow-[0_0_10px_rgba(139,92,246,0.3)] hover:shadow-[0_0_15px_rgba(139,92,246,0.5)] hover:-translate-y-0.5"
 >
 <Play className="h-3 w-3 fill-current" /> Focus
 </button>
 )}
 
 <DropdownMenu>
 <DropdownMenuTrigger className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-muted text-muted-foreground hover:text-foreground transition-colors focus:outline-none">
 <MoreHorizontal className="h-5 w-5" />
 </DropdownMenuTrigger>
 <DropdownMenuContent align="end" className="w-56">
 <DropdownMenuItem onClick={() => setSelectedTask(task)}>
 <FileText className="h-4 w-4 mr-2" /> View Details
 </DropdownMenuItem>
 
 {!isCompleted && variant !== "unscheduled" && (
 <>
 {variant !== "overdue" && (
 <>
 <DropdownMenuItem onClick={() => setSelectedTask(task)}>
 <Calendar className="h-4 w-4 mr-2" /> Edit Task
 </DropdownMenuItem>
 <DropdownMenuItem onClick={() => setSelectedTask(task)}>
 <Clock className="h-4 w-4 mr-2" /> Reschedule
 </DropdownMenuItem>
 </>
 )}
 <DropdownMenuItem onClick={() => {
            setConfirmTask(task);
            setConfirmAction('MOVE_TOMORROW');
          }}>
            <ArrowRight className="h-4 w-4 mr-2" /> Move to Tomorrow
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => {
            setConfirmTask(task);
            setConfirmAction('MOVE_NEXT_FREE_SLOT');
          }}>
            <Clock className="h-4 w-4 mr-2" /> Move to Next Free Slot
          </DropdownMenuItem>
 {variant === "overdue" && (
 <DropdownMenuItem onClick={() => {
 setIgnoredTaskIds(prev => {
 const next = new Set(prev);
 next.add(task.id);
 return next;
 });
 }}>
 <X className="h-4 w-4 mr-2" /> Ignore
 </DropdownMenuItem>
 )}
 </>
 )}

 {!isCompleted && variant === "unscheduled" && (
 <>
 <DropdownMenuItem onClick={() => setSelectedTask(task)}>
 <Calendar className="h-4 w-4 mr-2" /> Schedule
 </DropdownMenuItem>
 <DropdownMenuItem onClick={async () => {
 setRecoveringTaskId(task.id);
 const result = await scheduleUnscheduledTask(task.id);
 setRecoveringTaskId(null);
 if (result.success) {
 toast.success("Task auto-scheduled");
 setTasks(prev => prev.filter(t => t.id !== task.id));
 } else {
 toast.error(result.error);
 }
 }}>
 <Clock className="h-4 w-4 mr-2" /> Move to Next Free Slot
 </DropdownMenuItem>
 </>
 )}

 {isCompleted && (
 <DropdownMenuItem onClick={async () => {
 setTasks(prev => prev.map(t => t.id === task.id ? { ...t, isCompleted: false } : t));
 await updateTask(task.id, task.projectId, { isCompleted: false });
 }}>
 <RotateCcw className="h-4 w-4 mr-2" /> Restore Task
 </DropdownMenuItem>
 )}

 <DropdownMenuSeparator />
              <DropdownMenuItem 
                className="text-destructive focus:text-destructive focus:bg-destructive/10"
                onClick={() => {
                  setConfirmTask(task);
                  setConfirmAction('DELETE');
                }}
              >
                <Trash2 className="h-4 w-4 mr-2" /> Delete Task
              </DropdownMenuItem>
 </DropdownMenuContent>
 </DropdownMenu>
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

 {focusTask && (
 <FocusDurationDialog
 isOpen={!!focusTask}
 onOpenChange={(open) => !open && setFocusTask(null)}
 taskTitle={focusTask.title}
 defaultDuration={focusTask.estimatedDurationMinutes}
 onStart={(duration) => {
 router.push(`/focus/${focusTask.id}?duration=${duration}`);
 setFocusTask(null);
 }}
 />
 )}

 <CompletionReflectionDialog
 isOpen={!!completingTask}
 onClose={() => setCompletingTask(null)}
 onSave={(note) => executeCompletion(note)}
 onSkip={() => executeCompletion()}
 />

 <TaskActionConfirmations
          task={confirmTask}
          actionType={confirmAction}
          isOpen={!!confirmTask && !!confirmAction}
          onClose={() => {
            setConfirmTask(null);
            setConfirmAction(null);
          }}
          onSuccess={(taskId, actionType) => {
            if (actionType === 'DELETE' || actionType === 'MOVE_TOMORROW' || actionType === 'MOVE_NEXT_FREE_SLOT') {
              setTasks(prev => prev.filter(t => t.id !== taskId));
            }
          }}
        />
 </>
 );
}
