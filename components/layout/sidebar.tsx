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
  Trash2
} from "lucide-react";
import { TopTags } from "./top-tags";
import { createProject, updateProject, deleteProject } from "@/app/actions/projects";
import { signOut } from "next-auth/react";
import { Button } from "@/components/ui/button";

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

export function Sidebar({ projects = [] }: { projects?: any[] }) {
  const pathname = usePathname();

  const [activeTab, setActiveTab] = useState<"crm" | "tasks">("crm");

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
      await updateProject(id, { name: newName });
    }
  };

  const handleDeleteProject = async (id: string) => {
    if (confirm("Are you sure you want to delete this project? All sections and tasks inside will be deleted too.")) {
      await deleteProject(id);
    }
  };

  return (
    <div className="flex h-full w-64 flex-col border-r bg-sidebar text-sidebar-foreground">
      <div className="p-6 pb-4">
        <Link href="/" className="flex items-center gap-2">
          <img src="/logo-icon.png" alt="Hamun Logo" className="h-20 w-20 object-contain rounded-xl shadow-sm" />
          <span className="text-xl font-bold tracking-tight">Hamun</span>
        </Link>
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
              <nav className="space-y-1">
                {projects.map((project: any) => (
                  <div 
                    key={project.id} 
                    className="group relative flex items-center justify-between rounded-lg hover:bg-sidebar-accent/50 text-sidebar-foreground/70 hover:text-sidebar-foreground transition-all"
                  >
                    <Link
                      href={`/tasks/${project.id}`}
                      className={cn(
                        "flex flex-1 items-center gap-3 px-3 py-2 text-sm font-medium transition-all truncate pr-16",
                        pathname === `/tasks/${project.id}` && "bg-sidebar-accent text-sidebar-accent-foreground shadow-sm ring-1 ring-white/10 rounded-lg"
                      )}
                    >
                      <FolderOpen className="h-4 w-4 shrink-0" />
                      <span className="truncate">{project.name}</span>
                    </Link>

                    {/* Hover Actions */}
                    <div className="absolute right-2 top-1.5 hidden group-hover:flex items-center gap-1 z-10 bg-transparent py-0.5">
                      <button 
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          handleRenameProject(project.id, project.name);
                        }}
                        className="p-1 rounded hover:bg-sidebar-accent/80 text-sidebar-foreground/60 hover:text-sidebar-foreground transition-colors"
                      >
                        <Edit2 className="h-3.5 w-3.5" />
                      </button>
                      <button 
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          handleDeleteProject(project.id);
                        }}
                        className="p-1 rounded hover:bg-red-500/20 text-sidebar-foreground/60 hover:text-red-400 transition-colors"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
                {projects.length === 0 && (
                  <div className="px-3 py-2 text-xs text-sidebar-foreground/50 italic">
                    No projects yet
                  </div>
                )}
              </nav>
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
    </div>
  );
}
