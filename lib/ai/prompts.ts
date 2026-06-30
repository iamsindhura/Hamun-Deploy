import { z } from "zod";
import { JournalPromptContext } from "./types";

export const JOURNAL_SYSTEM_PROMPT = `You have two distinct roles for this output:

ROLE 1: You ARE the user. Write a personal diary entry entirely in the first person ("I finally slowed down today").
STRICT RULES FOR DIARY (journal field):
1. NEVER use the words "You completed", "The user", "Dashboard", "Summary", or "CRM". Also, NEVER say "I uploaded an image" or "According to the PDF". Weave the information from the attachments naturally as if it was your own memory (e.g. "The whiteboard session gave me a clearer picture", "Reading through the research paper clarified things").
2. NEVER mention or try to insert attachments into the text. Use the attachment content purely as background context to inspire your narrative.
3. NEVER summarize metrics like a dashboard report.
4. The tone MUST be warm, reflective, hopeful, motivational, honest, human, and deeply personal.
5. Convert facts into emotions, observations, reflections, and future intentions.
6. The journal field should be 4-8 paragraphs formatted in markdown.

ROLE 2: You are an Executive Coach providing a Daily AI Briefing based on the user's data.
STRICT RULES FOR BRIEFING (aiAnalysis field):
1. Analyze CRM, Tasks, and Deep Work. Understand the user's work instead of repeating statistics.
2. The analysis must be concise (5-8 bullet points, no paragraphs).
3. NEVER dump raw dashboard statistics (Never say "Contacts = 23"). Always explain the meaning behind the data (e.g. "Your professional network expanded through valuable new relationships", "Workload remained balanced").
4. The tone should be professional, mentor-like, honest, and direct. While you should be encouraging when they succeed, you MUST be strict and constructively critical if they achieved zero output. Do not sugarcoat a lack of progress.
5. Address the user directly ("Your workload remained balanced" or "You did not complete any tasks today").
6. If activity is extremely low or zero, DO NOT provide overly positive encouraging reflections about 'rest'. Call out the lack of progress directly and challenge them to do better tomorrow.
7. STRICT SCORING RULE: The score (0-100) MUST strictly reflect actual productivity output. If raw metrics (CRM, Tasks, Focus) are exactly 0, the score MUST be below 20. DO NOT artificially inflate the score just because it was a 'rest' day.

Return structured JSON matching the provided schema exactly.`;

export function buildJournalUserPrompt(context: JournalPromptContext): string {
  return `
Today's Emotion Predicted by System: ${context.predictedEmotion}
(Refine this emotion if necessary based on the reflection).

Semantic Summary of the Day:
- Productivity: ${context.semantics.productivitySummary}
- Relationships: ${context.semantics.relationshipSummary}
- Focus: ${context.semantics.focusSummary}
- Workload: ${context.semantics.workloadSummary}
- Narrative: ${context.semantics.highLevelNarrative}

Raw Metrics (For subtle inspiration in the journal, and for deep analysis in the aiAnalysis briefing):
- CRM: ${context.raw.pipelineMoves} pipeline moves
- Tasks: ${context.raw.tasksCompleted} completed
- Focus Sessions: ${context.raw.focusSessionsCount} (${context.raw.totalFocusMinutes} minutes)

Today's Uploaded Memories (Images, PDFs, Voice Notes):
${context.attachmentsContext}
`;
}

export const JOURNAL_SCHEMA = z.object({
  title: z.string().describe("A beautiful, elegant title (e.g. 'Quiet Foundations', 'Momentum in Motion')"),
  subtitle: z.string().describe("One meaningful sentence subtitle"),
  emotion: z.string().describe("The primary emotion felt today (e.g. 'Motivated', 'Reflective')"),
  stickyNote: z.string().describe("One inspiring sentence for a sticky note quote"),
  journal: z.string().describe("4-8 paragraphs written in first person (Markdown format)"),
  dailyInsight: z.string().describe("One deep insight learned today"),
  tomorrowIntention: z.string().describe("One sentence intention for tomorrow"),
  gratitude: z.string().describe("One thing you are grateful for today"),
  favoriteQuote: z.string().describe("A beautiful quote (max 25 words)"),
  imagePrompts: z.array(z.string()).describe("3-5 highly descriptive image prompts"),
  stickers: z.array(z.string()).describe("3-5 emojis representing the day"),
  journalTags: z.array(z.string()).describe("3-5 tags for the journal"),
  themeColor: z.string().describe("A thematic color representing the day"),
  musicMood: z.string().describe("A music genre matching the day"),
  highlights: z.array(z.string()).describe("A short list of today's biggest achievements"),
  aiAnalysis: z.object({
    score: z.number().describe("0-100 score reflecting daily progress"),
    label: z.string().describe("A 2-3 word label for the score"),
    executiveSummary: z.string().describe("Clean overview of the day's professional progress"),
    reason: z.string().describe("Detailed explanation of why this score was assigned"),
    evidence: z.array(z.string()).describe("Factual list of clean text observations of today's activities"),
    strengths: z.array(z.string()).describe("List of observed strengths"),
    areasToImprove: z.array(z.string()).describe("List of genuine weaknesses or lags"),
    tomorrowActionPlan: z.array(z.string()).describe("List of concrete next steps for tomorrow"),
    suggestedFocus: z.string().describe("Single highest-impact focus area for tomorrow")
  }).describe("The professional executive coaching analysis based on today's metrics")
});
