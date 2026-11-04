/* ---------- jam-programme: the day as a games programme sheet (Olympia look card, renders in every look) ----------
   {type: custom:jam-programme, title? ("Today"), from? ("00:00"), to? ("24:00"), lanes: [{entity?, name?, color?, state?,
    ranges?: [{from, to, label?}]}] (1-8), refresh_minutes? (10), accent?}
   One timeline for today between from and to (HH:MM; 24:00 = midnight), one lane per item, a 2px "now" line in the text
   colour, hour labels under it. A lane's bands come from:
   - schedule.*: the schedule's blocks for today's weekday (WS schedule/list, matched to the entity by its registry
     unique_id from config/entity_registry/get); a schedule not in that list (YAML) falls back to its recorder history;
   - calendar.*: today's events (WS call_service calendar.get_events with return_response; all-day events fill the day);
   - any other entity: its on periods today from the recorder (WS history/history_during_period, one call for every such
     lane), "on" = `state` (a state or list) else core tone() "on"; the current period runs to now;
   - ranges: fixed bands from the config (to < from runs past midnight); a lane may have ranges and no entity.
   Lane colours: `color` (an accent name) else blue, teal, ochre, pink, violet, green in order (jamHueAt). Bands carry no text; each band is a
   button (aria-label = lane, times, event) and a tap / Enter shows its details in the line under the timeline (aria-live;
   tap again or Esc = back to the default line: what is on now). Refetch every refresh_minutes and when a lane entity
   changes (at most once a minute), and at midnight; the now line moves once a minute (a timer, no animation). A lane
   whose source fails shows an alert mark and "unavailable" in its label's title. */
const JPR_GAP = 60e3, JPR_MAX_LANES = 8;
const JPR_DAYS = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
/* "HH:MM" / "HH:MM:SS" / a number of hours -> minutes after midnight (0..1440), or NaN. */
function jprMin(v) {
  if (typeof v === "number") return v >= 0 && v <= 24 ? Math.round(v * 60) : NaN;
  const m = /^\s*(\d{1,2})(?::(\d{2}))?(?::\d{2})?\s*$/.exec(String(v == null ? "" : v));
  if (!m) return NaN;
  const t = +m[1] * 60 + +(m[2] || 0);
  return t <= 1440 && +(m[2] || 0) < 60 ? t : NaN;
}
/* Schedules and registry ids are the same for every card on the page: one schedule/list per 10 minutes, one registry get
   per entity. */
