import { describe, expect, it } from "vitest";
import {
  statusToScore,
  getAuditReadinessStatus,
  isOverdue,
  calculateIndicatorReadiness,
  averageScores,
  getCriticalIndicatorsNeedingAttention,
  getNextRecommendedAction,
  evaluateAuditExportReadiness,
} from "./readiness";

// ─── statusToScore ────────────────────────────────────────────────────────────

describe("statusToScore", () => {
  it("maps every IndicatorStatus to its expected score", () => {
    expect(statusToScore("NOT_STARTED")).toBe(0);
    expect(statusToScore("IN_PROGRESS")).toBe(40);
    expect(statusToScore("NEEDS_REVIEW")).toBe(60);
    expect(statusToScore("READY")).toBe(85);
    expect(statusToScore("VALIDATED")).toBe(100);
    expect(statusToScore("NOT_APPLICABLE")).toBeNull();
  });
});

// ─── getAuditReadinessStatus ──────────────────────────────────────────────────

describe("getAuditReadinessStatus", () => {
  it("returns READY at 85", () => expect(getAuditReadinessStatus(85)).toBe("READY"));
  it("returns READY at 100", () => expect(getAuditReadinessStatus(100)).toBe("READY"));
  it("returns WARNING at 60", () => expect(getAuditReadinessStatus(60)).toBe("WARNING"));
  it("returns WARNING at 84", () => expect(getAuditReadinessStatus(84)).toBe("WARNING"));
  it("returns AT_RISK at 30", () => expect(getAuditReadinessStatus(30)).toBe("AT_RISK"));
  it("returns AT_RISK at 59", () => expect(getAuditReadinessStatus(59)).toBe("AT_RISK"));
  it("returns CRITICAL at 0", () => expect(getAuditReadinessStatus(0)).toBe("CRITICAL"));
  it("returns CRITICAL at 29", () => expect(getAuditReadinessStatus(29)).toBe("CRITICAL"));
});

// ─── isOverdue ────────────────────────────────────────────────────────────────

describe("isOverdue", () => {
  const now = new Date("2026-06-01");

  it("returns true for past due date with TODO status", () => {
    expect(isOverdue({ dueDate: "2026-05-01", status: "TODO" }, now)).toBe(true);
  });

  it("returns false for past due date but DONE status", () => {
    expect(isOverdue({ dueDate: "2026-05-01", status: "DONE" }, now)).toBe(false);
  });

  it("returns false for past due date but CANCELLED status", () => {
    expect(isOverdue({ dueDate: "2026-05-01", status: "CANCELLED" }, now)).toBe(false);
  });

  it("returns false when due date is in the future", () => {
    expect(isOverdue({ dueDate: "2026-12-31", status: "TODO" }, now)).toBe(false);
  });

  it("returns false when dueDate is null", () => {
    expect(isOverdue({ dueDate: null, status: "TODO" }, now)).toBe(false);
  });

  it("returns false when dueDate is undefined", () => {
    expect(isOverdue({ dueDate: undefined, status: "TODO" }, now)).toBe(false);
  });

  it("accepts Date objects as well as strings", () => {
    const pastDate = new Date("2026-01-01");
    expect(isOverdue({ dueDate: pastDate, status: "IN_PROGRESS" }, now)).toBe(true);
  });
});

// ─── calculateIndicatorReadiness ──────────────────────────────────────────────

