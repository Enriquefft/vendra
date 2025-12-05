import { describe, expect, test } from "bun:test";
import { z } from "zod";

/**
 * Schema for key moments in the analysis.
 * Duplicated from analysis-engine.ts to avoid importing DB deps during tests.
 */
const keyMomentSchema = z.object({
	insight: z.string().min(1),
	quote: z.string().min(1),
	recommendation: z.string().min(1),
	turnId: z.string().min(1),
});

/**
 * Schema for improvement items in the analysis.
 */
const improvementItemSchema = z.object({
	action: z.string().min(1),
	title: z.string().min(1),
});

/**
 * Schema for the full analysis output from the AI.
 */
const analysisOutputSchema = z.object({
	improvements: z.array(improvementItemSchema).min(1),
	keyMoments: z.array(keyMomentSchema).min(1),
	score: z.number().int().min(0).max(100),
	successes: z.array(z.string()).min(0),
});

describe("keyMomentSchema", () => {
	test("validates a valid key moment", () => {
		const validMoment = {
			insight: "El vendedor logró conectar emocionalmente con el cliente",
			quote: "Entiendo perfectamente tu situación, María",
			recommendation: "Continuar usando empatía en futuras llamadas",
			turnId: "123e4567-e89b-12d3-a456-426614174000",
		};

		const result = keyMomentSchema.safeParse(validMoment);
		expect(result.success).toBe(true);
	});

	test("rejects key moment with empty turnId", () => {
		const invalidMoment = {
			insight: "El vendedor logró conectar",
			quote: "Entiendo tu situación",
			recommendation: "Continuar usando empatía",
			turnId: "",
		};

		const result = keyMomentSchema.safeParse(invalidMoment);
		expect(result.success).toBe(false);
	});

	test("rejects key moment with empty quote", () => {
		const invalidMoment = {
			insight: "El vendedor logró conectar",
			quote: "",
			recommendation: "Continuar usando empatía",
			turnId: "123e4567-e89b-12d3-a456-426614174000",
		};

		const result = keyMomentSchema.safeParse(invalidMoment);
		expect(result.success).toBe(false);
	});

	test("rejects key moment missing required fields", () => {
		const invalidMoment = {
			quote: "Una cita",
			turnId: "123e4567-e89b-12d3-a456-426614174000",
		};

		const result = keyMomentSchema.safeParse(invalidMoment);
		expect(result.success).toBe(false);
	});
});

describe("improvementItemSchema", () => {
	test("validates a valid improvement item", () => {
		const validImprovement = {
			action:
				"Antes de presentar el precio, resume los beneficios clave que resuenan con el cliente",
			title: "Preparar el terreno antes del precio",
		};

		const result = improvementItemSchema.safeParse(validImprovement);
		expect(result.success).toBe(true);
	});

	test("rejects improvement with empty title", () => {
		const invalidImprovement = {
			action: "Hacer algo específico",
			title: "",
		};

		const result = improvementItemSchema.safeParse(invalidImprovement);
		expect(result.success).toBe(false);
	});

	test("rejects improvement with empty action", () => {
		const invalidImprovement = {
			action: "",
			title: "Mejorar rapport",
		};

		const result = improvementItemSchema.safeParse(invalidImprovement);
		expect(result.success).toBe(false);
	});
});

