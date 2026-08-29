import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

function createPrismaClient() {
  const url = process.env.DATABASE_URL;
  if (!url || url === "PASTE_YOUR_NEON_CONNECTION_STRING_HERE") {
    throw new Error(
      "DATABASE_URL is not set. Add it in Vercel → Settings → Environment Variables."
    );
  }
  return new PrismaClient();
}

export const db = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = db;
