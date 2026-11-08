# Jam design system — the source of truth for every jam card (Jam Cards 1.0.0: one look, **Hi-Fi**)

**Hi-Fi** is the calm-instrument look of Jam Design pass 6 + 7 (`jam-design/mockups/pass7/home-assistant.html` on top of
`mockups/pass6/home-assistant.html`, HANDOFF.md 2026-11-06; Isaac: "This design looks much better!"). Until 0.11 it was the
"Jam Calm" look (id `calm`) next to Poster (the v0.3 Saul Bass cut-paper look and the default, theme "JamBoard"), Braun,
Olympia, Transit, Grid, Pulsar, New Wave, Brutal, Glass and Girard. Isaac, 2026-11-07: Calm becomes the only look, renamed
Hi-Fi, and the default; every other look and the look picker are removed. Their rules live on in git history (tag the
0.11 commit `641bcc2`, docs/looks/ and this file's earlier versions).

How the one look is built:
- **Built in.** The Hi-Fi pack (`src/looks/hifi.js`, `registerLook({id: "hifi"})`) is the default pack: `lookPack()` of any id
  is Hi-Fi's, `lookOf()` is always `hifi`. Every card fixes the Hi-Fi theme-level tokens (type, shapes, motion,
  `--jam-look: hifi`) on its own `:host` (TOKEN_CSS, tools/bundle.mjs from `tokens/looks/hifi.mjs`), so no theme can re-type or
  re-shape the cards. Mode tokens (the palette) come from the theme "Hi-Fi" (`../jam-theme/themes/jamboard.yaml`); every one
  falls back to the Night value.
- **Built-in palette.** A card whose page theme is not Hi-Fi (no `--jam-look`, or a stale theme of a removed look: Poster's
  "JamBoard", "Jam Braun", ... still installed in `config/themes/`) carries `data-jam-builtin` (core `setBuiltin()`, in the
  look batch) and TOKEN_BUILTIN_CSS sets every mode token to Hi-Fi Night on its host, the calm-part tokens without a short
  name included. "calm" (a view pinned to "Jam Calm") counts as Hi-Fi. Body layers (sheets, the screensaver) copy the card's
  computed tokens, so they follow.
- **Two kinds of card.** Hi-Fi draws jam-light, jam-tile / jam-button on an on / off entity, jam-button action cards, jam-fan,
  jam-scenes, jam-house, jam-heading, jam-tv, jam-speaker, jam-media (compact / kiosk PC row) and jam-kiosk in layouts of its
  own (the `render` look hook). Every other card (jam-hero, jam-choice, jam-slider, jam-media full, jam-gauge, jam-list,
  jam-popup, jam-graph, jam-weather, jam-remote, jam-tabs, jam-screensaver, jam-panel, jam-alerts, jam-tile / jam-button
  otherwise) keeps its own DOM and gets the **Hi-Fi skin** (pack CSS over the stable class hooks + the pack's motifs; see
  "Hi-Fi rules"). The cards' own layouts are also the fallback when a Hi-Fi drawing throws.

## Universal rules (every look)
- Tokens, not literals: colours, shapes and type come from the `--jam-*` tokens (see "Token reference"); card CSS writes no hex
  colour, no clip-path polygon except as a token's Poster fallback (`var(--jam-shape-card, polygon(...))`) and the listed
  geometry exceptions (jam-remote d-pad arrows / arrow marks / OK disc, circles). Cards never fork per look; a look needs
  only its theme (and later its pack CSS over the stable class hooks).
- Look hooks: every card host, openSheet's `.pop` and the jam-screensaver overlay carry `data-look=<id>` (`lookOf()`:
  the computed `--jam-look`, `poster` when unset). A theme or dark-mode switch (a new `hass.themes` / `hass.selectedTheme`
  object) re-renders the cards and re-reads the look; body layers copy every token (`JamCards.TOKENS`).
- Inside a sheet (jam-popup, openSheet / jamCardSheet) the sheet face is `--slab` and child cards move one step up: the
  sheet body sets `--jam-slab: slab2` and `--jam-slab2: slab3`, so child faces are slab2 and their keys slab3 (theme key
  `jam-slab3` in both modes of ../jam-theme). Content a sheet builds itself (jam-light pop-up) keeps slab2 controls.
- Motion is one-shot only: no infinite animation, no rAF loops (kiosks run for days on weak hardware).
  `prefers-reduced-motion: reduce` and `JamCards.motion = false` turn it all off (see "Motion").
- Entity names, states, attributes → `textContent` only. Never innerHTML with data.
- Every control is a real `<button>` / keyboard reachable, visible focus = 3px `--focus` outline (theme `jam-focus`; Poster:
  ochre) offset 2px. Non-button controls
  (titles, temperatures, rows) use `asButton()` (role=button, tabIndex 0, Enter/Space). A self-clipped element (`.chip`,
  `.scene`, `.tab`) draws the ring inside (offset -3px; on a filled one in its text colour), because a clip-path also clips
  the outline. Toggles carry `aria-pressed`, icon-only keys an `aria-label`, sheets are `role=dialog` + `aria-modal`,
  labelled by their title.
- Contrast (0.3.9): every text >= 4.5:1 on its real background (large text >= 3:1), in both modes, measured by
  ../jam-home/preview/qa/run.js (pixel pass) and, for every look x mode, by preview/contrast.js in preview/shoot.js (DOM
  pass, R9). Accent colours are for fills and marks, never small text: a tone shows as an 8px flat
  `.tmk` square (`.t-on/.t-alert/.t-calm/.t-dim`) or a stripe, the value stays `--fg` (`.c-on`/`.c-calm` = `--fg`). Red TEXT
  (bad values, "unavailable", "N/A") uses `--jam-alert-text` (`.c-alert`); red FILLS (power keys, alert chips with ink text)
  stay `--jam-red`. No opacity-dimmed text: use `--dim` (`.unavail` = `--dim` text, not opacity).
- Touch targets (0.3.9): every control's hit area is >= 44x44 on touch without changing its look. `.key`, `.track`,
  `button.chip` and `.hit` (asButton adds it) get an invisible centred `::after` of max(100%, 44px) each way; the element
  must not clip its own overflow (clamped titles use `clampTitle()`: div.title > span.tl, the span clamps). A tappable
  chip draws its face as a clipped `::before` (`--chip-bg`) so the button itself is unclipped. Stacked targets with < 44px
  between their centres share the overlap (the later one wins); every control's centre still hits itself.
- Look packs (R6): a look's own CSS lives in its pack (`src/looks/<id>.js`, `registerLook({id, css, fonts, motifs})`), never
  in a card. Every shadow root adopts shared constructable stylesheets `[BASE_CSS, its own css, the active pack's css]` (one
  parse per page; the pack last, so it wins at equal specificity; a `<style data-jam-style>` where adoptedStyleSheets is
  missing). Packs skin only the stable hooks: `.host .paper[data-cut] .face .key .chip .disp .label .kick .title .rule
  .stripe .tmk .track .strip .fill .pw .band .arm`, `:host([data-look])` / `:host([data-fx])`, `.pop[data-look]` /
  `.pop[data-fx]` (openSheet) and `.ov[data-look]` / `.ov[data-fx]` (screensaver layer); renaming one is a breaking change.
  Effects only under `data-fx`. A look switch (new `hass.themes`) re-adopts the pack on every card, open sheet and the
  screensaver layer without a reload. Poster has no pack and embeds its fonts; a pack's fonts are woff2 files in
  `<asset base>fonts/` (HACS `dist/fonts/`, SIL OFL / Apache with their licence next to them), declared once as URL
  `@font-face` in the one `<style data-jam-fonts>`: only the active look's files download, a missing file leaves the look's
  fallback stack, never a request to Google Fonts. Text measured in JS (jam-kiosk) re-measures on `document.fonts`
  `loadingdone` (`_fontsLoaded`).
- Long-running kiosks (0.3.8): a card re-renders only when one of its own `watched()` state objects changed (compared by
  reference, HA replaces changed states); timers, observers, window/document listeners, subscriptions and sheets are
  released in `disconnectedCallback` and re-armed in `connectedCallback` (HA detaches cards on view switches).
  preview/checks/97-robust.js enforces both.
- No dependencies, no build step, everything in `jam-cards.js` (shipped as `dist/jam-cards.js`; only a look's font files sit
  next to it in `dist/fonts/`). Keep each card lean: no feature nobody configured.

