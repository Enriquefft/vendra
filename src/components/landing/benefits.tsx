import { CheckCircle2, MessageCircle, ShieldCheck, Target } from "lucide-react";

const benefits = [
	{
		description:
			"Practica técnicas de cierre en un entorno seguro hasta dominarlas.",
		icon: Target,
		title: "Mejora tu cierre",
	},
	{
		description:
			"Cada simulación te prepara mejor para enfrentar clientes reales.",
		icon: ShieldCheck,
		title: "Gana seguridad",
	},
	{
		description:
			"Aprende a responder a las objeciones más comunes sin perder la venta.",
		icon: MessageCircle,
		title: "Maneja objeciones",
	},
	{
		description: "Recibe análisis detallado con puntos específicos de mejora.",
		icon: CheckCircle2,
		title: "Feedback real",
	},
];

export function Benefits({ id }: { id?: string }) {
	return (
		<section
			id={id}
			className="bg-gradient-to-br from-[#1C4E89] to-slate-900 px-6 py-20"
		>
			<div className="mx-auto max-w-7xl">
				<div className="mb-12 text-center">
					<h2 className="text-3xl font-bold text-white md:text-4xl">
						Beneficios que transforman tu desempeño
					</h2>
					<p className="mt-4 text-lg text-slate-300">
						Lo que ganarás al entrenar con VENDRA
					</p>
				</div>

				<div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
					{benefits.map((benefit) => (
						<div
							key={benefit.title}
							className="group rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur transition-all hover:border-[#2DAA6E]/50 hover:bg-white/10"
						>
							{/* Icon */}
							<div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-[#2DAA6E] text-white transition-transform group-hover:scale-110">
								<benefit.icon className="h-6 w-6" />
							</div>

							{/* Content */}
							<h3 className="mb-2 text-lg font-semibold text-white">
								{benefit.title}
							</h3>
							<p className="text-sm text-slate-300">{benefit.description}</p>
						</div>
					))}
				</div>
			</div>
		</section>
	);
}
