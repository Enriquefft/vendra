import { type NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { AudioTranscriptionError, transcribeAudio } from "@/lib/audio-gateway";

/** Maximum audio file size in bytes (25 MB - OpenAI limit) */
const MAX_FILE_SIZE_BYTES = 25 * 1024 * 1024;

/** Allowed MIME types for audio files */
const ALLOWED_MIME_TYPES = [
	"audio/webm",
	"audio/mpeg",
	"audio/wav",
	"audio/ogg",
	"audio/flac",
	"audio/m4a",
	"audio/mp4",
];

/**
 * POST /api/stt
 * Transcribes audio to text using OpenAI Whisper.
 * Expects multipart/form-data with an "audio" file field.
 */
export async function POST(request: NextRequest) {
	const session = await auth.api.getSession({ headers: request.headers });

	if (!session) {
		return NextResponse.json({ error: "No autenticado" }, { status: 401 });
	}

	try {
		const formData = await request.formData();
		const audioFile = formData.get("audio");

		if (!audioFile || !(audioFile instanceof File)) {
			return NextResponse.json(
				{ error: "Se requiere un archivo de audio en el campo 'audio'" },
				{ status: 400 },
			);
		}

		if (audioFile.size > MAX_FILE_SIZE_BYTES) {
			return NextResponse.json(
				{
					error: `El archivo excede el tamaño máximo de 25 MB`,
					maxSizeMB: 25,
				},
				{ status: 400 },
			);
		}

		if (!ALLOWED_MIME_TYPES.includes(audioFile.type)) {
			return NextResponse.json(
				{
					allowedTypes: ALLOWED_MIME_TYPES,
					error: `Tipo de archivo no soportado: ${audioFile.type}`,
				},
				{ status: 400 },
			);
		}

		const text = await transcribeAudio(audioFile);

		return NextResponse.json({ text });
	} catch (error) {
		console.error("Error al transcribir audio:", error);

		if (error instanceof AudioTranscriptionError) {
			return NextResponse.json({ error: error.message }, { status: 500 });
		}

		return NextResponse.json(
			{ error: "Error al procesar el audio" },
			{ status: 500 },
		);
	}
}
