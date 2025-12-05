import type { Metadata } from "next";
import { ScenarioConfigForm } from "@/app/configuracion/scenario-config-form";
import {
	type CreateSessionState,
	initialCreateSessionState,
} from "@/app/configuracion/types";
import { AnalysisView } from "@/components/analysis-view";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import {
	analysisFixture,
	personaFixture,
	scenarioConfigFixture,
	turnFixtures,
} from "@/testing/fixtures";

export const metadata: Metadata = {
	description: "Escenario de pruebas E2E con datos simulados",
	title: "E2E Harness",
};

async function createMockSession(
	_state: CreateSessionState,
	formData: FormData,
): Promise<CreateSessionState> {
	"use server";

	const productName = formData.get("productName")?.toString().trim();
	const description = formData.get("description")?.toString().trim();
	const callObjective = formData.get("callObjective")?.toString().trim();
	const ageRange = formData.get("ageRange")?.toString().trim();
	const location = formData.get("location")?.toString().trim();
	const socioeconomicLevel = formData
		.get("socioeconomicLevel")
		?.toString()
		.trim();
	const preferredChannel = formData.get("preferredChannel")?.toString().trim();
	const motivations = formData.get("motivations")?.toString().trim();
	const pains = formData.get("pains")?.toString().trim();

	if (
		!productName ||
		!description ||
		!callObjective ||
		!ageRange ||
		!location ||
		!socioeconomicLevel ||
		!preferredChannel ||
		!motivations ||
		!pains
	) {
		return {
			message:
				"Completa los campos requeridos para generar el cliente de prueba.",
			status: "error",
		};
	}

	return {
		mocked: true,
		persona: personaFixture,
		sessionId: "e2e-session-1",
		status: "success",
	};
}

export default function E2EHarnessPage() {
	return (
		<main className="mx-auto flex min-h-screen max-w-6xl flex-col gap-8 px-6 py-12">
			<section className="rounded-3xl bg-gradient-to-br from-blue-900 via-slate-900 to-slate-950 p-10 text-white shadow-2xl">
				<p className="text-sm uppercase tracking-[0.25em] text-blue-200">
					Playwright
				</p>
				<h1 className="mt-2 text-4xl font-bold">
					Escenario E2E con datos simulados
				</h1>
				<p className="mt-3 max-w-3xl text-lg text-slate-200">
					Usa este entorno para validar flujos de extremo a extremo sin requerir
					autenticación ni llamadas a la base de datos.
				</p>
			</section>

			<Card>
				<CardHeader>
					<CardTitle>Configura un cliente de prueba</CardTitle>
					<CardDescription>
						El formulario reutiliza el flujo real y devuelve una persona
						simulada cuando los campos requeridos están completos.
					</CardDescription>
				</CardHeader>
				<CardContent>
					<ScenarioConfigForm
						action={createMockSession}
						initialState={initialCreateSessionState}
					/>
				</CardContent>
			</Card>

			<Card>
				<CardHeader>
					<CardTitle>Análisis de demostración</CardTitle>
					<CardDescription>
						Vista de resultados con datos fijos para validar renderizado y
						accesibilidad.
					</CardDescription>
				</CardHeader>
				<CardContent>
					<AnalysisView
						analysis={analysisFixture}
						persona={personaFixture}
						scenarioConfig={scenarioConfigFixture}
						sessionId="e2e-session-1"
						turns={turnFixtures}
					/>
				</CardContent>
			</Card>
		</main>
	);
}
