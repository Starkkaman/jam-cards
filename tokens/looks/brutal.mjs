// Brutal: neo-brutalism (Gumroad, the Figma community, 2023-26): loud, honest, tactile, very legible (decided design:
// docs/looks/BRUTAL.md, 2026-11-03). Every card and key is a slab with a 3px border and a HARD offset shadow; a key goes
// down when pressed (translate 4px, the shadow shrinks to 2px); "on" is the room colour filled flat, always with black text.
// The pack (src/looks/brutal.js) draws the borders, shadows, pill switches, fat brightness bars, the kiosk slabs and the
// screensaver; this file holds the tokens.
// Generated outputs: ../jam-theme/themes/jamboard-brutal.yaml (tools/themes.mjs) and the preview/looks.css block
// (tools/bundle.mjs). Edit here, then run node tools/bundle.mjs && node tools/themes.mjs.
//
// Token mapping (the cards keep Poster's token names):
//   - the room fills (brief "Room -> fill"): ochre = yellow #ffde59 (living, the default accent), teal = lime #c6f432
//     (kitchen; also calm / info), blue = cyan #5ce1e6 (master), pink = #ff7ad9 (marissa), violet = #a58bff (music),
//     green = orange #ff9f43 (nerd); red = #ff4d4d (alerts, black text). The same fills in both modes;
//   - slab = the card (#ffffff / #262626); slab2 = off keys, tracks (the paper #fffbea / #303030); slab3 = keys inside
//     sheets; the page ground is the HA ground alias (#fffbea paper / #191919);
//   - line = THE line: borders, hard shadows, rules (#000 / #f5f5f5); fg = ink #111111 / #f5f5f5; on-fg = #000 (black text
//     on every fill, >= 6.4:1 on red, >= 7.7:1 on the six room fills);
//   - paper (hero) = a violet slab with black text in both modes (an ink or white hero would swallow its own border and
//     shadow in one of the modes);
//   - band (jam-tv / jam-speaker text bands, music dock, error strip) = an ink slab with paper text in both modes;
//   - elev-1 = the hard shadow (6px 6px 0 #000 / #f5f5f5), also HA's own card shadow.
// Contrast: dim #4f4b40 / #c2c2c2 (>= 7:1 on the cards and keys); alert TEXT a deeper red #c4161c (light, 6.5:1 on white)
// / #ff8080 (dark); the fills carry black text only.
const BRICOLAGE = '"Bricolage Grotesque", "Helvetica Neue", Arial, sans-serif';
const SNAP = "cubic-bezier(.2,.9,.3,1)"; // snappy: most of the way in the first third, 120 ms with jam-dur .6

