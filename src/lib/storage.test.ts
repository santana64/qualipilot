import { describe, expect, it } from "vitest";
import { assertAllowedEvidenceUpload, cleanEvidenceFileName, toBlobStorageKey } from "@/lib/storage";

describe("evidence storage helpers", () => {
  it("keeps blob storage keys distinguishable from local paths", () => {
    expect(toBlobStorageKey("evidence/user-1/pending/file.pdf")).toBe("vercel-blob:evidence/user-1/pending/file.pdf");
  });

  it("sanitizes uploaded file names", () => {
    expect(cleanEvidenceFileName("../contrat qualite <2026>.pdf")).toBe("contrat qualite _2026_.pdf");
  });

  it("rejects unsupported proof file types", () => {
    expect(() => assertAllowedEvidenceUpload({ size: 100, type: "application/x-msdownload" })).toThrow(
      "Type de fichier non autorise",
    );
  });
});
