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
