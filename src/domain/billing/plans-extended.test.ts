import { describe, expect, it } from "vitest";
import {
  canCreateEvidence,
  canCreateTrainingProgram,
  canExportAuditFile,
  canGenerateDocument,
  canUseCabinetMode,
  getPlanLimits,
  isWithinLimit,
  assertPlanLimit,
  PLAN_LIMITS,
} from "./plans";

// ─── PLAN_LIMITS contract ─────────────────────────────────────────────────────

describe("PLAN_LIMITS", () => {
  it("FREE plan has the most restrictive limits", () => {
    const free = PLAN_LIMITS.FREE;
    expect(free.trainingPrograms).toBe(1);
    expect(free.evidences).toBe(10);
    expect(free.generatedDocumentsPerMonth).toBe(3);
    expect(free.fullAuditExport).toBe(false);
    expect(free.cabinetMode).toBe(false);
    expect(free.advancedDashboard).toBe(false);
    expect(free.emailReminders).toBe(false);
  });

  it("PRO plan unlocks everything except cabinet mode", () => {
    const pro = PLAN_LIMITS.PRO;
    expect(pro.trainingPrograms).toBe("unlimited");
    expect(pro.evidences).toBe("unlimited");
    expect(pro.fullAuditExport).toBe(true);
    expect(pro.cabinetMode).toBe(false);
    expect(pro.advancedDashboard).toBe(true);
    expect(pro.emailReminders).toBe(true);
  });

  it("CABINET plan has all features including cabinet mode", () => {
    expect(PLAN_LIMITS.CABINET.cabinetMode).toBe(true);
  });
});

// ─── getPlanLimits ────────────────────────────────────────────────────────────

describe("getPlanLimits", () => {
  it("returns correct limits for each plan", () => {
    expect(getPlanLimits("FREE").trainingPrograms).toBe(1);
    expect(getPlanLimits("STARTER").trainingPrograms).toBe(5);
    expect(getPlanLimits("PRO").trainingPrograms).toBe("unlimited");
    expect(getPlanLimits("CABINET").trainingPrograms).toBe("unlimited");
  });
});

// ─── isWithinLimit ────────────────────────────────────────────────────────────

describe("isWithinLimit", () => {
  it("always returns true for unlimited", () => {
    expect(isWithinLimit("unlimited", 0)).toBe(true);
    expect(isWithinLimit("unlimited", 999999)).toBe(true);
  });

  it("returns true when used < limit", () => {
    expect(isWithinLimit(10, 9)).toBe(true);
    expect(isWithinLimit(10, 0)).toBe(true);
  });

  it("returns false when used === limit (strict less than)", () => {
    expect(isWithinLimit(10, 10)).toBe(false);
  });

  it("returns false when used > limit", () => {
    expect(isWithinLimit(10, 11)).toBe(false);
  });
});

// ─── assertPlanLimit ──────────────────────────────────────────────────────────

describe("assertPlanLimit", () => {
  it("throws when condition is false", () => {
    expect(() => assertPlanLimit(false)).toThrow();
  });

  it("throws with custom message", () => {
    expect(() => assertPlanLimit(false, "Plan insuffisant")).toThrow("Plan insuffisant");
  });

  it("does not throw when condition is true", () => {
    expect(() => assertPlanLimit(true)).not.toThrow();
  });
});

// ─── canCreateTrainingProgram ─────────────────────────────────────────────────

describe("canCreateTrainingProgram", () => {
  it("blocks FREE when already at limit (1)", () => {
    expect(canCreateTrainingProgram("FREE", 1)).toBe(false);
  });

  it("allows FREE when count is 0", () => {
    expect(canCreateTrainingProgram("FREE", 0)).toBe(true);
  });

  it("allows STARTER below limit of 5", () => {
    expect(canCreateTrainingProgram("STARTER", 4)).toBe(true);
  });

  it("blocks STARTER at limit of 5", () => {
    expect(canCreateTrainingProgram("STARTER", 5)).toBe(false);
  });

  it("always allows PRO (unlimited)", () => {
    expect(canCreateTrainingProgram("PRO", 10000)).toBe(true);
  });

  it("always allows CABINET (unlimited)", () => {
    expect(canCreateTrainingProgram("CABINET", 10000)).toBe(true);
  });
});

// ─── canCreateEvidence ────────────────────────────────────────────────────────

describe("canCreateEvidence", () => {
  it("blocks FREE at 10 evidences", () => {
    expect(canCreateEvidence("FREE", 10)).toBe(false);
  });

  it("allows FREE below 10", () => {
    expect(canCreateEvidence("FREE", 9)).toBe(true);
  });

  it("blocks STARTER at 100 evidences", () => {
    expect(canCreateEvidence("STARTER", 100)).toBe(false);
  });

  it("never blocks PRO", () => {
    expect(canCreateEvidence("PRO", 100000)).toBe(true);
  });
});

// ─── canGenerateDocument ──────────────────────────────────────────────────────

describe("canGenerateDocument", () => {
  it("blocks FREE at 3 docs/month", () => {
    expect(canGenerateDocument("FREE", 3)).toBe(false);
  });

  it("allows FREE below 3", () => {
    expect(canGenerateDocument("FREE", 2)).toBe(true);
  });

  it("never blocks PRO", () => {
    expect(canGenerateDocument("PRO", 10000)).toBe(true);
  });
});

// ─── canExportAuditFile ───────────────────────────────────────────────────────

describe("canExportAuditFile", () => {
  it("blocks FREE plan", () => {
    expect(canExportAuditFile("FREE")).toBe(false);
  });

  it("allows STARTER and above", () => {
    expect(canExportAuditFile("STARTER")).toBe(true);
    expect(canExportAuditFile("PRO")).toBe(true);
    expect(canExportAuditFile("CABINET")).toBe(true);
  });
});

// ─── canUseCabinetMode ────────────────────────────────────────────────────────

describe("canUseCabinetMode", () => {
  it("blocks all plans except CABINET", () => {
    expect(canUseCabinetMode("FREE")).toBe(false);
    expect(canUseCabinetMode("STARTER")).toBe(false);
    expect(canUseCabinetMode("PRO")).toBe(false);
  });

  it("allows CABINET plan only", () => {
    expect(canUseCabinetMode("CABINET")).toBe(true);
  });
});
