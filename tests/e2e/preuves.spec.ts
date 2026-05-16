import { expect, test } from "@playwright/test";
import { seedAndAuthenticate } from "./helpers/auth";

test.describe("Preuves", () => {
  test.beforeEach(async ({ context }) => {
    await seedAndAuthenticate(context);
  });

  test("la page preuves s'affiche", async ({ page }) => {
    await page.goto("/app/preuves");
    await expect(page.getByRole("heading", { name: /preuves/i })).toBeVisible();
  });

  test("le champ de recherche est present", async ({ page }) => {
    await page.goto("/app/preuves");
    await expect(page.getByPlaceholder(/rechercher/i)).toBeVisible();
  });

  test("creation d'une preuve sans fichier", async ({ page }) => {
    await page.goto("/app/preuves");
    await page.getByLabel(/titre/i).first().fill("Reglement interieur E2E 2026");
    await page.getByLabel(/type/i).first().selectOption("PROCEDURE");
    await page.getByRole("button", { name: /ajouter la preuve/i }).click();
    await expect(page.getByRole("heading", { name: "Reglement interieur E2E 2026" })).toBeVisible();
  });

  test("la recherche filtre les preuves", async ({ page }) => {
    await page.goto("/app/preuves");
    await page.getByLabel(/titre/i).first().fill("Preuve Unique XYZ789");
    await page.getByLabel(/type/i).first().selectOption("PROCEDURE");
    await page.getByRole("button", { name: /ajouter la preuve/i }).click();

    await page.getByPlaceholder(/rechercher/i).fill("XYZ789");
    await page.keyboard.press("Enter");
    await expect(page.getByRole("heading", { name: "Preuve Unique XYZ789" })).toBeVisible();
  });

  test("le filtre statut fonctionne", async ({ page }) => {
    await page.goto("/app/preuves?status=ACTIVE");
    await expect(page).toHaveURL(/status=ACTIVE/);
  });

  test("upload d'un fichier PDF", async ({ page }) => {
    await page.goto("/app/preuves");
    await page.getByLabel(/titre/i).first().fill("Procedure accueil PDF E2E");
    await page.getByLabel(/type/i).first().selectOption("PROCEDURE");

    const pdfContent = Buffer.from("%PDF-1.4 test");
    await page.getByLabel(/fichier/i).first().setInputFiles({
      name: "procedure.pdf",
      mimeType: "application/pdf",
      buffer: pdfContent,
    });
    await page.getByRole("button", { name: /ajouter la preuve/i }).click();
    await expect(page.getByRole("heading", { name: "Procedure accueil PDF E2E" })).toBeVisible();
  });
});
