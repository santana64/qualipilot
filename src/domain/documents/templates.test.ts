import { describe, expect, it } from "vitest";
import { QUALIPILOT_DISCLAIMER, generateAuditSummary, generateFullAuditFile } from "./templates";

const input = {
  organization: {
    organizationName: "Organisme Test",
    address: "1 rue Test",
    city: "Paris",
  },
  audit: {
    type: "INITIAL",
    scheduledDate: new Date("2026-06-01"),
    readinessScore: 86,
  },
  indicators: [{ number: 1, title: "Information publique", status: "READY", score: 85 }],
  evidences: [{ title: "Brochure", type: "PROGRAM", indicators: [1] }],
};

describe("document generation", () => {
  it("generates audit summary with organization, score and disclaimer", () => {
    const doc = generateAuditSummary(input);
    expect(doc.contentText).toContain("Organisme Test");
    expect(doc.contentText).toContain("86 %");
    expect(doc.contentText).toContain(QUALIPILOT_DISCLAIMER);
  });

  it("generates full audit file with indicators and evidence", () => {
    const doc = generateFullAuditFile(input);
    expect(doc.contentText).toContain("Information publique");
    expect(doc.contentText).toContain("Brochure");
  });
});