export default {
  id: "brutal",
  theme: "Jam Brutal",
  file: "jamboard-brutal.yaml",
  comment: [
    "Jam Brutal: neo-brutalism. White slabs with 3px black borders and hard offset shadows on a paper page, flat saturated",
    "room fills with black text, Bricolage Grotesque 800 for names and numbers, mixed case; keys go down when pressed.",
    "Pairs with the Jam Cards suite (https://github.com/Starkkaman/jam-cards), which reads the --jam-* variables below,",
    "loads Bricolage Grotesque (dist/fonts/) and draws the borders, shadows and pill switches (its look pack,",
    "--jam-look: brutal). Without Jam Cards the stacks fall back to Helvetica/Arial.",
    "Light mode (primary) = #fffbea page, white cards, #000 borders; dark mode = #191919 page, #262626 cards, #f5f5f5 borders.",
    "Rooms: jam-ochre yellow living, jam-teal lime kitchen, jam-blue cyan master, jam-pink marissa, jam-violet music,",
    "jam-green orange nerd; jam-red alerts (black text on every fill).",
  ],
  tokens: {
    "jam-display": BRICOLAGE,
    "jam-body": BRICOLAGE,
    // Names and numbers: Bricolage 800 (the variable font's optical size follows the size: display cuts for big type),
    // mixed case, tight; numbers big.
    "jam-display-weight": "800", "jam-display-case": "none", "jam-display-lead": "1.1", "jam-display-scale": ".8",
    "jam-display-track": "-.02em",
    "jam-num-scale": ".92",
    // Small labels: 700, mixed case, no tracking (the brief's mixed case; no tracked capitals).
    "jam-label-weight": "700", "jam-label-case": "none", "jam-label-track-scale": "0",
    // Keys: 700, mixed case, no tracking.
    "jam-key-weight": "700", "jam-key-case": "none", "jam-key-track-scale": "0",
    // Shape: no cut corners; radius 10px on cards, keys, sheets, the hero and posters; pills 999px.
    "jam-shape-card": "none", "jam-shape-key": "none", "jam-shape-chip": "none", "jam-shape-hero": "none",
    "jam-shape-sheet": "none", "jam-shape-poster": "none", "jam-shape-pw": "none", "jam-shape-strip-end": "none",
    "jam-shape-tab": "none", "jam-shape-scene": "none", "jam-shape-icon": "none", "jam-shape-pin": "none",
    "jam-shape-plate": "none", "jam-shape-key-plate": "none", "jam-shape-chip-plate": "none",
    "jam-radius-card": "10px", "jam-radius-key": "10px", "jam-radius-chip": "999px", "jam-radius-hero": "10px",
    "jam-radius-sheet": "10px", "jam-radius-poster": "10px",
    "jam-rule-h": "6px", "jam-stripe-w": "9px",
    // Motion: snappy (120 ms for the 200 ms motions: x .6), no steps; press = the key goes down 4px (the pack shrinks its
    // shadow from 6px to 2px, so its far edge stays put); the pack's own keyframes: a drop for entrances and sheets, a
    // press-and-release for stamps, no light wash, no spiral flash.
    "jam-dur": ".6", "jam-press": "translate(4px,4px)", "jam-press-from": "translate(4px,4px)",
    "jam-ease-2": SNAP, "jam-ease-3": SNAP, "jam-ease-4": SNAP,
    "jam-kf-enter": "bru-drop", "jam-kf-uncover": "none", "jam-kf-retreat": "none", "jam-kf-stamp": "bru-stamp",
    "jam-kf-shake": "bru-shake", "jam-kf-sheet": "bru-rise", "jam-kf-flash": "none", "jam-kf-ss-cut": "bru-pop",
    "jam-kf-ss-pop": "bru-pop",
    "jam-look": "brutal",
  },
  chrome: [
    ["ha-card-border-radius", "10px"], ["ha-card-box-shadow", "var(--jam-elev-1)"], ["ha-card-border-width", "3px"],
    ["ha-card-border-color", "var(--jam-line)"],
    ["ha-dialog-border-radius", "10px"], ["ha-section-border-radius", "10px"], ["ha-badge-border-radius", "999px"],
    ["ha-border-radius-sm", "6px"], ["ha-border-radius-md", "10px"], ["ha-border-radius-lg", "10px"], ["ha-border-radius-xl", "10px"],
    ["ha-border-radius-2xl", "10px"], ["ha-border-radius-3xl", "10px"], ["ha-border-radius-4xl", "10px"], ["ha-border-radius-5xl", "10px"],
    ["ha-border-radius-6xl", "10px"], ["ha-border-radius-pill", "999px"], ["ha-picture-border-radius", "10px"],
    ["ha-picture-border-radius-sm", "6px"], ["ha-card-features-border-radius", "999px"],
    ["mdc-shape-small", "999px"], ["mdc-shape-medium", "10px"], ["mdc-shape-large", "10px"], ["ha-tile-icon-border-radius", "999px"],
    ["ha-font-family-body", BRICOLAGE],
    ["ha-font-family-heading", BRICOLAGE],
    ["ha-font-family-code", '"JetBrains Mono", Menlo, monospace'],
    ["ha-card-header-font-family", BRICOLAGE],
  ],
  cardModComment: [
    "card-mod reads these two keys from the top level of the theme, so both modes share them; without card-mod they do",
    "nothing. HA 2026.10 (frontend 20260930.x): hui-root's shadow root holds div.toolbar > ha-tab-group >",
    "ha-tab-group-tab[data-path=<view path or index>][active]; the label sits in the tab's ::part(base).",
    "Brutal: every view tab is a bordered pill (3px, the theme's line colour) in Bricolage 700, mixed case; the active tab",
    "is filled with its room colour (black text) and carries a hard 3px offset shadow. Room colours apply only on the Jam",
    "Home dashboard, recognised by its tab set (a group holding both the living and marissa tabs, via :has()); every other",
    "dashboard fills the active tab with the violet default. Undo: delete both card-mod-* keys.",
  ],
  cardModRoot: `
.toolbar > ha-tab-group {
  --ha-tab-indicator-color: transparent;
  --ha-tab-track-color: transparent;
}
.toolbar > ha-tab-group::part(base) {
  height: 100%;
  justify-content: flex-end;
}
.toolbar > ha-tab-group::part(tabs) {
  align-items: center;
  gap: 8px;
  border-bottom: 0;
}
.toolbar > ha-tab-group > ha-tab-group-tab {
  --jam-tab-c: var(--jam-violet, #a58bff);
  height: 36px;
  margin: 0;
  border: 0;
  opacity: 1;
  font-family: "Bricolage Grotesque", "Helvetica Neue", Arial, sans-serif;
  font-size: 0.875rem;
  font-weight: 700;
  letter-spacing: 0;
  text-transform: none;
}
.toolbar > ha-tab-group > ha-tab-group-tab::part(base) {
  box-sizing: border-box;
  height: 100%;
  padding: 0 14px;
  line-height: 1;
  color: var(--app-header-text-color, #111111);
  background: var(--card-background-color, #ffffff);
  border: 3px solid var(--jam-line, #000000);
  border-radius: 999px;
  transition: none;
}
.narrow .toolbar > ha-tab-group > ha-tab-group-tab::part(base) {
  padding: 0 10px;
}
.toolbar > ha-tab-group > ha-tab-group-tab[active]::part(base) {
  color: #000000;
  background: var(--jam-tab-c);
  box-shadow: 3px 3px 0 var(--jam-line, #000000);
}
.toolbar > ha-tab-group:has(> [data-path="living"]):has(> [data-path="marissa"]) > [data-path="living"] {
  --jam-tab-c: var(--jam-ochre, #ffde59);
}
.toolbar > ha-tab-group:has(> [data-path="living"]):has(> [data-path="marissa"]) > [data-path="kitchen"] {
  --jam-tab-c: var(--jam-teal, #c6f432);
}
.toolbar > ha-tab-group:has(> [data-path="living"]):has(> [data-path="marissa"]) > [data-path="master"] {
  --jam-tab-c: var(--jam-blue, #5ce1e6);
}
.toolbar > ha-tab-group:has(> [data-path="living"]):has(> [data-path="marissa"]) > [data-path="marissa"] {
  --jam-tab-c: var(--jam-pink, #ff7ad9);
}
.toolbar > ha-tab-group:has(> [data-path="living"]):has(> [data-path="marissa"]) > [data-path="music"] {
  --jam-tab-c: var(--jam-violet, #a58bff);
}
.toolbar > ha-tab-group:has(> [data-path="living"]):has(> [data-path="marissa"]) > [data-path="nerd"] {
  --jam-tab-c: var(--jam-green, #ff9f43);
}
`.slice(1),
  modes: {
    light: {
      comment: "Jam Brutal palette, light (primary): #fffbea paper page, white cards, #000 borders and shadows",
      tokens: {
        "jam-ink": "#111111", "jam-slab": "#ffffff", "jam-slab2": "#fffbea", "jam-slab3": "#f6efd2",
        "jam-paper": "#a58bff", "jam-paper-fg": "#000000", "jam-paper-dim": "#2a2440",
        "jam-fg": "#111111", "jam-dim": "#4f4b40", "jam-line": "#000000",
        "jam-ochre": "#ffde59", "jam-red": "#ff4d4d", "jam-alert-text": "#c4161c", "jam-teal": "#c6f432", "jam-blue": "#5ce1e6",
        "jam-pink": "#ff7ad9", "jam-violet": "#a58bff", "jam-green": "#ff9f43", "jam-on-fg": "#000000", "jam-shadow": "#000000",
        "jam-s1": "#6a4de8", "jam-s2": "#d6248f", "jam-s3": "#0b8a90", "jam-s4": "#c25e00", "jam-s5": "#4f7d00",
        "jam-ink-fg": "#fffbea", "jam-ink-dim": "#c9c3ad", "jam-ink-dim2": "#d6d0ba",
        "jam-band": "#111111", "jam-band-fg": "#fffbea", "jam-band-dim": "#c9c3ad", "jam-band-key": "#2e2e2e", "jam-band-off": "#7d786a",
        "jam-band-tile": "#2e2e2e", "jam-plate": "#111111", "jam-plate-fg": "#fffbea", "jam-focus": "#2b45ff",
        "jam-art-1": "#ffde59", "jam-art-2": "#ff7ad9", "jam-art-3": "#5ce1e6", "jam-art-4": "#c6f432",
        "jam-art-5": "#a58bff", "jam-art-6": "#ff9f43", "jam-art-7": "#111111", "jam-art-8": "#ffffff",
        "jam-elev-1": "6px 6px 0 #000000",
      },
      ha: {
        ground: "#fffbea", ground2: "{jam-slab}", primary: "{jam-violet}", secondary: "{jam-pink}", faint: "#7d786a",
        "chrome-bg": "#fffbea", "chrome-fg": "{jam-fg}", "chrome-dim": "{jam-dim}", "chrome-accent": "{jam-fg}",
        "header-rule": "3px solid {jam-line}", yellow: "{jam-ochre}", cyan: "{jam-blue}", hair: "#d8d2bc",
        ramp: ["#151221", "#2b2442", "#423866", "#635399", "#a58bff", "#b5a0ff", "#c3b1ff", "#d2c5ff", "#e2daff", "#f1ecff", "#f8f6ff"],
      },
    },
    dark: {
      comment: "Jam Brutal palette, dark: #191919 page, #262626 cards, #f5f5f5 borders and shadows (same fills, black text)",
      tokens: {
        "jam-ink": "#0d0d0d", "jam-slab": "#262626", "jam-slab2": "#303030", "jam-slab3": "#3a3a3a",
        "jam-paper": "#a58bff", "jam-paper-fg": "#000000", "jam-paper-dim": "#2a2440",
        "jam-fg": "#f5f5f5", "jam-dim": "#c2c2c2", "jam-line": "#f5f5f5",
        "jam-ochre": "#ffde59", "jam-red": "#ff4d4d", "jam-alert-text": "#ff8080", "jam-teal": "#c6f432", "jam-blue": "#5ce1e6",
        "jam-pink": "#ff7ad9", "jam-violet": "#a58bff", "jam-green": "#ff9f43", "jam-on-fg": "#000000", "jam-shadow": "#0d0d0d",
        "jam-s1": "#a58bff", "jam-s2": "#ff7ad9", "jam-s3": "#5ce1e6", "jam-s4": "#ff9f43", "jam-s5": "#c6f432",
        "jam-ink-fg": "#f5f5f5", "jam-ink-dim": "#c2c2c2", "jam-ink-dim2": "#d0d0d0",
        "jam-band": "#0d0d0d", "jam-band-fg": "#f5f5f5", "jam-band-dim": "#c2c2c2", "jam-band-key": "#2e2e2e", "jam-band-off": "#7a7a7a",
        "jam-band-tile": "#2e2e2e", "jam-plate": "#0d0d0d", "jam-plate-fg": "#f5f5f5", "jam-focus": "#8c9bff",
        "jam-art-1": "#ffde59", "jam-art-2": "#ff7ad9", "jam-art-3": "#5ce1e6", "jam-art-4": "#c6f432",
        "jam-art-5": "#a58bff", "jam-art-6": "#ff9f43", "jam-art-7": "#0d0d0d", "jam-art-8": "#f5f5f5",
        "jam-elev-1": "6px 6px 0 #f5f5f5",
      },
      ha: {
        ground: "#191919", ground2: "{jam-slab}", primary: "{jam-violet}", secondary: "{jam-pink}", faint: "#8a8a8a",
        "chrome-bg": "#191919", "chrome-fg": "{jam-fg}", "chrome-dim": "{jam-dim}", "chrome-accent": "{jam-ochre}",
        "header-rule": "3px solid {jam-line}", yellow: "{jam-ochre}", cyan: "{jam-blue}", hair: "#4a4a4a",
        ramp: ["#151221", "#2b2442", "#423866", "#635399", "#a58bff", "#b5a0ff", "#c3b1ff", "#d2c5ff", "#e2daff", "#f1ecff", "#f8f6ff"],
      },
    },
  },
};
