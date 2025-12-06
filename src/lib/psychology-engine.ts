import type {
	PersonaProfile,
	PsychologicalState,
} from "@/db/schema/simulation";

/**
 * PsychologyEngine - Core module for managing realistic psychological simulation of client personas
 *
 * This module handles:
 * - Emotional state evolution with gradual transitions
 * - Decision-making progression tracking
 * - Conversation memory and consistency checking
 * - Behavior guidance generation for AI responses
 * - Realism features (controlled randomness, natural speech patterns)
 */

// ============================================================================
// Type Definitions
// ============================================================================

export type EmotionalState = {
	valence: number; // -100 (negative) to 100 (positive)
	arousal: number; // 0 (calm) to 100 (activated)
	trust: number; // 0-100
	engagement: number; // 0-100
	frustration: number; // 0-100
	enthusiasm: number; // 0-100
	confusion: number; // 0-100
};

export type BigFive = {
	openness: number; // 0-100
	conscientiousness: number; // 0-100
	extraversion: number; // 0-100
	agreeableness: number; // 0-100
	neuroticism: number; // 0-100
};

export type SalesProfile = {
	riskTolerance: number; // 0-100
	decisionSpeed: number; // 0-100
	authorityLevel: number; // 0-100
	priceSensitivity: number; // 0-100
	trustThreshold: number; // 0-100
};

export type DecisionStage =
	| "unaware"
	| "problem_aware"
	| "solution_aware"
	| "product_aware"
	| "evaluating"
	| "ready_to_decide"
	| "committed"
	| "rejected";

export type RelationshipStage =
	| "stranger"
	| "acquaintance"
	| "familiar"
	| "trusted";

export type EmotionalTrigger = {
	type:
		| "empathy"
		| "pressure"
		| "listening"
		| "ignore_objection"
		| "value_clarity"
		| "repetition"
		| "interruption"
		| "personalization";
	intensity: number; // 0-10
};

export type EmotionalImpact = {
	emotionChanges: Partial<EmotionalState>;
	trigger: EmotionalTrigger;
};

export type EmotionUpdateConfig = {
	maxDelta: number; // Maximum change per turn (e.g., 15)
	decayRate: number; // Natural decay toward baseline (e.g., 0.1)
	momentumFactor: number; // How much emotions carry forward (e.g., 0.3)
};

export type BehaviorGuidance = {
	emotionalTone: string;
	responseLength: "terse" | "moderate" | "verbose";
	shouldReference: Array<{
		type: "fact" | "promise" | "objection" | "question";
		content: string;
	}>;
	fillerWords: string[];
	hesitationLevel: number; // 0-10
	tangentProbability: number; // 0-1
	irrationalityFactor: number; // 0-1 (chance of mood-driven decision)
};

export type ConsistencyResult = {
	isConsistent: boolean;
	conflictDetails?: string;
	shouldClarify: boolean;
};

// ============================================================================
// Default Configuration
// ============================================================================

const DEFAULT_EMOTION_CONFIG: EmotionUpdateConfig = {
	decayRate: 0.1,
	maxDelta: 15,
	momentumFactor: 0.3,
};

const INITIAL_RELATIONSHIP_STAGE: RelationshipStage = "stranger";

// ============================================================================
// Core Functions
// ============================================================================

/**
 * Initializes psychological state from a persona profile
 */
export function initializeState(persona: PersonaProfile): PsychologicalState {
	// Use emotional baseline from psychology if available, otherwise derive from personality traits
	const baseline = persona.psychology?.emotionalBaseline || {
		arousal: 50,
		engagement: 50,
		trust: 40,
		valence: 0,
	};

	// Initialize with baseline emotions plus sales-specific emotions
	const currentEmotions: EmotionalState = {
		...baseline,
		confusion: 20, // Slight initial confusion
		enthusiasm: 30, // Moderate initial enthusiasm
		frustration: 0, // No frustration yet
	};

	// Determine initial decision stage based on contact type (will be set by orchestrator)
	const initialStage: DecisionStage = "unaware";

	return {
		conversationMemory: {
			facts: [],
			objectionsRaised: [],
			questionsAsked: [],
			sellerPromises: [],
		},
		currentEmotions,
		decisionProgression: {
			accelerators: [],
			blockers: [],
			confidence: 20, // Low initial confidence
			stage: initialStage,
		},
		emotionHistory: [
			{
				emotions: { ...currentEmotions },
				turnIndex: 0,
			},
		],
		relationshipState: {
			negativeInteractions: 0,
			positiveInteractions: 0,
			stage: INITIAL_RELATIONSHIP_STAGE,
		},
	};
}

