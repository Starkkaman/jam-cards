/* ---------- jam-kiosk: the kiosk home screen ("B · Poster + dock", 0.5.0) ----------
   {type: custom:jam-kiosk, accent? (room colour of the 10px top bar, default ochre), now?: [sources, first active one wins],
    dock: [2-5 blocks], two lines under the clock (0.6.1):
     date line: "TUESDAY · OCTOBER 28" in the display font (Londrina 900, like the clock and the "now" line), uppercase, --fg,
      about 0.3x the clock digit height (30-40px), one line, never wraps;
     facts line (each part only while its sensor has a value; the line is left out when none has one):
      inside_entity? (temperature: "67° inside"), humidity_entity? ("58% humidity"), aq_entity? (air quality: "air excellent",
      word via aqWord, a US AQI number becomes its category)} -> "67° inside · 58% humidity · air excellent"
      (Jost 600 20-22px, dim, natural case; wraps between parts, never an ellipsis).
   now sources (right-hand "now" block: kicker, big line max 2 lines, small line):
    {type: media, entity (media_player), states? (["playing"]: states that make it active), kicker? ("Playing" /
     "Paused"), app_entity? (sensor/select whose state names the app on screen)} -> big = media_title, else the app;
     small = artist, else the app
    {type: weather, entity (weather.*), temperature_entity?, kicker? ("Outside")} -> active while available; big =
     "51° cloudy" (conditionWord); small = the next condition change in the hourly forecast (weather/subscribe_forecast,
     next 12 h: "Rain at 3 · high 64°", high = today's hourly maximum) else "High 64°", else humidity.
   dock block: {name, accent? (hue / room alias; "none" = slab2 block with dim state; solid ink + paper text in light mode; default the card accent),
    state?: {count_on: [ids], suffix? ("on")} -> "3 on" / "All off" | {entity, attribute?, app_entity?} -> the
     entity's friendly state (media: title while playing / paused, else the app_entity's app, else "On" / "Idle", "Off"
     when off; lock: "Locked" / "Unlocked"; air quality sensors (device_class aqi, id with air_quality / aqi,
     or format: "aq"): category word via aqWord) | {text: "…"},
    tap?: sheet (default with cards) | action (default with tap_action), cards: [card configs] (sheet), kicker? (sheet
    kicker), columns? (1-3 equal sheet columns, default 1; or 0.6.0 a list of 1-3 widths, e.g. [3, 2] = 60 % / 40 %),
    tap_action? (action; confirmation supported)}
   lock_entity? (0.6.2, lock.*), lock_name? ("Front door"): a round lock button in the poster's top-right corner (right edge on
    the accent bar's right edge, just under it; ≈104px on the iPad, ≈88px on the Echo Show: min(10.5cqw, 15.2cqh)). Inside a
    flat inline-SVG padlock (shackle closed when locked, raised to one side otherwise); under it one 18px label line
    "FRONT DOOR · LOCKED" (just "LOCKED" when the long form does not fit). Locked = quiet (audit 2026-11-03: a 4px --fg
    ring on no fill, glyph in --fg); every other available state (unlocked / open / jammed / locking / unlocking / opening) = alert (--red disc, ink
    glyph, label in --alert-text); unavailable / unknown = dashed dim outline, label "FRONT DOOR · OFFLINE". Tap: locked -> confirm "Unlock the front
    door?" then lock.unlock; unlocked / open / jammed -> lock.lock at once; transitional or unavailable states do nothing.
    Stamps on press like a dock block; a native button (Enter / Space) with an aria-label "Front door, Locked".
   Opt-in (audit 2026-11-03; all default off, so live dashboards keep today's look):
   dock_state?: "fill" -> a block is filled (its accent) only while one of its entities is on / playing (count_on > 0, or
    the state entity's tone is "on"), otherwise outlined in it (4px ring, --fg text); a lock block that is unlocked / open /
    jammed (or an alert-class sensor that is on: leak, smoke, gas, ...) fills in the alert red; action blocks (tap: action) are always outlined; a count_on block shows its count as a
    72px numeral (>= 64px) at its right edge and the suffix ("on") as its state.
   attention?: [{entity, state? | states?, text?, tap_action?}] -> while a condition is true, a top attention bar (alert red,
    ink text, 64px tall, display type) replaces the accent bar: "FRONT DOOR UNLOCKED · TAP TO LOCK" (text default: name +
    state; " · +N" when more are true). Default condition: lockAlert / tone "alert" (unlocked, open, jammed, problem, offline).
    Tap: tap_action, else lock.lock for a lock, else more-info.
   now_band?: true -> the first active media `now` source moves into the empty top band (kicker · artist + a 64px title,
    one line each), left of the lock and above its label; the right block then shows the next active source
    (weather). While the attention bar shows, the band steps aside and the media goes back to the right block.
   sheet_heading?: false -> a sheet leaves out its top-level jam-heading cards (the sheet title already names the room;
    a block's own sheet_heading wins).
   Pack contract (always set): every dock block carries data-state = "on" (one of its entities on / playing) | "off" |
    "action" (tap: action), plus data-alert="true" on a lock block that is unlocked / open / jammed.
   A sheet whose cards include a `size: "kiosk"` card (jam-speaker / jam-tv / jam-media, 0.6.0) gives its cards the whole
   sheet height (one row that fills the body), so those layouts fit without scrolling.
   Fills the view: the card measures its own top and sets its height so it ends at the bottom of the viewport (re-measured
   on resize, on visibility and every minute). Clock: Londrina, follows hass.locale (12/24 h, small AM/PM), one timeout per
   minute, stopped while the page is hidden. Sheets: openSheet fullscreen (jamCardSheet) with the block's child cards; hass
   is forwarded to them while open; closed on setConfig / disconnect. Motion: one-shot only (a dock block stamps on press,
   the sheet opens with the existing slide); no view entrance, no loops (weak Echo Show). No cut corners: the poster band
   and the dock are flat full-width blocks (approved mockup). Nothing on the card is set under 18px. */
