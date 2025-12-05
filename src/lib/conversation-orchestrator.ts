import { asc, eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import {
	type ConversationTurnMeta,
	conversationTurns,
	type PersonaProfile,
	personaSnapshots,
	type ScenarioConfig,
	simulationSessions,
} from "@/db/schema/simulation";
import { createChatCompletion } from "./openai";

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

function buildMockClientReply(
	sellerText: string,
	persona: PersonaProfile,
	scenario: ScenarioConfig,
	history: ConversationTurn[],
): ClientResponse {
	const trimmedSeller = sellerText.trim();
	const turnInterest = Math.max(
		3,
		Math.min(9, 6 + Math.floor(history.length / 2)),
	);

	return {
		clientText:
			trimmedSeller.length > 0
				? `${persona.name}: entiendo tu oferta sobre ${scenario.productName}. ${trimmedSeller.slice(0, 140)}`
				: `${persona.name}: ¿podrías contarme más sobre ${scenario.productName}?`,
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
 * Builds the system prompt for the client simulation.
 */
function buildSystemPrompt(
	persona: PersonaProfile,
	scenario: ScenarioConfig,
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
			"Responde de manera muy realista con pausas, dudas y cambios de tema como un cliente real.",
		humano:
			"Incluye pequeñas imperfecciones naturales en tu forma de hablar, como repeticiones leves o pausas.",
		natural: "Responde de forma natural y coherente.",
	};

	return `Eres ${persona.name}, un cliente potencial en una llamada de ventas.

## Tu perfil:
- Edad: ${persona.age} años
- Ubicación: ${persona.location}
- Nivel socioeconómico: ${persona.socioeconomicLevel}
- Ocupación: ${persona.occupation}
- Nivel educativo: ${persona.educationLevel}
- Rasgos de personalidad: ${persona.personalityTraits.join(", ")}
- Motivaciones: ${persona.motivations.join(", ")}
- Dolores/problemas: ${persona.pains.join(", ")}
- Actitud en la llamada: ${persona.callAttitude}
- Historia breve: ${persona.briefStory}

## El vendedor te ofrece:
- Producto: ${scenario.productName}
- Descripción: ${scenario.description}
${scenario.priceDetails ? `- Precio/condiciones: ${scenario.priceDetails}` : ""}
- Objetivo del vendedor: ${scenario.callObjective}

## Tu comportamiento:
${intensityDescriptions[scenario.simulationPreferences.clientIntensity]}
${realismDescriptions[scenario.simulationPreferences.realism]}

## Reglas importantes:
1. Responde SOLO como el cliente, en primera persona.
2. No rompas el personaje ni expliques lo que haces.
3. Sé coherente con tu perfil y personalidad.
4. Si el vendedor no te convence o la conversación se estanca, puedes mostrar desinterés.
${scenario.simulationPreferences.allowHangups ? "5. Si te sientes muy frustrado o desinteresado, puedes decidir terminar la llamada." : "5. Aunque pierdas interés, mantén la cortesía básica."}

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

	// Add conversation history
	for (const turn of history) {
		if (turn.role === "seller") {
			messages.push({ content: turn.content, role: "user" });
		} else {
			// For client turns, we wrap in JSON format to maintain consistency
			messages.push({
				content: turn.content,
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
	const history = await loadConversationHistory(sessionId);

	// Get next turn index
	const nextIndex = await getNextTurnIndex(sessionId);

	// Insert seller turn
	const sellerTurnId = await insertTurn(
		sessionId,
		"seller",
		sellerText,
		nextIndex,
	);

	// Build prompts
	const systemPrompt = buildSystemPrompt(persona, scenario);
	const messages = buildConversationMessages(systemPrompt, history, sellerText);

	// Call OpenAI
	const { completion, isMock } = await createChatCompletion(
		{
			messages,
			model: "gpt-4o-mini",
			response_format: { type: "json_object" },
			temperature: 0.8,
		},
		{
			mockContent: () =>
				JSON.stringify(
					buildMockClientReply(sellerText, persona, scenario, history),
				),
		},
	);

	const content = completion.choices[0]?.message?.content;

	if (!content) {
		throw new Error("No se recibió respuesta del modelo de OpenAI");
	}

	// Parse and validate response
	const parsed = clientResponseSchema.parse(JSON.parse(content));

	// Insert client turn with metadata
	const clientMeta: ConversationTurnMeta = {
		clientWantsToEnd: parsed.wantsToEnd,
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

	return {
		clientResponse: parsed,
		clientTurnId,
		sellerTurnId,
		usedMock: isMock,
	};
}