/**
 * Analyzes seller turn text for emotional triggers
 */
export function analyzeSellerTurn(
	sellerText: string,
	persona: PersonaProfile,
): EmotionalImpact[] {
	const impacts: EmotionalImpact[] = [];
	const lowerText = sellerText.toLowerCase();

	// Empathy detection (questions about client's needs/situation)
	if (
		lowerText.match(
			/cómo|necesitas|te gustaría|qué buscas|cuál es tu|preocupa|importante para ti/,
		)
	) {
		impacts.push({
			emotionChanges: {
				engagement: 5,
				trust: 3,
				valence: 5,
			},
			trigger: { intensity: 6, type: "empathy" },
		});
	}

	// Active listening (references to what client said)
	if (lowerText.match(/entiendo que|mencionaste|dijiste|comentaste/)) {
		impacts.push({
			emotionChanges: {
				engagement: 4,
				trust: 5,
			},
			trigger: { intensity: 5, type: "listening" },
		});
	}

	// Pressure tactics (urgency, limited time)
	if (
		lowerText.match(
			/solo hoy|última oportunidad|ahora o nunca|tienes que decidir|no puedes perder/,
		)
	) {
		const neuroticism = persona.psychology?.bigFive.neuroticism || 50;
		impacts.push({
			emotionChanges: {
				arousal: 10,
				frustration: neuroticism > 60 ? 8 : 4,
				trust: -6,
				valence: -5,
			},
			trigger: { intensity: 8, type: "pressure" },
		});
	}

	// Value clarity (clear benefit explanations)
	if (
		lowerText.match(
			/esto te permite|beneficio|ventaja|te ayuda a|soluciona tu|resuelve/,
		)
	) {
		impacts.push({
			emotionChanges: {
				confusion: -5,
				enthusiasm: 6,
				valence: 4,
			},
			trigger: { intensity: 6, type: "value_clarity" },
		});
	}

	// Repetition detection (saying same thing multiple times)
	const words = sellerText.split(/\s+/);
	const uniqueWords = new Set(words);
	if (words.length > 20 && uniqueWords.size / words.length < 0.6) {
		impacts.push({
			emotionChanges: {
				engagement: -6,
				frustration: 5,
			},
			trigger: { intensity: 5, type: "repetition" },
		});
	}

	// Personalization (uses client's name, references their situation)
	const nameUsed =
		persona.name && lowerText.includes(persona.name.toLowerCase());
	if (nameUsed || lowerText.match(/en tu caso|para tu situación/)) {
		impacts.push({
			emotionChanges: {
				engagement: 4,
				trust: 4,
				valence: 3,
			},
			trigger: { intensity: 5, type: "personalization" },
		});
	}

	return impacts;
}

/**
 * Updates emotional state with gradual transitions, decay, and momentum
 */
