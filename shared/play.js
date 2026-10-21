/* Small browser helpers shared by the games. No game state lives here. */
(function (root) {
  const memory = new Map();
  const storage = {
    get(key, fallback = null) {
      if (memory.has(key)) return memory.get(key);
      try {
        return localStorage.getItem(key) ?? fallback;
      } catch (_) {
        return fallback;
      }
    },
    set(key, value) {
      try {
        localStorage.setItem(key, String(value));
        memory.delete(key);
      } catch (_) {
        memory.set(key, String(value));
      }
    },
  };
  function shuffle(items) {
    const result = [...items];
    for (let i = result.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [result[i], result[j]] = [result[j], result[i]];
    }
    return result;
  }
  const soundIcon =
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M11 4 5 9H2v6h3l6 5Z" stroke-linejoin="round"/><path class="sound-wave" d="M15 8a6 6 0 0 1 0 8m3-11a10 10 0 0 1 0 14" stroke-linecap="round"/></svg>';
  function muted() {
    return (
      storage.get("soundMuted", storage.get("letterMatch_mute")) === "true"
    );
  }
  function updateSound() {
    const isMuted = muted();
    document.querySelectorAll("[data-sound]").forEach((button) => {
      button.innerHTML = soundIcon;
      button.setAttribute("aria-pressed", String(isMuted));
      button.setAttribute(
        "aria-label",
        isMuted ? "Turn sound on" : "Turn sound off",
      );
      button.title = isMuted ? "Sound off" : "Sound on";
    });
  }
  const effects = new Map();
  function effect(source) {
    if (muted()) return;
    try {
      if (!effects.has(source)) effects.set(source, new Audio(source));
      const sound = effects.get(source);
      sound.currentTime = 0;
      sound.volume = 0.5;
      sound.play().catch(() => {});
    } catch (_) {
      /* Sound effects are optional. */
    }
  }
  let audio;
  function tone(success = false) {
    if (muted() || typeof window === "undefined") return;
    try {
      const Context = window.AudioContext || window.webkitAudioContext;
      if (!Context) return;
      audio ||= new Context();
      audio.resume().catch(() => {});
      const oscillator = audio.createOscillator();
      const volume = audio.createGain();
      oscillator.connect(volume);
      volume.connect(audio.destination);
      oscillator.frequency.setValueAtTime(
        success ? 660 : 420,
        audio.currentTime,
      );
      oscillator.frequency.exponentialRampToValueAtTime(
        success ? 880 : 520,
        audio.currentTime + 0.12,
      );
      volume.gain.setValueAtTime(0.04, audio.currentTime);
      volume.gain.exponentialRampToValueAtTime(0.001, audio.currentTime + 0.18);
      oscillator.start();
      oscillator.stop(audio.currentTime + 0.2);
    } catch (_) {
      /* Audio is optional. */
    }
  }
  function celebrate(element) {
    if (api.reducedMotion()) return;
    const rect = element.getBoundingClientRect();
    const burst = document.createElement("div");
    burst.className = "play-confetti";
    burst.setAttribute("aria-hidden", "true");
    const colors = ["#f8c83a", "#ee7972", "#64b6da", "#88c765", "#b993db"];
    for (let i = 0; i < 18; i++) {
      const piece = document.createElement("i");
      const angle = (Math.PI * 2 * i) / 18;
      const distance = 70 + Math.random() * 100;
      piece.style.left = `${rect.left + rect.width / 2}px`;
      piece.style.top = `${rect.top + rect.height / 2}px`;
      piece.style.background = colors[i % colors.length];
      piece.style.setProperty("--dx", `${Math.cos(angle) * distance}px`);
      piece.style.setProperty("--dy", `${Math.sin(angle) * distance - 60}px`);
      piece.style.setProperty("--spin", `${i * 50}deg`);
      burst.append(piece);
    }
    document.body.append(burst);
    setTimeout(() => burst.remove(), 1100);
  }
  const api = {
    storage,
    shuffle,
    muted,
    tone,
    effect,
    celebrate,
    reducedMotion: () =>
      typeof matchMedia === "function" &&
      matchMedia("(prefers-reduced-motion: reduce)").matches,
    updateSound,
  };
  if (typeof module !== "undefined") module.exports = api;
  if (root) root.KiwiPlay = api;
  if (typeof document !== "undefined") {
    document.querySelectorAll("[data-sound]").forEach((button) => {
      button.addEventListener("click", () => {
        storage.set("soundMuted", !muted());
        updateSound();
        if (muted()) {
          window.speechSynthesis?.cancel();
          effects.forEach((sound) => sound.pause());
        }
        else tone();
      });
    });
    updateSound();
    if ("serviceWorker" in navigator && document.currentScript) {
      navigator.serviceWorker
        .register(new URL("../sw.js", document.currentScript.src))
        .catch(() => {});
    }
  }
})(typeof window !== "undefined" ? window : null);
