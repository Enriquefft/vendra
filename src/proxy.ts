import { type NextRequest, NextResponse } from "next/server";

import { auth } from "@/auth";

const PUBLIC_PATHS = ["/login", "/api/auth", "/icon.png", "/favicon.ico"];

export async function proxy(request: NextRequest) {
	const pathname = request.nextUrl.pathname;

	if (
		PUBLIC_PATHS.some(
			(path) => pathname === path || pathname.startsWith(`${path}/`),
		)
	) {
		return NextResponse.next();
	}

	if (
		pathname.startsWith("/_next") ||
		pathname.startsWith("/public") ||
		pathname.startsWith("/api/auth") ||
		pathname.startsWith("/static")
	) {
		return NextResponse.next();
	}

	const session = await auth.api.getSession({ headers: request.headers });

	if (!session) {
		const loginUrl = new URL("/login", request.url);
		loginUrl.searchParams.set("redirectTo", pathname);
		return NextResponse.redirect(loginUrl);
	}

	return NextResponse.next();
}

export const config = {
	matcher: ["/((?!_next/static|_next/image|favicon.ico|.*.).*)"],
};
