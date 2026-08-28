import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { db } from "@/lib/db";
import { authConfig } from "@/auth.config";

const credentialsSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

const secret = process.env.AUTH_SECRET;
if (!secret) {
  console.error(
    "[auth] AUTH_SECRET is not set. Add it in Vercel → Settings → Environment Variables."
  );
}

export const { handlers, signIn, signOut, auth } = NextAuth({
  ...authConfig,
  secret,
  providers: [
    Credentials({
      credentials: { email: {}, password: {} },
      async authorize(raw) {
        const parsed = credentialsSchema.safeParse(raw);
        if (!parsed.success) return null;
        try {
          const user = await db.user.findUnique({
            where: { email: parsed.data.email.toLowerCase() },
          });
          if (!user || !(await bcrypt.compare(parsed.data.password, user.passwordHash))) return null;
          return {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
            classId: user.classId,
          };
        } catch (err) {
          console.error("[auth] authorize() failed:", err);
          return null;
        }
      },
    }),
  ],
});

