"use client";

import { Loader2, Mic, Square } from "lucide-react";
import { useCallback } from "react";
import { useAudioRecorder } from "@/hooks/use-audio-recorder";
import { cn } from "@/lib/utils";
import { Button } from "./ui/button";

export interface AudioRecorderButtonProps {
	/** Called when recording is stopped and transcription is complete */
	onTranscription: (text: string) => void;
	/** Called when an error occurs */
	onError?: (error: string) => void;
	/** Whether the button should be disabled */
	disabled?: boolean;
	/** Additional CSS classes */
	className?: string;
}

/**
 * A button component for recording audio and sending it for transcription.
 * Uses OpenAI Whisper via the /api/stt endpoint.
 */
export function AudioRecorderButton({
	onTranscription,
	onError,
	disabled = false,
	className,
}: AudioRecorderButtonProps) {
	const { startRecording, stopRecording, state, error, clearError } =
		useAudioRecorder();

	const handleClick = useCallback(async () => {
		if (state === "idle") {
			await startRecording();
		} else if (state === "recording") {
			const audioBlob = await stopRecording();

			if (!audioBlob) {
				onError?.("No se pudo grabar el audio");
				return;
			}

			try {
				const formData = new FormData();
				formData.append("audio", audioBlob, "audio.webm");

				const response = await fetch("/api/stt", {
					body: formData,
					method: "POST",
				});

				if (!response.ok) {
					const errorData = (await response.json().catch(() => null)) as {
						error?: string;
					} | null;
					throw new Error(errorData?.error ?? "Error al transcribir el audio");
				}

				const data = (await response.json()) as { text: string };
				onTranscription(data.text);
			} catch (err) {
				const message =
					err instanceof Error ? err.message : "Error al transcribir el audio";
				onError?.(message);
			}
		}
	}, [state, startRecording, stopRecording, onTranscription, onError]);

	// Report hook errors to parent
	if (error) {
		onError?.(error);
		clearError();
	}

	const isRecording = state === "recording";
	const isProcessing = state === "processing";
	const isDisabled = disabled || isProcessing;

	return (
		<Button
			className={cn(
				"size-16 rounded-full transition-all duration-200",
				isRecording &&
					"bg-red-600 hover:bg-red-700 ring-4 ring-red-300 animate-pulse",
				className,
			)}
			disabled={isDisabled}
			onClick={handleClick}
			size="icon"
			type="button"
			aria-label={
				isRecording
					? "Detener grabación"
					: isProcessing
						? "Procesando audio..."
						: "Iniciar grabación"
			}
		>
			{isProcessing ? (
				<Loader2 className="size-8 animate-spin" />
			) : isRecording ? (
				<Square className="size-6" />
			) : (
				<Mic className="size-8" />
			)}
		</Button>
	);
}
