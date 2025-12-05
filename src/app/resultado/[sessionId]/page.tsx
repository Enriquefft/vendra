import { asc, eq } from "drizzle-orm";
import { headers } from "next/headers";
import { notFound, redirect } from "next/navigation";

import { auth } from "@/auth";
import { AnalysisView } from "@/components/analysis-view";
import { db } from "@/db";
import {
	analyses,
	conversationTurns,
	personaSnapshots,
	simulationSessions,
} from "@/db/schema/simulation";

type PageProps = {
	params: Promise<{ sessionId: string }>;
};

export default async function ResultsPage({ params }: PageProps) {
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

	// If session is not completed, redirect to simulation
	if (simulationSession.status !== "completed") {
		redirect(`/simulacion/${sessionId}`);
	}

	// Load persona
	const personaSnapshot = await db.query.personaSnapshots.findFirst({
		where: eq(personaSnapshots.sessionId, sessionId),
	});

	if (!personaSnapshot) {
		notFound();
	}

	// Load analysis
	const analysis = await db.query.analyses.findFirst({
		where: eq(analyses.sessionId, sessionId),
	});

	// Load conversation turns for key moments reference
	const turns = await db.query.conversationTurns.findMany({
		orderBy: [asc(conversationTurns.turnIndex)],
		where: eq(conversationTurns.sessionId, sessionId),
	});

	return (
		<main className="min-h-screen bg-gradient-to-b from-slate-50 to-white dark:from-slate-950 dark:to-slate-900">
			{/* Header */}
			<header className="border-b bg-gradient-to-r from-blue-900 via-slate-900 to-slate-950 px-6 py-4 text-white">
				<div className="mx-auto max-w-7xl">
					<p className="text-xs uppercase tracking-[0.2em] text-blue-200">
						Análisis de Simulación
					</p>
					<h1 className="text-xl font-bold">
						{simulationSession.scenarioConfig.productName}
					</h1>
					<p className="text-sm text-slate-300">
						{simulationSession.scenarioConfig.callObjective} · {turns.length}{" "}
						turnos de conversación
					</p>
				</div>
			</header>

			{/* Main content */}
			<div className="mx-auto max-w-7xl p-4 lg:p-6">
				<AnalysisView
					sessionId={sessionId}
					analysis={analysis ?? null}
					persona={personaSnapshot.persona}
					scenarioConfig={simulationSession.scenarioConfig}
					turns={turns.map((t) => ({
						content: t.content,
						id: t.id,
						role: t.role,
						turnIndex: t.turnIndex,
					}))}
				/>
			</div>
		</main>
	);
}
