/* Fonts are bundled (FONT_CSS, generated from fonts/*.woff2 by tools/bundle.mjs). @font-face only works at document
   level, not inside shadow roots, so the rules go into document.head once. */
function loadFonts() {
  if (document.head.querySelector("style[data-jam-fonts]")) return;
  const s = document.createElement("style");
  s.dataset.jamFonts = "1"; s.textContent = FONT_CSS;
  document.head.append(s);
}

/* Shared tokens + primitives. Every card gets this in its shadow root. */
const BASE_CSS = `
:host{
  --ink:var(--jam-ink,#141210); --slab:var(--jam-slab,#1f1c19); --slab2:var(--jam-slab2,#2a2622); --slab3:var(--jam-slab3,#35302a);
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
.unit{text-transform:none}
.label{font:600 .72rem/1.25 var(--body);letter-spacing:.16em;text-transform:uppercase;color:var(--dim)}
.disp{font-family:var(--display);font-weight:900;text-transform:uppercase;line-height:.92;letter-spacing:.01em;margin:0;text-wrap:balance}
/* Chips/pills: flat slab2 block, bottom-right 6px cut, text in the tone colour. */
.chip{font:600 .66rem/1 var(--body);letter-spacing:.14em;text-transform:uppercase;padding:6px 10px 6px 8px;border:0;flex:none;background:var(--slab2);color:inherit;
  clip-path:polygon(0 0,100% 0,100% calc(100% - 6px),calc(100% - 6px) 100%,0 100%)}
button{font:inherit;color:inherit;background:none;border:0;padding:0;cursor:pointer;-webkit-tap-highlight-color:transparent}
button:focus-visible,.focusable:focus-visible,[role=button]:focus-visible{outline:3px solid var(--ochre);outline-offset:2px}
/* A clip-path clips the element's own outline too: self-clipped chips draw the ring inside (text colour on filled chips). */
.chip:focus-visible{outline-offset:-3px}
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
/* Press = print (0.3.5): the face presses down in 2 steps (scale .96 + 3px offset) and snaps back on release. With motion
   off (JamCards.motion = false) --jam-motion is 0, so the print is a hard cut to the pressed state. */
.press:active > .face,.pressing > .face{transform:translate(2px,2px);animation:jam-print calc(60ms * var(--jam-motion,1)) steps(2,end) forwards}
.press:has(.press:active) > .face{transform:none;animation:none}
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
/* Motion (DESIGN "Motion", 0.3.5): one-shot only, transform / clip-path, steps() = cut paper, <= 300 ms. Classes are set by
   JS once (view entrance, sheet stagger, light wash, stamp) and never on a plain hass update. */
.host.jam-enter{animation:jam-enter 200ms steps(4,end) backwards}
.jam-in{animation:jam-enter 160ms steps(4,end) backwards}
.jam-wash{position:absolute;inset:0;pointer-events:none;clip-path:inset(0 0 0 100%)}
.jam-wash.in{animation:jam-uncover 210ms steps(3,end)}
.jam-wash.out{animation:jam-retreat 120ms steps(2,end)}
.jam-stamp{animation:jam-stamp 210ms steps(3,end)}
.jam-stamp > .face::before,.jam-stamp:not(.paper)::before{content:"";position:absolute;inset:0;z-index:-1;pointer-events:none;
  background:var(--jam-stamp-from,var(--slab2));clip-path:inset(0 0 0 100%);animation:jam-uncover 210ms steps(3,end)}
@keyframes jam-enter{from{transform:translateX(-24px);clip-path:inset(0 100% 0 0)}to{transform:none;clip-path:inset(0)}}
@keyframes jam-print{to{transform:translate(3px,3px) scale(.96)}}
@keyframes jam-uncover{from{clip-path:inset(0)}to{clip-path:inset(0 0 0 100%)}}
@keyframes jam-retreat{from{clip-path:inset(0)}to{clip-path:inset(0 100% 0 0)}}
@keyframes jam-stamp{from{transform:scale(1.08)}to{transform:none}}
@media (prefers-reduced-motion:reduce){*,*::before,*::after{animation:none!important;transition:none!important}
  .press:active > .face,.pressing > .face{transform:none}}
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
  return fallback || (s && s.attributes && s.attributes.friendly_name) || id || "";
}
/* Display a state the way HA would (translated + unit) when the frontend helper exists. */
function fmtState(hass, s) {
  if (!s) return "—";
  try { if (hass && typeof hass.formatEntityState === "function") return hass.formatEntityState(s); } catch (e) { /* fall through */ }
  const u = s.attributes && s.attributes.unit_of_measurement;
  return u ? `${s.state} ${u}` : String(s.state);
}
/* Units keep their own case inside uppercase display type ("µg/m³" must not become "MG/M³"): wrap a trailing unit
   (the entity's unit_of_measurement, or a given string) of a text-only node in <span class="unit"> (text-transform:none). */
function keepUnit(node, s) {
  const u = typeof s === "string" ? s : s && s.attributes && s.attributes.unit_of_measurement;
  if (!node || !u || node.children.length) return node;
  const t = node.textContent, i = t.lastIndexOf(u);
  if (i < 0 || t.slice(i + u.length).trim() !== "") return node;
  node.textContent = t.slice(0, i);
  node.append(el("span", "unit", u));
  return node;
}
/* Tone of an entity: on (ochre) / alert (red) / calm (teal) / off (line). */
function tone(s, overrides) {
  if (!s) return "alert";
  const st = String(s.state).toLowerCase();
  if (overrides && overrides[st]) return overrides[st];
  if (ALERT_STATES.has(st)) return "alert";
  if (s.attributes && s.attributes.device_class === "problem" && st === "on") return "alert";
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
/* A non-button node that acts as a button (titles, temperatures, air lines): role=button, tabIndex 0, .focusable ring,
   click and Enter/Space run fn. */
function asButton(node, fn) {
  node.classList.add("focusable"); node.tabIndex = 0; node.setAttribute("role", "button");
  node.addEventListener("click", fn);
  node.addEventListener("keydown", e => {
    if (e.target !== node || (e.key !== "Enter" && e.key !== " ")) return;
    e.preventDefault(); fn(e);
  });
  return node;
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
const CUTS = Object.freeze({card: ["br", 14], key: ["tr", 12], chip: ["br", 6], hero: ["br", 22], sheet: ["tr", 18], poster: ["br", 16]});
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
/* Cut block: <tag class="paper cls" data-cut=kind> > <.face faceCls>. kind: card (default) | key | chip | hero | sheet | poster
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

/* ---------- light colour helpers ---------- */
/* Approximate rgb of a colour temperature (Tanner Helland's black-body fit), e.g. 2200 K -> [255,146,39]. */
function kelvinToRgb(k) {
  const t = Math.max(1000, Math.min(40000, Number(k) || 2700)) / 100;
  let r, g, b;
  if (t <= 66) { r = 255; g = 99.4708025861 * Math.log(t) - 161.1195681661; b = t <= 19 ? 0 : 138.5177312231 * Math.log(t - 10) - 305.0447927307; }
  else { r = 329.698727446 * Math.pow(t - 60, -0.1332047592); g = 288.1221695283 * Math.pow(t - 60, -0.0755148492); b = 255; }
  return [r, g, b].map(v => Math.round(Math.max(0, Math.min(255, v))));
}
/* WCAG relative luminance of [r,g,b] (0..1). */
function luminance(c) {
  const l = c.map(v => { v = Math.max(0, Math.min(255, Number(v) || 0)) / 255; return v <= .04045 ? v / 12.92 : ((v + .055) / 1.055) ** 2.4; });
  return .2126 * l[0] + .7152 * l[1] + .0722 * l[2];
}
/* Text on a flat [r,g,b] fill: ink on light colours (luminance > .18), paper on dark ones. */
function inkOn(c) { return luminance(c) > .18 ? "#141210" : "#ece2c9"; }
/* A light's actual output colour as [r,g,b], or null: kelvin -> rgb in color_temp mode, else rgb_color. */
function lightRgb(s) {
  const a = (s && s.attributes) || {};
  if (a.color_mode === "color_temp" && a.color_temp_kelvin) return kelvinToRgb(a.color_temp_kelvin);
  if (Array.isArray(a.rgb_color) && a.rgb_color.length >= 3) return a.rgb_color.slice(0, 3).map(Number);
  if (a.color_temp_kelvin) return kelvinToRgb(a.color_temp_kelvin);
  return null;
}
/* A colour's hue at full value: [r,g,b] scaled so the largest channel is 255 (WLED reports brightness-scaled rgb_color,
   e.g. [51,20,0] -> [255,100,0]). null for a missing or black colour. */
function fullRgb(c) {
  if (!Array.isArray(c) || c.length < 3) return null;
  const v = c.slice(0, 3).map(x => Math.max(0, Number(x) || 0)), m = Math.max(...v);
  return m > 0 ? v.map(x => Math.min(255, Math.round(x * 255 / m))) : null;
}
const rgbCss = c => `rgb(${c.slice(0, 3).map(v => Math.round(Number(v) || 0)).join(",")})`;

/* ---------- weather words ---------- */
/* HA weather condition -> short word (jam-weather, jam-house, jam-screensaver). */
const CONDITION_WORDS = Object.freeze({
  "clear-night": "Clear night", cloudy: "Cloudy", exceptional: "Alert", fog: "Fog", hail: "Hail", lightning: "Lightning",
  "lightning-rainy": "Storm", partlycloudy: "Partly cloudy", pouring: "Pouring", rainy: "Rain", snowy: "Snow",
  "snowy-rainy": "Sleet", sunny: "Sunny", windy: "Windy", "windy-variant": "Windy",
});
/* Word for a condition state; unknown states with - / _ turned into spaces. */
function conditionWord(st) { const k = String(st == null ? "" : st); return CONDITION_WORDS[k] || k.replace(/[-_]/g, " "); }

/* ---------- motion (DESIGN "Motion", 0.3.5) ---------- */
/* Page-wide switch: JamCards.motion = false (jam-screensaver `motion: false`) turns the one-shot motion off; the OS
   setting prefers-reduced-motion always does (CSS + motionOn()). */
let JAM_MOTION = true;
function motionOn() {
  if (!JAM_MOTION) return false;
  try { return !(window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches); } catch (e) { return true; }
}
function setMotion(v) {
  JAM_MOTION = v !== false;
  const st = document.documentElement.style;
  if (JAM_MOTION) st.removeProperty("--jam-motion"); else st.setProperty("--jam-motion", "0");
}
/* Ancestors from the document down to n, across shadow roots (parentNode, else the shadow root's host). */
function composedChain(n) { const out = []; for (let x = n; x; x = x.parentNode || x.host) out.unshift(x); return out; }
/* Document (composed tree) order of two nodes: < 0 when a comes first. A shadow root sorts before its host's light children. */
function treeOrder(a, b) {
  const A = composedChain(a), B = composedChain(b);
  let i = 0;
  while (i < A.length && i < B.length && A[i] === B[i]) i++;
  if (i === A.length || i === B.length) return A.length - B.length;
  const x = A[i], y = B[i];
  if (x.nodeType === 11) return -1;
  if (y.nodeType === 11) return 1;
  return x.compareDocumentPosition(y) & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1;
}
const ENTER_STEP = 40, ENTER_MAX = 12;
const ENTER = {queue: [], pending: false, next: 0, until: 0};
/* Cards inside a pop-up or sheet get the sheet's stagger instead of the view entrance. */
function inOverlay(n) {
  return composedChain(n).some(x => x.localName === "jam-popup" || x.localName === "jam-screensaver" || (x.classList && x.classList.contains("jam-sheet-host")));
}
/* View entrance: a card asks once (first connect); cards connected in the same task are sorted by document order and
   get index-based delays (40 ms each, capped at 12). Cards connected within 400 ms of a batch continue its count. */
function enterView(card) {
  if (card._jamEntered) return;
  card._jamEntered = true;
  ENTER.queue.push(card);
  if (ENTER.pending) return;
  ENTER.pending = true;
  Promise.resolve().then(() => {
    ENTER.pending = false;
    const q = ENTER.queue.splice(0).filter(c => c.isConnected && !inOverlay(c));
    if (!q.length || !motionOn()) return;
    const now = Date.now();
    if (now > ENTER.until) ENTER.next = 0;
    q.sort(treeOrder);
    for (const c of q) if (typeof c._enter === "function") c._enter(Math.min(ENTER.next++, ENTER_MAX) * ENTER_STEP);
    ENTER.until = now + 400;
  });
}
/* Plays a one-shot motion class on node (with an optional delay) and removes it when it ends, so a later re-attach or
   display change does not replay it. Restarts it when the class is still there (jam-popup re-opening). */
function oneShot(node, cls, delayMs) {
  if (!node) return;
  if (node.classList.contains(cls)) { node.classList.remove(cls); void node.offsetWidth; }
  node.style.animationDelay = delayMs ? delayMs + "ms" : "";
  node.classList.add(cls);
  const done = e => {
    if (e.target !== node) return;
    node.removeEventListener("animationend", done); node.removeEventListener("animationcancel", done);
    node.classList.remove(cls); node.style.animationDelay = "";
  };
  node.addEventListener("animationend", done); node.addEventListener("animationcancel", done);
}
/* Sheet children slide in one after another (index-based delays, set once). */
function staggerIn(nodes, startMs = 60) {
  if (!motionOn()) return;
  [...nodes].forEach((n, i) => { if (n.nodeType === 1) oneShot(n, "jam-in", startMs + Math.min(i, ENTER_MAX) * ENTER_STEP); });
}

/* ---------- sheet (pop-up) helpers ---------- */
/* Vertigo spiral (Archimedean, 5 turns) as an aria-hidden SVG stroked in currentColor. */
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
/* The deepest focused element across shadow roots (to restore focus on close). */
function deepActive() {
  let a = document.activeElement;
  while (a && a.shadowRoot && a.shadowRoot.activeElement) a = a.shadowRoot.activeElement;
  return a;
}
/* Theme tokens copied from the opening card onto a sheet (HA may set a theme on the view, not on <html>). */
const SHEET_TOKENS = ["ink", "slab", "slab2", "slab3", "paper", "paper-fg", "paper-dim", "fg", "dim", "line", "ochre", "red", "teal", "blue", "pink",
  "violet", "green", "on-fg", "shadow", "s1", "s2", "s3", "s4", "s5", "display", "body", "accent"].map(n => "--jam-" + n);
const SHEET_CSS = `
  .pop{position:fixed;inset:0;z-index:10000;--acc:var(--jam-accent,var(--ochre));--acc-fg:var(--on-fg)}
  .veil{position:absolute;inset:0;background:var(--ink)}
  .spiral{position:absolute;left:50%;top:50%;width:min(92vmin,720px);height:min(92vmin,720px);transform:translate(-50%,-50%);
    visibility:hidden;pointer-events:none;color:var(--acc)}
  .stage{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;padding:16px;pointer-events:none}
  .sheet{pointer-events:auto;width:100%;max-width:560px;height:auto}
  .sheet > .face{--p-t:14px;--p-r:16px;--p-b:18px;--p-l:16px;height:auto;max-height:90vh;display:flex;flex-direction:column;gap:12px;
    background:var(--slab);outline:none}
  .head{flex:none;display:flex;justify-content:space-between;align-items:flex-start;gap:12px}
  .t{display:grid;gap:4px;min-width:0}
  .t h2{font-size:clamp(1.7rem,6vw,2.2rem);overflow-wrap:anywhere}
  .rule{flex:none;height:5px;background:var(--acc)}
  .body{flex:1 1 auto;min-height:0;overflow:auto;overscroll-behavior:contain;display:grid;gap:11px;align-content:start;padding:2px 2px 4px 0;
    --jam-slab:var(--slab2);--jam-slab2:var(--slab3)}
  .close{flex:none}
  .acts{flex:none;display:flex;align-items:stretch;gap:6px}
  .acts > .key{min-width:0;height:auto}
  .pop.opening .wipe{animation:jam-sheet-up 200ms steps(4,end) backwards}
  .pop.opening .spiral{animation:jam-sheet-flash 220ms steps(1,end) both}
  @keyframes jam-sheet-up{from{transform:translateY(30%)}to{transform:none}}
  @keyframes jam-sheet-flash{from{visibility:visible}to{visibility:hidden}}
  @media (max-width:600px){
    .stage{align-items:flex-end;padding:0}
    .sheet{max-width:none}
    .sheet > .face{padding-bottom:calc(var(--p-b) + env(safe-area-inset-bottom,0px))}
  }
  @media (prefers-reduced-motion:reduce){.pop.opening .wipe,.pop.opening .spiral{animation:none!important}}`;
const SHEET_STACK = [];
/* Opens a modal cut sheet (kind "sheet", top-right 18px; a bottom sheet on phones) over a full-screen ink veil, appended to
   document.body in its own shadow root (so a clipped ancestor, e.g. a jam-popup sheet, cannot clip it).
   opts: {from (element whose --jam-* theme tokens are copied), title, kicker, label (dialog name), accent (CSS colour for
   --acc), accentFg, flash (spiral colour; false = no spiral), rule (5px accent rule, default true), css (extra CSS),
   cls (extra class on .pop), history (default true: pushes a same-URL history entry so browser/phone back closes it),
   headerActions ([nodes] put in the header left of CLOSE, stretched to its height; 0.3.4), onClose()}.
   Child cards appended to `body` get the surface tokens one step up (--jam-slab = slab2, --jam-slab2 = slab3), so their
   faces and keys stay visible on the slab sheet face.
   Close: CLOSE key, veil click, Esc (only the top sheet; the event does not reach a jam-popup below), back.
   Returns {root, pop, face, body, close(), isOpen()}; fill `body` (textContent only for entity data). */
function openSheet(opts = {}) {
  const o = opts, holder = el("div", "jam-sheet-host"), sr = holder.attachShadow({mode: "open"});
  if (o.from) {
    try {
      const cs = getComputedStyle(o.from);
      for (const t of SHEET_TOKENS) { const v = cs.getPropertyValue(t).trim(); if (v) holder.style.setProperty(t, v); }
    } catch (e) { /* tokens fall back to the dark palette */ }
  }
  const st = el("style"); st.textContent = BASE_CSS + SHEET_CSS + (o.css || "");
  const pop = el("div", "pop" + (o.cls ? " " + o.cls : ""));
  if (o.accent) { pop.style.setProperty("--acc", o.accent); pop.style.setProperty("--acc-fg", o.accentFg || "var(--on-fg)"); }
  const veil = el("div", "veil"); veil.setAttribute("aria-hidden", "true");
  const spiral = el("div", "spiral"); spiral.append(vertigoSpiral());
  if (o.flash === false) spiral.hidden = true; else if (o.flash) spiral.style.color = o.flash;
  const stage = el("div", "stage");
  const {root: sheet, face} = paper("div", "jam-sheet", {kind: "sheet", cls: "sheet wipe"});
  face.tabIndex = -1; face.setAttribute("role", "dialog"); face.setAttribute("aria-modal", "true");
  const head = el("div", "head"), t = el("div", "t");
  if (o.kicker) t.append(el("div", "label kick", o.kicker));
  if (o.title) { const h2 = el("h2", "disp", o.title); h2.id = "jam-sheet-title"; t.append(h2); } // own shadow root: the id is unique
  if (o.title && !o.label) face.setAttribute("aria-labelledby", "jam-sheet-title");
  else face.setAttribute("aria-label", o.label || o.kicker || "Pop-up");
  const close = cutKey("Close ×", "jam-sheet|close", "close", "chip");
  close.setAttribute("aria-label", "Close");
  const acts = el("div", "acts");
  for (const n of o.headerActions || []) if (n) acts.append(n);
  acts.append(close);
  head.append(t, acts);
  const body = el("div", "body");
  face.append(head);
  if (o.rule !== false) { const r = el("div", "rule"); r.setAttribute("aria-hidden", "true"); face.append(r); }
  face.append(body);
  stage.append(sheet); pop.append(veil, spiral, stage); sr.append(st, pop);

  const id = "jam-sheet-" + Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
  let open = true, pushed = false;
  const prevFocus = deepActive(), de = document.documentElement, bd = document.body;
  const scroll = [de.style.overflow, bd.style.overflow];
  const onKey = e => {
    if (e.key !== "Escape" || SHEET_STACK[SHEET_STACK.length - 1] !== api) return;
    e.preventDefault(); e.stopPropagation(); api.close();
  };
  const onPop = () => { if (!(history.state && history.state.jamSheet === id)) hide(); };
  function hide() {
    if (!open) return;
    open = false;
    window.removeEventListener("keydown", onKey, true); window.removeEventListener("popstate", onPop);
    const i = SHEET_STACK.indexOf(api); if (i >= 0) SHEET_STACK.splice(i, 1);
    holder.remove();
    if (!SHEET_STACK.length) { de.style.overflow = scroll[0]; bd.style.overflow = scroll[1]; }
    if (prevFocus && prevFocus.isConnected && typeof prevFocus.focus === "function") { try { prevFocus.focus({preventScroll: true}); } catch (e) { /* ignore */ } }
    if (typeof o.onClose === "function") o.onClose();
  }
  const api = {
    root: holder, pop, face, body,
    isOpen: () => open,
    /* close({silent}): hide; step back out of our history entry unless silent (e.g. the card was removed). */
    close({silent = false} = {}) {
      if (!open) return;
      const back = pushed && !silent && history.state && history.state.jamSheet === id;
      hide();
      if (back) history.back();
    },
  };
  veil.onclick = () => api.close();
  close.onclick = () => api.close();
  if (o.history !== false) {
    try { history.pushState(Object.assign({}, history.state || {}, {jamSheet: id}), ""); pushed = true; } catch (e) { pushed = false; }
  }
  window.addEventListener("keydown", onKey, true);
  window.addEventListener("popstate", onPop);
  SHEET_STACK.push(api);
  de.style.overflow = "hidden"; bd.style.overflow = "hidden";
  document.body.append(holder);
  if (motionOn()) pop.classList.add("opening");
  // The caller fills `body` right after this returns; its children then slide in one after another (once).
  Promise.resolve().then(() => { if (open) staggerIn(body.children); });
  try { face.focus({preventScroll: true}); } catch (e) { face.focus(); }
  return api;
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
  /* HA sets hass on every state change in the house (hundreds a minute). A card re-renders only when one of its own
     watched() entities changed: HA replaces a state object when it changes, so the objects are compared by reference
     (_sig = [id, state object, ...]; _sig = null forces the next update to render). */
  set hass(h) {
    this._hass = h;
    if (!this._config || !h) return;
    const ids = this.watched(), st = h.states || {}, prev = this._sig;
    let same = Array.isArray(prev) && prev.length === ids.length * 2;
    for (let i = 0; same && i < ids.length; i++) same = prev[2 * i] === ids[i] && prev[2 * i + 1] === st[ids[i]];
    if (same) return;
    const sig = [];
    for (const id of ids) sig.push(id, st[id]);
    this._sig = sig; this._render(false);
  }
  get hass() { return this._hass; }
  /* Subclasses with their own connectedCallback call super.connectedCallback(). */
  connectedCallback() { enterView(this); }
  /* Subclasses that hold timers, observers, window/document listeners or body-appended nodes release them here (and call
     super); HA detaches and re-attaches cards on view switches, so connectedCallback re-arms them. */
  disconnectedCallback() {}
  /* View entrance (once per card): called by enterView with this card's stagger delay. */
  _enter(ms) {
    if (this._body) oneShot(this._body, "jam-enter", ms);
    else this._enterMs = ms;
  }
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
      if (this._enterMs != null) { oneShot(this._body, "jam-enter", this._enterMs); this._enterMs = null; }
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
/* `motion` is an accessor (the object is frozen): JamCards.motion = false turns the one-shot motion off page-wide. */
window.JamCards = Object.freeze(Object.defineProperty({
  VERSION, BASE_CSS, JamBase, ACCENTS, CUTS, accentName, accentVar, accentFg, setAccent, cutPath,
  seed, rng, tornPath, paper, cutKey, armBars, icon, bindActions, runAction, asButton,
  el, stateObj, friendly, fmtState, keepUnit, tone, fire, moreInfo, navigate, toggleable, UNAVAILABLE,
  kelvinToRgb, luminance, inkOn, lightRgb, fullRgb, rgbCss, CONDITION_WORDS, conditionWord, vertigoSpiral, deepActive, openSheet,
  motionOn, oneShot, staggerIn, treeOrder,
}, "motion", {get: () => JAM_MOTION, set: setMotion, enumerable: true}));
window.customCards = window.customCards || [];
/* Every card file ends with register(tag, Class, name, description). */
function register(tag, cls, name, description) {
  if (!customElements.get(tag)) customElements.define(tag, cls);
  if (!window.customCards.some(c => c.type === tag)) window.customCards.push({type: tag, name, description, preview: false});
}
