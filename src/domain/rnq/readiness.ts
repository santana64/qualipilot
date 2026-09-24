import type {
  ActionLike,
  AuditReadinessStatus,
  EvidenceLike,
  EvidenceLinkLike,
  IndicatorProgressLike,
  IndicatorStatus,
  RnqCriterionSeed,
  RnqIndicatorSeed,
  TrainingProgramLike,
} from "./types";

export const STATUS_SCORES: Record<IndicatorStatus, number | null> = {
  NOT_STARTED: 0,
  IN_PROGRESS: 40,
  NEEDS_REVIEW: 60,
  READY: 85,
  VALIDATED: 100,
  NOT_APPLICABLE: null,
};

export function statusToScore(status: IndicatorStatus): number | null {
  return STATUS_SCORES[status];
}

export function getAuditReadinessStatus(score: number): AuditReadinessStatus {
  if (score >= 85) return "READY";
  if (score >= 60) return "WARNING";
  if (score >= 30) return "AT_RISK";
  return "CRITICAL";
}

function asDate(value?: Date | string | null): Date | null {
  if (!value) return null;
  return value instanceof Date ? value : new Date(value);
}

export function isOverdue(action: Pick<ActionLike, "dueDate" | "status">, currentDate = new Date()): boolean {
  const dueDate = asDate(action.dueDate);
  return Boolean(dueDate && dueDate < currentDate && action.status !== "DONE" && action.status !== "CANCELLED");
}

export function calculateIndicatorReadiness(
  indicatorProgress: IndicatorProgressLike | null | undefined,
  evidenceLinks: EvidenceLinkLike[] = [],
  actionItems: ActionLike[] = [],
): number | null {
  if (!indicatorProgress) return 0;
  const base = statusToScore(indicatorProgress.status);
  if (base === null) return null;

  let score = indicatorProgress.readinessScore ?? base;
  score = Math.max(0, Math.min(100, score));

  const hasEvidence = evidenceLinks.length > 0;
  if (!hasEvidence && score > 60) {
    score = 60;
  }

  const hasOverdueCriticalAction = actionItems.some(
    (action) => isOverdue(action) && (action.priority === "HIGH" || action.priority === "CRITICAL"),
  );
  if (hasOverdueCriticalAction && score > 50) {
    score = 50;
  }

  return score;
}

export function averageScores(scores: Array<number | null | undefined>): number {
  const usable = scores.filter((score): score is number => typeof score === "number" && Number.isFinite(score));
  if (usable.length === 0) return 0;
  return Math.round(usable.reduce((total, score) => total + score, 0) / usable.length);
}

export function calculateCriterionReadiness(
  criterion: Pick<RnqCriterionSeed, "number">,
  indicatorsProgress: Array<IndicatorProgressLike & { criterionNumber?: number }>,
): number {
  return averageScores(
    indicatorsProgress
      .filter((progress) => progress.criterionNumber === criterion.number)
      .map((progress) => statusToScore(progress.status)),
  );
}

export function calculateGlobalReadiness(allIndicatorsProgress: IndicatorProgressLike[]): number {
  return averageScores(allIndicatorsProgress.map((progress) => statusToScore(progress.status)));
}

export function getMissingEvidence(
  indicators: Array<Pick<RnqIndicatorSeed, "number" | "title" | "riskLevel"> & { id?: string }>,
  evidences: EvidenceLike[],
  links: EvidenceLinkLike[],
  progress: IndicatorProgressLike[] = [],
) {
  const activeEvidenceIds = new Set(evidences.filter((evidence) => evidence.status !== "ARCHIVED").map((evidence) => evidence.id));
  const linkedIndicatorKeys = new Set(
    links
      .filter((link) => activeEvidenceIds.has(link.evidenceId))
      .map((link) => link.indicatorId ?? link.indicatorNumber),
  );
  const notApplicable = new Set(
    progress
      .filter((item) => item.status === "NOT_APPLICABLE")
      .map((item) => item.indicatorId ?? item.indicatorNumber),
  );

  return indicators.filter((indicator) => {
    const key = indicator.id ?? indicator.number;
    return !notApplicable.has(key) && !linkedIndicatorKeys.has(key);
  });
}

