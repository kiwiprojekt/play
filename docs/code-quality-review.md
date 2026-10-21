# KiwiPlay code quality review

Review date: October 21, 2026. Scope: the home page, Memory Match, Letter Match, Space Maze, and offline loading.

The review applied the thermo-nuclear quality standards to the complete games. The changes remove scene machinery, repeated controls, stale timers, and unnecessary animation work.

## Findings and remedies

| Priority | Finding                                                                                                       | Applied change                                                                                                                      |
| -------- | ------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| P1       | Large PNGs made memory boards expensive to download and decode.                                               | Convert artwork to bounded WebP images. Remove unused images and fonts; retain the original card and rocket sounds.                                                    |
| P1       | Maze menus added global resize handlers on each entry. Scene redraws removed objects without destroying them. | Remove Phaser and its scenes. Separate a small movement model, canvas renderer, and native page controls.                           |
| P1       | Pending memory and letter timers could affect a later game or the menu.                                       | Cancel pending transitions, mismatch timers, and speech when changing games or leaving play. Add regression tests.                  |
| P1       | The maze completion flow incremented the next level twice.                                                    | Advance from the current level once. Test maze 1 → 2 and replaying maze 20.                                                         |
| P2       | The letter sets confused unpaired `I` and `l`. The medium selection discarded its new letters.                | Complete every case pair and include the full medium set. Make answer choices distinct and consistent in case.                      |
| P2       | Picture themes required unlocking.                                                                            | Make every theme available. Keep the original full boards as the default; retain optional three- and six-pair boards.               |
| P2       | Menus and answer rows overflowed narrow screens. Text and controls differed across games.                     | Share layout tokens and controls. Fit boards to both viewport dimensions. Wrap letter choices into rows on phones.                  |
| P2       | Several clickable elements lacked native keyboard behavior. Completion overlays did not manage focus.         | Use native buttons and modal dialogs. Restore focus on menu return and between letter rounds.                                       |
| P2       | The home page depended on fetching a list of three fixed games. Its cache could retain outdated shell files.  | Render the three links directly. Fetch fresh files online and install a complete offline pack with a content-derived cache version. |
| P2       | Storage errors could prevent gameplay. Sound preferences differed between games.                              | Share one sound setting. Keep preferences in memory when browser storage fails. Read the older letter sound preference.             |

Making every maze available exposed another incorrect assumption: the furthest completed maze no longer represented all earlier mazes.
Progress now records each completed maze separately. Existing progress from sequential unlocking still migrates correctly.

## Payload changes

Sizes below describe uncompressed files. They do not represent measured frame rates or compressed network transfers.

| Files                 | Before                            | After                                           |
| --------------------- | --------------------------------- | ----------------------------------------------- |
| Raster artwork        | 59 PNGs, 99,759,796 bytes         | 53 WebP images, 1,527,138 bytes                 |
| Maze JavaScript       | 1,194,494 bytes, including Phaser | 15,793 bytes plus 4,996 bytes of shared helpers |
| Complete offline pack | Game content was excluded         | About 2 MB for all three games                  |

The artwork reduction is 98.5%. This combines image conversion, smaller image dimensions, and removal of unused assets.
The image script first converted all 59 PNGs, preserving their artwork. Cleanup removed unused images; the memory sky background remains part of the game.

## Structural changes

Game state stays inside each game. The shared code owns only controls, styling, sound, short visual effects, storage, and shuffling.
Letter data has a separate module. Maze generation and movement do not depend on the DOM or drawing code.

The rocket shows its original thrust artwork only during movement.
The maze has no permanent render loop. It draws during a short move, image loading, and resize.
Walls share one drawing path, and each shared wall appears once.
Resize changes layout without generating a new maze or resetting the rocket.

Memory completion offers menu, replay, and next theme. Original card sounds and rocket thrust and goal sounds remain.
Memory and maze retain their original four-second automatic next-level countdowns, with manual navigation available. Letter completion waits for the child.
Letter sessions retain the original ten matches. Wrong choices allow another attempt without losing progress.
All games support reduced motion and share large menu and sound controls.
The memory game retains its illustrated sky background and allows a third card to dismiss a mismatch immediately.
Correct matches show a short confetti burst. The maze retains the original 6 × 5 through 16 × 14 difficulty range.
Menus use game images, numbers, and letter previews without descriptive marketing copy.
The letter style selector offers Print, Hand, and By level, including during play.
The Polish numbered groups cover all 32 Polish letters and exclude Q, V, and X.

## Validation

- Jest: 182 tests pass across nine suites.
- Asset checks pass for 200 HTML links, stylesheet references, memory images, and offline files.
- Browser checks use only the Codex harness.
- Checked every full memory theme at 375 × 667, 667 × 375, 1280 × 720, and 3840 × 2160.
- All 16 combinations keep every card inside the viewport. Transport uses 4 × 3 in landscape and 3 × 4 in portrait.
- A phone fits all 24 memory cards without scrolling. Each card measures about 78 pixels square.
- A phone fits all six letter choices without scrolling. Each answer measures 105 × 90 pixels.
- Menu and sound controls measure at least 56 pixels high. Maze arrows measure 58 × 52 pixels.
- Regression tests cover stale transitions, distinct choices, case pairs, blocked storage, completion, and navigation.
- Generated mazes at all 20 sizes have tested paths to the goal.
- With the preview server stopped, all three game routes load and play from the offline pack.
- The offline memory check includes a theme whose cards had not previously appeared during play.

