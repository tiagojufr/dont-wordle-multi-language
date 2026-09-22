import "./styles.css";
import {
  bindPhysicalKeyboard,
  configureKeyboardInput,
  renderKeyboard,
} from "./keyboard.js";
import { renderLanguageSwitcher } from "./language-switcher.js";
import {
  renderBoard,
  setDismissWarningLabel,
  setNumberFormatLocale,
  setStatusText,
  setTopCount,
  setUndoCount,
  updateKeyboardVisuals,
  updateRandomStartButtonState,
} from "./rendering.js";
import {
  candidateMatchesGuess,
  canonicalLetter,
  canonicalWord,
  computeCandidates,
  configureAlphabet,
  createEmptyBoard,
  evaluateGuess,
  findRuleViolations,
  randomIndex,
  rowIsComplete,
  rowWord,
} from "./game-logic.js";
import { LANGUAGES } from "./i18n/languages.js";
import {
  applyStaticTranslations,
  detectInitialLanguage,
  initializeI18n,
  loadLanguage,
  t,
} from "./i18n/index.js";

const ROW_COUNT = 6;
const COL_COUNT = 5;
const INITIAL_UNDOS = 5;
const THEME_STORAGE_KEY = "dont-wordle-theme";

const boardState = createEmptyBoard(ROW_COUNT, COL_COUNT);
let activeRow = 0;
let activeCol = 0;

let dictionaryWords = [];
let dictionaryCanonicalSet = new Set();
let targetWord = "";
let candidateWords = [];
let submittedGuesses = [];
let submittedPatterns = [];
let rowRemainingCounts = Array.from({ length: ROW_COUNT }, () => null);
let undosRemaining = INITIAL_UNDOS;
let gameStatus = "playing";
let undoStack = [];
let currentRowError = "";
let rowErrorDismissed = false;

let activeLanguageCode = "en";
let activeLanguageConfig = LANGUAGES[activeLanguageCode];

function formatCount(value) {
  return new Intl.NumberFormat(activeLanguageConfig.numberFormatLocale).format(
    value,
  );
}

function preferredTheme() {
  if (globalThis.matchMedia?.("(prefers-color-scheme: dark)")?.matches) {
    return "dark";
  }
  return "light";
}

function readStoredTheme() {
  try {
    const stored = globalThis.localStorage?.getItem(THEME_STORAGE_KEY);
    return stored === "dark" || stored === "light" ? stored : null;
  } catch {
    return null;
  }
}

function writeStoredTheme(theme) {
  try {
    globalThis.localStorage?.setItem(THEME_STORAGE_KEY, theme);
  } catch {
    // Ignore write errors (e.g. private mode)
  }
}

function updateThemeToggleButton(button, theme) {
  const nextTheme = theme === "dark" ? "light" : "dark";
  const nextLabel =
    nextTheme === "dark" ? t("theme.useDark") : t("theme.useLight");
  button.setAttribute("aria-label", nextLabel);
  button.setAttribute("title", nextLabel);
}

function applyTheme(theme, themeToggleButton) {
  document.documentElement.dataset.theme = theme;
  updateThemeToggleButton(themeToggleButton, theme);
}

function bindThemeToggle() {
  const themeToggleButton = document.getElementById("themeToggleButton");
  if (!(themeToggleButton instanceof HTMLButtonElement)) {
    return;
  }

  let currentTheme = readStoredTheme() || preferredTheme();
  applyTheme(currentTheme, themeToggleButton);

  themeToggleButton.addEventListener("click", () => {
    currentTheme = currentTheme === "dark" ? "light" : "dark";
    applyTheme(currentTheme, themeToggleButton);
    writeStoredTheme(currentTheme);
  });
}

function refreshThemeToggleTranslation() {
  const themeToggleButton = document.getElementById("themeToggleButton");
  if (!(themeToggleButton instanceof HTMLButtonElement)) {
    return;
  }

  const theme = document.documentElement.dataset.theme || preferredTheme();
  updateThemeToggleButton(themeToggleButton, theme);
}

function formatRowError(message) {
  if (Array.isArray(message)) {
    return message.map((item) => `- ${item}`).join("\n");
  }
  return message;
}

function setRowError(message) {
  currentRowError = formatRowError(message);
  rowErrorDismissed = false;
}

function clearRowError() {
  currentRowError = "";
  rowErrorDismissed = false;
}

function dismissRowError() {
  if (!currentRowError) {
    return;
  }

  rowErrorDismissed = true;
}

function canUseRandomStart() {
  return (
    gameStatus === "playing" &&
    submittedGuesses.length === 0 &&
    activeRow === 0 &&
    activeCol === 0
  );
}

function cloneBoardState() {
  return boardState.map((row) => row.map((cell) => ({ ...cell })));
}

