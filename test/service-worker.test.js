const vm = require("vm");
const fs = require("fs");
const path = require("path");
const source = fs.readFileSync(path.join(__dirname, "../sw.js"), "utf8");
function setup(fetchResult) {
  const events = {};
  const cached = { offline: true };
  const put = jest.fn().mockResolvedValue();
  const addAll = jest.fn().mockResolvedValue();
  const cacheApi = {
    open: jest.fn().mockResolvedValue({ put, addAll }),
    match: jest.fn().mockResolvedValue(cached),
    keys: jest.fn().mockResolvedValue(["kiwiplay-shell-v1", "unrelated-app"]),
    delete: jest.fn().mockResolvedValue(),
  };
  const self = {
    location: { origin: "https://play.example" },
    addEventListener: (name, handler) => {
      events[name] = handler;
    },
    skipWaiting: jest.fn().mockResolvedValue(),
    clients: { claim: jest.fn().mockResolvedValue() },
  };
  const fetch = jest.fn(fetchResult);
  vm.runInNewContext(source, { self, caches: cacheApi, fetch, URL, Response });
  return { events, cached, cacheApi, put, addAll, fetch };
}
it("precache only references existing files", async () => {
  const assets = JSON.parse(
    fs.readFileSync(path.join(__dirname, "../precache.json"), "utf8"),
  );
  const { events, addAll } = setup(() =>
    Promise.resolve({ ok: true, json: () => Promise.resolve(assets) }),
  );
  let pending;
  events.install({
    waitUntil: (promise) => {
      pending = promise;
    },
  });
  await pending;
  for (const value of addAll.mock.calls[0][0])
    expect(fs.existsSync(path.join(__dirname, "..", value.split("?")[0]))).toBe(true);
});
it("cleans only this application’s old caches", async () => {
  const { events, cacheApi } = setup();
  let pending;
  events.activate({
    waitUntil: (promise) => {
      pending = promise;
    },
  });
  await pending;
  expect(cacheApi.delete.mock.calls).toEqual([["kiwiplay-shell-v1"]]);
});
it("fetches fresh game code online and saves it for offline use", async () => {
  const response = { ok: true, clone: () => ({ copy: true }) };
  const { events, put, fetch } = setup(() => Promise.resolve(response));
  let pending;
  let caching;
  const request = { url: "https://play.example/memo/script.js", method: "GET" };
  events.fetch({
    request,
    respondWith: (promise) => {
      pending = promise;
    },
    waitUntil: (promise) => {
      caching = promise;
    },
  });
  expect(await pending).toBe(response);
  await caching;
  const url = fetch.mock.calls[0][0];
  expect(url).toMatch(/^https:\/\/play.example\/memo\/script.js\?v=[a-f0-9]{12}$/);
  expect(fetch).toHaveBeenCalledWith(url, { cache: "no-cache" });
  expect(put).toHaveBeenCalledWith(url, { copy: true });
});
it("serves a visited game from cache when the network fails", async () => {
  const { events, cached } = setup(() => Promise.reject(new Error("Offline")));
  let pending;
  events.fetch({
    request: { url: "https://play.example/memo/", method: "GET" },
    respondWith: (promise) => {
      pending = promise;
    },
  });
  expect(await pending).toBe(cached);
});

it("uses one release version for the offline pack and every page runtime reference", () => {
  const assets = JSON.parse(fs.readFileSync(path.join(__dirname, "../precache.json"), "utf8"));
  const version = source.match(/kiwiplay-([a-f0-9]{12})/)[1];
  expect(assets.every((asset) => asset.endsWith(`?v=${version}`))).toBe(true);
  for (const file of ["index.html", "memo/index.html", "letters-match/index.html", "space-maze/index.html"]) {
    const html = fs.readFileSync(path.join(__dirname, "..", file), "utf8");
    const runtime = [...html.matchAll(/(?:href|src)="([^"]+\.(?:css|js)(?:\?[^"]*)?)"/g)];
    expect(runtime.length).toBeGreaterThan(0);
    for (const [, url] of runtime) {
      expect(url).toMatch(new RegExp(`\\?v=${version}$`));
      const relative = "./" + path.posix.normalize(path.posix.join(path.posix.dirname(file), url));
      expect(assets).toContain(relative);
    }
  }
});
