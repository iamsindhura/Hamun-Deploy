"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { TaskPriority } from "@prisma/client";

// Columns
export async function getColumns(projectId: string) {
  const session = await auth();
  if (!session?.user?.id) return { success: false, error: "Unauthorized" };

  try {
    const columns = await prisma.taskColumn.findMany({
      where: { projectId, project: { userId: session.user.id } },
      orderBy: { position: "asc" }
    });
    return { success: true, data: columns };
  } catch (error) {
    return { success: false, error: "Failed to fetch columns" };
  }
}

export async function createColumn(data: { name: string; position: number; projectId: string }) {
  const session = await auth();
  if (!session?.user?.id) return { success: false, error: "Unauthorized" };

  try {
    const project = await prisma.project.findFirst({ where: { id: data.projectId, userId: session.user.id } });
    if (!project) throw new Error("Not found");
    const column = await prisma.taskColumn.create({
      data: {
        name: data.name,
        position: data.position,
        projectId: data.projectId,
      }
    });
    revalidatePath(`/tasks/${data.projectId}`);
    return { success: true, data: column };
  } catch (error) {
    return { success: false, error: "Failed to create column" };
  }
}

export async function updateColumn(id: string, projectId: string, data: { name: string }) {
  const session = await auth();
  if (!session?.user?.id) return { success: false, error: "Unauthorized" };

  try {
    const project = await prisma.project.findFirst({ where: { id: projectId, userId: session.user.id } });
    if (!project) throw new Error("Not found");
    const column = await prisma.taskColumn.update({
      where: { id },
      data: { name: data.name }
    });
    revalidatePath(`/tasks/${projectId}`);
    return { success: true, data: column };
  } catch (error) {
    return { success: false, error: "Failed to update column" };
  }
}

export async function deleteColumn(id: string, projectId: string) {
  const session = await auth();
  if (!session?.user?.id) return { success: false, error: "Unauthorized" };

  try {
    const project = await prisma.project.findFirst({ where: { id: projectId, userId: session.user.id } });
    if (!project) throw new Error("Not found");
    await prisma.taskColumn.delete({
      where: { id }
    });
    revalidatePath(`/tasks/${projectId}`);
    return { success: true };
  } catch (error) {
    return { success: false, error: "Failed to delete column" };
  }
}

// Tasks
export async function getTasks(projectId: string) {
  const session = await auth();
  if (!session?.user?.id) return { success: false, error: "Unauthorized" };

  try {
    const tasks = await prisma.task.findMany({
      where: { projectId, userId: session.user.id },
      include: { subtasks: true, contact: true },
      orderBy: { position: "asc" }
    });
    return { success: true, data: tasks };
  } catch (error) {
    return { success: false, error: "Failed to fetch tasks" };
  }
}

export async function createTask(data: { title: string; description?: string; columnId?: string; projectId: string; dueDate?: Date; priority?: TaskPriority; isPinned?: boolean; position: number; contactId?: string }) {
  const session = await auth();
  if (!session?.user?.id) return { success: false, error: "Unauthorized" };

  try {
    const task = await prisma.task.create({
      data: {
        ...data,
        userId: session.user.id
      }
    });
    revalidatePath(`/tasks/${data.projectId}`);
    return { success: true, data: task };
  } catch (error) {
    return { success: false, error: "Failed to create task" };
  }
}

export async function updateTask(id: string, projectId: string, data: Partial<any>) {
  const session = await auth();
  if (!session?.user?.id) return { success: false, error: "Unauthorized" };

  try {
    const task = await prisma.task.update({
      where: { id, userId: session.user.id },
      data
    });
    revalidatePath(`/tasks/${projectId}`);
    revalidatePath(`/tasks/today`);
    revalidatePath(`/tasks/upcoming`);
    return { success: true, data: task };
  } catch (error) {
    return { success: false, error: "Failed to update task" };
  }
}

export async function deleteTask(id: string, projectId: string) {
  const session = await auth();
  if (!session?.user?.id) return { success: false, error: "Unauthorized" };

  try {
    await prisma.task.delete({
      where: { id, userId: session.user.id }
    });
    revalidatePath(`/tasks/${projectId}`);
    return { success: true };
  } catch (error) {
    return { success: false, error: "Failed to delete task" };
  }
}
// Subtasks
export async function createSubtask(data: { title: string; taskId: string; projectId: string; position: number }) {
  const session = await auth();
  if (!session?.user?.id) return { success: false, error: "Unauthorized" };

  try {
    const subtask = await prisma.subtask.create({
      data: {
        title: data.title,
        taskId: data.taskId,
        position: data.position
      }
    });
    revalidatePath(`/tasks/${data.projectId}`);
    return { success: true, data: subtask };
  } catch (error) {
    return { success: false, error: "Failed to create subtask" };
  }
}

export async function updateSubtask(id: string, projectId: string, data: Partial<any>) {
  const session = await auth();
  if (!session?.user?.id) return { success: false, error: "Unauthorized" };

  try {
    const subtask = await prisma.subtask.update({
      where: { id },
      data
    });
    revalidatePath(`/tasks/${projectId}`);
    return { success: true, data: subtask };
  } catch (error) {
    return { success: false, error: "Failed to update subtask" };
  }
}

export async function deleteSubtask(id: string, projectId: string) {
  const session = await auth();
  if (!session?.user?.id) return { success: false, error: "Unauthorized" };

  try {
    await prisma.subtask.delete({
      where: { id }
    });
    revalidatePath(`/tasks/${projectId}`);
    return { success: true };
  } catch (error) {
    return { success: false, error: "Failed to delete subtask" };
  }
}
