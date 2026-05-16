import { expect, test } from "@playwright/test";
import { seedAndAuthenticate } from "./helpers/auth";

test.describe("Formations", () => {
  test.beforeEach(async ({ context }) => {
    await seedAndAuthenticate(context);
  });

  test("la page formations s'affiche", async ({ page }) => {
    await page.goto("/app/formations");
    await expect(page.getByRole("heading", { name: /formations/i })).toBeVisible();
    await expect(page.getByRole("link", { name: /nouvelle formation/i })).toBeVisible();
  });

  test("le champ de recherche est visible", async ({ page }) => {
    await page.goto("/app/formations");
    await expect(page.getByPlaceholder(/rechercher une formation/i)).toBeVisible();
  });

  test("création d'une nouvelle formation", async ({ page }) => {
    await page.goto("/app/formations/new");
    await page.getByLabel(/titre/i).fill("Formation Sécurité Incendie");
    await page.getByLabel(/catégorie/i).fill("Sécurité");
    await page.getByRole("button", { name: /enregistrer|créer/i }).click();
    // Should redirect to formation detail or formations list
    await expect(page).not.toHaveURL(/\/new/);
  });

  test("la recherche filtre les formations", async ({ page }) => {
    // Create a formation first
    await page.goto("/app/formations/new");
    await page.getByLabel(/titre/i).fill("Formation Test Recherche ABC");
    await page.getByRole("button", { name: /enregistrer|créer/i }).click();

    // Search for it
    await page.goto("/app/formations");
    await page.getByPlaceholder(/rechercher une formation/i).fill("Test Recherche ABC");
    await page.getByRole("button", { name: /filtrer/i }).click();
    await expect(page.getByText("Formation Test Recherche ABC")).toBeVisible();
  });

  test("la recherche sans résultat affiche un état vide", async ({ page }) => {
    await page.goto("/app/formations?q=xyzinexistant999");
    await expect(page.getByText(/aucun résultat/i)).toBeVisible();
    await expect(page.getByText(/effacer les filtres/i)).toBeVisible();
  });

  test("le filtre par statut fonctionne", async ({ page }) => {
    await page.goto("/app/formations");
    const select = page.getByRole("combobox");
    await select.selectOption("DRAFT");
    await page.getByRole("button", { name: /filtrer/i }).click();
    await expect(page).toHaveURL(/status=DRAFT/);
  });

  test("l'import CSV est accessible depuis le menu", async ({ page }) => {
    await page.goto("/app/import");
    await expect(page.getByRole("heading", { name: /import/i })).toBeVisible();
  });
});
