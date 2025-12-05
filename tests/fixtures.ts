import type { ChatMessage } from "@/components/chat-messages";
import type { PersonaProfile, ScenarioConfig } from "@/db/schema/simulation";

export const personaFixture: PersonaProfile = {
	age: 34,
	briefStory:
		"Ejecutiva de marketing que busca un seguro flexible para su familia, valora la rapidez y la claridad en la comunicación.",
	callAttitude: "Analítica pero abierta si percibe valor claro",
	educationLevel: "Universitaria",
	location: "Lima",
	motivations: ["Proteger a su familia", "Optimizar gastos médicos"],
	name: "María Torres",
	occupation: "Coordinadora de Marketing",
	pains: ["Planes con poca cobertura", "Procesos de reembolso lentos"],
	personalityTraits: ["Analítica", "Precavida", "Pragmática"],
	preferredChannel: "WhatsApp",
	socioeconomicLevel: "B",
};

export const scenarioConfigFixture: ScenarioConfig = {
	callObjective: "Cerrar la venta con pago en la llamada",
	contactType: "cold_call",
	description:
		"Seguro de salud flexible con cobertura dental y telemedicina con disponibilidad nacional.",
	priceDetails: "USD 25/mes",
	productName: "Seguro Salud Familiar",
	simulationPreferences: {
		allowHangups: true,
		clientIntensity: "neutro",
		maxDurationMinutes: 8,
		realism: "humano",
	},
	targetProfile: {
		ageRange: "30-45",
		decisionStyle: "Compara opciones antes de decidir",
		educationLevel: "Universitaria",
		gender: "Femenino",
		location: "Lima",
		motivations: ["Seguridad familiar", "Atención rápida"],
		pains: ["Poca cobertura dental", "Planes rígidos"],
		preferredChannel: "WhatsApp",
		socioeconomicLevel: "B",
	},
};

export const turnFixtures: ChatMessage[] = [
	{
		content: "Hola, María, quiero contarte sobre nuestro seguro flexible.",
		id: "turn-1",
		role: "seller",
		turnIndex: 0,
	},
	{
		content: "¿Cómo funciona la cobertura dental?",
		id: "turn-2",
		meta: { interest: 6 },
		role: "client",
		turnIndex: 1,
	},
];
