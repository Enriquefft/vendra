import { describe, expect, test } from "bun:test";
import { render, screen } from "@testing-library/react";
import { Button } from "@/components/ui/button";

describe("Button", () => {
	test("renders children and button role", () => {
		render(<Button>Visible Example</Button>);

		expect(screen.getByText("Visible Example")).toBeDefined();
		const button = screen.getByRole("button", { name: "Visible Example" });
		expect(button.textContent).toContain("Visible Example");
	});
});
