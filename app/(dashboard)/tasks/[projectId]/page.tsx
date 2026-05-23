import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { KanbanBoard } from "@/components/tasks/kanban-board";
import { TopNav } from "@/components/layout/top-nav"; // Assuming there is a TopNav or similar, if not I'll create a simple header

export default async function ProjectTasksPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  const { projectId } = await params;

  const project = await prisma.project.findUnique({
    where: { id: projectId, userId: session.user.id },
  });

  if (!project) {
    redirect("/tasks/today");
  }

  const columns = await prisma.taskColumn.findMany({
    where: { projectId },
    orderBy: { position: "asc" },
  });

  const tasks = await prisma.task.findMany({
    where: { projectId },
    orderBy: { position: "asc" },
  });

  return (
    <div className="flex h-full flex-col bg-white">
      <div className="flex h-14 items-center border-b px-6">
        <h1 className="text-lg font-semibold">{project.name}</h1>
      </div>
      <div className="flex-1 overflow-hidden">
        <KanbanBoard projectId={projectId} initialColumns={columns} initialTasks={tasks} />
      </div>
    </div>
  );
}
