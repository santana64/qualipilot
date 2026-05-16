export type AuditVerdict = "READY" | "WARNING" | "AT_RISK" | "CRITICAL";

export type SimulationIndicatorSeed = {
  id: string;
  number: number;
  criterionNumber: number;
  title: string;
  expectedLevel: string;
  evidenceExamples: string[];
  riskLevel: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  status: string;
  readinessScore: number;
  evidenceCount: number;
  actionCount: number;
};

const riskWeight: Record<SimulationIndicatorSeed["riskLevel"], number> = {
  CRITICAL: 4,
  HIGH: 3,
  MEDIUM: 2,
  LOW: 1,
};

export function verdictFromScore(score: number): AuditVerdict {
  if (score >= 85) return "READY";
  if (score >= 60) return "WARNING";
  if (score >= 30) return "AT_RISK";
  return "CRITICAL";
}

export function selectSimulationIndicators(indicators: SimulationIndicatorSeed[], maxCount = 12) {
  return [...indicators]
    .filter((indicator) => indicator.status !== "NOT_APPLICABLE")
    .sort((left, right) => {
      const riskDelta = riskWeight[right.riskLevel] - riskWeight[left.riskLevel];
      if (riskDelta !== 0) return riskDelta;
      const missingEvidenceDelta = Number(left.evidenceCount > 0) - Number(right.evidenceCount > 0);
      if (missingEvidenceDelta !== 0) return missingEvidenceDelta;
      return left.readinessScore - right.readinessScore;
    })
    .slice(0, maxCount);
}

export function buildAuditorQuestion(indicator: SimulationIndicatorSeed, persona: string) {
  const evidence = indicator.evidenceExamples.slice(0, 4).join(", ") || "tout element de preuve equivalent";
  return [
    `${persona} - indicateur ${indicator.number}.`,
    `Montrez comment votre organisme atteint le niveau attendu suivant : ${indicator.expectedLevel}`,
    `Expliquez votre pratique actuelle, les documents disponibles, leur date de mise a jour, le responsable et la facon dont vous prouvez l'application concrete.`,
    `Elements de preuve attendus a confronter : ${evidence}.`,
  ].join(" ");
}

export function calculateSessionScore(scores: Array<number | null | undefined>) {
  const usableScores = scores.filter((score): score is number => typeof score === "number" && Number.isFinite(score));
  if (usableScores.length === 0) return 0;
  return Math.round(usableScores.reduce((sum, score) => sum + score, 0) / usableScores.length);
}
