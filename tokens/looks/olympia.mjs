// Olympia: after Otl Aicher's design for the Munich Olympics, 1972 (decided design: docs/looks/OLYMPIA.md, 2026-11-03).
// A light ground, square faces with a 1px hairline, thin lowercase Albert Sans, and the Munich spectrum as flat fields and
// stripes. There is no red: alerts and the "red" token are orange. The pack (src/looks/olympia.js) draws the 4px top
// stripes, the square power button, the 6px strips, the spectrum motifs and the screensaver; this file holds the tokens.
// Generated outputs: ../jam-theme/themes/jamboard-olympia.yaml (tools/themes.mjs) and the preview/looks.css block
// (tools/bundle.mjs). Edit here, then run node tools/bundle.mjs && node tools/themes.mjs.
//
// Token mapping (the cards keep Poster's token names):
//   - room hues map onto the spectrum: ochre (living, the default accent) = yellow, teal (kitchen) = green, blue (master)
//     = blue, pink (marissa) = light blue, violet (music) = blue, green (nerd) = green; red (alerts) = its own vermilion
//     #f0503c (design review 2026-11-04: the alert was the same #f08c33 orange as living and warm lamps; navy text 4.7:1),
//     always drawn with the orange / face hatch by the pack as a non-colour cue; alert TEXT #a8261a light / #ff8a73 dark;
//   - ink = the dark "ink" of the look (navy): sheet veil, text plates, dark fixed surfaces; ink-fg = white. The page ground
//     is the HA ground alias (#f4f6f7 light / the ink in dark), as Poster's light mode does;
//   - band = the card face (the tv / speaker text sits on the card under its art, as in the approved mockup; keys on it
//     are face 2), not an ink band;
//   - art-1..8 = the spectrum (idle art, motifs); the pack reads art-4 (yellow) and art-6 (silver) for its stripes.
// Contrast deviations from the brief's palette (every text >= 4.5:1, DESIGN universal rules), measured in preview/contrast.js:
//   - text on spectrum fills (on-fg) is the deep navy #10202b in both modes: neither white (3.4:1 / 3.1:1) nor #1f3b4d
//     (3.4:1 / 3.7:1) reaches 4.5:1 on blue / green, #10202b does (4.8:1 / 5.3:1); so the primary key's text is navy too;
//   - light dim is #52697a (brief #6b8291: 4.0:1 on white, 3.4:1 on face 2);
//   - alert TEXT is a dark vermilion (#a8261a light, 6.0:1 on face 2) / a light one (#ff8a73 dark, 4.8:1 on slab3).
const ALBERT = '"Albert Sans", "Helvetica Neue", Arial, sans-serif';
const EASE = "cubic-bezier(.45,0,.55,1)"; // calm ease-in-out (brief: 200-260 ms ease-in-out)

