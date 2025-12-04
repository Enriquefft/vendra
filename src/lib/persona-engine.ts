import type { PersonaProfile, ScenarioConfig } from "@/db/schema/simulation";
import { personaProfileSchema } from "@/lib/schemas/session";
import { openai } from "./openai";

export async function generatePersona(
	config: ScenarioConfig,
): Promise<PersonaProfile> {
	const systemPrompt =
		"Eres el PersonaEngine de VENDRA. Genera un cliente peruano realista para una simulación de venta. " +
		"Debes mantener naturalidad, microcontradicciones leves y motivaciones humanas. Responde en JSON válido.";

	const userPrompt = `Configura un cliente simulado según este escenario. Devuelve un objeto JSON con las claves: 
{
  "name": string,
  "age": number,
  "location": string,
  "socioeconomicLevel": string,
  "educationLevel": string,
  "occupation": string,
  "motivations": string[],
  "pains": string[],
  "personalityTraits": string[],
  "preferredChannel": string,
  "briefStory": string,
  "callAttitude": string
}

Escenario de venta: ${JSON.stringify(config, null, 2)}
- Ubicación y contexto deben sentirse peruanos/latam.
- Alinea motivaciones y dolores con el producto y el objetivo de la llamada.
- Personalidad psicológica debe ser coherente con la intensidad del cliente.
- Usa español neutro. No incluyas texto adicional fuera del JSON.`;

	const completion = await openai.chat.completions.create({
		messages: [
			{ content: systemPrompt, role: "system" },
			{ content: userPrompt, role: "user" },
		],
		model: "gpt-4o-mini",
		response_format: { type: "json_object" },
		temperature: 0.9,
	});

	const content = completion.choices[0]?.message?.content;

	if (!content) {
		throw new Error("No se recibió una respuesta válida del modelo de OpenAI");
	}

	const parsed = personaProfileSchema.parse(JSON.parse(content));
	return parsed;
}
