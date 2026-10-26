/* Jam Cards: Saul Bass styled Lovelace cards (same look as the JamBoard / Crew Hub card).
   Rules: flat colour, no gradients, no blur, no rounded corners; heavy uppercase display type; hard cuts.
   No build step, no dependencies. Entity names/states are rendered with textContent only.

   Cards: jam-heading, jam-hero, jam-tile, jam-choice, jam-slider, jam-media.
   Colours come from the JamBoard theme (--jam-* variables, one set per light/dark mode); without the theme the
   cards fall back to the dark "ink" palette. */
(() => {
const VERSION = "0.1.0";
const FONT_HREF = "https://fonts.googleapis.com/css2?family=Londrina+Solid:wght@400;900&family=Jost:wght@400;500;600&display=swap";

function loadFonts() {
  if (document.head.querySelector('link[data-jam-fonts]')) return;
  const l = document.createElement("link");
  l.rel = "stylesheet"; l.href = FONT_HREF; l.dataset.jamFonts = "1";
  document.head.append(l);
}

/* Shared tokens + primitives. Every card gets this in its shadow root. */
const BASE_CSS = `
:host{
  --ink:var(--jam-ink,#141210); --slab:var(--jam-slab,#1f1c19); --slab2:var(--jam-slab2,#2a2622);
  --paper:var(--jam-paper,#ece2c9); --paper-fg:var(--jam-paper-fg,#141210); --paper-dim:var(--jam-paper-dim,#5c5446);
  --fg:var(--jam-fg,#ece2c9); --dim:var(--jam-dim,#9a8f7c); --line:var(--jam-line,#34302a);
  --ochre:var(--jam-ochre,#e5a31b); --red:var(--jam-red,#d43a1c); --teal:var(--jam-teal,#3f9aa5);
  --display:var(--jam-display,"Londrina Solid","Arial Black",Impact,sans-serif);
  --body:var(--jam-body,"Jost","Helvetica Neue",Arial,sans-serif);
  display:block; font:15px/1.45 var(--body); color:var(--fg);
}
*{box-sizing:border-box}
ha-card,.card{background:var(--slab);color:var(--fg);border-radius:0;box-shadow:none;border:0;overflow:hidden;height:100%}
.label{font:600 .72rem/1.25 var(--body);letter-spacing:.16em;text-transform:uppercase;color:var(--dim)}
.disp{font-family:var(--display);font-weight:900;text-transform:uppercase;line-height:.92;letter-spacing:.01em;margin:0;text-wrap:balance}
.chip{font:600 .66rem/1 var(--body);letter-spacing:.14em;text-transform:uppercase;padding:5px 7px;border:1.5px solid currentColor;flex:none;background:none;color:inherit}
button{font:inherit;color:inherit;background:none;border:0;padding:0;cursor:pointer;-webkit-tap-highlight-color:transparent}
button:focus-visible,.focusable:focus-visible{outline:3px solid var(--ochre);outline-offset:2px}
.stripe{border-left:6px solid var(--line)}
.s-on{border-left-color:var(--ochre)} .s-alert{border-left-color:var(--red)} .s-calm{border-left-color:var(--teal)}
.c-on{color:var(--ochre)} .c-alert{color:var(--red)} .c-calm{color:var(--teal)} .c-dim{color:var(--dim)}
.num{font-variant-numeric:tabular-nums}
.unavail{opacity:.55}
@media (prefers-reduced-motion:reduce){*{animation:none!important;transition:none!important}}
`;

/* ---------- helpers ---------- */
const UNAVAILABLE = new Set(["unavailable", "unknown"]);
const ON_STATES = new Set(["on", "playing", "open", "unlocked", "home", "heat", "cool", "heat_cool", "auto", "active", "cleaning"]);
const ALERT_STATES = new Set(["problem", "unavailable", "jammed", "error", "triggered"]);

function el(tag, cls, text) {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (text !== undefined && text !== null) e.textContent = String(text);
  return e;
}
function stateObj(hass, id) { return hass && id ? hass.states[id] : undefined; }
function friendly(hass, id, fallback) {
  const s = stateObj(hass, id);
  return fallback || (s && s.attributes.friendly_name) || id || "";
}
/* Display a state the way HA would (translated + unit) when the frontend helper exists. */
function fmtState(hass, s) {
  if (!s) return "—";
  try { if (hass && typeof hass.formatEntityState === "function") return hass.formatEntityState(s); } catch (e) { /* fall through */ }
  const u = s.attributes.unit_of_measurement;
  return u ? `${s.state} ${u}` : s.state;
}
/* Tone of an entity: on (ochre) / alert (red) / calm (teal) / off (line). */
function tone(s, overrides) {
  if (!s) return "alert";
  const st = String(s.state).toLowerCase();
  if (overrides && overrides[st]) return overrides[st];
  if (ALERT_STATES.has(st)) return "alert";
  if (s.attributes.device_class === "problem" && st === "on") return "alert";
  if (ON_STATES.has(st)) return "on";
  if (st === "off" || st === "closed" || st === "locked" || st === "idle" || st === "standby" || st === "paused") return "off";
  return "calm";
}
function fire(node, type, detail) {
  node.dispatchEvent(new CustomEvent(type, {detail, bubbles: true, composed: true}));
}
function moreInfo(node, entityId) { if (entityId) fire(node, "hass-more-info", {entityId}); }
function navigate(path) {
  history.pushState(null, "", path);
  window.dispatchEvent(new CustomEvent("location-changed", {detail: {replace: false}}));
}
/* Minimal Lovelace action support: more-info, toggle, navigate, url, perform-action/call-service, none. */
function runAction(node, hass, action, entityId) {
  const a = action || {action: "more-info"};
  switch (a.action) {
    case "none": return;
    case "toggle": if (entityId) hass.callService("homeassistant", "toggle", {entity_id: entityId}); return;
    case "navigate": if (a.navigation_path) navigate(a.navigation_path); return;
    case "url": if (a.url_path) window.open(a.url_path, "_blank", "noopener"); return;
    case "perform-action": case "call-service": {
      const svc = a.perform_action || a.service;
      if (!svc || !svc.includes(".")) return;
      const [d, s] = svc.split(".", 2);
      hass.callService(d, s, a.data || a.service_data || {}, a.target);
      return;
    }
    default: moreInfo(node, a.entity || entityId);
  }
}
function toggleable(id) {
  const d = (id || "").split(".")[0];
  return ["switch", "light", "fan", "input_boolean", "automation", "siren", "humidifier", "media_player", "remote", "climate"].includes(d);
}

/* ---------- base class ---------- */
class JamBase extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({mode: "open"});
    this._config = null; this._hass = null; this._sig = null;
    loadFonts();
  }
  setConfig(config) {
    if (!config) throw new Error("Invalid configuration");
    this.validate(config);
    this._config = config; this._sig = null; this._render(true);
  }
  validate() {}
  set hass(h) {
    this._hass = h;
    const sig = this.watched().map(id => { const s = h.states[id]; return s ? s.state + "|" + s.last_updated : "-"; }).join(",");
    if (sig !== this._sig) { this._sig = sig; this._render(false); }
  }
  get hass() { return this._hass; }
  watched() { return []; }
  css() { return ""; }
  _render(force) {
    if (!this._config) return;
    const root = this.shadowRoot;
    if (force || !root.firstChild) {
      root.textContent = "";
      const st = el("style"); st.textContent = BASE_CSS + this.css();
      root.append(st);
      this._body = el("div", "host");
      root.append(this._body);
    }
    if (!this._hass) return;
    this._body.textContent = "";
    this.render(this._body);
  }
  render() {}
  getCardSize() { return 2; }
  getGridOptions() { return {columns: 12, rows: "auto", min_columns: 3}; }
}

