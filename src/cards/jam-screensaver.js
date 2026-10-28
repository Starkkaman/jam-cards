/* ---------- jam-screensaver: zero-footprint card; a full-viewport Poster clock (or photo slideshow) after inactivity ----------
   {type: custom:jam-screensaver, idle_seconds? (120), accent? (room colour, default ochre), mode?: poster (default) | images,
    weather_entity?, temperature_entity?, kicker? ("The Bungalow · kitchen"),
    images?: {index: URL of a JSON list (["a.jpg", {url, caption}]) | media: "media-source://…" folder (0.4.0),
      interval? (20 s), shuffle? (false)},
    poster_every? (images mode: every Nth slide is the poster), active_hours?: {from: "06:00", to: "23:00"},
    disable_on?: {entity, state: "playing" | [states]} or a list of those, kiosk?: "url" (default) | true | false,
    motion?: false (0.3.5: turns the jam cards' one-shot motion off on this page while the card is on screen, via
    JamCards.motion; for a kiosk too weak for it; the screensaver's own per-minute layout cut stays)}
   Built for weak kiosk hardware (Echo Show 8 / iPad): no rAF, no infinite animation, no filters; one clock timer aligned to
   the minute; every timer stops while document.hidden. It never touches screen brightness (the kiosk app owns that).
   Activity = pointerdown / keydown / wheel on document (capture). The first tap on the overlay dismisses it and is
   swallowed: the overlay stays in place (content blanked) until that tap's pointerup/click have landed on it, so nothing
   underneath is pressed.
   Mounting: the overlay lives in its own layer element (a div with a shadow root holding the styles). The layer starts in
   the card's shadow root (position:fixed, z-index 2147483000). When it is shown, the card hit-tests the viewport corners
   and centre; if the overlay does not cover the viewport (an HA ancestor makes a containing block via transform/filter/
   contain, or a stacking context puts the header above it) the layer moves to document.body, carrying the --jam-* tokens
   it resolved. It is removed from body again on disconnect.
   Kiosk chrome (option kiosk): "url" (default) = only when the page URL has ?kiosk (remembered for that dashboard until
   reload, since view switches may drop the query), true = always, false = never. While active, HA's sidebar and the
   dashboard header are hidden on THIS dashboard only, by one <style data-jam-kiosk> appended to each of three shadow roots
   (HA frontend 2026.10): home-assistant-main (--ha-sidebar-width 0, --ha-top-app-bar-width 100%, ha-sidebar hidden),
   ha-drawer (.sidebar-shell hidden, .app-content padding-inline-start 0) and hui-root (.header hidden, --header-height 0,
   hui-view-container padding-top = safe-area inset only). The hosts are found by walking up from the card through its
   shadow roots (document path as fallback). A MutationObserver (childList only, on those three roots) re-adds the style
   if HA re-renders; no polling. The styles are removed on navigation to another dashboard (location-changed / popstate)
   or when the last kiosk card leaves while the URL is no longer on its dashboard. Way out: a 2 s long-press in the
   top-left 48x48 px corner restores the chrome until the page reloads.
   Media source (0.4.0, images.media): the folder is browsed (hass.callWS media_source/browse_media) on start and then at
   most once per hour (after a failure or an empty folder: retried after 10 min); only children with media_class "image" are
   kept, as media_content_ids in memory, sorted by title (shuffle: a per-load seeded order). Each image is resolved
   (media_source/resolve_media, expires 3600) right before it is preloaded/shown, so a signed URL is used within one
   interval and never cached; URLs carry a token and are never logged or stored. Any browse / resolve / load error falls
   back to the poster (never black). */
