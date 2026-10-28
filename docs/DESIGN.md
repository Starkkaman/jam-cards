# Jam design system (v0.3 "Poster") — the source of truth for every jam card

Saul Bass graphic design (Anatomy of a Murder, The Man with the Golden Arm, Vertigo, North by Northwest), as a poster:
**flat colour blocks on an ink ground, cut with scissors in straight lines.** One accent colour per card (per room),
filled into whatever is on. Fun comes from shape and colour blocking, never from effects.
v0.3 replaced the v0.2 torn-paper look (jagged edges + offset shadow slabs) with the approved mockup variant "A · Poster".

## Hard rules
- Flat colour only. No gradients, blur, glows, shadows of any kind, rounded corners, opacity fades as decoration.
- Separation comes from flat surfaces: card face `--slab` on the ink ground, inner controls `--slab2`. No shadow slabs.
- Inside a sheet (jam-popup, openSheet / jamCardSheet) the sheet face is `--slab` and child cards move one step up: the
  sheet body sets `--jam-slab: slab2` and `--jam-slab2: slab3`, so child faces are slab2 and their keys slab3 (theme key
  `jam-slab3` in both modes of ../jam-theme). Content a sheet builds itself (jam-light pop-up) keeps slab2 controls.
- Edges are **straight**: every surface is a rectangle with ONE 45° cut corner, fixed per element kind (see "Edge system").
  Nothing is torn or jagged; nothing is random per seed. Text never sits in a cut.
- Display type: Londrina Solid 900, UPPERCASE, tight leading (.9), slight negative tracking allowed (-.005em).
  Body/labels: Jost 400-600; labels UPPERCASE .72rem letter-spacing .16em.
- Motion = cut paper: one-shot only, `steps()`, ≤ 300 ms, transform / clip-path / opacity only, no infinite animation, no
  rAF loops (see "Motion"). `prefers-reduced-motion: reduce` and `JamCards.motion = false` turn it all off.
- Entity names, states, attributes → `textContent` only. Never innerHTML with data.
- Every control is a real `<button>` / keyboard reachable, visible focus = 3px ochre outline offset 2px. Non-button controls
  (titles, temperatures, rows) use `asButton()` (role=button, tabIndex 0, Enter/Space). A self-clipped element (`.chip`,
  `.scene`, `.tab`) draws the ring inside (offset -3px; on a filled one in its text colour), because a clip-path also clips
  the outline. Toggles carry `aria-pressed`, icon-only keys an `aria-label`, sheets are `role=dialog` + `aria-modal`,
  labelled by their title.
- Contrast (0.3.9): every text >= 4.5:1 on its real background (large text >= 3:1), in both modes, measured by
  ../jam-home/preview/qa/run.js. Accent colours are for fills and marks, never small text: a tone shows as an 8px flat
  `.tmk` square (`.t-on/.t-alert/.t-calm/.t-dim`) or a stripe, the value stays `--fg` (`.c-on`/`.c-calm` = `--fg`). Red TEXT
  (bad values, "unavailable", "N/A") uses `--jam-alert-text` (`.c-alert`); red FILLS (power keys, alert chips with ink text)
  stay `--jam-red`. No opacity-dimmed text: use `--dim` (`.unavail` = `--dim` text, not opacity).
- Touch targets (0.3.9): every control's hit area is >= 44x44 on touch without changing its look. `.key`, `.track`,
  `button.chip` and `.hit` (asButton adds it) get an invisible centred `::after` of max(100%, 44px) each way; the element
  must not clip its own overflow (clamped titles use `clampTitle()`: div.title > span.tl, the span clamps). A tappable
  chip draws its face as a clipped `::before` (`--chip-bg`) so the button itself is unclipped. Stacked targets with < 44px
  between their centres share the overlap (the later one wins); every control's centre still hits itself.
- Long-running kiosks (0.3.8): a card re-renders only when one of its own `watched()` state objects changed (compared by
  reference, HA replaces changed states); timers, observers, window/document listeners, subscriptions and sheets are
  released in `disconnectedCallback` and re-armed in `connectedCallback` (HA detaches cards on view switches).
  preview/checks/97-robust.js enforces both.
- No dependencies, no build step, everything in `jam-cards.js`. Keep each card lean: no feature nobody configured.