/* ---------- jam-heading: section slab label + big title ----------
   {type: custom:jam-heading, title, kicker?, accent?: ochre|red|teal, entities?: [ids shown as chips], tap_action?} */
class JamHeading extends JamBase {
  validate(c) { if (!c.title) throw new Error("jam-heading: title is required"); }
  watched() { return this._config.entities || []; }
  css() { return `
    .h{display:flex;gap:10px 16px;align-items:flex-end;justify-content:space-between;flex-wrap:wrap;padding:6px 2px 4px;border-bottom:4px solid var(--acc,var(--ochre))}
    h2{font-size:clamp(1.5rem,5vw,2.1rem)} .t{display:grid;gap:4px;min-width:0}
    .chips{display:flex;gap:6px;flex-wrap:wrap}
    .h.tap{cursor:pointer}`; }
  render(b) {
    const c = this._config, h = this._hass;
    const box = el("div", "h");
    box.style.setProperty("--acc", `var(--${c.accent || "ochre"})`);
    if (c.tap_action) { box.classList.add("tap"); box.tabIndex = 0; box.onclick = () => runAction(this, h, c.tap_action); }
    const t = el("div", "t");
    if (c.kicker) t.append(el("div", "label", c.kicker));
    t.append(el("h2", "disp", c.title));
    box.append(t);
    const ids = c.entities || [];
    if (ids.length) {
      const chips = el("div", "chips");
      for (const id of ids) {
        const s = stateObj(h, id);
        const b2 = el("button", `chip c-${tone(s) === "off" ? "dim" : tone(s)}`, fmtState(h, s));
        b2.title = friendly(h, id); b2.onclick = e => { e.stopPropagation(); moreInfo(this, id); };
        chips.append(b2);
      }
      box.append(chips);
    }
    b.append(box);
  }
  getCardSize() { return 1; }
}

