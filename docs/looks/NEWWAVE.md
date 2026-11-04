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
