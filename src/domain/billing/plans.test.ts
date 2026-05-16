import { describe, expect, it } from "vitest";
import { canCreateEvidence, canCreateTrainingProgram, canExportAuditFile, canGenerateDocument, getPlanLimits } from "./plans";

describe("billing plans", () => {
  it("returns plan limits", () => {
    expect(getPlanLimits("FREE").trainingPrograms).toBe(1);
    expect(getPlanLimits("PRO").evidences).toBe("unlimited");
  });

  it("blocks free full audit export and allows pro export", () => {
    expect(canExportAuditFile("FREE")).toBe(false);
    expect(canExportAuditFile("PRO")).toBe(true);
  });

  it("enforces creation limits", () => {
    expect(canCreateTrainingProgram("FREE", 1)).toBe(false);
    expect(canCreateEvidence("STARTER", 99)).toBe(true);
    expect(canGenerateDocument("FREE", 3)).toBe(false);
  });
});
