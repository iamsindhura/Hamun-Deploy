"use client";

import { useTheme } from "next-themes";
import { Monitor, Moon, Sun } from "lucide-react";
import { updateTheme } from "@/app/actions/user";
import { 
 DropdownMenu, 
 DropdownMenuContent, 
 DropdownMenuItem, 
 DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function ThemeToggle() {
 const { setTheme, theme } = useTheme();

 const handleSetTheme = async (newTheme: string) => {
 setTheme(newTheme);
 await updateTheme(newTheme.toUpperCase());
 };

 return (
 <DropdownMenu>
 <DropdownMenuTrigger className={cn(buttonVariants({ variant: "ghost", size: "icon" }), "h-9 w-9 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-50")}>
 <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
 <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
 <span className="sr-only">Toggle theme</span>
 </DropdownMenuTrigger>
 <DropdownMenuContent align="end">
 <DropdownMenuItem onClick={() => handleSetTheme("light")}>
 <Sun className="h-4 w-4 mr-2" /> Light
 </DropdownMenuItem>
 <DropdownMenuItem onClick={() => handleSetTheme("dark")}>
 <Moon className="h-4 w-4 mr-2" /> Dark
 </DropdownMenuItem>
 </DropdownMenuContent>
 </DropdownMenu>
 );
}