function restoreBoardState(snapshotBoard) {
  boardState.forEach((row, rowIndex) => {
    row.forEach((cell, colIndex) => {
      cell.letter = snapshotBoard[rowIndex][colIndex].letter;
      cell.state = snapshotBoard[rowIndex][colIndex].state;
    });
  });
}

function saveSnapshot() {
  undoStack.push({
    board: cloneBoardState(),
    activeRow,
    activeCol,
    submittedGuesses: [...submittedGuesses],
    submittedPatterns: submittedPatterns.map((pattern) => [...pattern]),
    candidateWords: [...candidateWords],
    rowRemainingCounts: [...rowRemainingCounts],
    gameStatus,
  });
}

function placeCursor(rowIndex, colIndex) {
  if (
    gameStatus !== "playing" ||
    activeRow >= ROW_COUNT ||
    rowIndex !== activeRow ||
    colIndex < 0 ||
    colIndex >= COL_COUNT
  ) {
    return;
  }

  activeCol = colIndex;
  syncUi();
}

function moveCursor(offset) {
  if (
    gameStatus !== "playing" ||
    activeRow >= ROW_COUNT ||
    !Number.isInteger(offset) ||
    offset === 0
  ) {
    return;
  }

  const nextCol = Math.max(0, Math.min(COL_COUNT - 1, activeCol + offset));
  if (nextCol === activeCol) {
    return;
  }

  activeCol = nextCol;
  syncUi();
}

function syncUi() {
  setTopCount(candidateWords.length);
  setUndoCount(
    undosRemaining,
    gameStatus === "playing" && undoStack.length > 0,
  );
  updateRandomStartButtonState(canUseRandomStart());
  renderBoard({
    boardState,
    activeRow,
    activeCol,
    gameStatus,
    currentRowError,
    rowErrorDismissed,
    rowRemainingCounts,
    candidateWordsLength: candidateWords.length,
  });
  updateKeyboardVisuals(boardState, canonicalLetter);
}

function addLetter(letter) {
  if (
    gameStatus !== "playing" ||
    activeRow >= ROW_COUNT ||
    activeCol >= COL_COUNT
  ) {
    return;
  }

  boardState[activeRow][activeCol].letter = letter;
  boardState[activeRow][activeCol].state = "draft";
  activeCol = Math.min(activeCol + 1, COL_COUNT - 1);
}

function removeLetter() {
  if (gameStatus !== "playing" || activeRow >= ROW_COUNT) {
    return;
  }

  const currentCell = boardState[activeRow][activeCol];

  if (currentCell.letter) {
    currentCell.letter = "";
    currentCell.state = "empty";
    return;
  }

  if (activeCol <= 0) {
    return;
  }

  activeCol -= 1;
  boardState[activeRow][activeCol].letter = "";
  boardState[activeRow][activeCol].state = "empty";
}

function markSubmittedRow(rowIndex, pattern) {
  pattern.forEach((state, colIndex) => {
    boardState[rowIndex][colIndex].state = state;

    // Show the accented target letter when the tile is green.
    if (state === "hit") {
      boardState[rowIndex][colIndex].letter = targetWord[colIndex];
    }
  });
}

function logGameDebug(stepLabel) {
  console.log(`[Don't Wordle][${stepLabel}] targetWord=`, targetWord);
  console.log(
    `[Don't Wordle][${stepLabel}] validWords(${candidateWords.length})=`,
    candidateWords,
  );
}

function violationMessages() {
  return {
    mustStay: (letter, position) =>
      t("errors.mustStay", { letter: letter.toUpperCase(), position }),
    cannotStay: (letter, position) =>
      t("errors.cannotStay", { letter: letter.toUpperCase(), position }),
    mustExistElsewhere: (letter) =>
      t("errors.mustExistElsewhere", { letter: letter.toUpperCase() }),
    eliminatedLetter: (letter) =>
      t("errors.eliminatedLetter", { letter: letter.toUpperCase() }),
  };
}

