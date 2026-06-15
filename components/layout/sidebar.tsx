"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { useState, useEffect } from "react";
import {
  LayoutDashboard,
  Users,
  Trello,
  LogOut,
  Calendar,
  Sun,
  ListTodo,
  Plus,
  FolderOpen,
  Edit2,
  Trash2,
  X,
  GripVertical,
  Pin
} from "lucide-react";
import { TopTags } from "./top-tags";
import { createProject, updateProject, deleteProject } from "@/app/actions/projects";
import { signOut } from "next-auth/react";
import { Button } from "@/components/ui/button";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

const crmRoutes = [
  {
    label: "Dashboard",
    icon: LayoutDashboard,
    href: "/",
    active: (pathname: string) => pathname === "/",
  },
  {
    label: "Contacts",
    icon: Users,
    href: "/contacts",
    active: (pathname: string) => pathname.startsWith("/contacts"),
  },
  {
    label: "Pipeline",
    icon: Trello,
    href: "/kanban",
    active: (pathname: string) => pathname.startsWith("/kanban"),
  },
];

const smartLists = [
  {
    label: "Today",
    icon: Sun,
    href: "/tasks/today",
    active: (pathname: string) => pathname === "/tasks/today",
  },
  {
    label: "Next 7 Days",
    icon: Calendar,
    href: "/tasks/upcoming",
    active: (pathname: string) => pathname === "/tasks/upcoming",
  },
];

function SortableProjectItem({
  project,
  pathname,
  onClose,
  onRename,
  onDelete,
  onTogglePin,
}: {
  project: any;
  pathname: string;
  onClose?: () => void;
  onRename: (id: string, name: string) => void;
  onDelete: (id: string) => void;
  onTogglePin: (id: string, isPinned: boolean) => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: project.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="group relative flex items-center justify-between rounded-lg hover:bg-sidebar-accent/50 text-sidebar-foreground/70 hover:text-sidebar-foreground transition-all"
    >
      <div
        {...attributes}
        {...listeners}
        className="absolute left-2 top-1/2 -translate-y-1/2 flex items-center cursor-grab text-sidebar-foreground/30 hover:text-sidebar-foreground/60 transition-colors opacity-0 group-hover:opacity-100 z-10"
      >
        <GripVertical className="h-3.5 w-3.5" />
      </div>

      <Link
        href={`/tasks/${project.id}`}
        onClick={onClose}
        className={cn(
          "flex flex-1 items-center gap-2.5 px-3 py-2 text-sm font-medium transition-all pl-8 pr-24 whitespace-normal break-all",
          pathname === `/tasks/${project.id}` && "bg-sidebar-accent text-sidebar-accent-foreground shadow-sm ring-1 ring-white/10 rounded-lg"
        )}
      >
        <div className="relative shrink-0">
          <FolderOpen className="h-4 w-4 text-sidebar-foreground/50" />
          {project.isPinned && (
            <span className="absolute -top-1 -right-1 flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
            </span>
          )}
        </div>
        <span className="whitespace-normal break-all">{project.name}</span>
      </Link>

      {/* Hover Actions */}
      <div className="absolute right-2 top-1.5 hidden group-hover:flex items-center gap-1 z-10 bg-transparent py-0.5">
        <button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onTogglePin(project.id, project.isPinned);
          }}
          className={cn(
            "p-1 rounded hover:bg-sidebar-accent/80 transition-colors",
            project.isPinned ? "text-amber-500 hover:text-amber-600" : "text-sidebar-foreground/60 hover:text-sidebar-foreground"
          )}
          title={project.isPinned ? "Unpin Project" : "Pin Project"}
        >
          <Pin className={cn("h-3.5 w-3.5", project.isPinned && "fill-amber-500")} />
        </button>
        <button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onRename(project.id, project.name);
          }}
          className="p-1 rounded hover:bg-sidebar-accent/80 text-sidebar-foreground/60 hover:text-sidebar-foreground transition-colors"
          title="Rename Project"
        >
          <Edit2 className="h-3.5 w-3.5" />
        </button>
        <button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onDelete(project.id);
          }}
          className="p-1 rounded hover:bg-red-500/20 text-sidebar-foreground/60 hover:text-red-400 transition-colors"
          title="Delete Project"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}

