import flagUsSvg from "country-flag-icons/string/3x2/US";

export const config = {
  code: "en",
  htmlLang: "en",
  numberFormatLocale: "en-US",
  label: "English",
  flagSvg: flagUsSvg,
  keyboardRows: [
    ["q", "w", "e", "r", "t", "y", "u", "i", "o", "p"],
    ["a", "s", "d", "f", "g", "h", "j", "k", "l", "backspace"],
    ["z", "x", "c", "v", "b", "n", "m", "enter"],
  ],
  letterPattern: /^[a-z]$/,
  foldMap: {},
  loadStrings: () => import("./strings.js"),
};
