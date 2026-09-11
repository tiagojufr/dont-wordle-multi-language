export function createEmptyBoard(rowCount, colCount) {
  return Array.from({ length: rowCount }, () =>
    Array.from({ length: colCount }, () => ({ letter: "", state: "empty" })),
  );
}

let currentFoldMap = new Map();

export function configureAlphabet({ foldMap = {} } = {}) {
  currentFoldMap = new Map(
    Object.entries(foldMap).map(([source, target]) => [
      source.toLocaleLowerCase(),
      target.toLocaleLowerCase(),
    ]),
  );
}

export function canonicalLetter(letter) {
  const lower = letter.toLocaleLowerCase();
  if (currentFoldMap.has(lower)) {
    return currentFoldMap.get(lower);
  }
  return lower;
}

export function canonicalWord(word) {
  return [...word].map((letter) => canonicalLetter(letter)).join("");
}

export function randomIndex(maxExclusive) {
  if (!Number.isInteger(maxExclusive) || maxExclusive <= 0) {
    return 0;
  }

  const randomValues = new Uint32Array(1);
  const maxUint32 = 0x100000000;
  const limit = maxUint32 - (maxUint32 % maxExclusive);

  let value = 0;
  do {
    crypto.getRandomValues(randomValues);
    value = randomValues[0];
  } while (value >= limit);

  return value % maxExclusive;
}

export function evaluateGuess(solution, guess) {
  const colCount = guess.length;
  const result = Array.from({ length: colCount }, () => "miss");
  const remaining = new Map();

  for (let i = 0; i < colCount; i += 1) {
    if (canonicalLetter(guess[i]) === canonicalLetter(solution[i])) {
      result[i] = "hit";
    } else {
      const key = canonicalLetter(solution[i]);
      const count = remaining.get(key) || 0;
      remaining.set(key, count + 1);
    }
  }

  for (let i = 0; i < colCount; i += 1) {
    if (result[i] === "hit") {
      continue;
    }

    const letter = canonicalLetter(guess[i]);
    const available = remaining.get(letter) || 0;
    if (available > 0) {
      result[i] = "warn";
      remaining.set(letter, available - 1);
    }
  }

  return result;
}

export function patternEquals(a, b) {
  const colCount = a.length;
  for (let i = 0; i < colCount; i += 1) {
    if (a[i] !== b[i]) {
      return false;
    }
  }
  return true;
}

export function computeCandidates(
  dictionaryWords,
  submittedGuesses,
  submittedPatterns,
) {
  if (!submittedGuesses.length) {
    return [...dictionaryWords];
  }

  return dictionaryWords.filter((candidate) => {
    for (let i = 0; i < submittedGuesses.length; i += 1) {
      const expected = submittedPatterns[i];
      const observed = evaluateGuess(candidate, submittedGuesses[i]);
      if (!patternEquals(expected, observed)) {
        return false;
      }
    }
    return true;
  });
}

function deriveRuleHints(submittedGuesses, submittedPatterns) {
  const colCount = submittedGuesses[0]?.length || 5;
  const greenByPos = Array.from({ length: colCount }, () => null);
  const yellowLetterSet = new Set();
  const yellowForbiddenByPos = Array.from(
    { length: colCount },
    () => new Set(),
  );
  const hasPositiveLetter = new Set();
  const hasGrayLetter = new Set();

  submittedGuesses.forEach((guess, rowIndex) => {
    const pattern = submittedPatterns[rowIndex];
    for (let i = 0; i < colCount; i += 1) {
      const letter = guess[i];
      const state = pattern[i];

      if (state === "hit") {
        greenByPos[i] = letter;
        hasPositiveLetter.add(letter);
      }

      if (state === "warn") {
        yellowLetterSet.add(letter);
        yellowForbiddenByPos[i].add(letter);
        hasPositiveLetter.add(letter);
      }

      if (state === "miss") {
        hasGrayLetter.add(letter);
      }
    }
  });

  const eliminatedLetters = new Set(
    [...hasGrayLetter].filter((letter) => !hasPositiveLetter.has(letter)),
  );

  return {
    greenByPos,
    yellowLetterSet,
    yellowForbiddenByPos,
    eliminatedLetters,
  };
}

export function findRuleViolations(
  guess,
  submittedGuesses,
  submittedPatterns,
  messages,
) {
  if (!submittedGuesses.length) {
    return [];
  }

  const hints = deriveRuleHints(submittedGuesses, submittedPatterns);
  const violations = [];

  for (let i = 0; i < guess.length; i += 1) {
    const mustBe = hints.greenByPos[i];
    if (mustBe && guess[i] !== mustBe) {
      violations.push(messages.mustStay(mustBe, i + 1));
    }
  }

  for (let i = 0; i < guess.length; i += 1) {
    const letter = guess[i];
    if (hints.yellowForbiddenByPos[i].has(letter)) {
      violations.push(messages.cannotStay(letter, i + 1));
    }
  }

  for (const letter of hints.yellowLetterSet) {
    if (!guess.includes(letter)) {
      violations.push(messages.mustExistElsewhere(letter));
    }
  }

  for (const letter of guess) {
    if (hints.eliminatedLetters.has(letter)) {
      violations.push(messages.eliminatedLetter(letter));
    }
  }

  return [...new Set(violations)];
}

export function rowIsComplete(boardState, rowIndex) {
  return boardState[rowIndex].every((cell) => Boolean(cell.letter));
}

export function rowWord(boardState, rowIndex) {
  return boardState[rowIndex].map((cell) => cell.letter).join("");
}

export function candidateMatchesGuess(candidateWords, guess) {
  const canonicalGuess = canonicalWord(guess);
  return candidateWords.some(
    (candidate) => canonicalWord(candidate) === canonicalGuess,
  );
}
