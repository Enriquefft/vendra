import { z } from "zod";

/**
 * AI provider types
 */
export const aiProviderSchema = z.enum(["openai", "anthropic", "mock"]);
export type AIProvider = z.infer<typeof aiProviderSchema>;

/**
 * STT provider types
 */
export const sttProviderSchema = z.enum(["openai", "assemblyai", "mock"]);
export type STTProvider = z.infer<typeof sttProviderSchema>;

/**
 * Default models per provider
 */
export const DEFAULT_MODELS = {
	anthropic: {
		chat: "claude-3-5-haiku-20241022",
	},
	assemblyai: {
		stt: "best",
	},
	mock: {
		chat: "mock-model",
		stt: "mock-stt",
	},
	openai: {
		chat: "gpt-4o-mini",
		stt: "whisper-1",
	},
} as const;

/**
 * Determine STT provider based on chat provider
 * - OpenAI chat → OpenAI Whisper STT
 * - Anthropic chat → AssemblyAI STT
 * - Mock chat → Mock STT
 */
export function resolveSTTProvider(chatProvider: AIProvider): STTProvider {
	switch (chatProvider) {
		case "openai":
			return "openai";
		case "anthropic":
			return "assemblyai";
		case "mock":
			return "mock";
	}
}
