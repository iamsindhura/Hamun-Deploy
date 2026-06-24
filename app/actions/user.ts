"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function updateWorkdaySettings(start: string, end: string) {
 const session = await auth();
 if (!session?.user?.id) {
 return { success: false, error: "Unauthorized" };
 }

 // Basic validation: ensure format is HH:mm and end > start
 if (!/^\d{2}:\d{2}$/.test(start) || !/^\d{2}:\d{2}$/.test(end)) {
 return { success: false, error: "Invalid time format" };
 }

 const [startH, startM] = start.split(":").map(Number);
 const [endH, endM] = end.split(":").map(Number);

 const startMins = startH * 60 + startM;
 const endMins = endH * 60 + endM;

 if (endMins <= startMins) {
 return { success: false, error: "End time must be after start time" };
 }

 try {
 await prisma.user.update({
 where: { id: session.user.id },
 data: {
 workdayStart: start,
 workdayEnd: end,
 },
 });

 revalidatePath("/tasks/today");
 return { success: true };
 } catch (error) {
 console.error("Failed to update workday settings", error);
 return { success: false, error: "Failed to save settings" };
 }
}

export async function updateAudioSettings(data: {
 audioCuesEnabled?: boolean;
 audioCheckpointsEnabled?: boolean;
 audioWarningEnabled?: boolean;
 audioVolume?: string;
}) {
 const session = await auth();
 if (!session?.user?.id) {
 return { success: false, error: "Unauthorized" };
 }

 try {
 await prisma.user.update({
 where: { id: session.user.id },
 data,
 });
 
 revalidatePath("/deep-work");
 revalidatePath("/focus/[taskId]");
 return { success: true };
 } catch (error) {
 console.error("Failed to update audio settings", error);
 return { success: false, error: "Failed to save audio settings" };
 }
}

export async function updateTheme(theme: string) {
 const session = await auth();
 if (!session?.user?.id) {
 return { success: false, error: "Unauthorized" };
 }

 const validTheme = theme === "DARK" ? "DARK" : "LIGHT";

 try {
 await prisma.user.update({
 where: { id: session.user.id },
 data: { theme: validTheme },
 });
 
 return { success: true };
 } catch (error) {
 console.error("Failed to update theme", error);
 return { success: false, error: "Failed to save theme" };
 }
}
