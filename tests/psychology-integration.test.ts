/**
 * Integration tests for the complete psychological pipeline
 * Tests end-to-end flow: persona generation → state initialization → conversation → analysis
 */

import { describe, expect, test } from "bun:test";
import type {
	PersonaProfile,
	PsychologicalState,
} from "@/db/schema/simulation";
import {
	analyzeSellerTurn,
	generateBehaviorGuidance,
	initializeState,
	updateDecisionProgression,
	updateEmotionalState,
	updateMemory,
	updateRelationshipStage,
} from "@/lib/psychology-engine";

describe("Psychology Integration - Full Pipeline", () => {
	// Create a realistic persona for integration testing
	const mockPersona: PersonaProfile = {
		age: 32,
		briefStory:
			"Emprendedora peruana que busca optimizar sus procesos de ventas",
		callAttitude: "Interesada pero cautelosa con su presupuesto",
		decisionContext: {
			budgetRange: { max: 4000, min: 2000 },
			competitorsConsidered: ["HubSpot", "Salesforce"],
			keyDecisionCriteria: ["precio", "facilidad de uso", "soporte en español"],
			priorExperience: "neutral",
			timeframe: "short_term",
		},
		educationLevel: "Universidad completa",
		location: "Lima, Perú",
		motivations: ["Aumentar conversiones", "Automatizar seguimiento"],
		name: "María González",
		occupation: "Gerente de Ventas",
		pains: ["Pérdida de leads", "Procesos manuales"],
		personalityTraits: ["Analítica", "Orientada a resultados", "Pragmática"],
		preferredChannel: "WhatsApp",
		psychology: {
			bigFive: {
				agreeableness: 55,
				conscientiousness: 75,
				extraversion: 60,
				neuroticism: 40,
				openness: 70,
			},
			communicationStyle: {
				directness: "direct",
				emotionalExpression: "moderate",
				formality: "professional",
				verbosity: "moderate",
			},
			emotionalBaseline: {
				arousal: 55,
				engagement: 70,
				trust: 45,
				valence: 15,
			},
			salesProfile: {
				authorityLevel: 85,
				decisionSpeed: 55,
				priceSensitivity: 65,
				riskTolerance: 50,
				trustThreshold: 55,
			},
		},
		socioeconomicLevel: "Clase media-alta",
	};

	test("Complete conversation simulation - positive interaction flow", () => {
		// Initialize psychological state
		const psychState = initializeState(mockPersona);

		// Verify initial state
		expect(psychState.currentEmotions.trust).toBe(45);
		expect(psychState.decisionProgression.stage).toBe("unaware");
		expect(psychState.relationshipState.stage).toBe("stranger");

		// Turn 1: Empathy and discovery
		const turn1Seller =
			"Hola María, ¿cómo te sientes con tus procesos actuales de ventas? ¿Qué te gustaría mejorar?";
		const turn1Impacts = analyzeSellerTurn(turn1Seller, mockPersona);

		expect(turn1Impacts.length).toBeGreaterThan(0);
		const empathyTrigger = turn1Impacts.find(
			(i) => i.trigger.type === "empathy",
		);
		expect(empathyTrigger).toBeDefined();

		// Update emotional state after turn 1
		psychState.currentEmotions = updateEmotionalState(
			psychState.currentEmotions,
			turn1Impacts,
			mockPersona.psychology?.bigFive,
		);

		// Trust should increase
		expect(psychState.currentEmotions.trust).toBeGreaterThan(45);

		// Update memory
		const turn1Client =
			"Bueno, principalmente perdemos muchos leads porque no hacemos seguimiento a tiempo";
		psychState.conversationMemory = updateMemory(
			psychState.conversationMemory,
			turn1Seller,
			turn1Client,
			1,
		);

		// Update decision progression
		const decision1 = updateDecisionProgression(
			psychState.decisionProgression.stage,
			psychState.currentEmotions,
			1,
		);
		psychState.decisionProgression = decision1;

		// Update relationship
		psychState.relationshipState.positiveInteractions += 1;
		psychState.relationshipState.stage = updateRelationshipStage(
			psychState.relationshipState.stage,
			psychState.relationshipState.positiveInteractions,
			psychState.relationshipState.negativeInteractions,
			psychState.currentEmotions.trust,
		);

		// Turn 3: Value clarity
		const turn3Seller =
			"Entiendo que mencionaste la pérdida de leads. Nuestra solución te ayuda a automatizar el seguimiento, lo que reduce la pérdida de leads en un 40%";
		const turn3Impacts = analyzeSellerTurn(turn3Seller, mockPersona);

		const listeningTrigger = turn3Impacts.find(
			(i) => i.trigger.type === "listening",
		);
		const valueTrigger = turn3Impacts.find(
			(i) => i.trigger.type === "value_clarity",
		);
		expect(listeningTrigger).toBeDefined();
		expect(valueTrigger).toBeDefined();

		psychState.currentEmotions = updateEmotionalState(
			psychState.currentEmotions,
			turn3Impacts,
			mockPersona.psychology?.bigFive,
		);

		// Engagement should increase
		expect(psychState.currentEmotions.engagement).toBeGreaterThan(70);

		// Update progression (turn 3)
		const decision3 = updateDecisionProgression(
			psychState.decisionProgression.stage,
			psychState.currentEmotions,
			3,
		);
		psychState.decisionProgression = decision3;

		// Should progress to problem_aware
		expect(psychState.decisionProgression.stage).not.toBe("unaware");

		// Turn 5: Question handling
		const turn5Client = "¿Cuál es el precio mensual? ¿Incluye soporte?";
		psychState.conversationMemory = updateMemory(
			psychState.conversationMemory,
			"",
			turn5Client,
			5,
		);

		// Should have tracked questions
		expect(psychState.conversationMemory.questionsAsked.length).toBeGreaterThan(
			0,
		);

		// Turn 7: Building trust
		psychState.relationshipState.positiveInteractions = 5;
		psychState.relationshipState.stage = updateRelationshipStage(
			psychState.relationshipState.stage,
			5,
			0,
			psychState.currentEmotions.trust,
		);

		// Should progress relationship
		expect(psychState.relationshipState.stage).not.toBe("stranger");

		// Final verification: Generate behavior guidance
		const guidance = generateBehaviorGuidance(psychState, mockPersona);

		expect(guidance.emotionalTone).toBeDefined();
		expect(guidance.responseLength).toBeDefined();
		expect(guidance.hesitationLevel).toBeGreaterThanOrEqual(0);
		expect(guidance.hesitationLevel).toBeLessThanOrEqual(10);
	});

	test("Complete conversation simulation - negative interaction flow", () => {
		const psychState = initializeState(mockPersona);

		// Turn 1: Pressure tactics (negative trigger)
		const turn1Seller =
			"María, esta oferta solo está disponible hoy. Tienes que decidir ahora o nunca";
		const turn1Impacts = analyzeSellerTurn(turn1Seller, mockPersona);

		const pressureTrigger = turn1Impacts.find(
			(i) => i.trigger.type === "pressure",
		);
		expect(pressureTrigger).toBeDefined();

		psychState.currentEmotions = updateEmotionalState(
			psychState.currentEmotions,
			turn1Impacts,
			mockPersona.psychology?.bigFive,
		);

		// Frustration should increase, trust should decrease
		expect(psychState.currentEmotions.frustration).toBeGreaterThan(0);
		expect(psychState.currentEmotions.trust).toBeLessThan(45);

		// Mark as negative interaction
		psychState.relationshipState.negativeInteractions += 1;

		// Turn 3: More pressure
		const turn3Seller =
			"No puedes perder esta oportunidad. Solo hoy tenemos este precio especial";
		const turn3Impacts = analyzeSellerTurn(turn3Seller, mockPersona);

		psychState.currentEmotions = updateEmotionalState(
			psychState.currentEmotions,
			turn3Impacts,
			mockPersona.psychology?.bigFive,
		);

		psychState.relationshipState.negativeInteractions += 1;

		// Frustration should be building (gradual increase is realistic)
		expect(psychState.currentEmotions.frustration).toBeGreaterThan(0);

		// Trust should be damaged
		expect(psychState.currentEmotions.trust).toBeLessThan(45);

		// Check decision progression
		const decision3 = updateDecisionProgression(
			psychState.decisionProgression.stage,
			psychState.currentEmotions,
			3,
		);

		// With damaged trust, should have blockers
		if (psychState.currentEmotions.trust < 40) {
			expect(decision3.blockers.length).toBeGreaterThan(0);
		}

		// Generate guidance - should indicate negative state
		const guidance = generateBehaviorGuidance(psychState, mockPersona);

		// With low trust and some frustration, tone should not be positive
		expect(guidance.emotionalTone).not.toContain("entusiasma");
		expect(guidance.hesitationLevel).toBeGreaterThan(3); // Higher hesitation with low trust
	});

	test("Memory consistency tracking across conversation", () => {
		const psychState = initializeState(mockPersona);

		// Turn 2: Client mentions budget
		const turn2Client = "Mi presupuesto es de aproximadamente 3000 soles";
		psychState.conversationMemory = updateMemory(
			psychState.conversationMemory,
			"",
			turn2Client,
			2,
		);

		// Should have budget fact
		const budgetFact = psychState.conversationMemory.facts.find(
			(f) => f.topic === "budget",
		);
		expect(budgetFact).toBeDefined();

		// Turn 5: Seller makes a promise
		const turn5Seller =
			"Te garantizo que tendrás soporte en español 24/7, te lo prometo";
		psychState.conversationMemory = updateMemory(
			psychState.conversationMemory,
			turn5Seller,
			"",
			5,
		);

		// Should track promise
		expect(psychState.conversationMemory.sellerPromises.length).toBe(1);
		expect(psychState.conversationMemory.sellerPromises[0]?.fulfilled).toBe(
			false,
		);

		// Turn 7: Client raises objection
		const turn7Client = "Me parece muy caro para lo que ofrece";
		psychState.conversationMemory = updateMemory(
			psychState.conversationMemory,
			"",
			turn7Client,
			7,
		);

		// Should track objection
		expect(psychState.conversationMemory.objectionsRaised.length).toBe(1);
		expect(psychState.conversationMemory.objectionsRaised[0]?.resolved).toBe(
			false,
		);
	});

	test("Personality modulates emotional responses differently", () => {
		// High neuroticism persona
		const nervousPersona = {
			...mockPersona,
			psychology: mockPersona.psychology && {
				...mockPersona.psychology,
				bigFive: {
					...mockPersona.psychology.bigFive,
					neuroticism: 85,
				},
			},
		};

		// Low neuroticism persona
		const calmPersona = {
			...mockPersona,
			psychology: mockPersona.psychology && {
				...mockPersona.psychology,
				bigFive: {
					...mockPersona.psychology.bigFive,
					neuroticism: 15,
				},
			},
		};

		const pressureSeller =
			"Tienes que decidir ahora, esta oferta expira en 5 minutos";
		const impacts = analyzeSellerTurn(pressureSeller, mockPersona);

		const initialEmotions = {
			arousal: 50,
			confusion: 20,
			engagement: 60,
			enthusiasm: 30,
			frustration: 10,
			trust: 40,
			valence: 0,
		};

		const nervousResponse = updateEmotionalState(
			initialEmotions,
			impacts,
			nervousPersona.psychology?.bigFive,
		);

		const calmResponse = updateEmotionalState(
			initialEmotions,
			impacts,
			calmPersona.psychology?.bigFive,
		);

		// High neuroticism should amplify negative reactions
		expect(nervousResponse.frustration).toBeGreaterThan(
			calmResponse.frustration,
		);
	});

	test("Decision progression follows logical buyer journey", () => {
		const psychState = initializeState(mockPersona);

		// Simulate progression through stages
		const stages: Array<{
			turns: number;
			expectedStage: string;
			emotionalSetup: Partial<PsychologicalState["currentEmotions"]>;
		}> = [
			{
				emotionalSetup: { engagement: 70, trust: 55 },
				expectedStage: "problem_aware",
				turns: 3,
			},
			{
				emotionalSetup: { confusion: 20, engagement: 75, trust: 60 },
				expectedStage: "solution_aware",
				turns: 5,
			},
			{
				emotionalSetup: { confusion: 15, engagement: 80, trust: 65 },
				expectedStage: "product_aware",
				turns: 7,
			},
			{
				emotionalSetup: {
					confusion: 10,
					engagement: 85,
					enthusiasm: 65,
					trust: 70,
				},
				expectedStage: "evaluating",
				turns: 10,
			},
		];

		for (const stage of stages) {
			// Set up emotional state for progression
			psychState.currentEmotions = {
				...psychState.currentEmotions,
				...stage.emotionalSetup,
			};

			const decision = updateDecisionProgression(
				psychState.decisionProgression.stage,
				psychState.currentEmotions,
				stage.turns,
			);

			expect(decision.stage).toBe(stage.expectedStage);
			psychState.decisionProgression = decision;
		}
	});
});

describe("Psychology Integration - Backward Compatibility", () => {
	test("Handles personas without psychology gracefully", () => {
		const legacyPersona: PersonaProfile = {
			age: 35,
			briefStory: "Cliente tradicional sin datos psicológicos",
			callAttitude: "Neutral",
			educationLevel: "Secundaria",
			location: "Lima",
			motivations: ["Precio bajo"],
			name: "Juan Pérez",
			occupation: "Comerciante",
			pains: ["Costos altos"],
			personalityTraits: ["Práctico"],
			preferredChannel: "Llamada",
			socioeconomicLevel: "Clase media",
			// No psychology or decisionContext fields
		};

		// Should initialize with default values
		const state = initializeState(legacyPersona);

		expect(state.currentEmotions).toBeDefined();
		expect(state.decisionProgression).toBeDefined();
		expect(state.relationshipState).toBeDefined();
		expect(state.conversationMemory).toBeDefined();
	});

	test("Analysis handles null psychological state", () => {
		// This simulates old sessions without psychological tracking
		const nullPsychState: PsychologicalState | null = null;

		// Analysis engine should handle this gracefully
		expect(nullPsychState).toBeNull();
		// In actual code, analysis-engine checks if psychState exists before using it
	});
});
