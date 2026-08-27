import { S3Client, PutObjectCommand, DeleteObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

function getR2Client() {
  const region = process.env.B2_REGION ?? "us-east-005";
  return new S3Client({
    region,
    endpoint: `https://s3.${region}.backblazeb2.com`,
    forcePathStyle: true,
    credentials: {
      accessKeyId: process.env.B2_KEY_ID ?? "",
      secretAccessKey: process.env.B2_APP_KEY ?? "",
    },
  });
}

function getBucket() {
  return process.env.B2_BUCKET_NAME ?? "";
}

export function getPublicUrl(key: string): string {
  const domain = process.env.B2_PUBLIC_DOMAIN ?? "";
  return `${domain}/${key}`;
}

function generateKey(kind: "pdf" | "video" | "image", fileName: string, ext: string): string {
  const subfolder = kind === "image" ? "images" : kind;
  const safeName = fileName.replace(/[<>:"/\\|?*]/g, "_").slice(0, 64);
  const ts = Date.now();
  const rand = Math.random().toString(36).slice(2, 8);
  return `${subfolder}/${ts}-${rand}-${safeName}${ext}`;
}

export async function createPresignedUrl(
  kind: "pdf" | "video" | "image",
  fileName: string,
  contentType: string,
  ext: string
) {
  const key = generateKey(kind, fileName, ext);
  const client = getR2Client();
  const bucket = getBucket();

  const command = new PutObjectCommand({
    Bucket: bucket,
    Key: key,
    ContentType: contentType,
  });

  const uploadUrl = await getSignedUrl(client, command, { expiresIn: 600 });

  return {
    uploadUrl,
    key,
    publicUrl: getPublicUrl(key),
  };
}

export async function deleteFromR2(storageKey: string) {
  if (!storageKey) return;

  let key = storageKey;
  if (key.startsWith("http")) {
    try {
      const domain = process.env.B2_PUBLIC_DOMAIN ?? "";
      if (domain && key.startsWith(domain)) {
        key = key.slice(domain.length + 1);
      }
    } catch {
      return;
    }
  } else if (key.startsWith("/")) {
    key = key.slice(1);
  }

  if (!key) return;

  const client = getR2Client();
  const bucket = getBucket();

  try {
    await client.send(new DeleteObjectCommand({ Bucket: bucket, Key: key }));
  } catch {
    /* absent files need no action */
  }
}

export async function createPresignedGetUrl(storageKey: string): Promise<string> {
  let key = storageKey;
  if (key.startsWith("http")) {
    const domain = process.env.B2_PUBLIC_DOMAIN ?? "";
    if (domain && key.startsWith(domain)) {
      key = key.slice(domain.length + 1);
    }
  } else if (key.startsWith("/")) {
    key = key.slice(1);
  }

  if (!key) return storageKey;

  const client = getR2Client();
  const bucket = getBucket();

  const command = new GetObjectCommand({
    Bucket: bucket,
    Key: key,
  });

  return getSignedUrl(client, command, { expiresIn: 3600 });
}
