// biome-ignore-all lint/suspicious/noExplicitAny: reason
import { describe, expect, test } from "bun:test";
import { z } from "zod";

/**
 * Schema for the client response from the AI.
 * This is duplicated from conversation-orchestrator.ts to avoid importing DB deps during tests.
 */
const clientResponseSchema = z.object({
	clientText: z.string().min(1),
	interest: z.number().int().min(1).max(10),
	interruption: z.boolean(),
	wantsToEnd: z.boolean(),
});

describe("clientResponseSchema", () => {
	test("validates a valid client response", () => {
		const validResponse = {
			clientText: "Hola, me interesa saber más sobre el producto.",
			interest: 7,
			interruption: false,
			wantsToEnd: false,
		};

		const result = clientResponseSchema.safeParse(validResponse);
		expect(result.success).toBe(true);
	});

	test("validates a response with high interest", () => {
		const validResponse = {
			clientText: "¡Me encanta! ¿Cuándo puedo empezar?",
			interest: 10,
			interruption: false,
			wantsToEnd: false,
		};

		const result = clientResponseSchema.safeParse(validResponse);
		expect(result.success).toBe(true);
	});

	test("validates a response with low interest wanting to end", () => {
		const validResponse = {
			clientText: "No me interesa, gracias. Hasta luego.",
			interest: 1,
			interruption: false,
			wantsToEnd: true,
		};

		const result = clientResponseSchema.safeParse(validResponse);
		expect(result.success).toBe(true);
	});

	test("validates a response with interruption", () => {
		const validResponse = {
			clientText: "Espera, espera, déjame preguntarte algo primero.",
			interest: 5,
			interruption: true,
			wantsToEnd: false,
		};

		const result = clientResponseSchema.safeParse(validResponse);
		expect(result.success).toBe(true);
	});

	test("rejects empty clientText", () => {
		const invalidResponse = {
			clientText: "",
			interest: 5,
			interruption: false,
			wantsToEnd: false,
		};

		const result = clientResponseSchema.safeParse(invalidResponse);
		expect(result.success).toBe(false);
	});

	test("rejects interest below 1", () => {
		const invalidResponse = {
			clientText: "Texto válido",
			interest: 0,
			interruption: false,
			wantsToEnd: false,
		};

		const result = clientResponseSchema.safeParse(invalidResponse);
		expect(result.success).toBe(false);
	});

	test("rejects interest above 10", () => {
		const invalidResponse = {
			clientText: "Texto válido",
			interest: 11,
			interruption: false,
			wantsToEnd: false,
		};

		const result = clientResponseSchema.safeParse(invalidResponse);
		expect(result.success).toBe(false);
	});

	test("rejects non-integer interest", () => {
		const invalidResponse = {
			clientText: "Texto válido",
			interest: 5.5,
			interruption: false,
			wantsToEnd: false,
		};

		const result = clientResponseSchema.safeParse(invalidResponse);
		expect(result.success).toBe(false);
	});

	test("rejects missing required fields", () => {
		const invalidResponse = {
			clientText: "Texto válido",
		};

		const result = clientResponseSchema.safeParse(invalidResponse);
		expect(result.success).toBe(false);
	});

	test("rejects wrong types for boolean fields", () => {
		const invalidResponse = {
			clientText: "Texto válido",
			interest: 5,
			interruption: "no",
			wantsToEnd: "false",
		};

		const result = clientResponseSchema.safeParse(invalidResponse);
		expect(result.success).toBe(false);
	});
});
