/* ---------- jam-light (v3, round 3): light card in the light's own colour + light pop-up ----------
   {type: custom:jam-light, entity (light.*), name?, icon?, accent? (fill when the light reports no colour),
    kicker? (pop-up kicker; default the entity's area), whites?: [{name, kelvin}, {name, kelvin}] (default Cozy 2200 /
    Clean 4000, clamped to the light's range; the per-user whites saved in the pop-up's Edit mode win), preset_entity?
    (select.*, e.g. WLED presets: replaces the whites with preview cards), timer_script? (default script.jam_light_off_in;
    the off-timer row hides when it does not exist), presets?: [{name, color_temp_kelvin | rgb_color, brightness_pct?}]
    (extra chips in the pop-up), show_brightness?, show_color_temp? (the whites), show_color? (hue strip + your colours),
    show_members? (default true), member_bands?: "full" (default) | "corner" (group cards), tap_action? (default: open the
    pop-up), hold_action? (default: open the pop-up)}
   Card (ROUND3 "Lights", 96px tall, grid rows auto): when on the face is the light's hue at full value (rgb_color scaled so
   the max channel is 255; kelvin -> rgb in color_temp mode; else the accent, resolved to rgb); text ink or paper, whichever
   contrasts more (textOn); when neither reaches 4.5:1 the name and the number sit on ink label plates. Name 24px display,
   sub line 10px, big % 26px. 10px brightness strip along the bottom: track = deep shade of the face, fill = mid shade
   (shade() in core). Power corner (core powerCorner, 46px top-right triangle) in the mid shade of the face (off: slab2).
   Group (attributes.entity_id): face = average of the members that are ON; sub "Group · N bulbs" (all on) or "K of N on";
   vertical member bands, one per member, off members slab2, separated by ink gaps (3px on the block's left edge, 2px
   between bands): member_bands "full" = full height of the right edge
   (16px per bulb, min 46px, max 40 % of the card) with the power corner in ink on top; "corner" = a 46px block under
   the power corner. Bands show while the group is on.
   Gestures (ROUND3 "Interaction rule"): tap = tap_action (default: the pop-up); corner = power (light.turn_on / turn_off);
   horizontal drag > 7px = dim (live preview, light.turn_on brightness_pct on release); vertical scroll passes through
   (touch-action: pan-y); hold 500 ms = hold_action (default: the pop-up). Keys: Enter/Space = tap (pop-up), P or
   Shift+Enter = power, ←/→ = ±10 %.
   Pop-up (openSheet in core): 72px brightness bar, whites or preset cards, hue strip (12 bands, hs_color [hue, 90]),
   "Your colours" (per HA user: frontend/get_user_data + set_user_data key jam_colors, max 12; in memory if that fails),
   group members (attributes.entity_id), off-timer 15/30/60 min (script.turn_on with variables {entity_id, minutes}).
   Edit key in the pop-up header (when it shows whites or your colours): each white gets a pencil (tap = edit: name field +
   kelvin slider within the light's range, saved per HA user via set_user_data key jam_whites = {entity_id: [{name,
   kelvin}, {name, kelvin}]}); each saved colour gets an × (tap = remove from jam_colors); the + is hidden; Done leaves.
   Motion (0.3.5): pressing prints the card (core .pressing); a real on/off change wipes the colour in (3 steps) or out (2).
   Changed in round 3: tap opens the pop-up (was toggle), the ⋯ corner became the power corner, M no longer opens the
   pop-up (Enter does), the card is 96px (was 84). Changed in v2 (0.3.0): the ON key, the strip row, the colour-temp chips
   and the fixed swatches left the card; show_color_temp = the two whites, show_color = hue strip + your colours. */
const COLOR_MODES = ["hs", "xy", "rgb", "rgbw", "rgbww"];
const LIGHT_WHITES = [{name: "Cozy", kelvin: 2200}, {name: "Clean", kelvin: 4000}];
const LIGHT_TIMERS = [[15, "15 min"], [30, "30 min"], [60, "1 h"]];
const LIGHT_TIMER_SCRIPT = "script.jam_light_off_in";
const LIGHT_INK = [20, 18, 16];
/* Preset preview looks keyed by (lower-case) name: two stripe colours, or "rainbow". Others get a look from the name hash. */
const LIGHT_LOOKS = {
  "bright vibes": [[255, 90, 200], [90, 160, 255]], "halloween": [[255, 110, 0], [120, 40, 200]],
  "movie time": [[60, 20, 120], [20, 10, 40]], "rainbow": "rainbow", "spring": [[120, 220, 120], [255, 180, 220]],
  "standard": [[255, 190, 120], [255, 190, 120]], "vibes": [[140, 60, 255], [255, 60, 140]], "vibes (warm)": [[255, 120, 40], [200, 40, 90]],
  "normal": [[255, 190, 120], [255, 190, 120]],
};
/* Per-user saved colours and whites (shared by every jam-light on the page): null = not loaded yet.
   LIGHT_WHITES_SAVED = {entity_id: [{name, kelvin}, {name, kelvin}]} (user data key jam_whites). */
