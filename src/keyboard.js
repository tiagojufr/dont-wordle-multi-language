import { canonicalLetter } from "./game-logic.js";

const defaultKeyRows = [
  ["q", "w", "e", "r", "t", "y", "u", "i", "o", "p"],
  ["a", "s", "d", "f", "g", "h", "j", "k", "l", "backspace"],
  ["z", "x", "c", "v", "b", "n", "m", "enter"],
];

let currentLetterPattern = /^[a-z]$/;
let keyboardBound = false;
let virtualKeyboardBound = false;
let virtualKeyboardInputHandler = null;

function keyLabel(key) {
  if (key === "backspace") {
    return "\u2794";
  }
  if (key === "enter") {
    return "\u21A9";
  }
  return key;
}

function normalizeKeyboardInput(key) {
  if (key === "Backspace") {
    return "backspace";
  }
  if (key === "Enter") {
    return "enter";
  }

  const normalized = canonicalLetter(key);
  if (currentLetterPattern.test(normalized)) {
    return normalized;
  }

  return null;
}

export function configureKeyboardInput({ letterPattern } = {}) {
  if (letterPattern instanceof RegExp) {
    currentLetterPattern = letterPattern;
  }
}

export function renderKeyboard(onKeyInput, keyRows = defaultKeyRows) {
  const keyboard = document.getElementById("keyboard");
  if (!keyboard) {
    return;
  }

  virtualKeyboardInputHandler = onKeyInput;

  keyboard.innerHTML = "";

  keyRows.forEach((row) => {
    const rowEl = document.createElement("div");
    rowEl.className = "key-row";

    row.forEach((key) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "key";
      button.textContent = keyLabel(key);
      button.dataset.key = key;

      if (key === "enter" || key === "backspace") {
        button.classList.add("wide");
      }

      if (key === "enter") {
        button.classList.add("key-enter");
      }

      if (key === "backspace") {
        button.classList.add("key-backspace");
      }

      rowEl.appendChild(button);
    });

    keyboard.appendChild(rowEl);
  });

  if (virtualKeyboardBound) {
    return;
  }

  virtualKeyboardBound = true;

  keyboard.addEventListener("click", (event) => {
    const target = event.target;
    if (!(target instanceof HTMLElement)) {
      return;
    }

    const button = target.closest(".key");
    if (!(button instanceof HTMLButtonElement)) {
      return;
    }

    const key = button.dataset.key;
    if (!key || typeof virtualKeyboardInputHandler !== "function") {
      return;
    }

    virtualKeyboardInputHandler(key);
  });
}

export function bindPhysicalKeyboard(
  onKeyInput,
  { moveCursorLeft, moveCursorRight },
) {
  if (keyboardBound) {
    return;
  }

  keyboardBound = true;

  window.addEventListener("keydown", (event) => {
    const target = event.target;
    if (
      target instanceof HTMLElement &&
      ["INPUT", "TEXTAREA"].includes(target.tagName)
    ) {
      return;
    }

    if (event.key === "ArrowLeft") {
      event.preventDefault();
      moveCursorLeft();
      return;
    }

    if (event.key === "ArrowRight") {
      event.preventDefault();
      moveCursorRight();
      return;
    }

    const key = normalizeKeyboardInput(event.key);
    if (!key) {
      return;
    }

    event.preventDefault();
    onKeyInput(key);
  });
}
