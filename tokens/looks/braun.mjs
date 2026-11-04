// Braun: after Dieter Rams (T3 radio, ET66 calculator, AB-1 clock). Design brief: docs/looks/BRAUN.md (decided
// 2026-11-03). A warm-white appliance: quiet panels with a hairline and a soft elevation, one orange signal for
// "active / act", toggles instead of power corners, LED dots instead of colour floods (pack CSS + motifs:
// src/looks/braun.js). Theme "Jam Braun" (../jam-theme/themes/jamboard-braun.yaml, tools/themes.mjs).
//
// Token mapping (brief palette -> registry roles):
//   page / view background -> HA ground (primary-background-color); the cards' --jam-ink stays the DARK ground of
//     veils, kiosk ink blocks and label plates (brief "ink" #262626 in light, the anthracite page in dark), so
//     --jam-ink-fg / --jam-on-fg remain a light / dark text pair for the colour maths (textColors, R4).
//   panel -> slab (card face) and paper (hero face: a quiet panel too); panel 2 -> slab2 (keys, tracks); slab3 = one
//     step further for keys inside sheets; hairline -> line; ink -> fg; dim -> dim; signal -> ochre (the default
//     accent, focus ring, primary); ok -> green; alert -> red.
//   Contrast (brief: >= 4.5:1 for all text, both modes) moves three brief values a few steps: dim light #77736b ->
//     #605c54 (4.1:1 on panel), dim dark #9c988f -> #aca89f (4.35:1 on panel 2), and text on the signal is ink, not white
//     (white on #f07d1e is 2.7:1). Alert TEXT is a darker / lighter red (#b32205 / #ff8668), fills keep the brief's red.
// Room hues (teal, blue, pink, violet) keep the Poster values. Colour revision 2026-11-03 (brief "more colour"): the pack
//   (src/looks/braun.js) mixes them, and a light's own colour, into the panel as flat tints and adds the ET66 yellow
//   #e8b12a / olive #6f8f3a key colours as pack constants; no new tokens.
import poster from "./poster.mjs";

const ARCHIVO = '"Archivo", "Helvetica Neue", Arial, sans-serif';
const SMOOTH = "cubic-bezier(.2,.7,.3,1)"; // ease-out, 160-220 ms (brief "Motion")