## Tokens (CSS custom properties; theme sets `--jam-*`, cards fall back to the dark values)
| Role | var | dark (ink) | light (paper) |
|---|---|---|---|
| ground | `--jam-ink` | #141210 | #141210 |
| card face | `--jam-slab` | #1f1c19 | #f6efdd |
| inner controls, off keys | `--jam-slab2` | #2a2622 | #e9dfc4 |
| inner controls of cards inside a sheet | `--jam-slab3` | #35302a | #ddd1b3 |
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
| alert TEXT (0.3.9) | `--jam-alert-text` | #ff8a6e | #a12a14 |
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
  column + temperature bars, popup kicker + header rule, hero hot chips + meta separators, tile stripe (0.3.9: tile / list "on" values are `--fg`; list values get a tone mark).
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
  | `poster` | bottom-right | 16px | jam-tv poster (0.3.4), jam-speaker poster (0.3.6) |
- `cutPath(corner, size)` → a 5-point CSS `polygon()`. `paper(tag, key, {kind, cls, face})` → `{root, face}`: root
  `.paper` with `data-cut=kind` and `--clip`, face `.face` clipped by it. `cutKey(label, key, cls, kind = "key")` → a
  real `<button>` on it. The `key` argument and the v0.2 options (edges/depth/step/cut) are accepted and ignored.
- Face padding is at least the cut size, so content never enters the cut.
- Strips (slider, light brightness, media volume, gauge bar): 32px touch track, 22px `--slab2` strip, accent fill whose
  end is straight with an 8px diagonal (`polygon(0 0,100% 0,calc(100% - 8px) 100%,0 100%)`).
- Chips in jam-heading / jam-hero: flat blocks (no border) with the chip cut. jam-heading chips (0.3.9): 32px tall, value in
  `--fg` after an 8px tone mark.
- Exceptions with their own straight shapes: jam-remote d-pad arms (5-point arrow with a 45° point, `data-cut=arrow`) and
  the OK disc (`circle()`, `data-cut=disc`); the jam-button icon square (30% corner cut).
- Press feedback (buttons, tiles, keys, light cards): the face "prints" — `jam-print`, 2 steps to `translate(3px,3px) scale(.96)`
  on pointerdown, snaps back on release (0.3.5). Motion off: a hard cut to that state; reduced motion: none.
- Legacy: `seed`, `rng`, `tornPath` stay exported for compatibility; no card uses `tornPath` any more.

## Motion (0.3.5, playful but one-shot)
Every motion is a single stepped cut (`steps()`), ≤ 300 ms, animating transform / clip-path / opacity only; nothing loops,
nothing runs per frame. Classes are added by JS once and never on a plain hass update; `oneShot()` removes them on
animationend so a re-attach or display change does not replay them. Helpers in core: `BASE_CSS` keyframes (`jam-enter`,
`jam-print`, `jam-uncover`, `jam-retreat`, `jam-stamp`), `motionOn()`, `oneShot(node, cls, delayMs)`, `staggerIn(nodes)`,
`treeOrder(a, b)` (composed-tree document order), and `enterView(card)` (JamBase.connectedCallback; subclasses with their
own connectedCallback call super).
| Moment | Motion |
|---|---|
| View entrance | the card's `.host` slides in from the left in 4 steps (translateX −24px + clip from the right), 200 ms; cards connected in the same task are sorted by document order, 40 ms stagger (index capped at 12); once per card; not for cards inside a jam-popup / sheet / jam-screensaver |
| Press | `jam-print` (see Edge system "Press feedback") |
| Light on / off | jam-light: a `.jam-wash` cover over the face — on: slab cover retreats right in 3 steps (210 ms, the colour wipes in); off: the old colour retreats left in 2 steps (120 ms); only on a real on/off change (not the first render, not after a drag preview) |
| Scene / source selected | jam-scenes, jam-tv source tiles, jam-speaker Join → Playing toggle: the newly active key gets `.jam-stamp` (scale 1.08 → 1, 3 steps, 210 ms) and its accent fill wipes in (a slab2 `::before` cover retreats, `--jam-stamp-from`) |
| Pop-up / sheet | stepped slide/wipe + Vertigo spiral flash (unchanged); then the body's children slide in (`jam-in`, 160 ms, 60 ms + 40 ms × index) — jam-popup on every open, openSheet once (refills do not replay) |
| Screensaver | its own per-minute layout cut (unchanged, not affected by `JamCards.motion`) |
| Screensaver photos (0.4.1) | **the one exception to the stepped-cut rule, at the user's request, photos only:** the next photo crossfades over the current one (opacity only, `ease-in-out`, `images.fade` ms, default 900, 0 = cut) after `img.decode()`; max 2 `<img>`, the old one removed after the fade; poster ↔ photos fades the whole slides layer. Reduced motion = instant cut |
Off switches: `prefers-reduced-motion: reduce` (CSS `animation:none` on everything incl. pseudo-elements, and `motionOn()`
is false); `JamCards.motion = false` (an accessor on the frozen API; sets `--jam-motion: 0` on `<html>` so the print is a hard
cut, and the JS skips entrance / wash / stamp / stagger / sheet opening motion). jam-screensaver `motion: false` sets it while the
card is on screen (for a kiosk that cannot cope; default on everywhere).

