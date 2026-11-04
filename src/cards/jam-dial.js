/* ---------- jam-dial: a light as a rotary dial (Braun look card, 2026-11-03; renders in every look) ----------
   {type: custom:jam-dial, entity (light.*, groups too), name?, kicker? (sub line; default: a group's "K of N on", else the
    entity's area), accent? (the dial mark; default ochre), show_swatches? (true), whites?: [{name, kelvin}] (as jam-light),
    colors?: [{name?, rgb_color}] (colour swatches; default: this user's saved colours (the jam-light pop-up's), else
    Amber / Rose / Blue), hold_action? (default: the jam-light pop-up), plus jam-light's pop-up options (preset_entity,
    timer_script, presets, show_brightness, show_color_temp, show_color, show_members)}
   After the Braun look-cards mockup (dial light): name + sub line, the power toggle top-right (core powerCorner: Poster's
   triangle, Braun's toggle), a dial: 7 tick marks, a 270 degree track with the brightness arc in the light's own colour
   (its colour at full value, the group's average of the lit members; nudged lighter / darker only where it would vanish
   into the card face, under 1.6:1), a centre cap with the % (tap = toggle) and a mark on its rim at the value; under it a row of round swatches:
   the two whites (color_temp lights) and the colours (colour lights), the current one ringed.
   The dial is a real slider (role=slider, 0-100, "Off" while off): drag in a circle (the bottom gap clamps to the nearer
   end), a tap on the ring jumps there, the mouse wheel steps it (sent after 300 ms), arrows +/-5, PageUp / PageDown +/-10,
   Home / End = 1 / 100; light.turn_on brightness_pct on release (from off too). A hold (500 ms without moving) on the dial,
   the cap or the name = hold_action, by default the jam-light pop-up (the class extends JamLight, so the pop-up, its user
   data, whites and drag-safe rendering are jam-light's own). The name is a button that opens the pop-up (keyboard path).
   Non-dimming lights show a full / empty arc without the slider; unavailable lights show N/A with every control disabled.
   No continuous animation: the arc, number and mark are set once per value. Look polish (rounded arc ends, raised cap)
   lives in the look packs; the card itself only uses tokens. */
const DIAL_SWEEP = 270, DIAL_R = 84;
const DIAL_COLORS = [{name: "Amber", rgb_color: [255, 160, 64]}, {name: "Rose", rgb_color: [226, 101, 143]}, {name: "Blue", rgb_color: [74, 123, 224]}];
/* This user's saved colours / whites for the swatches (frontend/get_user_data jam_colors + jam_whites), loaded once per page
   by the first dial, apart from jam-light's own load (which a pop-up does; once it has run, its fresher copy wins). */
let DIAL_SAVED = null, DIAL_LOAD = null;
function dialLoad(h) {
  if (DIAL_SAVED || DIAL_LOAD) return DIAL_LOAD;
  if (!h || typeof h.callWS !== "function") { DIAL_SAVED = {colors: [], whites: {}}; return null; }
  const get = key => Promise.resolve().then(() => h.callWS({type: "frontend/get_user_data", key})).then(r => r && r.value, () => null);
  DIAL_LOAD = Promise.all([get("jam_colors"), get("jam_whites")]).then(([v, w]) => {
    DIAL_SAVED = {colors: Array.isArray(v) ? v.filter(x => Array.isArray(x) && x.length >= 3) : [], whites: w && typeof w === "object" && !Array.isArray(w) ? w : {}};
  }, () => { DIAL_SAVED = {colors: [], whites: {}}; }).then(() => { DIAL_LOAD = null; });
  return DIAL_LOAD;
}
/* Point on the dial circle (centre 100,100) at angle a degrees (0 = top, clockwise). */
const dialPt = (a, r) => { const t = (a - 90) * Math.PI / 180; return [(100 + r * Math.cos(t)).toFixed(2), (100 + r * Math.sin(t)).toFixed(2)]; };
/* rgb nudged toward black or white (whichever gains contrast) until it reads min:1 on face: the arc stays the light's own
   colour unless it would vanish into the face (a warm white on a cream panel). The % is the readable value. */