/* ---------- jam-hero: paper slab with clipped corner ----------
   {type: custom:jam-hero, kicker?, title?, title_entity?, meta_entities?: [ids], power_entity?, off_title?, off_text?,
    chips?: [{entity, name?, show_state?: "on"}], accent?} */
class JamHero extends JamBase {
  watched() {
    const c = this._config;
    return [c.title_entity, c.power_entity, ...(c.meta_entities || []), ...(c.chips || []).map(x => x.entity)].filter(Boolean);
  }
  css() { return `
    .hero{background:var(--paper);color:var(--paper-fg);padding:18px 20px 24px;display:grid;gap:12px;
      clip-path:polygon(0 0,100% 0,100% 80%,96% 100%,0 100%)}
    .hero .label{color:var(--paper-dim)}
    h1{font-size:clamp(2.2rem,8vw,3.6rem)} h1 span{color:var(--acc,var(--red))}
    .bar{height:10px;background:var(--acc,var(--red));width:38%}
    .meta{display:flex;gap:6px 16px;flex-wrap:wrap;font-weight:500}
    .meta span{min-width:0;overflow-wrap:anywhere}
    .meta span + span::before{content:"";display:inline-block;width:7px;height:7px;background:var(--acc,var(--red));margin:0 12px 1px 0;vertical-align:middle}
    .chips{display:flex;gap:6px;flex-wrap:wrap}
    .chips .chip{background:var(--paper-fg);color:var(--paper);border-color:var(--paper-fg);padding:4px 8px}
    .chips .chip.hot{background:var(--acc,var(--red));border-color:var(--acc,var(--red));color:var(--paper)}
    .off h1{color:var(--paper-dim)}`; }
  render(b) {
    const c = this._config, h = this._hass;
    const hero = el("div", "hero");
    hero.style.setProperty("--acc", `var(--${c.accent || "red"})`);
    const pw = c.power_entity ? stateObj(h, c.power_entity) : null;
    const off = pw && (pw.state === "off" || UNAVAILABLE.has(pw.state));
    if (off) hero.classList.add("off");
    if (c.kicker) hero.append(el("div", "label", c.kicker));
    let title = c.title || "";
    if (c.title_entity) { const s = stateObj(h, c.title_entity); title = s && !UNAVAILABLE.has(s.state) ? fmtState(h, s) : (c.title || ""); }
    if (off) title = c.off_title || "Off";
    const h1 = el("h1", "disp focusable", title);
    if (c.title_entity) { h1.tabIndex = 0; h1.style.cursor = "pointer"; h1.onclick = () => moreInfo(this, c.title_entity); }
    hero.append(h1, el("div", "bar"));
    if (off) {
      if (c.off_text) hero.append(el("div", "meta", c.off_text));
    } else {
      const meta = el("div", "meta num");
      for (const id of c.meta_entities || []) {
        const s = stateObj(h, id);
        if (!s || UNAVAILABLE.has(s.state)) continue;
        meta.append(el("span", "", fmtState(h, s)));
      }
      if (meta.childNodes.length) hero.append(meta);
      const chips = el("div", "chips");
      for (const ch of c.chips || []) {
        const s = stateObj(h, ch.entity);
        if (!s) continue;
        if (ch.show_state && s.state !== ch.show_state) continue;
        const btn = el("button", `chip${tone(s) === "on" ? " hot" : ""}`, ch.name ? `${ch.name}${ch.hide_value ? "" : " · " + fmtState(h, s)}` : fmtState(h, s));
        btn.onclick = () => moreInfo(this, ch.entity);
        chips.append(btn);
      }
      if (chips.childNodes.length) hero.append(chips);
    }
    b.append(hero);
  }
  getCardSize() { return 4; }
}

