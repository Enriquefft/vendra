import { describe, expect, test } from "bun:test";
import type { PersonaProfile } from "@/db/schema/simulation";
import {
	analyzeSellerTurn,
	checkConsistency,
	generateBehaviorGuidance,
	initializeState,
	RealismUtils,
	updateDecisionProgression,
	updateEmotionalState,
	updateMemory,
	updateRelationshipStage,
} from "@/lib/psychology-engine";

// Test persona with complete psychology profile
const mockPersona: PersonaProfile = {
	age: 35,
	briefStory: "Profesional peruano buscando soluciones tecnológicas.",
	callAttitude: "Curioso pero analítico",
	decisionContext: {
		budgetRange: { max: 5000, min: 2000 },
		competitorsConsidered: ["Competidor A", "Competidor B"],
		keyDecisionCriteria: ["precio", "calidad", "soporte"],
		priorExperience: "neutral",
		timeframe: "short_term",
	},
	educationLevel: "Universidad completa",
	location: "Lima, Perú",
	motivations: ["Mejorar eficiencia", "Reducir costos"],
	name: "Juan Pérez",
	occupation: "Gerente de TI",
	pains: ["Procesos lentos", "Alto costo operativo"],
	personalityTraits: ["Analítico", "Pragmático", "Cauteloso"],
	preferredChannel: "WhatsApp",
	psychology: {
		bigFive: {
			agreeableness: 50,
			conscientiousness: 70,
			extraversion: 45,
			neuroticism: 40,
			openness: 65,
		},
		communicationStyle: {
			directness: "balanced",
			emotionalExpression: "moderate",
			formality: "professional",
			verbosity: "moderate",
		},
		emotionalBaseline: {
			arousal: 45,
			engagement: 65,
			trust: 35,
			valence: 10,
		},
		salesProfile: {
			authorityLevel: 80,
			decisionSpeed: 45,
			priceSensitivity: 60,
			riskTolerance: 40,
			trustThreshold: 50,
		},
	},
	socioeconomicLevel: "Clase media-alta",
};

describe("PsychologyEngine - initializeState", () => {
	test("initializes state with persona baseline emotions", () => {
		const state = initializeState(mockPersona);

		expect(state.currentEmotions.valence).toBe(10);
		expect(state.currentEmotions.arousal).toBe(45);
		expect(state.currentEmotions.trust).toBe(35);
		expect(state.currentEmotions.engagement).toBe(65);
	});

	test("initializes with unaware decision stage", () => {
		const state = initializeState(mockPersona);

		expect(state.decisionProgression.stage).toBe("unaware");
		expect(state.decisionProgression.confidence).toBe(20);
	});

	test("initializes with stranger relationship stage", () => {
		const state = initializeState(mockPersona);

		expect(state.relationshipState.stage).toBe("stranger");
		expect(state.relationshipState.positiveInteractions).toBe(0);
		expect(state.relationshipState.negativeInteractions).toBe(0);
	});

	test("initializes empty conversation memory", () => {
		const state = initializeState(mockPersona);

		expect(state.conversationMemory.facts).toHaveLength(0);
		expect(state.conversationMemory.objectionsRaised).toHaveLength(0);
		expect(state.conversationMemory.questionsAsked).toHaveLength(0);
		expect(state.conversationMemory.sellerPromises).toHaveLength(0);
	});

	test("adds initial emotion snapshot to history", () => {
		const state = initializeState(mockPersona);

		expect(state.emotionHistory).toHaveLength(1);
		expect(state.emotionHistory[0]?.emotions.trust).toBe(35);
	});
});