export function updateEmotionalState(
	current: EmotionalState,
	impacts: EmotionalImpact[],
	personality: BigFive,
	config: EmotionUpdateConfig = DEFAULT_EMOTION_CONFIG,
): EmotionalState {
	// Start with current state
	const updated = { ...current };

	// Apply all impacts
	for (const impact of impacts) {
		for (const [emotion, change] of Object.entries(impact.emotionChanges)) {
			const key = emotion as keyof EmotionalState;
			const currentValue = updated[key];
			let targetChange = change;

			// Personality influences emotional reactions
			if (emotion === "frustration" || emotion === "arousal") {
				// High neuroticism amplifies negative emotions
				const neuroticism = personality.neuroticism / 100;
				targetChange *= 1 + neuroticism * 0.5;
			}

			if (emotion === "valence" && change < 0) {
				// High agreeableness dampens negative valence
				const agreeableness = personality.agreeableness / 100;
				targetChange *= 1 - agreeableness * 0.3;
			}

			// Clamp change to maxDelta
			const clampedChange = Math.max(
				-config.maxDelta,
				Math.min(config.maxDelta, targetChange),
			);

			updated[key] = currentValue + clampedChange;
		}
	}

	// Apply decay toward baseline (assumes 0 for negative emotions, 50 for others)
	const baselines: Partial<EmotionalState> = {
		arousal: 50,
		confusion: 20,
		engagement: 50,
		enthusiasm: 30,
		frustration: 0,
		trust: 40,
		valence: 0,
	};

	for (const [emotion, baseline] of Object.entries(baselines)) {
		const key = emotion as keyof EmotionalState;
		const current = updated[key];
		const decay = (baseline - current) * config.decayRate;
		updated[key] = current + decay;
	}

	// Clamp all values to valid ranges
	updated.valence = Math.max(-100, Math.min(100, updated.valence));
	updated.arousal = Math.max(0, Math.min(100, updated.arousal));
	updated.trust = Math.max(0, Math.min(100, updated.trust));
	updated.engagement = Math.max(0, Math.min(100, updated.engagement));
	updated.frustration = Math.max(0, Math.min(100, updated.frustration));
	updated.enthusiasm = Math.max(0, Math.min(100, updated.enthusiasm));
	updated.confusion = Math.max(0, Math.min(100, updated.confusion));

	return updated;
}

/**
 * Updates decision progression based on emotional state and conversation context
 */
export function updateDecisionProgression(
	currentStage: DecisionStage,
	emotionalState: EmotionalState,
	conversationTurns: number,
): {
	accelerators: string[];
	blockers: string[];
	confidence: number;
	stage: DecisionStage;
} {
	let newStage = currentStage;
	const blockers: string[] = [];
	const accelerators: string[] = [];

	// Determine confidence based on emotional state
	const confidence = Math.round(
		(emotionalState.trust * 0.4 +
			emotionalState.enthusiasm * 0.3 +
			emotionalState.engagement * 0.2 +
			(100 - emotionalState.confusion) * 0.1) /
			1,
	);

	// Add blockers based on negative emotions
	if (emotionalState.confusion > 50) {
		blockers.push("No entiendo bien el producto");
	}
	if (emotionalState.frustration > 60) {
		blockers.push("Me siento presionado");
	}
	if (emotionalState.trust < 40) {
		blockers.push("No confío en el vendedor");
	}

	// Add accelerators based on positive state
	if (emotionalState.enthusiasm > 60) {
		accelerators.push("El producto me emociona");
	}
	if (emotionalState.trust > 70) {
		accelerators.push("Confío en este vendedor");
	}
	if (emotionalState.engagement > 70 && emotionalState.confusion < 30) {
		accelerators.push("Entiendo el valor claramente");
	}

	// Progress stages based on confidence and conversation progress
	if (conversationTurns >= 3 && currentStage === "unaware") {
		newStage = "problem_aware";
	}
	if (
		conversationTurns >= 5 &&
		confidence > 40 &&
		currentStage === "problem_aware"
	) {
		newStage = "solution_aware";
	}
	if (
		conversationTurns >= 7 &&
		confidence > 50 &&
		currentStage === "solution_aware"
	) {
		newStage = "product_aware";
	}
	if (
		conversationTurns >= 10 &&
		confidence > 60 &&
		currentStage === "product_aware"
	) {
		newStage = "evaluating";
	}
	if (
		confidence > 75 &&
		emotionalState.enthusiasm > 65 &&
		currentStage === "evaluating"
	) {
		newStage = "ready_to_decide";
	}

	// Can regress if confidence drops significantly
	if (confidence < 30 && emotionalState.frustration > 70) {
		newStage = "rejected";
	}

	return {
		accelerators,
		blockers,
		confidence,
		stage: newStage,
	};
}

