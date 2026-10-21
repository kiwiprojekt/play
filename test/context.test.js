/** @jest-environment jsdom */
const fs = require("fs");
const path = require("path");

beforeEach(() => {
  jest.resetModules();
  localStorage.clear();
  document.body.innerHTML = `
    <header class="play-header">KiwiPlay</header>
    <h1 data-i18n>Memory Match</h1>
    <a href="/memo/?existing=1">Memory</a>
    <a href="/letters-match/">Letters</a>
    <a href="https://example.com/">External</a>
    <button aria-label="Back to menu">←</button>`;
});
afterEach(() => {
  window.history.replaceState({}, "", "/");
  document.documentElement.classList.remove("kiosk");
});

it("carries bare kiosk mode through internal links without changing external links", () => {
  window.history.replaceState({}, "", "/?kiosk");
  const context = require("../shared/context.js");
  expect(context.kiosk).toBe(true);
  expect(context.language).toBe("en");
  expect(document.documentElement.classList.contains("kiosk")).toBe(true);
  expect(document.querySelector('a[href*="memo"]').href).toBe("http://localhost/memo/?existing=1&kiosk=");
  expect(document.querySelector('a[href*="example.com"]').href).toBe("https://example.com/");
});

it("defaults every game to Polish and retains kiosk=pl when navigating", () => {
  window.history.replaceState({}, "", "/memo/?kiosk=pl");
  const context = require("../shared/context.js");
  expect(context.language).toBe("pl");
  expect(document.documentElement.lang).toBe("pl");
  expect(document.querySelector("h1").textContent).toBe("Pary");
  expect(document.querySelector("button").getAttribute("aria-label")).toBe("Wróć do menu");
  expect(document.querySelector('a[href*="letters-match"]').href).toBe("http://localhost/letters-match/?kiosk=pl");
});

it("uses Polish letters on kiosk entry even with an earlier English preference", () => {
  window.history.replaceState({}, "", "/letters-match/?kiosk=pl");
  localStorage.setItem("letterMatch_language", "en");
  const settings = require("../letters-match/settings.js");
  expect(settings.getLanguage()).toBe("pl");
  settings.setLanguage("en");
  expect(settings.getLanguage()).toBe("en");
  jest.resetModules();
  expect(require("../letters-match/settings.js").getLanguage()).toBe("pl");
});

it("leaves the regular site and saved language unchanged without kiosk mode", () => {
  window.history.replaceState({}, "", "/");
  localStorage.setItem("letterMatch_language", "pl");
  const context = require("../shared/context.js");
  expect(context.kiosk).toBe(false);
  expect(document.querySelector("h1").textContent).toBe("Memory Match");
  expect(document.querySelector('a[href*="letters-match"]').getAttribute("href")).toBe("/letters-match/");
  expect(require("../letters-match/settings.js").getLanguage()).toBe("pl");
});

it("retains three visual letter-style options with accessible names and no captions", () => {
  const html = fs.readFileSync(path.join(__dirname, "../letters-match/index.html"), "utf8");
  document.body.innerHTML = html.split("<body>")[1].split("</body>")[0];
  for (const group of document.querySelectorAll(".style-switch")) {
    expect([...group.querySelectorAll("button")].map((b) => b.dataset.font)).toEqual(["serif", "hand", "default"]);
    expect(group.textContent.replace(/\s/g, "")).toBe("AaAaAa");
    group.querySelectorAll("button").forEach((button) => expect(button.getAttribute("aria-label")).toBeTruthy());
  }
});
