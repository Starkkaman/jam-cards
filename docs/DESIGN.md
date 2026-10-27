# Jam design system (v0.3 "Poster") — the source of truth for every jam card

Saul Bass graphic design (Anatomy of a Murder, The Man with the Golden Arm, Vertigo, North by Northwest), as a poster:
**flat colour blocks on an ink ground, cut with scissors in straight lines.** One accent colour per card (per room),
filled into whatever is on. Fun comes from shape and colour blocking, never from effects.
v0.3 replaced the v0.2 torn-paper look (jagged edges + offset shadow slabs) with the approved mockup variant "A · Poster".

## Hard rules
- Flat colour only. No gradients, blur, glows, shadows of any kind, rounded corners, opacity fades as decoration.
- Separation comes from flat surfaces: card face `--slab` on the ink ground, inner controls `--slab2`. No shadow slabs.
- Edges are **straight**: every surface is a rectangle with ONE 45° cut corner, fixed per element kind (see "Edge system").
  Nothing is torn or jagged; nothing is random per seed. Text never sits in a cut.
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
| inner controls, off keys | `--jam-slab2` | #2a2622 | #e9dfc4 |
| hero face | `--jam-paper` | #ece2c9 | #141210 |
| hero text | `--jam-paper-fg` | #141210 | #ece2c9 |
| hero muted | `--jam-paper-dim` | #5c5446 | #9a8f7c |
| text | `--jam-fg` | #ece2c9 | #141210 |
| muted | `--jam-dim` | #9a8f7c | #6b6152 |
| rules/off | `--jam-line` | #34302a | #d3c7a8 |
| text on any accent fill | `--jam-on-fg` | #141210 | #141210 |
| accent ochre (default) | `--jam-ochre` | #e5a31b | #d99410 |
| accent teal (also calm/info) | `--jam-teal` | #22a39a | #22a39a |
| accent blue | `--jam-blue` | #4a7be0 | #4a7be0 |
| accent pink | `--jam-pink` | #e2658f | #d24f7c |
| accent violet | `--jam-violet` | #9b6dd6 | #9b6dd6 |
| accent green | `--jam-green` | #86a83a | #6d8f22 |
| alert (reserved) | `--jam-red` | #e0553b | #e0553b |
| (unused since v0.3, kept for themes) | `--jam-shadow` | #0a0908 | #c9bb98 |
| series 1-5 | `--jam-s1`..`--jam-s5` | #bd8000 #1f9fb0 #d43a1c #a66cc4 #7f9b2a | #a86e00 #00879c #c2361a #8a52ad #5f7d1c |

Series palette validated with the dataviz validator (both modes, all checks PASS); unchanged in v0.3. Order fixed, never
cycled; a 6th series is not allowed (fold into fewer series). Status colours are never series colours in the same card.
State tones (`tone()`): on = the card accent, alert = red, calm = teal, off = line/dim.

## Colour system (accent)
- Every card accepts `accent:` — a hue: `ochre`, `teal`, `blue`, `pink`, `violet`, `green`, `red`; or a room alias:
  `living`→ochre, `kitchen`→teal, `master`→blue, `marissa`→pink, `music`→violet, `nerd`→green, `alert`→red.
  `ink` / `paper` also resolve (jam-button uses them; hero chip `tone: paper`). Case-insensitive; unknown names are ignored.
- jam-button also maps HA `color:` names: red/deep-orange→red, orange/amber/yellow/primary→ochre, pink→pink,
  blue/light-blue/indigo→blue, purple/deep-purple→violet, green/light-green/lime→green, teal/cyan→teal, grey/light-grey→ink.
  `accent` wins over `color`.
- Default accent = ochre. A card without `accent` follows `--jam-accent` when an ancestor sets it (jam-popup hands its
  accent to its child cards this way); a child's own `accent` still wins.
- **Red is reserved** for alerts, unavailable states, jammed locks and power keys. Defaults are never red (hero default = ochre).
- Where the accent shows (Poster rule): jam-heading rule (5px straight bar); anything ON/active fills with the accent and
  takes `--jam-on-fg` text: jam-button on face, jam-tile/jam-list ON pills, jam-light ON pill + brightness fill + active
  temp/preset chip, jam-slider fill, jam-choice selected option, jam-media art block / play key / volume fill / active chips,
  jam-remote OK disc + arrow marks, jam-gauge single-band fill (severity bands keep teal/ochre/red), jam-weather today
  column + temperature bars, popup kicker + header rule, hero hot chips + meta separators, tile stripe and "on" values.
- Off/idle controls stay `--slab2` with `--jam-fg` text. Text on any accent fill is always `--jam-on-fg` (ink), never paper.
- jam-button icon: a small square with a cut corner (28px, big 36px) in the accent when off, ink when on, the MDI icon
  drawn on it (ink on accent / accent on ink). `ink` (or HA grey) = plain key without the square.
- API: `JamCards.ACCENTS`, `accentName(a)`, `accentVar(a)` → `"var(--teal)"` or null, `accentFg(a)`, `setAccent(node, a)`
  (sets `--acc` / `--acc-fg`). Inside a card use `var(--acc)` for fills and `var(--acc-fg)` for text on them.

