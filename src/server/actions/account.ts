"use server";

import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { clearSessionCookie, requireUser } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { toPublicError } from "@/lib/errors";

const accountSchema = z.object({
  name: z.string().trim().optional(),
  email: z.string().email().transform((value) => value.toLowerCase().trim()),
});

export async function updateAccountAction(formData: FormData) {
  const user = await requireUser();
  let target = "/app/account?success=Compte%20mis%20%C3%A0%20jour.";
  try {
    const parsed = accountSchema.parse(Object.fromEntries(formData));
    const emailChanged = parsed.email !== user.email;
    await prisma.user.update({
      where: { id: user.id },
      data: {
        name: parsed.name || null,
        email: parsed.email,
        emailVerifiedAt: emailChanged ? null : user.emailVerifiedAt,
      },
    });
    revalidatePath("/app/account");
  } catch (error) {
    target = `/app/account?error=${encodeURIComponent(toPublicError(error))}`;
  }
  redirect(target);
}

export async function changePasswordAction(formData: FormData) {
  const user = await requireUser();
  let target = "/app/account?success=Mot%20de%20passe%20mis%20%C3%A0%20jour.";
  try {
    const currentPassword = z.string().min(1).parse(formData.get("currentPassword"));
    const newPassword = z.string().min(8).parse(formData.get("newPassword"));
    const dbUser = await prisma.user.findUnique({ where: { id: user.id } });
    if (!dbUser || !(await bcrypt.compare(currentPassword, dbUser.passwordHash))) {
      throw new Error("Mot de passe actuel incorrect.");
    }
    await prisma.user.update({
      where: { id: user.id },
      data: { passwordHash: await bcrypt.hash(newPassword, 12) },
    });
  } catch (error) {
    target = `/app/account?error=${encodeURIComponent(toPublicError(error))}`;
  }
  redirect(target);
}

export async function deleteAccountAction(formData: FormData) {
  const user = await requireUser();
  let target = "/app/account?error=Confirmation%20requise.";
  try {
    const confirmation = String(formData.get("confirmation") ?? "");
    if (confirmation !== "SUPPRIMER") {
      throw new Error("Saisissez SUPPRIMER pour confirmer.");
    }
    await prisma.user.delete({ where: { id: user.id } });
    await clearSessionCookie();
    target = "/?message=Compte%20supprim%C3%A9.";
  } catch (error) {
    target = `/app/account?error=${encodeURIComponent(toPublicError(error))}`;
  }
  redirect(target);
}