export function getCriticalIndicatorsNeedingAttention(
  indicators: Array<Pick<RnqIndicatorSeed, "number" | "title" | "riskLevel"> & { id?: string }>,
  progress: IndicatorProgressLike[],
) {
  const progressByKey = new Map(progress.map((item) => [item.indicatorId ?? item.indicatorNumber, item]));
  return indicators.filter((indicator) => {
    if (indicator.riskLevel !== "CRITICAL" && indicator.riskLevel !== "HIGH") return false;
    const item = progressByKey.get(indicator.id ?? indicator.number);
    return !item || item.status === "NOT_STARTED" || item.status === "IN_PROGRESS" || item.status === "NEEDS_REVIEW";
  });
}

export function getExpiredEvidence(evidences: EvidenceLike[], currentDate = new Date()) {
  return evidences.filter((evidence) => {
    const validityDate = asDate(evidence.validityDate);
    return evidence.status !== "ARCHIVED" && Boolean(validityDate && validityDate < currentDate);
  });
}

export function getOverdueActions(actions: ActionLike[], currentDate = new Date()) {
  return actions.filter((action) => isOverdue(action, currentDate));
}

export function getNextRecommendedAction(context: {
  missingEvidenceCount: number;
  overdueActionsCount: number;
  criticalIndicatorsCount: number;
  incompleteTrainingProgramsCount: number;
}) {
  if (context.criticalIndicatorsCount > 0) return "Traiter les indicateurs critiques qui restent à compléter.";
  if (context.missingEvidenceCount > 0) return "Associer les preuves manquantes aux indicateurs concernés.";
  if (context.overdueActionsCount > 0) return "Clôturer ou replanifier les actions qualité en retard.";
  if (context.incompleteTrainingProgramsCount > 0) return "Compléter les informations publiques des formations.";
  return "Planifier une revue qualité et archiver les preuves récentes.";
}

export function evaluateTrainingProgramCompleteness(trainingProgram: TrainingProgramLike) {
  const requiredFields: Array<[keyof TrainingProgramLike, string]> = [
    ["title", "Intitulé"],
    ["publicTarget", "Public visé"],
    ["objectives", "Objectifs"],
    ["duration", "Durée"],
    ["modalities", "Modalités"],
    ["teachingMethods", "Méthodes pédagogiques"],
    ["evaluationMethods", "Méthodes d'évaluation"],
    ["accessDelay", "Délai d'accès"],
    ["accessibilityInfo", "Information handicap/accessibilité"],
    ["contactInfo", "Contact"],
    ["resultIndicators", "Indicateurs de résultats"],
  ];

  const missingFields = requiredFields
    .filter(([field]) => {
      const value = trainingProgram[field];
      if (typeof value === "number") return false;
      return !value || String(value).trim().length === 0;
    })
    .map(([, label]) => label);

  const total = requiredFields.length;
  const score = Math.round(((total - missingFields.length) / total) * 100);
  return {
    score,
    missingFields,
    isComplete: missingFields.length === 0,
  };
}

export function evaluateAuditExportReadiness(context: {
  organizationComplete: boolean;
  globalReadinessScore: number;
  missingEvidenceCount: number;
  overdueActionsCount: number;
  generatedDocumentsCount: number;
  trainingProgramsCount: number;
}) {
  const blockers: string[] = [];
  if (!context.organizationComplete) blockers.push("Profil organisme incomplet.");
  if (context.trainingProgramsCount === 0) blockers.push("Aucune formation renseignée.");
  if (context.generatedDocumentsCount === 0) blockers.push("Aucun document qualité généré.");
  if (context.missingEvidenceCount > 0) blockers.push(`${context.missingEvidenceCount} preuve(s) manquante(s).`);
  if (context.overdueActionsCount > 0) blockers.push(`${context.overdueActionsCount} action(s) en retard.`);
  if (context.globalReadinessScore < 60) blockers.push("Niveau de préparation global insuffisant.");

  return {
    ready: blockers.length === 0 || (context.globalReadinessScore >= 85 && context.missingEvidenceCount <= 3),
    status: getAuditReadinessStatus(context.globalReadinessScore),
    blockers,
  };
}
