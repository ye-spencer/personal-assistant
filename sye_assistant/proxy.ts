import { auth } from "@/auth";

export default auth((req) => {
    if (!req.auth && req.nextUrl.pathname !== "/signin") {
        const url = new URL("/signin", req.nextUrl.origin);
        return Response.redirect(url);
    }
});

export const config = {
    // Run on every route except auth API, signin page, and Next.js internals.
    matcher: ["/((?!api/auth|signin|_next/static|_next/image|favicon.ico).*)"],
};
