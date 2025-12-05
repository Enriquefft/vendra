"use client";

import { ChevronDown, ChevronUp, Eye, EyeOff } from "lucide-react";
import { useState } from "react";

import type { PersonaProfile } from "@/db/schema/simulation";
import { cn } from "@/lib/utils";

import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Label } from "./ui/label";
import { ScrollArea } from "./ui/scroll-area";

export type ClientCardVisibility = "full" | "minimized" | "hidden";

export interface ClientCardProps {
	persona: PersonaProfile;
	/** Current interest level (1-10) during the conversation */
	interestLevel?: number;
	/** Initial visibility state */
	initialVisibility?: ClientCardVisibility;
	/** Additional CSS classes */
	className?: string;
}

/**
 * Displays the client persona information during simulation.
 * Can be toggled between full, minimized, and hidden views.
 */
export function ClientCard({
	persona,
	interestLevel,
	initialVisibility = "full",
	className,
}: ClientCardProps) {
	const [visibility, setVisibility] =
		useState<ClientCardVisibility>(initialVisibility);

	const toggleMinimize = () => {
		setVisibility((current) =>
			current === "full"
				? "minimized"
				: current === "minimized"
					? "full"
					: current,
		);
	};

	const toggleHide = () => {
		setVisibility((current) => (current === "hidden" ? "minimized" : "hidden"));
	};

	if (visibility === "hidden") {
		return (
			<div className={cn("flex justify-end", className)}>
				<Button
					variant="outline"
					size="sm"
					onClick={toggleHide}
					className="gap-2"
				>
					<Eye className="size-4" />
					Mostrar cliente
				</Button>
			</div>
		);
	}

	return (
		<Card className={cn("transition-all duration-200", className)}>
			<CardHeader className="flex flex-row items-start justify-between gap-3 pb-2">
				<div className="flex-1">
					<p className="text-xs uppercase tracking-wide text-muted-foreground">
						Cliente
					</p>
					<CardTitle className="text-lg">{persona.name}</CardTitle>
					<p className="text-sm text-muted-foreground">
						{persona.age} años · {persona.location}
					</p>
				</div>
				<div className="flex items-center gap-1">
					<Button
						variant="ghost"
						size="icon"
						onClick={toggleMinimize}
						className="size-8"
						aria-label={visibility === "full" ? "Minimizar" : "Expandir"}
					>
						{visibility === "full" ? (
							<ChevronUp className="size-4" />
						) : (
							<ChevronDown className="size-4" />
						)}
					</Button>
					<Button
						variant="ghost"
						size="icon"
						onClick={toggleHide}
						className="size-8"
						aria-label="Ocultar cliente"
					>
						<EyeOff className="size-4" />
					</Button>
				</div>
			</CardHeader>

			{visibility === "full" && (
				<CardContent className="pt-0">
					<div className="mb-3 flex items-center gap-3">
						<span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
							{persona.callAttitude}
						</span>
						{interestLevel !== undefined && (
							<span
								className={cn(
									"rounded-full px-3 py-1 text-xs font-semibold",
									interestLevel >= 7
										? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
										: interestLevel >= 4
											? "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400"
											: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
								)}
							>
								Interés: {interestLevel}/10
							</span>
						)}
					</div>

					<p className="text-sm text-foreground">{persona.briefStory}</p>

					<ScrollArea className="mt-3 h-48 pr-2">
						<div className="space-y-3 text-sm text-muted-foreground">
							<div>
								<Label className="text-xs text-foreground">Motivaciones</Label>
								<ul className="ml-4 list-disc">
									{persona.motivations.map((item) => (
										<li key={item}>{item}</li>
									))}
								</ul>
							</div>
							<div>
								<Label className="text-xs text-foreground">
									Puntos de dolor
								</Label>
								<ul className="ml-4 list-disc">
									{persona.pains.map((item) => (
										<li key={item}>{item}</li>
									))}
								</ul>
							</div>
							<div className="grid grid-cols-2 gap-2">
								<div>
									<Label className="text-xs text-foreground">Ocupación</Label>
									<p>{persona.occupation}</p>
								</div>
								<div>
									<Label className="text-xs text-foreground">
										Nivel socioeconómico
									</Label>
									<p>{persona.socioeconomicLevel}</p>
								</div>
								<div>
									<Label className="text-xs text-foreground">
										Nivel educativo
									</Label>
									<p>{persona.educationLevel}</p>
								</div>
								<div>
									<Label className="text-xs text-foreground">
										Canal preferido
									</Label>
									<p>{persona.preferredChannel}</p>
								</div>
							</div>
							<div>
								<Label className="text-xs text-foreground">
									Rasgos de personalidad
								</Label>
								<p>{persona.personalityTraits.join(", ")}</p>
							</div>
						</div>
					</ScrollArea>
				</CardContent>
			)}
		</Card>
	);
}
