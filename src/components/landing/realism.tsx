import { AlertTriangle, Clock, HelpCircle, Shield } from "lucide-react";

const realismCards = [
	{
		color: "bg-blue-500",
		description:
			"El cliente hace preguntas reales sobre precio, garantías y resultados. Nada de respuestas guionizadas.",
		icon: HelpCircle,
		title: "Dudas genuinas",
	},
	{
		color: "bg-[#F2C044]",
		description:
			"Te interrumpe cuando hablas demasiado. Exactamente como en la vida real.",
		icon: AlertTriangle,
		title: "Interrupciones",
	},
	{
		color: "bg-red-500",
		description:
			"Muestra escepticismo ante promesas exageradas. Debes ganarte su confianza.",
		icon: Shield,
		title: "Desconfianza",
	},
	{
		color: "bg-[#2DAA6E]",
		description:
			"Tiene poco tiempo. Si no captas su atención, puede colgar en cualquier momento.",
		icon: Clock,
		title: "Apuro",
	},
];

export function Realism() {
	return (
		<section className="bg-white px-6 py-20 dark:bg-slate-950">
			<div className="mx-auto max-w-7xl">
				<div className="mb-12 text-center">
					<h2 className="text-3xl font-bold text-[#2A2A2A] dark:text-white md:text-4xl">
						&quot;Clientes que no leen guiones.&quot;
					</h2>
					<p className="mt-4 text-lg text-slate-600 dark:text-slate-300">
						Nuestro cliente IA simula comportamientos humanos reales
					</p>
				</div>

				<div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
					{realismCards.map((card) => (
						<div
							key={card.title}
							className="group rounded-2xl border border-slate-200 bg-slate-50 p-6 transition-all hover:border-[#1C4E89]/30 hover:bg-white hover:shadow-lg dark:border-slate-700 dark:bg-slate-800/50 dark:hover:bg-slate-800"
						>
							{/* Icon */}
							<div
								className={`mb-4 flex h-12 w-12 items-center justify-center rounded-xl ${card.color} text-white`}
							>
								<card.icon className="h-6 w-6" />
							</div>

							{/* Content */}
							<h3 className="mb-2 text-lg font-semibold text-[#2A2A2A] dark:text-white">
								{card.title}
							</h3>
							<p className="text-sm text-slate-600 dark:text-slate-300">
								{card.description}
							</p>
						</div>
					))}
				</div>
			</div>
		</section>
	);
}
