import { test, expect } from "@playwright/test";
import {
  TEST_WORD_LIST,
  gotoWithTarget,
  mockDictionary,
  parseCount,
  rowTiles,
  submitWord,
} from "./helpers.mjs";

function buildLargeMissDictionary() {
  const neutralLetters = ["h", "i", "j", "k", "l", "m", "n", "o", "p", "q"];
  const neutralWords = [];

  for (const a of neutralLetters) {
    for (const b of neutralLetters) {
      if (neutralWords.length >= 20) {
        break;
      }
      neutralWords.push(`${a}${a}${b}${b}${a}`);
    }
    if (neutralWords.length >= 20) {
      break;
    }
  }

  return ["aaaaa", "bbbbb", ...neutralWords];
}

test.describe("Guess Flow", () => {
  test("typing and backspace update tiles in the active row", async ({
    page,
  }) => {
    await mockDictionary(page, TEST_WORD_LIST);
    await gotoWithTarget(page, "banco");

    const firstRowTiles = rowTiles(page, 0);

    await page.locator('.key[data-key="c"]').click();
    await page.locator('.key[data-key="a"]').click();
    await page.locator('.key[data-key="b"]').click();

    await expect(firstRowTiles.nth(0)).toHaveText("c");
    await expect(firstRowTiles.nth(1)).toHaveText("a");
    await expect(firstRowTiles.nth(2)).toHaveText("b");

    await page.locator('.key[data-key="backspace"]').click();
    await expect(firstRowTiles.nth(2)).toHaveText("");

    await firstRowTiles.nth(1).click();
    await page.locator('.key[data-key="n"]').click();
    await expect(firstRowTiles.nth(1)).toHaveText("n");
  });

  test("submitting a valid word advances row and updates counts", async ({
    page,
  }) => {
    await mockDictionary(page, buildLargeMissDictionary());
    await gotoWithTarget(page, "aaaaa");

    const initialCountText = (
      await page.locator("#remainingCount").innerText()
    ).trim();
    const initialCount = parseCount(initialCountText);

    await submitWord(page, "bbbbb");

    const firstRowTiles = rowTiles(page, 0);
    await expect(firstRowTiles.nth(0)).toHaveClass(/warn|hit|miss/);
    await expect(page.locator(".guess-line.active")).toHaveCount(1);
    await expect(page.locator(".guess-line").nth(1)).toHaveClass(/active/);

    await expect(page.locator(".row-remaining strong").first()).toHaveText(
      initialCountText,
    );

    const topCountText = (
      await page.locator("#remainingCount").innerText()
    ).trim();
    const topCount = parseCount(topCountText);
    expect(topCount).toBeLessThan(initialCount);
  });
});