describe("PsychologyEngine - analyzeSellerTurn", () => {
	test("detects empathy triggers", () => {
		const sellerText =
			"¿Cómo te sientes con tus procesos actuales? ¿Qué buscas mejorar?";
		const impacts = analyzeSellerTurn(sellerText, mockPersona);

		const empathyImpact = impacts.find((i) => i.trigger.type === "empathy");
		expect(empathyImpact).toBeDefined();
		expect(empathyImpact?.emotionChanges.trust).toBeGreaterThan(0);
	});

	test("detects listening triggers", () => {
		const sellerText =
			"Entiendo que mencionaste que quieres reducir costos operativos";
		const impacts = analyzeSellerTurn(sellerText, mockPersona);

		const listeningImpact = impacts.find((i) => i.trigger.type === "listening");
		expect(listeningImpact).toBeDefined();
	});

	test("detects pressure triggers", () => {
		const sellerText =
			"Esta oferta solo hoy, es ahora o nunca, tienes que decidir";
		const impacts = analyzeSellerTurn(sellerText, mockPersona);

		const pressureImpact = impacts.find((i) => i.trigger.type === "pressure");
		expect(pressureImpact).toBeDefined();
		expect(pressureImpact?.emotionChanges.frustration).toBeGreaterThan(0);
	});

	test("detects value clarity triggers", () => {
		const sellerText =
			"Esto te permite reducir costos en un 40%, te ayuda a resolver tu problema principal";
		const impacts = analyzeSellerTurn(sellerText, mockPersona);

		const valueImpact = impacts.find((i) => i.trigger.type === "value_clarity");
		expect(valueImpact).toBeDefined();
	});

	test("detects repetition triggers", () => {
		const sellerText =
			"El precio precio precio es es es bueno bueno bueno para para para ti ti ti y y y te te te va va va a a a gustar gustar gustar mucho mucho mucho";
		const impacts = analyzeSellerTurn(sellerText, mockPersona);

		const repetitionImpact = impacts.find(
			(i) => i.trigger.type === "repetition",
		);
		expect(repetitionImpact).toBeDefined();
	});

	test("detects personalization triggers", () => {
		const sellerText = "Juan, en tu caso específico, esto te ayudará mucho";
		const impacts = analyzeSellerTurn(sellerText, mockPersona);

		const personalizationImpact = impacts.find(
			(i) => i.trigger.type === "personalization",
		);
		expect(personalizationImpact).toBeDefined();
	});

	test("returns empty array for neutral text", () => {
		const sellerText = "Bueno, continuemos con la conversación";
		const impacts = analyzeSellerTurn(sellerText, mockPersona);

		expect(impacts).toHaveLength(0);
	});
});

describe("PsychologyEngine - updateEmotionalState", () => {
	test("applies emotional impacts", () => {
		const currentState = {
			arousal: 50,
			confusion: 20,
			engagement: 60,
			enthusiasm: 30,
			frustration: 10,
			trust: 40,
			valence: 0,
		};

		const impacts = [
			{
				emotionChanges: { engagement: 15, trust: 10 },
				trigger: { intensity: 6, type: "empathy" as const },
			},
		];

		const updated = updateEmotionalState(
			currentState,
			impacts,
			mockPersona.psychology?.bigFive,
		);

		expect(updated.trust).toBeGreaterThan(40);
		expect(updated.engagement).toBeGreaterThan(60);
	});

	test("clamps emotion values to valid ranges", () => {
		const currentState = {
			arousal: 50,
			confusion: 20,
			engagement: 60,
			enthusiasm: 30,
			frustration: 10,
			trust: 40,
			valence: 0,
		};

		const impacts = [
			{
				emotionChanges: { trust: 100 },
				trigger: { intensity: 10, type: "empathy" as const },
			},
		];

		const updated = updateEmotionalState(
			currentState,
			impacts,
			mockPersona.psychology?.bigFive,
		);

		expect(updated.trust).toBeGreaterThan(40);
		expect(updated.trust).toBeLessThanOrEqual(100);
	});

	test("personality modulates negative emotions", () => {
		const currentState = {
			arousal: 50,
			confusion: 20,
			engagement: 60,
			enthusiasm: 30,
			frustration: 10,
			trust: 40,
			valence: 0,
		};

		const impacts = [
			{
				emotionChanges: { frustration: 20 },
				trigger: { intensity: 8, type: "pressure" as const },
			},
		];

		const highNeuroticism = {
			...mockPersona.psychology?.bigFive,
			neuroticism: 80,
		};
		const lowNeuroticism = {
			...mockPersona.psychology?.bigFive,
			neuroticism: 20,
		};

		const highNeuroticismUpdate = updateEmotionalState(
			currentState,
			impacts,
			highNeuroticism,
		);
		const lowNeuroticismUpdate = updateEmotionalState(
			currentState,
			impacts,
			lowNeuroticism,
		);

		// High neuroticism should amplify negative emotions more
		expect(highNeuroticismUpdate.frustration).toBeGreaterThanOrEqual(
			lowNeuroticismUpdate.frustration,
		);
	});
});

