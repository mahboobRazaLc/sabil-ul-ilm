import { createPresignedUrl, deleteFromR2, createPresignedGetUrl } from "./r2";

const limits = {
  pdf: 25 * 1024 * 1024,
  video: 150 * 1024 * 1024,
  image: 10 * 1024 * 1024,
};

const allowed: Record<string, string[]> = {
  pdf: ["application/pdf"],
  video: ["video/mp4", "video/webm", "video/ogg", "video/quicktime"],
  image: ["image/jpeg", "image/png", "image/webp", "image/gif", "image/svg+xml"],
};

export async function saveUpload(file: File, kind: "pdf" | "video" | "image") {
  if (!file.size) return null;

  if (!allowed[kind].includes(file.type) || file.size > limits[kind]) {
    throw new Error(
      `Upload a valid ${
        kind === "pdf"
          ? "PDF (< 25 MB)"
          : kind === "video"
          ? "MP4/WebM/OGG/MOV video (< 150 MB)"
          : "JPEG/PNG/WebP image (< 10 MB)"
      }.`
    );
  }

  const extension =
    (file.name.includes(".") ? "." + file.name.split(".").pop() : "") ||
    (kind === "pdf" ? ".pdf" : kind === "video" ? ".mp4" : ".png");

  const { uploadUrl, key, publicUrl } = await createPresignedUrl(
    kind,
    file.name,
    file.type,
    extension
  );

  const response = await fetch(uploadUrl, {
    method: "PUT",
    body: file,
    headers: { "Content-Type": file.type },
  });

  if (!response.ok) {
    throw new Error("Upload failed. Please try again.");
  }

  return {
    fileName: file.name.replace(/[<>:"/\\|?*]/g, "_"),
    storageKey: publicUrl,
    mimeType: file.type,
    sizeBytes: file.size,
  };
}

export async function removeUpload(storageKey?: string | null) {
  if (!storageKey) return;
  await deleteFromR2(storageKey);
}

export { getPublicUrl } from "./r2";

export async function getFileUrl(storageKey?: string | null): Promise<string> {
  if (!storageKey) return "";
  return createPresignedGetUrl(storageKey);
}
