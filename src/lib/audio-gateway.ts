import { openai } from "./openai";

/**
 * AudioGateway module for speech-to-text transcription using OpenAI Whisper.
 * Responsible only for converting audio to text.
 */

/**
 * Transcribes audio to text using OpenAI Whisper API.
 * @param audioFile - The audio file (Blob/File) to transcribe
 * @returns The transcribed text in Spanish
 */
export async function transcribeAudio(audioFile: File): Promise<string> {
	const transcription = await openai.audio.transcriptions.create({
		file: audioFile,
		language: "es",
		model: "whisper-1",
		response_format: "text",
	});

	return transcription;
}
