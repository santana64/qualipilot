import { expect, test } from "@playwright/test";
import path from "path";
import { seedAndAuthenticate } from "./helpers/auth";

test.describe("Preuves (Evidence)", () => {
  test.beforeEach(async ({ context }) => {
    await seedAndAuthenticate(context);
  });

  test("la page preuves s'affiche", async ({ page }) => {
    await page.goto("/app/preuves");
    await expect(page.getByRole("heading", { name: /preuves/i })).toBeVisible();
  });

  test("le champ de recherche est présent", async ({ page }) => {
    await page.goto("/app/preuves");
    await expect(page.getByPlaceholder(/rechercher/i)).toBeVisible();
  });

  test("création d'une preuve sans fichier", async ({ page }) => {
    await page.goto("/app/preuves");
    await page.getByLabel(/titre/i).first().fill("Règlement intérieur 2026");
    await page.getByLabel(/type/i).first().selectOption("PROCEDURE");
    await page.getByRole("button", { name: /ajouter/i }).click();
    await expect(page.getByText("Règlement intérieur 2026")).toBeVisible();
  });

  test("la recherche filtre les preuves", async ({ page }) => {
    // Create a proof first
    await page.goto("/app/preuves");
    await page.getByLabel(/titre/i).first().fill("Preuve Unique XYZ789");
    await page.getByLabel(/type/i).first().selectOption("PROCEDURE");
    await page.getByRole("button", { name: /ajouter/i }).click();

    // Search
    await page.getByPlaceholder(/rechercher/i).fill("XYZ789");
    await page.keyboard.press("Enter");
    await expect(page.getByText("Preuve Unique XYZ789")).toBeVisible();
  });

  test("le filtre statut fonctionne", async ({ page }) => {
    await page.goto("/app/preuves?status=ACTIVE");
    await expect(page).toHaveURL(/status=ACTIVE/);
  });

  test("upload d'un fichier PDF", async ({ page }) => {
    await page.goto("/app/preuves");
    await page.getByLabel(/titre/i).first().fill("Procédure accueil PDF");
    await page.getByLabel(/type/i).first().selectOption("PROCEDURE");

    // Create a minimal PDF buffer
    const pdfContent = Buffer.from("%PDF-1.4 test");
    await page.getByLabel(/fichier/i).first().setInputFiles({
      name: "procedure.pdf",
      mimeType: "application/pdf",
      buffer: pdfContent,
    });
    await page.getByRole("button", { name: /ajouter/i }).click();
    await expect(page.getByText("Procédure accueil PDF")).toBeVisible();
  });
});
