import { expect, test } from "@playwright/test";
import { seedAndAuthenticate } from "./helpers/auth";

test.describe("Cockpit Audit", () => {
  test.beforeEach(async ({ context }) => {
    await seedAndAuthenticate(context);
  });

  test("la page audit s'affiche", async ({ page }) => {
    await page.goto("/app/audit");
    await expect(page.getByRole("heading", { name: /audit/i })).toBeVisible();
  });

  test("la page d'export audit s'affiche et contient les sections clés", async ({ page }) => {
    await page.goto("/app/audit/export");
    await expect(page.getByText(/organisme|organisation/i)).toBeVisible();
    await expect(page.getByText(/score|préparation/i)).toBeVisible();
  });

  test("le téléchargement PDF du dossier audit fonctionne", async ({ page }) => {
    await page.goto("/app/audit/export");
    const pdfBtn = page.getByRole("link", { name: /pdf|télécharger/i }).first();
    if (await pdfBtn.isVisible()) {
      const [download] = await Promise.all([
        page.waitForEvent("download"),
        pdfBtn.click(),
      ]);
      expect(download.suggestedFilename()).toMatch(/\.pdf$/i);
    }
  });

  test("le lien de partage auditeur est accessible", async ({ page }) => {
    await page.goto("/app/audit");
    const shareBtn = page.getByRole("button", { name: /partager|lien auditeur/i });
    if (await shareBtn.isVisible()) {
      await shareBtn.click();
      await expect(page.getByText(/lien|partage/i)).toBeVisible();
    }
  });
});

test.describe("Lien de partage auditeur public", () => {
  test("un token invalide affiche une erreur", async ({ page }) => {
    await page.goto("/audit-share/tokenInvalide123");
    await expect(page.getByText(/invalide|introuvable|expir[eé]/i)).toBeVisible();
  });
});
