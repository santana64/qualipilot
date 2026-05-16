import { evaluateAuditExportReadiness, evaluateTrainingProgramCompleteness, getCriticalIndicatorsNeedingAttention, getExpiredEvidence, getMissingEvidence, getNextRecommendedAction, getOverdueActions, statusToScore } from "@/domain/rnq/readiness";
import { prisma } from "@/lib/db";
import { ensureUserIndicatorProgress } from "@/server/referential";
import { ensureAutomaticReminders } from "@/server/reminders";
import { recordDailyReadinessSnapshot } from "@/server/readiness-snapshots";
import { resolveWorkspaceContextByUserId } from "@/server/rbac";

export async function getWorkspaceData(userId: string, options?: { clientId?: string | null }) {
  const workspace = await resolveWorkspaceContextByUserId(userId);
  const workspaceUserId = workspace.workspaceUserId;
  await ensureAutomaticReminders(workspaceUserId).catch(() => undefined);
  const clientId = options?.clientId ?? null;
  const scopedWhere = clientId ? { clientId } : {};

  const activeClient = clientId
    ? await prisma.cabinetClient.findFirst({
        where: { id: clientId, userId: workspaceUserId, status: "ACTIVE" },
      })
    : null;
  if (clientId && !activeClient) {
    throw new Error("Client cabinet introuvable.");
  }
  await ensureUserIndicatorProgress(workspaceUserId, clientId);

  const [
    organization,
    criteria,
    progress,
    evidences,
    actions,
    trainingPrograms,
    documents,
    latestAudit,
    subscription,
    cabinetClients,
  ] = await Promise.all([
    prisma.organizationProfile.findUnique({ where: { userId: workspaceUserId } }),
    prisma.rnqCriterion.findMany({
      orderBy: { number: "asc" },
      include: {
        indicators: {
          orderBy: { number: "asc" },
          include: {
            evidenceLinks: {
              where: { evidence: { userId: workspaceUserId, status: { not: "ARCHIVED" }, ...scopedWhere } },
              include: { evidence: true },
            },
            actionPlanItems: { where: { userId: workspaceUserId, ...scopedWhere } },
            generatedDocument: { where: { userId: workspaceUserId, ...scopedWhere } },
          },
        },
      },
    }),
    prisma.indicatorProgress.findMany({
      where: { userId: workspaceUserId, clientId },
      include: { indicator: { include: { criterion: true } } },
    }),
    prisma.evidence.findMany({
      where: { userId: workspaceUserId, status: { not: "ARCHIVED" }, ...scopedWhere },
      orderBy: { updatedAt: "desc" },
      include: {
        client: true,
        indicatorLinks: { include: { indicator: true } },
        trainingProgramLinks: { include: { trainingProgram: true } },
      },
    }),
    prisma.actionPlanItem.findMany({
      where: { userId: workspaceUserId, status: { not: "CANCELLED" }, ...scopedWhere },
      orderBy: [{ dueDate: "asc" }, { createdAt: "desc" }],
      include: {
        client: true,
        indicator: true,
        evidence: true,
        trainingProgram: true,
      },
    }),
    prisma.trainingProgram.findMany({
      where: { userId: workspaceUserId, status: { not: "ARCHIVED" }, ...scopedWhere },
      orderBy: { updatedAt: "desc" },
      include: {
        client: true,
        evidenceLinks: { include: { evidence: true } },
      },
    }),
    prisma.generatedDocument.findMany({
      where: { userId: workspaceUserId, ...scopedWhere },
      orderBy: { createdAt: "desc" },
      include: {
        client: true,
        relatedIndicator: true,
        relatedTrainingProgram: true,
      },
    }),
    prisma.auditRecord.findFirst({
      where: { userId: workspaceUserId, status: { in: ["PLANNED", "IN_PROGRESS"] }, ...scopedWhere },
      orderBy: { scheduledDate: "asc" },
    }),
    prisma.subscription.findUnique({ where: { userId: workspaceUserId } }),
    prisma.cabinetClient.findMany({
      where: { userId: workspaceUserId, status: "ACTIVE" },
      orderBy: { organizationName: "asc" },
    }),
  ]);

  const progressByIndicatorId = new Map(progress.map((item) => [item.indicatorId, item]));
  const indicatorRows = criteria.flatMap((criterion) =>
    criterion.indicators.map((indicator) => {
      const item = progressByIndicatorId.get(indicator.id);
      return {
        id: indicator.id,
        number: indicator.number,
        criterionNumber: criterion.number,
        title: indicator.title,
        shortDescription: indicator.shortDescription,
        expectedLevel: indicator.expectedLevel,
        riskLevel: indicator.riskLevel,
        status: item?.status ?? "NOT_STARTED",
        readinessScore: item?.readinessScore ?? (statusToScore(item?.status ?? "NOT_STARTED") ?? 0),
        notes: item?.notes,
        evidenceCount: indicator.evidenceLinks.filter((link) => link.evidence.userId === workspaceUserId && link.evidence.status !== "ARCHIVED").length,
        actionCount: indicator.actionPlanItems.filter((action) => action.status !== "DONE" && action.status !== "CANCELLED").length,
      };
    }),
  );

  const applicableScores = indicatorRows
    .filter((item) => item.status !== "NOT_APPLICABLE")
    .map((item) => statusToScore(item.status) ?? item.readinessScore);
  const globalReadinessScore = applicableScores.length
    ? Math.round(applicableScores.reduce((sum, score) => sum + score, 0) / applicableScores.length)
    : 0;

  const criterionScores = criteria.map((criterion) => {
    const rows = indicatorRows.filter((indicator) => indicator.criterionNumber === criterion.number && indicator.status !== "NOT_APPLICABLE");
    const score = rows.length
      ? Math.round(rows.reduce((sum, row) => sum + (statusToScore(row.status) ?? row.readinessScore), 0) / rows.length)
      : 0;
    return {
      criterion,
      score,
      readyCount: rows.filter((row) => row.status === "READY" || row.status === "VALIDATED").length,
      totalCount: rows.length,
    };
  });

  const evidenceLinks = evidences.flatMap((evidence) =>
    evidence.indicatorLinks.map((link) => ({
      evidenceId: evidence.id,
      indicatorId: link.indicatorId,
      indicatorNumber: link.indicator.number,
    })),
  );

  const missingEvidence = getMissingEvidence(
    indicatorRows,
    evidences,
    evidenceLinks,
    indicatorRows.map((row) => ({
      indicatorId: row.id,
      indicatorNumber: row.number,
      status: row.status,
      readinessScore: row.readinessScore,
    })),
  );

  const overdueActions = getOverdueActions(
    actions.map((action) => ({
      id: action.id,
      title: action.title,
      status: action.status,
      priority: action.priority,
      dueDate: action.dueDate,
      indicatorId: action.indicatorId,
      indicatorNumber: action.indicator?.number,
    })),
  );

  const expiredEvidence = getExpiredEvidence(
    evidences.map((evidence) => ({
      id: evidence.id,
      title: evidence.title,
      validityDate: evidence.validityDate,
      status: evidence.status,
    })),
  );

  const criticalIndicatorSeeds = getCriticalIndicatorsNeedingAttention(
    indicatorRows,
    indicatorRows.map((row) => ({
      indicatorId: row.id,
      indicatorNumber: row.number,
      status: row.status,
      readinessScore: row.readinessScore,
    })),
  );
  const criticalIndicators = criticalIndicatorSeeds
    .map((indicator) => indicatorRows.find((row) => row.id === indicator.id))
    .filter((indicator): indicator is (typeof indicatorRows)[number] => Boolean(indicator));

  const trainingCompleteness = trainingPrograms.map((program) => ({
    program,
    completeness: evaluateTrainingProgramCompleteness(program),
  }));

  const organizationComplete = Boolean(
    organization?.organizationName &&
      organization.address &&
      organization.postalCode &&
      organization.city &&
      organization.activityTypes.length > 0,
  );

  const auditExportReadiness = evaluateAuditExportReadiness({
    organizationComplete,
    globalReadinessScore,
    missingEvidenceCount: missingEvidence.length,
    overdueActionsCount: overdueActions.length,
    generatedDocumentsCount: documents.length,
    trainingProgramsCount: trainingPrograms.length,
  });

  const nextRecommendedAction = getNextRecommendedAction({
    missingEvidenceCount: missingEvidence.length,
    overdueActionsCount: overdueActions.length,
    criticalIndicatorsCount: criticalIndicators.length,
    incompleteTrainingProgramsCount: trainingCompleteness.filter((item) => !item.completeness.isComplete).length,
  });

  const result = {
    organization,
    activeClient,
    workspace,
    criteria,
    progress,
    evidences,
    actions,
    trainingPrograms,
    documents,
    latestAudit,
    subscription,
    cabinetClients,
    indicatorRows,
    criterionScores,
    globalReadinessScore,
    indicatorsReady: indicatorRows.filter((row) => row.status === "READY" || row.status === "VALIDATED").length,
    indicatorsIncomplete: indicatorRows.filter((row) => !["READY", "VALIDATED", "NOT_APPLICABLE"].includes(row.status)).length,
    missingEvidence,
    overdueActions,
    expiredEvidence,
    criticalIndicators,
    trainingCompleteness,
    auditExportReadiness,
    nextRecommendedAction,
  };

  await recordDailyReadinessSnapshot({
    userId: workspaceUserId,
    clientId,
    globalReadinessScore,
    indicatorsReady: result.indicatorsReady,
    indicatorsIncomplete: result.indicatorsIncomplete,
    missingEvidenceCount: missingEvidence.length,
    overdueActionsCount: overdueActions.length,
  }).catch(() => undefined);

  return result;
}
