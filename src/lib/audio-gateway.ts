import { transcribe } from "./ai";

/**
 * Transcribes audio using the configured STT provider.
 * This is the core of the AudioGateway module.
 *
 * - When AI_PROVIDER=openai: uses OpenAI Whisper
 * - When AI_PROVIDER=anthropic: uses AssemblyAI
 * - When AI_PROVIDER=mock: uses mock transcription
 *
 * @param audioBlob - The audio blob to transcribe
 * @param fileName - Optional filename for the audio (defaults to "audio.webm")
 * @returns The transcribed text in Spanish
 */
export async function transcribeAudio(
	audioBlob: Blob,
	fileName = "audio.webm",
): Promise<{ text: string; usedMock: boolean }> {
	const { text, isMock } = await transcribe(audioBlob, {
		fileName,
		language: "es",
	});

	return { text, usedMock: isMock };
}
