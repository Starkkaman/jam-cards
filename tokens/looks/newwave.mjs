// New Wave: after April Greiman, Design Quarterly #133 "Does It Make Sense?" (1986), with a touch of Memphis (decided
// design: docs/looks/NEWWAVE.md, 2026-11-03; reference ~/project/jam-dash/mockups/v8-newwave.html). A desk of
// translucent tinted sheets, playful geometric confetti, early-Mac pixel type (Silkscreen) for numbers and labels, a
// sticker yellow for alerts. The pack (src/looks/newwave.js) draws the planes, the room tints, the confetti, the
// stickers, the pixel numerals and the screensaver light; this file holds the tokens. The one look with translucency,
// soft shadows and gradients, all behind the effects switch (`jam-fx: 1` here; a card's `fx: false`, e.g. on the kiosks,
// turns them off: flat opaque planes, no tilt, no blur, no drifting light).
// Generated outputs: ../jam-theme/themes/jamboard-newwave.yaml (tools/themes.mjs) and the preview/looks.css block
// (tools/bundle.mjs). Edit here, then run node tools/bundle.mjs && node tools/themes.mjs.
//
// Token mapping (the cards keep Poster's token names):
//   - slab = the plane, opaque (white / #2a2060): the fx-off face and the colour the translucent plane is mixed from
//     (fx on: slab at ~55% alpha with the room tint gradient over it); slab2 / slab3 = deeper lavender planes (keys,
//     tracks; keys inside sheets);
//   - the room hues are the strong ends of the brief's pastel pairs (ochre = peach -> yellow for living, the default
//     accent; teal = mint -> aqua for kitchen; blue = lavender -> blue for master; pink = pink -> lilac for marissa;
//     violet = lilac for music; green = mint for nerd); the pack mixes them into the plane for the tints;
//   - ink = the dark ink (#1b1640 / #0b0824): sheet veil, label plates, active keys; ink-fg = the page white. The page
//     ground is the HA ground alias (#fbf8ff light / #140f2e dark);
//   - band = the terminal (#1b1640 with #d8ffe9 text; dark #07051f / #b9ffd9): jam-tv / jam-speaker text bands, the
//     music dock, the error strip;
//   - art-1..8 = the confetti / idle-art palette; art-6 is the sticker yellow (alerts, "needs you", now playing) and art-8
//     the ok sticker (mint), read by the pack;
//   - elev-1 = the plane's white edge + soft shadow (fx on only; the pack draws a 1px line edge with fx off).
// Contrast (every text >= 4.5:1, measured by preview/contrast.js on the opaque fx-off faces): ink #1b1640 reaches >= 5.4:1
// on every hue fill (on-fg = ink in light, the dark ground in dark); the brief's alert red #e0244f is 3.9:1 under ink, so
// the red fill is #ff4f78 (5.4:1) and the alert TEXT a deeper #a8123c (light) / #ff9db4 (dark).
const ARCHIVO = '"Archivo", "Helvetica Neue", Arial, sans-serif';
const PIXEL = '"Silkscreen", "Courier New", monospace';
const EASE = "cubic-bezier(.2,.8,.2,1)"; // the mockup's planes: quick out, soft landing

