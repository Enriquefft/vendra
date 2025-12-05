import { eq } from "drizzle-orm";
import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { db } from "@/db";
import { simulationSessions } from "@/db/schema/simulation";
import { orchestrateConversation } from "@/lib/conversation-orchestrator";

const speakRequestSchema = z.object({
	text: z.string().min(1, "El texto del vendedor es requerido"),
});

type RouteParams = {
	params: Promise<{ id: string }>;
};

export async function POST(request: NextRequest, { params }: RouteParams) {
	const session = await auth.api.getSession({ headers: request.headers });

	if (!session) {
		return NextResponse.json({ error: "No autenticado" }, { status: 401 });
	}

	const { id: sessionId } = await params;

	// Validate session exists and belongs to user
	const simulationSession = await db.query.simulationSessions.findFirst({
		where: eq(simulationSessions.id, sessionId),
	});

	if (!simulationSession) {
		return NextResponse.json(
			{ error: "Sesión de simulación no encontrada" },
			{ status: 404 },
		);
	}

	if (simulationSession.userId !== session.user.id) {
		return NextResponse.json(
			{ error: "No tienes acceso a esta sesión" },
			{ status: 403 },
		);
	}

	if (simulationSession.status !== "active") {
		return NextResponse.json(
			{ error: "Esta sesión no está activa" },
			{ status: 400 },
		);
	}

	// Parse request body
	const body = await request.json().catch(() => null);
	const validation = speakRequestSchema.safeParse(body);

	if (!validation.success) {
		return NextResponse.json(
			{ details: validation.error.flatten(), error: "Solicitud inválida" },
			{ status: 400 },
		);
	}

	try {
		const result = await orchestrateConversation({
			sellerText: validation.data.text,
			sessionId,
		});

		return NextResponse.json({
			clientResponse: result.clientResponse,
			clientTurnId: result.clientTurnId,
			sellerTurnId: result.sellerTurnId,
		});
	} catch (error) {
		console.error("Speak Error:", error);
		return NextResponse.json(
			{ error: "Error al procesar la respuesta del cliente" },
			{ status: 500 },
		);
	}
}
