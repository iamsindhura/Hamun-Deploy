import { SHARED_AI_INSIGHTS_SPECIFICATION } from "./insights";
import { z } from "zod";
import { JournalPromptContext } from "../types";

export const INSIGHTS_ONLY_SYSTEM_PROMPT = `You are HAMUN, an elite executive coach and AI Life Operating System.
Your task is to analyze the user's daily performance based on today's journal entry, CRM activity, Tasks, and Deep Work.
Provide a highly detailed, professional Executive Briefing.

${SHARED_AI_INSIGHTS_SPECIFICATION}`;

export const INSIGHTS_ONLY_SCHEMA = z.object({
  aiAnalysis: z.object({
    score: z.number().describe("Must be the EXACT pre-calculated Overall Score provided in the prompt"),
    label: z.string().describe("A 2-3 word label for the score (e.g. 'Excellent Momentum')"),
    executiveSummary: z.string().describe("A concise executive summary of the day's professional progress"),
    reason: z.string().describe("Detailed explanation of why this score was assigned"),
    evidence: z.array(z.string()).describe("Factual list of clean text observations of today's activities. Do not include emojis."),
    strengths: z.array(z.string()).describe("List of observed strengths. Do not include emojis."),
    areasToImprove: z.array(z.string()).describe("List of genuine weaknesses or lags. Do not include emojis."),
    tomorrowActionPlan: z.array(z.string()).describe("List of concrete next steps for tomorrow. Do not include emojis."),
    suggestedFocus: z.string().describe("Single highest-impact focus area for tomorrow. Do not include emojis.")
  }).describe("The professional executive coaching analysis based on today's metrics")
});

export function buildInsightsOnlyUserPrompt(context: JournalPromptContext, latestJournalText: string): string {
  const scores = context.calculatedScores || {
    overallScore: 50,
    taskScore: 50,
    deepWorkScore: 50,
    timeManagementScore: 50,
    crmScore: 50,
    habitScore: 50,
    reflectionScore: 50
  };

  return `Today's Journal Entry:
"${latestJournalText || "No entry written yet."}"

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

Raw Metrics (For deep analysis in the aiAnalysis briefing):
- CRM: ${context.raw.pipelineMoves} pipeline moves
- Tasks: ${context.raw.tasksCompleted} completed
- Focus Sessions: ${context.raw.focusSessionsCount} (${context.raw.totalFocusMinutes} minutes)

Today's Uploaded Memories (Images, PDFs, Voice Notes):
${context.attachmentsContext}
`;
}
