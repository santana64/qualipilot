import { average, findTopIndicatorGaps } from "@/domain/benchmark/benchmark";
import { statusToScore } from "@/domain/rnq/readiness";
import { prisma } from "@/lib/db";
import { getWorkspaceData } from "@/server/app-data";
import { resolveWorkspaceContextByUserId } from "@/server/rbac";

function overlap(left: string[], right: string[]) {
  const rightSet = new Set(right.map((item) => item.toLowerCase()));
  return left.some((item) => rightSet.has(item.toLowerCase()));
}

function sizeBand(count: number) {
  if (count <= 1) return "solo";
  if (count <= 5) return "small";
  return "structured";
}

export async function getBenchmarkData(userId: string) {
  const workspace = await resolveWorkspaceContextByUserId(userId);
  const data = await getWorkspaceData(workspace.workspaceUserId);
  const currentProfile = data.organization;
  const currentTrainingCount = data.trainingPrograms.length;
  const currentBand = sizeBand(currentTrainingCount);

  const profiles = await prisma.organizationProfile.findMany({
    where: { userId: { not: workspace.workspaceUserId } },
    include: {
      user: {
        include: {
          readinessSnapshots: { orderBy: { capturedAt: "desc" }, take: 1 },
          trainingPrograms: { select: { id: true } },
          indicatorProgress: { include: { indicator: true } },
        },
      },
    },
    take: 500,
  });

  const similar = profiles.filter((profile) => {
    const activityMatch = currentProfile ? overlap(currentProfile.activityTypes, profile.activityTypes) : true;
    return activityMatch && sizeBand(profile.user.trainingPrograms.length) === currentBand;
  });
  const fallback = similar.length >= 3 ? similar : profiles;
  const sample = fallback
    .map((profile) => ({
      profile,
      snapshot: profile.user.readinessSnapshots[0],
    }))
    .filter((item) => item.snapshot);

  const benchmarkScore = average(sample.map((item) => item.snapshot.globalReadinessScore));
  const benchmarkMissingEvidence = average(sample.map((item) => item.snapshot.missingEvidenceCount));
  const benchmarkOverdueActions = average(sample.map((item) => item.snapshot.overdueActionsCount));

  const indicatorAverages = new Map<number, number[]>();
  for (const peer of fallback) {
    for (const progress of peer.user.indicatorProgress) {
      const score = statusToScore(progress.status) ?? progress.readinessScore;
      const current = indicatorAverages.get(progress.indicator.number) ?? [];
      current.push(score);
      indicatorAverages.set(progress.indicator.number, current);
    }
  }

  const indicatorScores = data.indicatorRows
    .map((indicator) => {
      const peerAverage = average(indicatorAverages.get(indicator.number) ?? []);
      if (peerAverage === null) return null;
      return {
        indicatorNumber: indicator.number,
        title: indicator.title,
        currentScore: statusToScore(indicator.status) ?? indicator.readinessScore,
        benchmarkScore: peerAverage,
      };
    })
    .filter((item): item is NonNullable<typeof item> => Boolean(item));

  return {
    currentScore: data.globalReadinessScore,
    benchmarkScore,
    benchmarkMissingEvidence,
    benchmarkOverdueActions,
    sampleSize: sample.length,
    similarSampleSize: similar.length,
    sizeBand: currentBand,
    topIndicatorGaps: findTopIndicatorGaps(indicatorScores, 3),
    hasEnoughSimilarData: similar.length >= 3,
  };
}
