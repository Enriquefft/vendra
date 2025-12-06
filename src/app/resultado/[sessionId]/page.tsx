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

	// Load persona (may be null if privacy mode was enabled)
	const personaSnapshot = await db.query.personaSnapshots.findFirst({
		where: eq(personaSnapshots.sessionId, sessionId),
	});

	// Load analysis
	const analysis = await db.query.analyses.findFirst({
		where: eq(analyses.sessionId, sessionId),
	});

	// Load conversation turns for key moments reference (may be empty if privacy mode was enabled)
	const turns = await db.query.conversationTurns.findMany({
		orderBy: [asc(conversationTurns.turnIndex)],
		where: eq(conversationTurns.sessionId, sessionId),
	});

	const privacyModeEnabled = simulationSession.deleteAfterAnalysis;

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
						{simulationSession.scenarioConfig.callObjective}
						{turns.length > 0 && ` · ${turns.length} turnos de conversación`}
					</p>
				</div>
			</header>

			{/* Privacy Notice */}
			{privacyModeEnabled && (
				<div className="mx-auto max-w-7xl p-4 lg:p-6">
					<div className="rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-blue-900 dark:bg-blue-950/30">
						<div className="flex items-start gap-3">
							<svg
								className="h-5 w-5 flex-shrink-0 text-blue-600 dark:text-blue-400"
								fill="none"
								viewBox="0 0 24 24"
								stroke="currentColor"
							>
								<path
									strokeLinecap="round"
									strokeLinejoin="round"
									strokeWidth={2}
									d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
								/>
							</svg>
							<div className="flex-1">
								<h3 className="font-semibold text-blue-900 dark:text-blue-100">
									Modo de privacidad activo
								</h3>
								<p className="mt-1 text-sm text-blue-800 dark:text-blue-300">
									Los datos de la conversación y el perfil del cliente han sido
									eliminados automáticamente. Solo se conserva el análisis y
									puntaje de esta sesión.
								</p>
							</div>
						</div>
					</div>
				</div>
			)}

			{/* Main content */}
			<div className="mx-auto max-w-7xl p-4 lg:p-6">
				<AnalysisView
					sessionId={sessionId}
					analysis={analysis ?? null}
					persona={personaSnapshot?.persona ?? null}
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
