import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { auth } from "@/auth";

/**
 * Home page component that greets authenticated sellers.
 */
export default async function Home() {
	const session = await auth.api.getSession({
		headers: await headers(),
	});

	if (!session) {
		redirect("/login");
	}

	return (
		<main className="mx-auto flex min-h-screen max-w-5xl flex-col gap-10 px-6 py-16">
			<section className="rounded-3xl bg-gradient-to-br from-blue-900 via-slate-900 to-slate-950 p-10 text-white shadow-2xl">
				<p className="text-sm uppercase tracking-[0.25em] text-blue-200">
					Vendra
				</p>
				<h1 className="mt-2 text-4xl font-bold">Hola, {session.user.name}</h1>
				<p className="mt-3 max-w-3xl text-lg text-slate-200">
					Configura tu escenario, genera un cliente realista y practica tu
					llamada. Esta pantalla te redirigirá a las secciones de configuración
					y simulación a medida que se implementen.
				</p>
			</section>

			<section className="grid gap-6 md:grid-cols-2">
				<article className="rounded-2xl border border-white/10 bg-white/5 p-6 shadow-xl backdrop-blur">
					<h2 className="text-xl font-semibold text-white">Próximos pasos</h2>
					<ul className="mt-3 space-y-2 text-slate-200">
						<li>1. Completa la configuración del escenario.</li>
						<li>2. Inicia la simulación con voz.</li>
						<li>3. Revisa el análisis detallado.</li>
					</ul>
				</article>
				<article className="rounded-2xl border border-white/10 bg-white/5 p-6 shadow-xl backdrop-blur">
					<h2 className="text-xl font-semibold text-white">Tu sesión</h2>
					<p className="mt-2 text-slate-200">
						Sesión activa vinculada a: {session.user.email}
					</p>
					<p className="text-slate-300">
						Listo para crear un nuevo cliente simulado.
					</p>
				</article>
			</section>
		</main>
	);
}
