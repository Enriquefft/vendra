/** biome-ignore-all lint/complexity/useLiteralKeys: to access the nextjs env variables, we use process.env, which needs to be typed */

import { vercel } from "@t3-oss/env-core/presets-zod";
import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";
import { getBaseUrl } from "./lib/utils.ts";

const url = getBaseUrl();

export const env = createEnv({
	client: {
		NEXT_PUBLIC_APP_URL: z.string().url().optional(),
		NEXT_PUBLIC_PROJECT_NAME: z.string().min(1),
	},

	emptyStringAsUndefined: false,
	extends: [vercel()],
	runtimeEnv: {
		AI_CHAT_MODEL: process.env["AI_CHAT_MODEL"],
		AI_PROVIDER: process.env["AI_PROVIDER"],
		AI_STT_MODEL: process.env["AI_STT_MODEL"],
		ANTHROPIC_API_KEY: process.env["ANTHROPIC_API_KEY"],
		ASSEMBLYAI_API_KEY: process.env["ASSEMBLYAI_API_KEY"],
		BETTER_AUTH_SECRET: process.env["BETTER_AUTH_SECRET"],
		BETTER_AUTH_URL: process.env["BETTER_AUTH_URL"],
		DRIZZLE_DATABASE_URL: process.env["DRIZZLE_DATABASE_URL"],
		GOOGLE_CLIENT_ID: process.env["GOOGLE_CLIENT_ID"],
		GOOGLE_CLIENT_SECRET: process.env["GOOGLE_CLIENT_SECRET"],
		NEXT_PUBLIC_APP_URL: process.env["NEXT_PUBLIC_APP_URL"],
		NEXT_PUBLIC_PROJECT_NAME: process.env["NEXT_PUBLIC_PROJECT_NAME"],
		OPENAI_API_KEY: process.env["OPENAI_API_KEY"],
		PSYCHOLOGY_PROMPT_MODE: process.env["PSYCHOLOGY_PROMPT_MODE"],
	},
	server: {
		AI_CHAT_MODEL: z.string().optional(),
		AI_PROVIDER: z.enum(["openai", "anthropic", "mock"]).default("openai"),
		AI_STT_MODEL: z.string().optional(),
		ANTHROPIC_API_KEY: z.string().min(1).optional(),
		ASSEMBLYAI_API_KEY: z.string().min(1).optional(),
		BETTER_AUTH_SECRET: z.string().min(32),
		BETTER_AUTH_URL: z.string().url().default(url),
		DRIZZLE_DATABASE_URL: z.string().url(),
		GOOGLE_CLIENT_ID: z.string(),
		GOOGLE_CLIENT_SECRET: z.string(),
		OPENAI_API_KEY: z.string().min(1).optional(),
		PSYCHOLOGY_PROMPT_MODE: z
			.enum(["full", "optimized"])
			.default("full")
			.describe(
				"Psychology prompt mode: 'full' includes complete psychological context (max realism, higher tokens), 'optimized' summarizes state (balanced)",
			),
	},
});
