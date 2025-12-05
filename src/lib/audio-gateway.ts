import { createTranscription } from "./openai";

/**
 * Transcribes audio using OpenAI's Whisper API.
 * This is the core of the AudioGateway module.
 *
 * @param audioBlob - The audio blob to transcribe
 * @param fileName - Optional filename for the audio (defaults to "audio.webm")
 * @returns The transcribed text in Spanish
 */
export async function transcribeAudio(
	audioBlob: Blob,
	fileName = "audio.webm",
): Promise<{ text: string; usedMock: boolean }> {
	// Convert Blob to File for OpenAI API
	const file = new File([audioBlob], fileName, { type: audioBlob.type });

	const { isMock, transcription } = await createTranscription({
		file,
		language: "es",
		model: "whisper-1",
	});

	return { text: transcription.text, usedMock: isMock };
}