export function Sidebar({ projects = [], isOpen = false, onClose }: { projects?: any[], isOpen?: boolean, onClose?: () => void }) {
  const pathname = usePathname();

  const [activeTab, setActiveTab] = useState<"crm" | "tasks">("crm");
  const [localProjects, setLocalProjects] = useState<any[]>(projects);
  const [width, setWidth] = useState(256);
  const [isResizing, setIsResizing] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);
  useEffect(() => {
    const savedWidth = localStorage.getItem("sidebarWidth");
    if (savedWidth) {
      setWidth(parseInt(savedWidth, 10));
    }
  }, []);

  const startResizing = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
  };

  const stopResizing = () => {
    setIsResizing(false);
  };

  const resize = (e: MouseEvent) => {
    if (isResizing) {
      const newWidth = Math.max(200, Math.min(480, e.clientX));
      setWidth(newWidth);
      localStorage.setItem("sidebarWidth", newWidth.toString());
    }
  };

  useEffect(() => {
    if (isResizing) {
      window.addEventListener("mousemove", resize);
      window.addEventListener("mouseup", stopResizing);
    } else {
      window.removeEventListener("mousemove", resize);
      window.removeEventListener("mouseup", stopResizing);
    }
    return () => {
      window.removeEventListener("mousemove", resize);
      window.removeEventListener("mouseup", stopResizing);
    };
  }, [isResizing]);

  useEffect(() => {
    setLocalProjects(projects);
  }, [projects]);

  useEffect(() => {
    if (pathname.startsWith("/tasks")) {
      setActiveTab("tasks");
    } else {
      setActiveTab("crm");
    }
  }, [pathname]);

  const handleCreateProject = async () => {
    const name = prompt("Enter Project Name:");
    if (name) {
      await createProject({ name });
    }
  };

  const handleRenameProject = async (id: string, currentName: string) => {
    const newName = prompt("Rename Project:", currentName);
    if (newName && newName !== currentName) {
      setLocalProjects(prev => prev.map(p => p.id === id ? { ...p, name: newName } : p));
      await updateProject(id, { name: newName });
    }
  };

  const handleDeleteProject = async (id: string) => {
    if (confirm("Are you sure you want to delete this project? All sections and tasks inside will be deleted too.")) {
      setLocalProjects(prev => prev.filter(p => p.id !== id));
      await deleteProject(id);
    }
  };

  const handleTogglePin = async (id: string, isPinned: boolean) => {
    const nextPinned = !isPinned;
    setLocalProjects(prev => {
      const updated = prev.map(p => p.id === id ? { ...p, isPinned: nextPinned } : p);
      return [...updated].sort((a, b) => {
        if (a.isPinned !== b.isPinned) {
          return a.isPinned ? -1 : 1;
        }
        return a.position - b.position;
      });
    });
    await updateProject(id, { isPinned: nextPinned });
  };

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 3 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = localProjects.findIndex(p => p.id === active.id);
    const newIndex = localProjects.findIndex(p => p.id === over.id);

    const reordered = arrayMove(localProjects, oldIndex, newIndex);
    setLocalProjects(reordered);

    let newPosition = 0;
    if (newIndex === 0) {
      newPosition = (reordered[1]?.position ?? 0) - 1;
    } else if (newIndex === reordered.length - 1) {
      newPosition = (reordered[reordered.length - 2]?.position ?? 0) + 1;
    } else {
      const prevPos = reordered[newIndex - 1]?.position ?? 0;
      const nextPos = reordered[newIndex + 1]?.position ?? 0;
      newPosition = (prevPos + nextPos) / 2;
    }

    const targetIsPinned = reordered[newIndex].isPinned;

    setLocalProjects(prev => prev.map(p => p.id === active.id ? { ...p, position: newPosition, isPinned: targetIsPinned } : p));
    await updateProject(active.id as string, { position: newPosition, isPinned: targetIsPinned });
  };

  const projectIds = localProjects.map(p => p.id);

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/40 md:hidden animate-in fade-in duration-200"
          onClick={onClose}
        />
      )}

      <div
        style={{
          width: mounted ? `${width}px` : undefined
        }}
        className={cn(
          "fixed md:static inset-y-0 left-0 z-40 flex h-full w-64 flex-col border-r bg-sidebar text-sidebar-foreground transition-all duration-300 ease-in-out md:translate-x-0 relative",
          isOpen ? "translate-x-0" : "-translate-x-full",
          isResizing && "transition-none"
        )}
      >
        <div className="p-6 pb-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2" onClick={onClose}>
            <img src="/logo-icon.png" alt="Hamun Logo" className="h-20 w-20 object-contain rounded-xl shadow-sm" />
            <span className="text-xl font-bold tracking-tight">Hamun</span>
          </Link>

          {onClose && (
            <button
              onClick={onClose}
              className="md:hidden p-1.5 rounded-lg hover:bg-sidebar-accent text-sidebar-foreground/60 hover:text-sidebar-foreground transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          )}
        </div>

        <div className="px-4 pb-2">
          <div className="flex p-1 bg-sidebar-accent/50 rounded-lg">
            <button
              className={cn("flex-1 flex items-center justify-center gap-2 py-1.5 text-xs font-semibold rounded-md transition-all", activeTab === "crm" ? "bg-white text-primary shadow-sm" : "text-sidebar-foreground/60 hover:text-sidebar-foreground")}
              onClick={() => setActiveTab("crm")}
            >
              <LayoutDashboard className="h-3.5 w-3.5" /> CRM
            </button>
            <button
              className={cn("flex-1 flex items-center justify-center gap-2 py-1.5 text-xs font-semibold rounded-md transition-all", activeTab === "tasks" ? "bg-white text-primary shadow-sm" : "text-sidebar-foreground/60 hover:text-sidebar-foreground")}
              onClick={() => setActiveTab("tasks")}
            >
              <ListTodo className="h-3.5 w-3.5" /> Tasks
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto py-2">
          {activeTab === "crm" && (
            <div className="px-3 pb-6 animate-in fade-in slide-in-from-left-2 duration-300">
              <nav className="space-y-1">
                {crmRoutes.map((route) => (
                  <Link
                    key={route.href}
                    href={route.href}
                    onClick={onClose}
                    className={cn(
                      "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all",
                      route.active(pathname)
                        ? "bg-sidebar-accent text-sidebar-accent-foreground shadow-sm ring-1 ring-white/10"
                        : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
                    )}
                  >
                    <route.icon className="h-4 w-4" />
                    {route.label}
                  </Link>
                ))}
              </nav>
              <div className="mt-4">
                <TopTags />
              </div>
            </div>
          )}

          {activeTab === "tasks" && (
            <div className="px-3 pb-4 animate-in fade-in slide-in-from-right-2 duration-300">
              <div className="mb-6">
                <nav className="space-y-1">
                  {smartLists.map((list) => (
                    <Link
                      key={list.href}
                      href={list.href}
                      onClick={onClose}
                      className={cn(
                        "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all",
                        list.active(pathname)
                          ? "bg-sidebar-accent text-sidebar-accent-foreground shadow-sm ring-1 ring-white/10"
                          : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
                      )}
                    >
                      <list.icon className="h-4 w-4" />
                      {list.label}
                    </Link>
                  ))}
                </nav>
              </div>

              <div>
                <div className="mb-2 px-3 flex items-center justify-between text-xs font-semibold text-sidebar-foreground/50 uppercase tracking-wider">
                  <span>Projects</span>
                  <button className="hover:text-sidebar-foreground transition-colors" onClick={handleCreateProject}>
                    <Plus className="h-4 w-4" />
                  </button>
                </div>
                <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                  <SortableContext items={projectIds} strategy={verticalListSortingStrategy}>
                    <nav className="space-y-1">
                      {localProjects.map((project: any) => (
                        <SortableProjectItem
                          key={project.id}
                          project={project}
                          pathname={pathname}
                          onClose={onClose}
                          onRename={handleRenameProject}
                          onDelete={handleDeleteProject}
                          onTogglePin={handleTogglePin}
                        />
                      ))}
                      {localProjects.length === 0 && (
                        <div className="px-3 py-2 text-xs text-sidebar-foreground/50 italic">
                          No projects yet
                        </div>
                      )}
                    </nav>
                  </SortableContext>
                </DndContext>
              </div>
            </div>
          )}
        </div>

        <div className="border-t p-4 mt-auto">
          <Button
            variant="ghost"
            className="w-full justify-start text-sidebar-foreground/70 hover:text-red-400 hover:bg-red-400/10 transition-all"
            onClick={() => signOut()}
          >
            <LogOut className="mr-2 h-4 w-4" />
            Logout
          </Button>
        </div>

        {/* Resize Handle */}
        <div
          onMouseDown={startResizing}
          className="absolute right-0 top-0 bottom-0 w-1.5 cursor-col-resize hover:bg-primary/20 active:bg-primary/40 transition-colors z-50 hidden md:block"
        />
      </div>
    </>
  );
}
