"use client";

import {
	AlertTriangle,
	ArrowLeft,
	CheckCircle2,
	Lightbulb,
	Loader2,
	MessageSquareQuote,
	RefreshCw,
	Target,
	TrendingUp,
	User,
} from "lucide-react";
import type { Route } from "next";
import Link from "next/link";
import { useCallback, useState } from "react";
import { toast } from "sonner";

import type {
	ImprovementItem,
	KeyMoment,
	PersonaProfile,
	ScenarioConfig,
} from "@/db/schema/simulation";
import { cn } from "@/lib/utils";

import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Label } from "./ui/label";
import { ScrollArea } from "./ui/scroll-area";

type ConversationTurn = {
	id: string;
	role: "seller" | "client";
	content: string;
	turnIndex: number;
};

type AnalysisData = {
	id: string;
	score: number;
	successes: string[];
	improvements: ImprovementItem[];
	keyMoments: KeyMoment[];
};

export interface AnalysisViewProps {
	sessionId: string;
	analysis: AnalysisData | null;
	persona: PersonaProfile;
	scenarioConfig: ScenarioConfig;
	turns: ConversationTurn[];
	className?: string;
}

/**
 * Score visualization component with circular progress indicator.
 */
function ScoreDisplay({ score }: { score: number }) {
	const getScoreColor = (score: number) => {
		if (score >= 80) return "text-green-600 dark:text-green-400";
		if (score >= 60) return "text-yellow-600 dark:text-yellow-400";
		if (score >= 40) return "text-orange-600 dark:text-orange-400";
		return "text-red-600 dark:text-red-400";
	};

	const getScoreBackground = (score: number) => {
		if (score >= 80) return "from-green-500/20 to-green-600/10";
		if (score >= 60) return "from-yellow-500/20 to-yellow-600/10";
		if (score >= 40) return "from-orange-500/20 to-orange-600/10";
		return "from-red-500/20 to-red-600/10";
	};

	const getScoreLabel = (score: number) => {
		if (score >= 80) return "Excelente";
		if (score >= 60) return "Bueno";
		if (score >= 40) return "Regular";
		return "Necesita mejora";
	};

	const circumference = 2 * Math.PI * 45;
	const strokeDashoffset = circumference - (score / 100) * circumference;

	return (
		<div className="flex flex-col items-center">
			<div className="relative">
				<svg width="140" height="140" className="-rotate-90">
					<title>Score progress</title>
					{/* Background circle */}
					<circle
						cx="70"
						cy="70"
						r="45"
						fill="none"
						stroke="currentColor"
						strokeWidth="10"
						className="text-muted/30"
					/>
					{/* Progress circle */}
					<circle
						cx="70"
						cy="70"
						r="45"
						fill="none"
						stroke="currentColor"
						strokeWidth="10"
						strokeLinecap="round"
						strokeDasharray={circumference}
						strokeDashoffset={strokeDashoffset}
						className={cn("transition-all duration-1000", getScoreColor(score))}
					/>
				</svg>
				<div className="absolute inset-0 flex flex-col items-center justify-center">
					<span className={cn("text-4xl font-bold", getScoreColor(score))}>
						{score}
					</span>
					<span className="text-xs text-muted-foreground">/100</span>
				</div>
			</div>
			<div
				className={cn(
					"mt-3 rounded-full px-4 py-1.5 text-sm font-medium bg-gradient-to-r",
					getScoreBackground(score),
					getScoreColor(score),
				)}
			>
				{getScoreLabel(score)}
			</div>
		</div>
	);
}

/**
 * Persona summary card for the results page.
 */
function PersonaSummary({ persona }: { persona: PersonaProfile }) {
	return (
		<Card>
			<CardHeader className="pb-3">
				<CardTitle className="flex items-center gap-2 text-base">
					<User className="size-4" />
					Cliente Simulado
				</CardTitle>
			</CardHeader>
			<CardContent className="space-y-3">
				<div>
					<p className="font-medium">{persona.name}</p>
					<p className="text-sm text-muted-foreground">
						{persona.age} años · {persona.location}
					</p>
				</div>
				<div className="grid grid-cols-2 gap-2 text-sm">
					<div>
						<Label className="text-xs text-muted-foreground">Ocupación</Label>
						<p>{persona.occupation}</p>
					</div>
					<div>
						<Label className="text-xs text-muted-foreground">NSE</Label>
						<p>{persona.socioeconomicLevel}</p>
					</div>
				</div>
				<div>
					<Label className="text-xs text-muted-foreground">
						Rasgos de personalidad
					</Label>
					<p className="text-sm">{persona.personalityTraits.join(", ")}</p>
				</div>
				<div>
					<Label className="text-xs text-muted-foreground">
						Actitud en la llamada
					</Label>
					<p className="text-sm">{persona.callAttitude}</p>
				</div>
			</CardContent>
		</Card>
	);
}