describe("analysisOutputSchema", () => {
	test("validates a complete valid analysis", () => {
		const validAnalysis = {
			improvements: [
				{
					action:
						"Hacer preguntas abiertas para entender mejor las necesidades",
					title: "Profundizar en descubrimiento",
				},
				{
					action: "Resumir beneficios antes de mencionar el precio",
					title: "Preparar el terreno para el precio",
				},
			],
			keyMoments: [
				{
					insight: "Buen uso de empatía para conectar",
					quote: "Entiendo perfectamente tu situación",
					recommendation: "Seguir usando este enfoque empático",
					turnId: "turn-1",
				},
			],
			score: 75,
			successes: [
				"Estableció rapport inicial",
				"Manejó bien la objeción de precio",
			],
		};

		const result = analysisOutputSchema.safeParse(validAnalysis);
		expect(result.success).toBe(true);
	});

	test("validates analysis with empty successes array", () => {
		const validAnalysis = {
			improvements: [
				{
					action: "Trabajar en todas las áreas",
					title: "Mejorar técnicas básicas",
				},
			],
			keyMoments: [
				{
					insight: "Momento difícil",
					quote: "No sé qué decir",
					recommendation: "Preparar respuestas",
					turnId: "turn-1",
				},
			],
			score: 30,
			successes: [],
		};

		const result = analysisOutputSchema.safeParse(validAnalysis);
		expect(result.success).toBe(true);
	});

	test("validates analysis with perfect score", () => {
		const validAnalysis = {
			improvements: [
				{
					action: "Mantener el excelente nivel",
					title: "Continuar practicando",
				},
			],
			keyMoments: [
				{
					insight: "Cierre perfecto",
					quote: "Gracias por tu compra",
					recommendation: "Excelente técnica",
					turnId: "turn-1",
				},
			],
			score: 100,
			successes: ["Todo excelente"],
		};

		const result = analysisOutputSchema.safeParse(validAnalysis);
		expect(result.success).toBe(true);
	});

	test("validates analysis with zero score", () => {
		const validAnalysis = {
			improvements: [
				{
					action: "Empezar desde cero con capacitación básica",
					title: "Revisar fundamentos",
				},
			],
			keyMoments: [
				{
					insight: "No hubo conexión",
					quote: "...",
					recommendation: "Practicar más",
					turnId: "turn-1",
				},
			],
			score: 0,
			successes: [],
		};

		const result = analysisOutputSchema.safeParse(validAnalysis);
		expect(result.success).toBe(true);
	});

	test("rejects score below 0", () => {
		const invalidAnalysis = {
			improvements: [
				{
					action: "Mejorar",
					title: "Mejora",
				},
			],
			keyMoments: [
				{
					insight: "Insight",
					quote: "Quote",
					recommendation: "Rec",
					turnId: "turn-1",
				},
			],
			score: -1,
			successes: [],
		};

		const result = analysisOutputSchema.safeParse(invalidAnalysis);
		expect(result.success).toBe(false);
	});

	test("rejects score above 100", () => {
		const invalidAnalysis = {
			improvements: [
				{
					action: "Mejorar",
					title: "Mejora",
				},
			],
			keyMoments: [
				{
					insight: "Insight",
					quote: "Quote",
					recommendation: "Rec",
					turnId: "turn-1",
				},
			],
			score: 101,
			successes: [],
		};

		const result = analysisOutputSchema.safeParse(invalidAnalysis);
		expect(result.success).toBe(false);
	});

	test("rejects non-integer score", () => {
		const invalidAnalysis = {
			improvements: [
				{
					action: "Mejorar",
					title: "Mejora",
				},
			],
			keyMoments: [
				{
					insight: "Insight",
					quote: "Quote",
					recommendation: "Rec",
					turnId: "turn-1",
				},
			],
			score: 75.5,
			successes: [],
		};

		const result = analysisOutputSchema.safeParse(invalidAnalysis);
		expect(result.success).toBe(false);
	});

	test("rejects empty improvements array", () => {
		const invalidAnalysis = {
			improvements: [],
			keyMoments: [
				{
					insight: "Insight",
					quote: "Quote",
					recommendation: "Rec",
					turnId: "turn-1",
				},
			],
			score: 75,
			successes: ["Success"],
		};

		const result = analysisOutputSchema.safeParse(invalidAnalysis);
		expect(result.success).toBe(false);
	});

	test("rejects empty keyMoments array", () => {
		const invalidAnalysis = {
			improvements: [
				{
					action: "Mejorar",
					title: "Mejora",
				},
			],
			keyMoments: [],
			score: 75,
			successes: ["Success"],
		};

		const result = analysisOutputSchema.safeParse(invalidAnalysis);
		expect(result.success).toBe(false);
	});

	test("rejects missing required fields", () => {
		const invalidAnalysis = {
			score: 75,
			successes: ["Success"],
		};

		const result = analysisOutputSchema.safeParse(invalidAnalysis);
		expect(result.success).toBe(false);
	});
});