function dialReadable(rgb, face, min = 1.6) {
  if (!face) return rgb;
  let c = rgb.slice(0, 3);
  const to = luminance(face) > .18 ? [0, 0, 0] : [255, 255, 255];
  for (let i = 0; i < 20 && contrastRatio(c, face) < min; i++) c = c.map((v, j) => v + (to[j] - v) * .1);
  return c.map(Math.round);
}
class JamDial extends JamLight {
  css() { return POWER_CSS + `
    .dl > .face{display:grid;gap:6px;align-content:start;--p-t:12px;--p-r:14px;--p-b:14px;--p-l:16px}
    .dl.dead > .face{color:var(--dim)}
    .dl-top{display:grid;gap:4px;justify-items:start;min-width:0;padding-right:44px;min-height:34px}
    .dl-name{font:var(--disp-w) calc(24px * var(--disp-scale))/calc(1 * var(--disp-lead)) var(--display);text-transform:var(--disp-case);
      letter-spacing:var(--jam-display-track,.01em);text-align:left;overflow-wrap:anywhere;max-width:100%;margin:0}
    button.dl-name{cursor:pointer}
    .dl-sub{font:var(--lbl-w) 10px/1.2 var(--body);letter-spacing:calc(.14em * var(--lbl-track));text-transform:var(--lbl-case);color:var(--dim)}
    .dl-dial{position:relative;width:min(100%,210px);aspect-ratio:1;margin:2px auto 0;-webkit-user-select:none;user-select:none}
    .dl-ring{position:absolute;inset:0;border-radius:50%;touch-action:none}
    .dl-ring[role=slider]{cursor:grab}
    .dl-ring[role=slider]:focus-visible{outline:3px solid var(--focus);outline-offset:2px}
    .dl-ring svg{position:absolute;inset:0;width:100%;height:100%;display:block;overflow:visible}
    .dl-tk{stroke:var(--dim);stroke-width:2}
    .dl-tr,.dl-arc{fill:none;stroke-width:12}
    .dl-tr{stroke:var(--slab2)}
    .dl-arc{stroke:var(--dl-c,var(--acc))}
    .dl-cap{position:absolute;inset:23%;border-radius:50%;background:var(--slab2);color:var(--fg);display:grid;place-items:center;z-index:1}
    .dl-cap:disabled{cursor:default;color:var(--dim)}
    .dl-v{font:var(--disp-w) calc(40px * var(--num-scale))/1 var(--num-font);text-transform:var(--disp-case)}
    .dl-v small{font-size:.42em;margin-left:1px;text-transform:none}
    .dl-v .label{font-size:12px;color:inherit}
    .dl-mk{position:absolute;left:50%;top:5%;width:4px;height:16%;margin-left:-2px;background:var(--acc);transform-origin:50% 281%;pointer-events:none}
    .dl:not(.on) .dl-mk{background:var(--dim)}
    .dl-sw{display:flex;flex-wrap:wrap;justify-content:center;gap:2px}
    .dl-s{width:44px;height:44px;display:grid;place-items:center;border-radius:50%}
    .dl-s i{display:block;width:24px;height:24px;border-radius:50%;background:var(--sc);box-shadow:inset 0 0 0 1px var(--line)}
    .dl-s[aria-pressed=true] i{outline:2px solid var(--fg);outline-offset:3px}
    .pw{z-index:2}`; }
  getCardSize() { return 5; }
  getGridOptions() { return {columns: 6, rows: "auto", min_columns: 4}; }
  disconnectedCallback() {
    if (this._wheelT) { clearTimeout(this._wheelT); this._wheelT = null; if (this._wheelSend) this._wheelSend(); }
    super.disconnectedCallback();
  }
  /* Sub line: a group's "K of N on", else kicker, else the entity's area. */
  _dialSub(s) {
    const ids = this._memberIds(s);
    if (ids.length) return `${ids.filter(id => { const m = stateObj(this._hass, id); return m && m.state === "on"; }).length} of ${ids.length} on`;
    return this._config.kicker || this._area();
  }
  /* Hold (500 ms, < 7px movement) on node -> hold_action / the pop-up. Returns {down(e), moved(e), up() -> held}. */
  _holder() {
    let t = null, x = 0, y = 0, held = false;
    const stop = () => { clearTimeout(t); if (this._holdT === t) this._holdT = null; t = null; };
    return {
      down: e => { stop(); held = false; x = e.clientX; y = e.clientY; t = this._holdT = setTimeout(() => { t = null; this._holdT = null; if (this.isConnected) { held = true; this._hold(); } }, 500); },
      moved: e => { if (t && Math.hypot(e.clientX - x, e.clientY - y) > 7) stop(); return Math.hypot(e.clientX - x, e.clientY - y) > 7; },
      up: () => { stop(); const h = held; held = false; return h; },
      held: () => held,
    };
  }
  /* A button whose tap runs fn and whose hold opens the pop-up: a click after a hold or a > 7px move does nothing
     (keyboard / assistive clicks always run fn). */
  _tapHold(node, fn) {
    const hd = this._holder();
    let skip = false;
    node.addEventListener("contextmenu", e => e.preventDefault());
    node.addEventListener("pointerdown", e => { skip = false; if (!e.button) hd.down(e); });
    node.addEventListener("pointermove", e => { if (hd.moved(e)) skip = true; });
    node.addEventListener("pointerup", () => { if (hd.up()) skip = true; });
    node.addEventListener("pointercancel", () => { hd.up(); skip = true; });
    node.addEventListener("click", e => { if (skip && e.detail) { skip = false; return; } skip = false; fn(); });
  }
  render(b) {
    const c = this._config, h = this._hass, s = stateObj(h, c.entity), name = this._name();
    const dead = !s || UNAVAILABLE.has(s.state), on = !!s && s.state === "on", dims = !dead && lightDims(s);
    const {root, face} = this.paper(c.entity, {cls: "dl " + (dead ? "dead" : on ? "on" : "off")});
    b.append(root); // in the page first: the accent and the face colour resolve to rgb
    // Arc colour: the light's colour (group: lit members' average) at full value, nudged only under 1.6:1 on the card face.
    const rgb = dead ? null : this._faceRgb(s);
    this._accWait = !dead && !rgb;
    let slab = null; try { slab = jamCssRgb(getComputedStyle(face).backgroundColor) || parseRgb(getComputedStyle(b).getPropertyValue("--slab").trim()); } catch (e) { /* detached */ }
    if (rgb) root.style.setProperty("--dl-c", rgbCss(dialReadable(rgb, slab)));
    // Header: name (button = pop-up) + sub line; power toggle top-right.
    const top = el("div", "dl-top");
    const nm = el(dead ? "h3" : "button", "dl-name", name);
    if (!dead) {
      nm.type = "button"; nm.dataset.key = "more"; nm.setAttribute("aria-haspopup", "dialog");
      nm.setAttribute("aria-label", `${name}: light settings`);
      this._tapHold(nm, () => this._openSheet());
    }
    top.append(nm);
    const sub = dead ? (s ? "Unavailable" : "Missing") : this._dialSub(s);
    if (sub) top.append(el("div", "dl-sub", sub));
    face.append(top);
    // Dial: ticks, track, arc (pathLength 100 + dasharray = the level), cap with the %, rim mark.
    const pct = lightPct(s), dial = el("div", "dl-dial"), ring = el("div", "dl-ring");
    const NS = "http://www.w3.org/2000/svg", svg = document.createElementNS(NS, "svg"), mk = (t, a) => { const n = document.createElementNS(NS, t); for (const k in a) n.setAttribute(k, a[k]); return n; };
    svg.setAttribute("viewBox", "0 0 200 200"); svg.setAttribute("aria-hidden", "true");
    for (let i = 0; i < 7; i++) { const a = -135 + i * 45, [x1, y1] = dialPt(a, 93), [x2, y2] = dialPt(a, 100); svg.append(mk("line", {class: "dl-tk", x1, y1, x2, y2})); }
    const [sx, sy] = dialPt(-135, DIAL_R), [ex, ey] = dialPt(135, DIAL_R);
    const d = `M${sx} ${sy} A${DIAL_R} ${DIAL_R} 0 1 1 ${ex} ${ey}`;
    const arc = mk("path", {class: "dl-arc", d, pathLength: "100"});
    svg.append(mk("path", {class: "dl-tr", d}), arc);
    ring.append(svg);
    const cap = el("button", "dl-cap"); cap.type = "button"; cap.dataset.key = "toggle";
    const val = el("span", "dl-v num"), mark = el("span", "dl-mk");
    mark.setAttribute("aria-hidden", "true");
    cap.append(val, mark);
    dial.append(ring, cap);
    const show = (v, isOn) => {
      val.textContent = "";
      if (dead) val.append(el("span", "label", "N/A"));
      else if (isOn && !dims) val.append(el("span", "label", "On"));
      else if (isOn) val.append(document.createTextNode(String(v)), el("small", null, "%"));
      else val.append(el("span", "label", "Off"));
      const lv = dead || !isOn ? 0 : dims ? v : 100;
      arc.setAttribute("stroke-dasharray", lv ? `${lv} 100` : "0 100");
      arc.style.display = lv ? "" : "none";
      arc.style.setProperty("--lv", lv / 100); // level 0..1 (R10 look hook)
      mark.style.transform = `rotate(${-135 + DIAL_SWEEP * lv / 100}deg)`;
      if (ring.getAttribute("role") === "slider") {
        ring.setAttribute("aria-valuenow", isOn ? v : 0);
        ring.setAttribute("aria-valuetext", isOn ? v + "%" : "Off");
      }
      cap.setAttribute("aria-pressed", String(!!isOn));
    };
    cap.setAttribute("aria-label", `${name} light`);
    if (dead) cap.disabled = true;
    if (dims) {
      ring.tabIndex = 0; ring.setAttribute("role", "slider"); ring.setAttribute("aria-label", `${name} brightness`);
      ring.setAttribute("aria-valuemin", "0"); ring.setAttribute("aria-valuemax", "100");
    }
    show(pct, on);
    face.append(dial);
    if (!dead) this._dialGestures(ring, cap, {on, pct, dims, show});
    // Swatches: the whites, then the colours (config, else this user's saved colours, else the defaults).
    if (!dead && c.show_swatches !== false) {
      const row = this._swatches(s, on);
      if (row) face.append(row);
    }
    face.append(powerCorner({name, on, disabled: dead, onClick: () => this._power(), ctx: this}));
    if (this._sheet && this._sheet.isOpen()) this._fillSheet();
  }
  /* The two whites: jam-light's (config, defaults, this user's edited pair once its pop-up loaded them), else the pair from
     the dial's own load. */
  _whiteList() {
    const own = !LIGHT_WHITES_SAVED && DIAL_SAVED && DIAL_SAVED.whites[this._config.entity], base = super._whiteList();
    return Array.isArray(own) ? base.map((w, i) => own[i] ? {name: String(own[i].name || "White"), kelvin: Number(own[i].kelvin) || 2700} : w) : base;
  }
  _swatches(s, on) {
    const c = this._config, a = s.attributes, list = [];
    if (!DIAL_SAVED && LIGHT_COLORS === null && !this._colWait) {
      const p = dialLoad(this._hass);
      if (p) { this._colWait = true; p.then(() => { this._colWait = false; if (this.isConnected && this._config === c) this._render(false); }); }
    }
    if (this._hasWhites(s)) {
      const lo = Math.round(a.min_color_temp_kelvin || 2000), hi = Math.round(a.max_color_temp_kelvin || 6500);
      for (const w of this._whiteList()) {
        const k = Math.round(clampN(w.kelvin, lo, hi));
        list.push({label: `${w.name}, ${k} K`, rgb: kelvinToRgb(k), data: {color_temp_kelvin: k},
          cur: on && a.color_mode === "color_temp" && Math.abs((a.color_temp_kelvin || 0) - k) < 60});
      }
    }
    if (this._hasColors(s)) {
      const mine = LIGHT_COLORS || (DIAL_SAVED && DIAL_SAVED.colors) || [];
      const saved = mine.slice(-4).map((rgb, i) => ({name: `Your colour ${i + 1}`, rgb_color: rgb}));
      const cols = Array.isArray(c.colors) ? c.colors : saved.length ? saved : DIAL_COLORS;
      const now = on && a.color_mode !== "color_temp" ? fullRgb(lightRgb(s)) : null;
      cols.forEach((x, i) => {
        const rgb = x && Array.isArray(x.rgb_color) ? x.rgb_color.slice(0, 3).map(Number) : null;
        if (!rgb || rgb.some(v => !(v >= 0 && v <= 255))) return;
        list.push({label: x.name ? String(x.name) : `Colour ${i + 1}`, rgb, data: {rgb_color: rgb}, cur: !!now && rgbDist(now, fullRgb(rgb)) < 30});
      });
    }
    if (!list.length) return null;
    const row = el("div", "dl-sw");
    row.setAttribute("role", "group"); row.setAttribute("aria-label", "Whites and colours");
    for (const x of list.slice(0, 8)) {
      const b = el("button", "dl-s"), dot = el("i");
      b.type = "button"; b.setAttribute("aria-label", x.label); b.setAttribute("aria-pressed", String(x.cur));
      dot.style.setProperty("--sc", rgbCss(x.rgb)); dot.setAttribute("aria-hidden", "true");
      b.append(dot);
      b.onclick = () => this._call("light", "turn_on", {entity_id: c.entity, ...x.data});
      row.append(b);
    }
    return row;
  }
  /* Cap: tap = toggle, hold = pop-up. Ring: drag in a circle / tap = set, hold = pop-up, wheel, keys. */
  _dialGestures(ring, cap, st) {
    const id = this._config.entity;
    this._tapHold(cap, () => this._power());
    if (!st.dims) return;
    let cur = st.on ? st.pct : 0;
    const preview = v => { cur = clampN(Math.round(v), 1, 100); st.show(cur, true); };
    const send = v => { st.pct = v; st.on = true; this._setPct(id, v); };
    // Angle from the dial centre: 0 = top, clockwise; the bottom gap (|a| > 135) clamps to the end nearer the last value.
    const at = e => {
      const r = ring.getBoundingClientRect(), a = Math.atan2(e.clientX - (r.left + r.width / 2), -(e.clientY - (r.top + r.height / 2))) * 180 / Math.PI;
      if (a > 135 || a < -135) return cur > 50 ? 100 : 1;
      return (a + 135) / DIAL_SWEEP * 100;
    };
    const hd = this._holder();
    let p = null; // {mode: press | drag}
    ring.addEventListener("contextmenu", e => e.preventDefault());
    ring.addEventListener("pointerdown", e => {
      if (e.button || p) return;
      p = {mode: "press"};
      try { ring.setPointerCapture(e.pointerId); } catch (err) { /* synthetic pointer */ }
      hd.down(e);
    });
    ring.addEventListener("pointermove", e => {
      if (!p || hd.held()) return;
      if (p.mode === "press" && hd.moved(e)) { p.mode = "drag"; this._drag = true; }
      if (p.mode === "drag") preview(at(e));
    });
    const end = (e, cancel) => {
      if (!p) return;
      const q = p; p = null;
      if (hd.up() || cancel) { if (q.mode === "drag") { st.show(st.pct, st.on); cur = st.on ? st.pct : 0; this._endDrag(); } return; }
      if (q.mode === "press") preview(at(e));
      send(cur);
      this._endDrag();
    };
    ring.addEventListener("pointerup", e => end(e, false));
    ring.addEventListener("pointercancel", e => end(e, true));
    ring.addEventListener("wheel", e => {
      if (!e.deltaY) return;
      e.preventDefault();
      preview(cur + (-e.deltaY / 20 || 0) * (e.deltaMode === 1 ? 20 : 1));
      this._drag = true;
      clearTimeout(this._wheelT);
      this._wheelSend = () => { this._wheelSend = null; send(cur); this._endDrag(); };
      this._wheelT = setTimeout(() => { this._wheelT = null; if (this._wheelSend) this._wheelSend(); }, 300);
    }, {passive: false});
    ring.addEventListener("keydown", e => {
      const step = {ArrowRight: 5, ArrowUp: 5, ArrowLeft: -5, ArrowDown: -5, PageUp: 10, PageDown: -10}[e.key];
      let v = null;
      if (step) v = cur + step; else if (e.key === "Home") v = 1; else if (e.key === "End") v = 100;
      if (v == null) return;
      e.preventDefault();
      preview(v); send(cur);
    });
  }
}
register("jam-dial", JamDial, "Jam Dial", "A light as a rotary dial: drag, wheel or arrow keys dim, the centre toggles, swatches pick whites and colours, hold opens the light pop-up.");
