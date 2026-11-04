// Pulsar: after Peter Saville / Factory Records (Unknown Pleasures 1979, Blue Monday and Power, Corruption & Lies 1983).
// Decided design: docs/looks/PULSAR.md (2026-11-03). A black field and thin white lines (dark is the primary mode), square
// outlined cards, Archivo 300 values and wide-tracked tiny capitals for labels, a 12-colour code (the Blue Monday floppy
// code) instead of icons, stacked ridge lines ("pulse") instead of level bars, and one warm accent for "on" and "needs
// attention". The pack (src/looks/pulsar.js) draws the outlines, ridges, colour codes and the screensaver; this file holds
// the tokens. Generated outputs: ../jam-theme/themes/jamboard-pulsar.yaml (tools/themes.mjs) and the preview/looks.css
// block (tools/bundle.mjs). Edit here, then run node tools/bundle.mjs && node tools/themes.mjs.
//
// Token mapping (the cards keep Poster's token names):
//   - one warm accent: ochre (the default accent) and every room hue (teal, blue, pink, violet, green) and red are the warm
//     colour, so "on" and "needs attention" read the same everywhere; rooms are told apart by their colour code, not a hue;
//   - slab (card face) = the page colour, separated by a 1px rule (`jam-border`); slab2 / slab3 are near-black (dark) /
//     a step darker cream (light) so a control the pack does not outline still has an edge;
//   - ink = black in both modes (sheet veil, label plates, the screensaver field); ink-fg = white (dark) / cream (light), so
//     on-fg / ink-fg stay a dark / light text pair for the colour maths (textColors, R4);
//   - series s1..s5 and art-1..8 come from the 12-colour wheel (graph legends, HA graph colours, code-like idle art).
// Contrast deviations from the brief (every text >= 4.5:1, DESIGN universal rules), measured with preview/contrast.js:
//   - dark dim is #9a9a9a (the brief's rgba(255,255,255,.55) equivalent, 7:1 on black);
//   - light accent fill #c25f28 (brief #b5541f): black text on #b5541f is 4.25:1, on #c25f28 4.96:1; alert TEXT in light is
//     the deep #7d3a0f (the brief accent as text is 3.8:1 on cream).
const ARCHIVO = '"Archivo", "Helvetica Neue", Arial, sans-serif';
const EASE = "cubic-bezier(.25,.1,.25,1)"; // slow fades (brief: 300 ms)

