"use client";

import { AlertTriangle, Loader2, PhoneOff } from "lucide-react";
import type { Route } from "next";
import { useRouter } from "next/navigation";
import { useCallback, useMemo, useState } from "react";
import { toast } from "sonner";

import type { PersonaProfile } from "@/db/schema/simulation";
import type { ClientResponse } from "@/lib/conversation-orchestrator";
import { cn } from "@/lib/utils";

import { AudioRecorderButton } from "./audio-recorder-button";
import { type ChatMessage, ChatMessages } from "./chat-messages";
import { ClientCard } from "./client-card";
import {
	type ErrorType,
	ErrorWithRetry,
	inferErrorType,
} from "./error-with-retry";
import { OfflineBanner, SessionStatus } from "./session-status";
import { Button } from "./ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "./ui/dialog";

export interface SimulationViewProps {
	sessionId: string;
	persona: PersonaProfile;
	/** Initial messages from the database */
	initialMessages?: ChatMessage[];
	/** Maximum duration in minutes */
	maxDurationMinutes?: number;
	/** Additional CSS classes */
	className?: string;
}

type ConversationStatus = "active" | "ending" | "ended";

interface ConversationError {
	message: string;
	type: ErrorType;
	retryAction?: () => Promise<void>;
}

/**
 * Main simulation view component.
 * Handles the conversation flow between seller (voice) and client (AI text).
 */
