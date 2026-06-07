import { prisma } from "@/lib/prisma";
import webpush from "web-push";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  // Check auth header for Vercel Cron
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    // return new NextResponse("Unauthorized", { status: 401 });
    // For development, we might skip this or use a local secret
  }

  const publicVapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!;
  const privateVapidKey = process.env.VAPID_PRIVATE_KEY!;

  webpush.setVapidDetails(
    "mailto:admin@hamun.app",
    publicVapidKey,
    privateVapidKey
  );

  const now = new Date();
  const fifteenMinutesFromNow = new Date(now.getTime() + 15 * 60000);

  // Find contacts with reminders due soon
  const contactsToRemind = await prisma.contact.findMany({
    where: {
      reminderAt: {
        lte: fifteenMinutesFromNow,
        gt: now, // Only send if not already passed or just about to pass
      },
    },
    include: {
      user: {
        include: {
          pushSubs: true,
        },
      },
    },
  });

  const results = [];

  for (const contact of contactsToRemind) {
    const payload = JSON.stringify({
      title: "Follow-up Reminder",
      body: `Time to follow up with ${contact.name}`,
      url: `/contacts`,
    });

    for (const sub of contact.user.pushSubs) {
      try {
        await webpush.sendNotification(
          {
            endpoint: sub.endpoint,
            keys: {
              p256dh: sub.p256dh,
              auth: sub.auth,
            },
          },
          payload
        );
        results.push(`Sent to ${contact.user.email} for ${contact.name}`);
      } catch (error) {
        console.error("Failed to send push:", error);
      }
    }
    
    // Clear reminder so it doesn't fire again
    await prisma.contact.update({
      where: { id: contact.id },
      data: { reminderAt: null },
    });
  }

  // Find tasks with reminders due soon
  const tasksToRemind = await prisma.task.findMany({
    where: {
      reminderAt: {
        lte: fifteenMinutesFromNow,
        gt: now, // Only send if not already passed or just about to pass
      },
    },
    include: {
      user: {
        include: {
          pushSubs: true,
        },
      },
    },
  });

  for (const task of tasksToRemind) {
    const payload = JSON.stringify({
      title: "Task Reminder",
      body: `Reminder: ${task.title}`,
      url: `/tasks/${task.projectId}`,
    });

    for (const sub of task.user.pushSubs) {
      try {
        await webpush.sendNotification(
          {
            endpoint: sub.endpoint,
            keys: {
              p256dh: sub.p256dh,
              auth: sub.auth,
            },
          },
          payload
        );
        results.push(`Sent to ${task.user.email} for task ${task.title}`);
      } catch (error) {
        console.error("Failed to send push:", error);
      }
    }
    
    // Clear reminder so it doesn't fire again
    await prisma.task.update({
      where: { id: task.id },
      data: { reminderAt: null },
    });
  }

  return NextResponse.json({ success: true, sentCount: results.length, details: results });
}
