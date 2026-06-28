if (typeof global !== "undefined") {
  if (!global.DOMMatrix) {
    (global as any).DOMMatrix = class DOMMatrix {};
  }
  if (!global.ImageData) {
    (global as any).ImageData = class ImageData {};
  }
  if (!global.Path2D) {
    (global as any).Path2D = class Path2D {};
  }
}
const pdfParseModule = require("pdf-parse");
const pdfParse = typeof pdfParseModule === 'function' ? pdfParseModule : (pdfParseModule.default || pdfParseModule);

import { generateText } from "ai";
import { createGoogleGenerativeAI } from "@ai-sdk/google";

const apiKey = process.env.GEMINI_API_KEY || "";
const google = createGoogleGenerativeAI({ apiKey });
const model = google("gemini-2.5-flash");

export async function parsePdf(buffer: Buffer): Promise<{ summary: string; pages: number }> {
  try {
    const data = await pdfParse(buffer);
    const pages = data.numpages;
    const rawText = data.text;

    if (process.env.ENABLE_AI_MOCK_DATA === "true") {
      return {
        summary: "This is a mock summary of a PDF document showing research on productivity.",
        pages,
      };
    }

    const { text } = await generateText({
      model,
      system: `You are an AI assistant summarizing a PDF document for a daily journal or task. 
Extract meaningful information like Meeting Notes, Research Papers, Assignments, Invoices, Project Documents, Lecture Notes, or Reports.
Keep the summary concise and focus on the key takeaways. Do not say "You uploaded a PDF". Just state what the document was about.`,
      prompt: `Please summarize the following document text:\n\n${rawText.slice(0, 30000)}`, // Limit to prevent token overflow
    });

    return { summary: text, pages };
  } catch (error) {
    console.error("PDF Parsing Error:", error);
    return { summary: "A PDF document was attached, but text extraction failed.", pages: 0 };
  }
}
