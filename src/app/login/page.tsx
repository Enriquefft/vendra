import type { Route } from "next";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { Button } from "@/components/ui/button";

async function startGoogleSignIn() {
	"use server";

	const response = await auth.api.signInSocial({
		body: {
			provider: "google",
		},
		headers: await headers(),
	});

	if (response?.url) {
		redirect(response.url as Route);
	}

	if (response?.redirect) {
		redirect("/");
	}

	redirect("/");
}

export default function LoginPage() {
	return (
		<main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 px-6 py-12 text-white">
			<div className="flex w-full max-w-xl flex-col items-center justify-center gap-8 rounded-2xl bg-white/5 p-10 shadow-2xl backdrop-blur">
				<div className="space-y-3 text-center">
					<p className="text-sm uppercase tracking-[0.2em] text-blue-200">
						Vendra
					</p>
					<h1 className="text-3xl font-bold">Entrena tu venta con IA</h1>
					<p className="text-base text-slate-200">
						Accede con Google para crear escenarios, practicar tus llamadas y
						recibir feedback accionable.
					</p>
				</div>
				<form action={startGoogleSignIn} className="w-full">
					<Button
						className="w-full bg-blue-500 text-lg font-semibold text-white hover:bg-blue-600"
						type="submit"
					>
						Continuar con Google
					</Button>
				</form>
				<p className="text-xs text-slate-300">
					Al continuar, aceptas usar tu correo de Google para asociar tus
					simulaciones en la plataforma.
				</p>
			</div>
		</main>
	);
}
