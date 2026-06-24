import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { TaskListView } from "@/components/tasks/task-list-view";
import { WorkdaySettingsCard } from "@/components/tasks/workday-settings-card";
import { Calendar } from "lucide-react";

export default async function TodayTasksPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  const dbUser = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { workdayStart: true, workdayEnd: true }
  });
  const workdayStart = dbUser?.workdayStart || "09:00";
  const workdayEnd = dbUser?.workdayEnd || "18:00";

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  // METRIC 1: COMPLETED TODAY
  const completedTodayCount = await prisma.task.count({
    where: {
      userId: session.user.id,
      isCompleted: true,
      completedAt: {
        gte: today,
        lt: tomorrow
      }
    }
  });

  // METRIC 2: SCHEDULED TODAY
  const scheduledTodayCount = await prisma.task.count({
    where: {
      userId: session.user.id,
      startTime: {
        gte: today,
        lt: tomorrow
      }
    }
  });

  // METRIC 3: PLANNED HOURS
  const tasksScheduledToday = await prisma.task.findMany({
    where: {
      userId: session.user.id,
      startTime: { gte: today, lt: tomorrow },
      endTime: { not: null }
    },
    select: { startTime: true, endTime: true }
  });
  
  let plannedMinutes = 0;
  for (const t of tasksScheduledToday) {
    if (t.startTime && t.endTime) {
      plannedMinutes += Math.max(0, (t.endTime.getTime() - t.startTime.getTime()) / (1000 * 60));
    }
  }
  const hours = Math.floor(plannedMinutes / 60);
  const mins = Math.floor(plannedMinutes % 60);
  const plannedHoursDisplay = hours > 0 && mins > 0 ? `${hours}h ${mins}m` : hours > 0 ? `${hours}h` : `${mins}m`;

  // METRIC 4: OUTSIDE WORKDAY
  let outsideWorkdayCount = 0;
  for (const t of tasksScheduledToday) {
    if (t.startTime && t.endTime) {
      const startH = t.startTime.getHours();
      const startM = t.startTime.getMinutes();
      const endH = t.endTime.getHours();
      const endM = t.endTime.getMinutes();
      
      const [wsH, wsM] = workdayStart.split(':').map(Number);
      const [weH, weM] = workdayEnd.split(':').map(Number);
      
      const startMins = startH * 60 + startM;
      const endMins = endH * 60 + endM;
      const wsMins = wsH * 60 + wsM;
      const weMins = weH * 60 + weM;
      
      const crossesMidnight = endMins <= startMins;
      
      if (startMins < wsMins || endMins > weMins || crossesMidnight) {
        outsideWorkdayCount++;
      }
    }
  }

  // METRIC 5: TOTAL OVERDUES
  const overdueCount = await prisma.task.count({
    where: {
      userId: session.user.id,
      isCompleted: false,
      endTime: {
        lt: new Date()
      }
    }
  });

  // FETCH TASKS FOR LIST VIEW
  const tasks = await prisma.task.findMany({
    where: {
      userId: session.user.id,
      isCompleted: false,
      startTime: {
        gte: today,
        lt: tomorrow,
      },
      endTime: { gte: new Date() }
    },
    include: {
      project: true,
    },
    orderBy: { startTime: "asc" },
  });

  // FETCH UNSCHEDULED TASKS
  const unscheduledTasks = await prisma.task.findMany({
    where: {
      userId: session.user.id,
      isCompleted: false,
      startTime: null,
      endTime: null,
    },
    include: {
      project: true,
    },
    orderBy: { createdAt: "asc" },
  });

  console.log("Unscheduled Tasks count:", unscheduledTasks.length);
  console.log("Unscheduled Tasks data:", unscheduledTasks);

  return (
    <div className="flex h-full flex-col bg-slate-50/50">
      <div className="flex h-14 items-center border-b bg-white px-6">
        <h1 className="text-lg font-semibold">Today</h1>
      </div>
      <div className="flex-1 overflow-y-auto p-6 max-w-5xl mx-auto w-full">
        {/* DASHBOARD METRICS */}
        <div className="mb-8 grid gap-4 grid-cols-2 md:grid-cols-6">
          {/* CARD 1: COMPLETED TODAY */}
          <div className="rounded-xl border bg-white p-4 shadow-[0_1px_3px_rgba(0,0,0,0.02)] border-l-[4px] border-l-purple-500 flex flex-col justify-between gap-2 min-h-[90px]">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Completed Today</span>
            <span className="text-3xl font-black text-slate-800 leading-none">{completedTodayCount}</span>
          </div>

          {/* CARD 2: SCHEDULED TODAY */}
          <div className="rounded-xl border bg-white p-4 shadow-[0_1px_3px_rgba(0,0,0,0.02)] border-l-[4px] border-l-blue-500 flex flex-col justify-between gap-2 min-h-[90px]">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Scheduled Today</span>
            <span className="text-3xl font-black text-slate-800 leading-none">{scheduledTodayCount}</span>
          </div>

          {/* CARD 3: PLANNED HOURS */}
          <div className="rounded-xl border bg-white p-4 shadow-[0_1px_3px_rgba(0,0,0,0.02)] border-l-[4px] border-l-emerald-500 flex flex-col justify-between gap-2 min-h-[90px]">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Planned Hours</span>
            <span className="text-3xl font-black text-slate-800 leading-none">{plannedHoursDisplay || "0m"}</span>
          </div>

          {/* CARD 4: OUTSIDE WORKDAY */}
          <div className="rounded-xl border bg-white p-4 shadow-[0_1px_3px_rgba(0,0,0,0.02)] border-l-[4px] border-l-amber-400 flex flex-col justify-between gap-2 min-h-[90px]">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Outside Workday</span>
            <span className="text-3xl font-black text-slate-800 leading-none">{outsideWorkdayCount}</span>
          </div>

          {/* CARD 5: TOTAL OVERDUES */}
          <div className="rounded-xl border bg-white p-4 shadow-[0_1px_3px_rgba(0,0,0,0.02)] border-l-[4px] border-l-red-500 flex flex-col justify-between gap-2 min-h-[90px]">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Total Overdues</span>
            <span className="text-3xl font-black text-slate-800 leading-none">{overdueCount}</span>
          </div>

          {/* CARD 6: WORKDAY SETTINGS */}
          <WorkdaySettingsCard initialStart={workdayStart} initialEnd={workdayEnd} />
        </div>

        {tasks.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="rounded-full bg-white border border-slate-200 p-6 mb-4 shadow-sm">
              <Calendar className="h-10 w-10 text-slate-300" />
            </div>
            <h3 className="text-xl font-bold text-slate-700 mb-2">No tasks scheduled for today</h3>
            <p className="text-slate-500 max-w-md">Take a break or schedule new tasks from your projects.</p>
          </div>
        ) : (
          <div className="mb-8">
            <TaskListView tasks={tasks} workdayStart={workdayStart} workdayEnd={workdayEnd} />
          </div>
        )}

        {unscheduledTasks.length > 0 && (
          <div className="mt-8">
            <div className="flex items-center gap-2 mb-4 px-1">
              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500">📌 Unscheduled Tasks</h2>
              <div className="h-px flex-1 bg-slate-200"></div>
            </div>
            <TaskListView tasks={unscheduledTasks} variant="unscheduled" workdayStart={workdayStart} workdayEnd={workdayEnd} />
          </div>
        )}
      </div>
    </div>
  );
}