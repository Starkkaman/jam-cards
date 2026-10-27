/* GENERATED from src/ by tools/bundle.mjs — edit src/, then run node tools/bundle.mjs */
/* Jam Cards: Saul Bass styled Lovelace cards (same look as the JamBoard / Crew Hub card).
   Rules (v0.3 "Poster"): flat colour, no gradients/blur/shadows/rounded corners; straight edges with one cut corner;
   one accent colour per card; heavy uppercase display type; hard cuts.
   No build step, no dependencies. Entity names/states are rendered with textContent only.

   Cards: jam-heading, jam-hero, jam-tile, jam-choice, jam-slider, jam-media, jam-button, jam-gauge, jam-list,
   jam-light, jam-popup, jam-graph, jam-weather, jam-remote.
   Colours come from the JamBoard theme (--jam-* variables, one set per light/dark mode); without the theme the
   cards fall back to the dark "ink" palette. Design rules: docs/DESIGN.md.
   Shared helpers (colour/accent system, edge system, cut blocks, actions) are exported on window.JamCards for cards added later. */
(() => {
const VERSION = "0.3.0-dev";

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
  --ochre:var(--jam-ochre,#e5a31b); --red:var(--jam-red,#e0553b); --teal:var(--jam-teal,#22a39a);
  --blue:var(--jam-blue,#4a7be0); --pink:var(--jam-pink,#e2658f); --violet:var(--jam-violet,#9b6dd6); --green:var(--jam-green,#86a83a);
  --on-fg:var(--jam-on-fg,#141210);
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
/* Chips/pills: flat slab2 block, bottom-right 6px cut, text in the tone colour. */
.chip{font:600 .66rem/1 var(--body);letter-spacing:.14em;text-transform:uppercase;padding:6px 10px 6px 8px;border:0;flex:none;background:var(--slab2);color:inherit;
  clip-path:polygon(0 0,100% 0,100% calc(100% - 6px),calc(100% - 6px) 100%,0 100%)}
button{font:inherit;color:inherit;background:none;border:0;padding:0;cursor:pointer;-webkit-tap-highlight-color:transparent}
button:focus-visible,.focusable:focus-visible{outline:3px solid var(--ochre);outline-offset:2px}
.stripe{border-left:6px solid var(--line)}
.s-on{border-left-color:var(--acc)} .s-alert{border-left-color:var(--red)} .s-calm{border-left-color:var(--teal)}
.c-on{color:var(--acc)} .c-alert{color:var(--red)} .c-calm{color:var(--teal)} .c-dim{color:var(--dim)}
.num{font-variant-numeric:tabular-nums}
.unavail{opacity:.55}
/* Card accent (DESIGN "Colour system"): --acc fills anything on/active, --acc-fg is the text on it. A card's accent
   option sets both on .host; without one the card follows --jam-accent (set by a jam-popup for its children, or by
   the user) and then ochre. */
.host{height:100%;--acc:var(--jam-accent,var(--ochre));--acc-fg:var(--on-fg)}
/* Paper system: .paper root > .face. paper() sets --clip on the root: a straight rectangle with ONE 45° cut corner,
   fixed per kind (card/key/chip/hero/sheet). The face padding is at least the cut size, so text never sits in the cut. */
.paper{position:relative;display:block;height:100%}
.face{--p-t:12px;--p-r:14px;--p-b:14px;--p-l:16px;position:relative;display:block;height:100%;background:var(--slab);clip-path:var(--clip);
  padding:var(--p-t) var(--p-r) var(--p-b) var(--p-l)}
.press{cursor:pointer}
.press:active > .face{transform:translate(2px,2px)}
.press:has(.press:active) > .face{transform:none}
/* Keys (buttons, chips): slab2 off, accent fill + ink text on, red for alert/power. */
.key{min-width:56px;text-align:center}
.key > .face{--p-t:10px;--p-r:12px;--p-b:10px;--p-l:12px;background:var(--slab2);color:var(--fg);border:2px solid transparent;
  font:600 .74rem/1.1 var(--body);letter-spacing:.12em;text-transform:uppercase}
.key:not(:disabled):hover > .face{border-color:var(--dim)}
.key.on > .face{background:var(--acc);color:var(--acc-fg)}
.key.alert > .face{background:var(--red);color:var(--on-fg)}
.key:disabled{cursor:default} .key:disabled > .face{color:var(--dim)}
/* Strips (slider, light brightness, media volume, gauge bar): 32px touch track, 22px slab2 strip, accent fill with a
   straight 8px diagonal end. */
.track{position:relative;height:32px;touch-action:none}
.strip{position:absolute;inset:5px 0;background:var(--slab2)}
.fill{position:absolute;inset:0 auto 0 0;background:var(--acc);clip-path:polygon(0 0,100% 0,calc(100% - 8px) 100%,0 100%)}
.track:focus-visible{outline:3px solid var(--ochre);outline-offset:2px}
/* Golden Arm bars motif (empty-state placeholder): straight bars. */
.arm{display:flex;align-items:flex-end;gap:6px;height:44px}
.arm span{background:var(--acc)}
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

/* ---------- colour system (DESIGN "Colour system") ---------- */
/* Accent names and room aliases -> jam colour token. Unknown names resolve to null (the card falls back). */
const ACCENTS = Object.freeze({
  ochre: "ochre", teal: "teal", blue: "blue", pink: "pink", violet: "violet", green: "green", red: "red", ink: "ink", paper: "paper",
  living: "ochre", kitchen: "teal", master: "blue", marissa: "pink", music: "violet", nerd: "green", alert: "red",
});
function accentName(a) { return (a && ACCENTS[String(a).trim().toLowerCase()]) || null; }
/* CSS fill for an accent ("var(--teal)"), or null when the name is unknown. */
function accentVar(a) { const n = accentName(a); return n ? `var(--${n})` : null; }
/* Text colour on an accent fill: ink (--on-fg) on every hue; paper-fg on paper; a light ink-fg on ink. */
function accentFg(a) {
  const n = accentName(a);
  return n === "paper" ? "var(--paper-fg)" : n === "ink" ? "var(--jam-ink-fg,#ece2c9)" : "var(--on-fg)";
}
/* Sets --acc / --acc-fg on node for a configured accent; returns false (and sets nothing) when it is unknown. */
function setAccent(node, a) {
  const v = accentVar(a);
  if (!v) return false;
  node.style.setProperty("--acc", v); node.style.setProperty("--acc-fg", accentFg(a));
  return true;
}

/* ---------- edge system (DESIGN "Edge system") ---------- */
/* Fixed cut per element kind: [corner, size px]. Every surface is a straight rectangle with exactly one 45° cut corner. */
const CUTS = Object.freeze({card: ["br", 14], key: ["tr", 12], chip: ["br", 6], hero: ["br", 22], sheet: ["tr", 18]});
/* CSS polygon() (5 points) for a rectangle with one corner ("tl"|"tr"|"br"|"bl") cut by a size px diagonal. */
function cutPath(corner = "br", size = 14) {
  const z = +size + "px", n = `calc(100% - ${+size}px)`;
  const P = {
    tl: ["0 " + z, z + " 0", "100% 0", "100% 100%", "0 100%"],
    tr: ["0 0", n + " 0", "100% " + z, "100% 100%", "0 100%"],
    br: ["0 0", "100% 0", "100% " + n, n + " 100%", "0 100%"],
    bl: ["0 0", "100% 0", "100% 100%", z + " 100%", "0 " + n],
  }[corner] || null;
  if (!P) throw new Error("cutPath: corner must be tl, tr, br or bl");
  return `polygon(${P.join(",")})`;
}
/* Legacy (v0.2) helpers, kept exported for compatibility; no card uses them any more.
   seed(str): FNV-1a 32-bit hash. rng(seed): mulberry32 PRNG () => [0,1). tornPath(): the old jagged polygon(). */
function seed(str) {
  const s = String(str);
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 0x01000193); }
  return h >>> 0;
}
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
function coord(pct, off) {
  const p = +pct.toFixed(1), o = +off.toFixed(1);
  if (!o) return p + "%";
  if (!p) return o + "px";
  return `calc(${p}% ${o < 0 ? "-" : "+"} ${Math.abs(o)}px)`;
}
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
/* Cut block: <tag class="paper cls" data-cut=kind> > <.face faceCls>. kind: card (default) | key | chip | hero | sheet
   (see CUTS). `key` is kept for API compatibility (v0.2 seeded the torn edges with it); the shape no longer depends on it,
   and the v0.2 options edges/depth/step/cut are ignored. Returns {root, face}; put content in face. */
function paper(tag, key, {kind = "card", cls = "", face = ""} = {}) {
  const [corner, size] = CUTS[kind] || CUTS.card;
  const inner = tag === "button" ? "span" : "div";
  const root = el(tag, "paper" + (cls ? " " + cls : ""));
  root.dataset.cut = CUTS[kind] ? kind : "card";
  const f = el(inner, "face" + (face ? " " + face : ""));
  root.style.setProperty("--clip", cutPath(corner, size));
  root.append(f);
  return {root, face: f};
}
/* A key: real <button> on the paper system (classes "key press" + cls, e.g. "on", "alert"). Label via textContent.
   kind: "key" (top-right 12px cut, default) or "chip" (pills, option chips, small keys: bottom-right 6px). */
function cutKey(label, key, cls, kind = "key") {
  const {root, face} = paper("button", key, {kind, cls: "key press" + (cls ? " " + cls : "")});
  root.type = "button"; face.textContent = String(label);
  return root;
}
/* Golden Arm motif: 3-5 straight vertical bars of varied height/width in var(--acc), aria-hidden. Same key = same bars. */
function armBars(key) {
  const s = typeof key === "number" ? key >>> 0 : seed(key), r = rng(s ^ 0x9e3779b9);
  const box = el("div", "arm"); box.setAttribute("aria-hidden", "true");
  for (let i = 0, n = 3 + Math.floor(r() * 3); i < n; i++) {
    const b = el("span");
    b.style.width = Math.round(10 + r() * 9) + "px";
    b.style.height = Math.round(38 + r() * 62) + "%";
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
      setAccent(this._body, this._config.accent);
      root.append(this._body);
    }
    if (!this._hass) return;
    this._body.textContent = "";
    this.render(this._body);
  }
  render() {}
  /* Card-level cut block (kind "card" unless opts.kind says otherwise). */
  paper(key, opts) { return paper("div", this.localName + "|" + key, opts); }
  getCardSize() { return 2; }
  getGridOptions() { return {columns: 12, rows: "auto", min_columns: 3}; }
}

/* Shared API for cards (src/cards/) and for debugging. */
window.JamCards = Object.freeze({
  VERSION, BASE_CSS, JamBase, ACCENTS, CUTS, accentName, accentVar, accentFg, setAccent, cutPath,
  seed, rng, tornPath, paper, cutKey, armBars, icon, bindActions, runAction,
  el, stateObj, friendly, fmtState, tone, fire, moreInfo, navigate, toggleable, UNAVAILABLE,
});
window.customCards = window.customCards || [];
/* Every card file ends with register(tag, Class, name, description). */
function register(tag, cls, name, description) {
  if (!customElements.get(tag)) customElements.define(tag, cls);
  if (!window.customCards.some(c => c.type === tag)) window.customCards.push({type: tag, name, description, preview: false});
}

/* ---------- jam-button: chunky key for launchers, scenes, scripts, stereo keys and openers ----------
   {type: custom:jam-button, entity?, name?, icon?, accent?: colour or room alias | paper | ink (DESIGN "Colour system"),
    color?: HA colour name, show_state?, size?: normal|big, tap_action?, hold_action?, double_tap_action?}
   Default tap: scene./script. -> <domain>.turn_on, button./input_button. -> <domain>.press, toggleable entity -> toggle,
   other entity -> more-info. Stateless domains (button, input_button, scene, script) are only greyed when "unavailable":
   "unknown" and a timestamp are their normal states.
   Shape: key cut (top-right 12px), slab face. Accent (accent, else color mapped by JB_COLOR, else the card default ochre)
   = a small square with a cut corner in the top-left carrying the icon in ink (28px, big 36px); light/switch/fan/input_boolean
   "on" = the whole face in the accent with ink text, the square turns ink with the icon in the accent.
   ink (and HA grey colours) = plain key without a square (on = inverted fg face). */
const JB_COLOR = {red: "red", "deep-orange": "red", orange: "ochre", amber: "ochre", yellow: "ochre", primary: "ochre",
  pink: "pink", blue: "blue", "light-blue": "blue", indigo: "blue", cyan: "teal", teal: "teal",
  purple: "violet", "deep-purple": "violet", green: "green", "light-green": "green", lime: "green", "light-grey": "ink", grey: "ink"};
const JB_ON = new Set(["light", "switch", "fan", "input_boolean"]);
const JB_STATELESS = new Set(["button", "input_button", "scene", "script"]);
class JamButton extends JamBase {
  validate(c) { if (!c.entity && !c.name && !c.icon) throw new Error("jam-button: entity, name or icon is required"); }
  watched() { return this._config.entity ? [this._config.entity] : []; }
  css() { return `
    .btn{min-height:88px}
    .kf{--p-t:10px;--p-r:12px;--p-b:10px;--p-l:10px;display:flex;min-height:88px}
    .big .kf{min-height:120px}
    .kf.on{background:var(--acc);color:var(--acc-fg)}
    .k{position:relative;flex:1;min-width:0;display:flex;flex-direction:column;justify-content:space-between;gap:6px;container-type:inline-size}
    .sq{flex:none;display:grid;place-items:center;width:28px;height:28px;background:var(--acc);color:var(--acc-fg);
      clip-path:polygon(0 0,100% 0,100% 70%,70% 100%,0 100%)}
    .big .sq{width:36px;height:36px}
    .on .sq{background:var(--acc-fg);color:var(--acc)}
    .layer{min-width:0;display:flex;flex-direction:column;justify-content:flex-end;gap:6px;margin-top:auto}
    .ic{--mdc-icon-size:28px;display:block;width:28px;height:28px}
    .sq .ic{--mdc-icon-size:18px;width:18px;height:18px}
    .big .sq .ic{--mdc-icon-size:24px;width:24px;height:24px}
    .lbl{font-family:var(--display);font-weight:900;text-transform:uppercase;line-height:.92;letter-spacing:-.005em;
      font-size:min(var(--fs,1.25rem), calc(100cqi / (var(--fit) * .5)));overflow-wrap:normal;word-break:normal;hyphens:none;text-wrap:balance}
    .big{--fs:1.9rem}
    .st{font:600 .66rem/1.2 var(--body);letter-spacing:.14em;text-transform:uppercase;overflow-wrap:anywhere}
    .st{color:var(--dim)} .on .st{color:var(--acc-fg)}`; }
  /* Configured accent name (accent wins over color), or null = the card default. */
  _accent() {
    const c = this._config;
    return accentName(c.accent) || JB_COLOR[c.color] || null;
  }
  _tap() {
    const c = this._config, d = (c.entity || "").split(".")[0];
    if (c.tap_action) return c.tap_action;
    if (d === "scene" || d === "script") return {action: "perform-action", perform_action: d + ".turn_on", data: {entity_id: c.entity}};
    if (d === "button" || d === "input_button") return {action: "perform-action", perform_action: d + ".press", data: {entity_id: c.entity}};
    if (c.entity && toggleable(c.entity)) return {action: "toggle"};
    return {action: c.entity ? "more-info" : "none"};
  }
  render(b) {
    const c = this._config, h = this._hass, s = stateObj(h, c.entity), d = (c.entity || "").split(".")[0];
    const on = !!s && s.state === "on" && JB_ON.has(d), acc = this._accent(), plain = acc === "ink";
    const un = !!c.entity && (!s || (JB_STATELESS.has(d) ? s.state === "unavailable" : UNAVAILABLE.has(s.state)));
    const name = c.name || friendly(h, c.entity) || "";
    const {root, face} = this.paper(c.entity || name || c.icon, {kind: "key",
      cls: "press btn" + (c.size === "big" ? " big" : ""), face: "kf" + (on ? " on" : "") + (un ? " unavail" : "")});
    if (plain) { root.style.setProperty("--acc", "var(--fg)"); root.style.setProperty("--acc-fg", "var(--slab)"); }
    else if (acc) setAccent(root, acc);
    root.tabIndex = 0; root.setAttribute("role", "button"); root.setAttribute("aria-label", name);
    if (s && JB_ON.has(d)) root.setAttribute("aria-pressed", on ? "true" : "false");
    bindActions(root, () => this._hass, {...c, tap_action: this._tap()}, c.entity);
    const k = el("div", "k");
    /* Font fits the longest word into the key width, so labels wrap by word and never mid-word. */
    k.style.setProperty("--fit", Math.max(4, ...String(name).split(/\s+/).map(w => w.length)));
    const ic = icon(c.icon || (s && s.attributes.icon)), L = el("div", "layer");
    if (ic) ic.classList.add("ic");
    if (!plain) {
      const sq = el("span", "sq");
      sq.setAttribute("aria-hidden", "true");
      if (ic) sq.append(ic);
      k.append(sq);
    } else if (ic) L.append(ic);
    if (name) L.append(el("div", "lbl", name));
    if (c.show_state && s) L.append(el("div", "st num", fmtState(h, s)));
    k.append(L);
    face.append(k);
    b.append(root);
    this._fit(k);
  }
  /* Safety net for fallback fonts: shrink a label that still overflows its key (a word never breaks). */
  _fit(k) {
    if (this._ro) this._ro.disconnect();
    let w = -1;
    const fit = () => {
      if (!k.isConnected || k.clientWidth === w) return;
      w = k.clientWidth;
      for (const l of k.querySelectorAll(".lbl")) {
        l.style.fontSize = "";
        if (l.scrollWidth > l.clientWidth + 0.5) l.style.fontSize = (parseFloat(getComputedStyle(l).fontSize) * l.clientWidth / l.scrollWidth - 0.3).toFixed(2) + "px";
      }
    };
    if (window.ResizeObserver) { this._ro = new ResizeObserver(fit); this._ro.observe(k); }
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => { w = -1; fit(); });
  }
  getCardSize() { return this._config.size === "big" ? 3 : 2; }
  getGridOptions() { return {columns: 3, rows: this._config.size === "big" ? 2 : "auto", min_columns: 2}; }
}
register("jam-button", JamButton, "Jam Button", "Chunky key for launchers, scenes, scripts and openers.");

/* ---------- jam-choice: select / input_select as option chips ----------
   {type: custom:jam-choice, entity, name?, options?: [subset/order], columns?, accent? (selected option fill; DESIGN "Colour system")}
   Options are chips (bottom-right 6px cut): slab2 off, accent fill + ink text when selected. */
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
    .opt.busy > .face{border-color:var(--acc)}`; }
  render(b) {
    const c = this._config, h = this._hass, s = stateObj(h, c.entity);
    const {root, face: wrap} = this.paper(c.entity, {face: `wrap stripe s-${s && !UNAVAILABLE.has(s.state) ? "on" : "alert"}`});
    wrap.append(el("div", "label", c.name || friendly(h, c.entity)));
    const box = el("div", "opts");
    if (c.columns) box.style.setProperty("--cols", String(c.columns));
    const all = (s && s.attributes.options) || [];
    const list = c.options ? c.options.filter(o => all.includes(o)) : all;
    const dom = c.entity.split(".")[0];
    for (const o of list) {
      const on = !!s && s.state === o;
      const btn = cutKey(o, `jam-choice|${c.entity}|${o}`, "opt" + (on ? " on" : ""), "chip");
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

/* ---------- jam-gauge: half-disc of cut wedges (or a strip) with a big numeral, read-only ----------
   {type: custom:jam-gauge, entity, name?, min?: 0, max?: 100, unit?, severity?: {green, yellow, red} (band starts, HA
    semantics), style?: arc|bar, tap_action?, hold_action?, double_tap_action?, accent?}
   Bands green/yellow/red -> teal/ochre/red (fixed, not the accent); without severity one band in the card accent
   (default ochre). Every wedge has the same radius. Values outside min..max are clamped
   (the numeral still shows the real value). Unavailable / non-numeric -> red "Unavailable", no fill. */
const JG_TONE = {green: "teal", yellow: "ochre", red: "red"};
const JG_SVG = "http://www.w3.org/2000/svg";
function jgFmt(v) { return String(Math.abs(v) >= 100 ? Math.round(v) : Math.round(v * 10) / 10); }
class JamGauge extends JamBase {
  validate(c) { if (!c.entity) throw new Error("jam-gauge: entity is required"); }
  watched() { return [this._config.entity]; }
  css() { return `
    .g{display:grid;gap:6px;align-content:start;justify-items:center;text-align:center}
    .g .label{justify-self:stretch;text-align:left}
    svg{display:block;width:100%;max-width:260px;height:auto}
    .big{font-family:var(--display);font-weight:900;font-size:2.8rem;line-height:.9;text-transform:uppercase}
    .u{font:500 .95rem/1 var(--body);color:var(--dim);margin-left:4px;text-transform:none}
    .un{font-size:1.7rem}
    .bar{display:grid;gap:10px;align-content:start}
    .row{display:flex;justify-content:space-between;align-items:baseline;gap:10px}
    .bar .big{font-size:1.9rem}
`; }
  _bands(min, max) {
    const sv = this._config.severity;
    const st = sv ? Object.keys(JG_TONE).filter(k => sv[k] !== undefined && sv[k] !== null && !isNaN(Number(sv[k])))
      .map(k => ({from: Math.min(max, Math.max(min, Number(sv[k]))), col: JG_TONE[k]})).sort((a, b) => a.from - b.from) : [];
    if (!st.length) return [{from: min, to: max, col: "acc"}];
    st[0].from = min; /* below the first band start HA has no colour; the first band covers it */
    st.forEach((x, i) => { x.to = i + 1 < st.length ? st[i + 1].from : max; });
    return st.filter(x => x.to > x.from);
  }
  _model() {
    const c = this._config, s = stateObj(this._hass, c.entity);
    const min = Number(c.min ?? 0), max = Number(c.max ?? 100), v = s ? Number(s.state) : NaN;
    const ok = !!s && !UNAVAILABLE.has(s.state) && s.state !== "" && !isNaN(v) && max > min;
    return {s, min, max, ok, v, cv: ok ? Math.max(min, Math.min(max, v)) : min,
      unit: c.unit ?? (s && s.attributes.unit_of_measurement) ?? ""};
  }
  _numeral(m, parent) {
    if (!m.ok) { parent.append(el("div", "big un c-alert", "Unavailable")); return; }
    const n = el("div", "big num", jgFmt(m.v));
    if (m.unit) n.append(el("span", "u", m.unit));
    parent.append(n);
  }
  _meter(node, m) {
    node.setAttribute("role", "meter");
    node.setAttribute("aria-valuemin", m.min); node.setAttribute("aria-valuemax", m.max);
    if (m.ok) { node.setAttribute("aria-valuenow", m.cv); node.setAttribute("aria-valuetext", jgFmt(m.v) + (m.unit ? " " + m.unit : "")); }
    else node.setAttribute("aria-valuetext", "Unavailable");
  }
  _arc(face, m) {
    const svg = document.createElementNS(JG_SVG, "svg");
    svg.setAttribute("viewBox", "-2 -2 204 104");
    const frac = v => (v - m.min) / (m.max - m.min);
    const pt = (f, rad) => { const a = Math.PI * (1 - f); return `${(100 + rad * Math.cos(a)).toFixed(2)} ${(100 - rad * Math.sin(a)).toFixed(2)}`; };
    const wedge = (f0, f1, rad, fill) => {
      if (f1 - f0 < 0.0005) return;
      const p = document.createElementNS(JG_SVG, "path");
      p.setAttribute("d", `M100 100L${pt(f0, rad)}A${rad} ${rad} 0 0 1 ${pt(f1, rad)}Z`);
      p.style.fill = fill; svg.append(p);
    };
    const GAP = 0.006, fv = frac(m.cv);
    for (const bd of this._bands(m.min, m.max)) {
      const f0 = frac(bd.from) + (bd.from > m.min ? GAP : 0), f1 = frac(bd.to) - (bd.to < m.max ? GAP : 0);
      const rad = 92;
      if (m.ok && fv > f0) wedge(f0, Math.min(f1, fv), rad, `var(--${bd.col})`);
      wedge(m.ok ? Math.max(f0, fv) : f0, f1, rad, "var(--line)");
    }
    if (m.ok) { /* the value "needle": a bold paper wedge cut through the disc */
      const d = 0.014, a = Math.max(0, Math.min(1 - 2 * d, fv - d));
      const w = document.createElementNS(JG_SVG, "path");
      w.setAttribute("class", "cut");
      w.setAttribute("d", `M100 100L${pt(a, 100)}L${pt(a + 2 * d, 100)}Z`);
      w.style.fill = "var(--fg)"; svg.append(w);
    }
    /* Vertigo spiral hub, cut out of the disc. */
    const hub = document.createElementNS(JG_SVG, "circle");
    hub.setAttribute("cx", "100"); hub.setAttribute("cy", "100"); hub.setAttribute("r", "15"); hub.style.fill = "var(--slab)";
    const sp = document.createElementNS(JG_SVG, "path"), pts = [];
    for (let t = 0; t <= 2.6 * 2 * Math.PI; t += 0.25) { const rr = 1 + t * 0.75; pts.push(`${(100 + rr * Math.cos(t)).toFixed(2)} ${(100 - rr * Math.sin(t)).toFixed(2)}`); }
    sp.setAttribute("d", "M" + pts.join("L"));
    sp.style.fill = "none"; sp.style.stroke = "var(--fg)"; sp.setAttribute("stroke-width", "2.2"); sp.setAttribute("stroke-linecap", "square");
    svg.append(hub, sp);
    svg.setAttribute("aria-hidden", "true");
    const box = el("div"); box.style.width = "100%"; box.style.display = "flex"; box.style.justifyContent = "center";
    this._meter(box, m); box.append(svg); face.append(box);
    this._numeral(m, face);
  }
  _bar(face, m) {
    const row = el("div", "row");
    row.append(el("div", "label", this._name()));
    this._numeral(m, row); face.append(row);
    const track = el("div", "track"), strip = el("div", "strip"), fill = el("div", "fill");
    this._meter(track, m);
    if (m.ok) {
      const band = this._bands(m.min, m.max).filter(x => m.cv >= x.from).pop();
      fill.style.background = `var(--${band ? band.col : "acc"})`;
      fill.style.width = ((m.cv - m.min) / (m.max - m.min)) * 100 + "%";
      strip.append(fill);
    }
    track.append(strip); face.append(track);
  }
  _name() { return this._config.name || friendly(this._hass, this._config.entity); }
  render(b) {
    const c = this._config, m = this._model(), bar = c.style === "bar";
    const {root, face} = this.paper(c.entity, {cls: "press", face: bar ? "bar" : "g"});
    root.tabIndex = 0; root.setAttribute("role", "button"); root.setAttribute("aria-label", this._name());
    bindActions(root, () => this._hass, c, c.entity);
    if (bar) this._bar(face, m);
    else { face.append(el("div", "label", this._name())); this._arc(face, m); }
    b.append(root);
  }
  getCardSize() { return this._config.style === "bar" ? 2 : 4; }
  getGridOptions() { return {columns: 6, rows: "auto", min_columns: 3}; }
}
register("jam-gauge", JamGauge, "Jam Gauge", "Half-disc of cut wedges or a strip with a big numeral (replaces gauge).");

/* ---------- jam-graph: history chart from the recorder (line / step / bars), 1-5 series ----------
   {type: custom:jam-graph, title?, entities: [id | {entity, name?}] (1-5), hours_to_show? (24), style?: line|step|bars,
    show_current? (true), min?, max?, refresh_minutes? (5), accent? (loading placeholder only; series colours are fixed)}
   One history/history_during_period WS call for all entities. Numeric states only, unavailable dropped, ≤240 points per
   series (bucket mean; bars = time-weighted mean per hour). Refetch every refresh_minutes and when a watched state changes,
   at most once a minute for the same query. One y-axis, series colours --s1..--s5 in order, text never in series colour.
   Config errors (e.g. a 6th series) render in the card instead of throwing. Current value of an unavailable / unknown /
   non-numeric entity = "—" in --dim, no unit. */
const JAM_GRAPH_MAX_PTS = 240, JAM_GRAPH_GAP = 60e3, JAM_GRAPH_NS = "http://www.w3.org/2000/svg";
const JAM_GRAPH_STYLES = ["line", "step", "bars"];
/* HA time format (hass.locale.time_format): "12" | "24" force it; "language" lets Intl decide for hass.locale.language,
   "system" for the browser default. Returns {loc, h12} for toLocaleTimeString(loc, {hour12: h12}). */
function jamGraphTime(h) {
  const l = h && h.locale, tf = l && l.time_format;
  const loc = tf === "system" ? undefined : (l && l.language) || (h && h.language) || undefined;
  if (tf === "12" || tf === "24") return {loc, h12: tf === "12"};
  let h12;
  try { const o = new Intl.DateTimeFormat(loc, {hour: "numeric"}).resolvedOptions(); h12 = o.hourCycle ? /h1[12]/.test(o.hourCycle) : o.hour12; } catch (e) { h12 = undefined; }
  return {loc, h12};
}
function jamGraphSvg(tag, attrs, cls) {
  const e = document.createElementNS(JAM_GRAPH_NS, tag);
  if (cls) e.setAttribute("class", cls);
  for (const k in attrs || {}) e.setAttribute(k, attrs[k]);
  return e;
}
class JamGraph extends JamBase {
  constructor() { super(); this._tok = 0; this._last = 0; this._lastQ = null; this._data = null; this._hover = null; }
  /* Never throws: a broken config renders as an in-card error (one bad card must not break a dashboard). */
  validate(c) {
    this._err = null; this._ents = [];
    const list = c.entities;
    if (!Array.isArray(list) || !list.length) { this._err = "entities: list 1-5 sensors"; return; }
    if (list.length > 5) { this._err = `${list.length} series: max 5 — fold into fewer series`; return; }
    for (const x of list) {
      const id = typeof x === "string" ? x : x && x.entity;
      if (typeof id !== "string" || !id.includes(".")) { this._err = "entities: each item is an entity id or {entity, name}"; return; }
      this._ents.push({entity: id, name: typeof x === "object" ? x.name : undefined});
    }
    if (c.style !== undefined && !JAM_GRAPH_STYLES.includes(c.style)) { this._err = "style: line, step or bars"; return; }
    if (c.hours_to_show !== undefined && !(+c.hours_to_show > 0)) { this._err = "hours_to_show: a positive number"; return; }
  }
  setConfig(c) {
    super.setConfig(c);
    const q = this._err ? null : JSON.stringify([this._ents.map(e => e.entity), this._hours(), this._style()]);
    if (q !== this._q) { this._q = q; this._data = null; this._tok++; this._render(false); }
    if (this.isConnected) { this._arm(); this._kick(); }
  }
  set hass(h) {
    const first = !this._hass, before = this._sig, tf = JSON.stringify(jamGraphTime(h));
    super.hass = h;
    if (!first && tf !== this._tf && this._sig === before) this._render(false); /* time format changed: redraw the labels */
    this._tf = tf;
    if (first || this._sig !== before) this._kick(); /* a watched state changed: refetch (throttled) */
  }
  /* toLocaleTimeString(…) for axis + tooltip, following hass.locale.time_format. */
  _time(t) { const f = jamGraphTime(this._hass); return new Date(t).toLocaleTimeString(f.loc, {hour: f.h12 ? "numeric" : "2-digit", minute: "2-digit", hour12: f.h12}); }
  get hass() { return super.hass; }
  watched() { return this._err ? [] : this._ents.map(e => e.entity); }
  _hours() { return +this._config.hours_to_show > 0 ? +this._config.hours_to_show : 24; }
  _style() { return this._config.style || "line"; }
  connectedCallback() {
    if (!this._ro && window.ResizeObserver) this._ro = new ResizeObserver(() => { if (this._plot && Math.round(this._plot.clientWidth) !== this._w) this._draw(); });
    if (this._ro) this._ro.observe(this);
    this._arm();
    if (!this._data || Date.now() - this._last > this._every()) this._kick();
  }
  disconnectedCallback() {
    clearInterval(this._iv); this._iv = null;
    clearTimeout(this._pending); this._pending = null;
    if (this._ro) this._ro.disconnect();
  }
  _every() { return Math.max(1, +this._config.refresh_minutes || 5) * 60e3; }
  _arm() {
    clearInterval(this._iv); this._iv = null;
    if (this._config && !this._err) this._iv = setInterval(() => this._kick(), this._every());
  }
  /* Fetch now, or once the one-minute gap since the last fetch of the same query has passed (coalesced). */
  _kick() {
    if (!this._hass || !this._config || this._err || !this.isConnected) return;
    const wait = this._q === this._lastQ ? this._last + JAM_GRAPH_GAP - Date.now() : 0;
    if (wait <= 0) { clearTimeout(this._pending); this._pending = null; this._fetch(); return; }
    if (!this._pending) this._pending = setTimeout(() => { this._pending = null; this._kick(); }, wait);
  }
  async _fetch() {
    const ids = this._ents.map(e => e.entity), tok = ++this._tok, style = this._style();
    const t1 = Date.now(), t0 = t1 - this._hours() * 3600e3;
    this._last = t1; this._lastQ = this._q;
    let res;
    try {
      if (typeof this._hass.callWS !== "function") throw new Error("no callWS");
      res = await this._hass.callWS({type: "history/history_during_period", start_time: new Date(t0).toISOString(), end_time: new Date(t1).toISOString(),
        entity_ids: ids, minimal_response: true, no_attributes: true, significant_changes_only: false});
    } catch (e) { res = null; }
    if (tok !== this._tok) return; /* config changed meanwhile */
    this._data = {t0, t1, o: JamGraph.origin(t0), series: ids.map(id => JamGraph.prep(res && res[id], t0, t1, style, this._hours()))};
    this._render(false);
  }
  /* History rows -> [[ms, value]] sorted, numeric only, clamped to [t0, t1]; downsampled to ≤240 points. Line/step get a
     final point at t1 (the state holds until now); bars get one time-weighted mean per clock hour (null where nothing known). */
  static prep(rows, t0, t1, style, hours) {
    const raw = [];
    for (const r of Array.isArray(rows) ? rows : []) {
      const s = r.s !== undefined ? r.s : r.state;
      if (typeof s !== "string" || s.trim() === "" || UNAVAILABLE.has(s)) continue;
      const v = Number(s);
      if (!isFinite(v)) continue;
      const ts = r.lu != null ? r.lu * 1000 : r.lc != null ? r.lc * 1000 : Date.parse(r.last_updated || r.last_changed);
      if (!isFinite(ts)) continue;
      raw.push([Math.min(t1, Math.max(t0, ts)), v]);
    }
    raw.sort((a, b) => a[0] - b[0]);
    if (!raw.length) return [];
    if (style === "bars") {
      const per = JamGraph.per(hours), o = JamGraph.origin(t0), n = Math.max(1, Math.ceil((t1 - o) / per));
      const sum = new Array(n).fill(0), cov = new Array(n).fill(0);
      for (let j = 0; j < raw.length; j++) {
        let a = raw[j][0]; const b = j + 1 < raw.length ? raw[j + 1][0] : t1, v = raw[j][1];
        while (a < b) {
          const i = Math.min(n - 1, Math.floor((a - o) / per)), e = Math.min(b, o + (i + 1) * per);
          if (e <= a) break;
          sum[i] += v * (e - a); cov[i] += e - a; a = e;
        }
      }
      return sum.map((s, i) => [o + i * per, cov[i] ? s / cov[i] : null]);
    }
    let pts = raw;
    const cap = JAM_GRAPH_MAX_PTS - 1;
    if (raw.length > cap) {
      const w = (t1 - t0) / cap, acc = new Map();
      for (const [t, v] of raw) {
        const i = Math.min(cap - 1, Math.floor((t - t0) / w));
        const b = acc.get(i) || {n: 0, t: 0, v: 0, first: t};
        b.n++; b.t += t; b.v += v; acc.set(i, b);
      }
      pts = [...acc.values()].map(b => [style === "step" ? b.first : b.t / b.n, b.v / b.n]);
    }
    if (pts[pts.length - 1][0] < t1) pts = [...pts, [t1, pts[pts.length - 1][1]]];
    return pts;
  }
  /* Bars: bucket size (whole hours, ≤240 buckets) and origin (the local clock hour at or before the window start). */
  static per(hours) { return Math.max(1, Math.ceil((hours + 1) / JAM_GRAPH_MAX_PTS)) * 3600e3; }
  static origin(t0) { const o = new Date(t0); o.setMinutes(0, 0, 0); return +o; }
  /* Value of a series at time t: held (step), interpolated (line) or the bucket mean (bars). */
  static at(pts, t, style, o, per) {
    if (!pts.length) return null;
    if (style === "bars") { const i = Math.floor((t - o) / per); return pts[i] ? pts[i][1] : null; }
    if (t < pts[0][0]) return null;
    let lo = 0, hi = pts.length - 1;
    while (lo < hi) { const m = (lo + hi + 1) >> 1; if (pts[m][0] <= t) lo = m; else hi = m - 1; }
    const a = pts[lo], b = pts[lo + 1];
    if (style === "step" || !b || b[0] === a[0]) return a[1];
    return a[1] + (b[1] - a[1]) * (t - a[0]) / (b[0] - a[0]);
  }
  /* 3-4 nice ticks covering [lo, hi]. fixLo/fixHi (configured min/max) keep that end as the domain edge. */
  static ticks(lo, hi, fixLo, fixHi) {
    if (!(hi > lo)) { const d = Math.abs(lo) * .05 || 1; if (!fixLo) lo -= d; if (!fixHi) hi += d; if (!(hi > lo)) hi = lo + 2 * d; }
    const raw = (hi - lo) / 3, mag = Math.pow(10, Math.floor(Math.log10(raw)));
    let step = mag * 10;
    for (const m of [1, 2, 2.5, 5, 10]) {
      const s = m * mag, n = Math.round(Math.ceil(hi / s - 1e-9) - Math.floor(lo / s + 1e-9)) + 1;
      if (n <= 4) { step = s; break; }
    }
    const a = (fixLo ? Math.ceil(lo / step - 1e-9) : Math.floor(lo / step + 1e-9)) * step;
    const b = (fixHi ? Math.floor(hi / step + 1e-9) : Math.ceil(hi / step - 1e-9)) * step;
    const ticks = [];
    for (let v = a; v <= b + step * 1e-6; v += step) ticks.push(+v.toPrecision(12));
    const dec = Math.min(3, ((String(+step.toPrecision(6)).split(".")[1]) || "").length);
    return {lo: fixLo ? lo : a, hi: fixHi ? hi : b, ticks, dec};
  }
  _lang() { const h = this._hass; return (h && h.locale && h.locale.language) || (h && h.language) || undefined; }
  _num(id, v) {
    const e = this._hass && this._hass.entities && this._hass.entities[id];
    const p = e && typeof e.display_precision === "number" ? e.display_precision : null;
    const d = p !== null ? p : Math.abs(v) >= 100 ? 0 : Math.abs(v) >= 10 ? 1 : 2;
    return v.toLocaleString(this._lang(), {minimumFractionDigits: d, maximumFractionDigits: d});
  }
  _unit(id) { const s = stateObj(this._hass, id); return (s && s.attributes.unit_of_measurement) || ""; }
  _name(e) { return e.name || friendly(this._hass, e.entity); }
  css() { return `
    .g{display:grid;gap:10px}
    .top{display:flex;justify-content:space-between;align-items:flex-end;gap:6px 14px;flex-wrap:wrap;min-width:0}
    .top .label{overflow-wrap:anywhere}
    .cur{font-family:var(--display);font-weight:900;font-size:3rem;line-height:.86;letter-spacing:-.005em;cursor:pointer;white-space:nowrap}
    .cur.none{color:var(--dim)}
    .cur small{font:600 .9rem/1 var(--body);letter-spacing:.06em;color:var(--dim);margin-left:4px}
    .one{display:grid;gap:6px;min-width:0}
    .lg{display:flex;flex-wrap:wrap;gap:6px 14px}
    .lg button{display:inline-flex;align-items:center;gap:6px;font:600 .7rem/1.2 var(--body);letter-spacing:.12em;text-transform:uppercase;color:var(--dim);max-width:100%}
    .lg .v{color:var(--fg);letter-spacing:.04em}
    .sq{display:inline-block;width:10px;height:10px;flex:none;background:var(--c)}
    .plot{position:relative;min-width:0;outline:none}
    .plot:focus-visible{outline:3px solid var(--ochre);outline-offset:2px}
    .plot svg{display:block;width:100%;touch-action:pan-y}
    .ax{font:500 .72rem var(--body);fill:var(--dim)}
    .rule{stroke:var(--line);stroke-width:1;shape-rendering:crispEdges}
    .ln{fill:none;stroke-width:3;stroke-linecap:square;stroke-linejoin:miter}
    .xh{stroke:var(--dim);stroke-width:1;shape-rendering:crispEdges}
    .mk{stroke:var(--slab);stroke-width:2}
    .empty{display:flex;align-items:center;justify-content:center}
    .empty .arm{--acc:var(--dim)}
    .tip{position:absolute;top:0;background:var(--slab2);color:var(--fg);padding:6px 9px;border:2px solid var(--line);
      pointer-events:none;font:500 .74rem/1.35 var(--body);display:grid;grid-template-columns:auto auto auto;gap:2px 8px;align-items:center;white-space:nowrap}
    .tip[hidden]{display:none}
    .tip .label{grid-column:1/-1}
    .tip .v{text-align:right;font-weight:600}
    .err{display:grid;gap:6px}`; }
  render(b) {
    const c = this._config, h = this._hass;
    this._plot = null;
    if (this._err) {
      const {root, face} = this.paper("error", {face: "err stripe s-alert"});
      face.append(el("div", "label", "Jam graph · config error"), el("div", "", this._err));
      b.append(root); return;
    }
    const {root, face} = this.paper(c.title || this._ents[0].entity, {face: "g"});
    const multi = this._ents.length > 1, show = c.show_current !== false;
    if (!multi) {
      const e = this._ents[0], s = stateObj(h, e.entity);
      const top = el("div", "top"), one = el("div", "one");
      one.append(el("div", "label", c.title || this._name(e)));
      top.append(one);
      if (show && s) {
        const v = Number(s.state), num = s.state !== "" && isFinite(v);
        const cur = el("button", "cur num" + (num ? "" : " none"), num ? this._num(e.entity, v) : "—");
        if (num && this._unit(e.entity)) cur.append(el("small", "", this._unit(e.entity)));
        cur.title = this._name(e); cur.onclick = () => moreInfo(this, e.entity);
        top.append(cur);
      }
      face.append(top);
    } else {
      if (c.title) face.append(el("div", "label", c.title));
      const lg = el("div", "lg");
      this._ents.forEach((e, i) => {
        const s = stateObj(h, e.entity), btn = el("button");
        const sq = el("span", "sq"); sq.style.setProperty("--c", `var(--s${i + 1})`); sq.setAttribute("aria-hidden", "true");
        btn.append(sq, el("span", "", this._name(e)));
        if (show && s) {
          const v = Number(s.state);
          btn.append(el("span", "v num", s.state !== "" && isFinite(v) ? `${this._num(e.entity, v)}${this._unit(e.entity) ? " " + this._unit(e.entity) : ""}` : fmtState(h, s)));
        }
        btn.onclick = () => moreInfo(this, e.entity);
        lg.append(btn);
      });
      face.append(lg);
    }
    const H = multi ? 170 : 140, plot = el("div", "plot");
    plot.style.height = H + "px";
    face.append(plot);
    b.append(root);
    const d = this._data;
    if (!d) { plot.classList.add("empty"); plot.append(armBars("jam-graph|" + this._q)); plot.setAttribute("aria-busy", "true"); return; }
    if (!d.series.some(s => s.some(p => p[1] !== null))) { plot.classList.add("empty"); plot.append(el("div", "label", "No data")); return; }
    this._plot = plot; this._H = H;
    plot.tabIndex = 0;
    plot.setAttribute("role", "img");
    plot.setAttribute("aria-label", `${c.title || this._ents.map(e => this._name(e)).join(", ")}: last ${this._hours()} h`);
    plot.addEventListener("pointermove", e => this._point(e.clientX));
    plot.addEventListener("pointerdown", e => this._point(e.clientX));
    plot.addEventListener("pointerleave", e => { if (e.pointerType !== "touch") this._hide(); });
    plot.addEventListener("blur", () => this._hide());
    plot.addEventListener("keydown", e => {
      const step = (d.t1 - d.t0) / 48;
      if (e.key === "ArrowLeft" || e.key === "ArrowRight") {
        e.preventDefault();
        const t = this._hover === null ? d.t1 : this._hover + (e.key === "ArrowLeft" ? -step : step);
        this._show(Math.min(d.t1, Math.max(d.t0, t)));
      } else if (e.key === "Escape") this._hide();
    });
    this._draw();
  }
  /* Geometry for the current width: margins, scales, bars bucket size. */
  _geo() {
    const c = this._config, d = this._data, style = this._style(), W = this._w, H = this._H;
    let lo = Infinity, hi = -Infinity;
    for (const s of d.series) for (const p of s) if (p[1] !== null) { lo = Math.min(lo, p[1]); hi = Math.max(hi, p[1]); }
    if (style === "bars") { lo = Math.min(lo, 0); hi = Math.max(hi, 0); }
    const num = v => v !== undefined && v !== null && v !== "" && isFinite(+v);
    const fixLo = num(c.min), fixHi = num(c.max);
    if (fixLo) lo = +c.min;
    if (fixHi) hi = +c.max;
    const tk = JamGraph.ticks(lo, hi, fixLo, fixHi);
    const fmt = v => v.toLocaleString(this._lang(), {minimumFractionDigits: tk.dec, maximumFractionDigits: tk.dec});
    const ml = 8 + Math.max(...tk.ticks.map(v => fmt(v).length)) * 7, mr = 4, mt = 8, mb = 20;
    const per = JamGraph.per(this._hours());
    const x = t => ml + (t - d.t0) / (d.t1 - d.t0) * (W - ml - mr);
    const y = v => mt + (tk.hi - Math.min(tk.hi, Math.max(tk.lo, v))) / (tk.hi - tk.lo) * (H - mt - mb);
    return {W, H, ml, mr, mt, mb, x, y, tk, fmt, per, style};
  }
  _draw() {
    const plot = this._plot, d = this._data;
    if (!plot || !d) return;
    this._w = Math.round(plot.clientWidth);
    if (!this._w) return;
    const g = this._geo(), {W, H, ml, mr, mt, mb, x, y} = g;
    const svg = jamGraphSvg("svg", {viewBox: `0 0 ${W} ${H}`, width: W, height: H, "aria-hidden": "true"});
    for (const v of g.tk.ticks) {
      const yy = Math.round(y(v)) + .5;
      svg.append(jamGraphSvg("line", {x1: ml, x2: W - mr, y1: yy, y2: yy}, "rule"));
      const t = jamGraphSvg("text", {x: ml - 8, y: yy, "text-anchor": "end", "dominant-baseline": "middle"}, "ax");
      t.textContent = g.fmt(v); svg.append(t);
    }
    /* x labels: 3-4 local-time marks (HH:00, or weekday for spans over two days). */
    const span = (d.t1 - d.t0) / 3600e3, xs = [1, 2, 3, 6, 12, 24, 48, 72, 168, 336].find(s => span / s <= 4) || 720;
    const m = new Date(d.t0); m.setMinutes(0, 0, 0);
    for (let k = 0; k < 800 && (xs < 24 ? m.getHours() % xs : m.getHours()) !== 0; k++) m.setHours(m.getHours() + 1);
    for (let k = 0; k < 8 && +m <= d.t1; k++, m.setHours(m.getHours() + xs)) {
      const xx = x(+m);
      if (+m < d.t0 || xx < ml + 18 || xx > W - mr - 18) continue;
      const t = jamGraphSvg("text", {x: xx, y: H - 4, "text-anchor": "middle"}, "ax");
      t.textContent = xs < 24 ? this._time(+m) : m.toLocaleDateString(this._lang(), {weekday: "short"});
      svg.append(t);
    }
    const n = d.series.length;
    d.series.forEach((pts, i) => {
      const col = `var(--s${i + 1})`;
      if (g.style === "bars") {
        const gp = jamGraphSvg("g", {fill: col, "data-n": pts.length}, "bars");
        const base = y(Math.min(g.tk.hi, Math.max(g.tk.lo, 0)));
        for (const [t, v] of pts) {
          if (v === null) continue;
          const x0 = x(Math.max(d.t0, t)), x1 = x(Math.min(d.t1, t + g.per)), bw = (x1 - x0 - 2) / n;
          if (bw <= 0) continue;
          const yv = y(v);
          gp.append(jamGraphSvg("rect", {x: (x0 + 1 + i * bw).toFixed(1), y: Math.min(yv, base).toFixed(1), width: bw.toFixed(1), height: Math.abs(base - yv).toFixed(1)}));
        }
        svg.append(gp); return;
      }
      if (!pts.length) return;
      let p = `M${x(pts[0][0]).toFixed(1)} ${y(pts[0][1]).toFixed(1)}`;
      for (let j = 1; j < pts.length; j++) {
        const xx = x(pts[j][0]).toFixed(1), yy = y(pts[j][1]).toFixed(1);
        p += g.style === "step" ? `H${xx}V${yy}` : `L${xx} ${yy}`;
      }
      if (pts.length === 1) p += `H${(x(pts[0][0]) + .1).toFixed(1)}`;
      svg.append(jamGraphSvg("path", {d: p, stroke: col, "data-n": pts.length}, "ln"));
    });
    const xh = jamGraphSvg("g", {visibility: "hidden"}, "cross");
    xh.append(jamGraphSvg("line", {y1: mt, y2: H - mb}, "xh"));
    d.series.forEach((_, i) => xh.append(jamGraphSvg("rect", {width: 8, height: 8, fill: `var(--s${i + 1})`}, "mk")));
    svg.append(xh);
    plot.textContent = "";
    plot.append(svg);
    this._g = g; this._xh = xh;
    this._tip = el("div", "tip"); this._tip.hidden = true; this._tip.setAttribute("role", "status");
    plot.append(this._tip);
    if (this._hover !== null) this._show(this._hover);
  }
  _point(cx) {
    if (!this._g) return;
    const g = this._g, d = this._data, r = this._plot.getBoundingClientRect();
    const px = Math.min(g.W - g.mr, Math.max(g.ml, cx - r.left));
    this._show(d.t0 + (px - g.ml) / (g.W - g.ml - g.mr) * (d.t1 - d.t0));
  }
  _show(t) {
    const g = this._g, d = this._data;
    if (!g || !this._tip) return;
    if (g.style === "bars") { const a = d.o + Math.floor((t - d.o) / g.per) * g.per; t = (Math.max(d.t0, a) + Math.min(d.t1, a + g.per)) / 2; }
    this._hover = t;
    const xx = Math.round(g.x(t)) + .5;
    const line = this._xh.querySelector("line"); line.setAttribute("x1", xx); line.setAttribute("x2", xx);
    const tip = this._tip;
    tip.textContent = "";
    let when = this._time(t);
    if (g.style === "bars") { const a = d.o + Math.floor((t - d.o) / g.per) * g.per; when = `${this._time(a)}–${this._time(Math.min(d.t1, a + g.per))}`; }
    tip.append(el("div", "label num", when));
    const marks = this._xh.querySelectorAll("rect");
    d.series.forEach((pts, i) => {
      const e = this._ents[i], v = JamGraph.at(pts, t, g.style, d.o, g.per);
      const sq = el("span", "sq"); sq.style.setProperty("--c", `var(--s${i + 1})`);
      tip.append(sq, el("span", "", this._name(e)), el("span", "v num", v === null ? "—" : `${this._num(e.entity, v)}${this._unit(e.entity) ? " " + this._unit(e.entity) : ""}`));
      if (v === null) marks[i].setAttribute("visibility", "hidden");
      else { marks[i].removeAttribute("visibility"); marks[i].setAttribute("x", xx - 4); marks[i].setAttribute("y", Math.round(g.y(v)) - 4); }
    });
    this._xh.setAttribute("visibility", "visible");
    tip.hidden = false;
    const tw = tip.offsetWidth, left = xx + 12 + tw <= g.W ? xx + 12 : Math.max(0, xx - 12 - tw);
    tip.style.left = left + "px";
  }
  _hide() {
    this._hover = null;
    if (this._xh) this._xh.setAttribute("visibility", "hidden");
    if (this._tip) this._tip.hidden = true;
  }
  getCardSize() { return this._ents && this._ents.length > 1 ? 5 : 4; }
  getGridOptions() { return {columns: 12, rows: "auto", min_columns: 6}; }
}
register("jam-graph", JamGraph, "Jam Graph", "History chart (line, step or bars) for 1-5 numeric sensors with a crosshair tooltip.");

/* ---------- jam-heading: section label + big title over a straight 5px accent rule ----------
   {type: custom:jam-heading, title, kicker?, accent?: colour or room alias (DESIGN "Colour system"; default ochre),
    entities?: [ids shown as chips], tap_action?, hold_action?, double_tap_action?} */
class JamHeading extends JamBase {
  validate(c) { if (!c.title) throw new Error("jam-heading: title is required"); }
  watched() { return this._config.entities || []; }
  css() { return `
    .h{display:grid;gap:6px;padding:6px 2px 0}
    .row{display:flex;gap:10px 16px;align-items:flex-end;justify-content:space-between;flex-wrap:wrap}
    .rule{height:5px;background:var(--acc)}
    h2{font-size:clamp(1.6rem,5.4vw,2.3rem)} .t{display:grid;gap:4px;min-width:0}
    .chips{display:flex;gap:6px;flex-wrap:wrap}
    .h.tap{cursor:pointer}`; }
  render(b) {
    const c = this._config, h = this._hass;
    const box = el("div", "h");
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
    const rule = el("div", "rule"); rule.setAttribute("aria-hidden", "true");
    box.append(row, rule);
    b.append(box);
  }
  getCardSize() { return 1; }
}
register("jam-heading", JamHeading, "Jam Heading", "Section title slab with an accent rule and optional state chips.");

/* ---------- jam-hero: paper slab with a 22px bottom-right cut ----------
   {type: custom:jam-hero, kicker?, title?, title_entity?, meta_entities?: [ids], power_entity?, off_title?, off_text?,
    chips?: [{entity, name?, show_state?: "on", hide_value?, tone?: any accent name | paper}], accent? (default ochre)}
   A chip is hot (accent fill, ink text) when its entity is on; tone overrides the hot colour (paper = paper-fg block with
   paper text, still .hot). Accent also marks the meta separators. */
class JamHero extends JamBase {
  watched() {
    const c = this._config;
    return [c.title_entity, c.power_entity, ...(c.meta_entities || []), ...(c.chips || []).map(x => x.entity)].filter(Boolean);
  }
  css() { return `
    .hero{--p-t:18px;--p-r:20px;--p-b:22px;--p-l:20px;background:var(--paper);color:var(--paper-fg);display:grid;gap:12px;align-content:start}
    .hero .label{color:var(--paper-dim)}
    h1{font-size:clamp(2.7rem,11vw,4.8rem);line-height:.9;letter-spacing:-.005em}
    .meta{display:flex;gap:6px 16px;flex-wrap:wrap;font-weight:500}
    .meta span{min-width:0;overflow-wrap:anywhere}
    .meta span + span::before{content:"";display:inline-block;width:7px;height:7px;background:var(--acc);margin:0 12px 1px 0;vertical-align:middle}
    .chips{display:flex;gap:6px;flex-wrap:wrap}
    .chips .chip{background:var(--paper-fg);color:var(--paper);padding:6px 10px 6px 8px}
    .chips .chip.hot{background:var(--hot,var(--acc));color:var(--on-fg)}
    .chips .chip.hot[data-tone=paper]{color:var(--paper)}
    .off h1{color:var(--paper-dim)}`; }
  render(b) {
    const c = this._config, h = this._hass;
    const key = c.title_entity || c.title || c.kicker || "hero";
    const {root, face: hero} = this.paper(key, {kind: "hero", face: "hero"});
    const pw = c.power_entity ? stateObj(h, c.power_entity) : null;
    const off = pw && (pw.state === "off" || UNAVAILABLE.has(pw.state));
    if (off) hero.classList.add("off");
    if (c.kicker) hero.append(el("div", "label", c.kicker));
    let title = c.title || "";
    if (c.title_entity) { const s = stateObj(h, c.title_entity); title = s && !UNAVAILABLE.has(s.state) ? fmtState(h, s) : (c.title || ""); }
    if (off) title = c.off_title || "Off";
    const h1 = el("h1", "disp focusable", title);
    if (c.title_entity) { h1.tabIndex = 0; h1.style.cursor = "pointer"; h1.onclick = () => moreInfo(this, c.title_entity); }
    hero.append(h1);
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
        if (tone(s) === "on" && accentName(ch.tone) && accentName(ch.tone) !== "ink") {
          const t = accentName(ch.tone);
          btn.dataset.tone = t; btn.style.setProperty("--hot", t === "paper" ? "var(--paper-fg)" : `var(--${t})`);
        }
        btn.onclick = () => moreInfo(this, ch.entity);
        chips.append(btn);
      }
      if (chips.childNodes.length) hero.append(chips);
    }
    b.append(root);
  }
  getCardSize() { return 4; }
}
register("jam-hero", JamHero, "Jam Hero", "Paper slab with a cut corner: big title from an entity, meta line and chips.");

/* ---------- jam-light: light with ON key, brightness strip, colour-temp chips and colour swatches ----------
   {type: custom:jam-light, entity (light.*), name?, icon?, tap_action? (ON key; default toggle), hold_action?,
    show_brightness? (default true when the light dims), show_color_temp? (default: color_temp supported),
    show_color? (default: hs/xy/rgb* supported), presets?: [{name, color_temp_kelvin | rgb_color}],
    accent? (DESIGN "Colour system": ON pill, brightness fill, active temp/preset chip, swatch block of a white light)}
   Off: only the ON key + brightness (dragging brightness turns it on; releasing at 0 turns it off).
   The ON key, temp/preset chips and colour swatches are chips (bottom-right 6px cut); unavailable = red swatch + key. */
const LIGHT_TEMPS = [["Candle", 2200], ["Warm", 2700], ["Neutral", 4000], ["Day", 6000]];
const LIGHT_SWATCHES = [["Ochre", [229, 163, 27]], ["Red", [212, 58, 28]], ["Teal", [63, 154, 165]],
  ["Paper", [236, 226, 201]], ["Violet", [166, 108, 196]], ["Green", [127, 155, 42]]];
const COLOR_MODES = ["hs", "xy", "rgb", "rgbw", "rgbww"];
/* Local helpers: rgb distance (swatch/preset "active" match) and the light's dimmability. */
const rgbDist = (a, b) => (a && b ? Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]) : Infinity);
function lightModes(s) { return (s && s.attributes.supported_color_modes) || []; }
function lightDims(s) {
  const m = lightModes(s);
  return m.length ? m.some(x => x !== "onoff") : !!(s && s.attributes.brightness != null);
}
class JamLight extends JamBase {
  validate(c) { if (!c.entity || !/^light\./.test(c.entity)) throw new Error("jam-light: entity must be a light"); }
  watched() { return [this._config.entity]; }
  css() { return `
    .wrap{--p-l:30px;display:grid;gap:12px;align-content:start}
    .swatch{position:absolute;left:0;top:0;bottom:0;width:14px;background:var(--line)}
    .head{display:flex;flex-wrap:wrap;justify-content:space-between;align-items:center;gap:8px 10px}
    .nm{display:flex;align-items:center;gap:8px;min-width:0}
    .nm h3{font-size:1.45rem;overflow-wrap:anywhere}
    .nm ha-icon{--mdc-icon-size:22px;flex:none;color:var(--dim)}
    .pw{flex:none;min-width:64px;height:auto}
    .pw.alert:disabled > .face{color:var(--on-fg)}
    .row{display:flex;flex-wrap:wrap;justify-content:space-between;align-items:baseline;gap:2px 10px}
    .v{font-family:var(--display);font-weight:900;font-size:1.7rem;line-height:1}
    .track[role=slider]{cursor:pointer}
    .chips{display:grid;grid-template-columns:repeat(auto-fit,minmax(68px,1fr));gap:8px}
    .chips .key{min-width:0} .chips .key > .face{--p-l:6px;--p-r:6px;font-size:.68rem;letter-spacing:.1em}
    .sws{display:flex;flex-wrap:wrap;gap:10px}
    .sw{min-width:0;width:40px} .sw > .face{height:30px;padding:0}
    .sw.on > .face,.sw[aria-pressed=true] > .face{border-color:var(--fg)}`; }
  _render(force) {
    // A hass update mid-drag would rebuild the strip under the pointer; render once the drag ends instead.
    if (this._drag && !force) { this._pending = true; return; }
    super._render(force);
  }
  _on(data) { this._hass.callService("light", "turn_on", {entity_id: this._config.entity, ...data}); }
  render(b) {
    const c = this._config, h = this._hass, s = stateObj(h, c.entity), a = (s && s.attributes) || {};
    const dead = !s || UNAVAILABLE.has(s.state), on = !!s && s.state === "on", modes = lightModes(s);
    const {root, face: wrap} = this.paper(c.entity, {face: "wrap"});
    const sw = el("div", "swatch"); sw.setAttribute("aria-hidden", "true");
    const rgb = Array.isArray(a.rgb_color) ? a.rgb_color : null;
    sw.style.background = dead ? "var(--red)" : !on ? "var(--line)" : rgb ? `rgb(${rgb.map(Number).join(",")})` : "var(--acc)";
    wrap.append(sw);
    // Header: name + cut ON/OFF key (tap_action, default toggle; hold_action).
    const head = el("div", "head"), nm = el("div", "nm");
    const ic = icon(c.icon); if (ic) nm.append(ic);
    nm.append(el("h3", "disp", c.name || friendly(h, c.entity)));
    const key = cutKey(dead ? (s ? "N/A" : "Missing") : on ? "On" : "Off", `jam-light|${c.entity}|key`, "pw" + (on ? " on" : dead ? " alert" : ""), "chip");
    key.setAttribute("aria-pressed", on ? "true" : "false");
    key.setAttribute("aria-label", `${c.name || friendly(h, c.entity)}: ${on ? "on" : dead ? "unavailable" : "off"}`);
    key.disabled = dead;
    bindActions(key, () => this._hass, {tap_action: c.tap_action || {action: "toggle"}, hold_action: c.hold_action}, c.entity);
    head.append(nm, key); wrap.append(head);
    b.append(root);
    if (!s) return;
    if (c.show_brightness !== false && lightDims(s)) this._brightness(wrap, on ? Math.round((a.brightness || 0) / 2.55) : 0, dead);
    if (!on) return;
    if (c.show_color_temp ?? modes.includes("color_temp")) this._temps(wrap, a);
    if (c.show_color ?? modes.some(m => COLOR_MODES.includes(m))) this._swatches(wrap, a);
    if (Array.isArray(c.presets) && c.presets.length) this._presets(wrap, a);
  }
  _brightness(wrap, v0, dead) {
    const c = this._config;
    const row = el("div", "row"), val = el("div", "v num", dead ? "—" : v0 + "%");
    row.append(el("div", "label", "Brightness"), val);
    const track = el("div", "track"), strip = el("div", "strip"), fill = el("div", "fill");
    fill.style.width = (dead ? 0 : v0) + "%";
    strip.append(fill); track.append(strip); wrap.append(row, track);
    if (dead) return;
    track.tabIndex = 0; track.setAttribute("role", "slider"); track.setAttribute("aria-label", "Brightness");
    track.setAttribute("aria-valuemin", "0"); track.setAttribute("aria-valuemax", "100"); track.setAttribute("aria-valuenow", v0);
    let cur = v0;
    const show = v => { cur = Math.max(0, Math.min(100, Math.round(v))); fill.style.width = cur + "%"; val.textContent = cur + "%"; track.setAttribute("aria-valuenow", cur); };
    const at = e => { const r = track.getBoundingClientRect(); return ((e.clientX - r.left) / r.width) * 100; };
    const send = () => {
      if (cur > 0) this._on({brightness_pct: cur});
      else if (v0 > 0) this._hass.callService("light", "turn_off", {entity_id: c.entity});
    };
    const end = () => { this._drag = false; if (this._pending) { this._pending = false; this._render(false); } };
    track.onpointerdown = e => { track.setPointerCapture(e.pointerId); this._drag = true; show(at(e)); };
    track.onpointermove = e => { if (this._drag) show(at(e)); };
    track.onpointerup = e => { if (!this._drag) return; show(at(e)); send(); end(); };
    track.onpointercancel = () => { show(v0); end(); };
    track.onkeydown = e => {
      const k = {ArrowRight: 5, ArrowUp: 5, ArrowLeft: -5, ArrowDown: -5, PageUp: 10, PageDown: -10, Home: -100, End: 100}[e.key];
      if (!k) return; e.preventDefault(); show(cur + k); send();
    };
  }
  _temps(wrap, a) {
    const c = this._config, lo = a.min_color_temp_kelvin || 2000, hi = a.max_color_temp_kelvin || 6500;
    // Clamp the four presets to the light's range; presets that clamp to the same kelvin keep the nearest name.
    const by = new Map();
    for (const [name, k] of LIGHT_TEMPS) {
      const kv = Math.max(lo, Math.min(hi, k)), prev = by.get(kv);
      if (!prev || Math.abs(prev.k - kv) > Math.abs(k - kv)) by.set(kv, {name, k, kv});
    }
    const list = [...by.values()].sort((x, y) => x.kv - y.kv);
    const cur = a.color_mode === "color_temp" || !a.color_mode ? a.color_temp_kelvin : null;
    let best = null;
    if (typeof cur === "number") for (const t of list) if (!best || Math.abs(t.kv - cur) < Math.abs(best.kv - cur)) best = t;
    const box = el("div", "chips"); box.setAttribute("role", "group"); box.setAttribute("aria-label", "Colour temperature");
    for (const t of list) {
      const k = cutKey(t.name, `jam-light|${c.entity}|t|${t.name}`, t === best ? "on" : "", "chip");
      k.title = t.kv + " K"; k.setAttribute("aria-pressed", t === best ? "true" : "false");
      k.onclick = () => this._on({color_temp_kelvin: t.kv});
      box.append(k);
    }
    wrap.append(el("div", "label", "White"), box);
  }
  _swatches(wrap, a) {
    const c = this._config, rgb = a.color_mode !== "color_temp" ? a.rgb_color : null;
    const box = el("div", "sws"); box.setAttribute("role", "group"); box.setAttribute("aria-label", "Colour");
    for (const [name, col] of LIGHT_SWATCHES) {
      const act = rgbDist(rgb, col) < 40;
      const {root, face} = paper("button", `jam-light|${c.entity}|c|${name}`, {kind: "chip", cls: "key press sw"});
      root.type = "button"; root.title = name; root.setAttribute("aria-label", name);
      root.setAttribute("aria-pressed", act ? "true" : "false");
      face.style.background = `rgb(${col.join(",")})`;
      root.onclick = () => this._on({rgb_color: col.slice()});
      box.append(root);
    }
    wrap.append(el("div", "label", "Colour"), box);
  }
  _presets(wrap, a) {
    const c = this._config, box = el("div", "chips");
    box.setAttribute("role", "group"); box.setAttribute("aria-label", "Presets");
    for (const p of c.presets) {
      const data = {};
      if (p.color_temp_kelvin != null) data.color_temp_kelvin = Number(p.color_temp_kelvin);
      else if (Array.isArray(p.rgb_color)) data.rgb_color = p.rgb_color.map(Number);
      if (p.brightness_pct != null) data.brightness_pct = Number(p.brightness_pct);
      const act = data.color_temp_kelvin != null
        ? a.color_mode === "color_temp" && Math.abs((a.color_temp_kelvin || 0) - data.color_temp_kelvin) < 60
        : a.color_mode !== "color_temp" && rgbDist(a.rgb_color, data.rgb_color) < 40;
      const k = cutKey(p.name || "Preset", `jam-light|${c.entity}|p|${p.name}`, act ? "on" : "", "chip");
      k.setAttribute("aria-pressed", act ? "true" : "false");
      k.onclick = () => this._on(data);
      box.append(k);
    }
    wrap.append(el("div", "label", "Presets"), box);
  }
  getCardSize() { return 3; }
}
register("jam-light", JamLight, "Jam Light", "Light with an ON key, brightness strip, colour-temp chips and colour swatches.");

/* ---------- jam-list: one paper sheet of entity rows (replaces entities) ----------
   {type: custom:jam-list, title?, entities: [entity_id | {entity, name?, secondary_info?: last-changed|none}], state_color?: true,
    accent? (ON keys and "on" values; DESIGN "Colour system")}
   Row tap = more-info. Toggleable on/off rows get an ON/OFF pill (chip cut); device_tracker/person home/not_home = HOME/AWAY;
   ISO timestamps (uptime, last boot) read as relative time. */
function jlRel(iso) {
  const t = Date.parse(iso);
  if (isNaN(t)) return iso;
  const sec = (t - Date.now()) / 1000, a = Math.abs(sec);
  const [n, u] = a < 60 ? [sec, "second"] : a < 3600 ? [sec / 60, "minute"] : a < 86400 ? [sec / 3600, "hour"] : [sec / 86400, "day"];
  try { return new Intl.RelativeTimeFormat(undefined, {numeric: "auto"}).format(Math.round(n), u); } catch (e) { return iso; }
}
class JamList extends JamBase {
  validate(c) { if (!Array.isArray(c.entities) || !c.entities.length) throw new Error("jam-list: entities is required"); }
  _rows() { return this._config.entities.map(e => (typeof e === "string" ? {entity: e} : e)).filter(r => r && r.entity); }
  watched() { return this._rows().map(r => r.entity); }
  css() { return `
    .sheet{display:grid;align-content:start}
    .ttl{font-size:1.6rem;margin:0 0 6px}
    .row{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:9px 0;min-height:48px;cursor:pointer}
    .row + .row{border-top:2px solid var(--line)}
    .nm{flex:1 1 auto;min-width:0;font:500 .95rem/1.25 var(--body);overflow-wrap:anywhere}
    .sub{display:block;font-size:.75rem;color:var(--dim)}
    .v{flex:0 1 auto;min-width:0;text-align:right;font-family:var(--display);font-weight:900;font-size:1.35rem;line-height:1;
      text-transform:uppercase;overflow-wrap:break-word}
    .sw{flex:none;min-width:58px}`; }
  _val(s) {
    const st = s.state, d = s.entity_id.split(".")[0];
    if ((d === "device_tracker" || d === "person") && (st === "home" || st === "not_home")) return st === "home" ? "Home" : "Away";
    if (/^\d{4}-\d\d-\d\dT\d\d:\d\d/.test(st) && !isNaN(Date.parse(st))) return jlRel(st);
    return fmtState(this._hass, s);
  }
  render(b) {
    const c = this._config, h = this._hass, rows = this._rows();
    const {root, face} = this.paper(c.title || rows[0].entity, {face: "sheet"});
    if (c.title) face.append(el("h2", "disp ttl", c.title));
    for (const r of rows) {
      const s = stateObj(h, r.entity), row = el("div", "row focusable");
      row.tabIndex = 0; row.setAttribute("role", "button");
      bindActions(row, () => this._hass, {tap_action: {action: "more-info"}}, r.entity);
      const nm = el("div", "nm", r.name || friendly(h, r.entity));
      if (r.secondary_info === "last-changed" && s) nm.append(el("span", "sub num", jlRel(s.last_changed)));
      row.append(nm);
      if (s && toggleable(r.entity) && (s.state === "on" || s.state === "off")) {
        const on = s.state === "on", key = cutKey(on ? "On" : "Off", `jam-list|${r.entity}|key`, "sw" + (on ? " on" : ""), "chip");
        key.setAttribute("aria-pressed", on ? "true" : "false");
        key.setAttribute("aria-label", `${r.name || friendly(h, r.entity)}: ${on ? "on" : "off"}`);
        key.onclick = e => { e.stopPropagation(); this._hass.callService("homeassistant", "toggle", {entity_id: r.entity}); };
        row.append(key);
      } else {
        const t = tone(s);
        const v = el("div", "v num" + (c.state_color === false ? "" : ` c-${t === "off" ? "dim" : t}`), s ? this._val(s) : "—");
        if (!s || UNAVAILABLE.has(s.state)) row.classList.add("unavail");
        row.append(v);
      }
      face.append(row);
    }
    b.append(root);
  }
  getCardSize() { return 1 + this._rows().length; }
}
register("jam-list", JamList, "Jam List", "Paper sheet of entity rows with ON/OFF keys for switchable rows (replaces entities).");

/* ---------- jam-media (v2): now playing as a duotone print + transport, volume, sources, players, group ----------
   {type: custom:jam-media, entity (media_player), name?, controls?: [prev, play_pause, next, stop],
    show_art? (true), show_volume? (default: when the player supports volume), sources?: true | [subset],
    players?: [media_player ids] (chip row switching the controlled player, kept in memory),
    group?: [media_player ids] (toggle chips: media_player.join / unjoin with the controlled player;
    hidden unless both have the GROUPING feature bit), accent? (DESIGN "Colour system")}
   Accent = art block (paused: dim), play key, volume fill, active chips. Transport keys and chips use the chip cut.
   v1 configs (entity, name, controls) render unchanged in meaning. */
const JAM_MEDIA_VOLUME_SET = 4, JAM_MEDIA_VOLUME_MUTE = 8, JAM_MEDIA_GROUPING = 524288;
const jamCanGroup = st => !!st && ((Number(st.attributes.supported_features) || 0) & JAM_MEDIA_GROUPING) !== 0;
class JamMedia extends JamBase {
  validate(c) {
    if (!c.entity || !c.entity.startsWith("media_player.")) throw new Error("jam-media: entity must be a media_player");
    for (const k of ["players", "group"]) if (c[k] !== undefined && !Array.isArray(c[k])) throw new Error(`jam-media: ${k} must be a list of media_player ids`);
  }
  setConfig(c) {
    if (c && this._active && !(Array.isArray(c.players) && c.players.includes(this._active))) this._active = null;
    super.setConfig(c);
  }
  /* The player the card currently controls: the in-memory pick from `players`, else `entity`. */
  get _id() { return this._active || this._config.entity; }
  watched() { const c = this._config; return [...new Set([this._id, c.entity, ...(c.players || []), ...(c.group || [])])]; }
  css() { return `
    .wrap{display:grid;gap:12px;align-content:start;container-type:inline-size}
    .np{display:grid;grid-template-columns:minmax(84px,min(36%,200px)) minmax(0,1fr);gap:14px;align-items:start}
    .np.noart{grid-template-columns:minmax(0,1fr)}
    .art{aspect-ratio:1;height:auto;cursor:pointer}
    .art > .face{padding:0;background:var(--acc);overflow:hidden;display:flex;align-items:flex-end;justify-content:center}
    .art.paused > .face{background:var(--dim)}
    .art img{display:block;width:100%;height:100%;object-fit:cover;filter:grayscale(1) contrast(1.15);mix-blend-mode:multiply}
    .art .arm{height:62%;padding-bottom:10%} .art .arm span{background:var(--acc-fg)}
    .txt{display:grid;gap:6px;min-width:0;align-content:start}
    .title{font-family:var(--display);font-weight:900;font-size:clamp(1.4rem,1rem + 4cqi,2.2rem);line-height:.92;text-transform:uppercase;
      overflow-wrap:anywhere;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;cursor:pointer}
    .sub{font:500 .9rem/1.3 var(--body);color:var(--dim);overflow-wrap:anywhere}
    .sub b{font-weight:600;color:var(--fg)}
    .ctl{display:flex;gap:8px;flex-wrap:wrap}
    .ctl .key{min-width:72px;flex:1 1 72px}
    .ctl .key > .face{--p-t:12px;--p-b:12px;--p-l:10px;--p-r:10px}
    .vol{display:grid;grid-template-columns:auto minmax(0,1fr) 3.4em;gap:10px;align-items:center}
    .vol .key{min-width:64px}
    .vol .v{font-family:var(--display);font-weight:900;font-size:1.4rem;line-height:1;text-align:right}
    .track{cursor:pointer}
    .muted .fill{background:var(--dim)}
    .grp{display:grid;gap:6px}
    .chips{display:flex;flex-wrap:wrap;gap:6px}
    .chips .key{min-width:0;max-width:100%;height:auto}
    .chips .key > .face{--p-t:8px;--p-b:8px;--p-l:10px;--p-r:10px;font-size:.66rem;letter-spacing:.12em;overflow-wrap:anywhere;min-height:34px;display:flex;align-items:center}`; }
  _url(u) {
    if (!u) return null;
    const h = this._hass;
    if (/^(https?:|data:|blob:)/i.test(u)) return u;
    try { if (h && typeof h.hassUrl === "function") return h.hassUrl(u); } catch (e) { /* fall through */ }
    return u;
  }
  _call(svc, data) { this._hass.callService("media_player", svc, {entity_id: this._id, ...data}); }
  _chipRow(label, items, kind) {
    const g = el("div", "grp " + kind); g.append(el("div", "label", label));
    const row = el("div", "chips"); g.append(row);
    for (const it of items) {
      const b = cutKey(it.text, `jam-media|${this._config.entity}|${kind}|${it.key}`, it.on ? "on" : "", "chip");
      b.setAttribute("aria-pressed", it.on ? "true" : "false");
      b.dataset.id = it.key; b.disabled = !!it.disabled; b.onclick = it.run;
      row.append(b);
    }
    return g;
  }
  render(b) {
    const c = this._config, h = this._hass, id = this._id, s = stateObj(h, id);
    const off = !s || UNAVAILABLE.has(s.state);
    const a = (s && s.attributes) || {}, feat = Number(a.supported_features) || 0;
    const {root, face: wrap} = this.paper(c.entity, {face: `wrap stripe s-${tone(s)}${off ? " unavail" : ""}`});
    wrap.append(el("div", "label", (id === c.entity && c.name) || friendly(h, id)));

    // Player switch (in memory).
    if (c.players && c.players.length) wrap.append(this._chipRow("Player", c.players.map(p => ({
      key: p, text: friendly(h, p), on: p === id, disabled: !stateObj(h, p),
      run: () => { this._active = p === c.entity ? null : p; this._sig = null; this.hass = this._hass; },
    })), "players"));

    // Now playing: duotone art + title / artist / album.
    const np = el("div", "np"), showArt = c.show_art !== false;
    if (showArt) {
      const paused = s && s.state === "paused";
      const {root: art, face} = paper("div", "jam-media-art|" + id, {kind: "chip", cls: "art" + (paused ? " paused" : "")});
      art.setAttribute("aria-hidden", "true"); art.onclick = () => moreInfo(this, id);
      const src = this._url(a.entity_picture_local || a.entity_picture);
      if (src && !off) {
        const img = el("img"); img.alt = ""; img.decoding = "async"; img.src = src;
        img.onerror = () => { img.remove(); face.append(armBars("jam-media|" + id)); };
        face.append(img);
      } else face.append(armBars("jam-media|" + id));
      np.append(art);
    } else np.classList.add("noart");
    const txt = el("div", "txt");
    const tt = el("div", "title", a.media_title || a.app_name || (s ? fmtState(h, s) : "—"));
    tt.onclick = () => moreInfo(this, id);
    txt.append(tt);
    if (a.media_artist) { const sb = el("div", "sub"); sb.append(el("b", "", a.media_artist)); txt.append(sb); }
    if (a.media_album_name) txt.append(el("div", "sub", a.media_album_name));
    np.append(txt); wrap.append(np);

    // Transport.
    const ctl = el("div", "ctl");
    const playing = s && s.state === "playing";
    const map = {
      prev: ["Prev", "media_previous_track"], next: ["Next", "media_next_track"], stop: ["Stop", "media_stop"],
      play_pause: [playing ? "Pause" : "Play", "media_play_pause"],
    };
    for (const k of c.controls || ["prev", "play_pause", "next"]) {
      const m = map[k]; if (!m) continue;
      const btn = cutKey(m[0], `jam-media|${c.entity}|${k}`, k === "play_pause" ? "main on" : "", "chip");
      btn.dataset.key = k; btn.disabled = off;
      btn.onclick = () => this._call(m[1]);
      ctl.append(btn);
    }
    wrap.append(ctl);

    // Volume strip + mute.
    const hasVol = !!(feat & JAM_MEDIA_VOLUME_SET) || a.volume_level !== undefined;
    if (c.show_volume === true || (c.show_volume !== false && hasVol)) wrap.append(this._volume(id, a, feat, off));

    // Sources.
    if (c.sources) {
      const all = a.source_list || [];
      const list = Array.isArray(c.sources) ? (all.length ? c.sources.filter(x => all.includes(x)) : c.sources) : all;
      if (list.length) wrap.append(this._chipRow("Source", list.map(x => ({
        key: x, text: x, on: a.source === x, disabled: off, run: () => this._call("select_source", {source: x}),
      })), "sources"));
    }

    // Group: join / unjoin with the controlled player. Only players with the GROUPING feature (row and member chips).
    const grp = (c.group || []).filter(g => g !== id && jamCanGroup(stateObj(h, g)));
    if (grp.length && jamCanGroup(s)) {
      const members = a.group_members || [];
      wrap.append(this._chipRow("Group", grp.map(g => {
        const gs = stateObj(h, g), joined = members.includes(g) || ((gs && gs.attributes.group_members) || []).includes(id);
        return {key: g, text: friendly(h, g), on: joined, disabled: off || !gs || UNAVAILABLE.has(gs.state),
          run: () => joined ? h.callService("media_player", "unjoin", {entity_id: g}) : this._call("join", {group_members: [g]})};
      }), "group"));
    }
    b.append(root);
  }
  _volume(id, a, feat, off) {
    const row = el("div", "vol" + (a.is_volume_muted ? " muted" : ""));
    const muted = !!a.is_volume_muted;
    const mute = cutKey(muted ? "Unmute" : "Mute", `jam-media|${this._config.entity}|mute`, muted ? "alert" : "", "chip");
    mute.dataset.key = "mute";
    mute.disabled = off || !(feat & JAM_MEDIA_VOLUME_MUTE || a.is_volume_muted !== undefined);
    mute.onclick = () => this._call("volume_mute", {is_volume_muted: !muted});
    const track = el("div", "track"), strip = el("div", "strip"), fill = el("div", "fill");
    strip.append(fill); track.append(strip);
    let cur = Math.round((Number(a.volume_level) || 0) * 100);
    const val = el("div", "v num", off ? "—" : String(cur));
    row.append(mute, track, val);
    const show = v => { cur = Math.max(0, Math.min(100, Math.round(v))); fill.style.width = cur + "%"; val.textContent = String(cur); track.setAttribute("aria-valuenow", cur); };
    fill.style.width = (off ? 0 : cur) + "%";
    if (off) return row;
    track.tabIndex = 0; track.setAttribute("role", "slider"); track.setAttribute("aria-label", "Volume");
    track.setAttribute("aria-valuemin", 0); track.setAttribute("aria-valuemax", 100); track.setAttribute("aria-valuenow", cur);
    const send = () => this._call("volume_set", {volume_level: cur / 100});
    const at = e => { const r = track.getBoundingClientRect(); return Math.max(0, Math.min(1, (e.clientX - r.left) / r.width)) * 100; };
    track.onpointerdown = e => { track.setPointerCapture(e.pointerId); show(at(e)); track.dataset.drag = "1"; };
    track.onpointermove = e => { if (track.dataset.drag) show(at(e)); };
    track.onpointerup = e => { if (!track.dataset.drag) return; delete track.dataset.drag; show(at(e)); send(); };
    track.onkeydown = e => {
      const k = {ArrowRight: 1, ArrowUp: 1, ArrowLeft: -1, ArrowDown: -1}[e.key];
      if (!k) return; e.preventDefault(); show(cur + k * 2); send();
    };
    return row;
  }
  getCardSize() { return 5; }
}
register("jam-media", JamMedia, "Jam Media", "Now playing as a duotone print, transport, volume, sources, player switch and grouping.");

/* ---------- jam-popup: full-screen ink veil + cut sheet (top-right 18px) that opens on a URL hash ----------
   {type: custom:jam-popup, hash: "#lights-popup", title?, kicker?, accent?: colour or room alias (default ochre),
    spiral? (Vertigo flash on open, default true), cards: [card configs]}
   Accent = kicker, header rule, spiral; a configured accent is also handed to the child cards as --jam-accent (a child's
   own accent option still wins).
   Open while location.hash === hash (navigate action to "#lights-popup", a link, or the address bar).
   Close: CLOSE key, veil click, Esc, browser back. Children are created with HA's card helpers (preview: by tag). */
const POPUP_CSS = `
  /* Zero footprint when closed: the host is a 0-height block; the overlay is position:fixed. Whether a sections
     grid adds a gap/row for a 0-height card is verified in real HA in the clone step. */
  :host{display:block;height:0;overflow:visible}
  .pop{position:fixed;inset:0;z-index:9999;display:none;--acc:var(--jam-accent,var(--ochre));--acc-fg:var(--on-fg)}
  .pop.open{display:block}
  .veil{position:absolute;inset:0;background:var(--ink)}
  .spiral{position:absolute;left:50%;top:50%;width:min(92vmin,720px);height:min(92vmin,720px);transform:translate(-50%,-50%);
    visibility:hidden;pointer-events:none;color:var(--acc)}
  .stage{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;padding:16px;pointer-events:none}
  .sheet{pointer-events:auto;width:100%;max-width:560px;height:auto}
  .sheet > .face{--p-t:16px;--p-r:18px;--p-b:18px;--p-l:18px;height:auto;max-height:88vh;display:flex;flex-direction:column;gap:12px;
    background:var(--slab2);outline:none}
  .head{flex:none;display:flex;justify-content:space-between;align-items:flex-start;gap:12px}
  .t{display:grid;gap:4px;min-width:0}
  .t .label{color:var(--acc)}
  .t h2{font-size:clamp(1.7rem,6vw,2.4rem);overflow-wrap:anywhere}
  .rule{flex:none;height:5px;background:var(--acc)}
  .body{flex:1 1 auto;min-height:0;overflow:auto;overscroll-behavior:contain;display:grid;gap:10px;align-content:start;padding:2px 2px 4px 0}
  .body > *{display:block;min-width:0}
  .close{flex:none}
  .pop.opening .wipe{animation:jam-wipe 160ms steps(4,start) backwards}
  .pop.opening .spiral{animation:jam-flash 120ms steps(1,end) both}
  @keyframes jam-wipe{from{clip-path:inset(0 100% 0 0)}to{clip-path:inset(0 0 0 0)}}
  @keyframes jam-flash{from{visibility:visible}to{visibility:hidden}}
  @keyframes jam-wipe-up{from{clip-path:inset(100% 0 0 0)}to{clip-path:inset(0 0 0 0)}}
  @media (max-width:600px){
    .stage{align-items:flex-end;padding:0}
    .sheet{max-width:none}
    .sheet > .face{padding-bottom:calc(var(--p-b) + env(safe-area-inset-bottom,0px))}
    .pop.opening .wipe{animation-name:jam-wipe-up}
  }
  @media (prefers-reduced-motion:reduce){.pop.opening .wipe,.pop.opening .spiral{animation:none!important}}`;

/* Local helper: Vertigo spiral (Archimedean, 5 turns) as an aria-hidden SVG stroked in currentColor. */
function vertigoSpiral() {
  const NS = "http://www.w3.org/2000/svg", svg = document.createElementNS(NS, "svg"), path = document.createElementNS(NS, "path");
  svg.setAttribute("viewBox", "-100 -100 200 200"); svg.setAttribute("aria-hidden", "true");
  const pts = [];
  for (let t = 0; t <= Math.PI * 10; t += 0.12) { const r = 2 + t * 3; pts.push((r * Math.cos(t)).toFixed(1) + " " + (r * Math.sin(t)).toFixed(1)); }
  path.setAttribute("d", "M" + pts.join(" L"));
  path.setAttribute("fill", "none"); path.setAttribute("stroke", "currentColor");
  path.setAttribute("stroke-width", "7"); path.setAttribute("stroke-linecap", "square"); path.setAttribute("stroke-linejoin", "miter");
  svg.append(path);
  return svg;
}
/* Local helper: the deepest focused element across shadow roots (to restore focus on close). */
function deepActive() {
  let a = document.activeElement;
  while (a && a.shadowRoot && a.shadowRoot.activeElement) a = a.shadowRoot.activeElement;
  return a;
}

/* Local helper: index of the current history entry (Navigation API), or null where the API is missing. */
function navIndex() {
  try { const e = window.navigation && window.navigation.currentEntry; return e && typeof e.index === "number" && e.index >= 0 ? e.index : null; }
  catch (err) { return null; }
}

class JamPopup extends JamBase {
  constructor() {
    super();
    this._open = false; this._kids = []; this._cardsSig = null; this._last = null; this._build = 0;
    this._onLoc = () => this._sync(false);
    this._onKey = e => { if (this._open && e.key === "Escape") { e.preventDefault(); this.close(); } };
  }
  validate(c) {
    if (!c.hash || !/^#./.test(c.hash)) throw new Error('jam-popup: hash is required, e.g. "#lights-popup"');
    if (c.cards && !Array.isArray(c.cards)) throw new Error("jam-popup: cards must be a list");
  }
  setConfig(config) {
    if (!config) throw new Error("Invalid configuration");
    this.validate(config);
    this._config = config;
    this._shell();
    const sig = JSON.stringify(config.cards || []);
    if (sig !== this._cardsSig) { this._cardsSig = sig; this._makeKids(config.cards || []); }
    if (this.isConnected) this._sync(true);
  }
  set hass(h) {
    this._hass = h;
    for (const k of this._kids) { try { k.hass = h; } catch (e) { /* child without hass setter */ } }
  }
  get hass() { return this._hass; }
  connectedCallback() {
    window.addEventListener("location-changed", this._onLoc);
    window.addEventListener("hashchange", this._onLoc);
    window.addEventListener("popstate", this._onLoc);
    document.addEventListener("keydown", this._onKey);
    this._sync(true);
  }
  disconnectedCallback() {
    window.removeEventListener("location-changed", this._onLoc);
    window.removeEventListener("hashchange", this._onLoc);
    window.removeEventListener("popstate", this._onLoc);
    document.removeEventListener("keydown", this._onKey);
    if (this._open) this._hide(false);
  }
  /* Static DOM: veil, spiral, sheet (sheet cut: top-right 18px; a bottom sheet on phones). */
  _shell() {
    const c = this._config, root = this.shadowRoot;
    root.textContent = "";
    const st = el("style"); st.textContent = BASE_CSS + POPUP_CSS;
    const pop = el("div", "pop"); setAccent(pop, c.accent);
    const veil = el("div", "veil"); veil.setAttribute("aria-hidden", "true");
    veil.onclick = () => this.close();
    const spiral = el("div", "spiral"); spiral.append(vertigoSpiral());
    if (c.spiral === false) spiral.hidden = true;
    const stage = el("div", "stage");
    const key = "jam-popup|" + c.hash;
    const {root: sheet, face} = this.paper(key, {kind: "sheet", cls: "sheet wipe"});
    face.tabIndex = -1; face.setAttribute("role", "dialog"); face.setAttribute("aria-modal", "true");
    face.setAttribute("aria-label", c.title || c.kicker || "Pop-up");
    const head = el("div", "head"), t = el("div", "t");
    if (c.kicker) t.append(el("div", "label", c.kicker));
    if (c.title) t.append(el("h2", "disp", c.title));
    const close = cutKey("Close ×", key + "|close", "close", "chip");
    close.setAttribute("aria-label", "Close");
    close.onclick = () => this.close();
    head.append(t, close);
    const rule = el("div", "rule"); rule.setAttribute("aria-hidden", "true");
    this._bodyEl = el("div", "body");
    if (accentVar(c.accent)) this._bodyEl.style.setProperty("--jam-accent", accentVar(c.accent));
    for (const k of this._kids) this._bodyEl.append(k);
    face.append(head, rule, this._bodyEl);
    stage.append(sheet);
    pop.append(veil, spiral, stage);
    root.append(st, pop);
    this._pop = pop; this._face = face;
    if (this._open) pop.classList.add("open");
  }
  async _makeKids(cards) {
    const gen = ++this._build;
    let helpers = null;
    try { helpers = window.loadCardHelpers ? await window.loadCardHelpers() : null; } catch (e) { helpers = null; }
    if (gen !== this._build) return; // a newer config arrived while the helpers loaded
    this._kids = cards.map(cfg => this._makeKid(cfg, helpers));
    if (this._bodyEl) { this._bodyEl.textContent = ""; for (const k of this._kids) this._bodyEl.append(k); }
    if (this._hass) this.hass = this._hass;
  }
  _makeKid(cfg, helpers) {
    try {
      if (helpers && helpers.createCardElement) {
        const k = helpers.createCardElement(cfg);
        // HA swaps in an error card while a custom card is still loading and fires ll-rebuild once it is defined.
        k.addEventListener("ll-rebuild", ev => {
          ev.stopPropagation();
          const i = this._kids.indexOf(k), n = this._makeKid(cfg, helpers);
          if (i < 0) return;
          this._kids[i] = n;
          if (k.parentNode) k.replaceWith(n);
          if (this._hass) n.hass = this._hass;
        }, {once: true});
        return k;
      }
      const type = String((cfg && cfg.type) || "");
      const tag = type.startsWith("custom:") ? type.slice(7) : `hui-${type}-card`;
      if (!customElements.get(tag)) throw new Error(`Unknown card type: ${type}`);
      const k = document.createElement(tag);
      k.setConfig(cfg);
      return k;
    } catch (e) {
      const d = el("div", "label c-alert", e.message || String(e));
      d.style.padding = "8px 0";
      return d;
    }
  }
  _sync(initial) {
    if (!this._config) return;
    const want = location.hash === this._config.hash;
    if (!want) clearTimeout(this._backT);
    if (!want) this._last = {len: history.length, idx: navIndex(), path: location.pathname + location.search};
    if (want && !this._open) this._show(!initial);
    else if (!want && this._open) this._hide(true);
  }
  _show(animate) {
    this._open = true; clearTimeout(this._backT);
    // history.back() is only safe when the hash was pushed onto this same page: we saw the page without the hash and
    // the hash entry is the very next one (Navigation API index; else history.length grew by one). Otherwise
    // (deep link, replace navigation, unknown history) close() clears the hash in place.
    const l = this._last, idx = navIndex();
    this._viaNav = !!l && l.path === location.pathname + location.search &&
      (idx != null && l.idx != null ? idx === l.idx + 1 : history.length === l.len + 1);
    this._prevFocus = deepActive();
    const de = document.documentElement, bd = document.body;
    this._scroll = [de.style.overflow, bd.style.overflow];
    de.style.overflow = "hidden"; bd.style.overflow = "hidden";
    this._pop.classList.add("open");
    this._pop.classList.remove("opening");
    if (animate) { void this._pop.offsetWidth; this._pop.classList.add("opening"); }
    this._face.scrollTop = 0; this._bodyEl.scrollTop = 0;
    try { this._face.focus({preventScroll: true}); } catch (e) { this._face.focus(); }
  }
  _hide(restoreFocus) {
    this._open = false;
    this._pop.classList.remove("open", "opening");
    if (this._scroll) {
      document.documentElement.style.overflow = this._scroll[0]; document.body.style.overflow = this._scroll[1];
      this._scroll = null;
    }
    const f = this._prevFocus; this._prevFocus = null;
    if (restoreFocus && f && f.isConnected && typeof f.focus === "function") { try { f.focus({preventScroll: true}); } catch (e) { /* ignore */ } }
  }
  /* Close: back out of the navigation that opened us; if that did not clear the hash (deep link, odd history),
     drop the hash in place and tell HA's router. */
  close() {
    if (!this._open) return;
    const hash = this._config.hash, back = this._viaNav;
    this._hide(true);
    const clear = () => {
      if (location.hash !== hash) return;
      history.replaceState(null, "", location.pathname + location.search);
      window.dispatchEvent(new CustomEvent("location-changed", {detail: {replace: true}}));
    };
    // Fallback if back() did not remove the hash; cancelled once the hash is gone or the pop-up reopens.
    if (back) { history.back(); clearTimeout(this._backT); this._backT = setTimeout(clear, 300); } else clear();
  }
  getCardSize() { return 0; }
  getGridOptions() { return {columns: 12, rows: "auto"}; }
}
register("jam-popup", JamPopup, "Jam Pop-up", "Full-screen ink veil with a cut sheet of cards, opened by a URL hash.");

/* ---------- jam-remote: TV remote (d-pad cross of cut arrows + keys) ----------
   {type: custom:jam-remote, entity (remote.*), media_player? (title/state), name?,
    rows?: [[key, ...], ["dpad"], ...], commands?: {key: send_command value}, actions?: {key: action object},
    labels?: {key: text}, accent? (OK disc + arrow marks; DESIGN "Colour system")}
   Row keys = key cut (top-right 12px); power is red. D-pad arms are fixed straight arrows (45° point toward the arm's
   direction), the OK key a disc.
   A key runs actions[key] if set, else remote.send_command commands[key] (Android TV defaults);
   power without a command = remote.toggle. D-pad arms and volume keys repeat while held (400 ms, then every 180 ms).
   Title: media_title, else app_name unless it is a package id (has a dot), else a known name for the current package (app_id, else
   app_name, else the remote's current_activity; JAM_REMOTE_APPS, null = skip), else name / the media_player's friendly_name. */
const JAM_REMOTE_ROWS = [["power", "back", "home", "menu"], ["dpad"], ["prev", "play_pause", "next"], ["vol_down", "mute", "vol_up"]];
const JAM_REMOTE_CMDS = {
  up: "DPAD_UP", down: "DPAD_DOWN", left: "DPAD_LEFT", right: "DPAD_RIGHT", ok: "DPAD_CENTER",
  back: "BACK", home: "HOME", menu: "MENU", prev: "MEDIA_PREVIOUS", next: "MEDIA_NEXT", play_pause: "MEDIA_PLAY_PAUSE",
  mute: "VOLUME_MUTE", vol_up: "VOLUME_UP", vol_down: "VOLUME_DOWN",
};
const JAM_REMOTE_LABELS = {
  power: "Power", back: "Back", home: "Home", menu: "Menu", prev: "Prev", next: "Next", play_pause: "Play",
  mute: "Mute", vol_up: "Vol +", vol_down: "Vol −", ok: "OK", up: "Up", down: "Down", left: "Left", right: "Right",
};
/* Package id -> short title; null = never show (fall through to the name). Prefix keys end with "." */
const JAM_REMOTE_APPS = {
  "com.spocky.projengmenu": "Home", "org.jellyfin.androidtv": "Jellyfin", "com.jellywatch.tv": "Jellywatch",
  "com.google.android.youtube.tv": "YouTube", "com.netflix.ninja": "Netflix", "com.nintendo.": null,
};
function jamRemoteApp(id) {
  if (typeof id !== "string" || !id) return undefined;
  if (id in JAM_REMOTE_APPS) return JAM_REMOTE_APPS[id];
  for (const k in JAM_REMOTE_APPS) if (k.endsWith(".") && id.startsWith(k)) return JAM_REMOTE_APPS[k];
  return undefined;
}
const JAM_REMOTE_REPEAT = new Set(["up", "down", "left", "right", "vol_up", "vol_down"]);

class JamRemote extends JamBase {
  validate(c) { if (!c.entity || !c.entity.startsWith("remote.")) throw new Error("jam-remote: entity must be a remote"); }
  watched() { return [this._config.entity, this._config.media_player].filter(Boolean); }
  css() { return `
    .wrap{display:grid;gap:12px;align-content:start}
    .title{font-family:var(--display);font-weight:900;font-size:1.5rem;line-height:.95;text-transform:uppercase;overflow-wrap:anywhere;
      display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}
    .row{display:grid;grid-auto-flow:column;grid-auto-columns:minmax(0,1fr);gap:8px}
    .row .key{min-width:0}
    .row .key > .face{--p-t:13px;--p-b:13px;--p-l:6px;--p-r:6px;min-height:48px;display:flex;align-items:center;justify-content:center;overflow-wrap:anywhere}
    .pad{display:grid;grid-template-columns:repeat(3,minmax(56px,78px));grid-template-rows:repeat(3,minmax(56px,78px));justify-content:center;gap:2px;padding:4px 0 8px}
    .pad > .paper{min-width:48px;min-height:48px;aspect-ratio:1}
    .pad > .paper > .face{padding:0;display:grid;place-items:center;background:var(--slab2);color:var(--fg)}
    .pad > .paper:not(:disabled):hover > .face{background:var(--line)}
    .pad .tri{width:34%;height:34%;background:var(--acc)}
    .pad .ok > .face{background:var(--acc);color:var(--acc-fg);font:900 1.35rem/1 var(--display);text-transform:uppercase;letter-spacing:.02em}
    .pad .ok:not(:disabled):hover > .face{background:var(--acc)}
    .pad .up{grid-area:1/2} .pad .left{grid-area:2/1} .pad .ok{grid-area:2/2} .pad .right{grid-area:2/3} .pad .down{grid-area:3/2}`; }
  _run(k) {
    const c = this._config, h = this._hass;
    const a = c.actions && c.actions[k];
    if (a) { runAction(this, h, a, c.entity); return; }
    const cmd = (c.commands && c.commands[k]) || (k === "power" ? null : JAM_REMOTE_CMDS[k]);
    if (cmd) h.callService("remote", "send_command", {entity_id: c.entity, command: cmd});
    else if (k === "power") h.callService("remote", "toggle", {entity_id: c.entity});
  }
  _known(k) {
    const c = this._config;
    return !!((c.actions && c.actions[k]) || (c.commands && c.commands[k]) || JAM_REMOTE_CMDS[k] || k === "power");
  }
  /* Tap = one send. Repeat keys: send on pointerdown, repeat after 400 ms every 180 ms until up/leave/cancel;
     keyboard activation (click with detail 0) sends once. */
  _bind(btn, k) {
    if (!JAM_REMOTE_REPEAT.has(k)) { btn.onclick = () => this._run(k); return; }
    let t = null, iv = null;
    const stop = () => { clearTimeout(t); clearInterval(iv); t = iv = null; };
    btn.addEventListener("pointerdown", e => {
      if (e.button || btn.disabled) return;
      if (this._hold) this._hold();
      stop(); this._hold = stop; this._run(k);
      const t0 = Date.now();
      t = setTimeout(() => { iv = setInterval(() => (Date.now() - t0 > 20000 ? stop() : this._run(k)), 180); }, 400);
      // Release anywhere ends the hold, also when a state update re-rendered the key mid-hold.
      window.addEventListener("pointerup", stop, {once: true}); window.addEventListener("pointercancel", stop, {once: true});
    });
    for (const ev of ["pointerup", "pointerleave", "pointercancel", "blur"]) btn.addEventListener(ev, stop);
    btn.addEventListener("contextmenu", e => e.preventDefault());
    btn.addEventListener("click", e => { if (e.detail === 0) this._run(k); });
  }
  /* Arm: straight 5-point arrow pointing `dir` (square block with a 45° point), base on the side touching the OK disc. */
  _arm(dir) {
    const up = [[0, 100], [0, 50], [50, 0], [100, 50], [100, 100]];
    const map = {up: (x, y) => [x, y], right: (x, y) => [100 - y, x], down: (x, y) => [100 - x, 100 - y], left: (x, y) => [y, 100 - x]}[dir];
    return `polygon(${up.map(([x, y]) => map(x, y).map(v => v + "%").join(" ")).join(",")})`;
  }
  _pad(off) {
    const c = this._config, pad = el("div", "pad");
    const tri = {up: "polygon(50% 0,100% 100%,0 100%)", down: "polygon(0 0,100% 0,50% 100%)", left: "polygon(0 50%,100% 0,100% 100%)", right: "polygon(0 0,100% 50%,0 100%)"};
    ["up", "left", "ok", "right", "down"].forEach(k => {
      const {root, face} = paper("button", "jam-remote|" + k, {cls: k + " press"});
      root.type = "button";
      const lbl = (c.labels && c.labels[k]) || JAM_REMOTE_LABELS[k];
      if (k === "ok") {
        root.style.setProperty("--clip", "circle(46% at 50% 50%)"); root.dataset.cut = "disc";
        face.textContent = lbl;
      } else {
        root.style.setProperty("--clip", this._arm(k)); root.dataset.cut = "arrow";
        const t = el("span", "tri"); t.style.clipPath = tri[k]; t.setAttribute("aria-hidden", "true");
        face.append(t); root.setAttribute("aria-label", lbl);
      }
      root.dataset.key = k; root.disabled = off;
      this._bind(root, k);
      pad.append(root);
    });
    return pad;
  }
  _title(s, mp) {
    const c = this._config, a = (mp && mp.attributes) || {};
    if (a.media_title) return String(a.media_title);
    if (a.app_name && !String(a.app_name).includes(".")) return String(a.app_name);
    const t = jamRemoteApp(a.app_id || a.app_name || (s && s.attributes.current_activity)); /* the current app's package */
    if (t) return t;
    return c.name || friendly(this._hass, c.media_player || c.entity) || "—";
  }
  render(b) {
    const c = this._config, h = this._hass, s = stateObj(h, c.entity), mp = stateObj(h, c.media_player);
    const off = !s || UNAVAILABLE.has(s.state);
    const {root, face: wrap} = this.paper(c.entity, {face: `wrap stripe s-${tone(s)}${off ? " unavail" : ""}`});
    wrap.append(el("div", "label", c.name || friendly(h, c.entity)));
    const title = this._title(s, mp);
    const tt = el("div", "title", title); tt.style.cursor = "pointer"; tt.onclick = () => moreInfo(this, c.media_player || c.entity);
    wrap.append(tt);
    for (const row of c.rows || JAM_REMOTE_ROWS) {
      if (!Array.isArray(row)) continue;
      if (row.includes("dpad")) { wrap.append(this._pad(off)); continue; }
      const r = el("div", "row");
      for (const k of row) {
        const lbl = (c.labels && c.labels[k]) || JAM_REMOTE_LABELS[k] || String(k).replace(/_/g, " ");
        const btn = cutKey(lbl, `jam-remote|${c.entity}|${k}`, k === "power" ? "alert" : "");
        btn.dataset.key = k;
        btn.disabled = off || !this._known(k);
        this._bind(btn, k);
        r.append(btn);
      }
      wrap.append(r);
    }
    b.append(root);
  }
  disconnectedCallback() { if (this._hold) this._hold(); }
  getCardSize() { return 7; }
}
register("jam-remote", JamRemote, "Jam Remote", "TV remote: d-pad of cut arrows, OK disc and keys sending remote commands or custom actions.");

/* ---------- jam-slider: strip for number / input_number / light brightness / media volume / fan speed ----------
   {type: custom:jam-slider, entity, name?, min?, max?, step?, accent? (fill colour; DESIGN "Colour system")}
   Slab2 strip, accent fill with a straight 8px diagonal end (shared .track/.strip/.fill in BASE_CSS). */
class JamSlider extends JamBase {
  validate(c) { if (!c.entity) throw new Error("jam-slider: entity is required"); }
  watched() { return [this._config.entity]; }
  css() { return `
    .wrap{display:grid;gap:10px;align-content:start}
    .row{display:flex;justify-content:space-between;align-items:baseline;gap:10px}
    .v{font-family:var(--display);font-weight:900;font-size:1.7rem;line-height:1}
    .track{cursor:pointer}`; }
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
    const {root, face: wrap} = this.paper(c.entity, {face: `wrap stripe s-${m && !isNaN(m.v) ? (m.v > m.min ? "on" : "off") : "alert"}`});
    const row = el("div", "row");
    row.append(el("div", "label", c.name || friendly(h, c.entity)));
    const val = el("div", "v num", m && !isNaN(m.v) ? `${m.v}${m.unit ? " " + m.unit : ""}` : "—");
    row.append(val); wrap.append(row);
    const track = el("div", "track"), strip = el("div", "strip"), fill = el("div", "fill");
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
register("jam-slider", JamSlider, "Jam Slider", "Strip for numbers, light brightness, media volume or fan speed.");

/* ---------- jam-tile: entity block with status stripe ----------
   {type: custom:jam-tile, entity, name?, label?, control?: auto|toggle|lock|press|none, tones?: {state: on|alert|calm|off},
    tap_action?, hold_action?, double_tap_action?, show_last_changed?, accent? (DESIGN "Colour system")}
   Card = card cut; the key is a pill (chip cut). On: stripe, value and ON key in the accent; jammed lock key red.
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
      key = cutKey(on ? "On" : "Off", k, "sw" + (on ? " on" : ""), "chip");
      key.setAttribute("aria-pressed", on ? "true" : "false");
      call = () => h.callService("homeassistant", "toggle", {entity_id: c.entity});
    } else if (ctl === "lock") {
      const locked = s.state === "locked";
      key = cutKey(locked ? "Unlock" : "Lock", k, "sw" + (s.state === "jammed" ? " alert" : ""), "chip");
      call = () => h.callService("lock", locked ? "unlock" : "lock", {entity_id: c.entity});
    } else if (ctl === "press") {
      key = cutKey("Press", k, "sw", "chip");
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

/* ---------- jam-weather: big temperature + condition word + cut-paper glyph, forecast strip, optional clock ----------
   {type: custom:jam-weather, entity (weather.*), forecast_type?: daily|hourly|twice_daily, days? (5), clock? (false),
    temperature_entity?, show_current? (true), show_forecast? (true), tap_action?, hold_action?, double_tap_action?, accent?}
   Accent = today's forecast column (filled, ink text and glyphs) and the temperature bars; glyph colours are fixed.
   Forecast via weather/subscribe_forecast (unsubscribed on disconnect / config change); falls back to the legacy
   `forecast` attribute when the subscription fails. show_current: false hides the temperature/condition block.
   Glyphs are flat cut shapes (≤6 each), no animation. */
const JAM_WX_NS = "http://www.w3.org/2000/svg";
/* HA time format (hass.locale.time_format): "12" | "24" force it; "language" lets Intl decide for hass.locale.language,
   "system" for the browser default. Returns {loc, h12} for toLocaleTimeString(loc, {hour12: h12}). */
function jamWxTime(h) {
  const l = h && h.locale, tf = l && l.time_format;
  const loc = tf === "system" ? undefined : (l && l.language) || (h && h.language) || undefined;
  if (tf === "12" || tf === "24") return {loc, h12: tf === "12"};
  let h12;
  try { const o = new Intl.DateTimeFormat(loc, {hour: "numeric"}).resolvedOptions(); h12 = o.hourCycle ? /h1[12]/.test(o.hourCycle) : !!o.hour12; } catch (e) { h12 = false; }
  return {loc, h12};
}
const JAM_WX_TYPES = ["daily", "hourly", "twice_daily"];
const JAM_WX_WORDS = {
  "clear-night": "Clear night", cloudy: "Cloudy", exceptional: "Alert", fog: "Fog", hail: "Hail", lightning: "Lightning",
  "lightning-rainy": "Storm", partlycloudy: "Partly cloudy", pouring: "Pouring", rainy: "Rain", snowy: "Snow",
  "snowy-rainy": "Sleet", sunny: "Sunny", windy: "Windy", "windy-variant": "Windy",
};
/* Shapes in a 48x48 box. Classes pick the colour: s = sun (ochre), p = paper, r = rain (teal), b = bolt (red), g = cut (face colour). */
const JAM_WX_CLOUD = ["polygon", {points: "4,36 5,29 10,25 13,26 15,19 21,15 26,14 31,17 34,22 39,21 43,25 45,30 44,36"}, "p"];
const JAM_WX_SUN = [
  ["polygon", {points: "24,1 27,10 34,3 33,13 44,10 37,18 47,22 38,26 46,33 36,33 39,44 31,37 26,47 22,38 14,46 15,35 4,38 10,30 1,24 11,20 4,12 14,13 12,3 20,10"}, "s"],
  ["circle", {cx: 24, cy: 24, r: 12}, "g"],
  ["circle", {cx: 24, cy: 24, r: 9}, "s"],
];
const JAM_WX_MOON = [["circle", {cx: 22, cy: 25, r: 17}, "p"], ["circle", {cx: 31, cy: 17, r: 14}, "g"]];
const jamWxUp = (shape, dy) => ["g", {transform: `translate(0 ${dy})`}, null, [shape]];
const jamWxSmall = shapes => ["g", {transform: "translate(-2 -3) scale(.62)"}, null, shapes];
const jamWxSlash = x => ["polygon", {points: `${x},33 ${x + 4},33 ${x - 1},45 ${x - 5},45`}, "r"];
const jamWxSquare = (x, y) => ["rect", {x, y, width: 5, height: 5}, "p"];
const jamWxStrip = (x, y, l) => ["polygon", {points: `${x},${y} ${x + l},${y} ${x + l - 5},${y + 5} ${x - 5},${y + 5}`}, "p"];
const JAM_WX_GLYPHS = {
  sunny: JAM_WX_SUN,
  "clear-night": JAM_WX_MOON,
  cloudy: [JAM_WX_CLOUD],
  partlycloudy: [jamWxSmall(JAM_WX_SUN), JAM_WX_CLOUD],
  rainy: [jamWxUp(JAM_WX_CLOUD, -8), jamWxSlash(14), jamWxSlash(24), jamWxSlash(34)],
  pouring: [jamWxUp(JAM_WX_CLOUD, -8), jamWxSlash(9), jamWxSlash(17), jamWxSlash(25), jamWxSlash(33), jamWxSlash(41)],
  lightning: [jamWxUp(JAM_WX_CLOUD, -8), ["polygon", {points: "26,24 17,37 23,37 18,47 32,32 26,32 30,24"}, "b"]],
  "lightning-rainy": [jamWxUp(JAM_WX_CLOUD, -8), ["polygon", {points: "26,24 17,37 23,37 18,47 32,32 26,32 30,24"}, "b"], jamWxSlash(12), jamWxSlash(40)],
  snowy: [jamWxUp(JAM_WX_CLOUD, -8), jamWxSquare(11, 34), jamWxSquare(22, 40), jamWxSquare(33, 34)],
  "snowy-rainy": [jamWxUp(JAM_WX_CLOUD, -8), jamWxSquare(10, 35), jamWxSlash(22), jamWxSquare(29, 40), jamWxSlash(42)],
  hail: [jamWxUp(JAM_WX_CLOUD, -8), ["polygon", {points: "13,33 17,37 13,41 9,37"}, "p"], ["polygon", {points: "24,38 28,42 24,46 20,42"}, "p"], ["polygon", {points: "35,33 39,37 35,41 31,37"}, "p"]],
  fog: [["rect", {x: 6, y: 11, width: 34, height: 5}, "p"], ["rect", {x: 11, y: 19, width: 32, height: 5}, "p"], ["rect", {x: 4, y: 27, width: 36, height: 5}, "p"], ["rect", {x: 12, y: 35, width: 26, height: 5}, "p"]],
  windy: [jamWxStrip(8, 12, 30), jamWxStrip(14, 22, 30), jamWxStrip(6, 32, 24)],
  "windy-variant": [jamWxUp(JAM_WX_CLOUD, -10), jamWxStrip(12, 32, 30), jamWxStrip(6, 40, 22)],
  exceptional: [["polygon", {points: "24,4 45,43 3,43"}, "b"], ["rect", {x: 22, y: 17, width: 4, height: 14}, "g"], ["rect", {x: 22, y: 35, width: 4, height: 4}, "g"]],
};
/* Night variants (state clear-night is its own glyph): sun -> moon. */
const JAM_WX_NIGHT = {sunny: JAM_WX_MOON, partlycloudy: [jamWxSmall(JAM_WX_MOON), JAM_WX_CLOUD]};
function jamWxGlyph(cond, night) {
  const shapes = (night && JAM_WX_NIGHT[cond]) || JAM_WX_GLYPHS[cond] || [["rect", {x: 12, y: 12, width: 24, height: 24}, "u"]];
  const svg = document.createElementNS(JAM_WX_NS, "svg");
  svg.setAttribute("viewBox", "0 0 48 48"); svg.setAttribute("class", "gl"); svg.setAttribute("aria-hidden", "true");
  const add = (parent, [tag, attrs, cls, kids]) => {
    const e = document.createElementNS(JAM_WX_NS, tag);
    for (const k in attrs) e.setAttribute(k, attrs[k]);
    if (cls) e.setAttribute("class", "g-" + cls);
    for (const k of kids || []) add(e, k);
    parent.append(e);
  };
  for (const s of shapes) add(svg, s);
  return svg;
}
class JamWeather extends JamBase {
  constructor() { super(); this._fc = null; this._subKey = null; this._unsubP = null; }
  validate(c) {
    this._err = null;
    if (typeof c.entity !== "string" || !c.entity.startsWith("weather.")) this._err = "entity: a weather.* entity is required";
    else if (c.forecast_type !== undefined && !JAM_WX_TYPES.includes(c.forecast_type)) this._err = "forecast_type: daily, hourly or twice_daily";
  }
  setConfig(c) {
    super.setConfig(c);
    if (this.isConnected) { this._sub(); this._arm(); }
  }
  set hass(h) {
    const first = !this._hass, before = this._sig, tf = JSON.stringify(jamWxTime(h));
    super.hass = h;
    if (!first && tf !== this._tf && this._sig === before) this._render(false); /* time format changed */
    this._tf = tf;
    this._sub();
  }
  get hass() { return super.hass; }
  watched() { const c = this._config; return this._err ? [] : [c.entity, c.temperature_entity, "sun.sun"].filter(Boolean); }
  _type() { return this._config.forecast_type || "daily"; }
  _days() { return Math.max(1, Math.min(12, Math.round(+this._config.days) || 5)); }
  connectedCallback() { this._sub(); this._arm(); }
  disconnectedCallback() { this._unsub(); clearTimeout(this._tick); this._tick = null; }
  /* One live forecast subscription per (entity, forecast_type); none when show_forecast is false. */
  _sub() {
    const c = this._config, h = this._hass;
    const want = this.isConnected && h && c && !this._err && c.show_forecast !== false ? `${c.entity}|${this._type()}` : null;
    if (want === this._subKey) return;
    this._unsub();
    this._subKey = want;
    if (!want) return;
    this._fc = null;
    const legacy = () => { const s = stateObj(this._hass, c.entity); return s && Array.isArray(s.attributes.forecast) ? s.attributes.forecast : []; };
    try {
      if (!h.connection || typeof h.connection.subscribeMessage !== "function") throw new Error("no connection");
      const p = h.connection.subscribeMessage(ev => {
        if (this._subKey !== want) return;
        this._fc = ev && Array.isArray(ev.forecast) ? ev.forecast : [];
        this._render(false);
      }, {type: "weather/subscribe_forecast", entity_id: c.entity, forecast_type: this._type()});
      this._unsubP = Promise.resolve(p);
      this._unsubP.catch(() => { if (this._subKey === want) { this._fc = legacy(); this._render(false); } });
    } catch (e) { this._fc = legacy(); }
  }
  _unsub() {
    const p = this._unsubP;
    this._unsubP = null; this._subKey = null;
    if (p) p.then(u => { if (typeof u === "function") return u(); }).catch(() => {});
  }
  /* Clock: re-set the time text at each minute boundary (no full re-render). */
  _arm() {
    clearTimeout(this._tick); this._tick = null;
    if (!this._config || this._err || !this._config.clock || !this.isConnected) return;
    const run = () => { this._clock(); this._tick = setTimeout(run, 60e3 - (Date.now() % 60e3) + 50); };
    this._tick = setTimeout(run, 60e3 - (Date.now() % 60e3) + 50);
  }
  _lang() { const h = this._hass; return (h && h.locale && h.locale.language) || (h && h.language) || undefined; }
  _clock() {
    if (!this._time) return;
    const d = new Date();
    const f = jamWxTime(this._hass), mm = String(d.getMinutes()).padStart(2, "0");
    if (f.h12) { /* 12 h: "6:54" in Londrina + a small day period ("PM") in Jost */
      let per = d.getHours() < 12 ? "AM" : "PM";
      try { const p = new Intl.DateTimeFormat(f.loc, {hour: "numeric", hour12: true}).formatToParts(d).find(x => x.type === "dayPeriod"); if (p) per = p.value; } catch (e) { /* keep AM/PM */ }
      this._time.textContent = `${d.getHours() % 12 || 12}:${mm}`;
      this._time.append(el("small", "per", per));
    } else this._time.textContent = `${String(d.getHours()).padStart(2, "0")}:${mm}`;
    this._date.textContent = d.toLocaleDateString(this._lang(), {weekday: "long", day: "numeric", month: "long"});
  }
  css() { return `
    .w{display:grid;gap:14px;align-content:start}
    .clock{display:grid;gap:6px}
    .time{font-size:4.4rem;line-height:.82;letter-spacing:-.005em}
    .time .per{font:600 1rem/1 var(--body);letter-spacing:.12em;text-transform:uppercase;color:var(--dim);margin-left:6px;vertical-align:top}
    .date{font:600 .82rem/1.2 var(--body);letter-spacing:.14em;text-transform:uppercase;color:var(--fg)}
    .now{display:flex;align-items:center;gap:8px 14px;flex-wrap:wrap}
    .gl{display:block;flex:none;--g-bg:var(--slab)}
    .now .gl{width:68px;height:68px}
    .g-s{fill:var(--g-sun,var(--ochre))} .g-p{fill:var(--g-paper,var(--paper))} .g-r{fill:var(--g-rain,var(--teal))}
    .g-b{fill:var(--g-bolt,var(--red))} .g-g{fill:var(--g-bg)} .g-u{fill:var(--line)}
    .temp{font-size:4rem;line-height:.82;white-space:nowrap}
    .temp small{font:600 1rem/1 var(--body);letter-spacing:.06em;color:var(--dim);margin-left:3px;vertical-align:top;text-transform:none}
    .cond{display:grid;gap:5px;min-width:0;flex:1 1 110px}
    .word{font-size:1.45rem;line-height:.9;overflow-wrap:anywhere}
    .meta{display:flex;flex-wrap:wrap;gap:2px 12px}
    .fc{display:grid;gap:6px}
    .col > .face{--p-t:8px;--p-r:3px;--p-b:8px;--p-l:3px;background:var(--slab2);display:grid;justify-items:center;gap:5px;text-align:center}
    .col .gl{width:30px;height:30px;--g-bg:var(--slab2)}
    .col .label{font-size:.64rem;letter-spacing:.1em;overflow-wrap:anywhere}
    .hi,.lo{font-family:var(--display);font-weight:900;font-size:1.25rem;line-height:1}
    .lo{color:var(--dim)}
    .span{position:relative;width:8px;height:56px}
    .span::before{content:"";position:absolute;left:3px;width:2px;top:0;bottom:0;background:var(--line)}
    .bar{position:absolute;left:0;width:8px;background:var(--acc);min-height:4px}
    .col.today > .face{background:var(--acc);color:var(--acc-fg);--g-sun:var(--acc-fg);--g-paper:var(--acc-fg);--g-rain:var(--acc-fg);--g-bolt:var(--acc-fg);--g-bg:var(--acc)}
    .col.today .label,.col.today .lo{color:var(--acc-fg)}
    .col.today .span::before,.col.today .bar{background:var(--acc-fg)}
    .none{grid-column:1/-1}
    .err{display:grid;gap:6px}`; }
  _temp(v) { return Math.round(v * 10) / 10; }
  render(b) {
    const c = this._config, h = this._hass;
    this._time = this._date = null;
    if (this._err) {
      const {root, face} = this.paper("error", {face: "err stripe s-alert"});
      face.append(el("div", "label", "Jam weather · config error"), el("div", "", this._err));
      b.append(root); return;
    }
    const s = stateObj(h, c.entity), off = !s || UNAVAILABLE.has(s.state), a = (s && s.attributes) || {};
    const {root, face} = this.paper(c.entity, {cls: "press", face: "w"});
    root.tabIndex = 0; root.setAttribute("role", "button");
    root.setAttribute("aria-label", friendly(h, c.entity));
    bindActions(root, () => this._hass, c, c.entity);
    if (c.clock) {
      const ck = el("div", "clock");
      this._time = el("div", "time disp num"); this._date = el("div", "date");
      ck.append(this._time, this._date); face.append(ck);
      this._clock();
    }
    /* Current: temperature_entity (numeric) wins over the weather entity's temperature. */
    let temp = Number(a.temperature), unit = a.temperature_unit || (h.config && h.config.unit_system && h.config.unit_system.temperature) || "";
    const ts = c.temperature_entity ? stateObj(h, c.temperature_entity) : null;
    if (ts && ts.state !== "" && isFinite(Number(ts.state))) { temp = Number(ts.state); unit = ts.attributes.unit_of_measurement || unit; }
    const sun = stateObj(h, "sun.sun"), night = s && s.state !== "clear-night" && sun && sun.state === "below_horizon";
    if (c.show_current !== false) {
      const now = el("div", "now");
      now.append(jamWxGlyph(off ? null : s.state, night));
      const t = el("div", "temp disp num", off && !ts ? "—" : isFinite(temp) ? this._temp(temp).toLocaleString(this._lang()) : "—");
      if (isFinite(temp) && unit) t.append(el("small", "", unit));
      const cond = el("div", "cond");
      cond.append(el("div", "word disp", off ? "No data" : JAM_WX_WORDS[s.state] || s.state.replace(/[-_]/g, " ")));
      const meta = el("div", "meta label num");
      if (!off && isFinite(Number(a.humidity)) && a.humidity !== null) meta.append(el("span", "", `Humidity ${Math.round(a.humidity)}%`));
      if (!off && isFinite(Number(a.wind_speed)) && a.wind_speed !== null) meta.append(el("span", "", `Wind ${Math.round(a.wind_speed)}${a.wind_speed_unit ? " " + a.wind_speed_unit : ""}`));
      if (meta.childNodes.length) cond.append(meta);
      now.append(t, cond);
      face.append(now);
    }
    if (c.show_forecast !== false) face.append(this._strip());
    b.append(root);
  }
  /* Forecast strip: N columns (chip cut); one shared low->high scale for every day's bar. */
  _strip() {
    const c = this._config, type = this._type(), fc = (this._fc || []).slice(0, this._days());
    const box = el("div", "fc");
    box.style.gridTemplateColumns = `repeat(${Math.max(1, fc.length || this._days())},minmax(0,1fr))`;
    if (!this._fc) { box.append(el("div", "label none", "Forecast…")); return box; }
    if (!fc.length) { box.append(el("div", "label none", "No forecast")); return box; }
    const num = v => v !== null && v !== undefined && v !== "" && isFinite(Number(v));
    let lo = Infinity, hi = -Infinity;
    for (const f of fc) for (const v of [f.temperature, f.templow]) if (num(v)) { lo = Math.min(lo, +v); hi = Math.max(hi, +v); }
    const rng = hi > lo ? hi - lo : 1, today = new Date().toDateString();
    fc.forEach((f, i) => {
      const d = new Date(f.datetime), valid = !isNaN(d);
      const isToday = valid && (type === "daily" ? d.toDateString() === today : i === 0);
      const {root, face} = paper("div", `jam-weather|${c.entity}|${type}|${i}`, {kind: "chip", cls: "col" + (isToday ? " today" : "")});
      let name = "";
      const tf = jamWxTime(this._hass);
      if (valid) name = type === "hourly" ? d.toLocaleTimeString(tf.loc, tf.h12 ? {hour: "numeric", hour12: true} : {hour: "2-digit", minute: "2-digit", hour12: false})
        : type === "twice_daily" && f.is_daytime === false ? "Night" : d.toLocaleDateString(this._lang(), {weekday: "short"});
      face.append(el("div", "label", name));
      face.append(jamWxGlyph(f.condition, f.is_daytime === false));
      const high = num(f.temperature) ? +f.temperature : null, low = num(f.templow) ? +f.templow : null;
      face.append(el("div", "hi num", high === null ? "—" : Math.round(high) + "°"));
      const span = el("div", "span"), bar = el("div", "bar");
      span.setAttribute("aria-hidden", "true");
      const top = high === null ? low : high, bot = low === null ? high : low;
      if (top !== null) { bar.style.top = ((hi - top) / rng * 100).toFixed(1) + "%"; bar.style.bottom = ((bot - lo) / rng * 100).toFixed(1) + "%"; span.append(bar); }
      face.append(span);
      if (low !== null) face.append(el("div", "lo num", Math.round(low) + "°"));
      box.append(root);
    });
    return box;
  }
  getCardSize() { const c = this._config || {}; return Math.max(1, (c.clock ? 3 : 0) + (c.show_current === false ? 0 : 2) + (c.show_forecast === false ? 0 : 3)); }
  getGridOptions() { return {columns: 12, rows: "auto", min_columns: 6}; }
}
register("jam-weather", JamWeather, "Jam Weather", "Big temperature, condition word and cut-paper glyph, forecast strip, optional clock.");

console.info(`%c JAM CARDS %c ${VERSION} `, "background:#e0553b;color:#141210;font-weight:900", "background:#141210;color:#e5a31b");
})();
