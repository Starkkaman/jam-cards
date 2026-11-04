# Look: Brutal (decided design, 2026-11-03 night)
Current trend: neo-brutalism (Gumroad, Figma community, 2023-26). Loud, honest, tactile, fun — and very legible.
- Palette light (primary): page #fffbea (paper), card #ffffff, ink #111111 (true black allowed: #000), border 3px #000.
  Fills (saturated, flat): lime #c6f432, pink #ff7ad9, cyan #5ce1e6, yellow #ffde59, orange #ff9f43, violet #a58bff.
  Room → fill: living yellow, kitchen lime, master cyan, marissa pink, music violet, nerd orange. Alerts: red #ff4d4d
  with black text. Dark: page #191919, card #262626, borders #f5f5f5 3px, same fills (black text on fills).
- Type: "Bricolage Grotesque" (OFL, variable; ship woff2 latin) 800 for names/numbers, 500 body, mixed case; numbers big.
- Shape: radius 10px on cards, 999px on pills; every card/key has a 3px solid border and a HARD offset shadow
  `6px 6px 0 #000` (dark: `6px 6px 0 #f5f5f5`); no blur, no gradients.
- Interaction: press = translate(4px,4px) and shadow shrinks to 2px (the key "goes down"); on = filled with the
  room colour; power = a chunky pill switch with a black border.
- Lights on: card filled with the light's colour (snapped to the nearest fill for readability; a small swatch shows the
  real colour); brightness = a fat bordered bar.
- Kiosk: huge clock in 800, dock blocks as bordered coloured slabs with shadows, lock as a bordered circle.
- Motion: snappy 120ms; reduced motion = none. Contrast: black text on every fill (all ≥ 7:1).

## Built (R10, 2026-11-03, branch look-brutal)
Theme "Jam Brutal" (`../jam-theme/themes/jamboard-brutal.yaml`, generated from `tokens/looks/brutal.mjs`) + the pack
`src/looks/brutal.js` + Bricolage Grotesque in `dist/fonts/` (`bricolage-grotesque-var-latin.woff2`, Google Fonts latin
subset, variable weight 200-800 and optical size 12-96, 77 KB; `OFL-BricolageGrotesque.txt`). Rules in docs/DESIGN.md
"Brutal rules". Choices the brief left open, and where the build departs from it, so a reviewer can overrule them:
- **Room fills on the existing hue tokens**: ochre = yellow (living, the default accent), teal = lime (kitchen; also the
  calm / info tone), blue = cyan (master), pink, violet (music), green = orange (nerd); red #ff4d4d for alerts. The same
  fills in both modes; `jam-on-fg` is #000 (black text on every fill: 6.4:1 on red, >= 7.7:1 on the room fills; #111 on
  violet would be 6.9:1, under the brief's 7:1). Card text stays the brief's ink #111111.
- **Borders are inset outlines** (3px, `outline-offset: -3px`), not CSS borders, so no card layout moves and the fit
  checks see Poster's boxes; the shadow is a plain `box-shadow` (no clip-path anywhere in this look). Lines and shadows are
  `jam-line` (#000 light, #f5f5f5 dark). HA's own UI keeps softer dividers (`hair` #d8d2bc / #4a4a4a) and gets 3px card
  borders + the 6px hard shadow (`jam-elev-1`).
- **Shadow sizes by role**: cards, the hero, sheets and posters 6px (the brief's `6px 6px 0`); a card drawn inside a card
  4px; keys 6px, chip-size keys (pills, transport and option keys) 4px with a 2px press, so the shadow's far edge stays
  put in both (6 = 4 + 2, 4 = 2 + 2); status pills (`.chip`) and the pill switch 2px.
- **Radii**: 10px cards, keys, sheets, posters, tiles and option keys (multi-line keys read badly as pills); 999px for
  chip-size keys, status pills, strips and the switch.
- **Hero = a violet slab** with black text in both modes (an ink hero in light mode, or a white one in dark mode, swallows
  its own black / white border and shadow).
- **Tone stripes** (`.stripe`) are 9px: 3px of border, the tone colour, then a 3px inner line.
- **Lit jam-light**: the face takes the light's colour snapped to the nearest room fill by hue (render hook `decorate`
  writes `--bru-fill` on the card; near-white lights snap to yellow when warm, cyan when cool; red lights to orange / pink,
  red stays for alerts); the real colour is a 12px bordered swatch before the sub line; the brightness is a 14px pill bar
  with a black fill. The power corner is a 40x24 pill switch on every card (track white when off, the room fill when on;
  on a lit light the track is white so it reads on its own colour).
- **Labels**: Bricolage 700, mixed case, no tracking (no tracked capitals anywhere). Names and numbers 800 at x .8 (big
  numerals x .92); the kiosk clock x 1.1 of Poster's size, -.035em.
- **Kiosk**: dock blocks are full room fills with black text (the "All off" / "Air" blocks without accent stay white
  slabs), 16px gaps and a 16px margin so the shadows show; pressed = down 4px. The lock is a white disc with a 3px border
  and a hard shadow (alert = red, off = dashed).
- **Screensaver**: the page ground, the clock in 800, Poster's three bars and disc as bordered slabs with hard shadows in
  four fills (accent, pink, cyan, violet); the now-playing block and the photos time chip are white slabs.
- **Motion**: `jam-dur` .6 (Poster's 200 ms motions take 120 ms), one snappy ease-out (no steps); keyframes `bru-drop` (a
  card drops onto its shadow: view entrance), `bru-rise` (sheets), `bru-stamp` (press and release: scenes, kiosk dock /
  lock), `bru-shake`, `bru-pop` (screensaver); no light wash, no spiral flash. Reduced motion: none (universal rule).
- **Motifs**: empty = Poster's bars as bordered fill slabs, idleArt = three stacked bordered slabs (seeded), powerGlyph =
  a 3px round stroke, flash = none.
- **HA chrome**: paper header and sidebar with a 3px black rule, violet primary, 10px / 999px radii; with card-mod the view
  tabs are bordered pills, the current one filled with its room colour and a 3px hard shadow.
- Shared-code hooks: none (the pack uses the existing `decorate` render hook and motif registry).
