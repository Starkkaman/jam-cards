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

## Built (R10, 2026-11-04)
Theme "Jam Girard" (`../jam-theme/themes/jamboard-girard.yaml`, generated from `tokens/looks/girard.mjs`) + the pack
`src/looks/girard.js` + Fraunces and Work Sans in `dist/fonts/` (SIL OFL 1.1, latin subsets from Google Fonts: Fraunces
opsz 9-144 / wght 400-800 with SOFT 100 / WONK 1 pinned, 62 KB; Work Sans wght 400-600, 50 KB). Rules in docs/DESIGN.md
"Girard rules". Choices the brief left open, and where the build departs from it, so a reviewer can overrule them:
- **Rooms -> fills, patterns, motifs.** Living vermilion / diamonds (pink) / sun, kitchen mustard / zigzag (vermilion) /
  diamonds, master cobalt / dots (mustard) / a sleeping eye, marissa pink / sawtooth (magenta) / heart, music magenta /
  stripes (pink) / bird, nerd turquoise / checks (mustard) / eye. The brief names five motifs for six rooms: master got
  the eye with a closed lid (still Girard's eye) so nerd keeps the open one. Alerts (`jam-red`) are vermilion like living:
  the alert tone shows as a vermilion band / fill, and its pattern partner is mustard.
- **Frame = band + pattern.** The 6px border is the room colour (an inset shadow) woven with the room's pattern in a
  partner colour (a `::after` with four CSS mask strips), so every card reads as a two-colour textile and the contrast
  audit still measures the flat face (no background image on it). A card's own left tone stripe is folded into the band.
  Kiosk cards and the cards inside the kiosk sheets are not framed (they fill the screen; the sheet around them is);
  dock blocks are. A jam-popup child that only inherits `--jam-accent` gets the default (living) pattern and motif: the
  room is read from the inline `--acc: var(--x)`, which CSS can see only where the card writes it.
- **Contrast deviations**: vermilion #e8452c -> #ec5236 (ink text 4.24 -> 4.64:1); ink text on vermilion / mustard / pink /
  turquoise / olive, white on cobalt / magenta (ink is 2.9 / 3.6:1 there). The text colour on any fill is computed from the
  fill in CSS (relative colour syntax, a luminance switch), so it also holds for inherited accents, the volume rocker and the
  light colour on the sun power key. Dim #6b5446 / #cbb6a3, alert text #b3261e / #ff9a80.
- **Keys** are pills (radius 28px: a pill at key height, a rounded tile when taller, e.g. jam-tv sources), tinted with
  the room colour (18% in OKLCH) when off, the full fill when on. jam-button tiles are square framed cards like the rest.
- **jam-light**: the motif sits before the level (the name keeps its full width: at 390px a motif before the name broke
  words); on = the face tinted 20% with the light colour, the motif and the brightness pill in the light colour.
- **Sun power key**: 32px sun top-right, muted when off, room / light colour when on; it turns 15° when the state changes
  (a transition, so one turn per tap; none with reduced motion). The brief's "sun circles for primary actions" is used
  for power only; play / OK stay pill / disc fills.
- **Type**: Fraunces 600 at x .7 (numerals x .78), the kiosk clock 500; Work Sans labels 500 and keys 600 in sentence case
  (no tracked capitals). The kiosk K1 volume number is set to 22px (the x .78 numeral scale put it under the 18px floor).
- **Screensaver**: page ground, the Fraunces clock, sun / heart / eye / bird in the layout's bar and disc places (l1 stacks
  three of them, so they are smaller and stepped there); the now-playing block keeps Poster's layout without a panel (a
  panel exposed long titles overflowing the block, as they do under Poster).
- **HA chrome**: white header and sidebar (dark: ink) over a 6px vermilion band, cobalt primary with white text (dark:
  mustard with ink text), pill badges / tile icons; card-mod view tabs in Work Sans over a 6px room band, the current tab
  a pill filled with its colour. HA's own cards are not framed (a theme cannot add the pattern to them).
