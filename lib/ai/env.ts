import { z } from "zod";

const geminiSchema = z.object({
  GEMINI_API_KEY: z.string().min(1, "GEMINI_API_KEY must not be empty"),
});

const grokSchema = z.object({
  GROK_API_KEY: z.string().min(1, "GROK_API_KEY must not be empty"),
});

const nvidiaSchema = z.object({
  NVIDIA_API_KEY: z.string().min(1, "NVIDIA_API_KEY must not be empty"),
});

const cloudflareSchema = z.object({
  CLOUDFLARE_API_KEY: z.string().min(1, "CLOUDFLARE_API_KEY must not be empty"),
  CLOUDFLARE_ACCOUNT_ID: z.string().min(1, "CLOUDFLARE_ACCOUNT_ID must not be empty"),
});

export const getGeminiConfig = () => {
  const result = geminiSchema.safeParse({
    GEMINI_API_KEY: process.env.GEMINI_API_KEY,
  });
  if (!result.success) {
    throw new Error(result.error.errors.map(e => e.message).join(", "));
  }
  return result.data;
};

export const getGrokConfig = () => {
  const result = grokSchema.safeParse({
    GROK_API_KEY: process.env.GROK_API_KEY,
  });
  if (!result.success) {
    throw new Error(result.error.errors.map(e => e.message).join(", "));
  }
  return result.data;
};

export const getNvidiaConfig = () => {
  const result = nvidiaSchema.safeParse({
    NVIDIA_API_KEY: process.env.NVIDIA_API_KEY,
  });
  if (!result.success) {
    throw new Error(result.error.errors.map(e => e.message).join(", "));
  }
  return result.data;
};

export const getCloudflareConfig = () => {
  const result = cloudflareSchema.safeParse({
    CLOUDFLARE_API_KEY: process.env.CLOUDFLARE_API_KEY,
    CLOUDFLARE_ACCOUNT_ID: process.env.CLOUDFLARE_ACCOUNT_ID,
  });
  if (!result.success) {
    throw new Error(result.error.errors.map(e => e.message).join(", "));
  }
  return result.data;
};
