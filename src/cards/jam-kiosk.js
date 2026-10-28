/* ---------- jam-kiosk: the kiosk home screen ("B · Poster + dock", 0.5.0) ----------
   {type: custom:jam-kiosk, accent? (room colour of the 10px top bar, default ochre), inside_entity? (temperature sensor:
    "66° inside" after the date), now?: [sources, first active one wins], dock: [2-5 blocks]}
   now sources (right-hand "now" block: kicker, big line max 2 lines, small line):
    {type: media, entity (media_player), states? (["playing"]: states that make it active), kicker? ("Playing" /
     "Paused"), app_entity? (sensor/select whose state names the app on screen)} -> big = media_title, else the app;
     small = artist, else the app
    {type: weather, entity (weather.*), temperature_entity?, kicker? ("Outside")} -> active while available; big =
     "51° cloudy" (conditionWord); small = the next condition change in the hourly forecast (weather/subscribe_forecast,
     next 12 h: "Rain at 3 · high 64°", high = today's hourly maximum) else "High 64°", else humidity.
   dock block: {name, accent? (hue / room alias; "none" = slab2 block with dim state; default the card accent),
    state?: {count_on: [ids], suffix? ("on")} -> "3 on" / "All off" | {entity, attribute?, app_entity?} -> the
     entity's friendly state (media: title while playing / paused, else the app_entity's app, else "On" / "Idle", "Off"
     when off; lock: "Door locked" / "Door unlocked"; air quality sensors (device_class aqi, id with air_quality / aqi,
     or format: "aq"): category word via aqWord) | {text: "…"},
    tap?: sheet (default with cards) | action (default with tap_action), cards: [card configs] (sheet), kicker? (sheet
    kicker), columns? (1-3 sheet columns, default 1), tap_action? (action; confirmation supported)}
   Fills the view: the card measures its own top and sets its height so it ends at the bottom of the viewport (re-measured
   on resize, on visibility and every minute). Clock: Londrina, follows hass.locale (12/24 h, small AM/PM), one timeout per
   minute, stopped while the page is hidden. Sheets: openSheet fullscreen (jamCardSheet) with the block's child cards; hass
   is forwarded to them while open; closed on setConfig / disconnect. Motion: one-shot only (a dock block stamps on press,
   the sheet opens with the existing slide); no view entrance, no loops (weak Echo Show). No cut corners: the poster band
   and the dock are flat full-width blocks (approved mockup). Nothing on the card is set under 18px. */
