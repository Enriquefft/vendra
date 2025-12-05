"use client";

import type { Route } from "next";
import Link from "next/link";
import { useActionState, useEffect, useId } from "react";
import { toast } from "sonner";
import type { CreateSessionState } from "@/app/configuracion/types";
import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";

function SubmitSection({ label }: { label: string }) {
    return (
        <div className="flex items-center justify-end gap-3 border-t pt-4">
            <p className="text-sm text-muted-foreground">
                Guarda y genera un cliente listo para simular.
            </p>
            <Button type="submit">{label}</Button>
        </div>
    );
}

export function ScenarioConfigForm({
    action,
    initialState,
}: {
    action: (
        state: CreateSessionState,
        formData: FormData,
    ) => Promise<CreateSessionState>;
    initialState: CreateSessionState;
}) {
    const [state, formAction] = useActionState(action, initialState);

    useEffect(() => {
        if (state.status === "success" && state.mocked) {
            toast.info("Modo simulado activo", {
                description: "Se generó una persona sin usar la API de OpenAI.",
            });
        }
    }, [state.mocked, state.status]);

    const productNameId = useId();
    const priceDetailsId = useId();
    const descriptionId = useId();
    const callObjectiveId = useId();
    const contactTypeId = useId();
    const ageRangeId = useId();
    const genderId = useId();
    const locationId = useId();
    const socioeconomicLevelId = useId();
    const educationLevelId = useId();
    const decisionStyleId = useId();
    const preferredChannelId = useId();
    const motivationsId = useId();
    const painsId = useId();
    const maxDurationMinutesId = useId();
    const allowHangupsId = useId();
    const clientIntensityId = useId();
    const realismId = useId();

    return (
        <div className="space-y-6">
            <form action={formAction} className="space-y-6">
                <Card>
                    <CardHeader>
                        <CardTitle>Detalles del producto</CardTitle>
                        <CardDescription>
                            Describe lo que vendes y qué buscas lograr con la llamada.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                            <Label htmlFor={productNameId}>Nombre del producto</Label>
                            <Input
                                id={productNameId}
                                name="productName"
                                placeholder="Seguro de salud familiar"
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor={priceDetailsId}>Precio y condiciones</Label>
                            <Input
                                id={priceDetailsId}
                                name="priceDetails"
                                placeholder="USD 25/mes, incluye cobertura dental"
                            />
                            <p className="text-sm text-muted-foreground">
                                Opcional, pero ayuda a dar contexto de valor.
                            </p>
                        </div>
                        <div className="space-y-2 md:col-span-2">
                            <Label htmlFor={descriptionId}>Descripción breve</Label>
                            <textarea
                                id={descriptionId}
                                name="description"
                                className="min-h-[96px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                                placeholder="Cobertura integral que combina telemedicina, consultas presenciales y descuentos en farmacias en todo el Perú."
                                required
                            />
                        </div>
                        <div className="space-y-2 md:col-span-2">
                            <Label htmlFor={callObjectiveId}>Objetivo de la llamada</Label>
                            <Input
                                id={callObjectiveId}
                                name="callObjective"
                                placeholder="Cerrar la venta con pago con tarjeta en la llamada"
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor={contactTypeId}>Tipo de contacto</Label>
                            <select
                                id={contactTypeId}
                                name="contactType"
                                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                                defaultValue="cold_call"
                                required
                            >
                                <option value="cold_call">Llamada en frío</option>
                                <option value="follow_up">Seguimiento</option>
                                <option value="inbound_callback">Retorno de inbound</option>
                            </select>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Perfil objetivo</CardTitle>
                        <CardDescription>
                            Cuéntale a Vendra quién es tu cliente ideal para generar una
                            persona realista.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                            <Label htmlFor={ageRangeId}>Rango de edad</Label>
                            <Input
                                id={ageRangeId}
                                name="ageRange"
                                placeholder="30-45"
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor={genderId}>Género (opcional)</Label>
                            <Input id={genderId} name="gender" placeholder="Femenino" />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor={locationId}>Ubicación</Label>
                            <Input
                                id={locationId}
                                name="location"
                                placeholder="Lima Metropolitana"
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor={socioeconomicLevelId}>Nivel socioeconómico</Label>
                            <Input
                                id={socioeconomicLevelId}
                                name="socioeconomicLevel"
                                placeholder="B/C"
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor={educationLevelId}>Nivel educativo</Label>
                            <Input
                                id={educationLevelId}
                                name="educationLevel"
                                placeholder="Técnico o universitario incompleto"
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor={decisionStyleId}>Estilo de decisión</Label>
                            <Input
                                id={decisionStyleId}
                                name="decisionStyle"
                                placeholder="Busca comparaciones y referencias"
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor={preferredChannelId}>Canal preferido</Label>
                            <Input
                                id={preferredChannelId}
                                name="preferredChannel"
                                placeholder="Whatsapp y correo"
                                required
                            />
                        </div>
                        <div className="space-y-2 md:col-span-2">
                            <Label htmlFor={motivationsId}>Motivaciones clave</Label>
                            <textarea
                                id={motivationsId}
                                name="motivations"
                                className="min-h-[96px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                                placeholder={
                                    "Seguridad para su familia\nAtención rápida en emergencias"
                                }
                                required
                            />
                            <p className="text-sm text-muted-foreground">
                                Escribe una por línea para que la IA las reconozca como lista.
                            </p>
                        </div>
                        <div className="space-y-2 md:col-span-2">
                            <Label htmlFor={painsId}>Puntos de dolor</Label>
                            <textarea
                                id={painsId}
                                name="pains"
                                className="min-h-[96px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                                placeholder={
                                    "Esperas largas para citas\nPlanes con poca cobertura"
                                }
                                required
                            />
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Preferencias de simulación</CardTitle>
                        <CardDescription>
                            Ajusta la dificultad del cliente y la duración que esperas
                            practicar.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                            <Label htmlFor={maxDurationMinutesId}>
                                Duración máxima (minutos)
                            </Label>
                            <Input
                                type="number"
                                id={maxDurationMinutesId}
                                name="maxDurationMinutes"
                                min={1}
                                defaultValue={8}
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor={allowHangupsId}>Permitir colgar la llamada</Label>
                            <div className="flex items-center gap-3 rounded-md border border-input px-3 py-2">
                                <input
                                    type="checkbox"
                                    id={allowHangupsId}
                                    name="allowHangups"
                                    defaultChecked
                                    className="h-4 w-4"
                                />
                                <span className="text-sm text-muted-foreground">
                                    El cliente puede terminar si la conversación se estanca.
                                </span>
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor={clientIntensityId}>Intensidad del cliente</Label>
                            <select
                                id={clientIntensityId}
                                name="clientIntensity"
                                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                                defaultValue="neutro"
                                required
                            >
                                <option value="tranquilo">Tranquilo</option>
                                <option value="neutro">Neutro</option>
                                <option value="dificil">Difícil</option>
                            </select>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor={realismId}>Realismo de la respuesta</Label>
                            <select
                                id={realismId}
                                name="realism"
                                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                                defaultValue="humano"
                                required
                            >
                                <option value="natural">Natural</option>
                                <option value="humano">Humano</option>
                                <option value="exigente">Exigente</option>
                            </select>
                        </div>
                    </CardContent>
                    <CardContent>
                        <SubmitSection label="Crear sesión" />
                    </CardContent>
                </Card>
            </form>

            {state.status === "error" ? (
                <div className="rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                    {state.message}
                </div>
            ) : null}

            {state.status === "success" ? (
                <Card className="border-primary/40 bg-primary/5">
                    <CardHeader>
                        <CardTitle>Cliente generado</CardTitle>
                        <CardDescription>
                            Personaliza tu práctica con esta persona y continúa a la
                            simulación.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="grid gap-4 md:grid-cols-[1fr_320px]">
                        <div className="space-y-2">
                            <p className="text-sm text-muted-foreground">
                                ID de sesión:{" "}
                                <span className="font-semibold text-foreground">
                                    {state.sessionId}
                                </span>
                            </p>
                            <p className="text-sm text-muted-foreground">
                                Guardaremos este cliente para que puedas continuar con tu
                                simulación.
                            </p>
                            <Link
                                className="inline-flex w-fit items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow hover:bg-primary/90"
                                href={`/simulacion/${state.sessionId}` as Route}
                            >
                                Ir a la simulación
                            </Link>
                        </div>

                        <div className="rounded-lg border bg-background p-4">
                            <div className="flex items-start justify-between gap-3">
                                <div>
                                    <p className="text-xs uppercase tracking-wide text-muted-foreground">
                                        Persona
                                    </p>
                                    <h3 className="text-lg font-semibold">
                                        {state.persona.name}
                                    </h3>
                                    <p className="text-sm text-muted-foreground">
                                        {state.persona.age} años · {state.persona.location}
                                    </p>
                                </div>
                                <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                                    {state.persona.callAttitude}
                                </span>
                            </div>
                            <p className="mt-2 text-sm text-foreground">
                                {state.persona.briefStory}
                            </p>
                            <ScrollArea className="mt-3 h-40 pr-2">
                                <div className="space-y-2 text-sm text-muted-foreground">
                                    <div>
                                        <Label className="text-xs text-foreground">
                                            Motivaciones
                                        </Label>
                                        <ul className="ml-4 list-disc">
                                            {state.persona.motivations.map((item) => (
                                                <li key={item}>{item}</li>
                                            ))}
                                        </ul>
                                    </div>
                                    <div>
                                        <Label className="text-xs text-foreground">
                                            Puntos de dolor
                                        </Label>
                                        <ul className="ml-4 list-disc">
                                            {state.persona.pains.map((item) => (
                                                <li key={item}>{item}</li>
                                            ))}
                                        </ul>
                                    </div>
                                    <div className="grid grid-cols-2 gap-2">
                                        <div>
                                            <Label className="text-xs text-foreground">
                                                Ocupación
                                            </Label>
                                            <p>{state.persona.occupation}</p>
                                        </div>
                                        <div>
                                            <Label className="text-xs text-foreground">
                                                Nivel socioeconómico
                                            </Label>
                                            <p>{state.persona.socioeconomicLevel}</p>
                                        </div>
                                        <div>
                                            <Label className="text-xs text-foreground">
                                                Nivel educativo
                                            </Label>
                                            <p>{state.persona.educationLevel}</p>
                                        </div>
                                        <div>
                                            <Label className="text-xs text-foreground">
                                                Canal preferido
                                            </Label>
                                            <p>{state.persona.preferredChannel}</p>
                                        </div>
                                    </div>
                                    <div>
                                        <Label className="text-xs text-foreground">Rasgos</Label>
                                        <p>{state.persona.personalityTraits.join(", ")}</p>
                                    </div>
                                </div>
                            </ScrollArea>
                        </div>
                    </CardContent>
                </Card>
            ) : null}
        </div>
    );
}
