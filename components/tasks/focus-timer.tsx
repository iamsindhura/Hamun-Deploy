"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Play, Pause, Square, CheckCircle2, ArrowLeft } from "lucide-react";
import { createFocusSession } from "@/app/actions/focus";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export function FocusTimer({ task }: { task: any }) {
  const router = useRouter();
  
  const [isRunning, setIsRunning] = useState(false);
  const [actualSeconds, setActualSeconds] = useState(0);
  const [isCompleting, setIsCompleting] = useState(false);
  
  // Calculate total scheduled duration
  const start = new Date(task.startTime).getTime();
  const end = new Date(task.endTime).getTime();
  const totalDurationSeconds = Math.max(0, Math.floor((end - start) / 1000));
  
  // Time remaining on the visual countdown
  const timeRemaining = Math.max(0, totalDurationSeconds - actualSeconds);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isRunning && timeRemaining > 0) {
      interval = setInterval(() => {
        setActualSeconds(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isRunning, timeRemaining]);

  const handleComplete = async () => {
    if (isCompleting) return;
    setIsCompleting(true);
    
    // Pause immediately
    setIsRunning(false);
    
    const result = await createFocusSession(task.id, actualSeconds);
    if (result.success) {
      toast.success("Focus session saved successfully");
      router.push("/deep-work");
    } else {
      toast.error(result.error);
      setIsCompleting(false);
    }
  };

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    
    if (h > 0) {
      return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    }
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center relative selection:bg-indigo-500/30">
      
      {/* Background ambient glow */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className={cn(
          "absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full blur-[120px] opacity-20 transition-all duration-1000",
          isRunning ? "bg-indigo-500 scale-110" : "bg-slate-700 scale-100"
        )} />
      </div>

      <button 
        onClick={() => router.push("/deep-work")}
        className="absolute top-8 left-8 flex items-center gap-2 text-slate-400 hover:text-white transition-colors"
      >
        <ArrowLeft className="h-5 w-5" />
        <span className="font-medium">Exit</span>
      </button>

      <div className="z-10 flex flex-col items-center text-center max-w-2xl px-6 w-full">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-sm font-medium mb-8">
          <div className={cn("h-2 w-2 rounded-full", isRunning ? "bg-indigo-500 animate-pulse" : "bg-slate-500")} />
          Focus Mode
        </div>
        
        <h1 className="text-4xl md:text-5xl font-bold text-white mb-4 tracking-tight">
          {task.title}
        </h1>
        {task.project && (
          <p className="text-lg text-slate-400 font-medium mb-16 flex items-center justify-center gap-2">
            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: task.project.color || '#94a3b8' }} />
            {task.project.name}
          </p>
        )}

        <div className="text-[120px] leading-none font-black text-white tracking-tighter tabular-nums mb-16 drop-shadow-2xl">
          {formatTime(timeRemaining)}
        </div>

        <div className="flex items-center gap-6">
          <button
            onClick={() => setIsRunning(!isRunning)}
            className={cn(
              "flex items-center justify-center h-20 w-20 rounded-full transition-all shadow-xl hover:scale-105 active:scale-95",
              isRunning 
                ? "bg-amber-500 hover:bg-amber-400 text-slate-900" 
                : "bg-white hover:bg-slate-100 text-slate-900"
            )}
          >
            {isRunning ? <Pause className="h-8 w-8 fill-current" /> : <Play className="h-8 w-8 fill-current ml-2" />}
          </button>

          <button
            onClick={handleComplete}
            disabled={isCompleting || actualSeconds === 0}
            className="flex items-center gap-3 px-8 h-20 rounded-full bg-emerald-500 hover:bg-emerald-400 text-slate-900 font-bold text-xl transition-all shadow-xl hover:scale-105 active:scale-95 disabled:opacity-50 disabled:hover:scale-100 disabled:cursor-not-allowed"
          >
            <CheckCircle2 className="h-7 w-7" />
            {isCompleting ? "Saving..." : "Complete Session"}
          </button>
        </div>
        
        <div className="mt-12 text-slate-500 font-medium tracking-wide">
          Actual Focus Time: <span className="text-slate-300">{formatTime(actualSeconds)}</span>
        </div>
      </div>
    </div>
  );
}
