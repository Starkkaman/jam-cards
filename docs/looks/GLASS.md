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
