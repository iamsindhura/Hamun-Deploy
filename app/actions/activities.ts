"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { ActivityType } from "@prisma/client";

export async function getActivities(contactId: string) {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }

  return await prisma.activity.findMany({
    where: { contactId },
    orderBy: { createdAt: "desc" },
  });
}

export async function createActivity(contactId: string, type: ActivityType, content: string) {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: "Unauthorized" };
  }

  try {
    const activity = await prisma.activity.create({
      data: {
        contactId,
        type,
        content,
      },
    });

    revalidatePath("/contacts");
    revalidatePath("/kanban");

    return { success: true, data: activity };
  } catch (error) {
    console.error("Failed to create activity:", error);
    return { success: false, error: "Database error" };
  }
}
