import { asc, eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import {
	analyses,
	conversationTurns,
	type ImprovementItem,
	type KeyMoment,
	type PersonaProfile,
	personaSnapshots,
	type ScenarioConfig,
	simulationSessions,
} from "@/db/schema/simulation";
import { completeJson } from "./ai";

/**
 * Schema for key moments in the analysis.
 */
export const keyMomentSchema = z.object({
	insight: z.string().min(1),
	quote: z.string().min(1),
	recommendation: z.string().min(1),
	turnId: z.string().min(1),
});

/**
 * Schema for improvement items in the analysis.
 */
export const improvementItemSchema = z.object({
	action: z.string().min(1),
	title: z.string().min(1),
});

/**
 * Schema for the full analysis output from the AI.
 */
export const analysisOutputSchema = z.object({
	improvements: z.array(improvementItemSchema).min(1),
	keyMoments: z.array(keyMomentSchema).min(1),
	score: z.number().int().min(0).max(100),
	successes: z.array(z.string()).min(0),
});

export type AnalysisOutput = z.infer<typeof analysisOutputSchema>;

/**
 * Stored conversation turn with ID for reference in key moments.
 */
export type StoredConversationTurn = {
	content: string;
	id: string;
	role: "seller" | "client";
	turnIndex: number;
};

/**
 * Input for the AnalysisEngine.
 */
export type AnalysisInput = {
	sessionId: string;
};

/**
 * Output from the AnalysisEngine.
 */
export type AnalysisResult = {
	analysisId: string;
	improvements: ImprovementItem[];
	keyMoments: KeyMoment[];
	score: number;
	successes: string[];
	usedMock: boolean;
};

function buildMockAnalysisOutput(
	persona: PersonaProfile,
	scenario: ScenarioConfig,
	turns: StoredConversationTurn[],
): AnalysisOutput {
	const sellerTurns = turns.filter((turn) => turn.role === "seller");
	const clientTurns = turns.filter((turn) => turn.role === "client");
	const baseScore =
		70 + Math.min(10, sellerTurns.length) - Math.max(0, clientTurns.length - 5);

	return {
		improvements: [
			{
				action:
					"Haz una pregunta adicional sobre las prioridades del cliente para personalizar mejor el valor.",
				title: "Profundiza en necesidades",
			},
			{
				action:
					"Cierra cada bloque con un siguiente paso claro y confirma disponibilidad.",
				title: "Marca el siguiente paso",
			},
		],
		keyMoments: [
			{
				insight:
					"La conversación avanzó y el cliente entendió el valor principal.",
				quote: clientTurns.at(-1)?.content ?? "Quiero pensarlo un poco más.",
				recommendation:
					"Refuerza la urgencia con un beneficio claro y fecha límite.",
				turnId: turns[turns.length - 1]?.id ?? "turno-final",
			},
		],
		score: Math.max(55, Math.min(95, baseScore)),
		successes: [
			`Explicaste el valor de ${scenario.productName} de forma clara para ${persona.name}.`,
			"Mantuviste el control de la llamada con preguntas guiadas.",
		],
	};
}

/**
 * Loads the persona for a given session.
 */
async function loadPersona(sessionId: string): Promise<PersonaProfile | null> {
	const snapshot = await db.query.personaSnapshots.findFirst({
		where: eq(personaSnapshots.sessionId, sessionId),
	});
	return snapshot?.persona ?? null;
}

/**
 * Loads the scenario config for a given session.
 */
async function loadScenarioConfig(
	sessionId: string,
): Promise<ScenarioConfig | null> {
	const session = await db.query.simulationSessions.findFirst({
		where: eq(simulationSessions.id, sessionId),
	});
	return session?.scenarioConfig ?? null;
}

/**
 * Loads full conversation history with turn IDs for a given session.
 */
async function loadConversationWithIds(
	sessionId: string,
): Promise<StoredConversationTurn[]> {
	const turns = await db.query.conversationTurns.findMany({
		orderBy: [asc(conversationTurns.turnIndex)],
		where: eq(conversationTurns.sessionId, sessionId),
	});

	return turns.map((turn) => ({
		content: turn.content,
		id: turn.id,
		role: turn.role,
		turnIndex: turn.turnIndex,
	}));
}

/**
 * Builds the system prompt for the analysis.
 */
function buildAnalysisSystemPrompt(): string {
	return `Eres el AnalysisEngine de VENDRA, un sistema de análisis de ventas especializado en evaluar llamadas de venta P2C (persona a consumidor) en el contexto peruano/latinoamericano.

Tu tarea es analizar una conversación de ventas y producir un análisis estructurado con:
1. Un puntaje global de 0 a 100
2. Una lista de aciertos (cosas que el vendedor hizo bien)
3. Una lista de oportunidades de mejora con acciones concretas
4. Momentos clave de la conversación con citas textuales

## Dimensiones a evaluar (cada una pesa aproximadamente igual):
- **Rapport**: ¿El vendedor estableció conexión personal con el cliente?
- **Descubrimiento**: ¿Hizo preguntas para entender las necesidades del cliente?
- **Valor**: ¿Comunicó claramente el valor del producto/servicio?
- **Manejo de objeciones**: ¿Respondió adecuadamente a las dudas o resistencias?
- **Avance hacia cierre**: ¿Guió la conversación hacia una decisión?
- **Comunicación**: ¿Fue claro, profesional y empático?
- **Control de la llamada**: ¿Mantuvo el flujo de la conversación?
- **Uso del tiempo**: ¿Fue eficiente sin apurar al cliente?

## Reglas importantes:
1. Sé específico y constructivo en las mejoras
2. Cita textualmente los momentos clave (usa las citas exactas de la conversación)
3. Los turnId deben ser los IDs exactos proporcionados en la conversación
4. El puntaje debe reflejar el desempeño real, no ser artificialmente alto o bajo
5. Las mejoras deben ser accionables y específicas

Responde SOLO en JSON válido con este formato exacto:
{
  "score": <número de 0 a 100>,
  "successes": ["acierto 1", "acierto 2", ...],
  "improvements": [
    {"title": "título corto", "action": "acción específica a tomar"},
    ...
  ],
  "keyMoments": [
    {"turnId": "id-del-turno", "quote": "cita textual exacta", "insight": "por qué es importante", "recommendation": "qué hacer diferente o reforzar"},
    ...
  ]
}`;
}

/**
 * Builds the user prompt with conversation context.
 */
function buildAnalysisUserPrompt(
	persona: PersonaProfile,
	scenario: ScenarioConfig,
	turns: StoredConversationTurn[],
): string {
	const conversationText = turns
		.map((turn) => {
			const speaker = turn.role === "seller" ? "VENDEDOR" : "CLIENTE";
			return `[Turno ${turn.turnIndex}] [ID: ${turn.id}] ${speaker}: "${turn.content}"`;
		})
		.join("\n\n");

	return `## Contexto del escenario
- Producto: ${scenario.productName}
- Descripción: ${scenario.description}
${scenario.priceDetails ? `- Precio/condiciones: ${scenario.priceDetails}` : ""}
- Objetivo de la llamada: ${scenario.callObjective}
- Tipo de contacto: ${scenario.contactType}
- Intensidad del cliente: ${scenario.simulationPreferences.clientIntensity}

## Perfil del cliente simulado
- Nombre: ${persona.name}
- Edad: ${persona.age} años
- Ubicación: ${persona.location}
- Nivel socioeconómico: ${persona.socioeconomicLevel}
- Ocupación: ${persona.occupation}
- Rasgos de personalidad: ${persona.personalityTraits.join(", ")}
- Motivaciones: ${persona.motivations.join(", ")}
- Dolores: ${persona.pains.join(", ")}
- Actitud en la llamada: ${persona.callAttitude}

## Conversación completa
${conversationText}

---
Analiza esta conversación de ventas y proporciona tu evaluación en el formato JSON especificado.`;
}

/**
 * Checks if an analysis already exists for a session.
 */
async function existingAnalysis(
	sessionId: string,
): Promise<{ id: string } | null> {
	const existing = await db.query.analyses.findFirst({
		where: eq(analyses.sessionId, sessionId),
	});
	return existing ? { id: existing.id } : null;
}

/**
 * Saves the analysis to the database.
 */
async function saveAnalysis(
	sessionId: string,
	output: AnalysisOutput,
): Promise<string> {
	const [inserted] = await db
		.insert(analyses)
		.values({
			improvements: output.improvements,
			keyMoments: output.keyMoments,
			score: output.score,
			sessionId,
			successes: output.successes,
		})
		.returning({ id: analyses.id });

	if (!inserted) {
		throw new Error("No se pudo guardar el análisis");
	}

	return inserted.id;
}

/**
 * Main analysis function that evaluates a completed sales conversation.
 *
 * 1. Loads persona, scenario config, and conversation
 * 2. Builds prompts for OpenAI analysis
 * 3. Calls OpenAI to generate structured analysis
 * 4. Saves the analysis to the database
 * 5. Returns the analysis result
 */
export async function analyzeSession(
	input: AnalysisInput,
): Promise<AnalysisResult> {
	const { sessionId } = input;

	// Check if analysis already exists
	const existing = await existingAnalysis(sessionId);
	if (existing) {
		throw new Error("Ya existe un análisis para esta sesión");
	}

	// Load persona
	const persona = await loadPersona(sessionId);
	if (!persona) {
		throw new Error("Persona no encontrada para esta sesión");
	}

	// Load scenario config
	const scenario = await loadScenarioConfig(sessionId);
	if (!scenario) {
		throw new Error("Configuración de escenario no encontrada");
	}

	// Load conversation with IDs
	const turns = await loadConversationWithIds(sessionId);
	if (turns.length === 0) {
		throw new Error("No hay turnos de conversación para analizar");
	}

	// Build prompts
	const systemPrompt = buildAnalysisSystemPrompt();
	const userPrompt = buildAnalysisUserPrompt(persona, scenario, turns);

	// Call AI provider
	const { object: parsed, isMock } = await completeJson(
		{
			messages: [
				{ content: systemPrompt, role: "system" },
				{ content: userPrompt, role: "user" },
			],
			temperature: 0.7,
		},
		analysisOutputSchema,
		{
			mockContent: () =>
				JSON.stringify(buildMockAnalysisOutput(persona, scenario, turns)),
		},
	);

	// Save analysis to database
	const analysisId = await saveAnalysis(sessionId, parsed);

	return {
		analysisId,
		improvements: parsed.improvements,
		keyMoments: parsed.keyMoments,
		score: parsed.score,
		successes: parsed.successes,
		usedMock: isMock,
	};
}

/**
 * Retrieves an existing analysis for a session.
 */
export async function getAnalysis(
	sessionId: string,
): Promise<AnalysisResult | null> {
	const analysis = await db.query.analyses.findFirst({
		where: eq(analyses.sessionId, sessionId),
	});

	if (!analysis) {
		return null;
	}

	return {
		analysisId: analysis.id,
		improvements: analysis.improvements,
		keyMoments: analysis.keyMoments,
		score: analysis.score,
		successes: analysis.successes,
		usedMock: false,
	};
}
