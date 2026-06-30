import { NextRequest, NextResponse } from "next/server";
import { geminiProvider } from "@/lib/ai/providers/gemini";
import { grokProvider } from "@/lib/ai/providers/grok";
import { nvidiaProvider } from "@/lib/ai/providers/nvidia";
import { cloudflareProvider } from "@/lib/ai/providers/cloudflare";
import { z } from "zod";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const providerParam = searchParams.get("provider")?.toLowerCase();

  if (!providerParam) {
    return NextResponse.json(
      { success: false, error: "Query parameter 'provider' is required. Use gemini, grok, nvidia, or cloudflare." },
      { status: 400 }
    );
  }

  let provider: any;
  switch (providerParam) {
    case "gemini":
      provider = geminiProvider;
      break;
    case "grok":
      provider = grokProvider;
      break;
    case "nvidia":
      provider = nvidiaProvider;
      break;
    case "cloudflare":
      provider = cloudflareProvider;
      break;
    default:
      return NextResponse.json(
        { success: false, error: `Invalid provider: '${providerParam}'. Supported providers: gemini, grok, nvidia, cloudflare` },
        { status: 400 }
      );
  }

  console.log(`[Test AI] Request started for provider: ${provider.name}`);
  const startTime = Date.now();

  try {
    const schema = z.object({
      response: z.string().describe("The requested hello response"),
    });

    const result = await provider.generateJournal({
      systemPrompt: "You are a helpful assistant.",
      userPrompt: `Reply only with: Hello from ${provider.name}`,
      schema,
    });

    const responseTime = Date.now() - startTime;
    console.log(`[Test AI] Success for ${provider.name} in ${responseTime}ms`);

    return NextResponse.json({
      success: true,
      provider: provider.name,
      response: result.response,
      responseTime,
    });
  } catch (error: any) {
    const responseTime = Date.now() - startTime;
    const errorMessage = error?.message || String(error);
    console.error(`[Test AI] Failure for ${provider.name} after ${responseTime}ms: ${errorMessage}`);

    return NextResponse.json(
      {
        success: false,
        provider: provider.name,
        error: errorMessage,
      },
      { status: 500 }
    );
  }
}
