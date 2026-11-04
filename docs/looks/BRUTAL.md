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
