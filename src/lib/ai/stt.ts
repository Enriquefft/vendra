import { AssemblyAI } from "assemblyai";
import { env } from "@/env";
import { DEFAULT_MODELS, resolveSTTProvider, type STTProvider } from "./config";

/**
 * STT transcription result
 */
export type TranscriptionResult = {
	text: string;
	isMock: boolean;
};

/**
 * Transcribe audio using OpenAI Whisper
 */
async function transcribeWithOpenAI(
	audioBlob: Blob,
	language = "es",
): Promise<TranscriptionResult> {
	if (!env.OPENAI_API_KEY) {
		throw new Error("OPENAI_API_KEY is required for OpenAI STT");
	}

	// Use OpenAI SDK directly for transcription since AI SDK doesn't have a transcription API yet
	const OpenAI = (await import("openai")).default;
	const openai = new OpenAI({ apiKey: env.OPENAI_API_KEY });

	const file = new File([audioBlob], "audio.webm", { type: audioBlob.type });

	const transcription = await openai.audio.transcriptions.create({
		file,
		language,
		model: env.AI_STT_MODEL ?? DEFAULT_MODELS.openai.stt,
	});

	return { isMock: false, text: transcription.text };
}

/**
 * Transcribe audio using AssemblyAI
 */
async function transcribeWithAssemblyAI(
	audioBlob: Blob,
	language = "es",
): Promise<TranscriptionResult> {
	if (!env.ASSEMBLYAI_API_KEY) {
		throw new Error("ASSEMBLYAI_API_KEY is required for AssemblyAI STT");
	}

	const client = new AssemblyAI({
		apiKey: env.ASSEMBLYAI_API_KEY,
	});

	const arrayBuffer = await audioBlob.arrayBuffer();
	const buffer = Buffer.from(arrayBuffer);

	const transcript = await client.transcripts.transcribe({
		audio: buffer,
		language_code: language,
	});

	if (transcript.status === "error") {
		throw new Error(`AssemblyAI transcription failed: ${transcript.error}`);
	}

	return { isMock: false, text: transcript.text ?? "" };
}

/**
 * Mock transcription for testing
 */
function transcribeWithMock(): TranscriptionResult {
	return {
		isMock: true,
		text: "[Modo simulado] Transcripción generada sin API de STT.",
	};
}

/**
 * Transcribe audio using the configured STT provider
 */
export async function transcribeAudio(
	audioBlob: Blob,
	options?: { language?: string },
): Promise<TranscriptionResult> {
	const aiProvider = env.AI_PROVIDER ?? "openai";
	const sttProvider: STTProvider = resolveSTTProvider(aiProvider);
	const language = options?.language ?? "es";

	try {
		switch (sttProvider) {
			case "openai":
				return await transcribeWithOpenAI(audioBlob, language);

			case "assemblyai":
				return await transcribeWithAssemblyAI(audioBlob, language);

			case "mock":
				return transcribeWithMock();

			default:
				throw new Error(`Unknown STT provider: ${sttProvider}`);
		}
	} catch (error) {
		// Fallback to mock if API key is missing
		if (
			error instanceof Error &&
			error.message.includes("API_KEY is required")
		) {
			console.warn(
				`STT provider ${sttProvider} not configured, falling back to mock`,
			);
			return transcribeWithMock();
		}
		throw error;
	}
}