const SS_CSS = `
  :host{display:block;height:0;overflow:visible}
  .ov{position:fixed;inset:0;z-index:2147483000;display:none;overflow:hidden;background:var(--ink);
    --sfg:var(--jam-ink-fg,#ece2c9);--sdim:var(--jam-ink-dim,#9a8f7c);--acc:var(--jam-accent,var(--ochre));--acc-fg:var(--on-fg);
    color:var(--sfg);cursor:none;user-select:none;-webkit-user-select:none;touch-action:none}
  .ov.show{display:block}
  .ov.gone{background:transparent} .ov.gone > *{visibility:hidden}
  .poster,.slides{position:absolute;inset:0}
  .ov[data-view=poster] .slides,.ov[data-view=images] .poster{display:none}
  /* Poster: flat accent shapes + a text block; each layout (l0-l5) only moves them (no transform for placement). */
  .sh{position:absolute;background:var(--acc);width:0;height:0}
  .bar{clip-path:polygon(0 0,100% 0,100% calc(100% - 3vh),calc(100% - 3vh) 100%,0 100%)}
  .disc{clip-path:circle(50% at 50% 50%)}
  .txt{position:absolute;display:grid;gap:1.6vh;justify-items:start}
  .kick{font:600 max(12px,2.1vh)/1.2 var(--body);letter-spacing:.2em;text-transform:uppercase;color:var(--acc)}
  .time{font-family:var(--display);font-weight:900;font-size:28vh;line-height:.8;letter-spacing:-.01em;color:var(--sfg);white-space:nowrap}
  .time small,.tchip small{font:600 .14em/1 var(--body);letter-spacing:.12em;margin-left:.25em;vertical-align:top;color:var(--sdim)}
  .date{font:500 max(13px,3.3vh)/1.15 var(--body);letter-spacing:.18em;text-transform:uppercase;color:var(--sfg)}
  .wx{display:flex;align-items:baseline;gap:0 2.4vh;flex-wrap:wrap}
  .wx:empty{display:none}
  .word{font-family:var(--display);font-weight:900;font-size:6.4vh;line-height:.9;text-transform:uppercase;color:var(--sfg)}
  .temp{font-family:var(--display);font-weight:900;font-size:6.4vh;line-height:.9;color:var(--acc)}
  .r .txt{justify-items:end;text-align:right} .c .txt{justify-items:center;text-align:center}
  .l0 .txt{left:8vw;bottom:10vh}
  .l0 .b1{right:10vw;top:0;width:9vw;height:66vh} .l0 .b2{right:22vw;top:0;width:3.5vw;height:42vh} .l0 .dk{right:5vw;bottom:7vh;width:22vh;height:22vh}
  .l1 .txt{right:8vw;top:11vh}
  .l1 .b1{left:0;top:16vh;width:36vw;height:6vh} .l1 .b2{left:0;top:27vh;width:24vw;height:6vh} .l1 .b3{left:0;top:38vh;width:30vw;height:6vh}
  .l1 .dk{left:9vw;bottom:8vh;width:26vh;height:26vh}
  .l2 .txt{left:8vw;top:9vh}
  .l2 .b1{left:8vw;bottom:0;width:34vw;height:6vh} .l2 .b2{right:0;top:9vh;width:3.5vw;height:34vh} .l2 .dk{right:9vw;bottom:10vh;width:38vh;height:38vh}
  .l3 .txt{left:0;right:0;top:20vh}
  .l3 .b1{left:0;top:0;width:100vw;height:7vh} .l3 .b2{left:0;bottom:0;width:58vw;height:7vh} .l3 .dk{right:8vw;bottom:3vh;width:13vh;height:13vh}
  .l4 .txt{left:30vw;bottom:11vh}
  .l4 .b1{left:8vw;top:0;width:6vw;height:100vh} .l4 .b2{left:17vw;top:22vh;width:2.5vw;height:78vh} .l4 .dk{right:8vw;top:8vh;width:24vh;height:24vh}
  .l5 .txt{right:8vw;bottom:9vh}
  .l5 .b1{left:0;bottom:13vh;width:30vw;height:5vh} .l5 .b2{left:0;bottom:23vh;width:18vw;height:5vh} .l5 .b3{right:0;top:0;width:28vw;height:6vh}
  .l5 .dk{left:8vw;top:8vh;width:34vh;height:34vh}
  /* One-shot stepped cut when the layout changes (transform/opacity only). */
  .shift .sh{animation:jam-ss-cut 240ms steps(3,end) 1 both}
  .shift .txt{animation:jam-ss-pop 160ms steps(2,end) 1 both}
  @keyframes jam-ss-cut{from{transform:scaleX(0);transform-origin:0 0}to{transform:none;transform-origin:0 0}}
  @keyframes jam-ss-pop{from{opacity:0}to{opacity:1}}
  /* Images: at most two <img> (current + preloading next), contained on ink. */
  .img{position:absolute;inset:0;width:100%;height:100%;object-fit:contain;background:var(--ink);visibility:hidden}
  .img.cur{visibility:visible}
  .img.cut{animation:jam-ss-pop 120ms steps(2,end) 1 both}
  .tchip{position:absolute;left:3vw;bottom:4vh;display:grid;gap:.6vh;padding:1.4vh 2.4vh 1.6vh 2vh;background:var(--acc);color:var(--acc-fg);
    clip-path:polygon(0 0,100% 0,100% calc(100% - 10px),calc(100% - 10px) 100%,0 100%)}
  .tchip .tt{font-family:var(--display);font-weight:900;font-size:8vh;line-height:.85;white-space:nowrap}
  .tchip small{color:var(--acc-fg)}
  .tchip .cap{font:600 max(11px,1.8vh)/1.2 var(--body);letter-spacing:.16em;text-transform:uppercase;max-width:40vw}
  .tchip .cap:empty{display:none}
  @media (prefers-reduced-motion:reduce){.shift .sh,.shift .txt,.img.cut{animation:none!important}}`;
