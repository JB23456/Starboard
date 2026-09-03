import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import { createSession, sessionCookieOptions } from "@/lib/auth";

const signupSchema = z.object({
  firstName: z.string().min(1).max(100),
  lastName: z.string().min(1).max(100),
  studentNumber: z.string().regex(/^[A-Z]\d{8}$/, "Student number must be a capital letter followed by 8 digits"),
  pin: z.string().regex(/^\d{6}$/, "PIN must be exactly 6 digits"),
  pinConfirm: z.string(),
});

const loginAttempts = new Map<string, { count: number; lastAttempt: number }>();
const MAX_ATTEMPTS = 5;
const ATTEMPT_WINDOW_MS = 15 * 60 * 1000;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { pin, pinConfirm, ...rest } = body;

    const parsed = signupSchema.safeParse({ ...rest, pin, pinConfirm });
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 });
    }

    const { firstName, lastName, studentNumber, pin: pinVal } = parsed.data;

    if (pin !== pinConfirm) {
      return NextResponse.json({ error: "PINs do not match" }, { status: 400 });
    }

    const existing = await prisma.user.findUnique({
      where: { studentNumber },
    });
    if (existing) {
      return NextResponse.json(
        { error: "A user with this student number already exists" },
        { status: 409 }
      );
    }

    const pinHash = await bcrypt.hash(pinVal, 10);

    const isFirstUser = (await prisma.user.count()) === 0;

    const user = await prisma.user.create({
      data: {
        firstName,
        lastName,
        studentNumber,
        pinHash,
        role: isFirstUser ? "admin" : "user",
      },
    });

    const token = await createSession(user.id);

    const res = NextResponse.json({
      ok: true,
      user: { id: user.id, firstName: user.firstName, role: user.role },
    });
    res.cookies.set("session", token, sessionCookieOptions(req));
    return res;
  } catch (error) {
    console.error("Signup error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
