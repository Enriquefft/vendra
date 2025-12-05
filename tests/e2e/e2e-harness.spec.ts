import { expect, test } from "@playwright/test";

import { personaFixture, scenarioConfigFixture } from "@/testing/fixtures";

test.describe("E2E harness", () => {
	test("submits configuration form and shows persona", async ({ page }) => {
		await page.goto("/testing/e2e");

		await page
			.getByLabel("Nombre del producto")
			.fill(scenarioConfigFixture.productName);
		await page
			.getByLabel("Descripción breve")
			.fill(scenarioConfigFixture.description);
		await page
			.getByLabel("Objetivo de la llamada")
			.fill(scenarioConfigFixture.callObjective);
		await page
			.getByLabel("Rango de edad")
			.fill(scenarioConfigFixture.targetProfile.ageRange);
		await page
			.getByLabel("Ubicación")
			.fill(scenarioConfigFixture.targetProfile.location);
		await page
			.getByLabel("Nivel socioeconómico")
			.fill(scenarioConfigFixture.targetProfile.socioeconomicLevel);
		await page
			.getByLabel("Nivel educativo")
			.fill(scenarioConfigFixture.targetProfile.educationLevel);
		await page
			.getByLabel("Estilo de decisión")
			.fill(scenarioConfigFixture.targetProfile.decisionStyle);
		await page
			.getByLabel("Canal preferido")
			.fill(scenarioConfigFixture.targetProfile.preferredChannel);
		await page
			.getByLabel("Motivaciones clave")
			.fill(scenarioConfigFixture.targetProfile.motivations.join("\n"));
		await page
			.getByLabel("Puntos de dolor")
			.fill(scenarioConfigFixture.targetProfile.pains.join("\n"));

		await page.getByRole("button", { name: "Crear sesión" }).click();

		await expect(page.getByText(/Cliente generado/i)).toBeVisible();
		await expect(page.getByText(personaFixture.name)).toBeVisible();
		await expect(
			page.getByRole("link", { name: /Ir a la simulación/i }),
		).toHaveAttribute("href", "/simulacion/e2e-session-1");
	});

	test("shows analysis fixture for accessibility", async ({ page }) => {
		await page.goto("/testing/e2e");

		await expect(page.getByText("88")).toBeVisible();
		await expect(page.getByText(/Generó confianza al inicio/i)).toBeVisible();
		await expect(page.getByText(/Ordenar el pitch/i)).toBeVisible();
		await expect(page.getByText(/Respondió con empatía/i)).toBeVisible();
	});
});
