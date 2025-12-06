import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { auth } from "@/auth";
import {
	Benefits,
	CtaFinal,
	DemoPreview,
	Faq,
	FeaturesGrid,
	Footer,
	Hero,
	HowItWorks,
	Realism,
	SocialProof,
} from "@/components/landing";

/**
 * Home page component.
 * Shows landing page for unauthenticated users.
 * Redirects authenticated users to configuration page.
 */
export default async function Home() {
	const session = await auth.api.getSession({
		headers: await headers(),
	});

	if (session) {
		redirect("/configuracion");
	}

	return (
		<main className="min-h-screen">
			<Hero />
			<HowItWorks id="como-funciona" />
			<Realism />
			<Benefits id="beneficios" />
			<DemoPreview />
			<SocialProof />
			<FeaturesGrid id="caracteristicas" />
			<CtaFinal />
			<Faq id="faq" />
			<Footer />
		</main>
	);
}
