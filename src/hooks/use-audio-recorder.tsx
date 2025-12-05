"use client";

import { useCallback, useRef, useState } from "react";

export type RecordingState = "idle" | "recording" | "processing";

export interface UseAudioRecorderResult {
	/** Start recording audio from the microphone */
	startRecording: () => Promise<void>;
	/** Stop recording and return the audio blob */
	stopRecording: () => Promise<Blob | null>;
	/** Current recording state */
	state: RecordingState;
	/** Error message if any */
	error: string | null;
	/** Clear error state */
	clearError: () => void;
}

/**
 * Hook for recording audio from the user's microphone.
 * Uses the MediaRecorder API with webm/opus format.
 */
export function useAudioRecorder(): UseAudioRecorderResult {
	const [state, setState] = useState<RecordingState>("idle");
	const [error, setError] = useState<string | null>(null);

	const mediaRecorderRef = useRef<MediaRecorder | null>(null);
	const chunksRef = useRef<Blob[]>([]);
	const streamRef = useRef<MediaStream | null>(null);

	const clearError = useCallback(() => {
		setError(null);
	}, []);

	const startRecording = useCallback(async () => {
		try {
			setError(null);

			// Request microphone access
			const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
			streamRef.current = stream;

			// Determine the best supported MIME type
			const mimeType = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
				? "audio/webm;codecs=opus"
				: MediaRecorder.isTypeSupported("audio/webm")
					? "audio/webm"
					: "audio/mp4";

			const mediaRecorder = new MediaRecorder(stream, { mimeType });
			mediaRecorderRef.current = mediaRecorder;
			chunksRef.current = [];

			mediaRecorder.ondataavailable = (event) => {
				if (event.data.size > 0) {
					chunksRef.current.push(event.data);
				}
			};

			mediaRecorder.start();
			setState("recording");
		} catch (err) {
			const message =
				err instanceof Error
					? err.message
					: "No se pudo acceder al micrófono. Verifica los permisos.";
			setError(message);
			setState("idle");
		}
	}, []);

	const stopRecording = useCallback(async (): Promise<Blob | null> => {
		return new Promise((resolve) => {
			const mediaRecorder = mediaRecorderRef.current;

			if (!mediaRecorder || state !== "recording") {
				resolve(null);
				return;
			}

			setState("processing");

			mediaRecorder.onstop = () => {
				const audioBlob = new Blob(chunksRef.current, {
					type: mediaRecorder.mimeType,
				});
				chunksRef.current = [];

				// Stop all tracks
				if (streamRef.current) {
					for (const track of streamRef.current.getTracks()) {
						track.stop();
					}
					streamRef.current = null;
				}

				mediaRecorderRef.current = null;
				setState("idle");
				resolve(audioBlob);
			};

			mediaRecorder.stop();
		});
	}, [state]);

	return {
		clearError,
		error,
		startRecording,
		state,
		stopRecording,
	};
}
