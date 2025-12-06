import { Star } from "lucide-react";

const demoMessages = [
	{
		message:
			"Hola, vi su anuncio pero no estoy segura si es para mí. ¿Cuánto cuesta?",
		name: "María González",
		time: "0:15",
		type: "client",
	},
	{
		message:
			"¡Hola María! Antes de hablar del precio, me gustaría entender mejor tu situación. ¿Qué problema estás buscando resolver?",
		time: "0:32",
		type: "seller",
	},
	{
		message:
			"Bueno, mi equipo de ventas no está cerrando como antes. Pero ya probamos capacitaciones y no funcionaron.",
		name: "María González",
		time: "0:58",
		type: "client",
	},
	{
		message:
			"Entiendo tu frustración. Las capacitaciones teóricas suelen fallar porque no hay práctica real. Con VENDRA, tu equipo practica con clientes simulados antes de cada llamada importante.",
		time: "1:25",
		type: "seller",
	},
];

const keyMoment = {
	description:
		"El vendedor redirigió la conversación del precio hacia el descubrimiento de necesidades. Técnica efectiva para construir valor antes de cotizar.",
	score: "+15 puntos",
	title: "Momento clave detectado",
	turn: 2,
};

export function DemoPreview() {
	return (
		<section className="bg-[#F5F7FA] px-6 py-20 dark:bg-slate-900">
			<div className="mx-auto max-w-7xl">
				<div className="mb-12 text-center">
					<h2 className="text-3xl font-bold text-[#2A2A2A] dark:text-white md:text-4xl">
						Así se ve una simulación
					</h2>
					<p className="mt-4 text-lg text-slate-600 dark:text-slate-300">
						Conversaciones naturales con análisis en tiempo real
					</p>
				</div>

				<div className="grid gap-8 lg:grid-cols-3">
					{/* Chat demo */}
					<div className="lg:col-span-2">
						<div className="rounded-2xl border border-slate-200 bg-white shadow-lg dark:border-slate-700 dark:bg-slate-800">
							{/* Header */}
							<div className="flex items-center gap-3 border-b border-slate-200 p-4 dark:border-slate-700">
								<div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#1C4E89]">
									<span className="text-sm font-bold text-white">MG</span>
								</div>
								<div>
									<p className="font-medium text-[#2A2A2A] dark:text-white">
										María González
									</p>
									<p className="text-sm text-slate-500 dark:text-slate-400">
										Empresaria · Arequipa, Perú
									</p>
								</div>
								<div className="ml-auto flex items-center gap-1 rounded-full bg-[#2DAA6E]/10 px-3 py-1 text-sm text-[#2DAA6E]">
									<span className="h-2 w-2 animate-pulse rounded-full bg-[#2DAA6E]" />
									En llamada
								</div>
							</div>

							{/* Messages */}
							<div className="space-y-4 p-4">
								{demoMessages.map((msg) => (
									<div
										key={msg.time}
										className={`flex ${msg.type === "seller" ? "justify-end" : "justify-start"}`}
									>
										<div
											className={`max-w-[80%] rounded-2xl p-4 ${
												msg.type === "seller"
													? "rounded-tr-none bg-[#1C4E89] text-white"
													: "rounded-tl-none bg-slate-100 text-[#2A2A2A] dark:bg-slate-700 dark:text-white"
											}`}
										>
											<p className="text-sm">{msg.message}</p>
											<p
												className={`mt-1 text-xs ${msg.type === "seller" ? "text-blue-200" : "text-slate-500 dark:text-slate-400"}`}
											>
												{msg.time}
											</p>
										</div>
									</div>
								))}
							</div>
						</div>
					</div>

					{/* Key moment card */}
					<div className="flex flex-col gap-4">
						<div className="rounded-2xl border-2 border-[#F2C044] bg-[#F2C044]/10 p-6">
							<div className="mb-3 flex items-center gap-2">
								<Star className="h-5 w-5 fill-[#F2C044] text-[#F2C044]" />
								<span className="font-semibold text-[#2A2A2A] dark:text-white">
									{keyMoment.title}
								</span>
							</div>
							<p className="mb-4 text-sm text-slate-600 dark:text-slate-300">
								{keyMoment.description}
							</p>
							<div className="flex items-center justify-between">
								<span className="text-sm text-slate-500 dark:text-slate-400">
									Turno #{keyMoment.turn}
								</span>
								<span className="rounded-full bg-[#2DAA6E] px-3 py-1 text-sm font-medium text-white">
									{keyMoment.score}
								</span>
							</div>
						</div>

						{/* Stats preview */}
						<div className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-700 dark:bg-slate-800">
							<h4 className="mb-4 font-semibold text-[#2A2A2A] dark:text-white">
								Análisis en progreso
							</h4>
							<div className="space-y-3">
								<div className="flex items-center justify-between">
									<span className="text-sm text-slate-600 dark:text-slate-300">
										Rapport
									</span>
									<div className="h-2 w-24 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
										<div className="h-full w-[85%] rounded-full bg-[#2DAA6E]" />
									</div>
								</div>
								<div className="flex items-center justify-between">
									<span className="text-sm text-slate-600 dark:text-slate-300">
										Descubrimiento
									</span>
									<div className="h-2 w-24 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
										<div className="h-full w-[92%] rounded-full bg-[#2DAA6E]" />
									</div>
								</div>
								<div className="flex items-center justify-between">
									<span className="text-sm text-slate-600 dark:text-slate-300">
										Manejo de objeciones
									</span>
									<div className="h-2 w-24 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
										<div className="h-full w-[78%] rounded-full bg-[#F2C044]" />
									</div>
								</div>
							</div>
						</div>
					</div>
				</div>
			</div>
		</section>
	);
}
