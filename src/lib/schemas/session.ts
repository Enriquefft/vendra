import { z } from "zod";
import type { PersonaProfile } from "@/db/schema/simulation";
import { contactTypeEnum } from "@/db/schema/simulation";

export const scenarioConfigSchema = z.object({
	callObjective: z.string().min(1, "Define un objetivo para la llamada"),
	contactType: z.enum(contactTypeEnum.enumValues),
	description: z.string().min(1, "Agrega una descripción del producto"),
	priceDetails: z.string().optional(),
	productName: z.string().min(1, "El nombre del producto es requerido"),
	simulationPreferences: z.object({
		allowHangups: z.boolean(),
		clientIntensity: z.enum(["tranquilo", "neutro", "dificil"]),
		deleteAfterAnalysis: z.boolean().optional(),
		maxDurationMinutes: z.number().int().positive(),
		realism: z.enum(["natural", "humano", "exigente"]),
	}),
	targetProfile: z.object({
		ageRange: z.string().min(1),
		decisionStyle: z.string().min(1),
		educationLevel: z.string().min(1),
		gender: z.string().optional(),
		location: z.string().min(1),
		motivations: z.array(z.string()).min(1),
		pains: z.array(z.string()).min(1),
		preferredChannel: z.string().min(1),
		socioeconomicLevel: z.string().min(1),
	}),
});

export const personaProfileSchema: z.ZodType<PersonaProfile> = z.object({
	age: z.number().int().positive(),
	briefStory: z.string().min(1),
	callAttitude: z.string().min(1),
	// === New: Decision Context ===
	decisionContext: z
		.object({
			budgetRange: z.object({
				max: z.number(),
				min: z.number(),
			}),
			competitorsConsidered: z.array(z.string()),
			keyDecisionCriteria: z.array(z.string()),
			priorExperience: z.enum(["none", "bad", "neutral", "positive"]),
			timeframe: z.enum(["immediate", "short_term", "long_term", "indefinite"]),
		})
		.optional(),
	educationLevel: z.string().min(1),
	location: z.string().min(1),
	motivations: z.array(z.string()).min(1),
	name: z.string().min(1),
	occupation: z.string().min(1),
	pains: z.array(z.string()).min(1),
	personalityTraits: z.array(z.string()).min(2),
	preferredChannel: z.string().min(1),
	// === New: Structured Psychology ===
	psychology: z
		.object({
			bigFive: z.object({
				agreeableness: z.number().min(0).max(100),
				conscientiousness: z.number().min(0).max(100),
				extraversion: z.number().min(0).max(100),
				neuroticism: z.number().min(0).max(100),
				openness: z.number().min(0).max(100),
			}),
			communicationStyle: z.object({
				directness: z.enum(["indirect", "balanced", "direct"]),
				emotionalExpression: z.enum(["reserved", "moderate", "expressive"]),
				formality: z.enum(["casual", "professional", "formal"]),
				verbosity: z.enum(["terse", "moderate", "verbose"]),
			}),
			emotionalBaseline: z.object({
				arousal: z.number().min(0).max(100),
				engagement: z.number().min(0).max(100),
				trust: z.number().min(0).max(100),
				valence: z.number().min(-100).max(100),
			}),
			salesProfile: z.object({
				authorityLevel: z.number().min(0).max(100),
				decisionSpeed: z.number().min(0).max(100),
				priceSensitivity: z.number().min(0).max(100),
				riskTolerance: z.number().min(0).max(100),
				trustThreshold: z.number().min(0).max(100),
			}),
		})
		.optional(),
	socioeconomicLevel: z.string().min(1),
});

export type ScenarioConfigInput = z.infer<typeof scenarioConfigSchema>;
