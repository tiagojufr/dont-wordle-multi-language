import { test, expect } from "@playwright/test";
import {
  gotoWithTarget,
  mockDictionary,
  rowTiles,
  submitWord,
} from "./helpers.mjs";

async function switchToPortuguese(page) {
  await page.goto("/");
  await page.locator("#languageSwitcherTrigger").click();
  await page
    .locator("#languageSwitcherPanel .language-option", {
      hasText: "Português",
    })
    .click();
  await expect(page.locator("html")).toHaveAttribute("lang", "pt-PT");
}

test.describe("Accented letters", () => {
  test("a hit tile shows the guessed word's own accentuation, not the secret's", async ({
    page,
  }) => {
    await mockDictionary(page, ["balão", "socar"], "**/dictionaries/pt-PT.txt");
    await switchToPortuguese(page);
    await gotoWithTarget(page, "balão");

    // "balão" and "socar" share a canonical "a" at index 3, but only the
    // secret word accents it ("ã"); the guess must keep its own spelling.
    await submitWord(page, "socar");

    const tile = rowTiles(page, 0).nth(3);
    await expect(tile).toHaveText("a");
    await expect(tile).toHaveClass(/hit/);
  });
});
