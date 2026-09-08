import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireAuth, requireAdmin } from "@/lib/auth";
import { saveUpload, isAllowedMime, maxUploadSize } from "@/lib/upload";

export async function POST(req: NextRequest) {
  try {
    const user = await requireAuth();
    if (!user) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }
    if (!user.active) {
      return NextResponse.json({ error: "Your account is disabled" }, { status: 403 });
    }

    let questId: string;
    let textPayload: string | null = null;
    let imagePath: string | null = null;

    const contentType = req.headers.get("content-type") || "";

    if (contentType.includes("multipart/form-data")) {
      const formData = await req.formData();
      questId = formData.get("questId")?.toString() || "";
      textPayload = formData.get("textPayload")?.toString() || null;

      const file = formData.get("file") as File | null;
      if (file) {
        if (!isAllowedMime(file.type)) {
          return NextResponse.json(
            { error: "Invalid file type. Allowed: JPEG, PNG, WebP" },
            { status: 400 }
          );
        }
        if (file.size > maxUploadSize()) {
          return NextResponse.json(
            { error: "File too large. Maximum size is 5 MB" },
            { status: 400 }
          );
        }
        const buffer = Buffer.from(await file.arrayBuffer());
        imagePath = await saveUpload(buffer, file.type);
        if (!imagePath) {
          return NextResponse.json({ error: "Failed to save image" }, { status: 500 });
        }
      }
    } else {
      const body = await req.json();
      const schema = z.object({
        questId: z.string().min(1),
        textPayload: z.string().min(1).max(10000).optional(),
      });
      const parsed = schema.safeParse(body);
      if (!parsed.success) {
        return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 });
      }
      questId = parsed.data.questId;
      textPayload = parsed.data.textPayload ?? null;
    }

    if (!questId) {
      return NextResponse.json({ error: "Quest ID is required" }, { status: 400 });
    }

    const quest = await prisma.quest.findUnique({
      where: { id: questId },
    });
    if (!quest || !quest.active || quest.removedAt) {
      return NextResponse.json({ error: "Quest not found or inactive" }, { status: 404 });
    }

    if (quest.submissionType === "text" && !textPayload) {
      return NextResponse.json({ error: "Text payload required for this quest" }, { status: 400 });
    }
    if (quest.submissionType === "image" && !imagePath) {
      return NextResponse.json({ error: "Image upload required for this quest" }, { status: 400 });
    }

    const existing = await prisma.submission.findFirst({
      where: {
        questId,
        userId: user.id,
        status: { in: ["pending", "approved"] },
      },
    });
    if (existing) {
      return NextResponse.json(
        { error: "You have already submitted this quest. Resubmission is only allowed after rejection." },
        { status: 409 }
      );
    }

    const submission = await prisma.submission.create({
      data: {
        questId,
        userId: user.id,
        textPayload,
        imagePath,
      },
    });

    return NextResponse.json(submission, { status: 201 });
  } catch (error) {
    console.error("Create submission error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const admin = await requireAdmin();
    if (!admin) {
      const user = await requireAuth();
      if (!user) {
        return NextResponse.json({ error: "Authentication required" }, { status: 401 });
      }
      const submissions = await prisma.submission.findMany({
        where: { userId: user.id },
        include: {
          quest: { select: { id: true, title: true, rewardStars: true, submissionType: true } },
        },
        orderBy: { submittedAt: "desc" },
      });
      return NextResponse.json(submissions);
    }

    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");
    const questId = searchParams.get("questId");

    const where: Record<string, unknown> = {};
    if (status) where.status = status;
    if (questId) where.questId = questId;

    const submissions = await prisma.submission.findMany({
      where,
      include: {
        user: { select: { id: true, firstName: true, discord: true, studentNumber: true } },
        quest: { select: { id: true, title: true, rewardStars: true, submissionType: true } },
      },
      orderBy: { submittedAt: "desc" },
    });

    return NextResponse.json(submissions);
  } catch (error) {
    console.error("List submissions error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
