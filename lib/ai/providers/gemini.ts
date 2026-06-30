import { generateObject } from "ai";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { AIProvider } from "../types";
import { getGeminiConfig } from "../env";
import { withTimeout } from "../utils";
import { GEMINI_SYSTEM_PROMPT, buildGeminiUserPrompt } from "../prompts/gemini";

export const geminiProvider: AIProvider = {
  name: "gemini",
  
  async generateJournal(prompt: { systemPrompt: string; userPrompt: string; schema: any; context?: any }): Promise<any> {
    const config = getGeminiConfig();
    
    const google = createGoogleGenerativeAI({
      apiKey: config.GEMINI_API_KEY,
    });
    const model = google("gemini-2.5-flash");

    const system = prompt.context ? GEMINI_SYSTEM_PROMPT : prompt.systemPrompt;
    const userPrompt = prompt.context ? buildGeminiUserPrompt(prompt.context) : prompt.userPrompt;

    return withTimeout(async (signal) => {
      const { object } = await generateObject({
        model,
        system,
        prompt: userPrompt,
        schema: prompt.schema,
        maxRetries: 0,
        abortSignal: signal,
      });
      return object;
    }, "gemini");
  }
};
