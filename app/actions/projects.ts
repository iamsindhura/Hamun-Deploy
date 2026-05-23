"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function getProjects(workspaceId: string) {
  const session = await auth();
  if (!session?.user?.id) return { success: false, error: "Unauthorized" };

  try {
    const projects = await prisma.project.findMany({
      where: { workspaceId, userId: session.user.id },
      orderBy: { createdAt: "asc" }
    });
    return { success: true, data: projects };
  } catch (error) {
    return { success: false, error: "Failed to fetch projects" };
  }
}

export async function createProject(data: { name: string; color?: string; workspaceId: string }) {
  const session = await auth();
  if (!session?.user?.id) return { success: false, error: "Unauthorized" };

  try {
    const project = await prisma.project.create({
      data: {
        name: data.name,
        color: data.color,
        workspaceId: data.workspaceId,
        userId: session.user.id
      }
    });
    revalidatePath("/");
    return { success: true, data: project };
  } catch (error) {
    return { success: false, error: "Failed to create project" };
  }
}

export async function deleteProject(id: string) {
  const session = await auth();
  if (!session?.user?.id) return { success: false, error: "Unauthorized" };

  try {
    await prisma.project.delete({
      where: { id, userId: session.user.id }
    });
    revalidatePath("/");
    return { success: true };
  } catch (error) {
    return { success: false, error: "Failed to delete project" };
  }
}
