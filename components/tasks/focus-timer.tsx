"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Play, Pause, Square, CheckCircle2, ArrowLeft } from "lucide-react";
import { createFocusSession } from "@/app/actions/focus";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

import { playAudioCue } from "@/lib/audio";

export function FocusTimer({ 
 task, 
 audioSettings 
}: { 
 task: any, 
 audioSettings?: {
 audioCuesEnabled: boolean;
 audioCheckpointsEnabled: boolean;
 audioWarningEnabled: boolean;
 audioVolume: string;
 }
}) {
 const router = useRouter();
 const searchParams = useSearchParams();
 
 const [isRunning, setIsRunning] = useState(false);
 const [actualSeconds, setActualSeconds] = useState(0);
 const [isCompleting, setIsCompleting] = useState(false);
 const [hasStarted, setHasStarted] = useState(false);
 
 // Calculate total scheduled duration
 let totalDurationSeconds = 0;
 const queryDuration = searchParams.get('duration');
 
 if (queryDuration && !isNaN(parseInt(queryDuration, 10))) {
 totalDurationSeconds = parseInt(queryDuration, 10) * 60;
 } else if (task.startTime && task.endTime) {
 const start = new Date(task.startTime).getTime();
 const end = new Date(task.endTime).getTime();
 totalDurationSeconds = Math.max(0, Math.floor((end - start) / 1000));
 } else if (task.estimatedDurationMinutes) {
 totalDurationSeconds = task.estimatedDurationMinutes * 60;
 } else {
 totalDurationSeconds = 30 * 60; // fallback to 30 mins
 }
 
 // Time remaining on the visual countdown
 const timeRemaining = Math.max(0, totalDurationSeconds - actualSeconds);

 // Audio configuration
 const cuesEnabled = audioSettings?.audioCuesEnabled ?? true;
 const checkpointsEnabled = audioSettings?.audioCheckpointsEnabled ?? true;
 const warningEnabled = audioSettings?.audioWarningEnabled ?? true;
 const vol = (audioSettings?.audioVolume ?? "HIGH") as "LOW" | "MEDIUM" | "HIGH";

 // Session duration thresholds
 const isShortSession = totalDurationSeconds <= 1200; // <= 20 mins
 const checkpointIntervalSeconds = 900; // Every 15 mins
 const lastCheckpointRef = useRef(0);
 const hasPlayedWarningRef = useRef(false);
 const hasPlayedCompleteRef = useRef(false);

 // Ask for notification permission on mount
 useEffect(() => {
 if ("Notification" in window && Notification.permission === "default") {
 Notification.requestPermission();
 }
 }, []);

 const fireNotification = (title: string, body: string) => {
 if ("Notification" in window && Notification.permission === "granted") {
 new Notification(title, { body });
 } else {
 console.warn("Notification fallback: Permission denied or unavailable.", title, body);
 }
 };

 useEffect(() => {
 let interval: NodeJS.Timeout;
 if (isRunning && timeRemaining > 0) {
 interval = setInterval(() => {
 setActualSeconds(prev => prev + 1);
 }, 1000);
 }
 return () => clearInterval(interval);
 }, [isRunning, timeRemaining]);

 useEffect(() => {
 if (!isRunning || !cuesEnabled) return;
 
 const isFiveMinuteWarningTime = timeRemaining === 300;
 
 if (
 checkpointsEnabled && 
 !isShortSession &&
 actualSeconds > 0 && 
 actualSeconds % checkpointIntervalSeconds === 0 &&
 !isFiveMinuteWarningTime
 ) {
 if (lastCheckpointRef.current !== actualSeconds) {
 lastCheckpointRef.current = actualSeconds;
 playAudioCue('checkpoint', vol);
 console.log("15 minute checkpoint notification");
 fireNotification("Focus Checkpoint", "You are doing great! Keep going.");
 }
 }

 if (warningEnabled && isFiveMinuteWarningTime) {
 if (!hasPlayedWarningRef.current) {
 hasPlayedWarningRef.current = true;
 playAudioCue('warning', vol);
 console.log("5 minute warning notification");
 fireNotification("5 Minutes Remaining", "Finish up your current thought.");
 }
 }

 if (timeRemaining === 0 && actualSeconds > 0) {
 if (!hasPlayedCompleteRef.current) {
 hasPlayedCompleteRef.current = true;
 playAudioCue('complete', vol);
 setIsRunning(false);
 console.log("Focus session completed notification");
 fireNotification("Focus Session Completed", "Great job! Time for a break.");
 }
 }
 }, [actualSeconds, timeRemaining, isRunning, cuesEnabled, checkpointsEnabled, warningEnabled, vol, checkpointIntervalSeconds]);

 const handlePlayPause = () => {
 if (!hasStarted && cuesEnabled && !isRunning) {
 setHasStarted(true);
 playAudioCue('start', vol);
 console.log("Focus session started notification");
 fireNotification("Focus Session Started", `Time to focus on: ${task.title}`);
 }
 setIsRunning(!isRunning);
 };

 const handleComplete = async () => {
 if (isCompleting) return;
 setIsCompleting(true);
 
 // Pause immediately
 setIsRunning(false);
 
 const result = await createFocusSession(task.id, actualSeconds);
 if (result.success) {
 toast.success("Focus session saved successfully");
 router.back();
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
 onClick={() => router.back()}
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
 onClick={handlePlayPause}
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

 {process.env.NODE_ENV === "development" && (
 <button 
 onClick={() => {
 if ("Notification" in window && Notification.permission === "granted") {
 new Notification("Hamun Test", { body: "Notifications are working correctly" });
 } else if ("Notification" in window && Notification.permission === "default") {
 Notification.requestPermission().then(p => {
 if (p === "granted") new Notification("Hamun Test", { body: "Notifications are working correctly" });
 });
 } else {
 alert("Notifications are denied or not supported by your browser.");
 }
 }}
 className="mt-12 px-6 py-2.5 bg-slate-800/50 text-slate-400 border border-slate-700 rounded-full text-sm font-medium hover:bg-slate-800 hover:text-slate-300 transition-colors"
 >
 Test Notification
 </button>
 )}
 
 <div className="mt-12 text-slate-500 font-medium tracking-wide">
 Actual Focus Time: <span className="text-slate-300">{formatTime(actualSeconds)}</span>
 </div>
 </div>
 </div>
 );
}
