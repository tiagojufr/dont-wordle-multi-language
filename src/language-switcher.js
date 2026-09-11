import { svgToDataUri } from "./utils/svg-to-data-uri.js";

let listenersAbortController = null;

function createLanguageOption({ code, config, isSelected, onSelect }) {
  const listItem = document.createElement("li");
  const button = document.createElement("button");
  button.type = "button";
  button.className = `language-option${isSelected ? " is-selected" : ""}`;
  if (isSelected) {
    button.setAttribute("aria-current", "true");
  }
  button.dataset.languageOption = code;

  const flag = document.createElement("img");
  flag.className = "language-flag";
  flag.src = svgToDataUri(config.flagSvg);
  flag.alt = "";
  flag.setAttribute("aria-hidden", "true");

  const label = document.createElement("span");
  label.textContent = config.label;

  button.append(flag, label);
  button.addEventListener("click", onSelect);
  listItem.append(button);

  return listItem;
}

export function renderLanguageSwitcher({
  languages,
  currentCode,
  onSelect,
  buttonLabel,
}) {
  const mount = document.getElementById("languageSwitcher");
  if (!mount) {
    return;
  }

  const currentConfig = languages[currentCode];
  if (!currentConfig) {
    return;
  }

  const trigger = mount.querySelector("#languageSwitcherTrigger");
  const panel = mount.querySelector("#languageSwitcherPanel");
  const triggerFlag = mount.querySelector("#languageSwitcherFlag");
  const triggerCode = mount.querySelector("#languageSwitcherCode");

  if (
    !(trigger instanceof HTMLButtonElement) ||
    !(panel instanceof HTMLElement) ||
    !(triggerFlag instanceof HTMLImageElement) ||
    !(triggerCode instanceof HTMLElement)
  ) {
    return;
  }

  trigger.setAttribute("aria-label", buttonLabel);
  trigger.setAttribute("title", buttonLabel);
  triggerFlag.src = svgToDataUri(currentConfig.flagSvg);
  triggerCode.textContent = currentConfig.code.toUpperCase();

  const closePanel = () => {
    panel.hidden = true;
    trigger.setAttribute("aria-expanded", "false");
  };

  const openPanel = () => {
    panel.hidden = false;
    trigger.setAttribute("aria-expanded", "true");
  };

  trigger.onclick = () => {
    if (panel.hidden) {
      openPanel();
      return;
    }
    closePanel();
  };

  const optionNodes = Object.entries(languages).map(([code, config]) =>
    createLanguageOption({
      code,
      config,
      isSelected: code === currentCode,
      onSelect: async () => {
        const nextCode = code;
        closePanel();
        if (!nextCode || nextCode === currentCode) {
          return;
        }

        await onSelect(nextCode);
      },
    }),
  );

  panel.replaceChildren(...optionNodes);

  listenersAbortController?.abort();
  listenersAbortController = new AbortController();

  document.addEventListener(
    "click",
    (event) => {
      const target = event.target;
      if (!(target instanceof Node)) {
        return;
      }
      if (!mount.contains(target)) {
        closePanel();
      }
    },
    { signal: listenersAbortController.signal },
  );

  window.addEventListener(
    "keydown",
    (event) => {
      if (event.key === "Escape") {
        closePanel();
      }
    },
    { signal: listenersAbortController.signal },
  );
}
