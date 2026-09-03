import path from "path";
import fs from "fs/promises";
import crypto from "crypto";

const UPLOAD_DIR = path.join(process.cwd(), "data", "uploads");

const ALLOWED_MIME: Record<string, string> = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
};

const MAX_SIZE = 5 * 1024 * 1024; // 5 MB

export async function saveUpload(buffer: Buffer, mimeType: string): Promise<string | null> {
  const ext = ALLOWED_MIME[mimeType];
  if (!ext) return null;

  await fs.mkdir(UPLOAD_DIR, { recursive: true });

  const fileId = crypto.randomBytes(16).toString("hex");
  const filename = `${fileId}${ext}`;
  const filePath = path.join(UPLOAD_DIR, filename);

  await fs.writeFile(filePath, buffer);
  return filename;
}

export function getUploadPath(filename: string): string {
  return path.join(UPLOAD_DIR, filename);
}

export function isAllowedMime(mimeType: string): boolean {
  return mimeType in ALLOWED_MIME;
}

export function maxUploadSize(): number {
  return MAX_SIZE;
}
