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
		BETTER_AUTH_URL: process.env["BETTER_AUTH_URL"],
		DRIZZLE_DATABASE_URL: process.env["DRIZZLE_DATABASE_URL"],
		GOOGLE_CLIENT_ID: process.env["GOOGLE_CLIENT_ID"],
		GOOGLE_CLIENT_SECRET: process.env["GOOGLE_CLIENT_SECRET"],
		NEXT_PUBLIC_APP_URL: process.env["NEXT_PUBLIC_APP_URL"],
		NEXT_PUBLIC_PROJECT_NAME: process.env["NEXT_PUBLIC_PROJECT_NAME"],
	},
	server: {
		BETTER_AUTH_URL: z.string().url().default(url),
		DRIZZLE_DATABASE_URL: z.string().url(),
		GOOGLE_CLIENT_ID: z.string(),
		GOOGLE_CLIENT_SECRET: z.string(),
	},
});
