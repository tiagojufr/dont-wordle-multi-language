import { test, expect } from "@playwright/test";
import { gotoWithTarget, mockDictionary, submitWord } from "./helpers.mjs";

test.describe("Undo", () => {
  test("undo can be exhausted after 5 uses", async ({ page }) => {
    await page.goto("/");

    for (let i = 0; i < 5; i += 1) {
      await page.locator("#randomStartButton").click();
      await page.locator("#undoButton").click();
    }

    await expect(page.locator("#undosRemaining")).toHaveText("0");
    await expect(page.locator("#undoButton")).toBeDisabled();
  });

  test("undo restores count, row counters, and keyboard visuals", async ({
    page,
  }) => {
    await mockDictionary(page, [
      "abcde",
      "aabcc",
      "aacde",
      "abbce",
      "accde",
      "bacde",
      "cadeb",
      "deabc",
      "eabcd",
      "fghij",
    ]);
    await gotoWithTarget(page, "abcde");

    const initialTopCount = (
      await page.locator("#remainingCount").innerText()
    ).trim();
    await submitWord(page, "fghij");

    await expect(page.locator('.key[data-key="f"]')).toHaveClass(/state-miss/);
    await page.locator("#undoButton").click();

    await expect(page.locator("#remainingCount")).toHaveText(initialTopCount);
    await expect(page.locator(".row-remaining strong").first()).toHaveText(
      initialTopCount,
    );
    await expect(page.locator('.key[data-key="f"]')).not.toHaveClass(
      /state-miss/,
    );
    await expect(page.locator("#undosRemaining")).toHaveText("4");
  });

  test("undo is disabled after a loss; only new game can continue", async ({
    page,
  }) => {
    await mockDictionary(page, ["aaaaa", "bbbbb", "ccccc"]);
    await gotoWithTarget(page, "aaaaa");

    await submitWord(page, "aaaaa");

    await expect(page.locator("#statusText")).toContainText("You lost");
    await expect(page.locator("#undoButton")).toBeDisabled();
    await expect(page.locator("#newGameButton")).toBeEnabled();
    await expect(page.locator("#undosRemaining")).toHaveText("5");
  });
});
