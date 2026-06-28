import { generateObject } from "ai";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { z } from "zod";

const apiKey = process.env.GEMINI_API_KEY || "";
const google = createGoogleGenerativeAI({ apiKey });
const model = google("gemini-2.5-flash");

export async function analyzeImage(buffer: Buffer, mimeType: string): Promise<{ summary: string; caption: string }> {
  if (process.env.ENABLE_AI_MOCK_DATA === "true") {
    return {
      summary: "This is a mock summary of the uploaded image showing a team collaborating around a whiteboard.",
      caption: "Team collaboration"
    };
  }

  try {
    const { object } = await generateObject({
      model,
      schema: z.object({
        summary: z.string().describe("A concise, insightful summary of what is visible in the image, without saying 'The user uploaded...'"),
        caption: z.string().describe("A very short, 2-5 word description suitable for a photo caption underneath the image."),
      }),
      system: `You are an AI assistant analyzing an image uploaded by the user to their daily journal or task. 
Extract all meaningful context: Objects, People, Location, Mood, Activities, Whiteboard text, Meeting notes, Certificates, Food, Travel, Events.`,
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: "Analyze this image and summarize the key information and provide a short caption." },
            { type: "file", data: buffer.toString("base64"), mediaType: mimeType },
          ],
        },
      ],
    });

    return object;
  } catch (error) {
    console.error("Vision Analysis Error:", error);
    return {
      summary: "An image was attached, but analysis failed.",
      caption: "Attached Image"
    };
  }
}
