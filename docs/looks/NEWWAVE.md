# Look: New Wave (decided design, 2026-11-03)
After April Greiman, Design Quarterly #133 "Does It Make Sense?" (1986), with a touch of Memphis. Reference:
`~/project/jam-dash/mockups/v8-newwave.html`. Same cards, layouts, controls; tokens + pack only.

Character: a desk of translucent tinted sheets, playful geometric confetti (triangles, squiggles, dots, circles),
early-Mac pixel type for numbers and labels, a sticker-yellow for alerts. The one look where translucency, soft shadows
and gradients are allowed — but gate the heavy parts behind the `fx` switch (data-fx) so the Echo Show / iPad stay fast.
- Palette light: page #fbf8ff, ground #f3efff, ink #1b1640, planes rgba(255,255,255,.52) with a white edge and shadow
  rgba(52,30,120,.16); tints per room (pastel gradients): pink→lilac, mint→aqua, peach→yellow, lavender→blue; sticker
  #fff05a (alerts/needs you), ok-sticker #a6f3d4, terminal #1b1640 with #d8ffe9 text. Dark: page #140f2e, planes
  rgba(40,30,90,.55), ink #f3efff, same tints darker.
- Type: headings "Space Grotesk"-like geometric → use Archivo 700 (shipped) tight; numbers and small labels in a pixel
  font: "Silkscreen" (OFL, ship woff2) — pixel caps with letter-spacing; mixed case body.
- Shape: radius 2px planes slightly rotated (±0.6°) on non-kiosk cards when fx is on (none on kiosks), confetti motifs
  (triangle, squiggle, ring, dot grid) as absolutely placed decor in card corners, one per card, seeded.
- Light on: plane tinted with the light colour (gradient from light colour to a lighter hue), pixel % number.
- Kiosk: big pixel clock, planes for dock blocks with tints; screensaver = drifting light gradient that follows the time
  of day (fx only; static fallback), now-playing as a sticker.
- Motion: tilt on press (fx), stickers pop (scale 1.04, 160ms). Reduced motion or fx off = flat planes, no tilt.
- Contrast ≥ 4.5:1 for all text even on tints (ink on planes).

## Built (R10, 2026-11-03)
Theme "Jam New Wave" (`../jam-theme/themes/jamboard-newwave.yaml`, generated from `tokens/looks/newwave.mjs`) + the pack
`src/looks/newwave.js` + Silkscreen 400 / 700 in `dist/fonts/` (OFL, latin subsets, 8.2 + 7.3 KB; Archivo is shared with
Braun). Rules in docs/DESIGN.md "New Wave rules". Choices the brief left open, and where the build departs from it, so a
reviewer can overrule them:
- **fx default on**: the theme sets `jam-fx: 1` (translucent gradient planes, soft shadow, ±0.6° tilt, tilt on press,
  backdrop blur on sheets, the turned now-playing sticker, the drifting screensaver light). Kiosks are expected to run with
  `fx: false` on jam-kiosk / jam-screensaver (their sheets and layer follow): flat opaque planes, no tilt, no blur, a static
  light field. Both states are checked (`JAM_FX=0` runs the harness flat). The dashboard YAML of the Echo Show / iPad is
  not changed here (HA is read-only for workers): adding `fx: false` there is a follow-up for the user.
- **Tints**: every card plane takes its room accent (22% into the plane, mixed in OKLCH so dark mode stays mauve / teal
  instead of brown); the gradient partner per room is peach -> sticker yellow (living / default), mint <-> aqua (kitchen,
  nerd), lavender <-> blue (master, music), pink -> lilac (marissa). Read from the accent's inline `--acc: var(--x)`.
- **Contrast deviations**: the alert red fill is #ff4f78 (brief #e0244f = 3.9:1 under ink), alert text #a8123c /
  #ff9db4; dim #4d4675 / #d6d0f8 (dark dim raised for the tinted planes inside sheets). A lit jam-light is the light colour mixed 48% into the page white in both modes with
  ink text (a mix into the dark plane read brown and failed 4.5:1 for warm-white lights in dark mode).
- **Confetti** sits half under its plane at a side edge (26px, 13px outside: inside a 16px page margin, so no
  horizontal scroll at 390) instead of on top of the corner: on top, a shape would cross text in some of the 24 cards, and
  in dark mode a bright shape under light text fails 4.5:1. Seeded by `data-jam-seed` on the card host (core hook: HA
  wraps each card in its own element, so CSS position cannot seed). Not on kiosk cards or cards in sheets.
- **Pixel type**: Silkscreen for the small labels and the big numerals (`jam-num-font`, x .6; the kiosk clock x .8); words
  in a numeral slot (gauge "Unavailable") stay Archivo; the degree sign falls back to monospace (Silkscreen's ° reads as
  an asterisk). Card names, keys and body text are Archivo (700 / 600 / 400).
- **Active = ink block**: active keys, tabs, scenes and lit jam-buttons are ink blocks (`--fg` face; a light block in dark
  mode, the mockup's dark nav) with a 3px hard shadow in the room colour; alert keys / chips are yellow stickers with a red
  shadow, "home" chips mint; the failed-action strip is the terminal with a yellow offset.
- **Screensaver**: page ground + pixel clock + four confetti shapes in each layout's places (b3 only where the layout
  places it); the now-playing block is a sticker (box-shadow spread, so the block keeps Poster's box for the fit checks).
  The light field follows the time of day through `--jam-ss-day` (core hook in jam-screensaver, written once a minute
  when it changes): its centre moves along a sun path and its hue turns through the day, one 55 s transform transition
  per minute (no infinite animation, universal rule); the colours are mixed into `--slab` first so the field stays dim
  behind light text in dark mode.
- **HA chrome**: light header and sidebar (#fbf8ff, ink text, 2px ink rule; dark: violet rule), violet primary, 2px
  radii, card shadow = `jam-elev-1`; card-mod view tabs in Silkscreen with a room underline and an ink current tab.
