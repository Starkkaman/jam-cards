/* ---------- jam-weather: big temperature + condition word + cut-paper glyph, forecast strip, optional clock ----------
   {type: custom:jam-weather, entity (weather.*), forecast_type?: daily|hourly|twice_daily, days? (5), clock? (false),
    clock_size?: normal (default) | big | huge (kiosk: the time scales with the card width, minute-aligned, no seconds),
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
    const first = !this._hass, before = this._sig;
    // The time format only changes with hass.locale (a new object): no Intl lookup on every state change.
    if (this._tf === undefined || !h || h.locale !== this._loc || h.language !== this._lng) { this._loc = h && h.locale; this._lng = h && h.language; this._tfNew = JSON.stringify(jamWxTime(h)); }
    const tf = this._tfNew;
    super.hass = h;
    if (!first && tf !== this._tf && this._sig === before) this._render(false); /* time format changed */
    this._tf = tf;
    this._sub();
  }
  get hass() { return super.hass; }
  watched() { const c = this._config; return this._err ? [] : [c.entity, c.temperature_entity, "sun.sun"].filter(Boolean); }
  _type() { return this._config.forecast_type || "daily"; }
  _days() { return Math.max(1, Math.min(12, Math.round(+this._config.days) || 5)); }
  connectedCallback() { super.connectedCallback(); this._sub(); this._arm(); }
  disconnectedCallback() { super.disconnectedCallback(); this._unsub(); clearTimeout(this._tick); this._tick = null; }
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
    .w.cs-big .time{font-size:6.6rem}
    .w.cs-huge{container-type:inline-size}
    .w.cs-huge .time{font-size:clamp(4.4rem,24cqi,12rem)}
    .w.cs-big .date,.w.cs-huge .date{font-size:1.05rem}
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
    const cs = c.clock && (c.clock_size === "big" || c.clock_size === "huge") ? " cs-" + c.clock_size : "";
    const {root, face} = this.paper(c.entity, {cls: "press", face: "w" + cs});
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
      cond.append(el("div", "word disp", off ? "No data" : conditionWord(s.state)));
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
