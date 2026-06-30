import { NextResponse } from "next/server";
import { cloudflareProvider } from "@/lib/ai/providers/cloudflare";
import { z } from "zod";

export const dynamic = "force-dynamic";

export async function GET() {
  console.log("[Test Cloudflare] Request started");
  const startTime = Date.now();

  try {
    const schema = z.object({
      response: z.string().describe("The hello response"),
    });

    const result = await cloudflareProvider.generateJournal({
      systemPrompt: "You are a helpful assistant.",
      userPrompt: "Say Hello from Cloudflare Workers AI.",
      schema,
    });

    const responseTime = Date.now() - startTime;
    console.log(`[Test Cloudflare] Success in ${responseTime}ms`);

    return NextResponse.json({
      success: true,
      provider: "Cloudflare",
      response: result.response,
      responseTime,
    });
  } catch (error: any) {
    const responseTime = Date.now() - startTime;
    const errorMessage = error?.message || String(error);
    console.error(`[Test Cloudflare] Failure after ${responseTime}ms: ${errorMessage}`);

    return NextResponse.json(
      {
        success: false,
        provider: "Cloudflare",
        error: errorMessage,
      },
      { status: 500 }
    );
  }
}
