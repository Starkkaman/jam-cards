/* ---------- jam-tile: entity block with status stripe ----------
   {type: custom:jam-tile, entity, name?, label?, control?: auto|toggle|lock|press|none, tones?: {state: on|alert|calm|off},
    tap_action?, hold_action?, double_tap_action?, show_last_changed?}
   control auto: lock.* -> lock, button./input_button. -> press, on/off toggleable entities -> toggle. */
class JamTile extends JamBase {
  validate(c) { if (!c.entity) throw new Error("jam-tile: entity is required"); }
  watched() { return [this._config.entity]; }
  css() { return `
    .tile{--p-r:12px;display:grid;gap:4px;min-height:78px;align-content:center}
    .row{display:flex;flex-wrap:wrap;gap:8px 12px;justify-content:space-between;align-items:center}
    .main{flex:1 1 0;max-width:100%}
    .name{font:600 .74rem/1.2 var(--body);letter-spacing:.14em;text-transform:uppercase;color:var(--dim);overflow-wrap:anywhere}
    .val{font-family:var(--display);font-weight:900;font-size:1.7rem;line-height:.95;text-transform:uppercase;overflow-wrap:break-word}
    .sw{flex:none;min-width:64px}
    .sub{color:var(--dim);font-size:.8rem}`; }
  _control(s) {
    const c = this._config, d = c.entity.split(".")[0], ctl = c.control || "auto";
    if (ctl !== "auto") return ctl;
    if (d === "lock") return "lock";
    if (d === "button" || d === "input_button") return "press";
    return toggleable(c.entity) && s && (s.state === "on" || s.state === "off") ? "toggle" : "none";
  }
  _key(s) {
    const c = this._config, h = this._hass, d = c.entity.split(".")[0], ctl = this._control(s);
    if (!s) return null;
    const k = `jam-tile|${c.entity}|key`;
    let key, call;
    if (ctl === "toggle") {
      const on = s.state === "on";
      key = cutKey(on ? "On" : "Off", k, "sw" + (on ? " on" : ""));
      key.setAttribute("aria-pressed", on ? "true" : "false");
      call = () => h.callService("homeassistant", "toggle", {entity_id: c.entity});
    } else if (ctl === "lock") {
      const locked = s.state === "locked";
      key = cutKey(locked ? "Unlock" : "Lock", k, "sw" + (s.state === "jammed" ? " alert" : ""));
      call = () => h.callService("lock", locked ? "unlock" : "lock", {entity_id: c.entity});
    } else if (ctl === "press") {
      key = cutKey("Press", k, "sw");
      call = () => h.callService(d, "press", {entity_id: c.entity});
    } else return null;
    if (ctl !== "toggle") key.disabled = UNAVAILABLE.has(s.state);
    key.onclick = e => { e.stopPropagation(); call(); };
    return key;
  }
  render(b) {
    const c = this._config, h = this._hass, s = stateObj(h, c.entity);
    const t = tone(s, c.tones);
    const {root, face} = this.paper(c.entity, {cls: "press", face: `tile stripe s-${t}${!s || UNAVAILABLE.has(s.state) ? " unavail" : ""}`});
    root.tabIndex = 0; root.setAttribute("role", "button");
    bindActions(root, () => this._hass, c, c.entity);
    const row = el("div", "row");
    const left = el("div", "main"); /* basis 0: the key wraps below only when the longest value word needs the room */
    left.append(el("div", "name", c.name || friendly(h, c.entity)));
    left.append(el("div", `val num c-${t === "off" ? "dim" : t}`, c.label || fmtState(h, s)));
    row.append(left);
    const key = this._key(s);
    if (key) row.append(key);
    face.append(row);
    if (c.show_last_changed && s) face.append(el("div", "sub num", new Date(s.last_changed).toLocaleString([], {hour: "2-digit", minute: "2-digit", month: "short", day: "numeric"})));
    b.append(root);
  }
  getGridOptions() { return {columns: 6, rows: "auto", min_columns: 3}; }
}
register("jam-tile", JamTile, "Jam Tile", "Any entity with a coloured status stripe and an optional on/off, lock or press key.");
