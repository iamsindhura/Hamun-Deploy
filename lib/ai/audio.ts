import { generateText } from "ai";
import { createGoogleGenerativeAI } from "@ai-sdk/google";

const apiKey = process.env.GEMINI_API_KEY || "";
const google = createGoogleGenerativeAI({ apiKey });
const model = google("gemini-1.5-pro"); // 1.5 Pro is better for audio comprehension

export async function transcribeAudio(buffer: Buffer, mimeType: string): Promise<{ summary: string; duration: number }> {
  if (process.env.ENABLE_AI_MOCK_DATA === "true") {
    return {
      summary: "This is a mock summary of a voice note discussing new project ideas and a feeling of excitement.",
      duration: 120, // 2 mins mock
    };
  }

  try {
    const { text } = await generateText({
      model,
      system: `You are an AI assistant transcribing and summarizing a voice note for a daily journal or task. 
Extract Ideas, Thoughts, Plans, Reflections, Meeting discussions, and Emotions.
Provide a clean summary of what was spoken. Do not say "You uploaded a voice note." Just extract the essence.`,
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: "Transcribe and summarize this audio recording." },
            { type: "file", data: buffer.toString("base64"), mediaType: mimeType },
          ],
        },
      ],
    });

    // We can't easily extract duration from raw buffers without ffmpeg, so we'll mock duration or omit it unless the client passes it.
    // The client usually knows the duration via the HTML5 Audio API.
    return { summary: text, duration: 0 }; 
  } catch (error) {
    console.error("Audio Transcription Error:", error);
    return { summary: "A voice note was attached, but transcription failed.", duration: 0 };
  }
}
