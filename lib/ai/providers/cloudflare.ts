import { generateObject } from "ai";
import { createOpenAI } from "@ai-sdk/openai";
import { AIProvider } from "../types";
import { getCloudflareConfig } from "../env";
import { withTimeout } from "../utils";
import { 
  CLOUDFLARE_SYSTEM_PROMPT, 
  buildCloudflareUserPrompt, 
  CLOUDFLARE_FINALIZATION_SYSTEM_PROMPT, 
  buildCloudflareFinalizationUserPrompt 
} from "../prompts/cloudflare";
import { z } from "zod";

const CLOUDFLARE_INTERMEDIATE_SCHEMA = z.object({
  title: z.string().describe("A beautiful, elegant title representing the day"),
  journal: z.array(z.string()).min(5).max(5).describe("5 concise paragraphs of the personal diary. Each array item represents one paragraph. Paragraph 1: Opening reflection. Paragraph 2: Emotions/experiences. Paragraph 3: Productivity/tasks. Paragraph 4: Lessons learned. Paragraph 5: Mindset/tomorrow."),
  emotion: z.string().describe("The primary emotion felt (e.g. Reflective, Motivated)"),
  quote: z.string().describe("An inspiring sentence for a sticky note or quote"),
  score: z.number().describe("0-100 score reflecting daily progress"),
  label: z.string().describe("2-3 word label for the score"),
  executiveSummary: z.string().describe("Clean overview of the day's professional progress"),
  reason: z.string().describe("Detailed explanation of why this score was assigned"),
  evidence: z.array(z.string()).describe("Factual list of clean text observations of today's activities"),
  strengths: z.array(z.string()).describe("List of observed strengths"),
  areasToImprove: z.array(z.string()).describe("List of genuine weaknesses or lags"),
  tomorrowActionPlan: z.array(z.string()).describe("List of concrete next steps for tomorrow"),
  suggestedFocus: z.string().describe("Single highest-impact focus area for tomorrow")
});

// Custom fetch wrapper to handle Cloudflare's non-standard JSON output compliance bug
// where choices[0].message.content is returned as a JSON object instead of a string.
const customFetch = async (input: RequestInfo | URL, init?: RequestInit) => {
  if (init && init.body) {
    try {
      const parsed = JSON.parse(init.body as string);
      if (!parsed.max_tokens) {
        parsed.max_tokens = 2500;
        init.body = JSON.stringify(parsed);
      }
    } catch (e) {}
  }
  const response = await fetch(input, init);
  if (response.ok) {
    const json = await response.json();
    if (json.choices && json.choices[0] && json.choices[0].message) {
      const content = json.choices[0].message.content;
      if (typeof content === "object" && content !== null) {
        json.choices[0].message.content = JSON.stringify(content);
      }
    }
    return new Response(JSON.stringify(json), {
      status: response.status,
      statusText: response.statusText,
      headers: response.headers,
    });
  }
  return response;
};

export const cloudflareProvider: AIProvider = {
  name: "cloudflare",
  
  async generateJournal(prompt: { systemPrompt: string; userPrompt: string; schema: any; context?: any }): Promise<any> {
    const config = getCloudflareConfig();
    
    const openai = createOpenAI({
      apiKey: config.CLOUDFLARE_API_KEY,
      baseURL: `https://api.cloudflare.com/client/v4/accounts/${config.CLOUDFLARE_ACCOUNT_ID}/ai/v1`,
      fetch: customFetch,
    });
    
    // Cloudflare Workers AI Llama-3.1-8B fast model
    const model = openai.chat("@cf/meta/llama-3.1-8b-instruct-fast");

    const isFinalization = !!(prompt.context && 'personalMemories' in prompt.context);
    
    const system = isFinalization
      ? CLOUDFLARE_FINALIZATION_SYSTEM_PROMPT
      : (prompt.context ? CLOUDFLARE_SYSTEM_PROMPT : prompt.systemPrompt);
      
    const userPrompt = isFinalization
      ? buildCloudflareFinalizationUserPrompt(prompt.context)
      : (prompt.context ? buildCloudflareUserPrompt(prompt.context) : prompt.userPrompt);

    return withTimeout(async (signal) => {
      // If called with the complex journal schema, internally generate a simpler one
      const isComplexSchema = prompt.schema && prompt.schema._def && prompt.schema.shape && prompt.schema.shape.aiAnalysis;
      const targetSchema = isComplexSchema ? CLOUDFLARE_INTERMEDIATE_SCHEMA : prompt.schema;

      const { object } = await generateObject({
        model,
        system,
        prompt: userPrompt,
        schema: targetSchema as any,
        maxRetries: 0,
        maxOutputTokens: 2500,
        abortSignal: signal,
      }) as any;

      if (isComplexSchema) {
        // Map simple response to the application's JOURNAL_SCHEMA structure
        return {
          title: object.title,
          subtitle: object.title,
          emotion: object.emotion,
          stickyNote: object.quote,
          journal: Array.isArray(object.journal) ? object.journal.join("\n\n") : object.journal,
          dailyInsight: object.quote,
          tomorrowIntention: object.suggestedFocus,
          gratitude: "Grateful for another day of growth.",
          favoriteQuote: object.quote,
          imagePrompts: ["A quiet, reflective space with warm natural lighting"],
          stickers: ["🌱"],
          journalTags: ["reflection", "daily", object.emotion.toLowerCase()],
          themeColor: "#7A5AF8",
          musicMood: "Lo-fi ambient beats",
          highlights: [object.title],
          aiAnalysis: {
            score: object.score,
            label: object.label,
            executiveSummary: object.executiveSummary,
            reason: object.reason,
            evidence: object.evidence,
            strengths: object.strengths,
            areasToImprove: object.areasToImprove,
            tomorrowActionPlan: object.tomorrowActionPlan,
            suggestedFocus: object.suggestedFocus
          }
        };
      }

      return object;
    }, "cloudflare");
  }
};
