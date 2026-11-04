// Grid: after Wim Crouwel (the New Alphabet, 1967, and the Stedelijk Museum posters). Decided design: docs/looks/GRID.md
// (2026-11-03). Everything sits on one visible square grid: white (light) / black (dark) ground with a 1px grid every
// 24px, square faces with a 1px ink hairline, Hanken Grotesk in mixed case, one signal colour (orange-red) for "on",
// active and alerts, a secondary blue for selection and links, big numbers built from grid cells (the pack's numerals,
// src/looks/grid.js). Theme "Jam Grid" (../jam-theme/themes/jamboard-grid.yaml, tools/themes.mjs).
//
// Token mapping (the cards keep Poster's token names):
//   - one signal colour: every hue token (ochre = the default accent, teal, blue, pink, violet, green, red) is the signal,
//     so every room's "on" / active fill is the signal and on-fg (black) reads on all of them (5.2:1 light, 6.3:1 dark;
//     white on the signal is 4.0:1 / 3.3:1, too low for small text). The secondary blue is the focus token (focus ring,
//     selection, links, the calm / info tone in the pack CSS);
//   - ink = the dark ground of veils and label plates (#000 in both modes), ink-fg = white, so on-fg / ink-fg stay a dark /
//     light pair for the colour maths (textColors, R4). The page ground is the HA ground alias (#fff light, #000 dark) and
//     the grid lines are the `lovelace-bg` alias (two repeating 1px linear-gradients: the one allowed gradient use);
//   - line = the grid colour (#d2d2d2 / #343434): rules, off marks, the empty brightness cells; card faces carry the 1px
//     ink hairline (jam-border = the text colour);
//   - slab2 / slab3 = a step of grey under keys and tracks (keys are also outlined by the pack); paper (hero) = the ink face
//     inverted (black in light mode, white in dark), as Crouwel's black / white posters;
//   - bands (tv / speaker text band, music dock, On now stamp, error strip) = the card face with ink text.
// Contrast deviations from the brief (every text >= 4.5:1): red TEXT is #c4300f in light mode (the signal is 4.0:1 on
// white; fills keep #e8401c); the dark-mode dim is the mockup's #9b9b9b (the brief gives no dark muted); slab3 #ececec is
// the darkest grey where the muted #6a6a6a still reaches 4.5:1.
const HANKEN = '"Hanken Grotesk", "Helvetica Neue", Arial, sans-serif';
/* The page grid: two repeating 1px lines every 24px over the ground (HA lovelace-background accepts a background value). */
const gridBg = (line, ground) =>
  `linear-gradient(${line} 1px, transparent 1px) 0 0 / 24px 24px, linear-gradient(90deg, ${line} 1px, transparent 1px) 0 0 / 24px 24px, ${ground}`;

