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
