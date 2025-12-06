export function Footer() {
	const currentYear = new Date().getFullYear();

	return (
		<footer className="border-t border-slate-200 bg-[#F5F7FA] px-6 py-12 dark:border-slate-800 dark:bg-slate-900">
			<div className="mx-auto max-w-7xl">
				<div className="grid gap-8 md:grid-cols-3">
					{/* Brand */}
					<div>
						<p className="text-lg font-bold text-[#1C4E89]">VENDRA</p>
						<p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
							Entrena tu cierre. Domina la conversación.
						</p>
						<p className="mt-4 text-sm text-slate-500 dark:text-slate-500">
							Simulaciones de ventas con IA para vendedores P2C en Perú y LATAM.
						</p>
					</div>

					{/* Links */}
					<div>
						<p className="font-semibold text-[#2A2A2A] dark:text-white">
							Producto
						</p>
						<ul className="mt-3 space-y-2 text-sm text-slate-600 dark:text-slate-400">
							<li>
								<a
									href="#como-funciona"
									className="hover:text-[#1C4E89] dark:hover:text-white"
								>
									Cómo funciona
								</a>
							</li>
							<li>
								<a
									href="#beneficios"
									className="hover:text-[#1C4E89] dark:hover:text-white"
								>
									Beneficios
								</a>
							</li>
							<li>
								<a
									href="#caracteristicas"
									className="hover:text-[#1C4E89] dark:hover:text-white"
								>
									Características
								</a>
							</li>
							<li>
								<a
									href="#faq"
									className="hover:text-[#1C4E89] dark:hover:text-white"
								>
									Preguntas frecuentes
								</a>
							</li>
						</ul>
					</div>

					{/* Contact */}
					<div>
						<p className="font-semibold text-[#2A2A2A] dark:text-white">
							Contacto
						</p>
						<ul className="mt-3 space-y-2 text-sm text-slate-600 dark:text-slate-400">
							<li>Lima, Perú</li>
							<li>
								<a
									href="mailto:contacto@vendra.pe"
									className="hover:text-[#1C4E89] dark:hover:text-white"
								>
									contacto@vendra.pe
								</a>
							</li>
						</ul>
					</div>
				</div>

				<div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-slate-200 pt-8 dark:border-slate-800 md:flex-row">
					<p className="text-sm text-slate-500 dark:text-slate-500">
						© {currentYear} VENDRA. Todos los derechos reservados.
					</p>
					<div className="flex gap-6 text-sm text-slate-500 dark:text-slate-500">
						<a
							href="/privacidad"
							className="hover:text-[#1C4E89] dark:hover:text-white"
						>
							Política de privacidad
						</a>
						<a
							href="/terminos"
							className="hover:text-[#1C4E89] dark:hover:text-white"
						>
							Términos de uso
						</a>
					</div>
				</div>
			</div>
		</footer>
	);
}
