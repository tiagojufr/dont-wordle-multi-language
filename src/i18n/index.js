import i18next from "i18next";
import { DEFAULT_LANGUAGE_CODE } from "./languages.js";

const LANGUAGE_STORAGE_KEY = "dont-wordle-language";

let initPromise = null;

async function ensureLanguageBundle(languageCode, languages) {
  const config = languages[languageCode];
  if (!config) {
    throw new Error(`Unknown language: ${languageCode}`);
  }

  const hasBundle = i18next.hasResourceBundle(languageCode, "translation");
  if (hasBundle) {
    return;
  }

  if (typeof config.loadStrings !== "function") {
    throw new Error(`Missing language module for code: ${languageCode}`);
  }

  const module = await config.loadStrings();
  const resources = module.default || {};
  i18next.addResourceBundle(languageCode, "translation", resources, true, true);
}

function normalizeCode(value) {
  return String(value || "")
    .trim()
    .toLowerCase();
}

export function resolveLanguageCode(preferredCode, languages) {
  const entries = Object.entries(languages);
  const preferred = normalizeCode(preferredCode);

  if (preferred) {
    const fullMatch = entries.find(
      ([, config]) => normalizeCode(config.code) === preferred,
    );
    if (fullMatch) {
      return fullMatch[0];
    }

    const base = preferred.split("-")[0];
    const baseMatch = entries.find(
      ([, config]) => normalizeCode(config.code).split("-")[0] === base,
    );
    if (baseMatch) {
      return baseMatch[0];
    }
  }

  return null;
}

export function getStoredLanguage() {
  try {
    return globalThis.localStorage?.getItem(LANGUAGE_STORAGE_KEY);
  } catch {
    return null;
  }
}

export function setStoredLanguage(code) {
  try {
    globalThis.localStorage?.setItem(LANGUAGE_STORAGE_KEY, code);
  } catch {
    // Ignore write errors.
  }
}

export async function initializeI18n(languages) {
  if (initPromise) {
    return initPromise;
  }

  initPromise = i18next
    .init({
      lng: DEFAULT_LANGUAGE_CODE,
      fallbackLng: DEFAULT_LANGUAGE_CODE,
      interpolation: {
        escapeValue: false,
      },
      resources: {},
    })
    .then(() => ensureLanguageBundle(DEFAULT_LANGUAGE_CODE, languages));

  await initPromise;
}

export function detectInitialLanguage(languages) {
  const stored = getStoredLanguage();
  if (stored) {
    return resolveLanguageCode(stored, languages) || DEFAULT_LANGUAGE_CODE;
  }

  const browserPreferences = [
    ...(globalThis.navigator?.languages || []),
    globalThis.navigator?.language,
  ].filter(Boolean);

  for (const preference of browserPreferences) {
    const resolved = resolveLanguageCode(preference, languages);
    if (resolved && resolved in languages) {
      return resolved;
    }
  }

  return DEFAULT_LANGUAGE_CODE;
}

export function t(key, vars = {}) {
  return i18next.t(key, vars);
}

export function applyStaticTranslations(_unusedStrings, root = document) {
  root.querySelectorAll("[data-i18n]").forEach((node) => {
    const key = node.dataset.i18n;
    if (!key) {
      return;
    }
    node.textContent = i18next.t(key);
  });

  root.querySelectorAll("[data-i18n-attr]").forEach((node) => {
    const descriptor = node.dataset.i18nAttr;
    if (!descriptor) {
      return;
    }

    descriptor.split("|").forEach((pair) => {
      const [attributeName, key] = pair.split(":").map((value) => value.trim());
      if (!attributeName || !key) {
        return;
      }
      node.setAttribute(attributeName, i18next.t(key));
    });
  });
}

export async function loadLanguage(languageCode, languages) {
  await initializeI18n(languages);

  const resolvedCode =
    resolveLanguageCode(languageCode, languages) || DEFAULT_LANGUAGE_CODE;
  const config = languages[resolvedCode];

  if (!config) {
    throw new Error(`Unknown language: ${languageCode}`);
  }

  await ensureLanguageBundle(resolvedCode, languages);
  await i18next.changeLanguage(resolvedCode);
  setStoredLanguage(resolvedCode);

  const dictionaryPath = `dictionaries/${config.code}.txt`;
  const response = await fetch(dictionaryPath, { cache: "no-store" });
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }

  const text = await response.text();
  const words = text
    .split(/\r?\n/)
    .map((word) => word.trim())
    .filter(Boolean);

  if (!words.length) {
    throw new Error("Dictionary is empty");
  }

  return {
    code: resolvedCode,
    config,
    words,
  };
}
