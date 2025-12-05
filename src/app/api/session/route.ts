import { eq } from "drizzle-orm";
import { type NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/db";
import { personaSnapshots, simulationSessions } from "@/db/schema/simulation";
import { generatePersona } from "@/lib/persona-engine";
import { scenarioConfigSchema } from "@/lib/schemas/session";

export async function POST(request: NextRequest) {
	const session = await auth.api.getSession({ headers: request.headers });

	if (!session) {
		return NextResponse.json({ error: "No autenticado" }, { status: 401 });
	}

	const body = await request.json().catch(() => null);

	const validation = scenarioConfigSchema.safeParse(body);

	if (!validation.success) {
		return NextResponse.json(
			{ details: validation.error.flatten(), error: "Configuración inválida" },
			{ status: 400 },
		);
	}

	const scenarioConfig = validation.data;

	try {
		const [createdSession] = await db
			.insert(simulationSessions)
			.values({
				scenarioConfig,
				userId: session.user.id,
			})
			.returning({ id: simulationSessions.id });

		if (!createdSession) {
			return NextResponse.json(
				{ error: "No se pudo crear la sesión" },
				{ status: 500 },
			);
		}

		const personaResult = await generatePersona(scenarioConfig);

		await db.insert(personaSnapshots).values({
			persona: personaResult.persona,
			sessionId: createdSession.id,
		});

		await db
			.update(simulationSessions)
			.set({ status: "active" })
			.where(eq(simulationSessions.id, createdSession.id));

		return NextResponse.json({
			mocked: personaResult.usedMock,
			persona: personaResult.persona,
			sessionId: createdSession.id,
		});
	} catch (error) {
		console.error(error);
		return NextResponse.json(
			{ error: "No se pudo crear la sesión" },
			{ status: 500 },
		);
	}
}
