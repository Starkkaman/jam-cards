// Girard: playful modernism after Alexander Girard (Herman Miller textiles, La Fonda del Sol, the Miller House; 1950s-60s)
// (decided design: docs/looks/GIRARD.md, 2026-11-03). Folk warmth on a modernist grid: a bright cream-white page, cards
// framed like textiles (a 6px woven pattern border per room), saturated flat fills, pill keys, Girard's sun / heart / eye /
// bird / diamond motifs, Fraunces (soft, wonky) for names and numbers, Work Sans for everything else. The pack
// (src/looks/girard.js) draws the pattern borders, the motifs, the sun power key and the kiosk / screensaver; this file
// holds the tokens.
// Generated outputs: ../jam-theme/themes/jamboard-girard.yaml (tools/themes.mjs) and the preview/looks.css block
// (tools/bundle.mjs). Edit here, then run node tools/bundle.mjs && node tools/themes.mjs.
//
// Token mapping (the cards keep Poster's token names):
//   - room hues: ochre (living, the default accent) = vermilion, teal (kitchen) = mustard, blue (master) = cobalt, pink
//     (marissa) = pink, violet (music) = magenta, green (nerd) = turquoise; red (alerts) = vermilion too (alerts carry the
//     eye mark, rooms their own motif); olive lives in the series / art palette;
//   - text on a fill: ink on vermilion / mustard / pink / turquoise / olive, white on cobalt / magenta (ink stays under
//     4.5:1 there). on-fg = ink, ink-fg = white, so the R4 colour maths has its dark / light pair; the pack works out the
//     accent's own text colour from the fill (--acc-fg), so a jam-popup's inherited accent gets it right too;
//   - ink = the deep brown-black (veils, bands, plates) in both modes; the page is the HA ground alias (cream-white light,
//     ink dark); slab = the card face (near-white / dark brown), slab2 / slab3 = inner controls (the pack tints keys with
//     the room colour);
//   - paper (jam-hero) = a mustard field with ink text;
//   - art-1..8 = the textile palette (idle art, motifs, pattern borders without a room).
// Contrast deviations from the brief's palette (every text >= 4.5:1, DESIGN universal rules):
//   - vermilion #e8452c -> #ec5236 (ink on #e8452c is 4.24:1, on #ec5236 4.64:1);
//   - dim #6b5446 light / #cbb6a3 dark, alert TEXT #b3261e light / #ff9a80 dark (fills stay vermilion).
const FRAUNCES = '"Fraunces", "Iowan Old Style", Georgia, serif';
const WORK = '"Work Sans", "Helvetica Neue", Arial, sans-serif';
const EASE = "cubic-bezier(.3,.7,.35,1)"; // gentle settle, 200 ms (brief)
const C = {vermilion: "#ec5236", magenta: "#d6336c", mustard: "#e8b028", turquoise: "#1fa5a0", olive: "#7a8f2a",
  cobalt: "#2f5fd0", pink: "#f2a3b8", ink: "#2a1a12", cream: "#fbf6ec", white: "#ffffff"};
// The fills and their fixed partners, the same in both modes.
const FILLS = {
  "jam-ochre": C.vermilion, "jam-red": C.vermilion, "jam-teal": C.mustard, "jam-blue": C.cobalt,
  "jam-pink": C.pink, "jam-violet": C.magenta, "jam-green": C.turquoise, "jam-on-fg": C.ink,
  "jam-s1": C.cobalt, "jam-s2": C.vermilion, "jam-s3": C.mustard, "jam-s4": C.turquoise, "jam-s5": C.magenta,
  "jam-ink": C.ink, "jam-ink-fg": C.white, "jam-ink-dim": "#cbb6a3", "jam-ink-dim2": "#d8c7b6",
  "jam-paper": C.mustard, "jam-paper-fg": C.ink, "jam-paper-dim": "#5a3a10",
  "jam-band": C.ink, "jam-band-fg": C.cream, "jam-band-dim": "#cbb6a3", "jam-band-key": "#4a3324", "jam-band-off": "#8e7563",
  "jam-band-tile": "#3a2619", "jam-plate": C.ink, "jam-plate-fg": C.cream,
  "jam-art-1": C.vermilion, "jam-art-2": C.magenta, "jam-art-3": C.mustard, "jam-art-4": C.turquoise,
  "jam-art-5": C.olive, "jam-art-6": C.cobalt, "jam-art-7": C.pink, "jam-art-8": C.ink,
};

