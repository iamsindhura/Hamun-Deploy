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

    // 2. Generate Object with Strict Zod Schema
    let object: any;
    try {
      object = await AiService.generateStructuredData({
        systemPrompt: systemPrompt,
        userPrompt: userPrompt,
        schema: JOURNAL_SCHEMA,
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
            highlights: ["Completed AI Integration", "Cleared inbox"],
            aiAnalysis: {
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
            }
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

    // Force the pre-calculated scores into the AI analysis object to guarantee no provider alterations
    if (object.aiAnalysis && context.calculatedScores) {
      object.aiAnalysis.score = context.calculatedScores.overallScore;
    }

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
        aiAnalysis: object.aiAnalysis,
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
    where: { id: journalId, userId }
  });

  if (!dbJournal) {
    return { success: false, error: "Journal not found" };
  }

  // 1. Gather comprehensive context
  const context = await DailyContextBuilder.buildContext(userId, new Date(dbJournal.date));
  const systemPrompt = `You are HAMUN, an elite executive coach and AI Life Operating System.
Your task is to analyze the user's daily performance based on CRM activity, Tasks, and Deep Work.
Provide a highly concise, insightful Executive Briefing.
No paragraphs. Maximum 5-8 bullet points.
Never dump raw numbers; explain what the numbers mean for their momentum and growth.`;

  const scores = context.calculatedScores || {
    overallScore: 50,
    taskScore: 50,
    deepWorkScore: 50,
    timeManagementScore: 50,
    crmScore: 50,
    habitScore: 50,
    reflectionScore: 50
  };

  const userPrompt = `
Deterministic Daily Scores (You MUST return the pre-calculated Overall Score exactly in the 'score' field of the JSON):
- Pre-calculated Overall Score: ${scores.overallScore}
- Task Score: ${scores.taskScore}
- Deep Work Score: ${scores.deepWorkScore}
- Time Management Score: ${scores.timeManagementScore}
- CRM Score: ${scores.crmScore}
- Habit Score: ${scores.habitScore}
- Reflection Score: ${scores.reflectionScore}

Semantic Summary of the Day:
- Productivity: ${context.semantics.productivitySummary}
- Relationships: ${context.semantics.relationshipSummary}
- Focus: ${context.semantics.focusSummary}
- Workload: ${context.semantics.workloadSummary}

Raw Metrics (Analyze this without repeating the numbers directly):
- CRM: ${context.raw.pipelineMoves} pipeline moves
- Tasks: ${context.raw.tasksCompleted} completed
- Focus Sessions: ${context.raw.focusSessionsCount} (${context.raw.totalFocusMinutes} minutes)
`;

  let aiAnalysis: any;
  try {
    const object = await AiService.generateStructuredData({
      systemPrompt,
      userPrompt,
      schema: z.object({
        aiAnalysis: z.object({
          score: z.number().describe("Must be the EXACT pre-calculated Overall Score provided in the prompt"),
          label: z.string().describe("A 2-3 word label for the score (e.g. 'Excellent Momentum')"),
          executiveSummary: z.string().describe("A concise executive summary of the day's professional progress"),
          bulletPoints: z.array(
            z.object({
              icon: z.string().describe("A single emoji like 📈, 🎯, ⚡, 🤝, or 🌱"),
              text: z.string().describe("An insightful inference about the user's progress. No raw numbers.")
            })
          ).min(5).max(8).describe("5 to 8 bullet points analyzing CRM, Tasks, and Deep Work"),
          recommendation: z.string().describe("One actionable recommendation for tomorrow")
        }).describe("The professional executive coaching analysis based on today's metrics")
      })
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
          score: 85,
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
