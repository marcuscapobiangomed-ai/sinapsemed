import { test, expect } from "@playwright/test";
import { loginViaUI, waitForDashboard } from "./helpers/auth";

test.describe("Decks CRUD", () => {
  test.beforeEach(async ({ page }) => {
    await loginViaUI(page);
    await waitForDashboard(page);
  });

  test("navigates to decks page and shows heading", async ({ page }) => {
    await page.goto("/decks");
    await expect(page.getByRole("heading", { name: "Meus Decks" })).toBeVisible();
  });

  test("shows empty state or deck list", async ({ page }) => {
    await page.goto("/decks");

    // Either shows empty state or deck cards
    const hasEmptyState = await page
      .getByText("Nenhum deck criado")
      .isVisible()
      .catch(() => false);

    const hasDeckCards = await page
      .locator('[class*="grid"] a')
      .first()
      .isVisible()
      .catch(() => false);

    expect(hasEmptyState || hasDeckCards).toBeTruthy();
  });

  test("opens create deck dialog", async ({ page }) => {
    await page.goto("/decks");
    await page.getByRole("button", { name: /novo deck/i }).click();

    await expect(
      page.getByRole("heading", { name: "Criar novo deck" }),
    ).toBeVisible();
    await expect(page.getByLabel("Nome do deck")).toBeVisible();
  });

  test("creates a new deck and it appears in the list", async ({ page }) => {
    await page.goto("/decks");

    // Open dialog
    await page.getByRole("button", { name: /novo deck/i }).click();

    // Fill form
    const deckName = `E2E Test Deck ${Date.now()}`;
    await page.getByLabel("Nome do deck").fill(deckName);
    await page.getByLabel(/descri/i).fill("Deck criado por teste E2E");

    // Submit
    await page.getByRole("button", { name: "Criar deck" }).click();

    // Wait for dialog to close and page to refresh
    await page.waitForTimeout(2000);

    // The deck should now appear in the list
    await expect(page.getByText(deckName)).toBeVisible({ timeout: 10000 });
  });
});