export default {
  id: "braun",
  theme: "Jam Braun",
  file: "jamboard-braun.yaml",
  comment: [
    "Jam Braun: after Dieter Rams. Warm-white appliance panels, one orange signal, toggles, LED dots, Archivo.",
    "Pairs with the Jam Cards suite (https://github.com/Starkkaman/jam-cards), which reads the --jam-* variables below,",
    "loads Archivo (dist/fonts/) and draws the Braun controls (its look pack, --jam-look: braun). Without Jam Cards the",
    "stacks fall back to Helvetica/Arial.",
    "Light mode = warm white (#e7e3da page, #f2efe8 panels); dark mode = anthracite (#1c1c1a page, #2a2a27 panels).",
    "jam-ochre is the orange signal (accent, focus, primary); Jam Cards adds ET66 yellow keys, olive on-toggles, light-colour",
    "and room-colour tints over the panels (revision 2026-11-03).",
  ],
  tokens: {
    "jam-display": ARCHIVO,
    "jam-body": ARCHIVO,
    // Names 500, mixed case, ~.72x Poster's display size; big numerals 400 (pack CSS) at ~.85x.
    "jam-display-weight": "500", "jam-display-case": "none", "jam-display-lead": "1.18", "jam-display-scale": ".72",
    "jam-display-track": "-.005em",
    "jam-num-scale": ".85",
    // Small labels: 500, uppercase, .06em (Poster .16em x .375).
    "jam-label-weight": "500", "jam-label-case": "uppercase", "jam-label-track-scale": ".375",
    // Keys: mixed case, 500, no tracking.
    "jam-key-weight": "500", "jam-key-case": "none", "jam-key-track-scale": "0",
    // Shape: no cuts anywhere; radius 14px cards, sheets and the hero; 10px posters (inner panels); 999px keys and pills.
    "jam-shape-card": "none", "jam-shape-key": "none", "jam-shape-chip": "none", "jam-shape-hero": "none",
    "jam-shape-sheet": "none", "jam-shape-poster": "none", "jam-shape-pw": "none", "jam-shape-strip-end": "none",
    "jam-shape-tab": "none", "jam-shape-scene": "none", "jam-shape-icon": "none", "jam-shape-pin": "none",
    "jam-shape-plate": "none", "jam-shape-key-plate": "none", "jam-shape-chip-plate": "none",
    "jam-radius-card": "14px", "jam-radius-key": "999px", "jam-radius-chip": "999px", "jam-radius-hero": "14px",
    "jam-radius-sheet": "14px", "jam-radius-poster": "10px",
    "jam-border": "1px solid var(--jam-line)",
    "jam-rule-h": "2px", "jam-stripe-w": "2px",
    // Motion: smooth, never stepped; press = scale .98; the pack's own fade keyframes replace wipes and stamps.
    "jam-dur": "1", "jam-press": "scale(.98)", "jam-press-from": "scale(.98)",
    "jam-ease-2": SMOOTH, "jam-ease-3": SMOOTH, "jam-ease-4": SMOOTH,
    "jam-kf-enter": "braun-enter", "jam-kf-print": "braun-press", "jam-kf-uncover": "braun-fade-out",
    "jam-kf-retreat": "braun-fade-out", "jam-kf-stamp": "braun-settle", "jam-kf-shake": "braun-nudge",
    "jam-kf-sheet": "braun-rise", "jam-kf-flash": "braun-fade-out", "jam-kf-ss-cut": "braun-fade-in",
    "jam-kf-ss-pop": "braun-fade-in",
    "jam-look": "braun",
  },
  chrome: [
    ["ha-card-border-radius", "14px"], ["ha-card-box-shadow", "var(--jam-elev-1)"], ["ha-card-border-width", "1px"],
    ["ha-card-border-color", "var(--jam-line)"],
    ["ha-dialog-border-radius", "14px"], ["ha-section-border-radius", "14px"], ["ha-badge-border-radius", "999px"],
    ["ha-border-radius-sm", "6px"], ["ha-border-radius-md", "10px"], ["ha-border-radius-lg", "14px"], ["ha-border-radius-xl", "14px"],
    ["ha-border-radius-2xl", "14px"], ["ha-border-radius-3xl", "14px"], ["ha-border-radius-4xl", "14px"], ["ha-border-radius-5xl", "14px"],
    ["ha-border-radius-6xl", "14px"], ["ha-border-radius-pill", "999px"], ["ha-picture-border-radius", "10px"],
    ["ha-picture-border-radius-sm", "6px"], ["ha-card-features-border-radius", "999px"],
    ["mdc-shape-small", "999px"], ["mdc-shape-medium", "10px"], ["mdc-shape-large", "14px"], ["ha-tile-icon-border-radius", "999px"],
    ["ha-font-family-body", ARCHIVO],
    ["ha-font-family-heading", ARCHIVO],
    ["ha-font-family-code", '"JetBrains Mono", Menlo, monospace'],
    ["ha-card-header-font-family", ARCHIVO],
  ],
  modes: {
    light: {
      comment: "Jam Braun palette, light (primary): warm white",
      tokens: {
        "jam-ink": "#262626", "jam-slab": "#f2efe8", "jam-slab2": "#e4e0d6", "jam-slab3": "#dcd7cc",
        "jam-paper": "#f2efe8", "jam-paper-fg": "#262626", "jam-paper-dim": "#605c54",
        "jam-fg": "#262626", "jam-dim": "#605c54", "jam-line": "#d6d1c6",
        "jam-ochre": "#f07d1e", "jam-red": "#d9482b", "jam-alert-text": "#b32205", "jam-teal": "#22a39a", "jam-blue": "#4a7be0",
        "jam-pink": "#d24f7c", "jam-violet": "#9b6dd6", "jam-green": "#5f9a4a", "jam-on-fg": "#262626", "jam-shadow": "#c9c4b8",
        "jam-s1": "#d26a12", "jam-s2": "#00879c", "jam-s3": "#c2361a", "jam-s4": "#8a52ad", "jam-s5": "#5f7d1c",
        "jam-ink-fg": "#f2efe8", "jam-ink-dim": "#a8a398", "jam-ink-dim2": "#b9b4a9",
        "jam-band": "#e4e0d6", "jam-band-fg": "#262626", "jam-band-dim": "#605c54", "jam-band-key": "#f2efe8", "jam-band-off": "#a8a398",
        "jam-band-tile": "#d6d1c6", "jam-plate": "#262626", "jam-plate-fg": "#f2efe8",
        "jam-focus": "#f07d1e",
        "jam-elev-1": "0 1px 0 rgba(255,255,255,.7) inset, 0 2px 8px rgba(0,0,0,.08)",
      },
      ha: {
        ground: "#e7e3da", ground2: "{jam-slab}", primary: "{jam-ochre}", secondary: "{jam-red}", faint: "#a8a398",
        "chrome-bg": "#e7e3da", "chrome-fg": "{jam-fg}", "chrome-dim": "{jam-dim}", "chrome-accent": "{jam-fg}",
        "header-rule": "1px solid {jam-line}",
        ramp: ["#1a0700", "#341501", "#522500", "#783902", "#f07d1e", "#ed7b1a", "#fe9142", "#ffaf7d", "#ffd0b3", "#ffe6d7", "#fff2eb"],
      },
    },
    dark: {
      comment: "Jam Braun palette, dark: anthracite",
      tokens: {
        "jam-ink": "#1c1c1a", "jam-slab": "#2a2a27", "jam-slab2": "#34342f", "jam-slab3": "#3d3d38",
        "jam-paper": "#2a2a27", "jam-paper-fg": "#ece9e2", "jam-paper-dim": "#aca89f",
        "jam-fg": "#ece9e2", "jam-dim": "#aca89f", "jam-line": "#3d3d38",
        "jam-ochre": "#f28a2e", "jam-red": "#e5583a", "jam-alert-text": "#ff8668", "jam-teal": "#22a39a", "jam-blue": "#4a7be0",
        "jam-pink": "#e2658f", "jam-violet": "#9b6dd6", "jam-green": "#6fae58", "jam-on-fg": "#1c1c1a", "jam-shadow": "#0e0e0d",
        "jam-s1": "#f28a2e", "jam-s2": "#1f9fb0", "jam-s3": "#d43a1c", "jam-s4": "#a66cc4", "jam-s5": "#7f9b2a",
        "jam-ink-fg": "#ece9e2", "jam-ink-dim": "#aca89f", "jam-ink-dim2": "#b9b5ac",
        "jam-band": "#34342f", "jam-band-fg": "#ece9e2", "jam-band-dim": "#b9b5ac", "jam-band-key": "#2a2a27", "jam-band-off": "#6f6c65",
        "jam-band-tile": "#3d3d38", "jam-plate": "#1c1c1a", "jam-plate-fg": "#ece9e2",
        "jam-focus": "#f28a2e",
        "jam-elev-1": "0 1px 0 rgba(255,255,255,.04) inset, 0 2px 10px rgba(0,0,0,.35)",
      },
      ha: {
        ground: "#1c1c1a", ground2: "{jam-slab}", primary: "{jam-ochre}", secondary: "{jam-red}", faint: "#6f6c65",
        "chrome-bg": "#1c1c1a", "chrome-fg": "{jam-fg}", "chrome-dim": "{jam-dim}", "chrome-accent": "{jam-fg}",
        "header-rule": "1px solid {jam-line}",
        ramp: ["#190800", "#331600", "#4f2701", "#753c00", "#f28a2e", "#e7801f", "#fc9339", "#feb076", "#ffd0af", "#fee6d6", "#fef3eb"],
      },
    },
  },
};