/**
 * Main analysis view component displaying all results.
 */
export function AnalysisView({
	sessionId,
	analysis: initialAnalysis,
	persona,
	scenarioConfig,
	turns,
	className,
}: AnalysisViewProps) {
	const [analysis, setAnalysis] = useState<AnalysisData | null>(
		initialAnalysis,
	);
	const [isGenerating, setIsGenerating] = useState(false);

	const generateAnalysis = useCallback(async () => {
		setIsGenerating(true);
		try {
			const response = await fetch(`/api/session/${sessionId}/analyze`, {
				method: "POST",
			});

			if (!response.ok) {
				const errorData = (await response.json().catch(() => null)) as {
					error?: string;
				} | null;
				throw new Error(errorData?.error ?? "Error al generar el análisis");
			}

			const result = (await response.json()) as {
				analysisId: string;
				score: number;
				successes: string[];
				improvements: ImprovementItem[];
				keyMoments: KeyMoment[];
			};

			setAnalysis({
				id: result.analysisId,
				improvements: result.improvements,
				keyMoments: result.keyMoments,
				score: result.score,
				successes: result.successes,
			});

			toast.success("Análisis generado exitosamente");
		} catch (error) {
			const message =
				error instanceof Error ? error.message : "Error desconocido";
			toast.error("Error al generar el análisis", { description: message });
		} finally {
			setIsGenerating(false);
		}
	}, [sessionId]);

	// Find the turn content by ID for key moments
	const getTurnContent = (turnId: string) => {
		const turn = turns.find((t) => t.id === turnId);
		return turn ?? null;
	};

	if (!analysis) {
		return (
			<div className={cn("space-y-6", className)}>
				<div className="flex flex-col items-center justify-center py-12 text-center">
					<div className="mb-6 rounded-full bg-blue-100 p-6 dark:bg-blue-900/30">
						<Target className="size-12 text-blue-600 dark:text-blue-400" />
					</div>
					<h2 className="mb-2 text-2xl font-bold">Análisis no generado</h2>
					<p className="mb-6 max-w-md text-muted-foreground">
						Tu simulación ha finalizado. Genera el análisis para obtener tu
						puntuación, aciertos, oportunidades de mejora y momentos clave.
					</p>
					<Button
						onClick={generateAnalysis}
						disabled={isGenerating}
						size="lg"
						className="gap-2"
					>
						{isGenerating ? (
							<>
								<Loader2 className="size-4 animate-spin" />
								Generando análisis...
							</>
						) : (
							<>
								<TrendingUp className="size-4" />
								Generar análisis
							</>
						)}
					</Button>
				</div>

				{/* Still show persona summary even without analysis */}
				<div className="mx-auto max-w-md">
					<PersonaSummary persona={persona} />
				</div>
			</div>
		);
	}

	return (
		<div className={cn("space-y-6", className)}>
			{/* Navigation */}
			<div className="flex items-center justify-between">
				<Link href={"/configuracion" as Route}>
					<Button variant="ghost" size="sm" className="gap-2">
						<ArrowLeft className="size-4" />
						Nueva simulación
					</Button>
				</Link>
				<Button
					variant="outline"
					size="sm"
					onClick={generateAnalysis}
					disabled={isGenerating}
					className="gap-2"
				>
					<RefreshCw className={cn("size-4", isGenerating && "animate-spin")} />
					Regenerar
				</Button>
			</div>

			{/* Main grid layout */}
			<div className="grid gap-6 lg:grid-cols-3">
				{/* Left column - Score and persona */}
				<div className="space-y-6">
					{/* Score card */}
					<Card className="bg-gradient-to-br from-white to-slate-50 dark:from-slate-900 dark:to-slate-950">
						<CardHeader className="pb-2">
							<CardTitle className="text-center text-lg">
								Puntuación Global
							</CardTitle>
						</CardHeader>
						<CardContent className="flex justify-center pb-6">
							<ScoreDisplay score={analysis.score} />
						</CardContent>
					</Card>

					{/* Persona summary */}
					<PersonaSummary persona={persona} />

					{/* Scenario info */}
					<Card>
						<CardHeader className="pb-3">
							<CardTitle className="flex items-center gap-2 text-base">
								<Target className="size-4" />
								Escenario
							</CardTitle>
						</CardHeader>
						<CardContent className="space-y-2 text-sm">
							<div>
								<Label className="text-xs text-muted-foreground">
									Producto
								</Label>
								<p>{scenarioConfig.productName}</p>
							</div>
							<div>
								<Label className="text-xs text-muted-foreground">
									Objetivo
								</Label>
								<p>{scenarioConfig.callObjective}</p>
							</div>
							<div>
								<Label className="text-xs text-muted-foreground">
									Tipo de contacto
								</Label>
								<p className="capitalize">
									{scenarioConfig.contactType.replace("_", " ")}
								</p>
							</div>
						</CardContent>
					</Card>
				</div>

				{/* Right column - Analysis details */}
				<div className="space-y-6 lg:col-span-2">
					{/* Successes */}
					<Card>
						<CardHeader className="pb-3">
							<CardTitle className="flex items-center gap-2 text-base text-green-700 dark:text-green-400">
								<CheckCircle2 className="size-5" />
								Aciertos ({analysis.successes.length})
							</CardTitle>
						</CardHeader>
						<CardContent>
							{analysis.successes.length > 0 ? (
								<ul className="space-y-2">
									{analysis.successes.map((success) => (
										<li
											key={success}
											className="flex items-start gap-2 text-sm"
										>
											<CheckCircle2 className="mt-0.5 size-4 shrink-0 text-green-600 dark:text-green-400" />
											<span>{success}</span>
										</li>
									))}
								</ul>
							) : (
								<p className="text-sm text-muted-foreground">
									No se identificaron aciertos en esta conversación.
								</p>
							)}
						</CardContent>
					</Card>

					{/* Improvements */}
					<Card>
						<CardHeader className="pb-3">
							<CardTitle className="flex items-center gap-2 text-base text-amber-700 dark:text-amber-400">
								<Lightbulb className="size-5" />
								Oportunidades de mejora ({analysis.improvements.length})
							</CardTitle>
						</CardHeader>
						<CardContent>
							{analysis.improvements.length > 0 ? (
								<div className="space-y-4">
									{analysis.improvements.map((improvement) => (
										<div
											key={improvement.title}
											className="rounded-lg border bg-amber-50/50 p-3 dark:bg-amber-900/10"
										>
											<div className="flex items-start gap-2">
												<AlertTriangle className="mt-0.5 size-4 shrink-0 text-amber-600 dark:text-amber-400" />
												<div>
													<p className="font-medium text-sm">
														{improvement.title}
													</p>
													<p className="mt-1 text-sm text-muted-foreground">
														{improvement.action}
													</p>
												</div>
											</div>
										</div>
									))}
								</div>
							) : (
								<p className="text-sm text-muted-foreground">
									No se identificaron áreas de mejora.
								</p>
							)}
						</CardContent>
					</Card>

					{/* Key moments */}
					<Card>
						<CardHeader className="pb-3">
							<CardTitle className="flex items-center gap-2 text-base text-blue-700 dark:text-blue-400">
								<MessageSquareQuote className="size-5" />
								Momentos clave ({analysis.keyMoments.length})
							</CardTitle>
						</CardHeader>
						<CardContent>
							{analysis.keyMoments.length > 0 ? (
								<ScrollArea className="max-h-96">
									<div className="space-y-4 pr-2">
										{analysis.keyMoments.map((moment) => {
											const turn = getTurnContent(moment.turnId);
											return (
												<div
													key={moment.turnId}
													className="rounded-lg border p-4"
												>
													{/* Quote */}
													<div className="mb-3 flex items-start gap-2">
														<MessageSquareQuote className="mt-0.5 size-4 shrink-0 text-blue-600 dark:text-blue-400" />
														<blockquote className="text-sm italic text-muted-foreground">
															"{moment.quote}"
														</blockquote>
													</div>

													{/* Turn context if available */}
													{turn && (
														<div className="mb-3 rounded bg-muted/50 px-3 py-2 text-xs">
															<span className="font-medium">
																{turn.role === "seller"
																	? "Vendedor"
																	: "Cliente"}
																:
															</span>{" "}
															{turn.content.length > 150
																? `${turn.content.slice(0, 150)}...`
																: turn.content}
														</div>
													)}

													{/* Insight */}
													<div className="mb-2">
														<Label className="text-xs font-medium text-blue-700 dark:text-blue-400">
															Por qué es importante
														</Label>
														<p className="mt-0.5 text-sm">{moment.insight}</p>
													</div>

													{/* Recommendation */}
													<div>
														<Label className="text-xs font-medium text-green-700 dark:text-green-400">
															Recomendación
														</Label>
														<p className="mt-0.5 text-sm">
															{moment.recommendation}
														</p>
													</div>
												</div>
											);
										})}
									</div>
								</ScrollArea>
							) : (
								<p className="text-sm text-muted-foreground">
									No se identificaron momentos clave.
								</p>
							)}
						</CardContent>
					</Card>
				</div>
			</div>
		</div>
	);
}
