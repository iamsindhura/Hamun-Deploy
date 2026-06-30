import { NextRequest, NextResponse } from "next/server";
import { AIRouter } from "@/lib/ai/router";
import { z } from "zod";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  console.log("[Test Router] Request started");
  const startTime = Date.now();
  const attempts: any[] = [];

  const { searchParams } = new URL(request.url);
  const failParam = searchParams.get("fail");
  const failProviders = failParam ? failParam.split(",").map(p => p.trim().toLowerCase()) : [];

  try {
    const schema = z.object({
      response: z.string().describe("The router test response"),
    });

    const result = await AIRouter.generateJournal({
      systemPrompt: "You are a helpful assistant.",
      userPrompt: "Reply only with: Router Test Successful",
      schema,
      _attempts: attempts,
      failProviders,
    });

    const totalResponseTime = Date.now() - startTime;
    
    // Find which provider succeeded
    const successfulAttempt = attempts.find(a => a.status === "Success");
    const providerUsed = successfulAttempt ? successfulAttempt.provider : "unknown";

    console.log(`[Test Router] Success in ${totalResponseTime}ms via ${providerUsed}`);

    return NextResponse.json({
      success: true,
      providerUsed,
      response: result.response,
      totalResponseTime,
      attempts,
    });
  } catch (error: any) {
    const totalResponseTime = Date.now() - startTime;
    const errorMessage = error?.message || String(error);
    console.error(`[Test Router] Failure after ${totalResponseTime}ms: ${errorMessage}`);

    return NextResponse.json(
      {
        success: false,
        error: "All AI providers failed.",
        attempts,
      },
      { status: 500 }
    );
  }
}