describe("PsychologyEngine - updateDecisionProgression", () => {
	test("progresses from unaware to problem_aware when engagement is high", () => {
		const emotionalState = {
			arousal: 50,
			confusion: 20,
			engagement: 75,
			enthusiasm: 40,
			frustration: 10,
			trust: 60,
			valence: 20,
		};

		const result = updateDecisionProgression("unaware", emotionalState, 3);

		expect(result.stage).toBe("problem_aware");
		expect(result.confidence).toBeGreaterThan(0);
	});

	test("does not progress when trust is low", () => {
		const emotionalState = {
			arousal: 50,
			confusion: 20,
			engagement: 75,
			enthusiasm: 40,
			frustration: 10,
			trust: 20,
			valence: 20,
		};

		const result = updateDecisionProgression(
			"product_aware",
			emotionalState,
			5,
		);

		expect(result.stage).toBe("product_aware");
	});

	test("identifies trust as blocker when low", () => {
		const emotionalState = {
			arousal: 50,
			confusion: 20,
			engagement: 75,
			enthusiasm: 40,
			frustration: 10,
			trust: 25,
			valence: 20,
		};

		const result = updateDecisionProgression("evaluating", emotionalState, 8);

		expect(result.blockers).toContain("No confío en el vendedor");
	});

	test("identifies confusion as blocker when high", () => {
		const emotionalState = {
			arousal: 50,
			confusion: 70,
			engagement: 75,
			enthusiasm: 40,
			frustration: 10,
			trust: 60,
			valence: 20,
		};

		const result = updateDecisionProgression("evaluating", emotionalState, 8);

		expect(result.blockers).toContain("No entiendo bien el producto");
	});

	test("identifies high engagement as accelerator", () => {
		const emotionalState = {
			arousal: 50,
			confusion: 20,
			engagement: 85,
			enthusiasm: 40,
			frustration: 10,
			trust: 60,
			valence: 20,
		};

		const result = updateDecisionProgression("evaluating", emotionalState, 8);

		expect(result.accelerators).toContain("Entiendo el valor claramente");
	});
});

describe("PsychologyEngine - generateBehaviorGuidance", () => {
	test("generates guidance with verbose responseLength for extraverted persona", () => {
		const state = initializeState(mockPersona);
		state.currentEmotions.engagement = 75;

		const extravertedPersona = {
			...mockPersona,
			psychology: {
				...mockPersona.psychology,
				bigFive: {
					...mockPersona.psychology?.bigFive,
					extraversion: 80,
				},
			},
		};

		const guidance = generateBehaviorGuidance(state, extravertedPersona);

		expect(guidance.responseLength).toBe("verbose");
	});

	test("generates guidance with terse responseLength for disengaged persona", () => {
		const state = initializeState(mockPersona);
		state.currentEmotions.engagement = 20;
		state.currentEmotions.frustration = 75;

		const guidance = generateBehaviorGuidance(state, mockPersona);

		expect(guidance.responseLength).toBe("terse");
	});

	test("includes high hesitation level when trust is low", () => {
		const state = initializeState(mockPersona);
		state.currentEmotions.trust = 20;
		state.currentEmotions.confusion = 70;

		const guidance = generateBehaviorGuidance(state, mockPersona);

		expect(guidance.hesitationLevel).toBeGreaterThan(5);
	});

	test("includes positive emotional tone when engagement is high", () => {
		const state = initializeState(mockPersona);
		state.currentEmotions.engagement = 85;
		state.currentEmotions.enthusiasm = 80;
		state.currentEmotions.valence = 50;

		const guidance = generateBehaviorGuidance(state, mockPersona);

		expect(guidance.emotionalTone).toContain("entusiasma");
	});

	test("includes frustrated emotional tone when frustration is high", () => {
		const state = initializeState(mockPersona);
		state.currentEmotions.frustration = 75;

		const guidance = generateBehaviorGuidance(state, mockPersona);

		expect(guidance.emotionalTone).toContain("frustrado");
	});
});

