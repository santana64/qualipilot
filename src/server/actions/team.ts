"use server";

import { addDays } from "date-fns";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { createOpaqueToken, hashToken, isExpired } from "@/domain/auth/tokens";
import { requireUser } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { sendTeamInviteEmail } from "@/lib/email";
import { DomainError, toPublicError } from "@/lib/errors";
import { requireWorkspacePermission } from "@/server/rbac";

const inviteSchema = z.object({
  email: z.string().trim().email(),
  name: z.string().trim().optional(),
  role: z.enum(["ADMIN", "QUALITY_MANAGER", "TRAINER", "VIEWER"]),
});

export async function inviteTeamMemberAction(formData: FormData) {
  const workspace = await requireWorkspacePermission("manageTeam");
  let target = "/app/team";
  try {
    const parsed = inviteSchema.parse(Object.fromEntries(formData));
    if (parsed.email.toLowerCase() === workspace.actorEmail.toLowerCase()) {
      throw new DomainError("Vous etes deja proprietaire de cet espace.");
    }

    const token = createOpaqueToken();
    const invite = await prisma.teamMember.upsert({
      where: {
        ownerUserId_email: {
          ownerUserId: workspace.workspaceUserId,
          email: parsed.email.toLowerCase(),
        },
      },
      update: {
        name: parsed.name || null,
        role: parsed.role,
        status: "INVITED",
        inviteTokenHash: hashToken(token),
        inviteExpiresAt: addDays(new Date(), 14),
      },
      create: {
        ownerUserId: workspace.workspaceUserId,
        email: parsed.email.toLowerCase(),
        name: parsed.name || null,
        role: parsed.role,
        status: "INVITED",
        inviteTokenHash: hashToken(token),
        inviteExpiresAt: addDays(new Date(), 14),
      },
    });

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const url = `${appUrl}/team/accept?token=${encodeURIComponent(token)}`;
    const org = await prisma.organizationProfile.findUnique({
      where: { userId: workspace.workspaceUserId },
      select: { organizationName: true },
    });
    await sendTeamInviteEmail({
      to: invite.email,
      inviterName: workspace.actorName ?? workspace.actorEmail,
      organizationName: org?.organizationName ?? workspace.actorName ?? workspace.actorEmail,
      role: parsed.role,
      inviteUrl: url,
    });

    revalidatePath("/app/team");
    target = "/app/team?success=Invitation%20envoyee.";
  } catch (error) {
    target = `/app/team?error=${encodeURIComponent(toPublicError(error))}`;
  }
  redirect(target);
}

export async function disableTeamMemberAction(formData: FormData) {
  const workspace = await requireWorkspacePermission("manageTeam");
  const id = String(formData.get("id") ?? "");
  let target = "/app/team?success=Membre%20desactive.";
  try {
    await prisma.teamMember.update({
      where: { id, ownerUserId: workspace.workspaceUserId },
      data: { status: "DISABLED", inviteTokenHash: null, inviteExpiresAt: null },
    });
    revalidatePath("/app/team");
  } catch (error) {
    target = `/app/team?error=${encodeURIComponent(toPublicError(error))}`;
  }
  redirect(target);
}

export async function acceptTeamInviteAction(formData: FormData) {
  const user = await requireUser();
  const token = String(formData.get("token") ?? "");
  let target = "/app";
  try {
    const invite = await prisma.teamMember.findUnique({
      where: { inviteTokenHash: hashToken(token) },
    });
    if (!invite || invite.status !== "INVITED" || !invite.inviteExpiresAt || isExpired(invite.inviteExpiresAt)) {
      throw new DomainError("Invitation introuvable ou expiree.");
    }
    if (invite.email.toLowerCase() !== user.email.toLowerCase()) {
      throw new DomainError("Connectez-vous avec l'email invite.");
    }
    await prisma.teamMember.update({
      where: { id: invite.id },
      data: {
        memberUserId: user.id,
        status: "ACTIVE",
        acceptedAt: new Date(),
        inviteTokenHash: null,
        inviteExpiresAt: null,
      },
    });
    target = "/app?success=Invitation%20acceptee.";
  } catch (error) {
    target = `/team/accept?error=${encodeURIComponent(toPublicError(error))}`;
  }
  redirect(target);
}
