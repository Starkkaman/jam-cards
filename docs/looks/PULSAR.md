# Look: Pulsar (decided design, 2026-11-03)
After Peter Saville / Factory Records: Unknown Pleasures (1979), Blue Monday and Power, Corruption & Lies (1983).
Reference: `~/project/jam-dash/mockups/v8-pulsar.html`. Same cards, layouts, controls; tokens + pack only.

Character: black field and thin white lines (dark is primary), restraint, wide-tracked tiny capitals, a 12-colour code
instead of icons (Blue Monday floppy-disk code: colour squares encode the name), one warm accent.
- Palette dark (primary): page #000, card #000 with a 1px rgba(255,255,255,.24) rule, line/text #fff, dim
  rgba(255,255,255,.55) (≥4.5:1 needed — use #9a9a9a-equivalent), warm accent #ffb070 (needs attention / on).
  Light: page #e7e2d2 (cream), card #e7e2d2 with 1px black rule, ink #000, dim #555, accent #b5541f.
  12-colour wheel (code squares): #e5382d #f26b21 #f7a823 #f2d21b #9ec43c #2aa148 #1aa59a #2e8fd8 #2f4fb1 #6a3fa0
  #b6449a #ec5a8a. A name's code = 4 squares (first four letters mapped a..l, m..x) + 1 check square.
- Type: Archivo or Space-Grotesk-like thin: use "Archivo" 300/400 (already shipped) with very wide tracking (.35em) for
  labels, uppercase labels only; values in 300 weight.
- Shape: no fill boxes; cards are outlined with thin rules; corners square; no shadows.
- Signature motif: "pulse" — where a card has a numeric history or level (light brightness, volume, power, gauge,
  graph), draw stacked thin white ridge lines (Unknown Pleasures) instead of bars: brightness = a single ridge whose height
  is the level; graphs = stacked ridgelines. Static unless the value changes (no continuous animation on kiosks).
- Code squares replace icon squares on cards, dock blocks and room headings.
- Kiosk: clock thin and wide-tracked, a ridge motif across the poster; screensaver = black field + ridge band + time.
- Motion: slow fades (300ms); the restart/alert lights its code one square at a time (stepped, 120ms per square).
