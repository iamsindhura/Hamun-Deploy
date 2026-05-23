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
  FolderOpen
} from "lucide-react";
import { signOut } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { TopTags } from "./top-tags";
import { createWorkspace } from "@/app/actions/workspaces";
import { createProject } from "@/app/actions/projects";

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

export function Sidebar({ workspaces = [] }: { workspaces?: any[] }) {
  const pathname = usePathname();
  const [activeWorkspaceId, setActiveWorkspaceId] = useState<string | null>(null);

  const handleCreateWorkspace = async () => {
    const name = prompt("Enter Workspace Name:");
    if (name) {
      const res = await createWorkspace({ name });
      if (res.success && res.data) {
        setActiveWorkspaceId(res.data.id);
      }
    }
  };

  const handleCreateProject = async () => {
    if (!activeWorkspaceId) return;
    const name = prompt("Enter Project Name:");
    if (name) {
      await createProject({ name, workspaceId: activeWorkspaceId });
    }
  };

  useEffect(() => {
    if (workspaces.length > 0 && !activeWorkspaceId) {
      setActiveWorkspaceId(workspaces[0].id);
    }
  }, [workspaces, activeWorkspaceId]);

  const activeWorkspace = workspaces.find((w) => w.id === activeWorkspaceId);

  return (
    <div className="flex h-full w-64 flex-col border-r bg-sidebar text-sidebar-foreground">
      <div className="p-6">
        <Link href="/" className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
            <span className="text-xl font-bold text-primary-foreground">N</span>
          </div>
          <span className="text-xl font-bold tracking-tight">NanoCRM</span>
        </Link>
      </div>

      <div className="px-3 mb-4 flex gap-1 overflow-x-auto no-scrollbar pb-2">
        {workspaces.map(ws => (
          <button
            key={ws.id}
            onClick={() => setActiveWorkspaceId(ws.id)}
            className={cn(
              "px-3 py-1.5 text-xs font-medium rounded-full transition-colors whitespace-nowrap",
              activeWorkspaceId === ws.id 
                ? "bg-primary text-primary-foreground" 
                : "bg-sidebar-accent/50 text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground"
            )}
          >
            {ws.name}
          </button>
        ))}
        <button 
          onClick={handleCreateWorkspace}
          className="px-3 py-1.5 text-xs font-medium rounded-full bg-sidebar-accent/30 text-sidebar-foreground/50 hover:bg-sidebar-accent hover:text-sidebar-foreground transition-colors flex items-center justify-center"
        >
          <Plus className="h-3.5 w-3.5" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto space-y-6">
        <div className="px-3">
          <div className="mb-2 px-3 text-xs font-semibold text-sidebar-foreground/50 uppercase tracking-wider">
            CRM
          </div>
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
        </div>
        
        <TopTags />

        <div className="px-3">
          <div className="mb-2 px-3 text-xs font-semibold text-sidebar-foreground/50 uppercase tracking-wider">
            Tasks
          </div>
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

        {activeWorkspace && (
          <div className="px-3">
            <div className="mb-2 px-3 flex items-center justify-between text-xs font-semibold text-sidebar-foreground/50 uppercase tracking-wider">
              <span>Projects</span>
              <button className="hover:text-sidebar-foreground" onClick={handleCreateProject}>
                <Plus className="h-4 w-4" />
              </button>
            </div>
            <nav className="space-y-1">
              {activeWorkspace.projects?.map((project: any) => (
                <Link
                  key={project.id}
                  href={`/tasks/${project.id}`}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all",
                    pathname === `/tasks/${project.id}`
                      ? "bg-sidebar-accent text-sidebar-accent-foreground shadow-sm ring-1 ring-white/10"
                      : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
                  )}
                >
                  <FolderOpen className="h-4 w-4" />
                  {project.name}
                </Link>
              ))}
              {(!activeWorkspace.projects || activeWorkspace.projects.length === 0) && (
                <div className="px-3 py-2 text-xs text-sidebar-foreground/50 italic">
                  No projects yet
                </div>
              )}
            </nav>
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
