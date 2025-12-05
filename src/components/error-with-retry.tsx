"use client";

import { AlertTriangle, RefreshCw, WifiOff, X } from "lucide-react";
import { useCallback, useState } from "react";

import { cn } from "@/lib/utils";
import { Button } from "./ui/button";

export type ErrorType = "network" | "server" | "audio" | "generic";

export interface ErrorWithRetryProps {
	/** Error message to display */
	message: string;
	/** Type of error for appropriate icon and styling */
	type?: ErrorType;
	/** Callback when retry button is clicked */
	onRetry?: () => void | Promise<void>;
	/** Callback when dismiss button is clicked */
	onDismiss?: () => void;
	/** Whether retry is currently in progress */
	isRetrying?: boolean;
	/** Additional CSS classes */
	className?: string;
}

/**
 * Gets appropriate icon for error type.
 */
function getErrorIcon(type: ErrorType) {
	switch (type) {
		case "network":
			return WifiOff;
		default:
			return AlertTriangle;
	}
}

/**
 * Gets appropriate styling for error type.
 */
function getErrorStyles(type: ErrorType) {
	switch (type) {
		case "network":
			return {
				button:
					"text-orange-700 hover:bg-orange-100 dark:text-orange-300 dark:hover:bg-orange-900/30",
				container:
					"bg-orange-50 border-orange-200 dark:bg-orange-900/20 dark:border-orange-800",
				icon: "text-orange-600 dark:text-orange-400",
				text: "text-orange-800 dark:text-orange-200",
			};
		case "audio":
			return {
				button:
					"text-purple-700 hover:bg-purple-100 dark:text-purple-300 dark:hover:bg-purple-900/30",
				container:
					"bg-purple-50 border-purple-200 dark:bg-purple-900/20 dark:border-purple-800",
				icon: "text-purple-600 dark:text-purple-400",
				text: "text-purple-800 dark:text-purple-200",
			};
		case "server":
			return {
				button:
					"text-red-700 hover:bg-red-100 dark:text-red-300 dark:hover:bg-red-900/30",
				container:
					"bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800",
				icon: "text-red-600 dark:text-red-400",
				text: "text-red-800 dark:text-red-200",
			};
		default:
			return {
				button:
					"text-yellow-700 hover:bg-yellow-100 dark:text-yellow-300 dark:hover:bg-yellow-900/30",
				container:
					"bg-yellow-50 border-yellow-200 dark:bg-yellow-900/20 dark:border-yellow-800",
				icon: "text-yellow-600 dark:text-yellow-400",
				text: "text-yellow-800 dark:text-yellow-200",
			};
	}
}

/**
 * Determines error type from error message.
 */
export function inferErrorType(message: string): ErrorType {
	const lowerMessage = message.toLowerCase();

	if (
		lowerMessage.includes("network") ||
		lowerMessage.includes("conexión") ||
		lowerMessage.includes("internet") ||
		lowerMessage.includes("offline") ||
		lowerMessage.includes("fetch")
	) {
		return "network";
	}

	if (
		lowerMessage.includes("audio") ||
		lowerMessage.includes("micrófono") ||
		lowerMessage.includes("microphone") ||
		lowerMessage.includes("recording") ||
		lowerMessage.includes("grabación")
	) {
		return "audio";
	}

	if (
		lowerMessage.includes("server") ||
		lowerMessage.includes("500") ||
		lowerMessage.includes("503") ||
		lowerMessage.includes("servidor")
	) {
		return "server";
	}

	return "generic";
}

/**
 * Error display component with retry functionality.
 */
export function ErrorWithRetry({
	message,
	type = "generic",
	onRetry,
	onDismiss,
	isRetrying = false,
	className,
}: ErrorWithRetryProps) {
	const Icon = getErrorIcon(type);
	const styles = getErrorStyles(type);

	return (
		<div
			className={cn(
				"flex items-start gap-3 rounded-lg border p-4 animate-in slide-in-from-top-2 fade-in-0 duration-300",
				styles.container,
				className,
			)}
			role="alert"
		>
			<Icon className={cn("size-5 shrink-0 mt-0.5", styles.icon)} />
			<div className="flex-1 space-y-2">
				<p className={cn("text-sm font-medium", styles.text)}>{message}</p>
				<div className="flex items-center gap-2">
					{onRetry && (
						<Button
							variant="ghost"
							size="sm"
							onClick={onRetry}
							disabled={isRetrying}
							className={cn("h-8 px-3 text-xs", styles.button)}
						>
							<RefreshCw
								className={cn("mr-1.5 size-3.5", isRetrying && "animate-spin")}
							/>
							{isRetrying ? "Reintentando..." : "Reintentar"}
						</Button>
					)}
				</div>
			</div>
			{onDismiss && (
				<Button
					variant="ghost"
					size="icon"
					onClick={onDismiss}
					className={cn("size-8 shrink-0", styles.button)}
					aria-label="Cerrar"
				>
					<X className="size-4" />
				</Button>
			)}
		</div>
	);
}

/**
 * Hook for managing error state with retry functionality.
 */
export function useErrorWithRetry<
	T extends (...args: unknown[]) => Promise<unknown>,
>(
	action: T,
	options?: {
		maxRetries?: number;
		onSuccess?: () => void;
	},
) {
	const [error, setError] = useState<string | null>(null);
	const [errorType, setErrorType] = useState<ErrorType>("generic");
	const [isRetrying, setIsRetrying] = useState(false);
	const [retryCount, setRetryCount] = useState(0);

	const maxRetries = options?.maxRetries ?? 3;

	const execute = useCallback(
		async (...args: Parameters<T>) => {
			setError(null);
			try {
				await action(...args);
				setRetryCount(0);
				options?.onSuccess?.();
			} catch (err) {
				const message =
					err instanceof Error
						? err.message
						: "Ha ocurrido un error inesperado";
				setError(message);
				setErrorType(inferErrorType(message));
			}
		},
		[action, options],
	);

	const retry = useCallback(async () => {
		if (retryCount >= maxRetries) {
			setError("Se han agotado los intentos. Por favor, inténtalo más tarde.");
			return;
		}

		setIsRetrying(true);
		setRetryCount((prev) => prev + 1);

		try {
			await action();
			setError(null);
			setRetryCount(0);
			options?.onSuccess?.();
		} catch (err) {
			const message =
				err instanceof Error ? err.message : "Ha ocurrido un error inesperado";
			setError(message);
			setErrorType(inferErrorType(message));
		} finally {
			setIsRetrying(false);
		}
	}, [action, retryCount, maxRetries, options]);

	const dismiss = useCallback(() => {
		setError(null);
	}, []);

	return {
		canRetry: retryCount < maxRetries,
		dismiss,
		error,
		errorType,
		execute,
		isRetrying,
		maxRetries,
		retry,
		retryCount,
	};
}
