"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { generateText } from "ai";
import { createGoogleGenerativeAI } from "@ai-sdk/google";

export async function saveJournal(id: string, text: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const journal = await prisma.journal.findUnique({ where: { id } });
  if (!journal || journal.userId !== session.user.id) {
    throw new Error("Not found or unauthorized");
  }

  const updated = await prisma.journal.update({
    where: { id },
    data: { editedText: text }
  });

  return { success: true, journal: updated };
}

export async function generateJournal(mood: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const userId = session.user.id;
  
  // Calculate Date bounds for "today"
  const now = new Date();
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

  // 1. Fetch CRM Data
  const contactsCreated = await prisma.contact.count({
    where: { userId, createdAt: { gte: startOfDay, lte: endOfDay } }
  });
  
  const activities = await prisma.activity.findMany({
    where: { contact: { userId }, createdAt: { gte: startOfDay, lte: endOfDay } },
    include: { contact: true }
  });

  const stagesMoved = activities.filter(a => a.type === "STAGE_CHANGE").length;
  
  // 2. Fetch Tasks Data
  const tasksCreated = await prisma.task.count({
    where: { userId, createdAt: { gte: startOfDay, lte: endOfDay } }
  });
  const tasksCompleted = await prisma.task.findMany({
    where: { userId, completedAt: { gte: startOfDay, lte: endOfDay } }
  });
  const overdues = await prisma.task.count({
    where: { userId, dueDate: { lt: startOfDay }, isCompleted: false }
  });

  // 3. Fetch Projects Data
  const projectsCreated = await prisma.project.count({
    where: { userId, createdAt: { gte: startOfDay, lte: endOfDay } }
  });

  // 4. Fetch Deep Work Data
  const focusSessions = await prisma.focusSession.findMany({
    where: { userId, startTime: { gte: startOfDay, lte: endOfDay } }
  });
  const totalFocusMinutes = focusSessions.reduce((acc, s) => acc + s.actualFocusDuration, 0);

  // Focus Streak Calculation
  const allFocusSessions = await prisma.focusSession.findMany({
    where: { userId },
    orderBy: { startTime: 'desc' },
    select: { startTime: true }
  });
  
  let currentStreak = 0;
  let checkDate = new Date(startOfDay);
  
  // A naive streak calculator for consecutive days
  const activeDates = new Set(allFocusSessions.map(s => new Date(s.startTime).toDateString()));
  while(activeDates.has(checkDate.toDateString())) {
    currentStreak++;
    checkDate.setDate(checkDate.getDate() - 1);
  }

  // Productivity Score Deterministic Calculation (0-100)
  let productivityScore = 0;
  productivityScore += Math.min(tasksCompleted.length * 5, 40); // Max 40 from tasks
  productivityScore += Math.min(Math.floor(totalFocusMinutes / 30) * 10, 40); // Max 40 from focus
  productivityScore += Math.min(contactsCreated * 5, 20); // Max 20 from contacts
  if (overdues > 5) productivityScore -= 10;
  productivityScore = Math.max(0, Math.min(100, productivityScore));

  const promptContext = `
  I am writing my personal diary entry for today.
  Mood: ${mood}
  Tasks Completed Today: ${tasksCompleted.length}
  Focus Sessions Today: ${focusSessions.length} (${totalFocusMinutes} minutes)
  New Contacts Added: ${contactsCreated}
  Overdue Tasks: ${overdues}
  New Projects Started: ${projectsCreated}
  CRM Interactions/Activities: ${activities.length}
  Pipeline Moves: ${stagesMoved}
  `;

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("GEMINI_API_KEY is missing");

  const google = createGoogleGenerativeAI({ apiKey });

  const { text } = await generateText({
    model: google("gemini-2.5-flash"),
    system: `You are not writing about the user. You ARE the user.
Write a personal diary entry.
Write entirely in first person ("I completed...", "I noticed...", "I felt...").
Never use bullet points.
Never summarize metrics like a dashboard.
Convert facts into emotions, observations, reflections and future intentions.
The result should feel like a diary entry I personally wrote before going to sleep.
Include 5 short paragraphs:
1. How the day felt emotionally (referencing my mood).
2. Important events from CRM, Projects, Tasks.
3. Deep work and execution reflection.
4. Lessons learned.
5. What I want to focus on tomorrow.
DO NOT use markdown formatting, headers, or bullet lists. Just paragraphs.`,
    prompt: promptContext,
  });
  
  // Secondary Generation for Sticker, Quote, and Insights
  const { text: jsonText } = await generateText({
    model: google("gemini-2.5-flash"),
    system: `You are an AI generating structured metadata based on my day's journal entry.
Return ONLY valid JSON, no markdown wrappers, with the following exact keys:
"sticker": A short fun phrase like "🔥 Momentum Day", "🌱 Growth Day", "💜 Relationship Builder", "🎯 Deep Focus Day", etc.
"quote": A short motivational quote for the day.
"insights": an object containing:
- "bestProject": String (or "None")
- "peakFocusTime": String (e.g. "Morning", "Afternoon", or "None")
- "completionRate": String (e.g. "High", "Medium", "Low")
- "relationshipGrowth": String (e.g. "Excellent", "Steady")
- "mostImprovedMetric": String`,
    prompt: `Based on this journal entry, generate the requested JSON metadata:\n\n${text}`
  });

  let metadata = {
    sticker: "🌱 Growth Day",
    quote: "Every day is a new opportunity.",
    insights: {
      bestProject: "General",
      peakFocusTime: "None",
      completionRate: "Medium",
      relationshipGrowth: "Steady",
      mostImprovedMetric: "Consistency"
    }
  };

  try {
    const rawJson = jsonText.replace(/^```json/i, '').replace(/```$/i, '').trim();
    metadata = JSON.parse(rawJson);
  } catch (e) {
    console.error("Failed to parse metadata JSON", e);
  }

  // Create or Update Journal for today
  const journal = await prisma.journal.upsert({
    where: {
      userId_date: {
        userId,
        date: startOfDay
      }
    },
    update: {
      originalText: text,
      quote: metadata.quote || "Keep pushing forward.",
      sticker: metadata.sticker || "🔥 Momentum Day",
      productivityScore,
      focusStreak: currentStreak,
      insights: metadata.insights as any,
    },
    create: {
      userId,
      date: startOfDay,
      originalText: text,
      quote: metadata.quote || "Keep pushing forward.",
      sticker: metadata.sticker || "🔥 Momentum Day",
      productivityScore,
      focusStreak: currentStreak,
      insights: metadata.insights as any,
    }
  });

  return { success: true, journal };
}

export async function getJournal(date: Date) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const startOfDay = new Date(date.getFullYear(), date.getMonth(), date.getDate());

  return prisma.journal.findUnique({
    where: {
      userId_date: {
        userId: session.user.id,
        date: startOfDay
      }
    }
  });
}

export async function getJournalHistory() {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  return prisma.journal.findMany({
    where: { userId: session.user.id },
    orderBy: { date: 'desc' },
    take: 30
  });
}
