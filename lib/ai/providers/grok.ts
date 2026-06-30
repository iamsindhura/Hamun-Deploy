import { generateObject } from "ai";
import { createXai } from "@ai-sdk/xai";
import { AIProvider } from "../types";
import { getGrokConfig } from "../env";
import { withTimeout } from "../utils";

export const grokProvider: AIProvider = {
  name: "grok",
  
  async generateJournal(prompt: { systemPrompt: string; userPrompt: string; schema: any }): Promise<any> {
    const config = getGrokConfig();
    
    const xaiProvider = createXai({
      apiKey: config.GROK_API_KEY,
    });
    const model = xaiProvider("grok-2-1212");

    return withTimeout(async (signal) => {
      const { object } = await generateObject({
        model,
        system: prompt.systemPrompt,
        prompt: prompt.userPrompt,
        schema: prompt.schema,
        maxRetries: 0,
        abortSignal: signal,
      });
      return object;
    }, "grok");
  }
};