export default {
  id: "olympia",
  theme: "Jam Olympia",
  file: "jamboard-olympia.yaml",
  comment: [
    "Jam Olympia: after Otl Aicher's Munich 1972 design (a light ground, square faces with a hairline, thin lowercase",
    "Albert Sans, the Munich spectrum as flat fields and stripes; alerts in their own vermilion, hatched).",
    "Pairs with the Jam Cards suite (https://github.com/Starkkaman/jam-cards), which reads the --jam-* variables below",
    "and loads Albert Sans from its dist/fonts/. Themes cannot load web fonts: without Jam Cards the stacks fall back",
    "to Helvetica/Arial.",
    "Light mode (primary) = #f4f6f7 ground, white faces, navy ink text; dark mode = #10202b ground, #172b38 faces.",
    "Room hues on the spectrum: jam-ochre (yellow) living, jam-teal (green) kitchen, jam-blue master, jam-pink (light blue)",
    "marissa, jam-violet (blue) music, jam-green nerd; jam-red is a vermilion used only for alerts (hatched by Jam Cards).",
    "jam-on-fg = text on spectrum fills.",
    "jam-alert-text = alert TEXT, >= 4.5:1 on slab/slab2/slab3 in its mode.",
  ],
  tokens: {
    "jam-display": ALBERT,
    "jam-body": ALBERT,
    "jam-display-weight": "400", "jam-display-case": "lowercase", "jam-display-lead": "1.1", "jam-display-scale": ".87",
    "jam-label-weight": "400", "jam-label-case": "lowercase", "jam-label-track-scale": ".15",
    "jam-key-weight": "500", "jam-key-case": "lowercase", "jam-key-track-scale": ".15",
    // Shape: square corners, no cut corners (every kind's clip-path none, radius 0), a 1px hairline on card / sheet faces.
    "jam-shape-card": "none", "jam-shape-key": "none", "jam-shape-chip": "none", "jam-shape-hero": "none",
    "jam-shape-sheet": "none", "jam-shape-poster": "none", "jam-shape-pw": "none", "jam-shape-strip-end": "none",
    "jam-shape-tab": "none", "jam-shape-scene": "none", "jam-shape-icon": "none", "jam-shape-pin": "none",
    "jam-shape-plate": "none", "jam-shape-key-plate": "none", "jam-shape-chip-plate": "none",
    "jam-border": "1px solid var(--jam-line)",
    "jam-rule-h": "4px", "jam-stripe-w": "4px",
    // Motion: calm and smooth, ease-in-out; stripes slide in, no stamps (the stamp / wash keyframes are off).
    "jam-dur": "1.15", "jam-press": "scale(.98)", "jam-press-from": "scale(.98)",
    "jam-ease-2": EASE, "jam-ease-3": EASE, "jam-ease-4": EASE,
    "jam-kf-enter": "jam-oly-enter", "jam-kf-stamp": "none", "jam-kf-uncover": "none", "jam-kf-retreat": "none",
    "jam-kf-sheet": "jam-oly-sheet", "jam-kf-flash": "none", "jam-kf-ss-cut": "jam-oly-fade", "jam-kf-ss-pop": "jam-oly-fade",
    "jam-look": "olympia",
  },
  chrome: [
    ["ha-card-border-radius", "0px"], ["ha-card-box-shadow", "none"], ["ha-card-border-width", "1px"],
    ["ha-dialog-border-radius", "0px"], ["ha-section-border-radius", "0px"], ["ha-badge-border-radius", "0px"],
    ["ha-border-radius-sm", "0px"], ["ha-border-radius-md", "0px"], ["ha-border-radius-lg", "0px"], ["ha-border-radius-xl", "0px"],
    ["ha-border-radius-2xl", "0px"], ["ha-border-radius-3xl", "0px"], ["ha-border-radius-4xl", "0px"], ["ha-border-radius-5xl", "0px"],
    ["ha-border-radius-6xl", "0px"], ["ha-border-radius-pill", "0px"], ["ha-picture-border-radius", "0px"],
    ["ha-picture-border-radius-sm", "0px"], ["ha-card-features-border-radius", "0px"],
    ["ha-box-shadow-s", "none"], ["ha-box-shadow-m", "none"], ["ha-box-shadow-l", "none"], ["dialog-box-shadow", "none"],
    ["mdc-shape-small", "0px"], ["mdc-shape-medium", "0px"], ["mdc-shape-large", "0px"], ["ha-tile-icon-border-radius", "0px"],
    ["ha-font-family-body", ALBERT],
    ["ha-font-family-heading", ALBERT],
    ["ha-font-family-code", '"JetBrains Mono", Menlo, monospace'],
    ["ha-card-header-font-family", ALBERT],
  ],
  cardModComment: [
    "card-mod reads these two keys from the top level of the theme, so both modes share them; without card-mod they do",
    "nothing. HA 2026.10 (frontend 20260930.x): hui-root's shadow root holds div.toolbar > ha-tab-group >",
    "ha-tab-group-tab[data-path=<view path or index>][active]; the label sits in the tab's ::part(base).",
    "Olympia: lowercase Albert Sans tabs, square, a 4px spectrum underline; the active tab is filled with its colour.",
    "Room hues apply only on the Jam Home dashboard, recognised by its tab set (a group holding both the living and",
    "marissa tabs, via :has()); every other dashboard keeps the orange default. Undo: delete both card-mod-* keys.",
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
  gap: 2px;
  border-bottom: 0;
}
.toolbar > ha-tab-group > ha-tab-group-tab {
  --jam-tab-c: var(--jam-ochre, #f08c33);
  height: 48px;
  margin: 0;
  border: 0;
  opacity: 1;
  font-family: var(--jam-display, "Albert Sans", "Helvetica Neue", Arial, sans-serif);
  font-size: 1.125rem;
  font-weight: 400;
  letter-spacing: 0;
  text-transform: lowercase;
}
.toolbar > ha-tab-group > ha-tab-group-tab::part(base) {
  box-sizing: border-box;
  height: 100%;
  padding: 0 16px;
  line-height: 1;
  color: var(--app-header-text-color, #1f3b4d);
  background: transparent;
  border-bottom: 4px solid var(--jam-tab-c);
  transition: none;
}
.narrow .toolbar > ha-tab-group > ha-tab-group-tab::part(base) {
  padding: 0 12px;
}
.toolbar > ha-tab-group > ha-tab-group-tab[active]::part(base) {
  color: var(--jam-on-fg, #10202b);
  background: var(--jam-tab-c);
}
.toolbar > ha-tab-group:has(> [data-path="living"]):has(> [data-path="marissa"]) > [data-path="kitchen"] {
  --jam-tab-c: var(--jam-teal, #2aa65c);
}
.toolbar > ha-tab-group:has(> [data-path="living"]):has(> [data-path="marissa"]) > [data-path="master"] {
  --jam-tab-c: var(--jam-blue, #3a8fd8);
}
.toolbar > ha-tab-group:has(> [data-path="living"]):has(> [data-path="marissa"]) > [data-path="marissa"] {
  --jam-tab-c: var(--jam-pink, #8fc7e8);
}
.toolbar > ha-tab-group:has(> [data-path="living"]):has(> [data-path="marissa"]) > [data-path="music"] {
  --jam-tab-c: var(--jam-violet, #3a8fd8);
}
`.slice(1),
  modes: {
    dark: {
      comment: "Jam Cards palette (dark: #10202b ground, #172b38 faces)",
      tokens: {
        "jam-ink": "#10202b", "jam-slab": "#172b38", "jam-slab2": "#223a49", "jam-slab3": "#263f4f",
        "jam-paper": "#8fc7e8", "jam-paper-fg": "#10202b", "jam-paper-dim": "#2a4c62",
        "jam-fg": "#e9f1f5", "jam-dim": "#93aab8", "jam-line": "#2c4655",
        "jam-ochre": "#f6c445", "jam-red": "#f0503c", "jam-alert-text": "#ff8a73", "jam-teal": "#34b56a", "jam-blue": "#4a9be0",
        "jam-pink": "#8fc7e8", "jam-violet": "#4a9be0", "jam-green": "#34b56a", "jam-on-fg": "#10202b", "jam-shadow": "#0b1820",
        "jam-s1": "#4a9be0", "jam-s2": "#34b56a", "jam-s3": "#f39a46", "jam-s4": "#f6c445", "jam-s5": "#8fc7e8",
        "jam-ink-fg": "#e9f1f5", "jam-ink-dim": "#93aab8", "jam-ink-dim2": "#a9bcc8",
        "jam-band": "#172b38", "jam-band-fg": "#e9f1f5", "jam-band-dim": "#93aab8", "jam-band-key": "#223a49", "jam-band-off": "#5f7584",
        "jam-band-tile": "#223a49", "jam-plate": "#10202b", "jam-plate-fg": "#e9f1f5", "jam-focus": "#4a9be0",
        "jam-art-1": "#4a9be0", "jam-art-2": "#8fc7e8", "jam-art-3": "#34b56a", "jam-art-4": "#f6c445",
        "jam-art-5": "#f39a46", "jam-art-6": "#5f7584", "jam-art-7": "#e9f1f5", "jam-art-8": "#223a49",
      },
      ha: {
        primary: "{jam-blue}", secondary: "{jam-ochre}", faint: "#5f7584", "chrome-accent": "{jam-blue}", yellow: "#f6c445", cyan: "{jam-pink}",
        ramp: ["#00040b", "#001529", "#002643", "#014878", "#4a9be0", "#6eb2f0", "#85bef2", "#9dccf8", "#c5e2ff", "#e3f1fe", "#f2f8fe"],
      },
    },
    light: {
      comment: "Jam Cards palette (light, the primary mode: #f4f6f7 ground, white faces with a hairline)",
      tokens: {
        "jam-ink": "#1f3b4d", "jam-slab": "#ffffff", "jam-slab2": "#e7edf0", "jam-slab3": "#dde5ea",
        "jam-paper": "#8fc7e8", "jam-paper-fg": "#1f3b4d", "jam-paper-dim": "#2a4c62",
        "jam-fg": "#1f3b4d", "jam-dim": "#52697a", "jam-line": "#d8e1e6",
        "jam-ochre": "#f6c445", "jam-red": "#f0503c", "jam-alert-text": "#a8261a", "jam-teal": "#2aa65c", "jam-blue": "#3a8fd8",
        "jam-pink": "#8fc7e8", "jam-violet": "#3a8fd8", "jam-green": "#2aa65c", "jam-on-fg": "#10202b", "jam-shadow": "#c9d3d9",
        "jam-s1": "#3a8fd8", "jam-s2": "#2aa65c", "jam-s3": "#f08c33", "jam-s4": "#f6c445", "jam-s5": "#8fc7e8",
        "jam-ink-fg": "#ffffff", "jam-ink-dim": "#b9c9d3", "jam-ink-dim2": "#c6d4dc",
        "jam-band": "#ffffff", "jam-band-fg": "#1f3b4d", "jam-band-dim": "#52697a", "jam-band-key": "#e7edf0", "jam-band-off": "#9fb0bb",
        "jam-band-tile": "#e7edf0", "jam-plate": "#1f3b4d", "jam-plate-fg": "#ffffff", "jam-focus": "#3a8fd8",
        "jam-art-1": "#3a8fd8", "jam-art-2": "#8fc7e8", "jam-art-3": "#2aa65c", "jam-art-4": "#f6c445",
        "jam-art-5": "#f08c33", "jam-art-6": "#c9d3d9", "jam-art-7": "#1f3b4d", "jam-art-8": "#e7edf0",
      },
      ha: {
        // Light ground, white header and sidebar with navy text; blue primary (navy text on it).
        ground: "#f4f6f7", ground2: "{jam-slab2}", primary: "{jam-blue}", secondary: "{jam-ochre}", faint: "#9fb0bb",
        "chrome-bg": "{jam-slab}", "chrome-fg": "{jam-fg}", "chrome-dim": "{jam-dim}", "chrome-accent": "{jam-blue}", yellow: "#f6c445", cyan: "{jam-pink}",
        ramp: ["#000104", "#000d1d", "#011d35", "#003d6a", "#3a8fd8", "#6cb2f4", "#83bef6", "#9cccfb", "#c5e2ff", "#e3f1ff", "#f2f8fe"],
      },
    },
  },
};
