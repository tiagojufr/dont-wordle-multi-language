import { test, expect } from "@playwright/test";

test.describe("Game", () => {
  test("loads the page and shows the main elements", async ({ page }) => {
    await page.goto("/");

    await expect(page.getByRole("heading")).toBeVisible();
    await expect(page.locator("#randomStartButton")).toBeVisible();
    await expect(page.locator("#newGameButton")).toBeVisible();
    await expect(page.locator("#undoButton")).toBeDisabled();
    await expect(page.locator("#remainingCount")).not.toHaveText("0");
  });

  test("first row keeps the initial total after the first move", async ({
    page,
  }) => {
    await page.goto("/");

    const initialTotal = (
      await page.locator("#remainingCount").innerText()
    ).trim();
    await page.locator("#randomStartButton").click();

    const rowCounts = page.locator(".row-remaining strong");
    await expect(rowCounts.first()).toHaveText(initialTotal);

    const topRemaining = (
      await page.locator("#remainingCount").innerText()
    ).trim();
    await expect(rowCounts.nth(1)).toHaveText(topRemaining);
  });

  test("undo removes the submitted move and allows typing again", async ({
    page,
  }) => {
    await page.goto("/");

    await page.locator("#randomStartButton").click();
    await expect(page.locator("#undoButton")).toBeEnabled();

    await page.locator("#undoButton").click();

    await expect(page.locator("#statusText")).toHaveText("");
    await expect(page.locator("#undosRemaining")).toHaveText("4");

    const firstRowFirstTile = page
      .locator(".guess-line")
      .first()
      .locator(".tile")
      .first();
    await expect(firstRowFirstTile).toHaveText("");

    await page.getByRole("button", { name: "q" }).click();
    await expect(firstRowFirstTile).toHaveText("q");
  });

  test("new game resets state and starts a fresh round", async ({ page }) => {
    await page.goto("/");

    await page.locator("#randomStartButton").click();
    await page.locator("#newGameButton").click();

    await expect(page.locator("#statusText")).toHaveText("");
    await expect(page.locator("#undosRemaining")).toHaveText("5");
    await expect(page.locator("#undoButton")).toBeDisabled();

    const firstRowFirstTile = page
      .locator(".guess-line")
      .first()
      .locator(".tile")
      .first();
    await expect(firstRowFirstTile).toHaveText("");
  });

  test("shows validation errors under the active row", async ({ page }) => {
    await page.goto("/");

    await page.keyboard.press("Enter");

    await expect(page.locator(".guess-line.active .row-error")).toContainText(
      "The word must have 5 letters.",
    );
    await expect(page.locator("#statusText")).toHaveText("");
  });

  test("shows the same validation error for partial words", async ({
    page,
  }) => {
    await page.goto("/");

    await page.locator('.key[data-key="q"]').click();
    await page.locator('.key[data-key="w"]').click();
    await page.locator('.key[data-key="e"]').click();
    await page.keyboard.press("Enter");

    await expect(page.locator(".guess-line.active .row-error")).toContainText(
      "The word must have 5 letters.",
    );
    await expect(page.locator("#statusText")).toHaveText("");
  });

  test("allows dismissing the row validation notification", async ({
    page,
  }) => {
    await page.goto("/");

    await page.keyboard.press("Enter");

    const rowError = page.locator(".guess-line.active .row-error");
    await expect(rowError).toContainText("The word must have 5 letters.");

    await rowError.getByRole("button", { name: "Dismiss warning" }).click();
    await expect(rowError).toBeHidden();
  });
});
