"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { toPublicError } from "@/lib/errors";
import { assertValidClientForUser } from "@/server/cabinet";
import { assertCanCreateTrainingProgram } from "@/server/billing";
import { requireWorkspacePermission } from "@/server/rbac";

const trainingSchema = z.object({
  title: z.string().trim().min(2),
  category: z.string().trim().optional(),
  publicTarget: z.string().trim().min(2),
  prerequisites: z.string().trim().optional(),
  objectives: z.string().trim().min(2),
  duration: z.string().trim().min(1),
  accessDelay: z.string().trim().optional(),
  price: z.string().trim().optional(),
  clientId: z.string().trim().optional(),
  modalities: z.string().trim().min(2),
  teachingMethods: z.string().trim().min(2),
  evaluationMethods: z.string().trim().min(2),
  accessibilityInfo: z.string().trim().optional(),
  contactInfo: z.string().trim().optional(),
  resultIndicators: z.string().trim().optional(),
  status: z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"]).default("DRAFT"),
  notes: z.string().trim().optional(),
});

function parsePriceCents(value?: string) {
  if (!value) return null;
  const normalized = value.replace(",", ".");
  const euros = Number(normalized);
  return Number.isFinite(euros) ? Math.round(euros * 100) : null;
}

function payload(formData: FormData) {
  const parsed = trainingSchema.parse(Object.fromEntries(formData));
  return {
    clientId: parsed.clientId || null,
    title: parsed.title,
    category: parsed.category || null,
    publicTarget: parsed.publicTarget,
    prerequisites: parsed.prerequisites || null,
    objectives: parsed.objectives,
    duration: parsed.duration,
    accessDelay: parsed.accessDelay || null,
    priceCents: parsePriceCents(parsed.price),
    modalities: parsed.modalities,
    teachingMethods: parsed.teachingMethods,
    evaluationMethods: parsed.evaluationMethods,
    accessibilityInfo: parsed.accessibilityInfo || null,
    contactInfo: parsed.contactInfo || null,
    resultIndicators: parsed.resultIndicators || null,
    status: parsed.status,
    notes: parsed.notes || null,
  };
}

export async function createTrainingProgramAction(formData: FormData) {
  const workspace = await requireWorkspacePermission("manageTraining");
  let target = "/app/formations/new";
  try {
    await assertCanCreateTrainingProgram(workspace.workspaceUserId);
    const data = payload(formData);
    const client = await assertValidClientForUser(workspace.workspaceUserId, data.clientId);
    const created = await prisma.trainingProgram.create({
      data: {
        userId: workspace.workspaceUserId,
        ...data,
        clientId: client?.id ?? null,
      },
    });
    revalidatePath("/app/formations");
    target = `/app/formations/${created.id}?success=Formation%20cr%C3%A9%C3%A9e.`;
  } catch (error) {
    target = `/app/formations/new?error=${encodeURIComponent(toPublicError(error))}`;
  }
  redirect(target);
}

export async function updateTrainingProgramAction(formData: FormData) {
  const workspace = await requireWorkspacePermission("manageTraining");
  const id = String(formData.get("id") ?? "");
  let target = `/app/formations/${id}/edit`;
  try {
    const existing = await prisma.trainingProgram.findFirst({ where: { id, userId: workspace.workspaceUserId } });
    if (!existing) throw new Error("Formation introuvable.");
    const data = payload(formData);
    const client = await assertValidClientForUser(workspace.workspaceUserId, data.clientId);
    await prisma.trainingProgram.update({
      where: { id },
      data: {
        ...data,
        clientId: client?.id ?? null,
      },
    });
    revalidatePath("/app/formations");
    target = `/app/formations/${id}?success=Formation%20mise%20%C3%A0%20jour.`;
  } catch (error) {
    target = `/app/formations/${id}/edit?error=${encodeURIComponent(toPublicError(error))}`;
  }
  redirect(target);
}

export async function archiveTrainingProgramAction(formData: FormData) {
  const workspace = await requireWorkspacePermission("manageTraining");
  const id = String(formData.get("id") ?? "");
  let target = "/app/formations";
  try {
    await prisma.trainingProgram.update({
      where: { id, userId: workspace.workspaceUserId },
      data: { status: "ARCHIVED" },
    });
    revalidatePath("/app/formations");
  } catch (error) {
    target = `/app/formations/${id}?error=${encodeURIComponent(toPublicError(error))}`;
  }
  redirect(target);
}

export async function deleteTrainingProgramAction(formData: FormData) {
  const workspace = await requireWorkspacePermission("manageTraining");
  const id = String(formData.get("id") ?? "");
  let target = "/app/formations?success=Formation%20supprim%C3%A9e.";
  try {
    const existing = await prisma.trainingProgram.findFirst({
      where: { id, userId: workspace.workspaceUserId },
      select: { id: true },
    });
    if (!existing) throw new Error("Formation introuvable.");
    await prisma.trainingProgram.delete({ where: { id } });
    revalidatePath("/app");
    revalidatePath("/app/formations");
  } catch (error) {
    target = `/app/formations/${id}?error=${encodeURIComponent(toPublicError(error))}`;
  }
  redirect(target);
}
