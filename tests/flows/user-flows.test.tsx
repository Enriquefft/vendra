import { afterEach, describe, expect, mock, test } from "bun:test";
import userEvent from "@testing-library/user-event";
import { render, screen, waitFor, within } from "@testing-library/react";

import { ScenarioConfigForm } from "@/app/configuracion/scenario-config-form";
import { initialCreateSessionState } from "@/app/configuracion/types";
import { personaFixture, scenarioConfigFixture, turnFixtures } from "../fixtures";

// Minimal mocks for Next.js primitives and toasts used by the components under test.
mock.module("next/link", () => ({
        default: ({ href, children, ...props }: { href: string; children: React.ReactNode }) => (
                <a href={href} {...props}>
                        {children}
                </a>
        ),
}));

const routerReplaceCalls: unknown[][] = [];
const routerReplace = (...args: unknown[]) => {
        routerReplaceCalls.push(args);
};

mock.module("next/navigation", () => ({
        useRouter: () => ({
                replace: routerReplace,
        }),
}));

mock.module("sonner", () => ({
        toast: {
                error: () => {},
                info: () => {},
                success: () => {},
                warning: () => {},
        },
}));

// Simplify AudioRecorderButton to a clickable element that triggers transcription directly.
mock.module("@/components/audio-recorder-button", () => ({
        AudioRecorderButton: ({
                onTranscription,
                disabled,
        }: {
                onTranscription: (text: string) => void;
                disabled?: boolean;
        }) => (
                <button type="button" disabled={disabled} onClick={() => onTranscription("Mensaje de vendedor")}>
                        Hablar con cliente
                </button>
        ),
}));

const originalFetch = global.fetch;

afterEach(() => {
        routerReplaceCalls.splice(0, routerReplaceCalls.length);
        global.fetch = originalFetch;
});