function submitGuess() {
  if (gameStatus !== "playing") {
    return;
  }

  if (activeRow >= ROW_COUNT) {
    return;
  }

  if (!rowIsComplete(boardState, activeRow)) {
    setRowError(t("errors.shortWord"));
    syncUi();
    return;
  }

  const guess = canonicalWord(rowWord(boardState, activeRow));

  if (!dictionaryCanonicalSet.has(guess)) {
    setRowError(
      t("errors.dictionaryWordMissing", { word: guess.toLocaleUpperCase() }),
    );
    syncUi();
    return;
  }

  if (!candidateMatchesGuess(candidateWords, guess)) {
    const violations = findRuleViolations(
      guess,
      submittedGuesses,
      submittedPatterns,
      violationMessages(),
    );
    if (!violations.length) {
      violations.push(t("errors.repeatedLettersHint"));
    }
    setRowError(violations);
    syncUi();
    return;
  }

  clearRowError();

  saveSnapshot();

  const candidatesBeforeGuess = candidateWords.length;
  const pattern = evaluateGuess(targetWord, guess);
  submittedGuesses.push(guess);
  submittedPatterns.push(pattern);
  markSubmittedRow(activeRow, pattern);

  candidateWords = computeCandidates(
    dictionaryWords,
    submittedGuesses,
    submittedPatterns,
  );
  rowRemainingCounts[activeRow] = candidatesBeforeGuess;
  logGameDebug(`guess-${activeRow + 1}`);

  if (guess === canonicalWord(targetWord)) {
    gameStatus = "lost";
    setStatusText(
      t("status.loseDirect", { word: targetWord.toUpperCase() }),
      "error",
    );
    syncUi();
    return;
  }

  const attemptsRemaining = ROW_COUNT - (activeRow + 1);
  if (candidateWords.length <= attemptsRemaining) {
    gameStatus = "lost";
    setStatusText(
      t("status.loseCandidates", {
        count: formatCount(candidateWords.length),
        attempts: attemptsRemaining,
        word: targetWord.toUpperCase(),
      }),
      "error",
    );
    syncUi();
    return;
  }

  activeRow += 1;
  activeCol = 0;

  if (activeRow >= ROW_COUNT) {
    gameStatus = "won";
    setStatusText(
      t("status.win", { word: targetWord.toLocaleUpperCase() }),
      "success",
    );
  }

  syncUi();
}

function undoLastGuess() {
  if (gameStatus !== "playing") {
    return;
  }

  if (undoStack.length === 0) {
    setStatusText(t("errors.noUndoMove"), "error");
    return;
  }

  if (undosRemaining <= 0) {
    setStatusText(t("errors.noUndosLeft"), "error");
    return;
  }

  const snapshot = undoStack.pop();
  restoreBoardState(snapshot.board);
  activeRow = snapshot.activeRow;
  activeCol = snapshot.activeCol;
  submittedGuesses = [...snapshot.submittedGuesses];
  submittedPatterns = snapshot.submittedPatterns.map((pattern) => [...pattern]);
  candidateWords = [...snapshot.candidateWords];
  rowRemainingCounts = [...snapshot.rowRemainingCounts];
  gameStatus = snapshot.gameStatus;

  // Undo should remove the submitted word entirely, not restore the pre-Enter draft row.
  for (let colIndex = 0; colIndex < COL_COUNT; colIndex += 1) {
    boardState[activeRow][colIndex].letter = "";
    boardState[activeRow][colIndex].state = "empty";
  }
  activeCol = 0;

  undosRemaining -= 1;

  clearRowError();
  syncUi();
  logGameDebug("undo");
}

function randomStartingWord() {
  if (!canUseRandomStart()) {
    return;
  }

  const randomGuess = canonicalWord(
    candidateWords[randomIndex(candidateWords.length)],
  );
  for (let i = 0; i < COL_COUNT; i += 1) {
    boardState[0][i].letter = randomGuess[i];
    boardState[0][i].state = "draft";
  }
  activeCol = COL_COUNT;
  syncUi();
  submitGuess();
}

function startNewGame() {
  if (!dictionaryWords.length) {
    setStatusText(t("errors.dictionaryNotLoaded"), "error");
    return;
  }

  initGame(dictionaryWords);
}

function handleKeyInput(inputKey) {
  if (inputKey === "enter") {
    submitGuess();
  } else if (inputKey === "backspace") {
    removeLetter();
    clearRowError();
  } else if (activeLanguageConfig.letterPattern.test(inputKey)) {
    addLetter(inputKey);
    clearRowError();
  }

  syncUi();
}

function bindControls() {
  const board = document.getElementById("board");
  const randomStartButton = document.getElementById("randomStartButton");
  const newGameButton = document.getElementById("newGameButton");
  const undoButton = document.getElementById("undoButton");

  if (!(board instanceof HTMLElement)) {
    return;
  }

  board.addEventListener("click", (event) => {
    const target = event.target;
    if (!(target instanceof HTMLElement)) {
      return;
    }

    const dismissButton = target.closest(".row-error-dismiss");
    if (dismissButton instanceof HTMLButtonElement) {
      dismissRowError();
      syncUi();
      return;
    }

    const tile = target.closest(".tile");
    if (!(tile instanceof HTMLElement)) {
      return;
    }

    const rowIndex = Number(tile.dataset.row);
    const colIndex = Number(tile.dataset.col);

    if (Number.isNaN(rowIndex) || Number.isNaN(colIndex)) {
      return;
    }

    placeCursor(rowIndex, colIndex);
  });

  randomStartButton?.addEventListener("click", randomStartingWord);
  newGameButton?.addEventListener("click", startNewGame);
  undoButton?.addEventListener("click", undoLastGuess);
}

