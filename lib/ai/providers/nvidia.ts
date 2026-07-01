import { generateObject } from "ai";
import { createOpenAI } from "@ai-sdk/openai";
import { AIProvider } from "../types";
import { getNvidiaConfig } from "../env";
import { withTimeout } from "../utils";
import { 
  NVIDIA_SYSTEM_PROMPT, 
  buildNvidiaUserPrompt, 
  NVIDIA_FINALIZATION_SYSTEM_PROMPT, 
  buildNvidiaFinalizationUserPrompt 
} from "../prompts/nvidia";

export const nvidiaProvider: AIProvider = {
  name: "nvidia",
  
  async generateJournal(prompt: { systemPrompt: string; userPrompt: string; schema: any; context?: any }): Promise<any> {
    const config = getNvidiaConfig();
    
    const openai = createOpenAI({
      apiKey: config.NVIDIA_API_KEY,
      baseURL: "https://integrate.api.nvidia.com/v1",
    });
    
    // Using a standard, high-performance Llama model hosted on NVIDIA NIM
    const model = openai.chat("meta/llama-3.1-70b-instruct");

    const isFinalization = !!(prompt.context && 'personalMemories' in prompt.context);
    
    const system = isFinalization
      ? NVIDIA_FINALIZATION_SYSTEM_PROMPT
      : (prompt.context ? NVIDIA_SYSTEM_PROMPT : prompt.systemPrompt);
      
    const userPrompt = isFinalization
      ? buildNvidiaFinalizationUserPrompt(prompt.context)
      : (prompt.context ? buildNvidiaUserPrompt(prompt.context) : prompt.userPrompt);

    return withTimeout(async (signal) => {
      const { object } = await generateObject({
        model,
        system,
        prompt: userPrompt,
        schema: prompt.schema as any,
        maxRetries: 0,
        maxOutputTokens: 4000,
        temperature: 0.7,
        abortSignal: signal,
      });
      return object;
    }, "nvidia");
  }
};
