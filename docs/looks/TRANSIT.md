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
