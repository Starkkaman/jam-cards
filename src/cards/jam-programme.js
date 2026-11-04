/* ---------- jam-programme: the day as a games programme sheet (Olympia look card, renders in every look) ----------
   {type: custom:jam-programme, title? ("Today"), from? ("00:00"), to? ("24:00"), lanes: [{entity?, name?, color?, state?,
    ranges?: [{from, to, label?}]}] (1-8), refresh_minutes? (10), accent?}
   One timeline for today between from and to (HH:MM; 24:00 = midnight), one lane per item (32px tracks, 12px apart, so the
   44px band hit areas never overlap), a 3px "now" line in the text colour with a time flag, hour labels under it. Under the
   title a status line (aria-live): "Now 2:41 PM · Work" + the next band, or the tapped band's times and event (tap again
   or Esc = back). A lane's bands come from:
   - schedule.*: the schedule's blocks for today's weekday (WS schedule/list, matched to the entity by its registry
     unique_id from config/entity_registry/get); a schedule not in that list (YAML) falls back to its recorder history;
   - calendar.*: today's events (WS call_service calendar.get_events with return_response; all-day events fill the day);
   - any other entity: its on periods today from the recorder (WS history/history_during_period, one call for every such
     lane), "on" = `state` (a state or list) else core tone() "on"; the current period runs to now;
   - ranges: fixed bands from the config (to < from runs past midnight); a lane may have ranges and no entity.
   Lane colour: `color` (an accent name), else the room accent of the entity's area (jamAreaAccent: living, kitchen,
   master, marissa, music, nerd by area name / id), else blue, teal, ochre, pink, violet, green in order (jamHueAt). Bands
   carry no text; each is a button (aria-label = lane, times, event). Past bands are mixed 35% toward face 2; the current
   one is 4px taller with a text-colour outline. Lanes carry data-lv (0-2) so looks with one hue (Grid, Pulsar) draw them
   apart. Refetch every refresh_minutes and when a lane entity changes (at most once a minute), and at midnight; the now
   line, past / current marks and status move once a minute (a timer, no animation). A lane whose source fails or whose
   entity is missing shows an alert mark and a dim name. */
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
/* Room accents from an entity's area (its own or its device's): the area name, then its id, matched against room words. */
const JPR_ROOMS = [[/marissa/, "marissa"], [/master/, "master"], [/living|lounge/, "living"], [/kitchen/, "kitchen"], [/music/, "music"],
  [/nerd|office|study|\bden\b/, "nerd"]];
