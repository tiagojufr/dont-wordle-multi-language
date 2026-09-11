import { test, expect } from "@playwright/test";
import {
  gotoWithTarget,
  mockDictionary,
  rowTiles,
  submitWord,
} from "./helpers.mjs";

function buildWinDictionary() {
  const neutralLetters = ["h", "i", "j", "k", "l", "m", "n", "o", "p", "q"];
  const neutralWords = [];

  for (const a of neutralLetters) {
    for (const b of neutralLetters) {
      if (neutralWords.length >= 30) {
        break;
      }
      neutralWords.push(`${a}${a}${b}${b}${a}`);
    }
    if (neutralWords.length >= 30) {
      break;
    }
  }

  return [
    "aaaaa",
    "bbbbb",
    "ccccc",
    "ddddd",
    "eeeee",
    "fffff",
    "ggggg",
    ...neutralWords,
  ];
}

test.describe("Game Outcomes", () => {
  test("wins after 6 safe guesses", async ({ page }) => {
    await mockDictionary(page, buildWinDictionary());
    await gotoWithTarget(page, "aaaaa");

    for (const guess of [
      "bbbbb",
      "ccccc",
      "ddddd",
      "eeeee",
      "fffff",
      "ggggg",
    ]) {
      await submitWord(page, guess);
    }

    await expect(page.locator("#statusText")).toContainText("You win!");
    await expect(page.locator("#statusText")).toHaveClass(/status-success/);
  });

  test("loses immediately when guessing the target word", async ({ page }) => {
    await mockDictionary(page, buildWinDictionary());
    await gotoWithTarget(page, "aaaaa");

    await submitWord(page, "aaaaa");

    await expect(page.locator("#statusText")).toContainText("You lost");
    await expect(page.locator("#statusText")).toContainText('"AAAAA"');
    await expect(page.locator("#statusText")).toHaveClass(/status-error/);
  });

  test("loses when remaining candidates are too few for attempts left", async ({
    page,
  }) => {
    await mockDictionary(page, ["aaaaa", "bbbbb"]);
    await gotoWithTarget(page, "aaaaa");

    await submitWord(page, "bbbbb");

    await expect(page.locator("#statusText")).toContainText("You lost");
    await expect(page.locator("#statusText")).toContainText('"AAAAA"');
    await expect(page.locator("#statusText")).toContainText(
      "1 valid words remain",
    );
  });

  test("new game resets board and status after a game over", async ({
    page,
  }) => {
    await mockDictionary(page, buildWinDictionary());
    await gotoWithTarget(page, "aaaaa");

    await submitWord(page, "aaaaa");
    await page.locator("#newGameButton").click();

    await expect(page.locator("#statusText")).toHaveText("");
    await expect(page.locator("#undosRemaining")).toHaveText("5");
    await expect(rowTiles(page, 0).first()).toHaveText("");
  });
});