## Edge system (shared helpers, used by every card)
- One 45° cut corner per surface, fixed per kind (`JamCards.CUTS`):
  | kind | corner | size | used for |
  |---|---|---|---|
  | `card` | bottom-right | 14px | card faces and panels (default) |
  | `key` | top-right | 12px | jam-button, jam-remote row keys |
  | `chip` | bottom-right | 6px | pills (ON/OFF, lock, press), option/temp/preset/source chips, transport keys, colour swatches, forecast columns, media art, popup close |
  | `hero` | bottom-right | 22px | jam-hero |
  | `sheet` | top-right | 18px | jam-popup sheet (desktop and phone bottom sheet) |
- `cutPath(corner, size)` → a 5-point CSS `polygon()`. `paper(tag, key, {kind, cls, face})` → `{root, face}`: root
  `.paper` with `data-cut=kind` and `--clip`, face `.face` clipped by it. `cutKey(label, key, cls, kind = "key")` → a
  real `<button>` on it. The `key` argument and the v0.2 options (edges/depth/step/cut) are accepted and ignored.
- Face padding is at least the cut size, so content never enters the cut.
- Strips (slider, light brightness, media volume, gauge bar): 32px touch track, 22px `--slab2` strip, accent fill whose
  end is straight with an 8px diagonal (`polygon(0 0,100% 0,calc(100% - 8px) 100%,0 100%)`).
- Chips in jam-heading / jam-hero: flat blocks (no border) with the chip cut.
- Exceptions with their own straight shapes: jam-remote d-pad arms (5-point arrow with a 45° point, `data-cut=arrow`) and
  the OK disc (`circle()`, `data-cut=disc`); the jam-button icon square (30% corner cut).
- Press feedback (buttons, tiles): face moves `translate(2px,2px)` on `:active`. No transition.
- Legacy: `seed`, `rng`, `tornPath` stay exported for compatibility; no card uses `tornPath` any more.

## Motifs (use sparingly; one per card max)
- **Golden Arm bars**: 3-5 straight vertical bars of varying height — only as the empty/loading placeholder
  (media without art, graph while loading).
- **Vertigo spiral**: an SVG spiral used only for the pop-up open flash and the gauge centre.
- **Cut arrow**: straight 5-point arrows for the remote d-pad.
- **Big numerals**: values (temperature, %, time) set huge in Londrina; units small Jost beside them.

## Card catalogue (what each jam card is for)
| Card | Replaces | Essentials |
|---|---|---|
| jam-heading | heading (+badges) | kicker, title, 5px accent rule, state chips, tap_action |
| jam-hero | markdown header / big status | paper slab, 22px cut, title_entity, meta, chips, power off state |
| jam-tile | tile, mushroom-entity, bubble button | entity block, stripe, value; `control: auto/toggle/lock/press/none`; features below |
| jam-choice | select tile, bubble select | option chips |
| jam-slider | numeric tile, bubble slider | number/input_number/light/media volume/**fan percentage** |
| jam-media (v2) | mediocre*, YAMP, media tile | art as a duotone block (image + CSS `mix-blend-mode: multiply` over a flat accent block is allowed: it is flat print, not a gradient), title, artist, transport, volume slider, optional source chips |
| jam-button **new** | button (launchers, scenes, scripts, stereo keys) | big key: label + accent square with optional ha-icon, colour (`accent` or `color` from HA names mapped to jam tokens), accent face when entity on, tap/hold/double_tap actions, confirmation |
| jam-light **new** | mushroom-light | name, on/off key, brightness bar (drag), colour-temp chips + colour swatches from `effect`-less presets; light colour shown as a flat swatch block |
| jam-popup **new** | bubble pop-up | opens on `location.hash == hash`, full-screen ink veil + cut sheet, title, child `cards` rendered via HA card helpers; close on veil/Esc/close button (history.back if we pushed, else clear hash) |
| jam-remote **new** | universal-remote-card | d-pad (cross of cut arrows), OK, back/home/menu row, transport row, volume via custom actions; sends `remote.send_command` / configured actions |
| jam-weather **new** | clock-weather, weather-forecast(-card) | big temp numeral, condition word (no animated effects), N-day forecast strip as cut columns, optional `clock: true` big time; uses `weather/subscribe_forecast` |
| jam-graph **new** | mini-graph, sensor graph, statistics-graph | SVG step/line chart from history (`history/history_during_period`), 1-5 series in `--jam-s*`, 3px square-capped lines, recessive axis, legend chips, crosshair + tooltip on hover/tap, current value big |
| jam-gauge **new** | gauge | half-disc of cut wedges (severity bands) + big numeral, or `style: bar` |
| jam-list **new** | entities | rows: name / value, divider rules, toggles for switchable rows |

## Native cards left in clones
picture-glance (camera), markdown, conditional/grid/vertical-stack/horizontal-stack containers. The theme styles them
(square, flat, Jost); they get no cut corner.
