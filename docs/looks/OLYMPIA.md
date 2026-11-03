# Look: Olympia (decided design, 2026-11-03)

After Otl Aicher's design for the Munich Olympics, 1972. Visual reference: the Olympia band in the user-approved mockup
`docs/looks/jam-looks.html` and JamDash's `~/project/jam-dash/mockups/v8-olympia.html` (open both with Playwright).
Same cards, same layouts, same controls; only tokens + the olympia pack change.

## Character
Cool, bright, orderly and friendly. A light ground, a disciplined square grid, thin lowercase type, and a spectrum of
Munich colours used as flat fields and stripes. Right angles and 45° strokes only. There is no red: trouble turns orange.

## Palette
| role | light (primary) | dark |
|---|---|---|
| page | #f4f6f7 | #10202b |
| card face | #ffffff | #172b38 |
| face 2 (keys, tracks) | #e7edf0 | #223a49 |
| hairline | #d8e1e6 | #2c4655 |
| ink (text) | #1f3b4d | #e9f1f5 |
| dim | #6b8291 | #93aab8 |
| spectrum: blue | #3a8fd8 | #4a9be0 |
| light blue | #8fc7e8 | #8fc7e8 |
| green | #2aa65c | #34b56a |
| yellow | #f6c445 | #f6c445 |
| orange (also alert) | #f08c33 | #f39a46 |
| silver | #c9d3d9 | #5f7584 |
Room accents map onto the spectrum: living → orange, kitchen → green, master → blue, marissa → light blue,
music → blue, nerd → green, ochre/teal/violet/pink requests resolve to the nearest spectrum colour.
Text on spectrum fills is ink (#1f3b4d) except on blue/green where white is used if it reaches 4.5:1 (else ink).

## Type
Albert Sans (variable 300-600, from dist/fonts). **lowercase everywhere, including words like tv and hdmi** (decided).
Display/names weight 300-400 at ~0.87× scale; big numbers weight 300, tabular, generous size; labels 400, 11px,
lowercase, tracking .02em. Kiosk clock: weight 200-300 (use 300 if 200 isn't in the file), very large.

## Shape
Square corners (radius 0), no cut corners, no shadows. 1px hairline on white cards in light mode. Each card carries a
4px top stripe in its room/light colour (light cards: the light's colour when on, silver when off). Strips: 6px, square.
Grid: gaps 8px; inner padding on a 4px rhythm.

## Controls (pack CSS)
- Power: no triangle corner. A 32px square button top-right with a thin 1.75px stroke power glyph; on = filled with the
  spectrum/light colour, off = face 2.
- Light on: face = white (light) / card (dark); the light's colour shows as the 4px top stripe + the brightness bar fill
  + the big number's colour if contrast allows (else ink). Group members: the band block becomes stacked thin vertical
  spectrum bars at the right edge (no ink gaps; 1px face-coloured gaps).
- Keys: square, face 2 fill, ink text, lowercase; primary key = blue fill, white text.
- Kiosk dock blocks: full spectrum fields (one colour per block), lowercase name in weight 300, large.
- Focus ring: 2px blue outline, square.

## Motifs
- idleArt: horizontal bands of the spectrum in varying widths (a "programme sheet"), static on kiosks.
- armBars: vertical spectrum bars.
- Pictograms: where a card shows an icon square, use thin square-stroked glyphs (45°/90° only) — keep mdi icons but render
  them in ink at stroke weight; no new icon set needed now.
- Screensaver: big thin numerals, lowercase date, a spectrum band along the bottom edge; now-playing as a white panel
  with a blue top stripe.

## Motion
Calm and smooth, 200-260ms ease-in-out; stripes slide in, no stamps. Reduced motion = none.

## Done when
Same as Braun: every fixture, sheet, popup, both kiosk homes + sheets (1024×768, 961×601) and the screensaver in light and
dark pass fit, contrast ≥ 4.5:1, focus, 44px hit areas; contact sheet shows Olympia; Poster stays pixel-identical.

## Built (R10, 2026-11-03)
Theme "Jam Olympia" (`../jam-theme/themes/jamboard-olympia.yaml`, generated from `tokens/looks/olympia.mjs`) + the pack
`src/looks/olympia.js`. Choices the brief left open, and where the build departs from it (all for contrast or because a
token has another job), so a reviewer can overrule them:
- **Text on spectrum fills** is #10202b (the dark ground navy) in both modes, not #1f3b4d / white: on blue (#3a8fd8) and
  green (#2aa65c) white reaches 3.4 / 3.1:1 and #1f3b4d 3.4 / 3.7:1, #10202b 4.8 / 5.3:1. So the "primary key = blue fill,
  white text" is blue fill with navy text.
- **Light dim** is #52697a (brief #6b8291 = 4.0:1 on white, 3.4:1 on face 2); **alert text** #9a4700 light / the orange in
  dark (fills stay #f08c33 / #f39a46). Face 3 (keys of cards inside a sheet) #dde5ea / #263f4f.
- **Hero face** (jam-hero; not in the brief) = light blue #8fc7e8 with navy text in both modes.
- **Ink** (`jam-ink`) stays the dark ink: navy #1f3b4d (light) / #10202b (dark), white text on it. It is the full-screen
  sheet veil and the **screensaver ground in both modes**, so the screensaver is navy with white thin numerals and the
  now-playing block is the white (light) / card (dark) face panel with the blue top stripe. The page ground is the HA
  ground (#f4f6f7 light).
- **Bands** (jam-tv / jam-speaker text band, music dock, On now stamp, error strip) are the card face, as in the approved
  mockup's speaker card (text on the card under the art); keys on a band are face 2. Empty art (Golden Arm placeholder)
  sits on face 2 with spectrum bars; jam-media covers show without Poster's grey duotone.
- **jam-button** "on" (light / switch / fan / input_boolean) is like jam-light: plain face, accent stripe and power square.
- **Kiosk dock** blocks keep their configured accents (orange / green / blue for living / kitchen / music); blocks without
  one (`accent: none`) alternate yellow / light blue, navy text. The kiosk lock is a square, the 10px accent bar stays.
- **Lowercase everywhere** includes units (°f, kwh, tb), sentence lines and error text; form fields keep what is typed.
- **Group member bars** sit under the power square (from 48px down to the brightness bar), 40px wide, 1px face gaps.
- **HA chrome**: white header and sidebar in light mode (navy text, blue selection), the ink in dark; blue primary; HA
  `yellow-color` / `amber-color` = #f6c445, `cyan-color` = light blue (new aliases `yellow` / `cyan` in tokens/ha.mjs,
  default the old values, so JamBoard is unchanged). View tabs: lowercase Albert Sans, square, spectrum underline.
- Remote d-pad arrows and the OK disc keep their geometry (DESIGN geometry exceptions); the gauge keeps its wedges / hub.
