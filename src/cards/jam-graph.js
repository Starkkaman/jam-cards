/* ---------- jam-graph: history chart from the recorder (line / step / bars), 1-5 series ----------
   {type: custom:jam-graph, title?, entities: [id | {entity, name?}] (1-5), hours_to_show? (24), style?: line|step|bars,
    show_current? (true), min?, max?, refresh_minutes? (5)}
   One history/history_during_period WS call for all entities. Numeric states only, unavailable dropped, ≤240 points per
   series (bucket mean; bars = time-weighted mean per hour). Refetch every refresh_minutes and when a watched state changes,
   at most once a minute for the same query. One y-axis, series colours --s1..--s5 in order, text never in series colour.
   Config errors (e.g. a 6th series) render in the card instead of throwing. */
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
    .tip{position:absolute;top:0;background:var(--slab2);color:var(--fg);padding:6px 9px;box-shadow:3px 3px 0 var(--shadow);
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
        const cur = el("button", "cur num", num ? this._num(e.entity, v) : fmtState(h, s));
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
