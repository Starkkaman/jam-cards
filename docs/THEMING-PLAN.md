# Theming plan: global "looks" for Jam Cards + the JamBoard theme

Status: architecture brief (2026-11-03); R0-R3 built 2026-11-03, see "Progress" at the end. Line numbers refer to jam-cards
`15d5e65` (0.7.2) and jam-theme `themes/jamboard.yaml` as of 2026-10-27.

**Goal.** Whole-look overhauls (after the JamDash looks: Depth, Braun, NERV, LCARS and the v8 designer looks Transit, Olympia,
Grid, Pulsar, New Wave) for all 24 cards and Home Assistant's own UI. Card layouts and features stay. The look switches
globally from one place. The cards also get visual editors, because the suite may be shared.

**Recommendation in short**
1. **A look is an HA theme, plus an optional look pack in jam-cards.js.** The theme sets every `--jam-*` token (colour, type, shape,
   motion, effects) and `--jam-look: <id>`. Cards read `--jam-look` from computed style, set `data-look` on their host and
   adopt that look's small shared stylesheet and motif functions. No card code is forked: JamDash forks every view per look
   (`web/src/lib/themes/registry.ts`), and we cannot afford that across 24 cards.
2. **Global switch: `frontend.set_theme`**, driven by an `input_select.jam_look` plus an automation, so any household user can
   change it from a dashboard. Browsers set to "Backend-selected" follow; a browser pinned to a theme in its profile keeps
   it (use that for the Echo Show if a look is too heavy for it).
3. **Fonts: Poster stays embedded.** Every other look's fonts ship as woff2 files next to the bundle (HACS `dist/`) and are
   declared with URL `@font-face`. A browser fetches only the faces it actually uses, so only the active look downloads.
4. **One token source** generates the HA theme YAML (one file per look), the core.js fallbacks, the token copy lists and
   the preview CSS. Today the same palette is written in 5 places.
5. **Editors:** use `getConfigForm` schemas for the flat cards first (13 cards). Object-list fields come second, and custom
   editors come last for jam-remote, jam-tv, jam-kiosk and jam-popup.

---

## 1. Inventory: how today's look is produced

### 1.1 Tokens and where they live
| Group | Tokens | Defined in |
|---|---|---|
| Surfaces | `ink slab slab2 slab3 paper paper-fg paper-dim fg dim line on-fg` (11) | theme `jamboard.yaml:115-124,133` (dark), `260-278` (light) |
| Hues | `ochre teal blue pink violet green red alert-text` (8) | same |
| Series | `s1..s5` (5) | same; also copied into HA `graph-color-1..5` (`246-250`, `391-395`) |
| Type | `display`, `body` (2) | theme top level `jamboard.yaml:45-46` (both modes) |
| Legacy | `shadow` (1; unused since v0.3) | theme `134`, `279` |
| Runtime, not in the theme | `accent` (jam-popup → children), `motion` (`setMotion`, core.js:583-587), `ink-fg`, `ink-dim` (read with fallbacks at core.js:339 and jam-screensaver.js:65 but **never defined by the theme**), `spotify` (jam-speaker.js:224) | cards |

The token values are written **five times**:
- the theme YAML;
- `BASE_CSS :host` fallbacks (core.js:12-22, which must equal dark per CLAUDE.md);
- `preview/index.html:10-21`, a hand copy of both modes;
- `SHEET_TOKENS` (core.js:666-667);
- `SS_TOKENS` (jam-screensaver.js:138).

The copy lists have already drifted:
- `SHEET_TOKENS` lacks `alert-text`, `ink-fg` and `ink-dim`.
- `SS_TOKENS` lacks `slab3`, `alert-text`, `paper-dim` and `s1..s5`.
- So with a theme set on a *view* (not `<html>`), body-appended sheets and the screensaver fall back to dark values for
  those tokens.

The theme also writes about 117 HA keys per mode (`jamboard.yaml:140-257`, `285-402`) that are all derived by hand from
those ~23 palette values.

