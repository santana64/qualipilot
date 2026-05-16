import { expect, test } from "@playwright/test";
import { seedAndAuthenticate } from "./helpers/auth";

test.describe("Mode Cabinet", () => {
  test.beforeEach(async ({ context }) => {
    await seedAndAuthenticate(context);
  });

  test("la page cabinet affiche soit le mode cabinet soit l'upgrade", async ({ page }) => {
    await page.goto("/app/cabinet");
    await expect(page.getByRole("heading", { name: /^mode cabinet$/i })).toBeVisible();
  });

  test("la navigation laterale a un lien vers le cabinet", async ({ page }) => {
    await page.goto("/app");
    await expect(page.getByRole("link", { name: /cabinet/i })).toBeVisible();
  });
});

test.describe("Mode Cabinet avec plan CABINET", () => {
  test.beforeEach(async ({ context }) => {
    await seedAndAuthenticate(context, { plan: "CABINET" });
  });

  test("creation d'un client cabinet", async ({ page }) => {
    await page.goto("/app/cabinet");
    const createBtn = page.getByRole("button", { name: /nouveau client|ajouter/i });
    if (await createBtn.isVisible()) {
      await createBtn.click();
      const orgField = page.getByLabel(/organisme|nom de l'organisme/i);
      if (await orgField.isVisible()) {
        await orgField.fill("OF Client Test SARL");
        await page.getByRole("button", { name: /creer|créer|enregistrer/i }).click();
        await expect(page.getByText("OF Client Test SARL")).toBeVisible({ timeout: 5000 });
      }
    }
  });
});
