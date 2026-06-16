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
      dueDate: {
        gte: today,
        lt: nextWeek,
      },
    },
    include: {
      project: true,
    },
    orderBy: { dueDate: "asc" },
  });

  return (
    <div className="flex h-full flex-col bg-white">
      <div className="flex h-14 items-center border-b px-6">
        <h1 className="text-lg font-semibold">Next 7 Days</h1>
      </div>
      <div className="flex-1 overflow-y-auto p-6">
        <TaskListView tasks={tasks} showDate />
      </div>
    </div>
  );
}
