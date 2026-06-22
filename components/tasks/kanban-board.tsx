"use client";

import { useState, useMemo, useEffect } from "react";
import { Task, TaskColumn, TaskPriority } from "@prisma/client";
import { QuickAddTask } from "./quick-add-task";
import { TaskDetailSheet } from "./task-detail-sheet";
import { updateTask, createTask, createColumn, deleteColumn, updateColumn } from "@/app/actions/tasks";
import { createActivity } from "@/app/actions/activities";
import { FollowUpDialog } from "@/components/tasks/follow-up-dialog";
import { Plus, Calendar, Flag, CheckCircle2, Circle, GripVertical, MoreHorizontal, Trash2, Edit2, ChevronDown, ChevronRight, ChevronLeft, Maximize2, X, ListTodo, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragStartEvent,
  DragOverEvent,
  DragEndEvent,
  defaultDropAnimationSideEffects,
  DropAnimation,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  horizontalListSortingStrategy,
  verticalListSortingStrategy,
  useSortable
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

const SECTION_COLORS_MAP: Record<string, { hex: string, rgb: string }> = {
  purple: { hex: "#7C3AED", rgb: "124, 58, 237" },
  blue: { hex: "#2563EB", rgb: "37, 99, 235" },
  emerald: { hex: "#10B981", rgb: "16, 185, 129" },
  orange: { hex: "#F97316", rgb: "249, 115, 22" },
  pink: { hex: "#EC4899", rgb: "236, 72, 153" },
  indigo: { hex: "#4F46E5", rgb: "79, 70, 229" },
  teal: { hex: "#14B8A6", rgb: "20, 184, 166" },
  rose: { hex: "#F43F5E", rgb: "244, 63, 94" }
};
const SECTION_COLORS = ["purple", "blue", "emerald", "orange", "pink", "indigo", "teal", "rose"];

const formatDueDate = (dateInput: Date | string) => {
  const date = new Date(dateInput);
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  return `${months[date.getUTCMonth()]} ${date.getUTCDate()}`;
};

const formatCompletedDueDate = (dateInput: Date | string) => {
  const date = new Date(dateInput);
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  return `${months[date.getUTCMonth()]} ${date.getUTCDate()}, ${date.getUTCFullYear()}`;
};

function SortableTask({ task, onClick, onToggle }: { task: any, onClick: () => void, onToggle: (id: string, completed: boolean) => void }) {
  const isCompleted = task.isCompleted;
  const isDraggable = !isCompleted;

  const { setNodeRef, attributes, listeners, transform, transition, isDragging } = useSortable({
    id: task.id,
    data: { type: "Task", task },
    disabled: !isDraggable,
  });

  const style = {
    transition,
    transform: CSS.Transform.toString(transform),
  };

  if (isDragging) {
    return (
      <div ref={setNodeRef} style={style} className="h-14 rounded-lg border-2 border-primary/50 bg-primary/10 opacity-50" />
    );
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="group relative flex flex-col gap-2 rounded-xl border border-slate-200 bg-white p-3.5 shadow-[0_1px_3px_rgba(0,0,0,0.02)] transition-all duration-300 ease-in-out cursor-pointer hover:-translate-y-1 hover:shadow-[0_8px_24px_-4px_rgba(var(--section-rgb),0.15)] hover:border-[var(--section-color)]"
      onClick={onClick}
    >
      <div className="flex items-start gap-3">
        {isDraggable && (
          <div {...attributes} {...listeners} className="mt-0.5 cursor-grab text-slate-300 hover:text-[var(--section-color)] transition-colors">
            <GripVertical className="h-4 w-4" />
          </div>
        )}
        
        <button
          onClick={(e) => { e.stopPropagation(); onToggle(task.id, task.isCompleted); }}
          className="mt-0.5 text-slate-400 hover:text-[var(--section-color)] transition-colors shrink-0"
        >
          <Circle className="h-5 w-5" />
        </button>
        <span className="flex-1 font-bold text-[16px] leading-snug break-all text-slate-800">
          {task.title}
        </span>
      </div>
    </div>
  );
}

function CompletedTask({ task, onClick, onToggle }: { task: any, onClick: () => void, onToggle: (id: string, completed: boolean) => void }) {
  return (
    <div
      className="group relative flex flex-col gap-2 rounded-xl border border-slate-200 bg-white p-3.5 shadow-[0_1px_3px_rgba(0,0,0,0.02)] transition-all duration-300 ease-in-out cursor-pointer hover:-translate-y-1 hover:shadow-md opacity-70 hover:opacity-100 hover:border-[var(--section-color)]"
      onClick={onClick}
    >
      <div className="flex items-start gap-3">
        <div className="mt-0.5 shrink-0 cursor-pointer" onClick={(e) => { e.stopPropagation(); onToggle(task.id, task.isCompleted); }}>
          <CheckCircle2 className="h-5 w-5 text-emerald-500" />
        </div>
        <span className="flex-1 font-bold text-[16px] leading-snug break-all text-slate-400 line-through">
          {task.title}
        </span>
      </div>
    </div>
  );
}

function SortableColumn({ column, index, tasks, onAddTask, onToggleTask, onTaskClick, onRename, onDelete }: any) {
  const [isCompletedExpanded, setIsCompletedExpanded] = useState(false);

  const { setNodeRef, attributes, listeners, transform, transition, isDragging } = useSortable({
    id: column.id,
    data: { type: "Column", column },
  });

  const style = {
    transition,
    transform: CSS.Transform.toString(transform),
  };

  const activeTasks = tasks.filter((t: Task) => !t.isCompleted);
  const completedTasks = tasks.filter((t: Task) => t.isCompleted);
  const activeTaskIds = useMemo(() => activeTasks.map((t: Task) => t.id), [activeTasks]);
  const activeTasksCount = activeTasks.length;

  const baseColorName = column.color || SECTION_COLORS[index % SECTION_COLORS.length];
  const colorData = SECTION_COLORS_MAP[baseColorName] || SECTION_COLORS_MAP.purple;

  const cssVars = {
    '--section-color': colorData.hex,
    '--section-rgb': colorData.rgb,
    ...style,
    borderTopColor: 'var(--section-color)',
    backgroundColor: 'rgba(var(--section-rgb), 0.04)'
  } as React.CSSProperties;

  if (isDragging) {
    return <div ref={setNodeRef} style={cssVars} className="flex w-80 flex-shrink-0 flex-col rounded-xl border border-t-[4px] border-slate-200 opacity-50 p-4 h-full" />;
  }

  return (
    <div ref={setNodeRef} style={cssVars} className="group/col flex w-80 flex-shrink-0 flex-col rounded-xl border border-slate-200 border-t-[4px] p-4 h-full shadow-sm transition-all duration-300 ease-in-out hover:shadow-[0_8px_30px_-4px_rgba(var(--section-rgb),0.12)]">
      <div className="mb-4 flex items-center justify-between rounded-lg p-2.5 bg-[rgba(var(--section-rgb),0.06)] border border-[rgba(var(--section-rgb),0.1)]">
        <div className="flex items-center gap-2 cursor-grab font-bold tracking-wide text-[var(--section-color)]" {...attributes} {...listeners}>
          <GripVertical className="h-4 w-4 opacity-50 hover:opacity-100 transition-opacity" />
          <span className="text-[15px] uppercase tracking-wider">{column.name}</span>
          <Badge className="ml-1 bg-[rgba(var(--section-rgb),0.15)] text-[var(--section-color)] hover:bg-[rgba(var(--section-rgb),0.25)] border-none px-2 py-0.5 rounded-full shadow-none font-bold">
            {activeTasksCount}
          </Badge>
        </div>
        <div className="flex items-center gap-1">
          <DropdownMenu>
            <DropdownMenuTrigger className="flex h-7 w-7 items-center justify-center rounded-md hover:bg-[rgba(var(--section-rgb),0.1)] text-[var(--section-color)] outline-none focus-visible:ring-2 focus-visible:ring-ring transition-colors">
              <MoreHorizontal className="h-4 w-4" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onRename(column)}>
                <Edit2 className="h-4 w-4 mr-2" /> Rename
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onDelete(column.id)} className="text-red-600">
                <Trash2 className="h-4 w-4 mr-2" /> Delete Section
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-2 overflow-y-auto overflow-x-hidden no-scrollbar pb-2">
        <SortableContext items={activeTaskIds} strategy={verticalListSortingStrategy}>
          {activeTasks.map((task: Task) => (
            <SortableTask
              key={task.id}
              task={task}
              onClick={() => onTaskClick(task)}
              onToggle={onToggleTask}
            />
          ))}
        </SortableContext>

        {completedTasks.length > 0 && (
          <div className="mt-2 pt-2 border-t border-slate-200/60">
            <button 
              onClick={() => setIsCompletedExpanded(!isCompletedExpanded)}
              className="flex items-center justify-between w-full px-2 py-1.5 text-xs font-semibold text-primary hover:text-primary/80 transition-colors rounded-md hover:bg-primary/5"
            >
              <span>Completed ({completedTasks.length})</span>
              {isCompletedExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
            </button>
            
            {isCompletedExpanded && (
              <div className="mt-2 flex flex-col gap-2">
                {completedTasks.map((task: Task) => (
                  <CompletedTask
                    key={task.id}
                    task={task}
                    onClick={() => onTaskClick(task)}
                    onToggle={onToggleTask}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      <div className="mt-2">
        <QuickAddTask 
          columnId={column.id} 
          projectId={column.projectId} 
          onAdd={(data) => onAddTask(data, column.id)} 
          className="w-full justify-start border border-dashed border-[var(--section-color)]/30 bg-[rgba(var(--section-rgb),0.05)] text-[var(--section-color)] hover:bg-[var(--section-color)] hover:text-white transition-all duration-300 ease-in-out shadow-sm font-semibold rounded-xl h-10"
        />
      </div>
    </div>
  );
}

interface KanbanBoardProps {
  projectId: string;
  projectName: string;
  initialColumns: TaskColumn[];
  initialTasks: any[];
}

export function KanbanBoard({ projectId, projectName, initialColumns, initialTasks }: KanbanBoardProps) {
  const [columns, setColumns] = useState<TaskColumn[]>(initialColumns);
  const [tasks, setTasks] = useState<any[]>(initialTasks);
  const [isAddingColumn, setIsAddingColumn] = useState(false);
  const [newColumnName, setNewColumnName] = useState("");
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);

  const [activeColumn, setActiveColumn] = useState<TaskColumn | null>(null);
  const [activeTask, setActiveTask] = useState<Task | null>(null);

  const [isFocusMode, setIsFocusMode] = useState(false);
  const [focusColumnIndex, setFocusColumnIndex] = useState(0);

  const [searchQuery, setSearchQuery] = useState("");

  const [showFollowUpDialog, setShowFollowUpDialog] = useState(false);
  const [activeFollowUpTask, setActiveFollowUpTask] = useState<any | null>(null);

  const filteredTasks = useMemo(() => {
    if (!searchQuery.trim()) return tasks;
    const query = searchQuery.toLowerCase();
    return tasks.filter(t =>
      t.title?.toLowerCase().includes(query) ||
      t.description?.toLowerCase().includes(query)
    );
  }, [tasks, searchQuery]);

  useEffect(() => {
    if (!isFocusMode) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") {
        setFocusColumnIndex(prev => Math.max(0, prev - 1));
      } else if (e.key === "ArrowRight") {
        setFocusColumnIndex(prev => Math.min(columns.length - 1, prev + 1));
      } else if (e.key === "Escape") {
        setIsFocusMode(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isFocusMode, columns.length]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 3 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleAddTask = async (data: { title: string; startTime: Date; endTime: Date; priority: TaskPriority; taskType: any }, columnId: string) => {
    const tempId = `temp-${Date.now()}`;
    const newTask: Task = {
      id: tempId,
      title: data.title,
      description: null,
      isCompleted: false,
      completedAt: null,
      dueDate: null,
      reminderAt: null,
      priority: data.priority,
      taskType: data.taskType,
      startTime: data.startTime,
      endTime: data.endTime,
      isPinned: false,
      position: tasks.filter(t => t.columnId === columnId).length,
      projectId,
      columnId,
      userId: "",
      createdAt: new Date(),
      updatedAt: new Date(),
      contactId: null,
    };
    setTasks([...tasks, newTask]);

    const result = await createTask({ ...data, columnId, projectId, position: newTask.position });
    if (result.success && result.data) {
      setTasks(prev => prev.map(t => t.id === tempId ? result.data as Task : t));
      return { success: true };
    } else {
      setTasks(prev => prev.filter(t => t.id !== tempId));
      return { success: false, error: result.error };
    }
  };

  const handleAddColumn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newColumnName.trim()) return;

    const tempId = `temp-col-${Date.now()}`;
    const newCol: TaskColumn = {
      id: tempId,
      name: newColumnName.trim(),
      position: columns.length,
      projectId,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    setColumns([...columns, newCol]);
    setNewColumnName("");
    setIsAddingColumn(false);

    const result = await createColumn({ name: newCol.name, position: newCol.position, projectId });
    if (result.success && result.data) {
      setColumns(prev => prev.map(c => c.id === tempId ? result.data as TaskColumn : c));
    }
  };

  const handleRenameColumn = async (column: TaskColumn) => {
    const newName = prompt("Rename section:", column.name);
    if (!newName || newName === column.name) return;
    setColumns(prev => prev.map(c => c.id === column.id ? { ...c, name: newName } : c));
    await updateColumn(column.id, projectId, { name: newName });
  };

  const handleDeleteColumn = async (columnId: string) => {
    if (!confirm("Are you sure you want to delete this section? All tasks inside will be deleted too.")) return;
    setColumns(prev => prev.filter(c => c.id !== columnId));
    setTasks(prev => prev.filter(t => t.columnId !== columnId));
    await deleteColumn(columnId, projectId);
  };

  const toggleTaskCompletion = async (taskId: string, isCompleted: boolean) => {
    const isCompleting = !isCompleted;
    const taskToToggle = tasks.find(t => t.id === taskId);

    if (isCompleting && projectName === "Follow Ups" && taskToToggle?.contactId) {
      setActiveFollowUpTask(taskToToggle);
      setShowFollowUpDialog(true);
      return;
    }

    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, isCompleted: isCompleting } : t));
    await updateTask(taskId, projectId, { isCompleted: isCompleting });
  };

  const handleFollowUpMethod = async (method: "CALL" | "EMAIL" | "MEETING" | "NONE", notes?: string) => {
    setShowFollowUpDialog(false);
    if (!activeFollowUpTask) return;

    const task = activeFollowUpTask;
    setTasks(prev => prev.map(t => t.id === task.id ? { ...t, isCompleted: true } : t));

    if (method === "NONE") {
      await updateTask(task.id, projectId, { isCompleted: true });
    } else {
      const baseContent = method === "CALL" ? "Follow-up call completed"
        : method === "EMAIL" ? "Follow-up email sent"
          : "Follow-up meeting completed";

      const content = notes ? `${baseContent}\n\n${notes}` : baseContent;
      await createActivity(task.contactId, method as any, content);
    }
    setActiveFollowUpTask(null);
  };

  const onDragStart = (event: DragStartEvent) => {
    if (event.active.data.current?.type === "Column") {
      setActiveColumn(event.active.data.current.column);
      return;
    }
    if (event.active.data.current?.type === "Task") {
      setActiveTask(event.active.data.current.task);
      return;
    }
  };

  const onDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    if (!over) return;

    const activeId = active.id;
    const overId = over.id;
    if (activeId === overId) return;

    const isActiveTask = active.data.current?.type === "Task";
    const isOverTask = over.data.current?.type === "Task";
    const isOverColumn = over.data.current?.type === "Column";

    if (!isActiveTask) return;

    // Task over Task
    if (isActiveTask && isOverTask) {
      setTasks(tasks => {
        const activeIndex = tasks.findIndex(t => t.id === activeId);
        const overIndex = tasks.findIndex(t => t.id === overId);

        if (tasks[activeIndex].columnId !== tasks[overIndex].columnId) {
          const newTasks = [...tasks];
          newTasks[activeIndex] = { ...newTasks[activeIndex], columnId: newTasks[overIndex].columnId };
          return arrayMove(newTasks, activeIndex, overIndex);
        }
        return arrayMove(tasks, activeIndex, overIndex);
      });
    }

    // Task over empty column
    if (isActiveTask && isOverColumn) {
      setTasks(tasks => {
        const activeIndex = tasks.findIndex(t => t.id === activeId);
        const newTasks = [...tasks];
        newTasks[activeIndex] = { ...newTasks[activeIndex], columnId: overId as string };
        return arrayMove(newTasks, activeIndex, activeIndex);
      });
    }
  };

  const onDragEnd = async (event: DragEndEvent) => {
    setActiveColumn(null);
    setActiveTask(null);

    const { active, over } = event;
    if (!over) return;
    const activeId = active.id;
    const overId = over.id;

    // Handle Column sorting
    if (active.data.current?.type === "Column") {
      if (activeId === overId) return;
      const activeColumnIndex = columns.findIndex(c => c.id === activeId);
      const overColumnIndex = columns.findIndex(c => c.id === overId);
      const newColumns = arrayMove(columns, activeColumnIndex, overColumnIndex);
      setColumns(newColumns);
      return;
    }

    // Handle Task sorting
    if (active.data.current?.type === "Task") {
      const movedTask = tasks.find(t => t.id === activeId);
      if (movedTask) {
        const position = tasks.filter(t => t.columnId === movedTask.columnId).findIndex(t => t.id === activeId);
        updateTask(movedTask.id, projectId, {
          columnId: movedTask.columnId,
          position: position >= 0 ? position : 0
        });
      }
    }
  };

  const columnIds = useMemo(() => columns.map(c => c.id), [columns]);



  return (
    <div className="flex h-full flex-col bg-white">
      {/* Header with Project Name and Focus Mode button */}
      <div className="flex h-16 items-center justify-between border-b px-8 bg-slate-50/50 shrink-0">
        <div className="flex items-center gap-4">
          <h1 className="text-2xl font-black tracking-tight text-primary">
            {projectName}
          </h1>

          {columns.length > 0 && (
            <div className="flex items-center gap-3">
              <div className="relative w-64 md:w-80">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <Input
                  type="text"
                  placeholder="Search tasks..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="h-9 w-full pl-9 pr-4 rounded-full border-slate-200 bg-white focus-visible:ring-primary focus-visible:border-primary text-slate-800 font-medium transition-all"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setFocusColumnIndex(0);
                  setIsFocusMode(true);
                }}
                className="flex items-center gap-1.5 rounded-full px-4 border-primary text-primary hover:bg-primary hover:text-white font-semibold shadow-sm transition-all"
              >
                <Maximize2 className="h-4 w-4" /> Focus Mode
              </Button>
            </div>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-hidden relative">
        <DndContext
          id="tasks-dnd-context"
          sensors={sensors}
          collisionDetection={closestCorners}
          onDragStart={onDragStart}
          onDragOver={onDragOver}
          onDragEnd={onDragEnd}
        >
          <div className="flex h-full gap-4 overflow-x-auto p-4 pb-8 items-start">
            <SortableContext items={columnIds} strategy={horizontalListSortingStrategy}>
              {columns.map((column, index) => (
                <SortableColumn
                  key={column.id}
                  column={column}
                  index={index}
                  tasks={filteredTasks.filter(t => t.columnId === column.id)}
                  onAddTask={handleAddTask}
                  onToggleTask={toggleTaskCompletion}
                  onTaskClick={setSelectedTask}
                  onRename={handleRenameColumn}
                  onDelete={handleDeleteColumn}
                />
              ))}
            </SortableContext>

            <div className="w-80 flex-shrink-0">
              {!isAddingColumn ? (
                <Button
                  variant="outline"
                  className="w-full justify-start border-dashed bg-transparent text-primary border-primary/40 hover:bg-primary/5 hover:text-primary transition-colors"
                  onClick={() => setIsAddingColumn(true)}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Add Section
                </Button>
              ) : (
                <form onSubmit={handleAddColumn} className="rounded-xl border bg-muted/40 p-3">
                  <Input
                    autoFocus
                    placeholder="Section name"
                    value={newColumnName}
                    onChange={(e) => setNewColumnName(e.target.value)}
                    className="mb-2 h-9"
                  />
                  <div className="flex items-center gap-2">
                    <Button type="submit" size="sm" className="h-8">Add Section</Button>
                    <Button type="button" variant="ghost" size="sm" className="h-8" onClick={() => setIsAddingColumn(false)}>Cancel</Button>
                  </div>
                </form>
              )}
            </div>
          </div>

          <DragOverlay dropAnimation={{ sideEffects: defaultDropAnimationSideEffects({ styles: { active: { opacity: "0.4" } } }) }}>
            {activeColumn && (
              <SortableColumn
                column={activeColumn}
                tasks={filteredTasks.filter(t => t.columnId === activeColumn.id)}
                onAddTask={() => { }}
                onToggleTask={() => { }}
                onTaskClick={() => { }}
                onRename={() => { }}
                onDelete={() => { }}
              />
            )}
            {activeTask && (
              <SortableTask
                task={activeTask}
                onClick={() => { }}
                onToggle={() => { }}
              />
            )}
          </DragOverlay>

          <TaskDetailSheet
            task={selectedTask}
            projectId={projectId}
            onClose={() => setSelectedTask(null)}
            onUpdate={(updatedTask) => setTasks(prev => prev.map(t => t.id === updatedTask.id ? updatedTask : t))}
            onDelete={(taskId) => setTasks(prev => prev.filter(t => t.id !== taskId))}
          />
        </DndContext>
      </div>

      {/* Focus Mode Overlay */}
      {isFocusMode && columns.length > 0 && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/95" onClick={() => setIsFocusMode(false)} />

          <div className="relative z-10 flex items-center gap-6 max-w-4xl w-full">
            <Button
              variant="outline"
              size="icon"
              disabled={focusColumnIndex === 0}
              onClick={() => setFocusColumnIndex(prev => Math.max(0, prev - 1))}
              className="hidden md:inline-flex h-12 w-12 rounded-full shadow-lg border-slate-200/80 bg-white hover:bg-slate-50 shrink-0 disabled:opacity-40"
            >
              <ChevronLeft className="h-6 w-6 text-slate-700" />
            </Button>

            <div className="flex-1 bg-white rounded-2xl shadow-2xl border border-slate-100 flex flex-col h-[85vh] md:h-[75vh] w-full max-w-md mx-auto overflow-hidden animate-in fade-in zoom-in-95 duration-200">
              <div className="flex items-center justify-between border-b px-4 md:px-6 py-3.5 bg-slate-50/50">
                <div className="flex items-center gap-2">
                  <button
                    disabled={focusColumnIndex === 0}
                    onClick={() => setFocusColumnIndex(prev => Math.max(0, prev - 1))}
                    className="md:hidden p-1 rounded-md hover:bg-slate-200/50 text-slate-500 disabled:opacity-30 disabled:hover:bg-transparent transition-colors shrink-0"
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </button>

                  <span className="font-bold text-base md:text-lg text-slate-800 truncate max-w-[120px] sm:max-w-none">
                    {columns[focusColumnIndex].name}
                  </span>

                  <button
                    disabled={focusColumnIndex === columns.length - 1}
                    onClick={() => setFocusColumnIndex(prev => Math.min(columns.length - 1, prev + 1))}
                    className="md:hidden p-1 rounded-md hover:bg-slate-200/50 text-slate-500 disabled:opacity-30 disabled:hover:bg-transparent transition-colors shrink-0"
                  >
                    <ChevronRight className="h-5 w-5" />
                  </button>

                  <Badge className="bg-primary/10 text-primary hover:bg-primary/15 border-none font-semibold ml-1 shrink-0">
                    {filteredTasks.filter(t => t.columnId === columns[focusColumnIndex].id && !t.isCompleted).length}
                  </Badge>
                </div>
                <button
                  onClick={() => setIsFocusMode(false)}
                  className="rounded-lg p-1.5 hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-3 no-scrollbar">
                {filteredTasks.filter(t => t.columnId === columns[focusColumnIndex].id && !t.isCompleted).length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <CheckCircle2 className="h-12 w-12 text-emerald-400 opacity-60 mb-3" />
                    <p className="text-sm font-semibold text-slate-500">All tasks completed!</p>
                    <p className="text-xs text-slate-400 mt-1">Enjoy the focus space.</p>
                  </div>
                ) : (
                  filteredTasks
                    .filter(t => t.columnId === columns[focusColumnIndex].id && !t.isCompleted)
                    .map((task) => (
                      <div
                        key={task.id}
                        onClick={() => setSelectedTask(task)}
                        className="group flex flex-col gap-2 rounded-xl border border-slate-100 bg-white p-4 shadow-sm hover:border-slate-200 transition-all cursor-pointer"
                      >
                        <div className="flex items-start gap-3">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleTaskCompletion(task.id, task.isCompleted);
                            }}
                            className="mt-0.5 text-slate-400 hover:text-primary transition-colors shrink-0"
                          >
                            <Circle className="h-5 w-5" />
                          </button>
                          <span className="font-bold text-[16px] leading-snug break-all text-slate-800">
                            {task.title}
                          </span>
                        </div>
                        {(task.dueDate || task.priority !== "NONE" || (task.subtasks && task.subtasks.length > 0)) && (
                          <div className="flex items-center gap-2 pl-8 flex-wrap">
                            {task.dueDate && (
                              <div className="flex items-center gap-1.5 px-2 py-1 bg-slate-50 rounded-md border border-slate-100 text-xs font-medium text-slate-500">
                                <Calendar className="h-3 w-3" />
                                {formatDueDate(task.dueDate)}
                              </div>
                            )}
                            {task.priority !== "NONE" && (
                              <div className={cn("flex items-center gap-1.5 px-2 py-1 rounded-md border text-xs font-bold",
                                task.priority === "HIGH" ? "bg-red-50 border-red-100 text-red-600" :
                                  task.priority === "MEDIUM" ? "bg-amber-50 border-amber-100 text-amber-600" :
                                    "bg-blue-50 border-blue-100 text-blue-600"
                              )}>
                                <Flag className="h-3 w-3" /> {task.priority}
                              </div>
                            )}
                            {task.subtasks && task.subtasks.length > 0 && (
                              <div className="flex items-center gap-1.5 px-2 py-1 bg-slate-50 rounded-md border border-slate-100 text-xs font-medium text-slate-500">
                                <ListTodo className="h-3 w-3 text-slate-400" />
                                <span>
                                  {task.subtasks.filter((s: any) => s.isCompleted).length}/{task.subtasks.length}
                                </span>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    ))
                )}

                {filteredTasks.filter(t => t.columnId === columns[focusColumnIndex].id && t.isCompleted).length > 0 && (
                  <div className="mt-6 border-t border-slate-100 pt-4">
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Completed</h3>
                    <div className="flex flex-col gap-2">
                      {filteredTasks
                        .filter(t => t.columnId === columns[focusColumnIndex].id && t.isCompleted)
                        .map((task) => (
                          <div
                            key={task.id}
                            onClick={() => setSelectedTask(task)}
                            className="group flex items-start gap-3 rounded-xl border border-slate-100/50 bg-slate-50/30 p-3 shadow-none opacity-60 hover:opacity-80 transition-all cursor-pointer"
                          >
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleTaskCompletion(task.id, task.isCompleted);
                              }}
                              className="mt-0.5 text-emerald-500 transition-colors shrink-0"
                            >
                              <CheckCircle2 className="h-5 w-5 text-emerald-500 fill-emerald-50 bg-white rounded-full" />
                            </button>
                            <span className="font-bold text-[16px] leading-snug break-all text-slate-400 line-through">
                              {task.title}
                            </span>
                          </div>
                        ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="p-4 bg-slate-50/50 border-t border-slate-100">
                <QuickAddTask
                  columnId={columns[focusColumnIndex].id}
                  projectId={projectId}
                  onAdd={(data) => handleAddTask(data, columns[focusColumnIndex].id)}
                />
              </div>
            </div>

            <Button
              variant="outline"
              size="icon"
              disabled={focusColumnIndex === columns.length - 1}
              onClick={() => setFocusColumnIndex(prev => Math.min(columns.length - 1, prev + 1))}
              className="hidden md:inline-flex h-12 w-12 rounded-full shadow-lg border-slate-200/80 bg-white hover:bg-slate-50 shrink-0 disabled:opacity-40"
            >
              <ChevronRight className="h-6 w-6 text-slate-700" />
            </Button>
          </div>
        </div>
      )}

      {showFollowUpDialog && activeFollowUpTask && (
        <FollowUpDialog
          isOpen={showFollowUpDialog}
          onOpenChange={setShowFollowUpDialog}
          onSelectMethod={handleFollowUpMethod}
          contactName={activeFollowUpTask.title.replace("Follow up with ", "")}
        />
      )}
    </div>
  );
}