These checks verify behavior and layout. They do not establish frame rates on older tablets or validate suitability through observation of children.
A brief play session on the target tablet remains useful, especially for letter pronunciation and swipe comfort.

## Browser release playthrough — October 21, 2026

The Codex in-app browser completed all four full memory themes at desktop (1280 × 720) and phone (375 × 667) sizes, plus the optional three-pair board. It verified replay and next-theme navigation.

It completed all six ten-match letter levels in Polish on the phone layout and English on desktop, then played endless mode in both. Wrong answers preserve the score. Changing the style during a round preserves its letter. Alphabet, style, and shared sound preferences survive navigation and reload.

It completed maze 1 and maze 2 on desktop and phone, and maze 20 on desktop. Keyboard arrows, arrow buttons, drag gestures, and adjacent-cell taps move the rocket. Rotation to 667 × 375 preserves position; both the smallest and largest mazes fit the phone screen. Completing maze 20 enables replay and retains its completion mark after reload.

The harness does not provide physical touch-event injection. Gesture checks used its native pointer drag and tap input at a phone viewport. These checks do not establish physical-device or speech-voice quality.

With the local server stopped, all three game routes loaded from the offline pack, letters accepted a correct match, and every image on the 24-card animals board loaded. The pack now also includes the shared SVG logo and original sound effects.

Release fixes restore next-theme navigation and sound/thrust feedback, revalidate online files to avoid mixing old scripts with new markup, and recover interrupted turns after browser back/forward navigation. Regression tests cover those transitions.

## Implementation references

Native dialogs provide modal focus handling. See [MDN dialog documentation](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/dialog).
The renderer follows the guidance to avoid unnecessary canvas work. See [MDN canvas optimization](https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API/Tutorial/Optimizing_canvas).
The scene lifecycle review used [Phaser scene documentation](https://docs.phaser.io/phaser/concepts/scenes).

The board sizing uses the actual container dimensions and a fixed grid shape for each card count.
See [MDN ResizeObserver](https://developer.mozilla.org/en-US/docs/Web/API/ResizeObserver) and [MDN size containment](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/contain).

## CDN release consistency

Live verification found that the CDN could retain an old homepage stylesheet after the new HTML was published. Release generation now stamps the same content-derived version onto HTML runtime references, the worker registration, and every offline URL. The worker uses that version for online requests too, so navigation receives the matching release through both CDN and browser caches. The version includes worker changes, and repeated generation is stable.

## Kiosk follow-up — October 21, 2026

`?kiosk` hides branding, sound controls, and privacy links. `?kiosk=pl` also supplies Polish interface labels and defaults letter matching to the Polish alphabet, overriding an earlier English default on entry. Internal links retain the mode. Each kiosk menu has an arrow back to the game picker; in-game back and replay remain available. Kiosk does not alter the saved mute preference.

Memory theme selectors are square images without captions on desktop and phone layouts. Letter-style selectors retain three visible letter samples and accessible names, with no Print, Hand, or By level captions.

The shared context module owns URL presentation, Polish labels, navigation propagation, and worker startup. Game state stays in each game. The offline worker shares cached files between kiosk and normal URLs and preserves explicitly versioned asset requests during an update.

Validation: 172 tests pass across nine suites; 200 asset/link references pass. Muted Codex browser checks cover normal mode, bare kiosk mode, Polish kiosk navigation through all three games, saved-English override, a complete ten-match Polish letter session, and all 24 memory cards fitting at 375 × 667, 667 × 375, and 1280 × 720.

## Maze keyboard follow-up — October 21, 2026

The maze hides on-screen arrows on desktop, retaining them for viewports up to 800 pixels wide and devices with a coarse primary pointer. Short desktop windows no longer reserve space for hidden arrows.

Arrow clicks return focus to the canvas. Movement key events bubble through the game screen, so focusing another game control does not disable the keyboard. Menu and completion dialogs block movement; browser modifier shortcuts remain available.

Validation: 175 tests pass. A muted Codex browser session verified a phone arrow click followed by an actual keyboard move, and desktop movement while the sound control had focus. Desktop hides the arrows while phone layouts retain them.

## Auto-advance restoration — October 21, 2026

The UI simplification incorrectly removed existing automatic completion flows. Memory now advances to the next theme after four seconds, looping from animals to transport. Maze advances to the next level after four seconds without skipping a level; the final maze waits for replay. A small progress bar on the next button indicates the countdown without adding copy. Letter rounds and their manual level-complete flow remain as in the original game.

Manual next, back, replay, and leaving the page cancel pending timers. Returning through browser history restarts a completed game's countdown. Tests cover exact timing, manual next followed by another completion, menu/replay cancellation, final-level behavior, and browser navigation. All 182 tests pass.
