export type BenchmarkIndicatorScore = {
  indicatorNumber: number;
  title: string;
  currentScore: number;
  benchmarkScore: number;
};

export function average(numbers: number[]) {
  if (numbers.length === 0) return null;
  return Math.round(numbers.reduce((sum, value) => sum + value, 0) / numbers.length);
}

export function findTopIndicatorGaps(scores: BenchmarkIndicatorScore[], maxCount = 3) {
  return [...scores]
    .map((score) => ({
      ...score,
      gap: score.benchmarkScore - score.currentScore,
    }))
    .filter((score) => score.gap > 0)
    .sort((left, right) => right.gap - left.gap)
    .slice(0, maxCount);
}
