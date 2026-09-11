import { test, expect } from "@playwright/test";

test.describe("Language switcher", () => {
  test("switches UI and dictionary language on demand", async ({ page }) => {
    await page.goto("/");

    const trigger = page.locator("#languageSwitcherTrigger");
    await expect(trigger).toBeVisible();

    await expect(page.locator("#randomStartButton")).toHaveText("Random word");
    await expect(page.locator('.key[data-key="ç"]')).toHaveCount(0);

    await trigger.click();
    await page
      .locator("#languageSwitcherPanel .language-option", {
        hasText: "Português",
      })
      .click();

    await expect(page.locator("html")).toHaveAttribute("lang", "pt-PT");
    await expect(page.locator("#randomStartButton")).toHaveText(
      "Palavra aleatória",
    );
    await expect(page.locator('.key[data-key="ç"]')).toHaveCount(1);

    await page.reload();

    await expect(page.locator("html")).toHaveAttribute("lang", "pt-PT");
    await expect(page.locator("#randomStartButton")).toHaveText(
      "Palavra aleatória",
    );
  });
});
