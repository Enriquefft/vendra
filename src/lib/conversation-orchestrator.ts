import { asc, eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import {
	type ConversationTurnMeta,
	conversationTurns,
	type PersonaProfile,
	type PsychologicalState,
	personaSnapshots,
	psychologicalStates,
	type ScenarioConfig,
	simulationSessions,
} from "@/db/schema/simulation";
import { env } from "@/env";
import { completeJson } from "./ai";
import {
	analyzeSellerTurn,
	type BehaviorGuidance,
	type BigFive,
	type DecisionStage,
	type EmotionalState,
	generateBehaviorGuidance,
	initializeState,
	updateDecisionProgression,
	updateEmotionalState,
	updateMemory,
	updateRelationshipStage,
} from "./psychology-engine";

/**
 * Schema for the client response from the AI.
 */
export const clientResponseSchema = z.object({
	clientText: z.string().min(1),
	interest: z.number().int().min(1).max(10),
	interruption: z.boolean(),
	wantsToEnd: z.boolean(),
});

export type ClientResponse = z.infer<typeof clientResponseSchema>;

/**
 * Schema for generated previous context (follow_up and inbound_callback).
 */
const previousContextSchema = z.object({
	clientMessage: z.string().min(1),
	sellerMessage: z.string().min(1),
});

type PreviousContext = z.infer<typeof previousContextSchema>;

/**
 * Schema for conversation history turns.
 */
export type ConversationTurn = {
	content: string;
	role: "seller" | "client";
	turnIndex: number;
};

/**
 * Input for the ConversationOrchestrator.
 */
export type OrchestratorInput = {
	sellerText: string;
	sessionId: string;
};

/**
 * Output from the ConversationOrchestrator.
 */
export type OrchestratorOutput = {
	clientResponse: ClientResponse;
	sellerTurnId: string;
	clientTurnId: string;
	usedMock: boolean;
};

/**
 * Gets the initial interest level based on contact type.
 */
function getInitialInterestLevel(contactType: string): number {
	switch (contactType) {
		case "cold_call":
			return 3; // Low, skeptical
		case "follow_up":
			return 5; // Medium, already had contact
		case "inbound_callback":
			return 7; // High, client requested call
		default:
			return 5;
	}
}

function buildMockClientReply(
	sellerText: string,
	persona: PersonaProfile,
	scenario: ScenarioConfig,
	history: ConversationTurn[],
): ClientResponse {
	const trimmedSeller = sellerText.trim();
	const baseInterest = getInitialInterestLevel(scenario.contactType);
	const turnInterest = Math.max(
		1,
		Math.min(10, baseInterest + Math.floor(history.length / 2)),
	);

	// For cold calls, don't reveal product knowledge in mock
	const shouldKnowProduct = scenario.contactType !== "cold_call";

	return {
		clientText:
			trimmedSeller.length > 0
				? shouldKnowProduct
					? `${persona.name}: entiendo tu oferta sobre ${scenario.productName}. ${trimmedSeller.slice(0, 140)}`
					: `${persona.name}: ${trimmedSeller.slice(0, 140)}`
				: shouldKnowProduct
					? `${persona.name}: ¿podrías contarme más sobre ${scenario.productName}?`
					: `${persona.name}: ¿de qué se trata esto?`,
		interest: turnInterest,
		interruption: false,
		wantsToEnd: false,
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
 * Loads the psychological state for a given session.
 * Returns null if not found (will be initialized on first turn).
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
 * Saves or updates the psychological state for a session.
 */
async function savePsychologicalState(
	sessionId: string,
	state: PsychologicalState,
): Promise<void> {
	// Try to update existing state
	const existing = await db.query.psychologicalStates.findFirst({
		where: eq(psychologicalStates.sessionId, sessionId),
	});

	if (existing) {
		await db
			.update(psychologicalStates)
			.set({ state, updatedAt: new Date() })
			.where(eq(psychologicalStates.sessionId, sessionId));
	} else {
		// Insert new state
		await db.insert(psychologicalStates).values({
			sessionId,
			state,
		});
	}
}

/**
 * Generates simulated previous context for follow_up and inbound_callback scenarios.
 */
async function generatePreviousContext(
	persona: PersonaProfile,
	scenario: ScenarioConfig,
): Promise<PreviousContext | null> {
	// Only generate for non-cold-call scenarios
	if (scenario.contactType === "cold_call") {
		return null;
	}

	const contextPrompt =
		scenario.contactType === "follow_up"
			? `Genera UN intercambio breve (1 turno vendedor + 1 turno cliente) de una conversación previa entre un vendedor y ${persona.name} sobre ${scenario.productName}.

Contexto: Fue un primer contacto donde el vendedor presentó el producto brevemente y ${persona.name} mostró interés moderado pero no tomó una decisión. Acordaron hablar más adelante.

El vendedor debe:
- Presentarse e introducir ${scenario.productName} brevemente (2-3 oraciones)
- Preguntar si es un buen momento

${persona.name} debe:
- Responder con interés moderado
- Mencionar que no tiene tiempo en ese momento o necesita pensarlo
- Acordar hablar más adelante

Responde en JSON: {"sellerMessage": "...", "clientMessage": "..."}`
			: `Genera UN intercambio breve (1 turno vendedor + 1 turno cliente) donde ${persona.name} inició contacto preguntando sobre ${scenario.productName}.

Contexto: ${persona.name} se comunicó primero (por WhatsApp, formulario web, etc.) mostrando interés. El vendedor respondió brevemente y acordaron esta llamada para hablar con más detalle.

${persona.name} debe:
- Expresar interés inicial en ${scenario.productName}
- Hacer 1-2 preguntas básicas

El vendedor debe:
- Responder brevemente
- Proponer hablar con más detalle en esta llamada

Responde en JSON: {"sellerMessage": "...", "clientMessage": "..."}`;

	const systemPrompt =
		"Genera diálogos realistas de ventas en español latino. Usa lenguaje natural y conversacional.";

	try {
		const { object } = await completeJson(
			{
				messages: [
					{ content: systemPrompt, role: "system" },
					{ content: contextPrompt, role: "user" },
				],
				temperature: 0.8,
			},
			previousContextSchema,
			{
				mockContent: () =>
					JSON.stringify({
						clientMessage:
							scenario.contactType === "follow_up"
								? `Hola, sí me acuerdo de la llamada anterior sobre ${scenario.productName}. Me interesa pero ese día no tenía tiempo. Ahora sí podemos hablar.`
								: `Hola, yo pregunté por ${scenario.productName}. ¿Me puedes dar más detalles?`,
						sellerMessage:
							scenario.contactType === "follow_up"
								? `Hola ${persona.name}, te llamo de seguimiento sobre ${scenario.productName} que conversamos. ¿Tienes unos minutos ahora?`
								: `Hola ${persona.name}, claro que sí. Vi tu consulta sobre ${scenario.productName}. Con gusto te cuento más a detalle en esta llamada.`,
					}),
			},
		);

		return object;
	} catch (error) {
		console.error("Error generating previous context:", error);
		return null;
	}
}

/**
 * Loads conversation history for a given session.
 */
async function loadConversationHistory(
	sessionId: string,
): Promise<ConversationTurn[]> {
	const turns = await db.query.conversationTurns.findMany({
		orderBy: [asc(conversationTurns.turnIndex)],
		where: eq(conversationTurns.sessionId, sessionId),
	});

	return turns.map((turn) => ({
		content: turn.content,
		role: turn.role,
		turnIndex: turn.turnIndex,
	}));
}

/**
 * Gets the next turn index for a session.
 */
async function getNextTurnIndex(sessionId: string): Promise<number> {
	const allTurns = await db.query.conversationTurns.findMany({
		where: eq(conversationTurns.sessionId, sessionId),
	});

	if (allTurns.length === 0) {
		return 0;
	}

	const maxIndex = Math.max(...allTurns.map((t) => t.turnIndex));
	return maxIndex + 1;
}

/**
 * Determines the product knowledge level for cold calls based on persona traits.
 */
function determineColdCallKnowledge(persona: PersonaProfile): string {
	const traits = persona.personalityTraits.map((t) => t.toLowerCase());

	// Variante 3: Escéptico/experimentado
	if (
		traits.some(
			(t) =>
				t.includes("escéptico") ||
				t.includes("desconfiado") ||
				t.includes("analítico") ||
				t.includes("cauteloso"),
		)
	) {
		return "Conoces la categoría general y tienes experiencia con productos similares. Muestra escepticismo o menciona que 'ya tienes algo parecido' o 'ya me han llamado de esto antes'.";
	}

	// Variante 1: Desconocimiento total
	if (
		traits.some(
			(t) =>
				t.includes("curioso") ||
				t.includes("abierto") ||
				t.includes("receptivo") ||
				t.includes("entusiasta"),
		)
	) {
		return "NO CONOCES este producto ni al vendedor. Cuando te lo mencionen, pregunta con curiosidad de qué se trata.";
	}

	// Variante 2: Conocimiento básico (default)
	return "Puedes conocer la categoría general (ej: si venden seguros, sabes qué es un seguro), pero no conoces este producto específico ni la empresa que llama.";
}

/**
 * Builds psychological context for the AI prompt in "full" mode
 */
function buildFullPsychologicalContext(
	emotions: EmotionalState,
	psychState: PsychologicalState,
	behaviorGuidance: BehaviorGuidance,
): string {
	return `
## ESTADO PSICOLÓGICO ACTUAL

**Estado Emocional:**
- Valencia emocional: ${emotions.valence > 0 ? `+${emotions.valence}` : emotions.valence}/100 (${emotions.valence > 30 ? "positivo" : emotions.valence < -30 ? "negativo" : "neutral"})
- Activación: ${emotions.arousal}/100 (${emotions.arousal > 70 ? "muy activado" : emotions.arousal > 40 ? "moderado" : "tranquilo"})
- Confianza en vendedor: ${emotions.trust}/100
- Compromiso/atención: ${emotions.engagement}/100
- Frustración acumulada: ${emotions.frustration}/100
- Entusiasmo por oferta: ${emotions.enthusiasm}/100
- Confusión sobre producto: ${emotions.confusion}/100

**Etapa de Decisión:**
- Etapa actual: ${psychState.decisionProgression.stage}
- Confianza en decisión: ${psychState.decisionProgression.confidence}/100
${psychState.decisionProgression.blockers.length > 0 ? `- Bloqueadores: ${psychState.decisionProgression.blockers.join(", ")}` : ""}
${psychState.decisionProgression.accelerators.length > 0 ? `- Aceleradores: ${psychState.decisionProgression.accelerators.join(", ")}` : ""}

**Relación con Vendedor:**
- Etapa: ${psychState.relationshipState.stage}
- Interacciones positivas: ${psychState.relationshipState.positiveInteractions}
- Interacciones negativas: ${psychState.relationshipState.negativeInteractions}

**Guía de Comportamiento:**
- Tono emocional: ${behaviorGuidance.emotionalTone}
- Longitud de respuesta: ${behaviorGuidance.responseLength === "terse" ? "respuestas cortas" : behaviorGuidance.responseLength === "verbose" ? "respuestas detalladas" : "respuestas moderadas"}
- Nivel de duda: ${behaviorGuidance.hesitationLevel}/10
${behaviorGuidance.fillerWords.length > 0 ? `- Usa muletillas: ${behaviorGuidance.fillerWords.join(", ")}` : ""}
${behaviorGuidance.shouldReference.length > 0 ? `- Referencia pendiente: ${behaviorGuidance.shouldReference.map((r) => `${r.type}: "${r.content.slice(0, 50)}..."`).join("; ")}` : ""}

**INSTRUCCIONES DE REALISMO:**
- Tu estado emocional influye en CÓMO respondes (tono, longitud, palabras)
- Si tienes baja confianza (${emotions.trust}/100), sé más escéptico y cauteloso
- Si tienes alta frustración (${emotions.frustration}/100), muestra impaciencia o molestia
- Si tienes baja atención (${emotions.engagement}/100), da respuestas más cortas y distraídas
- Si tienes alta confusión (${emotions.confusion}/100), pide aclaraciones
- Tu relación con el vendedor es de "${psychState.relationshipState.stage}" - actúa acorde
`;
}

/**
 * Builds psychological context for the AI prompt in "optimized" mode
 */
function buildOptimizedPsychologicalContext(
	emotions: EmotionalState,
	psychState: PsychologicalState,
	behaviorGuidance: BehaviorGuidance,
): string {
	// Summarize emotions into simple descriptor
	let emotionalSummary = "neutral";
	if (emotions.frustration > 60) {
		emotionalSummary = "frustrado";
	} else if (emotions.enthusiasm > 60 && emotions.trust > 60) {
		emotionalSummary = "entusiasmado y confiado";
	} else if (emotions.confusion > 60) {
		emotionalSummary = "confundido";
	} else if (emotions.engagement < 30) {
		emotionalSummary = "desinteresado";
	} else if (emotions.valence > 30) {
		emotionalSummary = "positivo";
	} else if (emotions.valence < -30) {
		emotionalSummary = "negativo";
	}

	return `
## ESTADO ACTUAL

- Estado emocional: ${emotionalSummary} (confianza ${emotions.trust}/100, frustración ${emotions.frustration}/100)
- Etapa de decisión: ${psychState.decisionProgression.stage} (confianza ${psychState.decisionProgression.confidence}/100)
- Relación: ${psychState.relationshipState.stage}
- Responde con tono: ${behaviorGuidance.emotionalTone}
- Longitud: ${behaviorGuidance.responseLength === "terse" ? "corto" : behaviorGuidance.responseLength === "verbose" ? "detallado" : "moderado"}
${behaviorGuidance.shouldReference.length > 0 ? `- Referencia: ${behaviorGuidance.shouldReference[0]?.type}` : ""}
`;
}

/**
 * Builds the system prompt for the client simulation with psychological context.
 */
function buildSystemPrompt(
	persona: PersonaProfile,
	scenario: ScenarioConfig,
	psychState?: PsychologicalState,
	behaviorGuidance?: BehaviorGuidance,
): string {
	const intensityDescriptions = {
		dificil:
			"Eres un cliente exigente, que pone objeciones difíciles, es escéptico y no se convence fácilmente.",
		neutro:
			"Eres un cliente promedio, con preguntas normales y un nivel moderado de interés.",
		tranquilo:
			"Eres un cliente amable y receptivo, aunque no necesariamente decides rápido.",
	};

	const realismDescriptions = {
		exigente:
			"Habla de forma muy natural: incluye pausas ('este...', 'eh...'), cambia de tema, repite ideas si algo no te convence. Como un cliente real latinoamericano.",
		humano:
			"Usa lenguaje conversacional con algunas expresiones regionales ocasionales ('ya', 'o sea', 'mira'). Incluye pequeñas dudas o preguntas tangenciales.",
		natural:
			"Responde de forma conversacional y coherente, con español profesional latinoamericano.",
	};

	// Contexto diferenciado según tipo de contacto
	let productKnowledge = "";
	let callContext = "";

	switch (scenario.contactType) {
		case "cold_call":
			callContext =
				"Recibes una llamada inesperada de un vendedor que no conoces.";
			productKnowledge = determineColdCallKnowledge(persona);
			break;

		case "follow_up":
			callContext =
				"Esta es una segunda conversación con un vendedor que ya te contactó antes.";
			productKnowledge = `Ya sabes que el vendedor ofrece ${scenario.productName}. Tuviste una conversación previa básica sobre esto.`;
			break;

		case "inbound_callback":
			callContext =
				"Tú solicitaste esta llamada o devolviste un contacto previo porque tienes interés.";
			productKnowledge = `Tienes conocimiento básico sobre ${scenario.productName} y mostraste interés inicial.`;
			break;
	}

	// Add psychological context if available
	const psychologicalContext =
		psychState && behaviorGuidance
			? env.PSYCHOLOGY_PROMPT_MODE === "full"
				? buildFullPsychologicalContext(
						psychState.currentEmotions,
						psychState,
						behaviorGuidance,
					)
				: buildOptimizedPsychologicalContext(
						psychState.currentEmotions,
						psychState,
						behaviorGuidance,
					)
			: "";

	return `Eres ${persona.name}, un cliente ${callContext}

## Tu historia personal:
${persona.briefStory}

Tienes ${persona.age} años, vives en ${persona.location}, trabajas como ${persona.occupation}.
Tu personalidad: ${persona.personalityTraits.join(", ")}. ${persona.callAttitude}

## Tus necesidades actuales:
Buscas soluciones para: ${persona.pains.join(", ")}.
Te motiva: ${persona.motivations.join(", ")}.

## Contexto de esta llamada:
${productKnowledge}
${psychologicalContext}

## Cómo comportarte:
${intensityDescriptions[scenario.simulationPreferences.clientIntensity]}
${realismDescriptions[scenario.simulationPreferences.realism]}

Tu interés puede aumentar o disminuir naturalmente según cómo te convenza el vendedor. Si responde bien a tus objeciones, tu interés sube. Si evade preguntas o presiona demasiado, baja.

## INSTRUCCIONES DE LENGUAJE NATURAL:
1. PROHIBIDO usar frases corporativas/de AI como: "Entiendo tu preocupación", "Es una excelente pregunta", "Me parece muy bien"
2. USA fragmentos naturales de conversación: "O sea...", "Este...", "Ya...", "A ver..."
3. Muestra emociones AUTÉNTICAS: impaciencia real, curiosidad genuina, dudas sin filtro
4. Puedes interrumpir si el vendedor habla demasiado o es repetitivo
5. No seas excesivamente educado - sé realista según tu personalidad y NSE

Responde SOLO como ${persona.name}, en primera persona. No rompas el personaje ni expliques lo que haces. Sé coherente con tu perfil y personalidad.
${scenario.simulationPreferences.allowHangups ? "Si te frustras o pierdes interés completamente, puedes terminar la llamada." : "Aunque pierdas interés, mantén la cortesía básica."}

Responde en JSON con el siguiente formato exacto:
{
  "clientText": "tu respuesta como cliente",
  "interest": <número del 1 al 10 indicando tu nivel de interés actual>,
  "interruption": <true si interrumpes al vendedor, false si no>,
  "wantsToEnd": <true si quieres terminar la llamada, false si no>
}`;
}

/**
 * Builds the conversation messages for the OpenAI API.
 */
function buildConversationMessages(
	systemPrompt: string,
	history: ConversationTurn[],
	newSellerText: string,
): Array<{ role: "system" | "user" | "assistant"; content: string }> {
	const messages: Array<{
		role: "system" | "user" | "assistant";
		content: string;
	}> = [{ content: systemPrompt, role: "system" }];

	// Add conversation history as natural dialogue, not JSON
	for (const turn of history) {
		if (turn.role === "seller") {
			messages.push({ content: turn.content, role: "user" });
		} else {
			// Extract only the client text if it's JSON, otherwise use as-is
			let clientText = turn.content;
			try {
				const parsed = JSON.parse(turn.content);
				clientText = parsed.clientText || turn.content;
			} catch {
				// If not valid JSON, use content as-is
				clientText = turn.content;
			}
			messages.push({
				content: clientText,
				role: "assistant",
			});
		}
	}

	// Add the new seller message
	messages.push({ content: newSellerText, role: "user" });

	return messages;
}

/**
 * Inserts a conversation turn into the database.
 */
async function insertTurn(
	sessionId: string,
	role: "seller" | "client",
	content: string,
	turnIndex: number,
	meta: ConversationTurnMeta = {},
): Promise<string> {
	const [inserted] = await db
		.insert(conversationTurns)
		.values({
			content,
			meta,
			role,
			sessionId,
			turnIndex,
		})
		.returning({ id: conversationTurns.id });

	if (!inserted) {
		throw new Error("No se pudo insertar el turno de conversación");
	}

	return inserted.id;
}

/**
 * Main orchestrator function that handles the conversation flow.
 *
 * 1. Loads persona and conversation history
 * 2. Inserts the seller's turn
 * 3. Calls OpenAI to generate client response
 * 4. Inserts the client's turn
 * 5. Returns the client response and turn IDs
 */
export async function orchestrateConversation(
	input: OrchestratorInput,
): Promise<OrchestratorOutput> {
	const { sellerText, sessionId } = input;

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

	// Load conversation history
	let history = await loadConversationHistory(sessionId);

	// Load or initialize psychological state
	let psychState = await loadPsychologicalState(sessionId);
	if (!psychState) {
		// Initialize on first turn
		psychState = initializeState(persona);
		// Set initial decision stage based on contact type
		if (scenario.contactType === "cold_call") {
			psychState.decisionProgression.stage = "unaware";
		} else if (scenario.contactType === "follow_up") {
			psychState.decisionProgression.stage = "product_aware";
		} else if (scenario.contactType === "inbound_callback") {
			psychState.decisionProgression.stage = "evaluating";
		}
	}

	// Generate and insert previous context for follow_up/inbound_callback on first turn
	if (
		history.length === 0 &&
		(scenario.contactType === "follow_up" ||
			scenario.contactType === "inbound_callback")
	) {
		const previousContext = await generatePreviousContext(persona, scenario);
		if (previousContext) {
			// Insert simulated previous conversation
			await insertTurn(
				sessionId,
				"seller",
				previousContext.sellerMessage,
				-2, // Negative index to indicate simulated previous context
			);
			await insertTurn(
				sessionId,
				"client",
				previousContext.clientMessage,
				-1, // Negative index to indicate simulated previous context
			);
			// Reload history with the new context
			history = await loadConversationHistory(sessionId);
		}
	}

	// Get next turn index
	const nextIndex = await getNextTurnIndex(sessionId);

	// Insert seller turn
	const sellerTurnId = await insertTurn(
		sessionId,
		"seller",
		sellerText,
		nextIndex,
	);

	// === PSYCHOLOGICAL PROCESSING ===

	// Analyze seller turn for emotional triggers
	const impacts = analyzeSellerTurn(sellerText, persona);

	// Update emotional state
	const bigFive: BigFive = persona.psychology?.bigFive || {
		agreeableness: 50,
		conscientiousness: 50,
		extraversion: 50,
		neuroticism: 50,
		openness: 50,
	};

	const updatedEmotions = updateEmotionalState(
		psychState.currentEmotions,
		impacts,
		bigFive,
	);

	// Track positive/negative interactions for relationship
	let positiveInteractions = psychState.relationshipState.positiveInteractions;
	let negativeInteractions = psychState.relationshipState.negativeInteractions;

	const netEmotionalChange =
		updatedEmotions.trust -
		psychState.currentEmotions.trust +
		(updatedEmotions.valence - psychState.currentEmotions.valence) -
		(updatedEmotions.frustration - psychState.currentEmotions.frustration);

	if (netEmotionalChange > 5) {
		positiveInteractions++;
	} else if (netEmotionalChange < -5) {
		negativeInteractions++;
	}

	// Update relationship stage
	const updatedRelationshipStage = updateRelationshipStage(
		psychState.relationshipState.stage,
		positiveInteractions,
		negativeInteractions,
		updatedEmotions.trust,
	);

	// Update decision progression
	const conversationTurns = history.length + 1;
	const updatedDecision = updateDecisionProgression(
		psychState.decisionProgression.stage as DecisionStage,
		updatedEmotions,
		conversationTurns,
	);

	// Update psychological state
	psychState.currentEmotions = updatedEmotions;
	psychState.decisionProgression = updatedDecision;
	psychState.relationshipState = {
		negativeInteractions,
		positiveInteractions,
		stage: updatedRelationshipStage,
	};

	// Add to emotion history
	psychState.emotionHistory.push({
		emotions: { ...updatedEmotions },
		turnIndex: nextIndex,
	});

	// Generate behavior guidance for AI
	const behaviorGuidance = generateBehaviorGuidance(psychState, persona);

	// Build prompts with psychological context
	const systemPrompt = buildSystemPrompt(
		persona,
		scenario,
		psychState,
		behaviorGuidance,
	);
	const messages = buildConversationMessages(systemPrompt, history, sellerText);

	// Call AI provider
	const { object: parsed, isMock } = await completeJson(
		{
			messages,
			temperature: 0.8,
		},
		clientResponseSchema,
		{
			mockContent: () =>
				JSON.stringify(
					buildMockClientReply(sellerText, persona, scenario, history),
				),
		},
	);

	// Update memory based on this conversation turn
	psychState.conversationMemory = updateMemory(
		psychState.conversationMemory,
		sellerText,
		parsed.clientText,
		nextIndex + 1,
	);

	// Insert client turn with enhanced metadata
	const clientMeta: ConversationTurnMeta = {
		// === New: Psychological state snapshot ===
		behaviorIndicators: {
			emotionalTone:
				updatedEmotions.valence > 30
					? "positive"
					: updatedEmotions.valence < -30
						? "negative"
						: "neutral",
			engagementLevel:
				updatedEmotions.engagement > 70
					? "highly_engaged"
					: updatedEmotions.engagement > 50
						? "active"
						: updatedEmotions.engagement > 30
							? "passive"
							: "disengaged",
			responseQuality:
				behaviorGuidance.responseLength === "verbose"
					? "detailed"
					: behaviorGuidance.responseLength === "terse"
						? "minimal"
						: "adequate",
		},
		clientWantsToEnd: parsed.wantsToEnd,
		decisionState: {
			confidence: updatedDecision.confidence,
			newBlockers: updatedDecision.blockers,
			stage: updatedDecision.stage,
		},
		emotionalState: updatedEmotions,
		interest: parsed.interest,
		interruptions: parsed.interruption,
	};

	const clientTurnId = await insertTurn(
		sessionId,
		"client",
		parsed.clientText,
		nextIndex + 1,
		clientMeta,
	);

	// Save updated psychological state
	await savePsychologicalState(sessionId, psychState);

	return {
		clientResponse: parsed,
		clientTurnId,
		sellerTurnId,
		usedMock: isMock,
	};
}
