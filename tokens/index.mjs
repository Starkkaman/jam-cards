// The single token source (theming plan §2.6): registry + looks + the generators shared by tools/bundle.mjs (cards
// fallbacks, preview/looks.css) and tools/themes.mjs (HA theme YAML). Node only; nothing here is bundled.
import {TOKENS, RUNTIME_TOKENS} from "./registry.mjs";
import {HA_KEYS, haValue} from "./ha.mjs";
import hifi from "./looks/hifi.mjs";

export {TOKENS, RUNTIME_TOKENS, HA_KEYS, haValue};
/* Jam Cards 1.0.0 has ONE look, Hi-Fi (until 0.11 the "Jam Calm" look; Poster, Braun, Olympia, Transit, Grid, Pulsar,
   New Wave, Brutal, Glass and Girard were removed on 2026-11-07). It is the cards' built-in look: its theme-level tokens
   are fixed on every card and its dark palette is the fallback of every mode token (hostCss), and the whole palette of a
   card that sits under no Hi-Fi theme (builtinHostCss). LOOKS stays a list so the generators keep their shape. */
export const LOOKS = [hifi];
export const SHOT_LOOKS = LOOKS.map(l => l.id);
export const HIFI = hifi;

const MODES = ["dark", "light"];
const cssStack = v => v.replace(/,\s+/g, ","); // font stacks: theme form '"A", B' -> CSS form '"A",B'

/* Checks a look against the registry: every "mode" token in each mode, every "theme" token once, nothing unknown. */
export function validateLook(look) {
  const errs = [], known = new Set(TOKENS.map(t => t.name));
  for (const t of TOKENS) {
    if (t.optional) continue;
    if (t.scope === "theme" && !(look.tokens && t.name in look.tokens)) errs.push(`${look.id}: theme token ${t.name} missing`);
    if (t.scope === "mode") for (const m of MODES) if (!(look.modes[m] && t.name in look.modes[m].tokens)) errs.push(`${look.id}/${m}: ${t.name} missing`);
  }
  for (const k of Object.keys(look.tokens || {})) if (!known.has(k)) errs.push(`${look.id}: unknown token ${k}`);
  for (const m of MODES) for (const k of Object.keys((look.modes[m] || {}).tokens || {})) if (!known.has(k)) errs.push(`${look.id}/${m}: unknown token ${k}`);
  if (errs.length) throw new Error("token source: " + errs.join("; "));
  return look;
}
LOOKS.forEach(validateLook);

/* Value of a token in a look + mode (theme-level tokens are the same in both). */
export const tokenValue = (look, mode, name) => (look.tokens && name in look.tokens ? look.tokens[name] : look.modes[mode].tokens[name]);

/* Every --jam-* name a body layer copies from its card (openSheet, jam-screensaver): the registry + runtime tokens. */
export const copyTokens = () => [...TOKENS.map(t => t.name), ...RUNTIME_TOKENS].map(n => "--" + n);

/* BASE_CSS :host declarations, one per line:
   1. the Hi-Fi theme-level tokens (registry scope "theme": type, shape, motion, the look id) as fixed values on :host. A
      theme cannot change them any more (one look), so a stale theme of a removed look (Poster's "JamBoard", "Jam Braun",
      ...) cannot re-type or re-shape the cards either. A value that names a mode token (jam-border: var(--jam-line)) reads
      the card's short name instead, so it resolves without a theme too;
   2. --short:var(--jam-name,<Hi-Fi dark value, else the registry fallback>) for every token with a short name. */
export function hostCss() {
  const fixed = TOKENS.filter(t => t.scope === "theme" && hifi.tokens && t.name in hifi.tokens).map(t => {
    const v = String(hifi.tokens[t.name]).replace(/var\(--(jam-[\w-]+)\)/g, (m, n) => { const r = TOKENS.find(x => x.name === n); return r && r.css ? `var(--${r.css})` : m; });
    return `  --${t.name}:${t.name === "jam-display" || t.name === "jam-body" || t.name === "jam-num-font" ? cssStack(v) : v};`;
  });
  const short = TOKENS.filter(t => t.css).map(t => {
    const v = tokenValue(hifi, "dark", t.name) ?? t.fallback;
    if (v == null) throw new Error("token source: " + t.name + " has no Hi-Fi value and no fallback");
    return `  --${t.css}:var(--${t.name},${t.scope === "theme" ? cssStack(v) : v});`;
  });
  return [...fixed, ...short].join("\n");
}
/* The built-in palette: every mode token of the Hi-Fi dark palette on :host([data-jam-builtin]). Core sets data-jam-builtin
   on a card whose theme is not Hi-Fi (the --jam-look above the card is not hifi, or calm = Hi-Fi's id until 1.0.0): no
   theme (HA's default), or a stale theme of a removed look (Poster's "JamBoard", "Jam Braun", ...: HACS may leave the
   removed theme files in config/themes). The card then draws Hi-Fi Night exactly, the optional calm-part tokens included
   (jam-ground, jam-groove, ...: they have no short name, so the :host fallbacks alone cannot reach them). */
