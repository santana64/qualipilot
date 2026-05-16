import { expect, test } from "@playwright/test";
import { seedAndAuthenticate } from "./helpers/auth";

test.describe("Dashboard", () => {
  test.beforeEach(async ({ context }) => {
    await seedAndAuthenticate(context);
  });

  test("accès au dashboard après authentification", async ({ page }) => {
    await page.goto("/app");
    await expect(page).not.toHaveURL(/login/);
    await expect(page.getByRole("heading", { name: /tableau de bord/i })).toBeVisible();
  });

  test("les 6 KPI cards sont visibles", async ({ page }) => {
    await page.goto("/app");
    await expect(page.getByText(/niveau de préparation/i)).toBeVisible();
    await expect(page.getByText(/indicateurs prêts/i)).toBeVisible();
    await expect(page.getByText(/indicateurs incomplets/i)).toBeVisible();
    await expect(page.getByText(/preuves manquantes/i)).toBeVisible();
    await expect(page.getByText(/actions en retard/i)).toBeVisible();
    await expect(page.getByText(/documents générés/i)).toBeVisible();
  });

  test("la section progression par critère affiche les 7 critères", async ({ page }) => {
    await page.goto("/app");
    await expect(page.getByText(/progression par critère/i)).toBeVisible();
    for (let i = 1; i <= 7; i++) {
      await expect(page.getByText(new RegExp(`critère ${i}`, "i"))).toBeVisible();
    }
  });

  test("le KPI indicateurs prêts renvoie vers le référentiel filtré", async ({ page }) => {
    await page.goto("/app");
    await page.getByText(/indicateurs prêts/i).click();
    await expect(page).toHaveURL(/\/app\/referentiel\?status=READY/);
  });

  test("le KPI preuves manquantes renvoie vers le référentiel filtré", async ({ page }) => {
    await page.goto("/app");
    await page.getByText(/preuves manquantes/i).click();
    await expect(page).toHaveURL(/\/app\/referentiel\?missing=1/);
  });

  test("le bouton exporter le dossier est présent", async ({ page }) => {
    await page.goto("/app");
    await expect(page.getByRole("link", { name: /exporter le dossier/i })).toBeVisible();
  });

  test("utilisateur non authentifié est redirigé vers login", async ({ page }) => {
    // New context without seed
    await page.goto("/app");
    await expect(page).toHaveURL(/\/login/);
  });
});
