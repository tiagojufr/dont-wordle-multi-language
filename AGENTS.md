# AI Agent Instructions

- Use `pnpm` for all project scripts and package tasks.
- This is a small static web app:
  - UI entry files: `index.html`, `src/styles.css`, `src/index.js`
  - Word data: `public/dictionaries/`
  - End-to-end tests (Playwright): `tests/`
- Use the **Playwright MCP server** to interact with the running game in the browser (clicking keys, reading tile states, checking counts, etc.). Start the dev server with `pnpm dev` before using the MCP browser tools.
