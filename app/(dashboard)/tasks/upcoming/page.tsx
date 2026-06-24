import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { TaskListView } from "@/components/tasks/task-list-view";

export default async function UpcomingTasksPage() {
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
  const nextWeek = new Date(today);
  nextWeek.setDate(nextWeek.getDate() + 7);

  const tasks = await prisma.task.findMany({
    where: {
      userId: session.user.id,
      isCompleted: false,
      startTime: {
        gte: today,
        lt: nextWeek,
      },
      endTime: { not: null }
    },
    include: {
      project: true,
    },
    orderBy: [
      { startTime: "asc" }
    ],
  });

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

  const groupedTasks = tasks.reduce((acc: Record<string, typeof tasks>, task) => {
    const dateToUse = task.startTime || task.dueDate;
    const dateStr = dateToUse ? new Date(dateToUse).toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' }) : "No Date";
    if (!acc[dateStr]) acc[dateStr] = [];
    acc[dateStr].push(task);
    return acc;
  }, {});

  return (
    <div className="flex h-full flex-col bg-white">
      <div className="flex h-14 items-center border-b px-6">
        <h1 className="text-lg font-semibold">Next 7 Days</h1>
      </div>
      <div className="flex-1 overflow-y-auto p-6 space-y-8">
        {Object.entries(groupedTasks).map(([dateStr, dateTasks]) => (
          <div key={dateStr} className="space-y-3">
            <h2 className="font-bold text-slate-800 text-lg border-b pb-2">{dateStr}</h2>
            <TaskListView tasks={dateTasks} workdayStart={workdayStart} workdayEnd={workdayEnd} />
          </div>
        ))}
        {tasks.length === 0 && unscheduledTasks.length === 0 && (
          <div className="text-center text-muted-foreground mt-10">
            No upcoming tasks found.
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
