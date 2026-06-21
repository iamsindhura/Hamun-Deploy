import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { TaskListView } from "@/components/tasks/task-list-view";
import { WorkdaySettingsCard } from "@/components/tasks/workday-settings-card";

export default async function TodayTasksPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const dbUser = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { workdayStart: true, workdayEnd: true }
  });

  const workdayStart = dbUser?.workdayStart || "09:00";
  const workdayEnd = dbUser?.workdayEnd || "18:00";

  const tasks = await prisma.task.findMany({
    where: {
      userId: session.user.id,
      isCompleted: false,
      OR: [
        { endTime: { gte: new Date() } },
        { endTime: null }
      ],
      AND: [
        {
          OR: [
            {
              startTime: {
                gte: today,
                lt: tomorrow,
              }
            },
            {
              dueDate: {
                gte: today,
                lt: tomorrow,
              }
            }
          ]
        }
      ]
    },
    include: {
      project: true,
    },
    orderBy: { startTime: "asc" },
  });

  const overdueCount = await prisma.task.count({
    where: {
      userId: session.user.id,
      isCompleted: false,
      endTime: { lt: new Date() }
    }
  });

  const scheduledCount = tasks.length;
  
  const plannedMs = tasks.reduce((acc, task) => {
    if (task.startTime && task.endTime) {
      return acc + (new Date(task.endTime).getTime() - new Date(task.startTime).getTime());
    }
    return acc;
  }, 0);
  
  const plannedMinutes = Math.round(plannedMs / (1000 * 60));
  
  const parseTime = (timeStr: string) => {
    const [h, m] = timeStr.split(":").map(Number);
    return h * 60 + m;
  };
  
  const totalWorkdayMinutes = parseTime(workdayEnd) - parseTime(workdayStart);
  const freeMinutes = Math.max(0, totalWorkdayMinutes - plannedMinutes);

  const formatDuration = (totalMinutes: number) => {
    if (totalMinutes === 0) return "0h";
    const h = Math.floor(totalMinutes / 60);
    const m = Math.round(totalMinutes % 60);
    
    if (h > 0 && m > 0) return `${h}h ${m}m`;
    if (h > 0) return `${h}h`;
    return `${m}m`;
  };

  const plannedFormatted = formatDuration(plannedMinutes);
  const freeFormatted = formatDuration(freeMinutes);

  return (
    <div className="flex h-full flex-col bg-slate-50/50">
      <div className="flex h-14 items-center border-b bg-white px-6">
        <h1 className="text-lg font-semibold">Today</h1>
      </div>
      <div className="flex-1 overflow-y-auto p-6 space-y-6 max-w-5xl mx-auto w-full">
        {/* Dashboard Metrics */}
        <div className="grid grid-cols-5 gap-4 w-full">
          {/* Scheduled Today - Blue */}
          <div className="bg-blue-50 rounded-2xl border border-blue-200 p-6 shadow-sm flex flex-col justify-center min-h-[120px]">
            <div className="text-xs font-semibold text-blue-600/80 uppercase tracking-wider mb-2">Scheduled Today</div>
            <div className="text-4xl font-bold text-blue-900">{scheduledCount}</div>
          </div>
          
          {/* Planned Hours - Green */}
          <div className="bg-emerald-50 rounded-2xl border border-emerald-200 p-6 shadow-sm flex flex-col justify-center min-h-[120px]">
            <div className="text-xs font-semibold text-emerald-600/80 uppercase tracking-wider mb-2">Planned Hours</div>
            <div className="text-4xl font-bold text-emerald-900">{plannedFormatted}</div>
          </div>
          
          {/* Free Hours - Amber */}
          <div className="bg-amber-50 rounded-2xl border border-amber-200 p-6 shadow-sm flex flex-col justify-center min-h-[120px]">
            <div className="text-xs font-semibold text-amber-600/80 uppercase tracking-wider mb-2">Free Hours</div>
            <div className="text-4xl font-bold text-amber-900">{freeFormatted}</div>
          </div>
          
          {/* Overdue - Red */}
          <div className="bg-red-50 rounded-2xl border border-red-200 p-6 shadow-sm flex flex-col justify-center min-h-[120px]">
            <div className="text-xs font-semibold text-red-600/80 uppercase tracking-wider mb-2">Overdue</div>
            <div className="text-4xl font-bold text-red-900">{overdueCount}</div>
          </div>

          {/* Workday Settings - Indigo */}
          <WorkdaySettingsCard initialStart={workdayStart} initialEnd={workdayEnd} />
        </div>

        <TaskListView tasks={tasks} />
      </div>
    </div>
  );
}