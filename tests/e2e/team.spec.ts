import { expect, test } from "@playwright/test";
import { seedAndAuthenticate } from "./helpers/auth";

test.describe("Gestion equipe", () => {
  test("la page equipe s'affiche", async ({ context, page }) => {
    await seedAndAuthenticate(context);
    await page.goto("/app/team");
    await expect(page.getByRole("heading", { name: /equipe|équipe/i })).toBeVisible();
  });

  test("le formulaire d'invitation est present", async ({ context, page }) => {
    await seedAndAuthenticate(context);
    await page.goto("/app/team");
    await expect(page.getByLabel(/email/i)).toBeVisible();
    await expect(page.getByLabel(/role|rôle/i)).toBeVisible();
    await expect(page.getByRole("button", { name: /envoyer l'invitation/i })).toBeVisible();
  });

  test("invitation avec email invalide affiche une erreur", async ({ context, page }) => {
    await seedAndAuthenticate(context);
    await page.goto("/app/team");
    const emailInput = page.getByLabel(/email/i);
    await emailInput.fill("email-invalide");
    await page.getByLabel(/role|rôle/i).selectOption("VIEWER");
    await page.getByRole("button", { name: /envoyer l'invitation/i }).click();
    await expect.poll(async () => emailInput.evaluate((el) => (el as HTMLInputElement).validity.valid)).toBe(false);
  });

  test("invitation de son propre email affiche une erreur", async ({ context, page }) => {
    const seeded = await seedAndAuthenticate(context);
    await page.goto("/app/team");
    await page.getByLabel(/email/i).fill(seeded.email);
    await page.getByLabel(/role|rôle/i).selectOption("ADMIN");
    await page.getByRole("button", { name: /envoyer l'invitation/i }).click();
    await expect(page.getByText(/deja proprietaire|déjà propriétaire|vous etes|vous êtes/i)).toBeVisible();
  });

  test("la page d'acceptation d'invitation affiche une erreur pour token invalide", async ({ page }) => {
    await page.goto("/team/accept?token=tokenInvalide123");
    await expect(page.getByText(/connecter|invitation/i).first()).toBeVisible();
  });
});