function jamAreaAccent(hass, id) {
  const e = hass && hass.entities && hass.entities[id];
  if (!e) return null;
  const dv = e.device_id && hass.devices ? hass.devices[e.device_id] : null, aid = e.area_id || (dv && dv.area_id);
  if (!aid) return null;
  const ar = hass.areas && hass.areas[aid], key = `${(ar && ar.name) || ""} ${aid}`.toLowerCase();
  const hit = JPR_ROOMS.find(([re]) => re.test(key));
  return hit ? accentVar(hit[1]) : null;
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
      return {name: l.cfg.name || (l.id ? friendly(h, l.id) : "Lane " + (l.i + 1)), color: accentVar(l.cfg.color) || (l.id && jamAreaAccent(h, l.id)) || jamHueAt(l.i), bands, err, id: l.id};
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
    .hd{display:grid;gap:4px}
    .ti{font-size:calc(1.5rem * var(--disp-scale))}
    .pst{display:grid;gap:2px;min-height:calc(1.1rem * 1.25 + .84rem * 1.3 + 2px)}
    .s1{font:600 1.1rem/1.25 var(--body);color:var(--fg);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
    .s2{font:400 .84rem/1.3 var(--body);color:var(--dim);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
    .lanes{position:relative;display:grid;gap:12px;padding-top:24px}
    .lane{display:grid;grid-template-columns:var(--lw,92px) minmax(0,1fr);gap:10px;align-items:center}
    .lnm{font:500 .8rem/1.15 var(--body);color:var(--fg);overflow-wrap:break-word;hyphens:auto;min-width:0}
    .lnm .tmk{margin-right:5px}
    .trk{position:relative;height:32px;background:var(--slab2)}
    .bd{--bf:var(--bc);position:absolute;top:0;bottom:0;min-width:4px;background:var(--bf);padding:0;cursor:pointer}
    .bd.bpast{--bf:color-mix(in srgb,var(--bc) 65%,var(--slab2))}
    .bd.bnow{top:-2px;bottom:-2px;outline:2px solid var(--fg);outline-offset:0;z-index:1}
    .bd::after{content:"";position:absolute;left:50%;top:50%;width:max(100%,44px);height:44px;transform:translate(-50%,-50%)}
    .bd.sel{outline:2px solid var(--fg);outline-offset:3px;z-index:2}
    .bd:focus-visible{outline:3px solid var(--focus);outline-offset:2px;z-index:3}
    .now{position:absolute;top:2px;bottom:-4px;width:3px;margin-left:-1.5px;background:var(--fg);pointer-events:none;z-index:4}
    .nf{position:absolute;top:0;left:0;padding:2px 5px;background:var(--fg);color:var(--slab);font:600 max(12px,.72rem)/1.1 var(--body);white-space:nowrap}
    .now.l .nf{left:auto;right:0}
    .ax{display:grid;grid-template-columns:var(--lw,92px) minmax(0,1fr);gap:10px}
    .ax > div{position:relative;height:1.1em}
    .ax span{position:absolute;top:0;transform:translateX(-50%);white-space:nowrap}
    .ax span:first-child{transform:none} .ax span.end{transform:translateX(-100%)}
    .empty{color:var(--dim);font:400 .86rem/1.3 var(--body)}
    @container (max-width:360px){.lanes,.ax{--lw:74px}}
    @container (max-width:440px){.ax span.o{display:none}}`; }
  render(b) {
    const c = this._config, d = this._data, h = this._hass;
    const {root, face} = this.paper("programme", {face: "pr"});
    const hd = el("div", "hd"), ti = el("div", "ti disp", c.title || "Today"), st = el("div", "pst");
    ti.id = "jpr-ti";
    st.setAttribute("aria-live", "polite");
    st.append(el("div", "s1", d ? "" : "Loading the programme…"), el("div", "s2"));
    hd.append(ti, st);
    face.append(hd);
    if (!d) { b.append(root); this._els = null; return; }
    const span = d.t1 - d.t0, pct = t => ((t - d.t0) / span) * 100;
    const lanes = el("div", "lanes");
    lanes.setAttribute("role", "group"); lanes.setAttribute("aria-labelledby", "jpr-ti");
    this._open = []; this._recs = [];
    const was = this._band ? `${this._band.lane.name}|${this._band.x.a}` : null;
    this._band = null;
    d.lanes.forEach((l, li) => {
      const row = el("div", "lane"), gone = !!l.id && !stateObj(h, l.id), nm = el("div", "lnm" + (l.err || gone ? " unavail" : ""));
      row.dataset.lv = String(li % 3); // lane variant: looks whose hues are one colour (Grid, Pulsar) draw lanes apart by it
      if (l.err || gone) { const m = el("span", "tmk t-alert"); m.setAttribute("aria-hidden", "true"); nm.append(m); nm.title = l.name + ": unavailable"; }
      nm.append(l.name);
      const trk = el("div", "trk");
      trk.style.setProperty("--bc", l.color);
      for (const x of l.bands) {
        const btn = el("button", "bd");
        btn.type = "button";
        btn.style.left = pct(x.a).toFixed(3) + "%"; btn.style.width = (pct(x.b) - pct(x.a)).toFixed(3) + "%";
        btn.setAttribute("aria-label", `${l.name}, ${this._time(x.a)} to ${x.open ? "now" : this._time(x.b)}${x.label ? ", " + x.label : ""}`);
        btn.setAttribute("aria-pressed", "false");
        const rec = {lane: l, x, btn};
        if (x.open) this._open.push(rec);
        this._recs.push(rec);
        btn.addEventListener("click", () => this._pick(this._band === rec ? null : rec));
        btn.addEventListener("keydown", e => { if (e.key === "Escape" && this._band) { e.preventDefault(); this._pick(null); } });
        if (was === `${l.name}|${x.a}`) { this._band = rec; btn.classList.add("sel"); btn.setAttribute("aria-pressed", "true"); }
        trk.append(btn);
      }
      if (l.err || gone) { trk.setAttribute("role", "img"); trk.setAttribute("aria-label", l.name + ": unavailable"); }
      row.append(nm, trk);
      lanes.append(row);
    });
    const now = el("div", "now"), flag = el("span", "nf");
    now.setAttribute("aria-hidden", "true");
    now.append(flag);
    lanes.append(now);
    // Hour labels: a step of 1-12 hours so at most ~5 labels, plus the window's ends (every other one hidden when narrow).
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
    face.append(lanes, ax);
    this._els = {lanes, now, flag, st, pct, d};
    b.append(root);
    this._now();
  }
  /* Selected band (or null = the default status: what is on now). */
  _pick(rec) {
    if (this._band) { this._band.btn.classList.remove("sel"); this._band.btn.setAttribute("aria-pressed", "false"); }
    this._band = rec && rec.btn.isConnected ? rec : null;
    if (this._band) { this._band.btn.classList.add("sel"); this._band.btn.setAttribute("aria-pressed", "true"); }
    this._detail();
  }
  /* The status under the title: "Now 2:41 PM · Work" (+ the next band), or the picked band's times and event. */
  _detail() {
    const e = this._els;
    if (!e || !e.st.isConnected) return;
    const s = this._band, t = Date.now();
    let one, two;
    if (s) {
      one = `${s.lane.name} · ${this._time(s.x.a)}–${s.x.open ? "now" : this._time(s.x.b)}`;
      two = [s.x.label, s.x.detail].filter(Boolean).join(" · ");
    } else if (t >= e.d.t0 && t < e.d.t1) {
      const on = e.d.lanes.filter(l => l.bands.some(x => x.a <= t && (x.b > t || x.open))).map(l => l.name);
      const next = e.d.lanes.flatMap(l => l.bands.filter(x => x.a > t).map(x => ({l, x}))).sort((p, q) => p.x.a - q.x.a)[0];
      one = `Now ${this._time(t)} · ${on.length ? on.join(", ") : "nothing on"}`;
      two = next ? `Next ${this._time(next.x.a)} · ${next.l.name}${next.x.label ? ": " + next.x.label : ""}` : "";
    } else { one = `${this._time(e.d.t0)}–${this._time(e.d.t1)}`; two = "Outside today's window"; }
    const [a, b] = e.st.children;
    if (a.textContent !== one) a.textContent = one;
    if (b.textContent !== two) b.textContent = two;
  }
  /* Every minute: the now line + its time flag (hidden outside the window), open periods grow to now, bands turn past /
     current, the status refreshes. Writes only what changed. */
  _now() {
    const e = this._els;
    if (!e || !e.now.isConnected) return;
    const t = Date.now(), inside = t >= e.d.t0 && t <= e.d.t1, f = e.pct(t) / 100;
    const left = inside ? `calc(var(--lw,92px) + 10px + (100% - var(--lw,92px) - 10px) * ${f.toFixed(5)})` : "";
    if (e.now.style.left !== left) e.now.style.left = left;
    const disp = inside ? "" : "none";
    if (e.now.style.display !== disp) e.now.style.display = disp;
    const ft = this._time(t);
    if (e.flag.textContent !== ft) e.flag.textContent = ft;
    if (e.now.classList.contains("l") !== f > .8) e.now.classList.toggle("l", f > .8);
    for (const r of this._open || []) { // a period that is still on runs to now
      r.x.b = Math.max(r.x.b, Math.min(t, e.d.t1));
      const wd = (e.pct(r.x.b) - e.pct(r.x.a)).toFixed(3) + "%";
      if (r.btn.style.width !== wd) r.btn.style.width = wd;
    }
    for (const r of this._recs || []) {
      const cur = r.x.a <= t && (r.x.b > t || r.x.open), past = !cur && r.x.b <= t;
      if (r.btn.classList.contains("bnow") !== cur) r.btn.classList.toggle("bnow", cur);
      if (r.btn.classList.contains("bpast") !== past) r.btn.classList.toggle("bpast", past);
    }
    if (!this._band) this._detail();
  }
  getCardSize() { return 2 + Math.ceil(this._config.lanes.length * .6); }
  getGridOptions() { return {columns: 12, rows: "auto", min_columns: 6}; }
}
register("jam-programme", JamProgramme, "Jam Programme", "The day as a timeline: schedules, calendars, on/off history and fixed ranges in lanes, with a now line.");
