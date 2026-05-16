"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { toPublicError } from "@/lib/errors";
import { getOptionalDate } from "@/lib/utils";
import { assertValidClientForUser } from "@/server/cabinet";
import { sendDueReminders } from "@/server/reminders";
import { requireWorkspacePermission } from "@/server/rbac";

const reminderSchema = z.object({
  type: z.enum(["ACTION_DUE", "AUDIT_PREPARATION", "EVIDENCE_EXPIRY"]),
  subject: z.string().trim().min(2),
  message: z.string().trim().min(2),
  clientId: z.string().trim().optional(),
});

export async function createReminderAction(formData: FormData) {
  const workspace = await requireWorkspacePermission("manageReminders");
  let target = "/app/rappels?success=Rappel%20planifi%C3%A9.";
  try {
    const parsed = reminderSchema.parse(Object.fromEntries(formData));
    const scheduledFor = getOptionalDate(formData, "scheduledFor");
    if (!scheduledFor) throw new Error("Date de rappel requise.");
    const client = await assertValidClientForUser(workspace.workspaceUserId, parsed.clientId || null);
    await prisma.emailReminder.create({
      data: {
        userId: workspace.workspaceUserId,
        clientId: client?.id ?? null,
        type: parsed.type,
        subject: parsed.subject,
        message: parsed.message,
        scheduledFor,
      },
    });
    revalidatePath("/app/rappels");
  } catch (error) {
    target = `/app/rappels?error=${encodeURIComponent(toPublicError(error))}`;
  }
  redirect(target);
}

export async function cancelReminderAction(formData: FormData) {
  const workspace = await requireWorkspacePermission("manageReminders");
  let target = "/app/rappels?success=Rappel%20annul%C3%A9.";
  try {
    const id = z.string().min(1).parse(formData.get("id"));
    await prisma.emailReminder.update({
      where: { id, userId: workspace.workspaceUserId },
      data: { status: "CANCELLED" },
    });
    revalidatePath("/app/rappels");
  } catch (error) {
    target = `/app/rappels?error=${encodeURIComponent(toPublicError(error))}`;
  }
  redirect(target);
}

export async function sendDueRemindersNowAction() {
  let target = "/app/rappels?success=Rappels%20trait%C3%A9s.";
  try {
    await requireWorkspacePermission("manageReminders");
    const result = await sendDueReminders();
    target = `/app/rappels?success=${encodeURIComponent(`${result.sent} envoyé(s), ${result.failed} échec(s), ${result.scanned} rappel(s) vérifié(s).`)}`;
  } catch (error) {
    target = `/app/rappels?error=${encodeURIComponent(toPublicError(error))}`;
  }
  redirect(target);
}
