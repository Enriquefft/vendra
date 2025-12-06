import { createAnthropic } from "@ai-sdk/anthropic";
import { createOpenAI } from "@ai-sdk/openai";
import type { LanguageModel } from "ai";
import { env } from "@/env";
import { type AIProvider, DEFAULT_MODELS } from "./config";

/**
 * Get chat provider instance based on configuration
 */
export function getChatProvider(): {
	model: LanguageModel;
	provider: AIProvider;
	modelName: string;
} {
	const provider = env.AI_PROVIDER ?? "openai";

	switch (provider) {
		case "openai": {
			if (!env.OPENAI_API_KEY) {
				throw new Error("OPENAI_API_KEY is required when AI_PROVIDER=openai");
			}
			const openai = createOpenAI({
				apiKey: env.OPENAI_API_KEY,
			});
			const modelName = env.AI_CHAT_MODEL ?? DEFAULT_MODELS.openai.chat;
			return {
				model: openai(modelName),
				modelName,
				provider: "openai",
			};
		}

		case "anthropic": {
			if (!env.ANTHROPIC_API_KEY) {
				throw new Error(
					"ANTHROPIC_API_KEY is required when AI_PROVIDER=anthropic",
				);
			}
			const anthropic = createAnthropic({
				apiKey: env.ANTHROPIC_API_KEY,
			});
			const modelName = env.AI_CHAT_MODEL ?? DEFAULT_MODELS.anthropic.chat;
			return {
				model: anthropic(modelName),
				modelName,
				provider: "anthropic",
			};
		}

		case "mock": {
			// Mock provider will be handled in the main index.ts
			throw new Error("Mock provider should not be initialized here");
		}

		default:
			throw new Error(`Unknown AI provider: ${provider}`);
	}
}
