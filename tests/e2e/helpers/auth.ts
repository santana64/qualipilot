import type { BrowserContext, Page } from "@playwright/test";

const BASE_URL = process.env.PLAYWRIGHT_BASE_URL || "http://localhost:3000";

export async function seedAndAuthenticate(context: BrowserContext): Promise<{
  email: string;
  password: string;
}> {
  const response = await context.request.post(`${BASE_URL}/api/test/seed`);
  if (!response.ok()) {
    throw new Error(`Seed failed: ${response.status()} ${await response.text()}`);
  }
  const data = await response.json() as { email: string; password: string };
  // Cookie is set via Set-Cookie header on the context automatically
  return data;
}

export async function loginAs(page: Page, email: string, password: string) {
  await page.goto("/login");
  await page.getByLabel(/email/i).fill(email);
  await page.getByLabel(/mot de passe/i).fill(password);
  await page.getByRole("button", { name: /se connecter/i }).click();
  await page.waitForURL(/\/app/);
}
