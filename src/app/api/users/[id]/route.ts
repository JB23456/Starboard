import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import crypto from "crypto";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const admin = await requireAdmin();
    if (!admin) {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }

    const { id } = await params;
    const body = await req.json();

    const schema = z.object({
      action: z.enum(["resetPin", "adjustStars", "toggleActive", "setRole"]),
      value: z.union([z.string(), z.number(), z.boolean()]).optional(),
      note: z.string().optional(),
    });

    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    let result;
    let newPin: string | null = null;

    switch (parsed.data.action) {
      case "resetPin": {
        newPin = String(crypto.randomInt(100000, 1000000));
        const pinHash = await bcrypt.hash(newPin, 10);
        result = await prisma.user.update({
          where: { id },
          data: { pinHash },
        });
        break;
      }
      case "adjustStars": {
        const amount = Number(parsed.data.value);
        if (isNaN(amount)) {
          return NextResponse.json({ error: "Invalid star adjustment" }, { status: 400 });
        }
        result = await prisma.user.update({
          where: { id },
          data: { stars: { increment: amount } },
        });
        break;
      }
      case "toggleActive": {
        result = await prisma.user.update({
          where: { id },
          data: { active: !user.active },
        });
        break;
      }
      case "setRole": {
        const role = String(parsed.data.value);
        if (!["user", "admin"].includes(role)) {
          return NextResponse.json({ error: "Invalid role" }, { status: 400 });
        }
        result = await prisma.user.update({
          where: { id },
          data: { role },
        });
        break;
      }
      default:
        return NextResponse.json({ error: "Unknown action" }, { status: 400 });
    }

    return NextResponse.json({ user: result, newPin });
  } catch (error) {
    console.error("Update user error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
