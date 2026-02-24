import { type Page } from "@playwright/test";

// Test credentials — create this user in Supabase for E2E tests
export const TEST_USER = {
  email: "e2e-test@dindin.com",
  password: "TestPassword123!",
};

/**
 * Login via the login form UI
 */
export async function loginViaUI(page: Page) {
  await page.goto("/login");
  await page.getByLabel("Email").fill(TEST_USER.email);
  await page.getByLabel("Senha").fill(TEST_USER.password);
  await page.getByRole("button", { name: "Entrar" }).click();
}

/**
 * Wait for navigation to complete after login
 */
export async function waitForDashboard(page: Page) {
  await page.waitForURL(/\/(dashboard|onboarding)/, { timeout: 15000 });
}
