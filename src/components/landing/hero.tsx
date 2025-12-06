"use client";

import { Button } from "@/components/ui/button";
import { signIn } from "@/lib/auth-client";

function GoogleLogo() {
	return (
		<svg
			xmlns="http://www.w3.org/2000/svg"
			width="0.98em"
			height="1em"
			viewBox="0 0 256 262"
		>
			<title>Google logo</title>
			<path
				fill="#4285F4"
				d="M255.878 133.451c0-10.734-.871-18.567-2.756-26.69H130.55v48.448h71.947c-1.45 12.04-9.283 30.172-26.69 42.356l-.244 1.622l38.755 30.023l2.685.268c24.659-22.774 38.875-56.282 38.875-96.027"
			/>
			<path
				fill="#34A853"
				d="M130.55 261.1c35.248 0 64.839-11.605 86.453-31.622l-41.196-31.913c-11.024 7.688-25.82 13.055-45.257 13.055c-34.523 0-63.824-22.773-74.269-54.25l-1.531.13l-40.298 31.187l-.527 1.465C35.393 231.798 79.49 261.1 130.55 261.1"
			/>
			<path
				fill="#FBBC05"
				d="M56.281 156.37c-2.756-8.123-4.351-16.827-4.351-25.82c0-8.994 1.595-17.697 4.206-25.82l-.073-1.73L15.26 71.312l-1.335.635C5.077 89.644 0 109.517 0 130.55s5.077 40.905 13.925 58.602z"
			/>
			<path
				fill="#EB4335"
				d="M130.55 50.479c24.514 0 41.05 10.589 50.479 19.438l36.844-35.974C195.245 12.91 165.798 0 130.55 0C79.49 0 35.393 29.301 13.925 71.947l42.211 32.783c10.59-31.477 39.891-54.251 74.414-54.251"
			/>
		</svg>
	);
}

export function Hero() {
	const handleSignIn = async () => {
		await signIn.social({
			callbackURL: "/configuracion",
			provider: "google",
		});
	};

	return (
		<section className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-[#1C4E89] to-slate-900 px-6 py-20 md:py-32">
			{/* Background decoration */}
			<div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-[#2DAA6E]/20 via-transparent to-transparent" />
			<div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#F2C044]/50 to-transparent" />

			<div className="relative mx-auto max-w-7xl">
				<div className="grid items-center gap-12 lg:grid-cols-2">
					{/* Left side - Copy */}
					<div className="flex flex-col gap-6 text-center lg:text-left">
						<p className="text-sm font-medium uppercase tracking-[0.25em] text-[#F2C044]">
							VENDRA
						</p>
						<h1 className="text-4xl font-bold leading-tight text-white md:text-5xl lg:text-6xl">
							La forma más realista de entrenar ventas.
						</h1>
						<p className="text-lg text-slate-300 md:text-xl">
							Simulaciones con clientes reales (por IA). Feedback accionable.
						</p>
						<div className="flex flex-col gap-4 sm:flex-row sm:justify-center lg:justify-start">
							<Button
								onClick={handleSignIn}
								size="lg"
								className="bg-[#2DAA6E] px-8 py-6 text-lg font-semibold text-white hover:bg-[#2DAA6E]/90"
							>
								Probar gratis
							</Button>
							<Button
								onClick={handleSignIn}
								variant="outline"
								size="lg"
								className="gap-2 border-white/20 bg-white/10 px-8 py-6 text-lg font-semibold text-white backdrop-blur hover:bg-white/20"
							>
								<GoogleLogo />
								Continuar con Google
							</Button>
						</div>
					</div>

					{/* Right side - Mockup */}
					<div className="flex justify-center lg:justify-end">
						<div className="w-full max-w-md rounded-2xl border border-white/10 bg-white/5 p-6 shadow-2xl backdrop-blur-sm">
							{/* Simulation mockup header */}
							<div className="mb-4 flex items-center gap-3">
								<div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#1C4E89]">
									<span className="text-sm font-bold text-white">JM</span>
								</div>
								<div>
									<p className="font-medium text-white">Juan Martínez</p>
									<p className="text-sm text-slate-400">Cliente · Lima, Perú</p>
								</div>
							</div>

							{/* Chat messages */}
							<div className="space-y-3">
								<div className="rounded-lg rounded-tl-none bg-slate-700/50 p-3">
									<p className="text-sm text-slate-200">
										Hola, me interesa saber más sobre su servicio, pero tengo
										algunas dudas...
									</p>
								</div>
								<div className="ml-auto max-w-[80%] rounded-lg rounded-tr-none bg-[#2DAA6E]/80 p-3">
									<p className="text-sm text-white">
										¡Claro! Con gusto te ayudo. ¿Cuáles son tus principales
										inquietudes?
									</p>
								</div>
								<div className="rounded-lg rounded-tl-none bg-slate-700/50 p-3">
									<p className="text-sm text-slate-200">
										Principalmente el precio... y si realmente funciona.
									</p>
								</div>
							</div>

							{/* Recording indicator */}
							<div className="mt-4 flex items-center justify-center gap-2 rounded-lg bg-[#F2C044]/20 p-3">
								<div className="h-3 w-3 animate-pulse rounded-full bg-[#F2C044]" />
								<span className="text-sm font-medium text-[#F2C044]">
									Grabando respuesta...
								</span>
							</div>
						</div>
					</div>
				</div>
			</div>
		</section>
	);
}
