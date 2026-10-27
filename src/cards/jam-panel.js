/* ---------- jam-panel: compact system panel for the desktop control room ----------
   {type: custom:jam-panel, title, accent?, rows: [{entity, name?, attribute?, max?, format?: pct|temp|bytes_rate|duration|relative,
    bad?: {above?, below?, state?: [..]}, tap_action?}]}
   Slab panel (card cut), Londrina title, rows split by 2px --jam-line rules: name left (Jost .8rem), value right (Londrina 1rem).
   Values are never in the accent colour. A row is red when its value crosses a `bad` threshold, its state is listed in
   bad.state, or the entity is unavailable/unknown/missing (value "unavailable"). `max` shows "value / max unit".
   Row tap = more-info unless tap_action says otherwise. */
const JP_RATE = {"bit/s": 1 / 8, "kbit/s": 125, "mbit/s": 125e3, "gbit/s": 125e6, "b/s": 1, "kb/s": 1e3, "mb/s": 1e6, "gb/s": 1e9,
  "kib/s": 1024, "mib/s": 1048576, "gib/s": 1073741824};
const JP_SEC = {s: 1, sec: 1, min: 60, h: 3600, hr: 3600, d: 86400, ms: .001, w: 604800};
const JP_ISO = /^\d{4}-\d\d-\d\dT\d\d:\d\d/;
function jpNum(v) { const n = typeof v === "number" ? v : parseFloat(v); return isFinite(n) ? n : null; }
/* Short number: one decimal below 10, whole numbers from 10. */
function jpShort(n) { return Math.abs(n) >= 10 ? String(Math.round(n)) : String(+n.toFixed(1)); }
function jpRate(n, unit) {
  const f = JP_RATE[String(unit || "B/s").toLowerCase()];
  if (f === undefined) return `${jpShort(n)} ${unit}`;
  let b = n * f; const U = ["B/s", "kB/s", "MB/s", "GB/s"]; let i = 0;
  while (Math.abs(b) >= 1000 && i < U.length - 1) { b /= 1000; i++; }
  return `${jpShort(b)} ${U[i]}`;
}
function jpDur(sec) {
  const s = Math.max(0, Math.round(sec)), d = Math.floor(s / 86400), h = Math.floor(s % 86400 / 3600), m = Math.floor(s % 3600 / 60);
  if (d) return h ? `${d} d ${h} h` : `${d} d`;
  if (h) return m ? `${h} h ${m} m` : `${h} h`;
  return m ? `${m} m` : `${s} s`;
}
function jpRel(iso) {
  const t = Date.parse(iso);
  if (isNaN(t)) return String(iso);
  const sec = (t - Date.now()) / 1000, a = Math.abs(sec);
  const [n, u] = a < 60 ? [sec, "second"] : a < 3600 ? [sec / 60, "minute"] : a < 86400 ? [sec / 3600, "hour"] : [sec / 86400, "day"];
  try { return new Intl.RelativeTimeFormat(undefined, {numeric: "auto"}).format(Math.round(n), u); } catch (e) { return String(iso); }
}
class JamPanel extends JamBase {
  validate(c) { if (!Array.isArray(c.rows) || !c.rows.length) throw new Error("jam-panel: rows is required"); }
  _rows() { return this._config.rows.map(r => (typeof r === "string" ? {entity: r} : r)).filter(r => r && r.entity); }
  watched() { return this._rows().map(r => r.entity); }
  css() { return `
    .pn{display:flex;flex-direction:column}
    .ttl{font-size:1.1rem;margin:0 0 7px}
    .row{display:flex;align-items:baseline;justify-content:space-between;gap:10px;border-top:2px solid var(--line);padding:6px 0;cursor:pointer}
    .row.static{cursor:default}
    .nm{flex:1 1 auto;min-width:0;font:500 .8rem/1.3 var(--body);overflow-wrap:anywhere}
    .v{flex:0 1 auto;min-width:0;text-align:right;font:900 1rem/1.1 var(--display);text-transform:uppercase;color:var(--fg);overflow-wrap:break-word}
    .row.bad .v{color:var(--red)}`; }
  /* -> {text, raw (number|null), unavail} for one row. */
  value(r) {
    const s = stateObj(this._hass, r.entity);
    if (!s || (!r.attribute && UNAVAILABLE.has(s.state))) return {text: "unavailable", raw: null, unavail: true};
    const v = r.attribute ? s.attributes[r.attribute] : s.state;
    if (v === undefined || v === null) return {text: "unavailable", raw: null, unavail: true};
    const unit = r.attribute ? "" : s.attributes.unit_of_measurement || "", n = jpNum(v), str = String(v);
    let text;
    switch (r.format) {
      case "pct": text = n === null ? str : `${Math.round(n)}%`; break;
      case "temp": text = n === null ? str : `${Math.round(n)}${unit || "°"}`; break;
      case "bytes_rate": text = n === null ? str : jpRate(n, unit || "B/s"); break;
      case "duration":
        if (JP_ISO.test(str) && !isNaN(Date.parse(str))) text = jpDur((Date.now() - Date.parse(str)) / 1000);
        else text = n === null ? str : jpDur(n * (JP_SEC[String(unit || "s").toLowerCase()] || 1));
        break;
      case "relative": text = jpRel(str); break;
      default:
        if (JP_ISO.test(str) && !isNaN(Date.parse(str))) text = jpRel(str);
        else if (r.attribute) text = n === null ? str : jpShort(n);
        else text = fmtState(this._hass, s);
    }
    if (r.max !== undefined && n !== null) text = `${jpShort(n)} / ${r.max}${unit ? " " + unit : ""}`;
    return {text, raw: n, unavail: false};
  }
  isBad(r, v) {
    const b = r.bad;
    if (v.unavail) return true;
    if (!b) return false;
    if (v.raw !== null && ((b.above !== undefined && v.raw > +b.above) || (b.below !== undefined && v.raw < +b.below))) return true;
    if (Array.isArray(b.state)) {
      const s = stateObj(this._hass, r.entity), cur = String(r.attribute ? s.attributes[r.attribute] : s.state).toLowerCase();
      if (b.state.some(x => String(x).toLowerCase() === cur)) return true;
    }
    return false;
  }
  render(b) {
    const c = this._config, h = this._hass;
    const {root, face} = this.paper(c.title || "panel", {face: "pn"});
    if (c.title) face.append(el("h3", "disp ttl", c.title));
    for (const r of this._rows()) {
      const v = this.value(r), bad = this.isBad(r, v), act = r.tap_action || {action: "more-info"};
      const row = el("div", "row" + (bad ? " bad" : ""));
      row.dataset.entity = r.entity;
      if (act.action === "none") row.classList.add("static");
      else { row.classList.add("focusable"); row.tabIndex = 0; row.setAttribute("role", "button"); bindActions(row, () => this._hass, {tap_action: act}, r.entity); }
      row.append(el("span", "nm", r.name || friendly(h, r.entity)), el("span", "v num", v.text));
      face.append(row);
    }
    b.append(root);
  }
  getCardSize() { return 1 + Math.ceil(this._rows().length * .6); }
  getGridOptions() { return {columns: 6, rows: "auto", min_columns: 3}; }
}
register("jam-panel", JamPanel, "Jam Panel", "Compact system panel: rows of name / value with bad thresholds in red (control room).");