## State grammar (every look; jam-home look audit 2026-11-03)
One grammar for on / off / attention / offline, drawn by each look in its own way (its pack skins the hooks below).
- **On** = the strongest fill the look owns; **off** = quiet (the face, `--slab2` keys, `--dim` text).
- **Locks are never "on"** (`ON_STATES` has no "unlocked"). `tone()`: a lock (or a `binary_sensor` of device_class lock)
  that is unlocked / open / jammed = **alert**; locked = off (quiet); locking / unlocking / opening = calm. Core helpers
  `isLock(s)`, `lockAlert(s)`. Every card that shows a lock follows it: jam-tile (alert stripe + value, the Lock key in the
  alert fill), jam-heading / jam-list / jam-hero (tone), jam-alerts (alert text on the row), jam-house (red "Door unlocked ·
  lock" chip, plain "Door locked"), jam-kiosk lock button (locked = a quiet 4px `--fg` ring on no fill, glyph `--fg`;
  unlocked = the solid `--red` disc: the loudest thing on the poster), jam-kiosk `dock_state: fill` (a lock block fills red).
- **Trouble sensors** (review 2026-11-04): a binary_sensor whose device_class is problem, moisture, smoke, gas,
  carbon_monoxide, safety, tamper, battery, heat or cold (`JamCards.ALERT_CLASSES`) is **alert** while on, never the lit
  "on" of a lamp, in every card (a jam-kiosk `dock_state: fill` block with such a state fills in the alert red).
