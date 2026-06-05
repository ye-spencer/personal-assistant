import { auth } from "@/auth";

export default auth((req) => {
    if (!req.auth && req.nextUrl.pathname !== "/signin") {
        const url = new URL("/signin", req.nextUrl.origin);
        return Response.redirect(url);
    }
});

export const config = {
    // Run on every route except auth API, cron routes (own bearer-token auth),
    // signin page, and Next.js internals.
    matcher: [
        "/((?!api/auth|api/cron|signin|_next/static|_next/image|favicon.ico).*)",
    ],
};
