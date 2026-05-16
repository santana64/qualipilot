import { DEFAULT_RNQ_CRITERIA, DEFAULT_RNQ_INDICATORS } from "@/domain/rnq/default-referential";
import { prisma } from "@/lib/db";

export async function ensureReferentialSeeded() {
  const existing = await prisma.rnqIndicator.count();
  if (existing >= DEFAULT_RNQ_INDICATORS.length) return;

  await prisma.$transaction(async (tx) => {
    for (const criterion of DEFAULT_RNQ_CRITERIA) {
      await tx.rnqCriterion.upsert({
        where: { number: criterion.number },
        update: {
          title: criterion.title,
          description: criterion.description,
        },
        create: {
          number: criterion.number,
          title: criterion.title,
          description: criterion.description,
        },
      });
    }

    const criteria = await tx.rnqCriterion.findMany();
    const criterionIdByNumber = new Map(criteria.map((criterion) => [criterion.number, criterion.id]));

    for (const indicator of DEFAULT_RNQ_INDICATORS) {
      const criterionId = criterionIdByNumber.get(indicator.criterionNumber);
      if (!criterionId) continue;
      await tx.rnqIndicator.upsert({
        where: { number: indicator.number },
        update: {
          criterionId,
          title: indicator.title,
          shortDescription: indicator.shortDescription,
          expectedLevel: indicator.expectedLevel,
          evidenceExamples: indicator.evidenceExamples,
          applicableTo: indicator.applicableTo,
          riskLevel: indicator.riskLevel,
        },
        create: {
          number: indicator.number,
          criterionId,
          title: indicator.title,
          shortDescription: indicator.shortDescription,
          expectedLevel: indicator.expectedLevel,
          evidenceExamples: indicator.evidenceExamples,
          applicableTo: indicator.applicableTo,
          riskLevel: indicator.riskLevel,
        },
      });
    }
  });
}

export async function ensureUserIndicatorProgress(userId: string, clientId?: string | null) {
  await ensureReferentialSeeded();
  const indicators = await prisma.rnqIndicator.findMany({ select: { id: true } });
  const existing = await prisma.indicatorProgress.findMany({
    where: { userId, clientId: clientId ?? null },
    select: { indicatorId: true },
  });
  const existingIds = new Set(existing.map((item) => item.indicatorId));
  const missing = indicators.filter((indicator) => !existingIds.has(indicator.id));
  if (missing.length === 0) return;

  await prisma.indicatorProgress.createMany({
    data: missing.map((indicator) => ({
      userId,
      clientId: clientId ?? null,
      indicatorId: indicator.id,
      status: "NOT_STARTED",
      readinessScore: 0,
    })),
  });
}
