import { type NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { transcribeAudio } from "@/lib/audio-gateway";

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

		const allowedTypes = [
			"audio/webm",
			"audio/mp3",
			"audio/mpeg",
			"audio/wav",
			"audio/ogg",
			"audio/flac",
			"audio/m4a",
			"audio/mp4",
		];

		if (!allowedTypes.includes(audioFile.type)) {
			return NextResponse.json(
				{
					allowedTypes,
					error: `Tipo de archivo no soportado: ${audioFile.type}`,
				},
				{ status: 400 },
			);
		}

		const text = await transcribeAudio(audioFile);

		return NextResponse.json({ text });
	} catch (error) {
		console.error("Error al transcribir audio:", error);

		return NextResponse.json(
			{ error: "Error al procesar el audio" },
			{ status: 500 },
		);
	}
}
