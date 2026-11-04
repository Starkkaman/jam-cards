/* ---------- jam-looks: pick the dashboard look for THIS user (Profile -> Theme, from a card) ----------
   {type: custom:jam-looks, title?, looks?: [theme names: subset + order], accent? (current tile fill)}
   One tile per look (JamBoard + every installed theme whose name starts with "Jam "; `looks:` limits / orders them and may
   name any installed theme) with a small live swatch drawn from that theme's own values (hass.themes.themes[name], in the
   current light / dark mode: ground, face, text in its display face, four hues), plus "Use system default". The current pick
   (hass.selectedTheme.theme; "" / none = system default) is filled with the accent and aria-pressed.
   A tap does exactly what Home Assistant's profile theme picker does (frontend 20260930.x = HA 2026.10:
   src/components/ha-theme-settings.ts _handleThemeSelection -> ha-pick-theme-row -> `settheme`): it fires the composed
   `settheme` event with {theme, primaryColor: undefined, accentColor: undefined} (system default: theme ""). The root
   <home-assistant> element (src/state/themes-mixin.ts) merges it into hass.selectedTheme ({...selectedTheme, ...detail}),
   so `dark` (the user's auto / light / dark choice) is kept, stores it in this browser (localStorage) and saves it as the
   user's frontend user data "theme" (synced to that user's other browsers). Nothing global changes: no
   frontend.set_theme, no helper, other users and the backend default theme stay as they are. */
const JL_HUES = ["jam-ochre", "jam-teal", "jam-blue", "jam-pink"];
/* A theme's value for key in one mode: mode values, then theme-level ones; var(--x[, fallback]) resolved against the same
   theme (a few levels deep); "" when unknown. */
function jlValue(theme, mode, key, depth = 0) {
  if (!theme || depth > 6) return "";
  const m = theme.modes && (theme.modes[mode] || theme.modes[mode === "dark" ? "light" : "dark"]);
  let v = m && m[key] != null ? m[key] : theme[key];
  if (v == null || typeof v === "object") return "";
  v = String(v).trim();
  return v.replace(/var\(\s*--([\w-]+)\s*(?:,\s*([^()]*))?\)/g, (all, name, fb) => jlValue(theme, mode, name, depth + 1) || (fb || "").trim());
}
const jlFirst = (theme, mode, keys) => { for (const k of keys) { const v = jlValue(theme, mode, k); if (v) return v; } return ""; };
/* Shown name: "Jam Braun" -> "Braun"; other names as they are. */
const jlName = n => /^Jam .+/.test(n) ? n.slice(4) : n;

