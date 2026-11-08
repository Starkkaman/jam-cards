/* ---------- jam-screensaver: zero-footprint card; a full-viewport Poster clock (or photo slideshow) after inactivity ----------
   {type: custom:jam-screensaver, idle_seconds? (120), accent? (room colour, default ochre), mode?: poster (default) | images,
    weather_entity?, temperature_entity?, kicker? ("The Bungalow · kitchen"),
    images?: {index: URL of a JSON list (["a.jpg", {url, caption}]) | media: "media-source://…" folder (0.4.0),
      interval? (20 s), shuffle? (false), fade? (0.4.1: crossfade in ms, default 900, 0 = cut)},
    mode_entity? (0.4.1: input_select / select / input_boolean choosing the mode live, see below),
    poster_every? (images mode WITHOUT a mode_entity: every Nth slide is the poster; ignored when mode_entity is set, 0.7.1),
    now?: [sources, first active one wins] (0.7.1, same shape as jam-kiosk's now list; see "Now playing" below),
    lock_entity?, lock_name? ("Front door"), alerts?: [{entity, state? | states?, name?}] (audit 2026-11-03, opt-in; see
    "Door and alerts" below),
    active_hours?: {from: "06:00", to: "23:00"},
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
   back to the poster (never black).
   Crossfade (0.4.1, user request; the one exception to the stepped-cut rule, photos only): the next photo is decoded
   (img.decode()) and then fades in over the current one (opacity only, images.fade ms, ease-in-out); the old <img> is removed
   when the fade ends, so the DOM never holds more than 2 (the next preload waits for the fade). Poster <-> photos fades the
   whole slides layer over the poster. fade 0 or prefers-reduced-motion = instant cut. A fade in progress is finished at once
   when timers stop (hidden page / dismiss).
   mode_entity (0.4.1): state ~ /photo|image|slide/i -> images, /clock|poster/i -> poster; input_boolean on -> images, off ->
   poster; unavailable / unknown / anything else -> the configured mode. Images without an images config -> poster. While shown
   a change takes effect at the next slide tick (images.interval, default 20 s), never mid-slide.
   Pure modes (0.7.1): with a mode_entity the pick is exact: Clock = only the poster, Photos = only photos (no poster_every
   interleave; the photos layer is up from the start, ink + time chip until the first photo is decoded). The poster stays the
   fallback for a list / browse / resolve / load error or an empty folder. Without a mode_entity, poster_every and the poster
   while the first photo loads behave as before.
   Now playing (0.7.1, option now): the same sources as jam-kiosk's now list ({type: media, entity, states? (["playing"]),
   kicker?, app_entity?}; weather entries are ignored here, the poster has its own weather). The first active media source
   (jamNowMedia in core.js, the kiosk's logic) gives one block; none active = no block. Kicker: the source's kicker plus the app
   ("On the TV · YouTube", the app left out when it is already the title), else "Now playing" / "Paused" · the player's area
   (hass.entities / devices / areas) or its friendly name. Title = media_title (else the app), sub line = artist (else the app).
   Square cover thumb = entity_picture_local / entity_picture (jamMuUrl, like jam-speaker); no art or a load error = flat
   accent square with Golden Arm bars. A new cover is preloaded (new Image) and swapped in only once loaded; URLs are never
   logged or stored. Poster: the block sits in the text block under the weather line (so it moves with the layout and can
   never overlap the clock, date or weather), cover ~16vh, title in the display face 5.75vh (44px at 768 high), max 2 lines.
   Photos: the same block as a solid ink cut-paper label (no gradient / blur) under the time chip at the bottom-left, cover
   11.5vh (88px at 768), title 4.4vh (34px). Updated only from hass updates that change a now entity (no polling, no animation).
   Door and alerts (opt-in, both modes): one block at the top of the poster's text block (so it moves with the layout and can
   never cover the clock) and above the time chip on photos. Quiet while all is well: a small padlock + "Front door ·
   locked" in the muted label style (offline: a dashed ring, "Front door · offline"). Loud only while true: the lock
   unlocked / open / jammed or an alert matching (alert: `state` / `states`, else the alert tone, e.g. on / problem): an
   alert-red plate with ink display text "FRONT DOOR UNLOCKED · WATER LEAK", the open padlock first. The screensaver is
   dismissed by the first tap, so the block has no action. */
