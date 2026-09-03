import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";

const createQuestSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().min(1).max(5000),
  rewardStars: z.number().int().min(1).max(10000),
  submissionType: z.enum(["text", "image"]),
});

export async function GET(req: NextRequest) {
  try {
    const isAdmin = !!(await requireAdmin());
    const showAll = req.nextUrl.searchParams.get("all") === "1" && isAdmin;

    const quests = await prisma.quest.findMany({
      where: showAll ? {} : { active: true, removedAt: null },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(quests);
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const admin = await requireAdmin();
    if (!admin) {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }

    const body = await req.json();
    const parsed = createQuestSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 });
    }

    const quest = await prisma.quest.create({
      data: {
        title: parsed.data.title,
        description: parsed.data.description,
        rewardStars: parsed.data.rewardStars,
        submissionType: parsed.data.submissionType,
        createdBy: admin.id,
      },
    });

    return NextResponse.json(quest, { status: 201 });
  } catch (error) {
    console.error("Create quest error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