/* Tokens carried onto the layer when it moves to document.body (the theme may be set on an HA view, not on <html>). */
const SS_TOKENS = ["ink", "slab", "slab2", "paper", "paper-fg", "fg", "dim", "line", "ochre", "red", "teal", "blue", "pink", "violet",
  "green", "on-fg", "display", "body", "accent", "ink-fg", "ink-dim"].map(n => "--jam-" + n);
const SS_LAYOUTS = 6;
const SS_ALIGN = ["", "r", "", "c", "", "r"]; /* text alignment per layout */
function jamSsMinutes(s) {
  const m = /^(\d{1,2}):(\d{2})$/.exec(String(s || "").trim());
  return m && +m[1] < 24 && +m[2] < 60 ? +m[1] * 60 + +m[2] : null;
}
/* Element at (x, y) through open shadow roots. */
function jamSsDeepAt(x, y) {
  let e = document.elementFromPoint(x, y);
  while (e && e.shadowRoot) {
    const n = e.shadowRoot.elementFromPoint(x, y);
    if (!n || n === e) break;
    e = n;
  }
  return e;
}

/* ---- kiosk chrome: one controller for the page (several screensaver cards may ask for it) ---- */
const JAM_KIOSK_CSS = Object.freeze({
  "home-assistant-main": ":host{--ha-sidebar-width:0px!important;--ha-top-app-bar-width:100%!important}ha-sidebar{display:none!important}",
  "ha-drawer": ".sidebar-shell{display:none!important}.app-content{padding-inline-start:0!important}",
  "hui-root": ":host{--header-height:0px!important}.header{display:none!important}" +
    "hui-view-container{padding-top:calc(var(--safe-area-inset-top,0px) + var(--view-container-padding-top,0px))!important}",
});
/* Top-level <style data-jam-kiosk> children of a shadow root (:scope does not work on a ShadowRoot). */
const jamKioskStyles = sr => [...sr.children].filter(e => e.localName === "style" && e.hasAttribute("data-jam-kiosk"));
const JamKiosk = {
  cards: new Set(), dash: null, hosts: new Map(), mo: null, escaped: false, seen: new Set(), lpT: null, lpAt: null,
  dashOf() { return location.pathname.split("/")[1] || ""; },
  wants(card) {
    const k = card._config && card._config.kiosk;
    if (k === false || this.escaped) return false;
    if (k === true) return true;
    let q = false;
    try { q = new URLSearchParams(location.search).has("kiosk"); } catch (e) { /* old engine */ q = /[?&]kiosk(=|&|$)/.test(location.search); }
    if (q) this.seen.add(this.dashOf());
    return this.seen.has(this.dashOf());
  },
  /* Card connected / reconfigured. */
  join(card) {
    if (this.wants(card)) { this.cards.add(card); this.apply(); }
    else { this.cards.delete(card); if (!this.cards.size && this.dash !== null && this.dash !== this.dashOf()) this.clear(); }
  },
  /* Card disconnected: a view switch inside the same dashboard keeps the chrome hidden; anything else restores it. */
  leave(card) {
    this.cards.delete(card);
    if (!this.cards.size && this.dash !== null && this.dash !== this.dashOf()) this.clear();
  },
  /* Shadow hosts to style: walk up from the card (this dashboard's hui-root), document path as fallback. */
  resolve(card) {
    const out = {};
    let n = card;
    for (let i = 0; i < 60 && n; i++) {
      const r = n.getRootNode && n.getRootNode();
      if (!r || !r.host) break;
      if (JAM_KIOSK_CSS[r.host.localName] && !out[r.host.localName]) out[r.host.localName] = r.host;
      n = r.host;
    }
    let m = out["home-assistant-main"];
    if (!m) { const ha = document.querySelector("home-assistant"); m = ha && ha.shadowRoot && ha.shadowRoot.querySelector("home-assistant-main"); if (m) out["home-assistant-main"] = m; }
    const d = m && m.shadowRoot && m.shadowRoot.querySelector("ha-drawer");
    if (d) out["ha-drawer"] = d;
    if (!out["hui-root"] && m && m.shadowRoot) {
      const p = m.shadowRoot.querySelector("partial-panel-resolver");
      const pl = p && (p.querySelector("ha-panel-lovelace") || (p.shadowRoot && p.shadowRoot.querySelector("ha-panel-lovelace")));
      const hr = pl && pl.shadowRoot && pl.shadowRoot.querySelector("hui-root");
      if (hr) out["hui-root"] = hr;
    }
    return out;
  },
  apply() {
    if (this.escaped) return;
    const card = [...this.cards].find(c => c.isConnected);
    if (!card) return;
    if (this.dash === null) {
      this.dash = this.dashOf();
      this._onLoc = () => this.located();
      this._onDown = e => this.press(e); this._onUp = () => this.release(); this._onMove = e => this.moved(e);
      window.addEventListener("location-changed", this._onLoc);
      window.addEventListener("popstate", this._onLoc);
      document.addEventListener("pointerdown", this._onDown, {capture: true, passive: true});
      for (const t of ["pointerup", "pointercancel"]) document.addEventListener(t, this._onUp, {capture: true, passive: true});
      document.addEventListener("pointermove", this._onMove, {capture: true, passive: true});
      this.mo = new MutationObserver(() => this.ensure());
    }
    const want = this.resolve(card);
    for (const [name, host] of this.hosts) if (want[host.localName] !== host) { this.unstyle(host); this.hosts.delete(name); }
    this.mo.disconnect();
    for (const [name, host] of Object.entries(want)) {
      if (!host.shadowRoot) continue;
      this.hosts.set(name, host);
      this.style(host);
      this.mo.observe(host.shadowRoot, {childList: true});
    }
  },
  style(host) {
    const sr = host.shadowRoot;
    let st = jamKioskStyles(sr)[0];
    if (!st) { st = document.createElement("style"); st.dataset.jamKiosk = ""; st.textContent = JAM_KIOSK_CSS[host.localName]; }
    if (st !== sr.lastElementChild) sr.append(st); /* last wins over HA's own adopted/inline styles of equal weight */
  },
  unstyle(host) { if (host.shadowRoot) for (const st of jamKioskStyles(host.shadowRoot)) st.remove(); },
  /* MutationObserver: re-add a dropped style; a replaced ha-drawer / hui-root is picked up by resolving again. */
  ensure() {
    if (this.dash === null) return;
    const lost = [...this.hosts.values()].some(h => !h.isConnected || !jamKioskStyles(h.shadowRoot).length);
    if (lost) this.apply();
  },
  located() {
    if (this.dash === null) return;
    if (this.dashOf() !== this.dash) this.clear();
  },
  clear() {
    clearTimeout(this.lpT); this.lpT = null; this.lpAt = null;
    if (this.mo) this.mo.disconnect();
    for (const h of this.hosts.values()) this.unstyle(h);
    this.hosts.clear();
    if (this.dash !== null) {
      window.removeEventListener("location-changed", this._onLoc);
      window.removeEventListener("popstate", this._onLoc);
      document.removeEventListener("pointerdown", this._onDown, {capture: true});
      for (const t of ["pointerup", "pointercancel"]) document.removeEventListener(t, this._onUp, {capture: true});
      document.removeEventListener("pointermove", this._onMove, {capture: true});
    }
    this.dash = null; this.mo = null;
  },
  /* Way out: hold the top-left 48x48 corner for 2 s -> chrome back until reload. */
  press(e) {
    if (e.clientX > 48 || e.clientY > 48) return;
    clearTimeout(this.lpT);
    this.lpAt = [e.clientX, e.clientY];
    this.lpT = setTimeout(() => { this.lpT = null; this.escaped = true; this.cards.clear(); this.clear(); }, 2000);
  },
  release() { clearTimeout(this.lpT); this.lpT = null; this.lpAt = null; },
  moved(e) { if (this.lpAt && Math.hypot(e.clientX - this.lpAt[0], e.clientY - this.lpAt[1]) > 12) this.release(); },
};