let LIGHT_COLORS = null, LIGHT_COLORS_LOAD = null, LIGHT_WHITES_SAVED = null;
const LIGHT_PLATE = "#141210", LIGHT_PLATE_FG = "#ece2c9";
/* Local helpers. */
const rgbDist = (a, b) => (a && b ? Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]) : Infinity);
const clampN = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
function lightModes(s) { return (s && s.attributes.supported_color_modes) || []; }
function lightDims(s) {
  const m = lightModes(s);
  return m.length ? m.some(x => x !== "onoff") : !!(s && s.attributes.brightness != null);
}
function lightPct(s) { return s && s.state === "on" ? clampN(Math.round((s.attributes.brightness || 0) / 2.55), 0, 100) : 0; }
function hslRgb(h, s, l) {
  const a = s * Math.min(l, 1 - l), f = n => { const k = (n + h / 30) % 12; return Math.round(255 * (l - a * Math.max(-1, Math.min(k - 3, 9 - k, 1)))); };
  return [f(0), f(8), f(4)];
}
const mixInk = (c, t) => c.map((v, i) => Math.round(v * (1 - t) + LIGHT_INK[i] * t));
function lightLook(name) {
  const l = LIGHT_LOOKS[String(name).trim().toLowerCase()];
  if (l) return l;
  const h = seed(name) % 360;
  return [hslRgb(h, .8, .56), hslRgb((h + 150) % 360, .7, .42)];
}
/* Flat preview of a preset: diagonal stripes (or rainbow bands) with a darker band under the name. */
function lightPreview(name) {
  const NS = "http://www.w3.org/2000/svg", svg = document.createElementNS(NS, "svg"), look = lightLook(name);
  svg.setAttribute("viewBox", "0 0 160 74"); svg.setAttribute("preserveAspectRatio", "none"); svg.setAttribute("aria-hidden", "true");
  const poly = (pts, c) => { const p = document.createElementNS(NS, "polygon"); p.setAttribute("points", pts); p.setAttribute("fill", rgbCss(c)); svg.append(p); };
  if (look === "rainbow") {
    for (let k = 0; k < 8; k++) {
      const c = hslRgb(k * 45, .8, .55), x = k * 20;
      poly(`${x},0 ${x + 20},0 ${x + 20},44 ${x},44`, c);
      poly(`${x},44 ${x + 20},44 ${x + 20},74 ${x},74`, mixInk(c, .62)); // .62: the green bands keep paper text >= 4.5:1 (0.3.9)
    }
    return svg;
  }
  const [a, b] = look;
  for (let k = 0; k <= 10; k++) {
    const x = k * 22, c = k % 2 ? b : a;
    poly(`${x - 30},74 ${x},0 ${x + 22},0 ${x - 8},74`, c);
    poly(`${(x - 17.84).toFixed(2)},44 ${(x + 4.16).toFixed(2)},44 ${x - 8},74 ${x - 30},74`, mixInk(c, .55));
  }
  return svg;
}
/* Small flat glyphs for the pop-up's Edit mode: "pencil" (edit a white) and "x" (remove a saved colour), currentColor. */
function lightGlyph(kind) {
  const NS = "http://www.w3.org/2000/svg", svg = document.createElementNS(NS, "svg"), p = document.createElementNS(NS, "path");
  svg.setAttribute("viewBox", "0 0 24 24"); svg.setAttribute("aria-hidden", "true"); svg.setAttribute("class", "gl " + kind);
  p.setAttribute("d", kind === "pencil" ? "M4 20v-4L15 5l4 4L8 20zM13 7l4 4" : "M5 5l14 14M19 5L5 19");
  p.setAttribute("fill", "none"); p.setAttribute("stroke", "currentColor"); p.setAttribute("stroke-width", kind === "pencil" ? "2.5" : "3");
  p.setAttribute("stroke-linejoin", "miter"); p.setAttribute("stroke-linecap", "square");
  svg.append(p);
  return svg;
}
const LIGHT_SHEET_CSS = `
  .body{padding:6px}
  .lsheet .t .kick{color:var(--dim)}
  .sec{display:grid;gap:8px}
  .bwrap{position:relative;cursor:ew-resize;touch-action:none}
  .bigbar{position:relative;height:72px;background:var(--slab2);clip-path:${cutPath("br", 14)}}
  .bigbar i{position:absolute;inset:0 auto 0 0;background:var(--lc);clip-path:polygon(0 0,100% 0,calc(100% - 14px) 100%,0 100%)}
  .bigbar b{position:absolute;right:18px;top:50%;transform:translateY(-50%);font:900 2.2rem/1 var(--display);color:var(--fg)}
  .bigbar.hi b{color:var(--lc-fg)}
  .bwrap[aria-disabled=true]{cursor:default}
  .two{display:grid;grid-template-columns:1fr 1fr;gap:6px}
  .wt > .face{--p-t:12px;--p-r:12px;--p-b:14px;--p-l:12px;text-align:left;display:grid;gap:4px}
  .wt b{display:block;font:900 1.2rem/.95 var(--display);text-transform:uppercase}
  .wt small,.wp small{font:600 .6rem/1 var(--body);letter-spacing:.12em}
  .wt.on > .face{outline:3px solid var(--fg);outline-offset:-3px}
  .wp.on > .face::after{content:"";position:absolute;inset:0;border:3px solid var(--fg)}
  .wp > .face{padding:0;height:74px;background:var(--slab2);position:relative;overflow:hidden}
  .wp svg{position:absolute;inset:0;width:100%;height:100%;display:block}
  .wp b{position:absolute;left:8px;right:16px;bottom:8px;font:900 1.05rem/.9 var(--display);text-transform:uppercase;color:#ece2c9;text-align:left;overflow-wrap:anywhere}
  .chips{display:grid;grid-template-columns:repeat(auto-fit,minmax(78px,1fr));gap:6px}
  .chips .key{min-width:0}
  .hwrap{position:relative;cursor:crosshair;touch-action:none}
  .hb{display:flex;height:64px;clip-path:${cutPath("br", 12)}}
  .hb span{flex:1}
  .mk{position:absolute;top:-6px;bottom:-6px;width:10px;margin-left:-5px;background:var(--fg);outline:3px solid var(--ink);pointer-events:none}
  .sws{display:flex;flex-wrap:wrap;gap:6px}
  .sw{width:42px;min-width:0} .sw > .face{height:34px;padding:0}
  .sw.add > .face{background:transparent;outline:2px dashed var(--line);outline-offset:-2px;color:var(--dim);font:900 1.1rem/34px var(--body);text-align:center}
  .sw.add:disabled{cursor:default}
  .mem{display:grid;gap:6px;border-top:2px solid var(--line);padding-top:8px}
  .mrow{display:flex;justify-content:space-between;align-items:center;gap:10px;text-align:left;min-height:32px}
  .mrow .n{font:900 1.05rem/1 var(--display);text-transform:uppercase;overflow-wrap:anywhere;min-width:0}
  .mrow .chip{padding:8px 10px}
  .mtrack{position:relative;height:22px;touch-action:none;cursor:ew-resize}
  .mtrack .mb{position:absolute;left:0;right:0;top:6px;height:10px;background:var(--slab2)}
  .mtrack .mb i{position:absolute;inset:0 auto 0 0}
  .timer{display:flex;justify-content:space-between;align-items:center;gap:8px;flex-wrap:wrap}
  .timer .tc{display:flex;gap:6px}
  .wt.ed > .face{padding-right:36px}
  .wt .gl{position:absolute;right:10px;top:10px;width:20px;height:20px}
  .sw.rm > .face{display:grid;place-items:center}
  .sw .gl{width:16px;height:16px}
  .wedit{display:grid;gap:6px;background:var(--slab2);padding:12px 14px 16px 12px;clip-path:${cutPath("br", 14)}}
  .nin{font:900 1.3rem/1 var(--display);text-transform:uppercase;color:var(--fg);background:var(--slab);border:0;border-bottom:3px solid var(--fg);
    padding:10px 10px 8px;min-height:44px;width:100%;border-radius:0;outline:none}
  .nin:focus-visible{outline:3px solid var(--ochre);outline-offset:2px}
  .kwrap{position:relative;cursor:ew-resize;touch-action:none}
  .kbar{position:relative;height:48px;background:var(--slab)}
  .kbar i{position:absolute;inset:0 auto 0 0;clip-path:polygon(0 0,100% 0,calc(100% - 10px) 100%,0 100%)}
  .kbar b{position:absolute;right:12px;top:50%;transform:translateY(-50%);font:900 1.4rem/1 var(--display);color:var(--fg);padding:3px 6px;background:var(--slab)}
  .bwrap:focus-visible,.hwrap:focus-visible,.mtrack:focus-visible,.kwrap:focus-visible{outline:3px solid var(--ochre);outline-offset:2px}`;

