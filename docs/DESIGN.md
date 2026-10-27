# Jam design system (v0.2) — the source of truth for every jam card

Saul Bass graphic design (Anatomy of a Murder, The Man with the Golden Arm, Vertigo, North by Northwest):
**cut paper, not UI chrome.** Flat colour slabs that look scissored and pasted, heavy hand-cut display type,
hard cuts instead of easing. Fun comes from shape and colour blocking, never from effects.

## Hard rules
- Flat colour only. No gradients, blur, glows, soft shadows, rounded corners, opacity fades as decoration.
- Shadows are **paper**: a second flat slab offset behind the face (never a blurred box-shadow).
- Edges are **torn/cut**: polygon clip-paths with irregular points (see "Edge system"). Text never sits in a clipped-off zone.
- Display type: Londrina Solid 900, UPPERCASE, tight leading (.9), slight negative tracking allowed (-.005em).
  Body/labels: Jost 400-600; labels UPPERCASE .72rem letter-spacing .16em.
- Motion = hard cuts: `steps()` or ≤120 ms linear. Respect `prefers-reduced-motion` (no motion at all).
- Entity names, states, attributes → `textContent` only. Never innerHTML with data.
- Every control is a real `<button>` / keyboard reachable, visible focus = 3px ochre outline offset 2px.
- No dependencies, no build step, everything in `jam-cards.js`. Keep each card lean: no feature nobody configured.

## Tokens (CSS custom properties; theme sets `--jam-*`, cards fall back to the dark values)
| Role | var | dark (ink) | light (paper) |
|---|---|---|---|
| ground | `--jam-ink` | #141210 | #141210 |
| card face | `--jam-slab` | #1f1c19 | #f6efdd |
| raised/inset | `--jam-slab2` | #2a2622 | #e9dfc4 |
| hero face | `--jam-paper` | #ece2c9 | #141210 |
| hero text | `--jam-paper-fg` | #141210 | #ece2c9 |
| hero muted | `--jam-paper-dim` | #5c5446 | #9a8f7c |
| text | `--jam-fg` | #ece2c9 | #141210 |
| muted | `--jam-dim` | #9a8f7c | #6b6152 |
| rules/off | `--jam-line` | #34302a | #d3c7a8 |
| on/active | `--jam-ochre` | #e5a31b | #c98a0c |
| alert | `--jam-red` | #d43a1c | #c2361a |
| calm/info | `--jam-teal` | #3f9aa5 | #2f7f89 |
| paper shadow | `--jam-shadow` | #0a0908 | #c9bb98 |
| series 1-5 | `--jam-s1`..`--jam-s5` | #bd8000 #1f9fb0 #d43a1c #a66cc4 #7f9b2a | #a86e00 #00879c #c2361a #8a52ad #5f7d1c |

Series palette validated with the dataviz validator (both modes, all checks PASS). Order fixed, never cycled;
a 6th series is not allowed (fold into fewer series).
State tones (existing `tone()`): on = ochre, alert = red, calm = teal, off = line. Status colours are never series colours
in the same card.

## Edge system (shared helpers, used by every card)
- `seed(str)` → deterministic 32-bit int (e.g. FNV-1a of the card's entity/title + card type). Same config = same edges
  on every render (no flicker, no random per frame).
- `tornPath(seed, {edges:"b"|"rb"|"trbl", depth:px, step:%})` → a CSS `polygon()` string. Straight edges stay straight;
  torn edges get a point every `step`% (default 7%) jittered inward 0..depth px (default 5px) using `calc(100% - Npx)`.
  Corners: one corner per card may be **cut** (a 14-18px diagonal, like the existing hero) chosen by the seed.
- Face = torn on bottom (+ right on wide cards); shadow slab = same shape with a different seed, offset
  `translate(6px,6px)` (`--jam-shadow`), behind the face, `aria-hidden`.
- Accent "tape": optional 6px stripe on the left (existing `.stripe`) stays the state indicator; it is cut straight.
- Press feedback (buttons, tiles): face moves `translate(3px,3px)` on `:active`, shadow stays → it "prints". No transition.
- Pads/clipping: the torn depth is reserved as padding so content is never clipped.

## Motifs (use sparingly; one per card max)
- **Golden Arm bars**: 3-5 jagged vertical bars of varying height in a heading or empty state.
- **Vertigo spiral**: an SVG spiral used only for the pop-up close/open moment and the gauge centre.
- **Cut arrow**: a hand-cut triangle/arrow for navigation chips (`→`), drawn with clip-path.
- **Big numerals**: values (temperature, %, time) set huge in Londrina; units small Jost beside them.

## Card catalogue (what each jam card is for)
| Card | Replaces | Essentials |
|---|---|---|
| jam-heading | heading (+badges) | kicker, title, accent rule (torn), state chips, tap_action |
| jam-hero | markdown header / big status | paper slab, cut corner, title_entity, meta, chips, power off state |
| jam-tile | tile, mushroom-entity, bubble button | entity block, stripe, value; `control: auto/toggle/lock/press/none`; features below |
| jam-choice | select tile, bubble select | option chips |
| jam-slider | numeric tile, bubble slider | number/input_number/light/media volume/**fan percentage** |
| jam-media (v2) | mediocre*, YAMP, media tile | art as a duotone cut-out (image + CSS `mix-blend-mode: multiply` over a flat accent block is allowed: it is flat print, not a gradient), title, artist, transport, volume slider, optional source chips |
| jam-button **new** | button (launchers, scenes, scripts, stereo keys) | big key: label + optional ha-icon, colour (`accent` or `color` from HA names mapped to jam tokens), state tint when entity on, tap/hold/double_tap actions, confirmation |
| jam-light **new** | mushroom-light | name, on/off key, brightness bar (drag), colour-temp chips + colour swatches from `effect`-less presets; light colour shown as a flat swatch block |
| jam-popup **new** | bubble pop-up | opens on `location.hash == hash`, full-screen ink veil + torn paper sheet, title, child `cards` rendered via HA card helpers; close on veil/Esc/close button (history.back if we pushed, else clear hash) |
| jam-remote **new** | universal-remote-card | d-pad (cut-paper cross), OK, back/home/menu row, transport row, volume via custom actions; sends `remote.send_command` / configured actions |
| jam-weather **new** | clock-weather, weather-forecast(-card) | big temp numeral, condition word (no animated effects), N-day forecast strip as torn paper columns, optional `clock: true` big time; uses `weather/subscribe_forecast` |
| jam-graph **new** | mini-graph, sensor graph, statistics-graph | SVG step/line chart from history (`history/history_during_period`), 1-5 series in `--jam-s*`, 3px square-capped lines, recessive axis, legend chips, crosshair + tooltip on hover/tap, current value big |
| jam-gauge **new** | gauge | half-disc of cut wedges (severity bands) + big numeral, or `style: bar` |
| jam-list **new** | entities | rows: name / value, divider rules, toggles for switchable rows |

## Native cards left in clones
picture-glance (camera), markdown, conditional/grid/vertical-stack/horizontal-stack containers. The theme styles them
(square, flat, Jost); they get no torn edges.
