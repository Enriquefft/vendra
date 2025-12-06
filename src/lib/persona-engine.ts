import type { PersonaProfile, ScenarioConfig } from "@/db/schema/simulation";
import { personaProfileSchema } from "@/lib/schemas/session";
import { completeJson } from "./ai";

function buildMockPersona(config: ScenarioConfig): PersonaProfile {
	return {
		age: 35,
		briefStory:
			"Profesional peruano que busca soluciones prácticas y rápidas sin perder de vista su presupuesto.",
		callAttitude:
			config.simulationPreferences.clientIntensity === "dificil"
				? "Escéptico pero abierto a buenos argumentos"
				: "Curioso y con ganas de entender la propuesta",
		educationLevel: config.targetProfile.educationLevel,
		location: config.targetProfile.location,
		motivations: config.targetProfile.motivations,
		name: "Cliente de prueba",
		occupation:
			config.contactType === "follow_up"
				? "Cliente recurrente"
				: "Profesional independiente",
		pains: config.targetProfile.pains,
		personalityTraits: [
			"Analítico",
			config.simulationPreferences.clientIntensity === "tranquilo"
				? "Colaborador"
				: "Desafiante",
			"Pragmático",
		],
		preferredChannel: config.targetProfile.preferredChannel,
		socioeconomicLevel: config.targetProfile.socioeconomicLevel,
	};
}

export async function generatePersona(
	config: ScenarioConfig,
): Promise<{ persona: PersonaProfile; usedMock: boolean }> {
	const systemPrompt =
		"Eres el PersonaEngine de VENDRA. Genera un cliente peruano realista para una simulación de venta. " +
		"Debes mantener naturalidad, microcontradicciones leves y motivaciones humanas. Responde en JSON válido.";

	const userPrompt = `Configura un cliente simulado según este escenario. Devuelve un objeto JSON con las claves: 
{
  "name": string,
  "age": number,
  "location": string,
  "socioeconomicLevel": string,
  "educationLevel": string,
  "occupation": string,
  "motivations": string[],
  "pains": string[],
  "personalityTraits": string[],
  "preferredChannel": string,
  "briefStory": string,
  "callAttitude": string
}

Escenario de venta: ${JSON.stringify(config, null, 2)}
- Ubicación y contexto deben sentirse peruanos/latam.
- Alinea motivaciones y dolores con el producto y el objetivo de la llamada.
- Personalidad psicológica debe ser coherente con la intensidad del cliente.
- Usa español neutro. No incluyas texto adicional fuera del JSON.`;
	const { object, isMock } = await completeJson(
		{
			messages: [
				{ content: systemPrompt, role: "system" },
				{ content: userPrompt, role: "user" },
			],
			temperature: 0.9,
		},
		personaProfileSchema,
		{
			mockContent: () =>
				JSON.stringify(
					buildMockPersona({
						...config,
						simulationPreferences: {
							...config.simulationPreferences,
							maxDurationMinutes:
								config.simulationPreferences.maxDurationMinutes || 10,
						},
					}),
				),
		},
	);

	return { persona: object, usedMock: isMock };
}
