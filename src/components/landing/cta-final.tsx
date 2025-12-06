"use client";

import { MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { signIn } from "@/lib/auth-client";

export function CtaFinal() {
	const handleSignIn = async () => {
		await signIn.social({
			callbackURL: "/configuracion",
			provider: "google",
		});
	};

	const handleWhatsAppShare = () => {
		const message = encodeURIComponent(
			"Encontré esta herramienta para entrenar ventas con IA. Se llama VENDRA y te ayuda a practicar llamadas con clientes simulados. Échale un vistazo: " +
				window.location.origin,
		);
		window.open(`https://wa.me/?text=${message}`, "_blank");
	};

	return (
		<section className="bg-gradient-to-br from-[#1C4E89] via-slate-900 to-slate-950 px-6 py-20">
			<div className="mx-auto max-w-4xl text-center">
				<h2 className="text-3xl font-bold text-white md:text-4xl lg:text-5xl">
					Empieza gratis. No necesitas tarjeta.
				</h2>
				<p className="mt-4 text-lg text-slate-300 md:text-xl">
					Crea tu primera simulación en menos de 2 minutos y descubre cómo
					mejorar tu cierre.
				</p>

				<div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
					<Button
						onClick={handleSignIn}
						size="lg"
						className="bg-[#2DAA6E] px-8 py-6 text-lg font-semibold text-white hover:bg-[#2DAA6E]/90"
					>
						Empezar ahora
					</Button>
					<Button
						onClick={handleWhatsAppShare}
						variant="outline"
						size="lg"
						className="gap-2 border-white/20 bg-white/10 px-8 py-6 text-lg font-semibold text-white backdrop-blur hover:bg-white/20"
					>
						<MessageCircle className="h-5 w-5" />
						Compartir por WhatsApp
					</Button>
				</div>

				<p className="mt-6 text-sm text-slate-400">
					Únete a vendedores de todo Perú que ya están mejorando su desempeño
				</p>
			</div>
		</section>
	);
}
