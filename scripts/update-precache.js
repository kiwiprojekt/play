// Regenerate after changing any game file or asset.
const fs = require("node:fs");
const path = require("node:path");
const { createHash } = require("node:crypto");
const games = ["memo", "letters-match", "space-maze"];
const root = path.join(__dirname, "..");
const extensions = new Set([
  ".html", ".css", ".js", ".webp", ".woff2", ".otf", ".png", ".svg", ".ogg",
]);
function collect(directory) {
  return fs.readdirSync(path.join(root, directory), { withFileTypes: true }).flatMap((entry) => {
    const relative = path.posix.join(directory, entry.name);
    return entry.isDirectory()
      ? collect(relative)
      : extensions.has(path.extname(entry.name)) ? ["./" + relative] : [];
  });
}
const files = [
  "./", "./index.html", "./privacy.html", "./style.css", "./manifest.json", "./precache.json",
  ...games.map((game) => `./${game}/`),
  ...["shared", "assets", ...games].flatMap(collect),
].sort();
// Strip previously generated versions so running this script twice is stable.
const normalize = (source) => source.replace(/\?v=[a-f0-9]{12}/g, "");
const hash = createHash("sha256");
for (const file of files) {
  hash.update(file);
  if (file.endsWith("/") || file === "./precache.json") continue;
  const content = fs.readFileSync(path.join(root, file));
  hash.update(/\.(html|css|js)$/.test(file) ? normalize(content.toString()) : content);
}
// Worker changes also need a new release, independently of game content.
const worker = path.join(root, "sw.js");
const workerSource = fs.readFileSync(worker, "utf8");
hash.update(workerSource.replace(/const CACHE_NAME = "[^"]+";/, 'const CACHE_NAME = "generated";'));
const version = hash.digest("hex").slice(0, 12);
for (const file of files.filter((name) => name.endsWith(".html"))) {
  const filename = path.join(root, file);
  fs.writeFileSync(filename, normalize(fs.readFileSync(filename, "utf8")).replace(
    /((?:src|href)="[^"?:]+\.(?:css|js))"/g, `$1?v=${version}"`,
  ));
}
fs.writeFileSync(path.join(root, "precache.json"), JSON.stringify(
  files.map((file) => `${file}?v=${version}`), null, 2,
) + "\n");
fs.writeFileSync(worker, workerSource.replace(
  /const CACHE_NAME = "[^"]+";/, `const CACHE_NAME = "kiwiplay-${version}";`,
));
console.log(`Offline pack: ${files.length} files (kiwiplay-${version})`);
