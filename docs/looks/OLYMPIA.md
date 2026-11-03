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
