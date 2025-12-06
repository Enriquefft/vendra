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
		"Genera un cliente peruano realista para una simulación de venta. " +
		"Crea un personaje con personalidad auténtica, microcontradicciones sutiles y motivaciones humanas complejas. Responde en JSON válido.";

	// Instrucciones específicas por tipo de contacto
	const contactTypeInstructions = {
		cold_call:
			"- Este cliente NO conoce al vendedor ni el producto específico. Genera un perfil de alguien con necesidades genéricas que el vendedor deberá descubrir.\n- NO menciones el producto específico en motivaciones/dolores, usa necesidades generales.",
		follow_up:
			"- Este cliente ya tuvo un contacto previo con el vendedor. Debe tener cierta familiaridad o memoria del producto.\n- Puede incluir el producto en su contexto de forma natural.",
		inbound_callback:
			"- Este cliente mostró interés activo y solicitó la llamada. Debe tener motivaciones claras y preguntas específicas.\n- Genera alguien proactivo con necesidades bien definidas.",
	};

	const userPrompt = `Crea un cliente simulado según este escenario. Devuelve un objeto JSON con las claves:
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

IMPORTANTE - Tipo de contacto: ${config.contactType}
${contactTypeInstructions[config.contactType]}

- Ubicación y contexto deben sentirse peruanos/latam
- La historia breve (briefStory) debe ser un párrafo narrativo natural, no una lista
- Personalidad debe tener pequeñas contradicciones (ej: "analítico pero a veces impulsivo")
- Alinea motivaciones y dolores con el perfil objetivo
- Personalidad psicológica debe ser coherente con la intensidad del cliente (${config.simulationPreferences.clientIntensity})
- Usa español neutro latinoamericano
- No incluyas texto adicional fuera del JSON.`;
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
