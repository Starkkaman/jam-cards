/* GENERATED from src/ by tools/bundle.mjs — edit src/, then run node tools/bundle.mjs */
/* Jam Cards: Saul Bass styled Lovelace cards (same look as the JamBoard / Crew Hub card).
   Rules: flat colour, no gradients, no blur, no rounded corners; heavy uppercase display type; hard cuts.
   No build step, no dependencies. Entity names/states are rendered with textContent only.

   Cards: jam-heading, jam-hero, jam-tile, jam-choice, jam-slider, jam-media.
   Colours come from the JamBoard theme (--jam-* variables, one set per light/dark mode); without the theme the
   cards fall back to the dark "ink" palette. Design rules: docs/DESIGN.md.
   Shared helpers (edge system, paper blocks, actions) are exported on window.JamCards for cards added later. */
(() => {
const VERSION = "0.2.0-dev";

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
  --shadow:var(--jam-shadow,#0a0908);
  --s1:var(--jam-s1,#bd8000); --s2:var(--jam-s2,#1f9fb0); --s3:var(--jam-s3,#d43a1c); --s4:var(--jam-s4,#a66cc4); --s5:var(--jam-s5,#7f9b2a);
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
/* Paper system: .paper root > .shadow (offset slab) + .face (torn clip). Clips come from paper() as --clip/--clip-s,
   torn depth per edge as --tt/--tr/--tb/--tl (added to the face padding so text never sits in a torn zone). */
.host{height:100%;padding:0 6px 6px 0}
.paper{position:relative;display:block;height:100%;--sh:6px}
.shadow{position:absolute;inset:0;background:var(--shadow);clip-path:var(--clip-s);transform:translate(var(--sh),var(--sh));pointer-events:none}
.face{--p-t:12px;--p-r:14px;--p-b:14px;--p-l:16px;position:relative;display:block;height:100%;background:var(--slab);clip-path:var(--clip);
  padding:calc(var(--p-t) + var(--tt,0px)) calc(var(--p-r) + var(--tr,0px)) calc(var(--p-b) + var(--tb,0px)) calc(var(--p-l) + var(--tl,0px))}
.press{cursor:pointer}
.press:active > .face{transform:translate(3px,3px)}
.press:has(.press:active) > .face{transform:none}
/* Cut keys (buttons, chips): small paper with a 3px shadow. */
.key{--sh:3px;min-width:56px;text-align:center}
.key > .face{--p-t:10px;--p-r:12px;--p-b:10px;--p-l:12px;background:var(--slab2);color:var(--fg);border:2px solid transparent;
  font:600 .74rem/1.1 var(--body);letter-spacing:.12em;text-transform:uppercase}
.key:not(:disabled):hover > .face{border-color:var(--dim)}
.key.on > .face{background:var(--ochre);color:var(--ink)}
.key.alert > .face{background:var(--red);color:var(--ink)}
.key:disabled{cursor:default} .key:disabled > .face{color:var(--dim)}
/* Golden Arm bars motif. */
.arm{display:flex;align-items:flex-end;gap:6px;height:44px}
.arm span{background:var(--acc,var(--red))}
@media (prefers-reduced-motion:reduce){*{animation:none!important;transition:none!important}.press:active > .face{transform:none}}
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
/* Minimal Lovelace action support: more-info, toggle, navigate, url, perform-action/call-service, none.
   `confirmation: true | {text}` asks with window.confirm first. */
function runAction(node, hass, action, entityId) {
  const a = action || {action: "more-info"};
  if (a.action === "none") return;
  if (a.confirmation && !window.confirm(a.confirmation.text || "Are you sure?")) return;
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
/* tap_action / hold_action (500 ms) / double_tap_action (<=250 ms) on one node. Without double_tap_action a tap
   runs at once (no delay). Presses on nested buttons/sliders are ignored. `hass` may be a getter (() => hass).
   Non-button nodes also get Enter/Space = tap. */
function bindActions(node, hass, config, entityId) {
  const c = config || {}, H = () => (typeof hass === "function" ? hass() : hass);
  const run = a => runAction(node, H(), a, entityId);
  const inner = e => { const b = e.target.closest && e.target.closest("button,[role=slider]"); return !!b && b !== node; };
  let hold = null, held = false, tap = null;
  if (c.hold_action) {
    node.addEventListener("pointerdown", e => {
      if (e.button || inner(e)) return;
      held = false; clearTimeout(hold);
      hold = setTimeout(() => { held = true; run(c.hold_action); }, 500);
    });
    for (const t of ["pointerup", "pointercancel", "pointerleave"]) node.addEventListener(t, () => clearTimeout(hold));
    node.addEventListener("contextmenu", e => e.preventDefault());
  }
  node.addEventListener("click", e => {
    if (inner(e)) return;
    if (held) { held = false; return; }
    if (!c.double_tap_action) { run(c.tap_action); return; }
    if (tap) { clearTimeout(tap); tap = null; run(c.double_tap_action); return; }
    tap = setTimeout(() => { tap = null; run(c.tap_action); }, 250);
  });
  if (node.tagName !== "BUTTON") node.addEventListener("keydown", e => {
    if (e.target !== node || (e.key !== "Enter" && e.key !== " ")) return;
    e.preventDefault(); run(c.tap_action);
  });
}
function toggleable(id) {
  const d = (id || "").split(".")[0];
  return ["switch", "light", "fan", "input_boolean", "automation", "siren", "humidifier", "media_player", "remote", "climate"].includes(d);
}
/* <ha-icon> inside Home Assistant, null elsewhere (the preview has no ha-icon). */
function icon(name) {
  if (!name || !customElements.get("ha-icon")) return null;
  const i = document.createElement("ha-icon");
  i.setAttribute("icon", name); i.icon = name;
  return i;
}

/* ---------- edge system (DESIGN "Edge system") ---------- */
/* FNV-1a 32-bit hash of a string. */
function seed(str) {
  const s = String(str);
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 0x01000193); }
  return h >>> 0;
}
/* mulberry32: deterministic PRNG, returns () => [0,1). */
function rng(a) {
  a >>>= 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), a | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const CORNERS = ["tl", "tr", "br", "bl"];
const cutCorner = s => CORNERS[(s >>> 0) % 4];
/* One polygon coordinate: pct% moved by off px (calc() only when both are non-zero). */
function coord(pct, off) {
  const p = +pct.toFixed(1), o = +off.toFixed(1);
  if (!o) return p + "%";
  if (!p) return o + "px";
  return `calc(${p}% ${o < 0 ? "-" : "+"} ${Math.abs(o)}px)`;
}
/* CSS polygon() for a paper face. edges: any of "t","r","b","l" are torn (others straight); a torn edge gets a point
   about every `step`% jittered inward 0..depth px. cut: null | true (corner picked by seed) | "tl"|"tr"|"br"|"bl"
   cuts that corner by a 14-18 px diagonal. Same arguments = same string. */
function tornPath(s, {edges = "b", depth = 5, step = 7, cut = null} = {}) {
  s >>>= 0;
  const r = rng(s), pts = [];
  const corner = cut === true ? cutCorner(s) : cut;
  const cs = corner ? 14 + ((s >>> 2) % 5) : 0;
  const P = (x, xo, y, yo) => pts.push(coord(x, xo) + " " + coord(y, yo));
  const tear = (e, f) => {
    if (!edges.includes(e)) return;
    for (let p = step; p < 100 - step / 2; p += step) f(Math.min(99, Math.max(1, p + (r() - .5) * step * .6)), r() * depth);
  };
  if (corner === "tl") { P(0, 0, 0, cs); P(0, cs, 0, 0); } else P(0, 0, 0, 0);
  tear("t", (q, d) => P(q, 0, 0, d));
  if (corner === "tr") { P(100, -cs, 0, 0); P(100, 0, 0, cs); } else P(100, 0, 0, 0);
  tear("r", (q, d) => P(100, -d, q, 0));
  if (corner === "br") { P(100, 0, 100, -cs); P(100, -cs, 100, 0); } else P(100, 0, 100, 0);
  tear("b", (q, d) => P(100 - q, 0, 100, -d));
  if (corner === "bl") { P(0, cs, 100, 0); P(0, 0, 100, -cs); } else P(0, 0, 100, 0);
  tear("l", (q, d) => P(0, d, 100 - q, 0));
  return `polygon(${pts.join(",")})`;
}
/* Cut-paper block: <tag class="paper cls"> > <.shadow aria-hidden> + <.face faceCls>. key: seed number or string.
   The shadow uses seed+1 with the same edges/cut corner. Returns {root, face}; put content in face. */
function paper(tag, key, {edges = "b", depth = 5, step = 7, cut = null, cls = "", face = ""} = {}) {
  const s = typeof key === "number" ? key >>> 0 : seed(key);
  const o = {edges, depth, step, cut: cut === true ? cutCorner(s) : cut};
  const inner = tag === "button" ? "span" : "div";
  const root = el(tag, "paper" + (cls ? " " + cls : ""));
  const sh = el(inner, "shadow"); sh.setAttribute("aria-hidden", "true");
  const f = el(inner, "face" + (face ? " " + face : ""));
  root.style.setProperty("--clip", tornPath(s, o));
  root.style.setProperty("--clip-s", tornPath(s + 1, o));
  for (const e of "trbl") root.style.setProperty("--t" + e, edges.includes(e) ? depth + "px" : "0px");
  root.append(sh, f);
  return {root, face: f};
}
/* A cut key: real <button> on the paper system (classes "key press" + cls, e.g. "on", "alert"). Label via textContent. */
function cutKey(label, key, cls) {
  const {root, face} = paper("button", key, {edges: "rb", depth: 2.5, step: 14, cls: "key press" + (cls ? " " + cls : "")});
  root.type = "button"; face.textContent = String(label);
  return root;
}
/* Golden Arm motif: 3-5 jagged vertical bars of varied height/width in var(--acc), aria-hidden. */
function armBars(key) {
  const s = typeof key === "number" ? key >>> 0 : seed(key), r = rng(s ^ 0x9e3779b9);
  const box = el("div", "arm"); box.setAttribute("aria-hidden", "true");
  for (let i = 0, n = 3 + Math.floor(r() * 3); i < n; i++) {
    const b = el("span");
    b.style.width = Math.round(10 + r() * 9) + "px";
    b.style.height = Math.round(38 + r() * 62) + "%";
    b.style.clipPath = tornPath(s + 7919 * (i + 1), {edges: "t", depth: 7, step: 30});
    box.append(b);
  }
  return box;
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
  /* Card-level paper block seeded by card type + key (entity id or title): same config = same edges. */
  paper(key, opts) { return paper("div", this.localName + "|" + key, opts); }
  getCardSize() { return 2; }
  getGridOptions() { return {columns: 12, rows: "auto", min_columns: 3}; }
}

/* Shared API for cards (src/cards/) and for debugging. */
window.JamCards = Object.freeze({
  VERSION, BASE_CSS, JamBase, seed, rng, tornPath, paper, cutKey, armBars, icon, bindActions, runAction,
  el, stateObj, friendly, fmtState, tone, fire, moreInfo, navigate, toggleable, UNAVAILABLE,
});
window.customCards = window.customCards || [];
/* Every card file ends with register(tag, Class, name, description). */
function register(tag, cls, name, description) {
  if (!customElements.get(tag)) customElements.define(tag, cls);
  if (!window.customCards.some(c => c.type === tag)) window.customCards.push({type: tag, name, description, preview: false});
}

/* ---------- jam-choice: select / input_select as cut paper chips ----------
   {type: custom:jam-choice, entity, name?, options?: [subset/order], columns?} */
class JamChoice extends JamBase {
  validate(c) {
    if (!c.entity || !/^(input_)?select\./.test(c.entity)) throw new Error("jam-choice: entity must be a select or input_select");
  }
  watched() { return [this._config.entity]; }
  css() { return `
    .wrap{display:grid;gap:10px;align-content:start}
    .opts{display:grid;grid-template-columns:repeat(var(--cols,auto-fill),minmax(var(--min,92px),1fr));gap:8px}
    .opt{text-align:left}
    .opt > .face{--p-t:12px;--p-b:12px;--p-l:10px;--p-r:10px;min-height:46px;display:flex;align-items:center;
      font-size:.76rem;letter-spacing:.08em;overflow-wrap:break-word;min-width:0}
    .opt.busy > .face{border-color:var(--ochre)}`; }
  render(b) {
    const c = this._config, h = this._hass, s = stateObj(h, c.entity);
    const {root, face: wrap} = this.paper(c.entity, {edges: "rb", face: `wrap stripe s-${s && !UNAVAILABLE.has(s.state) ? "on" : "alert"}`});
    wrap.append(el("div", "label", c.name || friendly(h, c.entity)));
    const box = el("div", "opts");
    if (c.columns) box.style.setProperty("--cols", String(c.columns));
    const all = (s && s.attributes.options) || [];
    const list = c.options ? c.options.filter(o => all.includes(o)) : all;
    const dom = c.entity.split(".")[0];
    for (const o of list) {
      const on = !!s && s.state === o;
      const btn = cutKey(o, `jam-choice|${c.entity}|${o}`, "opt" + (on ? " on" : ""));
      btn.setAttribute("aria-pressed", on ? "true" : "false");
      btn.disabled = !s || UNAVAILABLE.has(s.state);
      btn.onclick = () => { btn.classList.add("busy"); h.callService(dom, "select_option", {entity_id: c.entity, option: o}); };
      box.append(btn);
    }
    if (!list.length) box.append(el("div", "c-dim", s ? "No options" : "Entity not found"));
    wrap.append(box);
    b.append(root);
  }
  getCardSize() { return 3; }
}
register("jam-choice", JamChoice, "Jam Choice", "Select / input_select options as chunky chips.");

/* ---------- jam-heading: section label + big title over a torn accent rule ----------
   {type: custom:jam-heading, title, kicker?, accent?: ochre|red|teal, entities?: [ids shown as chips],
    tap_action?, hold_action?, double_tap_action?} */
class JamHeading extends JamBase {
  validate(c) { if (!c.title) throw new Error("jam-heading: title is required"); }
  watched() { return this._config.entities || []; }
  css() { return `
    .h{display:grid;gap:6px;padding:6px 2px 0}
    .row{display:flex;gap:10px 16px;align-items:flex-end;justify-content:space-between;flex-wrap:wrap}
    .rule{height:8px;background:var(--acc,var(--ochre))}
    h2{font-size:clamp(1.6rem,5.4vw,2.3rem)} .t{display:grid;gap:4px;min-width:0}
    .chips{display:flex;gap:6px;flex-wrap:wrap}
    .h.tap{cursor:pointer}`; }
  render(b) {
    const c = this._config, h = this._hass;
    const box = el("div", "h");
    box.style.setProperty("--acc", `var(--${c.accent || "ochre"})`);
    if (c.tap_action || c.hold_action || c.double_tap_action) {
      box.classList.add("tap", "focusable"); box.tabIndex = 0; box.setAttribute("role", "button");
      bindActions(box, () => this._hass, {tap_action: {action: "none"}, ...c});
    }
    const row = el("div", "row"), t = el("div", "t");
    if (c.kicker) t.append(el("div", "label", c.kicker));
    t.append(el("h2", "disp", c.title));
    row.append(t);
    const ids = c.entities || [];
    if (ids.length) {
      const chips = el("div", "chips");
      for (const id of ids) {
        const s = stateObj(h, id);
        const b2 = el("button", `chip c-${tone(s) === "off" ? "dim" : tone(s)}`, fmtState(h, s));
        b2.title = friendly(h, id); b2.onclick = e => { e.stopPropagation(); moreInfo(this, id); };
        chips.append(b2);
      }
      row.append(chips);
    }
    const rule = el("div", "rule");
    rule.style.clipPath = tornPath(seed("jam-heading|" + c.title), {edges: "b", depth: 3, step: 4});
    box.append(row, rule);
    b.append(box);
  }
  getCardSize() { return 1; }
}
register("jam-heading", JamHeading, "Jam Heading", "Section title slab with an accent rule and optional state chips.");

/* ---------- jam-hero: torn paper slab with a cut corner and Golden Arm bars ----------
   {type: custom:jam-hero, kicker?, title?, title_entity?, meta_entities?: [ids], power_entity?, off_title?, off_text?,
    chips?: [{entity, name?, show_state?: "on", hide_value?}], accent?} */
class JamHero extends JamBase {
  watched() {
    const c = this._config;
    return [c.title_entity, c.power_entity, ...(c.meta_entities || []), ...(c.chips || []).map(x => x.entity)].filter(Boolean);
  }
  css() { return `
    .hero{--p-t:18px;--p-r:20px;--p-b:22px;--p-l:20px;background:var(--paper);color:var(--paper-fg);display:grid;gap:12px;align-content:start}
    .hero .label{color:var(--paper-dim)}
    h1{font-size:clamp(2.7rem,11vw,4.8rem);line-height:.9;letter-spacing:-.005em} h1 span{color:var(--acc,var(--red))}
    .meta{display:flex;gap:6px 16px;flex-wrap:wrap;font-weight:500}
    .meta span{min-width:0;overflow-wrap:anywhere}
    .meta span + span::before{content:"";display:inline-block;width:7px;height:7px;background:var(--acc,var(--red));margin:0 12px 1px 0;vertical-align:middle}
    .chips{display:flex;gap:6px;flex-wrap:wrap}
    .chips .chip{background:var(--paper-fg);color:var(--paper);border-color:var(--paper-fg);padding:4px 8px}
    .chips .chip.hot{background:var(--acc,var(--red));border-color:var(--acc,var(--red));color:var(--paper)}
    .off h1{color:var(--paper-dim)}`; }
  render(b) {
    const c = this._config, h = this._hass;
    const key = c.title_entity || c.title || c.kicker || "hero";
    const {root, face: hero} = this.paper(key, {edges: "rb", cut: true, face: "hero"});
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
    hero.append(h1, armBars("jam-hero|" + key));
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
    b.append(root);
  }
  getCardSize() { return 4; }
}
register("jam-hero", JamHero, "Jam Hero", "Paper slab with clipped corner: big title from an entity, meta line and chips.");

/* ---------- jam-media: now playing + transport keys ----------
   {type: custom:jam-media, entity (media_player), name?, controls?: [prev, play_pause, next, stop]} */
class JamMedia extends JamBase {
  validate(c) { if (!c.entity || !c.entity.startsWith("media_player.")) throw new Error("jam-media: entity must be a media_player"); }
  watched() { return [this._config.entity]; }
  css() { return `
    .wrap{display:grid;gap:10px;align-content:start}
    .title{font-family:var(--display);font-weight:900;font-size:1.7rem;line-height:.95;text-transform:uppercase;overflow-wrap:anywhere}
    .sub{color:var(--dim);overflow-wrap:anywhere}
    .ctl{display:flex;gap:8px;flex-wrap:wrap}
    .ctl .key{min-width:72px}
    .ctl .key > .face{--p-t:12px;--p-b:12px;--p-l:14px;--p-r:14px}`; }
  render(b) {
    const c = this._config, h = this._hass, s = stateObj(h, c.entity);
    const t = tone(s);
    const {root, face: wrap} = this.paper(c.entity, {edges: "rb", face: `wrap stripe s-${t}${!s || UNAVAILABLE.has(s.state) ? " unavail" : ""}`});
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
      const btn = cutKey(m[0], `jam-media|${c.entity}|${k}`, k === "play_pause" ? "main on" : "");
      btn.disabled = !s || UNAVAILABLE.has(s.state);
      btn.onclick = () => h.callService("media_player", m[1], {entity_id: c.entity});
      ctl.append(btn);
    }
    wrap.append(ctl);
    b.append(root);
  }
}
register("jam-media", JamMedia, "Jam Media", "Now playing and transport buttons for a media player.");

/* ---------- jam-slider: cut paper strip for number / input_number / light brightness / media volume / fan speed ----------
   {type: custom:jam-slider, entity, name?, min?, max?, step?} */
class JamSlider extends JamBase {
  validate(c) { if (!c.entity) throw new Error("jam-slider: entity is required"); }
  watched() { return [this._config.entity]; }
  css() { return `
    .wrap{display:grid;gap:10px;align-content:start}
    .row{display:flex;justify-content:space-between;align-items:baseline;gap:10px}
    .v{font-family:var(--display);font-weight:900;font-size:1.7rem;line-height:1}
    .track{position:relative;height:32px;cursor:pointer;touch-action:none}
    .strip{position:absolute;inset:0;background:var(--line)}
    .fill{position:absolute;inset:0 auto 0 0;background:var(--ochre)}
    .track:focus-visible{outline:3px solid var(--ochre);outline-offset:2px}`; }
  _model() {
    const c = this._config, s = stateObj(this._hass, c.entity), d = c.entity.split(".")[0];
    if (!s) return null;
    const a = s.attributes;
    if (d === "light") return {d, min: 0, max: 100, step: 1, v: s.state === "on" ? Math.round((a.brightness || 0) / 2.55) : 0, unit: "%"};
    if (d === "media_player") return {d, min: 0, max: 100, step: 1, v: Math.round((a.volume_level || 0) * 100), unit: "%"};
    if (d === "fan") return {d, min: 0, max: 100, step: a.percentage_step || 1, v: s.state === "on" ? Math.round(a.percentage || 0) : 0, unit: "%", int: true};
    return {d, min: c.min ?? a.min ?? 0, max: c.max ?? a.max ?? 100, step: c.step ?? a.step ?? 1, v: Number(s.state), unit: a.unit_of_measurement || ""};
  }
  _send(v) {
    const c = this._config, h = this._hass, m = this._model();
    if (!m) return;
    if (m.d === "light") h.callService("light", "turn_on", {entity_id: c.entity, brightness_pct: v});
    else if (m.d === "media_player") h.callService("media_player", "volume_set", {entity_id: c.entity, volume_level: v / 100});
    else if (m.d === "fan") h.callService("fan", "set_percentage", {entity_id: c.entity, percentage: v});
    else h.callService(m.d, "set_value", {entity_id: c.entity, value: v});
  }
  render(b) {
    const c = this._config, h = this._hass, m = this._model();
    const {root, face: wrap} = this.paper(c.entity, {edges: "rb", face: `wrap stripe s-${m && !isNaN(m.v) ? (m.v > m.min ? "on" : "off") : "alert"}`});
    const row = el("div", "row");
    row.append(el("div", "label", c.name || friendly(h, c.entity)));
    const val = el("div", "v num", m && !isNaN(m.v) ? `${m.v}${m.unit ? " " + m.unit : ""}` : "—");
    row.append(val); wrap.append(row);
    const sd = seed("jam-slider|" + c.entity);
    const track = el("div", "track"), strip = el("div", "strip"), fill = el("div", "fill");
    strip.style.clipPath = tornPath(sd + 3, {edges: "tb", depth: 3, step: 5});
    fill.style.clipPath = tornPath(sd + 5, {edges: "r", depth: 9, step: 12});
    strip.append(fill); track.append(strip); wrap.append(track); b.append(root);
    if (!m || isNaN(m.v)) return;
    const pct = v => Math.max(0, Math.min(100, ((v - m.min) / ((m.max - m.min) || 1)) * 100));
    fill.style.width = pct(m.v) + "%";
    track.tabIndex = 0; track.setAttribute("role", "slider");
    track.setAttribute("aria-valuemin", m.min); track.setAttribute("aria-valuemax", m.max); track.setAttribute("aria-valuenow", m.v);
    const snap = x => Math.round((m.min + x * (m.max - m.min)) / m.step) * m.step;
    let cur = m.v;
    const at = e => { const r = track.getBoundingClientRect(); return Math.max(0, Math.min(1, (e.clientX - r.left) / r.width)); };
    const show = v => {
      cur = m.int ? Math.round(v) : Number(v.toFixed(6));
      fill.style.width = pct(cur) + "%"; val.textContent = `${cur}${m.unit ? " " + m.unit : ""}`;
      track.setAttribute("aria-valuenow", cur);
    };
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
register("jam-slider", JamSlider, "Jam Slider", "Cut paper strip for numbers, light brightness, media volume or fan speed.");

/* ---------- jam-tile: entity block with status stripe ----------
   {type: custom:jam-tile, entity, name?, label?, control?: auto|toggle|lock|press|none, tones?: {state: on|alert|calm|off},
    tap_action?, hold_action?, double_tap_action?, show_last_changed?}
   control auto: lock.* -> lock, button./input_button. -> press, on/off toggleable entities -> toggle. */
class JamTile extends JamBase {
  validate(c) { if (!c.entity) throw new Error("jam-tile: entity is required"); }
  watched() { return [this._config.entity]; }
  css() { return `
    .tile{--p-r:12px;display:grid;gap:4px;min-height:78px;align-content:center}
    .row{display:flex;flex-wrap:wrap;gap:8px 12px;justify-content:space-between;align-items:center}
    .main{flex:1 1 0;max-width:100%}
    .name{font:600 .74rem/1.2 var(--body);letter-spacing:.14em;text-transform:uppercase;color:var(--dim);overflow-wrap:anywhere}
    .val{font-family:var(--display);font-weight:900;font-size:1.7rem;line-height:.95;text-transform:uppercase;overflow-wrap:break-word}
    .sw{flex:none;min-width:64px}
    .sub{color:var(--dim);font-size:.8rem}`; }
  _control(s) {
    const c = this._config, d = c.entity.split(".")[0], ctl = c.control || "auto";
    if (ctl !== "auto") return ctl;
    if (d === "lock") return "lock";
    if (d === "button" || d === "input_button") return "press";
    return toggleable(c.entity) && s && (s.state === "on" || s.state === "off") ? "toggle" : "none";
  }
  _key(s) {
    const c = this._config, h = this._hass, d = c.entity.split(".")[0], ctl = this._control(s);
    if (!s) return null;
    const k = `jam-tile|${c.entity}|key`;
    let key, call;
    if (ctl === "toggle") {
      const on = s.state === "on";
      key = cutKey(on ? "On" : "Off", k, "sw" + (on ? " on" : ""));
      key.setAttribute("aria-pressed", on ? "true" : "false");
      call = () => h.callService("homeassistant", "toggle", {entity_id: c.entity});
    } else if (ctl === "lock") {
      const locked = s.state === "locked";
      key = cutKey(locked ? "Unlock" : "Lock", k, "sw" + (s.state === "jammed" ? " alert" : ""));
      call = () => h.callService("lock", locked ? "unlock" : "lock", {entity_id: c.entity});
    } else if (ctl === "press") {
      key = cutKey("Press", k, "sw");
      call = () => h.callService(d, "press", {entity_id: c.entity});
    } else return null;
    if (ctl !== "toggle") key.disabled = UNAVAILABLE.has(s.state);
    key.onclick = e => { e.stopPropagation(); call(); };
    return key;
  }
  render(b) {
    const c = this._config, h = this._hass, s = stateObj(h, c.entity);
    const t = tone(s, c.tones);
    const {root, face} = this.paper(c.entity, {cls: "press", face: `tile stripe s-${t}${!s || UNAVAILABLE.has(s.state) ? " unavail" : ""}`});
    root.tabIndex = 0; root.setAttribute("role", "button");
    bindActions(root, () => this._hass, c, c.entity);
    const row = el("div", "row");
    const left = el("div", "main"); /* basis 0: the key wraps below only when the longest value word needs the room */
    left.append(el("div", "name", c.name || friendly(h, c.entity)));
    left.append(el("div", `val num c-${t === "off" ? "dim" : t}`, c.label || fmtState(h, s)));
    row.append(left);
    const key = this._key(s);
    if (key) row.append(key);
    face.append(row);
    if (c.show_last_changed && s) face.append(el("div", "sub num", new Date(s.last_changed).toLocaleString([], {hour: "2-digit", minute: "2-digit", month: "short", day: "numeric"})));
    b.append(root);
  }
  getGridOptions() { return {columns: 6, rows: "auto", min_columns: 3}; }
}
register("jam-tile", JamTile, "Jam Tile", "Any entity with a coloured status stripe and an optional on/off, lock or press key.");

console.info(`%c JAM CARDS %c ${VERSION} `, "background:#d43a1c;color:#ece2c9;font-weight:900", "background:#141210;color:#e5a31b");
})();
