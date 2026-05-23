"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { contactSchema, updateStageSchema } from "@/lib/validations";
import { revalidatePath } from "next/cache";
import { Stage, ActivityType } from "@prisma/client";

function serializeContact(contact: any) {
  if (!contact) return contact;
  return {
    ...contact,
    moneyValue: contact.moneyValue ? Number(contact.moneyValue) : 0,
  };
}

export async function createContact(formData: any) {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: "Unauthorized" };
  }

  const validatedFields = contactSchema.safeParse(formData);

  if (!validatedFields.success) {
    return {
      success: false,
      error: "Invalid fields",
      details: validatedFields.error.flatten().fieldErrors,
    };
  }

  try {
    const contact = await prisma.contact.create({
      data: {
        ...validatedFields.data,
        userId: session.user.id,
        activities: {
          create: {
            type: ActivityType.SYSTEM,
            content: "Contact created",
          },
        },
      },
    });

    revalidatePath("/");
    revalidatePath("/contacts");
    revalidatePath("/kanban");

    return { success: true, data: serializeContact(contact) };
  } catch (error) {
    console.error("Failed to create contact:", error);
    return { success: false, error: "Database error" };
  }
}

export async function updateContact(id: string, formData: any) {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: "Unauthorized" };
  }

  const validatedFields = contactSchema.safeParse(formData);

  if (!validatedFields.success) {
    return {
      success: false,
      error: "Invalid fields",
      details: validatedFields.error.flatten().fieldErrors,
    };
  }

  try {
    // Ensure the contact belongs to the user
    const existing = await prisma.contact.findUnique({
      where: { id, userId: session.user.id },
    });

    if (!existing) {
      return { success: false, error: "Contact not found" };
    }

    const contact = await prisma.contact.update({
      where: { id },
      data: validatedFields.data,
    });

    revalidatePath("/");
    revalidatePath("/contacts");
    revalidatePath("/kanban");

    return { success: true, data: serializeContact(contact) };
  } catch (error) {
    console.error("Failed to update contact:", error);
    return { success: false, error: "Database error" };
  }
}

export async function deleteContact(id: string) {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: "Unauthorized" };
  }

  try {
    await prisma.contact.delete({
      where: { id, userId: session.user.id },
    });

    revalidatePath("/");
    revalidatePath("/contacts");
    revalidatePath("/kanban");

    return { success: true };
  } catch (error) {
    console.error("Failed to delete contact:", error);
    return { success: false, error: "Database error" };
  }
}

export async function changeStage(id: string, stage: Stage) {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: "Unauthorized" };
  }

  try {
    const contact = await prisma.contact.update({
      where: { id, userId: session.user.id },
      data: { 
        stage,
        activities: {
          create: {
            type: ActivityType.STAGE_CHANGE,
            content: `Stage changed to ${stage}`,
          },
        },
      },
    });

    revalidatePath("/kanban");
    revalidatePath("/contacts");

    return { success: true, data: serializeContact(contact) };
  } catch (error) {
    console.error("Failed to change stage:", error);
    return { success: false, error: "Database error" };
  }
}

export async function logContact(id: string) {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: "Unauthorized" };
  }

  try {
    const contact = await prisma.contact.update({
      where: { id, userId: session.user.id },
      data: {
        followUpCount: { increment: 1 },
        lastContactedAt: new Date(),
        activities: {
          create: {
            type: ActivityType.CALL,
            content: "Initiated follow-up / WhatsApp contact",
          },
        },
      },
    });

    revalidatePath("/contacts");
    revalidatePath("/kanban");

    return { success: true, data: serializeContact(contact) };
  } catch (error) {
    console.error("Failed to log contact:", error);
    return { success: false, error: "Database error" };
  }
}

export async function toggleArchive(id: string) {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: "Unauthorized" };
  }

  try {
    const existing = await prisma.contact.findUnique({
      where: { id, userId: session.user.id },
      select: { isArchived: true },
    });

    if (!existing) return { success: false, error: "Not found" };

    const contact = await prisma.contact.update({
      where: { id },
      data: { isArchived: !existing.isArchived },
    });

    revalidatePath("/contacts");
    revalidatePath("/kanban");

    return { success: true, data: serializeContact(contact) };
  } catch (error) {
    console.error("Failed to toggle archive:", error);
    return { success: false, error: "Database error" };
  }
}

export async function getTopTags() {
  const session = await auth();
  if (!session?.user?.id) return [];

  try {
    const contacts = await prisma.contact.findMany({
      where: { userId: session.user.id },
      select: { tags: true },
    });

    const tagCounts: Record<string, number> = {};
    for (const c of contacts) {
      for (const tag of c.tags) {
        tagCounts[tag] = (tagCounts[tag] || 0) + 1;
      }
    }

    return Object.entries(tagCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([name, count]) => ({ name, count }));
  } catch (error) {
    console.error("Failed to get top tags:", error);
    return [];
  }
}