const JPR_CACHE = {list: null, t: 0, reg: new Map()};
function jprScheduleList(hass) {
  if (!JPR_CACHE.list || Date.now() - JPR_CACHE.t > 600e3) {
    JPR_CACHE.t = Date.now();
    JPR_CACHE.list = Promise.resolve().then(() => hass.callWS({type: "schedule/list"})).catch(() => null);
  }
  return JPR_CACHE.list;
}
function jprUniqueId(hass, id) {
  if (!JPR_CACHE.reg.has(id)) JPR_CACHE.reg.set(id, Promise.resolve().then(() => hass.callWS({type: "config/entity_registry/get", entity_id: id}))
    .then(r => (r && r.unique_id) || null, () => null));
  return JPR_CACHE.reg.get(id);
}
/* A calendar date-time: "2026-11-03" = local midnight (all-day), else Date.parse. */
function jprTime(v) {
  if (v && typeof v === "object") v = v.dateTime || v.date;
  const d = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(v || ""));
  return d ? new Date(+d[1], +d[2] - 1, +d[3]).getTime() : Date.parse(v);
}
class JamProgramme extends JamBase {
  constructor() { super(); this._tok = 0; this._last = 0; this._data = null; this._band = null; }
  validate(c) {
    if (!Array.isArray(c.lanes) || !c.lanes.length) throw new Error("jam-programme: lanes is a list of 1-8 lanes");
    if (c.lanes.length > JPR_MAX_LANES) throw new Error(`jam-programme: ${c.lanes.length} lanes, max ${JPR_MAX_LANES}`);
    for (const l of c.lanes) {
      if (!l || typeof l !== "object" || (typeof l.entity !== "string" && !Array.isArray(l.ranges)))
        throw new Error("jam-programme: each lane is {entity, name?, color?, state?} or {name, ranges: [{from, to}]}");
      for (const r of l.ranges || []) if (!r || isNaN(jprMin(r.from)) || isNaN(jprMin(r.to))) throw new Error("jam-programme: a range is {from: HH:MM, to: HH:MM}");
    }
    const a = jprMin(c.from ?? "00:00"), b = jprMin(c.to ?? "24:00");
    if (isNaN(a) || isNaN(b) || b <= a) throw new Error("jam-programme: from / to are HH:MM with from before to");
  }
  setConfig(c) {
    super.setConfig(c);
    const q = JSON.stringify([c.lanes, c.from, c.to]);
    if (q !== this._q) { this._q = q; this._data = null; this._band = null; this._tok++; }
    if (this.isConnected) { this._arm(); this._kick(); }
  }
  set hass(h) {
    const first = !this._hass, before = this._sig;
    super.hass = h;
    if (first || this._sig !== before) this._kick(); // a lane entity changed: refetch (throttled)
  }
  get hass() { return super.hass; }
  watched() { return this._config.lanes.map(l => l.entity).filter(x => typeof x === "string"); }
  connectedCallback() {
    super.connectedCallback();
    this._arm();
    if (!this._data || Date.now() - this._last > this._every() || this._data.day !== this._day()) this._kick();
  }
  disconnectedCallback() {
    super.disconnectedCallback();
    clearTimeout(this._tick); this._tick = null;
    clearTimeout(this._pending); this._pending = null;
  }
  _every() { return Math.max(1, +this._config.refresh_minutes || 10) * 60e3; }
  _day() { const d = new Date(); return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`; }
  /* One timer: at every minute boundary move the now line; refetch when refresh_minutes passed or the day changed. */
  _arm() {
    clearTimeout(this._tick); this._tick = null;
    if (!this._config || !this.isConnected) return;
    this._tick = setTimeout(() => {
      this._tick = null;
      if (!this.isConnected) return;
      if (this._data && (this._data.day !== this._day() || Date.now() - this._last >= this._every())) this._kick();
      this._now();
      this._arm();
    }, 60e3 - (Date.now() % 60e3) + 50);
  }
  _kick() {
    if (!this._hass || !this._config || !this.isConnected) return;
    const wait = this._last + JPR_GAP - Date.now();
    if (wait <= 0 || !this._data || this._data.day !== this._day()) { clearTimeout(this._pending); this._pending = null; this._fetch(); return; }
    if (!this._pending) this._pending = setTimeout(() => { this._pending = null; this._kick(); }, wait);
  }
  /* Today's window [t0, t1] in ms. */
  _window() {
    const d = new Date(); d.setHours(0, 0, 0, 0);
    const m0 = jprMin(this._config.from ?? "00:00"), m1 = jprMin(this._config.to ?? "24:00");
    return {t0: d.getTime() + m0 * 60e3, t1: d.getTime() + m1 * 60e3, mid: d.getTime(), day: this._day()};
  }
  async _fetch() {
    const tok = ++this._tok, h = this._hass, c = this._config, w = this._window(), now = Date.now();
    this._last = now;
    const call = msg => Promise.resolve().then(() => { if (typeof h.callWS !== "function") throw new Error("no callWS"); return h.callWS(msg); });
    const lanes = c.lanes.map((l, i) => ({i, cfg: l, id: typeof l.entity === "string" ? l.entity : null, kind: !l.entity ? "fixed" : l.entity.split(".")[0]}));
    const sched = lanes.filter(l => l.kind === "schedule"), cals = lanes.filter(l => l.kind === "calendar");
    // Schedules: weekday blocks from schedule/list, matched by registry unique_id; unmatched -> history.
    const blocks = new Map();
    if (sched.length) {
      const [list, ...uids] = await Promise.all([jprScheduleList(h), ...sched.map(l => jprUniqueId(h, l.id))]);
      sched.forEach((l, k) => {
        const item = Array.isArray(list) && uids[k] ? list.find(x => x && x.id === uids[k]) : null;
        if (item) blocks.set(l.id, item[JPR_DAYS[new Date(w.mid).getDay()]] || []);
      });
    }
    const histIds = [...new Set(lanes.filter(l => l.id && l.kind !== "calendar" && !blocks.has(l.id)).map(l => l.id))];
    const end = Math.min(now, w.t1);
    const [hist, cal] = await Promise.all([
      histIds.length && end > w.t0 ? call({type: "history/history_during_period", start_time: new Date(w.t0).toISOString(), end_time: new Date(end).toISOString(),
        entity_ids: histIds, minimal_response: true, no_attributes: true, significant_changes_only: false}).catch(() => null) : {},
      cals.length ? call({type: "call_service", domain: "calendar", service: "get_events",
        service_data: {start_date_time: new Date(w.t0).toISOString(), end_date_time: new Date(w.t1).toISOString()},
        target: {entity_id: [...new Set(cals.map(l => l.id))]}, return_response: true}).catch(() => null) : null,
    ]);
    if (tok !== this._tok) return; // the config changed meanwhile
    const calResp = cal && (cal.response || cal);
    const out = lanes.map(l => {
      const bands = [];
      let err = false;
      const add = (a, b, label, detail, open) => { a = Math.max(a, w.t0); b = Math.min(b, w.t1); if (b > a || (open && b >= a)) bands.push({a, b, label, detail, open: !!open}); };
      for (const r of l.cfg.ranges || []) {
        const a = jprMin(r.from), b = jprMin(r.to), lab = r.label ? String(r.label) : "";
        if (b > a) add(w.mid + a * 60e3, w.mid + b * 60e3, lab);
        else { add(w.mid + a * 60e3, w.mid + 1440 * 60e3, lab); add(w.mid, w.mid + b * 60e3, lab); }
      }
      if (l.kind === "calendar") {
        const evs = calResp && calResp[l.id] && calResp[l.id].events;
        if (!Array.isArray(evs)) err = true;
        else for (const e of evs) { const a = jprTime(e.start), b = jprTime(e.end); if (isFinite(a) && isFinite(b)) add(a, b, String(e.summary || ""), String(e.location || "")); }
      } else if (blocks.has(l.id)) {
        for (const b of blocks.get(l.id)) { const x = jprMin(b.from), y = jprMin(b.to); if (!isNaN(x) && !isNaN(y) && y > x) add(w.mid + x * 60e3, w.mid + y * 60e3, ""); }
      } else if (l.id) {
        const rows = hist && hist[l.id];
        if (!hist) err = true;
        else this._history(rows, l.cfg, w.t0, end, add);
        // A schedule from history: the current block runs on to its next_event (the schedule knows when it ends).
        const s = stateObj(h, l.id);
        if (l.kind === "schedule" && s && s.state === "on" && s.attributes.next_event) add(end, Date.parse(s.attributes.next_event), "");
      }
      bands.sort((x, y) => x.a - y.a);
      return {name: l.cfg.name || (l.id ? friendly(h, l.id) : "Lane " + (l.i + 1)), color: accentVar(l.cfg.color) || jamHueAt(l.i), bands, err, id: l.id};
    });
    this._data = {...w, lanes: out};
    this._band = null;
    this._render(false);
  }
  /* History rows -> on periods: a period starts at a row in an "on" state and ends at the next row that is not (or at end). */
  _history(rows, cfg, t0, end, add) {
    const want = cfg.state === undefined || cfg.state === null ? null : [].concat(cfg.state).map(String);
    const on = st => (want ? want.includes(st) : tone({state: st, attributes: {}}) === "on");
    let from = null;
    for (const r of Array.isArray(rows) ? rows : []) {
      const st = String(r.s !== undefined ? r.s : r.state), ts = r.lu != null ? r.lu * 1000 : r.lc != null ? r.lc * 1000 : Date.parse(r.last_updated || r.last_changed);
      if (!isFinite(ts)) continue;
      const t = Math.max(t0, ts);
      if (on(st)) { if (from === null) from = t; }
      else if (from !== null) { add(from, t, ""); from = null; }
    }
    if (from !== null) add(from, end, "", "", true); // still on: the band grows with the now line (_now)
  }
  _time(t) {
    const f = jamGraphTime(this._hass);
    return new Date(t).toLocaleTimeString(f.loc, {hour: "numeric", minute: "2-digit", hour12: f.h12});
  }
  _hourLabel(t) {
    const f = jamGraphTime(this._hass);
    if (f.h12 === false) { const d = new Date(t), h = d.getHours(); return String(h === 0 && t > this._data.mid ? 24 : h); }
    return new Date(t).toLocaleTimeString(f.loc, {hour: "numeric", hour12: f.h12});
  }
  css() { return `
    .host{container-type:inline-size}
    .pr{display:grid;gap:12px;align-content:start}
    .hd{display:flex;flex-wrap:wrap;justify-content:space-between;align-items:baseline;gap:4px 12px}
    .ti{font-size:calc(1.5rem * var(--disp-scale))}
    .lanes{position:relative;display:grid;gap:10px}
    .lane{display:grid;grid-template-columns:var(--lw,92px) minmax(0,1fr);gap:10px;align-items:center}
    .lnm{font:500 .8rem/1.15 var(--body);color:var(--fg);overflow-wrap:anywhere;min-width:0}
    .lnm .tmk{margin-right:5px}
    .trk{position:relative;height:24px;background:var(--slab2)}
    .bd{position:absolute;top:0;bottom:0;min-width:4px;background:var(--bc);padding:0;cursor:pointer}
    .bd::after{content:"";position:absolute;left:50%;top:50%;width:max(100%,44px);height:max(100%,44px);transform:translate(-50%,-50%)}
    .bd.sel{outline:2px solid var(--fg);outline-offset:2px;z-index:1}
    .bd:focus-visible{outline:3px solid var(--focus);outline-offset:2px;z-index:2}
    .now{position:absolute;top:-5px;bottom:-5px;width:2px;margin-left:-1px;background:var(--fg);pointer-events:none;z-index:3}
    .ax{display:grid;grid-template-columns:var(--lw,92px) minmax(0,1fr);gap:10px}
    .ax > div{position:relative;height:1.1em}
    .ax span{position:absolute;top:0;transform:translateX(-50%);white-space:nowrap}
    .ax span:first-child{transform:none} .ax span.end{transform:translateX(-100%)}
    .det{min-height:2.6em;display:grid;gap:2px;align-content:start;font:400 .86rem/1.3 var(--body);color:var(--fg)}
    .det .dh{font-weight:600}
    .det .dm{color:var(--dim);display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}
    .empty{color:var(--dim);font:400 .86rem/1.3 var(--body)}
    @container (max-width:360px){.lanes,.ax{--lw:74px}}
    @container (max-width:440px){.ax span.o{display:none}}`; }
  render(b) {
    const c = this._config, d = this._data, h = this._hass;
    const {root, face} = this.paper("programme", {face: "pr"});
    const hd = el("div", "hd");
    const lng = (h.locale && h.locale.language) || h.language || undefined;
    let date = "";
    try { date = new Date().toLocaleDateString(lng, {weekday: "long", month: "long", day: "numeric"}); } catch (e) { date = new Date().toDateString(); }
    const ti = el("div", "ti disp", c.title || "Today");
    ti.id = "jpr-ti";
    hd.append(ti, el("div", "label", date));
    face.append(hd);
    if (!d) { face.append(el("div", "empty", "Loading the programme…")); b.append(root); return; }
    const span = d.t1 - d.t0, pct = t => ((t - d.t0) / span) * 100;
    const lanes = el("div", "lanes");
    lanes.setAttribute("role", "group"); lanes.setAttribute("aria-labelledby", "jpr-ti");
    this._open = [];
    const was = this._band ? `${this._band.lane.name}|${this._band.x.a}` : null;
    this._band = null;
    for (const l of d.lanes) {
      const row = el("div", "lane"), gone = !!l.id && !stateObj(h, l.id), nm = el("div", "lnm" + (l.err || gone ? " unavail" : ""));
      if (l.err || gone) { const m = el("span", "tmk t-alert"); m.setAttribute("aria-hidden", "true"); nm.append(m); nm.title = l.name + ": unavailable"; }
      nm.append(l.name);
      const trk = el("div", "trk");
      trk.style.setProperty("--bc", l.color);
      for (const x of l.bands) {
        const btn = el("button", "bd");
        btn.type = "button";
        btn.style.left = pct(x.a).toFixed(3) + "%"; btn.style.width = (pct(x.b) - pct(x.a)).toFixed(3) + "%";
        const txt = `${l.name}, ${this._time(x.a)} to ${x.open ? "now" : this._time(x.b)}${x.label ? ", " + x.label : ""}`;
        btn.setAttribute("aria-label", txt);
        btn.setAttribute("aria-pressed", "false");
        const rec = {lane: l, x, btn};
        if (x.open) this._open.push(rec);
        btn.addEventListener("click", () => this._pick(this._band === rec ? null : rec));
        btn.addEventListener("keydown", e => { if (e.key === "Escape" && this._band) { e.preventDefault(); this._pick(null); } });
        if (was === `${l.name}|${x.a}`) { this._band = rec; btn.classList.add("sel"); btn.setAttribute("aria-pressed", "true"); }
        trk.append(btn);
      }
      if (l.err || gone) { trk.setAttribute("role", "img"); trk.setAttribute("aria-label", l.name + ": unavailable"); }
      row.append(nm, trk);
      lanes.append(row);
    }
    const now = el("div", "now");
    now.setAttribute("aria-hidden", "true");
    lanes.append(now);
    // Hour labels: a step of 1-6 hours so at most ~5 labels, plus the window's ends.
    const hrs = span / 3600e3, step = [1, 2, 3, 4, 6, 12].find(s => hrs / s <= 4.5) || 12;
    const ax = el("div", "ax"), axt = el("div");
    ax.setAttribute("aria-hidden", "true");
    const marks = new Set([d.t0, d.t1]);
    for (let t = d.mid; t <= d.t1; t += step * 3600e3) if (t > d.t0 + step * 1800e3 && t < d.t1 - step * 1800e3) marks.add(t);
    [...marks].sort((a, b2) => a - b2).forEach((t, i) => {
      const s = el("span", "label" + (t === d.t1 ? " end" : i % 2 ? " o" : ""), this._hourLabel(t));
      s.style.left = pct(t) + "%"; axt.append(s);
    });
    ax.append(el("div"), axt);
    const det = el("div", "det");
    det.setAttribute("aria-live", "polite");
    face.append(lanes, ax, det);
    this._els = {lanes, now, det, pct, d};
    b.append(root);
    this._now();
  }
  /* Selected band (or null = the default line). */
  _pick(rec) {
    if (this._band) { this._band.btn.classList.remove("sel"); this._band.btn.setAttribute("aria-pressed", "false"); }
    this._band = rec && rec.btn.isConnected ? rec : null;
    if (this._band) { this._band.btn.classList.add("sel"); this._band.btn.setAttribute("aria-pressed", "true"); }
    this._detail();
  }
  _detail() {
    const e = this._els;
    if (!e || !e.det.isConnected) return;
    const s = this._band, head = el("div", "dh"), more = el("div", "dm");
    if (s) {
      head.textContent = `${s.lane.name} · ${this._time(s.x.a)}–${s.x.open ? "now" : this._time(s.x.b)}`;
      more.textContent = [s.x.label, s.x.detail].filter(Boolean).join(" · ");
    } else {
      const t = Date.now(), on = e.d.lanes.filter(l => l.bands.some(x => x.a <= t && (x.b > t || x.open))).map(l => l.name);
      head.textContent = t >= e.d.t0 && t < e.d.t1 ? `Now ${this._time(t)}` : `${this._time(e.d.t0)}–${this._time(e.d.t1)}`;
      more.textContent = t >= e.d.t0 && t < e.d.t1 ? (on.length ? on.join(", ") : "Nothing on now") : "Outside today's window";
    }
    if (e.det.textContent === head.textContent + more.textContent) return;
    e.det.textContent = "";
    e.det.append(head, more);
  }
  /* Moves the now line (hidden outside the window) and refreshes the default detail line. */
  _now() {
    const e = this._els;
    if (!e || !e.now.isConnected) return;
    const t = Date.now(), inside = t >= e.d.t0 && t <= e.d.t1;
    const left = inside ? `calc(var(--lw,92px) + 10px + (100% - var(--lw,92px) - 10px) * ${(e.pct(t) / 100).toFixed(5)})` : "";
    if (e.now.style.left !== left) e.now.style.left = left;
    for (const r of this._open || []) { // a period that is still on runs to now
      r.x.b = Math.max(r.x.b, Math.min(t, e.d.t1));
      const wd = (e.pct(r.x.b) - e.pct(r.x.a)).toFixed(3) + "%";
      if (r.btn.style.width !== wd) r.btn.style.width = wd;
      r.btn.setAttribute("aria-label", `${r.lane.name}, ${this._time(r.x.a)} to now`);
    }
    const disp = inside ? "" : "none";
    if (e.now.style.display !== disp) e.now.style.display = disp;
    if (!this._band) this._detail();
  }
  getCardSize() { return 2 + Math.ceil(this._config.lanes.length * .6); }
  getGridOptions() { return {columns: 12, rows: "auto", min_columns: 6}; }
}
register("jam-programme", JamProgramme, "Jam Programme", "The day as a timeline: schedules, calendars, on/off history and fixed ranges in lanes, with a now line.");
