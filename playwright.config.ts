import { defineConfig } from "@playwright/test";

// biome-ignore lint/complexity/useLiteralKeys: process.env requires bracket access in this project
const PORT = process.env["PORT"] ? Number(process.env["PORT"]) : 3000;

export default defineConfig({
	testDir: "tests/e2e",
	use: {
		baseURL: `http://localhost:${PORT}`,
		headless: true,
	},
	webServer: {
		command: `bun run dev --hostname 0.0.0.0 --port ${PORT}`,
		env: {
			BETTER_AUTH_SECRET: "test-secret-test-secret-test-secret-123",
			BETTER_AUTH_URL: `http://localhost:${PORT}`,
			DRIZZLE_DATABASE_URL: "http://localhost:5432/test-db",
			GOOGLE_CLIENT_ID: "playwright-client",
			GOOGLE_CLIENT_SECRET: "playwright-secret",
			NEXT_PUBLIC_APP_URL: `http://localhost:${PORT}`,
			NEXT_PUBLIC_PROJECT_NAME: "Vendra",
			OPENAI_API_KEY: "sk-playwright",
		},
		port: PORT,
		// biome-ignore lint/complexity/useLiteralKeys: process.env requires bracket access in this project
		reuseExistingServer: !process.env["CI"],
		timeout: 120_000,
	},
});
