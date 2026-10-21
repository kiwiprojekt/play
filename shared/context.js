/* URL-controlled presentation and the small shared set of interface labels. */
(function (root) {
  const params = new URLSearchParams(root?.location?.search || "");
  const kiosk = params.has("kiosk");
  const language = params.get("kiosk") === "pl" ? "pl" : "en";
  const polish = {
    "Games": "Gry",
    "Memory Match": "Pary",
    "Letter Match": "Litery",
    "Space Maze": "Kosmiczny labirynt",
    "Transportation": "Pojazdy",
    "Dinosaurs": "Dinozaury",
    "Tools": "Narzędzia",
    "African Animals": "Zwierzęta Afryki",
    "3 pairs": "3 pary",
    "6 pairs": "6 par",
    "All pairs": "Wszystkie pary",
    "Privacy": "Prywatność",
    "Back to menu": "Wróć do menu",
    "Play again": "Zagraj ponownie",
    "Next theme": "Następny zestaw",
    "Next level": "Następny poziom",
    "Next maze": "Następny labirynt",
    "Turn sound on": "Włącz dźwięk",
    "Turn sound off": "Wyłącz dźwięk",
    "Sound on": "Dźwięk włączony",
    "Sound off": "Dźwięk wyłączony",
    "Letter style": "Krój liter",
    "Printed letters": "Litery drukowane",
    "Handwritten letters": "Litery pisane",
    "Letter style follows the level": "Krój liter według poziomu",
    "Alphabet and pronunciation": "Alfabet i wymowa",
    "English alphabet and pronunciation": "Angielski alfabet i wymowa",
    "Polish alphabet and pronunciation": "Polski alfabet i wymowa",
    "Choose a game": "Wybierz grę",
    "Choose a level": "Wybierz poziom",
    "Choose a maze": "Wybierz labirynt",
    "How many pairs?": "Ile par?",
    "Memory game board": "Plansza z parami",
    "memory game": "gra w pary",
    "Card": "Karta",
    "Turn over": "Odkryj",
    "picture": "obrazek",
    "Matched": "Para",
    "Level": "Poziom",
    "Completed": "Ukończony",
    "Endless mode": "Gra bez końca",
    "Hear letter": "Posłuchaj litery",
    "Choose the matching letter": "Wybierz pasującą literę",
    "Letter matching game": "Gra w dopasowywanie liter",
    "Find the matching letter": "Znajdź pasującą literę",
    "Have another look. You can do it!": "Spróbuj jeszcze raz",
    "A match!": "Pasuje!",
    "All pairs found": "Wszystkie pary znalezione",
    "Level complete": "Poziom ukończony",
    "Star found": "Gwiazda znaleziona",
    "Move the rocket": "Przesuń rakietę",
    "Move up": "W górę",
    "Move down": "W dół",
    "Move left": "W lewo",
    "Move right": "W prawo",
    "Space maze game": "Kosmiczny labirynt",
    "Follow the little lights to the star": "Podążaj za światełkami do gwiazdy",
    "Space maze. Use arrow keys, swipe, or tap a lit space to move the rocket.":
      "Kosmiczny labirynt. Przesuń rakietę strzałkami, gestem lub dotykając podświetlonego pola.",
  };
  const t = (text) => language === "pl" ? polish[text] || text : text;
  const api = { kiosk, language, t };
  if (root) root.KiwiContext = api;
  if (typeof module !== "undefined") module.exports = api;
  if (typeof document === "undefined") return;

  if ("serviceWorker" in navigator && document.currentScript) {
    const workers = navigator.serviceWorker;
    const hadController = Boolean(workers.controller);
    let refreshed = false;
    workers.addEventListener("controllerchange", () => {
      if (!hadController || refreshed) return;
      refreshed = true;
      root.location.reload();
    });
    const script = new URL(document.currentScript.src);
    workers.register(new URL("../sw.js" + script.search, script)).catch(() => {});
  }

  document.documentElement.classList.toggle("kiosk", kiosk);
  document.documentElement.lang = language;
  document.title = document.title.replace(/Memory Match|Letter Match|Space Maze/, t);
  document.querySelectorAll("[data-i18n]").forEach((element) => {
    element.textContent = t(element.textContent.trim());
  });
  document.querySelectorAll("[aria-label]").forEach((element) => {
    element.setAttribute("aria-label", t(element.getAttribute("aria-label")));
  });
  if (kiosk) {
    document.querySelectorAll("a[href]").forEach((link) => {
      const url = new URL(link.href);
      if (url.origin !== root.location.origin) return;
      url.searchParams.set("kiosk", params.get("kiosk"));
      link.href = url.href;
    });
  }
})(typeof window !== "undefined" ? window : null);
