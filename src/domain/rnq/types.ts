export type RiskLevel = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

export type IndicatorStatus =
  | "NOT_STARTED"
  | "IN_PROGRESS"
  | "NEEDS_REVIEW"
  | "READY"
  | "VALIDATED"
  | "NOT_APPLICABLE";

export type AuditReadinessStatus = "READY" | "WARNING" | "AT_RISK" | "CRITICAL";

export type RnqCriterionSeed = {
  number: number;
  title: string;
  description: string;
};

export type RnqIndicatorSeed = {
  number: number;
  criterionNumber: number;
  title: string;
  shortDescription: string;
  expectedLevel: string;
  evidenceExamples: string[];
  applicableTo: string[];
  riskLevel: RiskLevel;
};

export type IndicatorProgressLike = {
  indicatorId?: string;
  indicatorNumber?: number;
  status: IndicatorStatus;
  readinessScore?: number | null;
  notes?: string | null;
};

export type EvidenceLike = {
  id: string;
  title: string;
  validityDate?: Date | string | null;
  status?: string | null;
};

export type EvidenceLinkLike = {
  evidenceId: string;
  indicatorId?: string;
  indicatorNumber?: number;
};

export type ActionLike = {
  id: string;
  title: string;
  status: "TODO" | "IN_PROGRESS" | "DONE" | "CANCELLED";
  priority?: RiskLevel | "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  dueDate?: Date | string | null;
  indicatorId?: string | null;
  indicatorNumber?: number | null;
};

export type TrainingProgramLike = {
  title?: string | null;
  publicTarget?: string | null;
  objectives?: string | null;
  duration?: string | null;
  modalities?: string | null;
  teachingMethods?: string | null;
  evaluationMethods?: string | null;
  accessDelay?: string | null;
  accessibilityInfo?: string | null;
  contactInfo?: string | null;
  priceCents?: number | null;
  resultIndicators?: string | null;
};
