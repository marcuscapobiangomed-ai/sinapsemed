import { test, expect } from "@playwright/test";
import { loginViaUI, waitForDashboard, TEST_USER } from "./helpers/auth";

test.describe("Auth Flow", () => {
  test("login page shows form with email, password and submit button", async ({
    page,
  }) => {
    await page.goto("/login");

    await expect(page.getByLabel("Email")).toBeVisible();
    await expect(page.getByLabel("Senha")).toBeVisible();
    await expect(page.getByRole("button", { name: "Entrar" })).toBeVisible();
    await expect(
      page.getByRole("button", { name: /continuar com google/i }),
    ).toBeVisible();
  });

  test("shows error on invalid credentials", async ({ page }) => {
    await page.goto("/login");
    await page.getByLabel("Email").fill("wrong@email.com");
    await page.getByLabel("Senha").fill("wrongpassword");
    await page.getByRole("button", { name: "Entrar" }).click();

    // Should show error toast
    await expect(
      page.getByText("Email ou senha incorretos."),
    ).toBeVisible({ timeout: 10000 });
  });

  test("redirects unauthenticated user from /dashboard to /login", async ({
    page,
  }) => {
    await page.goto("/dashboard");
    await page.waitForURL(/\/login/, { timeout: 10000 });
    expect(page.url()).toContain("/login");
  });

  test("redirects unauthenticated user from /decks to /login", async ({
    page,
  }) => {
    await page.goto("/decks");
    await page.waitForURL(/\/login/, { timeout: 10000 });
    expect(page.url()).toContain("/login");
  });

  test("redirects unauthenticated user from /review to /login", async ({
    page,
  }) => {
    await page.goto("/review");
    await page.waitForURL(/\/login/, { timeout: 10000 });
    expect(page.url()).toContain("/login");
  });

  test("successful login redirects to dashboard or onboarding", async ({
    page,
  }) => {
    await loginViaUI(page);
    await waitForDashboard(page);

    const url = page.url();
    expect(url).toMatch(/\/(dashboard|onboarding)/);
  });

  test("authenticated user accessing /login is redirected to /dashboard", async ({
    page,
  }) => {
    // First login
    await loginViaUI(page);
    await waitForDashboard(page);

    // Then try to access /login — should redirect to dashboard (or onboarding if not completed)
    await page.goto("/login");
    await page.waitForURL(/\/(dashboard|onboarding)/, { timeout: 10000 });
    expect(page.url()).toMatch(/\/(dashboard|onboarding)/);
  });
});
