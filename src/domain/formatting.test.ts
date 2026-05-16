import { describe, expect, it } from "vitest";
import { formatFrenchDate, formatMoney, formatPercent } from "./formatting";

describe("formatting", () => {
  it("formats French dates", () => {
    expect(formatFrenchDate(new Date("2026-05-02"))).toContain("2026");
  });

  it("formats percentages and money", () => {
    expect(formatPercent(82.4)).toBe("82 %");
    expect(formatMoney(2900)).toContain("29");
  });
});