class JamLight extends JamBase {
  validate(c) {
    if (!c.entity || !/^light\./.test(c.entity)) throw new Error("jam-light: entity must be a light");
    if (c.whites != null && !Array.isArray(c.whites)) throw new Error("jam-light: whites must be a list of {name, kelvin}");
    if (c.preset_entity != null && !/^(input_)?select\./.test(c.preset_entity)) throw new Error("jam-light: preset_entity must be a select");
    if (c.member_bands != null && c.member_bands !== "full" && c.member_bands !== "corner") throw new Error('jam-light: member_bands must be "full" or "corner"');
  }
  watched() {
    const c = this._config, s = stateObj(this._hass, c.entity);
    const kids = s && Array.isArray(s.attributes.entity_id) ? s.attributes.entity_id : [];
    return [c.entity, ...kids, c.preset_entity, this._timerScript()].filter(Boolean);
  }
  /* Detached mid-press or mid-drag (view switch): no pointerup will come, so drop the press (hold timer, drag flags);
     otherwise every later render would wait for a drag end. The deferred render runs on re-attach. */
  disconnectedCallback() {
    super.disconnectedCallback();
    if (this._sheet) this._sheet.close({silent: true});
    clearTimeout(this._holdT); this._holdT = null;
    for (const n of this.shadowRoot.querySelectorAll(".pressing")) n.classList.remove("pressing");
    if (this._drag || this._sdrag) { this._drag = this._sdrag = false; this._pending = true; }
  }
  /* A face in the accent token can only be shaded once the card is in the page (resolveRgb): render again on attach. */
  connectedCallback() {
    super.connectedCallback();
    if (this._pending || this._accWait) { this._pending = false; this._render(false); }
  }
  _timerScript() { return this._config.timer_script || LIGHT_TIMER_SCRIPT; }
  _name() { return this._config.name || friendly(this._hass, this._config.entity); }
  _memberIds(s) { const ids = s && s.attributes.entity_id; return Array.isArray(ids) ? ids : []; }
  /* Sub line. card: "K of N on" while only some members are on; the pop-up kicker always says "Group · N bulbs". */
  _sub(s, card) {
    const ids = this._memberIds(s);
    if (ids.length) {
      const k = ids.filter(id => { const m = stateObj(this._hass, id); return m && m.state === "on"; }).length;
      if (card && s.state === "on" && k > 0 && k < ids.length) return `${k} of ${ids.length} on`;
      return `Group · ${ids.length} ${ids.length === 1 ? "bulb" : "bulbs"}`;
    }
    return this._config.preset_entity ? "WLED" : "";
  }
  _area() {
    const h = this._hass, e = h && h.entities && h.entities[this._config.entity];
    let a = e && e.area_id;
    if (!a && e && e.device_id && h.devices && h.devices[e.device_id]) a = h.devices[e.device_id].area_id;
    return a && h.areas && h.areas[a] ? h.areas[a].name : "";
  }
  /* Fill colour [css, text css] for a light state: its hue at full value (fullRgb: WLED's brightness-scaled rgb_color
     [51,20,0] paints [255,100,0]); ink/paper text chosen on that scaled colour. The accent when it is on without a colour. */
  _paint(s) {
    const rgb = fullRgb(lightRgb(s));
    return rgb ? [rgbCss(rgb), inkOn(rgb)] : ["var(--acc)", "var(--acc-fg)"];
  }
  /* Card face [r,g,b] of an ON light, or null when it only has the accent token and that cannot be resolved yet.
     Group: the average of the members that are on (each at full value); members without a colour count as the group's
     own colour. */
  _faceRgb(s) {
    const own = fullRgb(lightRgb(s)), ids = this._memberIds(s);
    if (ids.length) {
      const cols = [];
      for (const id of ids) {
        const m = stateObj(this._hass, id);
        if (m && m.state === "on") { const c = fullRgb(lightRgb(m)) || own; if (c) cols.push(c); }
      }
      if (cols.length) return [0, 1, 2].map(i => Math.round(cols.reduce((t, c) => t + c[i], 0) / cols.length));
    }
    if (own) return own;
    return resolveRgb(this._body, "var(--acc)");
  }
  css() { return POWER_CSS + `
    .lc{height:100%;min-height:96px;-webkit-user-select:none;user-select:none}
    .lc > .face{--p-t:0px;--p-r:0px;--p-b:0px;--p-l:0px;overflow:hidden}
    .lc.on > .face{background:var(--lc);color:var(--lc-fg)}
    .lc.dead > .face{color:var(--dim)}
    .tap{position:relative;height:100%;min-height:96px;padding:12px calc(var(--bw,46px) + 8px) 18px 14px;display:flex;flex-direction:column;
      justify-content:space-between;gap:4px;touch-action:pan-y;cursor:pointer;outline:none;-webkit-tap-highlight-color:transparent}
    .lc.dead .tap{cursor:default}
    .top{display:grid;gap:5px;justify-items:start;min-width:0}
    .nm{display:flex;align-items:center;gap:6px;font:900 24px/1 var(--display);text-transform:uppercase;overflow-wrap:anywhere;margin:0;max-width:100%}
    .nm ha-icon{--mdc-icon-size:20px;flex:none}
    .sub{font:600 10px/1 var(--body);letter-spacing:.14em;text-transform:uppercase;color:var(--dim)}
    .lc.on .sub{color:inherit}
    .pct{font:900 26px/1 var(--display);align-self:flex-start}
    .pct small{font-size:15px;text-transform:uppercase}
    .lc.dead .pct small{color:var(--alert-text)}
    /* Contrast fallback (ROUND3): neither ink nor paper reaches 4.5:1 on the face -> ink label plates. */
    .lc.on.plate .top{margin:-12px 0 0 -14px;padding:10px 18px 10px 14px;background:${LIGHT_PLATE};color:${LIGHT_PLATE_FG};
      clip-path:polygon(0 0,100% 0,calc(100% - 12px) 100%,0 100%)}
    .lc.on.plate .pct{margin-left:-8px;padding:4px 8px;background:${LIGHT_PLATE};color:${LIGHT_PLATE_FG}}
    .bs{position:absolute;left:0;right:0;bottom:0;height:10px;background:var(--lc-deep,rgba(0,0,0,.3));pointer-events:none}
    .bs i{position:absolute;inset:0 auto 0 0;background:var(--lc-mid,currentColor);clip-path:polygon(0 0,100% 0,calc(100% - 9px) 100%,0 100%)}
    .lc:not(.on) .bs{display:none}
    /* Ink gaps (3px on the left edge, 2px between bands) keep a band readable when its colour equals the face. */
    .bands{position:absolute;right:0;top:0;bottom:10px;width:var(--bw);display:flex;gap:2px;padding-left:3px;background:var(--ink);pointer-events:none}
    .bands.corner{top:46px}
    .bands i{flex:1;display:block}
    .lc:not(.on) .bands{display:none}
    .tap:focus-visible{outline:3px solid var(--ochre);outline-offset:-3px}
    @supports selector(:has(a)){
      .tap:focus-visible{outline:none}
      .lc:has(.tap:focus-visible){outline:3px solid var(--ochre);outline-offset:2px}
    }`; }
  _render(force) {
    // A hass update mid-drag would rebuild the card/sheet under the pointer; render once the drag ends instead.
    if ((this._drag || this._sdrag) && !force) { this._pending = true; return; }
    super._render(force);
  }
  _endDrag() {
    this._drag = false; this._sdrag = false;
    if (this._pending) { this._pending = false; this._render(false); }
  }
  _call(domain, service, data) { this._hass.callService(domain, service, data); }
  _setPct(id, v) {
    if (v > 0) this._call("light", "turn_on", {entity_id: id, brightness_pct: v});
    else this._call("light", "turn_off", {entity_id: id});
  }

