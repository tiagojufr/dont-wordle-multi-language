const TEST_WORD_LIST = [
  "about",
  "baker",
  "cabin",
  "cable",
  "candy",
  "delta",
  "eager",
  "fable",
  "gamer",
  "happy",
  "jelly",
  "knife",
  "lemon",
  "mango",
  "noble",
  "ocean",
  "piano",
  "quest",
  "raven",
  "zebra",
];

function parseCount(textValue) {
  const digits = String(textValue || "").replace(/[^\d]/g, "");
  return Number(digits || "0");
}

async function mockDictionary(
  page,
  words,
  routePath = "**/dictionaries/en.txt",
) {
  const body = words.join("\n");
  await page.route(routePath, (route) =>
    route.fulfill({
      status: 200,
      contentType: "text/plain",
      body,
    }),
  );
}

async function waitForGameReady(page) {
  await page.waitForSelector(".guess-line");
  await page.waitForFunction(() => {
    const count = document.getElementById("remainingCount")?.textContent || "";
    return /\d/.test(count);
  });
}

async function gotoWithTarget(page, word) {
  await page.goto(`/?target=${encodeURIComponent(word)}`);
  await waitForGameReady(page);
}

async function submitWord(page, word) {
  for (const letter of word.toLowerCase()) {
    await page.locator(`.key[data-key="${letter}"]`).click();
  }
  await page.locator('.key[data-key="enter"]').click();
}

function rowTiles(page, rowIndex) {
  return page.locator(`.guess-line:nth-child(${rowIndex + 1}) .tile`);
}

export {
  TEST_WORD_LIST,
  gotoWithTarget,
  mockDictionary,
  parseCount,
  rowTiles,
  submitWord,
  waitForGameReady,
};