- **One date line on the kiosk screens**: jam-kiosk and jam-screensaver both write `jamDateText()` ("Wednesday · October
  28" in the HA language).
- **Offline**: an entity HA cannot reach (state `unavailable`, or missing) reads **"Offline"** (`JamCards.OFFLINE`; also
  `fmtState()`), never "N/A" / "Unavailable" / "unavailable", and takes a **broken form, never the off form**: the hook is
  `.face.unavail` (card / key faces: jam-light, jam-tile, jam-button, jam-fan, jam-media, jam-speaker compact), `.scene.offline`,
  the hollow row mark `.tmk.t-offline` (jam-list, jam-panel, jam-alerts) and the dashed chip / disc (jam-house "Door
  offline", jam-kiosk lock "FRONT DOOR · OFFLINE"). Poster: a hole in the poster (no fill, the ground shows) behind a 3px
  dashed `--dim` edge. Braun: no panel, no elevation, a dashed hairline. Olympia: the face stays, its top stripe is the
  orange hatch, dim text. Transit: the sign stays, "out of service" (dashed grey edges and sign rule). Grid: the white
  square with a dashed hairline. Pulsar: no fill, a dashed 1px rule. New Wave: a 45deg pixel hatch of the plane, no tint.
  "unknown" stays dim only (a scene never run, a button never pressed are "unknown").
- **Small type floor**: every label >= 12px, chips >= 13px (the site's Poster size inside `max(12px, …)`), in every look;
  scene keys >= 44px tall, graph legend hits 44px. Kiosk screens keep their 18px floor.
- **Opt-in attention** (default off, so live dashboards keep their look): jam-kiosk `dock_state: fill` / `attention` /
  `now_band` / `sheet_heading: false`, jam-screensaver `lock_entity` + `alerts`, jam-house `attention`, `size: kiosk` on
  jam-light / jam-scenes / jam-fan, jam-speaker `compact_idle` (README options). An attention surface is invisible while
  all is well and the loudest thing on screen while not (alert fill, ink text, display type).
  Release 0.10 review: `dock_state: fill` must read on vs off at a glance in every look (99-audit checks the on block's
  face against the off block's): Grid fills on with `--fg` (inverted text), Pulsar keeps outlines (off 1px line, on 2px
  `--fg` + `--fg` state), Transit light keeps the sign grey state on off blocks, Olympia's outlined "none" blocks use
  `--dim`. jam-house `attention`: while the strip carries the lock, the chip row leaves out its door chip.
- **Pack contract (state hooks, always set, no visual change in Poster by themselves)**: every jam-kiosk dock block
  carries `data-state="on|off|action"` (on = one of its entities on / playing: count_on > 0 or the state entity's tone
  "on"; action = a `tap: action` block; off otherwise) plus `data-alert="true"` on a lock block that is unlocked / open /
  jammed, whatever `dock_state` is (`dock_state: fill` only adds core's own skin: `.k.dfill .blk.on / .out / .alert`).
  Card hosts of jam-light, jam-button, jam-tile and jam-fan carry `data-state="on|off|offline"` (core `jamState()`,
  written only when it changes); a pack styles them with `:host([data-state=offline])` etc. New on/off cards should set
  it the same way.
- Checks: preview/checks/99-audit.js (grammar, floor, look bugs, opt-ins + shots in preview/shots/optin/), the kiosk lock
  in 88-kiosk-lock.js, text over motif shapes on every screensaver layout in preview/fit.js.

## Hi-Fi rules (theme "Hi-Fi"; Jam Design pass 6 + 7, `jam-design/mockups/pass7/home-assistant.html`, HANDOFF.md 2026-11-06)
The calm-instrument look Isaac approved ("This design looks much better!"; "Try to replicate their cards as faithfully as you
can"); until 0.11 "Jam Calm" (below, "Calm" = Hi-Fi). Calm, ordered, few things per screen; "all fine" looks like nothing.
- **The skin (1.0.0)**, for every card Hi-Fi does not draw: labels (`.label`) IBM Plex Mono 500 12px uppercase .14em `--dim`;
  display words Jost 500 mixed case (no tracking), numerals Jost 300 / 400; keys (`.key > .face`) the house key (slab2, 1px
  hairline, 12px corners, Jost 500 15px), **on = pressed paper** (slab3 + ink edge, ink text), never a room-colour fill;
  alert keys solid red with dark text; disabled keys dashed; chips are 999px pills in Plex Mono; strips (`.track .strip
  .fill`) are the fader's groove with a rounded fill in the card's colour; tone stripes and accent rules turn into hairlines
  (`.s-alert` keeps red); tone marks are 8px dots; offline faces are a dashed outline. The default card accent is the ink
  (`--fg`, text `--slab`): a card shows a colour only where its config asks for one (`accent`) or the data has one. Card
  specific: jam-media art in its own colours (no duotone), the empty art = a dot grille; jam-remote's d-pad is one round pad
  with flat arrows and the orange OK (as Hi-Fi's own remote); jam-weather's forecast today = the pressed key, its glyphs are
  line drawings; jam-gauge = a thin arc instrument (motif `gauge`); jam-hero chips = keys (a `tone` still fills); the
  screensaver = a night clock (Jost 300, the date, the weather words in `--ink-dim`, Plex Mono kicker), no shapes (motif
  `screensaver` = none), the photos time chip a hairline panel. Motifs: `empty` / `idleArt` = the dot grille, `flash` = none,
  `wxGlyph` = line glyphs, `gauge` = the arc, `powerGlyph` = the 2px power symbol, `screensaver` = none.
- **Whole-card layouts.** Hi-Fi draws cards in layouts of its own: the `render` look hook (core,
  `defineMotif("render")`, the base motif = false) lets `src/looks/hifi.js` draw jam-light, jam-tile / jam-button on an on / off
  entity, jam-button action cards, jam-fan, jam-scenes, jam-house, jam-heading, jam-tv, jam-speaker, jam-media (the PC row)
  and jam-kiosk exactly as the mockup does; every other card renders as usual under the pack CSS. Calm's DOM classes carry a
  `c-` prefix (the cards' own sheets stay adopted next to the pack). The card objects keep their state, calls and
  pop-up plumbing; Hi-Fi only draws. A pop-up or subscription it opens for a card is registered with core `lookHold(card, fn)`
  and released when the card disconnects (97-robust). `preview/checks/99-hifi*.js`, preview/fit.js and jam-home's
  preview/shoot.js check the drawings.
- **Tokens** (`tokens/looks/hifi.mjs`): Callsheet paper / navy as drawn in the Jam Home mockup: ground #efebe2 / #10141d
  (`jam-ground`), panel #f9f7f2 / #161c28, keys #f1ece2 / #1d2433, pressed #e3dbcb / #0a0e15, hairline #d6cfbf / #2a3244,
  inner rule #e7e1d4 / #1c2230, ink #19202e / #ece5d3, dim #5b606d / #a29d8f; orange #ec7c22 / #f08a2c = the one action;
  alert #ff5a48 (text #b3261b / #ff8a7a); ok #7bd651, lit power symbol #3c8a28 / #7bd651; walnut #6b4428 (the kiosk rule).
  Optional registry tokens of the calm parts: jam-ground, jam-hair, jam-groove, jam-cap, jam-win(-off, -rim),
  jam-readout(-off), jam-dot, jam-ok, jam-warn(-text), jam-switch-off / -thumb / -rim and the four switch kinds.
- **Type**: Jost 500 for words (17px card names, 26px room, 21px media titles), Jost 300 for big numerals (40px inside
  temperature, the 200 / 150px kiosk clock), IBM Plex Mono 500 12px tracked .12-.16em for state words and labels (15px on
  kiosks). IBM Plex Mono = IBM's own Latin1 woff2 files, unmodified (the OFL reserves "Plex" for modified versions).
- **Surfaces**: cards are panels with a 1px hairline and 16px corners, keys 12px, sheets 22px, pills 999px; no shadows,
  bevels, glow or gradients. The remote (round 5) is the one drawn object, kept on purpose.
- **Lights**: name row (lamp drawing whose shade takes the lamp's colour, name, state word, ›) over the rocker (branch
  paddle-off: I / O, mirrored pressed halves, a thin lamp-colour band) or, with `switch: toggle`, POWER + the small switch,
  beside a vertical fader in the lamp's colour. Lamp colours are pulled towards cream until they stand >= .15 (OKLab) from
  the control orange; whites use the mockup's white swatches. Offline = a dashed hollow card, "Can't be reached since …".
- **Faders**: flat groove + hairline, fill in the lamp's colour (cream for volume), flat cap with a 1.5px ink rim; the number
  shows on the cap while dragging (always on kiosks). Drag anywhere (the cap jumps to the finger), keys ±5 / Page ±10 /
  Home / End. The value shows at once; the entity follows at most every 300 ms while dragging and once more on release;
  keys send one call 250 ms after a burst; a state update never redraws a card under the finger (it waits for the release).
- **Small switch** (core `jamSwitch`, `.jsw`): pill channel, plain dark off; on, the thumb slides and the kind's accent is
  revealed (plug blue, climate teal, automation violet, setting steel; `accent` overrides); 180 ms on the settle curve,
  instant with JamCards.motion = false or reduced motion; disabled = hollow, offline = dashed with a dash.
- **One orange per screen**: Pause where something plays (a card is drawn as if alone on its screen), the Lock key by day
  while someone is home (amber ▲ "Unlocked"); after dark or with nobody home the door is alert: red word and the solid red
  key, no orange. The kiosk gives the door's key precedence over a dock Pause.
- **Kiosk**: walnut rule, room label, the door (word + round window), the clock, the date, one weather line, three keys
  (glyph, name, word; a Pause key while playing). Sheets cover the screen (eyebrow, title, Close ×) and never scroll: a
  block's `rows` lays its cards out; jam-tv / jam-speaker `size: kiosk` are two-column sheets of their own. Pop-ups are
  centred (light: two columns; remote: 600px). A pack never puts `container-type` (or a transform / contain) on a bare `:host`: the pack is
  adopted on the body-attached sheet holder too, and Safari / WKWebView <= 18 turns a query container into the containing
  block of the fixed pop-up (0.11.0-calm.2: every pop-up opened below the iPad's screen); openSheet pins the holder's
  containment / transform properties inline since then, `preview/checks/99-hifi-popups.js` guards it. A kiosk remote fits its pop-up (0.11.0-calm.3): on a kiosk-wide screen
  (> 600px) too short for the drawn remote (the Echo's 601px), the pop-up turns compact (44px keys, a 156px d-pad, tighter
  rows) and, still too short, zooms the remote. Every other remote (desktop, phone, a kiosk card at phone width) is the
  mockup's full-size remote and its body scrolls when the window is short (0.11.0-calm.4: never squished).
  Dock sheets lay out any block (0.11.0-calm.4, the live dashboards): `rows` as designed for the kiosks, each row at least
  its content (minmax(min-content, 1fr)); without rows the block's `columns` as jam-kiosk does, a block of kiosk player
  cards in one column with the first taking the height left; at phone width (<= 600px) one column of natural-height cards;
  the body scrolls rather than clip. The rocker keeps the mockup's paddle on wide cards (<= 150px, kiosk <= 190px) with
  the fader beside it; the purifier's readout finds sensor.<fan>_pm2_5 without extra_sensor, and is left out with no number. Pop-ups keep the page's scroll position (every look): the lock is overflow
  hidden on <html> only, and the page's and the opener's scrolled ancestors' positions are written back after open and close. The kiosk measures HA's view padding and keeps the mockup's 44 / 40px insets.
- **Remote while the TV is off** (every look, 2026-11-06): jam-tv's off card keeps Remote (and Source); the remote's power key
  turns the TV on.

## Token reference
Source of truth: `tokens/` (node only, not bundled). `tokens/registry.mjs` lists every token (short name in the cards,
scope: per mode or theme-wide, optional or not); `tokens/looks/hifi.mjs` holds the Hi-Fi values; `tokens/ha.mjs`
derives Home Assistant's own keys from a palette. Generated from it: the BASE_CSS `:host` declarations (`TOKEN_CSS`:
`--ink: var(--jam-ink, <Poster dark>)` ..., so the cards fall back to Poster dark), `JAM_TOKENS` (= `JamCards.TOKENS`, the
copy list of openSheet / jam-screensaver), `preview/looks.css` (`node tools/bundle.mjs`) and
`../jam-theme/themes/jamboard.yaml` (`node tools/themes.mjs`; `bundle --check` fails while any of them is stale). Edit the
source, never the outputs. Inside a card use the short names (`var(--band)`); the `--jam-*` names are for themes.

Colour (theme sets both modes; the cards fall back to the dark column):
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
| living room hue (optional; alias `living`) | `--jam-living` | = ochre | = ochre |
| accent teal (also calm/info) | `--jam-teal` | #22a39a | #22a39a |
| accent blue | `--jam-blue` | #4a7be0 | #4a7be0 |
| accent pink | `--jam-pink` | #e2658f | #d24f7c |
| accent violet | `--jam-violet` | #9b6dd6 | #9b6dd6 |
| accent green | `--jam-green` | #86a83a | #6d8f22 |
| alert (reserved) | `--jam-red` | #e0553b | #e0553b |
| alert TEXT (0.3.9) | `--jam-alert-text` | #ff8a6e | #a12a14 |
| (unused since v0.3, kept for themes) | `--jam-shadow` | #0a0908 | #c9bb98 |
| series 1-5 | `--jam-s1`..`--jam-s5` | #bd8000 #1f9fb0 #d43a1c #a66cc4 #7f9b2a | #a86e00 #00879c #c2361a #8a52ad #5f7d1c |
| text / muted on ink (R1: ink accent text, screensaver, kiosk light-mode lock glyph + dock) | `--jam-ink-fg`, `--jam-ink-dim` | #ece2c9, #9a8f7c | same |
| muted on ink at kiosk size (jam-kiosk light-mode dock state) | `--jam-ink-dim2` | #b4a88f | same |
| fixed band (jam-tv poster band + On now stamp, jam-speaker band + K1 shelf, music dock, error strip) | `--jam-band`, `--jam-band-fg`, `--jam-band-dim` | #141210, #ece2c9, #9a8f7c | same |
| key face / disabled glyph / cover tile on a band | `--jam-band-key`, `--jam-band-off`, `--jam-band-tile` | #36312b, #6b6152, #2c2824 | same |
| label plate (jam-light contrast fallback, WLED preset names) | `--jam-plate`, `--jam-plate-fg` | #141210, #ece2c9 | same |
| focus ring (optional) | `--jam-focus` | the ochre token | same |

Type and identity (theme top level, both modes): `--jam-display` (Londrina Solid stack), `--jam-body` (Jost stack),
`--jam-look` (`poster`; R1), and the R3 role tokens below. Roles: **display** = titles, values and big numerals (`.disp` and
every display-font site), **label** = small tracked labels (`.label`, kickers, tile names, legends, kiosk dock states),
**key** = text on keys, chips and tabs. Poster sizes and tracking differ per site, so sizes and tracking are factors on
each site's own Poster value ("-scale" tokens: 1 = Poster), and `--jam-display-track` replaces the per-site value only
when a look sets it. Inside a card use the short names (`font-weight: var(--disp-w)`, `font-size: calc(1.7rem *
var(--disp-scale))`, `letter-spacing: calc(.14em * var(--lbl-track))`, `text-transform: var(--key-case)`).
| var (short name) | sets | Poster |
|---|---|---|
| `--jam-display-weight` (`--disp-w`), `--jam-display-case` (`--disp-case`) | weight / text-transform of display type | 900, uppercase |
| `--jam-display-scale` (`--disp-scale`) | factor on every display font-size (width correction against Londrina: Archivo about .85) | 1 |
| `--jam-display-lead` (`--disp-lead`) | factor on every display line-height (raise it for descenders in mixed case) | 1 |
| `--jam-display-track` (optional, no short name) | one letter-spacing for every display site | unset: each site's own (-.01em to .02em) |
| `--jam-num-font` (`--num-font`), `--jam-num-scale` (`--num-scale`) (optional) | font and size factor of big numerals: clocks, temperatures, gauge / graph / slider / volume values, percentages | the display font, `--jam-display-scale` |
| `--jam-label-weight` (`--lbl-w`), `--jam-label-case` (`--lbl-case`), `--jam-label-track-scale` (`--lbl-track`) | labels | 600, uppercase, 1 (sites .04em-.2em) |
| `--jam-key-weight` (`--key-w`), `--jam-key-case` (`--key-case`), `--jam-key-track-scale` (`--key-track`) | keys, chips, tabs | 600, uppercase, 1 (sites .04em-.16em) |
Left as literals on purpose: body text (500 / 400), units (`.unit`, unit `small`s keep their case and tracking), sentence
lines (jam-kiosk facts line, jam-tv poster sub), digit counters (jam-speaker progress), the two `+` glyph keys in
`900 var(--body)`, and `letter-spacing: 0` resets. Kiosk display sizes at the 18px floor keep it under a smaller scale
(`max(18px, calc(18px * var(--disp-scale)))`: jam-speaker shelf names, jam-tv narrow source tiles); jam-kiosk's date line
is one line and cuts with an ellipsis when a wider face does not fit. The harness-only **stress look**
(`tokens/looks/stress.mjs`: mixed case, Archivo stack falling back to a system sans, weight 700, display scale .85, leading
1.12, tracking .4; preview `?look=stress`) proves this: preview/fit.js runs the preview page, jam-kiosk home, the kiosk
Music / TV sheets and the 6 screensaver layouts under Poster and under the look, and the look may add no overflow, spill,
sub-18px kiosk text or scroll.

Shape (R2; theme top level, all optional: unset = the Poster geometry written at each use, so the JamBoard theme sets none):
| var | shapes | Poster fallback |
|---|---|---|
| `--jam-shape-card` | `.paper[data-cut=card]` faces; jam-light pop-up brightness bar / hue strip / white editor; screensaver bars + photos now label | br 14px (hue strip 12px, screensaver bars 3vh) |
| `--jam-shape-key`, `-chip`, `-hero`, `-sheet`, `-poster` | `.paper[data-cut=<kind>]` faces; `-chip` also `.chip` / `button.chip::before` and the screensaver time chip (10px) | the CUTS table below |
| `--jam-shape-pw` | power corner triangle (POWER_CSS, jam-tv 44px corner) | `polygon(0 0,100% 0,100% 100%)` |
| `--jam-shape-strip-end` | accent fill of strips (`.fill`; jam-light brightness / bands / white bars) | straight end with an 8px diagonal (jam-light 14 / 10 / 9px) |
| `--jam-shape-tab`, `-scene`, `-icon`, `-pin`, `-plate` | jam-tabs tab (tr 8px), jam-scenes key (br 10px), jam-button icon square (30% corner), music pin tab (triangle), jam-light label plate (12px diagonal end) | as listed |
| `--jam-shape-key-plate`, `-chip-plate` | jam-remote outlined key: inner plate, cut parallel to the key / chip cut | tr 10.2px / br 4.2px |
| `--jam-radius-<kind>` (card key chip hero sheet poster) | border-radius of those faces (for a look whose shape is `none`) | 0 |
| `--jam-pad-<kind>` (card key chip hero sheet poster; R3) | least inner padding of those faces, each side: `max(<the card's own --p-*>, token)` (a face with an explicit `padding:0`, e.g. art and glyph faces, stays 0) | 0px (unset) |
A value must be a valid `clip-path` (polygon, `inset(... round ...)`, `circle()`, `none`): an invalid one leaves the element
unclipped. preview/shoot.js checks that every paper's computed clip equals its kind token; 96-looks reshapes the kinds live.

Colour maths and lines (R4; theme top level unless noted):
| var (short name) | sets | Poster |
|---|---|---|
| `--jam-on-fg`, `--jam-ink-fg` (palette, above) | also the dark / light text of every flat-colour decision (`textColors()`): jam-light face text, label plates and power-corner glyphs, jam-button corners, the jam-speaker K1 panel (art colour or the look's violet) | #141210, #ece2c9 |
| `--jam-art-1` .. `--jam-art-8` (per mode, optional) | the cut-paper idle art colours (covers without an image) | ink, ink-fg, ochre, teal, blue, pink, violet, green |
| `--jam-border` (optional) | border of card and sheet faces (`:where(.face)`, so `.stripe`, key borders and a card's border-left still win), e.g. `1px solid var(--jam-line)` | none |
| `--jam-rule-h` (`--rule-h`) | accent rule under titles (jam-heading, sheets, jam-popup) | 5px |
| `--jam-stripe-w` (`--stripe-w`) | left tone stripe (`.stripe`, jam-remote groups, the error strip) | 6px |
Look-neutral, left as they are: `shade()` (HSL lightness of the face itself), jam-tv's unused `_artTone` luminance test.

Motion (R5; theme top level):
| var (short name) | sets | Poster |
|---|---|---|
| `--jam-dur` (`--dur`) | factor on every animation duration (the 40 ms stagger steps and the photo crossfade stay) | 1 |
| `--jam-press-from` (`--press-from`), `--jam-press` (`--press`) | transform when a key goes down / at the end of the press (`jam-print`; jam-tabs and jam-scenes use `--press-from`) | `translate(2px,2px)`, `translate(3px,3px) scale(.96)` |
| `--jam-ease-2`, `-3`, `-4` (optional) | timing function of the 2- / 3- / 4-step motions (press, wash out, screensaver text / wash in, stamps, screensaver shapes / entrance, stagger, sheet opening); e.g. `cubic-bezier(.2,.8,.2,1)` or a spring `linear(...)` | `steps(n,end)` (jam-popup sheet `steps(4,start)`) |
| `--jam-kf-<name>` (optional): `enter print uncover retreat stamp shake sheet flash ss-cut ss-pop` | animation-name per motion, for a look pack's own `@keyframes` | the Poster keyframes (`jam-enter` ...; `sheet` = `jam-sheet-up` / jam-popup `jam-wipe`, `flash` = the spiral flash) |
Left literal: `steps(1,end)` hard cuts (spiral flash = visibility, shake) and the stagger delays (set in ms by JS).

Effects (R6; theme top level, optional):
| var | sets | Poster |
|---|---|---|
| `--jam-fx` | 0 / 1: with 1, cards, openSheet's `.pop` and the jam-screensaver overlay carry `data-fx`, so a look pack's effects (gradients, translucency, scanlines) apply; a card's `fx: false` sets `--jam-fx: 0` on its own host (its sheets and screensaver layer copy it) | unset (0) |

Elevation (Braun; per mode, optional):
| var | sets | Poster |
|---|---|---|
| `--jam-elev-1` | box-shadow of card, hero and sheet faces, applied by a look pack (only with a shape of `none`: clip-path clips shadows) | unset (none) |

Runtime tokens (not in a theme, copied onto body layers): `--jam-accent` (jam-popup hands its accent to its children),
`--jam-spotify` (jam-speaker source dot); `--jam-motion` (0 = motion off, set on `<html>` by `JamCards.motion`) and
`--jam-stamp-from` are local.

Series palette validated with the dataviz validator (both modes, all checks PASS); unchanged in v0.3. Order fixed, never
cycled; a 6th series is not allowed (fold into fewer series). Status colours are never series colours in the same card.
State tones (`tone()`): on = the card accent, alert = red, calm = teal, off = line/dim.

## The cards' own layouts (Poster-era mechanics, kept as the base under the Hi-Fi skin)
The sections below describe the machinery the cards' own DOM is built with since v0.3 (accent system, edge system, power
corner, paddle, motion, motifs). It stays in the code: it is what the Hi-Fi skin styles on the cards Hi-Fi does not draw,
and the fallback when a Hi-Fi drawing throws. Under Hi-Fi the shape tokens are `none` (soft corners from `--jam-radius-*`),
the type and motion tokens are Hi-Fi's (Jost / Plex Mono; the settle curve, `calm-*` keyframes), and the motifs are the
Hi-Fi pack's (see "Hi-Fi rules"); Poster values named below are the fallbacks written at each use, not what renders.

## Colour system (accent)
- Every card accepts `accent:` — a hue: `ochre`, `teal`, `blue`, `pink`, `violet`, `green`, `red`; or a room alias:
  `living`→`--living` (theme `jam-living`, default the ochre token; audit 2026-11-03), `kitchen`→teal, `master`→blue, `marissa`→pink, `music`→violet, `nerd`→green, `alert`→red.
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
  `.paper` with `data-cut=kind`, face `.face` clipped by `--clip`. Since R2 `--clip` comes from CSS, not an inline style:
  `SHAPE_CSS` in BASE_CSS sets `.paper[data-cut=<kind>]{--clip:var(--jam-shape-<kind>, <the CUTS polygon>);
  --rad:var(--jam-radius-<kind>, 0px)}` (the face's border-radius), so a look reshapes every surface of a kind. `cutKey(label, key, cls, kind = "key")` → a
  real `<button>` on it. The `key` argument and the v0.2 options (edges/depth/step/cut) are accepted and ignored.
- Face padding is at least the cut size, so content never enters the cut.
- Strips (slider, light brightness, media volume, gauge bar): 32px touch track, 22px `--slab2` strip, accent fill whose
  end is straight with an 8px diagonal (`polygon(0 0,100% 0,calc(100% - 8px) 100%,0 100%)`).
- Chips in jam-heading / jam-hero: flat blocks (no border) with the chip cut. jam-heading chips (0.3.9): 32px tall, value in
  `--fg` after an 8px tone mark.
- Exceptions with their own straight shapes: jam-remote d-pad arms (5-point arrow with a 45° point, `data-cut=arrow`) and
  the OK disc (`circle()`, `data-cut=disc`), set as an inline `--clip` (geometry, not a look's shape); the jam-button icon
  square (30% corner cut, `--jam-shape-icon`).
- Press feedback (buttons, tiles, keys, light cards): the face "prints" — `jam-print`, 2 steps to `translate(3px,3px) scale(.96)`
  on pointerdown, snaps back on release (0.3.5). Motion off: a hard cut to that state; reduced motion: none.
- Legacy: `seed`, `rng`, `tornPath` stay exported for compatibility; no card uses `tornPath` any more.

## Power corner (round 3, ROUND3 "Interaction rule")
- On/off cards (jam-light, jam-button with a light / switch / fan / input_boolean, jam-fan; jam-tv / jam-speaker keep their
  own): the top-right **46px triangle** (`powerCorner()` + `POWER_CSS` in core, a real `<button class="pw" data-key="power">`,
  `aria-label "<name> power"`, `aria-pressed`) = power toggle with a flat power glyph (17px, stroke 3). Tap anywhere else =
  the card's panel: jam-light = its pop-up, jam-button / jam-fan = HA more-info (they have no pop-up of their own).
  Keyboard on the focused card: Enter = panel, P or Shift+Enter = power.
- Corner colour = a shade of the face, never the page ground: `shade(rgb, 1)` (same hue, HSL lightness −.24 on light faces /
  +.24 on dark ones, saturation ×.85; `shade(rgb, 2)` = ±.36 = the deep shade) for coloured faces (an accent face is
  resolved to rgb with `resolveRgb()` once the card is attached); slab faces use `--slab2` (the theme's own step). Glyph =
  ink or cream, whichever contrasts more with the corner (`cornerColors()`); on slab faces the glyph is the accent when
  on, `--fg` when off, `--dim` when unavailable (disabled).
- A jam-button with a power corner takes the `card` cut (bottom-right 14px) so its key cut does not clip the triangle.

## Paddle (jam-light `switch: paddle`, opt-in, 2026-11-06; Jam Design pass 7, then Isaac: "I prefer the binary on off symbols to the words", "It should just look like it's rocking between on and off")
The calm-look light switch, opt-in per card so every existing config keeps the power corner. The paddle replaces the
corner with **one rocker** in two positions: a real `<button class="paddle" data-key="power" aria-pressed>` on the right of
the card (64px wide, 8px in, 18px symbols; `size: kiosk` 96px, 12px in, 34px symbols with a ~4.5px stroke for 3 m). Its
halves carry the IEC 60417 symbols drawn as SVG (24-unit viewBox, flat ends, `--fg` on both halves in every state): a
bar (5007) on top, a circle (5008) below. **ON = the top (I) half pressed in, OFF = the bottom (O) half pressed in**: the
same object flipped, mirror images of each other. No visible words on the paddle; the words stay for assistive tech and
hover (`aria-label "<name> power, On|Off|Offline"`, `title` On / Off / Offline) and on the card (the number slot says "Off"
or "Offline"). The face stays the plain panel: no colour flood, wash, label plates or member bands (the sub line says "2 of
3 on"); the brightness number and strip stay while on. Root classes `pon` / `poff` (not `on` / `off`, so no pack's lit-face
rule applies) and `data-pd="day|night"`; the host keeps `data-state`.
Flat tones only (no gradients, blur or shadows), worked out per look and mode by `_paddle()`: base = the card face
(`--slab`), lift = `--fg` mixed into it (sRGB) until it stands >= 3.2:1 off the face, the least mix that does.
| Part | Light mode | Dark mode |
|---|---|---|
| Pressed half (flatter, darker) | lift | base |
| Raised half (catches light) | base | lift |
| Shading edge: the raised half's pivot side, 3px (kiosk 4px) | halfway between the two | same |
| Rim 1.5px + split hairline | lift | lift |
| Lamp colour | only while on: a 3px band (kiosk 5px) along the pressed I half's outer edge | same |
| Offline | the same rocker, nothing pressed, transparent halves, dashed `--dim` rim and split, `--dim` symbols, disabled | same |
The two halves are >= 3:1 apart, so which half is pressed reads from across the room; the symbols are >= 3:1 on either
half. Motion: a real on/off change rocks the paddle once (`jam-pd-rock-on|off`: rotateX towards the new pressed half and back
to flat, transform only, `calc(150ms * var(--dur))`, `--jam-ease-3`; `oneShot`), none with `prefers-reduced-motion` or
`JamCards.motion = false`. Radius = `--jam-radius-poster` (Poster: square). Check: preview/checks/96-paddle.js.

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
| Scene / source selected | jam-scenes, jam-tv Source sheet tiles, jam-speaker Join → Playing toggle: the newly active key gets `.jam-stamp` (scale 1.08 → 1, 3 steps, 210 ms) and its accent fill wipes in (a slab2 `::before` cover retreats, `--jam-stamp-from`) |
| Pop-up / sheet | stepped slide/wipe + Vertigo spiral flash (unchanged); then the body's children slide in (`jam-in`, 160 ms, 60 ms + 40 ms × index) — jam-popup on every open, openSheet once (refills do not replay) |
| Failed action (0.7.2) | the tapped node of a rejected `runAction` call gets `.jam-shake` (translateX −6 / +6 / −3 px, hard cuts, 180 ms), once; motion off = none. The message itself is a flat strip (`actionError()`: ink, 6px red left rule, cream text; headline "Couldn't start <name>" + HA's message without a "valid options are: …" list, one line each with an ellipsis, full text in title / aria-label) pinned over the bottom of the sheet face or card `.host`, out of flow, gone after 6 s or on tap. The shared path calls HA with notifyOnError = false, so HA's own toast does not show the raw error. Every direct service call in the cards goes through `jamCall(node, hass, domain, service, data, verb?, head?)` too (node = the tapped control, or the card: then the control pressed in it in the last 2 s) |
| Screensaver | its own per-minute layout cut (unchanged, not affected by `JamCards.motion`) |
| Screensaver photos (0.4.1) | **the one exception to the stepped-cut rule, at the user's request, photos only:** the next photo crossfades over the current one (opacity only, `ease-in-out`, `images.fade` ms, default 900, 0 = cut) after `img.decode()`; max 2 `<img>`, the old one removed after the fade; poster ↔ photos fades the whole slides layer. Reduced motion = instant cut |
Off switches: `prefers-reduced-motion: reduce` (CSS `animation:none` on everything incl. pseudo-elements, and `motionOn()`
is false); `JamCards.motion = false` (an accessor on the frozen API; sets `--jam-motion: 0` on `<html>` so the print is a hard
cut, and the JS skips entrance / wash / stamp / stagger / sheet opening motion). jam-screensaver `motion: false` sets it while the
card is on screen (for a kiosk that cannot cope; default on everywhere).
Motion tokens (R5, see "Token reference"): the table above is Poster's timing. Every `animation` reads its name from
`--jam-kf-<name>`, its duration as `calc(<Poster ms> * var(--dur))` and its timing from `--jam-ease-<steps>`, each with
the Poster value as the fallback; the press transforms are `--press-from` / `--press`. Both off switches above stay
absolute for every look (the reduced-motion rule is `!important`, and the JS gates do not read tokens). The rules
"stepped" and "<= 300 ms" are Poster rules (95-motion checks them on the Poster styles); one-shot, no loops and the off
switches are universal.

## Motifs (use sparingly; one per card max)
Every motif is drawn through the motif registry (R7): `JamCards.motif(name, ctx, ...args)` returns the active look pack's
version (`ctx` = the card, a node in it, a sheet's `.pop` or a look id; the look is the nearest `data-look`), else Poster's
(`defineMotif`). Names: `empty` (Golden Arm bars), `idleArt`, `flash` (Vertigo spiral), `wxGlyph` (jam-weather glyph SVG),
`remoteGlyph` (jam-remote / jam-tv glyph markup, static), `powerGlyph` (power corner), `screensaver` (the poster
composition's shapes).
**Look hooks** (R10, core.js "look hooks"; one mechanism for everything a pack does beyond its CSS): more motifs whose
Poster version is a no-op, so under Poster nothing is drawn, marked or written, and a look switch that changes a hook
re-renders the cards that use it. Content hooks, asked by a card where a look may draw a part itself (Poster: null, the
card keeps its own drawing): `code` (name -> a small aria-hidden mark: jam-heading title, jam-button icon square,
jam-kiosk dock blocks; jam-kiosk rebuilds its shell when the look's `code` changes; Pulsar), `gauge` (level 0..1 | null,
band -> the whole jam-gauge meter; Pulsar), `graph` (svg, data, geometry -> draws jam-graph's series and returns one y
scale per series for the crosshair marks; Pulsar). Render hook `decorate` (`(body, card)`, run by `lookDecorate` after
every render of a card body: JamBase._render, jam-kiosk's `_render` and look switch; attributes and custom properties
only, never text; Transit's route letters). Root hook `decorateRoot` (`(root) -> cleanup | null`, run by
`lookDecorateRoot` for every shadow root jamStyle styles, after its sheets; the cleanup runs when the root is styled again
or for another look; Grid's cell numerals). Plain data for a pack's CSS, written for every look: `data-jam-seed` (0..11,
card host, from the entity; New Wave's confetti), `--lv` (level 0..1 next to every level fill's width; Pulsar's ridges),
`--jam-ss-day` (time of day 0..1 on the screensaver overlay; New Wave's light). A pack's motif runs with `this.poster` (the Poster function) so it can extend it; it returns fresh
aria-hidden nodes and never entity text. A look switch re-renders the cards whose motifs change, the open sheet's spiral,
jam-popup's spiral and the screensaver shapes. Poster's motifs:
- **Cut-paper idle art** (round 3, jam-speaker idle poster / thumbs without a cover): a flat Jam-palette ground (ink, cream,
  ochre, teal, blue, pink, violet, green; never red) with 2-3 shapes — disc, ring, bar, skewed strip, tilted square — sized in
  cqmin so it reads the same at any size. Seeded (jamMuIdleArt): a player's art is seeded by entity + last_changed, so it is
  stable while idle and new each time the player goes idle; a library item's thumb by its uri. No motion.
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
| jam-button | button (launchers, scenes, scripts, stereo keys) | big key: label + accent square with optional ha-icon, colour (`accent` or HA `color` names), accent face when entity on, tap/hold/double_tap actions, confirmation; round 3: light / switch / fan / input_boolean = power corner (toggle) + tap = more-info, card cut; `size: normal` = 96px (round 3; was 84), grid rows auto (= a jam-light card), `big` = 120px |
| jam-light (v3, round 3) | mushroom-light | card face = the light's hue at full value (`fullRgb`: rgb_color scaled so the max channel is 255, kelvin → rgb in color_temp mode, else the accent resolved to rgb); text ink or paper, whichever contrasts more (`textOn`), and when neither reaches 4.5:1 the name block and the % sit on ink label plates (12px diagonal right edge); 96px tall (grid rows auto); name 24px display, sub 10px, % 26px; 10px brightness strip: track = deep shade, fill = mid shade of the face; power corner in the mid shade (off: slab2). Group: face = average of the ON members, sub "K of N on" while only some are on, vertical member bands (one per member, off = slab2, shown while on; ink gaps: 3px on the block's left edge, 2px between bands, so a band whose colour equals the face still reads): `member_bands: full` (default, user's pick 2026-10-30) = full height of the right edge, 16px per bulb (min 46px, max 40 %), ink power corner with a cream glyph on top; `corner` = a 46px block under the power corner. Tap = pop-up (openSheet), drag = dim, corner = power: 72px brightness bar, whites or WLED preset cards, hue strip, "Your colours" (HA user data), group members (pills + bars in each member's full-value colour), off-timer; header **Edit** key: pencil on each white (name field + kelvin slider within the light's range, per user + per light in user data `jam_whites`), × on each saved colour (removes it from `jam_colors`), + hidden, Done leaves |
| jam-popup | bubble pop-up | opens on `location.hash == hash`, ink veil + cut sheet (slab face; children one surface step up), title, child `cards` (HA card helpers), accent handed to children as `--jam-accent`; close on veil/Esc/close/back |
| jam-remote | universal-remote-card | d-pad (cut arrows), OK disc, key rows (`layout: full` = the universal-remote-card set); keyboard key = text sheet (`text:` / DEL / ENTER); `remote.send_command` / `commands` / `actions`; `entity` optional when `actions` is set (keys without an action are disabled; NerveOS button/select remotes); `hide_title` (set automatically inside jam-tv / jam-media sheets); `sections` (0.3.4, round 3 look) = colour-coded groups (slab face, 6px left rule in the group accent, header = kicker + the group's power key: red, `power_accent` = accent; glyph keys with a label under the glyph, Play filled, transport 1 : 1.5 : 1; with `active_entity` the plain keys are an outlined choice, the active one filled); row token `rocker` = Vol − / Mute / Vol + as one flat block (key cut, 3px ink gaps); shared helpers for jam-tv: `JAM_GLYPHS` / `jamGlyph`, `jamRocker` + `JAM_ROCKER_CSS`, `JAM_OUTLINE_CSS` (outlined key: --ol face + an inner slab plate cut parallel to the corner) |
| jam-media (v2) | mediocre*, YAMP, media tile | art as a duotone block (image multiplied over a flat accent block: flat print, not a gradient), title, artist, transport, volume, sources, players, group; `compact` mini layout; `more` ⋯ sheet of child cards (jamCardSheet); title_entity players without a media_player; **`size: kiosk` (0.6.0)**: large square duotone art (poster cut) taking the height the text leaves, 18px name, 40-60px title, 20px sub line, 64px keys (transport, ⋯) |
| jam-tv | Android TV media cards | round 3 (docs/ROUND3.md "TV"): always Now playing (no tab switch). Poster (min 178px, `poster` cut: artwork cover or accent + Golden Arm bars) with the text on a solid ink band in both modes (cream: 13px kicker, 34px display title ≤ 2 lines, 13px time) and a 5px accent progress strip; power = 44px top-right triangle (ink, red when off). On: Prev / Play-Pause (accent, 1.5x) / Next glyph keys, one violet volume rocker (− \| Mute + speaker glyph \| +, vol repeat while held), outlined Remote and Source tabs with glyphs. Off / unavailable: "TV off" poster, a big red Turn on key, quick 3-up source tiles. Remote = sheet with a jam-remote: TV group (teal rule + OK + Play, red power; d-pad, Back / Home / Menu / Settings, Rewind / Play / Forward) + Stereo group (violet rule + power; rocker; inputs TV / Turntable / Music sync as an outlined choice, current filled), keyboard glyph key in the sheet header. Source = own openSheet: "Inputs" (`match.input` sources, 2-up) and "Apps" (3-up) 84px colour tiles (ink name, glyph by kind or `icon`), then a Home screen tile (remote HOME); the source on screen (0.3.5 live signals only: `current_app_entity` vs `match.app`, then `input_entity` vs `match.input` while the TV shows an input; 0.3.8 `exact`) gets a 4px --fg outline + an "On now" ink stamp and a one-shot stamp when it changes; the open sheet follows updates. **`size: kiosk` (0.6.0)**: controls at their own height (transport 64-80px, rocker 56-72px, tabs 56-64px by the card height), the poster takes the rest with the art ≥ 55 % of it (band: kicker + time on one 18px line, title 30-44px, 2 lines, 1 on short cards); off: poster 38 %, Turn on / tiles fill the rest (≥ 64px) |
| jam-speaker | Music Assistant / Spotify Connect speaker cards | **round 3 (2026-10-30), mockup "Take 3"**: TV-style poster (poster cut) = an art area (150px, `poster_height`; the hero, also on a phone) with the ink band under it: artwork, or accent + Golden Arm bars while playing without art, or — idle — a seeded **cut-paper idle art** (see Motifs); offline = slab2 + dim bars. Solid ink title band (fixed ink / cream colours in both modes): kicker = 10px source dot (Spotify #1db954 / MA violet / Grouped teal / Idle, Paused dim / Offline red / else accent) + "Room · source" (11px, ≤ 2 lines), title 30px (≤ 2 lines; idle = the room), artist (idle: "Last played: title · artist"), and at its right 32px Shuffle (accent when on) + Favourite (pink when on) chip keys; 5px accent progress strip at the poster foot (position at render time); power corner = 46px top-right triangle, ink with an accent glyph (red when the player is off). Tap anywhere else on the poster (a transparent button under the band; the band passes pointer events through) = **panel B**. Below: Prev / big Play-Pause (accent, 1.5fr) / Next 60px glyph keys, then − / 44px volume bar / + / number. **Panel B** (jam-music-panel.js, openSheet, rule off, 700px tall max): mini header (52px thumb, room in 22px Londrina, source line, Speakers key with `speakers`, Close), tab row Pinned / Recent / Playlists / Albums / Search (12px labels, 4px accent underline on the current one), list rows on slab2 (44px cover or cut-paper thumb, Londrina name, "type · detail", slab3 Play chip, 28px corner tab = pin / unpin: accent when pinned), plain-word loading / error (+ Retry) / empty states, and a docked ink bar (thumb, title / artist, Prev / Play (accent) / Next / Favourite). The Speakers key swaps the list for the grouping view (This room + Join / Playing rows, thin bars; a new join stamps). Opened from a kiosk card it is fullscreen with bigger type (18px floor). **`size: kiosk` = K1**: art flush left (58 %, no cut, tap = panel B), right panel filled with the art's dominant colour (sampled on a 24px canvas; violet without art / on a tainted canvas; text ink or paper, a mid-tone is nudged lighter / darker until it reads 4.5:1; keys in the text colour with the panel colour glyph; Shuffle / Favourite 48px outlined, filled when on), kicker 18px, title 36-76px by the panel height (3 lines, 2 on short panels), artist · album, progress line with times (refreshed every 5 s only while the card sits in a sheet and plays), Prev / Play / Next (52-72px), volume − / bar with the number inside / + (48-56px) and the Speakers key (grouping view over the top area, "Now playing" goes back); bottom shelf (ink, 20 % of the height, 88-150px): vertical label + 5 covers (pinned, then recent; tap = play; 18px Londrina label plates) + Browse (panel B). Nothing under 18px; no continuous animation |
| jam-fan | fan tile, purifier cards | power corner (round 3; replaced the On/Off pill; slab2 triangle, accent glyph when on), tap on the face / name = more-info, speed steps (fan.set_percentage), preset chips (`presets: false` hides them), air-quality kicker sensors |
| jam-weather | clock-weather, weather-forecast | big temp numeral, condition word (`conditionWord`), cut-paper glyph, forecast strip, optional clock (`clock_size` normal/big/huge) |
| jam-graph | mini-graph, statistics-graph | SVG step/line chart from history, 1-5 series in `--jam-s*`, legend chips, crosshair + tooltip, current value big |
| jam-gauge | gauge | half-disc of cut wedges (severity bands) + big numeral, or `style: bar` |
| jam-list | entities | rows: name / value, divider rules, toggles for switchable rows |
| jam-house | landing header | house strip: inside / outside temperature + condition word, door lock chip (tap = lock), who's home (first names; `full_names`), alert chips; `inside_aq` / `outside_aq` air line under each temperature, words only ("Air · Good"; a US AQI number becomes its category word); `compact` kiosk row |
| jam-tabs | navigation chips / tab bars | equal-width room tabs, current tab filled with its accent, optional sticky (host is position:sticky; in HA it sticks only within its own section; cut corners show `--primary-background-color`) |
| jam-scenes | scene buttons | horizontally scrolling scene/script keys (`wrap: true` = more rows), active scene in the accent (newest scene activation; the input_select when it changed later) |
| jam-screensaver | kiosk screensavers | zero-footprint card; full-viewport Poster clock + weather word or photo slideshow after idle (photos from `images.index` JSON or, 0.4.0, `images.media` = an HA media source folder: browsed ≤ 1/hour, each image resolved to a signed URL right before it is shown, never cached/logged; contain on ink; 0.4.1: photos crossfade (`images.fade`), `mode_entity` picks poster / photos live; any error → poster; 0.7.1: with a `mode_entity` the pick is pure — Photos never interleaves the poster (`poster_every` applies only without a `mode_entity`), Clock never shows a photo; `now` = jam-kiosk's now sources (media only, shared `jamNowMedia` in core.js): first active one = a Now playing block (square cover via jamMuUrl, preloaded before the swap, else flat accent square + Golden Arm bars; kicker in the label style; title in the display face 5.75vh ≈ 44px on 1024×768; artist line) inside the poster's text block under the weather (moves with the layout, never over the clock / date / weather) and, on photos, as a solid ink cut-paper label (cover 11.5vh ≈ 88px, title 4.4vh ≈ 34px) under the time chip bottom-left; updated only on hass changes of its entities); built for weak kiosks (no rAF, minute timer); `kiosk` ("url" default = with `?kiosk`) hides HA's sidebar + dashboard header on its own dashboard only (styles in home-assistant-main / ha-drawer / hui-root shadow roots, MutationObserver, removed on leaving the dashboard; 2 s long-press top-left 48 px corner = chrome back until reload) |
| jam-kiosk (0.5.0) | kiosk home view | approved mockup "B · Poster + dock": fills the view (measures its top, ends at the viewport bottom; re-measured on resize / visibility / every minute); 10px accent bar, Londrina clock min(19cqw, 31cqh) (176-190px on the kiosks, 12/24 h from hass.locale, small Jost AM/PM, minute timeout), date line (0.6.1: "TUESDAY · OCTOBER 28" in Londrina 900, --fg, uppercase, 30-40px ≈ 0.3x the clock digit height, one line, never wraps) and under it the facts line (0.6.0/0.6.1: `inside_entity` / `humidity_entity` / `aq_entity` → "67° inside · 58% humidity · air excellent", Jost 600 20-22px dim, natural case, wraps between parts, never an ellipsis; left out when no sensor has a value); right "now" block (18px kicker, 52-60px big line clamped to 2 lines, 18px small line) from the first active `now` source (media by `states`, weather with the hourly-forecast outlook); dock of 2-5 equal 120px flat blocks (accent fill + ink text, or `none` = slab2 + dim state; 32-36px name, 18px state) that open a fullscreen openSheet (jamCardSheet, child cards get hass) or run an action (confirmation); sheet `columns` 1-3 or a width list (`[3, 2]`); a sheet with `size: kiosk` cards gives them the full body height. **Exceptions, per the mockup:** no cut corners (the poster band and the dock are full-width flat blocks; the sheet keeps its cut), no view entrance; floor 18px for every text on the card. Motion: a block stamps once on press (`jam-stamp` keyframes). **Lock button (0.6.2, `lock_entity` / `lock_name`):** a perfect circle (border-radius 50%: circles are allowed in the cut-paper look, like the `disc` kind; no shadow / gradient) in the poster's top-right corner, right edge on the accent bar's right edge, 14px under it, diameter min(10.5cqw, 15.2cqh) (104px iPad, 88px Echo Show); flat inline-SVG padlock (56 % of the disc: square body with a keyhole cut, 5-unit shackle, closed when locked, raised and swung left otherwise); under it one 18px Jost 600 uppercase label line, right-aligned, max 36cqw: "FRONT DOOR · LOCKED", the state alone when that does not fit. Tones (state grammar, 2026-11-03): locked = quiet (a 4px --fg ring on no fill, --fg glyph); any other available state = alert (--red disc, ink glyph ≈ 4.9:1, label in --alert-text); unavailable / unknown = 4px dashed --dim outline, dim glyph, label "FRONT DOOR · OFFLINE". Tap: locked → confirm ("Unlock the front door?") then lock.unlock; unlocked / open / jammed → lock.lock at once; locking / unlocking / opening / unavailable → nothing. Native button (Enter / Space), aria-label "Front door, Locked"; stamps on press like a dock block. Must stay clear of the clock, date / facts lines, the now block and the dock at both kiosk sizes |
| jam-panel | entities (control room) | compact name / value rows, formats (pct, temp, bytes_rate, duration, relative), `bad` thresholds in red; `accent` = 4px rule under the title; names/titles never break mid-word (the value column wraps) |
| jam-alerts | automation / alert lists | automations by last_triggered ("ran …"), watched entities, unavailable count, red failure chip |

### Core helpers (window.JamCards, src/core.js)
- Colour: `ACCENTS`, `accentName`, `accentVar`, `accentFg`, `setAccent`; light colour `kelvinToRgb`, `lightRgb` (a light's output
  colour), `fullRgb` (scale [r,g,b] so the max channel is 255; null for black/missing), `rgbCss`, `luminance`, `inkOn` (ink/paper text).
- Round 3: `contrastRatio(a, b)`, `textOn(rgb, tc?)` → `{fg, plate, dark}`, `shade(rgb, depth)` (1 = mid, 2 = deep), `resolveRgb(node, css)`
  (computed rgb of a token, null while detached), `POWER_CSS` + `powerCorner({name, on, disabled, bg, fg, onClick})`,
  `cornerColors(faceRgb, glyph, tc?)` → `[bg, glyph]` (see "Power corner").
- Looks (R4): `textColors(node)` → `{dark, light, darkCss, lightCss}`, the look's text pair for flat-colour maths: the
  node's `--on-fg` and `--ink-fg`, sorted by luminance (Poster: #141210 / #ece2c9 in both modes = `TEXT_POSTER`, also the
  fallback when the node is detached or a value is not rgb). `inkOn`, `textOn`, `cornerColors` and jam-music-panel's
  `jamMuReadable` take it as an optional last argument (default Poster); jam-light, jam-button and jam-speaker K1 pass
  their own. `parseRgb(css)` reads hex / rgb() strings.
- Units: `keepUnit(node, stateObj | unit)` wraps a trailing unit in `<span class="unit">` (text-transform:none) so uppercase display
  type never changes a unit's case (µg/m³ stays µg/m³); used by heading chips, tile, list, panel, button, alerts, hero, graph, house.
- Weather: `CONDITION_WORDS`, `conditionWord(state)` (one map for jam-weather, jam-house, jam-screensaver).
- Looks / tokens (R1): `lookOf(node)` (the look id, `poster` by default), `TOKENS` (every `--jam-*` name a body layer copies).
- Look packs (R6): `registerLook({id, name, css, fonts, motifs})`, `lookPack(id)` (null for Poster), `looks()` (registered ids,
  Poster first), `ASSET_BASE` (folder of jam-cards.js: `window.JamCardsConfig.assetBase`, else the script's src, else
  `/hacsfiles/jam-cards/`), `jamStyle(root, css, look)` (adopt the shared sheets on a shadow root), `fxOf(node)`.
- Motifs (R7): `motif(name, ctx, ...args)`, `defineMotif(name, fn)` (see "Motifs").
- Edges: `CUTS`, `cutPath`, `paper`, `cutKey`, `armBars`; actions `bindActions`, `runAction`, `navigate`, `moreInfo`, `asButton` (0.3.8).
- Motion: `motion` (accessor), `motionOn`, `oneShot`, `staggerIn`, `treeOrder` (see "Motion").
- Air quality: `AQI_WORDS`, `aqWord(state)` (0.5.0; US AQI number → category word, word states capitalised; jam-house, jam-kiosk).
- Sheets: `openSheet({from, title, kicker, accent, headerActions, fullscreen, …})` (`fullscreen: true`, 0.5.0: covers the whole viewport,
  no outer padding, title in the accent, 18px kicker, 64px CLOSE top-right; jamCardSheet passes it through) (headerActions = nodes left of CLOSE, same height) → modal cut sheet over an ink veil (Esc / veil / CLOSE / back close it; child
  cards in `body` get the surface tokens one step up),
  `vertigoSpiral`, `deepActive`. jam-media's `jamCardSheet` puts child cards in one (used by jam-tv and jam-media `more`).

## Music Assistant from the frontend (round 3, checked read-only on the user's HA 2026-10-30)
Players: media_player.oneplus_speaker_2 (Living Room Speakers), media_player.kitchen (Kitchen Speakers), media_player.phoster
(Phoster); one MA config entry (core integration `music_assistant`). Code: src/cards/jam-music-panel.js (helpers + panel B).
- Response actions: `hass.callWS({type: "call_service", domain: "music_assistant", service, service_data, target?,
  return_response: true})` → `{context, response}`; any HA user may call them. They need `config_entry_id`: config option,
  else `callWS({type: "config_entries/get", domain: "music_assistant"})`, else the player's device `primary_config_entry`
  (hass.entities → hass.devices).
- Library: `music_assistant.get_library {config_entry_id, media_type, limit, offset, order_by, favorite?, search?}` →
  `{items: [{media_type, uri, name, version, image, favorite, explicit, artists?, album?}], ...}`; `order_by` takes name,
  last_played_desc, play_count_desc, timestamp_added_desc, random, … Items carry no play time: **Recent** = playlists + albums
  by `last_played_desc`, interleaved (detail = type · artist, not "played 2 h ago").
- Search: `music_assistant.search {config_entry_id, name, media_type: [..], limit}` → `{artists, albums, tracks, playlists,
  radio, audiobooks, podcasts}`. Play: `music_assistant.play_media {entity_id, media_id: uri, media_type}` (no enqueue: the
  player's MA default for the type).
- Favourite: no service; each player has `button.*_favorite_current_song` (translation_key / unique_id suffix
  `favorite_now_playing`, same device; the living room's is `button.oneplus_speaker_favorite_current_song_2`), `button.press`
  adds the playing track to the MA favourites — add only. Lit state: `music_assistant.get_queue` (target the player) →
  `current_item.media_item.favorite` for MA-queue playback; Spotify Connect playback is unknown until pressed.
- Shuffle: `media_player.shuffle_set` (SHUFFLE_SET 32768). Power: the MA players have no TURN_ON / TURN_OFF (features
  8322623 / 8320575), so the power corner stops (playing / paused) or plays (idle) unless the player can toggle or
  `power_action` is set.
- Per-user pins: `frontend/get_user_data` / `set_user_data`, key `jam_pins`, value `[{uri, name, media_type, image}]` plus
  `{uri, hidden: true}` for a config pin the user unpinned (in memory if storing fails).

## Native cards left in clones
picture-glance (camera), markdown, conditional/grid/vertical-stack/horizontal-stack containers. The theme styles them
(square, flat, Jost); they get no cut corner.