class JamLooks extends JamBase {
  validate(c) {
    if (c.looks != null && (!Array.isArray(c.looks) || !c.looks.every(x => typeof x === "string" && x.trim())))
      throw new Error("jam-looks: looks must be a list of theme names");
    if (c.title != null && typeof c.title !== "string") throw new Error("jam-looks: title must be text");
  }
  watched() { return []; } // re-renders on a new hass.themes / hass.selectedTheme only (JamBase._themeChanged)
  css() { return `
    .wrap{display:grid;grid-template-columns:minmax(0,1fr);gap:10px;align-content:start;min-width:0}
    .wrap > .label{min-width:0;overflow-wrap:anywhere}
    .opts{display:grid;grid-template-columns:repeat(auto-fill,minmax(min(132px,100%),1fr));gap:8px;min-width:0}
    .opt{text-align:left;min-height:44px}
    .opt > .face{--p-t:8px;--p-r:8px;--p-b:10px;--p-l:8px;display:grid;gap:8px;align-content:start;min-width:0}
    .sw{display:grid;grid-template-columns:minmax(0,1fr) auto;align-items:end;gap:6px;height:64px;padding:8px;min-width:0;overflow:hidden}
    .sw-face{display:flex;align-items:center;height:100%;padding:0 8px;font-size:24px;line-height:1;min-width:0;overflow:hidden;white-space:nowrap}
    .sw-hues{display:grid;grid-template-columns:repeat(2,10px);gap:3px}
    .sw-hues > i{display:block;width:10px;height:10px}
    .nm{min-width:0;overflow-wrap:anywhere}
    .sub{display:block;margin-top:3px;font-size:max(12px,.66rem);letter-spacing:calc(.08em * var(--key-track));color:var(--dim);overflow-wrap:anywhere}
    .opt.on .sub{color:inherit}`; }
  /* The theme names to show: `looks:` (installed ones, in that order), else JamBoard + every "Jam " theme by name. */
  _names(themes) {
    const all = Object.keys(themes);
    if (this._config.looks) return [...new Set(this._config.looks.map(x => x.trim()))].filter(n => all.includes(n));
    return [...(all.includes("JamBoard") ? ["JamBoard"] : []), ...all.filter(n => /^Jam /.test(n)).sort((a, b) => a.localeCompare(b))];
  }
  /* The swatch of a theme (or of the card's own tokens without one): ground, face with "Aa" in its display face and text
     colour, four hue squares. Colours / fonts come from theme data through style properties; decorative (aria-hidden). */
  _swatch(theme, mode) {
    const sw = el("span", "sw"), face = el("span", "sw-face", "Aa"), hues = el("span", "sw-hues");
    sw.setAttribute("aria-hidden", "true");
    const get = keys => (theme ? jlFirst(theme, mode, keys) : "");
    const ground = get(["jam-ink", "primary-background-color"]), slab = get(["jam-slab", "card-background-color", "ha-card-background"]);
    const fg = get(["jam-fg", "primary-text-color"]);
    sw.style.background = ground || "var(--ink)";
    sw.style.border = "1px solid var(--line)";
    // A theme without its own face or text colour shows both in the card's tokens, so the sample always reads.
    face.style.background = slab && fg ? slab : "var(--slab)";
    face.style.color = slab && fg ? fg : "var(--fg)";
    const font = get(["jam-display", "ha-font-family-heading", "primary-font-family"]);
    if (font) face.style.fontFamily = font;
    face.style.fontWeight = get(["jam-display-weight"]) || "700";
    const tt = get(["jam-display-case"]);
    if (/^(uppercase|lowercase|none|capitalize)$/.test(tt)) face.style.textTransform = tt;
    const rad = get(["jam-radius-card"]);
    if (/^[\d.]+(px|rem|em)$/.test(rad)) face.style.borderRadius = rad;
    const hueVals = JL_HUES.map(k => get([k]));
    const fb = [get(["primary-color"]), get(["accent-color"])];
    hueVals.forEach((v, i) => { const q = el("i"); q.style.background = v || fb[i % 2] || `var(--${JL_HUES[i].slice(4)})`; hues.append(q); });
    sw.append(face, hues);
    return sw;
  }
  _tile(key, name, sub, theme, mode, on, detail) {
    const {root, face} = paper("button", `jam-looks|${key}`, {kind: "key", cls: "key press opt" + (on ? " on" : "")});
    root.type = "button";
    root.dataset.theme = key;
    root.setAttribute("aria-pressed", on ? "true" : "false");
    const nm = el("span", "nm", name);
    if (sub) nm.append(el("span", "sub", sub));
    face.append(this._swatch(theme, mode), nm);
    root.onclick = () => {
      if (root.getAttribute("aria-pressed") === "true") return; // HA ignores re-picking the current theme too
      this.dispatchEvent(new CustomEvent("settheme", {detail, bubbles: true, composed: true}));
    };
    return root;
  }
  render(b) {
    const c = this._config, h = this._hass, th = h.themes || {}, themes = th.themes || {};
    const mode = th.darkMode ? "dark" : "light";
    const sel = h.selectedTheme && typeof h.selectedTheme.theme === "string" ? h.selectedTheme.theme : "";
    const {root, face: wrap} = this.paper("looks", {face: "wrap"});
    wrap.append(el("div", "label", c.title != null ? c.title : "Look"));
    const box = el("div", "opts");
    box.setAttribute("role", "group");
    box.setAttribute("aria-label", c.title || "Look");
    for (const n of this._names(themes))
      box.append(this._tile(n, jlName(n), "", themes[n], mode, sel === n, {theme: n, primaryColor: undefined, accentColor: undefined}));
    // System default = the backend theme (frontend.set_theme), shown with that theme's swatch when it is installed.
    const backend = (th.darkMode && th.default_dark_theme) || th.default_theme || "default";
    box.append(this._tile("", "Use system default", backend === "default" ? "Home Assistant" : jlName(backend), themes[backend], mode, !sel,
      {theme: "", primaryColor: undefined, accentColor: undefined}));
    wrap.append(box);
    b.append(root);
  }
  /* A re-render (the pick lands as a new hass.selectedTheme) keeps keyboard focus on the same tile. */
  _render(force) {
    const a = this.shadowRoot && this.shadowRoot.activeElement, k = a && a.dataset ? a.dataset.theme : undefined;
    super._render(force);
    if (k == null) return;
    const t = [...this.shadowRoot.querySelectorAll(".opt")].find(x => x.dataset.theme === k);
    if (t) t.focus({preventScroll: true});
  }
  getCardSize() { return 3; }
}
register("jam-looks", JamLooks, "Jam Looks", "Pick the dashboard look (theme) for yourself: one live swatch per Jam look, like Profile → Theme.");
