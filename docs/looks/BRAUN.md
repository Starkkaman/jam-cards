# Look: Braun (decided design, 2026-11-03)

After Dieter Rams (T3 radio, ET66 calculator, AB-1 clock). Visual reference: the Braun band in the user-approved
mockup `docs/looks/jam-looks.html` (open with Playwright) and JamDash's built Braun look
(`~/project/jam-dash/web/src/lib/themes/braun/braun.css`, `mockups/v3.html` first section). Same cards, same layouts,
same controls; only tokens + the braun pack change.

## Character
A warm-white appliance you operate. Quiet panels, one orange signal for "active / act", toggles instead of power
corners, LED dots instead of colour floods. Calm in a bright room. "Less but better": no decoration that isn't a control.

## Palette
| token role | light (primary) | dark ("anthracite") |
|---|---|---|
| page / view background | #e7e3da | #1c1c1a |
| panel (card face) | #f2efe8 | #2a2a27 |
| panel 2 (keys, tracks) | #e4e0d6 | #34342f |
| hairline border | #d6d1c6 | #3d3d38 |
| ink (text) | #262626 | #ece9e2 |
| dim text | #77736b | #9c988f |
| signal (accent, the only strong colour) | #f07d1e | #f28a2e |
| ok (sparingly: online dots) | #5f9a4a | #6fae58 |
| alert | #d9482b | #e5583a |
Room colours are NOT used as fills. Room/accent shows only as a small dot or a 2px rule. A light's own colour shows as its
LED dot and its brightness bar fill. Contrast ≥ 4.5:1 for all text in both modes.

## Type
Archivo (variable, 400-700, from dist/fonts). Mixed case everywhere (no uppercase transforms) except the small labels:
labels 10-11px, uppercase, tracking .06em, weight 500. Names 500 at ~0.72× Poster's display size; big numbers weight 400,
tabular, ~0.85× scale. Kiosk clock: Archivo 300, tabular, large, with the colon in the signal orange.

## Shape and depth
- Radius 14px cards/sheets, 10px inner panels, 999px keys/pills/toggles. No cut corners, no torn edges.
- 1px hairline border + soft elevation `0 1px 0 rgba(255,255,255,.7) inset, 0 2px 8px rgba(0,0,0,.08)` (light);
  dark: `0 1px 0 rgba(255,255,255,.04) inset, 0 2px 10px rgba(0,0,0,.35)`. This is the only look allowed a shadow.
- Brightness / progress strips: 4px, rounded ends, track = panel 2, fill = light colour (lights) or signal (media).

## Controls (pack CSS)
- Power corner → a toggle switch top-right (34×18 pill; off = panel-2 track with light knob left; on = ink track, knob
  right). Same hit area as the corner (≥ 44px).
- Light on: face stays panel colour; an 8px LED dot left of the name in the light's colour (glows: 0 0 6px of that colour);
  group bands become a row of 10px dots (one per member, off = hollow ring) placed left of the toggle.
- Keys: pills, panel 2 fill, ink text; the primary key (Play, active choice) = signal fill + white text.
- Sliders: thin track, round 18px knob in panel colour with hairline border.
- Kiosk dock blocks: panels with a room-colour dot + name; the active/pressed block inverts (ink face, panel text).
- Focus ring: 2px signal outline, 2px offset, radius follows the element.

## Motifs
- idleArt: a speaker-grille dot grid (concentric rows of 6px dots in panel-2/dim on panel) with one orange dot.
- armBars (empty art): a 5×4 dot grille, dims for idle.
- Screensaver: AB-1 clock — panel-coloured page, large numerals; optional thin circular dial ring; weather/facts in
  small dim Archivo; now-playing block as a rounded panel.
- Power glyph not used on toggles; elsewhere a thin 1.75px stroke icon.

## Motion
Smooth, never stepped: 160-220ms ease-out; toggle knob slides; press = scale .98. No wipes/stamps. Reduced motion = none.

## Done when
Every card fixture, sheet, popup, both kiosk homes + sheets (1024×768, 961×601) and the screensaver render in Braun light
and dark with: fit checks passing (no overflow), contrast ≥ 4.5:1, focus visible, hit areas ≥ 44px, controls all present.
Contact sheet `preview/shots/looks.html` shows Braun next to Poster. Poster stays pixel-identical.