describe("User flows", () => {
        test("Flow 1: configure a scenario and see generated persona", async () => {
                const user = userEvent.setup();
                const createSessionCalls: FormData[] = [];
                const createSessionAction = async (_state: unknown, formData: FormData) => {
                        createSessionCalls.push(formData);
                        expect(formData.get("productName")).toBe(scenarioConfigFixture.productName);
                        return {
                                persona: personaFixture,
                                sessionId: "session-123",
                                status: "success" as const,
                        };
                };

                render(
                        <ScenarioConfigForm
                                action={createSessionAction}
                                initialState={initialCreateSessionState}
                        />,
                );

                await user.type(
                        screen.getByLabelText(/Nombre del producto/i),
                        scenarioConfigFixture.productName,
                );
                await user.type(screen.getByLabelText(/Descripción breve/i), scenarioConfigFixture.description);
                await user.type(screen.getByLabelText(/Objetivo de la llamada/i), scenarioConfigFixture.callObjective);
                await user.type(screen.getByLabelText(/Rango de edad/i), scenarioConfigFixture.targetProfile.ageRange);
                await user.type(screen.getByLabelText(/Ubicación/i), scenarioConfigFixture.targetProfile.location);
                await user.type(
                        screen.getByLabelText(/Nivel socioeconómico/i),
                        scenarioConfigFixture.targetProfile.socioeconomicLevel,
                );
                await user.type(
                        screen.getByLabelText(/Nivel educativo/i),
                        scenarioConfigFixture.targetProfile.educationLevel,
                );
                await user.type(
                        screen.getByLabelText(/Estilo de decisión/i),
                        scenarioConfigFixture.targetProfile.decisionStyle,
                );
                await user.type(
                        screen.getByLabelText(/Canal preferido/i),
                        scenarioConfigFixture.targetProfile.preferredChannel,
                );
                await user.type(
                        screen.getByLabelText(/Motivaciones clave/i),
                        scenarioConfigFixture.targetProfile.motivations.join("\n"),
                );
                await user.type(
                        screen.getByLabelText(/Puntos de dolor/i),
                        scenarioConfigFixture.targetProfile.pains.join("\n"),
                );

                await user.click(screen.getByRole("button", { name: /Crear sesión/i }));

                await waitFor(() => expect(screen.getByText(/Cliente generado/i)).toBeInTheDocument());
                expect(createSessionCalls.length).toBeGreaterThan(0);
                expect(
                        screen.getByRole("link", { name: /Ir a la simulación/i }),
                ).toHaveAttribute("href", "/simulacion/session-123");
                expect(screen.getByText(personaFixture.name)).toBeInTheDocument();
        });

        test("Flow 2: send a message in simulation and finish the call", async () => {
                const user = userEvent.setup();
                const fetchCalls: Array<[RequestInfo | URL, RequestInit | undefined]> = [];
                const fetchMock = async (input: RequestInfo | URL, init?: RequestInit) => {
                        fetchCalls.push([input, init]);
                        const url = typeof input === "string" ? input : input.toString();
                        if (url.includes("/speak")) {
                                return new Response(
                                        JSON.stringify({
                                                clientResponse: {
                                                        clientText: "Respuesta del cliente",
                                                        interest: 8,
                                                        interruption: false,
                                                        wantsToEnd: false,
                                                },
                                                clientTurnId: "client-turn-1",
                                                sellerTurnId: "seller-turn-1",
                                        }),
                                        { status: 200 },
                                );
                        }
                        if (url.includes("/end")) {
                                return new Response(null, { status: 200 });
                        }
                        return new Response(null, { status: 404 });
                };
                global.fetch = fetchMock as typeof fetch;

                const { SimulationView } = await import("@/components/simulation-view");

                render(
                        <SimulationView
                                sessionId="session-55"
                                persona={personaFixture}
                                initialMessages={[]}
                                maxDurationMinutes={scenarioConfigFixture.simulationPreferences.maxDurationMinutes}
                        />,
                );

                await user.click(screen.getByRole("button", { name: /Hablar con cliente/i }));

                await waitFor(() => {
                        expect(screen.getByText("Mensaje de vendedor")).toBeInTheDocument();
                        expect(screen.getByText("Respuesta del cliente")).toBeInTheDocument();
                });

                const endButtons = screen.getAllByRole("button", { name: /Terminar llamada/i });
                await user.click(endButtons[0]);
                const dialog = await screen.findByRole("dialog");
                await user.click(within(dialog).getByRole("button", { name: /Terminar llamada/i }));

                await waitFor(() => {
                        expect(routerReplaceCalls).toContainEqual(["/resultado/session-55"]);
                });
                expect(fetchCalls).toContainEqual([
                        "/api/session/session-55/end",
                        expect.objectContaining({ method: "POST" }),
                ]);
        });

        test("Flow 3: generate and review the analysis", async () => {
                const user = userEvent.setup();
                const fetchCalls: Array<[RequestInfo | URL, RequestInit | undefined]> = [];
                global.fetch = (async (...args) => {
                        fetchCalls.push(args);
                        return new Response(
                                JSON.stringify({
                                        analysisId: "analysis-1",
                                        improvements: [
                                                {
                                                        action: "Mencionar beneficios antes del precio",
                                                        title: "Ordenar el pitch",
                                                },
                                        ],
                                        keyMoments: [
                                                {
                                                        insight: "Respondió con empatía",
                                                        quote: "Entiendo por qué buscas flexibilidad",
                                                        recommendation: "Mantener tono consultivo",
                                                        turnId: "turn-2",
                                                },
                                        ],
                                        score: 88,
                                        successes: ["Generó confianza al inicio"],
                                }),
                                { status: 200 },
                        );
                }) as typeof fetch;

                const { AnalysisView } = await import("@/components/analysis-view");

                render(
                        <AnalysisView
                                sessionId="session-77"
                                analysis={null}
                                persona={personaFixture}
                                scenarioConfig={scenarioConfigFixture}
                                turns={turnFixtures}
                        />,
                );

                await user.click(screen.getByRole("button", { name: /Generar análisis/i }));

                await waitFor(() => {
                        expect(screen.getByText("88")).toBeInTheDocument();
                        expect(screen.getByText(/Aciertos \(1\)/i)).toBeInTheDocument();
                        expect(screen.getByText(/Oportunidades de mejora \(1\)/i)).toBeInTheDocument();
                        expect(screen.getByText(/Momentos clave \(1\)/i)).toBeInTheDocument();
                });

                expect(screen.getByText(/Generó confianza al inicio/i)).toBeInTheDocument();
                expect(screen.getByText(/Respondió con empatía/i)).toBeInTheDocument();
                expect(
                        screen.getByRole("link", { name: /Nueva simulación/i }),
                ).toHaveAttribute("href", "/configuracion");
                expect(fetchCalls.length).toBeGreaterThan(0);
        });
});
