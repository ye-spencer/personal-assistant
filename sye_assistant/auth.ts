import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import { env } from "@/env";

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [Google],
  pages: { signIn: "/signin" },
  callbacks: {
    signIn({ profile }) {
      return profile?.email?.toLowerCase() === env.ALLOWED_EMAIL;
    },
  },
});
