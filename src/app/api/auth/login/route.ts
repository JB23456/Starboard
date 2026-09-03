import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import { createSession, sessionCookieOptions } from "@/lib/auth";

const loginAttempts = new Map<string, { count: number; windowStart: number }>();
const MAX_ATTEMPTS = 5;
const ATTEMPT_WINDOW_MS = 15 * 60 * 1000;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { studentNumber, pin } = body;

    if (!studentNumber || !pin) {
      return NextResponse.json({ error: "Student number and PIN are required" }, { status: 400 });
    }

    const now = Date.now();
    const attempt = loginAttempts.get(studentNumber);
    if (attempt && now - attempt.windowStart < ATTEMPT_WINDOW_MS) {
      attempt.count++;
      if (attempt.count > MAX_ATTEMPTS) {
        return NextResponse.json(
          { error: "Too many failed attempts. Try again in 15 minutes." },
          { status: 429 }
        );
      }
    } else {
      loginAttempts.set(studentNumber, { count: 1, windowStart: now });
    }

    const user = await prisma.user.findUnique({
      where: { studentNumber },
    });

    if (!user) {
      return NextResponse.json({ error: "Invalid student number or PIN" }, { status: 401 });
    }

    const valid = await bcrypt.compare(pin, user.pinHash);
    if (!valid) {
      return NextResponse.json({ error: "Invalid student number or PIN" }, { status: 401 });
    }

    loginAttempts.delete(studentNumber);

    if (!user.active) {
      return NextResponse.json({ error: "Your account has been disabled" }, { status: 403 });
    }

    const token = await createSession(user.id);

    const res = NextResponse.json({
      ok: true,
      user: { id: user.id, firstName: user.firstName, role: user.role },
    });
    res.cookies.set("session", token, sessionCookieOptions(req));
    return res;
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
