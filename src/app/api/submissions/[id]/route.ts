import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const admin = await requireAdmin();
    if (!admin) {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }

    const { id } = await params;
    const submission = await prisma.submission.findUnique({
      where: { id },
      include: {
        user: { select: { id: true, firstName: true, discord: true, studentNumber: true } },
        quest: { select: { id: true, title: true, description: true, rewardStars: true, submissionType: true } },
        reviewer: { select: { id: true, firstName: true, discord: true } },
      },
    });
    if (!submission) {
      return NextResponse.json({ error: "Submission not found" }, { status: 404 });
    }
    return NextResponse.json(submission);
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const admin = await requireAdmin();
    if (!admin) {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }

    const { id } = await params;
    const body = await req.json();

    const schema = z.object({
      status: z.enum(["approved", "rejected"]),
      adminNote: z.string().max(1000).optional().nullable(),
    });

    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 });
    }

    if (parsed.data.status === "rejected" && !parsed.data.adminNote) {
      return NextResponse.json({ error: "A note is required when rejecting" }, { status: 400 });
    }

    const quest = await prisma.quest.findUnique({
      where: { id: (await prisma.submission.findUnique({ where: { id } }))?.questId ?? "" },
    });

    const result = await prisma.$transaction(async (tx) => {
      const submission = await tx.submission.updateMany({
        where: { id, status: "pending" },
        data: {
          status: parsed.data.status,
          adminNote: parsed.data.adminNote,
          reviewedAt: new Date(),
          reviewedBy: admin.id,
        },
      });

      if (submission.count === 0) {
        return null;
      }

      if (parsed.data.status === "approved" && quest) {
        await tx.user.update({
          where: { id: (await tx.submission.findUnique({ where: { id } }))!.userId },
          data: { stars: { increment: quest.rewardStars } },
        });
      }

      return tx.submission.findUnique({
        where: { id },
        include: {
          user: { select: { id: true, firstName: true, discord: true, stars: true } },
          quest: { select: { id: true, title: true } },
        },
      });
    });

    if (!result) {
      return NextResponse.json({ error: "Submission already reviewed" }, { status: 409 });
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error("Review submission error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
