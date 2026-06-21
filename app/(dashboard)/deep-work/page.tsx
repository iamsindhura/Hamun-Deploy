import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { TaskListView } from "@/components/tasks/task-list-view";

function formatDuration(totalMs: number) {
  if (totalMs <= 0) return "0h";
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

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const thirtyDaysAgo = new Date(today);
  thirtyDaysAgo.setDate(today.getDate() - 30);

  const allDeepWorkTasks = await prisma.task.findMany({
    where: {
      userId: session.user.id,
      taskType: "DEEP_WORK",
      startTime: { not: null },
      endTime: { not: null }
    },
    include: { project: true },
    orderBy: { startTime: 'asc' }
  });

  const focusSessions = await prisma.focusSession.findMany({
    where: { userId: session.user.id },
    include: { task: true },
    orderBy: { createdAt: 'desc' }
  });

  let plannedTodayMs = 0;
  let completedTodayMs = 0;
  const todaysTasks: any[] = [];

  const historicalDailyMs: Record<string, number> = {};
  const sessionDailyMs: Record<string, number> = {};
  
  const currentDayOfWeek = today.getDay();
  const diffToMonday = currentDayOfWeek === 0 ? -6 : 1 - currentDayOfWeek;
  const mondayOfThisWeek = new Date(today);
  mondayOfThisWeek.setDate(today.getDate() + diffToMonday);
  
  const weeklyStats = [
    { day: "Monday", ms: 0, planned: 0 },
    { day: "Tuesday", ms: 0, planned: 0 },
    { day: "Wednesday", ms: 0, planned: 0 },
    { day: "Thursday", ms: 0, planned: 0 },
    { day: "Friday", ms: 0, planned: 0 },
    { day: "Saturday", ms: 0, planned: 0 },
    { day: "Sunday", ms: 0, planned: 0 },
  ];

  let last30DaysCompletedMs = 0;

  allDeepWorkTasks.forEach(t => {
    if (!t.startTime || !t.endTime) return;
    
    const st = new Date(t.startTime);
    const et = new Date(t.endTime);
    const taskMs = et.getTime() - st.getTime();
    
    // Today logic
    if (st >= today && st < tomorrow) {
      plannedTodayMs += taskMs;
      todaysTasks.push(t);
    }

    // Historical logic (for planned/avg)
    const dateStr = getLocalDayString(st);
    if (t.isCompleted) {
      historicalDailyMs[dateStr] = (historicalDailyMs[dateStr] || 0) + taskMs;
      if (st >= thirtyDaysAgo) {
        last30DaysCompletedMs += taskMs;
      }
    }

    // Weekly logic (for planned)
    const stDayStart = new Date(st);
    stDayStart.setHours(0, 0, 0, 0);
    const diffDaysFromMonday = Math.floor((stDayStart.getTime() - mondayOfThisWeek.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffDaysFromMonday >= 0 && diffDaysFromMonday < 7) {
      weeklyStats[diffDaysFromMonday].planned += taskMs;
    }
  });

  // Calculate actual completion using Focus Sessions
  const totalFocusSessionsCount = focusSessions.length;
  const totalFocusHoursMs = focusSessions.reduce((acc, curr) => acc + curr.actualFocusDuration * 1000, 0);
  const longestSessionMs = focusSessions.reduce((max, curr) => Math.max(max, curr.actualFocusDuration * 1000), 0);

  focusSessions.forEach(s => {
    const st = new Date(s.startTime);
    const sessionMs = s.actualFocusDuration * 1000;
    const dateStr = getLocalDayString(st);
    
    sessionDailyMs[dateStr] = (sessionDailyMs[dateStr] || 0) + sessionMs;

    if (st >= today && st < tomorrow) {
      completedTodayMs += sessionMs;
    }

    const stDayStart = new Date(st);
    stDayStart.setHours(0, 0, 0, 0);
    const diffDaysFromMonday = Math.floor((stDayStart.getTime() - mondayOfThisWeek.getTime()) / (1000 * 60 * 60 * 24));
    if (diffDaysFromMonday >= 0 && diffDaysFromMonday < 7) {
      weeklyStats[diffDaysFromMonday].ms += sessionMs;
    }
  });

  const remainingMs = Math.max(0, plannedTodayMs - completedTodayMs);
  const avgDailyMs = last30DaysCompletedMs / 30;
  const avgDailyStr = formatDuration(avgDailyMs);

  const totalWeeklyCompletedMs = weeklyStats.reduce((acc, curr) => acc + curr.ms, 0);
  const totalWeeklyPlannedMs = weeklyStats.reduce((acc, curr) => acc + curr.planned, 0);
  
  let completionPercentage = 0;
  if (totalWeeklyPlannedMs > 0) {
    completionPercentage = Math.round((totalWeeklyCompletedMs / totalWeeklyPlannedMs) * 100);
  }

  let bestDayStr = "None";
  let bestDayMs = 0;
  Object.entries(sessionDailyMs).forEach(([dateStr, ms]) => {
    if (ms > bestDayMs) {
      bestDayMs = ms;
      const [y, m, d] = dateStr.split('-').map(Number);
      bestDayStr = new Date(y, m - 1, d).toLocaleDateString('en-US', { weekday: 'long' });
    }
  });
  
  // Streak calculation (using sessions instead of tasks)
  let currentStreak = 0;
  let loopDate = new Date(today);
  
  const todayStr = getLocalDayString(loopDate);
  if ((sessionDailyMs[todayStr] || 0) >= 60 * 60 * 1000) {
    currentStreak++;
    loopDate.setDate(loopDate.getDate() - 1);
  } else {
    loopDate.setDate(loopDate.getDate() - 1);
  }

  while (true) {
    const dStr = getLocalDayString(loopDate);
    if ((sessionDailyMs[dStr] || 0) >= 60 * 60 * 1000) {
      currentStreak++;
      loopDate.setDate(loopDate.getDate() - 1);
    } else {
      break;
    }
  }

  const completedTasks = allDeepWorkTasks.filter(t => t.isCompleted).sort((a, b) => {
    const aDate = a.completedAt ? new Date(a.completedAt).getTime() : new Date(a.endTime!).getTime();
    const bDate = b.completedAt ? new Date(b.completedAt).getTime() : new Date(b.endTime!).getTime();
    return bDate - aDate;
  });
  const mostRecentTask = completedTasks.length > 0 ? completedTasks[0] : null;

  return (
    <div className="flex h-full flex-col bg-slate-50/50">
      <div className="flex h-14 items-center border-b bg-white px-6">
        <h1 className="text-lg font-semibold">Deep Work</h1>
      </div>
      <div className="flex-1 overflow-y-auto p-6 space-y-8 max-w-5xl mx-auto w-full">
        {/* Top Analytics Cards */}
        <div className="grid grid-cols-4 gap-4 w-full">
          {/* Planned */}
          <div className="bg-blue-50 rounded-2xl border border-blue-200 p-6 shadow-sm flex flex-col justify-center min-h-[120px]">
            <div className="text-xs font-semibold text-blue-600/80 uppercase tracking-wider mb-2">Planned Today</div>
            <div className="text-4xl font-bold text-blue-900">{formatDuration(plannedTodayMs)}</div>
          </div>
          
          {/* Completed */}
          <div className="bg-emerald-50 rounded-2xl border border-emerald-200 p-6 shadow-sm flex flex-col justify-center min-h-[120px]">
            <div className="text-xs font-semibold text-emerald-600/80 uppercase tracking-wider mb-2">Completed Today</div>
            <div className="text-4xl font-bold text-emerald-900">{formatDuration(completedTodayMs)}</div>
          </div>
          
          {/* Remaining */}
          <div className="bg-amber-50 rounded-2xl border border-amber-200 p-6 shadow-sm flex flex-col justify-center min-h-[120px]">
            <div className="text-xs font-semibold text-amber-600/80 uppercase tracking-wider mb-2">Remaining</div>
            <div className="text-4xl font-bold text-amber-900">{formatDuration(remainingMs)}</div>
          </div>
          
          {/* Streak */}
          <div className="bg-purple-50 rounded-2xl border border-purple-200 p-6 shadow-sm flex flex-col justify-center min-h-[120px]">
            <div className="text-xs font-semibold text-purple-600/80 uppercase tracking-wider mb-2">Deep Work Streak</div>
            <div className="text-4xl font-bold text-purple-900">{currentStreak} <span className="text-xl font-medium text-purple-600/60">Days</span></div>
          </div>
        </div>

        {/* V2 Deep Work Analytics */}
        <div className="grid grid-cols-3 gap-4 w-full">
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
            <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Total Focus Sessions</div>
            <div className="text-2xl font-bold text-slate-800">{totalFocusSessionsCount}</div>
          </div>
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
            <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Total Focus Hours</div>
            <div className="text-2xl font-bold text-slate-800">{formatDuration(totalFocusHoursMs)}</div>
          </div>
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
            <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Longest Session</div>
            <div className="text-2xl font-bold text-slate-800">{formatDuration(longestSessionMs)}</div>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          <div className="md:col-span-2 space-y-6">
            <div className="space-y-4">
              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500">Today's Deep Work Tasks</h2>
              <TaskListView tasks={todaysTasks} />
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500 mb-6">Recent Focus Sessions</h2>
              {focusSessions.length > 0 ? (
                <div className="space-y-3">
                  {focusSessions.slice(0, 5).map(session => (
                    <div key={session.id} className="flex items-center justify-between p-3 rounded-lg border border-slate-100 bg-slate-50">
                      <div className="flex flex-col">
                        <span className="font-bold text-slate-800">{session.task.title}</span>
                        <span className="text-xs font-medium text-slate-500">{new Date(session.createdAt).toLocaleDateString()}</span>
                      </div>
                      <span className="font-bold text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-md text-sm">
                        {formatDuration(session.actualFocusDuration * 1000)}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6 text-sm font-medium text-slate-400">No recent focus sessions</div>
              )}
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500 mb-6">This Week</h2>
              <div className="space-y-4">
                {weeklyStats.map(stat => (
                  <div key={stat.day} className="flex items-center justify-between">
                    <span className="text-sm font-medium text-slate-600">{stat.day}</span>
                    <span className="text-sm font-bold text-slate-900">{formatDuration(stat.ms)}</span>
                  </div>
                ))}
                
                <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-sm font-bold text-slate-900">Total</span>
                  <span className="text-sm font-bold text-primary">{formatDuration(totalWeeklyCompletedMs)}</span>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500 mb-6">Completion Target</h2>
              <div className="flex flex-col items-center justify-center py-4">
                <div className="text-5xl font-black text-slate-800">{completionPercentage}%</div>
                <div className="text-sm font-medium text-slate-500 mt-2">of planned hours focused</div>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500 mb-6">Insights</h2>
              <div className="space-y-6">
                <div>
                  <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Best Deep Work Day</div>
                  <div className="text-lg font-bold text-slate-800">{bestDayStr} <span className="text-sm font-medium text-slate-500 ml-1">{formatDuration(bestDayMs)}</span></div>
                </div>
                <div>
                  <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Average Daily Deep Work</div>
                  <div className="text-lg font-bold text-slate-800">{avgDailyStr} <span className="text-xs font-medium text-slate-400 ml-1">(Last 30 Days)</span></div>
                </div>
                <div>
                  <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Most Recent Task</div>
                  <div className="text-sm font-bold text-slate-800 truncate">
                    {mostRecentTask ? mostRecentTask.title : "None"}
                  </div>
                  {mostRecentTask && mostRecentTask.startTime && mostRecentTask.endTime && (
                    <div className="text-xs font-medium text-slate-500 mt-0.5">
                      {formatDuration(new Date(mostRecentTask.endTime).getTime() - new Date(mostRecentTask.startTime).getTime())}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