export default {
  id: "grid",
  theme: "Jam Grid",
  file: "jamboard-grid.yaml",
  comment: [
    "Jam Grid: after Wim Crouwel (New Alphabet, Stedelijk posters). One visible square grid behind the dashboard, square",
    "faces with a 1px ink hairline, Hanken Grotesk in mixed case, one signal colour, big numbers built from grid cells.",
    "Pairs with the Jam Cards suite (https://github.com/Starkkaman/jam-cards), which reads the --jam-* variables below,",
    "loads Hanken Grotesk from its dist/fonts/ and draws the cell numerals (its look pack, --jam-look: grid). Without Jam",
    "Cards the stacks fall back to Helvetica/Arial.",
    "Light mode (primary) = white ground with a #d2d2d2 grid every 24px, black ink; dark mode = black ground, #343434 grid.",
    "Every room hue is the signal (#e8401c / #ff4b26: on, active, alerts); jam-focus is the secondary blue (selection,",
    "links, focus). jam-on-fg = text on the signal. jam-alert-text = alert TEXT, >= 4.5:1 on slab/slab2/slab3 in its mode.",
  ],
  tokens: {
    "jam-display": HANKEN,
    "jam-body": HANKEN,
    // Names / display 500, mixed case; big numbers are cell numerals (pack), small numbers stay Hanken 500.
    "jam-display-weight": "500", "jam-display-case": "none", "jam-display-lead": "1.15", "jam-display-scale": ".74",
    "jam-display-track": "0",
    "jam-num-scale": ".82", // small numbers (kiosk volume 22px x .82) keep the 18px kiosk floor
    // Labels: mixed case, 500, small tracking (.16em x .4 ~ the mockup's .06em); keys: mixed case, 500, a little tracking.
    "jam-label-weight": "500", "jam-label-case": "none", "jam-label-track-scale": ".4",
    "jam-key-weight": "500", "jam-key-case": "none", "jam-key-track-scale": ".25",
    // Shape: square, no cut corners (every kind's clip-path none, radius 0), a 1px ink hairline on card / sheet faces.
    "jam-shape-card": "none", "jam-shape-key": "none", "jam-shape-chip": "none", "jam-shape-hero": "none",
    "jam-shape-sheet": "none", "jam-shape-poster": "none", "jam-shape-pw": "none", "jam-shape-strip-end": "none",
    "jam-shape-tab": "none", "jam-shape-scene": "none", "jam-shape-icon": "none", "jam-shape-pin": "none",
    "jam-shape-plate": "none", "jam-shape-key-plate": "none", "jam-shape-chip-plate": "none",
    "jam-border": "1px solid var(--jam-fg)",
    "jam-rule-h": "4px", "jam-stripe-w": "4px",
    // Motion: none, except the numerals rebuilding cell by cell (pack JS). Every keyframe off, no press transform.
    "jam-dur": "1", "jam-press": "none", "jam-press-from": "none",
    "jam-kf-enter": "none", "jam-kf-print": "none", "jam-kf-uncover": "none", "jam-kf-retreat": "none", "jam-kf-stamp": "none",
    "jam-kf-shake": "none", "jam-kf-sheet": "none", "jam-kf-flash": "none", "jam-kf-ss-cut": "none", "jam-kf-ss-pop": "none",
    "jam-look": "grid",
  },
  chrome: [
    ["ha-card-border-radius", "0px"], ["ha-card-box-shadow", "none"], ["ha-card-border-width", "1px"],
    ["ha-card-border-color", "var(--jam-fg)"],
    ["ha-dialog-border-radius", "0px"], ["ha-section-border-radius", "0px"], ["ha-badge-border-radius", "0px"],
    ["ha-border-radius-sm", "0px"], ["ha-border-radius-md", "0px"], ["ha-border-radius-lg", "0px"], ["ha-border-radius-xl", "0px"],
    ["ha-border-radius-2xl", "0px"], ["ha-border-radius-3xl", "0px"], ["ha-border-radius-4xl", "0px"], ["ha-border-radius-5xl", "0px"],
    ["ha-border-radius-6xl", "0px"], ["ha-border-radius-pill", "0px"], ["ha-picture-border-radius", "0px"],
    ["ha-picture-border-radius-sm", "0px"], ["ha-card-features-border-radius", "0px"],
    ["ha-box-shadow-s", "none"], ["ha-box-shadow-m", "none"], ["ha-box-shadow-l", "none"], ["dialog-box-shadow", "none"],
    ["mdc-shape-small", "0px"], ["mdc-shape-medium", "0px"], ["mdc-shape-large", "0px"], ["ha-tile-icon-border-radius", "0px"],
    ["ha-font-family-body", HANKEN],
    ["ha-font-family-heading", HANKEN],
    ["ha-font-family-code", '"JetBrains Mono", Menlo, monospace'],
    ["ha-card-header-font-family", HANKEN],
  ],
  cardModComment: [
    "card-mod reads these two keys from the top level of the theme, so both modes share them; without card-mod they do",
    "nothing. HA 2026.10 (frontend 20260930.x): hui-root's shadow root holds div.toolbar > ha-tab-group >",
    "ha-tab-group-tab[data-path=<view path or index>][active]; the label sits in the tab's ::part(base).",
    "Grid: Hanken Grotesk tabs in mixed case, square, two grid modules tall with a 1px hairline; the active tab is filled with",
    "the signal (black text). Undo: delete both card-mod-* keys.",
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
  gap: 0;
  border-bottom: 0;
}
.toolbar > ha-tab-group > ha-tab-group-tab {
  height: 48px;
  margin: 0;
  border: 0;
  opacity: 1;
  font-family: var(--jam-display, "Hanken Grotesk", "Helvetica Neue", Arial, sans-serif);
  font-size: 1rem;
  font-weight: 500;
  letter-spacing: .01em;
  text-transform: none;
}
.toolbar > ha-tab-group > ha-tab-group-tab::part(base) {
  box-sizing: border-box;
  height: 100%;
  padding: 0 16px;
  line-height: 1;
  color: var(--app-header-text-color, #000000);
  background: transparent;
  box-shadow: inset 0 0 0 1px var(--jam-line, #d2d2d2);
  transition: none;
}
.narrow .toolbar > ha-tab-group > ha-tab-group-tab::part(base) {
  padding: 0 12px;
}
.toolbar > ha-tab-group > ha-tab-group-tab[active]::part(base) {
  color: var(--jam-on-fg, #000000);
  background: var(--jam-ochre, #e8401c);
  box-shadow: none;
}
`.slice(1),
  modes: {
    light: {
      comment: "Jam Grid palette, light (the primary mode): white ground with a #d2d2d2 grid, black ink",
      tokens: {
        "jam-ink": "#000000", "jam-slab": "#ffffff", "jam-slab2": "#f2f2f2", "jam-slab3": "#ececec",
        "jam-paper": "#000000", "jam-paper-fg": "#ffffff", "jam-paper-dim": "#9b9b9b",
        "jam-fg": "#000000", "jam-dim": "#6a6a6a", "jam-line": "#d2d2d2",
        "jam-ochre": "#e8401c", "jam-red": "#e8401c", "jam-alert-text": "#c4300f", "jam-teal": "#e8401c", "jam-blue": "#e8401c",
        "jam-pink": "#e8401c", "jam-violet": "#e8401c", "jam-green": "#e8401c", "jam-on-fg": "#000000", "jam-shadow": "#d2d2d2",
        "jam-s1": "#000000", "jam-s2": "#e8401c", "jam-s3": "#1d3c9a", "jam-s4": "#6a6a6a", "jam-s5": "#6d8cf0",
        "jam-ink-fg": "#ffffff", "jam-ink-dim": "#9b9b9b", "jam-ink-dim2": "#b4b4b4",
        "jam-band": "#ffffff", "jam-band-fg": "#000000", "jam-band-dim": "#6a6a6a", "jam-band-key": "#f2f2f2", "jam-band-off": "#a0a0a0",
        "jam-band-tile": "#f2f2f2", "jam-plate": "#000000", "jam-plate-fg": "#ffffff", "jam-focus": "#1d3c9a",
      },
      ha: {
        ground: "#ffffff", ground2: "{jam-slab2}", primary: "{jam-ochre}", secondary: "{jam-focus}", faint: "#a0a0a0",
        "chrome-bg": "#ffffff", "chrome-fg": "{jam-fg}", "chrome-dim": "{jam-dim}", "chrome-accent": "{jam-focus}",
        "header-rule": "1px solid {jam-fg}", yellow: "{jam-ochre}", cyan: "{jam-focus}",
        "lovelace-bg": gridBg("#d2d2d2", "#ffffff"),
        ramp: ["#1f0500", "#3d0c02", "#5c1405", "#8a2009", "#e8401c", "#ee6a4c", "#f28a72", "#f6a998", "#f9c8bd", "#fce3dd", "#fef1ee"],
      },
    },
    dark: {
      comment: "Jam Grid palette, dark: black ground with a #343434 grid, white ink",
      tokens: {
        "jam-ink": "#000000", "jam-slab": "#000000", "jam-slab2": "#141414", "jam-slab3": "#1c1c1c",
        "jam-paper": "#ffffff", "jam-paper-fg": "#000000", "jam-paper-dim": "#6a6a6a",
        "jam-fg": "#ffffff", "jam-dim": "#9b9b9b", "jam-line": "#343434",
        "jam-ochre": "#ff4b26", "jam-red": "#ff4b26", "jam-alert-text": "#ff4b26", "jam-teal": "#ff4b26", "jam-blue": "#ff4b26",
        "jam-pink": "#ff4b26", "jam-violet": "#ff4b26", "jam-green": "#ff4b26", "jam-on-fg": "#000000", "jam-shadow": "#000000",
        "jam-s1": "#ffffff", "jam-s2": "#ff4b26", "jam-s3": "#6d8cf0", "jam-s4": "#9b9b9b", "jam-s5": "#3d5fd0",
        "jam-ink-fg": "#ffffff", "jam-ink-dim": "#9b9b9b", "jam-ink-dim2": "#b4b4b4",
        "jam-band": "#000000", "jam-band-fg": "#ffffff", "jam-band-dim": "#9b9b9b", "jam-band-key": "#141414", "jam-band-off": "#5a5a5a",
        "jam-band-tile": "#141414", "jam-plate": "#000000", "jam-plate-fg": "#ffffff", "jam-focus": "#6d8cf0",
      },
      ha: {
        ground: "#000000", ground2: "{jam-slab2}", primary: "{jam-ochre}", secondary: "{jam-focus}", faint: "#5a5a5a",
        "chrome-bg": "#000000", "chrome-fg": "{jam-fg}", "chrome-dim": "{jam-dim}", "chrome-accent": "{jam-focus}",
        "header-rule": "1px solid {jam-fg}", yellow: "{jam-ochre}", cyan: "{jam-focus}",
        "lovelace-bg": gridBg("#343434", "#000000"),
        ramp: ["#200500", "#3f0d03", "#601707", "#8f240c", "#ff4b26", "#ff6e50", "#ff8d75", "#ffab9a", "#ffc9bd", "#ffe3dd", "#fff1ee"],
      },
    },
  },
};
