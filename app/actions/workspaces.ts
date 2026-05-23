"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function getWorkspaces() {
  const session = await auth();
  if (!session?.user?.id) return { success: false, error: "Unauthorized" };

  try {
    const workspaces = await prisma.workspace.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: "asc" }
    });
    return { success: true, data: workspaces };
  } catch (error) {
    return { success: false, error: "Failed to fetch workspaces" };
  }
}

export async function createWorkspace(data: { name: string }) {
  const session = await auth();
  if (!session?.user?.id) return { success: false, error: "Unauthorized" };

  try {
    const workspace = await prisma.workspace.create({
      data: {
        name: data.name,
        userId: session.user.id
      }
    });
    revalidatePath("/");
    return { success: true, data: workspace };
  } catch (error) {
    return { success: false, error: "Failed to create workspace" };
  }
}

export async function deleteWorkspace(id: string) {
  const session = await auth();
  if (!session?.user?.id) return { success: false, error: "Unauthorized" };

  try {
    await prisma.workspace.delete({
      where: { id, userId: session.user.id }
    });
    revalidatePath("/");
    return { success: true };
  } catch (error) {
    return { success: false, error: "Failed to delete workspace" };
  }
}
