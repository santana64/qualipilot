import { expect, test } from "@playwright/test";
import { seedAndAuthenticate } from "./helpers/auth";

test.describe("Gestion équipe", () => {
  test.beforeEach(async ({ context }) => {
    await seedAndAuthenticate(context);
  });

  test("la page équipe s'affiche", async ({ page }) => {
    await page.goto("/app/team");
    await expect(page.getByRole("heading", { name: /équipe/i })).toBeVisible();
  });

  test("le formulaire d'invitation est présent", async ({ page }) => {
    await page.goto("/app/team");
    await expect(page.getByLabel(/email/i)).toBeVisible();
    await expect(page.getByLabel(/rôle/i)).toBeVisible();
    await expect(page.getByRole("button", { name: /inviter/i })).toBeVisible();
  });

  test("invitation avec email invalide affiche une erreur", async ({ page }) => {
    await page.goto("/app/team");
    await page.getByLabel(/email/i).fill("email-invalide");
    await page.getByLabel(/rôle/i).selectOption("VIEWER");
    await page.getByRole("button", { name: /inviter/i }).click();
    await expect(page.getByText(/erreur|invalide/i)).toBeVisible();
  });

  test("invitation de son propre email affiche une erreur", async ({ page }) => {
    await page.goto("/app/team");
    await page.getByLabel(/email/i).fill("test@qualipilot.test");
    await page.getByLabel(/rôle/i).selectOption("ADMIN");
    await page.getByRole("button", { name: /inviter/i }).click();
    await expect(page.getByText(/d[eé]j[aà] propri[eé]taire|vous [eê]tes/i)).toBeVisible();
  });

  test("la page d'acceptation d'invitation affiche une erreur pour token invalide", async ({ page }) => {
    await page.goto("/team/accept?token=tokenInvalide123");
    await expect(page.getByText(/invalide|expir[eé]e/i)).toBeVisible();
  });
});
