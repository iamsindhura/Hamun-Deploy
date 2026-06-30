import { SHARED_AI_INSIGHTS_SPECIFICATION } from "./insights";
import { JournalPromptContext } from "../types";

export const NVIDIA_SYSTEM_PROMPT = `Write a personal diary entry and a daily coaching analysis.

Role 1 (journal field): Deeply personal first-person diary entry ("I...").
- Length: 500-800 words of rich, reflective storytelling across 5-7 well-separated paragraphs.
- Formatting: Must leave a blank line between every paragraph. Do not write a single block of text.
- Paragraph Flow:
  1. Opening reflection on the day
  2. Deep dive into emotions and personal experiences
  3. Analysis of productivity, momentum, and challenges
  4. Core lessons learned during the day
  5. Closing thoughts on mindset and plans for tomorrow
- Do not summarize metrics or mention attachments; weave context as natural memories.

${SHARED_AI_INSIGHTS_SPECIFICATION}

Output must strictly match the schema.`;

export function buildNvidiaUserPrompt(context: JournalPromptContext): string {
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