  /* ---------- card ---------- */
  render(b) {
    const c = this._config, h = this._hass, s = stateObj(h, c.entity);
    const dead = !s || UNAVAILABLE.has(s.state), on = !!s && s.state === "on", pct = lightPct(s), name = this._name();
    const {root, face} = this.paper(c.entity, {cls: "lc " + (dead ? "dead" : on ? "on" : "off")});
    b.append(root); // in the page first, so an accent face can be resolved to rgb
    // Face colour: computed for the off state too, so a drag preview from off shows the light's colour.
    const rgb = dead ? null : this._faceRgb(s);
    this._accWait = !dead && !rgb;
    let fill = "var(--acc)", corner = null;
    if (rgb) {
      const t = textOn(rgb);
      fill = rgbCss(rgb);
      root.style.setProperty("--lc", fill); root.style.setProperty("--lc-fg", t.fg);
      root.style.setProperty("--lc-mid", rgbCss(shade(rgb, 1))); root.style.setProperty("--lc-deep", rgbCss(shade(rgb, 2)));
      if (t.plate) root.classList.add("plate");
      corner = rgb;
    } else { root.style.setProperty("--lc", "var(--acc)"); root.style.setProperty("--lc-fg", "var(--acc-fg)"); }
    // Wash (0.3.5): on a real on/off change (not the first render, not a plain update) the colour wipes in across the
    // card in 3 steps (a slab cover retreats to the right), or wipes out in 2 (the old colour retreats to the left).
    const was = this._prevOn, wasFill = this._prevFill;
    this._prevOn = dead ? null : on; this._prevFill = fill;
    if (was != null && !dead && was !== on && motionOn()) {
      const w = el("div", "jam-wash " + (on ? "in" : "out"));
      w.setAttribute("aria-hidden", "true"); w.style.background = on ? "var(--slab)" : wasFill;
      face.append(w);
    }
    const tap = el("div", "tap"), top = el("div", "top"), nm = el("h3", "nm");
    const ic = icon(c.icon); if (ic) nm.append(ic);
    nm.append(document.createTextNode(name));
    top.append(nm);
    const sub = this._sub(s, true); if (sub) top.append(el("div", "sub", sub));
    const num = el("div", "pct num");
    const bs = el("div", "bs"), bi = el("i"); bs.append(bi); bs.setAttribute("aria-hidden", "true");
    const show = (v, isOn) => {
      num.textContent = "";
      if (dead) num.append(el("small", null, s ? "N/A" : "Missing"));
      else if (isOn) num.append(document.createTextNode(String(v)), el("small", null, "%"));
      else num.append(el("small", null, "Off"));
      bi.style.width = (isOn ? v : 0) + "%";
      tap.setAttribute("aria-label", `${name}: ${dead ? "unavailable" : isOn ? v + "%" : "off"}`);
    };
    show(pct, on);
    tap.append(top, num);
    tap.tabIndex = dead ? -1 : 0; tap.setAttribute("role", "button");
    tap.setAttribute("aria-haspopup", "dialog");
    if (dead) tap.setAttribute("aria-disabled", "true");
    face.append(tap, bs);
    // Group member bands (ROUND3): one vertical band per member, off members slab2.
    const ids = this._memberIds(s), full = (c.member_bands || "full") === "full";
    if (ids.length && !dead) {
      const bands = el("div", "bands " + (full ? "full" : "corner")); bands.setAttribute("aria-hidden", "true");
      for (const id of ids) {
        const m = stateObj(h, id), mo = !!m && m.state === "on", mc = mo ? fullRgb(lightRgb(m)) || rgb : null;
        const bd = el("i"); bd.style.background = mc ? rgbCss(mc) : "var(--slab2)"; bands.append(bd);
      }
      face.append(bands);
      if (on) root.style.setProperty("--bw", full ? `max(46px, min(${16 * ids.length}px, 40%))` : "46px");
    }
    let [pbg, pfg] = cornerColors(on ? corner : null);
    if (on && ids.length && full) { pbg = "var(--ink)"; pfg = LIGHT_PLATE_FG; } // V2: ink corner on top of the bands
    face.append(powerCorner({name, on, disabled: dead, bg: pbg, fg: pfg, onClick: () => this._power()}));
    if (!dead) this._gestures(tap, root, {on, pct, show, dims: lightDims(s)});
    if (this._sheet && this._sheet.isOpen()) this._fillSheet();
  }
  _tap() {
    if (this._config.tap_action) runAction(this, this._hass, this._config.tap_action, this._config.entity);
    else this._openSheet();
  }
  _hold() {
    if (this._config.hold_action) runAction(this, this._hass, this._config.hold_action, this._config.entity);
    else this._openSheet();
  }
  _power() {
    const s = stateObj(this._hass, this._config.entity);
    if (!s || UNAVAILABLE.has(s.state)) return;
    this._call("light", s.state === "on" ? "turn_off" : "turn_on", {entity_id: this._config.entity});
  }
  _gestures(tap, root, st0) {
    const c = this._config;
    let p = null; // current press: {x, y, mode: press|drag|scroll, held, v, timer}
    // A drag preview already shows the colour: the state update that follows must not wash it in again.
    const preview = v => { root.classList.add("on"); root.classList.remove("off"); st0.show(v, true); this._prevOn = true; };
    const revert = () => { root.classList.toggle("on", st0.on); root.classList.toggle("off", !st0.on); st0.show(st0.pct, st0.on); this._prevOn = st0.on; };
    const unpress = () => root.classList.remove("pressing");
    tap.addEventListener("contextmenu", e => e.preventDefault());
    tap.addEventListener("pointerdown", e => {
      if (e.button || (p && p.mode === "drag")) return;
      p = {x: e.clientX, y: e.clientY, mode: "press", held: false, v: null};
      root.classList.add("pressing"); // print (core CSS); dropped when the press turns into a drag or scroll
      try { tap.setPointerCapture(e.pointerId); } catch (err) { /* synthetic pointer */ }
      const me = p;
      clearTimeout(this._holdT);
      p.timer = this._holdT = setTimeout(() => { this._holdT = null; if (p === me && me.mode === "press" && this.isConnected) { me.held = true; this._hold(); } }, 500);
    });
    tap.addEventListener("pointermove", e => {
      if (!p) return;
      const dx = e.clientX - p.x, dy = e.clientY - p.y;
      if (p.mode === "press" && !p.held) {
        if (st0.dims && Math.abs(dx) > 7 && Math.abs(dx) >= Math.abs(dy)) { p.mode = "drag"; clearTimeout(p.timer); this._drag = true; unpress(); }
        else if (Math.abs(dy) > 7 || Math.abs(dx) > 7) { p.mode = "scroll"; clearTimeout(p.timer); unpress(); }
      }
      if (p.mode === "drag") {
        const r = root.getBoundingClientRect();
        p.v = clampN(Math.round(((e.clientX - r.left) / r.width) * 100), 1, 100);
        preview(p.v);
      }
    });
    tap.addEventListener("pointerup", () => {
      unpress();
      if (!p) return;
      const q = p; p = null; clearTimeout(q.timer);
      if (q.mode === "drag") { if (q.v != null) this._setPct(c.entity, q.v); this._endDrag(); }
      else if (q.mode === "press" && !q.held) this._tap();
    });
    tap.addEventListener("pointercancel", () => {
      unpress();
      if (!p) return;
      const q = p; p = null; clearTimeout(q.timer);
      if (q.mode === "drag") { revert(); this._endDrag(); }
    });
    // A click without a pointer press (assistive tech activation, element.click()) = tap.
    tap.addEventListener("click", e => { if (e.detail === 0 && !p) this._tap(); });
    tap.addEventListener("keydown", e => {
      if (e.target !== tap) return;
      if (e.key === "p" || e.key === "P" || (e.key === "Enter" && e.shiftKey)) { e.preventDefault(); if (!e.repeat) this._power(); return; }
      if (e.key === "Enter" || e.key === " ") { e.preventDefault(); if (!e.repeat) this._tap(); return; }
      if ((e.key === "ArrowLeft" || e.key === "ArrowRight") && st0.dims) {
        e.preventDefault();
        const cur = st0.on ? st0.pct : 0, v = clampN(cur + (e.key === "ArrowRight" ? 10 : -10), 1, 100);
        st0.pct = v; st0.on = true; preview(v);
        this._setPct(c.entity, v);
      }
    });
  }