export default {
  id: "newwave",
  theme: "Jam New Wave",
  file: "jamboard-newwave.yaml",
  comment: [
    "Jam New Wave: after April Greiman (Design Quarterly #133, 1986) with a touch of Memphis. Translucent tinted planes,",
    "geometric confetti, Silkscreen pixel numerals and labels, a sticker yellow for alerts, Archivo 700 headings.",
    "Pairs with the Jam Cards suite (https://github.com/Starkkaman/jam-cards), which reads the --jam-* variables below,",
    "loads Archivo and Silkscreen (dist/fonts/) and draws the planes (its look pack, --jam-look: newwave). Without Jam",
    "Cards the stacks fall back to Helvetica/Arial and Courier.",
    "jam-fx: 1 turns the effects on (translucency, gradients, soft shadows, tilt, the drifting screensaver light); set",
    "`fx: false` on the kiosk cards (jam-kiosk, jam-screensaver) for weak tablets: flat opaque planes, no tilt.",
    "Light mode = #fbf8ff page, white planes, ink #1b1640; dark mode = #140f2e page, #2a2060 planes, ink #f3efff.",
  ],
  tokens: {
    "jam-display": ARCHIVO,
    "jam-body": ARCHIVO,
    // Headings: Archivo 700, mixed case, tight; numerals in the pixel face (Silkscreen is wide: x .55).
    "jam-display-weight": "700", "jam-display-case": "none", "jam-display-lead": "1.12", "jam-display-scale": ".7",
    "jam-display-track": "-.02em",
    "jam-num-font": PIXEL, "jam-num-scale": ".6",
    // Small labels: the pack sets them in Silkscreen (pixel caps), 400, uppercase, tracking .16em x .3.
    "jam-label-weight": "400", "jam-label-case": "uppercase", "jam-label-track-scale": ".3",
    // Keys: Archivo 600, mixed case, no tracking (the mockup's buttons).
    "jam-key-weight": "600", "jam-key-case": "none", "jam-key-track-scale": "0",
    // Shape: no cut corners anywhere; radius 2px on every plane.
    "jam-shape-card": "none", "jam-shape-key": "none", "jam-shape-chip": "none", "jam-shape-hero": "none",
    "jam-shape-sheet": "none", "jam-shape-poster": "none", "jam-shape-pw": "none", "jam-shape-strip-end": "none",
    "jam-shape-tab": "none", "jam-shape-scene": "none", "jam-shape-icon": "none", "jam-shape-pin": "none",
    "jam-shape-plate": "none", "jam-shape-key-plate": "none", "jam-shape-chip-plate": "none",
    "jam-radius-card": "2px", "jam-radius-key": "2px", "jam-radius-chip": "2px", "jam-radius-hero": "2px",
    "jam-radius-sheet": "2px", "jam-radius-poster": "2px",
    "jam-rule-h": "4px", "jam-stripe-w": "4px",
    // Motion: smooth, quick-out; press = scale .98 (the pack adds the tilt under fx); stickers pop (scale 1.04, 160 ms).
    "jam-dur": "1", "jam-press": "scale(.98)", "jam-press-from": "scale(.98)",
    "jam-ease-2": EASE, "jam-ease-3": EASE, "jam-ease-4": EASE,
    "jam-kf-enter": "nw-enter", "jam-kf-uncover": "none", "jam-kf-retreat": "none", "jam-kf-stamp": "nw-pop",
    "jam-kf-sheet": "nw-sheet", "jam-kf-flash": "none", "jam-kf-ss-cut": "nw-fade", "jam-kf-ss-pop": "nw-fade",
    // Effects on (desktop / phone); kiosks opt out per card with `fx: false`.
    "jam-fx": "1",
    "jam-look": "newwave",
  },
  chrome: [
    ["ha-card-border-radius", "2px"], ["ha-card-box-shadow", "var(--jam-elev-1)"], ["ha-card-border-width", "0px"],
    ["ha-dialog-border-radius", "2px"], ["ha-section-border-radius", "2px"], ["ha-badge-border-radius", "2px"],
    ["ha-border-radius-sm", "2px"], ["ha-border-radius-md", "2px"], ["ha-border-radius-lg", "2px"], ["ha-border-radius-xl", "2px"],
    ["ha-border-radius-2xl", "2px"], ["ha-border-radius-3xl", "2px"], ["ha-border-radius-4xl", "2px"], ["ha-border-radius-5xl", "2px"],
    ["ha-border-radius-6xl", "2px"], ["ha-border-radius-pill", "2px"], ["ha-picture-border-radius", "2px"],
    ["ha-picture-border-radius-sm", "2px"], ["ha-card-features-border-radius", "2px"],
    ["mdc-shape-small", "2px"], ["mdc-shape-medium", "2px"], ["mdc-shape-large", "2px"], ["ha-tile-icon-border-radius", "2px"],
    ["ha-font-family-body", ARCHIVO],
    ["ha-font-family-heading", ARCHIVO],
    ["ha-font-family-code", '"JetBrains Mono", Menlo, monospace'],
    ["ha-card-header-font-family", ARCHIVO],
  ],
  cardModComment: [
    "card-mod reads these two keys from the top level of the theme, so both modes share them; without card-mod they do",
    "nothing. HA 2026.10 (frontend 20260930.x): hui-root's shadow root holds div.toolbar > ha-tab-group >",
    "ha-tab-group-tab[data-path=<view path or index>][active]; the label sits in the tab's ::part(base).",
    "New Wave: Silkscreen pixel-caps tabs (when Jam Cards has loaded the face; else Courier), a 3px room-colour underline;",
    "the active tab is an ink block with page-white text (the mockup's nav). Room hues apply only on the Jam Home dashboard,",
    "recognised by its tab set (a group holding both the living and marissa tabs, via :has()); every other dashboard keeps",
    "the violet default. Undo: delete both card-mod-* keys.",
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
  --jam-tab-c: var(--jam-violet, #9d82ff);
  height: 36px;
  margin: 0;
  border: 0;
  opacity: 1;
  font-family: "Silkscreen", "Courier New", monospace;
  font-size: 0.8125rem;
  font-weight: 400;
  letter-spacing: 0.04em;
  text-transform: uppercase;
}
.toolbar > ha-tab-group > ha-tab-group-tab::part(base) {
  box-sizing: border-box;
  height: 100%;
  padding: 0 12px;
  line-height: 1;
  color: var(--app-header-text-color, #1b1640);
  background: transparent;
  border-bottom: 3px solid var(--jam-tab-c);
  transition: none;
}
.narrow .toolbar > ha-tab-group > ha-tab-group-tab::part(base) {
  padding: 0 9px;
}
.toolbar > ha-tab-group > ha-tab-group-tab[active]::part(base) {
  color: var(--primary-background-color, #fbf8ff);
  background: var(--app-header-text-color, #1b1640);
}
.toolbar > ha-tab-group:has(> [data-path="living"]):has(> [data-path="marissa"]) > [data-path="living"] {
  --jam-tab-c: var(--jam-ochre, #ffa64d);
}
.toolbar > ha-tab-group:has(> [data-path="living"]):has(> [data-path="marissa"]) > [data-path="kitchen"] {
  --jam-tab-c: var(--jam-teal, #3fcfbf);
}
.toolbar > ha-tab-group:has(> [data-path="living"]):has(> [data-path="marissa"]) > [data-path="master"] {
  --jam-tab-c: var(--jam-blue, #5f98ff);
}
.toolbar > ha-tab-group:has(> [data-path="living"]):has(> [data-path="marissa"]) > [data-path="marissa"] {
  --jam-tab-c: var(--jam-pink, #ff6fae);
}
.toolbar > ha-tab-group:has(> [data-path="living"]):has(> [data-path="marissa"]) > [data-path="music"] {
  --jam-tab-c: var(--jam-violet, #9d82ff);
}
`.slice(1),
  modes: {
    light: {
      comment: "Jam New Wave palette, light (primary): #fbf8ff page, white planes, ink #1b1640",
      tokens: {
        "jam-ink": "#1b1640", "jam-slab": "#ffffff", "jam-slab2": "#efeafd", "jam-slab3": "#e6dffb",
        "jam-paper": "#ece4ff", "jam-paper-fg": "#1b1640", "jam-paper-dim": "#4d4675",
        "jam-fg": "#1b1640", "jam-dim": "#4d4675", "jam-line": "#d6cdf3",
        "jam-ochre": "#ffa64d", "jam-red": "#ff4f78", "jam-alert-text": "#a8123c", "jam-teal": "#3fcfbf", "jam-blue": "#5f98ff",
        "jam-pink": "#ff6fae", "jam-violet": "#9d82ff", "jam-green": "#42d39a", "jam-on-fg": "#1b1640", "jam-shadow": "#d6cdf3",
        "jam-s1": "#5f98ff", "jam-s2": "#ff6fae", "jam-s3": "#3fcfbf", "jam-s4": "#ffa64d", "jam-s5": "#9d82ff",
        "jam-ink-fg": "#fbf8ff", "jam-ink-dim": "#b9b0e8", "jam-ink-dim2": "#c9c2ee",
        "jam-band": "#1b1640", "jam-band-fg": "#d8ffe9", "jam-band-dim": "#9e94d8", "jam-band-key": "#2e2760", "jam-band-off": "#6b6399",
        "jam-band-tile": "#2e2760", "jam-plate": "#1b1640", "jam-plate-fg": "#fbf8ff", "jam-focus": "#1b1640",
        "jam-art-1": "#ff6fae", "jam-art-2": "#9d82ff", "jam-art-3": "#3fcfbf", "jam-art-4": "#ffa64d",
        "jam-art-5": "#5f98ff", "jam-art-6": "#fff05a", "jam-art-7": "#1b1640", "jam-art-8": "#a6f3d4",
        "jam-elev-1": "inset 0 0 0 1px rgba(255,255,255,.9), 0 18px 40px -18px rgba(52,30,120,.16)",
      },
      ha: {
        ground: "#fbf8ff", ground2: "#f3efff", primary: "{jam-violet}", secondary: "{jam-pink}", faint: "#9e94d8",
        "chrome-bg": "#fbf8ff", "chrome-fg": "{jam-fg}", "chrome-dim": "{jam-dim}", "chrome-accent": "{jam-fg}",
        "header-rule": "2px solid {jam-fg}", yellow: "#fff05a", cyan: "{jam-teal}",
        ramp: ["#010005", "#0d0621", "#1d123c", "#3e2976", "#9d82ff", "#ad9bfe", "#b8abfe", "#c6bdfe", "#ded9fe", "#efedfe", "#f7f6ff"],
      },
    },
    dark: {
      comment: "Jam New Wave palette, dark: #140f2e page, #2a2060 planes, ink #f3efff",
      tokens: {
        "jam-ink": "#0b0824", "jam-slab": "#2a2060", "jam-slab2": "#362b78", "jam-slab3": "#403486",
        "jam-paper": "#31266e", "jam-paper-fg": "#f3efff", "jam-paper-dim": "#d6d0f8",
        "jam-fg": "#f3efff", "jam-dim": "#d6d0f8", "jam-line": "#4a3d96",
        "jam-ochre": "#ffb067", "jam-red": "#ff6f8f", "jam-alert-text": "#ff9db4", "jam-teal": "#4fe0cf", "jam-blue": "#7aa8ff",
        "jam-pink": "#ff7fb8", "jam-violet": "#b39cff", "jam-green": "#5fe3a8", "jam-on-fg": "#140f2e", "jam-shadow": "#07051f",
        "jam-s1": "#7aa8ff", "jam-s2": "#ff7fb8", "jam-s3": "#4fe0cf", "jam-s4": "#ffb067", "jam-s5": "#b39cff",
        "jam-ink-fg": "#f3efff", "jam-ink-dim": "#b9b0e8", "jam-ink-dim2": "#c9c2ee",
        "jam-band": "#07051f", "jam-band-fg": "#b9ffd9", "jam-band-dim": "#9e94d8", "jam-band-key": "#1d1750", "jam-band-off": "#5d5590",
        "jam-band-tile": "#1d1750", "jam-plate": "#0b0824", "jam-plate-fg": "#f3efff", "jam-focus": "#ffe94a",
        "jam-art-1": "#ff7fb8", "jam-art-2": "#b39cff", "jam-art-3": "#4fe0cf", "jam-art-4": "#ffb067",
        "jam-art-5": "#7aa8ff", "jam-art-6": "#ffe94a", "jam-art-7": "#f3efff", "jam-art-8": "#7df0c4",
        "jam-elev-1": "inset 0 0 0 1px rgba(190,170,255,.42), 0 18px 40px -18px rgba(0,0,0,.45)",
      },
      ha: {
        ground: "#140f2e", ground2: "#1c1542", primary: "{jam-violet}", secondary: "{jam-pink}", faint: "#6b6399",
        "chrome-bg": "#140f2e", "chrome-fg": "{jam-fg}", "chrome-dim": "{jam-dim}", "chrome-accent": "{jam-art-6}",
        "header-rule": "2px solid {jam-violet}", yellow: "#ffe94a", cyan: "{jam-teal}",
        ramp: ["#010104", "#0d081d", "#1d1535", "#3e2e69", "#b39cff", "#b09df3", "#bbacf5", "#c9bdfa", "#dfd8fe", "#efecff", "#f7f6fe"],
      },
    },
  },
};
