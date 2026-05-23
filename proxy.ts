import NextAuth from "next-auth";
import { authConfig } from "./auth.config";

const { auth } = NextAuth(authConfig);

// Next.js 16 requires a named "proxy" export or a default export that is a function
export const proxy = auth;
export default auth;

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|icons|manifest.json).*)",
  ],
};
