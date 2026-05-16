"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { toPublicError } from "@/lib/errors";
import { getOptionalDate } from "@/lib/utils";
import { assertValidClientForUser } from "@/server/cabinet";
import { getWorkspaceData } from "@/server/app-data";
import { scheduleAuditReminder } from "@/server/reminders";
import { requireWorkspacePermission } from "@/server/rbac";

const auditSchema = z.object({
  id: z.string().optional(),
  type: z.enum(["INITIAL", "SURVEILLANCE", "RENEWAL", "INTERNAL"]),
  certifierName: z.string().trim().optional(),
  clientId: z.string().trim().optional(),
  status: z.enum(["PLANNED", "IN_PROGRESS", "COMPLETED", "CANCELLED"]).default("PLANNED"),
  notes: z.string().trim().optional(),
});

export async function saveAuditRecordAction(formData: FormData) {
  const workspace = await requireWorkspacePermission("manageAudit");
  let target = "/app/audit?success=Audit%20mis%20%C3%A0%20jour.";
  try {
    const parsed = auditSchema.parse(Object.fromEntries(formData));
    const scheduledDate = getOptionalDate(formData, "scheduledDate");
    if (!scheduledDate) throw new Error("Date d'audit requise.");
    const client = await assertValidClientForUser(workspace.workspaceUserId, parsed.clientId || null);
    const data = await getWorkspaceData(workspace.workspaceUserId, { clientId: client?.id ?? null });
    let auditRecordId = parsed.id || "";
    if (parsed.id) {
      const existing = await prisma.auditRecord.findFirst({ where: { id: parsed.id, userId: workspace.workspaceUserId } });
      if (!existing) throw new Error("Audit introuvable.");
      await prisma.auditRecord.update({
        where: { id: parsed.id },
        data: {
          type: parsed.type,
          clientId: client?.id ?? null,
          scheduledDate,
          certifierName: parsed.certifierName || null,
          status: parsed.status,
          readinessScore: data.globalReadinessScore,
          notes: parsed.notes || null,
        },
      });
    } else {
      const created = await prisma.auditRecord.create({
        data: {
          userId: workspace.workspaceUserId,
          clientId: client?.id ?? null,
          type: parsed.type,
          scheduledDate,
          certifierName: parsed.certifierName || null,
          status: parsed.status,
          readinessScore: data.globalReadinessScore,
          notes: parsed.notes || null,
        },
      });
      auditRecordId = created.id;
    }
    await scheduleAuditReminder({
      userId: workspace.workspaceUserId,
      clientId: client?.id ?? null,
      auditRecordId,
      scheduledDate,
      type: parsed.type,
    });
    revalidatePath("/app/audit");
  } catch (error) {
    target = `/app/audit?error=${encodeURIComponent(toPublicError(error))}`;
  }
  redirect(target);
}
