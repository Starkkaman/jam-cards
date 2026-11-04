/* ---------- jam-ridge: stacked ridgelines of recorder history (designed for the Pulsar look, drawn in every look) ----------
   {type: custom:jam-ridge, title?, entities: [ids | {entity, name?}] (1-8), hours_to_show? (24), refresh_minutes? (5),
    accent? (title rule)}
   One row per entity: its name at the left (the column as wide as the longest name, at most 30%), its history as one
   ridge line over the window (each on its own scale, min..max of the window, so the shape reads, not the level; peaks rise
   a quarter row into the row above, Unknown Pleasures), the current value at the right. Lines in the text colour, no fill: a ridge in
   front hides the parts of the ridges behind it through SVG masks, so the card face shows through on any look. Static:
   drawn when history arrives or the width changes, never animated. One history/history_during_period WS call for all
   entities (jam-graph's query and point preparation), refetched every refresh_minutes and when a watched state changes,
   at most once a minute. An unavailable sensor reads "Offline" over a dashed baseline. The one row whose current value is
   furthest outside its window's earlier range is drawn in the accent (the card's one emphasis). Row tap = more-info; each
   row says its range (and "above / below its range") in words for screen readers. */
const RG_ROW = 48, RG_AMP = 1.25, RG_NS = "http://www.w3.org/2000/svg";
let RG_UID = 0;
function rgSvg(tag, attrs) { const e = document.createElementNS(RG_NS, tag); for (const k in attrs) e.setAttribute(k, attrs[k]); return e; }
class JamRidge extends JamBase {
  constructor() { super(); this._data = null; this._last = 0; this._tok = 0; this._uid = "rg" + (++RG_UID); }
  validate(c) {
    const l = c.entities;
    if (!Array.isArray(l) || !l.length) throw new Error("jam-ridge: entities is required (1-8 sensors)");
    if (l.length > 8) throw new Error(`jam-ridge: ${l.length} entities, max 8`);
    if (!l.every(x => typeof (typeof x === "string" ? x : x && x.entity) === "string")) throw new Error("jam-ridge: each entity is an id or {entity, name}");
    if (c.hours_to_show !== undefined && !(+c.hours_to_show > 0)) throw new Error("jam-ridge: hours_to_show is a positive number");
  }
  _items() { return this._config.entities.map(x => (typeof x === "string" ? {entity: x} : x)); }
  watched() { return this._items().map(x => x.entity); }
  _hours() { return +this._config.hours_to_show > 0 ? +this._config.hours_to_show : 24; }
  _every() { return Math.max(1, +this._config.refresh_minutes || 5) * 60e3; }
  setConfig(c) {
    const q = JSON.stringify([(c.entities || []).map(x => (typeof x === "string" ? x : x && x.entity)), c.hours_to_show]);
    if (q !== this._q) { this._q = q; this._data = null; this._tok++; this._last = 0; }
    super.setConfig(c);
    if (this.isConnected) { this._arm(); this._kick(); }
  }
  set hass(h) {
    const first = !this._hass, before = this._sig;
    super.hass = h;
    if (first || this._sig !== before) this._kick();
  }
  get hass() { return super.hass; }
  connectedCallback() {
    super.connectedCallback();
    if (!this._ro && window.ResizeObserver) this._ro = new ResizeObserver(() => this._draw());
    if (this._ro) this._ro.observe(this);
    this._arm();
    if (!this._data || Date.now() - this._last > this._every()) this._kick();
  }
  disconnectedCallback() {
    super.disconnectedCallback();
    clearInterval(this._iv); this._iv = null;
    clearTimeout(this._pending); this._pending = null;
    if (this._ro) this._ro.disconnect();
  }
  _arm() { clearInterval(this._iv); this._iv = null; if (this._config) this._iv = setInterval(() => this._kick(), this._every()); }
  _kick() {
    if (!this._hass || !this._config || !this.isConnected) return;
    const wait = this._last + JAM_GRAPH_GAP - Date.now();
    if (wait <= 0) { clearTimeout(this._pending); this._pending = null; this._fetch(); return; }
    if (!this._pending) this._pending = setTimeout(() => { this._pending = null; this._kick(); }, wait);
  }
  async _fetch() {
    const ids = this.watched(), tok = ++this._tok, t1 = Date.now(), t0 = t1 - this._hours() * 3600e3;
    this._last = t1;
    let res = null;
    try {
      if (typeof this._hass.callWS !== "function") throw new Error("no callWS");
      res = await this._hass.callWS({type: "history/history_during_period", start_time: new Date(t0).toISOString(), end_time: new Date(t1).toISOString(),
        entity_ids: ids, minimal_response: true, no_attributes: true, significant_changes_only: false});
    } catch (e) { res = null; }
    if (tok !== this._tok) return;
    this._data = {t0, t1, series: ids.map(id => JamGraph.prep(res && res[id], t0, t1, "line", this._hours()))};
    this._sig = null; this._render(false);
  }
  css() { return `
    .rg{display:grid;gap:8px;align-content:start}
    .hd{display:flex;align-items:baseline;justify-content:space-between;gap:12px}
    .ttl{font-size:calc(1.6rem * var(--disp-scale));margin:0;min-width:0;overflow-wrap:anywhere}
    .rule{height:var(--rule-h);background:var(--acc)}
    /* one column set for every row (subgrid): the label column is as wide as the longest name, at most 30% */
    .rows{position:relative;display:grid;grid-template-columns:fit-content(30%) minmax(0,1fr) 5.4rem;column-gap:12px;
      padding-top:${Math.round(RG_ROW * (RG_AMP - 1)) + 6}px}
    .row,.ax{grid-column:1/-1;display:grid;grid-template-columns:subgrid}
    @supports not (grid-template-columns:subgrid){.row,.ax{grid-template-columns:minmax(64px,28%) minmax(0,1fr) 5.4rem;column-gap:12px}}
    .row{position:relative;align-items:end;
      height:${RG_ROW}px;padding:0 0 4px;text-align:left;color:var(--fg)}
    .nm{display:flex;align-items:center;gap:6px;min-width:0;font:var(--lbl-w) max(12px,.74rem)/1.2 var(--body);letter-spacing:calc(.12em * var(--lbl-track));
      text-transform:var(--lbl-case);color:var(--fg)}
    .nm > span:last-child{min-width:0;overflow:hidden;overflow-wrap:anywhere;display:-webkit-box;-webkit-box-orient:vertical;-webkit-line-clamp:2}
    .v{font-family:var(--num-font,var(--display));font-weight:var(--disp-w);font-size:calc(1.15rem * var(--num-scale,var(--disp-scale)));line-height:1;
      text-align:right;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;font-variant-numeric:tabular-nums}
    .v .unit{font:500 max(12px,.7rem) var(--body);margin-left:2px}
    .v.na{color:var(--dim)}
    .plot{position:absolute;top:0;bottom:0;pointer-events:none;overflow:visible}
    .plot path{fill:none;stroke:var(--fg);stroke-width:var(--rg-w,1.5px);stroke-linejoin:round;vector-effect:non-scaling-stroke}
    .plot path.base{stroke:var(--line)}
    .plot path.flat{stroke:var(--dim)}
    .plot path.off{stroke:var(--dim);stroke-dasharray:4 4}
    .plot path.hot{stroke:var(--acc);stroke-width:calc(var(--rg-w,1.5px) + .5px)}
    .ax > span{grid-column:2;display:flex;justify-content:space-between}
    .ax .label{font-size:max(12px,.66rem)}
    .row:hover .nm > span:last-child{text-decoration:underline;text-underline-offset:3px}`; }
  render(b) {
    const c = this._config, h = this._hass, items = this._items();
    const {root, face} = this.paper(items[0].entity, {face: "rg"});
    const hd = el("div", "hd");
    hd.append(el("h2", "disp ttl", c.title || "History"), el("span", "label", `${this._hours()} h`));
    face.append(hd, el("div", "rule"));
    const rows = el("div", "rows");
    const plot = rgSvg("svg", {class: "plot", "aria-hidden": "true"});
    rows.append(plot);
    const data = this._data, hot = this._hot = this._outside(items);
    this._rows = items.map((x, i) => {
      const s = stateObj(h, x.entity), nm = x.name || friendly(h, x.entity), na = !s || UNAVAILABLE.has(s.state) || !isFinite(Number(s.state));
      const row = el("button", "row");
      row.dataset.entity = x.entity; row.dataset.jamName = nm;
      const lab = el("span", "nm");
      lab.append(el("span", "", nm));
      const v = el("span", "v num" + (na ? " na" : ""), na ? "Offline" : fmtState(h, s));
      if (!na) keepUnit(v, s);
      row.append(lab, el("span", "sp"), v);
      const pts = data ? data.series[i] : null, vals = pts ? pts.map(p => p[1]).filter(y => y !== null) : [];
      const u = s && s.attributes && s.attributes.unit_of_measurement ? " " + s.attributes.unit_of_measurement : "";
      const rng = vals.length ? `, ${this._hours()} h range ${+Math.min(...vals).toFixed(2)} to ${+Math.max(...vals).toFixed(2)}${u}` : "";
      const out = hot && hot.i === i ? `, ${hot.dir} its ${this._hours()} h range` : "";
      row.setAttribute("aria-label", `${nm}, ${v.textContent}${rng}${out}`);
      if (na) row.classList.add("na");
      row.onclick = () => moreInfo(this, x.entity);
      rows.append(row);
      return row;
    });
    const ax = el("div", "ax");
    ax.setAttribute("aria-hidden", "true");
    const ends = el("span");
    ends.append(el("span", "label", `${this._hours()} h ago`), el("span", "label", "now"));
    ax.append(ends);
    rows.append(ax);
    face.append(rows);
    b.append(root);
    this._plot = plot; this._rowsBox = rows; this._w = -1;
    this._draw();
  }
  /* The one row whose current value lies furthest outside the range of its window before the last hour (or the last 5 %
     of the window, whichever is longer): {i, dir: "above" | "below"}, or null. Its ridge is the card's one emphasis (the
     accent; Pulsar's warm colour). */
  _outside(items) {
    const data = this._data, h = this._hass;
    if (!data) return null;
    const cut = data.t1 - Math.max(3600e3, (data.t1 - data.t0) * .05);
    let best = null;
    items.forEach((x, i) => {
      const s = stateObj(h, x.entity), cur = s ? Number(s.state) : NaN, before = (data.series[i] || []).filter(p => p[1] !== null && p[0] < cut).map(p => p[1]);
      if (!isFinite(cur) || s.state === "" || before.length < 2) return;
      const lo = Math.min(...before), hi = Math.max(...before), span = hi - lo || 1, ex = cur > hi ? (cur - hi) / span : cur < lo ? (lo - cur) / span : 0;
      if (ex > 0 && (!best || ex > best.ex)) best = {i, ex, dir: cur > hi ? "above" : "below"};
    });
    return best;
  }
  /* Ridges in the middle column, back (top row) to front (bottom row); each line is masked by the areas under the ridges in
     front of it, so nothing is filled and the face shows through. Redrawn only when the column width changes. */
  _draw() {
    const plot = this._plot, rows = this._rowsBox, data = this._data;
    if (!plot || !plot.isConnected || !this._rows.length) return;
    const sp = this._rows[0].querySelector(".sp"), rb = rows.getBoundingClientRect(), sb = sp.getBoundingClientRect();
    const W = Math.round(sb.width), H = Math.round(rb.height);
    if (!W || (W === this._w && H === this._h)) return;
    this._w = W; this._h = H;
    plot.style.left = (sb.left - rb.left) + "px"; plot.style.width = W + "px";
    plot.setAttribute("width", W); plot.setAttribute("height", H); plot.setAttribute("viewBox", `0 0 ${W} ${H}`);
    plot.textContent = "";
    if (!data) return;
    const amp = RG_ROW * RG_AMP - 8, x = t => (t - data.t0) / (data.t1 - data.t0) * W, f = v => v.toFixed(1);
    const shapes = this._rows.map((row, i) => {
      const base = row.offsetTop + RG_ROW - 8, pts = (data.series[i] || []).filter(p => p[1] !== null);
      const off = row.classList.contains("na");
      if (pts.length < 2 || off) return {base, line: `M0 ${base}H${W}`, area: `M0 ${base}H${W}V${base + 2}H0Z`, flat: true, off};
      const ys = pts.map(p => p[1]), lo = Math.min(...ys), hi = Math.max(...ys), span = hi - lo;
      const y = v => base - (span > 0 ? (v - lo) / span : .5) * amp;
      const line = "M" + pts.map(p => `${f(x(p[0]))} ${f(y(p[1]))}`).join("L");
      return {base, line, area: `${line}V${base + 2}H${f(x(pts[0][0]))}Z`, flat: span <= 0};
    });
    const defs = rgSvg("defs", {});
    plot.append(defs);
    shapes.forEach((s, i) => {
      const id = `${this._uid}m${i}`, m = rgSvg("mask", {id, maskUnits: "userSpaceOnUse", x: -4, y: -4, width: W + 8, height: H + 8});
      m.append(rgSvg("rect", {x: -4, y: -4, width: W + 8, height: H + 8, fill: "white"}));
      for (let j = i + 1; j < shapes.length; j++) m.append(rgSvg("path", {d: shapes[j].area, fill: "black", stroke: "black", "stroke-width": 3}));
      defs.append(m);
      plot.append(rgSvg("path", {d: `M0 ${s.base}H${W}`, class: "base", mask: `url(#${id})`}));
      const hot = this._hot && this._hot.i === i;
      plot.append(rgSvg("path", {d: s.line, class: s.off ? "off" : s.flat ? "flat" : hot ? "hot" : "", mask: `url(#${id})`}));
    });
  }
  getCardSize() { return 2 + this._items().length; }
  getGridOptions() { return {columns: 12, rows: "auto", min_columns: 6}; }
}
register("jam-ridge", JamRidge, "Jam Ridge", "Stacked ridgelines of recorder history for 1-8 sensors, with the current values.");
