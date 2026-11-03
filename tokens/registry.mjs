// The token registry: every --jam-* custom property the cards read, in theme order. Single source for
//   - BASE_CSS :host (short name -> var(--jam-name, <Poster dark value>)), generated into jam-cards.js by tools/bundle.mjs;
//   - the theme YAML (tools/themes.mjs: "mode" tokens per light/dark mode, "theme" tokens at the theme's top level);
//   - preview/looks.css (the preview's stand-in for the theme).
// Values live in the looks (tokens/looks/<id>.mjs); the Poster look's dark mode is the cards' fallback.
// Fields: name (theme key = CSS name without "--"), css (short name inside the cards, "" = none), scope ("mode" = per
// light/dark mode, "theme" = both modes), note (one line, shown in docs/DESIGN.md's token reference).
export const TOKENS = [
  // ---- colour: surfaces ----
  {name: "jam-ink", css: "ink", scope: "mode", note: "ground (page, bands, veil)"},
  {name: "jam-slab", css: "slab", scope: "mode", note: "card face"},
  {name: "jam-slab2", css: "slab2", scope: "mode", note: "inner controls, off keys"},
  {name: "jam-slab3", css: "slab3", scope: "mode", note: "inner controls of cards inside a sheet"},
  {name: "jam-paper", css: "paper", scope: "mode", note: "hero face"},
  {name: "jam-paper-fg", css: "paper-fg", scope: "mode", note: "hero text"},
  {name: "jam-paper-dim", css: "paper-dim", scope: "mode", note: "hero muted"},
  {name: "jam-fg", css: "fg", scope: "mode", note: "text"},
  {name: "jam-dim", css: "dim", scope: "mode", note: "muted text"},
  {name: "jam-line", css: "line", scope: "mode", note: "rules, off marks"},
  // ---- colour: hues ----
  {name: "jam-ochre", css: "ochre", scope: "mode", note: "accent ochre (default accent)"},
  {name: "jam-red", css: "red", scope: "mode", note: "alert fills (reserved)"},
  {name: "jam-alert-text", css: "alert-text", scope: "mode", note: "red TEXT, >= 4.5:1 on slab/slab2/slab3"},
  {name: "jam-teal", css: "teal", scope: "mode", note: "accent teal (also calm / info)"},
  {name: "jam-blue", css: "blue", scope: "mode", note: "accent blue"},
  {name: "jam-pink", css: "pink", scope: "mode", note: "accent pink"},
  {name: "jam-violet", css: "violet", scope: "mode", note: "accent violet"},
  {name: "jam-green", css: "green", scope: "mode", note: "accent green"},
  {name: "jam-on-fg", css: "on-fg", scope: "mode", note: "text on any accent fill"},
  {name: "jam-shadow", css: "shadow", scope: "mode", note: "legacy (unused since v0.3, kept for themes)"},
  // ---- colour: series ----
  {name: "jam-s1", css: "s1", scope: "mode", note: "series 1 (also HA graph-color-1)"},
  {name: "jam-s2", css: "s2", scope: "mode", note: "series 2"},
  {name: "jam-s3", css: "s3", scope: "mode", note: "series 3"},
  {name: "jam-s4", css: "s4", scope: "mode", note: "series 4"},
  {name: "jam-s5", css: "s5", scope: "mode", note: "series 5"},
  // ---- type ----
  {name: "jam-display", css: "display", scope: "theme", note: "display font stack"},
  {name: "jam-body", css: "body", scope: "theme", note: "body / label font stack"},
];
