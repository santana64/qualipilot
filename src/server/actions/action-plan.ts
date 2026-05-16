"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { toPublicError } from "@/lib/errors";
import { getOptionalDate } from "@/lib/utils";
import { assertValidClientForUser } from "@/server/cabinet";
import { scheduleActionReminder } from "@/server/reminders";
import { requireWorkspacePermission } from "@/server/rbac";

const actionSchema = z.object({
  title: z.string().trim().min(2),
  description: z.string().trim().optional(),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]),
  status: z.enum(["TODO", "IN_PROGRESS", "DONE", "CANCELLED"]).default("TODO"),
  responsible: z.string().trim().optional(),
  clientId: z.string().trim().optional(),
  indicatorId: z.string().trim().optional(),
  evidenceId: z.string().trim().optional(),
  trainingProgramId: z.string().trim().optional(),
  completionNote: z.string().trim().optional(),
});

export async function createActionPlanItemAction(formData: FormData) {
  const workspace = await requireWorkspacePermission("manageActions");
  const returnTo = String(formData.get("returnTo") ?? "/app/actions");
  let target = returnTo;
  try {
    const parsed = actionSchema.parse(Object.fromEntries(formData));
    const client = await assertValidClientForUser(workspace.workspaceUserId, parsed.clientId || null);
    const dueDate = getOptionalDate(formData, "dueDate") ?? null;
    const created = await prisma.actionPlanItem.create({
      data: {
        userId: workspace.workspaceUserId,
        clientId: client?.id ?? null,
        title: parsed.title,
        description: parsed.description || null,
        priority: parsed.priority,
        status: parsed.status,
        dueDate,
        responsible: parsed.responsible || null,
        indicatorId: parsed.indicatorId || null,
        evidenceId: parsed.evidenceId || null,
        trainingProgramId: parsed.trainingProgramId || null,
        completionNote: parsed.completionNote || null,
        completedAt: parsed.status === "DONE" ? new Date() : null,
      },
    });
    await scheduleActionReminder({
      userId: workspace.workspaceUserId,
      clientId: client?.id ?? null,
      actionPlanItemId: created.id,
      title: created.title,
      dueDate,
    });
    revalidatePath("/app/actions");
    target = `${returnTo}${returnTo.includes("?") ? "&" : "?"}success=Action%20cr%C3%A9%C3%A9e.`;
  } catch (error) {
    target = `${returnTo}${returnTo.includes("?") ? "&" : "?"}error=${encodeURIComponent(toPublicError(error))}`;
  }
  redirect(target);
}

export async function markActionDoneAction(formData: FormData) {
  const workspace = await requireWorkspacePermission("manageActions");
  const id = String(formData.get("id") ?? "");
  const clientId = String(formData.get("clientId") ?? "") || null;
  const clientQuery = clientId ? `?clientId=${encodeURIComponent(clientId)}` : "";
  let target = `/app/actions${clientQuery}`;
  try {
    const client = await assertValidClientForUser(workspace.workspaceUserId, clientId);
    const action = await prisma.actionPlanItem.findFirst({
      where: { id, userId: workspace.workspaceUserId, clientId: client?.id ?? null },
      select: { id: true },
    });
    if (!action) throw new Error("Action introuvable.");
    await prisma.actionPlanItem.update({
      where: { id: action.id },
      data: {
        status: "DONE",
        completionNote: String(formData.get("completionNote") ?? "") || null,
        completedAt: new Date(),
      },
    });
    revalidatePath("/app/actions");
  } catch (error) {
    target = `/app/actions${clientQuery}${clientQuery ? "&" : "?"}error=${encodeURIComponent(toPublicError(error))}`;
  }
  redirect(target);
}

export async function cancelActionPlanItemAction(formData: FormData) {
  const workspace = await requireWorkspacePermission("manageActions");
  const id = String(formData.get("id") ?? "");
  const clientId = String(formData.get("clientId") ?? "") || null;
  const clientQuery = clientId ? `?clientId=${encodeURIComponent(clientId)}` : "";
  let target = `/app/actions${clientQuery}`;
  try {
    const client = await assertValidClientForUser(workspace.workspaceUserId, clientId);
    const action = await prisma.actionPlanItem.findFirst({
      where: { id, userId: workspace.workspaceUserId, clientId: client?.id ?? null },
      select: { id: true },
    });
    if (!action) throw new Error("Action introuvable.");
    await prisma.actionPlanItem.update({
      where: { id: action.id },
      data: { status: "CANCELLED" },
    });
    revalidatePath("/app/actions");
  } catch (error) {
    target = `/app/actions${clientQuery}${clientQuery ? "&" : "?"}error=${encodeURIComponent(toPublicError(error))}`;
  }
  redirect(target);
}
