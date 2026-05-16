import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import { createSessionToken, SESSION_COOKIE_NAME } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { ensureUserIndicatorProgress } from "@/server/referential";

// Only available outside production
export async function POST(request: Request) {
  if (process.env.NODE_ENV === "production") {
    return new NextResponse(null, { status: 404 });
  }

  const body = await request.json().catch(() => ({})) as { email?: string; plan?: string };
  const email = typeof body.email === "string" && body.email.includes("@")
    ? body.email.toLowerCase()
    : `test-${crypto.randomUUID()}@qualipilot.test`;
  const password = "TestPassword123!";
  const plan = ["FREE", "STARTER", "PRO", "CABINET"].includes(body.plan ?? "")
    ? body.plan as "FREE" | "STARTER" | "PRO" | "CABINET"
    : "PRO";

  await prisma.user.deleteMany({ where: { email } });

  const passwordHash = await bcrypt.hash(password, 4);
  const user = await prisma.user.create({
    data: {
      email,
      name: "Test User",
      passwordHash,
      emailVerifiedAt: new Date(),
      organizationProfile: {
        create: {
          organizationName: "Organisme Test Qualiopi",
          address: "12 rue de la Formation",
          postalCode: "75001",
          city: "Paris",
          activityTypes: ["actions de formation"],
          qualiopiStatus: "NOT_CERTIFIED",
        },
      },
      subscription: {
        create: { plan, status: "active" },
      },
    },
  });

  await ensureUserIndicatorProgress(user.id);

  const token = createSessionToken(user.id);

  return NextResponse.json({ userId: user.id, email, password }, {
    headers: {
      "Set-Cookie": `${SESSION_COOKIE_NAME}=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=86400`,
    },
  });
}
