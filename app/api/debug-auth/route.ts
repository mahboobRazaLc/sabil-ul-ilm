import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const hasSecret = !!process.env.AUTH_SECRET;
  const hasDbUrl = !!process.env.DATABASE_URL;
  const hasAuthUrl = !!process.env.AUTH_URL;
  const secretLen = process.env.AUTH_SECRET?.length ?? 0;
  const dbHost = process.env.DATABASE_URL?.split("@")[1]?.split("/")[0] ?? "missing";

  return NextResponse.json({
    hasSecret,
    hasDbUrl,
    hasAuthUrl,
    secretLen,
    dbHost,
    nodeEnv: process.env.NODE_ENV,
    vercel: !!process.env.VERCEL,
  });
}
