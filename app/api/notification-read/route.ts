import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getOptionalUser } from "@/lib/auth/authorization";

export async function POST(request: Request) {
  const user = await getOptionalUser();
  if (!user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const formData = await request.formData();
  const notificationId = String(formData.get("notificationId") || "");

  if (!notificationId) {
    return NextResponse.json({ error: "Missing notificationId" }, { status: 400 });
  }

  await db.notification.updateMany({
    where: { id: notificationId, userId: user.id },
    data: { read: true },
  });

  return NextResponse.json({ ok: true });
}
