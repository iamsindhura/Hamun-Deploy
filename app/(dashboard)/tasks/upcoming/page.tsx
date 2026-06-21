import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { TaskListView } from "@/components/tasks/task-list-view";

export default async function UpcomingTasksPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const nextWeek = new Date(today);
  nextWeek.setDate(nextWeek.getDate() + 7);

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
                lt: nextWeek,
              }
            },
            {
              dueDate: {
                gte: today,
                lt: nextWeek,
              }
            }
          ]
        }
      ]
    },
    include: {
      project: true,
    },
    orderBy: [
      { startTime: "asc" }
    ],
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
            <TaskListView tasks={dateTasks} />
          </div>
        ))}
        {tasks.length === 0 && (
          <div className="text-center text-muted-foreground mt-10">
            No upcoming tasks found.
          </div>
        )}
      </div>
    </div>
  );
}
