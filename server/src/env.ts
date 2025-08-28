import { createEnv } from "@t3-oss/env-core";
import { z } from "zod";

export const env = createEnv({
  /*
   * Server-side Environment variables
   */
  server: {
    CORS_ORIGIN: z.string().url(),
    BETTER_AUTH_SECRET: z.string().min(1),
    BETTER_AUTH_URL: z.string().url(),
    DATABASE_URL: z.string().min(1),
    GROQ_API_KEY: z.string().min(1),
    R2_ACCESS_SECRET: z.string().min(1),
    R2_ACCESS_KEY: z.string().min(1),
    R2_ACCOUNT_ID: z.string().min(1),
    R2_TOKEN: z.string().min(1),
    GEMINI_API_KEY: z.string().min(1),
    OPENROUTER_API_KEY: z.string().min(1),
    PROCESS_VIDEO_ENDPOINT_AUTH: z.string().min(1),
    PROCESS_VIDEO_ENDPOINT: z.string().min(1),
    NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
    R2_REGION: z.string().default("auto"),
    R2_BUCKET_NAME: z.string().default("nclip"),
    BASE_API: z.string().url(),
    BUCKET_ACCESS_KEY: z.string().min(1),
    BUCKET_ACCESS_SECRET: z.string().min(1),
    BUCKET_ENDPOINT: z.string().min(1),
    CLOUDFLARE_D1_TOKEN: z.string().min(1),
    CLOUDFLARE_ACCOUNT_ID: z.string().min(1),
    CLOUDFLARE_DATABASE_ID: z.string().min(1),
  },
  /*
   * Runtime environment variables mapping
   */
  runtimeEnv: {
    CORS_ORIGIN: process.env.CORS_ORIGIN,
    BETTER_AUTH_SECRET: process.env.BETTER_AUTH_SECRET,
    BETTER_AUTH_URL: process.env.BETTER_AUTH_URL,
    DATABASE_URL: process.env.DATABASE_URL,
    GROQ_API_KEY: process.env.GROQ_API_KEY,
    R2_ACCESS_SECRET: process.env.R2_ACCESS_SECRET,
    R2_ACCESS_KEY: process.env.R2_ACCESS_KEY,
    R2_ACCOUNT_ID: process.env.R2_ACCOUNT_ID,
    R2_TOKEN: process.env.R2_TOKEN,
    GEMINI_API_KEY: process.env.GEMINI_API_KEY,
    OPENROUTER_API_KEY: process.env.OPENROUTER_API_KEY,
    PROCESS_VIDEO_ENDPOINT_AUTH: process.env.PROCESS_VIDEO_ENDPOINT_AUTH,
    PROCESS_VIDEO_ENDPOINT: process.env.PROCESS_VIDEO_ENDPOINT,
    NODE_ENV: process.env.NODE_ENV,
    R2_REGION: process.env.R2_REGION,
    R2_BUCKET_NAME: process.env.R2_BUCKET_NAME,
    BASE_API: process.env.BASE_API,
    BUCKET_ACCESS_KEY: process.env.BUCKET_ACCESS_KEY,
    BUCKET_ACCESS_SECRET: process.env.BUCKET_ACCESS_SECRET,
    BUCKET_ENDPOINT: process.env.BUCKET_ENDPOINT,
    CLOUDFLARE_D1_TOKEN: process.env.CLOUDFLARE_D1_TOKEN,
    CLOUDFLARE_ACCOUNT_ID: process.env.CLOUDFLARE_ACCOUNT_ID,
    CLOUDFLARE_DATABASE_ID: process.env.CLOUDFLARE_DATABASE_ID,
  },
});