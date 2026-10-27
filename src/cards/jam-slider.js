/* ---------- jam-slider: cut paper strip for number / input_number / light brightness / media volume / fan speed ----------
   {type: custom:jam-slider, entity, name?, min?, max?, step?} */
class JamSlider extends JamBase {
  validate(c) { if (!c.entity) throw new Error("jam-slider: entity is required"); }
  watched() { return [this._config.entity]; }
  css() { return `
    .wrap{display:grid;gap:10px;align-content:start}
    .row{display:flex;justify-content:space-between;align-items:baseline;gap:10px}
    .v{font-family:var(--display);font-weight:900;font-size:1.7rem;line-height:1}
    .track{position:relative;height:32px;cursor:pointer;touch-action:none}
    .strip{position:absolute;inset:0;background:var(--line)}
    .fill{position:absolute;inset:0 auto 0 0;background:var(--ochre)}
    .track:focus-visible{outline:3px solid var(--ochre);outline-offset:2px}`; }
  _model() {
    const c = this._config, s = stateObj(this._hass, c.entity), d = c.entity.split(".")[0];
    if (!s) return null;
    const a = s.attributes;
    if (d === "light") return {d, min: 0, max: 100, step: 1, v: s.state === "on" ? Math.round((a.brightness || 0) / 2.55) : 0, unit: "%"};
    if (d === "media_player") return {d, min: 0, max: 100, step: 1, v: Math.round((a.volume_level || 0) * 100), unit: "%"};
    if (d === "fan") return {d, min: 0, max: 100, step: a.percentage_step || 1, v: s.state === "on" ? Math.round(a.percentage || 0) : 0, unit: "%", int: true};
    return {d, min: c.min ?? a.min ?? 0, max: c.max ?? a.max ?? 100, step: c.step ?? a.step ?? 1, v: Number(s.state), unit: a.unit_of_measurement || ""};
  }
  _send(v) {
    const c = this._config, h = this._hass, m = this._model();
    if (!m) return;
    if (m.d === "light") h.callService("light", "turn_on", {entity_id: c.entity, brightness_pct: v});
    else if (m.d === "media_player") h.callService("media_player", "volume_set", {entity_id: c.entity, volume_level: v / 100});
    else if (m.d === "fan") h.callService("fan", "set_percentage", {entity_id: c.entity, percentage: v});
    else h.callService(m.d, "set_value", {entity_id: c.entity, value: v});
  }
  render(b) {
    const c = this._config, h = this._hass, m = this._model();
    const {root, face: wrap} = this.paper(c.entity, {edges: "rb", face: `wrap stripe s-${m && !isNaN(m.v) ? (m.v > m.min ? "on" : "off") : "alert"}`});
    const row = el("div", "row");
    row.append(el("div", "label", c.name || friendly(h, c.entity)));
    const val = el("div", "v num", m && !isNaN(m.v) ? `${m.v}${m.unit ? " " + m.unit : ""}` : "—");
    row.append(val); wrap.append(row);
    const sd = seed("jam-slider|" + c.entity);
    const track = el("div", "track"), strip = el("div", "strip"), fill = el("div", "fill");
    strip.style.clipPath = tornPath(sd + 3, {edges: "tb", depth: 3, step: 5});
    fill.style.clipPath = tornPath(sd + 5, {edges: "r", depth: 9, step: 12});
    strip.append(fill); track.append(strip); wrap.append(track); b.append(root);
    if (!m || isNaN(m.v)) return;
    const pct = v => Math.max(0, Math.min(100, ((v - m.min) / ((m.max - m.min) || 1)) * 100));
    fill.style.width = pct(m.v) + "%";
    track.tabIndex = 0; track.setAttribute("role", "slider");
    track.setAttribute("aria-valuemin", m.min); track.setAttribute("aria-valuemax", m.max); track.setAttribute("aria-valuenow", m.v);
    const snap = x => Math.round((m.min + x * (m.max - m.min)) / m.step) * m.step;
    let cur = m.v;
    const at = e => { const r = track.getBoundingClientRect(); return Math.max(0, Math.min(1, (e.clientX - r.left) / r.width)); };
    const show = v => {
      cur = m.int ? Math.round(v) : Number(v.toFixed(6));
      fill.style.width = pct(cur) + "%"; val.textContent = `${cur}${m.unit ? " " + m.unit : ""}`;
      track.setAttribute("aria-valuenow", cur);
    };
    track.onpointerdown = e => { track.setPointerCapture(e.pointerId); show(snap(at(e))); track.dataset.drag = "1"; };
    track.onpointermove = e => { if (track.dataset.drag) show(snap(at(e))); };
    track.onpointerup = e => { if (!track.dataset.drag) return; delete track.dataset.drag; show(snap(at(e))); this._send(cur); };
    track.onkeydown = e => {
      const k = {ArrowRight: 1, ArrowUp: 1, ArrowLeft: -1, ArrowDown: -1}[e.key];
      if (!k) return; e.preventDefault();
      show(Math.max(m.min, Math.min(m.max, cur + k * m.step))); this._send(cur);
    };
  }
}
register("jam-slider", JamSlider, "Jam Slider", "Cut paper strip for numbers, light brightness, media volume or fan speed.");
