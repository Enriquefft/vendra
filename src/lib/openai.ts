/**
 * @deprecated This module is deprecated. Please use @/lib/ai instead.
 *
 * Migration guide:
 * - Replace `createChatCompletion()` with `completeJson()` from @/lib/ai
 * - Replace `createTranscription()` with `transcribe()` from @/lib/ai
 *
 * The new AI layer supports multiple providers (OpenAI, Anthropic, Mock)
 * and is configured via the AI_PROVIDER environment variable.
 *
 * Example:
 * ```typescript
 * // OLD
 * import { createChatCompletion } from "@/lib/openai";
 * const { completion, isMock } = await createChatCompletion(...);
 *
 * // NEW
 * import { completeJson } from "@/lib/ai";
 * const { object, isMock } = await completeJson(..., schema, mockOptions);
 * ```
 */

import OpenAI from "openai";

import { env } from "@/env";

const openaiClient = env.OPENAI_API_KEY
	? new OpenAI({
			apiKey: env.OPENAI_API_KEY,
		})
	: null;

type ChatCompletionParams =
	OpenAI.Chat.Completions.ChatCompletionCreateParamsNonStreaming;

type TranscriptionParams =
	OpenAI.Audio.Transcriptions.TranscriptionCreateParamsNonStreaming;

function buildMockChatCompletion(
	mockContent: string,
	params: ChatCompletionParams,
): OpenAI.Chat.Completions.ChatCompletion {
	return {
		choices: [
			{
				finish_reason: "stop",
				index: 0,
				logprobs: null,
				message: { content: mockContent, refusal: null, role: "assistant" },
			},
		],
		created: Math.floor(Date.now() / 1000),
		id: "mock-chat-completion",
		model: params.model ?? "mock-model",
		object: "chat.completion",
		system_fingerprint: "mock",
		usage: {
			completion_tokens: mockContent.length,
			prompt_tokens: JSON.stringify(params.messages ?? []).length,
			total_tokens:
				mockContent.length + JSON.stringify(params.messages ?? []).length,
		},
	};
}

function buildMockTranscription(
	mockText: string,
	_params: TranscriptionParams,
): OpenAI.Audio.Transcription {
	return {
		text: mockText,
		words: [],
	} as OpenAI.Audio.Transcription;
}

export async function createChatCompletion(
	params: ChatCompletionParams,
	{ mockContent }: { mockContent: string | (() => string) },
): Promise<{
	completion: OpenAI.Chat.Completions.ChatCompletion;
	isMock: boolean;
}> {
	if (!openaiClient) {
		const content =
			typeof mockContent === "function" ? mockContent() : mockContent;
		return {
			completion: buildMockChatCompletion(content, params),
			isMock: true,
		};
	}

	const completion = await openaiClient.chat.completions.create(params);
	return { completion, isMock: false };
}

export async function createTranscription(
	params: TranscriptionParams,
): Promise<{ transcription: OpenAI.Audio.Transcription; isMock: boolean }> {
	if (!openaiClient) {
		const mockText =
			"[Modo simulado] Transcripción generada sin la API de OpenAI.";
		return {
			isMock: true,
			transcription: buildMockTranscription(mockText, params),
		};
	}

	const transcription = await openaiClient.audio.transcriptions.create({
		...params,
		stream: false,
	});
	return { isMock: false, transcription };
}
