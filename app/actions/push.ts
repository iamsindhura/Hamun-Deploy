"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function saveSubscription(subscription: any) {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: "Unauthorized" };
  }

  try {
    const { endpoint, keys } = subscription;
    
    await prisma.pushSubscription.upsert({
      where: { endpoint },
      update: {
        p256dh: keys.p256dh,
        auth: keys.auth,
        userId: session.user.id,
      },
      create: {
        endpoint,
        p256dh: keys.p256dh,
        auth: keys.auth,
        userId: session.user.id,
      },
    });

    return { success: true };
  } catch (error) {
    console.error("Failed to save push subscription:", error);
    return { success: false, error: "Database error" };
  }
}
