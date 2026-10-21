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
    expect(fs.existsSync(path.join(__dirname, "..", value))).toBe(true);
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
  expect(fetch).toHaveBeenCalledWith(request, { cache: "no-cache" });
  expect(put).toHaveBeenCalledWith(request, { copy: true });
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
