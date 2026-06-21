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
      taskType: "DEEP_WORK"
    },
    include: { project: true }
  });

  if (!task || !task.startTime || !task.endTime) {
    redirect("/deep-work");
  }

  return <FocusTimer task={task} />;
}
