# Look: Grid (decided design, 2026-11-03)
After Wim Crouwel: New Alphabet (1967) and the Stedelijk Museum posters. Reference: `~/project/jam-dash/mockups/v8-grid.html`.
Same cards, layouts, controls; tokens + pack only.

Character: everything sits on one visible square grid; the big numerals are built from grid cells; one signal colour.
- Palette light: page #ffffff with a visible 1px grid (#d2d2d2) every 24px behind the dashboard (theme background
  pattern: two repeating 1px lines — flat, no gradients-as-shading; use background-image linear-gradient only to draw the
  1px grid lines, that is the one allowed use), card face #ffffff (cards align to the grid and keep the lines visible
  around them), ink #000, muted #6a6a6a, signal #e8401c (orange-red, used for "on", active and alerts), secondary blue
  #1d3c9a (selection, links). Dark: page #000 grid #343434, card #000, ink #fff, signal #ff4b26.
- Type: Hanken Grotesk (OFL, dist/fonts) 400/500 lowercase-friendly mixed case for labels; BIG numbers (light %, kiosk
  clock, temps, gauge values) are drawn as cell numerals: a motif that renders digits 0-9, %, :, . as 5×7 square cells
  (New Alphabet-like, squares with 45° corner cuts on round strokes) sized to the grid. Small numbers stay Hanken.
- Shape: square, 1px black hairline borders on cards (ink in dark), no shadows. Keys: square, outlined; on = signal fill.
- Light on: face white, the brightness shown as a row of grid cells filled black (count = %/10) plus the signal top
  edge; group = small filled squares.
- Kiosk: clock in cell numerals huge; dock = outlined squares, active = signal fill; screensaver = cell clock on the grid.
- Motion: numerals rebuild cell by cell (stepped, 30ms per cell, max 300ms) when values change; otherwise none.

## Built (R10, 2026-11-03)
Theme "Jam Grid" (`../jam-theme/themes/jamboard-grid.yaml`, generated from `tokens/looks/grid.mjs`) + the pack
`src/looks/grid.js` (Hanken Grotesk variable 100-900, `dist/fonts/hanken-grotesk-var-latin.woff2` + `OFL-HankenGrotesk.txt`).
Choices the brief left open, and where the build departs from it, so a reviewer can overrule them:
- **One signal colour, literally**: every hue token (ochre = default accent, teal, blue, pink, violet, green, red) is the
  signal, so every room's "on" / active fill is the signal. Text on it (`jam-on-fg`) is black in both modes: white on
  #e8401c is 4.0:1 (3.3:1 on #ff4b26), black 5.2:1 / 6.3:1. So the mockup's white-on-signal becomes black-on-signal.
