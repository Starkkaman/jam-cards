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
