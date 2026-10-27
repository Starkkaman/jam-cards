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
