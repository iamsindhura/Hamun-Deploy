"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CreateTaskDialog } from "./create-task-dialog";
import { TaskPriority, TaskType } from "@prisma/client";

interface QuickAddTaskProps {
  columnId?: string;
  projectId: string;
  onAdd: (data: { title: string; startTime: Date; endTime: Date; priority: TaskPriority; taskType: TaskType }) => Promise<{ success: boolean; error?: string }>;
}

export function QuickAddTask({ columnId, projectId, onAdd }: QuickAddTaskProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  return (
    <>
      <Button
        variant="ghost"
        className="w-full justify-start text-muted-foreground hover:text-foreground"
        onClick={() => setIsDialogOpen(true)}
      >
        <Plus className="mr-2 h-4 w-4" />
        Add Task
      </Button>
      
      <CreateTaskDialog 
        isOpen={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        onSubmit={onAdd}
      />
    </>
  );
}
