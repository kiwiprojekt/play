# KiwiPlay

Three browser games for children aged 2–5: Memory Match, Letter Match, and Space Maze.

[Play KiwiPlay](https://play.kiwiprojekt.pl)

## Local preview

Run `python3 -m http.server 8080` from this directory. Open [localhost:8080](http://localhost:8080).

The games use plain HTML, CSS, and JavaScript. No build step or runtime packages are required.

## Checks

1. Install development dependencies with `npm ci`.
2. Run `npm test -- --runInBand`.
3. Run `npm run check:assets`.

## Structure

- `shared/` contains common colors, controls, sound, storage, and shuffle helpers.
- `memo/` contains picture themes and the memory game.
- `letters-match/` separates letter sets, preferences, and round logic.
- `space-maze/js/` separates maze generation, movement, drawing, and page controls.

The maze draws only during movement, image loading, or resize. It has no idle animation loop.

## Artwork and offline use

The games use local WebP artwork and local fonts. PNG originals remain available in Git history.

Run `python3 scripts/optimize-images.py` to convert new PNG artwork. The script requires Pillow and preserves the source files.
Update references after checking the converted images. Remove replaced PNG files when they are no longer needed.

After changing game files or assets, run `npm run cache-manifest`. Commit the updated `precache.json` and `sw.js` together.
The script calculates the cache version from the files. The service worker installs the complete pack before activating it.
All three games work offline after the pack finishes downloading. Letter speech depends on the voices available on the device.

## Review

See [the code quality review](docs/code-quality-review.md) for findings, changes, and validation.

## License

MIT
