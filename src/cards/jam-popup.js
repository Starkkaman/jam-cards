/* ---------- jam-popup: full-screen ink veil + cut sheet (top-right 18px) that opens on a URL hash ----------
   {type: custom:jam-popup, hash: "#lights-popup", title?, kicker?, accent?: colour or room alias (default ochre),
    spiral? (Vertigo flash on open, default true), cards: [card configs]}
   Sheet face = slab; child cards get the surface tokens one step up (--jam-slab = slab2, --jam-slab2 = slab3).
   Accent = a mark beside the kicker (the kicker itself is dim text, 1.1.0), header rule, spiral; a configured accent is also
   handed to the child cards as --jam-accent (a child's own accent option still wins).
   Open while location.hash === hash (navigate action to "#lights-popup", a link, or the address bar).
   Close: CLOSE key, veil click, Esc, browser back. Children are created with HA's card helpers (preview: by tag).
   Motion: the look's open motion (Hi-Fi: the sheet rises / settles, the veil fades) and, 1.1.0, its leave on close (the
   overlay stays until it has played; a disconnect or motion off closes at once); the child cards slide in one after
   another (40 ms stagger, 0.3.5). */
const POPUP_CSS = `
  /* Zero footprint when closed: the host is a 0-height block; the overlay is position:fixed. Whether a sections
     grid adds a gap/row for a 0-height card is verified in real HA in the clone step. */
  :host{display:block;height:0;overflow:visible}
  .pop{position:fixed;inset:0;z-index:9999;display:none;--acc:var(--jam-accent,var(--ochre));--acc-fg:var(--on-fg)}
  .pop.open{display:block}
  .veil{position:absolute;inset:0;background:var(--ink)}
  .spiral{position:absolute;left:50%;top:50%;width:min(92vmin,720px);height:min(92vmin,720px);transform:translate(-50%,-50%);
    visibility:hidden;pointer-events:none;color:var(--acc)}
  .stage{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;padding:16px;pointer-events:none}
  .sheet{pointer-events:auto;width:100%;max-width:560px;height:auto}
  .sheet > .face{--p-t:16px;--p-r:18px;--p-b:18px;--p-l:18px;height:auto;max-height:88vh;display:flex;flex-direction:column;gap:12px;
    background:var(--slab);outline:none}
  .head{flex:none;display:flex;justify-content:space-between;align-items:flex-start;gap:12px}
  .t{display:grid;gap:4px;min-width:0}
  /* kicker: the dim label colour, like every eyebrow (1.1.0; the living accent #6b4428 was 2.18:1 on the Night ground); a
     configured accent shows as an 8px mark beside it */
  .t .label{color:var(--dim)}
  .t .label.acc{display:flex;align-items:center;gap:8px}
  .t .label.acc::before{content:"";flex:none;width:8px;height:8px;border-radius:50%;background:var(--acc)}
  .t h2{font-size:calc(clamp(1.7rem,6vw,2.4rem) * var(--disp-scale));overflow-wrap:anywhere}
  .rule{flex:none;height:var(--rule-h);background:var(--acc)}
  /* Child cards one surface step up (DESIGN "Tokens"): their face = slab2, their inner controls = slab3. */
  .body{flex:1 1 auto;min-height:0;overflow:auto;overscroll-behavior:contain;display:grid;gap:10px;align-content:start;padding:2px 2px 4px 0;
    --jam-slab:var(--slab2);--jam-slab2:var(--slab3)}
  .body > *{display:block;min-width:0}
  .close{flex:none}
  .pop.opening .wipe{animation:var(--jam-kf-sheet,jam-wipe) calc(160ms * var(--dur)) var(--jam-ease-4,steps(4,start)) backwards}
  .pop.opening .spiral{animation:var(--jam-kf-flash,jam-flash) calc(120ms * var(--dur)) steps(1,end) both}
  @keyframes jam-wipe{from{clip-path:inset(0 100% 0 0)}to{clip-path:inset(0 0 0 0)}}
  @keyframes jam-flash{from{visibility:visible}to{visibility:hidden}}
  @keyframes jam-wipe-up{from{clip-path:inset(100% 0 0 0)}to{clip-path:inset(0 0 0 0)}}
  @media (max-width:600px){
    .stage{align-items:flex-end;padding:0}
    .sheet{max-width:none}
    .sheet > .face{padding-bottom:calc(max(var(--p-b),var(--pad,0px)) + env(safe-area-inset-bottom,0px))}
    .pop.opening .wipe{animation-name:jam-wipe-up}
  }
  /* leaving (1.1.0): .closing keeps the overlay for sheetLeaveMs() while sheet and veil fade, then .open goes */
  .pop.closing{pointer-events:none}
  .pop.closing .wipe,.pop.closing .veil{animation:jam-popup-out calc(160ms * var(--dur)) ease-in forwards}
  .pop.closing .spiral{display:none}
  @keyframes jam-popup-out{to{opacity:0}}
  @media (prefers-reduced-motion:reduce){.pop.opening .wipe,.pop.opening .spiral,.pop.closing .wipe,.pop.closing .veil{animation:none!important}}`;

