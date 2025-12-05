import { eq } from "drizzle-orm";
import { type NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/db";
import { simulationSessions } from "@/db/schema/simulation";
import { analyzeSession, getAnalysis } from "@/lib/analysis-engine";

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

	if (simulationSession.status !== "completed") {
		return NextResponse.json(
			{ error: "La sesión debe estar completada para generar el análisis" },
			{ status: 400 },
		);
	}

	try {
		const result = await analyzeSession({ sessionId });

		return NextResponse.json({
			analysisId: result.analysisId,
			improvements: result.improvements,
			keyMoments: result.keyMoments,
			score: result.score,
			successes: result.successes,
		});
	} catch (error) {
		// Check if analysis already exists
		if (
			error instanceof Error &&
			error.message === "Ya existe un análisis para esta sesión"
		) {
			const existing = await getAnalysis(sessionId);
			if (existing) {
				return NextResponse.json({
					analysisId: existing.analysisId,
					improvements: existing.improvements,
					keyMoments: existing.keyMoments,
					score: existing.score,
					successes: existing.successes,
				});
			}
		}

		console.error("Analysis Error:", error);
		return NextResponse.json(
			{ error: "Error al generar el análisis" },
			{ status: 500 },
		);
	}
}

export async function GET(request: NextRequest, { params }: RouteParams) {
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

	try {
		const result = await getAnalysis(sessionId);

		if (!result) {
			return NextResponse.json(
				{ error: "No se encontró un análisis para esta sesión" },
				{ status: 404 },
			);
		}

		return NextResponse.json({
			analysisId: result.analysisId,
			improvements: result.improvements,
			keyMoments: result.keyMoments,
			score: result.score,
			successes: result.successes,
		});
	} catch (error) {
		console.error("Get Analysis Error:", error);
		return NextResponse.json(
			{ error: "Error al obtener el análisis" },
			{ status: 500 },
		);
	}
}