const JAM_KIOSK_PKG = /^[a-z][\w-]*(\.[\w-]+){2,}$/i; // an Android package name (com.example.app) is not shown as an app
class JamKioskHome extends JamBase {
  constructor() {
    super();
    this._fc = null; this._subKey = null; this._unsubP = null; this._tick = null; this._raf = null; this._loc = undefined;
    this._onResize = () => this._fit();
    this._onVis = () => { if (!document.hidden) { this._clock(); this._fit(); } this._arm(); };
  }
  validate(c) {
    if (!Array.isArray(c.dock) || c.dock.length < 2 || c.dock.length > 5) throw new Error("jam-kiosk: dock needs 2-5 blocks");
    for (const b of c.dock) {
      if (!b || typeof b.name !== "string" || !b.name) throw new Error("jam-kiosk: every dock block needs a name");
      const tap = this._tapOf(b);
      if (tap === "sheet" && !Array.isArray(b.cards)) throw new Error(`jam-kiosk: block ${b.name}: cards must be a list`);
      if (tap === "action" && !(b.tap_action && typeof b.tap_action === "object")) throw new Error(`jam-kiosk: block ${b.name}: tap_action is required`);
      if (b.state && b.state.count_on !== undefined && !Array.isArray(b.state.count_on)) throw new Error(`jam-kiosk: block ${b.name}: count_on must be a list`);
    }
    if (c.now !== undefined && !Array.isArray(c.now)) throw new Error("jam-kiosk: now must be a list");
    for (const s of c.now || []) if (!s || !["media", "weather"].includes(s.type) || typeof s.entity !== "string") throw new Error("jam-kiosk: now sources are {type: media | weather, entity}");
  }
  _tapOf(b) { return b.tap === "sheet" || b.tap === "action" ? b.tap : Array.isArray(b.cards) ? "sheet" : b.tap_action ? "action" : "none"; }
  setConfig(c) {
    if (this._jamSheet) this._jamSheet.close({silent: true});
    super.setConfig(c);
    if (this.isConnected) { this._sub(); this._arm(); this._fit(); }
  }
  set hass(h) {
    const loc = h && h.locale, lng = h && h.language, before = this._sig, first = !this._hass;
    super.hass = h;
    // A locale change (12/24 h, language) re-sets the texts even when no watched entity changed.
    if (!first && (loc !== this._loc || lng !== this._lng) && this._sig === before && this._k) this._update();
    this._loc = loc; this._lng = lng;
    this._sub();
    if (this._jamSheet) this._jamSheet.hass(h);
  }
  get hass() { return this._hass; }
  watched() {
    const c = this._config, ids = [c.inside_entity];
    for (const s of c.now || []) ids.push(s.entity, s.app_entity, s.temperature_entity);
    for (const b of c.dock) {
      const st = b.state || {};
      ids.push(...(Array.isArray(st.count_on) ? st.count_on : []), st.entity, st.app_entity);
    }
    return [...new Set(ids.filter(x => typeof x === "string" && x))];
  }
  connectedCallback() {
    super.connectedCallback();
    window.addEventListener("resize", this._onResize);
    document.addEventListener("visibilitychange", this._onVis);
    this._sub(); this._arm(); this._fit();
    // HA may still lay the view out (kiosk chrome, fonts): one more measure on the next frame.
    if (this._raf === null) this._raf = requestAnimationFrame(() => { this._raf = null; this._fit(); });
  }
  disconnectedCallback() {
    super.disconnectedCallback();
    window.removeEventListener("resize", this._onResize);
    document.removeEventListener("visibilitychange", this._onVis);
    clearTimeout(this._tick); this._tick = null;
    if (this._raf !== null) { cancelAnimationFrame(this._raf); this._raf = null; }
    this._unsub();
    if (this._jamSheet) this._jamSheet.close({silent: true});
  }
  _enter() {} /* no view entrance: the kiosk is the whole view (and the Echo Show is weak) */
  css() { return `
    :host{display:block}
    .host{height:auto}
    .k{position:relative;height:var(--kh,600px);min-height:420px;display:grid;grid-template-rows:minmax(0,1fr) auto;container-type:size;
      color:var(--fg);overflow:hidden}
    .poster{position:relative;min-height:0;display:grid;grid-template-columns:fit-content(64%) minmax(0,1fr);gap:24px;align-items:end;
      padding:clamp(24px,4cqw,44px)}
    .bar{position:absolute;left:clamp(24px,4cqw,44px);right:clamp(24px,4cqw,44px);top:clamp(24px,4cqw,44px);height:10px;background:var(--acc)}
    .left{min-width:0}
    .clock{font-family:var(--display);font-weight:900;font-size:clamp(96px,min(19cqw,31cqh),200px);line-height:.8;letter-spacing:-.01em;white-space:nowrap}
    .clock small{font:600 max(18px,.15em)/1 var(--body);letter-spacing:.12em;margin-left:.25em;vertical-align:top;color:var(--dim)}
    .date{font:600 clamp(20px,2.2cqw,22px)/1.2 var(--body);letter-spacing:.14em;text-transform:uppercase;color:var(--dim);margin-top:14px}
    .now{display:grid;gap:14px;justify-items:end;text-align:right;min-width:0;align-content:end}
    .now:empty{display:none}
    .kick,.small{font:600 18px/1.2 var(--body);letter-spacing:.16em;text-transform:uppercase;color:var(--dim);max-width:100%}
    .small{letter-spacing:.14em}
    .kick:empty,.small:empty{display:none}
    .big{font-family:var(--display);font-weight:900;font-size:clamp(52px,6cqw,60px);line-height:.9;text-transform:uppercase;letter-spacing:-.005em;
      max-width:100%;overflow-wrap:anywhere;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;text-wrap:balance}
    .dock{display:grid;grid-auto-flow:column;grid-auto-columns:minmax(0,1fr);height:120px}
    .blk{position:relative;display:flex;flex-direction:column;justify-content:center;align-items:flex-start;gap:8px;min-width:0;padding:0 22px;
      text-align:left;background:var(--bc,var(--acc));color:var(--bf,var(--acc-fg))}
    .blk.none{--bc:var(--slab2);--bf:var(--fg)}
    .blk:focus-visible{outline:3px solid currentColor;outline-offset:-7px}
    .nm{font-family:var(--display);font-weight:900;font-size:clamp(32px,3.6cqw,36px);line-height:.9;text-transform:uppercase;max-width:100%;
      white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
    .st{font:600 18px/1.1 var(--body);letter-spacing:.12em;text-transform:uppercase;max-width:100%;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
    .blk.none .st{color:var(--dim)}
    .st:empty{display:none}
    .blk.stamp{z-index:1;animation:jam-stamp 210ms steps(3,end)}
    @container (max-width:640px){
      .poster{grid-template-columns:minmax(0,1fr);align-content:end}
      .now{justify-items:start;text-align:left}
      .dock{grid-auto-flow:row;grid-template-columns:repeat(2,minmax(0,1fr));height:auto}
      .blk{min-height:96px;padding:0 16px}
    }`; }
  /* Built once per config; hass updates only rewrite texts that changed. */
  _render(force) {
    if (!this._config) return;
    if (force || !this._k) this._shell();
    if (this._hass) this._update();
  }
  _shell() {
    const c = this._config, root = this.shadowRoot;
    root.textContent = "";
    const st = el("style"); st.textContent = BASE_CSS + this.css();
    this._body = el("div", "host");
    setAccent(this._body, c.accent);
    const k = el("div", "k"), poster = el("div", "poster"), bar = el("div", "bar"), left = el("div", "left");
    bar.setAttribute("aria-hidden", "true");
    this._time = el("div", "clock num"); this._date = el("div", "date");
    left.append(this._time, this._date);
    this._now = el("div", "now"); this._now.setAttribute("aria-live", "off");
    this._nk = el("div", "kick"); this._nb = el("div", "big"); this._ns = el("div", "small");
    poster.append(bar, left, this._now);
    const dock = el("div", "dock");
    this._blocks = c.dock.map((b, i) => {
      const btn = el("button", "blk"), nm = el("span", "nm", b.name), s = el("span", "st");
      btn.type = "button"; btn.dataset.block = String(i);
      const none = String(b.accent || "").toLowerCase() === "none", acc = !none && accentVar(b.accent);
      if (none) btn.classList.add("none");
      else if (acc) { btn.style.setProperty("--bc", acc); btn.style.setProperty("--bf", accentFg(b.accent)); }
      btn.append(nm, s);
      btn.addEventListener("pointerdown", e => { if (!e.button && motionOn()) oneShot(btn, "stamp"); });
      btn.addEventListener("click", () => this._tap(b));
      dock.append(btn);
      return {cfg: b, btn, st: s};
    });
    k.append(poster, dock);
    this._body.append(k);
    root.append(st, this._body);
    this._k = k; this._clockKey = null;
    if (this._kh) k.style.setProperty("--kh", this._kh + "px");
  }
  _update() {
    this._clock();
    const c = this._config, h = this._hass;
    const set = (n, t) => { t = t == null ? "" : String(t); if (n.textContent !== t) n.textContent = t; };
    // Date line: "Tuesday · October 28 · 66° inside"
    const d = new Date(), lang = this._lang();
    let date;
    try { date = d.toLocaleDateString(lang, {weekday: "long"}) + " · " + d.toLocaleDateString(lang, {month: "long", day: "numeric"}); }
    catch (e) { date = d.toDateString(); }
    const inside = stateObj(h, c.inside_entity);
    if (inside && inside.state !== "" && isFinite(Number(inside.state))) date += ` · ${Math.round(Number(inside.state))}° inside`;
    set(this._date, date);
    // Now: the first active source.
    const n = this._nowText();
    if (!n) { if (this._now.firstChild) this._now.textContent = ""; }
    else {
      if (this._now.childElementCount !== 3) this._now.append(this._nk, this._nb, this._ns);
      set(this._nk, n.kick); set(this._nb, n.big); set(this._ns, n.small);
      this._now.dataset.source = n.src;
    }
    for (const b of this._blocks) {
      const t = this._stateText(b.cfg.state);
      set(b.st, t);
      const label = b.cfg.name + (t ? ", " + t : "");
      if (b.btn.getAttribute("aria-label") !== label) b.btn.setAttribute("aria-label", label);
    }
  }
  _lang() { const h = this._hass; return (h && h.locale && h.locale.language) || (h && h.language) || undefined; }
  /* Clock text: "2:41" + small "PM" (12 h) or "14:41"; written only when the minute / format changed. */
  _clock() {
    if (!this._time || !this._hass) return;
    const d = new Date(), f = jamWxTime(this._hass), mm = String(d.getMinutes()).padStart(2, "0");
    let txt, per = "";
    if (f.h12) {
      per = d.getHours() < 12 ? "AM" : "PM";
      try { const p = new Intl.DateTimeFormat(f.loc, {hour: "numeric", hour12: true}).formatToParts(d).find(x => x.type === "dayPeriod"); if (p) per = p.value; } catch (e) { /* keep AM/PM */ }
      txt = `${d.getHours() % 12 || 12}:${mm}`;
    } else txt = `${String(d.getHours()).padStart(2, "0")}:${mm}`;
    const key = txt + "|" + per;
    if (key === this._clockKey) return;
    this._clockKey = key;
    this._time.textContent = txt;
    if (per) this._time.append(el("small", "", per));
  }
  /* One timeout per minute boundary (no loops); stopped while hidden or detached. Also re-measures the height and, at
     midnight, the date line. */
  _arm() {
    clearTimeout(this._tick); this._tick = null;
    if (!this._config || !this.isConnected || document.hidden) return;
    this._tick = setTimeout(() => { this._tick = null; if (this._hass && this._k) this._update(); this._fit(); this._arm(); }, 60e3 - (Date.now() % 60e3) + 50);
  }
  /* Height: from the card's top to the bottom of the viewport, minus the view's bottom padding (16px); one correction
     pass when the page still scrolls by a few pixels (HA paddings differ from the guess). */
  _fit() {
    const k = this._k;
    if (!k || !this.isConnected) return;
    const top = this.getBoundingClientRect().top + (window.scrollY || 0);
    let hgt = Math.max(420, Math.floor(innerHeight - top - 16));
    const apply = v => { if (v !== this._kh) { this._kh = v; k.style.setProperty("--kh", v + "px"); } };
    apply(hgt);
    const se = document.scrollingElement, over = se ? se.scrollHeight - innerHeight : 0;
    if (over > 0 && over <= 64 && hgt - over >= 420) apply(hgt - over);
  }
  /* ---- now block ---- */
  _nowText() {
    for (const s of this._config.now || []) {
      const t = s.type === "media" ? this._media(s) : this._weather(s);
      if (t) return t;
    }
    return null;
  }
  _app(src, s) {
    const a = stateObj(this._hass, src.app_entity);
    if (a && !UNAVAILABLE.has(a.state) && String(a.state).trim()) return String(a.state);
    const n = s && s.attributes && s.attributes.app_name;
    return n && !JAM_KIOSK_PKG.test(n) ? String(n) : "";
  }
  _media(src) {
    const s = stateObj(this._hass, src.entity);
    if (!s || !(src.states || ["playing"]).includes(s.state)) return null;
    const a = s.attributes || {}, app = this._app(src, s), title = a.media_title ? String(a.media_title) : "";
    const big = title || app || friendly(this._hass, src.entity);
    const small = a.media_artist ? String(a.media_artist) : title && app ? app : "";
    return {src: "media:" + src.entity, kick: src.kicker || (s.state === "paused" ? "Paused" : "Playing"), big, small};
  }
  _weather(src) {
    const h = this._hass, w = stateObj(h, src.entity);
    if (!w || UNAVAILABLE.has(w.state)) return null;
    let temp = Number(w.attributes.temperature);
    const ts = stateObj(h, src.temperature_entity);
    if (ts && ts.state !== "" && isFinite(Number(ts.state))) temp = Number(ts.state);
    const word = conditionWord(w.state).toLowerCase();
    const big = isFinite(temp) && w.attributes.temperature !== null ? `${Math.round(temp)}° ${word}` : word;
    return {src: "weather:" + src.entity, kick: src.kicker || "Outside", big, small: this._outlook(w, temp)};
  }
  /* "Rain at 3 · high 64°" from the hourly forecast (next 12 h); "High 64°" without a change; humidity without a forecast. */
  _outlook(w, temp) {
    const fc = Array.isArray(this._fc) ? this._fc : null;
    if (fc && fc.length) {
      const now = Date.now(), today = new Date().toDateString(), cur = conditionWord(w.state);
      const ahead = fc.map(f => ({f, t: Date.parse(f.datetime)})).filter(x => isFinite(x.t) && x.t > now - 30 * 60e3);
      const ch = ahead.find(x => x.t <= now + 12 * 3600e3 && x.f.condition && conditionWord(x.f.condition) !== cur);
      let hi = isFinite(temp) ? temp : -Infinity;
      for (const x of ahead) if (new Date(x.t).toDateString() === today && isFinite(Number(x.f.temperature)) && x.f.temperature !== null) hi = Math.max(hi, Number(x.f.temperature));
      const parts = [];
      if (ch) {
        const d = new Date(ch.t), tf = jamWxTime(this._hass);
        parts.push(`${conditionWord(ch.f.condition)} at ${tf.h12 ? d.getHours() % 12 || 12 : String(d.getHours()).padStart(2, "0") + ":00"}`);
      }
      if (isFinite(hi)) parts.push(`${parts.length ? "high" : "High"} ${Math.round(hi)}°`);
      if (parts.length) return parts.join(" · ");
    }
    const hum = w.attributes.humidity;
    return hum !== null && hum !== undefined && isFinite(Number(hum)) ? `Humidity ${Math.round(Number(hum))}%` : "";
  }
  /* Hourly forecast for the first weather source (unsubscribed on disconnect / config change). */
  _sub() {
    const c = this._config, h = this._hass, src = c && (c.now || []).find(s => s.type === "weather");
    const want = this.isConnected && h && src && h.connection && typeof h.connection.subscribeMessage === "function" ? src.entity : null;
    if (want === this._subKey) return;
    this._unsub();
    this._subKey = want;
    this._fc = null;
    if (!want) return;
    try {
      const p = h.connection.subscribeMessage(ev => {
        if (this._subKey !== want) return;
        this._fc = ev && Array.isArray(ev.forecast) ? ev.forecast : [];
        if (this._k && this._hass) this._update();
      }, {type: "weather/subscribe_forecast", entity_id: want, forecast_type: "hourly"});
      this._unsubP = Promise.resolve(p);
      this._unsubP.catch(() => {});
    } catch (e) { this._fc = null; }
  }
  _unsub() {
    const p = this._unsubP;
    this._unsubP = null; this._subKey = null;
    if (p) p.then(u => { if (typeof u === "function") return u(); }).catch(() => {});
  }
  /* ---- dock ---- */
  _stateText(spec) {
    const h = this._hass;
    if (!spec || typeof spec !== "object") return "";
    if (typeof spec.text === "string") return spec.text;
    if (Array.isArray(spec.count_on)) {
      const n = spec.count_on.filter(id => { const s = stateObj(h, id); return s && s.state === "on"; }).length;
      return n ? `${n} ${spec.suffix === undefined ? "on" : spec.suffix}`.trim() : "All off";
    }
    const id = spec.entity, s = stateObj(h, id);
    if (!id) return "";
    const dom = id.split(".")[0];
    if (!s) return "Unavailable";
    if (spec.attribute) { const v = s.attributes[spec.attribute]; return v === null || v === undefined ? "" : String(v); }
    if (dom === "media_player") {
      if (UNAVAILABLE.has(s.state) || s.state === "off" || s.state === "standby") return "Off";
      const a = s.attributes || {}, app = this._app(spec, {attributes: {}});
      if ((s.state === "playing" || s.state === "paused") && a.media_title) return String(a.media_title);
      if (app) return app;
      if (s.state === "playing" || s.state === "paused") return a.app_name && !JAM_KIOSK_PKG.test(a.app_name) ? String(a.app_name) : s.state === "playing" ? "Playing" : "Paused";
      return s.state === "on" ? "On" : "Idle";
    }
    if (UNAVAILABLE.has(s.state)) return "Unavailable";
    if (dom === "lock") return "Door " + String(s.state).replace(/_/g, " ");
    const dc = s.attributes && s.attributes.device_class;
    if (spec.format === "aq" || (dom === "sensor" && (dc === "aqi" || /air_quality|(^|[._])aqi/.test(id)))) return aqWord(s.state) || "Unavailable";
    const t = fmtState(h, s);
    return t.charAt(0).toUpperCase() + t.slice(1);
  }
  _tap(b) {
    const tap = this._tapOf(b);
    if (tap === "action") { runAction(this, this._hass, b.tap_action); return; }
    if (tap !== "sheet") return;
    const none = String(b.accent || "").toLowerCase() === "none";
    const accent = !none && accentName(b.accent) ? b.accent : this._config.accent;
    const cols = Math.max(1, Math.min(3, Math.round(+b.columns) || 1));
    jamCardSheet(this, {title: b.name, kicker: b.kicker, accent, cards: b.cards, fullscreen: true,
      css: cols > 1 ? `.body{grid-template-columns:repeat(${cols},minmax(0,1fr));align-items:start}` : ""});
  }
  getCardSize() { return 12; }
  getGridOptions() { return {columns: "full", rows: "auto"}; }
}
register("jam-kiosk", JamKioskHome, "Jam Kiosk", "Kiosk home screen: huge clock poster, a \"now\" line and a dock of colour blocks opening fullscreen sheets.");
