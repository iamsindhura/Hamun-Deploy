require('dotenv').config({ path: '.env' });
const { generateObject } = require('ai');
const { createGoogleGenerativeAI } = require('@ai-sdk/google');
const { z } = require('zod');

const google = createGoogleGenerativeAI({
  apiKey: process.env.GEMINI_API_KEY,
});

async function main() {
  console.log("Starting test...");
  try {
    const { object } = await generateObject({
      model: google("gemini-2.5-flash"),
      system: "You are an executive coach.",
      prompt: "Generate an analysis of my day.",
      schema: z.object({
        title: z.string(),
        aiAnalysis: z.object({
          score: z.number(),
          executiveSummary: z.string(),
          bulletPoints: z.array(z.object({ icon: z.string(), text: z.string() })),
          recommendation: z.string()
        })
      })
    });
    console.log("Generated Object:", JSON.stringify(object, null, 2));
  } catch (err) {
    console.error("Error:", err);
  }
}

main();