export function builtinHostCss() {
  const decl = TOKENS.filter(t => t.scope === "mode" && hifi.modes.dark.tokens[t.name] != null).map(t => `--${t.name}:${hifi.modes.dark.tokens[t.name]}`);
  return `:host([data-jam-builtin]){${decl.join(";")}}`;
}

/* preview/looks.css: the Hi-Fi theme's tokens per mode (the preview's stand-in for the HA theme) + primary-background-color,
   primary-text-color and secondary-text-color. Hi-Fi = :root / :root.light. */
export function looksCss() {
  const out = ["/* GENERATED by tools/bundle.mjs from tokens/ (the token source); the preview's stand-in for the Hi-Fi theme.",
    "   index.html adds .light on <html> for ?mode=light. Edit tokens/looks/hifi.mjs, then run node tools/bundle.mjs. */"];
  for (const look of LOOKS) {
    const sel = ":root";
    for (const m of MODES) {
      const mode = look.modes[m], decl = [];
      for (const t of TOKENS) { const v = tokenValue(look, m, t.name); if (v != null) decl.push(`--${t.name}:${v}`); }
      decl.push("--primary-background-color:" + haValue("{ground}", mode));
      // HA's page text (theme aliases text / text-dim): a look whose cards differ from the page (Transit) reads them for
      // text that sits on the page itself (jam-heading, the kiosk home).
      decl.push("--primary-text-color:" + haValue("{text}", mode), "--secondary-text-color:" + haValue("{text-dim}", mode));
      // A look whose lovelace-background is more than the ground (Grid: the page grid) also sets --lovelace-background;
      // preview/index.html paints it on a fixed layer behind the view (HA's hui-view-background).
      const lb = haValue("{lovelace-bg}", mode);
      if (lb !== haValue("{ground}", mode)) decl.push("--lovelace-background:" + lb);
      out.push(`${sel}${m === "light" ? ".light" : ""}{\n  ${decl.join(";\n  ")};\n}`);
    }
  }
  return out.join("\n") + "\n";
}

/* preview/themes.js: the preview's stand-in for hass.themes.themes (theme name -> {theme-level --jam-* tokens, modes:
   {light, dark}}, keys without "--" as in the theme YAML) for the Hi-Fi theme and its single-mode themes (Hi-Fi Day /
   Hi-Fi Night: the palette flat, no modes; preview/index.html ?theme=<name> applies one like HA), plus look id -> theme name
   (preview/index.html puts them on the fake hass). */
export function themesJs() {
  const themes = {}, names = {};
  for (const look of LOOKS.filter(l => l.theme && !l.harness && !l.draft)) {
    const t = {}, modes = {};
    for (const tok of TOKENS) if (tok.scope === "theme" && look.tokens && tok.name in look.tokens) t[tok.name] = look.tokens[tok.name];
    for (const m of MODES) {
      modes[m] = {};
      for (const tok of TOKENS) if (tok.scope === "mode" && tok.name in look.modes[m].tokens) modes[m][tok.name] = look.modes[m].tokens[tok.name];
      modes[m]["primary-background-color"] = haValue("{ground}", look.modes[m]);
    }
    themes[look.theme] = {...t, modes};
    names[look.id] = look.theme;
    // single-mode themes (1.0.1, Hi-Fi Day / Hi-Fi Night): one mode's palette at the top level, no modes (as in the YAML)
    for (const [name, m] of look.single || []) {
      const mode = look.modes[m];
      themes[name] = {...t, ...modes[m], "primary-text-color": haValue("{text}", mode), "secondary-text-color": haValue("{text-dim}", mode)};
    }
  }
  return "// GENERATED by tools/bundle.mjs from tokens/ (themesJs): the preview's hass.themes.themes (theme YAML values) and\n" +
    "// look id -> theme name. Loaded by preview/index.html. Edit tokens/looks/<id>.mjs, then run node tools/bundle.mjs.\n" +
    `window.jamPreviewThemes = ${JSON.stringify(themes, null, 1)};\nwindow.jamPreviewLookThemes = ${JSON.stringify(names)};\n`;
}