describe("PsychologyEngine - checkConsistency", () => {
	test("allows consistent facts", () => {
		const memory = {
			facts: [
				{ importance: "high", topic: "budget", turnIndex: 1, value: "3000" },
			],
			objectionsRaised: [],
			questionsAsked: [],
			sellerPromises: [],
		};

		const result = checkConsistency(memory, {
			topic: "budget",
			value: "3000",
		});

		expect(result.isConsistent).toBe(true);
	});

	test("allows numeric values within 30% tolerance", () => {
		const memory = {
			facts: [
				{ importance: "high", topic: "budget", turnIndex: 1, value: "3000" },
			],
			objectionsRaised: [],
			questionsAsked: [],
			sellerPromises: [],
		};

		const result = checkConsistency(memory, {
			topic: "budget",
			value: "3500",
		});

		expect(result.isConsistent).toBe(true);
		expect(result.shouldClarify).toBe(false);
	});

	test("flags contradictions outside tolerance", () => {
		const memory = {
			facts: [
				{ importance: "high", topic: "budget", turnIndex: 1, value: "3000" },
			],
			objectionsRaised: [],
			questionsAsked: [],
			sellerPromises: [],
		};

		const result = checkConsistency(memory, {
			topic: "budget",
			value: "6000",
		});

		expect(result.isConsistent).toBe(false);
		expect(result.conflictDetails).toBeDefined();
	});

	test("allows new facts for unknown topics", () => {
		const memory = {
			facts: [
				{ importance: "high", topic: "budget", turnIndex: 1, value: "3000" },
			],
			objectionsRaised: [],
			questionsAsked: [],
			sellerPromises: [],
		};

		const result = checkConsistency(memory, {
			topic: "delivery_time",
			value: "2 weeks",
		});

		expect(result.isConsistent).toBe(true);
	});
});

describe("PsychologyEngine - updateMemory", () => {
	test("extracts seller promises", () => {
		const memory = {
			facts: [],
			objectionsRaised: [],
			questionsAsked: [],
			sellerPromises: [],
		};

		const sellerText =
			"Te prometo que recibirás el producto en menos de 48 horas";
		const clientText = "Ok, perfecto";

		const updated = updateMemory(memory, sellerText, clientText, 1);

		expect(updated.sellerPromises).toHaveLength(1);
		expect(updated.sellerPromises[0]?.content).toContain("prometo");
	});

	test("extracts client questions", () => {
		const memory = {
			facts: [],
			objectionsRaised: [],
			questionsAsked: [],
			sellerPromises: [],
		};

		const sellerText = "Nuestro producto es excelente";
		const clientText = "¿Cuál es el precio exacto?";

		const updated = updateMemory(memory, sellerText, clientText, 1);

		expect(updated.questionsAsked).toHaveLength(1);
		expect(updated.questionsAsked[0]?.question).toContain(
			"Cuál es el precio exacto",
		);
	});

	test("extracts objections", () => {
		const memory = {
			facts: [],
			objectionsRaised: [],
			questionsAsked: [],
			sellerPromises: [],
		};

		const sellerText = "El precio es 5000 soles";
		const clientText = "Me parece muy caro para mi presupuesto";

		const updated = updateMemory(memory, sellerText, clientText, 1);

		expect(updated.objectionsRaised).toHaveLength(1);
		expect(updated.objectionsRaised[0]?.objection).toContain("parece muy caro");
	});

	test("extracts budget information", () => {
		const memory = {
			facts: [],
			objectionsRaised: [],
			questionsAsked: [],
			sellerPromises: [],
		};

		const sellerText = "¿Cuál es su presupuesto?";
		const clientText = "Tengo un presupuesto de 4000 soles";

		const updated = updateMemory(memory, sellerText, clientText, 1);

		expect(updated.facts.some((f) => f.topic === "budget")).toBe(true);
	});
});

