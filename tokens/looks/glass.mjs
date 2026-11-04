// Glass: the 2025 "liquid glass" + bento trend (Apple 2025, Linear / Vercel bento grids, Arc). Calm, premium, tactile:
// frosted panes floating over a soft colour field (decided design: docs/looks/GLASS.md, 2026-11-03). Dark mode is the
// primary one. The pack (src/looks/glass.js) draws the panes, the colour field on the kiosk / screensaver, the light glow,
// the thick rounded tracks with a glossy knob and the pills; this file holds the tokens. Effects (the frosted blur, the
// translucent panes, the bright colour field, the glow of a lit light, the glossy knob, the hover lift) sit behind the
// effects switch: `jam-fx: 1` here; a card's `fx: false` (the kiosks: jam-kiosk, jam-screensaver) turns them off: solid
// panes (#182036 / #fbfcff), a dimmer static field, a tinted solid for a lit light.
// Generated outputs: ../jam-theme/themes/jamboard-glass.yaml (tools/themes.mjs) and the preview/looks.css block
// (tools/bundle.mjs). Edit here, then run node tools/bundle.mjs && node tools/themes.mjs.
//
// Token mapping (the cards keep Poster's token names):
//   - ink = the page ground (#0b1020; light mode: the dark ink #0f1424 for the veil, plates and ink blocks, the page is the
//     HA ground alias #eef1f7); slab = the pane's solid fallback (#182036 / #fbfcff, the fx-off face and the colour every
//     contrast is measured on); slab2 / slab3 = deeper panes for keys and tracks (keys inside sheets);
//   - shadow (legacy, read by no card) = the frosted pane fill under fx: rgba(255,255,255,.08) dark / .62 light;
//   - elev-1 = the pane's 1px inner edge + a soft drop shadow (under fx; the pack draws the edge alone with fx off);
//   - the room hues come from the colour field (teal #1fb5a8, violet, amber #ffb44d) plus three more (blue, pink, green);
//     the violet fill is lifted to #8f7aff so ink text on it reaches 5.8:1 (the field's #7c5cff is 4.4:1);
//   - art-1..3 = the field's three colours (teal, violet #7c5cff, amber), art-4..8 the idle-art companions;
//   - band = the deeper pane of the tv / speaker text bands, the music dock and the error strip.
// Contrast (every text >= 4.5:1 on the solid fx-off faces, preview/contrast.js): fg #f4f6fb on #182036 = 15:1, dim #a9b1c6
// 7.5:1 (5.7:1 on slab3); light: fg #0f1424 on #fbfcff 17.9:1, dim #4b536b 7.5:1 (6.0:1 on slab3); ink text on every hue
// fill >= 5.8:1 (on-fg = ink in both modes).
const FIGTREE = '"Figtree", "Helvetica Neue", Arial, sans-serif';
/* The spring of a press / open: a quick ease-out with a small overshoot (about 260 ms with jam-dur 1.2). */
const SPRING = "cubic-bezier(.2,1.25,.35,1)";
/* The colour field: three soft blobs (teal top-left, violet right, amber low) over the ground, as HA's lovelace-background
   (fixed to the viewport). Brightness follows the effects switch: alpha x (1 + jam-fx) / 2, so fx off = half as bright. */
const field = ([t, v, a], ground) => {
  const blob = (c, pct) => `color-mix(in srgb, ${c} calc(${pct}% * (1 + var(--jam-fx, 0)) / 2), transparent)`;
  return [
    `radial-gradient(70vmax 55vmax at 8% 4%, ${blob(t[0], t[1])}, transparent 62%) fixed`,
    `radial-gradient(60vmax 52vmax at 96% 34%, ${blob(v[0], v[1])}, transparent 62%) fixed`,
    `radial-gradient(64vmax 46vmax at 42% 104%, ${blob(a[0], a[1])}, transparent 64%) fixed`,
    ground,
  ].join(", ");
};

