import { openai } from "./openai";

/**
 * AudioGateway module for speech-to-text transcription using OpenAI Whisper.
 * Responsible only for converting audio to text.
 */

export class AudioTranscriptionError extends Error {
	public readonly originalCause?: unknown;

	constructor(message: string, cause?: unknown) {
		super(message);
		this.name = "AudioTranscriptionError";
		this.originalCause = cause;
	}
}

/**
 * Transcribes audio to text using OpenAI Whisper API.
 * @param audioFile - The audio file (Blob/File) to transcribe
 * @returns The transcribed text in Spanish
 * @throws {AudioTranscriptionError} If transcription fails
 */
export async function transcribeAudio(audioFile: File): Promise<string> {
	try {
		const transcription = await openai.audio.transcriptions.create({
			file: audioFile,
			language: "es",
			model: "whisper-1",
			response_format: "text",
		});

		return transcription;
	} catch (error) {
		if (error instanceof Error) {
			throw new AudioTranscriptionError(
				`Error al transcribir audio: ${error.message}`,
				error,
			);
		}
		throw new AudioTranscriptionError(
			"Error desconocido al transcribir audio",
			error,
		);
	}
}
