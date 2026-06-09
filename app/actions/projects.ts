"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function getProjects() {
  const session = await auth();
  if (!session?.user?.id) return { success: false, error: "Unauthorized" };

  try {
    const projects = await prisma.project.findMany({
      where: { userId: session.user.id },
      orderBy: [
        { isPinned: "desc" },
        { position: "asc" },
        { createdAt: "asc" }
      ]
    });
    return { success: true, data: projects };
  } catch (error) {
    return { success: false, error: "Failed to fetch projects" };
  }
}

export async function createProject(data: { name: string; color?: string }) {
  const session = await auth();
  if (!session?.user?.id) return { success: false, error: "Unauthorized" };

  try {
    const maxPositionProject = await prisma.project.findFirst({
      where: { userId: session.user.id },
      orderBy: { position: "desc" },
      select: { position: true }
    });
    const position = maxPositionProject ? maxPositionProject.position + 1 : 0;

    const project = await prisma.project.create({
      data: {
        name: data.name,
        color: data.color,
        userId: session.user.id,
        position
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

export async function updateProject(id: string, data: { name?: string; color?: string; position?: number; isPinned?: boolean }) {
  const session = await auth();
  if (!session?.user?.id) return { success: false, error: "Unauthorized" };

  try {
    const project = await prisma.project.update({
      where: { id, userId: session.user.id },
      data
    });
    revalidatePath("/");
    return { success: true, data: project };
  } catch (error) {
    return { success: false, error: "Failed to update project" };
  }
}
