import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { TaskListView } from "@/components/tasks/task-list-view";

export default async function CompletedTasksPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  const tasks = await prisma.task.findMany({
    where: {
      userId: session.user.id,
      isCompleted: true,
    },
    include: {
      project: true,
    },
    orderBy: { completedAt: "desc" },
  });

  return (
    <div className="flex h-full flex-col bg-white">
      <div className="flex h-14 items-center border-b px-6">
        <h1 className="text-lg font-semibold">Completed</h1>
      </div>
      <div className="flex-1 overflow-y-auto p-6">
        <TaskListView tasks={tasks} variant="completed" showDate={true} />
      </div>
    </div>
  );
}
