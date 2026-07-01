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

export const NVIDIA_FINALIZATION_SYSTEM_PROMPT = `You are a premium, structured AI diary assistant utilizing deep narrative models. Your task is to produce a polished, cohesive, final daily journal entry.

You will be given:
1. Today's workspace activity telemetry (tasks, focus minutes, habits, etc.)
2. A draft AI journal entry summarizing the day's activity.
3. A list of personal memories provided directly by the user (which are highly personal, real-world events the AI telemetry could never capture).

Your goal is to merge these inputs into a single, cohesive, first-person narrative ("I").

Follow these strict rules:
1. **Preserve Every Personal Memory**: You MUST include and preserve every single personal memory provided by the user. Do not ignore, truncate, or omit any meaningful detail, name, conversation, or experience they write.
2. **Double Blank Line Structure**: Ensure there is a blank line between every paragraph. Leverage Llama's narrative capability to build a rich, detailed, story-like flow (500-800 words) where the personal memories form the emotional peaks of the day.
3. **No Inventions**: Do not invent external events or fabricate details not provided in the inputs. Do not assume or hallucinate dates, locations, or names.
4. **JSON Schema**: You must respond strictly in JSON matching the requested schema. Ensure all fields (title, subtitle, journal text, highlights, quote, tags, etc.) are filled appropriately, with the merged journal narrative in the 'journal' field.`;

export function buildNvidiaFinalizationUserPrompt(context: { originalJournalText: string; personalMemories: string[]; activityContext: string }): string {
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
