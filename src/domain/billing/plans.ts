export type Plan = "FREE" | "STARTER" | "PRO" | "CABINET";

export type PlanLimits = {
  trainingPrograms: number | "unlimited";
  evidences: number | "unlimited";
  generatedDocumentsPerMonth: number | "unlimited";
  fullAuditExport: boolean;
  cabinetMode: boolean;
  advancedDashboard: boolean;
  auditCockpit: boolean;
  emailReminders: boolean;
};

export const PLAN_LIMITS: Record<Plan, PlanLimits> = {
  FREE: {
    trainingPrograms: 1,
    evidences: 10,
    generatedDocumentsPerMonth: 3,
    fullAuditExport: false,
    cabinetMode: false,
    advancedDashboard: false,
    auditCockpit: false,
    emailReminders: false,
  },
  STARTER: {
    trainingPrograms: 5,
    evidences: 100,
    generatedDocumentsPerMonth: 30,
    fullAuditExport: true,
    cabinetMode: false,
    advancedDashboard: false,
    auditCockpit: false,
    emailReminders: false,
  },
  PRO: {
    trainingPrograms: "unlimited",
    evidences: "unlimited",
    generatedDocumentsPerMonth: "unlimited",
    fullAuditExport: true,
    cabinetMode: false,
    advancedDashboard: true,
    auditCockpit: true,
    emailReminders: true,
  },
  CABINET: {
    trainingPrograms: "unlimited",
    evidences: "unlimited",
    generatedDocumentsPerMonth: "unlimited",
    fullAuditExport: true,
    cabinetMode: true,
    advancedDashboard: true,
    auditCockpit: true,
    emailReminders: true,
  },
};

export function getPlanLimits(plan: Plan): PlanLimits {
  return PLAN_LIMITS[plan] ?? PLAN_LIMITS.FREE;
}

export function isWithinLimit(limit: number | "unlimited", used: number): boolean {
  return limit === "unlimited" || used < limit;
}

export function assertPlanLimit(condition: boolean, message = "Votre offre actuelle ne permet pas cette action.") {
  if (!condition) {
    throw new Error(message);
  }
}

export function canCreateTrainingProgram(plan: Plan, count: number): boolean {
  return isWithinLimit(getPlanLimits(plan).trainingPrograms, count);
}

export function canCreateEvidence(plan: Plan, count: number): boolean {
  return isWithinLimit(getPlanLimits(plan).evidences, count);
}

export function canGenerateDocument(plan: Plan, countThisMonth: number): boolean {
  return isWithinLimit(getPlanLimits(plan).generatedDocumentsPerMonth, countThisMonth);
}

export function canExportAuditFile(plan: Plan): boolean {
  return getPlanLimits(plan).fullAuditExport;
}

export function canUseCabinetMode(plan: Plan): boolean {
  return getPlanLimits(plan).cabinetMode;
}
