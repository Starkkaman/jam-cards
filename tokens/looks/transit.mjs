// Transit: after Massimo Vignelli + Unimark, the NYC subway signage (1970) and map (1972) (decided design:
// docs/looks/TRANSIT.md, 2026-11-03). Wayfinding: every card is a black platform sign under a double rule, one Helvetica
// style sans (Arimo), coloured route bullets that say what a thing is and where it stands; "service change" (yellow) for
// problems. The pack (src/looks/transit.js) draws the sign rules, the route bullets, the round power bullet, the arrivals
// board screensaver and the "pull in" motion; this file holds the tokens.
// Generated outputs: ../jam-theme/themes/jamboard-transit.yaml (tools/themes.mjs) and the preview/looks.css block
// (tools/bundle.mjs). Edit here, then run node tools/bundle.mjs && node tools/themes.mjs.
//
// Token mapping (the cards keep Poster's token names):
//   - the cards are signs in BOTH modes: slab = the sign (#000 light / #111 dark), fg = white sign text, dim = the sign's
//     muted grey; the page is HA's ground (#fff light / #000 dark) and text that sits on the page itself (jam-heading, the
//     kiosk home) reads HA's primary-text-color / secondary-text-color (theme aliases text / text-dim: #000 / #5b5b5b light,
//     #fff / #9d9d9d dark); HA's own cards are white panels in light mode (aliases card / card2 / hair), so HA's single
//     text colour reads on them and on the page;
//   - room hues are MTA routes: ochre (living, the default accent) = orange, teal (kitchen) = green, blue (master) = blue,
//     pink (marissa) and violet (music) = purple, green (nerd) = lime; red (alerts) = the "service change" yellow (alerts
//     are a yellow diamond + text, never a red fill);
//   - on-fg (text on a route fill) is black: white on orange / lime / green / red stays under 4.5:1; the bullets pick
//     black or white per route (pack); ink = the black of veils, bands and plates, ink-fg white, so on-fg / ink-fg stay a
//     dark / light pair for the colour maths (R4);
//   - art-1..8 = the routes (idle art, motifs).
const ARIMO = '"Arimo", "Helvetica Neue", Helvetica, Arial, sans-serif';
const PULL = "cubic-bezier(.16,.84,.3,1)"; // the "pull in" (brief: 220 ms)
const ROUTES = {red: "#ee352e", orange: "#ff6319", yellow: "#fccc0a", lime: "#6cbe45", green: "#00933c", blue: "#0039a6",
  grey: "#a7a9ac", purple: "#b933ad", brown: "#996633", teal: "#00add0"};
// The sign palette shared by both modes (only the sign face, the page and HA's own surfaces differ).
const SIGN = {
  "jam-paper-fg": "#ffffff", "jam-paper-dim": "#9d9d9d",
  "jam-fg": "#ffffff", "jam-dim": "#9d9d9d",
  "jam-ochre": ROUTES.orange, "jam-red": ROUTES.yellow, "jam-alert-text": ROUTES.yellow, "jam-teal": ROUTES.green, "jam-blue": ROUTES.blue,
  "jam-pink": ROUTES.purple, "jam-violet": ROUTES.purple, "jam-green": ROUTES.lime, "jam-on-fg": "#000000",
  "jam-s1": ROUTES.orange, "jam-s2": ROUTES.teal, "jam-s3": ROUTES.yellow, "jam-s4": ROUTES.lime, "jam-s5": "#d36ccb",
  "jam-ink-fg": "#ffffff", "jam-ink-dim": "#9d9d9d", "jam-ink-dim2": "#b3b3b3",
  "jam-band-fg": "#ffffff", "jam-band-dim": "#9d9d9d", "jam-band-key": "#262626", "jam-band-off": "#6b6b6b",
  "jam-band-tile": "#262626", "jam-plate": "#000000", "jam-plate-fg": "#ffffff", "jam-focus": ROUTES.yellow,
  "jam-art-1": ROUTES.red, "jam-art-2": ROUTES.orange, "jam-art-3": ROUTES.yellow, "jam-art-4": ROUTES.lime,
  "jam-art-5": ROUTES.green, "jam-art-6": ROUTES.blue, "jam-art-7": ROUTES.purple, "jam-art-8": ROUTES.grey,
};

