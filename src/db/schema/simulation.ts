import { sql } from "drizzle-orm";
import {
	boolean,
	integer,
	jsonb,
	text,
	timestamp,
	uuid,
} from "drizzle-orm/pg-core";
import { user } from "./auth.ts";
import { schema } from "./schema.ts";

export const contactTypeEnum = schema.enum("contact_type", [
	"cold_call",
	"follow_up",
	"inbound_callback",
]);
export const sessionStatusEnum = schema.enum("simulation_status", [
	"pending_persona",
	"active",
	"completed",
]);
export const turnRoleEnum = schema.enum("turn_role", ["seller", "client"]);

export type ScenarioConfig = {
	productName: string;
	description: string;
	priceDetails?: string;
	callObjective: string;
	contactType: (typeof contactTypeEnum.enumValues)[number];
	targetProfile: {
		ageRange: string;
		gender?: string;
		location: string;
		socioeconomicLevel: string;
		educationLevel: string;
		pains: string[];
		motivations: string[];
		preferredChannel: string;
		decisionStyle: string;
	};
	simulationPreferences: {
		maxDurationMinutes: number;
		clientIntensity: "tranquilo" | "neutro" | "dificil";
		realism: "natural" | "humano" | "exigente";
		allowHangups: boolean;
		deleteAfterAnalysis?: boolean;
	};
};

export const simulationSessions = schema.table("simulation_session", {
	createdAt: timestamp("created_at", { withTimezone: false })
		.defaultNow()
		.notNull(),
	deleteAfterAnalysis: boolean("delete_after_analysis")
		.default(false)
		.notNull(),
	endedAt: timestamp("ended_at", { withTimezone: false }),
	id: uuid("id").defaultRandom().primaryKey(),
	scenarioConfig: jsonb("scenario_config").$type<ScenarioConfig>().notNull(),
	status: sessionStatusEnum("status").default("pending_persona").notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: false })
		.defaultNow()
		.notNull(),
	userId: text("user_id")
		.references(() => user.id, { onDelete: "cascade" })
		.notNull(),
});

export type PersonaProfile = {
	name: string;
	age: number;
	location: string;
	socioeconomicLevel: string;
	educationLevel: string;
	occupation: string;
	motivations: string[];
	pains: string[];
	personalityTraits: string[];
	preferredChannel: string;
	briefStory: string;
	callAttitude: string;
	// === New: Structured Psychology (optional for backward compatibility) ===
	psychology?: {
		bigFive: {
			openness: number; // 0-100
			conscientiousness: number; // 0-100
			extraversion: number; // 0-100
			agreeableness: number; // 0-100
			neuroticism: number; // 0-100
		};
		salesProfile: {
			riskTolerance: number; // 0-100
			decisionSpeed: number; // 0-100
			authorityLevel: number; // 0-100
			priceSensitivity: number; // 0-100
			trustThreshold: number; // 0-100
		};
		communicationStyle: {
			verbosity: "terse" | "moderate" | "verbose";
			formality: "casual" | "professional" | "formal";
			directness: "indirect" | "balanced" | "direct";
			emotionalExpression: "reserved" | "moderate" | "expressive";
		};
		emotionalBaseline: {
			valence: number; // -100 to 100
			arousal: number; // 0 to 100
			trust: number; // 0-100
			engagement: number; // 0-100
		};
	};
	// === New: Decision Context (optional for backward compatibility) ===
	decisionContext?: {
		budgetRange: { min: number; max: number };
		timeframe: "immediate" | "short_term" | "long_term" | "indefinite";
		priorExperience: "none" | "bad" | "neutral" | "positive";
		competitorsConsidered: string[];
		keyDecisionCriteria: string[];
	};
};

export const personaSnapshots = schema.table("persona_snapshot", {
	createdAt: timestamp("created_at", { withTimezone: false })
		.defaultNow()
		.notNull(),
	id: uuid("id").defaultRandom().primaryKey(),
	persona: jsonb("persona").$type<PersonaProfile>().notNull(),
	sessionId: uuid("session_id")
		.references(() => simulationSessions.id, { onDelete: "cascade" })
		.notNull(),
});

