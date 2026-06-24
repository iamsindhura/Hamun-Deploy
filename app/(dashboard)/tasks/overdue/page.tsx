import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { TaskListView } from "@/components/tasks/task-list-view";

export default async function OverdueTasksPage() {
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

  const tasks = await prisma.task.findMany({
    where: {
      userId: session.user.id,
      isCompleted: false,
      endTime: {
        lt: new Date(),
      }
    },
    include: {
      project: true,
    },
    orderBy: { endTime: "asc" },
  });

  return (
    <div className="flex h-full flex-col bg-white">
      <div className="flex h-14 items-center border-b px-6">
        <h1 className="text-lg font-semibold text-red-600">Overdue</h1>
      </div>
      <div className="flex-1 overflow-y-auto p-6 max-w-5xl mx-auto w-full">
        <TaskListView tasks={tasks} variant="overdue" showDate={true} workdayStart={workdayStart} workdayEnd={workdayEnd} />
      </div>
    </div>
  );
}
