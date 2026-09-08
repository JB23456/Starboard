import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const user = await requireAuth();
    if (!user) {
      return NextResponse.json({ error: "You must be logged in" }, { status: 401 });
    }

    const body = await req.json();
    const schema = z.object({
      pin: z.string().regex(/^\d{6}$/, "PIN must be exactly 6 digits"),
      pinConfirm: z.string(),
    });

    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 });
    }

    const { pin, pinConfirm } = parsed.data;
    if (pin !== pinConfirm) {
      return NextResponse.json({ error: "PINs do not match" }, { status: 400 });
    }

    const pinHash = await bcrypt.hash(pin, 10);
    const updated = await prisma.user.update({
      where: { id: user.id },
      data: { pinHash, mustChangePin: false },
    });

    return NextResponse.json({
      ok: true,
      user: { id: updated.id, role: updated.role },
    });
  } catch (error) {
    console.error("Change PIN error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