describe("calculateIndicatorReadiness", () => {
  it("returns 0 when indicatorProgress is null", () => {
    expect(calculateIndicatorReadiness(null)).toBe(0);
  });

  it("returns 0 when indicatorProgress is undefined", () => {
    expect(calculateIndicatorReadiness(undefined)).toBe(0);
  });

  it("returns null for NOT_APPLICABLE status (excluded from scoring)", () => {
    expect(calculateIndicatorReadiness({ status: "NOT_APPLICABLE", readinessScore: null })).toBeNull();
  });

  it("uses readinessScore when set and within valid range", () => {
    expect(
      calculateIndicatorReadiness({ status: "READY", readinessScore: 90 }, [{ evidenceId: "e1", indicatorId: "i1" }]),
    ).toBe(90);
  });

  it("caps score at 60 when no evidence is linked and score would exceed 60", () => {
    // READY base = 85, but no evidence → capped at 60
    expect(
      calculateIndicatorReadiness({ status: "READY", readinessScore: null }, []),
    ).toBe(60);
  });

  it("does not cap score below 60 when no evidence (score already ≤ 60)", () => {
    // IN_PROGRESS base = 40, no evidence → stays at 40
    expect(
      calculateIndicatorReadiness({ status: "IN_PROGRESS", readinessScore: null }, []),
    ).toBe(40);
  });

  it("caps score at 50 when a HIGH priority action is overdue", () => {
    const overdueHighAction = {
      id: "a1",
      title: "Action critique",
      status: "TODO" as const,
      dueDate: new Date("2026-01-01"),
      priority: "HIGH" as const,
    };
    // Pass evidence to avoid the 60-cap, then check the 50-cap from overdue action
    const score = calculateIndicatorReadiness(
      { status: "VALIDATED", readinessScore: null },
      [{ evidenceId: "e1", indicatorId: "i1" }],
      [overdueHighAction],
    );
    expect(score).toBe(50);
  });

  it("does not cap for LOW priority overdue action", () => {
    const overdueAction = {
      id: "a1",
      title: "Low prio",
      status: "TODO" as const,
      dueDate: new Date("2026-01-01"),
      priority: "LOW" as const,
    };
    const score = calculateIndicatorReadiness(
      { status: "VALIDATED", readinessScore: null },
      [{ evidenceId: "e1", indicatorId: "i1" }],
      [overdueAction],
    );
    expect(score).toBe(100);
  });

  it("clamps readinessScore to [0, 100]", () => {
    expect(
      calculateIndicatorReadiness({ status: "READY", readinessScore: 999 }, [{ evidenceId: "e1", indicatorId: "i1" }]),
    ).toBe(100);
    expect(
      calculateIndicatorReadiness({ status: "READY", readinessScore: -50 }, [{ evidenceId: "e1", indicatorId: "i1" }]),
    ).toBe(0);
  });
});

// ─── averageScores ────────────────────────────────────────────────────────────

describe("averageScores", () => {
  it("returns 0 for empty array", () => {
    expect(averageScores([])).toBe(0);
  });

  it("returns 0 for all nulls/undefined", () => {
    expect(averageScores([null, undefined, null])).toBe(0);
  });

  it("ignores null/undefined values in average", () => {
    // (100 + 0) / 2 = 50 — NOT_APPLICABLE (null) excluded
    expect(averageScores([100, null, 0])).toBe(50);
  });

  it("rounds result to nearest integer", () => {
    // (85 + 40) / 2 = 62.5 → 63
    expect(averageScores([85, 40])).toBe(63);
  });

  it("handles single value", () => {
    expect(averageScores([75])).toBe(75);
  });
});

// ─── getCriticalIndicatorsNeedingAttention ────────────────────────────────────

describe("getCriticalIndicatorsNeedingAttention", () => {
  const indicators = [
    { id: "i1", number: 1, title: "Alpha", riskLevel: "CRITICAL" as const },
    { id: "i2", number: 2, title: "Beta", riskLevel: "HIGH" as const },
    { id: "i3", number: 3, title: "Gamma", riskLevel: "LOW" as const },
    { id: "i4", number: 4, title: "Delta", riskLevel: "CRITICAL" as const },
  ];

  it("returns CRITICAL/HIGH indicators that are not yet VALIDATED or READY", () => {
    const progress = [
      { indicatorId: "i1", indicatorNumber: 1, status: "VALIDATED" as const },
      { indicatorId: "i2", indicatorNumber: 2, status: "IN_PROGRESS" as const },
      { indicatorId: "i4", indicatorNumber: 4, status: "NOT_STARTED" as const },
    ];
    const result = getCriticalIndicatorsNeedingAttention(indicators, progress);
    expect(result.map((r) => r.id)).toEqual(["i2", "i4"]);
  });

  it("excludes LOW riskLevel even if not started", () => {
    const result = getCriticalIndicatorsNeedingAttention(indicators, []);
    expect(result.some((r) => r.id === "i3")).toBe(false);
  });

  it("excludes CRITICAL indicators that are VALIDATED", () => {
    const progress = [
      { indicatorId: "i1", indicatorNumber: 1, status: "VALIDATED" as const },
      { indicatorId: "i4", indicatorNumber: 4, status: "VALIDATED" as const },
    ];
    const result = getCriticalIndicatorsNeedingAttention(indicators, progress);
    expect(result.some((r) => r.riskLevel === "CRITICAL")).toBe(false);
  });
});

