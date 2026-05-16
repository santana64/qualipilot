import { expect, test } from "@playwright/test";
import { seedAndAuthenticate } from "./helpers/auth";

const VALID_CSV = `titre,categorie,publicCible,objectifs,duree,modalite,prerequis,prixEuros,lieu,statut
Formation Sécurité Import,Sécurité,Tout public,Maîtriser les consignes de sécurité,7h,Présentiel,,150,Paris,DRAFT
Formation Hygiène Import,Hygiène,Restauration,Respecter les normes HACCP,14h,Présentiel,,250,Lyon,DRAFT`;

test.describe("Import CSV", () => {
  test.beforeEach(async ({ context }) => {
    await seedAndAuthenticate(context);
  });

  test("la page import s'affiche avec les instructions", async ({ page }) => {
    await page.goto("/app/import");
    await expect(page.getByRole("heading", { name: /import/i })).toBeVisible();
    await expect(page.getByText(/csv/i)).toBeVisible();
  });

  test("import d'un fichier CSV valide crée les formations", async ({ page }) => {
    await page.goto("/app/import");

    await page.getByLabel(/fichier/i).setInputFiles({
      name: "formations.csv",
      mimeType: "text/csv",
      buffer: Buffer.from(VALID_CSV, "utf-8"),
    });

    await page.getByRole("button", { name: /importer/i }).click();

    // Should show success
    await expect(page.getByText(/import[eé]|cr[eé][eé]|success/i)).toBeVisible({ timeout: 10000 });
  });

  test("import avec un fichier non-CSV affiche une erreur", async ({ page }) => {
    await page.goto("/app/import");

    await page.getByLabel(/fichier/i).setInputFiles({
      name: "document.pdf",
      mimeType: "application/pdf",
      buffer: Buffer.from("%PDF-1.4"),
    });

    await page.getByRole("button", { name: /importer/i }).click();
    await expect(page.getByText(/erreur|invalide|format/i)).toBeVisible({ timeout: 5000 });
  });

  test("les formations importées apparaissent dans la liste", async ({ page }) => {
    await page.goto("/app/import");

    await page.getByLabel(/fichier/i).setInputFiles({
      name: "formations.csv",
      mimeType: "text/csv",
      buffer: Buffer.from(VALID_CSV, "utf-8"),
    });

    await page.getByRole("button", { name: /importer/i }).click();
    await page.waitForLoadState("networkidle");

    await page.goto("/app/formations?q=S%C3%A9curit%C3%A9+Import");
    await expect(page.getByText(/Formation Sécurité Import/i)).toBeVisible({ timeout: 10000 });
  });
});
