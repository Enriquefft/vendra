import { MessageSquare, Mic, Settings, ShieldCheck } from "lucide-react";

const steps = [
	{
		description:
			"Define tu producto, el perfil de tu cliente ideal y los parámetros de la simulación.",
		icon: Settings,
		title: "Configura tu caso",
	},
	{
		description:
			"Practica tu pitch por voz. El cliente IA responde de forma natural y realista.",
		icon: Mic,
		title: "Habla como en la vida real",
	},
	{
		description:
			"Obtén un score, aciertos, mejoras y momentos clave con recomendaciones específicas.",
		icon: MessageSquare,
		title: "Recibe análisis accionable",
	},
	{
		description:
			"Ingresa siempre con Google para mantener tu historial y seguir tu progreso.",
		icon: ShieldCheck,
		title: "Guarda tus resultados",
	},
];

export function HowItWorks({ id }: { id?: string }) {
	return (
		<section id={id} className="bg-[#F5F7FA] px-6 py-20 dark:bg-slate-900">
			<div className="mx-auto max-w-7xl">
				<div className="mb-12 text-center">
					<h2 className="text-3xl font-bold text-[#2A2A2A] dark:text-white md:text-4xl">
						¿Cómo funciona?
					</h2>
					<p className="mt-4 text-lg text-slate-600 dark:text-slate-300">
						Cuatro pasos simples para mejorar tu cierre de ventas
					</p>
				</div>

				<div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
					{steps.map((step, index) => (
						<div
							key={step.title}
							className="group relative rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition-all hover:border-[#1C4E89]/30 hover:shadow-lg dark:border-slate-700 dark:bg-slate-800"
						>
							{/* Step number */}
							<div className="absolute -top-3 -left-3 flex h-8 w-8 items-center justify-center rounded-full bg-[#1C4E89] text-sm font-bold text-white">
								{index + 1}
							</div>

							{/* Icon */}
							<div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-[#1C4E89]/10 text-[#1C4E89] transition-colors group-hover:bg-[#1C4E89] group-hover:text-white">
								<step.icon className="h-6 w-6" />
							</div>

							{/* Content */}
							<h3 className="mb-2 text-lg font-semibold text-[#2A2A2A] dark:text-white">
								{step.title}
							</h3>
							<p className="text-sm text-slate-600 dark:text-slate-300">
								{step.description}
							</p>
						</div>
					))}
				</div>
			</div>
		</section>
	);
}
