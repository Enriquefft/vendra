import {
	BarChart3,
	Brain,
	FileUser,
	Lock,
	Mic,
	Settings2,
	Star,
} from "lucide-react";

const features = [
	{
		description:
			"Configura producto, cliente objetivo, duración e intensidad de cada simulación.",
		icon: Settings2,
		title: "Personalización total",
	},
	{
		description:
			"Acceso rápido y seguro con tu cuenta de Google. Tus datos siempre protegidos.",
		icon: Lock,
		title: "Login seguro con Google",
	},
	{
		description:
			"Habla naturalmente. La IA transcribe y procesa tu mensaje en tiempo real.",
		icon: Mic,
		title: "STT por voz",
	},
	{
		description:
			"Comportamientos humanos: dudas, interrupciones, objeciones y hasta puede colgar.",
		icon: Brain,
		title: "Cliente IA realista",
	},
	{
		description:
			"Score 0-100, aciertos, mejoras y recomendaciones específicas por dimensión.",
		icon: BarChart3,
		title: "Análisis profundo",
	},
	{
		description:
			"Identificamos los puntos decisivos de tu conversación con citas textuales.",
		icon: Star,
		title: "Momentos clave",
	},
	{
		description:
			"Perfil completo del cliente simulado: nombre, edad, ocupación, dolores y motivaciones.",
		icon: FileUser,
		title: "Ficha de cliente",
	},
];

export function FeaturesGrid({ id }: { id?: string }) {
	return (
		<section id={id} className="bg-[#F5F7FA] px-6 py-20 dark:bg-slate-900">
			<div className="mx-auto max-w-7xl">
				<div className="mb-12 text-center">
					<h2 className="text-3xl font-bold text-[#2A2A2A] dark:text-white md:text-4xl">
						Todo lo que necesitas para mejorar
					</h2>
					<p className="mt-4 text-lg text-slate-600 dark:text-slate-300">
						Herramientas diseñadas para vendedores P2C
					</p>
				</div>

				<div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
					{features.map((feature) => (
						<div
							key={feature.title}
							className="group flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-6 transition-all hover:border-[#1C4E89]/30 hover:shadow-lg dark:border-slate-700 dark:bg-slate-800"
						>
							{/* Icon */}
							<div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#1C4E89]/10 text-[#1C4E89] transition-colors group-hover:bg-[#1C4E89] group-hover:text-white">
								<feature.icon className="h-5 w-5" />
							</div>

							{/* Content */}
							<div>
								<h3 className="mb-1 font-semibold text-[#2A2A2A] dark:text-white">
									{feature.title}
								</h3>
								<p className="text-sm text-slate-600 dark:text-slate-300">
									{feature.description}
								</p>
							</div>
						</div>
					))}
				</div>
			</div>
		</section>
	);
}