export default {
  id: "pulsar",
  theme: "Jam Pulsar",
  file: "jamboard-pulsar.yaml",
  comment: [
    "Jam Pulsar: after Peter Saville / Factory Records (Unknown Pleasures, Blue Monday). A black field, thin white rules,",
    "wide-tracked tiny capitals, a 12-colour code instead of icons, ridge lines instead of level bars, one warm accent.",
    "Pairs with the Jam Cards suite (https://github.com/Starkkaman/jam-cards), which reads the --jam-* variables below,",
    "loads Archivo from its dist/fonts/ and draws the ridges and colour codes (its look pack, --jam-look: pulsar).",
    "Themes cannot load web fonts: without Jam Cards the stacks fall back to Helvetica/Arial.",
    "Dark mode (primary) = black field, white lines, warm #ffb070; light mode = cream #e7e2d2, black lines, warm #c25f28.",
    "Every room hue (jam-ochre, jam-teal, jam-blue, jam-pink, jam-violet, jam-green) and jam-red are the warm accent.",
    "jam-alert-text = alert TEXT, >= 4.5:1 on slab/slab2/slab3 in its mode.",
  ],
  tokens: {
    "jam-display": ARCHIVO,
    "jam-body": ARCHIVO,
    // Names and values in Archivo 300, mixed case; labels and keys uppercase with very wide tracking (~.35em).
    "jam-display-weight": "300", "jam-display-case": "none", "jam-display-lead": "1.15", "jam-display-scale": ".74",
    "jam-display-track": "0",
    "jam-num-scale": ".86",
    "jam-label-weight": "400", "jam-label-case": "uppercase", "jam-label-track-scale": "2.1",
    "jam-key-weight": "400", "jam-key-case": "uppercase", "jam-key-track-scale": "1",
    // Shape: square, no cut corners; outlined faces (1px rule), 1px rules and stripes.
    "jam-shape-card": "none", "jam-shape-key": "none", "jam-shape-chip": "none", "jam-shape-hero": "none",
    "jam-shape-sheet": "none", "jam-shape-poster": "none", "jam-shape-pw": "none", "jam-shape-strip-end": "none",
    "jam-shape-tab": "none", "jam-shape-scene": "none", "jam-shape-icon": "none", "jam-shape-pin": "none",
    "jam-shape-plate": "none", "jam-shape-key-plate": "none", "jam-shape-chip-plate": "none",
    "jam-border": "1px solid var(--jam-line)",
    "jam-rule-h": "1px", "jam-stripe-w": "1px",
    // Motion: slow fades (~300 ms), no stamps / washes / spiral flash; the code lights square by square (pack CSS).
    "jam-dur": "1.3", "jam-press": "scale(.985)", "jam-press-from": "scale(.985)",
    "jam-ease-2": EASE, "jam-ease-3": EASE, "jam-ease-4": EASE,
    "jam-kf-enter": "pulsar-fade", "jam-kf-print": "pulsar-press", "jam-kf-uncover": "none", "jam-kf-retreat": "none",
    "jam-kf-stamp": "pulsar-stamp", "jam-kf-sheet": "pulsar-fade", "jam-kf-flash": "none",
    "jam-kf-ss-cut": "pulsar-fade", "jam-kf-ss-pop": "pulsar-fade",
    "jam-look": "pulsar",
  },
  chrome: [
    ["ha-card-border-radius", "0px"], ["ha-card-box-shadow", "none"], ["ha-card-border-width", "1px"],
    ["ha-card-border-color", "var(--jam-line)"],
    ["ha-dialog-border-radius", "0px"], ["ha-section-border-radius", "0px"], ["ha-badge-border-radius", "0px"],
    ["ha-border-radius-sm", "0px"], ["ha-border-radius-md", "0px"], ["ha-border-radius-lg", "0px"], ["ha-border-radius-xl", "0px"],
    ["ha-border-radius-2xl", "0px"], ["ha-border-radius-3xl", "0px"], ["ha-border-radius-4xl", "0px"], ["ha-border-radius-5xl", "0px"],
    ["ha-border-radius-6xl", "0px"], ["ha-border-radius-pill", "0px"], ["ha-picture-border-radius", "0px"],
    ["ha-picture-border-radius-sm", "0px"], ["ha-card-features-border-radius", "0px"],
    ["ha-box-shadow-s", "none"], ["ha-box-shadow-m", "none"], ["ha-box-shadow-l", "none"], ["dialog-box-shadow", "none"],
    ["mdc-shape-small", "0px"], ["mdc-shape-medium", "0px"], ["mdc-shape-large", "0px"], ["ha-tile-icon-border-radius", "0px"],
    ["ha-font-family-body", ARCHIVO],
    ["ha-font-family-heading", ARCHIVO],
    ["ha-font-family-code", '"IBM Plex Mono", Menlo, monospace'],
    ["ha-card-header-font-family", ARCHIVO],
  ],
  cardModComment: [
    "card-mod reads these two keys from the top level of the theme, so both modes share them; without card-mod they do",
    "nothing. HA 2026.10 (frontend 20260930.x): hui-root's shadow root holds div.toolbar > ha-tab-group >",
    "ha-tab-group-tab[data-path=<view path or index>][active]; the label sits in the tab's ::part(base).",
    "Pulsar: tiny wide-tracked capitals in the dim text colour; the active tab is the text colour with a 1px rule above it.",
    "Undo: delete both card-mod-* keys.",
  ],
  cardModRoot: `
.toolbar > ha-tab-group {
  --ha-tab-indicator-color: transparent;
  --ha-tab-track-color: transparent;
}
.toolbar > ha-tab-group::part(tabs) {
  gap: 4px;
  border-bottom: 0;
}
.toolbar > ha-tab-group > ha-tab-group-tab {
  margin: 0;
  border: 0;
  opacity: 1;
  font-family: var(--jam-body, "Archivo", "Helvetica Neue", Arial, sans-serif);
  font-size: .72rem;
  font-weight: 400;
  letter-spacing: .3em;
  text-transform: uppercase;
}
.toolbar > ha-tab-group > ha-tab-group-tab::part(base) {
  padding: 0 14px;
  color: var(--secondary-text-color, #9a9a9a);
  background: transparent;
  box-shadow: inset 0 1px 0 transparent;
  transition: none;
}
.toolbar > ha-tab-group > ha-tab-group-tab[active]::part(base) {
  color: var(--primary-text-color, #ffffff);
  box-shadow: inset 0 1px 0 var(--primary-text-color, #ffffff);
}
`.slice(1),
  modes: {
    dark: {
      comment: "Jam Pulsar palette, dark (primary): black field, white lines, one warm accent",
      tokens: {
        "jam-ink": "#000000", "jam-slab": "#000000", "jam-slab2": "#0e0e0e", "jam-slab3": "#161616",
        "jam-paper": "#000000", "jam-paper-fg": "#ffffff", "jam-paper-dim": "#9a9a9a",
        "jam-fg": "#ffffff", "jam-dim": "#9a9a9a", "jam-line": "#3d3d3d",
        "jam-ochre": "#ffb070", "jam-red": "#ffb070", "jam-alert-text": "#ffb070", "jam-teal": "#ffb070", "jam-blue": "#ffb070",
        "jam-pink": "#ffb070", "jam-violet": "#ffb070", "jam-green": "#ffb070", "jam-on-fg": "#000000", "jam-shadow": "#000000",
        "jam-s1": "#2e8fd8", "jam-s2": "#9ec43c", "jam-s3": "#f7a823", "jam-s4": "#ec5a8a", "jam-s5": "#1aa59a",
        "jam-ink-fg": "#ffffff", "jam-ink-dim": "#9a9a9a", "jam-ink-dim2": "#a6a6a6",
        "jam-band": "#000000", "jam-band-fg": "#ffffff", "jam-band-dim": "#9a9a9a", "jam-band-key": "#0e0e0e", "jam-band-off": "#5c5c5c",
        "jam-band-tile": "#0e0e0e", "jam-plate": "#000000", "jam-plate-fg": "#ffffff", "jam-focus": "#ffffff",
        "jam-art-1": "#e5382d", "jam-art-2": "#f7a823", "jam-art-3": "#2aa148", "jam-art-4": "#2e8fd8",
        "jam-art-5": "#6a3fa0", "jam-art-6": "#ec5a8a", "jam-art-7": "#f2d21b", "jam-art-8": "#1aa59a",
      },
      ha: {
        ground: "#000000", ground2: "{jam-slab2}", primary: "{jam-ochre}", secondary: "{jam-ochre}", faint: "#5c5c5c",
        "chrome-bg": "#000000", "chrome-fg": "{jam-fg}", "chrome-dim": "{jam-dim}", "chrome-accent": "{jam-fg}",
        "header-rule": "1px solid {jam-line}", yellow: "#f2d21b", cyan: "#1aa59a",
        ramp: ["#0f0b07", "#241910", "#47311f", "#805838", "#ffb070", "#ffc08d", "#ffcca2", "#ffd8b8", "#ffe7d4", "#fff3ea", "#fff9f5"],
      },
    },
    light: {
      comment: "Jam Pulsar palette, light: cream field, black lines, one warm accent",
      tokens: {
        "jam-ink": "#000000", "jam-slab": "#e7e2d2", "jam-slab2": "#ddd7c4", "jam-slab3": "#d4cdb8",
        "jam-paper": "#e7e2d2", "jam-paper-fg": "#000000", "jam-paper-dim": "#555555",
        "jam-fg": "#000000", "jam-dim": "#555555", "jam-line": "#000000",
        "jam-ochre": "#c25f28", "jam-red": "#c25f28", "jam-alert-text": "#7d3a0f", "jam-teal": "#c25f28", "jam-blue": "#c25f28",
        "jam-pink": "#c25f28", "jam-violet": "#c25f28", "jam-green": "#c25f28", "jam-on-fg": "#000000", "jam-shadow": "#c9c3b0",
        "jam-s1": "#2f4fb1", "jam-s2": "#1f7a3a", "jam-s3": "#a35a00", "jam-s4": "#b6449a", "jam-s5": "#0f7f76",
        "jam-ink-fg": "#e7e2d2", "jam-ink-dim": "#9e9886", "jam-ink-dim2": "#a9a391",
        "jam-band": "#e7e2d2", "jam-band-fg": "#000000", "jam-band-dim": "#555555", "jam-band-key": "#ddd7c4", "jam-band-off": "#8f8a7c",
        "jam-band-tile": "#ddd7c4", "jam-plate": "#000000", "jam-plate-fg": "#e7e2d2", "jam-focus": "#000000",
        "jam-art-1": "#e5382d", "jam-art-2": "#f7a823", "jam-art-3": "#2aa148", "jam-art-4": "#2e8fd8",
        "jam-art-5": "#6a3fa0", "jam-art-6": "#ec5a8a", "jam-art-7": "#f2d21b", "jam-art-8": "#1aa59a",
      },
      ha: {
        ground: "#e7e2d2", ground2: "{jam-slab2}", primary: "{jam-ochre}", secondary: "{jam-ochre}", faint: "#8f8a7c",
        "chrome-bg": "#e7e2d2", "chrome-fg": "{jam-fg}", "chrome-dim": "{jam-dim}", "chrome-accent": "{jam-fg}",
        "header-rule": "1px solid {jam-line}", yellow: "#f2d21b", cyan: "#1aa59a",
        ramp: ["#0c0602", "#1b0d06", "#361b0b", "#613014", "#c25f28", "#ce7f53", "#d79773", "#e1af94", "#edcfbf", "#f6e7df", "#fbf4f0"],
      },
    },
  },
};
