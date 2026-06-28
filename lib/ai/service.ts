import { generateObject, generateText } from "ai";
import { createGoogleGenerativeAI } from "@ai-sdk/google";

// 1. Unified Authentication
const apiKey = process.env.GEMINI_API_KEY || "";
if (!apiKey) {
  console.warn("⚠️ GEMINI_API_KEY is missing from environment variables.");
}

const customFetch = async (input: RequestInfo | URL, init?: RequestInit) => {
  const response = await fetch(input, init);
  return response;
};

const google = createGoogleGenerativeAI({
  apiKey,
  fetch: customFetch
});

// 2. Centralized Model Configuration
// Inherited from the previously working AI Journal implementation
const DEFAULT_MODEL = google("gemini-2.5-flash");

// Startup Verification Logs
console.log("✓ API Key Found", !!apiKey);
console.log("✓ Model", "gemini-2.5-flash");
console.log("✓ Billing Enabled", "Assumed True");
console.log("✓ Current Provider", "Google Generative AI");
console.log("✓ Mock Mode Enabled", process.env.ENABLE_AI_MOCK_DATA === "true");

// 3. Centralized AI Service
export const AiService = {
  
  /**
   * Reusable function for structured AI generations.
   * Ideal for: Journal Generation, Daily Analysis, Finance Analysis, Weekly Reports, etc.
   */
  async generateStructuredData({
    systemPrompt,
    userPrompt,
    schema
  }: {
    systemPrompt: string;
    userPrompt: string;
    schema: any;
  }) {
    let attempt = 0;
    const maxRetries = 2;
    
    while (attempt <= maxRetries) {
      try {
        const { object } = await generateObject({
          model: DEFAULT_MODEL,
          system: systemPrompt,
          prompt: userPrompt,
          schema,
          maxRetries: 0, // Disable SDK retries to handle 429s manually
        });
        
        return object;
      } catch (error: any) {
        const isQuotaError = 
          error?.statusCode === 429 || 
          error?.message?.toLowerCase().includes("quota") || 
          error?.message?.toLowerCase().includes("rate limit") ||
          error?.message?.toLowerCase().includes("429");
          
        if (isQuotaError) {
          console.error("✓ Gemini Quota Exceeded detected. Bypassing retries.");
          throw error;
        }
        
        if (attempt === maxRetries) {
          throw error;
        }
        
        console.warn(`Temporary AI error, retrying attempt ${attempt + 1}...`);
        await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, attempt)));
        attempt++;
      }
    }
  },

  /**
   * Reusable function for unstructured text generation.
   * Ideal for: Future AI Life Assistant, freeform chatting, quick summaries.
   */
  async generateTextContent({
    systemPrompt,
    userPrompt
  }: {
    systemPrompt: string;
    userPrompt: string;
  }) {
    let attempt = 0;
    const maxRetries = 2;
    
    while (attempt <= maxRetries) {
      try {
        const { text } = await generateText({
          model: DEFAULT_MODEL,
          system: systemPrompt,
          prompt: userPrompt,
          maxRetries: 0,
        });
        
        return text;
      } catch (error: any) {
        const isQuotaError = 
          error?.statusCode === 429 || 
          error?.message?.toLowerCase().includes("quota") || 
          error?.message?.toLowerCase().includes("rate limit") ||
          error?.message?.toLowerCase().includes("429");
          
        if (isQuotaError) {
          console.error("✓ Gemini Quota Exceeded detected (Text). Bypassing retries.");
          throw error;
        }
        
        if (attempt === maxRetries) {
          throw error;
        }
        
        console.warn(`Temporary AI error, retrying attempt ${attempt + 1}...`);
        await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, attempt)));
        attempt++;
      }
    }
  }
};
