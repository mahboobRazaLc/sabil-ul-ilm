import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getOptionalUser } from "@/lib/auth/authorization";

export async function POST() {
  const user = await getOptionalUser();
  if (!user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await db.notification.updateMany({
    where: { userId: user.id, read: false },
    data: { read: true },
  });

  return NextResponse.json({ ok: true });
}