function bindHelpModal() {
  const helpButton = document.getElementById("helpButton");
  const dialog = document.getElementById("helpModal");
  const closeButton = document.getElementById("helpModalCloseButton");

  if (
    !(helpButton instanceof HTMLButtonElement) ||
    !(dialog instanceof HTMLDialogElement) ||
    !(closeButton instanceof HTMLButtonElement)
  ) {
    return;
  }

  const closeModal = () => {
    dialog.close();
    helpButton.focus();
  };

  helpButton.addEventListener("click", () => {
    if (!dialog.open) {
      dialog.showModal();
    }
    closeButton.focus();
  });

  closeButton.addEventListener("click", closeModal);

  dialog.addEventListener("click", (event) => {
    const rect = dialog.getBoundingClientRect();
    const isInsideDialog =
      event.clientX >= rect.left &&
      event.clientX <= rect.right &&
      event.clientY >= rect.top &&
      event.clientY <= rect.bottom;

    if (!isInsideDialog) {
      closeModal();
    }
  });

  window.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && dialog.open) {
      event.preventDefault();
      closeModal();
    }
  });
}

function bindGitHubButton() {
  const gitHubButton = document.getElementById("gitHubButton");
  if (!(gitHubButton instanceof HTMLButtonElement)) {
    return;
  }

  gitHubButton.addEventListener("click", () => {
    globalThis.open(
      "https://github.com/tiagojufr/dont-wordle-multi-language",
      "_blank",
      "noopener,noreferrer",
    );
  });
}

function resolveTargetWord(words) {
  const randomWord = words[randomIndex(words.length)];
  const host = globalThis.location?.hostname;
  const isLocalHost = host === "localhost" || host === "127.0.0.1";
  if (!isLocalHost) {
    return randomWord;
  }

  const forcedTarget = new URLSearchParams(globalThis.location.search)
    .get("target")
    ?.trim();
  if (!forcedTarget) {
    return randomWord;
  }

  const canonicalForced = canonicalWord(forcedTarget);
  const matchedWord = words.find(
    (word) => canonicalWord(word) === canonicalForced,
  );
  return matchedWord || randomWord;
}

function initGame(words) {
  dictionaryWords = words;
  dictionaryCanonicalSet = new Set(words.map((word) => canonicalWord(word)));
  targetWord = resolveTargetWord(words);
  candidateWords = [...words];
  submittedGuesses = [];
  submittedPatterns = [];
  rowRemainingCounts = Array.from({ length: ROW_COUNT }, () => null);
  undoStack = [];
  undosRemaining = INITIAL_UNDOS;
  gameStatus = "playing";
  activeRow = 0;
  activeCol = 0;
  currentRowError = "";
  rowErrorDismissed = false;

  const empty = createEmptyBoard(ROW_COUNT, COL_COUNT);
  restoreBoardState(empty);

  const newGameButton = document.getElementById("newGameButton");
  if (newGameButton instanceof HTMLButtonElement) {
    newGameButton.disabled = false;
  }

  setStatusText("");
  syncUi();
  logGameDebug("init");
}

async function applyLanguage(languageCode) {
  const { code, config, words } = await loadLanguage(languageCode, LANGUAGES);

  activeLanguageCode = code;
  activeLanguageConfig = config;
  document.documentElement.lang = activeLanguageConfig.htmlLang;

  configureAlphabet({ foldMap: activeLanguageConfig.foldMap });
  configureKeyboardInput({ letterPattern: activeLanguageConfig.letterPattern });
  setNumberFormatLocale(activeLanguageConfig.numberFormatLocale);

  applyStaticTranslations();
  setDismissWarningLabel(t("ui.dismissWarning"));
  refreshThemeToggleTranslation();

  renderLanguageSwitcher({
    languages: LANGUAGES,
    currentCode: activeLanguageCode,
    onSelect: switchLanguage,
    buttonLabel: t("language.picker"),
  });

  renderKeyboard(handleKeyInput, activeLanguageConfig.keyboardRows);

  initGame(words);
}

async function switchLanguage(languageCode) {
  if (languageCode === activeLanguageCode) {
    return;
  }

  try {
    await applyLanguage(languageCode);
  } catch {
    setStatusText(t("errors.dictionaryLoadFailed"), "error");
  }
}

bindControls();
bindHelpModal();
bindThemeToggle();
bindGitHubButton();
bindPhysicalKeyboard(handleKeyInput, {
  moveCursorLeft: () => moveCursor(-1),
  moveCursorRight: () => moveCursor(1),
});

try {
  await initializeI18n(LANGUAGES);
  const initialLanguageCode = detectInitialLanguage(LANGUAGES);
  await applyLanguage(initialLanguageCode);
} catch {
  setStatusText("Could not load the dictionary.", "error");
}
