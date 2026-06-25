"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { generateText } from "ai";
import { createGoogleGenerativeAI } from "@ai-sdk/google";

import { imageProvider } from "@/lib/image-provider";

export async function saveJournal(dateStr: string, content: any, metadata: any) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");
  
  const userId = session.user.id;
  const date = new Date(dateStr);
  const startOfDay = new Date(date.getFullYear(), date.getMonth(), date.getDate());

  // Check if journal exists
  let journal = await prisma.journal.findUnique({
    where: { userId_date: { userId, date: startOfDay } }
  });

  if (!journal) {
    journal = await prisma.journal.create({
      data: {
        userId,
        date: startOfDay,
        originalText: "Generated via TipTap Editor",
        content: content,
        quote: metadata.quote || "Keep pushing forward.",
        sticker: metadata.sticker || "🔥 Momentum Day",
        productivityScore: metadata.productivityScore || 0,
        focusStreak: metadata.focusStreak || 0,
        insights: metadata.insights || {},
        tags: metadata.tags || [],
      }
    });
  } else {
    journal = await prisma.journal.update({
      where: { id: journal.id },
      data: { content: content }
    });
  }

  // Create a Version snapshot
  const versionCount = await prisma.journalVersion.count({ where: { journalId: journal.id } });
  
  await prisma.journalVersion.create({
    data: {
      journalId: journal.id,
      versionNumber: versionCount + 1,
      snapshot: content,
      createdBy: "USER"
    }
  });

  return { success: true, journal };
}

export async function generateJournal(mood: string) {
  try {
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
    if (!apiKey) {
      throw new Error("Missing GEMINI_API_KEY");
    }

    const google = createGoogleGenerativeAI({ apiKey });

    const { text } = await generateText({
      model: google("gemini-2.5-flash"),
      system: `You are not writing about the user. You ARE the user. This is your personal diary.
Write entirely in first person ("I finally slowed down today", "I enjoyed reconnecting with Ravi", "I stayed focused much longer than yesterday", "I didn't finish everything, but I made meaningful progress").
STRICT RULES:
1. NEVER use the words "You completed", "The user", "Dashboard", "Summary", or "CRM".
2. NEVER summarize metrics like a dashboard report.
3. The tone MUST be warm, reflective, hopeful, motivational, honest, human, and deeply personal.
4. Convert facts into emotions, observations, reflections, and future intentions.
5. Weave CRM, Tasks, and Deep Work activity naturally into the story instead of listing metrics.

Include 4-5 paragraphs, reflecting on:
1. Today's Story & Biggest Win
2. People I connected with
3. What I learned
4. What I'm grateful for
5. Tomorrow's Intention
You may use basic markdown formatting like bold or italic for emphasis, but do not use bullet lists.`,
      prompt: promptContext,
    });
    
    // Secondary Generation for Sticker, Quote, and Insights
    const { text: jsonText } = await generateText({
      model: google("gemini-2.5-flash"),
      system: `You are an AI generating structured metadata based on my day's journal entry.
Return ONLY valid JSON, no markdown wrappers, with the following exact keys:
"sticker": A single emoji representing the entry (e.g. "🌸", "🌿", "🔥").
"quote": A short motivational quote for the day.
"tags": Array of strings (e.g. ["#CRM", "#DeepWork", "#Meeting", "#Focus"]).
"imageSearchKeywords": A single descriptive string for Unsplash image search (e.g. "coffee desk peaceful").
"insights": an object containing:
- "title": A handwritten elegant title for the journal (e.g. "Quiet Victories", "Calm Reset Day", "Connected Conversations")
- "mood": The overarching emotion (e.g. "Calm", "Focused", "Reflective")
- "dailyInsight": A short deep insight from the day.
- "tomorrowIntention": A single sentence goal for tomorrow.
- "gratitude": One thing you are grateful for.
- "bestProject": String (or "None")
- "peakFocusTime": String (e.g. "Morning", "Afternoon", or "None")
- "completionRate": String (e.g. "High", "Medium", "Low")
- "relationshipGrowth": String (e.g. "Excellent", "Steady")
- "mostImprovedMetric": String`,
      prompt: `Based on this journal entry, generate the requested JSON metadata:\n\n${text}`
    });

    let generatedMetadata: any = {
      sticker: "🌱",
      quote: "Every day is a new opportunity.",
      tags: [],
      imageSearchKeywords: "calm workspace",
      insights: {
        title: "A Day of Reflection",
        mood: "Reflective",
        dailyInsight: "Progress happens one step at a time.",
        tomorrowIntention: "Keep moving forward.",
        gratitude: "For peace and quiet.",
        bestProject: "General",
        peakFocusTime: "None",
        completionRate: "Medium",
        relationshipGrowth: "Steady",
        mostImprovedMetric: "Consistency"
      }
    };

    try {
      const rawJson = jsonText.replace(/^```json/i, '').replace(/```$/i, '').trim();
      generatedMetadata = { ...generatedMetadata, ...JSON.parse(rawJson) };
    } catch (e) {
      console.error("Failed to parse metadata JSON", e);
    }

    // Fetch images based on AI keywords
    const memoryImages = await imageProvider.searchImages(generatedMetadata.imageSearchKeywords, 3);

    // Convert text into TipTap basic JSON structure
    const paragraphs = text.split('\n\n').filter(p => p.trim() !== '');
    const tiptapContent = {
      type: 'doc',
      content: paragraphs.map(p => ({
        type: 'paragraph',
        content: [{ type: 'text', text: p.trim() }]
      }))
    };

    // If we have images, append an image block at the end
    if (memoryImages.length > 0) {
      tiptapContent.content.push({
        type: 'paragraph',
        content: []
      } as any); // Spacing
      
      memoryImages.forEach(imgUrl => {
        tiptapContent.content.push({
          type: 'image',
          attrs: { src: imgUrl }
        } as any);
      });
    }

    // Prepare draft response for frontend
    const draftJournal = {
      date: startOfDay,
      content: tiptapContent,
      originalText: text,
      quote: generatedMetadata.quote,
      sticker: generatedMetadata.sticker,
      tags: generatedMetadata.tags,
      productivityScore,
      focusStreak: currentStreak,
      insights: generatedMetadata.insights,
    };

    return { success: true, journal: draftJournal };
  } catch (error: any) {
    console.error("AI Generation Error Details:");
    console.error("============================");
    console.error(error);
    if (error?.response) {
      console.error("HTTP Status:", error.response.status);
      console.error("Response Data:", error.response.data);
    }
    console.error("============================");
    
    let message = error.message || "Failed to generate journal";
    if (error.name === 'PrismaClientKnownRequestError') {
      message = `Database Error: ${error.message}`;
    }
    
    return { success: false, error: message };
  }
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