export default {
  id: "girard",
  theme: "Jam Girard",
  file: "jamboard-girard.yaml",
  comment: [
    "Jam Girard: playful modernism after Alexander Girard (Herman Miller textiles, La Fonda del Sol, 1950s-60s): a bright",
    "cream-white page, cards framed like textiles, saturated flat fills, pill keys, sun / heart / eye / bird / diamond motifs,",
    "Fraunces (soft, wonky) for names and numbers, Work Sans for the rest.",
    "Pairs with the Jam Cards suite (https://github.com/Starkkaman/jam-cards), which reads the --jam-* variables below,",
    "loads Fraunces and Work Sans from its dist/fonts/ and draws the pattern borders and motifs (its look pack,",
    "--jam-look: girard). Themes cannot load web fonts: without Jam Cards the stacks fall back to Georgia / Arial.",
    "Light mode (primary) = #fbf6ec page, white faces, ink #2a1a12 text; dark mode = ink page, #3a2619 faces, the same fills.",
    "Room hues: jam-ochre vermilion living, jam-teal mustard kitchen, jam-blue cobalt master, jam-pink marissa, jam-violet",
    "magenta music, jam-green turquoise nerd; jam-red is vermilion (alerts). jam-on-fg = text on the light fills (ink);",
    "cobalt and magenta take white text. jam-alert-text = alert TEXT, >= 4.5:1 on slab/slab2/slab3 in its mode.",
  ],
  tokens: {
    "jam-display": FRAUNCES,
    "jam-body": WORK,
    // Names and big numbers in Fraunces 600 mixed case (soft, wonky: the font file is the SOFT 100 / WONK 1 instance),
    // ~.7x Poster's display size (Fraunces is far wider than Londrina); labels and keys in Work Sans, sentence case.
    "jam-display-weight": "600", "jam-display-case": "none", "jam-display-lead": "1.12", "jam-display-scale": ".7",
    "jam-display-track": "-.01em",
    "jam-num-scale": ".78",
    "jam-label-weight": "500", "jam-label-case": "none", "jam-label-track-scale": ".15",
    "jam-key-weight": "600", "jam-key-case": "none", "jam-key-track-scale": ".1",
    // Shape: square cards (the pattern frame is the edge), pill keys / chips / tabs / scenes (the pack rounds the kinds
    // without a radius token), no cut corners anywhere.
    "jam-shape-card": "none", "jam-shape-key": "none", "jam-shape-chip": "none", "jam-shape-hero": "none",
    "jam-shape-sheet": "none", "jam-shape-poster": "none", "jam-shape-pw": "none", "jam-shape-strip-end": "none",
    "jam-shape-tab": "none", "jam-shape-scene": "none", "jam-shape-icon": "none", "jam-shape-pin": "none",
    "jam-shape-plate": "none", "jam-shape-key-plate": "none", "jam-shape-chip-plate": "none",
    "jam-radius-chip": "999px",
    // Text stays clear of the 6px pattern frame on card / hero / sheet faces.
    "jam-pad-card": "14px", "jam-pad-hero": "16px", "jam-pad-sheet": "16px",
    "jam-rule-h": "6px", "jam-stripe-w": "6px",
    // Motion: gentle, 200 ms, one ease; stamps are a soft pop, no washes / wipes / spiral flash.
    "jam-dur": "1", "jam-press": "scale(.97)", "jam-press-from": "scale(.97)",
    "jam-ease-2": EASE, "jam-ease-3": EASE, "jam-ease-4": EASE,
    "jam-kf-enter": "gi-enter", "jam-kf-print": "gi-press", "jam-kf-uncover": "none", "jam-kf-retreat": "none",
    "jam-kf-stamp": "gi-pop", "jam-kf-shake": "gi-nudge", "jam-kf-sheet": "gi-rise", "jam-kf-flash": "none",
    "jam-kf-ss-cut": "gi-fade", "jam-kf-ss-pop": "gi-fade",
    "jam-look": "girard",
  },
  chrome: [
    ["ha-card-border-radius", "0px"], ["ha-card-box-shadow", "none"], ["ha-card-border-width", "0px"],
    ["ha-dialog-border-radius", "0px"], ["ha-section-border-radius", "0px"], ["ha-badge-border-radius", "999px"],
    ["ha-border-radius-sm", "0px"], ["ha-border-radius-md", "0px"], ["ha-border-radius-lg", "0px"], ["ha-border-radius-xl", "0px"],
    ["ha-border-radius-2xl", "0px"], ["ha-border-radius-3xl", "0px"], ["ha-border-radius-4xl", "0px"], ["ha-border-radius-5xl", "0px"],
    ["ha-border-radius-6xl", "0px"], ["ha-border-radius-pill", "999px"], ["ha-picture-border-radius", "0px"],
    ["ha-picture-border-radius-sm", "0px"], ["ha-card-features-border-radius", "999px"],
    ["ha-box-shadow-s", "none"], ["ha-box-shadow-m", "none"], ["ha-box-shadow-l", "none"], ["dialog-box-shadow", "none"],
    ["mdc-shape-small", "999px"], ["mdc-shape-medium", "0px"], ["mdc-shape-large", "0px"], ["ha-tile-icon-border-radius", "999px"],
    ["ha-font-family-body", WORK],
    ["ha-font-family-heading", FRAUNCES],
    ["ha-font-family-code", '"JetBrains Mono", Menlo, monospace'],
    ["ha-card-header-font-family", FRAUNCES],
  ],
  cardModComment: [
    "card-mod reads these two keys from the top level of the theme, so both modes share them; without card-mod they do",
    "nothing. HA 2026.10 (frontend 20260930.x): hui-root's shadow root holds div.toolbar > ha-tab-group >",
    "ha-tab-group-tab[data-path=<view path or index>][active]; the label sits in the tab's ::part(base).",
    "Girard: Work Sans tabs in sentence case, each over a 6px band in its room colour; the active tab is a pill filled",
    "with that colour (white text on cobalt and magenta, ink on the others). Room colours apply only on the Jam Home",
    "dashboard, recognised by its tab set (a group holding both the living and marissa tabs, via :has()); every other",
    "dashboard keeps the vermilion default. Undo: delete both card-mod-* keys.",
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
  gap: 4px;
  border-bottom: 0;
}
.toolbar > ha-tab-group > ha-tab-group-tab {
  --jam-tab-c: var(--jam-ochre, #ec5236);
  --jam-tab-fg: var(--jam-on-fg, #2a1a12);
  height: 40px;
  margin: 0;
  border: 0;
  opacity: 1;
  font-family: var(--jam-body, "Work Sans", "Helvetica Neue", Arial, sans-serif);
  font-size: 1rem;
  font-weight: 600;
  letter-spacing: 0;
  text-transform: none;
}
.toolbar > ha-tab-group > ha-tab-group-tab::part(base) {
  box-sizing: border-box;
  height: 100%;
  padding: 0 16px;
  line-height: 1;
  color: var(--app-header-text-color, #2a1a12);
  background: transparent;
  border-radius: 999px;
  box-shadow: inset 0 -6px 0 var(--jam-tab-c);
  transition: none;
}
.narrow .toolbar > ha-tab-group > ha-tab-group-tab::part(base) {
  padding: 0 12px;
}
.toolbar > ha-tab-group > ha-tab-group-tab[active]::part(base) {
  color: var(--jam-tab-fg);
  background: var(--jam-tab-c);
  box-shadow: none;
}
.toolbar > ha-tab-group:has(> [data-path="living"]):has(> [data-path="marissa"]) > [data-path="kitchen"] {
  --jam-tab-c: var(--jam-teal, #e8b028);
}
.toolbar > ha-tab-group:has(> [data-path="living"]):has(> [data-path="marissa"]) > [data-path="master"] {
  --jam-tab-c: var(--jam-blue, #2f5fd0);
  --jam-tab-fg: var(--jam-ink-fg, #ffffff);
}
.toolbar > ha-tab-group:has(> [data-path="living"]):has(> [data-path="marissa"]) > [data-path="marissa"] {
  --jam-tab-c: var(--jam-pink, #f2a3b8);
}
.toolbar > ha-tab-group:has(> [data-path="living"]):has(> [data-path="marissa"]) > [data-path="music"] {
  --jam-tab-c: var(--jam-violet, #d6336c);
  --jam-tab-fg: var(--jam-ink-fg, #ffffff);
}
.toolbar > ha-tab-group:has(> [data-path="living"]):has(> [data-path="marissa"]) > [data-path="nerd"] {
  --jam-tab-c: var(--jam-green, #1fa5a0);
}
`.slice(1),
  modes: {
    dark: {
      comment: "Jam Cards palette (dark: ink page, #3a2619 faces, the same saturated fills)",
      tokens: {
        ...FILLS,
        "jam-slab": "#3a2619", "jam-slab2": "#4a3324", "jam-slab3": "#563d2c",
        "jam-fg": C.cream, "jam-dim": "#cbb6a3", "jam-line": "#5e4433",
        "jam-alert-text": "#ff9a80", "jam-shadow": "#1c110b", "jam-focus": C.mustard,
      },
      ha: {
        // Ink page and chrome, a mustard primary (ink text on it), a 6px vermilion header band.
        ground: "{jam-ink}", ground2: "{jam-slab}", primary: "{jam-teal}", secondary: "{jam-ochre}", faint: "#8e7563",
        "chrome-bg": "{jam-ink}", "chrome-fg": "{jam-fg}", "chrome-dim": "{jam-dim}", "chrome-accent": "{jam-teal}",
        "header-rule": "6px solid {jam-ochre}", yellow: "{jam-teal}", cyan: "{jam-green}",
        ramp: ["#050300", "#191001", "#322403", "#553e08", "#e8b028", "#ecbe5e", "#f0c97b", "#f3d395", "#f7e0b6", "#f9eace", "#fdf6ea"],
      },
    },
    light: {
      comment: "Jam Cards palette (light, the primary mode: cream-white page, white faces framed in saturated patterns)",
      tokens: {
        ...FILLS,
        "jam-slab": "#ffffff", "jam-slab2": "#f6efe1", "jam-slab3": "#efe5d2",
        "jam-fg": C.ink, "jam-dim": "#6b5446", "jam-line": "#e6dac6",
        "jam-alert-text": "#b3261e", "jam-shadow": "#e6dac6", "jam-focus": C.cobalt,
      },
      ha: {
        // Cream-white page, a white header and sidebar with ink text, cobalt primary (white text on it), a 6px vermilion
        // header band.
        ground: C.cream, ground2: "{jam-slab2}", primary: "{jam-blue}", secondary: "{jam-ochre}", faint: "#9a8676",
        "on-primary": "{jam-ink-fg}",
        "chrome-bg": "{jam-slab}", "chrome-fg": "{jam-fg}", "chrome-dim": "{jam-dim}", "chrome-accent": "{jam-blue}",
        "header-rule": "6px solid {jam-ochre}", yellow: "{jam-teal}", cyan: "{jam-green}",
        ramp: ["#01030e", "#040f2d", "#0d2254", "#1b3c88", "#2f5fd0", "#547fdb", "#7096e3", "#8dacea", "#b4c9f3", "#d2dff8", "#f2f7ff"],
      },
    },
  },
};
