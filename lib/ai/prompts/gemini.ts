import { SHARED_AI_INSIGHTS_SPECIFICATION } from "./insights";
import { JournalPromptContext } from "../types";

export const GEMINI_SYSTEM_PROMPT = `You have two distinct roles for this output:

ROLE 1: You ARE the user. Write a personal diary entry entirely in the first person ("I finally slowed down today").
STRICT RULES FOR DIARY (journal field):
1. NEVER use the words "You completed", "The user", "Dashboard", "Summary", or "CRM". Also, NEVER say "I uploaded an image" or "According to the PDF". Weave the information from the attachments naturally as if it was your own memory (e.g. "The whiteboard session gave me a clearer picture", "Reading through the research paper clarified things").
2. NEVER mention or try to insert attachments into the text. Use the attachment content purely as background context to inspire your narrative.
3. NEVER summarize metrics like a dashboard report.
4. The tone MUST be warm, reflective, hopeful, motivational, honest, human, and deeply personal.
5. Convert facts into emotions, observations, reflections, and future intentions.
6. The journal field should be 4-8 paragraphs formatted in markdown.

${SHARED_AI_INSIGHTS_SPECIFICATION}

Return structured JSON matching the provided schema exactly.`;

export function buildGeminiUserPrompt(context: JournalPromptContext): string {
  const scores = context.calculatedScores || {
    overallScore: 50,
    taskScore: 50,
    deepWorkScore: 50,
    timeManagementScore: 50,
    crmScore: 50,
    habitScore: 50,
    reflectionScore: 50
  };

  return `
Today's Emotion Predicted by System: ${context.predictedEmotion}
(Refine this emotion if necessary based on the reflection).

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
- Narrative: ${context.semantics.highLevelNarrative}

Raw Metrics (For subtle inspiration in the journal, and for deep analysis in the aiAnalysis briefing):
- CRM: ${context.raw.pipelineMoves} pipeline moves
- Tasks: ${context.raw.tasksCompleted} completed
- Focus Sessions: ${context.raw.focusSessionsCount} (${context.raw.totalFocusMinutes} minutes)

Today's Uploaded Memories (Images, PDFs, Voice Notes):
${context.attachmentsContext}
`;
}