const SS_CSS = `
  :host{display:block;height:0;overflow:visible}
  .ov{position:fixed;inset:0;z-index:2147483000;display:none;overflow:hidden;background:var(--ink);
    --sfg:var(--ink-fg);--sdim:var(--ink-dim);--acc:var(--jam-accent,var(--ochre));--acc-fg:var(--on-fg);
    color:var(--sfg);cursor:none;user-select:none;-webkit-user-select:none;touch-action:none}
  .ov.show{display:block}
  .ov.gone{background:transparent} .ov.gone > *{visibility:hidden}
  .poster,.slides{position:absolute;inset:0}
  .ov[data-view=poster] .slides,.ov[data-view=images] .poster{display:none}
  .ov.xf .poster,.ov.xf .slides{display:block} /* poster <-> photos crossfade: both layers while the slides layer fades */
  /* Poster: flat accent shapes + a text block; each layout (l0-l5) only moves them (no transform for placement). */
  .sh{position:absolute;background:var(--acc);width:0;height:0}
  .bar{clip-path:var(--jam-shape-card,polygon(0 0,100% 0,100% calc(100% - 3vh),calc(100% - 3vh) 100%,0 100%))}
  .disc{clip-path:circle(50% at 50% 50%)}
  .txt{position:absolute;display:grid;gap:1.6vh;justify-items:start}
  .kick{font:var(--lbl-w) max(12px,2.1vh)/1.2 var(--body);letter-spacing:calc(.2em * var(--lbl-track));text-transform:var(--lbl-case);color:var(--acc)}
  .time{font-family:var(--num-font);font-weight:var(--disp-w);font-size:calc(28vh * var(--num-scale));line-height:calc(.8 * var(--disp-lead));letter-spacing:var(--jam-display-track,-.01em);color:var(--sfg);white-space:nowrap}
  .time small,.tchip small{font:var(--lbl-w) .14em/1 var(--body);letter-spacing:calc(.12em * var(--lbl-track));margin-left:.25em;vertical-align:top;color:var(--sdim)}
  .date{font:500 max(13px,3.3vh)/1.15 var(--body);letter-spacing:calc(.18em * var(--lbl-track));text-transform:var(--lbl-case);color:var(--sfg)}
  .wx{display:flex;align-items:baseline;gap:0 2.4vh;flex-wrap:wrap}
  .wx:empty{display:none}
  .word{font-family:var(--display);font-weight:var(--disp-w);font-size:calc(6.4vh * var(--disp-scale));line-height:calc(.9 * var(--disp-lead));text-transform:var(--disp-case);color:var(--sfg)}
  .temp{font-family:var(--num-font);font-weight:var(--disp-w);font-size:calc(6.4vh * var(--num-scale));line-height:calc(.9 * var(--disp-lead));color:var(--acc)}
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
  .shift .sh{animation:var(--jam-kf-ss-cut,jam-ss-cut) calc(240ms * var(--dur)) var(--jam-ease-3,steps(3,end)) 1 both}
  .shift .txt{animation:var(--jam-kf-ss-pop,jam-ss-pop) calc(160ms * var(--dur)) var(--jam-ease-2,steps(2,end)) 1 both}
  @keyframes jam-ss-cut{from{transform:scaleX(0);transform-origin:0 0}to{transform:none;transform-origin:0 0}}
  @keyframes jam-ss-pop{from{opacity:0}to{opacity:1}}
  /* Images: at most two <img> (current + preloading next), contained on ink. */
  .img{position:absolute;inset:0;width:100%;height:100%;object-fit:contain;background:var(--ink);visibility:hidden}
  .img.cur,.img.in{visibility:visible}
  .img.cut{animation:var(--jam-kf-ss-pop,jam-ss-pop) calc(120ms * var(--dur)) var(--jam-ease-2,steps(2,end)) 1 both}
  .sdock{position:absolute;left:3vw;bottom:4vh;display:grid;gap:1.4vh;justify-items:start}
  .tchip{display:grid;gap:.6vh;padding:1.4vh 2.4vh 1.6vh 2vh;background:var(--acc);color:var(--acc-fg);
    clip-path:var(--jam-shape-chip,polygon(0 0,100% 0,100% calc(100% - 10px),calc(100% - 10px) 100%,0 100%))}
  .tchip .tt{font-family:var(--num-font);font-weight:var(--disp-w);font-size:calc(8vh * var(--num-scale));line-height:calc(.85 * var(--disp-lead));white-space:nowrap}
  .tchip small{color:var(--acc-fg)}
  .tchip .cap{font:var(--lbl-w) max(12px,1.8vh)/1.2 var(--body);letter-spacing:calc(.16em * var(--lbl-track));text-transform:var(--lbl-case);max-width:40vw}
  .tchip .cap:empty{display:none}
  /* Now playing (0.7.1): poster block in the text column; photos label = the same block on solid ink. */
  .np{display:flex;align-items:center;gap:2.6vh;margin-top:2.2vh;max-width:min(62vw,820px);min-width:0;text-align:left}
  .np.off{display:none}
  .np .th{flex:none;position:relative;width:16vh;height:16vh;background:var(--acc);overflow:hidden}
  .np .th .cv{position:absolute;inset:0;background:center/cover no-repeat}
  .np .th .arm{position:absolute;left:16%;right:16%;bottom:0;height:72%;gap:9%}
  .np .th .arm span{background:var(--ink);max-width:22%}
  .np .th.bars .cv,.np .th:not(.bars) .arm{display:none}
  .np .nt{display:grid;gap:1vh;min-width:0;justify-items:start}
  .np .nb{font-family:var(--display);font-weight:var(--disp-w);font-size:calc(5.75vh * var(--disp-scale));line-height:calc(.92 * var(--disp-lead));text-transform:var(--disp-case);letter-spacing:var(--jam-display-track,-.005em);color:var(--sfg);
    max-width:100%;overflow-wrap:anywhere;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}
  .np .ns{font:var(--lbl-w) max(12px,2.3vh)/1.2 var(--body);letter-spacing:calc(.14em * var(--lbl-track));text-transform:var(--lbl-case);color:var(--sdim)}
  .np .kick,.np .ns{max-width:100%;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
  .np .ns:empty{display:none}
  .r .np{flex-direction:row-reverse;text-align:right} .r .np .nt{justify-items:end}
  .sdock .np{margin:0;gap:2vh;padding:1.6vh 3vh 1.6vh 1.6vh;background:var(--ink);max-width:min(64vw,760px);
    clip-path:var(--jam-shape-card,polygon(0 0,100% 0,100% calc(100% - 14px),calc(100% - 14px) 100%,0 100%))}
  .sdock .np .th{width:11.5vh;height:11.5vh}
  .sdock .np .nb{font-size:calc(4.4vh * var(--disp-scale))}
  .sdock .np .ns{font-size:max(12px,2vh)}
  /* Door and alerts (opt-in): quiet line / loud alert plate, first in the text block and in the photos dock. */
  .al{display:flex;align-items:center;gap:1.4vh;max-width:min(70vw,900px);min-width:0;text-align:left}
  .al.off{display:none}
  .al svg{flex:none;width:2.6vh;height:2.6vh;min-width:16px;min-height:16px;display:block}
  .al .at{min-width:0;font:var(--lbl-w) max(13px,2.1vh)/1.2 var(--body);letter-spacing:calc(.16em * var(--lbl-track));text-transform:var(--lbl-case);color:var(--sdim);
    white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
  .al.quiet{color:var(--sdim)}
  .al.offline svg{border-radius:50%;outline:2px dashed var(--sdim);outline-offset:3px}
  .al.loud{gap:2vh;padding:1.4vh 3vh 1.4vh 2.2vh;background:var(--red);color:var(--on-fg)}
  .al.loud svg{width:6vh;height:6vh}
  .al.loud .at{font-family:var(--display);font-weight:var(--disp-w);font-size:calc(5vh * var(--disp-scale));line-height:calc(.95 * var(--disp-lead));
    letter-spacing:var(--jam-display-track,0);text-transform:var(--disp-case);color:var(--on-fg)}
  .r .al{flex-direction:row-reverse;text-align:right}
  .sdock .al.quiet{padding:1vh 1.6vh;background:var(--ink)}
  @media (prefers-reduced-motion:reduce){.shift .sh,.shift .txt,.img.cut{animation:none!important}.img,.slides{transition:none!important}}`;