class JamScreensaver extends JamBase {
  constructor() {
    super();
    this._shown = false; this._gone = false; this._idleT = null; this._tickT = null; this._slideT = null; this._tickAt = 0;
    this._list = null; this._listAt = 0; this._listP = null; this._order = []; this._pos = 0; this._k = 0; this._cur = null; this._next = null;
    this._layout = -1; this._gen = 0; this._browses = 0; this._resolves = 0;
    this._onAct = e => this._activity(e);
    this._onVis = () => this._visibility();
  }
  validate(c) {
    if (c.mode !== undefined && c.mode !== "poster" && c.mode !== "images") throw new Error("jam-screensaver: mode is poster or images");
    if (c.mode === "images" && !(c.images && ((typeof c.images.index === "string" && c.images.index) || (typeof c.images.media === "string" && c.images.media.startsWith("media-source://")))))
      throw new Error("jam-screensaver: images.index (URL of a JSON list) or images.media (media-source:// folder) is required in images mode");
    if (c.active_hours && (jamSsMinutes(c.active_hours.from) === null || jamSsMinutes(c.active_hours.to) === null)) throw new Error('jam-screensaver: active_hours needs from/to as "HH:MM"');
    for (const d of this._disables(c)) if (!d || typeof d.entity !== "string") throw new Error("jam-screensaver: disable_on needs an entity");
    if (c.kiosk !== undefined && c.kiosk !== true && c.kiosk !== false && c.kiosk !== "url") throw new Error('jam-screensaver: kiosk is true, false or "url"');
  }
  setConfig(config) {
    if (!config) throw new Error("Invalid configuration");
    this.validate(config);
    /* Keep the browsed list (and its hourly throttle) when HA re-applies the same images config. */
    const imgSig = JSON.stringify([config.mode, config.images || null]);
    if (imgSig !== this._imgSig) { this._list = null; this._listAt = 0; this._imgSig = imgSig; }
    this._config = config;
    this._shell();
    if (this.isConnected) { this._restartIdle(); JamKiosk.join(this); this._motion(true); }
    else this._motion(true);
  }
  /* motion: false switches JamCards.motion off while this card is connected; on leaves it as it found it. */
  _motion(on) {
    const off = on && !!this._config && this._config.motion === false;
    if (off && !this._motionOff) { this._motionOff = true; window.JamCards.motion = false; }
    else if (!off && this._motionOff) { this._motionOff = false; window.JamCards.motion = true; }
  }
  set hass(h) {
    this._hass = h;
    if (!this._config) return;
    const blocked = this._blocked(), was = this._wasBlocked;
    this._wasBlocked = blocked;
    if (blocked && this._shown) this._hide();
    else if (!blocked && was && !this._shown) this._restartIdle(); /* e.g. media stopped: count idle from now */
    // While shown, the texts change only with the weather / temperature entity or the locale (the clock has its own timer):
    // a kiosk on the screensaver gets hundreds of unrelated updates a minute.
    const ts = this._textSig(), old = this._tsig;
    if (this._shown && !(old && ts.every((x, i) => x === old[i]))) this._texts();
  }
  _textSig() {
    const h = this._hass, c = this._config, st = (h && h.states) || {};
    return [st[c.weather_entity], st[c.temperature_entity], h && h.locale, h && h.language];
  }
  get hass() { return this._hass; }
  connectedCallback() {
    this._motion(true);
    for (const t of ["pointerdown", "keydown", "wheel"]) document.addEventListener(t, this._onAct, {capture: true, passive: false});
    document.addEventListener("visibilitychange", this._onVis);
    if (this._layer && this._layer.parentNode !== this.shadowRoot && this._layer.parentNode !== document.body) this.shadowRoot.append(this._layer);
    this._restartIdle();
    if (this._config) JamKiosk.join(this);
  }
  disconnectedCallback() {
    super.disconnectedCallback();
    this._motion(false);
    for (const t of ["pointerdown", "keydown", "wheel"]) document.removeEventListener(t, this._onAct, {capture: true});
    document.removeEventListener("visibilitychange", this._onVis);
    this._hide();
    clearTimeout(this._idleT); this._idleT = null;
    if (this._layer && this._layer.parentNode === document.body) this._layer.remove();
    JamKiosk.leave(this);
  }
  /* true while this page has HA's sidebar + header hidden (see the kiosk notes at the top). */
  get kioskActive() { return JamKiosk.dash !== null && JamKiosk.hosts.size > 0; }
  get overlay() { return this._ov; }
  get layer() { return this._layer; }
  _disables(c) { const d = (c || this._config || {}).disable_on; return !d ? [] : Array.isArray(d) ? d : [d]; }
  _idleMs() { const s = Number(this._config.idle_seconds); return (isFinite(s) && s > 0 ? s : 120) * 1000; }
  /* ---- DOM: the card's shadow root holds only a style + the layer; the layer's own shadow root holds the overlay. ---- */
  _shell() {
    const c = this._config, root = this.shadowRoot;
    if (this._layer && this._layer.parentNode === document.body) this._layer.remove();
    root.textContent = "";
    const st = el("style"); st.textContent = ":host{display:block;height:0;overflow:visible}";
    const layer = el("div", "jam-screensaver-layer"), sr = layer.attachShadow({mode: "open"});
    layer.style.cssText = "display:block;height:0;overflow:visible";
    const lst = el("style"); lst.textContent = BASE_CSS + SS_CSS;
    const ov = el("div", "ov"); ov.dataset.view = "poster";
    ov.setAttribute("role", "dialog"); ov.setAttribute("aria-modal", "true"); ov.setAttribute("aria-label", "Screensaver, tap to close");
    setAccent(ov, c.accent);
    const poster = el("div", "poster"); poster.setAttribute("aria-hidden", "false");
    const shapes = ["b1 bar", "b2 bar", "b3 bar", "dk disc"].map(k => { const s = el("div", "sh " + k); s.setAttribute("aria-hidden", "true"); return s; });
    const txt = el("div", "txt");
    this._kick = c.kicker ? el("div", "kick", c.kicker) : null;
    this._time = el("div", "time num"); this._date = el("div", "date");
    this._wx = el("div", "wx"); this._word = el("span", "word"); this._temp = el("span", "temp num");
    if (this._kick) txt.append(this._kick);
    txt.append(this._time, this._date, this._wx);
    poster.append(...shapes, txt);
    const slides = el("div", "slides");
    this._chip = el("div", "tchip"); this._ctime = el("div", "tt num"); this._cap = el("div", "cap");
    this._chip.append(this._ctime, this._cap); slides.append(this._chip);
    ov.append(poster, slides);
    /* Everything that reaches the overlay stays there (it is the top layer; HA must not see these events). */
    for (const t of ["pointerdown", "pointerup", "mousedown", "mouseup", "touchstart", "touchend", "click", "contextmenu"]) {
      ov.addEventListener(t, e => { e.stopPropagation(); if (e.cancelable && t !== "touchstart") e.preventDefault(); if (t === "click" || t === "pointerup") this._settle(t); });
    }
    sr.append(lst, ov);
    root.append(st, layer);
    this._layer = layer; this._ov = ov; this._poster = poster; this._slides = slides;
    this._shown = false; this._gone = false;
  }
  /* ---- idle / activity ---- */
  _restartIdle() {
    clearTimeout(this._idleT); this._idleT = null;
    if (!this._config || !this.isConnected || document.hidden || this._shown) return;
    this._idleT = setTimeout(() => this._tryShow(), this._idleMs());
  }
  _activity(e) {
    if (!this._config) return;
    if (this._shown && !this._gone) {
      /* First input while shown: dismiss and swallow it. A pointer keeps the (blanked) overlay until its click lands. */
      e.stopImmediatePropagation();
      if (e.cancelable) e.preventDefault();
      if (e.type === "pointerdown") { this._ov.classList.add("gone"); this._gone = true; clearTimeout(this._goneT); this._goneT = setTimeout(() => this._hide(), 700); }
      else this._hide();
      return;
    }
    if (this._gone) { e.stopImmediatePropagation(); if (e.cancelable) e.preventDefault(); return; }
    this._restartIdle();
  }
  _settle(type) { if (this._gone && type === "click") this._hide(); }
  _visibility() {
    if (document.hidden) { this._stopTimers(); clearTimeout(this._idleT); this._idleT = null; return; }
    if (this._shown) { this._texts(); this._arm(); if (this._mode() === "images") this._armSlide(); }
    else this._restartIdle();
  }
  _inHours(d = new Date()) {
    const a = this._config.active_hours;
    if (!a) return true;
    const f = jamSsMinutes(a.from), t = jamSsMinutes(a.to), m = d.getHours() * 60 + d.getMinutes();
    if (f === t) return true;
    return f < t ? m >= f && m < t : m >= f || m < t;
  }
  _blocked() {
    const h = this._hass;
    if (!h) return false;
    return this._disables().some(d => {
      const s = h.states[d.entity];
      if (!s) return false;
      const want = d.state === undefined ? ["on", "playing"] : Array.isArray(d.state) ? d.state : [d.state];
      return want.map(String).includes(s.state);
    });
  }
  _tryShow() {
    this._idleT = null;
    if (!this.isConnected || document.hidden || this._shown) return;
    if (!this._inHours() || this._blocked()) { this._idleT = setTimeout(() => this._tryShow(), 60e3); return; }
    this._show();
  }
  /* ---- show / hide ---- */
  _mode() { return this._config.mode === "images" ? "images" : "poster"; }
  _show() {
    this._shown = true; this._gone = false; this._k = 0; this._posterTurn = false;
    this._ov.classList.remove("gone");
    this._ov.dataset.view = "poster";
    this._setLayout(false);
    this._texts();
    this._ov.classList.add("show");
    this._mount();
    this._arm();
    if (this._mode() === "images") this._startImages();
  }
  _hide() {
    clearTimeout(this._goneT);
    this._stopTimers();
    if (this._ov) { this._ov.classList.remove("show", "gone"); }
    const was = this._shown;
    this._shown = false; this._gone = false; this._gen++;
    for (const i of [this._cur, this._next]) if (i) i.remove();
    this._cur = this._next = null;
    if (was) this._restartIdle();
  }
  _stopTimers() {
    clearTimeout(this._tickT); clearTimeout(this._slideT);
    this._tickT = this._slideT = null;
  }
  /* Covered? Hit-test the corners + centre; if anything else is on top (containing block / stacking context), move to body. */
  _mount() {
    const ov = this._ov, W = innerWidth, H = innerHeight;
    if (this._layer.parentNode === document.body) return;
    const r = ov.getBoundingClientRect();
    const fits = Math.abs(r.left) < 1 && Math.abs(r.top) < 1 && Math.abs(r.width - W) < 1 && Math.abs(r.height - H) < 1;
    const sr = this._layer.shadowRoot;
    const top = fits && [[2, 2], [W - 3, 2], [W / 2, H / 2], [2, H - 3], [W - 3, H - 3]].every(([x, y]) => {
      const e = jamSsDeepAt(x, y);
      return e && e.getRootNode && e.getRootNode() === sr;
    });
    if (top) return;
    const cs = getComputedStyle(this);
    for (const v of SS_TOKENS) { const x = cs.getPropertyValue(v).trim(); if (x) this._layer.style.setProperty(v, x); }
    document.body.append(this._layer);
  }
  /* ---- clock: one timeout per minute, aligned to the minute boundary ---- */
  _arm() {
    clearTimeout(this._tickT); this._tickT = null;
    if (!this._shown || document.hidden) return;
    const delay = 60e3 - (Date.now() % 60e3) + 50;
    this._tickAt = Date.now() + delay;
    this._tickT = setTimeout(() => this._minute(), delay);
  }
  _minute() {
    this._tickT = null;
    if (!this._shown) return;
    if (!this._inHours() || this._blocked()) { this._hide(); return; }
    this._setLayout(true);
    this._texts();
    if (this._mode() === "images" && !this._listFresh()) this._fetchList();
    this._arm();
  }
  /* Seeded layout per minute (never the same twice in a row); the shapes cut in with one stepped animation. */
  _setLayout(animate) {
    let n = seed("jam-ss|" + Math.floor(Date.now() / 60e3)) % SS_LAYOUTS;
    if (n === this._layout) n = (n + 1) % SS_LAYOUTS;
    this._layout = n;
    const p = this._poster;
    p.className = `poster l${n} ${SS_ALIGN[n]}`;
    if (animate) { void p.offsetWidth; p.classList.add("shift"); }
  }
  _texts() {
    const h = this._hass, c = this._config, d = new Date(), f = jamWxTime(h);
    this._tsig = this._textSig();
    const lang = (h && h.locale && h.locale.language) || (h && h.language) || undefined;
    const mm = String(d.getMinutes()).padStart(2, "0");
    const setTime = node => {
      if (f.h12) {
        let per = d.getHours() < 12 ? "AM" : "PM";
        try { const x = new Intl.DateTimeFormat(f.loc, {hour: "numeric", hour12: true}).formatToParts(d).find(p => p.type === "dayPeriod"); if (x) per = x.value; } catch (e) { /* keep AM/PM */ }
        node.textContent = `${d.getHours() % 12 || 12}:${mm}`;
        node.append(el("small", "", per));
      } else node.textContent = `${String(d.getHours()).padStart(2, "0")}:${mm}`;
    };
    setTime(this._time); setTime(this._ctime);
    let date = "";
    try { date = d.toLocaleDateString(lang, {weekday: "long", day: "numeric", month: "long"}); } catch (e) { date = d.toDateString(); }
    this._date.textContent = date;
    /* Weather: condition word + temperature (temperature_entity wins over the weather entity's own). */
    this._wx.textContent = "";
    const w = stateObj(h, c.weather_entity), ts = stateObj(h, c.temperature_entity);
    const wok = w && !UNAVAILABLE.has(w.state);
    let temp = wok ? Number(w.attributes.temperature) : NaN, unit = wok ? w.attributes.temperature_unit || "" : "";
    if (ts && ts.state !== "" && isFinite(Number(ts.state))) { temp = Number(ts.state); unit = ts.attributes.unit_of_measurement || unit; }
    if (wok) { this._word.textContent = conditionWord(w.state); this._wx.append(this._word); }
    if (w || ts) {
      if (isFinite(temp)) { this._temp.textContent = Math.round(temp) + (unit ? unit.replace(/^°?/, "°").replace(/[CF]$/, "") : "°"); this._wx.append(this._temp); }
    }
  }
  /* ---- images mode ---- */
  /* A good list is kept for an hour; an empty one (error / empty folder) is retried after 10 min. */
  _listFresh() { return !!this._list && Date.now() - this._listAt < (this._list.length ? 3600e3 : 600e3); }
  _fetchList() {
    if (this._listP) return this._listP;
    if (this._config.images.media) return this._browse();
    const c = this._config, base = new URL(c.images.index, location.href);
    this._listP = fetch(base.href, {cache: "no-cache"})
      .then(r => { if (!r.ok) throw new Error("HTTP " + r.status); return r.json(); })
      .then(j => {
        const arr = Array.isArray(j) ? j : j && Array.isArray(j.images) ? j.images : [];
        const out = [];
        for (const it of arr) {
          const u = typeof it === "string" ? it : it && typeof it.url === "string" ? it.url : null;
          if (!u) continue;
          try { const x = new URL(u, base); if (x.protocol === "http:" || x.protocol === "https:") out.push({url: x.href, caption: it && typeof it.caption === "string" ? it.caption : ""}); } catch (e) { /* skip */ }
        }
        this._list = out; this._order = []; this._pos = 0;
      })
      .catch(() => { this._list = []; })
      .then(() => { this._listAt = Date.now(); this._listP = null; });
    return this._listP;
  }
  /* Media source folder -> [{id, caption: ""}] (images only, sorted by title). Never logs: errors just empty the list. */
  _browse() {
    const h = this._hass, id = this._config.images.media;
    this._browses++;
    const p = h && typeof h.callWS === "function" ? Promise.resolve().then(() => h.callWS({type: "media_source/browse_media", media_content_id: id})) : Promise.reject(new Error("no callWS"));
    this._listP = p
      .then(r => {
        const kids = (r && Array.isArray(r.children) ? r.children : []).filter(k => k && k.media_class === "image" && typeof k.media_content_id === "string");
        kids.sort((a, b) => String(a.title || a.media_content_id).localeCompare(String(b.title || b.media_content_id), undefined, {numeric: true}));
        this._list = kids.map(k => ({id: k.media_content_id, caption: ""})); this._order = []; this._pos = 0;
      })
      .catch(() => { this._list = []; })
      .then(() => { this._listAt = Date.now(); this._listP = null; });
    return this._listP;
  }
  _startImages() {
    const go = () => {
      if (!this._shown) return;
      if (!this._list || !this._list.length) { this._ov.dataset.view = "poster"; return; } /* fallback: never a black screen */
      this._preload();
      this._armSlide();
    };
    if (this._listFresh()) go(); else this._fetchList().then(go);
  }
  _nextItem() {
    const L = this._list;
    if (!L || !L.length) return null;
    if (this._pos >= this._order.length) {
      this._order = L.map((_, i) => i);
      const rnd = rng(seed("jam-ss|" + Date.now() + "|" + Math.random())); /* per-load seed */
      if (this._config.images.shuffle) for (let i = this._order.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [this._order[i], this._order[j]] = [this._order[j], this._order[i]]; }
      this._pos = 0;
    }
    return L[this._order[this._pos++]] || null;
  }
  _preload() {
    if (this._next || !this._shown) return;
    const it = this._nextItem();
    if (!it) { if (!this._cur) this._ov.dataset.view = "poster"; return; }
    const img = el("img", "img"); img.alt = ""; img.decoding = "async"; img._item = it;
    img.onload = () => { img._ok = true; if (!this._cur && this._ov.dataset.view === "poster" && !this._posterTurn) this._swap(); };
    const gen = this._gen;
    img.onerror = () => {
      img.onerror = img.onload = null;
      img.remove(); if (this._next === img) this._next = null;
      if (gen !== this._gen) return;
      this._list = this._list.filter(x => x !== it); this._order = []; this._pos = 0;
      if (!this._list.length) { this._listAt = Date.now(); if (this._cur) { this._cur.remove(); this._cur = null; } this._ov.dataset.view = "poster"; return; }
      this._preload();
    };
    this._next = img;
    this._slides.insertBefore(img, this._chip);
    if (!it.id) { img.src = it.url; return; }
    /* Media source: resolve right before use; the signed URL lives only on this <img>. */
    const h = this._hass;
    this._resolves++;
    (h && typeof h.callWS === "function" ? Promise.resolve().then(() => h.callWS({type: "media_source/resolve_media", media_content_id: it.id, expires: 3600})) : Promise.reject(new Error("no callWS")))
      .then(r => {
        if (gen !== this._gen || this._next !== img) return;
        const u = r && typeof r.url === "string" ? r.url : "";
        if (!u) throw new Error("no url");
        img.src = typeof h.hassUrl === "function" ? h.hassUrl(u) : u;
      })
      .catch(() => { if (img.onerror) img.onerror(); });
  }
  _swap() {
    const n = this._next;
    if (!n || !n._ok) return false;
    if (this._cur) this._cur.remove();
    n.classList.add("cur", "cut");
    this._cur = n; this._next = null;
    this._cap.textContent = n._item.caption || "";
    this._ov.dataset.view = "images";
    this._preload();
    return true;
  }
  _interval() { const s = Number(this._config.images.interval); return (isFinite(s) && s >= 1 ? s : 20) * 1000; }
  _armSlide() {
    clearTimeout(this._slideT); this._slideT = null;
    if (!this._shown || document.hidden) return;
    this._slideT = setTimeout(() => this._slide(), this._interval());
  }
  _slide() {
    this._slideT = null;
    if (!this._shown) return;
    const every = Math.round(Number(this._config.poster_every)) || 0;
    this._k++;
    this._posterTurn = every > 0 && this._k % every === 0;
    if (this._posterTurn || !this._list || !this._list.length) { this._ov.dataset.view = "poster"; this._setLayout(true); }
    else if (!this._swap() && this._cur) this._ov.dataset.view = "images"; /* next not ready: keep the current image */
    this._armSlide();
  }
  getCardSize() { return 0; }
  getGridOptions() { return {columns: 12, rows: "auto"}; }
}
register("jam-screensaver", JamScreensaver, "Jam Screensaver", "Zero-footprint kiosk screensaver: a Poster clock + weather (or a photo slideshow) after inactivity; first tap dismisses.");
