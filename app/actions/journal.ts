"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { z } from "zod";
import { DailyContextBuilder } from "@/lib/daily-context-builder";
import { extractTextFromTiptap } from "@/lib/tiptap-utils";
import { imageProvider } from "@/lib/image-provider";
import { AiService } from "@/lib/ai/service";
import { headers } from "next/headers";

export async function createEmptyJournal(dateStr: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");
  
  const userId = session.user.id;
  const date = new Date(dateStr);
  const startOfDay = new Date(date.getFullYear(), date.getMonth(), date.getDate());

  let journal = await prisma.journal.findUnique({
    where: { userId_date: { userId, date: startOfDay } }
  });

  if (!journal) {
    journal = await prisma.journal.create({
      data: {
        userId,
        date: startOfDay,
        originalText: "",
        content: {
          type: "doc",
          content: [
            {
              type: "paragraph",
              content: []
            }
          ]
        },
        quote: "",
        sticker: "Neutral",
        productivityScore: 0,
        focusStreak: 0,
        insights: { title: "", emotion: "Neutral", stickyNote: "" },
        tags: [],
      }
    });
  }

  return { success: true, journal: { ...journal, date: journal.date.toISOString() } };
}

export async function toggleFavorite(journalId: string, isFavorite: boolean) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const journal = await prisma.journal.update({
    where: { id: journalId, userId: session.user.id },
    data: { isFavorite }
  });

  return { success: true, journal: { ...journal, date: journal.date.toISOString() } };
}

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
    // Preserve existing AI metadata while updating manual overrides
    const updatedInsights = metadata.insights ? { ...(journal.insights as any || {}), ...metadata.insights } : journal.insights;

    journal = await prisma.journal.update({
      where: { id: journal.id },
      data: { 
        content: content,
        originalText: extractTextFromTiptap(content),
        quote: metadata.quote !== undefined ? metadata.quote : journal.quote,
        sticker: metadata.sticker !== undefined ? metadata.sticker : journal.sticker,
        tags: metadata.tags !== undefined ? metadata.tags : journal.tags,
        insights: updatedInsights
      }
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

  return { success: true, journal: { ...journal, date: journal.date.toISOString() } };
}

export async function generateJournal(moodFallback: string) {
  try {
    const session = await auth();
    if (!session?.user?.id) throw new Error("Unauthorized");

    const userId = session.user.id;
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    // Dev-only fail simulation
    let failProviders: string[] = [];
    if (process.env.NODE_ENV === "development") {
      try {
        const headersList = await headers();
        const referer = headersList.get("referer");
        if (referer) {
          const url = new URL(referer);
          const failParam = url.searchParams.get("fail");
          if (failParam) {
            failProviders = failParam.split(",").map(p => p.trim().toLowerCase());
            console.log(`[Dev Failure Simulator] Simulating failures for: ${failProviders.join(", ")}`);
          }
        }
      } catch (err) {
        console.warn("[Dev Failure Simulator] Failed to check referer headers", err);
      }
    }

    // 1. Build context using DailyContextBuilder
    const context = await DailyContextBuilder.buildContext(userId, now);

    // Fetch today's attachments for the journal context
    const todayJournal = await prisma.journal.findUnique({
      where: { userId_date: { userId, date: startOfDay } },
      include: { attachments: true }
    });
    
    if (todayJournal?.isFinalized) {
      return { success: false, error: "This journal has already been permanently finalized." };
    }
    
    // Extract captions from existing Tiptap JSON if any
    const existingContent = todayJournal?.content as any;
    const captionsMap = new Map<string, string>();
    if (existingContent && existingContent.content) {
      const walk = (nodes: any[]) => {
        for (const node of nodes) {
          if (node.attrs?.attachmentId && node.attrs?.caption) {
            captionsMap.set(node.attrs.attachmentId, node.attrs.caption);
          }
          if (node.content) walk(node.content);
        }
      };
      walk(existingContent.content);
    }
    
    const attachmentsContext = todayJournal?.attachments?.map(att => {
      let text = `Memory / Note captured today:\n`;
      if (att.summary) text += `- Details: ${att.summary}\n`;
      const userCaption = captionsMap.get(att.id);
      if (userCaption) text += `- User's additional thoughts: "${userCaption}"\n`;
      return text;
    }).join('\n\n') || "No special memories captured today.";

    const { AiService } = await import("@/lib/ai/service");
    const { JOURNAL_SYSTEM_PROMPT, buildJournalUserPrompt, JOURNAL_SCHEMA } = await import("@/lib/ai/prompts");

    const systemPrompt = JOURNAL_SYSTEM_PROMPT;
    const userPrompt = buildJournalUserPrompt({
      predictedEmotion: context.predictedEmotion,
      semantics: context.semantics,
      raw: context.raw,
      calculatedScores: context.calculatedScores,
      attachmentsContext,
    });

    const journalOnlySchema = JOURNAL_SCHEMA.omit({ aiAnalysis: true });

    // 2. Generate Object with Strict Zod Schema
    let object: any;
    try {
      object = await AiService.generateStructuredData({
        systemPrompt: systemPrompt,
        userPrompt: userPrompt,
        schema: journalOnlySchema,
        failProviders,
        context: {
          predictedEmotion: context.predictedEmotion,
          semantics: context.semantics,
          raw: context.raw,
          calculatedScores: context.calculatedScores,
          attachmentsContext,
        }
      });
    } catch (aiError: any) {
      const isQuotaError = 
        aiError?.statusCode === 429 || 
        aiError?.message?.toLowerCase().includes("quota") || 
        aiError?.message?.toLowerCase().includes("rate limit") ||
        aiError?.message?.toLowerCase().includes("429");
        
      if (isQuotaError) {
        if (process.env.ENABLE_AI_MOCK_DATA === 'true') {
          console.log("✓ Using Mock Response (Development)");
          object = {
            title: "Mock: A Productive Day",
            subtitle: "Finding focus despite the noise.",
            emotion: "Motivated",
            stickyNote: "Keep pushing forward.",
            journal: "This is a mock journal entry generated because the Gemini API quota was exceeded in development mode.\n\nI made significant progress today, wrapping up loose ends and setting the stage for tomorrow.",
            dailyInsight: "Consistency beats intensity.",
            tomorrowIntention: "Focus on deep work.",
            gratitude: "Grateful for the team's support.",
            favoriteQuote: "The secret of getting ahead is getting started.",
            imagePrompts: ["A quiet desk with warm light"],
            stickers: ["🌱"],
            journalTags: ["mock", "development", "productivity"],
            themeColor: "#7A5AF8",
            musicMood: "Lo-Fi Beats",
            highlights: ["Completed AI Integration", "Cleared inbox"]
          };
        } else {
          console.log("✓ Gemini Quota Exceeded");
          return { 
            success: false, 
            errorType: 'QUOTA_EXCEEDED', 
            error: "AI services are temporarily unavailable because today's AI request limit has been reached. Your journal remains safe." 
          };
        }
      } else {
        throw aiError; // throw non-quota errors to be caught by the main catch block
      }
    }

    // 3. Create or Update AI Memory
    // Check if AIMemory exists for today
    let memory = await prisma.aIMemory.findUnique({
      where: { userId_date: { userId, date: startOfDay } }
    });

    const memoryData = {
      highlights: object.highlights,
      achievements: [context.semantics.productivitySummary],
      challenges: [context.semantics.workloadSummary],
      lessons: [object.dailyInsight],
      peopleMentioned: [], // Would require NER or explicit LLM extraction if we wanted exact names
      projectsMentioned: [],
      mood: object.emotion,
      moodScore: 80, // Default for now
      productivityTrend: context.semantics.consistencySummary,
      focusTrend: context.semantics.focusSummary,
      relationshipTrend: context.semantics.relationshipSummary,
    };

    if (memory) {
      await prisma.aIMemory.update({
        where: { id: memory.id },
        data: memoryData
      });
    } else {
      await prisma.aIMemory.create({
        data: {
          userId,
          date: startOfDay,
          ...memoryData
        }
      });
    }

    // 4. Convert Markdown to TipTap basic JSON structure
    // Handle both literal string newlines and escaped newlines from LLM
    const normalizedText = (object.journal as string).replace(/\\n/g, '\n');
    const paragraphs = normalizedText.split(/\n\n+/).filter((p: string) => p.trim() !== '');
    const tiptapContent = {
      type: 'doc',
      content: paragraphs.map((p: string) => {
        const attachMatch = p.trim().match(/^\[ATTACHMENT:\s*([^\]]+)\]$/i);
        if (attachMatch) {
          const attId = attachMatch[1].trim();
          const att = todayJournal?.attachments?.find(a => a.id === attId);
          if (att) {
            const caption = captionsMap.get(att.id) || "";
            if (att.type === 'IMAGE') {
              return {
                type: 'customImage',
                attrs: { src: att.storagePath, attachmentId: att.id, summary: att.summary, caption: caption }
              };
            } else if (att.type === 'VOICE') {
              return {
                type: 'customAudio',
                attrs: { src: att.storagePath, attachmentId: att.id, duration: att.duration || 0, transcript: att.summary, summary: att.summary }
              };
            } else if (att.type === 'PDF') {
              return {
                type: 'customPDF',
                attrs: { src: att.storagePath, attachmentId: att.id, filename: att.filename, pages: att.pages || 0, size: att.size || 0, summary: att.summary }
              };
            }
          }
        }
        return {
          type: 'paragraph',
          content: [{ type: 'text', text: p.trim() }]
        };
      })
    };

    // Retrieve pre-existing AI Analysis if it exists in the database to preserve it
    const existingInsights = todayJournal?.insights as any;
    const existingAiAnalysis = existingInsights?.aiAnalysis || null;

    // Prepare draft response for frontend
    const draftJournal = {
      date: startOfDay,
      content: tiptapContent,
      originalText: object.journal,
      quote: object.stickyNote,
      sticker: object.stickers.length > 0 ? object.stickers[0] : "🌱",
      tags: object.journalTags,
      subtitle: object.subtitle,
      themeColor: object.themeColor,
      musicMood: object.musicMood,
      highlights: object.highlights,
      productivityScore: context.calculatedScores ? context.calculatedScores.overallScore : Math.min(context.raw.tasksCompleted * 10, 100),
      focusStreak: 0,
      insights: {
        title: object.title,
        emotion: object.emotion,
        dailyInsight: object.dailyInsight,
        tomorrowIntention: object.tomorrowIntention,
        gratitude: object.gratitude,
        imagePrompts: object.imagePrompts,
        aiAnalysis: existingAiAnalysis, // Preserve existing insights!
      },
    };

    console.log("✓ AI Briefing Generated", object.aiAnalysis ? "YES" : "NO");

    // 5. Save the generated journal to the database!
    let dbJournal = await prisma.journal.findUnique({
      where: { userId_date: { userId, date: startOfDay } }
    });

    if (dbJournal) {
      dbJournal = await prisma.journal.update({
        where: { id: dbJournal.id },
        data: draftJournal
      });
    } else {
      dbJournal = await prisma.journal.create({
        data: {
          userId,
          ...draftJournal
        }
      });
    }

    const savedInsights = dbJournal.insights as any;
    console.log("✓ AI Briefing Saved to Database", savedInsights?.aiAnalysis ? "YES" : "NO");

    // Create a Version snapshot
    const versionCount = await prisma.journalVersion.count({ where: { journalId: dbJournal.id } });
    await prisma.journalVersion.create({
      data: {
        journalId: dbJournal.id,
        versionNumber: versionCount + 1,
        snapshot: tiptapContent,
        createdBy: "AI_GENERATION"
      }
    });

    return { success: true, journal: { ...dbJournal, date: dbJournal.date.toISOString() } };
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

  const j = await prisma.journal.findUnique({
    where: {
      userId_date: {
        userId: session.user.id,
        date: startOfDay
      }
    },
    include: {
      personalMemories: true
    }
  });

  if (j) {
    const loadedInsights = j.insights as any;
    console.log("✓ AI Briefing Loaded Successfully", loadedInsights?.aiAnalysis ? "YES" : "NO");
    return {
      ...j,
      date: j.date.toISOString()
    };
  }

  return null;
}

export async function getJournalHistory() {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const journals = await prisma.journal.findMany({
    where: { userId: session.user.id },
    orderBy: { date: 'desc' },
    take: 30
  });

  return journals.map(j => ({
    ...j,
    date: j.date.toISOString()
  }));
}

export async function generateDailyAnalysis(journalId: string) {
  const session = await auth();
  if (!session?.user?.id) return { success: false, error: "Unauthorized" };
  const userId = session.user.id;

  const dbJournal = await prisma.journal.findUnique({
    where: { id: journalId, userId },
    include: { attachments: true }
  });

  if (!dbJournal) {
    return { success: false, error: "Journal not found" };
  }

  // 1. Gather comprehensive context
  const context = await DailyContextBuilder.buildContext(userId, new Date(dbJournal.date));

  // Dev simulation of failures
  let failProviders: string[] = [];
  if (process.env.NODE_ENV === "development") {
    try {
      const headersList = await headers();
      const referer = headersList.get("referer");
      if (referer) {
        const url = new URL(referer);
        const failParam = url.searchParams.get("fail");
        if (failParam) {
          failProviders = failParam.split(",").map(p => p.trim().toLowerCase());
          console.log(`[Dev Failure Simulator] Simulating failures for: ${failProviders.join(", ")}`);
        }
      }
    } catch (err) {
      console.warn("[Dev Failure Simulator] Failed to check referer headers", err);
    }
  }

  // Extract captions from existing Tiptap JSON if any
  const existingContent = dbJournal.content as any;
  const captionsMap = new Map<string, string>();
  if (existingContent && existingContent.content) {
    const walk = (nodes: any[]) => {
      for (const node of nodes) {
        if (node.attrs?.attachmentId && node.attrs?.caption) {
          captionsMap.set(node.attrs.attachmentId, node.attrs.caption);
        }
        if (node.content) walk(node.content);
      }
    };
    walk(existingContent.content);
  }

  const attachmentsContext = dbJournal.attachments?.map(att => {
    let text = `Memory / Note captured today:\n`;
    if (att.summary) text += `- Details: ${att.summary}\n`;
    const userCaption = captionsMap.get(att.id);
    if (userCaption) text += `- User's additional thoughts: "${userCaption}"\n`;
    return text;
  }).join('\n\n') || "No special memories captured today.";

  const latestJournalText = dbJournal.content 
    ? extractTextFromTiptap(dbJournal.content as any) 
    : dbJournal.originalText;

  const { INSIGHTS_ONLY_SYSTEM_PROMPT, INSIGHTS_ONLY_SCHEMA, buildInsightsOnlyUserPrompt } = await import("@/lib/ai/prompts/insights-prompt");

  // Construct conforming prompt context matching JournalPromptContext
  const promptContext = {
    predictedEmotion: context.predictedEmotion,
    semantics: context.semantics,
    raw: context.raw,
    calculatedScores: context.calculatedScores,
    attachmentsContext,
  };

  const systemPrompt = INSIGHTS_ONLY_SYSTEM_PROMPT;
  const userPrompt = buildInsightsOnlyUserPrompt(promptContext, latestJournalText);

  let aiAnalysis: any;
  try {
    const object = await AiService.generateStructuredData({
      systemPrompt,
      userPrompt,
      schema: INSIGHTS_ONLY_SCHEMA,
      failProviders
    }) as any;
    aiAnalysis = object.aiAnalysis;
    if (aiAnalysis && context.calculatedScores) {
      aiAnalysis.score = context.calculatedScores.overallScore;
    }
  } catch (aiError: any) {
    const isQuotaError = 
      aiError?.statusCode === 429 || 
      aiError?.message?.toLowerCase().includes("quota") || 
      aiError?.message?.toLowerCase().includes("rate limit") ||
      aiError?.message?.toLowerCase().includes("429");
      
    if (isQuotaError) {
      if (process.env.ENABLE_AI_MOCK_DATA === 'true') {
        console.log("✓ Using Mock Response for AI Briefing (Development)");
        aiAnalysis = {
          score: context.calculatedScores ? context.calculatedScores.overallScore : 85,
          label: "Excellent Momentum",
          executiveSummary: "A highly productive day with strong focus on core tasks.",
          bulletPoints: [
            { icon: "🎯", text: "Successfully completed key project milestones." },
            { icon: "🤝", text: "Nurtured important client relationships." },
            { icon: "⚡", text: "Maintained strong energy throughout the day." },
            { icon: "📈", text: "Pipeline value increased steadily." },
            { icon: "🌱", text: "Personal growth aligned with business goals." }
          ],
          recommendation: "Continue this momentum into tomorrow's planning session."
        };
      } else {
        console.log("✓ Gemini Quota Exceeded (AI Briefing)");
        return { 
          success: false, 
          errorType: 'QUOTA_EXCEEDED', 
          error: "AI services are temporarily unavailable because today's AI request limit has been reached. Your briefing remains safe." 
        };
      }
    } else {
      throw aiError;
    }
  }

  const existingInsights = (dbJournal.insights as any) || {};
  const updatedInsights = {
    ...existingInsights,
    aiAnalysis
  };

  const updatedJournal = await prisma.journal.update({
    where: { id: dbJournal.id },
    data: {
      insights: updatedInsights
    }
  });

  return { success: true, journal: { ...updatedJournal, date: updatedJournal.date.toISOString() } };
}

const JOURNAL_FINALIZATION_SYSTEM_PROMPT = `You are a premium, empathetic AI journaling assistant. Your task is to produce a polished, cohesive, final daily journal entry. 

You will be given:
1. Today's workspace activity telemetry (tasks, focus minutes, habits, etc.)
2. A draft AI journal entry summarizing the day's activity.
3. A list of personal memories provided directly by the user (which are highly personal, real-world events the AI telemetry could never capture).

Your goal is to intelligently merge the personal memories into the story of the draft journal to create a single, continuous, elegant, first-person narrative ("I").

Follow these strict rules:
1. **Preserve Every Personal Memory**: You MUST include and preserve every single personal memory provided by the user. Do not ignore, truncate, or omit any meaningful detail, name, conversation, or experience they write.
2. **Natural Merging & Transitions**: Integrate these memories naturally into the timeline of the day's events. Smooth out transitions between telemetry activity (like working on a project) and real-life moments (like having dinner with family or meeting a friend).
3. **No Inventions**: Do not invent external events or fabricate details not provided in the inputs. Do not assume or hallucinate dates, locations, or names.
4. **Writing Quality & Emotional Flow**: Elevate the writing to feel personal, reflective, and premium. Match the emotional tone and flow of the personal memories while keeping the style consistent.
5. **JSON Schema**: You must respond strictly in JSON matching the requested schema. Ensure all fields (title, subtitle, journal text, highlights, quote, tags, etc.) are filled appropriately, with the merged journal narrative in the 'journal' field.`;

function buildFinalizationUserPrompt(params: {
  originalJournalText: string;
  personalMemories: string[];
  activityContext: string;
}) {
  return `Please merge the following personal memories into today's journal draft:

---
MANUAL PERSONAL MEMORIES:
${params.personalMemories.map((m, idx) => `${idx + 1}. ${m}`).join('\n')}
---

---
EXISTING DRAFT JOURNAL TEXT:
${params.originalJournalText}
---

---
DAILY ACTIVITY TELEMETRY CONTEXT:
${params.activityContext}
---

Produce the final polished JSON entry ensuring all user memories are seamlessly integrated.`;
}

export async function savePersonalMemories(journalId: string, memories: string[]) {
  const session = await auth();
  if (!session?.user?.id) return { success: false, error: "Unauthorized" };
  
  try {
    const j = await prisma.journal.findUnique({
      where: { id: journalId, userId: session.user.id }
    });
    if (!j) return { success: false, error: "Journal not found" };
    if (j.isFinalized) return { success: false, error: "Journal is finalized and cannot be modified." };

    await prisma.$transaction([
      prisma.personalMemory.deleteMany({ where: { journalId } }),
      prisma.personalMemory.createMany({
        data: memories.filter(c => c.trim() !== "").map(content => ({
          journalId,
          content: content.trim()
        }))
      })
    ]);

    const updatedJournal = await prisma.journal.findUnique({
      where: { id: journalId },
      include: { personalMemories: true }
    });

    const { revalidatePath } = await import("next/cache");
    revalidatePath("/journal");

    return { 
      success: true, 
      journal: updatedJournal ? { 
        ...updatedJournal, 
        date: updatedJournal.date.toISOString() 
      } : null 
    };
  } catch (err: any) {
    console.error("Failed to save personal memories", err);
    return { success: false, error: err.message || "Failed to save personal memories" };
  }
}

export async function finalizeJournalAction(journalId: string) {
  const session = await auth();
  if (!session?.user?.id) return { success: false, error: "Unauthorized" };
  const userId = session.user.id;

  try {
    const todayJournal = await prisma.journal.findUnique({
      where: { id: journalId, userId },
      include: { personalMemories: true, attachments: true }
    });

    if (!todayJournal) return { success: false, error: "Journal not found" };
    if (todayJournal.isFinalized) return { success: false, error: "Journal is already finalized." };

    const memories = todayJournal.personalMemories.map(m => m.content);
    if (memories.length === 0) {
      return { success: false, error: "Please add at least one personal memory before finalizing." };
    }

    // 1. Build context using DailyContextBuilder
    const now = new Date(todayJournal.date);
    const context = await DailyContextBuilder.buildContext(userId, now);

    // Extract captions from existing Tiptap JSON if any
    const existingContent = todayJournal.content as any;
    const captionsMap = new Map<string, string>();
    if (existingContent && existingContent.content) {
      const walk = (nodes: any[]) => {
        for (const node of nodes) {
          if (node.attrs?.attachmentId && node.attrs?.caption) {
            captionsMap.set(node.attrs.attachmentId, node.attrs.caption);
          }
          if (node.content) walk(node.content);
        }
      };
      walk(existingContent.content);
    }

    const attachmentsContext = todayJournal.attachments?.map(att => {
      let text = `Attachment:\n`;
      if (att.summary) text += `- Details: ${att.summary}\n`;
      const userCaption = captionsMap.get(att.id);
      if (userCaption) text += `- User thoughts: "${userCaption}"\n`;
      return text;
    }).join('\n\n') || "";

    const activityContext = `
Productivity Summary: ${context.semantics.productivitySummary}
Workload Summary: ${context.semantics.workloadSummary}
Consistency Summary: ${context.semantics.consistencySummary}
Focus Summary: ${context.semantics.focusSummary}
Relationship Summary: ${context.semantics.relationshipSummary}
${attachmentsContext}
    `.trim();

    // 2. Generate merged journal using AI service
    const { AiService } = await import("@/lib/ai/service");
    const { JOURNAL_SCHEMA } = await import("@/lib/ai/prompts");
    const journalOnlySchema = JOURNAL_SCHEMA.omit({ aiAnalysis: true });

    let object: any;
    try {
      object = await AiService.generateStructuredData({
        systemPrompt: JOURNAL_FINALIZATION_SYSTEM_PROMPT,
        userPrompt: buildFinalizationUserPrompt({
          originalJournalText: todayJournal.originalText,
          personalMemories: memories,
          activityContext
        }),
        schema: journalOnlySchema,
        context: {
          originalJournalText: todayJournal.originalText,
          personalMemories: memories,
          activityContext
        }
      });
    } catch (aiError: any) {
      const isQuotaError = 
        aiError?.statusCode === 429 || 
        aiError?.message?.toLowerCase().includes("quota") || 
        aiError?.message?.toLowerCase().includes("rate limit") ||
        aiError?.message?.toLowerCase().includes("429");

      if (isQuotaError && process.env.ENABLE_AI_MOCK_DATA === 'true') {
        object = {
          title: todayJournal.subtitle || "Polished Day Reflection",
          subtitle: "Integrating personal memories.",
          emotion: todayJournal.themeColor || "Satisfied",
          stickyNote: todayJournal.quote,
          journal: `${todayJournal.originalText}\n\n[Reflections on: ${memories.join(', ')}]`,
          dailyInsight: "Every memory shapes our reflection.",
          tomorrowIntention: "Continue capturing daily highlights.",
          gratitude: "Grateful for memories.",
          favoriteQuote: todayJournal.quote,
          imagePrompts: [],
          stickers: [todayJournal.sticker],
          journalTags: todayJournal.tags,
          themeColor: todayJournal.themeColor,
          musicMood: todayJournal.musicMood,
          highlights: todayJournal.highlights
        };
      } else {
        throw aiError;
      }
    }

    // 3. Convert Markdown to TipTap basic JSON structure
    const normalizedText = (object.journal as string).replace(/\\n/g, '\n');
    const paragraphs = normalizedText.split(/\n\n+/).filter((p: string) => p.trim() !== '');
    const tiptapContent = {
      type: 'doc',
      content: paragraphs.map((p: string) => {
        const attachMatch = p.trim().match(/^\[ATTACHMENT:\s*([^\]]+)\]$/i);
        if (attachMatch) {
          const attId = attachMatch[1].trim();
          const att = todayJournal.attachments?.find(a => a.id === attId);
          if (att) {
            const caption = captionsMap.get(att.id) || "";
            if (att.type === 'IMAGE') {
              return {
                type: 'customImage',
                attrs: { src: att.storagePath, attachmentId: att.id, summary: att.summary, caption }
              };
            } else if (att.type === 'VOICE') {
              return {
                type: 'customAudio',
                attrs: { src: att.storagePath, attachmentId: att.id, duration: att.duration || 0, transcript: att.summary, summary: att.summary }
              };
            } else if (att.type === 'PDF') {
              return {
                type: 'customPDF',
                attrs: { src: att.storagePath, attachmentId: att.id, filename: att.filename, pages: att.pages || 0, size: att.size || 0, summary: att.summary }
              };
            }
          }
        }
        return {
          type: 'paragraph',
          content: [{ type: 'text', text: p.trim() }]
        };
      })
    };

    const existingInsights = todayJournal.insights as any;
    const existingAiAnalysis = existingInsights?.aiAnalysis || null;

    const finalizedData = {
      content: tiptapContent,
      originalText: object.journal,
      quote: object.stickyNote,
      sticker: object.stickers.length > 0 ? object.stickers[0] : todayJournal.sticker,
      tags: object.journalTags,
      subtitle: object.subtitle,
      themeColor: object.themeColor,
      musicMood: object.musicMood,
      highlights: object.highlights,
      isFinalized: true,
      insights: {
        title: object.title,
        emotion: object.emotion,
        dailyInsight: object.dailyInsight,
        tomorrowIntention: object.tomorrowIntention,
        gratitude: object.gratitude,
        gratitudeList: object.gratitudeList,
        quote: object.favoriteQuote,
        highlights: object.highlights,
        stickers: object.stickers,
        journalTags: object.journalTags,
        themeColor: object.themeColor,
        musicMood: object.musicMood,
        imagePrompts: object.imagePrompts,
        aiAnalysis: existingAiAnalysis,
      }
    };

    const dbJournal = await prisma.journal.update({
      where: { id: journalId },
      data: finalizedData,
      include: { personalMemories: true }
    });

    // Create a Version snapshot
    const versionCount = await prisma.journalVersion.count({ where: { journalId } });
    await prisma.journalVersion.create({
      data: {
        journalId,
        versionNumber: versionCount + 1,
        snapshot: tiptapContent,
        createdBy: "AI_FINALIZATION"
      }
    });

    const { revalidatePath } = await import("next/cache");
    revalidatePath("/journal");

    return { success: true, journal: { ...dbJournal, date: dbJournal.date.toISOString() } };
  } catch (error: any) {
    console.error("Finalization Error:", error);
    return { success: false, error: error.message || "Failed to finalize journal." };
  }
}