  /* ---------- pop-up ---------- */
  _openSheet() {
    if (this._sheet && this._sheet.isOpen()) return;
    const c = this._config, s = stateObj(this._hass, c.entity);
    if (!s || UNAVAILABLE.has(s.state)) return;
    const [fill] = this._paint(s), acc = this._body ? getComputedStyle(this._body).getPropertyValue("--acc").trim() : "";
    const kicker = [c.kicker || this._area(), this._sub(s)].filter(Boolean).join(" · ") || "Light";
    // Edit key (round 3): only when the pop-up shows something editable (the whites or your colours).
    let edit = null;
    if (this._hasWhites(s) || this._hasColors(s)) {
      edit = cutKey("Edit", "jam-light|edit", "edit", "chip");
      edit.dataset.k = "edit"; edit.setAttribute("aria-pressed", "false");
      edit.onclick = () => { this._edit = !this._edit; this._editW = null; this._wDraft = null; this._fillSheet(); };
    }
    this._edit = false; this._editW = null; this._wDraft = null; this._editKey = edit;
    this._sheet = openSheet({from: this, title: this._name(), kicker, accent: acc || null, flash: fill === "var(--acc)" ? (acc || null) : fill,
      rule: false, cls: "lsheet", css: LIGHT_SHEET_CSS, headerActions: edit ? [edit] : [],
      onClose: () => { this._sheet = null; this._sdrag = false; this._edit = false; this._editW = null; this._wDraft = null; this._editKey = null; }});
    this._fillSheet();
    this._loadColors();
  }
  _hasWhites(s) {
    const c = this._config;
    return !c.preset_entity && !!(c.show_color_temp ?? lightModes(s).includes("color_temp"));
  }
  _hasColors(s) { const c = this._config; return !!(c.show_color ?? lightModes(s).some(m => COLOR_MODES.includes(m))); }
  /* Per-user data (frontend/get_user_data): jam_colors (saved colours) and jam_whites (edited whites), loaded once per page. */
  _loadColors() {
    if (LIGHT_COLORS !== null || LIGHT_COLORS_LOAD) return;
    const h = this._hass;
    if (!h || typeof h.callWS !== "function") { LIGHT_COLORS = []; LIGHT_WHITES_SAVED = LIGHT_WHITES_SAVED || {}; return; }
    const get = key => Promise.resolve().then(() => h.callWS({type: "frontend/get_user_data", key})).then(r => r && r.value, () => null);
    LIGHT_COLORS_LOAD = Promise.all([get("jam_colors"), get("jam_whites")])
      .then(([v, w]) => {
        LIGHT_COLORS = Array.isArray(v) ? v.filter(x => Array.isArray(x) && x.length >= 3).slice(-12) : [];
        // Whites edited before the load finished stay (they were saved over the stored map).
        LIGHT_WHITES_SAVED = Object.assign(w && typeof w === "object" && !Array.isArray(w) ? w : {}, LIGHT_WHITES_SAVED || {});
      })
      .catch(() => { LIGHT_COLORS = LIGHT_COLORS || []; LIGHT_WHITES_SAVED = LIGHT_WHITES_SAVED || {}; })
      .then(() => { LIGHT_COLORS_LOAD = null; if (this._sheet && this._sheet.isOpen()) this._fillSheet(); });
  }
  _storeUser(key, value) {
    const h = this._hass;
    if (!h || typeof h.callWS !== "function") return;
    try { Promise.resolve(h.callWS({type: "frontend/set_user_data", key, value})).catch(() => { /* kept in memory */ }); }
    catch (e) { /* kept in memory */ }
  }
  _saveColor(rgb) {
    const list = (LIGHT_COLORS || []).filter(x => rgbDist(x, rgb) > 6);
    list.push(rgb.slice(0, 3).map(v => Math.round(Number(v)))); LIGHT_COLORS = list.slice(-12);
    this._storeUser("jam_colors", LIGHT_COLORS);
    this._fillSheet();
  }
  _removeColor(i) {
    LIGHT_COLORS = (LIGHT_COLORS || []).filter((x, j) => j !== i);
    this._storeUser("jam_colors", LIGHT_COLORS);
    this._fillSheet();
  }
  /* The two whites: this user's saved pair for this light (jam_whites), else the config whites, else Cozy / Clean. */
  _whiteList() {
    const c = this._config, saved = LIGHT_WHITES_SAVED && LIGHT_WHITES_SAVED[c.entity];
    const base = (Array.isArray(c.whites) && c.whites.length ? c.whites : LIGHT_WHITES).slice(0, 2);
    return [0, 1].map(i => {
      const w = (Array.isArray(saved) && saved[i]) || base[i] || LIGHT_WHITES[i];
      return {name: String(w.name || "White"), kelvin: Number(w.kelvin) || 2700};
    });
  }
  _saveWhite(i, patch) {
    const list = this._whiteList();
    list[i] = Object.assign({}, list[i], patch);
    LIGHT_WHITES_SAVED = Object.assign({}, LIGHT_WHITES_SAVED || {}, {[this._config.entity]: list});
    this._storeUser("jam_whites", LIGHT_WHITES_SAVED);
  }
  _fillSheet() {
    const sh = this._sheet; if (!sh || !sh.isOpen()) return;
    const c = this._config, h = this._hass, s = stateObj(h, c.entity), body = sh.body;
    const act = deepActive(), focusK = act && act.dataset ? act.dataset.k : null, scroll = body.scrollTop;
    const sel = act && act.localName === "input" ? [act.selectionStart, act.selectionEnd] : null;
    if (this._editKey) {
      this._editKey.querySelector(".face").textContent = this._edit ? "Done" : "Edit";
      this._editKey.setAttribute("aria-pressed", this._edit ? "true" : "false");
      this._editKey.classList.toggle("on", !!this._edit);
      this._editKey.setAttribute("aria-label", this._edit ? "Done editing" : "Edit whites and colours");
    }
    sh.pop.classList.toggle("editing", !!this._edit);
    const [fill, ink] = this._paint(s);
    sh.pop.style.setProperty("--lc", fill); sh.pop.style.setProperty("--lc-fg", ink);
    body.textContent = "";
    if (!s || UNAVAILABLE.has(s.state)) { body.append(el("div", "label c-alert", "Unavailable")); return; }
    const a = s.attributes, modes = lightModes(s), on = s.state === "on";
    const sec = (label, ...kids) => { const d = el("div", "sec"); if (label) d.append(el("div", "label", label)); d.append(...kids); body.append(d); return d; };
    if (c.show_brightness !== false && lightDims(s)) sec("Brightness", this._bigBar(s));
    const ps = c.preset_entity && stateObj(h, c.preset_entity);
    if (c.preset_entity) { if (ps && ps.state !== "unavailable") this._presetCards(sec, ps); } // WLED reports "unknown" when no preset is active
    else if (this._hasWhites(s)) this._whites(sec, a);
    if (Array.isArray(c.presets) && c.presets.length) this._chips(sec, a);
    if (this._hasColors(s)) { this._hue(sec, a, on); this._colors(sec, a, on); }
    if (c.show_members !== false && Array.isArray(a.entity_id) && a.entity_id.length) this._members(sec, a.entity_id);
    if (stateObj(h, this._timerScript())) this._timer(body);
    body.scrollTop = scroll;
    if (focusK) {
      const f = body.querySelector(`[data-k="${CSS.escape(focusK)}"]`);
      if (f) {
        try { f.focus({preventScroll: true}); } catch (e) { f.focus(); }
        if (sel && f.localName === "input") try { f.setSelectionRange(sel[0], sel[1]); } catch (e) { /* ignore */ }
      }
    }
  }
  /* Drag/keyboard slider on node: at(e) -> value, show(v) preview, send(v) on release/keys. */
  _slide(node, {v0, at, show, send, step = 5, min = 0, max = 100, flag = "_sdrag"}) {
    let cur = v0, drag = false;
    const set = v => { cur = clampN(Math.round(v), min, max); show(cur); node.setAttribute("aria-valuenow", cur); };
    node.tabIndex = 0; node.setAttribute("role", "slider");
    node.setAttribute("aria-valuemin", min); node.setAttribute("aria-valuemax", max); node.setAttribute("aria-valuenow", cur);
    node.onpointerdown = e => { if (e.button) return; try { node.setPointerCapture(e.pointerId); } catch (err) { /* ignore */ } drag = true; this[flag] = true; set(at(e)); };
    node.onpointermove = e => { if (drag) set(at(e)); };
    node.onpointerup = e => { if (!drag) return; drag = false; set(at(e)); send(cur); this._endDrag(); };
    node.onpointercancel = () => { if (!drag) return; drag = false; set(v0); this._endDrag(); };
    node.onkeydown = e => {
      const k = {ArrowRight: step, ArrowUp: step, ArrowLeft: -step, ArrowDown: -step, PageUp: step * 2, PageDown: -step * 2, Home: -1e6, End: 1e6}[e.key];
      if (!k) return; e.preventDefault(); set(cur + k); send(cur);
    };
  }
  _bigBar(s) {
    const id = this._config.entity, v0 = lightPct(s);
    const wrap = el("div", "bwrap"), bar = el("div", "bigbar"), fi = el("i"), val = el("b", "num");
    bar.append(fi, val); wrap.append(bar);
    wrap.dataset.k = "bright"; wrap.setAttribute("aria-label", "Brightness");
    const show = v => { fi.style.width = v + "%"; val.textContent = v ? v + "%" : "Off"; bar.classList.toggle("hi", v >= 78); };
    show(v0);
    const at = e => { const r = wrap.getBoundingClientRect(); return ((e.clientX - r.left) / r.width) * 100; };
    this._slide(wrap, {v0, at, show, send: v => this._setPct(id, v)});
    return wrap;
  }
  _presetCards(sec, ps) {
    const opts = Array.isArray(ps.attributes.options) ? ps.attributes.options : [];
    if (!opts.length) return;
    const g = el("div", "two"); g.setAttribute("role", "group"); g.setAttribute("aria-label", "Presets");
    for (const o of opts) {
      const cur = ps.state === o;
      const {root, face} = paper("button", "jam-light|preset|" + o, {kind: "card", cls: "press wp" + (cur ? " on" : "")});
      root.type = "button"; root.dataset.k = "p|" + o; root.setAttribute("aria-pressed", cur ? "true" : "false");
      face.append(lightPreview(o), el("b", null, o));
      root.onclick = () => this._call(ps.entity_id.split(".")[0], "select_option", {entity_id: ps.entity_id, option: o});
      g.append(root);
    }
    sec("Presets", g);
  }
  _whites(sec, a) {
    const c = this._config, lo = Math.round(a.min_color_temp_kelvin || 2000), hi = Math.round(a.max_color_temp_kelvin || 6500);
    const list = this._whiteList(), edit = !!this._edit;
    const g = el("div", "two"); g.setAttribute("role", "group"); g.setAttribute("aria-label", "White");
    const tiles = [];
    list.forEach((w, i) => {
      const k = Math.round(clampN(w.kelvin, lo, hi)), rgb = kelvinToRgb(k);
      const cur = !edit && a.color_mode === "color_temp" && Math.abs((a.color_temp_kelvin || 0) - k) < 60;
      const sel = edit && this._editW === i;
      const {root, face} = paper("button", "jam-light|white|" + i, {kind: "card", cls: "press wt" + (cur || sel ? " on" : "") + (edit ? " ed" : "")});
      root.type = "button"; root.dataset.k = "w|" + i;
      face.style.background = rgbCss(rgb); face.style.color = inkOn(rgb);
      const nb = el("b", null, w.name), kb = el("small", "num", k + " K");
      face.append(nb, kb);
      if (edit) {
        // Pencil (round 3 Edit mode): tap = edit this white below the pair.
        face.append(lightGlyph("pencil"));
        root.setAttribute("aria-label", `Edit ${w.name}`); root.setAttribute("aria-expanded", sel ? "true" : "false");
        root.onclick = () => { this._editW = sel ? null : i; this._wDraft = null; this._fillSheet(); };
      } else {
        root.setAttribute("aria-pressed", cur ? "true" : "false");
        root.onclick = () => this._call("light", "turn_on", {entity_id: c.entity, color_temp_kelvin: k});
      }
      tiles.push({nb, kb, face});
      g.append(root);
    });
    const d = sec("White", g);
    if (edit && this._editW != null && list[this._editW]) d.append(this._whiteEditor(this._editW, list[this._editW], lo, hi, tiles[this._editW]));
  }
  /* Edit one white: name field + kelvin slider within the light's range; saved per user (jam_whites) on commit. */
  _whiteEditor(i, w, lo, hi, tile) {
    const box = el("div", "wedit"), id = "jam-wname-" + i;
    const lab = el("label", "label", "Name"); lab.htmlFor = id;
    const inp = el("input", "nin"); inp.type = "text"; inp.id = id; inp.maxLength = 24; inp.dataset.k = "wname|" + i;
    inp.value = this._wDraft != null ? this._wDraft : w.name; inp.autocomplete = "off"; inp.spellcheck = false;
    const commit = () => {
      const v = inp.value.trim() || "White";
      this._wDraft = null;
      if (v !== w.name) { w.name = v; this._saveWhite(i, {name: v}); }
      tile.nb.textContent = v;
    };
    inp.addEventListener("input", () => { this._wDraft = inp.value; tile.nb.textContent = inp.value.trim() || "White"; });
    inp.addEventListener("change", commit);
    inp.addEventListener("keydown", e => { if (e.key === "Enter") { e.preventDefault(); commit(); } });
    const k0 = Math.round(clampN(w.kelvin, lo, hi));
    const wrap = el("div", "kwrap"), bar = el("div", "kbar"), fi = el("i"), val = el("b", "num");
    bar.append(fi, val); wrap.append(bar);
    wrap.dataset.k = "wk|" + i; wrap.setAttribute("aria-label", "Colour temperature (kelvin)");
    const show = v => {
      const rgb = kelvinToRgb(v);
      fi.style.width = (hi > lo ? ((v - lo) / (hi - lo)) * 100 : 100) + "%"; fi.style.background = rgbCss(rgb);
      val.textContent = v + " K"; wrap.setAttribute("aria-valuetext", v + " kelvin");
      tile.face.style.background = rgbCss(rgb); tile.face.style.color = inkOn(rgb); tile.kb.textContent = v + " K";
    };
    show(k0);
    const at = e => { const r = wrap.getBoundingClientRect(); return Math.round((lo + clampN((e.clientX - r.left) / r.width, 0, 1) * (hi - lo)) / 10) * 10; };
    this._slide(wrap, {v0: k0, at, show, step: 100, min: lo, max: hi, send: v => { w.kelvin = v; this._saveWhite(i, {kelvin: v}); }});
    box.append(lab, inp, el("div", "label", "Warmth"), wrap);
    return box;
  }
  _chips(sec, a) {
    const c = this._config, box = el("div", "chips");
    box.setAttribute("role", "group"); box.setAttribute("aria-label", "Presets");
    c.presets.forEach((p, i) => {
      const data = {entity_id: c.entity};
      if (p.color_temp_kelvin != null) data.color_temp_kelvin = Number(p.color_temp_kelvin);
      else if (Array.isArray(p.rgb_color)) data.rgb_color = p.rgb_color.map(Number);
      if (p.brightness_pct != null) data.brightness_pct = Number(p.brightness_pct);
      const cur = data.color_temp_kelvin != null
        ? a.color_mode === "color_temp" && Math.abs((a.color_temp_kelvin || 0) - data.color_temp_kelvin) < 60
        : !!data.rgb_color && a.color_mode !== "color_temp" && rgbDist(a.rgb_color, data.rgb_color) < 40;
      const k = cutKey(p.name || "Preset", "jam-light|chip|" + i, cur ? "on" : "", "chip");
      k.dataset.k = "c|" + i; k.setAttribute("aria-pressed", cur ? "true" : "false");
      k.onclick = () => this._call("light", "turn_on", data);
      box.append(k);
    });
    sec(c.preset_entity ? "Shortcuts" : "Presets", box);
  }
  _hue(sec, a, on) {
    const c = this._config, wrap = el("div", "hwrap"), hb = el("div", "hb"), mk = el("div", "mk");
    for (let k = 0; k < 12; k++) { const b = el("span"); b.style.background = `hsl(${k * 30},90%,58%)`; hb.append(b); }
    const colourMode = on && COLOR_MODES.includes(a.color_mode) && Array.isArray(a.hs_color);
    const band0 = colourMode ? Math.round(Number(a.hs_color[0]) / 30) % 12 : null;
    wrap.append(hb, mk); wrap.dataset.k = "hue"; wrap.setAttribute("aria-label", "Hue");
    const show = band => {
      mk.hidden = band == null;
      if (band != null) mk.style.left = ((band + .5) / 12) * 100 + "%";
      wrap.setAttribute("aria-valuetext", band == null ? "none" : band * 30 + "°");
    };
    show(band0);
    const at = e => { const r = wrap.getBoundingClientRect(); return clampN(Math.floor(((e.clientX - r.left) / r.width) * 12), 0, 11); };
    this._slide(wrap, {v0: band0 == null ? 0 : band0, at, show, step: 1, min: 0, max: 11,
      send: band => this._call("light", "turn_on", {entity_id: c.entity, hs_color: [band * 30, 90]})});
    if (band0 == null) show(null);
    sec("Colour", wrap);
  }
  _colors(sec, a, on) {
    const c = this._config, box = el("div", "sws"), edit = !!this._edit;
    box.setAttribute("role", "group"); box.setAttribute("aria-label", "Your colours");
    const cur = on && a.color_mode !== "color_temp" && Array.isArray(a.rgb_color) ? a.rgb_color : null;
    (LIGHT_COLORS || []).forEach((col, i) => {
      const {root, face} = paper("button", "jam-light|sw|" + i, {kind: "chip", cls: "key press sw" + (edit ? " rm" : "")});
      root.type = "button"; root.dataset.k = "s|" + col.join(",");
      face.style.background = rgbCss(col);
      if (edit) {
        // × (round 3 Edit mode): tap removes the saved colour (jam_colors).
        face.style.color = inkOn(col); face.append(lightGlyph("x"));
        root.setAttribute("aria-label", `Remove saved colour ${i + 1}`);
        root.onclick = () => this._removeColor(i);
      } else {
        root.setAttribute("aria-label", `Saved colour ${i + 1}`);
        root.setAttribute("aria-pressed", rgbDist(cur, col) < 12 ? "true" : "false");
        root.onclick = () => this._call("light", "turn_on", {entity_id: c.entity, rgb_color: col.slice(0, 3).map(Number)});
      }
      box.append(root);
    });
    if (!edit) {
      const save = on && Array.isArray(a.rgb_color) ? a.rgb_color : null;
      const {root: add, face} = paper("button", "jam-light|sw|add", {kind: "chip", cls: "key press sw add"});
      add.type = "button"; add.dataset.k = "s|add"; face.textContent = "+";
      add.setAttribute("aria-label", "Save the current colour"); add.disabled = !save;
      add.onclick = () => { if (save) this._saveColor(save); };
      box.append(add);
    } else if (!(LIGHT_COLORS || []).length) box.append(el("div", "label", "No saved colours"));
    sec("Your colours", box);
  }
  _members(sec, ids) {
    const h = this._hass, d = el("div", "sec");
    d.append(el("div", "label", "In this group"));
    for (const id of ids) {
      const s = stateObj(h, id), dead = !s || UNAVAILABLE.has(s.state), on = !!s && s.state === "on", v0 = lightPct(s);
      const [fill, ink] = this._paint(s), m = el("div", "mem");
      const row = el("button", "mrow hit"); row.type = "button"; row.dataset.k = "m|" + id; row.disabled = dead;
      const n = el("span", "n", friendly(h, id)), pill = el("span", "chip num");
      const pshow = v => {
        pill.textContent = dead ? "N/A" : v ? v + "%" : "Off";
        pill.style.background = !dead && v ? fill : ""; pill.style.color = !dead && v ? ink : dead ? "var(--alert-text)" : "";
      };
      pshow(on ? v0 : 0);
      row.append(n, pill);
      row.setAttribute("aria-pressed", on ? "true" : "false");
      row.setAttribute("aria-label", `${friendly(h, id)}: ${dead ? "unavailable" : on ? v0 + "%" : "off"}`);
      row.onclick = () => this._call("light", "toggle", {entity_id: id});
      m.append(row);
      if (!dead && lightDims(s)) {
        const tr = el("div", "mtrack hit"), mb = el("div", "mb"), fi = el("i");
        fi.style.background = fill; mb.append(fi); tr.append(mb);
        tr.dataset.k = "mb|" + id; tr.setAttribute("aria-label", friendly(h, id) + " brightness");
        const show = v => { fi.style.width = v + "%"; pshow(v); };
        show(on ? v0 : 0);
        const at = e => { const r = tr.getBoundingClientRect(); return ((e.clientX - r.left) / r.width) * 100; };
        this._slide(tr, {v0: on ? v0 : 0, at, show, step: 10, send: v => this._setPct(id, v)});
        m.append(tr);
      }
      d.append(m);
    }
    this._sheet.body.append(d);
  }
  _timer(body) {
    const c = this._config, row = el("div", "timer"), tc = el("div", "tc");
    row.append(el("div", "label", "Off in"), tc);
    for (const [min, label] of LIGHT_TIMERS) {
      const k = cutKey(label, "jam-light|timer|" + min, "", "chip");
      k.dataset.k = "t|" + min; k.setAttribute("aria-label", `Turn off in ${min} minutes`);
      k.onclick = () => this._call("script", "turn_on", {entity_id: this._timerScript(), variables: {entity_id: c.entity, minutes: min}});
      tc.append(k);
    }
    body.append(row);
  }
  getCardSize() { return 2; }
  getGridOptions() { return {columns: 6, rows: "auto", min_columns: 4}; }
}
register("jam-light", JamLight, "Jam Light", "Light card in the light's own colour: tap toggles, drag dims, hold or ⋯ opens the light pop-up.");
