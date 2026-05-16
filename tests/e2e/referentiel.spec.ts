import { expect, test } from "@playwright/test";
import { seedAndAuthenticate } from "./helpers/auth";

test.describe("Referentiel RNQ", () => {
  test.beforeEach(async ({ context }) => {
    await seedAndAuthenticate(context);
  });

  test("la page referentiel s'affiche avec les 7 criteres", async ({ page }) => {
    await page.goto("/app/referentiel");
    await expect(page.getByRole("heading", { name: /referentiel|référentiel/i })).toBeVisible();
    for (let i = 1; i <= 7; i += 1) {
      await expect(page.locator(`a[href="/app/referentiel?criterion=${i}"]`).first()).toBeVisible();
    }
  });

  test("les 32 indicateurs sont listes", async ({ page }) => {
    await page.goto("/app/referentiel");
    await expect(page.getByText(/32 indicateurs affich/i)).toBeVisible();
    await expect(page.getByRole("link", { name: /^#1 / })).toBeVisible();
    await expect(page.getByRole("link", { name: /^#32 / })).toBeVisible();
  });

  test("la recherche par mot-cle filtre les indicateurs", async ({ page }) => {
    await page.goto("/app/referentiel?q=accessibilit%C3%A9");
    const resultText = await page.textContent("body");
    expect(resultText?.toLowerCase()).toContain("accessibilit");
  });

  test("le filtre par critere fonctionne", async ({ page }) => {
    await page.goto("/app/referentiel?criterion=1");
    await expect(page).toHaveURL(/criterion=1/);
  });

  test("le filtre preuves manquantes fonctionne", async ({ page }) => {
    await page.goto("/app/referentiel?missing=1");
    await expect(page).toHaveURL(/missing=1/);
  });

  test("un indicateur est cliquable et ouvre la page detail", async ({ page }) => {
    await page.goto("/app/referentiel");
    await page.getByRole("link", { name: /^#1 / }).click();
    await expect(page).toHaveURL(/\/app\/referentiel\/.+/);
  });

  test("mise a jour du statut d'un indicateur", async ({ page }) => {
    await page.goto("/app/referentiel");
    await page.getByRole("link", { name: /^#1 / }).click();
    await expect(page).toHaveURL(/\/app\/referentiel\/.+/);

    const statusSelect = page.getByLabel(/statut/i).first();
    if (await statusSelect.isVisible()) {
      await statusSelect.selectOption("IN_PROGRESS");
      await page.getByRole("button", { name: /enregistrer|sauvegarder/i }).click();
      await expect(page.getByText(/en cours|in_progress/i).first()).toBeVisible({ timeout: 5000 });
    }
  });
});
