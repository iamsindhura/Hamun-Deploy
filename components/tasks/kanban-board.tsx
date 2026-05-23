"use client";

import { useState, useMemo } from "react";
import { Task, TaskColumn, TaskPriority } from "@prisma/client";
import { QuickAddTask } from "./quick-add-task";
import { TaskDetailSheet } from "./task-detail-sheet";
import { updateTask, createTask, createColumn, deleteColumn, updateColumn } from "@/app/actions/tasks";
import { Plus, Calendar, Flag, CheckCircle2, Circle, GripVertical, MoreHorizontal, Trash2, Edit2 } from "lucide-react";
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

const COLUMN_COLORS = [
  { bg: "bg-indigo-50/80", border: "border-t-indigo-500", text: "text-indigo-800" },
  { bg: "bg-purple-50/80", border: "border-t-purple-500", text: "text-purple-800" },
  { bg: "bg-pink-50/80", border: "border-t-pink-500", text: "text-pink-800" },
  { bg: "bg-amber-50/80", border: "border-t-amber-500", text: "text-amber-800" },
  { bg: "bg-emerald-50/80", border: "border-t-emerald-500", text: "text-emerald-800" },
  { bg: "bg-cyan-50/80", border: "border-t-cyan-500", text: "text-cyan-800" },
];

function SortableTask({ task, onClick, onToggle }: { task: Task, onClick: () => void, onToggle: (id: string, completed: boolean) => void }) {
  const { setNodeRef, attributes, listeners, transform, transition, isDragging } = useSortable({
    id: task.id,
    data: { type: "Task", task },
  });

  const style = {
    transition,
    transform: CSS.Transform.toString(transform),
  };

  if (isDragging) {
    return (
      <div ref={setNodeRef} style={style} className="h-20 rounded-lg border-2 border-primary/50 bg-primary/10 opacity-50" />
    );
  }

  return (
    <div 
      ref={setNodeRef} 
      style={style} 
      className="group relative flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md cursor-pointer"
      onClick={onClick}
    >
      <div className="flex items-start gap-2">
        <div {...attributes} {...listeners} className="mt-0.5 cursor-grab text-slate-300 hover:text-slate-500 transition-colors">
          <GripVertical className="h-4 w-4" />
        </div>
        <button 
          onClick={(e) => { e.stopPropagation(); onToggle(task.id, task.isCompleted); }} 
          className="mt-0.5 text-slate-400 hover:text-primary transition-colors shrink-0"
        >
          {task.isCompleted ? <CheckCircle2 className="h-5 w-5 text-primary" /> : <Circle className="h-5 w-5" />}
        </button>
        <span className={cn("flex-1 font-semibold text-[15px] leading-snug text-slate-800", task.isCompleted && "text-slate-400 line-through")}>
          {task.title}
        </span>
      </div>
      
      {(task.dueDate || task.priority !== "NONE") && (
        <div className="mt-2 flex items-center gap-2 pl-8 flex-wrap">
          {task.dueDate && (
            <div className="flex items-center gap-1.5 px-2 py-1 bg-slate-50 rounded-md border border-slate-100 text-xs font-medium text-slate-500">
              <Calendar className="h-3 w-3" />
              {new Date(task.dueDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
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
        </div>
      )}
    </div>
  );
}

function SortableColumn({ column, index, tasks, onAddTask, onToggleTask, onTaskClick, onRename, onDelete }: any) {
  const { setNodeRef, attributes, listeners, transform, transition, isDragging } = useSortable({
    id: column.id,
    data: { type: "Column", column },
  });

  const style = {
    transition,
    transform: CSS.Transform.toString(transform),
  };

  const taskIds = useMemo(() => tasks.map((t: Task) => t.id), [tasks]);

  const colors = COLUMN_COLORS[index % COLUMN_COLORS.length];

  if (isDragging) {
    return <div ref={setNodeRef} style={style} className="flex w-80 flex-shrink-0 flex-col rounded-xl border-2 border-primary/50 bg-primary/10 opacity-50 p-3 h-full" />;
  }

  return (
    <div ref={setNodeRef} style={style} className={cn("flex w-80 flex-shrink-0 flex-col rounded-xl border-t-[4px] p-4 h-full shadow-sm", colors.bg, colors.border)}>
      <div className="mb-4 flex items-center justify-between">
        <div className={cn("flex items-center gap-2 cursor-grab font-bold tracking-wide", colors.text)} {...attributes} {...listeners}>
          <GripVertical className="h-4 w-4 opacity-50" />
          <span>{column.name}</span>
        </div>
        <div className="flex items-center gap-1">
          <Badge variant="outline" className={cn("bg-white shadow-sm font-semibold mr-1", colors.text)}>
            {tasks.length}
          </Badge>
          <DropdownMenu>
            <DropdownMenuTrigger className="flex h-6 w-6 items-center justify-center rounded-md hover:bg-muted text-muted-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring">
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

      <div className="flex flex-1 flex-col gap-2 overflow-y-auto no-scrollbar pb-2">
        <SortableContext items={taskIds} strategy={verticalListSortingStrategy}>
          {tasks.map((task: Task) => (
            <SortableTask 
              key={task.id} 
              task={task} 
              onClick={() => onTaskClick(task)}
              onToggle={onToggleTask}
            />
          ))}
        </SortableContext>
      </div>

      <div className="mt-2">
        <QuickAddTask columnId={column.id} projectId={column.projectId} onAdd={(title) => onAddTask(title, column.id)} />
      </div>
    </div>
  );
}

interface KanbanBoardProps {
  projectId: string;
  initialColumns: TaskColumn[];
  initialTasks: Task[];
}

export function KanbanBoard({ projectId, initialColumns, initialTasks }: KanbanBoardProps) {
  const [columns, setColumns] = useState<TaskColumn[]>(initialColumns);
  const [tasks, setTasks] = useState<Task[]>(initialTasks);
  const [isAddingColumn, setIsAddingColumn] = useState(false);
  const [newColumnName, setNewColumnName] = useState("");
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);

  const [activeColumn, setActiveColumn] = useState<TaskColumn | null>(null);
  const [activeTask, setActiveTask] = useState<Task | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 3 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleAddTask = async (title: string, columnId: string) => {
    const tempId = `temp-${Date.now()}`;
    const newTask: Task = {
      id: tempId,
      title,
      description: null,
      isCompleted: false,
      dueDate: null,
      reminderAt: null,
      priority: TaskPriority.NONE,
      isPinned: false,
      position: tasks.filter(t => t.columnId === columnId).length,
      projectId,
      columnId,
      userId: "",
      createdAt: new Date(),
      updatedAt: new Date()
    };
    setTasks([...tasks, newTask]);

    const result = await createTask({ title, columnId, projectId, position: newTask.position });
    if (result.success && result.data) {
      setTasks(prev => prev.map(t => t.id === tempId ? result.data as Task : t));
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
    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, isCompleted: !isCompleted } : t));
    await updateTask(taskId, projectId, { isCompleted: !isCompleted });
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
              tasks={tasks.filter(t => t.columnId === column.id)} 
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
              className="w-full justify-start border-dashed bg-transparent"
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
            tasks={tasks.filter(t => t.columnId === activeColumn.id)} 
            onAddTask={() => {}}
            onToggleTask={() => {}}
            onTaskClick={() => {}}
            onRename={() => {}}
            onDelete={() => {}}
          />
        )}
        {activeTask && (
          <SortableTask 
            task={activeTask} 
            onClick={() => {}}
            onToggle={() => {}}
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
  );
}
