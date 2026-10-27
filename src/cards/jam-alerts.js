/* ---------- jam-alerts: automations & alerts panel for the desktop control room ----------
   {type: custom:jam-alerts, title? ("Automations & alerts"), accent?, automations?: [automation ids] | auto: true (every
    automation.* in hass.states), limit? (6, applies to auto), watch?: [entity ids that should never be unavailable/unknown],
    show_unavailable_count? (true)}
   Same panel look as jam-panel. Automation rows sorted by attributes.last_triggered, newest first: "ran 21:40" today
   (hass.locale.time_format), "ran Mon" this week, "ran Jun 19" older, "never"; an automation that is off reads dim "off".
   Watched entities read their state, red "unavailable" when unavailable/unknown/missing. The count row "N unavailable"
   counts every unavailable entity except the update/button/scene/event domains (no tap). Header: red count chip of the
   failures (watched entities + automations that are unavailable). Row tap = more-info. */
const JA_SKIP = new Set(["update", "button", "scene", "event"]);
/* HA time format (hass.locale.time_format): "12" | "24" force it; "language"/"system" let Intl decide. -> {loc, h12}. */
function jaTime(h) {
  const l = h && h.locale, tf = l && l.time_format;
  const loc = tf === "system" ? undefined : (l && l.language) || (h && h.language) || undefined;
  if (tf === "12" || tf === "24") return {loc, h12: tf === "12"};
  let h12;
  try { const o = new Intl.DateTimeFormat(loc, {hour: "numeric"}).resolvedOptions(); h12 = o.hourCycle ? /h1[12]/.test(o.hourCycle) : !!o.hour12; } catch (e) { h12 = false; }
  return {loc, h12};
}
/* "21:40" / "9:40 PM" today, weekday within 6 days, else "Jun 19" (with the year when it is not this year). */
function jaWhen(h, iso, now = new Date()) {
  const t = Date.parse(iso);
  if (!iso || isNaN(t)) return null;
  const d = new Date(t), f = jaTime(h), day = x => new Date(x.getFullYear(), x.getMonth(), x.getDate()).getTime();
  const days = Math.round((day(now) - day(d)) / 86400e3);
  try {
    if (days <= 0) return d.toLocaleTimeString(f.loc, {hour: f.h12 ? "numeric" : "2-digit", minute: "2-digit", hour12: f.h12});
    if (days < 7) return d.toLocaleDateString(f.loc, {weekday: "short"});
    return d.toLocaleDateString(f.loc, d.getFullYear() === now.getFullYear() ? {month: "short", day: "numeric"} : {month: "short", day: "numeric", year: "numeric"});
  } catch (e) { return d.toISOString().slice(0, 10); }
}
function jaCountUnavailable(states) {
  let n = 0;
  for (const id in states) if (states[id].state === "unavailable" && !JA_SKIP.has(id.split(".")[0])) n++;
  return n;
}
class JamAlerts extends JamBase {
  validate(c) {
    if (c.automations !== undefined && !Array.isArray(c.automations)) throw new Error("jam-alerts: automations must be a list");
    if (c.watch !== undefined && !Array.isArray(c.watch)) throw new Error("jam-alerts: watch must be a list");
  }
  _autos() {
    const c = this._config, h = this._hass, st = (h && h.states) || {};
    const ids = c.auto ? Object.keys(st).filter(id => id.startsWith("automation.")) : (c.automations || []);
    const t = id => { const s = st[id], v = s && Date.parse(s.attributes.last_triggered); return isNaN(v) || v === undefined ? -Infinity : v; };
    const out = ids.map(id => [id, t(id)]).sort((a, b) => b[1] - a[1] || (a[0] < b[0] ? -1 : 1)).map(x => x[0]);
    return c.auto ? out.slice(0, c.limit > 0 ? c.limit : 6) : out;
  }
  _watch() { return (this._config.watch || []).filter(Boolean); }
  _count() { return this._config.show_unavailable_count !== false; }
  watched() { return [...this._autos(), ...this._watch()]; }
  /* Auto mode and the unavailable count depend on every state, so the signature also carries the automation id set
     and the unavailable count. */
  set hass(h) {
    this._hass = h;
    if (!this._config) return;
    const ids = this._config.auto ? Object.keys(h.states).filter(id => id.startsWith("automation.")) : this.watched();
    const sig = ids.map(id => { const s = h.states[id]; return s ? id + s.state + "|" + s.last_updated : "-"; }).join(",") + "," +
      this._watch().map(id => { const s = h.states[id]; return s ? s.state + "|" + s.last_updated : "-"; }).join(",") +
      (this._count() ? "#" + jaCountUnavailable(h.states) : "") + "|" + (h.locale ? h.locale.time_format : "");
    if (sig !== this._sig) { this._sig = sig; this._render(false); }
  }
  get hass() { return this._hass; }
  css() { return `
    .pn{display:flex;flex-direction:column}
    .hd{display:flex;align-items:flex-start;justify-content:space-between;gap:10px;margin:0 0 7px}
    .ttl{font-size:1.1rem}
    .cnt{background:var(--red);color:var(--on-fg)}
    .row{display:flex;align-items:baseline;justify-content:space-between;gap:10px;border-top:2px solid var(--line);padding:6px 0;cursor:pointer}
    .row.static{cursor:default}
    .nm{flex:1 1 auto;min-width:0;font:500 .8rem/1.3 var(--body);overflow-wrap:anywhere}
    .v{flex:0 1 auto;min-width:0;text-align:right;font:900 1rem/1.1 var(--display);text-transform:uppercase;color:var(--fg);overflow-wrap:break-word}
    .row.off .nm,.row.off .v{color:var(--dim)}
    .row.bad .v{color:var(--red)}`; }
  _row(face, id, name, text, cls, tap) {
    const row = el("div", "row" + (cls ? " " + cls : ""));
    if (id) row.dataset.entity = id;
    if (tap) { row.classList.add("focusable"); row.tabIndex = 0; row.setAttribute("role", "button"); bindActions(row, () => this._hass, {tap_action: {action: "more-info"}}, id); }
    else row.classList.add("static");
    row.append(el("span", "nm", name), el("span", "v num", text));
    face.append(row);
    return row;
  }
  render(b) {
    const c = this._config, h = this._hass;
    const {root, face} = this.paper(c.title || "alerts", {face: "pn"});
    const hd = el("div", "hd"); hd.append(el("h3", "disp ttl", c.title || "Automations & alerts"));
    face.append(hd);
    let fails = 0;
    for (const id of this._autos()) {
      const s = stateObj(h, id), name = friendly(h, id);
      if (!s || UNAVAILABLE.has(s.state)) { fails++; this._row(face, id, name, "unavailable", "bad auto", true); continue; }
      if (s.state === "off") { this._row(face, id, name, "off", "off auto", true); continue; }
      const w = jaWhen(h, s.attributes.last_triggered);
      this._row(face, id, name, w ? "ran " + w : "never", "auto", true);
    }
    for (const id of this._watch()) {
      const s = stateObj(h, id), bad = !s || UNAVAILABLE.has(s.state);
      if (bad) fails++;
      this._row(face, id, friendly(h, id), bad ? "unavailable" : fmtState(h, s), "watch" + (bad ? " bad" : ""), true);
    }
    if (this._count()) {
      const n = jaCountUnavailable(h.states);
      this._row(face, null, "Entities", `${n} unavailable`, "count" + (n ? " bad" : ""), false);
    }
    if (fails) {
      const chip = el("span", "chip cnt num", String(fails));
      chip.setAttribute("aria-label", `${fails} failing`);
      hd.append(chip);
    }
    b.append(root);
  }
  getCardSize() { return 2 + Math.ceil(this.watched().length * .6); }
  getGridOptions() { return {columns: 12, rows: "auto", min_columns: 3}; }
}
register("jam-alerts", JamAlerts, "Jam Alerts", "Automations & alerts panel: recent runs, watched entities, unavailable count (control room).");
