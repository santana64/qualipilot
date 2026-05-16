"use server";

import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";
import { z } from "zod";
import { createOpaqueToken, hashToken, isExpired } from "@/domain/auth/tokens";
import { clearSessionCookie, setSessionCookie } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { toPublicError } from "@/lib/errors";
import { assertRateLimit } from "@/lib/rate-limit";
import { safeRedirectPath } from "@/lib/utils";
import { sendPasswordResetEmail, sendVerificationEmail, sendWelcomeEmail } from "@/lib/email";
import { ensureUserIndicatorProgress } from "@/server/referential";

const emailSchema = z.string().email().transform((value) => value.toLowerCase().trim());
const passwordSchema = z.string().min(8, "Le mot de passe doit contenir au moins 8 caractères.");

const registerSchema = z.object({
  name: z.string().trim().min(2, "Nom requis."),
  email: emailSchema,
  password: passwordSchema,
  organizationName: z.string().trim().min(2, "Nom de l'organisme requis."),
});

const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1),
  next: z.string().optional(),
});

export async function registerAction(formData: FormData) {
  let target = "/register?error=Une%20erreur%20est%20survenue.";
  try {
    const parsed = registerSchema.parse(Object.fromEntries(formData));
    await assertRateLimit("register", parsed.email);
    const existing = await prisma.user.findUnique({ where: { email: parsed.email } });
    if (existing) {
      target = "/register?error=Un%20compte%20existe%20d%C3%A9j%C3%A0%20avec%20cet%20email.";
    } else {
      const passwordHash = await bcrypt.hash(parsed.password, 12);
      const user = await prisma.user.create({
        data: {
          email: parsed.email,
          name: parsed.name,
          passwordHash,
          emailVerifiedAt: new Date(),
          organizationProfile: {
            create: {
              organizationName: parsed.organizationName,
              address: "À compléter",
              postalCode: "00000",
              city: "À compléter",
              activityTypes: ["training actions"],
            },
          },
          subscription: {
            create: {
              plan: "FREE",
              status: "active",
            },
          },
        },
      });
      await ensureUserIndicatorProgress(user.id);
      await setSessionCookie(user.id);
      try { await sendWelcomeEmail(parsed.email, parsed.name); } catch { /* non bloquant */ }
      target = "/app";
    }
  } catch (error) {
    target = `/register?error=${encodeURIComponent(toPublicError(error))}`;
  }
  redirect(target);
}

export async function loginAction(formData: FormData) {
  let target = "/login?error=Identifiants%20invalides.";
  try {
    const parsed = loginSchema.parse(Object.fromEntries(formData));
    await assertRateLimit("login", parsed.email);
    const user = await prisma.user.findUnique({ where: { email: parsed.email } });
    const valid = user ? await bcrypt.compare(parsed.password, user.passwordHash) : false;
    if (!user || !valid) {
      target = "/login?error=Identifiants%20invalides.";
    } else {
      await ensureUserIndicatorProgress(user.id);
      await setSessionCookie(user.id);
      target = safeRedirectPath(parsed.next, "/app");
    }
  } catch (error) {
    target = `/login?error=${encodeURIComponent(toPublicError(error))}`;
  }
  redirect(target);
}

export async function logoutAction() {
  await clearSessionCookie();
  redirect("/login?message=Session%20ferm%C3%A9e.");
}

export async function forgotPasswordAction(formData: FormData) {
  let target = "/forgot-password?sent=1";
  try {
    const email = emailSchema.parse(formData.get("email"));
    await assertRateLimit("forgotPassword", email);
    const user = await prisma.user.findUnique({ where: { email } });
    if (user) {
      const token = createOpaqueToken();
      await prisma.passwordResetToken.create({
        data: {
          userId: user.id,
          tokenHash: hashToken(token),
          expiresAt: new Date(Date.now() + 1000 * 60 * 60),
        },
      });
      await sendPasswordResetEmail(email, token);
    }
  } catch (error) {
    target = `/forgot-password?error=${encodeURIComponent(toPublicError(error))}`;
  }
  redirect(target);
}

export async function resetPasswordAction(formData: FormData) {
  let target = "/reset-password?error=Lien%20invalide%20ou%20expir%C3%A9.";
  try {
    const token = z.string().min(10).parse(formData.get("token"));
    const password = passwordSchema.parse(formData.get("password"));
    await assertRateLimit("resetPassword", hashToken(token).slice(0, 16));
    const tokenHash = hashToken(token);
    const record = await prisma.passwordResetToken.findUnique({ where: { tokenHash } });
    if (!record || record.usedAt || isExpired(record.expiresAt)) {
      target = "/reset-password?error=Lien%20invalide%20ou%20expir%C3%A9.";
    } else {
      const passwordHash = await bcrypt.hash(password, 12);
      await prisma.$transaction([
        prisma.user.update({ where: { id: record.userId }, data: { passwordHash } }),
        prisma.passwordResetToken.update({ where: { id: record.id }, data: { usedAt: new Date() } }),
      ]);
      target = "/login?message=Mot%20de%20passe%20mis%20%C3%A0%20jour.";
    }
  } catch (error) {
    target = `/reset-password?error=${encodeURIComponent(toPublicError(error))}`;
  }
  redirect(target);
}

export async function verifyEmailTokenAction(token: string) {
  const tokenHash = hashToken(token);
  const record = await prisma.emailVerificationToken.findUnique({ where: { tokenHash } });
  if (!record || record.usedAt || isExpired(record.expiresAt)) {
    return { ok: false, message: "Lien de vérification invalide ou expiré." };
  }
  const [user] = await prisma.$transaction([
    prisma.user.update({ where: { id: record.userId }, data: { emailVerifiedAt: new Date() } }),
    prisma.emailVerificationToken.update({ where: { id: record.id }, data: { usedAt: new Date() } }),
  ]);
  // fire-and-forget — don't block on welcome email failure
  sendWelcomeEmail(user.email, user.name ?? user.email).catch(() => null);
  return { ok: true, message: "Email vérifié. Vous pouvez vous connecter." };
}

export async function resendVerificationAction(formData: FormData) {
  let target = "/verify-email?error=Service%20email%20non%20configur%C3%A9.";
  try {
    const email = emailSchema.parse(formData.get("email"));
    await assertRateLimit("resendVerification", email);
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      target = `/verify-email?email=${encodeURIComponent(email)}&error=Compte%20introuvable.`;
    } else if (user.emailVerifiedAt) {
      target = "/login?message=Email%20d%C3%A9j%C3%A0%20v%C3%A9rifi%C3%A9.";
    } else {
      const token = createOpaqueToken();
      await prisma.emailVerificationToken.create({
        data: {
          userId: user.id,
          tokenHash: hashToken(token),
          expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24),
        },
      });
      await sendVerificationEmail(email, token);
      target = `/verify-email?email=${encodeURIComponent(email)}&sent=1`;
    }
  } catch (error) {
    target = `/verify-email?error=${encodeURIComponent(toPublicError(error))}`;
  }
  redirect(target);
}
