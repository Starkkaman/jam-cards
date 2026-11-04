/* ---------- jam-arrivals: an arrivals board (designed for the Transit look, drawn in every look) ----------
   {type: custom:jam-arrivals, title? ("Arrivals"), accent? (default route colour),
    alerts?: [{entity, state? (string | list), above?, below?, message?, severity?: alert | warn}] (a row while the condition
      holds; no state / above / below = while the entity is on or in a problem state; severity default: alert when the
      entity's tone() is alert, else warn),
    media?: [media_player ids] (a "Now playing" row while one plays or is paused),
    calendars?: [calendar ids | {entity, name?, accent?, bullet?}] (the next `events` events within `hours`, merged and in
      time order), events? (4), hours? (48), refresh_minutes? (15),
    entities?: [ids | {entity, name?, accent?, bullet?}] (one row each: the state is the status)}
   Rows, top to bottom: alerts, service changes (warn), now playing, upcoming events, entities. Each row: a route bullet
   (its accent with a letter: `bullet`, else the first letter of the line's name that no other line uses, "M" for music),
   the destination (name) with a dim detail line, the status at the right in tabular numerals (an event's time: "Now",
   "7:30 PM" today, "Tue 9:00", an all-day event "Today" / "Tue"). An alert row = a square mark in --ar-alert (red), "Now"
   in the alert text colour, the entity and its state as the detail; a warn row = a diamond in --ar-warn (ochre; Transit:
   the service-change yellow, its alert the MTA red), "Service change" as the detail. Row tap =
   more-info. Events: GET calendars/<id>?start&end (hass.callApi), refetched every refresh_minutes and when a calendar's
   state changes (at most once a minute); without callApi the calendar's own next event (state attributes) is used. */
const AR_GAP = 60e3;
/* One bullet letter per line ([bullet override, name]): the override (up to 2 characters), else the first letter or digit of
   the name that no earlier line (nor `taken`, e.g. "M" for music) uses, else the first free letter A-Z. */
