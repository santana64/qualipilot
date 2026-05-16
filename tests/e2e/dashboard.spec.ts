import { expect, test } from "@playwright/test";
import { seedAndAuthenticate } from "./helpers/auth";

test.describe("Dashboard", () => {
  test.beforeEach(async ({ context }) => {
    await seedAndAuthenticate(context);
  });

  test("acces au dashboard apres authentification", async ({ page }) => {
    await page.goto("/app");
    await expect(page).not.toHaveURL(/login/);
    await expect(page.getByRole("heading", { name: /tableau de bord/i })).toBeVisible();
  });

  test("les 6 KPI cards sont visibles", async ({ page }) => {
    await page.goto("/app");
    await expect(page.locator('main a[href="/app/historique"]')).toBeVisible();
    await expect(page.locator('main a[href="/app/referentiel?status=READY"]')).toBeVisible();
    await expect(page.locator('main a[href="/app/referentiel?status=IN_PROGRESS"]')).toBeVisible();
    await expect(page.locator('main a[href="/app/referentiel?missing=1"]').first()).toBeVisible();
    await expect(page.locator('main a[href="/app/actions?overdue=1"]')).toBeVisible();
    await expect(page.locator('main a[href="/app/documents"]').last()).toBeVisible();
  });

  test("la section progression par critere affiche les 7 criteres", async ({ page }) => {
    await page.goto("/app");
    await expect(page.getByRole("heading", { name: /progression par critere|progression par critère/i })).toBeVisible();
    for (let i = 1; i <= 7; i += 1) {
      await expect(page.getByRole("link", { name: new RegExp(`crit.+re ${i}`, "i") })).toBeVisible();
    }
  });

  test("le KPI indicateurs prets renvoie vers le referentiel filtre", async ({ page }) => {
    await page.goto("/app");
    await page.locator('main a[href="/app/referentiel?status=READY"]').click();
    await expect(page).toHaveURL(/\/app\/referentiel\?status=READY/);
  });

  test("le KPI preuves manquantes renvoie vers le referentiel filtre", async ({ page }) => {
    await page.goto("/app");
    await page.locator('main a[href="/app/referentiel?missing=1"]').first().click();
    await expect(page).toHaveURL(/\/app\/referentiel\?missing=1/);
  });

  test("le bouton exporter le dossier est present", async ({ page }) => {
    await page.goto("/app");
    await expect(page.getByRole("link", { name: /exporter le dossier/i })).toBeVisible();
  });

  test("utilisateur non authentifie est redirige vers login", async ({ page }) => {
    await page.context().clearCookies();
    await page.goto("/app");
    await expect(page).toHaveURL(/\/login/);
  });
});
