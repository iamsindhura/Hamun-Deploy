"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface QuickAddTaskProps {
  columnId?: string;
  projectId: string;
  onAdd: (title: string) => void;
}

export function QuickAddTask({ columnId, projectId, onAdd }: QuickAddTaskProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [title, setTitle] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setIsAdding(false);
      return;
    }
    onAdd(title.trim());
    setTitle("");
    setIsAdding(false);
  };

  if (!isAdding) {
    return (
      <Button
        variant="ghost"
        className="w-full justify-start text-muted-foreground hover:text-foreground"
        onClick={() => setIsAdding(true)}
      >
        <Plus className="mr-2 h-4 w-4" />
        Add Task
      </Button>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="mt-2 flex items-center gap-2">
      <Input
        autoFocus
        placeholder="What needs to be done?"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        onBlur={() => {
          if (!title.trim()) setIsAdding(false);
        }}
        className="h-8 text-sm"
      />
      <Button type="submit" size="sm" className="h-8 px-3">Add</Button>
    </form>
  );
}
