import { geminiProvider } from "./providers/gemini";
import { grokProvider } from "./providers/grok";
import { nvidiaProvider } from "./providers/nvidia";
import { cloudflareProvider } from "./providers/cloudflare";
import { AIProvider } from "./types";

const providers: AIProvider[] = [
  geminiProvider,
  // Grok temporarily disabled due to account credit/billing limitations.
  // Re-enable by adding the provider back into the providers array.
  // grokProvider,
  nvidiaProvider,
  cloudflareProvider,
];

export const AIRouter = {
  async generateJournal(prompt: { systemPrompt: string; userPrompt: string; schema: any; _attempts?: any[]; failProviders?: string[]; context?: any }): Promise<any> {
    console.log(`[AI Router] Journal generation started`);
    const errors: { provider: string; error: string; statusCode?: number }[] = [];
    const envFailProviders = process.env.NODE_ENV === "development" && process.env.SIMULATE_FAIL_PROVIDERS
      ? process.env.SIMULATE_FAIL_PROVIDERS.split(",").map(p => p.trim().toLowerCase())
      : [];

    for (const provider of providers) {
      const startTime = new Date();
      console.log(`[AI Router] Attempting provider: ${provider.name} | Start: ${startTime.toISOString()}`);
      
      try {
        const isSimulatedFail = (prompt.failProviders?.includes(provider.name.toLowerCase())) || 
                                (envFailProviders.includes(provider.name.toLowerCase()));
                                
        if (process.env.NODE_ENV === "development" && isSimulatedFail) {
          throw new Error("Simulated Failure");
        }
        const result = await provider.generateJournal(prompt);
        const endTime = new Date();
        const responseTime = endTime.getTime() - startTime.getTime();
        console.log(`[AI Router] Success: ${provider.name} | End: ${endTime.toISOString()} | Duration: ${responseTime}ms`);
        console.log(`[AI Router] >>> SUCCESSFUL GENERATION PROVIDER: ${provider.name.toUpperCase()} <<<`);
        if (prompt._attempts) {
          prompt._attempts.push({
            provider: provider.name,
            status: "Success",
            responseTime,
          });
        }
        return result; // Stop immediately after first success
      } catch (error: any) {
        const endTime = new Date();
        const responseTime = endTime.getTime() - startTime.getTime();
        const errorReason = error?.message || String(error);
        const statusCode = error?.statusCode || error?.status || undefined;
        
        console.warn(`[AI Router] Failure: ${provider.name} | End: ${endTime.toISOString()} | Duration: ${responseTime}ms | Status Code: ${statusCode || "N/A"} | Error: ${errorReason}`);
        
        errors.push({ provider: provider.name, error: errorReason, statusCode });
        if (prompt._attempts) {
          prompt._attempts.push({
            provider: provider.name,
            status: "Failed",
            error: errorReason,
            statusCode
          });
        }
      }
    }

    // Print a complete summary when every provider fails
    console.log("\n================ [AI Router] FALLBACK SUMMARY ================");
    errors.forEach(e => {
      console.log(`${e.provider.toUpperCase()}\nStatus: Failed\nReason: ${e.error}${e.statusCode ? ` (HTTP ${e.statusCode})` : ""}\n`);
    });
    console.log("==============================================================\n");

    throw new Error("Failed to generate journal. All configured AI providers failed.");
  }
};