/**
 * Generates behavior guidance for AI response generation
 */
export function generateBehaviorGuidance(
	state: PsychologicalState,
	persona: PersonaProfile,
): BehaviorGuidance {
	const emotions = state.currentEmotions;
	const personality = persona.psychology;

	// Determine emotional tone
	let emotionalTone = "neutral";
	if (emotions.valence > 30 && emotions.enthusiasm > 50) {
		emotionalTone = "positivo y entusiasmado";
	} else if (emotions.valence < -30 || emotions.frustration > 60) {
		emotionalTone = "frustrado o molesto";
	} else if (emotions.confusion > 60) {
		emotionalTone = "confundido y buscando claridad";
	} else if (emotions.engagement < 30) {
		emotionalTone = "desinteresado o distraído";
	}

	// Determine response length based on engagement and extraversion
	let responseLength: "terse" | "moderate" | "verbose" = "moderate";
	const extraversion = personality?.bigFive.extraversion || 50;
	if (emotions.engagement < 30 || emotions.frustration > 70) {
		responseLength = "terse";
	} else if (extraversion > 70 && emotions.engagement > 60) {
		responseLength = "verbose";
	} else if (personality?.communicationStyle.verbosity) {
		responseLength = personality.communicationStyle.verbosity;
	}

	// Generate filler words based on emotional state
	const fillerWords: string[] = [];
	if (emotions.confusion > 50) {
		fillerWords.push("Este...", "No sé...", "Hmm...");
	}
	if (emotions.arousal > 60) {
		fillerWords.push("Mira...", "O sea...");
	}
	if (extraversion > 60) {
		fillerWords.push("Ya...", "Claro...");
	}

	// Hesitation level (based on confusion and lack of trust)
	const hesitationLevel = Math.round(
		(emotions.confusion * 0.5 +
			(100 - emotions.trust) * 0.3 +
			emotions.arousal * 0.2) /
			10,
	);

	// Tangent probability (going off-topic)
	const tangentProbability = Math.max(
		0,
		Math.min(0.3, (100 - emotions.engagement) / 300),
	);

	// Irrationality factor (mood-driven decisions)
	const neuroticism = personality?.bigFive.neuroticism || 50;
	const irrationalityFactor =
		(neuroticism / 100) *
		(emotions.arousal / 100) *
		Math.max(0, 1 - emotions.valence / 100);

	// What to reference from memory
	const shouldReference: BehaviorGuidance["shouldReference"] = [];

	// Reference unresolved objections
	const unresolvedObjections = state.conversationMemory.objectionsRaised.filter(
		(obj) => !obj.resolved,
	);
	if (unresolvedObjections.length > 0 && emotions.frustration > 40) {
		const latest = unresolvedObjections[unresolvedObjections.length - 1];
		if (latest) {
			shouldReference.push({
				content: latest.objection,
				type: "objection",
			});
		}
	}

	// Reference unfulfilled promises if trust is low
	const unfulfilled = state.conversationMemory.sellerPromises.filter(
		(p) => !p.fulfilled,
	);
	if (unfulfilled.length > 0 && emotions.trust < 50) {
		const latest = unfulfilled[unfulfilled.length - 1];
		if (latest) {
			shouldReference.push({
				content: latest.content,
				type: "promise",
			});
		}
	}

	// Reference unanswered questions if confusion is high
	const unanswered = state.conversationMemory.questionsAsked.filter(
		(q) => !q.answered,
	);
	if (unanswered.length > 0 && emotions.confusion > 50) {
		const latest = unanswered[unanswered.length - 1];
		if (latest) {
			shouldReference.push({
				content: latest.question,
				type: "question",
			});
		}
	}

	return {
		emotionalTone,
		fillerWords,
		hesitationLevel,
		irrationalityFactor,
		responseLength,
		shouldReference,
		tangentProbability,
	};
}

