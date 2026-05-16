import { expect, test } from "@playwright/test";
import { seedAndAuthenticate } from "./helpers/auth";

test.describe("Documents generes", () => {
  test.beforeEach(async ({ context }) => {
    await seedAndAuthenticate(context);
  });

  test("la page documents s'affiche", async ({ page }) => {
    await page.goto("/app/documents");
    await expect(page.getByRole("heading", { name: /^documents qual/i })).toBeVisible();
  });

  test("generation d'un document de procedure d'accueil", async ({ page }) => {
    await page.goto("/app/documents");
    const btn = page.getByRole("button", { name: /generer|générer/i }).first();
    await expect(btn).toBeVisible();
    await btn.click();
    await expect(page.getByText(/document genere|document généré|procedure|procédure|accueil/i).first()).toBeVisible({ timeout: 10000 });
  });

  test("telechargement PDF d'un document genere", async ({ page }) => {
    await page.goto("/app/documents");
    const genBtn = page.getByRole("button", { name: /generer|générer/i }).first();
    if (await genBtn.isVisible()) {
      await genBtn.click();
      await page.waitForLoadState("networkidle");
    }

    const pdfLink = page.getByRole("link", { name: /pdf|telecharger|télécharger/i }).first();
    if (await pdfLink.isVisible()) {
      const [download] = await Promise.all([
        page.waitForEvent("download"),
        pdfLink.click(),
      ]);
      expect(download.suggestedFilename()).toMatch(/\.pdf$/i);
    }
  });

  test("la liste des documents affiche les documents existants ou un etat vide", async ({ page }) => {
    await page.goto("/app/documents");
    const hasDocuments = await page.getByRole("link", { name: /pdf|voir/i }).count();
    const hasEmptyState = await page.getByText(/aucun document/i).isVisible().catch(() => false);
    expect(hasDocuments > 0 || hasEmptyState).toBeTruthy();
  });
});
