import { expect, test } from "@playwright/test";

test.describe("Authentification", () => {
  test("la page login s'affiche avec les champs requis", async ({ page }) => {
    await page.goto("/login");
    await expect(page.getByLabel(/email/i)).toBeVisible();
    await expect(page.getByLabel(/mot de passe/i)).toBeVisible();
    await expect(page.getByRole("button", { name: /se connecter/i })).toBeVisible();
  });

  test("login avec identifiants invalides affiche une erreur", async ({ page }) => {
    await page.goto("/login");
    await page.getByLabel(/email/i).fill("inexistant@test.com");
    await page.getByLabel(/mot de passe/i).fill("mauvaismdp");
    await page.getByRole("button", { name: /se connecter/i }).click();
    await expect(page.getByText(/identifiants invalides/i)).toBeVisible();
  });

  test("la page inscription s'affiche avec les champs requis", async ({ page }) => {
    await page.goto("/register");
    await expect(page.getByLabel(/nom/i)).toBeVisible();
    await expect(page.getByLabel(/email/i)).toBeVisible();
    await expect(page.getByLabel(/mot de passe/i)).toBeVisible();
    await expect(page.getByLabel(/organisme/i)).toBeVisible();
    await expect(page.getByRole("button", { name: /cr[eé]er/i })).toBeVisible();
  });

  test("inscription avec email déjà utilisé affiche une erreur", async ({ page }) => {
    // Seed a user first so the email exists
    await page.request.post("/api/test/seed");

    await page.goto("/register");
    await page.getByLabel(/nom/i).fill("Dupont");
    await page.getByLabel(/email/i).fill("test@qualipilot.test");
    await page.getByLabel(/mot de passe/i).fill("TestPassword123!");
    await page.getByLabel(/organisme/i).fill("Mon OF");
    await page.getByRole("button", { name: /cr[eé]er/i }).click();
    await expect(page.getByText(/compte existe/i)).toBeVisible();
  });

  test("la page mot de passe oublié s'affiche", async ({ page }) => {
    await page.goto("/forgot-password");
    await expect(page.getByLabel(/email/i)).toBeVisible();
    await expect(page.getByRole("button", { name: /envoyer/i })).toBeVisible();
  });

  test("mot de passe oublié affiche confirmation sans révéler l'existence du compte", async ({ page }) => {
    await page.goto("/forgot-password");
    await page.getByLabel(/email/i).fill("inconnu@test.com");
    await page.getByRole("button", { name: /envoyer/i }).click();
    // Should show success regardless of whether account exists (no enumeration)
    await expect(page).toHaveURL(/sent=1/);
  });

  test("la page vérification email s'affiche avec un email passé en paramètre", async ({ page }) => {
    await page.goto("/verify-email?email=test%40test.com&sent=1");
    await expect(page.getByText(/test@test.com/i)).toBeVisible();
  });

  test("lien de vérification invalide affiche une erreur", async ({ page }) => {
    await page.goto("/verify-email?token=tokenInvalide123");
    await expect(page.getByText(/invalide|expiré/i)).toBeVisible();
  });
});
