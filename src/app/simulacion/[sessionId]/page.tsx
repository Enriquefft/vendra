import { asc, eq } from "drizzle-orm";
import type { Route } from "next";
import { headers } from "next/headers";
import { notFound, redirect } from "next/navigation";

import { auth } from "@/auth";
import type { ChatMessage } from "@/components/chat-messages";
import { SimulationView } from "@/components/simulation-view";
import { db } from "@/db";
import {
	conversationTurns,
	personaSnapshots,
	simulationSessions,
} from "@/db/schema/simulation";

type PageProps = {
	params: Promise<{ sessionId: string }>;
};

export default async function SimulationPage({ params }: PageProps) {
	const session = await auth.api.getSession({
		headers: await headers(),
	});

	if (!session) {
		redirect("/login");
	}

	const { sessionId } = await params;

	// Load simulation session
	const simulationSession = await db.query.simulationSessions.findFirst({
		where: eq(simulationSessions.id, sessionId),
	});

	if (!simulationSession) {
		notFound();
	}

	// Verify ownership
	if (simulationSession.userId !== session.user.id) {
		notFound();
	}

	// If session is completed, redirect to results
	if (simulationSession.status === "completed") {
		redirect(`/resultado/${sessionId}` as Route);
	}

	// If session is pending persona, redirect to configuration
	if (simulationSession.status === "pending_persona") {
		redirect("/configuracion");
	}

	// Load persona
	const personaSnapshot = await db.query.personaSnapshots.findFirst({
		where: eq(personaSnapshots.sessionId, sessionId),
	});

	if (!personaSnapshot) {
		// Persona not ready, redirect back
		redirect("/configuracion");
	}

	// Load existing conversation turns
	const turns = await db.query.conversationTurns.findMany({
		orderBy: [asc(conversationTurns.turnIndex)],
		where: eq(conversationTurns.sessionId, sessionId),
	});

	const initialMessages: ChatMessage[] = turns.map((turn) => ({
		content: turn.content,
		id: turn.id,
		meta: turn.meta,
		role: turn.role,
		turnIndex: turn.turnIndex,
	}));

	return (
		<main className="flex min-h-screen flex-col">
			{/* Header */}
			<header className="border-b bg-gradient-to-r from-blue-900 via-slate-900 to-slate-950 px-6 py-4 text-white">
				<div className="mx-auto flex max-w-7xl items-center justify-between">
					<div>
						<p className="text-xs uppercase tracking-[0.2em] text-blue-200">
							Simulación
						</p>
						<h1 className="text-xl font-bold">
							{simulationSession.scenarioConfig.productName}
						</h1>
					</div>
					<div className="text-right text-sm text-slate-300">
						<p>Objetivo: {simulationSession.scenarioConfig.callObjective}</p>
						<p className="text-xs text-slate-400">
							Duración máx:{" "}
							{
								simulationSession.scenarioConfig.simulationPreferences
									.maxDurationMinutes
							}{" "}
							min
						</p>
					</div>
				</div>
			</header>

			{/* Main simulation area */}
			<div className="mx-auto flex w-full max-w-7xl flex-1 p-4 lg:p-6">
				<SimulationView
					sessionId={sessionId}
					persona={personaSnapshot.persona}
					initialMessages={initialMessages}
					maxDurationMinutes={
						simulationSession.scenarioConfig.simulationPreferences
							.maxDurationMinutes
					}
					className="flex-1"
				/>
			</div>
		</main>
	);
}