export default {
  id: "glass",
  theme: "Jam Glass",
  file: "jamboard-glass.yaml",
  comment: [
    "Jam Glass: liquid glass + bento. Frosted panes floating over a soft colour field (teal, violet, amber), Figtree in",
    "mixed case, big light numbers, rounded bento shapes (28px cards, 18px keys, pills), a lit light glows from inside.",
    "Pairs with the Jam Cards suite (https://github.com/Starkkaman/jam-cards), which reads the --jam-* variables below,",
    "loads Figtree (dist/fonts/) and draws the panes (its look pack, --jam-look: glass). Without Jam Cards the stack falls",
    "back to Helvetica/Arial.",
    "jam-fx: 1 turns the effects on (frosted blur, translucent panes, the bright colour field, light glow, glossy knobs);",
    "set `fx: false` on the kiosk cards (jam-kiosk, jam-screensaver) for weak tablets: solid panes, a dimmer static field.",
    "Dark mode (primary) = #0b1020 page, #182036 solid panes, text #f4f6fb; light mode = #eef1f7 page, white panes, #0f1424.",
  ],
  tokens: {
    "jam-display": FIGTREE,
    "jam-body": FIGTREE,
    // Names: Figtree 600, mixed case, a touch tight; big numbers in the same face, light (the pack sets 300), very large.
    "jam-display-weight": "600", "jam-display-case": "none", "jam-display-lead": "1.16", "jam-display-scale": ".74",
    "jam-display-track": "-.012em",
    "jam-num-scale": ".9",
    // Labels: sentence case, 500, a little air (.16em x .12); keys: mixed case, 600, no tracking.
    "jam-label-weight": "500", "jam-label-case": "none", "jam-label-track-scale": ".12",
    "jam-key-weight": "600", "jam-key-case": "none", "jam-key-track-scale": "0",
    // Shape: bento, no cut corners; radius 28px on cards / hero / sheets, 18px on keys, pills on chips, 22px on posters.
    "jam-shape-card": "none", "jam-shape-key": "none", "jam-shape-chip": "none", "jam-shape-hero": "none",
    "jam-shape-sheet": "none", "jam-shape-poster": "none", "jam-shape-pw": "none", "jam-shape-strip-end": "none",
    "jam-shape-tab": "none", "jam-shape-scene": "none", "jam-shape-icon": "none", "jam-shape-pin": "none",
    "jam-shape-plate": "none", "jam-shape-key-plate": "none", "jam-shape-chip-plate": "none",
    "jam-radius-card": "28px", "jam-radius-key": "18px", "jam-radius-chip": "999px", "jam-radius-hero": "28px",
    "jam-radius-sheet": "28px", "jam-radius-poster": "22px",
    "jam-pad-card": "14px", "jam-pad-hero": "18px", "jam-pad-sheet": "20px",
    "jam-rule-h": "3px", "jam-stripe-w": "3px",
    // Motion: spring-like ease-out, ~260 ms (Poster's 60-240 ms x 1.2); press = scale .97; no washes, wipes or spiral.
    "jam-dur": "1.2", "jam-press": "scale(.97)", "jam-press-from": "scale(.97)",
    "jam-ease-2": SPRING, "jam-ease-3": SPRING, "jam-ease-4": SPRING,
    "jam-kf-enter": "gl-enter", "jam-kf-uncover": "none", "jam-kf-retreat": "none", "jam-kf-stamp": "gl-pop",
    "jam-kf-sheet": "gl-sheet", "jam-kf-flash": "none", "jam-kf-ss-cut": "gl-fade", "jam-kf-ss-pop": "gl-fade",
    // Effects on (desktop / phone); kiosks opt out per card with `fx: false`.
    "jam-fx": "1",
    "jam-look": "glass",
  },
  chrome: [
    ["ha-card-border-radius", "28px"], ["ha-card-box-shadow", "var(--jam-elev-1)"], ["ha-card-border-width", "0px"],
    ["ha-dialog-border-radius", "28px"], ["ha-section-border-radius", "28px"], ["ha-badge-border-radius", "999px"],
    ["ha-border-radius-sm", "10px"], ["ha-border-radius-md", "14px"], ["ha-border-radius-lg", "18px"], ["ha-border-radius-xl", "22px"],
    ["ha-border-radius-2xl", "24px"], ["ha-border-radius-3xl", "28px"], ["ha-border-radius-4xl", "28px"], ["ha-border-radius-5xl", "28px"],
    ["ha-border-radius-6xl", "28px"], ["ha-border-radius-pill", "999px"], ["ha-picture-border-radius", "22px"],
    ["ha-picture-border-radius-sm", "14px"], ["ha-card-features-border-radius", "18px"],
    ["mdc-shape-small", "18px"], ["mdc-shape-medium", "22px"], ["mdc-shape-large", "28px"], ["ha-tile-icon-border-radius", "999px"],
    ["ha-font-family-body", FIGTREE],
    ["ha-font-family-heading", FIGTREE],
    ["ha-font-family-code", '"JetBrains Mono", Menlo, monospace'],
    ["ha-card-header-font-family", FIGTREE],
  ],
  cardModComment: [
    "card-mod reads these two keys from the top level of the theme, so both modes share them; without card-mod they do",
    "nothing. HA 2026.10 (frontend 20260930.x): hui-root's shadow root holds div.toolbar > ha-tab-group >",
    "ha-tab-group-tab[data-path=<view path or index>][active]; the label sits in the tab's ::part(base).",
    "Glass: Figtree tabs in mixed case as pills; the current tab is a frosted pill with a 1px light edge. Undo: delete both",
    "card-mod-* keys.",
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
  height: 38px;
  margin: 0;
  border: 0;
  opacity: 1;
  font-family: "Figtree", "Helvetica Neue", Arial, sans-serif;
  font-size: 0.9375rem;
  font-weight: 600;
  letter-spacing: 0;
  text-transform: none;
}
.toolbar > ha-tab-group > ha-tab-group-tab::part(base) {
  box-sizing: border-box;
  height: 100%;
  padding: 0 16px;
  line-height: 1;
  color: var(--secondary-text-color, #a9b1c6);
  background: transparent;
  border-radius: 999px;
  transition: none;
}
.narrow .toolbar > ha-tab-group > ha-tab-group-tab::part(base) {
  padding: 0 12px;
}
.toolbar > ha-tab-group > ha-tab-group-tab[active]::part(base) {
  color: var(--primary-text-color, #f4f6fb);
  background: var(--jam-shadow, rgba(255, 255, 255, 0.08));
  box-shadow: inset 0 0 0 1px var(--divider-color, #33405f);
}
`.slice(1),
  modes: {
    dark: {
      comment: "Jam Glass palette, dark (primary): #0b1020 page with a teal / violet / amber field, #182036 panes, text #f4f6fb",
      tokens: {
        "jam-ink": "#0b1020", "jam-slab": "#182036", "jam-slab2": "#232c47", "jam-slab3": "#2b3552",
        "jam-paper": "#1c2540", "jam-paper-fg": "#f4f6fb", "jam-paper-dim": "#a9b1c6",
        "jam-fg": "#f4f6fb", "jam-dim": "#a9b1c6", "jam-line": "#33405f",
        "jam-ochre": "#ffb44d", "jam-red": "#ff6b78", "jam-alert-text": "#ff8f99", "jam-teal": "#1fb5a8", "jam-blue": "#5b9bff",
        "jam-pink": "#ff6fa8", "jam-violet": "#8f7aff", "jam-green": "#4fd08a", "jam-on-fg": "#0b1020",
        "jam-shadow": "rgba(255,255,255,.08)",
        "jam-s1": "#1fb5a8", "jam-s2": "#8f7aff", "jam-s3": "#ffb44d", "jam-s4": "#ff6fa8", "jam-s5": "#5b9bff",
        "jam-ink-fg": "#f4f6fb", "jam-ink-dim": "#a9b1c6", "jam-ink-dim2": "#b9c0d2",
        "jam-band": "#10172c", "jam-band-fg": "#f4f6fb", "jam-band-dim": "#a9b1c6", "jam-band-key": "#232c47", "jam-band-off": "#66708c",
        "jam-band-tile": "#1c2540", "jam-plate": "#0b1020", "jam-plate-fg": "#f4f6fb", "jam-focus": "#8ef0e4",
        "jam-art-1": "#1fb5a8", "jam-art-2": "#7c5cff", "jam-art-3": "#ffb44d", "jam-art-4": "#ff6fa8",
        "jam-art-5": "#5b9bff", "jam-art-6": "#4fd08a", "jam-art-7": "#f4f6fb", "jam-art-8": "#8f7aff",
        "jam-elev-1": "inset 0 0 0 1px rgba(255,255,255,.18), 0 24px 48px -24px rgba(0,0,0,.6)",
      },
      ha: {
        ground: "#0b1020", ground2: "#182036", primary: "{jam-violet}", secondary: "{jam-teal}", faint: "#66708c",
        "chrome-bg": "#0b1020", "chrome-fg": "{jam-fg}", "chrome-dim": "{jam-dim}", "chrome-accent": "{jam-teal}",
        "header-rule": "1px solid {jam-line}", yellow: "{jam-ochre}", cyan: "{jam-teal}",
        "lovelace-bg": field([["#1fb5a8", 30], ["#7c5cff", 32], ["#ffb44d", 20]], "#0b1020"),
        ramp: ["#070021", "#14003d", "#29195d", "#4924a5", "#8f7aff", "#a093ff", "#b3abff", "#c7c3fe", "#dbdafe", "#edecfe", "#f8f8fe"],
      },
    },
    light: {
      comment: "Jam Glass palette, light: #eef1f7 page with a pastel field, white panes, text #0f1424",
      tokens: {
        "jam-ink": "#0f1424", "jam-slab": "#fbfcff", "jam-slab2": "#e9edf5", "jam-slab3": "#dfe4ee",
        "jam-paper": "#ffffff", "jam-paper-fg": "#0f1424", "jam-paper-dim": "#4b536b",
        "jam-fg": "#0f1424", "jam-dim": "#4b536b", "jam-line": "#cfd6e4",
        "jam-ochre": "#ffb44d", "jam-red": "#ff5a6a", "jam-alert-text": "#b3202f", "jam-teal": "#1fb5a8", "jam-blue": "#5b9bff",
        "jam-pink": "#ff6fa8", "jam-violet": "#8f7aff", "jam-green": "#4fd08a", "jam-on-fg": "#0f1424",
        "jam-shadow": "rgba(255,255,255,.62)",
        "jam-s1": "#1fb5a8", "jam-s2": "#8f7aff", "jam-s3": "#ffb44d", "jam-s4": "#ff6fa8", "jam-s5": "#5b9bff",
        "jam-ink-fg": "#ffffff", "jam-ink-dim": "#b9c0d2", "jam-ink-dim2": "#c9cfdd",
        "jam-band": "#e3e8f1", "jam-band-fg": "#0f1424", "jam-band-dim": "#4b536b", "jam-band-key": "#d3dae7", "jam-band-off": "#8a92a8",
        "jam-band-tile": "#d6dce8", "jam-plate": "#0f1424", "jam-plate-fg": "#ffffff", "jam-focus": "#5b3fe6",
        "jam-art-1": "#1fb5a8", "jam-art-2": "#7c5cff", "jam-art-3": "#ffb44d", "jam-art-4": "#ff6fa8",
        "jam-art-5": "#5b9bff", "jam-art-6": "#4fd08a", "jam-art-7": "#0f1424", "jam-art-8": "#8f7aff",
        "jam-elev-1": "inset 0 0 0 1px rgba(255,255,255,.75), 0 22px 44px -26px rgba(40,52,96,.32)",
      },
      ha: {
        ground: "#eef1f7", ground2: "#fbfcff", primary: "{jam-violet}", secondary: "{jam-teal}", faint: "#8a92a8",
        "chrome-bg": "#eef1f7", "chrome-fg": "{jam-fg}", "chrome-dim": "{jam-dim}", "chrome-accent": "#5b3fe6",
        "header-rule": "1px solid {jam-line}", yellow: "{jam-ochre}", cyan: "{jam-teal}",
        "lovelace-bg": field([["#8fe3da", 60], ["#c9bcff", 62], ["#ffd9a0", 56]], "#eef1f7"),
        ramp: ["#070021", "#14003d", "#29195d", "#4924a5", "#8f7aff", "#a093ff", "#b3abff", "#c7c3fe", "#dbdafe", "#edecfe", "#f8f8fe"],
      },
    },
  },
};
