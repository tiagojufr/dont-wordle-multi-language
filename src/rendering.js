let numberFormatLocale = "en-US";
let dismissWarningLabel = "Dismiss warning";

export function setNumberFormatLocale(locale) {
  numberFormatLocale = locale || "en-US";
}

export function setDismissWarningLabel(label) {
  dismissWarningLabel = label || "Dismiss warning";
}

function formatCount(value) {
  return new Intl.NumberFormat(numberFormatLocale).format(value);
}

export function setStatusText(message, tone = "info") {
  const statusText = document.getElementById("statusText");
  if (!statusText) {
    return;
  }

  if (Array.isArray(message)) {
    statusText.textContent = message.map((item) => `- ${item}`).join("\n");
  } else {
    statusText.textContent = message;
  }
  statusText.classList.remove("status-info", "status-success", "status-error");

  if (tone === "error") {
    statusText.classList.add("status-error");
    statusText.setAttribute("aria-live", "assertive");
    return;
  }

  if (tone === "success") {
    statusText.classList.add("status-success");
    statusText.setAttribute("aria-live", "polite");
    return;
  }

  statusText.classList.add("status-info");
  statusText.setAttribute("aria-live", "polite");
}

export function setTopCount(value) {
  const count = document.getElementById("remainingCount");
  if (!count) {
    return;
  }

  count.textContent = formatCount(value);
}

export function setUndoCount(value, canUndo) {
  const count = document.getElementById("undosRemaining");
  if (count) {
    count.textContent = String(value);
  }

  const undoButton = document.getElementById("undoButton");
  if (undoButton instanceof HTMLButtonElement) {
    undoButton.disabled = value <= 0 || !canUndo;
  }
}

export function updateRandomStartButtonState(canUseRandomStart) {
  const randomStartButton = document.getElementById("randomStartButton");
  if (!(randomStartButton instanceof HTMLButtonElement)) {
    return;
  }

  randomStartButton.disabled = !canUseRandomStart;
}

function rowRemainingAt(
  rowRemainingCounts,
  rowIndex,
  activeRow,
  gameStatus,
  candidateWordsLength,
) {
  const value = rowRemainingCounts[rowIndex];
  if (value !== null) {
    return value;
  }
  if (rowIndex === activeRow && gameStatus === "playing") {
    return candidateWordsLength;
  }
  return null;
}

export function renderBoard({
  boardState,
  activeRow,
  activeCol,
  gameStatus,
  currentRowError,
  rowErrorDismissed,
  rowRemainingCounts,
  candidateWordsLength,
}) {
  const board = document.getElementById("board");
  if (!board) {
    return;
  }

  board.innerHTML = "";

  boardState.forEach((row, rowIndex) => {
    const lineEl = document.createElement("div");
    lineEl.className = "guess-line";
    if (rowIndex === activeRow && gameStatus === "playing") {
      lineEl.classList.add("active");
    }

    const rowEl = document.createElement("div");
    rowEl.className = "guess-row";

    row.forEach((cell, colIndex) => {
      const tile = document.createElement("div");
      tile.className = `tile ${cell.state}`;
      tile.textContent = cell.letter;
      tile.dataset.row = String(rowIndex);
      tile.dataset.col = String(colIndex);

      if (
        gameStatus === "playing" &&
        rowIndex === activeRow &&
        colIndex === activeCol
      ) {
        tile.classList.add("cursor");
      }

      rowEl.appendChild(tile);
    });

    const remainingEl = document.createElement("p");
    remainingEl.className = "row-remaining";
    const rowCount = rowRemainingAt(
      rowRemainingCounts,
      rowIndex,
      activeRow,
      gameStatus,
      candidateWordsLength,
    );
    remainingEl.innerHTML =
      rowCount === null
        ? "<strong>-</strong>"
        : `<strong>${formatCount(rowCount)}</strong>`;

    const rowErrorEl = document.createElement("div");
    rowErrorEl.className = "row-error";
    rowErrorEl.setAttribute("aria-live", "assertive");
    const shouldShowRowError =
      rowIndex === activeRow && currentRowError && !rowErrorDismissed;

    if (shouldShowRowError) {
      const messageEl = document.createElement("p");
      messageEl.className = "row-error-message";
      messageEl.textContent = currentRowError;

      const dismissButton = document.createElement("button");
      dismissButton.className = "row-error-dismiss";
      dismissButton.type = "button";
      dismissButton.setAttribute("aria-label", dismissWarningLabel);
      dismissButton.title = dismissWarningLabel;
      dismissButton.textContent = "x";

      rowErrorEl.appendChild(messageEl);
      rowErrorEl.appendChild(dismissButton);
    }

    lineEl.appendChild(rowEl);
    lineEl.appendChild(remainingEl);
    lineEl.appendChild(rowErrorEl);
    board.appendChild(lineEl);
  });
}

export function updateKeyboardVisuals(boardState, canonicalLetter) {
  const keyboard = document.getElementById("keyboard");
  if (!keyboard) {
    return;
  }

  keyboard.querySelectorAll(".key").forEach((button) => {
    button.classList.remove("state-miss", "state-warn", "state-hit");

    const key = button.dataset.key;
    if (!key || key === "enter" || key === "backspace") {
      return;
    }

    let stateClass = "";
    boardState.forEach((row) => {
      row.forEach((cell) => {
        if (canonicalLetter(cell.letter) !== key) {
          return;
        }

        if (cell.state === "hit") {
          stateClass = "state-hit";
          return;
        }
        if (cell.state === "warn" && stateClass !== "state-hit") {
          stateClass = "state-warn";
          return;
        }
        if (cell.state === "miss" && !stateClass) {
          stateClass = "state-miss";
        }
      });
    });

    if (stateClass) {
      button.classList.add(stateClass);
    }
  });
}
