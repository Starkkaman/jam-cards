// The token registry: every --jam-* custom property the cards read, in theme order. Single source for
//   - BASE_CSS :host (short name -> var(--jam-name, <Poster dark value>)), generated into jam-cards.js by tools/bundle.mjs;
//   - the theme YAML (tools/themes.mjs: "mode" tokens per light/dark mode, "theme" tokens at the theme's top level);
//   - preview/looks.css (the preview's stand-in for the theme).
// Values live in the looks (tokens/looks/<id>.mjs); the Poster look's dark mode is the cards' fallback.
// Fields: name (theme key = CSS name without "--"), css (short name inside the cards, "" = none), scope ("mode" = per
// light/dark mode, "theme" = both modes), note (one line, shown in docs/DESIGN.md's token reference), optional (a look
// may leave it out; the cards then use `fallback`, or for tokens without a short name the fallback written at each use).
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
  // ---- colour: fixed ink surfaces (R1; the same in both Poster modes) ----
  {name: "jam-ink-fg", css: "ink-fg", scope: "mode", note: "text on ink (the ink accent's text, screensaver, kiosk light-mode dock)"},
  {name: "jam-ink-dim", css: "ink-dim", scope: "mode", note: "muted text on ink (screensaver)"},
  {name: "jam-ink-dim2", css: "ink-dim2", scope: "mode", note: "muted text on ink at kiosk size (jam-kiosk light-mode dock state)"},
  {name: "jam-band", css: "band", scope: "mode", note: "fixed band ground (jam-tv poster band + On now stamp, jam-speaker band + K1 shelf, music dock, error strip)"},
  {name: "jam-band-fg", css: "band-fg", scope: "mode", note: "text on a band"},
  {name: "jam-band-dim", css: "band-dim", scope: "mode", note: "muted text on a band"},
  {name: "jam-band-key", css: "band-key", scope: "mode", note: "key face on a band"},
  {name: "jam-band-off", css: "band-off", scope: "mode", note: "disabled key glyph on a band"},
  {name: "jam-band-tile", css: "band-tile", scope: "mode", note: "cover tile ground on a band (jam-speaker K1 shelf)"},
  {name: "jam-plate", css: "plate", scope: "mode", note: "label plate behind text on a light face (jam-light)"},
  {name: "jam-plate-fg", css: "plate-fg", scope: "mode", note: "text on a label plate"},
  {name: "jam-focus", css: "focus", scope: "mode", optional: true, fallback: "var(--ochre)", note: "focus ring colour (default: the ochre token)"},
  // ---- type ----
  {name: "jam-display", css: "display", scope: "theme", note: "display font stack"},
  {name: "jam-body", css: "body", scope: "theme", note: "body / label font stack"},
  // ---- shape (R2; optional: unset = the Poster geometry written at each use, so the Poster theme sets none of them) ----
  {name: "jam-shape-card", css: "", scope: "theme", optional: true, note: "clip-path of card faces, panels (+ jam-light pop-up bars / hue strip / white editor, screensaver bars + photos now label)"},
  {name: "jam-shape-key", css: "", scope: "theme", optional: true, note: "clip-path of jam-button, jam-remote row keys"},
  {name: "jam-shape-chip", css: "", scope: "theme", optional: true, note: "clip-path of pills, option / temp / source chips, transport keys, popup close (+ .chip, screensaver time chip)"},
  {name: "jam-shape-hero", css: "", scope: "theme", optional: true, note: "clip-path of jam-hero"},
  {name: "jam-shape-sheet", css: "", scope: "theme", optional: true, note: "clip-path of openSheet / jam-popup sheet"},
  {name: "jam-shape-poster", css: "", scope: "theme", optional: true, note: "clip-path of jam-tv / jam-speaker poster"},
  {name: "jam-shape-pw", css: "", scope: "theme", optional: true, note: "clip-path of power corner triangle (POWER_CSS, jam-tv 44px corner)"},
  {name: "jam-shape-strip-end", css: "", scope: "theme", optional: true, note: "clip-path of accent fill end of strips (.fill, jam-light bars / band strips)"},
  {name: "jam-shape-tab", css: "", scope: "theme", optional: true, note: "clip-path of jam-tabs tab"},
  {name: "jam-shape-scene", css: "", scope: "theme", optional: true, note: "clip-path of jam-scenes key"},
  {name: "jam-shape-icon", css: "", scope: "theme", optional: true, note: "clip-path of jam-button icon square"},
  {name: "jam-shape-pin", css: "", scope: "theme", optional: true, note: "clip-path of jam-music-panel pin corner tab"},
  {name: "jam-shape-plate", css: "", scope: "theme", optional: true, note: "clip-path of jam-light label plate (contrast fallback)"},
  {name: "jam-shape-key-plate", css: "", scope: "theme", optional: true, note: "clip-path of jam-remote outlined key: inner plate (key cut)"},
  {name: "jam-shape-chip-plate", css: "", scope: "theme", optional: true, note: "clip-path of jam-remote outlined key: inner plate (chip cut)"},
  {name: "jam-radius-card", css: "", scope: "theme", optional: true, note: "border-radius of the card kind (default 0; for a shape of none)"},
  {name: "jam-radius-key", css: "", scope: "theme", optional: true, note: "border-radius of the key kind (default 0; for a shape of none)"},
  {name: "jam-radius-chip", css: "", scope: "theme", optional: true, note: "border-radius of the chip kind (default 0; for a shape of none)"},
  {name: "jam-radius-hero", css: "", scope: "theme", optional: true, note: "border-radius of the hero kind (default 0; for a shape of none)"},
  {name: "jam-radius-sheet", css: "", scope: "theme", optional: true, note: "border-radius of the sheet kind (default 0; for a shape of none)"},
  {name: "jam-radius-poster", css: "", scope: "theme", optional: true, note: "border-radius of the poster kind (default 0; for a shape of none)"},
  // ---- identity (R1) ----
  {name: "jam-look", css: "", scope: "theme", note: "look id (poster, braun, ...): cards set data-look=<id> on their host, sheets and the screensaver layer"},
];
/* Runtime tokens: set by cards or users, not by a theme, but copied onto body layers (sheets, screensaver) like the rest. */
export const RUNTIME_TOKENS = ["jam-accent", "jam-spotify"];