describe("PsychologyEngine - updateRelationshipStage", () => {
	test("progresses from stranger to acquaintance", () => {
		const newStage = updateRelationshipStage("stranger", 3, 0, 51);

		expect(newStage).toBe("acquaintance");
	});

	test("progresses from acquaintance to familiar", () => {
		const newStage = updateRelationshipStage("acquaintance", 6, 0, 66);

		expect(newStage).toBe("familiar");
	});

	test("progresses from familiar to trusted", () => {
		const newStage = updateRelationshipStage("familiar", 10, 0, 81);

		expect(newStage).toBe("trusted");
	});

	test("does not progress when trust is too low", () => {
		const newStage = updateRelationshipStage("familiar", 10, 0, 40);

		expect(newStage).toBe("acquaintance");
	});

	test("does not progress when too many negative interactions", () => {
		const newStage = updateRelationshipStage("familiar", 4, 5, 70);

		expect(newStage).toBe("acquaintance");
	});
});

describe("PsychologyEngine - RealismUtils", () => {
	test("getFillerWords returns appropriate filler words", () => {
		const emotionalState = {
			arousal: 70,
			confusion: 60,
			engagement: 50,
			enthusiasm: 30,
			frustration: 40,
			trust: 50,
			valence: 20,
		};

		const fillers = RealismUtils.getFillerWords(emotionalState, 3);

		expect(fillers.length).toBeGreaterThan(0);
		expect(fillers.length).toBeLessThanOrEqual(3);
		expect(fillers.every((f) => typeof f === "string")).toBe(true);
	});

	test("shouldMakeIrrationalDecision returns boolean based on neuroticism", () => {
		const highNeuroticism = {
			agreeableness: 50,
			conscientiousness: 50,
			extraversion: 50,
			neuroticism: 85,
			openness: 50,
		};
		const lowNeuroticism = {
			agreeableness: 50,
			conscientiousness: 50,
			extraversion: 50,
			neuroticism: 15,
			openness: 50,
		};
		const negativeEmotionalState = {
			arousal: 80,
			confusion: 40,
			engagement: 30,
			enthusiasm: 10,
			frustration: 70,
			trust: 20,
			valence: -40,
		};

		const highNeuroticismDecisions = Array.from({ length: 100 }, () =>
			RealismUtils.shouldMakeIrrationalDecision(
				highNeuroticism,
				negativeEmotionalState,
				80,
			),
		);
		const lowNeuroticismDecisions = Array.from({ length: 100 }, () =>
			RealismUtils.shouldMakeIrrationalDecision(
				lowNeuroticism,
				negativeEmotionalState,
				80,
			),
		);

		const highIrrationalCount = highNeuroticismDecisions.filter(Boolean).length;
		const lowIrrationalCount = lowNeuroticismDecisions.filter(Boolean).length;

		expect(highIrrationalCount).toBeGreaterThan(lowIrrationalCount);
	});

	test("calculateVerbosity returns higher values for extraverted personas", () => {
		const highEngagementState = {
			arousal: 60,
			confusion: 20,
			engagement: 85,
			enthusiasm: 70,
			frustration: 10,
			trust: 60,
			valence: 40,
		};
		const lowEngagementState = {
			arousal: 30,
			confusion: 40,
			engagement: 20,
			enthusiasm: 10,
			frustration: 60,
			trust: 30,
			valence: -20,
		};
		const highExtraversion = {
			agreeableness: 50,
			conscientiousness: 50,
			extraversion: 80,
			neuroticism: 30,
			openness: 50,
		};
		const lowExtraversion = {
			agreeableness: 50,
			conscientiousness: 50,
			extraversion: 20,
			neuroticism: 30,
			openness: 50,
		};

		const highVerbosity = RealismUtils.calculateVerbosity(
			highEngagementState,
			highExtraversion,
		);
		const lowVerbosity = RealismUtils.calculateVerbosity(
			lowEngagementState,
			lowExtraversion,
		);

		expect(highVerbosity).toBeGreaterThan(lowVerbosity);
	});

	test("generateMinorContradiction returns string or null", () => {
		// Run multiple times since it's probabilistic
		const results: (string | null)[] = [];
		for (let i = 0; i < 50; i++) {
			const contradiction = RealismUtils.generateMinorContradiction("3000");
			results.push(contradiction);
		}

		// Should have some nulls (90% of the time) and some strings (10% of the time)
		const hasNulls = results.some((r) => r === null);
		expect(hasNulls).toBe(true);

		// If any non-null, verify they're strings
		const nonNullResults = results.filter((r) => r !== null);
		if (nonNullResults.length > 0) {
			expect(nonNullResults.every((r) => typeof r === "string")).toBe(true);
		}
	});
});
