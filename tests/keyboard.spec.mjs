import { test, expect } from "@playwright/test";
import {
  gotoWithTarget,
  mockDictionary,
  rowTiles,
  submitWord,
} from "./helpers.mjs";

test.describe("Keyboard", () => {
  test("virtual keyboard uses the English letter layout", async ({ page }) => {
    await mockDictionary(page, ["banco", "cabra", "abcde", "baczz"]);
    await gotoWithTarget(page, "banco");

    const firstRowTiles = rowTiles(page, 0);
    await page.locator('.key[data-key="a"]').click();
    await page.locator('.key[data-key="c"]').click();

    await expect(firstRowTiles.nth(0)).toHaveText("a");
    await expect(firstRowTiles.nth(1)).toHaveText("c");
    await expect(page.locator('.key[data-key="ç"]')).toHaveCount(0);
  });

  test("physical keyboard input and arrows work with row errors", async ({
    page,
  }) => {
    await mockDictionary(page, ["banco", "cabra", "abcde"]);
    await gotoWithTarget(page, "banco");

    const firstRowTiles = rowTiles(page, 0);
    await page.keyboard.type("ab");
    await expect(firstRowTiles.nth(0)).toHaveText("a");
    await expect(firstRowTiles.nth(1)).toHaveText("b");

    await page.keyboard.press("Backspace");
    await expect(firstRowTiles.nth(1)).toHaveText("");

    await page.keyboard.press("Enter");
    await expect(page.locator(".guess-line.active .row-error")).toContainText(
      "The word must have 5 letters.",
    );

    await page.keyboard.press("ArrowRight");
    await expect(page.locator(".guess-line.active .row-error")).toContainText(
      "The word must have 5 letters.",
    );
    await expect(page.locator('.tile[data-row="0"][data-col="2"]')).toHaveClass(
      /cursor/,
    );

    await page.keyboard.press("ArrowLeft");
    await expect(page.locator(".guess-line.active .row-error")).toContainText(
      "The word must have 5 letters.",
    );
    await expect(page.locator('.tile[data-row="0"][data-col="1"]')).toHaveClass(
      /cursor/,
    );
  });

  test("keyboard visuals reflect hit, warn, and miss states", async ({
    page,
  }) => {
    await mockDictionary(page, ["abcde", "baczz", "fghij", "klmno"]);
    await gotoWithTarget(page, "abcde");

    await submitWord(page, "baczz");

    await expect(page.locator('.key[data-key="c"]')).toHaveClass(/state-hit/);
    await expect(page.locator('.key[data-key="b"]')).toHaveClass(/state-warn/);
    await expect(page.locator('.key[data-key="z"]')).toHaveClass(/state-miss/);
  });
});
