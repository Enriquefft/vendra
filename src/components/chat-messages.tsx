"use client";

import { User, Users } from "lucide-react";
import { useCallback, useEffect, useRef } from "react";

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
 * Animated typing indicator dots for chat.
 */
function TypingIndicator() {
	return (
		<div className="flex items-center gap-1">
			<span className="size-2 rounded-full bg-muted-foreground/60 animate-bounce [animation-delay:-0.3s]" />
			<span className="size-2 rounded-full bg-muted-foreground/60 animate-bounce [animation-delay:-0.15s]" />
			<span className="size-2 rounded-full bg-muted-foreground/60 animate-bounce" />
		</div>
	);
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

	const scrollToBottom = useCallback(() => {
		scrollRef.current?.scrollIntoView({ behavior: "smooth" });
	}, []);

	// Scroll to bottom when messages change or loading state toggles
	// The dependencies trigger re-run even though they aren't read in the effect body
	const messagesCount = messages.length;
	// biome-ignore lint/correctness/useExhaustiveDependencies: intentionally scroll when messagesCount or isLoading changes
	useEffect(() => {
		scrollToBottom();
	}, [messagesCount, isLoading, scrollToBottom]);

	return (
		<ScrollArea className={cn("flex-1", className)}>
			<div className="flex flex-col gap-4 p-4">
				{messages.length === 0 && !isLoading && (
					<div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground animate-in fade-in-0 duration-500">
						<Users className="mb-3 size-12 opacity-50" />
						<p className="text-lg font-medium">Inicia la conversación</p>
						<p className="text-sm">
							Presiona el botón del micrófono para comenzar a hablar con el
							cliente.
						</p>
					</div>
				)}

				{messages.map((message, index) => (
					<div
						key={message.id}
						className={cn(
							"flex gap-3 max-w-[85%] animate-in slide-in-from-bottom-2 fade-in-0 duration-300",
							message.role === "seller"
								? "ml-auto flex-row-reverse"
								: "mr-auto",
						)}
						style={{ animationDelay: `${index * 50}ms` }}
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
								"rounded-2xl px-4 py-3 transition-all",
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
					<div className="flex gap-3 max-w-[85%] mr-auto animate-in slide-in-from-bottom-2 fade-in-0 duration-300">
						<div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-muted">
							<User className="size-4" />
						</div>
						<div className="flex items-center gap-3 rounded-2xl bg-muted px-4 py-3 min-h-[44px]">
							<TypingIndicator />
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
