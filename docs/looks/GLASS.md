# Look: Glass (decided design, 2026-11-03 night)
Current trend: bento grids + "liquid glass" depth (Apple 2025, Linear/Vercel-style bento, Arc). Calm, premium, tactile.
- Palette dark (primary): page = deep ink #0b1020 with a slow colour field behind everything (three soft blobs: teal
  #1fb5a8, violet #7c5cff, amber #ffb44d) drawn as radial gradients — fx only; static and dimmer without fx.
  Cards = frosted glass: rgba(255,255,255,.08) fill, 1px rgba(255,255,255,.18) inner edge, backdrop-filter blur(24px)
  saturate(1.4) (fx only; fallback solid #182036). Text #f4f6fb, dim #a9b1c6 (≥4.5:1 on fallback solid). Accent per room
  from the field colours. Light mode: page #eef1f7 with pastel field, cards rgba(255,255,255,.62), text #0f1424.
- Type: "Figtree" (OFL variable; ship woff2) 600 names, 300-400 big numbers (very large), mixed case, generous spacing.
- Shape: bento — radius 28px on cards, 18px on keys, 999px on pills; cards in a room get mixed sizes where the
  dashboard allows (the lab dashboards will use spans); subtle lift on hover (fx).
- Lights on: the card glows from inside with the light's colour (a soft radial tint, fx) or a tinted solid (no fx);
  brightness = a thick rounded track with a glossy knob.
- Kiosk: big thin clock floating on the colour field, glass dock tiles; kiosks run fx OFF (solid panels).
- Motion: spring-like 260ms ease-out on press/open; nothing continuous on kiosks; reduced motion = none.
- Contrast ≥ 4.5:1 measured on the no-fx solid fallback; with fx keep the same text colours.

## Built (R10, 2026-11-03)
Theme "Jam Glass" (`../jam-theme/themes/jamboard-glass.yaml`, generated from `tokens/looks/glass.mjs`) + the pack
`src/looks/glass.js` + Figtree (variable 300-700, latin subset from Google Fonts, 19.7 KB, OFL) in `dist/fonts/`. Rules in
docs/DESIGN.md "Glass rules". Choices the brief left open, and where the build departs from it, so a reviewer can
overrule them:
- **fx default on**: the theme sets `jam-fx: 1` (frosted panes: the brief's white .08 / .62 fill, backdrop blur 24px
  saturate 1.4, the 1px light inner edge + a soft drop shadow; the light glow; glossy knobs; the 2px hover lift; the
  brighter colour field). With fx off (`fx: false`, the kiosks) the panes are the solid fallback (#182036 / #fbfcff) with
  a 1px `--line` edge, a lit light is a tinted solid, knobs are plain white, the field is half as bright. Both states are
  checked (`JAM_FX=0`). The Echo Show / iPad dashboard YAML is not changed here (HA is read-only for workers): adding
  `fx: false` to jam-kiosk / jam-screensaver there is a follow-up for the user.
- **Colour field**: HA's `lovelace-background` (three radial blobs, `fixed` to the viewport, over the ground); its
  brightness follows the page's `--jam-fx` (alpha x (1 + fx) / 2), so a theme or page without effects gets the dimmer
  static field. Nothing moves (universal rule: no continuous motion; the brief's "slow" field is static). jam-kiosk and
  the screensaver paint their own copy of the field (opaque ground + blobs, from the art-1..3 tokens), scaled by their own
  fx state, so a kiosk card with `fx: false` gets the dimmer field even when the page has fx on.
- **Glass fill token**: the frosted fill per mode rides on the legacy `jam-shadow` token (read by no card since v0.3), so
  the pack needs no new registry token.
- **Violet**: the field keeps #7c5cff, the violet *fill* (room accent, HA primary) is lifted to #8f7aff so ink text on it
  reaches 5.8:1 (#7c5cff is 4.4:1). Every hue fill takes ink text (`--on-fg`) in both modes.
- **Type**: Figtree 600 names (x .74), 300 for the big numbers (clocks, temperatures, values, percentages; `jam-num-scale`
  .9), labels 500 in sentence case with a little tracking, keys 600 mixed case. No uppercase anywhere.
- **Active = the room colour**: on keys, scenes, tabs (each in its own tab colour), lit jam-buttons and power buttons
  take the room colour with ink text (under fx with a soft glow of the same colour); off keys are slab2 panes with a 1px
  edge. Chips, tabs, tone marks (dots) and the power button (a 36px circle) are pills / round.
- **Lights on**: fx = a soft radial tint of the light's colour from the top-left of the frosted pane (46% -> 14%); no fx
  = the light colour mixed 30% into the solid pane (OKLab: an OKLCH mix turns amber purple on the blue-grey pane). Text stays `--fg` (no label plates). Brightness = a 14px
  rounded track with a 20px round knob (glossy under fx); every slider strip is a 24px rounded track with a 28px knob.
- **Kiosk**: the clock in Figtree 300 floats on the field, the accent bar is a 56px pill, dock tiles are 28px panes tinted
  24% with their colour (frosted under fx). **Screensaver**: the field, the thin clock, the layout's bars as glass pills
  and its disc as a tinted orb, the now-playing block on a pane; kick and temperature in text colours (the field is not a
  safe ground for accent text in light mode).
- **Sheets**: under fx a frosted pane (slab at 93% + blur: the veil behind it is the dark ink, so a thinner fill turns a
  light-mode sheet grey) over a lightly blurred veil; cards inside a sheet are plain solid panes (one frosted layer at a
  time); sheet kickers are `--dim` text (an accent kicker is 1.7:1 on a light pane).
- **Light pop-up**: the big brightness bar and the hue strip are 22px rounded tracks, member tracks and swatches pills.
- **Graphs**: legend marks are dots, bars and crosshair marks get a 3px corner radius (SVG `rx`).
- **Bento spans**: the brief's mixed card sizes are a dashboard-layout choice (grid spans in the lab dashboards), not
  something the look can set; nothing in the cards changes for it.

### Design review fixes (2026-11-04)
An independent review rated phone / desktop "ship with fixes" and the kiosk "rework"; applied on the same branch:
- **Lit = the pane lights up** (jam-light on, jam-button on; replaces the radial tint over the dark pane, which read khaki,
  and the solid amber slab): the light / room colour is re-lit in OKLCH (relative colour syntax) with the lightness
  clamped to a bright band and the chroma capped, so a warm white never mixes with the blue-grey pane. No fx: one tint
  (L .84, C <= .12); fx: a radial glow from a near-white core (L .95) through the tint to a deeper rim (L .76) plus a soft
  halo of the colour. Text on a lit pane is ink; the brightness track is the tint darkened with ink, the fill ink, the
  knob white (glossy under fx); the power button an ink disc with the tint as glyph.
- **Unavailable** = an empty pane (no fill, no blur, no shadow) with a dashed edge, the tone dot hollow; off stays a
  quiet pane.
- **Tone dot**: Poster's left tone stripe (a crescent on a 28px corner) is an 8px dot before the first line (jam-tile,
  jam-slider, jam-choice, jam-media, jam-remote groups); faces with a dot get 30px left padding.
- **Very large numbers** in Figtree 300: light % 40px, slider value 40px, house temperature 46px (outside 32px), gauge
  46px, graph current value 48px; smaller values (volume, highs / lows, tile values) 400.
- **Bugs**: a key in a wrapping row (jam-tile lock / switch key) keeps its own height (Poster's height 100% stretched the
  jammed-door key into a tall red blob over the next card); the light pop-up swatch pill is scoped to `.sws`; weather
  clouds and moon use `--dim` (Poster's `--paper` is the white pane in light mode).
- **Kiosk dock states** (jam-kiosk `.blk[data-state=on|off|action]`, written by another branch; a preview stub
  `preview/fixtures/86-kiosk-dock-state.js` stamps it until then): on = the solid room colour with ink text (fx: an
  upward glow of it), off = a neutral pane, action = an outlined tile; a "none" block is a neutral pane (no violet).
- **Room field on the kiosk**: one disc per dock block rises behind its tile in the block's colour, bright (26% into the
  ground) while the block is on, dim (9%) when off, redrawn only when its data-state changes; flat discs without fx (so
  the fx-off kiosk is colourful), soft blobs (30% / 12%) under fx, where the kiosk tiles skip the backdrop blur so the
  blob shows through them. The kiosk's static three-blob field is turned down to let the room field lead. Dim text over
  a lit disc stays >= 4.5:1 (#a9b1c6 on the amber disc 4.8:1).
- **Bento**: a multi-column kiosk sheet with an odd card count leads with one full-width tile; `size: "kiosk"` cards and
  `size: big` jam-buttons get a 36px radius. The dashboard's own grid spans stay the dashboard's job.
- **Screensaver**: the layout's bars are left out (edge pills read as empty fields, mostly in light mode); its disc is a
  flat orb in the room colour, under fx lit from its centre with a soft halo (no specular highlight).