/* Tokens carried onto the layer when it moves to document.body (the theme may be set on an HA view, not on <html>):
   every --jam-* token (JAM_TOKENS from core, generated from tokens/). */
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

/* Poster composition (motif screensaver): three flat bars + a disc, placed per layout (.poster.l0-l5 in SS_CSS). A pack
   returns its own shape nodes (class "sh" keeps the layout-change cut motion). */
defineMotif("screensaver", () => ["b1 bar", "b2 bar", "b3 bar", "dk disc"].map(k => { const s = el("div", "sh " + k); s.setAttribute("aria-hidden", "true"); return s; }));
class JamScreensaver extends JamBase {
  constructor() {
    super();
    this._shown = false; this._gone = false; this._idleT = null; this._tickT = null; this._slideT = null; this._tickAt = 0;
    this._list = null; this._listAt = 0; this._listP = null; this._order = []; this._pos = 0; this._k = 0; this._cur = null; this._next = null;
    this._layout = -1; this._gen = 0; this._browses = 0; this._resolves = 0; this._live = "poster"; this._fading = false;
    this._fadeT = this._fadeEnd = this._xfT = this._xfEnd = null;
    this._onAct = e => this._activity(e);
    this._onVis = () => this._visibility();
  }
  validate(c) {
    if (c.mode !== undefined && c.mode !== "poster" && c.mode !== "images") throw new Error("jam-screensaver: mode is poster or images");
    if (c.mode === "images" && !(c.images && ((typeof c.images.index === "string" && c.images.index) || (typeof c.images.media === "string" && c.images.media.startsWith("media-source://")))))
      throw new Error("jam-screensaver: images.index (URL of a JSON list) or images.media (media-source:// folder) is required in images mode");
    if (c.active_hours && (jamSsMinutes(c.active_hours.from) === null || jamSsMinutes(c.active_hours.to) === null)) throw new Error('jam-screensaver: active_hours needs from/to as "HH:MM"');
    for (const d of this._disables(c)) if (!d || typeof d.entity !== "string") throw new Error("jam-screensaver: disable_on needs an entity");
    if (c.mode_entity !== undefined && typeof c.mode_entity !== "string") throw new Error("jam-screensaver: mode_entity is an entity id");
    if (c.now !== undefined && !Array.isArray(c.now)) throw new Error("jam-screensaver: now must be a list");
    for (const n of c.now || []) if (!n || !["media", "weather"].includes(n.type) || typeof n.entity !== "string") throw new Error("jam-screensaver: now sources are {type: media | weather, entity}");
    if (c.lock_entity !== undefined && !(typeof c.lock_entity === "string" && /^lock\./.test(c.lock_entity))) throw new Error("jam-screensaver: lock_entity must be a lock.* entity");
    if (c.alerts !== undefined && !(Array.isArray(c.alerts) && c.alerts.every(a => a && typeof a.entity === "string"))) throw new Error("jam-screensaver: alerts is a list of {entity, state?, name?}");
    if (c.kiosk !== undefined && c.kiosk !== true && c.kiosk !== false && c.kiosk !== "url") throw new Error('jam-screensaver: kiosk is true, false or "url"');
  }
  setConfig(config) {
    if (!config) throw new Error("Invalid configuration");
    this.validate(config);
    jamFxOption(this, config);
    /* Keep the browsed list (and its hourly throttle) when HA re-applies the same images config. */
    const imgSig = JSON.stringify([config.mode, config.images || null]);
    if (imgSig !== this._imgSig) { this._list = null; this._listAt = 0; this._imgSig = imgSig; }
    this._config = config;
    this._shell();
    if (this._preview) return; // editor / card picker preview: inert (see `preview` below)
    if (this.isConnected) { this._restartIdle(); JamKiosk.join(this); this._motion(true); }
    else this._motion(true);
  }
  /* HA sets card.preview = true in the card picker, the card editor and edit mode: the card is then inert (no idle timer,
     no page listeners, no overlay, no kiosk chrome, no motion switch); it starts as usual when preview turns false. */
  get preview() { return !!this._preview; }
  set preview(v) {
    v = !!v;
    if (v === !!this._preview) return;
    this._preview = v;
    if (!this.isConnected) return;
    if (v) this._detach(); else this._attach();
  }
  /* motion: false switches JamCards.motion off while this card is connected; on leaves it as it found it. */
  _motion(on) {
    const off = on && !!this._config && this._config.motion === false;
    if (off && !this._motionOff) { this._motionOff = true; window.JamCards.motion = false; }
    else if (!off && this._motionOff) { this._motionOff = false; window.JamCards.motion = true; }
  }
  set hass(h) {
    this._themeChanged(h); // a theme / dark-mode switch re-reads the look (and re-copies the tokens onto a body layer)
    this._hass = h;
    if (!this._config) return;
    const blocked = this._blocked(), was = this._wasBlocked;
    this._wasBlocked = blocked;
    if (blocked && this._shown) this._hide();
    else if (!blocked && was && !this._shown) this._restartIdle(); /* e.g. media stopped: count idle from now */
    // While shown, the texts change only with the weather / temperature / now entities or the locale (the clock has its own timer):
    // a kiosk on the screensaver gets hundreds of unrelated updates a minute.
    const ts = this._textSig(), old = this._tsig;
    if (this._shown && !(old && ts.every((x, i) => x === old[i]))) this._texts();
  }
  _textSig() {
    const h = this._hass, c = this._config, st = (h && h.states) || {};
    const out = [st[c.weather_entity], st[c.temperature_entity], h && h.locale, h && h.language];
    for (const n of this._nowSrcs()) out.push(st[n.entity], n.app_entity ? st[n.app_entity] : null);
    if (c.lock_entity) out.push(st[c.lock_entity]);
    for (const a of c.alerts || []) out.push(st[a.entity]);
    return out;
  }
  get hass() { return this._hass; }
  connectedCallback() {
    lookWatch(this);
    if (!this._preview) this._attach();
  }
  /* Page listeners, idle timer, kiosk chrome and the motion switch (connected and not a preview). */
  _attach() {
    if (this._layer && this._layer.parentNode !== this.shadowRoot && this._layer.parentNode !== document.body) this.shadowRoot.append(this._layer);
    this._motion(true);
    for (const t of ["pointerdown", "keydown", "wheel"]) document.addEventListener(t, this._onAct, {capture: true, passive: false});
    document.addEventListener("visibilitychange", this._onVis);
    this._restartIdle();
    if (this._config) JamKiosk.join(this);
  }
  disconnectedCallback() {
    super.disconnectedCallback();
    this._detach();
  }
  _detach() {
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
    const ov = el("div", "ov"); ov.dataset.view = "poster";
    ov.setAttribute("role", "dialog"); ov.setAttribute("aria-modal", "true"); ov.setAttribute("aria-label", "Screensaver, tap to close");
    setAccent(ov, c.accent);
    const poster = el("div", "poster"); poster.setAttribute("aria-hidden", "false");
    const shapes = motif("screensaver", this); this._shapes = shapes; this._ssLook = lookAt(this);
    const txt = el("div", "txt");
    this._kick = c.kicker ? el("div", "kick", c.kicker) : null;
    this._time = el("div", "time num"); this._date = el("div", "date");
    this._wx = el("div", "wx"); this._word = el("span", "word"); this._temp = el("span", "temp num");
    if (this._kick) txt.append(this._kick);
    this._al = (c.lock_entity || (c.alerts || []).length) ? [this._alBlock(), this._alBlock()] : null; /* [poster, photos] */
    this._alKey = null;
    if (this._al) txt.append(this._al[0].box);
    this._np = [this._npBlock(), this._npBlock()]; /* [poster block, photos label] */
    this._npKey = null; this._npArt = null; this._npPre = null;
    txt.append(this._time, this._date, this._wx, this._np[0].box);
    poster.append(...shapes, txt);
    const slides = el("div", "slides");
    this._chip = el("div", "tchip"); this._ctime = el("div", "tt num"); this._cap = el("div", "cap");
    this._chip.append(this._ctime, this._cap);
    this._sdock = el("div", "sdock");
    if (this._al) this._sdock.append(this._al[1].box);
    this._sdock.append(this._chip, this._np[1].box); slides.append(this._sdock);
    ov.append(poster, slides);
    /* Everything that reaches the overlay stays there (it is the top layer; HA must not see these events). */
    for (const t of ["pointerdown", "pointerup", "mousedown", "mouseup", "touchstart", "touchend", "click", "contextmenu"]) {
      ov.addEventListener(t, e => { e.stopPropagation(); if (e.cancelable && t !== "touchstart") e.preventDefault(); if (t === "click" || t === "pointerup") this._settle(t); });
    }
    sr.append(ov);
    jamStyle(sr, SS_CSS, this.dataset.look);
    root.append(st, layer);
    this._layer = layer; this._ov = ov; this._poster = poster; this._slides = slides;
    this._shown = false; this._gone = false;
  }
  /* ---- idle / activity ---- */
  _restartIdle() {
    clearTimeout(this._idleT); this._idleT = null;
    if (!this._config || !this.isConnected || this._preview || document.hidden || this._shown) return;
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
    if (this._shown) { this._texts(); this._arm(); this._armSlide(); }
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
    if (!this.isConnected || this._preview || document.hidden || this._shown) return;
    if (!this._inHours() || this._blocked()) { this._idleT = setTimeout(() => this._tryShow(), 60e3); return; }
    this._show();
  }
  /* ---- show / hide ---- */
  /* mode_entity -> "images" | "poster" | null (null = use the configured mode). */
  _entityMode() {
    const id = this._config.mode_entity, s = id && this._hass && this._hass.states && this._hass.states[id];
    if (!s || UNAVAILABLE.has(s.state)) return null;
    const v = String(s.state);
    if (v === "on" || v === "off") return v === "on" ? "images" : "poster";
    if (/photo|image|slide/i.test(v)) return "images";
    if (/clock|poster/i.test(v)) return "poster";
    return null;
  }
  _hasImages() {
    const i = this._config.images;
    return !!(i && ((typeof i.index === "string" && i.index) || (typeof i.media === "string" && i.media.startsWith("media-source://"))));
  }
  /* The wanted mode now; this._live is the mode in effect while shown (changes only at a slide tick). */
  _mode() {
    const m = this._entityMode() || (this._config.mode === "images" ? "images" : "poster");
    return m === "images" && this._hasImages() ? "images" : "poster";
  }
  /* Crossfade length (ms): images.fade (default 900), 0 = cut; reduced motion = cut. */
  _fadeMs() {
    const im = this._config.images || {}, f = im.fade === undefined ? 900 : Number(im.fade);
    try { if (window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches) return 0; } catch (e) { /* old engine */ }
    return isFinite(f) && f > 0 ? Math.min(f, 5000) : 0;
  }
  /* Theme tokens onto the layer (it lives in document.body when an HA ancestor would clip it); only changed ones. */
  _copyTokens() { copyTokens(this, this._layer); }
  /* queueLook (connect, theme switch): data-look + the look pack's sheet on the overlay's layer. */
  _lookChanged(look) {
    if (this._ov && this._ov.dataset.look !== look) this._ov.dataset.look = look;
    if (this._poster && this._ssLook !== look && motifsDiffer(this._ssLook, look)) { // the composition is a motif (R7)
      const next = motif("screensaver", look);
      for (const s of this._shapes) s.remove();
      this._poster.prepend(...next); this._shapes = next;
    }
    this._ssLook = look;
    if (this._layer && this._layer.shadowRoot) jamRestyle(this._layer.shadowRoot, look);
  }
  /* Every queueLook batch (also a dark / light switch, same look): a body layer re-copies the tokens; data-fx follows the card. */
  _themeRefresh() {
    if (this._layer && this._layer.parentNode === document.body) this._copyTokens();
    if (this._ov) setFx(this._ov, this.hasAttribute("data-fx"));
  }
  _show() {
    this._shown = true; this._gone = false; this._k = 0; this._posterTurn = false;
    this._live = this._mode();
    this._ov.classList.remove("gone");
    /* Pure Photos (mode_entity): the photos layer from the start (ink + time chip until the first photo); else the poster. */
    this._ov.dataset.view = this._live === "images" && this._config.mode_entity ? "images" : "poster";
    this._setLayout(false);
    this._texts();
    const look = this.dataset.look || JAM_LOOK;
    if (this._ov.dataset.look !== look) this._ov.dataset.look = look;
    jamRestyle(this._layer.shadowRoot, look); setFx(this._ov, this.hasAttribute("data-fx"));
    this._ov.classList.add("show");
    this._mount();
    this._arm();
    if (this._live === "images") this._startImages(); else this._armSlide();
  }
  _hide() {
    clearTimeout(this._goneT);
    this._stopTimers();
    if (this._ov) { this._ov.classList.remove("show", "gone"); }
    const was = this._shown;
    this._shown = false; this._gone = false;
    this._dropImages();
    if (was) this._restartIdle();
  }
  _dropImages() {
    clearTimeout(this._fadeT); this._fadeT = this._fadeEnd = null;
    this._gen++; this._fading = false;
    for (const i of [this._cur, this._next]) if (i) i.remove();
    this._cur = this._next = null;
  }
  /* Stops the clock + slide timers; a crossfade in progress is finished at once (never left half-way with 2 visible). */
  _stopTimers() {
    clearTimeout(this._tickT); clearTimeout(this._slideT);
    this._tickT = this._slideT = null;
    if (this._fadeEnd) this._fadeEnd();
    if (this._xfEnd) this._xfEnd();
  }
  /* Switch the visible layer; with a fade the slides layer crossfades over the poster (opacity only). */
  _view(v) {
    const ov = this._ov, sl = this._slides;
    if (ov.dataset.view === v) return;
    if (this._xfEnd) this._xfEnd();
    const ms = this._shown ? this._fadeMs() : 0;
    ov.dataset.view = v;
    if (!ms) { this._afterView(); return; }
    ov.classList.add("xf");
    sl.style.transition = "none"; sl.style.opacity = v === "images" ? "0" : "1";
    void sl.offsetWidth;
    sl.style.transition = `opacity ${ms}ms ease-in-out`; sl.style.opacity = v === "images" ? "1" : "0";
    this._xfEnd = () => {
      clearTimeout(this._xfT); this._xfT = null; this._xfEnd = null;
      ov.classList.remove("xf"); sl.style.transition = sl.style.opacity = "";
      this._afterView();
    };
    this._xfT = setTimeout(this._xfEnd, ms + 30);
  }
  /* Poster mode via mode_entity: no photos kept once the poster is fully up. */
  _afterView() { if (this._ov.dataset.view === "poster" && this._live === "poster" && (this._cur || this._next)) this._dropImages(); }
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
    this._copyTokens();
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
    if (this._live === "images" && !this._listFresh()) this._fetchList();
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
    /* Time of day (R10, New Wave's drifting light): 0..1 over the local day, on the overlay; only written when it changes. */
    const day = ((d.getHours() * 60 + d.getMinutes()) / 1440).toFixed(4);
    if (this._ov && this._ov.style.getPropertyValue("--jam-ss-day") !== day) this._ov.style.setProperty("--jam-ss-day", day);
    const lang = (h && h.locale && h.locale.language) || (h && h.language) || undefined;
    const mm = String(d.getMinutes()).padStart(2, "0");
    const setTime = node => {
      if (f.h12) {
        let per = d.getHours() < 12 ? "AM" : "PM";
        try { const x = new Intl.DateTimeFormat(f.loc, {hour: "numeric", hour12: true}).formatToParts(d).find(p => p.type === "dayPeriod"); if (x) per = x.value; } catch (e) { /* keep AM/PM */ }
        jamClockText(node, d.getHours() % 12 || 12, mm);
        node.append(el("small", "", per));
      } else jamClockText(node, String(d.getHours()).padStart(2, "0"), mm);
    };
    setTime(this._time); setTime(this._ctime);
    this._date.textContent = jamDateText(d, lang); // "Wednesday · October 28", the kiosk's format (core)
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
    this._nowRender();
    this._alRender();
  }
  /* ---- door and alerts (opt-in) ---- */
  _alBlock() {
    const box = el("div", "al off"), gl = el("span", "gl"), at = el("div", "at");
    gl.setAttribute("aria-hidden", "true"); box.append(gl, at);
    return {box, gl, at, glyph: null};
  }
  /* -> {tone: "loud" | "quiet" | "offline", closed, text} or null (nothing configured to show). */
  _alState() {
    const h = this._hass, c = this._config, loud = [];
    let lock = null;
    const name = typeof c.lock_name === "string" && c.lock_name.trim() ? c.lock_name.trim() : "Front door";
    if (c.lock_entity) {
      const s = stateObj(h, c.lock_entity);
      if (!s || UNAVAILABLE.has(s.state)) lock = {tone: "offline", closed: true, text: `${name} · ${OFFLINE.toLowerCase()}`};
      else if (lockAlert(s)) loud.push(`${name} ${String(s.state).replace(/_/g, " ")}`);
      else lock = {tone: "quiet", closed: s.state === "locked", text: `${name} · ${String(fmtState(h, s)).toLowerCase()}`};
    }
    for (const a of c.alerts || []) {
      const s = stateObj(h, a.entity);
      if (!s) continue;
      const want = a.states !== undefined ? [].concat(a.states).map(String) : a.state !== undefined ? [String(a.state)] : null;
      if (want ? want.includes(String(s.state)) : ["alert", "on"].includes(tone(s))) loud.push(a.name || friendly(h, a.entity));
    }
    if (loud.length) return {tone: "loud", closed: !(c.lock_entity && lockAlert(stateObj(h, c.lock_entity))), text: loud.join(" · ")};
    return lock;
  }
  _alRender() {
    if (!this._al) return;
    const a = this._hass ? this._alState() : null, key = a ? a.tone + "|" + a.closed + "|" + a.text : "";
    if (key === this._alKey) return;
    this._alKey = key;
    for (const b of this._al) {
      b.box.className = "al " + (a ? a.tone + (a.tone === "offline" ? " quiet" : "") : "off");
      if (!a) continue;
      if (b.glyph !== a.closed) { b.glyph = a.closed; b.gl.innerHTML = jamLockSvg(a.closed); }
      b.at.textContent = a.text;
    }
    this._ov.dataset.alert = a && a.tone === "loud" ? "on" : "off";
  }
  /* ---- now playing (0.7.1) ---- */
  _nowSrcs() { return (this._config.now || []).filter(n => n && n.type === "media" && typeof n.entity === "string"); }
  _npBlock() {
    /* The cover is a background (not an <img>): the overlay's <img>s are the slideshow's, max 2. */
    const box = el("div", "np off"), th = el("div", "th bars"), img = el("div", "cv"), nt = el("div", "nt");
    const kick = el("div", "kick nk"), big = el("div", "nb"), sub = el("div", "ns");
    th.setAttribute("aria-hidden", "true");
    th.append(img); nt.append(kick, big, sub); box.append(th, nt);
    return {box, th, img, kick, big, sub, arm: null};
  }
  /* The player's area name (entity, else device area), else its friendly name. */
  _npWhere(id) {
    const h = this._hass || {}, e = h.entities && h.entities[id], dev = e && e.device_id && h.devices && h.devices[e.device_id];
    const aid = (e && e.area_id) || (dev && dev.area_id), ar = aid && h.areas && h.areas[aid];
    return ar && ar.name ? String(ar.name) : friendly(this._hass, id);
  }
  /* First active media source -> {id, kick, title, sub, url} or null. */
  _nowItem() {
    for (const src of this._nowSrcs()) {
      const n = jamNowMedia(this._hass, src);
      if (!n) continue;
      const app = n.app && n.app !== n.big ? n.app : "";
      const kick = src.kicker ? src.kicker + (app ? " · " + app : "") : `${n.state === "paused" ? "Paused" : "Now playing"} · ${this._npWhere(src.entity)}`;
      const sub = src.kicker && app && n.small === app ? "" : n.small;
      return {id: src.entity, kick, title: n.big, sub, url: jamMuUrl(this._hass, n.attrs.entity_picture_local || n.attrs.entity_picture) || null};
    }
    return null;
  }
  /* Writes both blocks only when something changed; a new cover is preloaded and swapped in once loaded (never logged). */
  _nowRender() {
    const n = this._hass ? this._nowItem() : null, key = n ? JSON.stringify([n.id, n.kick, n.title, n.sub, n.url]) : "";
    if (key === this._npKey) return;
    this._npKey = key;
    for (const b of this._np) {
      b.box.classList.toggle("off", !n);
      if (!n) continue;
      b.kick.textContent = n.kick; b.big.textContent = n.title; b.sub.textContent = n.sub;
      if (!b.arm || b.arm._id !== n.id) { if (b.arm) b.arm.remove(); b.arm = motif("empty", this, "jam-screensaver|" + n.id); b.arm._id = n.id; b.th.append(b.arm); }
    }
    this._ov.dataset.now = n ? "on" : "off";
    if (!n) return;
    const url = n.url;
    if (url === this._npArt) return;
    if (this._npPre) { this._npPre.onload = this._npPre.onerror = null; this._npPre = null; }
    const art = ok => { this._npArt = url; for (const b of this._np) { b.th.classList.toggle("bars", !ok); b.img.style.backgroundImage = ok ? `url(${JSON.stringify(url)})` : ""; } };
    if (!url) { art(false); return; }
    const pre = new Image();
    this._npPre = pre;
    pre.onload = () => { if (this._npPre !== pre) return; this._npPre = null; art(true); };
    pre.onerror = () => { if (this._npPre !== pre) return; this._npPre = null; art(false); };
    pre.src = url;
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
      if (!this._shown || this._live !== "images") return;
      if (!this._list || !this._list.length) { this._view("poster"); return; } /* fallback: never a black screen */
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
    if (!it) { if (!this._cur) this._view("poster"); return; }
    const img = el("img", "img"); img.alt = ""; img.decoding = "async"; img._item = it;
    img.onload = () => { img._ok = true; if (!this._cur && this._live === "images" && !this._posterTurn) this._swap(); };
    const gen = this._gen;
    img.onerror = () => {
      img.onerror = img.onload = null;
      img.remove(); if (this._next === img) this._next = null;
      if (gen !== this._gen) return;
      this._list = this._list.filter(x => x !== it); this._order = []; this._pos = 0;
      if (!this._list.length) { this._listAt = Date.now(); if (this._cur && !this._fading) { this._cur.remove(); this._cur = null; } this._view("poster"); return; }
      this._preload();
    };
    this._next = img;
    this._slides.insertBefore(img, this._sdock);
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
  /* Show the preloaded next image once it is decoded: crossfade over the current one (or a cut / layer fade). */
  _swap() {
    const n = this._next;
    if (!n || !n._ok || this._fading) return false;
    this._fading = true;
    const gen = this._gen;
    const ready = typeof n.decode === "function" ? n.decode().catch(() => {}) : Promise.resolve();
    ready.then(() => {
      this._fading = false;
      if (gen !== this._gen || this._next !== n || !this._shown || this._live !== "images") return;
      const old = this._cur, ms = this._fadeMs();
      this._cap.textContent = n._item.caption || "";
      if (!old || !ms || this._ov.dataset.view !== "images") {
        /* first photo / back from the poster (the layer fades) / fade 0 (stepped cut) */
        if (old) old.remove();
        n.classList.add("cur"); if (!ms) n.classList.add("cut");
        this._cur = n; this._next = null;
        this._view("images");
        this._preload();
        return;
      }
      this._fading = true;
      n.style.opacity = "0"; n.classList.add("in"); void n.offsetWidth;
      n.style.transition = `opacity ${ms}ms ease-in-out`; n.style.opacity = "1";
      this._fadeEnd = () => {
        clearTimeout(this._fadeT); this._fadeT = null; this._fadeEnd = null; this._fading = false;
        if (gen !== this._gen) return;
        old.remove();
        n.classList.remove("in"); n.classList.add("cur"); n.style.transition = n.style.opacity = "";
        this._cur = n; this._next = null;
        this._preload();
      };
      this._fadeT = setTimeout(this._fadeEnd, ms + 30);
    });
    return true;
  }
  _interval() { const s = Number((this._config.images || {}).interval); return (isFinite(s) && s >= 1 ? s : 20) * 1000; }
  /* Slide tick: in images mode, and in poster mode too when mode_entity may switch to photos. */
  _armSlide() {
    clearTimeout(this._slideT); this._slideT = null;
    if (!this._shown || document.hidden || (this._live !== "images" && !this._config.mode_entity)) return;
    this._slideT = setTimeout(() => this._slide(), this._interval());
  }
  _slide() {
    this._slideT = null;
    if (!this._shown) return;
    const m = this._mode();
    if (m !== this._live) { /* mode_entity changed: switch at this tick */
      this._live = m; this._k = 0; this._posterTurn = false;
      if (m === "poster") { this._view("poster"); this._setLayout(true); }
      else this._startImages();
      this._armSlide();
      return;
    }
    if (m === "poster") { this._armSlide(); return; }
    const every = this._config.mode_entity ? 0 : Math.round(Number(this._config.poster_every)) || 0; /* pure Photos with a mode_entity */
    this._k++;
    this._posterTurn = every > 0 && this._k % every === 0;
    if (this._posterTurn || !this._list || !this._list.length) { this._view("poster"); this._setLayout(true); }
    else if (!this._swap() && this._cur) this._view("images"); /* next not ready: keep the current image */
    this._armSlide();
  }
  getCardSize() { return 0; }
  getGridOptions() { return {columns: 12, rows: "auto"}; }
}
register("jam-screensaver", JamScreensaver, "Jam Screensaver", "Zero-footprint kiosk screensaver: a Poster clock + weather (or a photo slideshow) after inactivity; first tap dismisses.");
