/* ---------- jam-list: one paper sheet of entity rows (replaces entities) ----------
   {type: custom:jam-list, title?, entities: [entity_id | {entity, name?, secondary_info?: last-changed|none}], state_color?: true,
    accent? (ON keys and "on" values; DESIGN "Colour system")}
   Row tap = more-info. Toggleable on/off rows get an ON/OFF pill (chip cut); device_tracker/person home/not_home = HOME/AWAY;
   ISO timestamps (uptime, last boot) read as relative time. */
function jlRel(iso) {
  const t = Date.parse(iso);
  if (isNaN(t)) return iso;
  const sec = (t - Date.now()) / 1000, a = Math.abs(sec);
  const [n, u] = a < 60 ? [sec, "second"] : a < 3600 ? [sec / 60, "minute"] : a < 86400 ? [sec / 3600, "hour"] : [sec / 86400, "day"];
  try { return new Intl.RelativeTimeFormat(undefined, {numeric: "auto"}).format(Math.round(n), u); } catch (e) { return iso; }
}
class JamList extends JamBase {
  validate(c) { if (!Array.isArray(c.entities) || !c.entities.length) throw new Error("jam-list: entities is required"); }
  _rows() { return this._config.entities.map(e => (typeof e === "string" ? {entity: e} : e)).filter(r => r && r.entity); }
  watched() { return this._rows().map(r => r.entity); }
  css() { return `
    .sheet{display:grid;align-content:start}
    .ttl{font-size:1.6rem;margin:0 0 6px}
    .row{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:9px 0;min-height:48px;cursor:pointer}
    .row + .row{border-top:2px solid var(--line)}
    .nm{flex:1 1 auto;min-width:0;font:500 .95rem/1.25 var(--body);overflow-wrap:anywhere}
    .sub{display:block;font-size:.75rem;color:var(--dim)}
    .v{flex:0 1 auto;min-width:0;text-align:right;font-family:var(--display);font-weight:900;font-size:1.35rem;line-height:1;
      text-transform:uppercase;overflow-wrap:break-word}
    .sw{flex:none;min-width:58px}`; }
  _val(s) {
    const st = s.state, d = s.entity_id.split(".")[0];
    if ((d === "device_tracker" || d === "person") && (st === "home" || st === "not_home")) return st === "home" ? "Home" : "Away";
    if (/^\d{4}-\d\d-\d\dT\d\d:\d\d/.test(st) && !isNaN(Date.parse(st))) return jlRel(st);
    return fmtState(this._hass, s);
  }
  render(b) {
    const c = this._config, h = this._hass, rows = this._rows();
    const {root, face} = this.paper(c.title || rows[0].entity, {face: "sheet"});
    if (c.title) face.append(el("h2", "disp ttl", c.title));
    for (const r of rows) {
      const s = stateObj(h, r.entity), row = el("div", "row focusable");
      row.tabIndex = 0; row.setAttribute("role", "button");
      bindActions(row, () => this._hass, {tap_action: {action: "more-info"}}, r.entity);
      const nm = el("div", "nm", r.name || friendly(h, r.entity));
      if (r.secondary_info === "last-changed" && s) nm.append(el("span", "sub num", jlRel(s.last_changed)));
      row.append(nm);
      if (s && toggleable(r.entity) && (s.state === "on" || s.state === "off")) {
        const on = s.state === "on", key = cutKey(on ? "On" : "Off", `jam-list|${r.entity}|key`, "sw" + (on ? " on" : ""), "chip");
        key.setAttribute("aria-pressed", on ? "true" : "false");
        key.setAttribute("aria-label", `${r.name || friendly(h, r.entity)}: ${on ? "on" : "off"}`);
        key.onclick = e => { e.stopPropagation(); this._hass.callService("homeassistant", "toggle", {entity_id: r.entity}); };
        row.append(key);
      } else {
        const t = tone(s);
        const v = el("div", "v num" + (c.state_color === false ? "" : ` c-${t === "off" ? "dim" : t}`), s ? this._val(s) : "—");
        if (s) keepUnit(v, s);
        if (!s || UNAVAILABLE.has(s.state)) row.classList.add("unavail");
        row.append(v);
      }
      face.append(row);
    }
    b.append(root);
  }
  getCardSize() { return 1 + this._rows().length; }
}
register("jam-list", JamList, "Jam List", "Paper sheet of entity rows with ON/OFF keys for switchable rows (replaces entities).");
