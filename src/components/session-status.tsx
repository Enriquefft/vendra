"use client";

import { Clock, Signal, Wifi, WifiOff } from "lucide-react";
import { useEffect, useState } from "react";

import { cn } from "@/lib/utils";

export type ConnectionStatus = "connected" | "connecting" | "disconnected";

export interface SessionStatusProps {
	/** Session start time (for duration calculation) */
	startTime?: Date;
	/** Maximum duration in minutes */
	maxDurationMinutes?: number;
	/** Whether to show connection status */
	showConnectionStatus?: boolean;
	/** Additional CSS classes */
	className?: string;
}

/**
 * Formats duration in seconds to mm:ss display format.
 */
function formatDuration(seconds: number): string {
	const mins = Math.floor(seconds / 60);
	const secs = seconds % 60;
	return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
}

/**
 * Hook to track online/offline status.
 */
function useConnectionStatus(): ConnectionStatus {
	const [status, setStatus] = useState<ConnectionStatus>("connected");

	useEffect(() => {
		const handleOnline = () => setStatus("connected");
		const handleOffline = () => setStatus("disconnected");

		// Set initial status
		setStatus(navigator.onLine ? "connected" : "disconnected");

		window.addEventListener("online", handleOnline);
		window.addEventListener("offline", handleOffline);

		return () => {
			window.removeEventListener("online", handleOnline);
			window.removeEventListener("offline", handleOffline);
		};
	}, []);

	return status;
}

/**
 * Connection status indicator component.
 */
function ConnectionIndicator({ status }: { status: ConnectionStatus }) {
	return (
		<div
			className={cn(
				"flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium transition-colors",
				status === "connected" &&
					"bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
				status === "connecting" &&
					"bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
				status === "disconnected" &&
					"bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
			)}
		>
			{status === "connected" ? (
				<>
					<Wifi className="size-3.5" />
					<span>Conectado</span>
				</>
			) : status === "connecting" ? (
				<>
					<Signal className="size-3.5 animate-pulse" />
					<span>Conectando...</span>
				</>
			) : (
				<>
					<WifiOff className="size-3.5" />
					<span>Sin conexión</span>
				</>
			)}
		</div>
	);
}

/**
 * Session timer component showing elapsed time and remaining time warning.
 */
function SessionTimer({
	startTime,
	maxDurationMinutes,
}: {
	startTime: Date;
	maxDurationMinutes?: number;
}) {
	const [elapsedSeconds, setElapsedSeconds] = useState(0);

	useEffect(() => {
		const interval = setInterval(() => {
			const now = new Date();
			const elapsed = Math.floor((now.getTime() - startTime.getTime()) / 1000);
			setElapsedSeconds(elapsed);
		}, 1000);

		return () => clearInterval(interval);
	}, [startTime]);

	const maxSeconds = maxDurationMinutes ? maxDurationMinutes * 60 : null;
	const remainingSeconds = maxSeconds ? maxSeconds - elapsedSeconds : null;
	const isNearEnd = remainingSeconds !== null && remainingSeconds <= 120; // Less than 2 minutes
	const isOverTime = remainingSeconds !== null && remainingSeconds < 0;

	return (
		<div className="flex items-center gap-3">
			<div
				className={cn(
					"flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium",
					isOverTime
						? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
						: isNearEnd
							? "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400"
							: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
				)}
			>
				<Clock className="size-3.5" />
				<span className="font-mono">{formatDuration(elapsedSeconds)}</span>
			</div>
			{maxSeconds && (
				<span
					className={cn(
						"text-xs",
						isOverTime
							? "text-red-600 dark:text-red-400"
							: isNearEnd
								? "text-yellow-600 dark:text-yellow-400"
								: "text-muted-foreground",
					)}
				>
					{isOverTime
						? "Tiempo excedido"
						: isNearEnd
							? `Quedan ${Math.max(0, Math.ceil(remainingSeconds / 60))} min`
							: `de ${maxDurationMinutes} min`}
				</span>
			)}
		</div>
	);
}

/**
 * Displays session status indicators including connection status and timer.
 */
export function SessionStatus({
	startTime,
	maxDurationMinutes,
	showConnectionStatus = true,
	className,
}: SessionStatusProps) {
	const connectionStatus = useConnectionStatus();

	return (
		<div className={cn("flex items-center gap-4", className)}>
			{showConnectionStatus && (
				<ConnectionIndicator status={connectionStatus} />
			)}
			{startTime && (
				<SessionTimer
					startTime={startTime}
					maxDurationMinutes={maxDurationMinutes}
				/>
			)}
		</div>
	);
}

/**
 * Offline banner component that shows when the user loses connection.
 */
export function OfflineBanner({ className }: { className?: string }) {
	const connectionStatus = useConnectionStatus();

	if (connectionStatus === "connected") {
		return null;
	}

	return (
		<div
			className={cn(
				"flex items-center justify-center gap-2 bg-red-600 px-4 py-2 text-sm text-white animate-in slide-in-from-top-full duration-300",
				className,
			)}
		>
			<WifiOff className="size-4" />
			<span>
				Sin conexión a internet. Algunas funciones pueden no estar disponibles.
			</span>
		</div>
	);
}
