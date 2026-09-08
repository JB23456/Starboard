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
    const quest = await prisma.quest.findUnique({
      where: { id, removedAt: null },
       include: { submissions: { include: { user: { select: { id: true, firstName: true, discord: true, studentNumber: true } } }, orderBy: { submittedAt: "desc" } } },
    });
    if (!quest) {
      return NextResponse.json({ error: "Quest not found" }, { status: 404 });
    }
    return NextResponse.json(quest);
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
      title: z.string().min(1).max(200).optional(),
      description: z.string().min(1).max(5000).optional(),
      rewardStars: z.number().int().min(1).max(10000).optional(),
      submissionType: z.enum(["text", "image"]).optional(),
      active: z.boolean().optional(),
    });

    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 });
    }

    const quest = await prisma.quest.update({
      where: { id },
      data: parsed.data,
    });

    return NextResponse.json(quest);
  } catch (error) {
    console.error("Update quest error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const admin = await requireAdmin();
    if (!admin) {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }

    const { id } = await params;
    const quest = await prisma.quest.update({
      where: { id },
      data: { removedAt: new Date(), active: false },
    });

    return NextResponse.json({ ok: true, quest });
  } catch (error) {
    console.error("Delete quest error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
