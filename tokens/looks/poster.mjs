// Poster: the default look (Saul Bass cut paper). Its dark mode is the cards' built-in fallback, so a value changed here
// changes every install without the theme. Theme name "JamBoard" stays, so browsers that picked it keep working.
// Generated outputs: ../jam-theme/themes/jamboard.yaml (tools/themes.mjs), the BASE_CSS :host fallbacks and
// preview/looks.css (tools/bundle.mjs). Edit here, then run node tools/bundle.mjs && node tools/themes.mjs.
export default {
  id: "poster",
  theme: "JamBoard",
  file: "jamboard.yaml",
  // Theme file header (YAML comments, without "# ").
  comment: [
    "JamBoard: Saul Bass inspired theme (flat colour, square corners, no shadows, heavy uppercase display type).",
    "Pairs with the Jam Cards suite (https://github.com/Starkkaman/jam-cards), which reads the --jam-* variables below",
    "and loads the fonts (Londrina Solid + Jost). Themes cannot load web fonts: without Jam Cards the stacks fall back",
    "to Helvetica/Arial and Arial Black/Impact.",
    "Dark mode = \"ink\" (#141210 ground, paper text); light mode = \"paper\" (#ece2c9 ground, ink text).",
    "Every Home Assistant key below is read by the current HA frontend (checked against home-assistant/frontend dev,",
    "2026-10-26). Graphs use jam-s1..s5 (graph-color-1..5); HA's own palette takes over from the 6th series.",
    "Room hues: jam-ochre living, jam-teal kitchen, jam-blue master, jam-pink marissa, jam-violet music, jam-green nerd;",
    "jam-red is for alerts only. jam-on-fg = text on filled accents. HA's named colours (blue-color etc.) map to these hues.",
    "jam-alert-text = red text (bad values, \"unavailable\", \"N/A\"): a text-safe red, >= 4.5:1 on slab/slab2/slab3 in its mode.",
    "No shadows anywhere in HA's UI; jam-shadow stays defined for older Jam Cards but the theme no longer uses it.",
  ],
  // Theme-level tokens (registry scope "theme"), same in both modes.
  tokens: {
    "jam-display": '"Londrina Solid", "Arial Black", Impact, sans-serif',
    "jam-body": '"Jost", "Helvetica Neue", Arial, sans-serif',
    "jam-look": "poster",
  },
  // Home Assistant chrome keys at the theme's top level (both modes), in file order; the theme-level tokens follow them.
  chrome: [
    ["ha-card-border-radius", "0px"], ["ha-card-box-shadow", "none"], ["ha-card-border-width", "0px"],
    ["ha-dialog-border-radius", "0px"], ["ha-section-border-radius", "0px"], ["ha-badge-border-radius", "0px"],
    ["ha-border-radius-sm", "0px"], ["ha-border-radius-md", "0px"], ["ha-border-radius-lg", "0px"], ["ha-border-radius-xl", "0px"],
    ["ha-border-radius-2xl", "0px"], ["ha-border-radius-3xl", "0px"], ["ha-border-radius-4xl", "0px"], ["ha-border-radius-5xl", "0px"],
    ["ha-border-radius-6xl", "0px"], ["ha-border-radius-pill", "0px"], ["ha-picture-border-radius", "0px"],
    ["ha-picture-border-radius-sm", "0px"], ["ha-card-features-border-radius", "0px"],
    ["ha-box-shadow-s", "none"], ["ha-box-shadow-m", "none"], ["ha-box-shadow-l", "none"], ["dialog-box-shadow", "none"],
    ["mdc-shape-small", "0px"], ["mdc-shape-medium", "0px"], ["mdc-shape-large", "0px"], ["ha-tile-icon-border-radius", "0px"],
    ["ha-font-family-body", '"Jost", "Helvetica Neue", Arial, sans-serif'],
    ["ha-font-family-heading", '"Londrina Solid", "Arial Black", Impact, sans-serif'],
    ["ha-font-family-code", '"JetBrains Mono", Menlo, monospace'],
    ["ha-card-header-font-family", '"Londrina Solid", "Arial Black", Impact, sans-serif'],
  ],
  // Dashboard view tabs (card-mod 4.x): comment above the keys, and the CSS card-mod puts into hui-root.
  cardModComment: [
    "card-mod reads these two keys from the top level of the theme, so both modes share them; without card-mod they do",
    "nothing. HA 2026.10 (frontend 20260930.x): hui-root's shadow root holds div.toolbar > ha-tab-group >",
    "ha-tab-group-tab[data-path=<view path or index>][active]; the label sits in the tab's ::part(base).",
    "In edit mode HA moves the tabs into div.tab-bar, which these rules leave alone.",
    "Room hues apply only on the Jam Home dashboard, recognised by its tab set (a group holding both the living and",
    "marissa tabs, via :has()); every other dashboard keeps the ochre default. Undo: delete both card-mod-* keys.",
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
  --jam-tab-c: var(--jam-ochre, #e5a31b);
  height: 48px;
  margin: 0;
  border: 0;
  opacity: 1;
  font-family: var(--jam-display, "Londrina Solid", "Arial Black", Impact, sans-serif);
  font-size: 1.125rem;
  font-weight: 900;
  letter-spacing: 0.04em;
  text-transform: uppercase;
}
.toolbar > ha-tab-group > ha-tab-group-tab::part(base) {
  box-sizing: border-box;
  height: 100%;
  padding: 0 16px;
  line-height: 1;
  color: var(--app-header-text-color, #ece2c9);
  background: transparent;
  border-bottom: 4px solid var(--jam-tab-c);
  clip-path: polygon(0 0, calc(100% - 8px) 0, 100% 8px, 100% 100%, 0 100%);
  transition: none;
}
.narrow .toolbar > ha-tab-group > ha-tab-group-tab::part(base) {
  padding: 0 12px;
}
.toolbar > ha-tab-group > ha-tab-group-tab[active]::part(base) {
  color: var(--jam-on-fg, #141210);
  background: var(--jam-tab-c);
}
.toolbar > ha-tab-group:has(> [data-path="living"]):has(> [data-path="marissa"]) > [data-path="kitchen"] {
  --jam-tab-c: var(--jam-teal, #22a39a);
}
.toolbar > ha-tab-group:has(> [data-path="living"]):has(> [data-path="marissa"]) > [data-path="master"] {
  --jam-tab-c: var(--jam-blue, #4a7be0);
}
.toolbar > ha-tab-group:has(> [data-path="living"]):has(> [data-path="marissa"]) > [data-path="marissa"] {
  --jam-tab-c: var(--jam-pink, #e2658f);
}
.toolbar > ha-tab-group:has(> [data-path="living"]):has(> [data-path="marissa"]) > [data-path="music"] {
  --jam-tab-c: var(--jam-violet, #9b6dd6);
}
`.slice(1),
  modes: {
    dark: {
      comment: "Jam Cards palette",
      // Registry scope "mode" tokens.
      tokens: {
        "jam-ink": "#141210", "jam-slab": "#1f1c19", "jam-slab2": "#2a2622", "jam-slab3": "#35302a",
        "jam-paper": "#ece2c9", "jam-paper-fg": "#141210", "jam-paper-dim": "#5c5446",
        "jam-fg": "#ece2c9", "jam-dim": "#9a8f7c", "jam-line": "#34302a",
        "jam-ochre": "#e5a31b", "jam-red": "#e0553b", "jam-alert-text": "#ff8a6e", "jam-teal": "#22a39a", "jam-blue": "#4a7be0",
        "jam-pink": "#e2658f", "jam-violet": "#9b6dd6", "jam-green": "#86a83a", "jam-on-fg": "#141210", "jam-shadow": "#0a0908",
        "jam-s1": "#bd8000", "jam-s2": "#1f9fb0", "jam-s3": "#d43a1c", "jam-s4": "#a66cc4", "jam-s5": "#7f9b2a",
        "jam-ink-fg": "#ece2c9", "jam-ink-dim": "#9a8f7c", "jam-ink-dim2": "#b4a88f",
        "jam-band": "#141210", "jam-band-fg": "#ece2c9", "jam-band-dim": "#9a8f7c", "jam-band-key": "#36312b", "jam-band-off": "#6b6152",
        "jam-band-tile": "#2c2824", "jam-plate": "#141210", "jam-plate-fg": "#ece2c9",
      },
      // Home Assistant keys (tokens/ha.mjs): aliases over the defaults, and the primary ramp 05..95.
      ha: {
        ramp: ["#1e1100", "#392500", "#4f3500", "#7c5500", "#e5a31b", "#e09e0d", "#ecaa28", "#fcb93e", "#ffd89a", "#ffecd0", "#fff6e8"],
      },
    },
    light: {
      comment: "Jam Cards palette (paper ground; the hero slab turns ink)",
      tokens: {
        "jam-ink": "#141210", "jam-slab": "#f6efdd", "jam-slab2": "#e9dfc4", "jam-slab3": "#ddd1b3",
        "jam-paper": "#141210", "jam-paper-fg": "#ece2c9", "jam-paper-dim": "#9a8f7c",
        "jam-fg": "#141210", "jam-dim": "#6b6152", "jam-line": "#d3c7a8",
        "jam-ochre": "#d99410", "jam-red": "#e0553b", "jam-alert-text": "#a12a14", "jam-teal": "#22a39a", "jam-blue": "#4a7be0",
        "jam-pink": "#d24f7c", "jam-violet": "#9b6dd6", "jam-green": "#6d8f22", "jam-on-fg": "#141210", "jam-shadow": "#c9bb98",
        "jam-s1": "#a86e00", "jam-s2": "#00879c", "jam-s3": "#c2361a", "jam-s4": "#8a52ad", "jam-s5": "#5f7d1c",
        "jam-ink-fg": "#ece2c9", "jam-ink-dim": "#9a8f7c", "jam-ink-dim2": "#b4a88f",
        "jam-band": "#141210", "jam-band-fg": "#ece2c9", "jam-band-dim": "#9a8f7c", "jam-band-key": "#36312b", "jam-band-off": "#6b6152",
        "jam-band-tile": "#2c2824", "jam-plate": "#141210", "jam-plate-fg": "#ece2c9",
      },
      ha: {
        // Paper ground with an ink header and sidebar; red primary (ink text on it).
        ground: "#ece2c9", ground2: "{jam-slab2}", primary: "{jam-red}", secondary: "{jam-ochre}",
        "chrome-fg": "{jam-ink-fg}", "chrome-dim": "{jam-ink-dim}", "chrome-accent": "#e5a31b",
        ramp: ["#2c0300", "#510a00", "#6f1200", "#ab2100", "#e0553b", "#ff8269", "#ff9781", "#ffb09e", "#ffd2c8", "#ffeae5", "#fff4f2"],
      },
    },
  },
};
