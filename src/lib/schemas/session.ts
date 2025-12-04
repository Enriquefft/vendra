import { z } from "zod";
import type { PersonaProfile, ScenarioConfig } from "@/db/schema/simulation";
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
	educationLevel: z.string().min(1),
	location: z.string().min(1),
	motivations: z.array(z.string()).min(1),
	name: z.string().min(1),
	occupation: z.string().min(1),
	pains: z.array(z.string()).min(1),
	personalityTraits: z.array(z.string()).min(2),
	preferredChannel: z.string().min(1),
	socioeconomicLevel: z.string().min(1),
});

export type ScenarioConfigInput = z.infer<typeof scenarioConfigSchema>;
type _ScenarioConfigCompatibility = ScenarioConfigInput extends ScenarioConfig
	? true
	: never;
