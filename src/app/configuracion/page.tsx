import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";

import { auth } from "@/auth";
import type { PersonaProfile } from "@/db/schema/simulation";
import {
	type ScenarioConfigInput,
	scenarioConfigSchema,
} from "@/lib/schemas/session";

import { ScenarioConfigForm } from "./scenario-config-form";
import { type CreateSessionState, initialCreateSessionState } from "./types";

function parseList(value: FormDataEntryValue | null): string[] {
	if (!value) return [];

	return value
		.toString()
		.split(/\r?\n|,/)
		.map((entry) => entry.trim())
		.filter(Boolean);
}

async function createSessionAction(
	_state: CreateSessionState,
	formData: FormData,
): Promise<CreateSessionState> {
	"use server";

	const session = await auth.api.getSession({
		headers: await headers(),
	});

	if (!session) {
		redirect("/login");
	}

	const scenarioConfig: ScenarioConfigInput = {
		callObjective: (formData.get("callObjective") ?? "").toString(),
		contactType: (formData.get("contactType") ??
			"cold_call") as ScenarioConfigInput["contactType"],
		description: (formData.get("description") ?? "").toString(),
		priceDetails: (() => {
			const raw = formData.get("priceDetails")?.toString().trim();
			return raw ? raw : undefined;
		})(),
		productName: (formData.get("productName") ?? "").toString(),
		simulationPreferences: {
			allowHangups: formData.get("allowHangups") === "on",
			clientIntensity: (formData.get("clientIntensity") ??
				"neutro") as ScenarioConfigInput["simulationPreferences"]["clientIntensity"],
			maxDurationMinutes: Number(formData.get("maxDurationMinutes") ?? 0),
			realism: (formData.get("realism") ??
				"humano") as ScenarioConfigInput["simulationPreferences"]["realism"],
		},
		targetProfile: {
			ageRange: (formData.get("ageRange") ?? "").toString(),
			decisionStyle: (formData.get("decisionStyle") ?? "").toString(),
			educationLevel: (formData.get("educationLevel") ?? "").toString(),
			gender: (() => {
				const raw = formData.get("gender")?.toString().trim();
				return raw ? raw : undefined;
			})(),
			location: (formData.get("location") ?? "").toString(),
			motivations: parseList(formData.get("motivations")),
			pains: parseList(formData.get("pains")),
			preferredChannel: (formData.get("preferredChannel") ?? "").toString(),
			socioeconomicLevel: (formData.get("socioeconomicLevel") ?? "").toString(),
		},
	};

	const validation = scenarioConfigSchema.safeParse(scenarioConfig);

	if (!validation.success) {
		const issues = validation.error.issues
			.map((issue) => issue.message)
			.filter(Boolean)
			.join(" · ")
			.slice(0, 280);

		return {
			message: issues || "Revisa la configuración del escenario.",
			status: "error",
		};
	}

	try {
		const origin =
			(await headers()).get("origin") ??
			// biome-ignore lint/complexity/useLiteralKeys: process.env requires bracket access with noPropertyAccessFromIndexSignature
			process.env["NEXT_PUBLIC_APP_URL"] ??
			"http://localhost:3000";
		const cookieHeader = (await cookies())
			.getAll()
			.map(({ name, value }) => `${name}=${value}`)
			.join("; ");

		const response = await fetch(`${origin}/api/session`, {
			body: JSON.stringify(validation.data),
			cache: "no-store",
			headers: {
				"Content-Type": "application/json",
				cookie: cookieHeader,
			},
			method: "POST",
		});

		if (!response.ok) {
			const errorBody = (await response.json().catch(() => null)) as {
				error?: string;
			} | null;

			return {
				message:
					errorBody?.error ?? "No se pudo crear la sesión de simulación.",
				status: "error",
			};
		}

		const result = (await response.json()) as {
			mocked?: boolean;
			persona: PersonaProfile;
			sessionId: string;
		};

		return {
			mocked: result.mocked,
			persona: result.persona,
			sessionId: result.sessionId,
			status: "success",
		};
	} catch (error) {
		console.error(error);

		return {
			message: "Hubo un problema al crear la sesión. Inténtalo nuevamente.",
			status: "error",
		};
	}
}

export default async function ConfigurationPage() {
	const session = await auth.api.getSession({
		headers: await headers(),
	});

	if (!session) {
		redirect("/login");
	}

	return (
		<main className="mx-auto flex min-h-screen max-w-6xl flex-col gap-10 px-6 py-12">
			<section className="rounded-3xl bg-gradient-to-br from-blue-900 via-slate-900 to-slate-950 p-10 text-white shadow-2xl">
				<p className="text-sm uppercase tracking-[0.25em] text-blue-200">
					Configuración
				</p>
				<h1 className="mt-2 text-4xl font-bold">Define tu escenario</h1>
				<p className="mt-3 max-w-3xl text-lg text-slate-200">
					Completa los detalles del producto, el perfil objetivo y las
					preferencias de simulación. Generaremos un cliente realista vinculado
					a tu sesión.
				</p>
			</section>

			<ScenarioConfigForm
				action={createSessionAction}
				initialState={initialCreateSessionState}
			/>
		</main>
	);
}
