import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { AudioSettingsCard } from "@/components/deep-work/audio-settings-card";
import { MonthlyFocusHeatmap } from "@/components/deep-work/monthly-focus-heatmap";
import { Play, TrendingUp, Target, Clock, Calendar as CalendarIcon, Trophy, Activity, CheckCircle2 } from "lucide-react";

function formatDuration(totalMs: number) {
 if (totalMs <= 0) return "0h 0m";
 const totalMinutes = Math.round(totalMs / (1000 * 60));
 const h = Math.floor(totalMinutes / 60);
 const m = Math.round(totalMinutes % 60);
 
 if (h > 0 && m > 0) return `${h}h ${m}m`;
 if (h > 0) return `${h}h`;
 return `${m}m`;
}

function getLocalDayString(d: Date) {
 const year = d.getFullYear();
 const month = String(d.getMonth() + 1).padStart(2, '0');
 const day = String(d.getDate()).padStart(2, '0');
 return `${year}-${month}-${day}`;
}

export default async function DeepWorkPage() {
 const session = await auth();
 if (!session?.user) redirect("/login");

 const dbUser = await prisma.user.findUnique({
 where: { id: session.user.id },
 select: {
 audioCuesEnabled: true,
 audioCheckpointsEnabled: true,
 audioWarningEnabled: true,
 audioVolume: true,
 }
 });

 const today = new Date();
 today.setHours(0, 0, 0, 0);
 
 const tomorrow = new Date(today);
 tomorrow.setDate(tomorrow.getDate() + 1);

 // Fetch ALL focus sessions
 const focusSessions = await prisma.focusSession.findMany({
 where: { userId: session.user.id },
 include: { 
 task: {
 include: { project: true }
 } 
 },
 orderBy: { startTime: 'desc' }
 });

 let completedTodayMs = 0;
 const sessionDailyMs: Record<string, number> = {};
 
 const currentDayOfWeek = today.getDay();
 const diffToMonday = currentDayOfWeek === 0 ? -6 : 1 - currentDayOfWeek;
 const mondayOfThisWeek = new Date(today);
 mondayOfThisWeek.setDate(today.getDate() + diffToMonday);
 
 let totalWeeklyCompletedMs = 0;
 let totalSessionsToday = 0;
 let totalMsAllTime = 0;
 let longestSessionMs = 0;

 const projectFocusTime: Record<string, { name: string, color: string, ms: number }> = {};

 focusSessions.forEach(s => {
 const st = new Date(s.startTime);
 const sessionMs = s.actualFocusDuration * 1000;
 const dateStr = getLocalDayString(st);
 
 sessionDailyMs[dateStr] = (sessionDailyMs[dateStr] || 0) + sessionMs;
 totalMsAllTime += sessionMs;
 
 if (sessionMs > longestSessionMs) {
 longestSessionMs = sessionMs;
 }

 if (st >= today && st < tomorrow) {
 completedTodayMs += sessionMs;
 totalSessionsToday++;
 }

 const stDayStart = new Date(st);
 stDayStart.setHours(0, 0, 0, 0);
 const diffDaysFromMonday = Math.floor((stDayStart.getTime() - mondayOfThisWeek.getTime()) / (1000 * 60 * 60 * 24));
 if (diffDaysFromMonday >= 0 && diffDaysFromMonday < 7) {
 totalWeeklyCompletedMs += sessionMs;
 }

 // Aggregate by project
 if (s.task.project) {
 const pId = s.task.projectId;
 if (!projectFocusTime[pId]) {
 projectFocusTime[pId] = {
 name: s.task.project.name,
 color: s.task.project.color || 'blue',
 ms: 0
 };
 }
 projectFocusTime[pId].ms += sessionMs;
 }
 });

 const avgSessionMs = focusSessions.length > 0 ? Math.floor(totalMsAllTime / focusSessions.length) : 0;

 // Streak calculation (Assuming 30min minimum for a streak day)
 let currentStreak = 0;
 let loopDate = new Date(today);
 const todayStr = getLocalDayString(loopDate);
 
 const STREAK_THRESHOLD_MS = 30 * 60 * 1000;

 if ((sessionDailyMs[todayStr] || 0) >= STREAK_THRESHOLD_MS) {
 currentStreak++;
 loopDate.setDate(loopDate.getDate() - 1);
 } else {
 loopDate.setDate(loopDate.getDate() - 1);
 }

 while (true) {
 const dStr = getLocalDayString(loopDate);
 if ((sessionDailyMs[dStr] || 0) >= STREAK_THRESHOLD_MS) {
 currentStreak++;
 loopDate.setDate(loopDate.getDate() - 1);
 } else {
 break;
 }
 }

 // Weekly Goal logic (15 hours target)
 const weeklyTargetMs = 15 * 60 * 60 * 1000;
 let completionPercentage = Math.round((totalWeeklyCompletedMs / weeklyTargetMs) * 100);
 if (completionPercentage > 100) completionPercentage = 100;


 const topProjects = Object.values(projectFocusTime)
 .sort((a, b) => b.ms - a.ms)
 .slice(0, 5);

 return (
 <div className="flex h-full flex-col bg-background">
 <div className="flex h-16 items-center border-b border-border bg-card px-8 shrink-0">
 <h1 className="text-xl font-bold flex items-center gap-3 text-foreground">
 <Activity className="h-6 w-6 text-[#8B5CF6]" />
 Deep Work Analytics
 </h1>
 </div>
 <div className="flex-1 overflow-y-auto p-8 space-y-8 max-w-7xl mx-auto w-full">
 
 {/* Top 4 Metric Cards */}
 <div className="grid gap-6 grid-cols-2 lg:grid-cols-4">
 <div className="rounded-2xl border border-border bg-card hover:bg-muted p-6 shadow-sm relative overflow-hidden group transition-all duration-300 hover:shadow-lg hover:-translate-y-1 hover:border-[#8B5CF6]/50">
 <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:scale-110 transition-transform text-foreground">
 <Clock className="w-16 h-16" />
 </div>
 <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Deep Work Today</div>
 <div className="text-4xl font-black text-foreground tracking-tight">{formatDuration(completedTodayMs)}</div>
 <div className="text-sm font-medium text-muted-foreground mt-2 flex items-center gap-1.5">
 <CheckCircle2 className="w-4 h-4 text-[#22C55E]" /> {totalSessionsToday} sessions today
 </div>
 </div>

 <div className="rounded-2xl border border-border bg-card hover:bg-muted p-6 shadow-sm relative overflow-hidden group transition-all duration-300 hover:shadow-lg hover:-translate-y-1 hover:border-[#8B5CF6]/50">
 <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:scale-110 transition-transform text-foreground">
 <Target className="w-16 h-16" />
 </div>
 <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Weekly Goal</div>
 <div className="flex items-end gap-2">
 <div className="text-4xl font-black text-foreground tracking-tight">{formatDuration(totalWeeklyCompletedMs)}</div>
 <div className="text-xl font-bold text-muted-foreground mb-1">/ 15h</div>
 </div>
 <div className="w-full bg-border h-2.5 rounded-full mt-3.5 overflow-hidden border border-background">
 <div className="bg-gradient-to-r from-[#8B5CF6] to-[#7C3AED] h-full rounded-full transition-all duration-1000 shadow-[0_0_10px_rgba(139,92,246,0.4)]" style={{ width: `${completionPercentage}%` }}></div>
 </div>
 </div>

 <div className="rounded-2xl border border-border bg-card hover:bg-muted p-6 shadow-sm relative overflow-hidden group transition-all duration-300 hover:shadow-lg hover:-translate-y-1 hover:border-[#8B5CF6]/50">
 <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:scale-110 transition-transform text-foreground">
 <TrendingUp className="w-16 h-16" />
 </div>
 <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Focus Streak</div>
 <div className="flex items-end gap-2">
 <div className="text-4xl font-black text-foreground tracking-tight">{currentStreak}</div>
 <div className="text-xl font-bold text-muted-foreground mb-1">Days</div>
 </div>
 <div className="text-sm font-medium text-muted-foreground mt-2 flex items-center gap-1.5">
 Consecutive days focused
 </div>
 </div>

 <div className="rounded-2xl border border-border bg-card hover:bg-muted p-6 shadow-sm relative overflow-hidden group transition-all duration-300 hover:shadow-lg hover:-translate-y-1 hover:border-[#8B5CF6]/50">
 <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:scale-110 transition-transform text-foreground">
 <Trophy className="w-16 h-16" />
 </div>
 <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Total Time Focused</div>
 <div className="text-4xl font-black text-foreground tracking-tight">{formatDuration(totalMsAllTime)}</div>
 <div className="text-sm font-medium text-muted-foreground mt-2 flex items-center gap-1.5">
 Across {focusSessions.length} total sessions
 </div>
 </div>
 </div>

 <div className="grid lg:grid-cols-3 gap-6">
 
 <div className="lg:col-span-2 space-y-6">
 
          {/* Heatmap Section */}
          <MonthlyFocusHeatmap focusSessions={focusSessions} />

 {/* Recent Sessions */}
 <div className="bg-card rounded-2xl border border-border p-8 shadow-sm hover:border-[#8B5CF6]/30 transition-colors">
 <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-6 flex items-center gap-2.5">
 <Play className="w-4 h-4 text-[#8B5CF6]" /> Recent Focus Sessions
 </h2>
 {focusSessions.length > 0 ? (
 <div className="space-y-3">
 {focusSessions.slice(0, 6).map(session => (
 <div key={session.id} className="flex items-center justify-between p-4 rounded-xl border border-border bg-background hover:bg-muted transition-colors group">
 <div className="flex flex-col">
 <span className="font-semibold text-foreground text-[15px]">{session.task.title}</span>
 <div className="flex items-center gap-3 mt-1.5">
 {session.task.project && (
 <span className="text-xs font-medium text-[#8B5CF6] flex items-center gap-1.5 bg-[#8B5CF6]/10 px-2.5 py-0.5 rounded-md border border-[#8B5CF6]/20">
 {session.task.project.name}
 </span>
 )}
 <span className="text-xs font-medium text-muted-foreground">
 {new Date(session.startTime).toLocaleDateString()}
 </span>
 </div>
 </div>
 <span className="font-bold text-foreground bg-[#8B5CF6]/20 border border-[#8B5CF6]/30 px-3 py-1.5 rounded-lg text-sm shadow-sm group-hover:bg-[#8B5CF6]/30 transition-colors">
 {formatDuration(session.actualFocusDuration * 1000)}
 </span>
 </div>
 ))}
 </div>
 ) : (
 <div className="text-center py-12 text-sm font-medium text-muted-foreground bg-background rounded-xl border border-dashed border-border">
 <Clock className="w-8 h-8 mx-auto mb-3 text-muted-foreground" />
 No focus sessions recorded yet. <br/>Start a timer from any task to see it here!
 </div>
 )}
 </div>

 </div>

 <div className="space-y-6">
 
 {/* Session Stats Mini-cards */}
 <div className="grid grid-cols-2 gap-4">
 <div className="bg-card rounded-xl border border-border p-6 shadow-sm text-center hover:bg-muted transition-colors group">
 <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1.5">Average Session</div>
 <div className="text-2xl font-black text-foreground group-hover:scale-105 transition-transform">{formatDuration(avgSessionMs)}</div>
 </div>
 <div className="bg-card rounded-xl border border-border p-6 shadow-sm text-center hover:bg-muted transition-colors group">
 <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1.5">Longest Session</div>
 <div className="text-2xl font-black text-foreground group-hover:scale-105 transition-transform">{formatDuration(longestSessionMs)}</div>
 </div>
 </div>

 {/* Top Projects */}
 <div className="bg-card rounded-2xl border border-border p-8 shadow-sm hover:border-[#8B5CF6]/30 transition-colors">
 <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-6 flex items-center gap-2.5">
 <Trophy className="w-4 h-4 text-[#8B5CF6]" /> Top Focused Projects
 </h2>
 {topProjects.length > 0 ? (
 <div className="space-y-4">
 {topProjects.map((project, idx) => (
 <div key={idx} className="flex items-center justify-between group p-2.5 -mx-2.5 rounded-xl hover:bg-muted transition-colors cursor-default">
 <div className="flex items-center gap-3.5">
 <div className="w-7 h-7 rounded-md bg-[#8B5CF6]/10 flex items-center justify-center text-xs font-bold text-[#8B5CF6] border border-[#8B5CF6]/20 shadow-[0_0_8px_rgba(139,92,246,0.15)]">
 {idx + 1}
 </div>
 <span className="font-semibold text-foreground text-[15px]">{project.name}</span>
 </div>
 <span className="font-bold text-foreground text-sm bg-border px-3 py-1.5 rounded-md border border-border group-hover:border-[#8B5CF6]/30 transition-colors shadow-sm">
 {formatDuration(project.ms)}
 </span>
 </div>
 ))}
 </div>
 ) : (
 <div className="text-center py-6 text-sm font-medium text-muted-foreground">
 No project data available.
 </div>
 )}
 </div>

 {dbUser && (
 <AudioSettingsCard initialSettings={dbUser as any} />
 )}
 </div>
 </div>

 </div>
 </div>
 );
}
