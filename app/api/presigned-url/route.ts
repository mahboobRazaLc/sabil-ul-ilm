import { NextResponse } from "next/server";
import { getOptionalUser } from "@/lib/auth/authorization";
import { createPresignedUrl } from "@/lib/r2";

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
  const { kind, fileName, contentType } = body as {
    kind: "pdf" | "video" | "image";
    fileName: string;
    contentType: string;
  };

  if (!kind || !fileName || !contentType) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  if (!["pdf", "video", "image"].includes(kind)) {
    return NextResponse.json({ error: "Invalid file kind" }, { status: 400 });
  }

  const ext =
    (fileName.includes(".") ? "." + fileName.split(".").pop() : "") ||
    (kind === "pdf" ? ".pdf" : kind === "video" ? ".mp4" : ".png");

  try {
    const result = await createPresignedUrl(kind, fileName, contentType, ext);
    return NextResponse.json(result);
  } catch {
    return NextResponse.json({ error: "Failed to generate upload URL" }, { status: 500 });
  }
}
