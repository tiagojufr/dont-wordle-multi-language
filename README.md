# Don't Wordle — Multi-language

[![Deploy](https://github.com/tiagojufr/dont-wordle-multi-language/actions/workflows/deploy.yml/badge.svg)](https://github.com/tiagojufr/dont-wordle-multi-language/actions/workflows/deploy.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

A multi-language version of **Don't Wordle** — the game plays like Wordle, but flipped: your goal is to _avoid_ guessing the secret word in 6 attempts, using the same color-coded feedback to steer clear of it.

🎮 **[Play it here](https://tiagojufr.github.io/dont-wordle-multi-language/)**

## Table of contents

- [How to play](#how-to-play)
- [Getting started](#getting-started)
- [Available scripts](#available-scripts)
- [Project structure](#project-structure)
- [Adding a new language](#adding-a-new-language)
- [Testing](#testing)
- [Contributing](#contributing)
- [Roadmap](#roadmap)
- [License](#license)

## How to play

Don't Wordle picks a random secret word. Every valid guess narrows down the set of possible words and reveals color-coded hints:

- 🟩 **Green** — the letter is in the correct position. It must stay there for the rest of the game.
- 🟨 **Yellow** — the letter is in the word but in the wrong position. It must appear in a different position next time.
- ⬜ **Gray** — the letter isn't in the word at all. It can't be used again.

Your goal is to survive all 6 guesses **without** landing on the secret word.

## Getting started

### Prerequisites

- [Node.js](https://nodejs.org/) (v24 or later recommended)
- [pnpm](https://pnpm.io/) — this project uses pnpm for all scripts and package management (see the `packageManager` field in [package.json](package.json))

### Installation

```bash
git clone https://github.com/tiagojufr/dont-wordle-multi-language.git
cd dont-wordle-multi-language
pnpm install
```

### Running locally

```bash
pnpm dev
```

The app will be available at [http://localhost:3000](http://localhost:3000).

## Available scripts

| Script              | Description                                                     |
| ------------------- | --------------------------------------------------------------- |
| `pnpm dev`          | Starts the Vite dev server                                      |
| `pnpm build`        | Builds the app for production into `dist/`                      |
| `pnpm preview`      | Serves the production build locally                             |
| `pnpm format`       | Formats the codebase with Prettier                              |
| `pnpm format:check` | Checks formatting without writing changes                       |
| `pnpm test`         | Runs the Playwright end-to-end test suite                       |
| `pnpm test:headed`  | Runs the test suite in a headed browser                         |
| `pnpm test:ui`      | Opens the Playwright UI test runner                             |
| `pnpm check`        | Runs format check, build, and tests — the same checks run in CI |

## Project structure

```
index.html                 # App entry HTML
src/
  index.js                  # App bootstrap
  game-logic.js             # Core game rules and state
  rendering.js              # Board/UI rendering
  keyboard.js               # Virtual keyboard behavior
  language-switcher.js      # Language picker UI
  styles.css                # Styles
  i18n/                     # Translations and per-language configuration
    languages.js            # Registry of all supported languages
    */                      # One folder per language (config + strings)
public/
  dictionaries/             # Word lists, one .txt file per language
  img/                      # Static images
tests/                      # Playwright end-to-end tests
```

## Adding a new language

Adding a new language means providing a dictionary and a small configuration/translation module, then registering it. As an example, here's how you would add Spanish (`es`):

1. **Add a dictionary.**
   Create `public/dictionaries/es.txt` — a plain text file with:
   - one valid 5-letter word per line
   - words must be lowercase
   - file must be UTF-8 encoded
   - **be careful with accented words**, so you don't end up with 2 words in the file that are the same word when you remove the accents (e.g. `agora` vs. `agorá`). This will introduce bugs in the game

2. **Create a language folder.**
   Create `src/i18n/es/index.js`, see [src/i18n/en/index.js](src/i18n/en/index.js) as an example:
   - `keyboardRows` defines the on-screen keyboard layout.
   - `letterPattern` restricts which characters count as valid letters for that language.
   - `foldMap` maps accented/variant characters to their canonical unaccented form, used when comparing guesses (skip entries for accents that should be treated as distinct letters, as Portuguese does for `ç`).
   - `flagSvg` comes from the [`country-flag-icons`](https://www.npmjs.com/package/country-flag-icons) package — pick the ISO code for the flag you want to display.

3. **Add the translation strings.**
   Create `src/i18n/es/strings.js`, translating every key from [src/i18n/en/strings.js](src/i18n/en/strings.js). Keep the same object shape and interpolation placeholders (e.g. `{{word}}`, `{{letter}}`, `{{position}}`).

4. **Register the language.**
   Add it to [src/i18n/languages.js](src/i18n/languages.js).

5. **Verify it works.**
   Run `pnpm dev`, switch to the new language in the language picker, and play a full game to confirm the keyboard, dictionary, and translations all behave correctly.

6. **Add test coverage.**
   If relevant, extend [tests/language-switch.spec.mjs](tests/language-switch.spec.mjs) to cover the new language, and run the full suite with `pnpm test`.

## Testing

This project uses [Playwright](https://playwright.dev/) for end-to-end tests, located in [tests/](tests/). Playwright drives a real browser against the dev server to verify gameplay, keyboard input, undo behavior, language switching, and more.

```bash
pnpm test          # run the full suite headless
pnpm test:headed   # run with a visible browser
pnpm test:ui       # interactive UI mode for debugging
```

CI runs `pnpm run check` (formatting, build, and tests) on every push — see [.github/workflows/deploy.yml](.github/workflows/deploy.yml).

## Contributing

This project was mostly vibe-coded, but contributions are welcome! Whether it's a bug fix, a new feature, a new language, or an improvement to the docs, you're welcome to contribute!

### Reporting bugs / requesting features

Please use [GitHub Issues](https://github.com/tiagojufr/dont-wordle-multi-language/issues) and include:

- Steps to reproduce (for bugs)
- Expected vs. actual behavior
- Browser/OS, if relevant
- Screenshots, if helpful

## Roadmap

Here are the next things I intend to work on:

- :bug: - Keyboard buttons are too small for cellphones (tested with a Nothing Phone 2)

## License

This project is licensed under the [MIT License](LICENSE).
