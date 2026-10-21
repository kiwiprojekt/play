// Regenerate after changing any game file or asset.
const fs = require("node:fs");
const path = require("node:path");
const { createHash } = require("node:crypto");
const games = ["memo", "letters-match", "space-maze"];
const root = path.join(__dirname, "..");
const extensions = new Set([
  ".html",
  ".css",
  ".js",
  ".webp",
  ".woff2",
  ".otf",
  ".png",
  ".svg",
  ".ogg",
]);
function collect(directory) {
  return fs
    .readdirSync(path.join(root, directory), { withFileTypes: true })
    .flatMap((entry) => {
      const relative = path.posix.join(directory, entry.name);
      return entry.isDirectory()
        ? collect(relative)
        : extensions.has(path.extname(entry.name))
          ? ["./" + relative]
          : [];
    });
}
const files = [
  "./",
  "./index.html",
  "./privacy.html",
  "./style.css",
  "./manifest.json",
  "./precache.json",
  ...games.map((game) => `./${game}/`),
  ...["shared", "assets", ...games].flatMap(collect),
].sort();
fs.writeFileSync(
  path.join(root, "precache.json"),
  JSON.stringify(files, null, 2) + "\n",
);
const hash = createHash("sha256");
for (const file of files) {
  hash.update(file);
  if (!file.endsWith("/")) hash.update(fs.readFileSync(path.join(root, file)));
}
const version = `kiwiplay-${hash.digest("hex").slice(0, 12)}`;
const worker = path.join(root, "sw.js");
fs.writeFileSync(
  worker,
  fs
    .readFileSync(worker, "utf8")
    .replace(/const CACHE_NAME = "[^"]+";/, `const CACHE_NAME = "${version}";`),
);
console.log(`Offline pack: ${files.length} files (${version})`);
