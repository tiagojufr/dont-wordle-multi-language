import js from "@eslint/js";
import playwright from "eslint-plugin-playwright";
import prettier from "eslint-config-prettier";
import globals from "globals";

export default [
  {
    ignores: [
      "dist/**",
      "node_modules/**",
      "playwright-report/**",
      "test-results/**",
    ],
  },
  js.configs.recommended,
  {
    files: ["**/*.js", "**/*.mjs"],
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      globals: {
        ...globals.browser,
      },
    },
  },
  {
    files: ["vite.config.mjs", "playwright.config.mjs", "eslint.config.mjs"],
    languageOptions: {
      globals: {
        ...globals.node,
      },
    },
  },
  {
    files: ["tests/**/*.mjs"],
    ...playwright.configs["flat/recommended"],
    languageOptions: {
      ...playwright.configs["flat/recommended"].languageOptions,
      globals: {
        ...globals.node,
      },
    },
  },
  prettier,
];
