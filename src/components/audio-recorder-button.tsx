"use client";

import { Loader2, Mic, Square } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
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
 * Formats seconds into mm:ss display format.
 */
function formatTime(seconds: number): string {
	const mins = Math.floor(seconds / 60);
	const secs = seconds % 60;
	return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
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
	const [recordingTime, setRecordingTime] = useState(0);

	// Recording timer
	useEffect(() => {
		let interval: ReturnType<typeof setInterval> | null = null;

		if (state === "recording") {
			setRecordingTime(0);
			interval = setInterval(() => {
				setRecordingTime((prev) => prev + 1);
			}, 1000);
		} else {
			setRecordingTime(0);
		}

		return () => {
			if (interval) clearInterval(interval);
		};
	}, [state]);

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

				const data = (await response.json()) as {
					mocked?: boolean;
					text: string;
				};
				if (data.mocked) {
					toast.info("Modo simulado activo", {
						description: "Transcribimos sin la API de OpenAI.",
					});
				}
				onTranscription(data.text);
			} catch (err) {
				const message =
					err instanceof Error ? err.message : "Error al transcribir el audio";
				onError?.(message);
			}
		}
	}, [state, startRecording, stopRecording, onTranscription, onError]);

	// Report hook errors to parent using useEffect to avoid render-loop issues
	useEffect(() => {
		if (error) {
			onError?.(error);
			clearError();
		}
	}, [error, onError, clearError]);

	const isRecording = state === "recording";
	const isProcessing = state === "processing";
	const isDisabled = disabled || isProcessing;

	return (
		<div className="flex flex-col items-center gap-2">
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
			{isRecording && (
				<div className="flex items-center gap-2 text-sm text-red-600 dark:text-red-400 animate-in fade-in-0 duration-200">
					<span className="size-2 rounded-full bg-red-500 animate-pulse" />
					<span className="font-mono font-medium">
						{formatTime(recordingTime)}
					</span>
				</div>
			)}
		</div>
	);
}