/**
 * Checks consistency of new fact against conversation memory
 */
export function checkConsistency(
	memory: PsychologicalState["conversationMemory"],
	newFact: { topic: string; value: string },
): ConsistencyResult {
	// Look for existing facts on the same topic
	const existingFacts = memory.facts.filter((f) => f.topic === newFact.topic);

	if (existingFacts.length === 0) {
		return { isConsistent: true, shouldClarify: false };
	}

	// Check for contradictions
	for (const existing of existingFacts) {
		// For numeric values, check if they're within 30% tolerance (allows for "human messiness")
		const existingNum = Number.parseFloat(existing.value);
		const newNum = Number.parseFloat(newFact.value);

		if (!Number.isNaN(existingNum) && !Number.isNaN(newNum)) {
			const tolerance = 0.3;
			const diff = Math.abs(existingNum - newNum) / existingNum;

			if (diff > tolerance) {
				return {
					conflictDetails: `Dijiste ${existing.value} antes, pero ahora dices ${newFact.value}`,
					isConsistent: false,
					shouldClarify: true,
				};
			}
			// Within tolerance - allow minor inconsistency
			return { isConsistent: true, shouldClarify: false };
		}

		// For non-numeric values, check exact match
		if (existing.value.toLowerCase() !== newFact.value.toLowerCase()) {
			return {
				conflictDetails: `Mencionaste "${existing.value}" antes`,
				isConsistent: false,
				shouldClarify: true,
			};
		}
	}

	return { isConsistent: true, shouldClarify: false };
}

/**
 * Updates relationship stage based on interaction quality
 */
export function updateRelationshipStage(
	currentStage: RelationshipStage,
	positiveInteractions: number,
	negativeInteractions: number,
	trustLevel: number,
): RelationshipStage {
	const netPositive = positiveInteractions - negativeInteractions;

	if (currentStage === "stranger") {
		if (netPositive >= 3 && trustLevel > 50) {
			return "acquaintance";
		}
	} else if (currentStage === "acquaintance") {
		if (netPositive >= 6 && trustLevel > 65) {
			return "familiar";
		} else if (netPositive < 1 || trustLevel < 40) {
			return "stranger";
		}
	} else if (currentStage === "familiar") {
		if (netPositive >= 10 && trustLevel > 80) {
			return "trusted";
		} else if (netPositive < 3 || trustLevel < 50) {
			return "acquaintance";
		}
	} else if (currentStage === "trusted") {
		if (netPositive < 5 || trustLevel < 60) {
			return "familiar";
		}
	}

	return currentStage;
}

/**
 * Updates conversation memory by extracting and storing key information from turns
 */
export function updateMemory(
	currentMemory: PsychologicalState["conversationMemory"],
	sellerText: string,
	clientText: string,
	turnIndex: number,
): PsychologicalState["conversationMemory"] {
	const updated = { ...currentMemory };

	// Extract facts from client responses (budget, timeframe, needs)
	const budgetMatch = clientText.match(/presupuesto.*?(\d+)/i);
	if (budgetMatch?.[1]) {
		updated.facts.push({
			importance: "high",
			topic: "budget",
			turnIndex,
			value: budgetMatch[1],
		});
	}

	// Extract seller promises (guarantees, commitments, follow-ups)
	const promisePatterns = [
		/te (garantizo|aseguro|prometo)/i,
		/voy a (llamarte|enviarte|mandarte)/i,
		/te (llamo|envío|mando)/i,
	];

	for (const pattern of promisePatterns) {
		if (pattern.test(sellerText)) {
			updated.sellerPromises.push({
				content: sellerText.slice(0, 100), // Store first 100 chars
				fulfilled: false,
				turnIndex,
			});
			break; // Only store one promise per turn
		}
	}

	// Extract client questions
	if (
		clientText.includes("?") ||
		/cómo|qué|cuándo|dónde|por qué/i.test(clientText)
	) {
		updated.questionsAsked.push({
			answered: false, // Will be marked true if seller addresses it in next turn
			question: clientText,
			turnIndex,
		});
	}

	// Extract objections
	const objectionPatterns = [
		/pero|sin embargo/i,
		/no (estoy|me) (seguro|convenc)/i,
		/muy caro|costoso/i,
		/no (tengo|cuento con)/i,
		/ya tengo/i,
	];

	for (const pattern of objectionPatterns) {
		if (pattern.test(clientText)) {
			updated.objectionsRaised.push({
				objection: clientText,
				resolved: false, // Will be marked true if seller handles it well
				turnIndex,
			});
			break;
		}
	}

	// Mark questions as answered if seller addresses them
	for (const question of updated.questionsAsked) {
		if (!question.answered && question.turnIndex < turnIndex) {
			// Check if seller's response seems to address the question
			// Simple heuristic: if seller text is longer than 20 words, assume addressed
			if (sellerText.split(/\s+/).length > 20) {
				question.answered = true;
			}
		}
	}

	return updated;
}

