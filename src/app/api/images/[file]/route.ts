import { NextRequest, NextResponse } from "next/server";
import path from "path";
import fs from "fs/promises";
import { prisma } from "@/lib/db";
import { getUploadPath } from "@/lib/upload";
import { requireAuth } from "@/lib/auth";

const MIME_MAP: Record<string, string> = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
};

export async function GET(_req: NextRequest, { params }: { params: Promise<{ file: string }> }) {
  try {
    const user = await requireAuth();
    if (!user) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const { file } = await params;

    const sanitized = path.basename(file);
    if (sanitized !== file || file.includes("..") || file.includes("/")) {
      return NextResponse.json({ error: "Invalid file path" }, { status: 400 });
    }

    const submission = await prisma.submission.findFirst({
      where: { imagePath: sanitized },
      include: { quest: true },
    });

    if (!submission) {
      return NextResponse.json({ error: "Image not found" }, { status: 404 });
    }

    if (user.role !== "admin" && submission.userId !== user.id) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    const filePath = getUploadPath(sanitized);
    let data: Buffer;
    try {
      data = await fs.readFile(filePath);
    } catch {
      return NextResponse.json({ error: "File not found on disk" }, { status: 404 });
    }

    const ext = path.extname(sanitized).toLowerCase();
    const contentType = MIME_MAP[ext] || "application/octet-stream";

    return new NextResponse(new Uint8Array(data), {
      headers: {
        "Content-Type": contentType,
        "Content-Length": data.length.toString(),
        "Cache-Control": "private, max-age=3600",
      },
    });
  } catch (error) {
    console.error("Serve image error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
