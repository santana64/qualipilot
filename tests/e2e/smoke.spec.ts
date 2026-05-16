import { expect, test } from "@playwright/test";

test("landing page exposes core offer and pricing annual toggle", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: /Pr.parez vos audits Qualiopi/i })).toBeVisible();
  await expect(page.getByText("Annuel - 2 mois offerts")).toBeVisible();
  await expect(page.getByRole("link", { name: /mon espace/i }).first()).toBeVisible();
});

test("protected app routes redirect anonymous users to login", async ({ page }) => {
  await page.goto("/app");
  await expect(page).toHaveURL(/\/login/);
  await expect(page.getByText(/Vous devez.*connect/i)).toBeVisible();
});

test("unknown route shows branded 404", async ({ page }) => {
  await page.goto("/route-inconnue-qualipilot");
  await expect(page.getByText("Page introuvable")).toBeVisible();
  await expect(page.getByRole("link", { name: "Accueil" })).toBeVisible();
});
