// Calm ("Jam Calm"): the calm-instrument look of Jam Design pass 6 + 7 (jam-design mockups/pass7/home-assistant.html on top
// of mockups/pass6/home-assistant.html; HANDOFF.md 2026-11-06, Isaac: "This design looks much better!"). Callsheet's paper
// and navy, Jost + IBM Plex Mono, soft corners, hairline edges, no shadows, one orange per screen (the thing to do now),
// state = colour + shape + word. Lights keep the rocker (branch paddle-off: I / O symbols, mirrored pressed halves, a thin
// lamp-colour band) or the small channel-reveal switch (jam-light `switch: toggle`); everything else that is plainly on /
// off is the small switch, its accent by kind (pass 7 option B: plugs / power blue, air / climate teal, automations
// violet, settings steel) with a per-card `accent` override. The pack (src/looks/calm.js) draws the cards in the mockup's
// own layouts (the "render" look hook). Theme "Jam Calm" (../jam-theme/themes/jamboard-calm.yaml, tools/themes.mjs).
//
// Token mapping (mockup .jh variables -> registry roles):
//   gd (ground) -> jam-ground (page, sheets, kiosk) and the HA ground; pl (panel) -> slab + paper; key -> slab2; key2
//     (pressed key) -> slab3; ln (hairline) -> line; hair (inner rule) -> jam-hair; ink -> fg; dim -> dim; orange -> ochre
//     (the one action; also HA warning); alert -> red, alink -> alert-text; okg (lit power symbol) -> green; ok / warn /
//     wink -> jam-ok / jam-warn / jam-warn-text; walnut -> living (the kiosk's top rule); groove / cap -> jam-groove /
//     jam-cap (faders); seg / segg / dot -> jam-readout / jam-readout-off / jam-dot (purifier); win / wn / wrim ->
//     jam-win / jam-win-off / jam-win-rim (indicator windows: door, remote inputs, a playing grille dot); swoff / swth /
//     swline -> jam-switch-off / -thumb / -rim; the four kind accents -> jam-switch-plug / -climate / -auto / -set.
//   jam-ink stays a DARK ground (veils, label plates, the ink text pair for the colour maths), as in Braun.
//   Ground and panel are the Jam Home mockup's (#efebe2 / #f9f7f2 by day): HANDOFF's Callsheet table says #ece7dd /
//   #f7f4ee and allows apps to shift slightly; the approved Jam Home drawing uses these, so the build matches it.
//   HA primary (its own switches, sliders, badges) = the house blue, not the orange: orange is reserved for the one action.


const JOST = '"Jost", "Futura", "Century Gothic", system-ui, sans-serif';
const MONO = '"IBM Plex Mono", ui-monospace, Menlo, Consolas, monospace';
const SETTLE = "cubic-bezier(.16,1,.3,1)"; // the house settle curve (pass 7: 180 ms switch, 160-220 ms sheets)

