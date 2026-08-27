import { NextResponse } from "next/server";
import { getOptionalUser } from "@/lib/auth/authorization";
import { deleteFromR2 } from "@/lib/r2";

export async function POST(request: Request) {
  const user = await getOptionalUser();
  if (!user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const role = (user as { role?: string }).role;
  if (role !== "ADMIN" && role !== "EDITOR") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json();
  const { storageKey } = body as { storageKey?: string };

  if (!storageKey) {
    return NextResponse.json({ error: "Missing storageKey" }, { status: 400 });
  }

  try {
    await deleteFromR2(storageKey);
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Failed to delete file" }, { status: 500 });
  }
}