/* ---------- jam-tile: entity block with status stripe ----------
   {type: custom:jam-tile, entity, name?, label?, control?: auto|toggle|none, tones?: {state: on|alert|calm|off},
    tap_action?, show_last_changed?} */
class JamTile extends JamBase {
  validate(c) { if (!c.entity) throw new Error("jam-tile: entity is required"); }
  watched() { return [this._config.entity]; }
  css() { return `
    .tile{background:var(--slab);padding:12px 14px 12px 16px;display:grid;gap:4px;min-height:74px;height:100%;cursor:pointer;align-content:center}
    .row{display:flex;gap:8px 12px;justify-content:space-between;align-items:center}
    .name{font:600 .74rem/1.2 var(--body);letter-spacing:.14em;text-transform:uppercase;color:var(--dim);min-width:0;overflow-wrap:anywhere}
    .val{font-family:var(--display);font-weight:900;font-size:1.45rem;line-height:1;text-transform:uppercase;min-width:0;overflow-wrap:anywhere}
    .sw{font:600 .7rem/1 var(--body);letter-spacing:.14em;text-transform:uppercase;padding:7px 10px;border:2px solid var(--line);color:var(--dim);min-width:52px;text-align:center}
    .sw.on{background:var(--ochre);border-color:var(--ochre);color:var(--ink)}
    .sub{color:var(--dim);font-size:.8rem}`; }
  render(b) {
    const c = this._config, h = this._hass, s = stateObj(h, c.entity);
    const t = tone(s, c.tones);
    const tile = el("div", `tile stripe s-${t}${!s || UNAVAILABLE.has(s.state) ? " unavail" : ""}`);
    tile.tabIndex = 0; tile.setAttribute("role", "button");
    tile.onclick = () => runAction(this, h, c.tap_action, c.entity);
    tile.onkeydown = e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); tile.onclick(); } };
    const row = el("div", "row");
    const left = el("div");
    left.append(el("div", "name", c.name || friendly(h, c.entity)));
    left.append(el("div", `val num c-${t === "off" ? "dim" : t}`, c.label || fmtState(h, s)));
    row.append(left);
    const ctl = c.control || "auto";
    if (s && (ctl === "toggle" || (ctl === "auto" && toggleable(c.entity) && (s.state === "on" || s.state === "off")))) {
      const sw = el("button", `sw${s.state === "on" ? " on" : ""}`, s.state === "on" ? "On" : "Off");
      sw.setAttribute("aria-pressed", s.state === "on" ? "true" : "false");
      sw.onclick = e => { e.stopPropagation(); h.callService("homeassistant", "toggle", {entity_id: c.entity}); };
      row.append(sw);
    }
    tile.append(row);
    if (c.show_last_changed && s) tile.append(el("div", "sub num", new Date(s.last_changed).toLocaleString([], {hour: "2-digit", minute: "2-digit", month: "short", day: "numeric"})));
    b.append(tile);
  }
  getGridOptions() { return {columns: 6, rows: "auto", min_columns: 3}; }
}

/* ---------- jam-choice: select / input_select as chunky chips ----------
   {type: custom:jam-choice, entity, name?, options?: [subset/order], columns?} */
class JamChoice extends JamBase {
  validate(c) {
    if (!c.entity || !/^(input_)?select\./.test(c.entity)) throw new Error("jam-choice: entity must be a select or input_select");
  }
  watched() { return [this._config.entity]; }
  css() { return `
    .wrap{background:var(--slab);padding:12px 14px 14px 16px;display:grid;gap:10px;height:100%}
    .opts{display:grid;grid-template-columns:repeat(var(--cols,auto-fill),minmax(var(--min,92px),1fr));gap:6px}
    .opt{font:600 .74rem/1.15 var(--body);letter-spacing:.1em;text-transform:uppercase;padding:10px 8px;border:2px solid var(--line);
      color:var(--fg);text-align:left;min-height:42px;overflow-wrap:anywhere;transition:background .08s linear}
    .opt:hover{border-color:var(--dim)}
    .opt.on{background:var(--ochre);border-color:var(--ochre);color:var(--ink)}
    .opt.busy{border-color:var(--ochre)}`; }
  render(b) {
    const c = this._config, h = this._hass, s = stateObj(h, c.entity);
    const wrap = el("div", `wrap stripe s-${s && !UNAVAILABLE.has(s.state) ? "on" : "alert"}`);
    wrap.append(el("div", "label", c.name || friendly(h, c.entity)));
    const box = el("div", "opts");
    if (c.columns) box.style.setProperty("--cols", String(c.columns));
    const all = (s && s.attributes.options) || [];
    const list = c.options ? c.options.filter(o => all.includes(o)) : all;
    const dom = c.entity.split(".")[0];
    for (const o of list) {
      const btn = el("button", `opt${s && s.state === o ? " on" : ""}`, o);
      btn.setAttribute("aria-pressed", s && s.state === o ? "true" : "false");
      btn.disabled = !s || UNAVAILABLE.has(s.state);
      btn.onclick = () => { btn.classList.add("busy"); h.callService(dom, "select_option", {entity_id: c.entity, option: o}); };
      box.append(btn);
    }
    if (!list.length) box.append(el("div", "c-dim", s ? "No options" : "Entity not found"));
    wrap.append(box);
    b.append(wrap);
  }
  getCardSize() { return 3; }
}

