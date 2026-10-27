/* ---------- jam-light: light with ON key, brightness strip, colour-temp chips and colour swatches ----------
   {type: custom:jam-light, entity (light.*), name?, icon?, tap_action? (ON key; default toggle), hold_action?,
    show_brightness? (default true when the light dims), show_color_temp? (default: color_temp supported),
    show_color? (default: hs/xy/rgb* supported), presets?: [{name, color_temp_kelvin | rgb_color}]}
   Off: only the ON key + brightness (dragging brightness turns it on; releasing at 0 turns it off). */
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
    .pw.alert:disabled > .face{color:var(--ink)}
    .row{display:flex;flex-wrap:wrap;justify-content:space-between;align-items:baseline;gap:2px 10px}
    .v{font-family:var(--display);font-weight:900;font-size:1.7rem;line-height:1}
    .track{position:relative;height:32px;touch-action:none}
    .track[role=slider]{cursor:pointer}
    .strip{position:absolute;inset:0;background:var(--line)}
    .fill{position:absolute;inset:0 auto 0 0;background:var(--ochre)}
    .track:focus-visible{outline:3px solid var(--ochre);outline-offset:2px}
    .chips{display:grid;grid-template-columns:repeat(auto-fit,minmax(68px,1fr));gap:8px}
    .chips .key{min-width:0} .chips .key > .face{--p-l:6px;--p-r:6px;font-size:.68rem;letter-spacing:.1em}
    .sws{display:flex;flex-wrap:wrap;gap:10px}
    .sw{min-width:0;width:40px} .sw > .face{height:34px;padding:0}
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
    const {root, face: wrap} = this.paper(c.entity, {edges: "rb", face: "wrap"});
    const sw = el("div", "swatch"); sw.setAttribute("aria-hidden", "true");
    const rgb = Array.isArray(a.rgb_color) ? a.rgb_color : null;
    sw.style.background = dead ? "var(--red)" : !on ? "var(--line)" : rgb ? `rgb(${rgb.map(Number).join(",")})` : "var(--ochre)";
    wrap.append(sw);
    // Header: name + cut ON/OFF key (tap_action, default toggle; hold_action).
    const head = el("div", "head"), nm = el("div", "nm");
    const ic = icon(c.icon); if (ic) nm.append(ic);
    nm.append(el("h3", "disp", c.name || friendly(h, c.entity)));
    const key = cutKey(dead ? (s ? "N/A" : "Missing") : on ? "On" : "Off", `jam-light|${c.entity}|key`, "pw" + (on ? " on" : dead ? " alert" : ""));
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
    const c = this._config, sd = seed("jam-light|" + c.entity);
    const row = el("div", "row"), val = el("div", "v num", dead ? "—" : v0 + "%");
    row.append(el("div", "label", "Brightness"), val);
    const track = el("div", "track"), strip = el("div", "strip"), fill = el("div", "fill");
    strip.style.clipPath = tornPath(sd + 3, {edges: "tb", depth: 3, step: 5});
    fill.style.clipPath = tornPath(sd + 5, {edges: "r", depth: 9, step: 12});
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
      const k = cutKey(t.name, `jam-light|${c.entity}|t|${t.name}`, t === best ? "on" : "");
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
      const {root, face} = paper("button", `jam-light|${c.entity}|c|${name}`, {edges: "rb", depth: 2.5, step: 20, cls: "key press sw"});
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
      const k = cutKey(p.name || "Preset", `jam-light|${c.entity}|p|${p.name}`, act ? "on" : "");
      k.setAttribute("aria-pressed", act ? "true" : "false");
      k.onclick = () => this._on(data);
      box.append(k);
    }
    wrap.append(el("div", "label", "Presets"), box);
  }
  getCardSize() { return 3; }
}
register("jam-light", JamLight, "Jam Light", "Light with an ON key, brightness strip, colour-temp chips and colour swatches.");