### 1.2 Look-specific things hard-coded instead of tokenised
| What | Where (file:line) | Count |
|---|---|---|
| Cut-corner system: `CUTS` sizes per kind | core.js:351 (card br14, key tr12, chip br6, hero br22, sheet tr18, poster br16) | 6 kinds |
| `paper()` writes the polygon as an **inline** `--clip` style per element | core.js:412-421 (418) | 49 `paper()/cutKey()` calls in 13 files |
| Literal `polygon(...)` clips outside `paper()` | core.js:33,36,84,518; jam-button:33 (icon square 30%); jam-tabs:36 (8px); jam-scenes:32 (10px); jam-remote:92-93 (outlined plates), 275-279 (d-pad arrows, functional); jam-light:107,149,238,241 (strip ends), 106/123/143 (`cutPath`); jam-tv:151 (44px corner); jam-music-panel:301 (pin tab); jam-screensaver:74,111,132 | 27 `polygon(` in 9 files, 40 `clip-path` in 10 |
| Power corner = 46px triangle + glyph | core.js:516-542 (`POWER_CSS`, `powerCorner`); jam-tv keeps its own 44px one (jam-tv:151) | 5 cards |
| Circles allowed only as exceptions | jam-kiosk:116 (lock disc `border-radius:50%`), jam-screensaver:75 (`.disc`), jam-music-panel:93 (idle art discs), remote OK disc | 5 `border-radius` |
| Display type rules: Londrina 900, uppercase, leading .92 | `.disp` core.js:29 and repeated inline; `font:900`/`font-weight:900` literals | 50 in 19 files |
| Uppercase rule | `text-transform:uppercase` | 57 in 19 files |
| Label tracking .12-.2em | `letter-spacing:` literals | 75 in 18 files |
| Fixed px font sizes (kiosk floors, bands) | `font:...NNpx` | 40 in 8 files (+39 `cqw/cqh/cqmin` sizes in 5 files tuned to Londrina's width) |
| Focus ring = ochre | `outline:3px solid var(--ochre)` | 13 in 7 files |
| Literal hex colours | core 34 (mostly fallbacks; core.js:104 `.jam-err` cream on ink); jam-speaker 17 (ink band / cream text / `#36312b` keys, :46-139); jam-music-panel 7 (dock :318-328, idle-art pool :83); jam-kiosk 3 (:120,147,148 light mode); jam-light 3 (`LIGHT_PLATE` :49, :119); jam-tv 2 (:104,142); jam-screensaver 2 | 68 in 7 files (34 are `#141210`/`#ece2c9`) |
| Ink/paper assumed in colour maths | `inkOn` core.js:457; `JAM_INK_RGB`/`JAM_PAPER_RGB` core.js:481; `textOn` :484; `cornerColors` :546-551; `accentFg` :339; jam-light `textOn`/`shade`/`inkOn` :279-282,327,563,604,658; jam-tv art luminance class :335-349; jam-speaker K1 panel colour (`jamMuReadable`) | ~12 call sites |
| `shade()` (HSL lightness ±.24/.36) | core.js:490-504, used by light/button/fan/speaker corners | look-neutral maths, but tuned for flat faces |
| Motion = stepped cuts | `steps(` 20 in 5 files (core.js:70,91-98; jam-popup:33-37; jam-scenes:36,39; jam-kiosk:125,155; jam-screensaver:101-108); `@keyframes` 13 in 3 files; durations hard-coded (60-240 ms); press transform `translate(3px,3px) scale(.96)` core.js:100 | `--jam-motion` (core.js:70) only scales the print |
| Motifs | Golden Arm bars `armBars` core.js:430 (6 uses: graph:257, media:187,189, tv:357, speaker:240, screensaver:633); cut-paper idle art `jamMuIdleArt` jam-music-panel:83-97 (speaker:242); Vertigo spiral core.js:647 (sheets, jam-popup:103); weather glyphs jam-weather:22-52; remote glyphs `JAM_GLYPHS` jam-remote:58; gauge wedges jam-gauge:57-70; light preset looks jam-light:40 | 7 motif families |
| Bands that are ink/cream "in both modes" | jam-tv poster band (:142), jam-speaker band + K1 shelf (:55,131-139), music-panel dock (:318-328), screensaver photo label (:132), `.jam-err` (core.js:104) | 5 places |
| Kiosk/screensaver layouts | jam-screensaver Poster layouts `l0..l5` (:76-99: flat bars + disc + text block, per-minute cut); jam-kiosk "no cut corners", clock `min(19cqw,31cqh)` sized for Londrina, 18px floor, light class from `hass.themes.darkMode` (:211-214) | 2 cards |
| HA chrome | theme shape/type keys (`jamboard.yaml:14-46`); view tabs restyled with `card-mod-root` (`:54-110`: Londrina, 48px, 8px cut, 4px room bar, room hues by `data-path` via `:has()`) | needs card-mod 4.x |
| Fonts | Londrina Solid 900 (32.4 KB) + Jost var 400-600 (26.6 KB) woff2, base64 in `FONT_CSS` (tools/bundle.mjs:18-27), injected once into `document.head` by `loadFonts()` (core.js:3-8, called from every card's constructor core.js:806) | ~79 KB of the 547 KB bundle |
| Card registration | `register()` pushes `customCards` with `preview: false` (core.js:878); **no** `getConfigForm`, `getConfigElement` or `getStubConfig` in any card | 24 cards |

### 1.3 Checks that encode the Poster look (they must become look-aware)
- `preview/shoot.js:39-47`: Londrina and Jost must be loaded, with exactly one font `<style>` element.
- `shoot.js:61-90`: every `.paper` clip must equal `cutPath(...CUTS[kind])` (at most 5 points); no shadow slabs.
- `shoot.js:93-106`: `CUTS` sizes.

The 21 `preview/checks/*.js` files test behaviour (taps, sizes, lifecycle). A few query look DOM, such as `.pw .tri`, the
`.arm` bars and the "On now" stamp.

### 1.4 Gaps found on the way (fix in R1, they matter for looks)
- `JamBase.set hass` (core.js:817-827) re-renders only when a watched entity changes. A theme or dark-mode switch alone
  never reaches a card. jam-kiosk's `light` class (jam-kiosk.js:211-214) stays stale until an entity changes. Its setter
  (:69-77) handles locale changes but not themes.
- `--jam-ink-fg` and `--jam-ink-dim` are used but not in the theme. The `SHEET_TOKENS` / `SS_TOKENS` drift is described in 1.1.
- Every card parses `BASE_CSS + css()` into its own `<style>` (core.js:846). Per-look CSS added the same way would
  multiply that cost.

---

## 2. Mechanism for global looks

### 2.1 The look contract
A look has three parts.
1. **An HA theme** (`JamBoard`, `JamBoard LCARS`, `JamBoard NERV`, ...) with `light` / `dark` modes, or a single mode for
   dark-only looks such as LCARS and NERV. It sets:
   - every `--jam-*` token from 2.2, including `jam-look: lcars`;
   - its own HA chrome keys (radius, fonts, colours);
   - its own `card-mod-theme` and `card-mod-root` (view tabs).
2. **A look pack in jam-cards.js** (`src/looks/<id>.js`, about 150-400 lines each):
   - `css`, the skin over stable class hooks;
   - `fonts`, the families and files;
   - `motifs`, overrides of the motif registry.

   Poster is the built-in pack that every other pack starts from.
3. **The stable skinning surface:** documented class hooks that look CSS may target: `.host .paper[data-cut] .face .key .chip .disp
   .label .kick .title .rule .stripe .tmk .track .strip .fill .pw .band .arm`, `:host([data-look])` and
   `.pop[data-look]`. Renaming any of them becomes a breaking change, listed in DESIGN.md.

**Rule: tokens first.** A look should get about 80 % of its identity from tokens and about 20 % from its pack CSS and motifs. If a look
needs a different DOM *layout*, that is a card option, not a look. Examples: LCARS's side elbows around the whole
dashboard, or NERV's hex-cell app grid. A card can draw an LCARS elbow frame on its own face with pseudo-elements. It cannot
rearrange the HA dashboard.

### 2.2 Token taxonomy (new tokens; poster defaults = today's values)
| Area | Tokens (theme key = name without `--`) | Poster default |
|---|---|---|
| Identity | `jam-look` | `poster` |
| Colour (existing) | 23 palette tokens from 1.1 | unchanged |
| Colour (new) | `jam-ink-fg`, `jam-ink-dim` (cream/dim on ink); `jam-band`, `jam-band-fg`, `jam-band-dim`, `jam-band-key` (fixed bands in tv / speaker / music dock / error strip); `jam-plate`, `jam-plate-fg` (jam-light label plates); `jam-focus` (focus ring) | `#141210` `#9a8f7c` / `#ece2c9` ... / `var(--jam-ochre)` |
| Type | `jam-font-display`, `jam-font-body`, `jam-font-mono` (keep `jam-display` / `jam-body` as aliases); `jam-display-weight`, `jam-display-case`, `jam-display-track`, `jam-display-lead`, `jam-display-scale` (width correction for cqw-sized numerals: Londrina 1, Antonio ~1.15, Archivo ~.85); `jam-label-case`, `jam-label-track`, `jam-label-weight`; `jam-num-font` (big numerals: display or mono) | `900 uppercase -.005em .92 1`; `uppercase .16em 600`; display |
| Shape | `jam-shape-<kind>` = a whole `clip-path` value per kind (`card key chip hero sheet poster`, plus `pw` power corner and `strip-end`); `jam-radius-<kind>` (border-radius, used when shape is `none`); `jam-pad-<kind>` (inner padding ≥ cut); `jam-border` (e.g. `1px solid var(--jam-line)` for Transit/Pulsar hairlines); `jam-rule-h` 5px; `jam-stripe-w` 6px; `jam-strip-h` 22px | today's polygons; radius 0; border 0 |
| Elevation / effects | `jam-elev-1`, `jam-elev-2` (box-shadow; only with shape `none`, because `clip-path` clips shadows); `jam-fx` (0/1: gradients, translucency, scanlines); `jam-blur` | `none none 0 0px` |
| Motion | `jam-ease-2/3/4` (stepped or spring `linear(...)`), `jam-dur` (scale), `jam-press` (pressed transform), `jam-kf-enter/stamp/wipe` (keyframe names; `animation-name: var(...)` is valid) | `steps(n,end)`, 1, `translate(3px,3px) scale(.96)`, `jam-enter`... |

All of these can carry a whole CSS value through `var()`:
- `text-transform: var(--jam-display-case)`;
- `clip-path: var(--jam-shape-card)` (polygon or `inset(0 round 0 26px 26px 0)` for LCARS);
- `animation-timing-function`;
- `animation-name`.

A theme value that is not valid CSS makes the property invalid at computed-value time and leaves the element unclipped
or unstyled. The preview checks must catch that (3.2).

### 2.3 Runtime
- **Look detection.** `lookOf(node)` reads
  `getComputedStyle(host).getPropertyValue("--jam-look").trim().replace(/"/g, "")`, falling back to `poster` (for example under
  HA's own default theme).
  - It runs on connect and when the theme changes.
  - Computed style is the truth: it includes a view-level `theme:`.
  - `hass.themes` / `hass.selectedTheme` are only the trigger. HA hands every card a new `hass` object on a theme or
    dark-mode change, so the trigger works.
- **Change trigger.** `JamBase.set hass` also compares `h.themes` and `h.selectedTheme` **by reference**. When either
  differs, it calls `_applyLook()` and forces a render. Unrelated entity updates stay at 0 DOM writes (check 97-robust).
- **Styles.** Shared constructable stylesheets: one `CSSStyleSheet` for `BASE_CSS` and one per active look pack.
  - Every shadow root adopts `[BASE, LOOK, cardSheet]`. That is one parse per page instead of one per card, which helps the Echo Show.
  - Fall back to `<style>` if `adoptedStyleSheets` is missing. WebView 139 on the Show supports it.
  - `paper()` stops writing inline `--clip`. BASE_CSS maps `.paper[data-cut=card]{--clip:var(--jam-shape-card, <poster polygon>)}`.
- **`data-look`.** It goes on each card host, on openSheet's `.pop` and on the jam-screensaver layer, so pack CSS can use
  `:host([data-look=nerv])` and `.pop[data-look=nerv]`.
- **Body layers.** Sheets and the screensaver copy *all* tokens through one generated `TOKENS` list (replacing `SHEET_TOKENS`
  and `SS_TOKENS`), `--jam-look` included.
- **Colour maths.** `textOn`, `inkOn` and `cornerColors` take the look's resolved ink and paper RGB (`resolveRgb(host,
  "var(--ink)")`, cached per look and mode) instead of `#141210` / `#ece2c9`.
- **Motif registry.** `JamCards.motif(name, node, key)` with Poster defaults:
  - `empty` (Golden Arm bars), `idleArt`, `flash` (Vertigo spiral), `wxGlyphs`, `remoteGlyphs`, `powerGlyph`,
    `screensaver` (poster composition), `echo` (decorative label echo, e.g. NERV kanji).
  - A pack overrides only what it changes.
  - Echo text comes from a fixed dictionary (`aria-hidden`) and never from entity data, so the textContent rule holds.

### 2.4 How the user switches globally
| Option | Global from one place? | Non-admin users / kiosks | HA chrome changes too | Verdict |
|---|---|---|---|---|
| A. HA theme only; switch with `frontend.set_theme` (Developer tools → Actions) | Yes: sets the backend default theme | Browsers on "Backend-selected" follow; a browser pinned to a theme in Profile keeps it; view `theme:` overrides that view | Yes | Base mechanism |
| B. `input_select.jam_look` + automation calling `frontend.set_theme` | Yes, from any dashboard (a jam-choice card on the helper) | Works for non-admins: `frontend.set_theme` is registered as an admin-only action (verify on 2026.10); an automation runs without a user context, a direct tap by a non-admin user would be refused | Yes | **Recommended on top of A** |
| C. Card/resource option (`jam-cards.js?look=nerv`, `JamCards.look = ...`, a config card) | Per resource or per browser | Kiosks need their own resource URL | No: tokens and chrome stay Poster, so they mismatch | Reject (only as a debug override) |
| D. Per-browser localStorage choice (JamDash `prefs.look`) | No | n/a | No | Reject: HA already has per-browser theme selection |

Recipe (ship as a blueprint and document it in README):

```yaml
input_select:
  jam_look: {name: Dashboard look, options: [Poster, LCARS, NERV, Transit, Braun]}
automation:
  - alias: Jam look follows the selector
    triggers: [{trigger: state, entity_id: input_select.jam_look}]
    actions:   # call twice so a stale default_dark_theme cannot override the look in dark mode
      - action: frontend.set_theme
        data: {name: "{{ 'JamBoard' if trigger.to_state.state == 'Poster' else 'JamBoard ' ~ trigger.to_state.state }}"}
      - action: frontend.set_theme
        data: {name: "{{ 'JamBoard' if trigger.to_state.state == 'Poster' else 'JamBoard ' ~ trigger.to_state.state }}", mode: dark}
```

- Keep the Poster theme named `JamBoard`, so every browser that selected it keeps working.
- Kiosks:
  - the Echo Show can stay on "Backend-selected", or be pinned to `JamBoard` in its profile if a look is too heavy;
  - jam-screensaver and jam-kiosk get a per-card `fx: false` override, and `motion: false` already exists.
- Later, an optional `jam-looks` card can show a swatch per look and set the `input_select`. It reads the palettes from
  `hass.themes.themes[name]`.

### 2.5 Fonts per look
| Option | Cost | Verdict |
|---|---|---|
| Bundle every look's fonts as base64 (today's method) | ~0.7-0.8 MB woff2 for all looks ≈ +1 MB of JS string, parsed on every device including the 1 GB Echo Show | Reject |
| `@font-face` from the theme | Impossible: themes only set variables; `@font-face` in shadow roots / card-mod-root is ignored (core.js:1-2) | Impossible |
| **URL `@font-face` for every look, declared once in `document.head`** (like `loadFonts`, but `src:url(<assetBase>/fonts/x.woff2)`) | Declared faces cost nothing until text uses them, so only the active look downloads | **Recommended** |
| `FontFace` API on look activation plus `document.fonts.load()` | Same, plus the ability to wait for the font before measuring | Use for jam-kiosk / jam-screensaver only: re-measure on `document.fonts` `loadingdone` |

- Poster stays embedded, so the default needs no extra files and works offline.
- `assetBase` is found from the resource `<script src*="/jam-cards.js">` (HA loads module resources as script elements),
  overridable with `window.JamCardsConfig.assetBase`.
- If the file is missing, the look's fallback stacks apply. No Google Fonts requests ever (shoot.js:33,134 keep enforcing that).

Font budget (woff2, latin subsets):

| Look | Fonts | Size |
|---|---|---|
| Poster | Londrina + Jost | 59 KB |
| LCARS | Antonio var | 26.6 KB |
| NERV | Saira 98.9, Noto Serif 63.8, Share Tech Mono 13.5, Shippori JP subset 33.1, DotGothic JP subset 8.2 | 217 KB |
| Braun | Archivo latin | 90 KB (wght-only subset ≈ half; est.) |
| Transit | system Helvetica/Arial | 0 KB |
| Grid | Hanken Grotesk | ≈40 KB (est.) |
| Olympia | Albert Sans | ≈45 KB (est.) |
| Pulsar | Archivo + IBM Plex Mono | ≈120 KB (est.) |
| New Wave | Bricolage + Silkscreen + VT323 | ≈130 KB (est.) |
| Depth | Instrument Sans | ≈50 KB (est.) |

The JamDash looks already have OFL files in `jam-dash/web/src/lib/themes/*/fonts`; the v8 mockups load Google Fonts and
need local subsets.

### 2.6 One token source
- `jam-cards/src/looks/<id>.js` exports `{id, theme: "JamBoard LCARS", modes: {dark: {...}, light: {...}}, tokens (type,
  shape, motion), ha: {overrides}, cardModRoot, css, fonts, motifs}`.
- `tools/themes.mjs` writes `../jam-theme/themes/jamboard-<id>.yaml`. It derives the ~117 HA keys per mode from the palette:
  primary ramp (OKLCH), named colours, inputs, switches, graph colours.
- `tools/bundle.mjs` writes the core fallback map + `TOKENS`, `preview/looks.css`, and the `@font-face` chunk. `--check`
  covers all of them.
- The jam-theme repo becomes generated output plus its README. HACS users still install it separately.

---

## 3. Refactor steps (ordered)
Sizes: S < 150 changed lines, M 150-500, L 500-1500. A "pixel-identical" check compares Poster shots before and after
(add a PNG diff step to shoot.js; Playwright screenshots + an in-page canvas compare, no new deps).

| # | Step | Size | Risk | Done when |
|---|---|---|---|---|
| R0 | Token source + generators (2.6); `preview/index.html` loads generated `looks.css`; theme YAML regenerated byte-equivalent in values | M | Low | `bundle --check` clean; theme diff = comments/order only |
| R1 | Token plumbing: one `TOKENS` list drives BASE_CSS `:host`, sheet and screensaver copies (fixes 1.4 drift); new colour tokens (`ink-fg`, bands, plate, focus) replace the 68 literals; `set hass` theme trigger; `lookOf()` + `data-look` | M | Low | Poster pixel-identical in both modes; 97-robust still 0 DOM writes |
| R2 | Shape via CSS: `paper()` drops inline `--clip`; `[data-cut]` → `--jam-shape-*`, `--jam-pad-*`, `--jam-radius-*`; the 27 literal polygons become kind tokens (`pw`, `strip-end`, tabs, scenes, button square, music pin); remote arrows / OK disc stay geometry | M | Med (an invalid var leaves an element unclipped; jam-light plates, remote outlines) | Pixel-identical; new check: computed `clip-path` of every `.paper` equals its kind token |
| R3 | Type tokens: `.disp` / `.label` / `.key` read `--jam-display-*` / `--jam-label-*`; replace 57 uppercase, 50 weight-900 and 75 tracking literals (19 files); cq-sized numerals × `--jam-display-scale`; units keep `.unit` | M-L (wide but mechanical) | Med (text fit under mixed case / wider faces, kiosk 18px floors) | Pixel-identical; a "stress look" (mixed case, Archivo, scale .85) passes the fit / overflow checks |
| R4 | Colour maths per look: `textOn` / `inkOn` / `cornerColors` / jam-light plates use the resolved ink/paper; idle-art pool from tokens | S-M | Med (light contrast logic) | 30-light, 75-speaker, 87-kiosk-sheets checks pass; contrast QA (jam-home `preview/qa`) passes |
| R5 | Motion tokens: 20 `steps()`, 13 keyframes, durations, press transform | S | Low | 95-motion passes; reduced-motion still kills everything |
| R6 | Look packs: registry, adopted stylesheets, URL `@font-face` loader + `assetBase`, `fx` gate, kiosk re-measure on font load | M | Med (lifecycle, sheet adoption in body layers) | Switching `--jam-look` live re-skins every card and open sheet without reload |
| R7 | Motif registry (2.3): route `armBars`, idle art, spiral, glyph sets, power glyph and the screensaver composition through `motif()` | M | Low | Poster pixel-identical |
| R8 | Packaging: `dist/jam-cards.js` + `dist/fonts/`, `hacs.json` filename; README migration note (same `/hacsfiles/jam-cards/` URL) | S | Med (existing installs; verify HACS downloads the whole `dist/`) | Fresh HACS install on a test HA serves `/hacsfiles/jam-cards/fonts/*.woff2` |
| R9 | Harness look matrix (below) | S-M | Low | `pw-node preview/shoot.js` green for every look |
| R10 | First look: **LCARS**, the cheapest strong test (flat, 27 KB font, radii + case + elbows), then NERV, Transit, Braun, Pulsar/Grid, Olympia, New Wave/Depth (`fx`-gated) | L per look (M for Transit/Grid) | Med | Contact sheet approved by the user; contrast QA passes per look × mode |

R0-R7 change no visible pixels under Poster. That makes them safe to ship one by one as 0.8.x.

### 3.2 Preview harness (`pw-node preview/shoot.js`)
- `preview/index.html?look=<id>&mode=dark|light` applies `preview/looks.css` (generated, `:root[data-look=...]` blocks)
  and sets `hass.themes` / `selectedTheme` the way HA does.
- shoot.js loops `LOOKS × modes × [390, 1280]`, writing `shots/<look>/<mode>-<width>.png`. A `LOOKS=poster,lcars` env var narrows the loop.
- Checks for every look:
  - page errors;
  - papers fit, faces do not overflow;
  - computed clip equals the kind token;
  - fonts of that look loaded from `fonts/` with no Google request;
  - 44px hit areas and the focus ring visible (from 97-robust);
  - text contrast ≥ 4.5:1 (port jam-home `preview/qa` run.js).
- Poster-only invariants (shoot.js:61-106: ≤ 5-point straight cuts, `CUTS` sizes) run only when `look === poster`.
- Behaviour checks (`preview/checks/*`) keep running on poster dark/1280. They also run once on one non-Poster look, to catch pack CSS that hides or covers controls.
- Kiosk pages (85/87/88/93 at 1024x768 and 961x601) run for every look: the fixed-viewport layouts break first.
- shoot.js writes `shots/looks.html`, a contact sheet (one row per card fixture, one column per look) for review.
- Runtime: about 4 page loads per look (≈ 10-15 s), so roughly 2-3 minutes for 10 looks.

---

## 4. Visual editor support

What HA offers (frontend APIs for custom cards):
- `static getConfigForm()` → `{schema, computeLabel?, computeHelper?, assertConfig?}`. HA renders its own `ha-form`.
  - Selectors: `entity` (domain filter, `multiple`), `text`, `number`, `boolean`, `select` (options, `multiple`,
    `custom_value`), `icon`, `ui_action` (tap/hold/double_tap), `ui_color`.
  - Layout types: `grid` and `expandable`.
  - `assertConfig` throwing sends the user to YAML for configs the form cannot represent.
  - Keys outside the schema are kept, because ha-form spreads the data (verify).
  - Available since HA 2024.11-12; the repo already requires 2024.12.0.
- `object` selector with `fields` + `multiple` (a list of sub-forms). Newer HA; **verify on the user's 2026.10** before
  relying on it in phase 2.
- `static getConfigElement()` returns a custom editor element: `setConfig()`, `hass`, and it fires `config-changed`
  (`bubbles`, `composed`).
  - It can embed `ha-form`, which is lazy-loaded. A known workaround creates a built-in card's editor first.
  - It can embed HA's `hui-card-element-editor` for child cards, which is a private API.
- `static getStubConfig(hass, entities)` gives the card picker a starter config; `customCards[].preview: true` renders a live
  preview from it. HA sets `card.preview = true` inside editor previews. jam-screensaver, jam-popup and jam-kiosk must
  then not open overlays or take the viewport.
- The look needs no editor field: editor previews render in the active theme. `accent` uses a `select` of the hue names
  with `custom_value` (room aliases stay typeable, because they are household-specific).

| Phase | Cards | Editor |
|---|---|---|
| 1. Schema forms as-is | jam-heading, jam-hero (chips via YAML), jam-tile (`tones` via YAML), jam-choice, jam-slider, jam-button (`ui_color` maps onto `JB_COLOR`), jam-gauge (`severity` expandable), jam-fan, jam-weather, jam-graph (entities `multiple`; series names via YAML), jam-alerts, jam-light (main options; whites / presets via YAML), jam-speaker (main options) | `getConfigForm` + `getStubConfig` |
| 1b. Main fields as a form, complex keys kept | jam-media (`more.cards`, `sources` list), jam-house (`alerts`), jam-screensaver (`images`, `now`) | same; `assertConfig` only where a form edit could corrupt a key |
| 2. Object lists | jam-list (rows), jam-panel (rows + `bad`), jam-tabs (tabs), jam-scenes (scenes), jam-hero chips, jam-house alerts, jam-light whites / presets, jam-speaker pinned / speakers, jam-screensaver `now` | `object` selector `fields`/`multiple`; if missing, a small shared `JamListEditor` (ha-form per row + add / remove / reorder) |
| 3. Custom editors | jam-remote (rows grid / sections / commands / actions maps), jam-tv (sources with match + actions, stereo, remote_card), jam-kiosk (dock blocks with sheet cards or actions, now sources), jam-popup (`cards`) | `getConfigElement`; child cards through `hui-card-element-editor` (private, may change) |

- Phase 1 is about 30-60 lines per card (S each, about 1 session for all), plus `preview: true` for all but popup,
  screensaver and kiosk.
- Phase 2 is M.
- Phase 3 is M-L per card. Ship phase 3 last and keep YAML documented as the full reference.
- Add `preview/checks/editors.js`. For each card it calls `getConfigForm()`, validates the selector names, and confirms
  that `getStubConfig(fakeHass)` passes `setConfig`.

---

## 5. Risks and unknowns
1. **Theme variables in shadow roots.**
   - Custom properties inherit through shadow boundaries, so a `:root` theme reaches every card.
   - A view-level `theme:` reaches only that view; body-appended sheets / screensaver depend on the token copy (fixed by
     one `TOKENS` list).
   - Invalid token values silently unset properties.
   - A theme or mode switch reaches cards only through the new `set hass` trigger (1.4).
2. **The hard rules are Poster rules.** DESIGN.md "Hard rules" ban radius, shadows, gradients and natural case. Braun,
   LCARS, Depth and New Wave need them. Proposal:
   - universal for every look: a11y (contrast, 44px, focus ring, aria), textContent only, lifecycle / no leaks, no
     infinite animation or rAF loops on kiosks, the reduced-motion and `JamCards.motion` switches;
   - per look: flat colour, cut corners, uppercase, `steps()`.
   - **Needs the user's OK.**
3. **card-mod dependency.**
   - Only HA's own view tabs use it. Each look duplicates its `card-mod-root`, generated, with `card-mod-theme` = its own name.
   - The rules match HA 2026.10 markup (`ha-tab-group-tab[data-path]`). Room hues use `:has()` and the jam-home `data-path`
     names (living, marissa).
   - Without card-mod the tabs fall back to HA's look in every look.
4. **Echo Show performance** (WebView 139, 1 GB RAM, earlier CPU saturation in echo-show-kiosk logs).
   - Blur, translucency, large shadows and scanline gradients (Depth, New Wave, Braun, NERV) cost every frame and on
     every scroll. They are gated behind `--jam-fx` and the per-card `fx: false`.
   - Adopted stylesheets cut parse cost.
   - A font swap after jam-kiosk measures can misfit the clock until it re-measures.
5. **Font budget and coverage.**
   - Lazy loading keeps the cost per active look (2.5).
   - The NERV kanji subsets cover only the glyphs in the fixed dictionary; entity names in CJK fall back to system fonts.
   - Licences: OFL / Apache, and the licence files ship next to the woff2 files.
6. **HACS packaging.** Moving to `dist/` must keep `/hacsfiles/jam-cards/jam-cards.js` working for existing installs;
   verify that HACS 2.x downloads the whole folder. If fonts 404, looks degrade to their fallback stacks, so nothing breaks.
7. **Per-browser overrides confuse a shared household.** A browser pinned to a theme ignores the global switch. README
   must explain "Backend-selected". `frontend.set_theme` being admin-only is to verify; the automation path avoids the question.
8. **Text fit.** Natural case and wider faces change line breaks. The kiosk layouts (cq-sized clock, 18px floors,
   2-line clamps) and jam-tv/jam-speaker bands are tuned to Londrina. Every look × kiosk size must pass the fit checks.
9. **JamDash reuse is limited to tokens, fonts and motifs.** Its looks are whole Svelte view forks with their own layouts.
   LCARS frames and NERV hex grids do not translate to per-card skins one to one.
10. **Sharing.** Room aliases (`ACCENTS` core.js:331) and the card-mod room tabs name this household's rooms. Looks keep
    working with hue names. A configurable room map is a separate task.
11. **Editors use HA internals.** `ha-form` lazy loading and `hui-card-element-editor` are not public API (phase 3 risk).
12. **Contrast per look.** `shade()` / `textOn()` assume flat opaque faces. Translucent looks (Depth, New Wave) need an
    opaque fallback under `fx: 0`, and the contrast QA must run on the opaque version.

## 6. Decisions needed from the user
1. Which looks, and in what order. The suggested first is LCARS, then NERV and Transit. Depth and New Wave only with `fx` off on kiosks.
2. Re-scope DESIGN.md hard rules to "universal + per look" (5.2).
3. Token source in jam-cards with the theme YAML generated into jam-theme (2.6), or keep jam-theme hand-written.
4. Switch UI: `input_select` + automation only, or also a `jam-looks` picker card.
5. Should the Echo Show / iPad kiosks follow the global look, or stay pinned to Poster?

---

## Progress

User decisions (2026-11-03): first looks are **Braun** and **Olympia** (not LCARS); JamBoard / Poster stays the default;
kiosks follow the global look; the global switch is a Look picker card on Jam Control backed by `input_select` +
automation (later task); the token source lives in jam-cards and generates the jam-theme YAML (2.6); DESIGN.md hard
rules re-scoped into "universal" + "per look (Poster)".

Pixel proof for every step: `JAM_SHOTS=<dir> JAM_BASELINE=<dir> pw-node preview/shoot.js` against a baseline written with
`JAM_BASELINE_WRITE=1` on the commit before the step. The {dark,light}-{390,1280} shots use a fixed clock, and JAM_SHOTS
adds a fixed-clock screensaver set (6 layouts + photos, 961x601, both modes). The `screensaver-*` shots in preview/shots
follow the wall clock and the 87 kiosk sheets read Date.now for media progress, so only those may differ between runs.

- **R0 (done).** Deviation from 2.6: the token source is `tokens/` (registry.mjs, looks/poster.mjs, ha.mjs, index.mjs),
  not `src/looks/`, because src/ is concatenated into the bundle and the theme data (HA keys, card-mod CSS) must not ship
  in jam-cards.js; `src/looks/` stays free for the runtime look packs (R6). `tools/themes.mjs` writes
  `../jam-theme/themes/jamboard.yaml`; the regenerated file equals the hand-written one byte for byte apart from a
  "GENERATED" header line. The HA keys come from a template over the palette with per-mode aliases (ground, primary,
  chrome-* ...; light mode overrides 7 of them); the primary ramp stays a literal list per mode (an OKLCH generator is
  only needed when a new look has no hand-tuned ramp, R10). `bundle.mjs` writes the TOKEN_CSS chunk (BASE_CSS `:host`)
  and `preview/looks.css`; `--check` also checks the theme when ../jam-theme exists. Pixel diff vs 0.7.2: identical, except
  kiosk-sheet-tv-{dark,light}-1024, which differs in 8-9 anti-aliased pixels (±1 per channel on the CLOSE key's cut) in
  some runs of the same code (two runs of the 0.7.2 / R0 code differ from each other the same way): render timing noise of
  that check's screenshot, not a change.
- **R1 (done).** One generated `JAM_TOKENS` list (every registry token + runtime `jam-accent` / `jam-spotify`, exported as
  `JamCards.TOKENS`) replaces `SHEET_TOKENS` and `SS_TOKENS`, so sheets and the screensaver layer now also carry
  alert-text, slab3, paper-dim, s1-s5, the new tokens and `--jam-look`. New colour tokens (all in the Poster theme, same
  value in both modes): `ink-fg`, `ink-dim`, `ink-dim2` (jam-kiosk light-mode dock state, #b4a88f), `band`, `band-fg`,
  `band-dim`, `band-key`, `band-off`, `band-tile`, `plate`, `plate-fg`, and `focus` (optional, default the ochre token; the
  13 focus rings use it). Every CSS hex literal in the cards is now a token; the only hex values left in src/ are the
  generated fallbacks, the Spotify brand dot (`--jam-spotify`) and the colour maths in core.js (`inkOn` / `textOn` /
  `cornerColors`, R4). `lookOf(node)` + `data-look` on every card host (batched per task: one style read for all cards
  connected together), on openSheet's `.pop` and on the jam-screensaver overlay (its body layer re-copies the tokens on a
  look change). `JamBase.set hass` compares `hass.themes` / `hass.selectedTheme` by reference: a change forces a render
  and re-reads the look (jam-alerts, jam-popup and jam-screensaver, which have their own setters, do the same), which
  fixes jam-kiosk's stale light class. New check `preview/checks/96-looks.js`; 97-robust still 0 DOM writes. Theme:
  `jam-look: poster` at the top level and the new colour tokens per mode. Pixel diff vs R0: identical (same caveat).
- **R2 (done).** `paper()` no longer writes an inline `--clip`: `SHAPE_CSS` (built from `CUTS` in BASE_CSS) sets
  `.paper[data-cut=<kind>]{--clip:var(--jam-shape-<kind>, <Poster cut>); --rad:var(--jam-radius-<kind>, 0px)}` and `.face`
  takes `border-radius: var(--rad)`. Every literal polygon outside cutPath is now a kind token with its own Poster
  geometry as the fallback: `chip` (.chip, button.chip::before, screensaver time chip), `strip-end` (.fill, jam-light
  bars / bands / white bars), `pw` (POWER_CSS, jam-tv 44px corner), `tab`, `scene`, `icon` (jam-button square), `pin`
  (music pin tab), `plate` (jam-light label plate), `key-plate` / `chip-plate` (jam-remote outlined keys), `card`
  (jam-light pop-up bars / hue strip / white editor, screensaver bars + photos now label). Geometry that stays literal:
  jam-remote d-pad arrows, arrow marks and OK disc (inline `--clip`, `data-cut=arrow|disc`), the screensaver disc and the
  kiosk lock circle. Shape and radius tokens are optional and the Poster theme sets none of them: a family such as
  `strip-end` has several Poster sizes (8 / 9 / 10 / 12 / 14px), so one theme value would change pixels; unset keeps each
  site's own cut. shoot.js now checks, in every mode / width, that no paper has an inline `--clip` and that each paper's
  computed `--clip` equals its kind token resolved at the paper (and the Poster cut when the look is poster); 96-looks
  sets card / key (+ radius) / chip / strip-end / pw tokens live and checks the computed clip-path / radius, then that the
  Poster cuts come back. Pixel diff vs R1: identical. Harness: the 87 kiosk-sheet pages now use a fixed clock (media
  progress times), and the pixel diff reports the wall-clock `screensaver-*` shots and differences of at most 2 per
  channel (the CLOSE-key anti-aliasing noise) as INFO instead of failing.
  Deferred from 2.2: `jam-pad-<kind>` (done in R3, see there), `jam-border`, `jam-rule-h`, `jam-stripe-w`, `jam-strip-h` (no consumer yet).
- **R3 (done).** Type tokens (registry "type" block, theme top level; Poster sets them, so jamboard.yaml gains 10 keys):
  display `jam-display-weight` / `-case` / `-lead` (factor) / `-scale` (factor) and the optional `jam-display-track` (one
  value for every display site; unset = each site's own -.01em..02em); numerals `jam-num-font` / `jam-num-scale` (optional,
  default the display font / display scale); labels and keys `jam-label-*` / `jam-key-*` weight, case and `-track-scale`
  (factor on each site's tracking). Deviation from 2.2: sizes, leading and label / key tracking are **factors** on each
  site's Poster value instead of one value, because Poster sizes and tracking differ per site (one value would change
  pixels or flatten deliberate per-site tuning); `jam-display-lead` replaces the plan's single .92. Every type literal in
  the 19 files now reads a short name (`--disp-w`, `--disp-case`, `--disp-scale`, `--disp-lead`, `--num-font`,
  `--num-scale`, `--lbl-*`, `--key-*`; roles assigned per rule, see DESIGN "Token reference"); left literal on purpose: body
  text, units, sentence lines, digit counters, two `900 var(--body)` glyph keys, `letter-spacing:0` resets. Kiosk fixes the
  stress look found: jam-speaker shelf names and jam-tv narrow source tiles keep the 18px floor under a smaller scale, and
  jam-kiosk's date line cuts with an ellipsis when a wide face does not fit at phone width. **Stress look**
  (`tokens/looks/stress.mjs`, `harness: true`: looks.css block, no theme file; preview `?look=stress`): mixed case, Archivo
  stack (DejaVu Sans in the container, wider than Archivo), display 700, scale .85, lead 1.12, label / key tracking .4.
  shoot.js checks that it re-types the cards (computed case, weight, size, leading, tracking) and preview/fit.js runs the
  preview page (dark / light x 390 / 1280), jam-kiosk home and the kiosk Music / TV sheets (1024x768, 961x601) and the 6
  screensaver layouts under Poster and under the look: no added face overflow, text spill, sub-18px kiosk text, sheet /
  page scroll or text block outside the viewport (19 checks, all pass; `JAM_FIT_LOOKS=` skips them, review shots
  `look-stress-*.png` go to JAM_SHOTS). Pixel diff vs R2: identical (the only other difference, speaker-kitchen-390 by 1px
  at the progress fill end, is the wall clock: that JAM_SHOTS shot comes from the check page, not a fixed clock).
  **`jam-pad-<kind>`** (deferred from R2, separate commit): the 24 unitless `--p-*:0` in the cards are now `0px`, so `.face`
  pads each side with `max(var(--p-x), var(--pad, 0px))`, `--pad` = `var(--jam-pad-<kind>, 0px)` from SHAPE_CSS (also the
  sheets' safe-area bottom padding). Optional tokens for card / key / chip / hero / sheet / poster, unset in Poster; faces
  with an explicit `padding:0` (art, glyph keys) are not padded. 96-looks raises card / key pads live (a 0px side too) and
  checks the Poster paddings come back. Pixel diff: identical.
- **R4 (done).** Colour maths per look: `textColors(node)` reads the look's text pair from `--on-fg` / `--ink-fg` (sorted
  by luminance; cached by value) and `inkOn` / `textOn` / `cornerColors` / `jamMuReadable` take it as an optional last
  argument (default = the Poster pair, so the exported API keeps working). Deviation from 2.3: not `--ink` / `--paper`,
  because Poster's light mode sets `jam-paper` to #141210 (the hero turns ink), so ink / paper is not a dark / light pair
  in every mode; on-fg ("text on any fill") and ink-fg ("text on ink") are. Wired: jam-light (face text, label plates via
  `textOn().plate`, power corner, pop-up bars, white tiles, kelvin editor, swatch ×), jam-button corner, jam-speaker K1
  panel (the art-colour cache now keeps the raw dominant colour and the panel is made readable at paint time, so a look or
  mode switch needs no re-sampling; the no-art panel is the look's resolved `--violet`). jam-tv's art luminance test is
  unused (`_artTone`, no caller) and look-neutral; `shade()` works on the face itself. Idle-art pool = `jam-art-1..8`
  (optional, per mode; fallback the old 8 tokens). Also added: `jam-rule-h` (5px) and `jam-stripe-w` (6px) (theme, Poster
  sets them), optional `jam-border` on card and sheet faces (`:where(.face)`; a first try on `.face` itself overrode
  `.stripe`'s border-left, which the new check caught). `jam-strip-h` is not added: the 22px strip is `inset:5px 0` in a
  track whose height differs per card (32px, kiosk 48-56px), so one height value would move pixels; a look pack can
  restyle `.strip` (R6). 96-looks: a live --jam-on-fg / --jam-ink-fg pair re-colours textOn / inkOn / cornerColors and
  jam-light faces + corners and comes back; jam-art-3, jam-border (card faces only, keys keep theirs), rule-h and
  stripe-w apply and come back. Pixel diff vs R3: identical (one full run caught tv-source-sheet-390 mid "On now" stamp,
  a 150 ms wait after the tap in 70-tv; three reruns of 00/70-tv on the same code match the baseline: timing, not R4).
  Contrast QA (jam-home preview/qa) not rerun: Poster is pixel-identical, so its findings cannot change.
- Open for R5+: motion literals (R5); data-look is set but no look pack reads it yet (R6). The `preview/checks`
  "now: a new cover is not shown before it has loaded" (93-now-playing) fails in about half the runs on 0.7.2 already
  (the local server serves the cover before the check looks); it is not caused by R0-R2.
- Not part of the token source yet: `../jam-home/preview/index.html` keeps its own copy of the token values (a 6th
  place); it can link `../../jam-cards/preview/looks.css` instead.