/* ---------- jam-slider: square fill bar for number / input_number / light brightness / media volume ----------
   {type: custom:jam-slider, entity, name?, min?, max?, step?} */
class JamSlider extends JamBase {
  validate(c) { if (!c.entity) throw new Error("jam-slider: entity is required"); }
  watched() { return [this._config.entity]; }
  css() { return `
    .wrap{background:var(--slab);padding:12px 14px 14px 16px;display:grid;gap:10px;height:100%}
    .row{display:flex;justify-content:space-between;align-items:baseline;gap:10px}
    .v{font-family:var(--display);font-weight:900;font-size:1.45rem;line-height:1}
    .track{position:relative;height:30px;background:var(--line);cursor:pointer;touch-action:none}
    .fill{position:absolute;inset:0 auto 0 0;background:var(--ochre)}
    .track:focus-visible{outline:3px solid var(--ochre);outline-offset:2px}`; }
  _model() {
    const c = this._config, s = stateObj(this._hass, c.entity), d = c.entity.split(".")[0];
    if (!s) return null;
    if (d === "light") return {d, min: 0, max: 100, step: 1, v: s.state === "on" ? Math.round((s.attributes.brightness || 0) / 2.55) : 0, unit: "%"};
    if (d === "media_player") return {d, min: 0, max: 100, step: 1, v: Math.round((s.attributes.volume_level || 0) * 100), unit: "%"};
    const a = s.attributes;
    return {d, min: c.min ?? a.min ?? 0, max: c.max ?? a.max ?? 100, step: c.step ?? a.step ?? 1, v: Number(s.state), unit: a.unit_of_measurement || ""};
  }
  _send(v) {
    const c = this._config, h = this._hass, m = this._model();
    if (!m) return;
    if (m.d === "light") h.callService("light", "turn_on", {entity_id: c.entity, brightness_pct: v});
    else if (m.d === "media_player") h.callService("media_player", "volume_set", {entity_id: c.entity, volume_level: v / 100});
    else h.callService(m.d, "set_value", {entity_id: c.entity, value: v});
  }
  render(b) {
    const c = this._config, h = this._hass, m = this._model();
    const wrap = el("div", `wrap stripe s-${m && !isNaN(m.v) ? (m.v > m.min ? "on" : "off") : "alert"}`);
    const row = el("div", "row");
    row.append(el("div", "label", c.name || friendly(h, c.entity)));
    const val = el("div", "v num", m && !isNaN(m.v) ? `${m.v}${m.unit ? " " + m.unit : ""}` : "—");
    row.append(val); wrap.append(row);
    const track = el("div", "track"); const fill = el("div", "fill");
    track.append(fill); wrap.append(track); b.append(wrap);
    if (!m || isNaN(m.v)) return;
    const pct = v => Math.max(0, Math.min(100, ((v - m.min) / ((m.max - m.min) || 1)) * 100));
    fill.style.width = pct(m.v) + "%";
    track.tabIndex = 0; track.setAttribute("role", "slider");
    track.setAttribute("aria-valuemin", m.min); track.setAttribute("aria-valuemax", m.max); track.setAttribute("aria-valuenow", m.v);
    const snap = x => Math.round((m.min + x * (m.max - m.min)) / m.step) * m.step;
    let cur = m.v;
    const at = e => { const r = track.getBoundingClientRect(); return Math.max(0, Math.min(1, (e.clientX - r.left) / r.width)); };
    const show = v => { cur = Number(v.toFixed(6)); fill.style.width = pct(cur) + "%"; val.textContent = `${cur}${m.unit ? " " + m.unit : ""}`; };
    track.onpointerdown = e => { track.setPointerCapture(e.pointerId); show(snap(at(e))); track.dataset.drag = "1"; };
    track.onpointermove = e => { if (track.dataset.drag) show(snap(at(e))); };
    track.onpointerup = e => { if (!track.dataset.drag) return; delete track.dataset.drag; show(snap(at(e))); this._send(cur); };
    track.onkeydown = e => {
      const k = {ArrowRight: 1, ArrowUp: 1, ArrowLeft: -1, ArrowDown: -1}[e.key];
      if (!k) return; e.preventDefault();
      show(Math.max(m.min, Math.min(m.max, cur + k * m.step))); this._send(cur);
    };
  }
}

