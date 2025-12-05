import { openai } from "./openai";

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
): Promise<string> {
	// Convert Blob to File for OpenAI API
	const file = new File([audioBlob], fileName, { type: audioBlob.type });

	const transcription = await openai.audio.transcriptions.create({
		file,
		language: "es",
		model: "whisper-1",
	});

	return transcription.text;
}