export function SimulationView({
	sessionId,
	persona,
	initialMessages = [],
	maxDurationMinutes,
	className,
}: SimulationViewProps) {
	const router = useRouter();
	const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);
	const [isLoading, setIsLoading] = useState(false);
	const [status, setStatus] = useState<ConversationStatus>("active");
	const [currentInterest, setCurrentInterest] = useState<number | undefined>();
	const [showEndDialog, setShowEndDialog] = useState(false);
	const [clientWantsToEnd, setClientWantsToEnd] = useState(false);
	const [conversationError, setConversationError] =
		useState<ConversationError | null>(null);
	const [isRetrying, setIsRetrying] = useState(false);

	// Session start time (memoized to avoid recreating on each render)
	const sessionStartTime = useMemo(() => new Date(), []);

	const sendMessage = useCallback(
		async (text: string, isRetry = false) => {
			if (status !== "active") return;

			// Clear any previous errors
			setConversationError(null);

			// Add seller message immediately (if not a retry)
			const tempId = `temp-seller-${Date.now()}`;
			const sellerMessage: ChatMessage = {
				content: text,
				id: tempId,
				role: "seller",
				turnIndex: messages.length,
			};

			if (!isRetry) {
				setMessages((prev) => [...prev, sellerMessage]);
			}
			setIsLoading(true);

			try {
				const response = await fetch(`/api/session/${sessionId}/speak`, {
					body: JSON.stringify({ text }),
					headers: { "Content-Type": "application/json" },
					method: "POST",
				});

				if (!response.ok) {
					const errorData = (await response.json().catch(() => null)) as {
						error?: string;
					} | null;
					throw new Error(errorData?.error ?? "Error al procesar la respuesta");
				}

				const result = (await response.json()) as {
					clientResponse: ClientResponse;
					clientTurnId: string;
					mocked?: boolean;
					sellerTurnId: string;
				};

				if (result.mocked) {
					toast.info("Modo simulado activo", {
						description: "Generamos respuestas sin usar la API de OpenAI.",
					});
				}

				// Update seller message with real ID
				setMessages((prev) =>
					prev.map((msg) =>
						msg.id === sellerMessage.id
							? { ...msg, id: result.sellerTurnId }
							: msg,
					),
				);

				// Add client response
				const clientMessage: ChatMessage = {
					content: result.clientResponse.clientText,
					id: result.clientTurnId,
					meta: {
						clientWantsToEnd: result.clientResponse.wantsToEnd,
						interest: result.clientResponse.interest,
						interruption: result.clientResponse.interruption,
					},
					role: "client",
					turnIndex: messages.length + 1,
				};
				setMessages((prev) => [...prev, clientMessage]);
				setCurrentInterest(result.clientResponse.interest);

				// Check if client wants to end
				if (result.clientResponse.wantsToEnd) {
					setClientWantsToEnd(true);
					toast.warning("El cliente quiere terminar la llamada", {
						description: "Puedes intentar retenerlo o finalizar la simulación.",
					});
				}
			} catch (error) {
				// Remove the temporary seller message on error (only if not a retry)
				if (!isRetry) {
					setMessages((prev) =>
						prev.filter((msg) => msg.id !== sellerMessage.id),
					);
				}
				const message =
					error instanceof Error ? error.message : "Error desconocido";

				// Set error with retry capability
				setConversationError({
					message,
					retryAction: async () => {
						setIsRetrying(true);
						try {
							await sendMessage(text, true);
						} finally {
							setIsRetrying(false);
						}
					},
					type: inferErrorType(message),
				});

				toast.error("Error en la conversación", { description: message });
			} finally {
				setIsLoading(false);
			}
		},
		[sessionId, status, messages.length],
	);

	const handleTranscription = useCallback(
		async (text: string) => {
			if (status !== "active" || isLoading) return;
			await sendMessage(text);
		},
		[status, isLoading, sendMessage],
	);

	const handleError = useCallback((error: string) => {
		setConversationError({
			message: error,
			type: inferErrorType(error),
		});
		toast.error("Error de audio", { description: error });
	}, []);

	const handleDismissError = useCallback(() => {
		setConversationError(null);
	}, []);

	const handleEndCall = useCallback(async () => {
		setStatus("ending");
		setShowEndDialog(false);

		try {
			const response = await fetch(`/api/session/${sessionId}/end`, {
				method: "POST",
			});

			if (!response.ok) {
				throw new Error("No se pudo finalizar la sesión");
			}

			setStatus("ended");
			toast.success("Simulación finalizada", {
				description: "Redirigiendo al análisis...",
			});

			// Redirect to results page immediately
			router.replace(`/resultado/${sessionId}` as Route);
		} catch (error) {
			setStatus("active");
			const message =
				error instanceof Error ? error.message : "Error desconocido";
			toast.error("Error al finalizar", { description: message });
		}
	}, [sessionId, router]);

	const isConversationActive = status === "active" && !isLoading;

	return (
		<div className={cn("flex h-full flex-col", className)}>
			{/* Offline banner */}
			<OfflineBanner />

			<div className="flex flex-1 flex-col lg:flex-row gap-4 lg:gap-6">
				{/* Main conversation area */}
				<div className="flex flex-1 flex-col rounded-xl border bg-card shadow-sm">
					{/* Header */}
					<div className="flex items-center justify-between border-b px-4 py-3">
						<div className="flex items-center gap-4">
							<div>
								<h2 className="font-semibold">Simulación en curso</h2>
								<p className="text-sm text-muted-foreground">
									{messages.length} turnos de conversación
								</p>
							</div>
							<SessionStatus
								startTime={sessionStartTime}
								maxDurationMinutes={maxDurationMinutes}
								showConnectionStatus
								className="hidden sm:flex"
							/>
						</div>
						<Button
							variant="destructive"
							size="sm"
							onClick={() => setShowEndDialog(true)}
							disabled={status !== "active"}
							className="gap-2"
						>
							{status === "ending" ? (
								<Loader2 className="size-4 animate-spin" />
							) : (
								<PhoneOff className="size-4" />
							)}
							<span className="hidden sm:inline">Terminar llamada</span>
						</Button>
					</div>

					{/* Warning banner if client wants to end */}
					{clientWantsToEnd && status === "active" && (
						<div className="flex items-center gap-2 border-b bg-yellow-50 px-4 py-2 text-sm text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-200 animate-in slide-in-from-top-2 duration-300">
							<AlertTriangle className="size-4" />
							<span>El cliente muestra intención de terminar la llamada.</span>
						</div>
					)}

					{/* Error banner with retry */}
					{conversationError && (
						<div className="px-4 py-2 border-b">
							<ErrorWithRetry
								message={conversationError.message}
								type={conversationError.type}
								onRetry={conversationError.retryAction}
								onDismiss={handleDismissError}
								isRetrying={isRetrying}
							/>
						</div>
					)}

					{/* Chat messages */}
					<ChatMessages
						messages={messages}
						isLoading={isLoading}
						className="flex-1"
					/>

					{/* Audio controls */}
					<div className="flex flex-col items-center gap-3 border-t p-4">
						<AudioRecorderButton
							onTranscription={handleTranscription}
							onError={handleError}
							disabled={!isConversationActive}
						/>
						<p className="text-xs text-muted-foreground text-center">
							{status === "active"
								? isLoading
									? "Esperando respuesta del cliente..."
									: "Presiona para hablar"
								: status === "ending"
									? "Finalizando simulación..."
									: "Simulación terminada"}
						</p>
						{/* Mobile session status */}
						<div className="sm:hidden">
							<SessionStatus
								startTime={sessionStartTime}
								maxDurationMinutes={maxDurationMinutes}
								showConnectionStatus={false}
							/>
						</div>
					</div>
				</div>

				{/* Client card sidebar */}
				<div className="w-full lg:w-80 shrink-0">
					<ClientCard
						persona={persona}
						interestLevel={currentInterest}
						initialVisibility="full"
					/>
				</div>

				{/* End call confirmation dialog */}
				<Dialog open={showEndDialog} onOpenChange={setShowEndDialog}>
					<DialogContent>
						<DialogHeader>
							<DialogTitle>¿Terminar la simulación?</DialogTitle>
							<DialogDescription>
								Al terminar la llamada, se generará un análisis de tu desempeño.
								Esta acción no se puede deshacer.
							</DialogDescription>
						</DialogHeader>
						<DialogFooter>
							<Button variant="outline" onClick={() => setShowEndDialog(false)}>
								Continuar llamada
							</Button>
							<Button variant="destructive" onClick={handleEndCall}>
								<PhoneOff className="mr-2 size-4" />
								Terminar llamada
							</Button>
						</DialogFooter>
					</DialogContent>
				</Dialog>
			</div>
		</div>
	);
}
