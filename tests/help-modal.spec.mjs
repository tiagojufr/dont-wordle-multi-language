import { test, expect } from "@playwright/test";

test.describe("Help Modal", () => {
  test("opens with a two-word example and color explanations", async ({
    page,
  }) => {
    await page.goto("/");

    const helpButton = page.locator("#helpButton");
    const helpModal = page.locator("#helpModal");

    await expect(helpModal).not.toBeVisible();
    await helpButton.click();

    await expect(helpModal).toBeVisible();
    await expect(
      helpModal.getByRole("heading", { name: "How to play" }),
    ).toBeVisible();

    const exampleRows = helpModal.locator(".help-example-tiles");
    await expect(exampleRows).toHaveCount(3);

    await expect(exampleRows.nth(0).locator(".tile.miss")).toHaveCount(3);
    await expect(exampleRows.nth(0).locator(".tile.warn")).toHaveCount(1);
    await expect(exampleRows.nth(0).locator(".tile.hit")).toHaveCount(1);

    const firstRowYellow = exampleRows.nth(0).locator(".tile.warn").first();
    await expect(firstRowYellow).toHaveText("R");

    const secondRowFirstTile = exampleRows.nth(1).locator(".tile").first();
    await expect(secondRowFirstTile).toHaveText("R");
    await expect(secondRowFirstTile).toHaveClass(/hit/);

    await expect(exampleRows.nth(1).locator(".tile.hit")).toHaveCount(2);

    await expect(helpModal.getByText("Gray:", { exact: false })).toBeVisible();
    await expect(
      helpModal.getByText("Yellow:", { exact: false }),
    ).toBeVisible();
    await expect(helpModal.getByText("Green:", { exact: false })).toBeVisible();
  });

  test("closes with close button and Escape", async ({ page }) => {
    await page.goto("/");

    const helpButton = page.locator("#helpButton");
    const helpModal = page.locator("#helpModal");
    const closeButton = page.locator("#helpModalCloseButton");

    await helpButton.click();
    await expect(helpModal).toBeVisible();

    await closeButton.click();
    await expect(helpModal).not.toBeVisible();
    await expect(helpButton).toBeFocused();

    await helpButton.click();
    await expect(helpModal).toBeVisible();

    await page.keyboard.press("Escape");
    await expect(helpModal).not.toBeVisible();
    await expect(helpButton).toBeFocused();
  });
});