/* vertigoSpiral() and deepActive() live in src/core.js (shared with openSheet / jam-light). */

/* Local helper: index of the current history entry (Navigation API), or null where the API is missing. */
function navIndex() {
  try { const e = window.navigation && window.navigation.currentEntry; return e && typeof e.index === "number" && e.index >= 0 ? e.index : null; }
  catch (err) { return null; }
}

class JamPopup extends JamBase {
  constructor() {
    super();
    this._open = false; this._kids = []; this._cardsSig = null; this._last = null; this._build = 0;
    this._onLoc = () => this._sync(false);
    this._onKey = e => { if (this._open && e.key === "Escape") { e.preventDefault(); this.close(); } };
  }
  validate(c) {
    if (!c.hash || !/^#./.test(c.hash)) throw new Error('jam-popup: hash is required, e.g. "#lights-popup"');
    if (c.cards && !Array.isArray(c.cards)) throw new Error("jam-popup: cards must be a list");
  }
  setConfig(config) {
    if (!config) throw new Error("Invalid configuration");
    this.validate(config);
    jamFxOption(this, config);
    this._config = config;
    this._shell();
    const sig = JSON.stringify(config.cards || []);
    if (sig !== this._cardsSig) { this._cardsSig = sig; this._makeKids(config.cards || []); }
    if (this.isConnected) this._sync(true);
  }
  set hass(h) {
    this._themeChanged(h); // re-reads the look (data-look); the child cards re-render themselves
    this._hass = h;
    for (const k of this._kids) { try { k.hass = h; } catch (e) { /* child without hass setter */ } }
  }
  get hass() { return this._hass; }
  /* Look switch: the open flash is a motif (R7); a pack that draws its own gets it without a rebuild. */
  _lookChanged(look) {
    if (this._spiral && this._flashLook !== look && motifsDiffer(this._flashLook, look)) this._spiral.replaceChildren(motif("flash", look));
    this._flashLook = look;
  }
  connectedCallback() {
    lookWatch(this);
    window.addEventListener("location-changed", this._onLoc);
    window.addEventListener("hashchange", this._onLoc);
    window.addEventListener("popstate", this._onLoc);
    document.addEventListener("keydown", this._onKey);
    this._sync(true);
  }
  disconnectedCallback() {
    super.disconnectedCallback();
    clearTimeout(this._backT); this._backT = null;
    window.removeEventListener("location-changed", this._onLoc);
    window.removeEventListener("hashchange", this._onLoc);
    window.removeEventListener("popstate", this._onLoc);
    document.removeEventListener("keydown", this._onKey);
    if (this._open) this._hide(false);
    clearTimeout(this._leaveT); this._leaveT = null; if (this._pop) this._pop.classList.remove("open", "closing");
  }
  /* Static DOM: veil, spiral, sheet (sheet cut: top-right 18px; a bottom sheet on phones). */
  _shell() {
    const c = this._config, root = this.shadowRoot;
    root.textContent = "";
    const pop = el("div", "pop"); setAccent(pop, c.accent);
    const veil = el("div", "veil"); veil.setAttribute("aria-hidden", "true");
    veil.onclick = () => this.close();
    const spiral = el("div", "spiral"); spiral.append(motif("flash", this)); this._spiral = spiral; this._flashLook = lookAt(this);
    if (c.spiral === false) spiral.hidden = true;
    const stage = el("div", "stage");
    const key = "jam-popup|" + c.hash;
    const {root: sheet, face} = this.paper(key, {kind: "sheet", cls: "sheet wipe"});
    face.tabIndex = -1; face.setAttribute("role", "dialog"); face.setAttribute("aria-modal", "true");
    const head = el("div", "head"), t = el("div", "t");
    if (c.kicker) t.append(el("div", "label" + (accentVar(c.accent) ? " acc" : ""), c.kicker));
    if (c.title) { const h2 = el("h2", "disp", c.title); h2.id = "jam-popup-title"; t.append(h2); face.setAttribute("aria-labelledby", h2.id); }
    else face.setAttribute("aria-label", c.kicker || "Pop-up");
    const close = cutKey("Close ×", key + "|close", "close", "chip");
    close.setAttribute("aria-label", "Close");
    close.onclick = () => this.close();
    head.append(t, close);
    const rule = el("div", "rule"); rule.setAttribute("aria-hidden", "true");
    this._bodyEl = el("div", "body");
    if (accentVar(c.accent)) this._bodyEl.style.setProperty("--jam-accent", accentVar(c.accent));
    for (const k of this._kids) this._bodyEl.append(k);
    face.append(head, rule, this._bodyEl);
    stage.append(sheet);
    pop.append(veil, spiral, stage);
    root.append(pop);
    jamStyle(root, POPUP_CSS, this.dataset.look);
    this._pop = pop; this._face = face;
    if (this._open) pop.classList.add("open");
  }
  async _makeKids(cards) {
    const gen = ++this._build;
    let helpers = null;
    try { helpers = window.loadCardHelpers ? await window.loadCardHelpers() : null; } catch (e) { helpers = null; }
    if (gen !== this._build) return; // a newer config arrived while the helpers loaded
    this._kids = cards.map(cfg => this._makeKid(cfg, helpers));
    if (this._bodyEl) { this._bodyEl.textContent = ""; for (const k of this._kids) this._bodyEl.append(k); }
    if (this._hass) this.hass = this._hass;
  }
  _makeKid(cfg, helpers) {
    try {
      if (helpers && helpers.createCardElement) {
        const k = helpers.createCardElement(cfg);
        // HA swaps in an error card while a custom card is still loading and fires ll-rebuild once it is defined.
        k.addEventListener("ll-rebuild", ev => {
          ev.stopPropagation();
          const i = this._kids.indexOf(k), n = this._makeKid(cfg, helpers);
          if (i < 0) return;
          this._kids[i] = n;
          if (k.parentNode) k.replaceWith(n);
          if (this._hass) n.hass = this._hass;
        }, {once: true});
        return k;
      }
      const type = String((cfg && cfg.type) || "");
      const tag = type.startsWith("custom:") ? type.slice(7) : `hui-${type}-card`;
      if (!customElements.get(tag)) throw new Error(`Unknown card type: ${type}`);
      const k = document.createElement(tag);
      k.setConfig(cfg);
      return k;
    } catch (e) {
      const d = el("div", "label c-alert", e.message || String(e));
      d.style.padding = "8px 0";
      return d;
    }
  }
  _sync(initial) {
    if (!this._config) return;
    const want = location.hash === this._config.hash;
    if (!want) clearTimeout(this._backT);
    if (!want) this._last = {len: history.length, idx: navIndex(), path: location.pathname + location.search};
    if (want && !this._open) this._show(!initial);
    else if (!want && this._open) this._hide(true, true);
  }
  _show(animate) {
    this._open = true; clearTimeout(this._backT);
    clearTimeout(this._leaveT); this._leaveT = null; this._pop.classList.remove("closing", "jam-calm");
    // history.back() is only safe when the hash was pushed onto this same page: we saw the page without the hash and
    // the hash entry is the very next one (Navigation API index; else history.length grew by one). Otherwise
    // (deep link, replace navigation, unknown history) close() clears the hash in place.
    const l = this._last, idx = navIndex();
    this._viaNav = !!l && l.path === location.pathname + location.search &&
      (idx != null && l.idx != null ? idx === l.idx + 1 : history.length === l.len + 1);
    this._prevFocus = deepActive();
    // scroll lock on <html> only and the page's scroll positions kept (0.11.0-calm.3; core jamScrollLock / jamScrollSnap)
    this._snap = jamScrollSnap(this);
    if (!this._locked) { jamScrollLock(true); this._locked = true; }
    this._pop.classList.add("open");
    this._pop.classList.remove("opening");
    if (animate && motionOn()) {
      void this._pop.offsetWidth; this._pop.classList.add("opening");
      if (motionCalm()) this._pop.classList.add("jam-calm");
      staggerIn(this._bodyEl.children); // child cards slide in one after another (0.3.5)
    }
    this._face.scrollTop = 0; this._bodyEl.scrollTop = 0;
    try { this._face.focus({preventScroll: true}); } catch (e) { this._face.focus(); }
    const snap = this._snap; jamScrollBack(snap); requestAnimationFrame(() => { if (this._open) jamScrollBack(snap); });
  }
  _hide(restoreFocus, animate = false) {
    this._open = false;
    const pop = this._pop, ms = animate ? sheetLeaveMs() : 0;
    clearTimeout(this._leaveT); this._leaveT = null;
    pop.classList.remove("opening");
    if (ms) { // leave: the look's closing motion plays, then the overlay goes (a timer: no animationend needed)
      pop.classList.add("closing"); pop.classList.toggle("jam-calm", motionCalm());
      this._leaveT = setTimeout(() => { this._leaveT = null; if (!this._open) pop.classList.remove("open", "closing", "jam-calm"); }, ms + 30);
    } else pop.classList.remove("open", "closing", "jam-calm");
    if (this._locked) { jamScrollLock(false); this._locked = false; }
    const f = this._prevFocus; this._prevFocus = null;
    if (restoreFocus && f && f.isConnected && typeof f.focus === "function") { try { f.focus({preventScroll: true}); } catch (e) { /* ignore */ } }
    const s = this._snap; this._snap = null;
    if (restoreFocus && s) { jamScrollBack(s); requestAnimationFrame(() => jamScrollBack(s)); } // not on a disconnect (another view)
  }
  /* Close: back out of the navigation that opened us; if that did not clear the hash (deep link, odd history),
     drop the hash in place and tell HA's router. */
  close() {
    if (!this._open) return;
    const hash = this._config.hash, back = this._viaNav;
    this._hide(true, true);
    const clear = () => {
      if (location.hash !== hash) return;
      history.replaceState(null, "", location.pathname + location.search);
      window.dispatchEvent(new CustomEvent("location-changed", {detail: {replace: true}}));
    };
    // Fallback if back() did not remove the hash; cancelled once the hash is gone or the pop-up reopens.
    if (back) { history.back(); clearTimeout(this._backT); this._backT = setTimeout(clear, 300); } else clear();
  }
  getCardSize() { return 0; }
  getGridOptions() { return {columns: 12, rows: "auto"}; }
}
register("jam-popup", JamPopup, "Jam Pop-up", "Full-screen ink veil with a cut sheet of cards, opened by a URL hash.");
