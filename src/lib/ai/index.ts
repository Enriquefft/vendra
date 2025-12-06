import { generateObject, generateText } from "ai";
import type { z } from "zod";
import { env } from "@/env";
import type { AIProvider } from "./config";
import type { MockContentGenerator } from "./mock";
import { getChatProvider } from "./providers";
import { transcribeAudio as transcribeAudioInternal } from "./stt";

/**
 * Chat completion result
 */
export type ChatCompletionResult = {
	content: string;
	isMock: boolean;
};

/**
 * Structured output result
 */
export type StructuredOutputResult<T> = {
	object: T;
	isMock: boolean;
};

/**
 * Get current provider info
 */
export function getProviderInfo(): {
	provider: AIProvider;
	modelName: string;
} {
	const provider = env.AI_PROVIDER ?? "openai";

	if (provider === "mock") {
		return {
			modelName: "mock-model",
			provider: "mock",
		};
	}

	const { provider: actualProvider, modelName } = getChatProvider();
	return { modelName, provider: actualProvider };
}

/**
 * Generate text completion
 */
export async function complete(
	options: {
		messages: Array<{ role: "system" | "user" | "assistant"; content: string }>;
		temperature?: number;
	},
	mockOptions?: { mockContent: MockContentGenerator },
): Promise<ChatCompletionResult> {
	const provider = env.AI_PROVIDER ?? "openai";

	// Use mock provider
	if (provider === "mock") {
		const content =
			mockOptions?.mockContent === undefined
				? "Mock response"
				: typeof mockOptions.mockContent === "function"
					? mockOptions.mockContent()
					: mockOptions.mockContent;
		return { content, isMock: true };
	}

	// Use real provider with fallback to mock
	try {
		const { model } = getChatProvider();
		const { text } = await generateText({
			messages: options.messages,
			model,
			temperature: options.temperature,
		});
		return { content: text, isMock: false };
	} catch (error) {
		// Fallback to mock if API key is missing
		if (
			mockOptions?.mockContent &&
			error instanceof Error &&
			error.message.includes("API_KEY is required")
		) {
			console.warn(
				`AI provider ${provider} not configured, falling back to mock`,
			);
			const content =
				typeof mockOptions.mockContent === "function"
					? mockOptions.mockContent()
					: mockOptions.mockContent;
			return { content, isMock: true };
		}
		throw error;
	}
}

/**
 * Generate structured JSON output
 */
export async function completeJson<T>(
	options: {
		messages: Array<{ role: "system" | "user" | "assistant"; content: string }>;
		temperature?: number;
	},
	schema: z.Schema<T>,
	mockOptions?: { mockContent: MockContentGenerator },
): Promise<StructuredOutputResult<T>> {
	const provider = env.AI_PROVIDER ?? "openai";

	// Use mock provider
	if (provider === "mock") {
		const content =
			mockOptions?.mockContent === undefined
				? JSON.stringify({ message: "Mock response", mock: true })
				: typeof mockOptions.mockContent === "function"
					? mockOptions.mockContent()
					: mockOptions.mockContent;
		const object = schema.parse(JSON.parse(content));
		return { isMock: true, object };
	}

	// Use real provider with fallback to mock
	try {
		const { model } = getChatProvider();
		const { object } = await generateObject({
			messages: options.messages,
			model,
			schema,
			temperature: options.temperature,
		});
		return { isMock: false, object };
	} catch (error) {
		// Fallback to mock if API key is missing
		if (
			mockOptions?.mockContent &&
			error instanceof Error &&
			error.message.includes("API_KEY is required")
		) {
			console.warn(
				`AI provider ${provider} not configured, falling back to mock`,
			);
			const content =
				typeof mockOptions.mockContent === "function"
					? mockOptions.mockContent()
					: mockOptions.mockContent;
			const object = schema.parse(JSON.parse(content));
			return { isMock: true, object };
		}
		throw error;
	}
}

/**
 * Transcribe audio to text
 */
export async function transcribe(
	audioBlob: Blob,
	options?: { language?: string; fileName?: string },
): Promise<{ text: string; isMock: boolean }> {
	return transcribeAudioInternal(audioBlob, options);
}

// Re-export types
export type { AIProvider, STTProvider } from "./config";
export type { MockContentGenerator } from "./mock";
