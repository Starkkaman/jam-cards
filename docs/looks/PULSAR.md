# Look: Pulsar (decided design, 2026-11-03)
After Peter Saville / Factory Records: Unknown Pleasures (1979), Blue Monday and Power, Corruption & Lies (1983).
Reference: `~/project/jam-dash/mockups/v8-pulsar.html`. Same cards, layouts, controls; tokens + pack only.

Character: black field and thin white lines (dark is primary), restraint, wide-tracked tiny capitals, a 12-colour code
instead of icons (Blue Monday floppy-disk code: colour squares encode the name), one warm accent.
- Palette dark (primary): page #000, card #000 with a 1px rgba(255,255,255,.24) rule, line/text #fff, dim
  rgba(255,255,255,.55) (≥4.5:1 needed — use #9a9a9a-equivalent), warm accent #ffb070 (needs attention / on).
  Light: page #e7e2d2 (cream), card #e7e2d2 with 1px black rule, ink #000, dim #555, accent #b5541f.
  12-colour wheel (code squares): #e5382d #f26b21 #f7a823 #f2d21b #9ec43c #2aa148 #1aa59a #2e8fd8 #2f4fb1 #6a3fa0
  #b6449a #ec5a8a. A name's code = 4 squares (first four letters mapped a..l, m..x) + 1 check square.
- Type: Archivo or Space-Grotesk-like thin: use "Archivo" 300/400 (already shipped) with very wide tracking (.35em) for
  labels, uppercase labels only; values in 300 weight.
- Shape: no fill boxes; cards are outlined with thin rules; corners square; no shadows.
- Signature motif: "pulse" — where a card has a numeric history or level (light brightness, volume, power, gauge,
  graph), draw stacked thin white ridge lines (Unknown Pleasures) instead of bars: brightness = a single ridge whose height
  is the level; graphs = stacked ridgelines. Static unless the value changes (no continuous animation on kiosks).
- Code squares replace icon squares on cards, dock blocks and room headings.
- Kiosk: clock thin and wide-tracked, a ridge motif across the poster; screensaver = black field + ridge band + time.
- Motion: slow fades (300ms); the restart/alert lights its code one square at a time (stepped, 120ms per square).

## Built (R10, 2026-11-03)
Theme "Jam Pulsar" (`../jam-theme/themes/jamboard-pulsar.yaml`, generated from `tokens/looks/pulsar.mjs`) + the pack
`src/looks/pulsar.js`. Rules in DESIGN.md "Pulsar rules". Choices the brief left open, and where the build departs from it
(contrast, or a token with another job), so a reviewer can overrule them:
- **One warm accent everywhere:** `jam-ochre`, every room hue (teal, blue, pink, violet, green) and `jam-red` are the warm
  colour, so "on" and "needs attention" read the same in every room; rooms are told apart by their colour code. Gauge
  severity bands therefore only show in the warm (red band) / white ridges.
- **"No fill boxes":** "on" keys, chips, scenes, source tiles, the current tab and the jam-button / jam-tv power squares are
  a warm 1px outline with warm text (`jam-alert-text`), not a warm fill; the primary key (play / pause) is a text-colour
  outline. The light pop-up's whites, presets and hue strip keep their colours (they are the content); preset names sit
  on a black label plate.
- **Light mode accent** #c25f28 (brief #b5541f): black text on #b5541f is 4.25:1, on #c25f28 4.96:1; warm TEXT in light
  is #7d3a0f (the brief accent is 3.8:1 on cream). Dark dim #9a9a9a (the brief's rgba(255,255,255,.55)).
- **Lines:** card rule #3d3d3d in dark (= white .24 on black), black in light (brief); the same `jam-line` draws list
  separators, graph grid lines and baselines.
- **Ink** stays black in both modes (sheet veil, label plates, the screensaver field), so the screensaver is a black field
  with cream text in light mode too; the page ground is the HA ground alias (cream in light).
- **Type:** names and values Archivo 300 mixed case (display x.74, numerals x.86); labels 400 uppercase at x2.1 Poster
  tracking (~.34em); keys 400 uppercase at x1 (~.12em: at .35em "JellyWatch Player" and "Corridor Digital" overflow their
  keys); the kiosk dock state line .16em (at .25em "EXCELLENT" broke mid-word at 961px).
- **Ridges ("pulse"):** a level = a 1px baseline lit up to the value + one ridge at the value whose height is the level
  (`--lv` from the cards); a gauge = 9 stacked ridge lines whose pulse height is the level; a graph = stacked ridgelines,
  one per series in legend order (a 6px series-colour square at each baseline; per-series scale, the y axis hidden), one
  series keeps the y axis. Bars-style graphs are drawn as stepped ridges.
- **Colour code:** before room heading titles, in jam-button's icon square and on the kiosk dock blocks (the icon is
  hidden). The "restart/alert lights its code one square at a time" is a press: a pressed dock block / button / heading
  lights its squares in turn (stepped, 120 ms each, one-shot). A light that is on shows an 8px square in its own colour
  before its name (its only colour on the card).
- **Kiosk:** thin clock, the 10px accent bar becomes a static ridge band (CSS mask of a pre-drawn SVG) across the poster,
  left of the lock disc; dock blocks are outlined with the code above the name. **Screensaver:** black field, a 14-line
  ridge band (top or bottom per layout, clear of the text), thin time, the temperature in the text colour.
- **Weather:** forecast columns outlined (today: a text-colour outline), glyphs in the text colour (rain dim, a bolt
  warm), the min / max bars as outlined thin boxes.
- **Not changed:** remote d-pad arrows and the OK disc keep their geometry (arrows `--slab3`, the disc a 1px ring); cards
  inside a sheet still step their face to `--slab2` (universal rule), so a sheet's cards are near-black / darker cream.
