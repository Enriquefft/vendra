import type { PersonaProfile, ScenarioConfig } from "@/db/schema/simulation";
import { personaProfileSchema } from "@/lib/schemas/session";
import { completeJson } from "./ai";

function buildMockPersona(config: ScenarioConfig): PersonaProfile {
	const intensity = config.simulationPreferences.clientIntensity;

	// Generate psychology based on intensity
	const agreeableness =
		intensity === "tranquilo" ? 80 : intensity === "dificil" ? 25 : 50;
	const neuroticism =
		intensity === "tranquilo" ? 20 : intensity === "dificil" ? 75 : 50;
	const openness = 60;
	const conscientiousness = 65;
	const extraversion = 55;

	return {
		age: 35,
		briefStory:
			"Profesional peruano que busca soluciones prácticas y rápidas sin perder de vista su presupuesto.",
		callAttitude:
			intensity === "dificil"
				? "Escéptico pero abierto a buenos argumentos"
				: "Curioso y con ganas de entender la propuesta",
		decisionContext: {
			budgetRange: { max: 5000, min: 2000 },
			competitorsConsidered: ["Competidor A", "Competidor B"],
			keyDecisionCriteria: ["precio", "calidad", "tiempo de entrega"],
			priorExperience: "neutral",
			timeframe: "short_term",
		},
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
			intensity === "tranquilo" ? "Colaborador" : "Desafiante",
			"Pragmático",
		],
		preferredChannel: config.targetProfile.preferredChannel,
		psychology: {
			bigFive: {
				agreeableness,
				conscientiousness,
				extraversion,
				neuroticism,
				openness,
			},
			communicationStyle: {
				directness: agreeableness > 60 ? "indirect" : "direct",
				emotionalExpression: extraversion > 60 ? "expressive" : "moderate",
				formality: "professional",
				verbosity: extraversion > 60 ? "verbose" : "moderate",
			},
			emotionalBaseline: {
				arousal: extraversion,
				engagement: openness,
				trust: agreeableness * 0.7,
				valence: neuroticism > 60 ? -20 : neuroticism < 40 ? 20 : 0,
			},
			salesProfile: {
				authorityLevel: 70,
				decisionSpeed: neuroticism > 60 ? 35 : 55,
				priceSensitivity: 60,
				riskTolerance: 100 - neuroticism,
				trustThreshold: agreeableness,
			},
		},
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

	const userPrompt = `Crea un cliente simulado con un perfil psicológico realista según este escenario. Devuelve un objeto JSON con las claves:
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
  "callAttitude": string,
  "psychology": {
    "bigFive": {
      "openness": number (0-100),
      "conscientiousness": number (0-100),
      "extraversion": number (0-100),
      "agreeableness": number (0-100),
      "neuroticism": number (0-100)
    },
    "salesProfile": {
      "riskTolerance": number (0-100),
      "decisionSpeed": number (0-100),
      "authorityLevel": number (0-100),
      "priceSensitivity": number (0-100),
      "trustThreshold": number (0-100)
    },
    "communicationStyle": {
      "verbosity": "terse" | "moderate" | "verbose",
      "formality": "casual" | "professional" | "formal",
      "directness": "indirect" | "balanced" | "direct",
      "emotionalExpression": "reserved" | "moderate" | "expressive"
    },
    "emotionalBaseline": {
      "valence": number (-100 to 100),
      "arousal": number (0-100),
      "trust": number (0-100),
      "engagement": number (0-100)
    }
  },
  "decisionContext": {
    "budgetRange": { "min": number, "max": number },
    "timeframe": "immediate" | "short_term" | "long_term" | "indefinite",
    "priorExperience": "none" | "bad" | "neutral" | "positive",
    "competitorsConsidered": string[],
    "keyDecisionCriteria": string[]
  }
}

Escenario de venta: ${JSON.stringify(config, null, 2)}

IMPORTANTE - Tipo de contacto: ${config.contactType}
${contactTypeInstructions[config.contactType]}

INSTRUCCIONES PSICOLÓGICAS:
- **Big Five**: Genera puntuaciones realistas (0-100) para cada dimensión
  - Openness: curiosidad, receptividad a nuevas ideas
  - Conscientiousness: organización, necesidad de información
  - Extraversion: nivel de conversación, energía social
  - Agreeableness: cooperación vs escepticismo
  - Neuroticism: volatilidad emocional, ansiedad

- **Sales Profile**: Genera características de compra (0-100)
  - riskTolerance: comodidad con incertidumbre
  - decisionSpeed: rapidez de decisión (0=muy lento, 100=impulsivo)
  - authorityLevel: puede decidir solo (0=necesita aprobación, 100=decide solo)
  - priceSensitivity: sensibilidad al precio (0=enfocado en valor, 100=enfocado en precio)
  - trustThreshold: facilidad para confiar (0=desconfiado, 100=confía fácil)

- **Communication Style**: Determina cómo se comunica el cliente
  - verbosity: basado en extraversion y educationLevel
  - formality: basado en socioeconomicLevel y occupation
  - directness: basado en agreeableness
  - emotionalExpression: basado en extraversion y neuroticism

- **Emotional Baseline**: Estado emocional natural (cuando no está frustrado/emocionado)
  - valence: -100 (pesimista) a 100 (optimista) - influenciado por neuroticism
  - arousal: 0 (tranquilo) a 100 (energético) - influenciado por extraversion
  - trust: confianza inicial en vendedores (0-100) - influenciado por agreeableness
  - engagement: nivel natural de atención (0-100) - influenciado por openness

- **Decision Context**: Contexto de compra realista
  - budgetRange: rango realista según socioeconomicLevel (en soles peruanos)
  - timeframe: urgencia de la decisión
  - priorExperience: experiencia previa con productos similares
  - competitorsConsidered: 1-3 alternativas que está considerando
  - keyDecisionCriteria: 2-4 factores clave en su decisión (ej: "precio", "calidad", "garantía")

COHERENCIA PSICOLÓGICA:
- Los rasgos Big Five deben reflejarse en personalityTraits
- La intensidad del cliente (${config.simulationPreferences.clientIntensity}) debe reflejarse en:
  - "tranquilo": agreeableness alto (70-90), neuroticism bajo (10-30)
  - "neutro": valores moderados (40-60)
  - "dificil": agreeableness bajo (10-40), neuroticism alto (60-90)
- communicationStyle debe ser coherente con personality
- emotionalBaseline debe derivar lógicamente de Big Five

OTRAS INSTRUCCIONES:
- Ubicación y contexto deben sentirse peruanos/latam
- La historia breve (briefStory) debe ser un párrafo narrativo natural, no una lista
- Personalidad debe tener pequeñas contradicciones (ej: "analítico pero a veces impulsivo")
- Alinea motivaciones y dolores con el perfil objetivo
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