/* ---------- jam-media: now playing + transport ----------
   {type: custom:jam-media, entity (media_player), name?, controls?: [prev, play_pause, next, stop]} */
class JamMedia extends JamBase {
  validate(c) { if (!c.entity || !c.entity.startsWith("media_player.")) throw new Error("jam-media: entity must be a media_player"); }
  watched() { return [this._config.entity]; }
  css() { return `
    .wrap{background:var(--slab);padding:12px 14px 14px 16px;display:grid;gap:10px;height:100%}
    .title{font-family:var(--display);font-weight:900;font-size:1.5rem;line-height:1;text-transform:uppercase;overflow-wrap:anywhere}
    .sub{color:var(--dim);overflow-wrap:anywhere}
    .ctl{display:flex;gap:6px;flex-wrap:wrap}
    .ctl button{font:600 .74rem/1 var(--body);letter-spacing:.12em;text-transform:uppercase;padding:11px 14px;border:2px solid var(--line);min-width:64px}
    .ctl button.main{background:var(--ochre);border-color:var(--ochre);color:var(--ink)}`; }
  render(b) {
    const c = this._config, h = this._hass, s = stateObj(h, c.entity);
    const t = tone(s);
    const wrap = el("div", `wrap stripe s-${t}${!s || UNAVAILABLE.has(s.state) ? " unavail" : ""}`);
    wrap.append(el("div", "label", c.name || friendly(h, c.entity)));
    const a = (s && s.attributes) || {};
    const title = a.media_title || a.app_name || (s ? fmtState(h, s) : "—");
    const tt = el("div", "title", title); tt.style.cursor = "pointer"; tt.onclick = () => moreInfo(this, c.entity);
    wrap.append(tt);
    const sub = [a.media_artist, a.media_album_name].filter(Boolean).join(" · ");
    if (sub) wrap.append(el("div", "sub", sub));
    const ctl = el("div", "ctl");
    const playing = s && s.state === "playing";
    const map = {
      prev: ["Prev", "media_previous_track"], next: ["Next", "media_next_track"], stop: ["Stop", "media_stop"],
      play_pause: [playing ? "Pause" : "Play", "media_play_pause"],
    };
    for (const k of c.controls || ["prev", "play_pause", "next"]) {
      const m = map[k]; if (!m) continue;
      const btn = el("button", k === "play_pause" ? "main" : "", m[0]);
      btn.disabled = !s || UNAVAILABLE.has(s.state);
      btn.onclick = () => h.callService("media_player", m[1], {entity_id: c.entity});
      ctl.append(btn);
    }
    wrap.append(ctl);
    b.append(wrap);
  }
}

const CARDS = [
  ["jam-heading", JamHeading, "Jam Heading", "Section title slab with an accent rule and optional state chips."],
  ["jam-hero", JamHero, "Jam Hero", "Paper slab with clipped corner: big title from an entity, meta line and chips."],
  ["jam-tile", JamTile, "Jam Tile", "Any entity with a coloured status stripe and optional on/off button."],
  ["jam-choice", JamChoice, "Jam Choice", "Select / input_select options as chunky chips."],
  ["jam-slider", JamSlider, "Jam Slider", "Square fill bar for numbers, light brightness or media volume."],
  ["jam-media", JamMedia, "Jam Media", "Now playing and transport buttons for a media player."],
];
window.customCards = window.customCards || [];
for (const [tag, cls, name, description] of CARDS) {
  if (!customElements.get(tag)) customElements.define(tag, cls);
  if (!window.customCards.some(c => c.type === tag)) window.customCards.push({type: tag, name, description, preview: false});
}
console.info(`%c JAM CARDS %c ${VERSION} `, "background:#d43a1c;color:#ece2c9;font-weight:900", "background:#141210;color:#e5a31b");
})();
