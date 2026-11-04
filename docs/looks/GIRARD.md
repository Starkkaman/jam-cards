# Look: Girard (decided design, 2026-11-03 night)
Playful modernism after Alexander Girard (Herman Miller textiles, La Fonda del Sol, Miller House, 1950s-60s): folk
warmth on a modernist grid. Joyful, handmade-feeling, but orderly.
- Palette (light primary): page cream-white #fbf6ec (not the AI-cliché #F4F1EA warm-clay combo: keep it brighter and
  pair it with saturated colours, no terracotta), ink #2a1a12 (deep brown-black), fills: vermilion #e8452c, magenta
  #d6336c, mustard #e8b028, turquoise #1fa5a0, olive #7a8f2a, cobalt #2f5fd0, pink #f2a3b8. Room → fill: living
  vermilion, kitchen mustard, master cobalt, marissa pink, music magenta, nerd turquoise. Dark: page #2a1a12, cards
  #3a2619, fills same (ink text where contrast needs).
- Type: display "Alfa Slab One"-like slab is too heavy for UI — use "Bree Serif"? Decide: display = "Rubik" 600? No:
  use **"Fraunces"** (OFL variable, soft wonky optical sizes; ship woff2 latin, opsz+wght) for names and big numbers
  (SOFT/WONK axes on), body "Work Sans" (OFL) 400/500. Mixed case.
- Shape: cards are framed textiles — 0 radius, a 6px inner pattern border (repeating diamonds / zigzag / dots, one
  pattern per room, drawn with inline SVG background, flat colours) with the card face inside; keys: radius 999 pills
  or Girard "sun" circles for primary actions.
- Motifs (SVG, flat): sun (circle + rays), heart, eye, bird, diamonds — used as the icon square / empty art / idle art
  (one motif per room), and as a small decoration in the corner of room headings.
- Lights on: face tinted with the light colour (flat mix 20%), the room motif fills with the light colour.
- Kiosk: a big friendly Fraunces clock, a patterned band along the top, dock blocks as little framed textiles.
- Motion: gentle 200ms; the sun motif rotates 15° once on a tap (not continuous). Contrast ≥ 4.5:1.
