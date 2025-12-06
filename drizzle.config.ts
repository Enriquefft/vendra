import { defineConfig } from "drizzle-kit";
import { env } from "./src/env.ts";

console.log(env.DRIZZLE_DATABASE_URL);
export default defineConfig({
	dbCredentials: {
		url: env.DRIZZLE_DATABASE_URL,
	},
	dialect: "postgresql",
	schema: "./src/db/schema/*",
	schemaFilter: env.NEXT_PUBLIC_PROJECT_NAME,
	strict: true,
	verbose: true,
});
