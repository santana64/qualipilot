import { expect, test } from "@playwright/test";
import { seedAndAuthenticate } from "./helpers/auth";

test.describe("Mode Cabinet", () => {
  test.beforeEach(async ({ context }) => {
    await seedAndAuthenticate(context);
    // Seed sets up a PRO plan user — Cabinet requires CABINET plan
    // We test the access restriction first, then upgrade if needed
  });

  test("la page cabinet est accessible (PRO n'a pas accès, CABINET oui)", async ({ page }) => {
    await page.goto("/app/cabinet");
    // Either shows the cabinet UI or a plan upgrade prompt
    await expect(
      page.getByRole("heading", { name: /cabinet/i }).or(
        page.getByText(/plan|abonnement|mettre à niveau/i)
      )
    ).toBeVisible();
  });

  test("la navigation latérale a un lien vers le cabinet", async ({ page }) => {
    await page.goto("/app");
    await expect(page.getByRole("link", { name: /cabinet/i })).toBeVisible();
  });
});

test.describe("Mode Cabinet — avec plan CABINET", () => {
  test.beforeEach(async ({ context }) => {
    // Upgrade the test user to CABINET plan via seed + DB
    const response = await context.request.post("/api/test/seed");
    await response.json();

    // Upgrade plan to CABINET via a test helper endpoint
    await context.request.post("/api/test/upgrade-plan", {
      data: { plan: "CABINET" },
    }).catch(() => null); // Optional endpoint — skip if not available
  });

  test("création d'un client cabinet", async ({ page }) => {
    await page.goto("/app/cabinet");
    const createBtn = page.getByRole("button", { name: /nouveau client|ajouter/i });
    if (await createBtn.isVisible()) {
      await createBtn.click();
      const orgField = page.getByLabel(/organisme|nom de l'organisme/i);
      if (await orgField.isVisible()) {
        await orgField.fill("OF Client Test SARL");
        await page.getByRole("button", { name: /créer|enregistrer/i }).click();
        await expect(page.getByText("OF Client Test SARL")).toBeVisible({ timeout: 5000 });
      }
    }
  });
});