function arLetters(lines, taken = []) {
  const used = new Set(taken.map(x => x.toLocaleUpperCase()));
  return lines.map(([own, name]) => {
    let l = typeof own === "string" && own.trim() ? own.trim().slice(0, 2).toLocaleUpperCase() : "";
    if (!l) l = [...String(name || "").matchAll(/[\p{L}\p{N}]/gu)].map(m => m[0].toLocaleUpperCase()).find(x => !used.has(x)) || "";
    if (!l) l = [..."ABCDEFGHIJKLMNOPQRSTUVWXYZ"].find(x => !used.has(x)) || jamInitial(name);
    used.add(l);
    return l;
  });
}
/* HA time format -> {loc, h12} (same rules as jam-alerts' jaTime). */
function arTime(h) { return jaTime(h); }
function arClock(h, d) {
  const f = arTime(h);
  try { return d.toLocaleTimeString(f.loc, {hour: "numeric", minute: "2-digit", hour12: f.h12}); } catch (e) { return d.toTimeString().slice(0, 5); }
}
/* Status text of an event: "Now" while it runs, the start time today, "Tue 9:00" later; all-day: "Today" / "Tue" / "Jun 19". */
function arWhen(h, ev, now = new Date()) {
  const day = x => new Date(x.getFullYear(), x.getMonth(), x.getDate()).getTime(), f = arTime(h);
  if (ev.start <= now.getTime() && ev.end > now.getTime()) return "Now";
  const d = new Date(ev.start), days = Math.round((day(d) - day(now)) / 86400e3);
  let wd;
  try { wd = days < 7 ? d.toLocaleDateString(f.loc, {weekday: "short"}) : d.toLocaleDateString(f.loc, {month: "short", day: "numeric"}); } catch (e) { wd = d.toISOString().slice(5, 10); }
  if (ev.allDay) return days <= 0 ? "Today" : days === 1 ? "Tomorrow" : wd;
  return days <= 0 ? arClock(h, d) : `${wd} ${arClock(h, d)}`;
}
/* One calendar event {summary, start: {dateTime | date} | string, end} -> {title, start, end, allDay}. */
function arEvent(e) {
  if (!e) return null;
  const pick = v => (v && typeof v === "object" ? v.dateTime || v.date : v);
  const s = pick(e.start), en = pick(e.end), allDay = !!(e.start && typeof e.start === "object" && e.start.date && !e.start.dateTime) || /^\d{4}-\d\d-\d\d$/.test(String(s));
  const t0 = allDay ? new Date(String(s) + "T00:00:00").getTime() : Date.parse(s), t1 = en ? (allDay ? new Date(String(en) + "T00:00:00").getTime() : Date.parse(en)) : t0;
  return isNaN(t0) ? null : {title: String(e.summary || e.message || "Event"), start: t0, end: isNaN(t1) ? t0 : t1, allDay};
}
class JamArrivals extends JamBase {
  constructor() { super(); this._ev = null; this._last = 0; this._tok = 0; }
  validate(c) {
    for (const k of ["alerts", "media", "calendars", "entities"]) if (c[k] !== undefined && !Array.isArray(c[k])) throw new Error(`jam-arrivals: ${k} must be a list`);
    for (const a of c.alerts || []) if (!a || typeof a.entity !== "string") throw new Error("jam-arrivals: every alert needs an entity");
  }
  _items(k) { return (this._config[k] || []).map(x => (typeof x === "string" ? {entity: x} : x)).filter(x => x && typeof x.entity === "string"); }
  watched() {
    const c = this._config;
    return [...new Set([...(c.alerts || []).map(a => a.entity), ...(c.media || []), ...this._items("calendars").map(x => x.entity), ...this._items("entities").map(x => x.entity)])];
  }
  setConfig(c) {
    const q = JSON.stringify([c.calendars, c.events, c.hours]);
    if (q !== this._q) { this._q = q; this._ev = null; this._tok++; this._last = 0; }
    super.setConfig(c);
    if (this.isConnected) { this._arm(); this._kick(); }
  }
  set hass(h) {
    const first = !this._hass, before = this._sig;
    super.hass = h;
    if (first || this._sig !== before) this._kick(); // a calendar may have changed: refetch (throttled)
  }
  get hass() { return super.hass; }
  connectedCallback() {
    super.connectedCallback();
    if (this._wait && this._body) this._wait = !jamPaintBullets(this.shadowRoot, this._body); // the render ran detached
    this._arm();
    if (!this._ev || Date.now() - this._last > this._every()) this._kick();
  }
  disconnectedCallback() {
    super.disconnectedCallback();
    clearInterval(this._iv); this._iv = null;
    clearTimeout(this._pending); this._pending = null;
  }
  _themeRefresh() { if (this._body) this._wait = !jamPaintBullets(this.shadowRoot, this._body); }
  _every() { return Math.max(1, +this._config.refresh_minutes || 15) * 60e3; }
  _arm() {
    clearInterval(this._iv); this._iv = null;
    if (this._config && this._items("calendars").length) this._iv = setInterval(() => this._kick(), this._every());
  }
  _kick() {
    if (!this._hass || !this._config || !this.isConnected || !this._items("calendars").length) return;
    if (typeof this._hass.callApi !== "function") return; // the calendars' own next event is used
    const wait = this._last + AR_GAP - Date.now();
    if (wait <= 0) { clearTimeout(this._pending); this._pending = null; this._fetch(); return; }
    if (!this._pending) this._pending = setTimeout(() => { this._pending = null; this._kick(); }, wait);
  }
  _hours() { return +this._config.hours > 0 ? +this._config.hours : 48; }
  async _fetch() {
    const tok = ++this._tok, t0 = new Date(), t1 = new Date(t0.getTime() + this._hours() * 3600e3), out = [];
    this._last = t0.getTime();
    await Promise.all(this._items("calendars").map(async (cal, i) => {
      try {
        const res = await this._hass.callApi("GET", `calendars/${cal.entity}?start=${encodeURIComponent(t0.toISOString())}&end=${encodeURIComponent(t1.toISOString())}`);
        for (const e of Array.isArray(res) ? res : []) { const ev = arEvent(e); if (ev) out.push({...ev, cal: i}); }
      } catch (e) { /* that calendar stays empty */ }
    }));
    if (tok !== this._tok) return;
    this._ev = out;
    this._sig = null; this._render(false);
  }
  /* The calendars' events: fetched ones, else each calendar's own current / next event from its state. */
  _events() {
    const h = this._hass, cals = this._items("calendars"), now = Date.now();
    let evs = this._ev;
    if (!evs) evs = cals.map((cal, i) => {
      const s = stateObj(h, cal.entity), a = s && s.attributes;
      const ev = a && a.start_time ? arEvent({summary: a.message, start: a.all_day ? String(a.start_time).slice(0, 10) : a.start_time.replace(" ", "T"),
        end: a.end_time && (a.all_day ? String(a.end_time).slice(0, 10) : a.end_time.replace(" ", "T"))}) : null;
      return ev && {...ev, cal: i};
    }).filter(Boolean);
    const n = +this._config.events > 0 ? +this._config.events : 4;
    return evs.filter(e => e.end > now || e.start >= now).sort((a, b) => a.start - b.start || a.cal - b.cal).slice(0, n);
  }
  _alertOn(a) {
    const s = stateObj(this._hass, a.entity);
    if (!s) return false;
    const v = Number(s.state), num = s.state !== "" && isFinite(v);
    if (a.above !== undefined || a.below !== undefined)
      return num && (a.above === undefined || v > +a.above) && (a.below === undefined || v < +a.below);
    if (a.state !== undefined) return (Array.isArray(a.state) ? a.state : [a.state]).map(String).includes(s.state);
    return s.state === "on" || tone(s) === "alert";
  }
  css() { return `
    .ab{display:grid;align-content:start}
    .ttl{font-size:calc(1.6rem * var(--disp-scale));margin:0 0 8px}
    .row{display:grid;grid-template-columns:28px minmax(0,1fr) auto;align-items:center;gap:12px;min-height:56px;padding:8px 0;text-align:left;width:100%;color:var(--fg)}
    .row + .row{border-top:1px solid var(--line)}
    .ds{min-width:0;display:grid;gap:2px}
    .dn{font:600 1rem/1.25 var(--body);overflow-wrap:anywhere}
    .dd{font:500 .78rem/1.25 var(--body);color:var(--dim);overflow-wrap:anywhere}
    .stt{font-family:var(--num-font,var(--display));font-weight:var(--disp-w);text-transform:var(--disp-case);font-size:calc(1.3rem * var(--num-scale,var(--disp-scale)));
      line-height:calc(1 * var(--disp-lead));text-align:right;max-width:12ch;overflow-wrap:break-word}
    .sev{width:20px;height:20px;margin:0 4px;background:var(--ar-warn,var(--ochre));clip-path:polygon(50% 0,100% 50%,50% 100%,0 50%)}
    .alert .sev{background:var(--ar-alert,var(--red));clip-path:none}
    .svc .dn{font-weight:700}
    .warn{grid-template-columns:28px minmax(0,1fr)}
    .none{color:var(--dim);font:500 .95rem/1.4 var(--body);padding:10px 0}
    ${JAM_BULLET_CSS}`; }
  _row(cls, letter, hue, name, detail, status, entity, label) {
    const r = el("button", "row " + cls);
    if (letter !== null) r.append(jamBullet(letter, hue)); else { const m = el("span", "sev"); m.setAttribute("aria-hidden", "true"); r.append(m); }
    const ds = el("span", "ds");
    ds.append(el("span", "dn", name));
    if (detail) ds.append(el("span", "dd", detail));
    r.append(ds);
    if (status !== null) r.append(status);
    r.setAttribute("aria-label", label);
    r.dataset.jamName = name;
    r.onclick = () => moreInfo(this, entity);
    return r;
  }
  render(b) {
    const c = this._config, h = this._hass, acc = accentVar(c.accent) || "var(--acc)";
    const {root, face} = this.paper("board", {face: "ab"});
    face.append(el("h2", "disp ttl", c.title || "Arrivals"));
    const list = el("div", "list");
    const add = r => list.append(r);
    const sev = a => a.severity === "alert" || a.severity === "warn" ? a.severity : tone(stateObj(h, a.entity)) === "alert" ? "alert" : "warn";
    const on = (c.alerts || []).filter(a => this._alertOn(a));
    for (const a of [...on.filter(a => sev(a) === "alert"), ...on.filter(a => sev(a) === "warn")]) {
      const s = stateObj(h, a.entity), nm = friendly(h, a.entity), what = `${nm}: ${fmtState(h, s)}`, msg = a.message || what;
      if (sev(a) === "alert") {
        const st = el("span", "stt c-alert", "Now");
        add(this._row("svc alert", null, null, msg, a.message ? what : null, st, a.entity, `Alert: ${msg}${a.message ? ", " + what : ""}, now`));
      } else add(this._row("svc warn", null, null, msg, "Service change", null, a.entity, `Service change: ${msg}`));
    }
    for (const id of c.media || []) {
      const s = stateObj(h, id);
      if (!s || (s.state !== "playing" && s.state !== "paused")) continue;
      const a = s.attributes || {}, title = a.media_title || a.app_name || friendly(h, id), who = [a.media_artist, friendly(h, id)].filter(Boolean).join(" · ");
      const st = el("span", "stt", s.state === "playing" ? "Now" : "Paused");
      add(this._row("np", "M", "var(--violet)", title, who, st, id, `Now playing: ${title}${who ? ", " + who : ""}, ${st.textContent}`));
    }
    const cals = this._items("calendars"), ents = this._items("entities");
    const letters = arLetters([...cals.map(x => [x.bullet, x.name || friendly(h, x.entity)]), ...ents.map(x => [x.bullet, x.name || friendly(h, x.entity)])],
      (c.media || []).length ? ["M"] : []);
    for (const ev of this._events()) {
      const cal = cals[ev.cal], cn = cal.name || friendly(h, cal.entity);
      const st = el("span", "stt num", arWhen(h, ev));
      add(this._row("ev", letters[ev.cal], accentVar(cal.accent) || "var(--blue)", ev.title, cn, st, cal.entity, `${ev.title}, ${cn}, ${st.textContent}`));
    }
    ents.forEach((x, i) => {
      const s = stateObj(h, x.entity), nm = x.name || friendly(h, x.entity), t = tone(s);
      const st = el("span", `stt num c-${t === "off" ? "dim" : t}`, s ? fmtState(h, s) : "—");
      if (s) keepUnit(st, s);
      add(this._row("en", letters[cals.length + i], accentVar(x.accent) || acc, nm, null, st, x.entity, `${nm}, ${st.textContent}`));
    });
    if (!list.children.length) list.append(el("div", "none", "Nothing due."));
    face.append(list);
    b.append(root);
    this._wait = !jamPaintBullets(this.shadowRoot, b);
  }
  getCardSize() { return 4; }
  getGridOptions() { return {columns: 12, rows: "auto", min_columns: 6}; }
}
register("jam-arrivals", JamArrivals, "Jam Arrivals", "An arrivals board: service changes, now playing, the next calendar events and entity states.");
