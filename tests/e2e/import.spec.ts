import { expect, test } from "@playwright/test";
import { seedAndAuthenticate } from "./helpers/auth";

const VALID_CSV = `titre,categorie,publicCible,objectifs,duree,modalite,prerequis,prixEuros,lieu,statut
Formation Securite Import,Securite,Tout public,Maitriser les consignes de securite,7h,Presentiel,,150,Paris,DRAFT
Formation Hygiene Import,Hygiene,Restauration,Respecter les normes HACCP,14h,Presentiel,,250,Lyon,DRAFT`;

test.describe("Import CSV", () => {
  test.beforeEach(async ({ context }) => {
    await seedAndAuthenticate(context);
  });

  test("la page import s'affiche avec les instructions", async ({ page }) => {
    await page.goto("/app/import");
    await expect(page.getByRole("heading", { name: /import csv/i })).toBeVisible();
    await expect(page.getByText(/colonnes attendues/i)).toBeVisible();
  });

  test("import d'un fichier CSV valide cree les formations", async ({ page }) => {
    await page.goto("/app/import");
    await page.getByLabel(/fichier/i).setInputFiles({
      name: "formations.csv",
      mimeType: "text/csv",
      buffer: Buffer.from(VALID_CSV, "utf-8"),
    });

    await page.getByRole("button", { name: /importer/i }).click();
    await expect(page.getByText(/2 formation\(s\) importee\(s\)/i)).toBeVisible({ timeout: 10000 });
  });

  test("import avec un fichier non-CSV affiche une erreur", async ({ page }) => {
    await page.goto("/app/import");
    await page.getByLabel(/fichier/i).setInputFiles({
      name: "document.pdf",
      mimeType: "application/pdf",
      buffer: Buffer.from("%PDF-1.4"),
    });

    await page.getByRole("button", { name: /importer/i }).click();
    await expect(page.getByText(/format invalide/i)).toBeVisible({ timeout: 5000 });
  });

  test("les formations importees apparaissent dans la liste", async ({ page }) => {
    await page.goto("/app/import");
    await page.getByLabel(/fichier/i).setInputFiles({
      name: "formations.csv",
      mimeType: "text/csv",
      buffer: Buffer.from(VALID_CSV, "utf-8"),
    });

    await page.getByRole("button", { name: /importer/i }).click();
    await page.waitForLoadState("networkidle");

    await page.goto("/app/formations?q=Securite+Import");
    await expect(page.getByRole("link", { name: /Formation Securite Import/i })).toBeVisible({ timeout: 10000 });
  });
});
