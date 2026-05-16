"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import {
  generateAccessibilityProcedure,
  generateAttendanceSheetTemplate,
  generateAuditSummary,
  generateComplaintManagementProcedure,
  generateContinuousImprovementPlan,
  generateEvaluationProcedure,
  generateFullAuditFile,
  generateLearnerWelcomeProcedure,
  generateSatisfactionQuestionnaire,
  generateTrainingProgramTemplate,
  type DocumentInput,
  type GeneratedContent,
} from "@/domain/documents/templates";
import { documentTypeLabels } from "@/lib/labels";
import { prisma } from "@/lib/db";
import { toPublicError } from "@/lib/errors";
import { assertValidClientForUser } from "@/server/cabinet";
import { assertCanExportAuditFile, assertCanGenerateDocument } from "@/server/billing";
import { getWorkspaceData } from "@/server/app-data";
import { requireWorkspacePermission } from "@/server/rbac";

const documentSchema = z.object({
  type: z.enum([
    "LEARNER_WELCOME_PROCEDURE",
    "ACCESSIBILITY_PROCEDURE",
    "EVALUATION_PROCEDURE",
    "TRAINING_PROGRAM_TEMPLATE",
    "SATISFACTION_QUESTIONNAIRE",
    "ATTENDANCE_SHEET_TEMPLATE",
    "CONTINUOUS_IMPROVEMENT_PLAN",
    "COMPLAINT_MANAGEMENT_PROCEDURE",
    "AUDIT_SUMMARY",
    "FULL_AUDIT_FILE",
  ]),
  clientId: z.string().optional(),
  relatedIndicatorId: z.string().optional(),
  relatedTrainingProgramId: z.string().optional(),
});

function assertOrganization(organization: Awaited<ReturnType<typeof getWorkspaceData>>["organization"]) {
  if (!organization?.organizationName || !organization.address || !organization.city) {
    throw new Error("Profil organisme incomplet.");
  }
  return organization;
}

async function buildDocumentInput(workspaceUserId: string, relatedTrainingProgramId?: string, clientId?: string | null): Promise<DocumentInput> {
  const data = await getWorkspaceData(workspaceUserId, { clientId });
  const organization = assertOrganization(data.organization);
  const scopedTrainings = clientId ? data.trainingPrograms.filter((program) => program.clientId === clientId) : data.trainingPrograms;
  const scopedEvidences = clientId ? data.evidences.filter((evidence) => evidence.clientId === clientId) : data.evidences;
  const scopedActions = clientId ? data.actions.filter((action) => action.clientId === clientId) : data.actions;
  const trainingProgram =
    relatedTrainingProgramId
      ? scopedTrainings.find((program) => program.id === relatedTrainingProgramId) ?? null
      : scopedTrainings[0] ?? null;

  return {
    organization,
    activeClient: data.activeClient ? { organizationName: data.activeClient.organizationName } : null,
    trainingProgram,
    trainingPrograms: scopedTrainings.map((program) => ({
      title: program.title,
      publicTarget: program.publicTarget,
      objectives: program.objectives,
      duration: program.duration,
      modalities: program.modalities,
    })),
    audit: {
      type: data.latestAudit?.type,
      scheduledDate: data.latestAudit?.scheduledDate ?? organization.nextAuditDate,
      readinessScore: data.globalReadinessScore,
    },
    criterionScores: data.criterionScores.map(({ criterion, score, readyCount, totalCount }) => ({
      number: criterion.number,
      title: criterion.title,
      score,
      readyCount,
      totalCount,
    })),
    indicators: data.indicatorRows.map((indicator) => ({
      number: indicator.number,
      criterionNumber: indicator.criterionNumber,
      title: indicator.title,
      status: indicator.status,
      score: indicator.readinessScore,
      riskLevel: indicator.riskLevel,
      evidenceCount: indicator.evidenceCount,
      actionCount: indicator.actionCount,
    })),
    evidences: scopedEvidences.map((evidence) => ({
      title: evidence.title,
      type: evidence.type,
      status: evidence.status,
      validityDate: evidence.validityDate,
      responsible: evidence.responsible,
      indicators: evidence.indicatorLinks.map((link) => link.indicator.number),
    })),
    actions: scopedActions.map((action) => ({
      title: action.title,
      status: action.status,
      priority: action.priority,
      dueDate: action.dueDate,
      responsible: action.responsible,
      indicatorNumber: action.indicator?.number,
    })),
    documents: data.documents.map((document) => ({
      title: document.title,
      type: document.type,
      createdAt: document.createdAt,
    })),
    missingPoints: [
      ...data.missingEvidence.slice(0, 12).map((indicator) => `Indicateur ${indicator.number} - preuve associée à vérifier`),
      ...data.overdueActions.slice(0, 8).map((action) => `Action en retard : ${action.title}`),
      ...data.expiredEvidence.slice(0, 8).map((evidence) => `Preuve expirée : ${evidence.title}`),
    ],
  };
}

