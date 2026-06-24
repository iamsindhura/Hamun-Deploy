import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { FocusTimer } from "@/components/tasks/focus-timer";

export default async function FocusPage({ params }: { params: Promise<{ taskId: string }> }) {
  const { taskId } = await params;
  const session = await auth();
  if (!session?.user) redirect("/login");

  const task = await prisma.task.findFirst({
    where: { 
      id: taskId,
      userId: session.user.id,
    },
    include: { project: true }
  });

  if (!task) {
    redirect("/tasks/today");
  }

  const dbUser = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      audioCuesEnabled: true,
      audioCheckpointsEnabled: true,
      audioWarningEnabled: true,
      audioVolume: true,
    }
  });

  return <FocusTimer task={task} audioSettings={dbUser as any} />;
}
