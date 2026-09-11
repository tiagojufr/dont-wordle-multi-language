import { test, expect } from "@playwright/test";

test.describe("Theme Toggle", () => {
  test("uses icon-only button and updates accessibility label", async ({
    page,
  }) => {
    await page.goto("/");

    const themeToggleButton = page.locator("#themeToggleButton");

    await expect(themeToggleButton).toBeVisible();

    // Icon-only: no visible text node content in the button.
    await expect(themeToggleButton).toHaveText("");

    await expect(themeToggleButton).toHaveAttribute(
      "aria-label",
      "Use dark theme",
    );
    await expect(themeToggleButton).toHaveAttribute("title", "Use dark theme");
    await expect(page.locator("html")).toHaveAttribute("data-theme", "light");

    await themeToggleButton.click();

    await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
    await expect(themeToggleButton).toHaveAttribute(
      "aria-label",
      "Use light theme",
    );
    await expect(themeToggleButton).toHaveAttribute("title", "Use light theme");
    await expect(themeToggleButton).toHaveText("");
  });
});