function generateByType(type: string, input: DocumentInput): GeneratedContent {
  switch (type) {
    case "LEARNER_WELCOME_PROCEDURE":
      return generateLearnerWelcomeProcedure(input);
    case "ACCESSIBILITY_PROCEDURE":
      return generateAccessibilityProcedure(input);
    case "EVALUATION_PROCEDURE":
      return generateEvaluationProcedure(input);
    case "TRAINING_PROGRAM_TEMPLATE":
      return generateTrainingProgramTemplate(input);
    case "SATISFACTION_QUESTIONNAIRE":
      return generateSatisfactionQuestionnaire(input);
    case "ATTENDANCE_SHEET_TEMPLATE":
      return generateAttendanceSheetTemplate(input);
    case "CONTINUOUS_IMPROVEMENT_PLAN":
      return generateContinuousImprovementPlan(input);
    case "COMPLAINT_MANAGEMENT_PROCEDURE":
      return generateComplaintManagementProcedure(input);
    case "AUDIT_SUMMARY":
      return generateAuditSummary(input);
    case "FULL_AUDIT_FILE":
      return generateFullAuditFile(input);
    default:
      throw new Error("Impossible de générer ce document : informations manquantes.");
  }
}

export async function generateDocumentAction(formData: FormData) {
  const workspace = await requireWorkspacePermission("manageDocuments");
  let target = "/app/documents";
  try {
    const parsed = documentSchema.parse(Object.fromEntries(formData));
    const client = await assertValidClientForUser(workspace.workspaceUserId, parsed.clientId || null);
    if (parsed.type === "FULL_AUDIT_FILE") {
      await assertCanExportAuditFile(workspace.workspaceUserId);
    }
    await assertCanGenerateDocument(workspace.workspaceUserId);
    const input = await buildDocumentInput(workspace.workspaceUserId, parsed.relatedTrainingProgramId || undefined, client?.id ?? null);
    const generated = generateByType(parsed.type, input);
    const document = await prisma.generatedDocument.create({
      data: {
        userId: workspace.workspaceUserId,
        clientId: client?.id ?? null,
        type: parsed.type,
        title: generated.title || documentTypeLabels[parsed.type],
        contentHtml: generated.contentHtml,
        contentText: generated.contentText,
        relatedIndicatorId: parsed.relatedIndicatorId || null,
        relatedTrainingProgramId: parsed.relatedTrainingProgramId || null,
      },
    });
    revalidatePath("/app/documents");
    target = `/app/documents/${document.id}?success=Document%20g%C3%A9n%C3%A9r%C3%A9.`;
  } catch (error) {
    target = `/app/documents?error=${encodeURIComponent(toPublicError(error))}`;
  }
  redirect(target);
}

export async function deleteDocumentAction(formData: FormData) {
  const workspace = await requireWorkspacePermission("manageDocuments");
  const id = String(formData.get("id") ?? "");
  let target = "/app/documents";
  try {
    await prisma.generatedDocument.delete({
      where: { id, userId: workspace.workspaceUserId },
    });
    revalidatePath("/app/documents");
  } catch (error) {
    target = `/app/documents?error=${encodeURIComponent(toPublicError(error))}`;
  }
  redirect(target);
}
