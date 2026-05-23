"use client";

import { useState, useMemo } from "react";
import { Task, TaskColumn, TaskPriority } from "@prisma/client";
import { QuickAddTask } from "./quick-add-task";
import { TaskDetailSheet } from "./task-detail-sheet";
import { updateTask, createTask, createColumn } from "@/app/actions/tasks";
import { Plus, Calendar, Flag, CheckCircle2, Circle, GripVertical } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
      className="group relative flex flex-col gap-2 rounded-lg border bg-card p-3 text-sm shadow-sm transition-shadow hover:shadow-md cursor-pointer"
      onClick={onClick}
    >
      <div className="flex items-start gap-2">
        <div {...attributes} {...listeners} className="mt-0.5 cursor-grab text-muted-foreground/30 hover:text-muted-foreground">
          <GripVertical className="h-4 w-4" />
        </div>
        <button 
          onClick={(e) => { e.stopPropagation(); onToggle(task.id, task.isCompleted); }} 
          className="mt-0.5 text-muted-foreground hover:text-primary"
        >
          {task.isCompleted ? <CheckCircle2 className="h-4 w-4 text-primary" /> : <Circle className="h-4 w-4" />}
        </button>
        <span className={cn("flex-1", task.isCompleted && "text-muted-foreground line-through")}>
          {task.title}
        </span>
      </div>
      
      {(task.dueDate || task.priority !== "NONE") && (
        <div className="mt-2 flex items-center gap-3 text-xs text-muted-foreground pl-10">
          {task.dueDate && (
            <div className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              {new Date(task.dueDate).toLocaleDateString()}
            </div>
          )}
          {task.priority !== "NONE" && (
            <div className="flex items-center gap-1">
              <Flag className={cn("h-3 w-3", task.priority === "HIGH" ? "text-red-500" : task.priority === "MEDIUM" ? "text-yellow-500" : "text-blue-500")} />
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function SortableColumn({ column, tasks, onAddTask, onToggleTask, onTaskClick }: any) {
  const { setNodeRef, attributes, listeners, transform, transition, isDragging } = useSortable({
    id: column.id,
    data: { type: "Column", column },
  });

  const style = {
    transition,
    transform: CSS.Transform.toString(transform),
  };

  const taskIds = useMemo(() => tasks.map((t: Task) => t.id), [tasks]);

  if (isDragging) {
    return <div ref={setNodeRef} style={style} className="flex w-80 flex-shrink-0 flex-col rounded-xl border-2 border-primary/50 bg-primary/10 opacity-50 p-3 h-full" />;
  }

  return (
    <div ref={setNodeRef} style={style} className="flex w-80 flex-shrink-0 flex-col rounded-xl bg-muted/40 border p-3 h-full">
      <div className="mb-3 flex items-center justify-between font-semibold" {...attributes} {...listeners}>
        <div className="flex items-center gap-2 cursor-grab">
          <GripVertical className="h-4 w-4 text-muted-foreground" />
          <span>{column.name}</span>
        </div>
        <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
          {tasks.length}
        </span>
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
          newTasks[activeIndex].columnId = newTasks[overIndex].columnId;
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
        newTasks[activeIndex].columnId = overId as string;
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
    if (activeId === overId) return;

    // Handle Column sorting
    if (active.data.current?.type === "Column") {
      const activeColumnIndex = columns.findIndex(c => c.id === activeId);
      const overColumnIndex = columns.findIndex(c => c.id === overId);
      const newColumns = arrayMove(columns, activeColumnIndex, overColumnIndex);
      setColumns(newColumns);
      // Note: Ideally persist column order here
      return;
    }

    // Handle Task sorting
    if (active.data.current?.type === "Task") {
      // Find the task that was moved
      const movedTask = tasks.find(t => t.id === activeId);
      if (movedTask) {
        // Persist the new columnId and order (position)
        await updateTask(movedTask.id, projectId, { 
          columnId: movedTask.columnId,
          // position could be handled if we update the backend to take array ordering
        });
      }
    }
  };

  const columnIds = useMemo(() => columns.map(c => c.id), [columns]);

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDragEnd={onDragEnd}
    >
      <div className="flex h-full gap-4 overflow-x-auto p-4 pb-8 items-start">
        <SortableContext items={columnIds} strategy={horizontalListSortingStrategy}>
          {columns.map(column => (
            <SortableColumn 
              key={column.id} 
              column={column} 
              tasks={tasks.filter(t => t.columnId === column.id)} 
              onAddTask={handleAddTask}
              onToggleTask={toggleTaskCompletion}
              onTaskClick={setSelectedTask}
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
