export default {
  labels: {
    validWords: "Valid Words",
    undos: "Undos",
  },
  aria: {
    stats: "Game stats",
    playArea: "Game area",
    board: "Guess board",
    keyboard: "Virtual keyboard",
  },
  buttons: {
    randomWord: "Random word",
    newGame: "New game",
    undo: "Undo",
    help: "Help",
  },
  help: {
    title: "How to play",
    close: "Close help",
    introLine: "Don't Wordle is like Wordle, but with a twist:",
    rules: {
      pickWord: "The game picks a random secret word",
      avoidWord: "Your goal is to avoid it in 6 attempts",
      feedback:
        "Each valid guess reduces the set of possible words and tile colors show how your guess relates to the secret word",
    },
    examples: {
      aria: "Example with three turns",
      title: "Example with 3 consecutive guesses:",
    },
    colors: {
      title: "Color meanings and rules:",
      miss: {
        label: "Gray",
        description:
          "the letter does not exist in the secret word. You cannot use it again",
      },
      warn: {
        label: "Yellow",
        description:
          "the letter exists in the secret word but is in the wrong position. You must use it in a different position on the next guess",
      },
      hit: {
        label: "Green",
        description:
          "the letter is in the correct position. You must keep it in that position until the end",
      },
    },
  },
  theme: {
    useDark: "Use dark theme",
    useLight: "Use light theme",
  },
  language: {
    picker: "Language",
  },
  ui: {
    dismissWarning: "Dismiss warning",
  },
  errors: {
    shortWord: "The word must have 5 letters.",
    dictionaryWordMissing: 'The word "{{word}}" is not in the dictionary.',
    repeatedLettersHint: "Repeated letter counts do not match previous hints.",
    noUndoMove: "There is no move to undo.",
    noUndosLeft: "No undos left.",
    dictionaryNotLoaded: "Dictionary is not loaded yet.",
    dictionaryLoadFailed: "Could not load dictionary.",
    mustStay: "Letter {{letter}} must stay in position {{position}}.",
    cannotStay: "{{letter}} cannot stay in position {{position}}.",
    mustExistElsewhere: "Letter {{letter}} must exist in another position.",
    eliminatedLetter: "Letter {{letter}} was eliminated and cannot be used.",
  },
  status: {
    loseDirect: 'You lost: the secret word was "{{word}}".',
    loseCandidates:
      'You lost: {{count}} valid words remain for {{attempts}} attempts. The secret word was "{{word}}".',
    win: 'You win! You avoided the secret word "{{word}}" in 6 attempts.',
  },
};
