import { test, expect } from "@playwright/test";
import { loginViaUI, waitForDashboard } from "./helpers/auth";

test.describe("Review Session", () => {
  test.beforeEach(async ({ page }) => {
    await loginViaUI(page);
    await waitForDashboard(page);
  });

  test("review page loads with heading", async ({ page }) => {
    await page.goto("/review");
    await expect(page.getByRole("heading", { name: "Revisão" })).toBeVisible();
  });

  test("shows empty state or review cards", async ({ page }) => {
    await page.goto("/review");

    // Either shows empty state or cards to review
    const hasEmptyState = await page
      .getByText("Nada para revisar")
      .isVisible()
      .catch(() => false);

    const hasCards = await page
      .getByText("Clique para ver a resposta")
      .isVisible()
      .catch(() => false);

    expect(hasEmptyState || hasCards).toBeTruthy();
  });

  test("empty state has link to decks", async ({ page }) => {
    await page.goto("/review");

    const emptyState = page.getByText("Nada para revisar");
    const isVisible = await emptyState.isVisible().catch(() => false);

    if (isVisible) {
      const decksLink = page.getByRole("link", { name: /ir para decks/i });
      await expect(decksLink).toBeVisible();
    }
  });

  test("card flip reveals answer and rating buttons", async ({ page }) => {
    await page.goto("/review");

    // Check if there are cards to review
    const hasCards = await page
      .getByText("Clique para ver a resposta")
      .isVisible()
      .catch(() => false);

    if (hasCards) {
      // Click the card to flip
      await page.getByText("Clique para ver a resposta").click();

      // Rating buttons should appear
      await expect(page.getByRole("button", { name: /de novo/i })).toBeVisible();
      await expect(page.getByRole("button", { name: /difícil/i })).toBeVisible();
      await expect(page.getByRole("button", { name: /bom/i })).toBeVisible();
      await expect(page.getByRole("button", { name: /fácil/i })).toBeVisible();
    }
  });

  test("rating a card advances to next card or shows completion", async ({
    page,
  }) => {
    await page.goto("/review");

    const hasCards = await page
      .getByText("Clique para ver a resposta")
      .isVisible()
      .catch(() => false);

    if (hasCards) {
      // Flip card
      await page.getByText("Clique para ver a resposta").click();

      // Click "Bom" rating
      await page.getByRole("button", { name: /bom/i }).click();

      // Should either show next card or completion screen
      await page.waitForTimeout(1000);

      const hasNextCard = await page
        .getByText("Clique para ver a resposta")
        .isVisible()
        .catch(() => false);

      const hasCompletion = await page
        .getByText(/taxa de acerto/i)
        .isVisible()
        .catch(() => false);

      expect(hasNextCard || hasCompletion).toBeTruthy();
    }
  });
});
