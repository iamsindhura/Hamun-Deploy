import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { AudioSettingsCard } from "@/components/deep-work/audio-settings-card";
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

  // Heatmap generation
  const heatmapDays = 140; // ~20 weeks
  const heatmapData = [];
  const heatmapStart = new Date(today);
  heatmapStart.setDate(today.getDate() - heatmapDays + 1);
  
  for (let i = 0; i < heatmapDays; i++) {
    const d = new Date(heatmapStart);
    d.setDate(heatmapStart.getDate() + i);
    const dStr = getLocalDayString(d);
    heatmapData.push({
      date: dStr,
      ms: sessionDailyMs[dStr] || 0
    });
  }

  const weeks = [];
  let currentWeek = [];
  // pad first week
  const emptyDays = heatmapStart.getDay() === 0 ? 6 : heatmapStart.getDay() - 1; // assuming Monday start
  for(let i=0; i<emptyDays; i++) currentWeek.push(null);

  for (const day of heatmapData) {
    currentWeek.push(day);
    if (currentWeek.length === 7) {
      weeks.push(currentWeek);
      currentWeek = [];
    }
  }
  if (currentWeek.length > 0) {
    while(currentWeek.length < 7) currentWeek.push(null);
    weeks.push(currentWeek);
  }

  const topProjects = Object.values(projectFocusTime)
    .sort((a, b) => b.ms - a.ms)
    .slice(0, 5);

  return (
    <div className="flex h-full flex-col bg-slate-50/50">
      <div className="flex h-14 items-center border-b bg-white px-6">
        <h1 className="text-lg font-semibold flex items-center gap-2 text-slate-800">
          <Activity className="h-5 w-5 text-indigo-500" />
          Focus Analytics
        </h1>
      </div>
      <div className="flex-1 overflow-y-auto p-6 space-y-6 max-w-6xl mx-auto w-full">
        
        {/* Top 4 Metric Cards */}
        <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
          <div className="rounded-2xl border bg-white p-5 shadow-sm relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:scale-110 transition-transform">
              <Clock className="w-16 h-16" />
            </div>
            <div className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Deep Work Today</div>
            <div className="text-4xl font-black text-slate-800 tracking-tight">{formatDuration(completedTodayMs)}</div>
            <div className="text-sm font-medium text-slate-500 mt-2 flex items-center gap-1">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" /> {totalSessionsToday} sessions today
            </div>
          </div>

          <div className="rounded-2xl border bg-white p-5 shadow-sm relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:scale-110 transition-transform">
              <Target className="w-16 h-16" />
            </div>
            <div className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Weekly Goal</div>
            <div className="flex items-end gap-2">
              <div className="text-4xl font-black text-slate-800 tracking-tight">{formatDuration(totalWeeklyCompletedMs)}</div>
              <div className="text-xl font-bold text-slate-400 mb-1">/ 15h</div>
            </div>
            <div className="w-full bg-slate-100 h-2 rounded-full mt-3 overflow-hidden">
              <div className="bg-indigo-500 h-full rounded-full transition-all duration-1000" style={{ width: `${completionPercentage}%` }}></div>
            </div>
          </div>

          <div className="rounded-2xl border bg-white p-5 shadow-sm relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:scale-110 transition-transform">
              <TrendingUp className="w-16 h-16" />
            </div>
            <div className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Focus Streak</div>
            <div className="flex items-end gap-2">
              <div className="text-4xl font-black text-slate-800 tracking-tight">{currentStreak}</div>
              <div className="text-xl font-bold text-slate-400 mb-1">Days</div>
            </div>
            <div className="text-sm font-medium text-slate-500 mt-2 flex items-center gap-1">
              Consecutive days focused
            </div>
          </div>

          <div className="rounded-2xl border bg-white p-5 shadow-sm relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:scale-110 transition-transform">
              <Trophy className="w-16 h-16" />
            </div>
            <div className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Total Time Focused</div>
            <div className="text-4xl font-black text-slate-800 tracking-tight">{formatDuration(totalMsAllTime)}</div>
            <div className="text-sm font-medium text-slate-500 mt-2 flex items-center gap-1">
              Across {focusSessions.length} total sessions
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          
          <div className="lg:col-span-2 space-y-6">
            
            {/* Heatmap Section */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500 flex items-center gap-2">
                  <CalendarIcon className="w-4 h-4" /> Focus Heatmap
                </h2>
              </div>
              <div className="flex gap-1.5 overflow-x-auto pb-2 no-scrollbar">
                {weeks.map((week, i) => (
                  <div key={i} className="flex flex-col gap-1.5">
                    {week.map((day, j) => {
                      if (!day) return <div key={j} className="w-3.5 h-3.5 rounded-sm bg-transparent" />;
                      
                      let opacity = 0;
                      if (day.ms > 0) {
                        const hours = day.ms / (1000 * 60 * 60);
                        if (hours >= 4) opacity = 1;
                        else if (hours >= 2) opacity = 0.7;
                        else if (hours >= 1) opacity = 0.5;
                        else opacity = 0.3;
                      }

                      return (
                        <div 
                          key={j} 
                          title={`${day.date}: ${formatDuration(day.ms)}`}
                          className="w-3.5 h-3.5 rounded-sm transition-all hover:ring-2 hover:ring-indigo-300 hover:scale-110 cursor-help"
                          style={{ backgroundColor: day.ms > 0 ? `rgba(79, 70, 229, ${opacity})` : '#f1f5f9' }}
                        />
                      )
                    })}
                  </div>
                ))}
              </div>
              <div className="mt-4 flex items-center justify-end gap-2 text-xs font-medium text-slate-400">
                <span>Less</span>
                <div className="flex gap-1">
                  <div className="w-3 h-3 rounded-sm bg-slate-100" />
                  <div className="w-3 h-3 rounded-sm bg-indigo-500/30" />
                  <div className="w-3 h-3 rounded-sm bg-indigo-500/50" />
                  <div className="w-3 h-3 rounded-sm bg-indigo-500/70" />
                  <div className="w-3 h-3 rounded-sm bg-indigo-500" />
                </div>
                <span>More</span>
              </div>
            </div>

            {/* Recent Sessions */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500 mb-6 flex items-center gap-2">
                <Play className="w-4 h-4" /> Recent Focus Sessions
              </h2>
              {focusSessions.length > 0 ? (
                <div className="space-y-3">
                  {focusSessions.slice(0, 6).map(session => (
                    <div key={session.id} className="flex items-center justify-between p-4 rounded-xl border border-slate-100 bg-slate-50/50 hover:bg-slate-50 transition-colors">
                      <div className="flex flex-col">
                        <span className="font-bold text-slate-800 text-[15px]">{session.task.title}</span>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xs font-semibold text-slate-500 bg-white px-2 py-0.5 rounded-md border border-slate-200 shadow-sm">
                            {new Date(session.startTime).toLocaleDateString()}
                          </span>
                          {session.task.project && (
                            <span className="text-xs font-medium text-slate-400 flex items-center gap-1">
                              🏢 {session.task.project.name}
                            </span>
                          )}
                        </div>
                      </div>
                      <span className="font-bold text-indigo-700 bg-indigo-100 px-3 py-1.5 rounded-lg text-sm shadow-sm">
                        {formatDuration(session.actualFocusDuration * 1000)}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 text-sm font-medium text-slate-400 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                  <Clock className="w-8 h-8 mx-auto mb-3 text-slate-300" />
                  No focus sessions recorded yet. <br/>Start a timer from any task to see it here!
                </div>
              )}
            </div>

          </div>

          <div className="space-y-6">
            
            {/* Session Stats Mini-cards */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm text-center">
                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Average Session</div>
                <div className="text-xl font-bold text-slate-800">{formatDuration(avgSessionMs)}</div>
              </div>
              <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm text-center">
                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Longest Session</div>
                <div className="text-xl font-bold text-slate-800">{formatDuration(longestSessionMs)}</div>
              </div>
            </div>

            {/* Top Projects */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500 mb-6 flex items-center gap-2">
                <Trophy className="w-4 h-4" /> Top Focused Projects
              </h2>
              {topProjects.length > 0 ? (
                <div className="space-y-4">
                  {topProjects.map((project, idx) => (
                    <div key={idx} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-md bg-slate-100 flex items-center justify-center text-xs font-bold text-slate-500 border border-slate-200">
                          {idx + 1}
                        </div>
                        <span className="font-semibold text-slate-700 text-sm">{project.name}</span>
                      </div>
                      <span className="font-bold text-slate-900 text-sm bg-slate-50 px-2 py-1 rounded-md">
                        {formatDuration(project.ms)}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6 text-sm font-medium text-slate-400">
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
