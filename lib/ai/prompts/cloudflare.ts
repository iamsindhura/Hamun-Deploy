import { SHARED_AI_INSIGHTS_SPECIFICATION } from "./insights";
import { JournalPromptContext } from "../types";

export const CLOUDFLARE_SYSTEM_PROMPT = `You are HAMUN, an AI diary writer and Executive Coach.
Write a personal diary entry and coaching advice based on the daily metrics.

Fields to generate:
- title: A beautiful, elegant title representing the day.
- emotion: Primary emotion felt today (e.g. Reflective, Motivated).
- quote: One inspiring sentence quote.
- journal: An array of exactly 5 strings representing the 5 paragraphs of a concise, high-quality personal diary entry matching these strict formatting rules:
  1. Write in the first person ("I...").
  2. Structure: The array must contain EXACTLY 5 strings. Each item represents a single paragraph. Do not combine, merge, or split into more paragraphs.
  3. Word Count: The total combined word count of all paragraphs must be between 350 and 500 words.
  4. Each paragraph string must be verbose and highly detailed, containing exactly 5 to 6 long sentences. To reach the word limit, address all suggested points in the flow guidelines.
  5. Do not include markdown formatting (no bold, italics, etc.).
  6. Do not include headings or titles (no "#", "##", or text headings).
  7. The 5 array items must strictly follow:
     - Item 1: Paragraph 1 - Opening reflection (setting the scene, morning routine, first thoughts, and today's general vibe).
     - Item 2: Paragraph 2 - Emotions and events (feelings felt throughout the day, interactions with teammates/emails, and key experiences).
     - Item 3: Paragraph 3 - Productivity reflection (details of tasks completed, focus sessions, work habits, and dashboard metrics).
     - Item 4: Paragraph 4 - Personal growth (core lessons learned today, self-observations, mistakes, and future improvements).
     - Item 5: Paragraph 5 - Mindset and looking forward (mindset check, gratitude, tomorrow's goals, and future intentions).

${SHARED_AI_INSIGHTS_SPECIFICATION}`;

export function buildCloudflareUserPrompt(context: JournalPromptContext): string {
  const scores = context.calculatedScores || {
    overallScore: 50,
    taskScore: 50,
    deepWorkScore: 50,
    timeManagementScore: 50,
    crmScore: 50,
    habitScore: 50,
    reflectionScore: 50
  };

  return `System predicted emotion: ${context.predictedEmotion}

Deterministic Daily Scores (You MUST return the pre-calculated Overall Score exactly in the 'score' field of the JSON):
- Pre-calculated Overall Score: ${scores.overallScore}
- Task Score: ${scores.taskScore}
- Deep Work Score: ${scores.deepWorkScore}
- Time Management Score: ${scores.timeManagementScore}
- CRM Score: ${scores.crmScore}
- Habit Score: ${scores.habitScore}
- Reflection Score: ${scores.reflectionScore}

Semantic Summary:
- Productivity: ${context.semantics.productivitySummary}
- Relationships: ${context.semantics.relationshipSummary}
- Focus: ${context.semantics.focusSummary}
- Workload: ${context.semantics.workloadSummary}
- Narrative: ${context.semantics.highLevelNarrative}

Metrics:
- CRM: ${context.raw.pipelineMoves} moves
- Tasks: ${context.raw.tasksCompleted} completed
- Focus: ${context.raw.focusSessionsCount} sessions (${context.raw.totalFocusMinutes} min)

Memories:
${context.attachmentsContext}`;
}