/**
 * Natural speech pattern utilities for realistic responses
 */
export const RealismUtils = {
	/**
	 * Calculate response verbosity based on engagement and personality
	 */
	calculateVerbosity: (
		emotionalState: EmotionalState,
		personality: BigFive,
	): number => {
		// Base verbosity on extraversion
		let verbosity = personality.extraversion;

		// Adjust based on engagement
		if (emotionalState.engagement < 30) {
			verbosity *= 0.5; // Very terse when disengaged
		} else if (emotionalState.engagement > 70) {
			verbosity *= 1.3; // More verbose when engaged
		}

		// Reduce verbosity when frustrated
		if (emotionalState.frustration > 60) {
			verbosity *= 0.6;
		}

		return Math.max(0, Math.min(100, verbosity));
	},

	/**
	 * Generate minor contradiction for realism (within tolerance)
	 */
	generateMinorContradiction: (originalValue: string): string | null => {
		// Only apply 10% of the time for realism
		if (Math.random() > 0.1) {
			return null;
		}

		const numValue = Number.parseFloat(originalValue);
		if (!Number.isNaN(numValue)) {
			// Vary by up to 15% (within consistency tolerance of 30%)
			const variation = numValue * (Math.random() * 0.15 - 0.075);
			return Math.round(numValue + variation).toString();
		}

		return null;
	},
	/**
	 * Get filler words appropriate for emotional state
	 */
	getFillerWords: (
		emotionalState: EmotionalState,
		count: number = 1,
	): string[] => {
		const options: string[] = [];

		if (emotionalState.confusion > 50) {
			options.push("Este...", "No sé...", "Hmm...", "A ver...");
		}
		if (emotionalState.arousal > 60) {
			options.push("Mira...", "O sea...", "Bueno...");
		}
		if (emotionalState.frustration > 50) {
			options.push("Ya...", "Escucha...", "Mira...");
		}
		if (options.length === 0) {
			options.push("Este...", "Bueno...", "Eh...");
		}

		// Randomly select from options
		const selected: string[] = [];
		for (let i = 0; i < count; i++) {
			const randomIndex = Math.floor(Math.random() * options.length);
			const word = options[randomIndex];
			if (word) {
				selected.push(word);
			}
		}

		return selected;
	},

	/**
	 * Determine if persona should make an irrational decision based on mood
	 */
	shouldMakeIrrationalDecision: (
		personality: BigFive,
		emotionalState: EmotionalState,
		decisionQuality: number, // 0-100: how objectively good is the offer
	): boolean => {
		const anxietyFactor = personality.neuroticism / 100;
		const currentAnxiety =
			(emotionalState.arousal / 100) * (1 - emotionalState.valence / 100);

		// Higher neuroticism + high arousal + negative valence = might reject good offers
		const irrationality = anxietyFactor * currentAnxiety * 0.5;

		// Only applies to objectively good offers (quality > 60)
		return Math.random() < irrationality && decisionQuality > 60;
	},
};
