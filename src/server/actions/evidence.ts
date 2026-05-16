"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { toPublicError } from "@/lib/errors";
import {
  assertAllowedEvidenceUpload,
  cleanEvidenceFileName,
  deleteStoredFile,
  storeEvidenceFile,
  toBlobStorageKey,
} from "@/lib/storage";
import { getOptionalDate } from "@/lib/utils";
import { assertValidClientForUser } from "@/server/cabinet";
import { assertCanCreateEvidence } from "@/server/billing";
import { scheduleEvidenceExpiryReminder } from "@/server/reminders";
import { requireWorkspacePermission } from "@/server/rbac";

const evidenceSchema = z.object({
  title: z.string().trim().min(2),
  type: z.enum([
    "PROCEDURE",
    "PROGRAM",
    "ATTENDANCE_SHEET",
    "SATISFACTION_SURVEY",
    "EVALUATION_RESULT",
    "TRAINER_CV",
    "ACCESSIBILITY_DOCUMENT",
    "CONTRACT",
    "FUNDER_DOCUMENT",
    "IMPROVEMENT_ACTION",
    "PUBLIC_INFORMATION_PROOF",
    "SUBCONTRACTOR_PROOF",
    "OTHER",
  ]),
  description: z.string().trim().optional(),
  fileUrl: z.string().trim().optional(),
  externalUrl: z
    .string()
    .trim()
    .optional()
    .refine(
      (v) => !v || /^https?:\/\//i.test(v),
      { message: "L'URL externe doit commencer par http:// ou https://" },
    ),
  responsible: z.string().trim().optional(),
  clientId: z.string().trim().optional(),
  status: z.enum(["DRAFT", "ACTIVE", "EXPIRED", "TO_REVIEW", "ARCHIVED"]).default("ACTIVE"),
  notes: z.string().trim().optional(),
});

export async function createEvidenceAction(formData: FormData) {
  const workspace = await requireWorkspacePermission("manageEvidence");
  const returnTo = String(formData.get("returnTo") ?? "/app/preuves");
  let target = returnTo;
  let createdEvidenceId: string | null = null;
  const uploadedBlobPathname = String(formData.get("uploadedBlobPathname") ?? "").trim();
  let uploadedStorageKey: string | null = null;
  try {
    await assertCanCreateEvidence(workspace.workspaceUserId);
    const parsed = evidenceSchema.parse(Object.fromEntries(formData));
    const client = await assertValidClientForUser(workspace.workspaceUserId, parsed.clientId || null);
    const indicatorIds = formData.getAll("indicatorIds").map(String).filter(Boolean);
    const trainingProgramIds = formData.getAll("trainingProgramIds").map(String).filter(Boolean);
    const created = await prisma.evidence.create({
      data: {
        userId: workspace.workspaceUserId,
        clientId: client?.id ?? null,
        title: parsed.title,
        type: parsed.type,
        description: parsed.description || null,
        fileUrl: parsed.fileUrl || null,
        externalUrl: parsed.externalUrl || null,
        validityDate: getOptionalDate(formData, "validityDate") ?? null,
        responsible: parsed.responsible || null,
        status: parsed.status,
        notes: parsed.notes || null,
        indicatorLinks: {
          create: indicatorIds.map((indicatorId) => ({ indicatorId })),
        },
        trainingProgramLinks: {
          create: trainingProgramIds.map((trainingProgramId) => ({ trainingProgramId })),
        },
      },
    });
    createdEvidenceId = created.id;
    if (uploadedBlobPathname) {
      if (!uploadedBlobPathname.startsWith(`evidence/${workspace.workspaceUserId}/pending/`) || uploadedBlobPathname.includes("..")) {
        throw new Error("Chemin Blob invalide.");
      }
      const uploadedFileName = cleanEvidenceFileName(String(formData.get("uploadedFileName") ?? "preuve"));
      const uploadedFileMimeType = String(formData.get("uploadedFileMimeType") ?? "application/octet-stream");
      const uploadedFileSizeBytes = Number(formData.get("uploadedFileSizeBytes") ?? 0);
      assertAllowedEvidenceUpload({ size: uploadedFileSizeBytes, type: uploadedFileMimeType });
      uploadedStorageKey = toBlobStorageKey(uploadedBlobPathname);
      await prisma.evidence.update({
        where: { id: created.id },
        data: {
          fileUrl: `/app/preuves/files/${created.id}`,
          fileStorageKey: uploadedStorageKey,
          fileName: uploadedFileName,
          fileMimeType: uploadedFileMimeType,
          fileSizeBytes: uploadedFileSizeBytes,
          fileUploadedAt: new Date(),
        },
      });
    } else {
      const file = formData.get("file");
      if (file instanceof File && file.size > 0) {
        const stored = await storeEvidenceFile(workspace.workspaceUserId, created.id, file);
        if (stored) {
          await prisma.evidence.update({
            where: { id: created.id },
            data: {
              fileUrl: `/app/preuves/files/${created.id}`,
              fileStorageKey: stored.storageKey,
              fileName: stored.fileName,
              fileMimeType: stored.fileMimeType,
              fileSizeBytes: stored.fileSizeBytes,
              fileUploadedAt: new Date(),
            },
          });
        }
      }
    }
    await scheduleEvidenceExpiryReminder({
      userId: workspace.workspaceUserId,
      clientId: client?.id ?? null,
      evidenceId: created.id,
      title: created.title,
      validityDate: created.validityDate,
    });
    revalidatePath("/app");
    revalidatePath("/app/preuves");
    target = `${returnTo}${returnTo.includes("?") ? "&" : "?"}success=${encodeURIComponent(`Preuve "${created.title}" créée.`)}`;
  } catch (error) {
    if (createdEvidenceId) {
      await prisma.evidence.delete({ where: { id: createdEvidenceId } }).catch(() => undefined);
    }
    if (uploadedStorageKey) {
      await deleteStoredFile(uploadedStorageKey).catch(() => undefined);
    }
    target = `${returnTo}${returnTo.includes("?") ? "&" : "?"}error=${encodeURIComponent(toPublicError(error))}`;
  }
  redirect(target);
}

