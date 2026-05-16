import { expect, type Page, test } from "@playwright/test";
import { seedAndAuthenticate } from "./helpers/auth";

async function fillMinimalTraining(page: Page, title: string) {
  await page.getByLabel(/intitul|titre/i).fill(title);
  await page.getByRole("textbox", { name: /^cat/i }).fill("Securite");
  await page.getByLabel(/public/i).fill("Tout public");
  await page.getByLabel(/objectifs/i).fill("Maitriser les objectifs operationnels de la formation.");
  await page.getByLabel(/dur/i).fill("7h");
  await page.getByLabel(/modalit/i).fill("Presentiel");
  await page.getByLabel(/m.+thodes p.+dagogiques|methodes pedagogiques/i).fill("Apports, exercices et cas pratiques.");
  await page.getByLabel(/m.+thodes d.+valuation|methodes d.evaluation/i).fill("Quiz et mise en situation.");
}

test.describe("Formations", () => {
  test.beforeEach(async ({ context }) => {
    await seedAndAuthenticate(context);
  });

  test("la page formations s'affiche", async ({ page }) => {
    await page.goto("/app/formations");
    await expect(page.getByRole("heading", { name: /^formations$/i })).toBeVisible();
    await expect(page.getByRole("link", { name: /nouvelle formation/i })).toBeVisible();
  });

  test("le champ de recherche est visible", async ({ page }) => {
    await page.goto("/app/formations");
    await expect(page.getByPlaceholder(/rechercher une formation/i)).toBeVisible();
  });

  test("creation d'une nouvelle formation", async ({ page }) => {
    await page.goto("/app/formations/new");
    await fillMinimalTraining(page, "Formation Securite Incendie");
    await page.getByRole("button", { name: /enregistrer|creer|créer/i }).click();
    await expect(page).not.toHaveURL(/\/new/);
  });

  test("la recherche filtre les formations", async ({ page }) => {
    await page.goto("/app/formations/new");
    await fillMinimalTraining(page, "Formation Test Recherche ABC");
    await page.getByRole("button", { name: /enregistrer|creer|créer/i }).click();

    await page.goto("/app/formations");
    await page.getByPlaceholder(/rechercher une formation/i).fill("Test Recherche ABC");
    await page.getByRole("button", { name: /filtrer/i }).click();
    await expect(page.getByRole("link", { name: /Formation Test Recherche ABC/i })).toBeVisible();
  });

  test("la recherche sans resultat affiche un etat vide", async ({ page }) => {
    await page.goto("/app/formations?q=xyzinexistant999");
    await expect(page.getByText(/aucune formation/i)).toBeVisible();
    await expect(page.getByRole("link", { name: /effacer/i })).toBeVisible();
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
    await expect(page.getByRole("heading", { name: /import csv/i })).toBeVisible();
  });
});