export type ConversationTurnMeta = {
	interest?: number;
	interruptions?: boolean;
	clientWantsToEnd?: boolean;
	// === New: Emotional State Snapshot ===
	emotionalState?: {
		valence: number; // -100 to 100
		arousal: number; // 0 to 100
		trust: number; // 0-100
		engagement: number; // 0-100
		frustration: number; // 0-100
		enthusiasm: number; // 0-100
		confusion: number; // 0-100
	};
	// === New: Decision State ===
	decisionState?: {
		stage: string;
		confidence: number; // 0-100
		newBlockers?: string[];
		resolvedBlockers?: string[];
	};
	// === New: Memory Updates ===
	memoryUpdates?: {
		newFacts?: Array<{ topic: string; value: string }>;
		questionsAsked?: string[];
		objectionsRaised?: string[];
		promisesNoted?: string[];
	};
	// === New: Behavioral Indicators ===
	behaviorIndicators?: {
		engagementLevel: "disengaged" | "passive" | "active" | "highly_engaged";
		responseQuality: "minimal" | "adequate" | "detailed";
		emotionalTone: "negative" | "neutral" | "positive";
	};
};

export const conversationTurns = schema.table("conversation_turn", {
	content: text("content").notNull(),
	createdAt: timestamp("created_at", { withTimezone: false })
		.defaultNow()
		.notNull(),
	id: uuid("id").defaultRandom().primaryKey(),
	meta: jsonb("meta")
		.$type<ConversationTurnMeta>()
		.default(sql`'{}'::jsonb`)
		.notNull(),
	role: turnRoleEnum("role").notNull(),
	sessionId: uuid("session_id")
		.references(() => simulationSessions.id, { onDelete: "cascade" })
		.notNull(),
	turnIndex: integer("turn_index").notNull().default(0),
});

export type KeyMoment = {
	turnId: string;
	quote: string;
	insight: string;
	recommendation: string;
};

export type ImprovementItem = {
	title: string;
	action: string;
};

export const analyses = schema.table("analysis", {
	createdAt: timestamp("created_at", { withTimezone: false })
		.defaultNow()
		.notNull(),
	id: uuid("id").defaultRandom().primaryKey(),
	improvements: jsonb("improvements").$type<ImprovementItem[]>().notNull(),
	keyMoments: jsonb("key_moments").$type<KeyMoment[]>().notNull(),
	score: integer("score").notNull(),
	sessionId: uuid("session_id")
		.references(() => simulationSessions.id, { onDelete: "cascade" })
		.notNull()
		.unique(),
	successes: jsonb("successes").$type<string[]>().notNull(),
});

export type PsychologicalState = {
	currentEmotions: {
		valence: number; // -100 to 100
		arousal: number; // 0 to 100
		trust: number; // 0-100
		engagement: number; // 0-100
		frustration: number; // 0-100
		enthusiasm: number; // 0-100
		confusion: number; // 0-100
	};
	emotionHistory: Array<{
		turnIndex: number;
		emotions: { [key: string]: number };
	}>;
	decisionProgression: {
		stage: string;
		confidence: number; // 0-100
		blockers: string[];
		accelerators: string[];
	};
	relationshipState: {
		stage: "stranger" | "acquaintance" | "familiar" | "trusted";
		positiveInteractions: number;
		negativeInteractions: number;
	};
	conversationMemory: {
		facts: Array<{
			topic: string;
			value: string;
			turnIndex: number;
			importance: string;
		}>;
		sellerPromises: Array<{
			content: string;
			turnIndex: number;
			fulfilled: boolean;
		}>;
		questionsAsked: Array<{
			question: string;
			turnIndex: number;
			answered: boolean;
		}>;
		objectionsRaised: Array<{
			objection: string;
			turnIndex: number;
			resolved: boolean;
		}>;
	};
};

export const psychologicalStates = schema.table("psychological_state", {
	createdAt: timestamp("created_at", { withTimezone: false })
		.defaultNow()
		.notNull(),
	id: uuid("id").defaultRandom().primaryKey(),
	sessionId: uuid("session_id")
		.references(() => simulationSessions.id, { onDelete: "cascade" })
		.notNull()
		.unique(),
	state: jsonb("state").$type<PsychologicalState>().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: false })
		.defaultNow()
		.notNull(),
});
