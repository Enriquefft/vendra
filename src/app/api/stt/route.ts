import { type NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { transcribeAudio } from "@/lib/audio-gateway";

const MAX_AUDIO_SIZE_BYTES = 25 * 1024 * 1024; // 25MB - OpenAI Whisper limit

export async function POST(request: NextRequest) {
	const session = await auth.api.getSession({ headers: request.headers });

	if (!session) {
		return NextResponse.json({ error: "No autenticado" }, { status: 401 });
	}

	try {
		const formData = await request.formData();
		const audioFile = formData.get("audio");

		if (!audioFile || !(audioFile instanceof Blob)) {
			return NextResponse.json(
				{ error: "Archivo de audio no proporcionado" },
				{ status: 400 },
			);
		}

		if (audioFile.size > MAX_AUDIO_SIZE_BYTES) {
			return NextResponse.json(
				{
					error: `El archivo de audio excede el tamaño máximo permitido (${MAX_AUDIO_SIZE_BYTES / 1024 / 1024}MB)`,
				},
				{ status: 400 },
			);
		}

		const { text, usedMock } = await transcribeAudio(audioFile);

		return NextResponse.json({ mocked: usedMock, text });
	} catch (error) {
		console.error("STT Error:", error);
		return NextResponse.json(
			{ error: "Error al transcribir el audio" },
			{ status: 500 },
		);
	}
}
