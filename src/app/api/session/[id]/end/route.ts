import { eq } from "drizzle-orm";
import { type NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/db";
import { simulationSessions } from "@/db/schema/simulation";

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

	if (simulationSession.status === "completed") {
		return NextResponse.json(
			{ error: "Esta sesión ya fue completada" },
			{ status: 400 },
		);
	}

	try {
		// Update session status to completed
		await db
			.update(simulationSessions)
			.set({
				endedAt: new Date(),
				status: "completed",
				updatedAt: new Date(),
			})
			.where(eq(simulationSessions.id, sessionId));

		return NextResponse.json({
			message: "Sesión finalizada correctamente",
			sessionId,
		});
	} catch (error) {
		console.error("End Session Error:", error);
		return NextResponse.json(
			{ error: "Error al finalizar la sesión" },
			{ status: 500 },
		);
	}
}
