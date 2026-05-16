import { describe, expect, it } from "vitest";
import { average, findTopIndicatorGaps } from "./benchmark";

describe("benchmark domain", () => {
  it("returns null for empty averages", () => {
    expect(average([])).toBeNull();
  });

  it("finds the largest anonymous indicator gaps", () => {
    const gaps = findTopIndicatorGaps([
      { indicatorNumber: 1, title: "A", currentScore: 80, benchmarkScore: 82 },
      { indicatorNumber: 2, title: "B", currentScore: 20, benchmarkScore: 75 },
      { indicatorNumber: 3, title: "C", currentScore: 60, benchmarkScore: 90 },
    ]);

    expect(gaps.map((gap) => gap.indicatorNumber)).toEqual([2, 3, 1]);
  });
});
