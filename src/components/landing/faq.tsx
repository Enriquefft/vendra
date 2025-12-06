"use client";

import { ChevronDown } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

const faqs = [
	{
		answer:
			"Puedes configurar simulaciones de 5, 10, 15 o 20 minutos según tu disponibilidad. La duración es solo un máximo; puedes terminar la llamada cuando quieras.",
		question: "¿Cuánto tiempo dura una simulación?",
	},
	{
		answer:
			"Sí, si configuras esta opción. El cliente puede perder interés o frustrarse si la conversación no fluye bien, simulando situaciones reales donde el prospecto decide no continuar.",
		question: "¿El cliente IA puede colgar la llamada?",
	},
	{
		answer:
			"Recibes un score global (0-100), lista de aciertos, oportunidades de mejora con acciones específicas, y momentos clave de la conversación con citas textuales y recomendaciones.",
		question: "¿Qué tipo de análisis recibo después de cada simulación?",
	},
	{
		answer:
			"Sí. Puedes configurar el nombre, descripción y precio de cualquier producto o servicio. El cliente IA se adaptará al contexto que definas.",
		question: "¿Puedo practicar ventas de cualquier producto?",
	},
	{
		answer:
			"Sí. Al ingresar con Google, todas tus simulaciones y análisis quedan asociados a tu cuenta para que puedas revisar tu progreso.",
		question: "¿Mis simulaciones se guardan?",
	},
	{
		answer:
			"Actualmente está optimizado para ventas P2C (persona a consumidor). Las simulaciones B2B están en desarrollo para futuras versiones.",
		question: "¿Funciona para ventas B2B o solo P2C?",
	},
];

function FaqItem({ question, answer }: { question: string; answer: string }) {
	const [isOpen, setIsOpen] = useState(false);

	return (
		<div className="border-b border-slate-200 dark:border-slate-700">
			<button
				type="button"
				onClick={() => setIsOpen(!isOpen)}
				className="flex w-full items-center justify-between py-4 text-left"
			>
				<span className="font-medium text-[#2A2A2A] dark:text-white">
					{question}
				</span>
				<ChevronDown
					className={cn(
						"h-5 w-5 text-slate-500 transition-transform",
						isOpen && "rotate-180",
					)}
				/>
			</button>
			<div
				className={cn(
					"overflow-hidden transition-all",
					isOpen ? "max-h-96 pb-4" : "max-h-0",
				)}
			>
				<p className="text-slate-600 dark:text-slate-300">{answer}</p>
			</div>
		</div>
	);
}

export function Faq({ id }: { id?: string }) {
	return (
		<section id={id} className="bg-white px-6 py-20 dark:bg-slate-950">
			<div className="mx-auto max-w-3xl">
				<div className="mb-12 text-center">
					<h2 className="text-3xl font-bold text-[#2A2A2A] dark:text-white md:text-4xl">
						Preguntas frecuentes
					</h2>
					<p className="mt-4 text-lg text-slate-600 dark:text-slate-300">
						Todo lo que necesitas saber sobre VENDRA
					</p>
				</div>

				<div className="rounded-2xl border border-slate-200 bg-slate-50 p-6 dark:border-slate-700 dark:bg-slate-800/50">
					{faqs.map((faq) => (
						<FaqItem
							key={faq.question}
							question={faq.question}
							answer={faq.answer}
						/>
					))}
				</div>
			</div>
		</section>
	);
}