// ─── getNextRecommendedAction ─────────────────────────────────────────────────

describe("getNextRecommendedAction", () => {
  it("prioritizes critical indicators above all else", () => {
    const recommendation = getNextRecommendedAction({
      missingEvidenceCount: 5,
      overdueActionsCount: 3,
      criticalIndicatorsCount: 2,
      incompleteTrainingProgramsCount: 1,
    });
    expect(recommendation).toContain("critiques");
  });

  it("recommends missing evidence when no critical indicators", () => {
    const recommendation = getNextRecommendedAction({
      missingEvidenceCount: 5,
      overdueActionsCount: 3,
      criticalIndicatorsCount: 0,
      incompleteTrainingProgramsCount: 1,
    });
    expect(recommendation).toContain("preuves");
  });

  it("recommends overdue actions next", () => {
    const recommendation = getNextRecommendedAction({
      missingEvidenceCount: 0,
      overdueActionsCount: 3,
      criticalIndicatorsCount: 0,
      incompleteTrainingProgramsCount: 1,
    });
    expect(recommendation).toContain("retard");
  });

  it("recommends training when everything else is clear", () => {
    const recommendation = getNextRecommendedAction({
      missingEvidenceCount: 0,
      overdueActionsCount: 0,
      criticalIndicatorsCount: 0,
      incompleteTrainingProgramsCount: 2,
    });
    expect(recommendation).toContain("formations");
  });

  it("recommends a review when everything is complete", () => {
    const recommendation = getNextRecommendedAction({
      missingEvidenceCount: 0,
      overdueActionsCount: 0,
      criticalIndicatorsCount: 0,
      incompleteTrainingProgramsCount: 0,
    });
    expect(recommendation).toContain("revue");
  });
});

// ─── evaluateAuditExportReadiness ─────────────────────────────────────────────

describe("evaluateAuditExportReadiness", () => {
  const fullContext = {
    organizationComplete: true,
    globalReadinessScore: 90,
    missingEvidenceCount: 0,
    overdueActionsCount: 0,
    generatedDocumentsCount: 3,
    trainingProgramsCount: 2,
  };

  it("returns ready when all conditions are met", () => {
    expect(evaluateAuditExportReadiness(fullContext).ready).toBe(true);
    expect(evaluateAuditExportReadiness(fullContext).blockers).toHaveLength(0);
  });

  it("blocks when organization profile is incomplete", () => {
    const result = evaluateAuditExportReadiness({ ...fullContext, organizationComplete: false });
    expect(result.blockers).toContain("Profil organisme incomplet.");
  });

  it("blocks when no training programs are defined", () => {
    const result = evaluateAuditExportReadiness({ ...fullContext, trainingProgramsCount: 0 });
    expect(result.blockers.some((b) => b.includes("formation"))).toBe(true);
  });

  it("blocks when no documents have been generated", () => {
    const result = evaluateAuditExportReadiness({ ...fullContext, generatedDocumentsCount: 0 });
    expect(result.blockers.some((b) => b.includes("document"))).toBe(true);
  });

  it("blocks when missing evidence exists", () => {
    const result = evaluateAuditExportReadiness({ ...fullContext, missingEvidenceCount: 2 });
    expect(result.blockers.some((b) => b.includes("preuve"))).toBe(true);
  });

  it("blocks when global score is below 60", () => {
    const result = evaluateAuditExportReadiness({ ...fullContext, globalReadinessScore: 40 });
    expect(result.blockers.some((b) => b.includes("global"))).toBe(true);
  });

  it("returns correct AuditReadinessStatus", () => {
    expect(evaluateAuditExportReadiness({ ...fullContext, globalReadinessScore: 90 }).status).toBe("READY");
    expect(evaluateAuditExportReadiness({ ...fullContext, globalReadinessScore: 70 }).status).toBe("WARNING");
    expect(evaluateAuditExportReadiness({ ...fullContext, globalReadinessScore: 40 }).status).toBe("AT_RISK");
  });
});
