import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { signPayload, verifySignedPayload } from "@/domain/auth/tokens";

export const SESSION_COOKIE_NAME = "qualipilot_session";
const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 30;

type SessionPayload = {
  userId: string;
  expiresAt: number;
};

export function createSessionToken(userId: string): string {
  return signPayload({
    userId,
    expiresAt: Date.now() + SESSION_MAX_AGE_SECONDS * 1000,
  });
}

export async function setSessionCookie(userId: string) {
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, createSessionToken(userId), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_MAX_AGE_SECONDS,
  });
}

export async function clearSessionCookie() {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE_NAME);
}

export async function getSessionUserId(): Promise<string | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  if (!token) return null;
  const payload = verifySignedPayload<SessionPayload>(token);
  if (!payload || typeof payload.userId !== "string" || typeof payload.expiresAt !== "number") return null;
  if (payload.expiresAt <= Date.now()) return null;
  return payload.userId;
}

export async function getCurrentUser() {
  const userId = await getSessionUserId();
  if (!userId) return null;
  return prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      name: true,
      emailVerifiedAt: true,
      createdAt: true,
      updatedAt: true,
      subscription: true,
    },
  });
}

export async function requireUser() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?error=Vous%20devez%20%C3%AAtre%20connect%C3%A9.");
  return user;
}

export async function requireVerifiedEmailForSensitiveActions() {
  const user = await requireUser();
  if (!user.emailVerifiedAt) {
    redirect("/verify-email?error=Veuillez%20v%C3%A9rifier%20votre%20email%20avant%20cette%20action.");
  }
  return user;
}
