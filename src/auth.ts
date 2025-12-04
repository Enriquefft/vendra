import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { nextCookies } from "better-auth/next-js";
import { db } from "@/db";
import { env } from "./env.ts";

export const auth = betterAuth({
	appName: env.NEXT_PUBLIC_PROJECT_NAME,
	baseURL: env.BETTER_AUTH_URL,
	database: drizzleAdapter(db, {
		provider: "pg",
	}),
	plugins: [nextCookies()],
	secret: env.BETTER_AUTH_SECRET,
	socialProviders: {
		google: {
			clientId: env.GOOGLE_CLIENT_ID,
			clientSecret: env.GOOGLE_CLIENT_SECRET,
		},
	},
	user: {
		additionalFields: {},
	},
});