## Motifs (use sparingly; one per card max)
- **Golden Arm bars**: 3-5 straight vertical bars of varying height — only as the empty/loading placeholder
  (media without art, graph while loading).
- **Vertigo spiral**: an SVG spiral used only for the pop-up open flash and the gauge centre.
- **Cut arrow**: straight 5-point arrows for the remote d-pad.
- **Big numerals**: values (temperature, %, time) set huge in Londrina; units small Jost beside them.

## Card catalogue (what each jam card is for)
Every card accepts `accent:` (Colour system). Option details are in each file's header comment (src/cards/jam-*.js).
| Card | Replaces | Essentials |
|---|---|---|
| jam-heading | heading (+badges) | kicker, title, 5px accent rule, state chips, tap_action |
| jam-hero | markdown header / big status | paper slab, 22px cut, title_entity, meta, chips, power off state |
| jam-tile | tile, mushroom-entity, bubble button | entity block, stripe, value; `control: auto/toggle/lock/press/none`; features below |
| jam-choice | select tile, bubble select | option chips |
| jam-slider | numeric tile, bubble slider | number/input_number/light/media volume/fan percentage |
| jam-button | button (launchers, scenes, scripts, stereo keys) | big key: label + accent square with optional ha-icon, colour (`accent` or HA `color` names), accent face when entity on, tap/hold/double_tap actions, confirmation; `size: normal` = 84px, grid rows auto (= a jam-light card), `big` = 120px |
| jam-light (v2) | mushroom-light | card face = the light's hue at full value (`fullRgb`: rgb_color scaled so the max channel is 255, kelvin → rgb in color_temp mode, else the accent), ink/paper text by luminance of that colour; 84px tall (grid rows auto), big % (1.7rem), 10px brightness strip, drag to dim, 40px corner ⋯ / hold = light pop-up (openSheet): 72px brightness bar, whites or WLED preset cards, hue strip, "Your colours" (HA user data), group members (pills + bars in each member's full-value colour), off-timer |
| jam-popup | bubble pop-up | opens on `location.hash == hash`, ink veil + cut sheet (slab face; children one surface step up), title, child `cards` (HA card helpers), accent handed to children as `--jam-accent`; close on veil/Esc/close/back |
| jam-remote | universal-remote-card | d-pad (cut arrows), OK disc, key rows (`layout: full` = the universal-remote-card set); keyboard key = text sheet (`text:` / DEL / ENTER); `remote.send_command` / `commands` / `actions`; `entity` optional when `actions` is set (keys without an action are disabled; NerveOS button/select remotes); `hide_title` (set automatically inside jam-tv / jam-media sheets); `sections` (0.3.4) = colour-coded blocks (slab face, 5px accent rule, kicker; per-section entity/actions/labels, active key filled from `active_entity`) |
| jam-media (v2) | mediocre*, YAMP, media tile | art as a duotone block (image multiplied over a flat accent block: flat print, not a gradient), title, artist, transport, volume, sources, players, group; `compact` mini layout; `more` ⋯ sheet of child cards (jamCardSheet); title_entity players without a media_player |
| jam-tv | Android TV media cards | 0.3.4 poster (118px, `poster` cut: artwork cover or accent + Golden Arm bars; ink/paper text by art luminance, flat 50% ink band on busy art; app kicker (0.3.9: max 2 lines, a third is clamped), title, position, 5px progress strip; power = 44px top-right triangle, red when off) + Now playing / Source switch (selected = fg fill, remembered until on → off) + transport/volume rows or 3-up source tiles (on-screen source filled with its colour, 0.3.5: only from live signals — `current_app_entity` vs `match.app`, then `input_entity` vs `match.input` while the TV shows an input (`input_app` / `input_signal_entity`); nothing matches → none; 0.3.8: per-source `exact: true` = whole app name only); Remote = sheet with a jam-remote in TV (card accent) + Stereo (violet) sections, keyboard glyph key in the sheet header |
| jam-speaker | Music Assistant / Spotify Connect speaker cards | 0.3.6, option 2 of the speaker mockup: poster (170px, `poster_height`; artwork or accent + Golden Arm bars; ink/paper text by art luminance via jam-tv's sampler; idle = slab2 poster, last title else the name, no hint) with a corner source badge (chip: flat square + word — Spotify Connect green, Music Assistant violet, Grouped teal, Idle / Paused dim, Offline red, else the source) + Now playing / Speakers switch (Speakers only with `speakers`); Now playing = Prev / Play-Pause / Next / Shuffle toggle + 30px volume bar with − / + (5%) and the number; Speakers = This room + one row per speaker: name, Join / Playing toggle (GROUPING players only; join on this player / unjoin that speaker; stamp on a new join), thin volume bar; default accent violet |
| jam-fan | fan tile, purifier cards | On/Off pill, speed steps (fan.set_percentage), preset chips (`presets: false` hides them), air-quality kicker sensors |
| jam-weather | clock-weather, weather-forecast | big temp numeral, condition word (`conditionWord`), cut-paper glyph, forecast strip, optional clock (`clock_size` normal/big/huge) |
| jam-graph | mini-graph, statistics-graph | SVG step/line chart from history, 1-5 series in `--jam-s*`, legend chips, crosshair + tooltip, current value big |
| jam-gauge | gauge | half-disc of cut wedges (severity bands) + big numeral, or `style: bar` |
| jam-list | entities | rows: name / value, divider rules, toggles for switchable rows |
| jam-house | landing header | house strip: inside / outside temperature + condition word, door lock chip (tap = lock), who's home (first names; `full_names`), alert chips; `inside_aq` / `outside_aq` air line under each temperature, words only ("Air · Good"; a US AQI number becomes its category word); `compact` kiosk row |
| jam-tabs | navigation chips / tab bars | equal-width room tabs, current tab filled with its accent, optional sticky (host is position:sticky; in HA it sticks only within its own section; cut corners show `--primary-background-color`) |
| jam-scenes | scene buttons | horizontally scrolling scene/script keys (`wrap: true` = more rows), active scene in the accent (newest scene activation; the input_select when it changed later) |
| jam-screensaver | kiosk screensavers | zero-footprint card; full-viewport Poster clock + weather word or photo slideshow after idle (photos from `images.index` JSON or, 0.4.0, `images.media` = an HA media source folder: browsed ≤ 1/hour, each image resolved to a signed URL right before it is shown, never cached/logged; contain on ink; 0.4.1: photos crossfade (`images.fade`), `mode_entity` picks poster / photos live; any error → poster); built for weak kiosks (no rAF, minute timer); `kiosk` ("url" default = with `?kiosk`) hides HA's sidebar + dashboard header on its own dashboard only (styles in home-assistant-main / ha-drawer / hui-root shadow roots, MutationObserver, removed on leaving the dashboard; 2 s long-press top-left 48 px corner = chrome back until reload) |
| jam-panel | entities (control room) | compact name / value rows, formats (pct, temp, bytes_rate, duration, relative), `bad` thresholds in red; `accent` = 4px rule under the title; names/titles never break mid-word (the value column wraps) |
| jam-alerts | automation / alert lists | automations by last_triggered ("ran …"), watched entities, unavailable count, red failure chip |

### Core helpers (window.JamCards, src/core.js)
- Colour: `ACCENTS`, `accentName`, `accentVar`, `accentFg`, `setAccent`; light colour `kelvinToRgb`, `lightRgb` (a light's output
  colour), `fullRgb` (scale [r,g,b] so the max channel is 255; null for black/missing), `rgbCss`, `luminance`, `inkOn` (ink/paper text).
- Units: `keepUnit(node, stateObj | unit)` wraps a trailing unit in `<span class="unit">` (text-transform:none) so uppercase display
  type never changes a unit's case (µg/m³ stays µg/m³); used by heading chips, tile, list, panel, button, alerts, hero, graph, house.
- Weather: `CONDITION_WORDS`, `conditionWord(state)` (one map for jam-weather, jam-house, jam-screensaver).
- Edges: `CUTS`, `cutPath`, `paper`, `cutKey`, `armBars`; actions `bindActions`, `runAction`, `navigate`, `moreInfo`, `asButton` (0.3.8).
- Motion: `motion` (accessor), `motionOn`, `oneShot`, `staggerIn`, `treeOrder` (see "Motion").
- Sheets: `openSheet({from, title, kicker, accent, headerActions, …})` (headerActions = nodes left of CLOSE, same height) → modal cut sheet over an ink veil (Esc / veil / CLOSE / back close it; child
  cards in `body` get the surface tokens one step up),
  `vertigoSpiral`, `deepActive`. jam-media's `jamCardSheet` puts child cards in one (used by jam-tv and jam-media `more`).

## Native cards left in clones
picture-glance (camera), markdown, conditional/grid/vertical-stack/horizontal-stack containers. The theme styles them
(square, flat, Jost); they get no cut corner.
