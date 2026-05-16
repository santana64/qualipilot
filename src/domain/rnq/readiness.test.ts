import { describe, expect, it } from "vitest";
import {
  calculateCriterionReadiness,
  calculateGlobalReadiness,
  evaluateAuditExportReadiness,
  evaluateTrainingProgramCompleteness,
  getExpiredEvidence,
  getMissingEvidence,
  getOverdueActions,
} from "./readiness";

describe("RNQ readiness", () => {
  it("calculates global readiness and excludes not applicable indicators", () => {
    expect(
      calculateGlobalReadiness([
        { status: "READY" },
        { status: "VALIDATED" },
        { status: "NOT_APPLICABLE" },
      ]),
    ).toBe(93);
  });

  it("calculates criterion readiness", () => {
    expect(
      calculateCriterionReadiness({ number: 1 }, [
        { criterionNumber: 1, status: "READY" },
        { criterionNumber: 1, status: "IN_PROGRESS" },
        { criterionNumber: 2, status: "VALIDATED" },
      ]),
    ).toBe(63);
  });

  it("detects missing evidence", () => {
    const missing = getMissingEvidence(
      [
        { id: "i1", number: 1, title: "Info", riskLevel: "HIGH" },
        { id: "i2", number: 2, title: "Objectifs", riskLevel: "LOW" },
      ],
      [{ id: "e1", title: "Brochure", status: "ACTIVE" }],
      [{ evidenceId: "e1", indicatorId: "i1" }],
    );
    expect(missing.map((item) => item.id)).toEqual(["i2"]);
  });

  it("detects expired evidence and overdue actions", () => {
    const now = new Date("2026-05-02");
    expect(getExpiredEvidence([{ id: "e1", title: "Ancienne preuve", validityDate: "2026-01-01" }], now)).toHaveLength(1);
    expect(
      getOverdueActions(
        [
          { id: "a1", title: "Retard", status: "TODO", dueDate: "2026-04-01" },
          { id: "a2", title: "Terminé", status: "DONE", dueDate: "2026-04-01" },
        ],
        now,
      ),
    ).toHaveLength(1);
  });

  it("evaluates training program completeness", () => {
    const result = evaluateTrainingProgramCompleteness({
      title: "Formation",
      publicTarget: "Formateurs",
      objectives: "Animer",
      duration: "7h",
      modalities: "Présentiel",
      teachingMethods: "Atelier",
      evaluationMethods: "Quiz",
    });
    expect(result.isComplete).toBe(false);
    expect(result.missingFields).toContain("Information handicap/accessibilité");
  });

  it("evaluates audit export readiness", () => {
    expect(
      evaluateAuditExportReadiness({
        organizationComplete: true,
        globalReadinessScore: 88,
        missingEvidenceCount: 0,
        overdueActionsCount: 0,
        generatedDocumentsCount: 2,
        trainingProgramsCount: 1,
      }).ready,
    ).toBe(true);
  });
});