- **The secondary blue** (#1d3c9a light, #6d8cf0 dark, the mockup's dark blue) is the `jam-focus` token: the focus ring,
  the calm / info tone stripe, HA's selected sidebar item and HA accent. Graph series: ink, signal, blue, muted, light blue.
- **Red text** (alerts, N/A) is #c4300f in light mode (the signal is 4.0:1 on white); fills keep #e8401c. Dark muted is the
  mockup's #9b9b9b. Keys / tracks sit on #f2f2f2 / #ececec (the greys where the muted #6a6a6a still reads 4.5:1).
- **The page grid** is HA's `lovelace-background` (new HA alias `lovelace-bg` in tokens/ha.mjs, default the ground, so the
  other themes are unchanged): two repeating 1px linear-gradients every 24px over the ground, the brief's one allowed
  gradient. The preview paints `--lovelace-background` on a `body::before` layer. Cards cannot be placed on the grid from
  a theme (HA's sections layout sets gaps and row heights), so the faces cover the lines and the lines show in the gaps.
- **Cell numerals** (motif `numerals`, a root decorator; renamed `decorateRoot` at the R10 merge, see DESIGN "Look hooks"; see the pack header): light % (jam-light + its pop-up's
  brightness), clocks (jam-kiosk, jam-weather, jam-screensaver incl. the photos time chip), temperatures (jam-weather,
  jam-house, the screensaver), jam-gauge and jam-graph values. Glyphs: the mockup's digits and %, plus ':', '.', '-' and
  '°'. A value with any other character (Off, N/A, a dash, a comma) stays Hanken text; units that are not numerals (PM,
  °F, TB, W) stay small text after the cells. Cell size: 12 % of the font size snapped down to 3 / 4 / 6 / 8 / 12 / 16 /
  24 / 48 px (gap 1px from 4px, 8 % from 12px); jam-light % 5px; the kiosk clock 24px (one cell per grid module) when the
  kiosk is at least 1080 x 640 (a 24 h "14:41" is 600px wide), 16px from 700px wide (the Echo Show's 1024 x 768 and
  961 x 601), else 12px; the screensaver clock 24px from 900 x 560 (so on the Echo Show), 16px from 600px wide, else 8px.
  A 24px clock is moved (at most half a module) so its cells sit one pixel inside the 24px grid lines, anchored at the
  viewport's top-left (the screensaver's own grid layer; on a kiosk that does not scroll the HA view background); smaller
  cells cannot coincide with the grid and stay where the layout puts them. The real text stays in the DOM in a visually hidden span (screen readers, find in page, the contrast audit);
  the cells are an aria-hidden SVG. Rebuild: the changed cells flip one by one in diagonal order, 30 ms per cell, the whole
  rebuild capped at 300 ms; none with reduced motion / `JamCards.motion = false`; the first draw is instant.
- **jam-light on**: white face, a 4px signal top edge, the brightness as 10 grid cells (10px squares, ceil(%/10) filled
  ink, the rest outlined in the grid grey), group members as 8px squares under the power square (on = filled ink, off =
  outlined). The light's own colour shows only in the pop-up (brightness bar, colour editor). No label plates.
- **Power corner**: a 32px outlined square with a square-capped 2px glyph; on = signal fill, black glyph (jam-tv's own
  corner too). Keys, chips, jam-remote outlined keys, the kiosk dock blocks and lock: white (black in dark) squares with a
  1px ink outline; on / active / pressed = signal fill with black text. jam-button "on" = signal fill (the key rule).
- **Hero** (jam-hero; not in the brief) = the ink inverted: a black face in light mode, white in dark.
- **Kiosk sheet K1** (jam-speaker at kiosk size): a white / black side panel with outlined keys, not the sampled album colour.
- **Screensaver**: the white (light) / black (dark) page with the grid (the screensaver motif's first node is the grid
  layer; the other three Poster nodes are hidden, so the node count stays), the cell clock in ink, the temperature in the
  signal, kickers in the red text colour; the photos time chip and the now-playing label are outlined white / black panels.
- **Motifs**: empty = a seeded 4 x 3 block of cells (ink, one signal), idleArt = one New Alphabet digit on a 9 x 9 cell
  grid with one signal cell, flash = none, powerGlyph = 2px square caps.
- **Motion**: every keyframe token `none`, press transforms `none`; only the numerals move.
- Shared-code hooks (additive; Poster pixel-identical): core `jamDecorate` + the Poster no-op motif `numerals` (since the R10 merge: `lookDecorateRoot` + motif `decorateRoot`, one of the core look hooks) (jamStyle
  calls a pack's `numerals(root)` for every root it styles and runs its cleanup on the next style / look switch);
  tokens/ha.mjs alias `lovelace-bg`; tokens/index.mjs writes `--lovelace-background` into preview/looks.css for a look whose
  value differs from the ground; preview/index.html paints it (`body::before`, `.view` positioned above it).
- Checks: 96-packs knows the grid pack (Hanken Grotesk) and accepts more packs; new 96-numerals (cells + hidden text,
  rebuild <= 300 ms in steps, instant without motion, kiosk clock, nothing left after switching back to Poster).
