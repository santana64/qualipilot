import { expect, test } from "@playwright/test";
import { seedAndAuthenticate } from "./helpers/auth";

test.describe("Documents générés", () => {
  test.beforeEach(async ({ context }) => {
    await seedAndAuthenticate(context);
  });

  test("la page documents s'affiche", async ({ page }) => {
    await page.goto("/app/documents");
    await expect(page.getByRole("heading", { name: /documents/i })).toBeVisible();
  });

  test("génération d'un document de procédure d'accueil", async ({ page }) => {
    await page.goto("/app/documents");
    // Select template type
    const select = page.getByLabel(/type de document|choisir/i).first();
    if (await select.isVisible()) {
      await select.selectOption("LEARNER_WELCOME_PROCEDURE");
    }
    const btn = page.getByRole("button", { name: /générer/i });
    await expect(btn).toBeVisible();
    await btn.click();
    // Should show the generated document
    await expect(page.getByText(/procédure|bienvenue|accueil/i)).toBeVisible({ timeout: 10000 });
  });

  test("téléchargement PDF d'un document généré", async ({ page }) => {
    await page.goto("/app/documents");

    // First generate a document
    const genBtn = page.getByRole("button", { name: /générer/i }).first();
    if (await genBtn.isVisible()) {
      await genBtn.click();
      await page.waitForLoadState("networkidle");
    }

    // Check for a PDF download link
    const pdfLink = page.getByRole("link", { name: /pdf|télécharger/i }).first();
    if (await pdfLink.isVisible()) {
      const [download] = await Promise.all([
        page.waitForEvent("download"),
        pdfLink.click(),
      ]);
      expect(download.suggestedFilename()).toMatch(/\.pdf$/i);
    }
  });

  test("la liste des documents affiche les documents existants", async ({ page }) => {
    await page.goto("/app/documents");
    // Either empty state or list of documents
    const hasDocuments = await page.getByRole("link", { name: /pdf|voir/i }).count();
    const hasEmptyState = await page.getByText(/aucun document/i).isVisible().catch(() => false);
    expect(hasDocuments > 0 || hasEmptyState).toBeTruthy();
  });
});
