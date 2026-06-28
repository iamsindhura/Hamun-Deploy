"use client";

import { useEffect, useState, useCallback } from "react";
import { format, isTomorrow } from "date-fns";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Loader2, ArrowRight, Trash2, Clock } from "lucide-react";
import { previewTaskMove, recoverOverdueTask, deleteTask, scheduleUnscheduledTask } from "@/app/actions/tasks";

export type TaskActionType = 'DELETE' | 'MOVE_TOMORROW' | 'MOVE_NEXT_FREE_SLOT' | null;

interface TaskActionConfirmationsProps {
  task: any | null;
  actionType: TaskActionType;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (taskId: string, actionType: TaskActionType) => void;
}

export function TaskActionConfirmations({
  task,
  actionType,
  isOpen,
  onClose,
  onSuccess
}: TaskActionConfirmationsProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [previewData, setPreviewData] = useState<{ newStartTime?: Date, newEndTime?: Date } | null>(null);
  const [isLoadingPreview, setIsLoadingPreview] = useState(false);
  const [previewError, setPreviewError] = useState<string | null>(null);

  const fetchPreview = useCallback(async () => {
    if (!task || !actionType || actionType === 'DELETE') return;
    
    setIsLoadingPreview(true);
    setPreviewError(null);
    try {
      const result = await previewTaskMove(task.id, actionType);
      if (result.success && result.newStartTime && result.newEndTime) {
        setPreviewData({ newStartTime: result.newStartTime, newEndTime: result.newEndTime });
      } else {
        setPreviewError(result.error || "Could not calculate preview");
      }
    } catch (e) {
      setPreviewError("Failed to fetch preview");
    } finally {
      setIsLoadingPreview(false);
    }
  }, [task, actionType]);

  useEffect(() => {
    if (isOpen) {
      setIsProcessing(false);
      setPreviewData(null);
      if (actionType === 'MOVE_TOMORROW' || actionType === 'MOVE_NEXT_FREE_SLOT') {
        fetchPreview();
      }
    }
  }, [isOpen, actionType, fetchPreview]);

  // Handle keyboard events: Enter to confirm
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen || isProcessing) return;
      if (e.key === 'Enter') {
        e.preventDefault();
        handleConfirm();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isProcessing, previewData, previewError]);

  if (!task || !actionType) return null;

  const handleConfirm = async () => {
    if (isProcessing) return;
    
    // If preview failed and it's a move action, we probably shouldn't proceed
    if (previewError && actionType !== 'DELETE') return;

    setIsProcessing(true);
    
    try {
      if (actionType === 'DELETE') {
        const result = await deleteTask(task.id, task.projectId || undefined);
        if (result.success) {
          toast.success("Task deleted successfully");
          onSuccess(task.id, actionType);
        } else {
          toast.error(result.error || "Failed to delete task");
        }
      } else {
        const result = (!task.startTime && actionType === 'MOVE_NEXT_FREE_SLOT')
          ? await scheduleUnscheduledTask(task.id)
          : await recoverOverdueTask(task.id, actionType);

        if (result.success) {
          toast.success(actionType === 'MOVE_TOMORROW' ? "Task moved to tomorrow" : "Task moved to the next available free slot.");
          onSuccess(task.id, actionType);
        } else {
          toast.error(result.error || "Failed to move task");
        }
      }
    } catch (error) {
      toast.error("An unexpected error occurred");
    } finally {
      setIsProcessing(false);
      onClose();
    }
  };

  const formatTimeRange = (start: Date | string, end: Date | string) => {
    const s = new Date(start);
    const e = new Date(end);
    const dayLabel = isTomorrow(s) ? "Tomorrow" : format(s, "MMM d");
    return `${dayLabel} ${format(s, "h:mm a")} – ${format(e, "h:mm a")}`;
  };

  let title = "";
  let description = "";
  let confirmLabel = "";
  let confirmVariant: "default" | "destructive" = "default";
  let icon = null;

  switch (actionType) {
    case 'DELETE':
      title = "Delete Task?";
      description = "This action cannot be undone.";
      confirmLabel = "Delete";
      confirmVariant = "destructive";
      icon = <Trash2 className="h-4 w-4 mr-2" />;
      break;
    case 'MOVE_TOMORROW':
      title = "Move Task to Tomorrow?";
      confirmLabel = "Move";
      icon = <ArrowRight className="h-4 w-4 mr-2" />;
      break;
    case 'MOVE_NEXT_FREE_SLOT':
      title = "Move Task to Next Free Slot";
      confirmLabel = "Move Task";
      icon = <Clock className="h-4 w-4 mr-2" />;
      break;
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !isProcessing && !open && onClose()}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="text-xl">{title}</DialogTitle>
          <DialogDescription className="sr-only">
            {title}
          </DialogDescription>
          
          <div className="text-base mt-2 space-y-4 pt-2">
            {actionType === 'DELETE' && (
              <div className="text-muted-foreground">
                {description}
                <br /><br />
                <span className="font-semibold text-foreground line-clamp-2">"{task.title}"</span>
              </div>
            )}

            {(actionType === 'MOVE_TOMORROW' || actionType === 'MOVE_NEXT_FREE_SLOT') && (
              <div className="space-y-4">
                {actionType === 'MOVE_NEXT_FREE_SLOT' && (
                  <div className="text-muted-foreground">
                    This will automatically reschedule the selected task to the next available free time slot in your schedule. The task duration will remain unchanged.
                  </div>
                )}
                <div className="rounded-lg bg-muted p-4 space-y-3 border border-border">
                  <div className="font-medium text-foreground truncate">{task.title}</div>
                  
                  {task.startTime && task.endTime && (
                    <div className="text-sm">
                      <div className="text-muted-foreground mb-1 text-xs uppercase tracking-wider font-semibold">Current</div>
                      <div className="text-foreground">{formatTimeRange(task.startTime, task.endTime)}</div>
                    </div>
                  )}

                  {isLoadingPreview ? (
                    <div className="text-sm pt-2">
                      <div className="text-muted-foreground mb-1 text-xs uppercase tracking-wider font-semibold">New Slot</div>
                      <div className="flex items-center text-muted-foreground">
                        <Loader2 className="h-3 w-3 mr-2 animate-spin" /> Calculating...
                      </div>
                    </div>
                  ) : previewError ? (
                    <div className="text-sm text-destructive font-medium pt-2">
                      {previewError}
                    </div>
                  ) : previewData?.newStartTime && previewData?.newEndTime && (
                    <div className="text-sm pt-2 border-t border-border/50">
                      <div className="text-muted-foreground mb-1 text-xs uppercase tracking-wider font-semibold text-primary">New</div>
                      <div className="text-foreground font-medium text-primary">
                        {formatTimeRange(previewData.newStartTime, previewData.newEndTime)}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </DialogHeader>
        <DialogFooter className="mt-6 flex gap-2 sm:gap-0">
          <Button variant="outline" onClick={onClose} disabled={isProcessing} className="w-full sm:w-auto">
            Cancel
          </Button>
          <Button 
            variant={confirmVariant} 
            onClick={handleConfirm} 
            disabled={isProcessing || isLoadingPreview || (actionType !== 'DELETE' && !!previewError)}
            className="w-full sm:w-auto"
          >
            {isProcessing ? (
              <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Processing...</>
            ) : (
              <>{icon} {confirmLabel}</>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
