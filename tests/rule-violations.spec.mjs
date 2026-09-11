import { test, expect } from "@playwright/test";
import { gotoWithTarget, mockDictionary, submitWord } from "./helpers.mjs";

test.describe("Rule Violations", () => {
  test("keeps confirmed green letters in the same position", async ({
    page,
  }) => {
    await mockDictionary(page, [
      "abcde",
      "aqrst",
      "fqrst",
      "aabce",
      "aacde",
      "aadde",
      "aaeee",
      "abcee",
      "acdee",
      "addee",
      "aeecd",
      "aeeed",
      "zzzzz",
    ]);
    await gotoWithTarget(page, "abcde");

    await submitWord(page, "aqrst");
    await submitWord(page, "fqrst");

    await expect(page.locator(".guess-line.active .row-error")).toContainText(
      "position 1",
    );
  });

  test("requires yellow letters to appear again in another position", async ({
    page,
  }) => {
    await mockDictionary(page, [
      "abcde",
      "faghi",
      "fghij",
      "aabce",
      "aacde",
      "aadde",
      "aaeee",
      "abcee",
      "acdee",
      "addee",
      "aeecd",
      "aeeed",
      "zzzzz",
    ]);
    await gotoWithTarget(page, "abcde");

    await submitWord(page, "faghi");
    await submitWord(page, "fghij");

    await expect(page.locator(".guess-line.active .row-error")).toContainText(
      "Letter A must exist in another position.",
    );
  });

  test("disallows letters that were eliminated as gray", async ({ page }) => {
    await mockDictionary(page, [
      "abcde",
      "fghij",
      "kghlm",
      "aabce",
      "aacde",
      "aadde",
      "aaeee",
      "abcee",
      "acdee",
      "addee",
      "aeecd",
      "aeeed",
      "zzzzz",
    ]);
    await gotoWithTarget(page, "abcde");

    await submitWord(page, "fghij");
    await submitWord(page, "kghlm");

    await expect(page.locator(".guess-line.active .row-error")).toContainText(
      "Letter G was eliminated",
    );
  });
});
