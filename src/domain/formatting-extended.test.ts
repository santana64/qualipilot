import { describe, expect, it } from "vitest";
import { formatFrenchDate, formatShortFrenchDate, formatPercent, formatMoney } from "./formatting";

describe("formatFrenchDate", () => {
  it("formats a valid date in full French format", () => {
    expect(formatFrenchDate("2026-01-15")).toBe("15 janvier 2026");
  });

  it("formats a Date object", () => {
    expect(formatFrenchDate(new Date("2026-06-01"))).toBe("1 juin 2026");
  });

  it("returns 'Non renseigné' for null", () => {
    expect(formatFrenchDate(null)).toBe("Non renseigné");
  });

  it("returns 'Non renseigné' for undefined", () => {
    expect(formatFrenchDate(undefined)).toBe("Non renseigné");
  });

  it("returns 'Date invalide' for an invalid date string", () => {
    expect(formatFrenchDate("not-a-date")).toBe("Date invalide");
  });
});

describe("formatShortFrenchDate", () => {
  it("formats a valid date as dd/MM/yyyy", () => {
    expect(formatShortFrenchDate("2026-01-05")).toBe("05/01/2026");
  });

  it("zero-pads day and month", () => {
    expect(formatShortFrenchDate("2026-03-09")).toBe("09/03/2026");
  });

  it("returns 'Non renseigné' for null", () => {
    expect(formatShortFrenchDate(null)).toBe("Non renseigné");
  });

  it("returns 'Date invalide' for garbage input", () => {
    expect(formatShortFrenchDate("garbage")).toBe("Date invalide");
  });
});

describe("formatPercent", () => {
  it("rounds and appends the % symbol with space", () => {
    expect(formatPercent(75)).toBe("75 %");
    expect(formatPercent(0)).toBe("0 %");
    expect(formatPercent(100)).toBe("100 %");
  });

  it("rounds decimal values", () => {
    expect(formatPercent(62.7)).toBe("63 %");
    expect(formatPercent(62.4)).toBe("62 %");
  });
});

describe("formatMoney", () => {
  it("formats cents as euros in French locale", () => {
    const result = formatMoney(4900);
    expect(result).toContain("49");
    expect(result).toContain("€");
  });

  it("formats 0 cents as 0 euros", () => {
    const result = formatMoney(0);
    expect(result).toContain("0");
    expect(result).toContain("€");
  });

  it("returns 'Non renseigné' for null", () => {
    expect(formatMoney(null)).toBe("Non renseigné");
  });

  it("returns 'Non renseigné' for undefined", () => {
    expect(formatMoney(undefined)).toBe("Non renseigné");
  });

  it("handles large amounts correctly", () => {
    const result = formatMoney(100000); // 1000 €
    expect(result).toContain("1");
    expect(result).toContain("€");
  });
});
