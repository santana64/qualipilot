import { startOfDay, endOfDay } from "date-fns";
import { prisma } from "@/lib/db";

export async function recordDailyReadinessSnapshot(input: {
  userId: string;
  clientId?: string | null;
  globalReadinessScore: number;
  indicatorsReady: number;
  indicatorsIncomplete: number;
  missingEvidenceCount: number;
  overdueActionsCount: number;
}) {
  const today = new Date();
  const existing = await prisma.readinessSnapshot.findFirst({
    where: {
      userId: input.userId,
      clientId: input.clientId ?? null,
      capturedAt: {
        gte: startOfDay(today),
        lte: endOfDay(today),
      },
    },
    select: { id: true },
  });

  const data = {
    globalReadinessScore: input.globalReadinessScore,
    indicatorsReady: input.indicatorsReady,
    indicatorsIncomplete: input.indicatorsIncomplete,
    missingEvidenceCount: input.missingEvidenceCount,
    overdueActionsCount: input.overdueActionsCount,
    capturedAt: new Date(),
  };

  if (existing) {
    await prisma.readinessSnapshot.update({
      where: { id: existing.id },
      data,
    });
    return existing.id;
  }

  const created = await prisma.readinessSnapshot.create({
    data: {
      userId: input.userId,
      clientId: input.clientId ?? null,
      ...data,
    },
    select: { id: true },
  });
  return created.id;
}