export default {
  id: "calm",
  theme: "Jam Calm",
  file: "jamboard-calm.yaml",
  layouts: true, // draws its own card layouts (render hook): checked by preview/checks/99-calm.js + jam-home labs, not shoot.js's look matrix
  comment: [
    "Jam Calm: the calm-instrument look (Jam Design pass 6 + 7). Callsheet paper by day, navy by night; Jost words,",
    "IBM Plex Mono labels and numbers; flat panels with hairline edges and soft corners; no shadows, no glow.",
    "Orange is the one thing to do now (at most one per screen); red is alert. Lights use the rocker or the small",
    "switch; other on / off devices use the small channel-reveal switch, its accent by kind.",
    "Pairs with the Jam Cards suite (https://github.com/Starkkaman/jam-cards), which reads the --jam-* variables below,",
    "loads IBM Plex Mono (dist/fonts/, IBM's files unmodified, SIL OFL 1.1) and draws the Calm cards (its look pack,",
    "--jam-look: calm). Without Jam Cards the stacks fall back to system fonts.",
  ],
  tokens: {
    "jam-display": JOST,
    "jam-body": JOST,
    // Words in Jost 500 mixed case; big numerals (clocks, temperatures) in Jost 300 (pack CSS); small labels in Plex Mono.
    "jam-display-weight": "500", "jam-display-case": "none", "jam-display-lead": "1.15", "jam-display-scale": ".72",
    "jam-display-track": "0em",
    "jam-num-font": JOST, "jam-num-scale": ".8",
    "jam-label-weight": "500", "jam-label-case": "uppercase", "jam-label-track-scale": "1",
    "jam-key-weight": "500", "jam-key-case": "none", "jam-key-track-scale": "0",
    // Shape: no cuts; soft corners (16px cards, 22px sheets, 12px keys, 999px pills), a hairline on cards and sheets.
    "jam-shape-card": "none", "jam-shape-key": "none", "jam-shape-chip": "none", "jam-shape-hero": "none",
    "jam-shape-sheet": "none", "jam-shape-poster": "none", "jam-shape-pw": "none", "jam-shape-strip-end": "none",
    "jam-shape-tab": "none", "jam-shape-scene": "none", "jam-shape-icon": "none", "jam-shape-pin": "none",
    "jam-shape-plate": "none", "jam-shape-key-plate": "none", "jam-shape-chip-plate": "none",
    "jam-radius-card": "16px", "jam-radius-key": "12px", "jam-radius-chip": "12px", "jam-radius-hero": "16px",
    "jam-radius-sheet": "22px", "jam-radius-poster": "12px",
    "jam-border": "1px solid var(--jam-line)",
    "jam-rule-h": "1px", "jam-stripe-w": "1px",
    // Motion: the settle curve, transforms only; press = 1px down; nothing loops. Calm (JamCards.motion = false) and
    // prefers-reduced-motion make every motion instant.
    "jam-dur": "1", "jam-press": "translateY(1px)", "jam-press-from": "translateY(1px)",
    "jam-ease-2": SETTLE, "jam-ease-3": SETTLE, "jam-ease-4": SETTLE,
    "jam-kf-enter": "calm-fade", "jam-kf-print": "calm-press", "jam-kf-uncover": "calm-fade-out",
    "jam-kf-retreat": "calm-fade-out", "jam-kf-stamp": "calm-settle", "jam-kf-shake": "calm-nudge",
    "jam-kf-sheet": "calm-rise", "jam-kf-flash": "calm-fade-out", "jam-kf-ss-cut": "calm-fade",
    "jam-kf-ss-pop": "calm-fade",
    "jam-look": "calm",
  },
  chrome: [
    ["ha-card-border-radius", "16px"], ["ha-card-box-shadow", "none"], ["ha-card-border-width", "1px"],
    ["ha-card-border-color", "var(--jam-line)"],
    ["ha-dialog-border-radius", "22px"], ["ha-section-border-radius", "16px"], ["ha-badge-border-radius", "999px"],
    ["ha-border-radius-sm", "8px"], ["ha-border-radius-md", "12px"], ["ha-border-radius-lg", "16px"], ["ha-border-radius-xl", "16px"],
    ["ha-border-radius-2xl", "22px"], ["ha-border-radius-3xl", "22px"], ["ha-border-radius-4xl", "22px"], ["ha-border-radius-5xl", "22px"],
    ["ha-border-radius-6xl", "22px"], ["ha-border-radius-pill", "999px"], ["ha-picture-border-radius", "12px"],
    ["ha-picture-border-radius-sm", "8px"], ["ha-card-features-border-radius", "12px"],
    ["mdc-shape-small", "12px"], ["mdc-shape-medium", "12px"], ["mdc-shape-large", "16px"], ["ha-tile-icon-border-radius", "12px"],
    ["ha-font-family-body", JOST],
    ["ha-font-family-heading", JOST],
    ["ha-font-family-code", MONO],
    ["ha-card-header-font-family", JOST],
  ],
  cardModComment: [
    "card-mod reads these two keys from the top level of the theme, so both modes share them; without card-mod they do",
    "nothing. HA 2026.10 (frontend 20260930.x): hui-root's shadow root holds div.toolbar > ha-tab-group >",
    "ha-tab-group-tab[data-path=<view path or index>][active]; the label sits in the tab's ::part(base).",
    "Calm: plain Jost text tabs in the dim colour; the active tab is ink with a 2px ink underline (the mockup's room tabs).",
    "Undo: delete both card-mod-* keys.",
  ],
  cardModRoot: `
.toolbar > ha-tab-group {
  --ha-tab-indicator-color: var(--primary-text-color);
  --ha-tab-track-color: transparent;
}
.toolbar > ha-tab-group > ha-tab-group-tab::part(base) {
  font-family: "Jost", system-ui, sans-serif;
  font-weight: 500;
  font-size: 15px;
  letter-spacing: 0;
  text-transform: none;
  color: var(--secondary-text-color);
  padding: 0 10px;
}
.toolbar > ha-tab-group > ha-tab-group-tab[active]::part(base) {
  color: var(--primary-text-color);
}
`,
  modes: {
    light: {
      comment: "Jam Calm, Day: Callsheet paper and navy ink",
      tokens: {
        "jam-ink": "#19202e", "jam-slab": "#f9f7f2", "jam-slab2": "#f1ece2", "jam-slab3": "#e3dbcb",
        "jam-paper": "#f9f7f2", "jam-paper-fg": "#19202e", "jam-paper-dim": "#5b606d",
        "jam-fg": "#19202e", "jam-dim": "#5b606d", "jam-line": "#d6cfbf",
        "jam-ochre": "#ec7c22", "jam-living": "#6b4428", "jam-red": "#ff5a48", "jam-alert-text": "#b3261b", "jam-teal": "#43899a", "jam-blue": "#6780b4",
        "jam-pink": "#b8476f", "jam-violet": "#8f72c0", "jam-green": "#3c8a28", "jam-on-fg": "#1a1206", "jam-shadow": "#d6cfbf",
        "jam-s1": "#ec7c22", "jam-s2": "#43899a", "jam-s3": "#b3261b", "jam-s4": "#8f72c0", "jam-s5": "#3c8a28",
        "jam-ink-fg": "#f9f7f2", "jam-ink-dim": "#a29d8f", "jam-ink-dim2": "#b9b2a2",
        "jam-band": "#f1ece2", "jam-band-fg": "#19202e", "jam-band-dim": "#5b606d", "jam-band-key": "#f9f7f2", "jam-band-off": "#8f8b82",
        "jam-band-tile": "#e3dbcb", "jam-plate": "#19202e", "jam-plate-fg": "#f9f7f2",
        "jam-focus": "#19202e",
        "jam-ground": "#efebe2", "jam-hair": "#e7e1d4", "jam-groove": "#ebe5d8", "jam-cap": "#ffffff",
        "jam-win": "#19202e", "jam-win-off": "#e3dccd", "jam-win-rim": "#19202e55",
        "jam-readout": "#19202e", "jam-readout-off": "#2b3344", "jam-dot": "#cbc2ae",
        "jam-ok": "#7bd651", "jam-warn": "#f2c14e", "jam-warn-text": "#7a5300",
        "jam-switch-off": "#1c2331", "jam-switch-thumb": "#fbf9f4", "jam-switch-rim": "transparent",
        "jam-switch-plug": "#6780b4", "jam-switch-climate": "#43899a", "jam-switch-auto": "#8f72c0", "jam-switch-set": "#71819c",
      },
      ha: {
        ground: "#efebe2", ground2: "{jam-slab}", primary: "{jam-blue}", secondary: "{jam-red}", faint: "#8f8b82",
        "chrome-bg": "#efebe2", "chrome-fg": "{jam-fg}", "chrome-dim": "{jam-dim}", "chrome-accent": "{jam-fg}",
        "header-rule": "1px solid {jam-line}", "on-primary": "#fbf9f4",
        ramp: ["#010727", "#0a183a", "#1c2c50", "#35476c", "#6780b4", "#6780b3", "#8298c6", "#9eb1d8", "#bfceed", "#d9e5fd", "#ecf5ff"],
      },
    },
    dark: {
      comment: "Jam Calm, Night: Callsheet navy and cream ink",
      tokens: {
        "jam-ink": "#0a0e15", "jam-slab": "#161c28", "jam-slab2": "#1d2433", "jam-slab3": "#0a0e15",
        "jam-paper": "#161c28", "jam-paper-fg": "#ece5d3", "jam-paper-dim": "#a29d8f",
        "jam-fg": "#ece5d3", "jam-dim": "#a29d8f", "jam-line": "#2a3244",
        "jam-ochre": "#f08a2c", "jam-living": "#6b4428", "jam-red": "#ff5a48", "jam-alert-text": "#ff8a7a", "jam-teal": "#337b8c", "jam-blue": "#5971a4",
        "jam-pink": "#c45a80", "jam-violet": "#8063b1", "jam-green": "#7bd651", "jam-on-fg": "#1a1206", "jam-shadow": "#06080c",
        "jam-s1": "#f08a2c", "jam-s2": "#4f9aab", "jam-s3": "#ff8a7a", "jam-s4": "#9c84cc", "jam-s5": "#7bd651",
        "jam-ink-fg": "#ece5d3", "jam-ink-dim": "#a29d8f", "jam-ink-dim2": "#b9b2a2",
        "jam-band": "#1d2433", "jam-band-fg": "#ece5d3", "jam-band-dim": "#a29d8f", "jam-band-key": "#161c28", "jam-band-off": "#5c6273",
        "jam-band-tile": "#0a0e15", "jam-plate": "#06080c", "jam-plate-fg": "#ece5d3",
        "jam-focus": "#ece5d3",
        "jam-ground": "#10141d", "jam-hair": "#1c2230", "jam-groove": "#0a0e15", "jam-cap": "#c9c2b0",
        "jam-win": "#06080c", "jam-win-off": "#06080c", "jam-win-rim": "#5c6273",
        "jam-readout": "#06080c", "jam-readout-off": "#171c27", "jam-dot": "#2c3446",
        "jam-ok": "#7bd651", "jam-warn": "#f2c14e", "jam-warn-text": "#f2c14e",
        "jam-switch-off": "#05070b", "jam-switch-thumb": "#ece5d3", "jam-switch-rim": "#2a3244",
        "jam-switch-plug": "#5971a4", "jam-switch-climate": "#337b8c", "jam-switch-auto": "#8063b1", "jam-switch-set": "#64738d",
      },
      ha: {
        ground: "#10141d", ground2: "{jam-slab}", primary: "{jam-blue}", secondary: "{jam-red}", faint: "#5c6273",
        "chrome-bg": "#10141d", "chrome-fg": "{jam-fg}", "chrome-dim": "{jam-dim}", "chrome-accent": "{jam-fg}",
        "header-rule": "1px solid {jam-line}", "on-primary": "#ece5d3",
        ramp: ["#010727", "#0a183a", "#1c2c50", "#35476c", "#5971a4", "#677fb3", "#8298c6", "#9eb1d8", "#bfceed", "#d9e5fd", "#ecf5ff"],
      },
    },
  },
};

