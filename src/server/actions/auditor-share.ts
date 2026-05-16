"use server";

import { addDays } from "date-fns";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createOpaqueToken, hashToken } from "@/domain/auth/tokens";
import { prisma } from "@/lib/db";
import { toPublicError } from "@/lib/errors";
import { assertValidClientForUser } from "@/server/cabinet";
import { requireWorkspacePermission } from "@/server/rbac";

export async function createAuditorShareLinkAction(formData?: FormData) {
  const workspace = await requireWorkspacePermission("createAuditorShare");
  let target = "/app/audit";
  try {
    const clientId = String(formData?.get("clientId") ?? "") || null;
    const client = await assertValidClientForUser(workspace.workspaceUserId, clientId);
    const token = createOpaqueToken();
    const share = await prisma.auditorShareLink.create({
      data: {
        userId: workspace.workspaceUserId,
        clientId: client?.id ?? null,
        tokenHash: hashToken(token),
        title: client ? `Dossier preparatoire audit - ${client.organizationName}` : "Dossier preparatoire audit",
        expiresAt: addDays(new Date(), 14),
      },
    });
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const url = `${appUrl}/audit-share/${encodeURIComponent(token)}`;
    revalidatePath("/app/audit");
    target = `/app/audit?success=${encodeURIComponent("Lien auditeur cree.")}&shareUrl=${encodeURIComponent(url)}&shareId=${share.id}`;
  } catch (error) {
    target = `/app/audit?error=${encodeURIComponent(toPublicError(error))}`;
  }
  redirect(target);
}

export async function revokeAuditorShareLinkAction(formData: FormData) {
  const workspace = await requireWorkspacePermission("createAuditorShare");
  const id = String(formData.get("id") ?? "");
  let target = "/app/audit?success=Lien%20revoque.";
  try {
    await prisma.auditorShareLink.update({
      where: { id, userId: workspace.workspaceUserId },
      data: { revokedAt: new Date() },
    });
    revalidatePath("/app/audit");
  } catch (error) {
    target = `/app/audit?error=${encodeURIComponent(toPublicError(error))}`;
  }
  redirect(target);
}
