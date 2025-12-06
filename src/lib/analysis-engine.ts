import { asc, eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import {
	analyses,
	conversationTurns,
	type ImprovementItem,
	type KeyMoment,
	type PersonaProfile,
	type PsychologicalState,
	personaSnapshots,
	psychologicalStates,
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
 * Loads the psychological state for a given session.
 */
async function loadPsychologicalState(
	sessionId: string,
): Promise<PsychologicalState | null> {
	const stateRecord = await db.query.psychologicalStates.findFirst({
		where: eq(psychologicalStates.sessionId, sessionId),
	});
	return stateRecord?.state ?? null;
}

/**
 * Builds the system prompt for the analysis.
 */
function buildAnalysisSystemPrompt(): string {
	return `Eres un coach experto en ventas B2C/P2C en Latinoamérica, especializado en evaluar llamadas de venta en el contexto peruano con enfoque en psicología del consumidor.

Tu tarea es analizar una conversación de ventas y producir un análisis estructurado con:
1. Un puntaje global de 0 a 100
2. Una lista de aciertos (cosas que el vendedor hizo bien)
3. Una lista de oportunidades de mejora con acciones concretas
4. Momentos clave de la conversación con citas textuales

Analiza la conversación de forma integral. Observa cómo cada dimensión (rapport, descubrimiento, valor, manejo de objeciones, etc.) se relaciona entre sí. Proporciona retroalimentación específica citando momentos exactos de la conversación.

## Dimensiones a evaluar:
- **Rapport**: ¿El vendedor estableció conexión personal con el cliente?
- **Descubrimiento**: ¿Hizo preguntas para entender las necesidades del cliente?
- **Valor**: ¿Comunicó claramente el valor del producto/servicio?
- **Manejo de objeciones**: ¿Respondió adecuadamente a las dudas o resistencias?
- **Avance hacia cierre**: ¿Guió la conversación hacia una decisión?
- **Comunicación**: ¿Fue claro, profesional y empático?
- **Control de la llamada**: ¿Mantuvo el flujo de la conversación?
- **Uso del tiempo**: ¿Fue eficiente sin apurar al cliente?

## **NUEVO: Evaluación Psicológica**
Si se proporciona información de trayectoria emocional del cliente, evalúa también:
- **Construcción de confianza**: ¿El vendedor logró incrementar la confianza del cliente a lo largo de la conversación?
- **Gestión emocional**: ¿Detectó y respondió apropiadamente a los cambios emocionales del cliente (frustración, entusiasmo, confusión)?
- **Adaptación al estilo de decisión**: ¿Ajustó su enfoque a la velocidad y estilo de decisión del cliente?
- **Progresión en etapas de compra**: ¿Avanzó efectivamente al cliente a través de las etapas de decisión?

Nota: Estas dimensiones están interrelacionadas. Por ejemplo, un mal descubrimiento generalmente lleva a un pobre manejo de objeciones. Evalúa el desempeño de forma holística, no como checklist.

Sé específico y constructivo en las mejoras. Cita textualmente los momentos clave usando las citas exactas de la conversación. Los turnId deben ser los IDs exactos proporcionados. El puntaje debe reflejar el desempeño real. Las mejoras deben ser accionables y específicas.

**Si hay datos psicológicos**: Menciona explícitamente cómo el vendedor pudo/no pudo adaptarse al perfil psicológico del cliente.

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
 * Builds the user prompt with conversation context and psychological trajectory.
 */
function buildAnalysisUserPrompt(
	persona: PersonaProfile,
	scenario: ScenarioConfig,
	turns: StoredConversationTurn[],
	psychState: PsychologicalState | null,
): string {
	const conversationText = turns
		.map((turn) => {
			const speaker = turn.role === "seller" ? "VENDEDOR" : "CLIENTE";
			return `[Turno ${turn.turnIndex}] [ID: ${turn.id}] ${speaker}: "${turn.content}"`;
		})
		.join("\n\n");

	// Build psychological trajectory if available
	let psychologicalContext = "";
	if (psychState && persona.psychology) {
		// Analyze emotional trajectory
		const initialTrust = psychState.emotionHistory[0]?.emotions.trust || 40;
		const finalTrust = psychState.currentEmotions.trust;
		const trustChange = finalTrust - initialTrust;

		const initialFrustration =
			psychState.emotionHistory[0]?.emotions.frustration || 0;
		const finalFrustration = psychState.currentEmotions.frustration;

		const initialConfusion =
			psychState.emotionHistory[0]?.emotions.confusion || 20;
		const finalConfusion = psychState.currentEmotions.confusion;

		psychologicalContext = `

## **TRAYECTORIA PSICOLÓGICA DEL CLIENTE**

**Perfil Psicológico:**
- Big Five: Apertura ${persona.psychology.bigFive.openness}/100, Responsabilidad ${persona.psychology.bigFive.conscientiousness}/100, Extraversión ${persona.psychology.bigFive.extraversion}/100, Amabilidad ${persona.psychology.bigFive.agreeableness}/100, Neuroticismo ${persona.psychology.bigFive.neuroticism}/100
- Tolerancia al riesgo: ${persona.psychology.salesProfile.riskTolerance}/100
- Velocidad de decisión: ${persona.psychology.salesProfile.decisionSpeed}/100 (${persona.psychology.salesProfile.decisionSpeed > 70 ? "rápido" : persona.psychology.salesProfile.decisionSpeed < 30 ? "muy deliberado" : "moderado"})
- Sensibilidad al precio: ${persona.psychology.salesProfile.priceSensitivity}/100
- Umbral de confianza: ${persona.psychology.salesProfile.trustThreshold}/100 (${persona.psychology.salesProfile.trustThreshold < 40 ? "difícil de ganar confianza" : "confía relativamente fácil"})

**Evolución Emocional:**
- Confianza: ${initialTrust} → ${finalTrust} (${trustChange > 0 ? `+${trustChange}` : trustChange} puntos) ${trustChange > 10 ? "✓ Incrementó confianza" : trustChange < -10 ? "✗ Perdió confianza" : "≈ Sin cambio significativo"}
- Frustración: ${initialFrustration} → ${finalFrustration} ${finalFrustration > 60 ? "✗ Cliente muy frustrado" : finalFrustration < 30 ? "✓ Cliente tranquilo" : ""}
- Confusión: ${initialConfusion} → ${finalConfusion} ${finalConfusion > 60 ? "✗ Cliente confundido" : finalConfusion < initialConfusion ? "✓ Claridad mejoró" : ""}

**Progresión de Decisión:**
- Etapa inicial: ${psychState.emotionHistory[0]?.emotions ? "unaware/problem_aware" : "N/A"}
- Etapa final: ${psychState.decisionProgression.stage}
- Confianza en decisión: ${psychState.decisionProgression.confidence}/100
${psychState.decisionProgression.blockers.length > 0 ? `- Bloqueadores sin resolver: ${psychState.decisionProgression.blockers.join(", ")}` : ""}

**Relación Construida:**
- Etapa: ${psychState.relationshipState.stage} (${psychState.relationshipState.positiveInteractions} interacciones positivas, ${psychState.relationshipState.negativeInteractions} negativas)

**Memoria de Conversación:**
${psychState.conversationMemory.objectionsRaised.length > 0 ? `- Objeciones levantadas: ${psychState.conversationMemory.objectionsRaised.filter((o) => !o.resolved).length} sin resolver de ${psychState.conversationMemory.objectionsRaised.length} total` : "- Sin objeciones registradas"}
${psychState.conversationMemory.questionsAsked.length > 0 ? `- Preguntas del cliente: ${psychState.conversationMemory.questionsAsked.filter((q) => !q.answered).length} sin responder de ${psychState.conversationMemory.questionsAsked.length} total` : ""}
${psychState.conversationMemory.sellerPromises.length > 0 ? `- Promesas del vendedor: ${psychState.conversationMemory.sellerPromises.filter((p) => !p.fulfilled).length} sin cumplir de ${psychState.conversationMemory.sellerPromises.length} total` : ""}

**INSTRUCCIONES DE ANÁLISIS PSICOLÓGICO:**
Evalúa específicamente cómo el vendedor:
1. Adaptó su enfoque al perfil psicológico del cliente (Big Five, estilo de decisión)
2. Respondió a los cambios emocionales del cliente
3. Construyó (o no) confianza progresivamente
4. Manejó las objeciones y preguntas
5. Avanzó al cliente a través de las etapas de decisión
`;
	}

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
${psychologicalContext}

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

	// Load psychological state (may be null for old sessions)
	const psychState = await loadPsychologicalState(sessionId);

	// Build prompts with psychological trajectory
	const systemPrompt = buildAnalysisSystemPrompt();
	const userPrompt = buildAnalysisUserPrompt(
		persona,
		scenario,
		turns,
		psychState,
	);

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