export default {
  id: "transit",
  theme: "Jam Transit",
  file: "jamboard-transit.yaml",
  comment: [
    "Jam Transit: after Massimo Vignelli + Unimark's New York City subway signage (1970) and map (1972). Every card is a",
    "black platform sign under a double rule, one Helvetica style sans (Arimo), coloured route bullets; yellow \"service",
    "change\" for problems.",
    "Pairs with the Jam Cards suite (https://github.com/Starkkaman/jam-cards), which reads the --jam-* variables below,",
    "loads Arimo from its dist/fonts/ and draws the signs and bullets (its look pack, --jam-look: transit). Without Jam Cards",
    "the stacks fall back to Helvetica/Arial.",
    "Light mode = white page, black signs (Jam Cards), white HA cards with black text; dark mode = black page, #111 signs.",
    "Routes (MTA): jam-ochre orange living, jam-teal green kitchen, jam-blue master, jam-pink / jam-violet purple marissa /",
    "music, jam-green lime nerd; jam-red is the service-change yellow (alerts). jam-on-fg = text on route fills (black).",
  ],
  tokens: {
    "jam-display": ARIMO,
    "jam-body": ARIMO,
    // Names 700 mixed case (signage bold), ~.72x Poster's display size; numerals 400 tabular (pack CSS); labels and keys
    // in sentence case without tracking.
    "jam-display-weight": "700", "jam-display-case": "none", "jam-display-lead": "1.16", "jam-display-scale": ".72",
    "jam-display-track": "-.01em",
    "jam-num-scale": ".85",
    "jam-label-weight": "400", "jam-label-case": "none", "jam-label-track-scale": "0",
    "jam-key-weight": "700", "jam-key-case": "none", "jam-key-track-scale": "0",
    // Shape: square corners, no cut corners (every kind's clip-path none, radius 0), no border (the sign rule is the edge).
    "jam-shape-card": "none", "jam-shape-key": "none", "jam-shape-chip": "none", "jam-shape-hero": "none",
    "jam-shape-sheet": "none", "jam-shape-poster": "none", "jam-shape-pw": "none", "jam-shape-strip-end": "none",
    "jam-shape-tab": "none", "jam-shape-scene": "none", "jam-shape-icon": "none", "jam-shape-pin": "none",
    "jam-shape-plate": "none", "jam-shape-key-plate": "none", "jam-shape-chip-plate": "none",
    "jam-rule-h": "4px", "jam-stripe-w": "4px",
    // Motion: rows pull in (8px slide + fade, 220 ms); no stamps, washes or spiral flash.
    "jam-dur": "1", "jam-press": "none", "jam-press-from": "translateY(1px)",
    "jam-ease-2": PULL, "jam-ease-3": PULL, "jam-ease-4": PULL,
    "jam-kf-enter": "transit-pull", "jam-kf-print": "transit-press", "jam-kf-uncover": "none", "jam-kf-retreat": "none",
    "jam-kf-stamp": "transit-pull", "jam-kf-shake": "transit-nudge", "jam-kf-sheet": "transit-rise", "jam-kf-flash": "none",
    "jam-kf-ss-cut": "transit-fade", "jam-kf-ss-pop": "transit-pull",
    "jam-look": "transit",
  },
  chrome: [
    ["ha-card-border-radius", "0px"], ["ha-card-box-shadow", "none"], ["ha-card-border-width", "1px"],
    ["ha-dialog-border-radius", "0px"], ["ha-section-border-radius", "0px"], ["ha-badge-border-radius", "999px"],
    ["ha-border-radius-sm", "0px"], ["ha-border-radius-md", "0px"], ["ha-border-radius-lg", "0px"], ["ha-border-radius-xl", "0px"],
    ["ha-border-radius-2xl", "0px"], ["ha-border-radius-3xl", "0px"], ["ha-border-radius-4xl", "0px"], ["ha-border-radius-5xl", "0px"],
    ["ha-border-radius-6xl", "0px"], ["ha-border-radius-pill", "999px"], ["ha-picture-border-radius", "0px"],
    ["ha-picture-border-radius-sm", "0px"], ["ha-card-features-border-radius", "0px"],
    ["ha-box-shadow-s", "none"], ["ha-box-shadow-m", "none"], ["ha-box-shadow-l", "none"], ["dialog-box-shadow", "none"],
    ["mdc-shape-small", "0px"], ["mdc-shape-medium", "0px"], ["mdc-shape-large", "0px"], ["ha-tile-icon-border-radius", "999px"],
    ["ha-font-family-body", ARIMO],
    ["ha-font-family-heading", ARIMO],
    ["ha-font-family-code", '"JetBrains Mono", Menlo, monospace'],
    ["ha-card-header-font-family", ARIMO],
  ],
  cardModComment: [
    "card-mod reads these two keys from the top level of the theme, so both modes share them; without card-mod they do",
    "nothing. HA 2026.10 (frontend 20260930.x): hui-root's shadow root holds div.toolbar > ha-tab-group >",
    "ha-tab-group-tab[data-path=<view path or index>][active]; the label sits in the tab's ::part(base).",
    "Transit: Arimo tabs in sentence case on the black header (a sign), each over a 4px route rule; the active tab is a",
    "white plate with black text. Route colours apply only on the Jam Home dashboard, recognised by its tab set (a group",
    "holding both the living and marissa tabs, via :has()); every other dashboard keeps the orange default.",
    "Undo: delete both card-mod-* keys.",
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
  align-items: flex-end;
  gap: 4px;
  border-bottom: 0;
}
.toolbar > ha-tab-group > ha-tab-group-tab {
  --jam-tab-c: var(--jam-ochre, #ff6319);
  height: 48px;
  margin: 0;
  border: 0;
  opacity: 1;
  font-family: var(--jam-display, "Arimo", "Helvetica Neue", Helvetica, Arial, sans-serif);
  font-size: 1.0625rem;
  font-weight: 700;
  letter-spacing: 0;
  text-transform: none;
}
.toolbar > ha-tab-group > ha-tab-group-tab::part(base) {
  box-sizing: border-box;
  height: 100%;
  padding: 0 14px;
  line-height: 1;
  color: var(--app-header-text-color, #ffffff);
  background: transparent;
  border-bottom: 4px solid var(--jam-tab-c);
  transition: none;
}
.narrow .toolbar > ha-tab-group > ha-tab-group-tab::part(base) {
  padding: 0 10px;
}
.toolbar > ha-tab-group > ha-tab-group-tab[active]::part(base) {
  color: #000000;
  background: #ffffff;
}
.toolbar > ha-tab-group:has(> [data-path="living"]):has(> [data-path="marissa"]) > [data-path="kitchen"] {
  --jam-tab-c: var(--jam-teal, #00933c);
}
.toolbar > ha-tab-group:has(> [data-path="living"]):has(> [data-path="marissa"]) > [data-path="master"] {
  --jam-tab-c: var(--jam-blue, #0039a6);
}
.toolbar > ha-tab-group:has(> [data-path="living"]):has(> [data-path="marissa"]) > [data-path="marissa"] {
  --jam-tab-c: var(--jam-pink, #b933ad);
}
.toolbar > ha-tab-group:has(> [data-path="living"]):has(> [data-path="marissa"]) > [data-path="music"] {
  --jam-tab-c: var(--jam-violet, #b933ad);
}
`.slice(1),
  modes: {
    dark: {
      comment: "Jam Cards palette (dark: #000 page, #111 signs)",
      tokens: {
        ...SIGN,
        "jam-ink": "#000000", "jam-slab": "#111111", "jam-slab2": "#262626", "jam-slab3": "#333333",
        "jam-paper": "#111111", "jam-line": "#333333", "jam-shadow": "#000000", "jam-band": "#111111",
      },
      ha: {
        // Black page, #111 cards and black chrome with a hairline; the "teal-ish" route as HA's primary (black text on it).
        ground: "#000000", ground2: "{jam-slab}", primary: "#00add0", secondary: "{jam-ochre}", faint: "#6b6b6b",
        "chrome-bg": "#000000", "chrome-fg": "#ffffff", "chrome-dim": "{jam-dim}", "chrome-accent": "#ffffff",
        "header-rule": "1px solid #333333", yellow: "#fccc0a", cyan: "#00add0", red: "#ee352e",
        ramp: ["#000608", "#001418", "#00252c", "#004552", "#00add0", "#00b9de", "#3cc6e8", "#76d3ee", "#aee4f5", "#d6f2fa", "#ebf8fd"],
      },
    },
    light: {
      comment: "Jam Cards palette (light: white page, black signs)",
      tokens: {
        ...SIGN,
        "jam-ink": "#000000", "jam-slab": "#000000", "jam-slab2": "#262626", "jam-slab3": "#333333",
        "jam-paper": "#000000", "jam-line": "#333333", "jam-shadow": "#d6d6d6", "jam-band": "#000000",
      },
      ha: {
        // White page, a black sign header and sidebar; HA's own cards are white panels with a hairline and black text
        // (one text colour has to read on HA's cards and on its page); blue primary with white text on it.
        ground: "#ffffff", ground2: "#f2f2f2", primary: "{jam-blue}", secondary: "{jam-ochre}", faint: "#8a8a8a",
        text: "#000000", "text-dim": "#5b5b5b", card: "#ffffff", card2: "#f2f2f2", hair: "#d6d6d6", "on-primary": "#ffffff",
        error: "#c8102e", red: "#ee352e",
        "chrome-bg": "#000000", "chrome-fg": "#ffffff", "chrome-dim": "#b3b3b3", "chrome-accent": "#ffffff",
        "header-rule": "none", yellow: "#fccc0a", cyan: "#00add0",
        ramp: ["#000308", "#000c1f", "#001a3d", "#002a66", "#0039a6", "#3d63c4", "#6382d4", "#8aa2e0", "#b6c6ee", "#dce4f7", "#eef2fb"],
      },
    },
  },
};