export async function archiveEvidenceAction(formData: FormData) {
  const workspace = await requireWorkspacePermission("manageEvidence");
  const id = String(formData.get("id") ?? "");
  const clientId = String(formData.get("clientId") ?? "") || null;
  const clientQuery = clientId ? `?clientId=${encodeURIComponent(clientId)}` : "";
  let target = `/app/preuves${clientQuery}`;
  try {
    const client = await assertValidClientForUser(workspace.workspaceUserId, clientId);
    const evidence = await prisma.evidence.findFirst({
      where: { id, userId: workspace.workspaceUserId, clientId: client?.id ?? null },
      select: { id: true },
    });
    if (!evidence) throw new Error("Preuve introuvable.");
    await prisma.evidence.update({
      where: { id: evidence.id },
      data: { status: "ARCHIVED" },
    });
    revalidatePath("/app/preuves");
  } catch (error) {
    target = `/app/preuves${clientQuery}${clientQuery ? "&" : "?"}error=${encodeURIComponent(toPublicError(error))}`;
  }
  redirect(target);
}

export async function linkEvidenceToIndicatorAction(formData: FormData) {
  const workspace = await requireWorkspacePermission("manageEvidence");
  const evidenceId = String(formData.get("evidenceId") ?? "");
  const indicatorId = String(formData.get("indicatorId") ?? "");
  const clientId = String(formData.get("clientId") ?? "") || null;
  const clientQuery = clientId ? `?clientId=${encodeURIComponent(clientId)}` : "";
  let target = `/app/referentiel/${indicatorId}${clientQuery}`;
  try {
    const client = await assertValidClientForUser(workspace.workspaceUserId, clientId);
    const evidence = await prisma.evidence.findFirst({
      where: { id: evidenceId, userId: workspace.workspaceUserId, clientId: client?.id ?? null },
    });
    if (!evidence) throw new Error("Preuve introuvable.");
    await prisma.evidenceIndicator.upsert({
      where: { evidenceId_indicatorId: { evidenceId, indicatorId } },
      update: {},
      create: { evidenceId, indicatorId },
    });
    revalidatePath(target);
    target = `${target}${clientQuery ? "&" : "?"}success=Preuve%20associ%C3%A9e.`;
  } catch (error) {
    target = `${target}${clientQuery ? "&" : "?"}error=${encodeURIComponent(toPublicError(error))}`;
  }
  redirect(target);
}
