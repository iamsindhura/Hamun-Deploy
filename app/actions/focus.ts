"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function createFocusSession(
  taskId: string, 
  actualFocusDuration: number // in seconds
) {
  const session = await auth();
  if (!session?.user?.id) return { success: false, error: "Unauthorized" };

  try {
    const task = await prisma.task.findUnique({
      where: { id: taskId, userId: session.user.id }
    });

    if (!task) return { success: false, error: "Task not found" };

    const now = new Date();
    // Reconstruct start time backwards from actual focus duration for accuracy
    const startTime = new Date(now.getTime() - actualFocusDuration * 1000);

    const focusSession = await prisma.focusSession.create({
      data: {
        taskId,
        userId: session.user.id,
        startTime,
        endTime: now,
        actualFocusDuration
      }
    });

    revalidatePath("/deep-work");
    revalidatePath(`/tasks/${task.projectId}`);
    return { success: true, data: focusSession };
  } catch (error) {
    console.error("Failed to save focus session:", error);
    return { success: false, error: "Failed to save session" };
  }
}
