import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import { createSessionToken, SESSION_COOKIE_NAME } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { ensureUserIndicatorProgress } from "@/server/referential";

// Only available outside production
export async function POST() {
  if (process.env.NODE_ENV === "production") {
    return new NextResponse(null, { status: 404 });
  }

  const email = "test@qualipilot.test";
  const password = "TestPassword123!";

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
        create: { plan: "PRO", status: "active" },
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
