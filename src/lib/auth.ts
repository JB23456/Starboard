import { cookies } from "next/headers";
import type { NextRequest } from "next/server";
import { prisma } from "./db";
import crypto from "crypto";
import type { User } from "@prisma/client";

const SESSION_DURATION_MS = 7 * 24 * 60 * 60 * 1000;

export async function createSession(userId: string): Promise<string> {
  const token = crypto.randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + SESSION_DURATION_MS);

  await prisma.session.create({
    data: { token, userId, expiresAt },
  });
  return token;
}

export async function destroySession(token: string): Promise<void> {
  await prisma.session.deleteMany({ where: { token } });
}

export async function getSessionUser(): Promise<User | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get("session")?.value;
  if (!token) return null;

  const session = await prisma.session.findUnique({
    where: { token },
    include: { user: true },
  });

  if (!session || session.expiresAt < new Date()) {
    if (session) await prisma.session.delete({ where: { id: session.id } });
    return null;
  }

  return session.user;
}

export async function requireAuth(): Promise<User | null> {
  return getSessionUser();
}

export async function requireAdmin(): Promise<User | null> {
  const user = await getSessionUser();
  if (!user || user.role !== "admin") return null;
  return user;
}

export function sessionCookieOptions(req?: NextRequest) {
  const isSecure =
    req?.nextUrl.protocol === "https:" ||
    req?.headers.get("x-forwarded-proto") === "https";
  return {
    httpOnly: true,
    secure: isSecure ?? false,
    sameSite: "strict" as const,
    path: "/",
    maxAge: SESSION_DURATION_MS / 1000,
  };
}
