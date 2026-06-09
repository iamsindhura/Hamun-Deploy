import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { KanbanBoard } from "@/components/tasks/kanban-board";

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
      <div className="flex h-16 items-center border-b px-8 bg-slate-50/50">
        <h1 className="text-2xl font-black tracking-tight bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent">
          {project.name}
        </h1>
      </div>
      <div className="flex-1 overflow-hidden">
        <KanbanBoard projectId={projectId} initialColumns={columns} initialTasks={tasks} />
      </div>
    </div>
  );
}
