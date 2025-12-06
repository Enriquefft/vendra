import { Quote } from "lucide-react";

const testimonials = [
	{
		avatar: "CR",
		company: "Inmobiliaria Lima Norte",
		location: "Lima, Perú",
		name: "Carlos Rodríguez",
		quote:
			"Después de 10 simulaciones, mi tasa de cierre subió un 23%. El feedback es muy específico y me ayudó a identificar errores que ni sabía que cometía.",
		role: "Vendedor Senior",
	},
	{
		avatar: "AQ",
		company: "Seguros del Sur",
		location: "Arequipa, Perú",
		name: "Ana María Quispe",
		quote:
			"Lo que más me gusta es que el cliente IA no es predecible. Cada simulación es diferente y eso me prepara para cualquier situación real.",
		role: "Ejecutiva de Ventas",
	},
	{
		avatar: "RF",
		company: "TechSolutions Perú",
		location: "Trujillo, Perú",
		name: "Roberto Fernández",
		quote:
			"Implementamos VENDRA para todo el equipo. En 2 meses, las objeciones de precio ya no nos frenan. El ROI fue inmediato.",
		role: "Gerente Comercial",
	},
];

export function SocialProof() {
	return (
		<section className="bg-white px-6 py-20 dark:bg-slate-950">
			<div className="mx-auto max-w-7xl">
				<div className="mb-12 text-center">
					<h2 className="text-3xl font-bold text-[#2A2A2A] dark:text-white md:text-4xl">
						Lo que dicen nuestros vendedores
					</h2>
					<p className="mt-4 text-lg text-slate-600 dark:text-slate-300">
						Resultados reales de vendedores en Perú
					</p>
				</div>

				<div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
					{testimonials.map((testimonial) => (
						<div
							key={testimonial.name}
							className="group relative rounded-2xl border border-slate-200 bg-slate-50 p-6 transition-all hover:border-[#1C4E89]/30 hover:bg-white hover:shadow-lg dark:border-slate-700 dark:bg-slate-800/50 dark:hover:bg-slate-800"
						>
							{/* Quote icon */}
							<Quote className="absolute top-4 right-4 h-8 w-8 text-[#1C4E89]/20" />

							{/* Quote */}
							<p className="mb-6 text-slate-600 dark:text-slate-300">
								&quot;{testimonial.quote}&quot;
							</p>

							{/* Author */}
							<div className="flex items-center gap-3">
								<div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#1C4E89]">
									<span className="text-sm font-bold text-white">
										{testimonial.avatar}
									</span>
								</div>
								<div>
									<p className="font-semibold text-[#2A2A2A] dark:text-white">
										{testimonial.name}
									</p>
									<p className="text-sm text-slate-500 dark:text-slate-400">
										{testimonial.role}
									</p>
									<p className="text-xs text-slate-400 dark:text-slate-500">
										{testimonial.company} · {testimonial.location}
									</p>
								</div>
							</div>
						</div>
					))}
				</div>
			</div>
		</section>
	);
}
