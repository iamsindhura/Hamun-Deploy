"use client";

import { useState } from "react";
import { Sidebar } from "./sidebar";
import { Menu } from "lucide-react";
import Link from "next/link";
import { ThemeToggle } from "./theme-toggle";

export function ResponsiveLayout({
 children,
 projects,
}: {
 children: React.ReactNode;
 projects: any[];
}) {
 const [sidebarOpen, setSidebarOpen] = useState(false);

 return (
 <div className="flex h-screen overflow-hidden bg-background">
 <Sidebar 
 projects={projects} 
 isOpen={sidebarOpen} 
 onClose={() => setSidebarOpen(false)} 
 />

 <div className="flex flex-col flex-1 overflow-hidden">
 {/* Mobile Header Bar */}
 <header className="flex h-14 items-center justify-between border-b bg-sidebar px-4 text-sidebar-foreground md:hidden shrink-0 z-20">
 <div className="flex items-center gap-3">
 <button
 onClick={() => setSidebarOpen(true)}
 className="rounded-lg p-1.5 hover:bg-sidebar-accent text-sidebar-foreground/80 hover:text-sidebar-foreground transition-colors"
 >
 <Menu className="h-5.5 w-5.5" />
 </button>
 </div>
 <ThemeToggle />
 </header>

 {/* Main Content Area */}
 <main className="flex-1 overflow-y-auto relative">
 {children}
 </main>
 </div>
 </div>
 );
}
