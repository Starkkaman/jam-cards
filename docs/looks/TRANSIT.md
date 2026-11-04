# Look: Transit (decided design, 2026-11-03)
After Massimo Vignelli + Unimark, NYC subway signage (1970) and map (1972). Reference: `~/project/jam-dash/mockups/v8-transit.html`
and the Transit band in `jam-looks.html`. Same cards, layouts, controls; tokens + pack only.

Character: wayfinding. Every card reads like a platform sign: black sign panels with a thin white rule at the top,
one Helvetica-style sans, coloured route bullets that tell you what something is and where it stands. "Service change"
for problems. Strict grid, generous left alignment, no decoration.
- Palette light: page #ffffff, sign/card #000000 with white text, page text #000, muted #5b5b5b, hairline #d6d6d6.
  Dark: page #000, card #111 (with the white top rule), text #fff, muted #9d9d9d.
  Route colours (MTA): red #ee352e, orange #ff6319, yellow #fccc0a (black text), lime #6cbe45, green #00933c,
  blue #0039a6, light-grey #a7a9ac, purple #b933ad, brown #996633, teal-ish #00add0. Room accents map to routes:
  living → orange, kitchen → green, master → blue, marissa → purple, music → purple, nerd → lime, alerts → yellow
  "service change" diamond + text (not red fills).
- Type: Arimo (Helvetica metric clone, OFL/Apache, ship in dist/fonts) 400/700, mixed case, sentence case labels,
  tabular numbers. No uppercase transforms except tiny route letters.
- Shape: square corners; every card has a 4px white (dark) / black (light page sign top) double rule at the top like a
  sign: 4px rule, 3px gap, 1px rule. Cut corners none.
- Route bullets: each card/dock block/light gets a round 24px bullet in its route colour with a letter (first letter of
  the room or name); diamond bullets for "express"/alert states. Bullets replace the icon square.
- Power: a small round toggle bullet top-right (white ring, filled when on).
- Light on: card stays the black sign; brightness bar = thin bar in the light's colour; group = row of small bullets.
- Kiosk: home reads like a platform sign — big "Good evening." greeting style clock line, the facts line, dock blocks as
  black signs with route bullets; screensaver = arrivals board (time big in white on black, now-playing as "Now
  playing" row with bullet).
- Motion: rows "pull in" (slide 8px + fade, 220ms cubic-bezier(.16,.84,.3,1)) on state change; reduced motion none.
- Contrast ≥ 4.5:1 (yellow bullets carry black letters).

## Built (R10, 2026-11-03)
Theme "Jam Transit" (`../jam-theme/themes/jamboard-transit.yaml`, generated from `tokens/looks/transit.mjs`) + the pack
`src/looks/transit.js` (DESIGN "Transit rules"). Choices the brief left open, and where the build departs from it, so a
reviewer can overrule them:
- **Signs in both modes.** `--fg` is the white sign text in light mode too; the page colours (#fff / #000, black #000 /
  #5b5b5b page text) live in HA's own variables (`primary-background-color`, `primary-text-color`,
  `secondary-text-color`), which jam-heading and the kiosk home read for text that sits on the page. Card muted text is
  #9d9d9d in both modes (the brief's #5b5b5b is the page's muted text: 3.1:1 on a black sign).
- **Double rule = page text over page ground**: light = a black 4px rule, a white 3px gap, then the black sign (its 1px rule
  merges into the sign); dark = white rule, black gap, white 1px rule, #111 sign. Inside sheets and on the screensaver the
  rule is white over the sheet face. jam-heading's accent rule and the kiosk's accent bar became the same black / white
  double rule (the route colour moved into the bullet).
- **Bullet letters**: white only where it reaches 4.5:1 (blue 9.8, purple 5.1), black on red / orange / yellow / lime /
  green (white on MTA red is 4.0, on orange 3.0). Bullets are drawn from `data-tr` (the first letter of the name) set by a new
  `decorate` motif; cards without a name element get no bullet (graphs, media, speakers, weather, remote). Off /
  unavailable lights and dock blocks with `accent: none` get a grey bullet / hollow ring.
- **No red**: `jam-red` is the service-change yellow, so alert keys, chips, counts and N/A text are yellow (black text on
  fills); jam-tv's Turn on and the remote's power key are no longer red fills (Turn on = white plate; the remote's power
  key, an alert-class key, is yellow).
- **Active = white plate, black text** (the mockup's selected nav item): active keys, tabs, scenes, choices, play, OK,
  the weather "today" column. On the white page a 2px black ring keeps a white plate visible.
- **Route colours never carry text**: `jam-on-fg` is black, and accent fills with text (jam-light's on face, kiosk dock
  blocks, the volume rocker, outlined keys) are signs / plates instead. The light's own colour is its 4px brightness bar.
- **Off light = the black sign** with a hollow bullet ("stays the black sign"), not the grey card of the jam-looks band.
- **Kiosk clock**: weight 500 with -.025em tracking (the mockup's "Good evening." greeting); no greeting text is added (that
  would need card code).
- **Focus** ring = the yellow (mockup); on the white page the 3px yellow ring outside a sign is weak (1.5:1 on white,
  13.8:1 against the sign it surrounds).
- **HA chrome**: black header and sidebar in both modes; HA's own cards are white with a hairline in light mode (HA has one
  `primary-text-color` for its page and its cards; aliases `text` / `text-dim` / `card` / `card2` / `hair` / `on-primary` /
  `error` / `red` were added to tokens/ha.mjs with defaults = the old values). Primary #0039a6 with white text (light),
  #00add0 with black text (dark); error #c8102e (light) / yellow (dark). Primary ramps are hand-picked, not OKLCH-generated.
  View tabs (card-mod): Arimo 700 sentence case over a 4px route rule, the active tab a white plate.
- **Motion**: pull in (8px slide from the left + fade, 220 ms) for entrances, stamps (dock / scene presses) and the
  screensaver text; a light's on/off change has no motion of its own (the Poster wash is off), the state change shows in
  the bullet, the power bullet and the bar.
