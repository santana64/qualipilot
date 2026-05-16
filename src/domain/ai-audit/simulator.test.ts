import { describe, expect, it } from "vitest";
import { buildAuditorQuestion, calculateSessionScore, selectSimulationIndicators, verdictFromScore } from "./simulator";

const base = {
  id: "i",
  criterionNumber: 1,
  expectedLevel: "Niveau attendu",
  evidenceExamples: ["preuve 1"],
  status: "IN_PROGRESS",
  actionCount: 0,
};

describe("AI audit simulator domain", () => {
  it("maps scores to cautious audit verdicts", () => {
    expect(verdictFromScore(92)).toBe("READY");
    expect(verdictFromScore(70)).toBe("WARNING");
    expect(verdictFromScore(45)).toBe("AT_RISK");
    expect(verdictFromScore(12)).toBe("CRITICAL");
  });

  it("prioritizes critical indicators with missing evidence", () => {
    const selected = selectSimulationIndicators([
      { ...base, id: "low", number: 1, title: "Low", riskLevel: "LOW", readinessScore: 20, evidenceCount: 0 },
      { ...base, id: "critical-covered", number: 2, title: "Critical covered", riskLevel: "CRITICAL", readinessScore: 85, evidenceCount: 1 },
      { ...base, id: "critical-missing", number: 3, title: "Critical missing", riskLevel: "CRITICAL", readinessScore: 40, evidenceCount: 0 },
    ]);

    expect(selected[0].id).toBe("critical-missing");
  });

  it("builds a concrete auditor question", () => {
    const question = buildAuditorQuestion(
      { ...base, id: "x", number: 7, title: "Question", riskLevel: "HIGH", readinessScore: 40, evidenceCount: 0 },
      "AFNOR",
    );

    expect(question).toContain("indicateur 7");
    expect(question).toContain("Niveau attendu");
  });

  it("averages answered question scores only", () => {
    expect(calculateSessionScore([100, null, 60])).toBe(80);
  });
});