/* JAM_KIOSK_NOTHING, jamKioskTitle, JAM_KIOSK_PKG, jamNowApp, jamNowMedia: src/core.js (shared with jam-screensaver, 0.7.1). */
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
      if (Array.isArray(b.columns) && !(b.columns.length >= 1 && b.columns.length <= 3 && b.columns.every(x => Number(x) > 0))) throw new Error(`jam-kiosk: block ${b.name}: columns is 1-3 or a list of 1-3 widths`);
    }
    if (c.lock_entity !== undefined && !(typeof c.lock_entity === "string" && /^lock\./.test(c.lock_entity))) throw new Error("jam-kiosk: lock_entity must be a lock.* entity");
    if (c.now !== undefined && !Array.isArray(c.now)) throw new Error("jam-kiosk: now must be a list");
    if (c.dock_state !== undefined && c.dock_state !== "fill" && c.dock_state !== "accent") throw new Error('jam-kiosk: dock_state is "fill" or "accent"');
    if (c.attention !== undefined && !(Array.isArray(c.attention) && c.attention.every(a => a && typeof a.entity === "string"))) throw new Error("jam-kiosk: attention is a list of {entity, state?, text?}");
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
    const c = this._config, ids = [c.inside_entity, c.humidity_entity, c.aq_entity, c.lock_entity, ...(c.attention || []).map(a => a.entity)];
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
    /* Lock button (0.6.2): a disc + one label line, top-right under the accent bar. */
    .lk{position:absolute;right:clamp(24px,4cqw,44px);top:calc(clamp(24px,4cqw,44px) + 24px);display:flex;flex-direction:column;align-items:flex-end;gap:8px;z-index:1}
    .lk .disc{--d:min(10.5cqw,15.2cqh);width:var(--d);height:var(--d);border-radius:50%;display:grid;place-items:center;
      background:var(--lk-bg);color:var(--lk-gl);border:0;box-shadow:inset 0 0 0 4px var(--lk-ring)}
    .lk .disc svg{width:56%;height:56%;display:block}
    /* State grammar (audit 2026-11-03): locked is quiet (a 4px --fg ring, glyph in --fg, no fill), unlocked / open /
       jammed is the loudest thing on the poster (the solid red disc). */
    .lk{--lk-bg:transparent;--lk-gl:var(--fg);--lk-tx:var(--fg);--lk-ring:var(--fg)}
    .lk.alert{--lk-bg:var(--red);--lk-gl:var(--on-fg);--lk-tx:var(--alert-text);--lk-ring:transparent}
    .lk.off .disc{background:none;border:4px dashed var(--dim)}
    .lk.off{--lk-gl:var(--dim);--lk-tx:var(--dim);--lk-ring:transparent}
    .lk .disc:focus-visible{outline:3px solid var(--focus);outline-offset:4px}
    .lk .disc.stamp{animation:var(--jam-kf-stamp,jam-stamp) calc(210ms * var(--dur)) var(--jam-ease-3,steps(3,end))}
    .lk .lbl{font:var(--lbl-w) 18px/1.2 var(--body);letter-spacing:calc(.16em * var(--lbl-track));text-transform:var(--lbl-case);color:var(--lk-tx);white-space:nowrap;
      max-width:36cqw;overflow:hidden;text-align:right}
    .left{min-width:0}
    .clock{font-family:var(--num-font);font-weight:var(--disp-w);font-size:calc(clamp(96px,min(19cqw,31cqh),200px) * var(--num-scale));line-height:calc(.8 * var(--disp-lead));letter-spacing:var(--jam-display-track,-.01em);white-space:nowrap}
    .clock small{font:var(--lbl-w) max(18px,.15em)/1 var(--body);letter-spacing:calc(.12em * var(--lbl-track));margin-left:.25em;vertical-align:top;color:var(--dim)}
    .day{font-family:var(--display);font-weight:var(--disp-w);font-size:calc(clamp(30px,min(3.7cqw,6.2cqh),40px) * var(--disp-scale));line-height:calc(1 * var(--disp-lead));letter-spacing:var(--jam-display-track,.01em);
      text-transform:var(--disp-case);color:var(--fg);white-space:nowrap;margin-top:16px;
      max-width:100%;overflow:hidden;text-overflow:ellipsis} /* one line; a wider look's face cuts with an ellipsis */
    .date{font:600 clamp(20px,2.2cqw,22px)/1.3 var(--body);letter-spacing:.03em;color:var(--dim);margin-top:8px;overflow-wrap:normal}
    .date:empty{display:none}
    .date .f{white-space:nowrap}
    .now{display:grid;gap:14px;justify-items:end;text-align:right;min-width:0;align-content:end}
    .now:empty{display:none}
    .kick,.small{font:var(--lbl-w) 18px/1.2 var(--body);letter-spacing:calc(.16em * var(--lbl-track));text-transform:var(--lbl-case);color:var(--dim);max-width:100%}
    .small{letter-spacing:calc(.14em * var(--lbl-track))}
    .kick:empty,.small:empty{display:none}
    .big{font-family:var(--display);font-weight:var(--disp-w);font-size:calc(clamp(52px,6cqw,60px) * var(--disp-scale));line-height:calc(.9 * var(--disp-lead));text-transform:var(--disp-case);letter-spacing:var(--jam-display-track,-.005em);
      max-width:100%;overflow-wrap:anywhere;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;text-wrap:balance}
    .dock{display:grid;grid-auto-flow:column;grid-auto-columns:minmax(0,1fr);gap:6px;height:120px}
    .blk{position:relative;display:flex;flex-direction:column;justify-content:center;align-items:flex-start;gap:8px;min-width:0;padding:0 22px;
      text-align:left;background:var(--bc,var(--acc));color:var(--bf,var(--acc-fg))}
    .blk.none{--bc:var(--slab2);--bf:var(--fg)}
    .host.light .blk.none{--bc:var(--ink);--bf:var(--ink-fg)}
    .host.light .blk.none .st{color:var(--ink-dim2)}
    .blk:focus-visible{outline:3px solid currentColor;outline-offset:-7px}
    .nm{font-family:var(--display);font-weight:var(--disp-w);font-size:calc(clamp(32px,3.6cqw,36px) * var(--disp-scale));line-height:calc(.9 * var(--disp-lead));text-transform:var(--disp-case);max-width:100%;
      white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
    .st{font:var(--lbl-w) 18px/1.1 var(--body);letter-spacing:calc(.12em * var(--lbl-track));text-transform:var(--lbl-case);max-width:100%;overflow-wrap:anywhere;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}
    .blk.none .st{color:var(--dim)}
    .st:empty{display:none}
    /* dock_state: fill (opt-in): filled only while on / playing, otherwise a 4px ring in the block colour; action blocks
       always outlined; a count numeral at the right edge. */
    .k.dfill .blk{--blk-c:var(--bc,var(--acc))}
    .k.dfill .blk.none{--blk-c:var(--dim)}
    .k.dfill .blk.out{background:transparent;color:var(--fg);box-shadow:inset 0 0 0 4px var(--blk-c)}
    .k.dfill .blk.out .st,.host.light .k.dfill .blk.out .st{color:var(--dim)}
    .k.dfill .blk.alert{--bc:var(--red);--bf:var(--on-fg);background:var(--red);color:var(--on-fg)}
    .k.dfill .blk.alert .st{color:var(--on-fg)}
    /* A counted block is a 2-column grid: name / state on the left (they keep what the count leaves), the numeral at the
       right edge, so both fit at 1024 and 961 in every look (a look's name mark, e.g. Transit's bullet, included). */
    .blk.counted{display:grid;grid-template-columns:minmax(0,1fr) auto;column-gap:8px;align-content:center;justify-items:start;padding:0 12px 0 18px}
    .blk.counted > *{grid-column:1}
    .blk .dn{grid-column:2;grid-row:1 / span 3;align-self:center;font-family:var(--num-font);font-weight:var(--disp-w);
      font-size:max(64px,calc(72px * var(--num-scale)));line-height:.8;letter-spacing:var(--jam-display-track,-.01em)}
    .blk:not(.counted) .dn{display:none}
    /* Attention bar (opt-in): replaces the accent bar while a condition is true; the lock steps down under it. */
    .k{--att-h:0px}
    .k.att-on{--att-h:76px}
    .att{position:absolute;left:clamp(24px,4cqw,44px);right:clamp(24px,4cqw,44px);top:clamp(24px,4cqw,44px);height:64px;z-index:2;
      display:flex;align-items:center;gap:16px;padding:0 20px;background:var(--red);color:var(--on-fg);text-align:left;
      font-family:var(--display);font-weight:var(--disp-w);font-size:max(30px,calc(36px * var(--disp-scale)));line-height:1;text-transform:var(--disp-case);
      white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
    .att .at{min-width:0;overflow:hidden;text-overflow:ellipsis}
    .att:focus-visible{outline:3px solid var(--on-fg);outline-offset:-7px}
    .k:not(.att-on) .att{display:none}
    .k.att-on .bar{visibility:hidden}
    .lk{top:calc(clamp(24px,4cqw,44px) + 24px + var(--att-h))}
    /* Now band (opt-in): the empty top band carries now playing (>= 64px title), left of the lock. */
    .band{position:absolute;left:clamp(24px,4cqw,44px);right:clamp(24px,4cqw,44px);top:calc(clamp(24px,4cqw,44px) + 22px);
      display:grid;gap:6px;justify-items:start;min-width:0}
    .k.has-lock .band{right:calc(clamp(24px,4cqw,44px) + max(min(10.5cqw,15.2cqh) + 40px, 36cqw + 16px))} /* clear of the disc and its label */
    .band:empty,.k.att-on .band{display:none}
    .band .bt{font-family:var(--display);font-weight:var(--disp-w);font-size:max(64px,calc(64px * var(--disp-scale)));line-height:calc(.9 * var(--disp-lead));
      text-transform:var(--disp-case);letter-spacing:var(--jam-display-track,-.005em);max-width:100%;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
    .band .kick,.band .small{text-align:left}
    .band .kick{max-width:100%;white-space:nowrap;overflow:hidden;text-overflow:ellipsis} /* kicker (· artist) + title: the band stays above the lock label */
    .blk.stamp{z-index:1;animation:var(--jam-kf-stamp,jam-stamp) calc(210ms * var(--dur)) var(--jam-ease-3,steps(3,end))}
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
    if (this._hass) { this._update(); lookDecorate(this); }
  }
  _shell() {
    const c = this._config, root = this.shadowRoot;
    root.textContent = "";
    this._body = el("div", "host");
    setAccent(this._body, c.accent);
    const k = el("div", "k"), poster = el("div", "poster"), bar = el("div", "bar"), left = el("div", "left");
    bar.setAttribute("aria-hidden", "true");
    this._time = el("div", "clock num"); this._day = el("div", "day"); this._date = el("div", "date");
    left.append(this._time, this._day, this._date);
    this._now = el("div", "now"); this._now.setAttribute("aria-live", "off");
    this._nk = el("div", "kick"); this._nb = el("div", "big"); this._ns = el("div", "small");
    poster.append(bar, left, this._now);
    // Opt-ins (audit 2026-11-03): attention bar, now band, fill dock.
    this._att = null; this._band = null;
    if (Array.isArray(c.attention) && c.attention.length) {
      const att = el("button", "att"), at = el("span", "at");
      att.type = "button"; att.append(at);
      att.addEventListener("click", () => this._attTap());
      poster.append(att);
      this._att = {btn: att, txt: at, cur: null};
    }
    if (c.now_band === true) {
      this._band = el("div", "band"); this._band.setAttribute("aria-live", "off");
      this._bk = el("div", "kick"); this._bb = el("div", "bt");
      poster.append(this._band);
    }
    k.classList.toggle("dfill", c.dock_state === "fill"); // (not "fill": that is the strip fill class)
    k.classList.toggle("has-lock", !!c.lock_entity);
    this._lock = null;
    if (c.lock_entity) {
      const box = el("div", "lk"), disc = el("button", "disc"), lbl = el("div", "lbl");
      disc.type = "button"; lbl.setAttribute("aria-hidden", "true");
      disc.addEventListener("pointerdown", e => { if (!e.button && motionOn()) oneShot(disc, "stamp"); });
      disc.addEventListener("click", () => this._lockTap());
      box.append(disc, lbl); poster.append(box);
      this._lock = {box, disc, lbl, key: null, glyph: null};
    }
    const dock = el("div", "dock");
    this._blocks = c.dock.map((b, i) => {
      const btn = el("button", "blk"), nm = el("span", "nm", b.name), s = el("span", "st");
      btn.type = "button"; btn.dataset.block = String(i);
      const none = String(b.accent || "").toLowerCase() === "none", acc = !none && accentVar(b.accent);
      if (none) btn.classList.add("none");
      else if (acc) { btn.style.setProperty("--bc", acc); btn.style.setProperty("--bf", accentFg(b.accent)); }
      const code = motif("code", this, b.name); // a look's name code (R10 hook; Poster: none)
      if (code) btn.append(code);
      btn.append(nm, s);
      const cnt = c.dock_state === "fill" && b.state && Array.isArray(b.state.count_on) ? el("span", "dn num") : null;
      if (cnt) { cnt.setAttribute("aria-hidden", "true"); btn.append(cnt); }
      btn.addEventListener("pointerdown", e => { if (!e.button && motionOn()) oneShot(btn, "stamp"); });
      btn.addEventListener("click", () => this._tap(b));
      dock.append(btn);
      return {cfg: b, btn, st: s, cnt};
    });
    k.append(poster, dock);
    this._body.append(k);
    root.append(this._body);
    jamStyle(root, this.css(), this.dataset.look);
    this._k = k; this._clockKey = null; this._shellLook = this.dataset.look || "poster";
    if (this._kh) k.style.setProperty("--kh", this._kh + "px");
  }
  _update() {
    this._clock();
    // Light mode: hass.themes.darkMode (set by HA), else the OS scheme. "none" dock blocks are solid ink in light mode.
    const th = this._hass.themes, dark = th && typeof th.darkMode === "boolean" ? th.darkMode
      : !!(window.matchMedia && matchMedia("(prefers-color-scheme: dark)").matches);
    this._body.classList.toggle("light", !dark);
    const c = this._config, h = this._hass;
    const set = (n, t) => { t = t == null ? "" : String(t); if (n.textContent !== t) n.textContent = t; };
    // Date line: "Tuesday · October 28" (shown uppercase in the display font), one line.
    const d = new Date(), lang = this._lang(), parts = [];
    set(this._day, jamDateText(d, lang)); // core: the one date format of the kiosk screens
    // Facts line: "67° inside · 58% humidity · air excellent"; one nowrap span per part, so it wraps between parts (never
    // inside one, never an ellipsis); empty (hidden) without any value. Rebuilt only when the text changed.
    const num = id => { const s = stateObj(h, id); return s && String(s.state).trim() !== "" && isFinite(Number(s.state)) ? Math.round(Number(s.state)) : null; };
    const tIn = num(c.inside_entity), hum = num(c.humidity_entity), aq = c.aq_entity ? aqWord((stateObj(h, c.aq_entity) || {}).state) : null;
    if (tIn !== null) parts.push(`${tIn}° inside`);
    if (hum !== null) parts.push(`${hum}% humidity`);
    if (aq) parts.push(`air ${aq.toLowerCase()}`);
    if (this._date.textContent !== parts.join(" · ")) {
      this._date.textContent = "";
      parts.forEach((t, i) => { if (i) this._date.append(" "); this._date.append(el("span", "f", i < parts.length - 1 ? t + " ·" : t)); });
    }
    // Now: the first active source.
    // Attention first: while it shows, the now band steps aside (the media goes back to the right block).
    const attOn = this._attUpdate();
    const bandN = this._band && !attOn ? this._nowText(s => s.type === "media") : null;
    if (this._band) {
      if (!bandN) { if (this._band.firstChild) this._band.textContent = ""; }
      else {
        if (this._band.childElementCount !== 2) this._band.append(this._bk, this._bb);
        set(this._bk, bandN.small ? `${bandN.kick} · ${bandN.small}` : bandN.kick); set(this._bb, bandN.big);
        this._band.dataset.source = bandN.src;
      }
    }
    const n = this._nowText(bandN ? s => s.type !== "media" : null);
    if (!n) { if (this._now.firstChild) this._now.textContent = ""; }
    else {
      if (this._now.childElementCount !== 3) this._now.append(this._nk, this._nb, this._ns);
      set(this._nk, n.kick); set(this._nb, n.big); set(this._ns, n.small);
      this._now.dataset.source = n.src;
    }
    this._lockUpdate();
    const fill = c.dock_state === "fill";
    for (const b of this._blocks) {
      let t = this._stateText(b.cfg.state);
      // Pack contract (always, whatever dock_state): data-state = on | off | action, data-alert on a lock block that
      // needs attention. No visual change in Poster unless dock_state: fill.
      const st = this._blockState(b.cfg), ds = this._tapOf(b.cfg) === "action" ? "action" : st === "on" ? "on" : "off";
      if (b.btn.dataset.state !== ds) b.btn.dataset.state = ds;
      if ((b.btn.dataset.alert === "true") !== (st === "alert")) { if (st === "alert") b.btn.dataset.alert = "true"; else delete b.btn.dataset.alert; }
      if (fill) {
        b.btn.classList.toggle("on", st === "on"); b.btn.classList.toggle("alert", st === "alert"); b.btn.classList.toggle("out", st !== "on" && st !== "alert");
        if (b.cnt) {
          const nOn = this._countOn(b.cfg.state);
          set(b.cnt, nOn ? String(nOn) : "");
          b.btn.classList.toggle("counted", nOn > 0);
          if (nOn) t = b.cfg.state.suffix === undefined ? "on" : String(b.cfg.state.suffix);
        }
      }
      set(b.st, t);
      const full = this._stateText(b.cfg.state), label = b.cfg.name + (full ? ", " + full : "");
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
    jamClockText(this._time, txt.slice(0, txt.indexOf(":")), mm);
    if (per) this._time.append(el("small", "", per));
  }
  /* One timeout per minute boundary (no loops); stopped while hidden or detached. Also re-measures the height and, at
     midnight, the date line. */
  _arm() {
    clearTimeout(this._tick); this._tick = null;
    if (!this._config || !this.isConnected || document.hidden) return;
    this._tick = setTimeout(() => { this._tick = null; if (this._hass && this._k) this._update(); this._fit(); this._arm(); }, 60e3 - (Date.now() % 60e3) + 50);
  }
  /* A look's web fonts arrived (core _watchFonts): the clock / lock label were measured with the fallback face. */
  _fontsLoaded() { this._fit(); }
  /* Live look switch (queueLook): the shell is built once, so rebuild it when the dock's name code motif changes (R10
     hook, Pulsar); otherwise let the new look's pack mark the rendered nodes (motif decorate, Transit). A rebuild runs
     decorate itself (_render). */
  _lookChanged(look) {
    const code = l => { const p = lookPack(l); return p ? p.motifs.code : undefined; };
    if (this._k && code(this._shellLook) !== code(look)) this._render(true);
    else if (this._hass && this._k) lookDecorate(this);
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
    this._lockFit();
    const se = document.scrollingElement, over = se ? se.scrollHeight - innerHeight : 0;
    if (over > 0 && over <= 64 && hgt - over >= 420) apply(hgt - over);
  }
  /* ---- now block ---- */
  _nowText(want) {
    for (const s of this._config.now || []) {
      if (want && !want(s)) continue;
      const t = s.type === "media" ? this._media(s) : this._weather(s);
      if (t) return t;
    }
    return null;
  }
  _app(src, s) { return jamNowApp(this._hass, src, s); }
  _media(src) {
    const n = jamNowMedia(this._hass, src);
    return n && {src: n.src, kick: n.kick, big: n.big, small: n.small};
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
    if (!s) return OFFLINE;
    if (spec.attribute) { const v = s.attributes[spec.attribute]; return v === null || v === undefined ? "" : String(v); }
    if (dom === "media_player") {
      if (UNAVAILABLE.has(s.state) || s.state === "off" || s.state === "standby") return "Off";
      const a = s.attributes || {}, app = this._app(spec, {attributes: {}});
      if ((s.state === "playing" || s.state === "paused") && jamKioskTitle(a.media_title)) return jamKioskTitle(a.media_title);
      if (app) return app;
      if (s.state === "playing" || s.state === "paused") return a.app_name && !JAM_KIOSK_PKG.test(a.app_name) ? String(a.app_name) : s.state === "playing" ? "Playing" : "Paused";
      return s.state === "on" ? "On" : "Idle";
    }
    if (UNAVAILABLE.has(s.state)) return OFFLINE;
    if (dom === "lock") { const t = String(s.state).replace(/_/g, " "); return t.charAt(0).toUpperCase() + t.slice(1); }
    const dc = s.attributes && s.attributes.device_class;
    if (spec.format === "aq" || (dom === "sensor" && (dc === "aqi" || /air_quality|(^|[._])aqi/.test(id)))) return aqWord(s.state) || OFFLINE;
    const t = fmtState(h, s);
    return t.charAt(0).toUpperCase() + t.slice(1);
  }
  /* ---- dock_state: fill (opt-in) ---- */
  _countOn(spec) {
    const h = this._hass;
    return spec && Array.isArray(spec.count_on) ? spec.count_on.filter(id => { const s = stateObj(h, id); return s && s.state === "on"; }).length : 0;
  }
  /* "on" (filled), "alert" (a lock needing attention: filled red) or "out" (outlined). Action blocks are always "out". */
  _blockState(b) {
    if (this._tapOf(b) === "action") return "out";
    const spec = b.state || {};
    if (Array.isArray(spec.count_on)) return this._countOn(spec) > 0 ? "on" : "out";
    const s = spec.entity && stateObj(this._hass, spec.entity);
    if (!s) return "out";
    if (isLock(s)) return lockAlert(s) ? "alert" : "out";
    const t = tone(s); // a wet leak / smoke sensor (alert classes) fills red, never the "on" fill (review 2026-11-04)
    return t === "on" ? "on" : t === "alert" && !UNAVAILABLE.has(s.state) ? "alert" : "out";
  }
  /* ---- attention bar (opt-in) ---- */
  _attHits() {
    const h = this._hass, out = [];
    for (const a of this._config.attention || []) {
      const s = stateObj(h, a.entity);
      const want = a.states !== undefined ? [].concat(a.states).map(String) : a.state !== undefined ? [String(a.state)] : null;
      const hit = want ? !!s && want.includes(String(s.state)) : !s || lockAlert(s) || tone(s) === "alert";
      if (hit) out.push({a, s});
    }
    return out;
  }
  _attText({a, s}) {
    if (typeof a.text === "string" && a.text.trim()) return a.text.trim();
    const name = friendly(this._hass, a.entity, a.name);
    if (!s || UNAVAILABLE.has(s.state)) return `${name} ${OFFLINE.toLowerCase()}`;
    if (isLock(s) && ["unlocked", "open"].includes(String(s.state))) return `${name} ${s.state} · tap to lock`;
    return `${name} ${String(fmtState(this._hass, s)).toLowerCase()}`;
  }
  /* Shows / hides the bar; returns true while it shows. */
  _attUpdate() {
    const A = this._att;
    if (!A) return false;
    const hits = this._attHits(), on = hits.length > 0;
    this._k.classList.toggle("att-on", on);
    A.cur = on ? hits[0] : null;
    const t = on ? this._attText(hits[0]) + (hits.length > 1 ? ` · +${hits.length - 1}` : "") : "";
    if (A.txt.textContent !== t) A.txt.textContent = t;
    if (A.btn.getAttribute("aria-label") !== t) A.btn.setAttribute("aria-label", t);
    A.btn.tabIndex = on ? 0 : -1;
    return on;
  }
  _attTap() {
    const cur = this._att && this._att.cur;
    if (!cur) return;
    const {a, s} = cur;
    if (a.tap_action) runAction(this._att.btn, this._hass, a.tap_action, a.entity);
    else if (s && /^lock\./.test(a.entity) && ["unlocked", "open", "jammed"].includes(String(s.state)))
      runAction(this._att.btn, this._hass, {action: "perform-action", perform_action: "lock.lock", target: {entity_id: a.entity}});
    else moreInfo(this, a.entity);
  }
  /* ---- lock button (0.6.2) ---- */
  _lockState() {
    const s = stateObj(this._hass, this._config.lock_entity), st = s ? String(s.state) : "unavailable";
    const words = {locked: "Locked", unlocked: "Unlocked", locking: "Locking…", unlocking: "Unlocking…", jammed: "Jammed", open: "Open", opening: "Opening…"};
    if (UNAVAILABLE.has(st) || !words[st]) return {st, word: OFFLINE, tone: "off", closed: true};
    return {st, word: words[st], tone: st === "locked" ? "calm" : "alert", closed: st === "locked"};
  }
  _lockName() { const n = this._config.lock_name; return typeof n === "string" && n.trim() ? n.trim() : "Front door"; }
  _lockUpdate() {
    const L = this._lock;
    if (!L) return;
    const s = this._lockState(), name = this._lockName();
    L.box.classList.toggle("alert", s.tone === "alert"); L.box.classList.toggle("off", s.tone === "off");
    L.box.dataset.state = s.st;
    if (L.glyph !== s.closed) {
      L.glyph = s.closed;
      L.disc.innerHTML = jamLockSvg(s.closed); // static markup (core), no entity data
      L.disc.dataset.glyph = s.closed ? "closed" : "open";
    }
    const aria = `${name}, ${s.word}`;
    if (L.disc.getAttribute("aria-label") !== aria) L.disc.setAttribute("aria-label", aria);
    const key = name + "|" + s.word;
    if (L.key !== key) { L.key = key; this._lockFit(); }
  }
  /* Label: "FRONT DOOR · LOCKED" when it fits in its line, else just the state (re-measured on resize / fonts). */
  _lockFit() {
    const L = this._lock;
    if (!L || !this._hass) return;
    const s = this._lockState(), long = `${this._lockName()} · ${s.word}`;
    if (L.lbl.textContent !== long) L.lbl.textContent = long;
    if (L.lbl.scrollWidth > L.lbl.clientWidth + 1) L.lbl.textContent = s.word;
    L.lbl.dataset.form = L.lbl.textContent === long ? "long" : "short";
  }
  _lockTap() {
    const id = this._config.lock_entity, s = this._lockState();
    if (s.st === "locked") {
      runAction(this, this._hass, {action: "perform-action", perform_action: "lock.unlock", target: {entity_id: id},
        confirmation: {text: `Unlock the ${this._lockName().toLowerCase()}?`}});
    } else if (["unlocked", "open", "jammed"].includes(s.st)) {
      runAction(this, this._hass, {action: "perform-action", perform_action: "lock.lock", target: {entity_id: id}});
    }
  }
  _tap(b) {
    const tap = this._tapOf(b);
    if (tap === "action") { runAction(this, this._hass, b.tap_action); return; }
    if (tap !== "sheet") return;
    const none = String(b.accent || "").toLowerCase() === "none";
    const accent = !none && accentName(b.accent) ? b.accent : this._config.accent;
    // Columns: 1-3 equal ones, or a list of widths ([3, 2] = 60 % / 40 %).
    const ws = Array.isArray(b.columns) ? b.columns.slice(0, 3).map(Number).filter(x => x > 0)
      : Array(Math.max(1, Math.min(3, Math.round(+b.columns) || 1))).fill(1);
    // size: "kiosk" cards get the whole sheet height: one row that fills the body, cards stretched into it.
    // (only the player cards: jam-light / jam-fan / jam-scenes size kiosk set their own heights)
    const fill = (b.cards || []).some(x => x && x.size === "kiosk" && /^custom:jam-(speaker|tv|media)$/.test(String(x.type)));
    let css = ws.length > 1 ? `.body{grid-template-columns:${ws.map(w => `minmax(0,${w}fr)`).join(" ")};align-items:start}` : "";
    if (fill) css += ".body{grid-template-rows:minmax(0,1fr);grid-auto-rows:minmax(0,1fr);align-items:stretch}.body > *{min-height:0}";
    // sheet_heading: false (opt-in): the sheet title already names the room, so top-level jam-heading cards are left out.
    const heads = b.sheet_heading !== undefined ? b.sheet_heading : this._config.sheet_heading;
    const cards = heads === false ? (b.cards || []).filter(x => !(x && x.type === "custom:jam-heading")) : b.cards;
    jamCardSheet(this, {title: b.name, kicker: b.kicker, accent, cards, fullscreen: true, css});
  }
  getCardSize() { return 12; }
  getGridOptions() { return {columns: "full", rows: "auto"}; }
}
register("jam-kiosk", JamKioskHome, "Jam Kiosk", "Kiosk home screen: huge clock poster, a \"now\" line and a dock of colour blocks opening fullscreen sheets.");
