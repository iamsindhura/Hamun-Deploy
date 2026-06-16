"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { TaskPriority } from "@prisma/client";

export async function autoGenerateFollowUps() {
  const session = await auth();
  if (!session?.user?.id) return { success: false, error: "Unauthorized" };
  const userId = session.user.id;

  try {
    // 1. Resolve or Create "Follow Ups" project
    let project = await prisma.project.findFirst({
      where: { userId, name: "Follow Ups" }
    });

    if (!project) {
      const maxPositionProject = await prisma.project.findFirst({
        where: { userId },
        orderBy: { position: "desc" },
        select: { position: true }
      });
      const position = maxPositionProject ? maxPositionProject.position + 1 : 0;
      
      project = await prisma.project.create({
        data: {
          name: "Follow Ups",
          color: "#8B5CF6", // Purple
          userId,
          position
        }
      });
    }

    // 1b. Ensure at least one column exists
    let column = await prisma.taskColumn.findFirst({
      where: { projectId: project.id },
      orderBy: { position: "asc" }
    });

    if (!column) {
      column = await prisma.taskColumn.create({
        data: {
          name: "To Do",
          position: 0,
          projectId: project.id
        }
      });
    }

    // 2. Determine the cutoff date (14 days ago)
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - 14);

    // 3. Find stale contacts with NO open tasks
    const staleContacts = await prisma.contact.findMany({
      where: {
        userId,
        isArchived: false,
        OR: [
          { lastContactedAt: { lt: cutoffDate } },
          { lastContactedAt: null, createdAt: { lt: cutoffDate } }
        ],
        tasks: {
          none: { 
            isCompleted: false,
            projectId: project!.id
          } // Prevent duplicates strictly in Follow Ups project!
        }
      }
    });

    if (staleContacts.length === 0) {
      return { success: true, count: 0 };
    }

    // 4. Generate tasks
    let createdCount = 0;
    const dueDate = new Date(); // Due today

    await prisma.$transaction(async (tx) => {
      for (const contact of staleContacts) {
        // Second explicit check to prevent race conditions
        const existingTask = await tx.task.findFirst({
          where: {
            contactId: contact.id,
            projectId: project!.id,
            isCompleted: false,
          }
        });

        if (existingTask) continue;

        await tx.task.create({
          data: {
            title: `Follow up with ${contact.name}`,
            priority: TaskPriority.MEDIUM,
            dueDate,
            position: 0,
            projectId: project!.id,
            columnId: column!.id,
            userId,
            contactId: contact.id
          }
        });
        createdCount++;
      }
    });

    // 5. Revalidate paths
    revalidatePath("/contacts");
    revalidatePath("/kanban");
    revalidatePath("/");

    return { success: true, count: createdCount };

  } catch (error) {
    console.error("Failed to auto-generate follow ups:", error);
    return { success: false, error: "Internal Server Error" };
  }
}
