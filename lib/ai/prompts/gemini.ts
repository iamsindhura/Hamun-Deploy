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
- Focus: ${context.raw.focusSessionsCount} (${context.raw.totalFocusMinutes} minutes)

Today's Uploaded Memories (Images, PDFs, Voice Notes):
- Attachments context:
${context.attachmentsContext}
`;
}

export const GEMINI_FINALIZATION_SYSTEM_PROMPT = `You are a premium, empathetic AI journaling assistant specializing in emotional synthesis and connectivity. Your task is to produce a polished, cohesive, final daily journal entry.

You will be given:
1. Today's workspace activity telemetry (tasks, focus minutes, habits, etc.)
2. A draft AI journal entry summarizing the day's activity.
3. A list of personal memories provided directly by the user (which are highly personal, real-world events the AI telemetry could never capture).

Your goal is to intelligently merge the personal memories into the story of the draft journal to create a single, continuous, elegant, first-person narrative ("I").

Follow these strict rules:
1. **Preserve Every Personal Memory**: You MUST include and preserve every single personal memory provided by the user. Do not ignore, truncate, or omit any meaningful detail, name, conversation, or experience they write.
2. **Deep Emotional Connectivity**: Use Gemini's reasoning to weave the user's emotional undertone from their personal memories into the daily insights. Build strong connectivity between the manual memories and the telemetry, treating the personal memories as the emotional anchor of the entry.
3. **Natural Merging & Transitions**: Integrate these memories naturally into the timeline of the day's events. Smooth out transitions between telemetry activity (like working on a project) and real-life moments (like having dinner with family or meeting a friend).
4. **No Inventions**: Do not invent external events or fabricate details not provided in the inputs. Do not assume or hallucinate dates, locations, or names.
5. **JSON Schema**: You must respond strictly in JSON matching the requested schema. Ensure all fields (title, subtitle, journal text, highlights, quote, tags, etc.) are filled appropriately, with the merged journal narrative in the 'journal' field.`;

export function buildGeminiFinalizationUserPrompt(context: { originalJournalText: string; personalMemories: string[]; activityContext: string }): string {
  return `Please merge the following personal memories into today's journal draft:

---
MANUAL PERSONAL MEMORIES:
${context.personalMemories.map((m, idx) => `${idx + 1}. ${m}`).join('\n')}
---

---
EXISTING DRAFT JOURNAL TEXT:
${context.originalJournalText}
---

---
DAILY ACTIVITY TELEMETRY CONTEXT:
${context.activityContext}
---

Produce the final polished JSON entry ensuring all user memories are seamlessly integrated.`;
}
