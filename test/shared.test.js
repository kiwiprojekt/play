/** @jest-environment jsdom */
let runtime;
beforeEach(() => {
  jest.resetModules();
  localStorage.clear();
  runtime = require("../shared/play.js");
});

it("all games use the same mute preference and legacy letter preference is honored", () => {
  localStorage.setItem("letterMatch_mute", "true");
  expect(runtime.muted()).toBe(true);
  runtime.storage.set("soundMuted", false);
  expect(runtime.muted()).toBe(false);
  expect(require("../letters-match/settings.js").getMute()).toBe(false);
});

it("storage failures do not stop gameplay or settings changes in the current session", () => {
  const getter = jest
    .spyOn(Storage.prototype, "getItem")
    .mockImplementation(() => {
      throw new Error("Unavailable");
    });
  const setter = jest
    .spyOn(Storage.prototype, "setItem")
    .mockImplementation(() => {
      throw new Error("Unavailable");
    });
  expect(runtime.storage.get("missing", "default")).toBe("default");
  runtime.storage.set("soundMuted", true);
  expect(runtime.muted()).toBe(true);
  getter.mockRestore();
  setter.mockRestore();
});

it("shuffle preserves every element without mutating the input", () => {
  const items = ["A", "B", "C", "D"];
  expect(runtime.shuffle(items).sort()).toEqual(items);
  expect(items).toEqual(["A", "B", "C", "D"]);
});

it("keeps current preferences when writes fail but reads remain available", () => {
  const setter = jest
    .spyOn(Storage.prototype, "setItem")
    .mockImplementation(() => {
      throw new Error("Quota");
    });
  runtime.storage.set("soundMuted", true);
  expect(runtime.muted()).toBe(true);
  setter.mockRestore();
  runtime.storage.set("soundMuted", false);
  expect(runtime.muted()).toBe(false);
});

it("reuses original sound effects, honors mute, and tolerates unavailable audio", () => {
  const play = jest.fn().mockResolvedValue(undefined);
  const AudioMock = jest.spyOn(window, "Audio").mockImplementation(() => ({ play }));
  runtime.effect("assets/test.ogg");
  runtime.effect("assets/test.ogg");
  expect(AudioMock).toHaveBeenCalledTimes(1);
  expect(play).toHaveBeenCalledTimes(2);
  runtime.storage.set("soundMuted", true);
  runtime.effect("assets/test.ogg");
  expect(play).toHaveBeenCalledTimes(2);
  AudioMock.mockImplementation(() => { throw new Error("Unavailable"); });
  runtime.storage.set("soundMuted", false);
  expect(() => runtime.effect("unavailable.ogg")).not.toThrow();
  AudioMock.mockRestore();
});
