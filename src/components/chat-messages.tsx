"use client";

import { Loader2, User, Users } from "lucide-react";
import { useEffect, useRef } from "react";

import { cn } from "@/lib/utils";

import { ScrollArea } from "./ui/scroll-area";

export type MessageRole = "seller" | "client";

export interface ChatMessage {
	id: string;
	role: MessageRole;
	content: string;
	turnIndex: number;
	meta?: {
		interest?: number;
		interruption?: boolean;
		clientWantsToEnd?: boolean;
	};
}

export interface ChatMessagesProps {
	messages: ChatMessage[];
	/** Whether the AI is currently generating a response */
	isLoading?: boolean;
	/** Additional CSS classes */
	className?: string;
}

/**
 * Displays the conversation messages between seller and client.
 * Auto-scrolls to the latest message.
 */
export function ChatMessages({
	messages,
	isLoading = false,
	className,
}: ChatMessagesProps) {
	const scrollRef = useRef<HTMLDivElement>(null);

	// Auto-scroll to bottom when new messages arrive
	// biome-ignore lint/correctness/useExhaustiveDependencies: scroll should trigger on messages/loading change
	useEffect(() => {
		if (scrollRef.current) {
			scrollRef.current.scrollIntoView({ behavior: "smooth" });
		}
	}, [messages.length, isLoading]);

	return (
		<ScrollArea className={cn("flex-1", className)}>
			<div className="flex flex-col gap-4 p-4">
				{messages.length === 0 && !isLoading && (
					<div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground">
						<Users className="mb-3 size-12 opacity-50" />
						<p className="text-lg font-medium">Inicia la conversación</p>
						<p className="text-sm">
							Presiona el botón del micrófono para comenzar a hablar con el
							cliente.
						</p>
					</div>
				)}

				{messages.map((message) => (
					<div
						key={message.id}
						className={cn(
							"flex gap-3 max-w-[85%]",
							message.role === "seller"
								? "ml-auto flex-row-reverse"
								: "mr-auto",
						)}
					>
						<div
							className={cn(
								"flex size-8 shrink-0 items-center justify-center rounded-full",
								message.role === "seller"
									? "bg-primary text-primary-foreground"
									: "bg-muted",
							)}
						>
							<User className="size-4" />
						</div>
						<div
							className={cn(
								"rounded-2xl px-4 py-3",
								message.role === "seller"
									? "bg-primary text-primary-foreground"
									: "bg-muted",
							)}
						>
							<p className="text-sm leading-relaxed">{message.content}</p>
							{message.role === "client" && message.meta?.interruption && (
								<p className="mt-1 text-xs opacity-70 italic">
									*interrumpió al vendedor*
								</p>
							)}
						</div>
					</div>
				))}

				{isLoading && (
					<div className="flex gap-3 max-w-[85%] mr-auto">
						<div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-muted">
							<User className="size-4" />
						</div>
						<div className="flex items-center gap-2 rounded-2xl bg-muted px-4 py-3">
							<Loader2 className="size-4 animate-spin" />
							<span className="text-sm text-muted-foreground">
								El cliente está pensando...
							</span>
						</div>
					</div>
				)}

				{/* Invisible element to scroll to */}
				<div ref={scrollRef} />
			</div>
		</ScrollArea>
	);
}
