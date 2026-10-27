/* ---------- jam-popup: full-screen ink veil + cut sheet (top-right 18px) that opens on a URL hash ----------
   {type: custom:jam-popup, hash: "#lights-popup", title?, kicker?, accent?: colour or room alias (default ochre),
    spiral? (Vertigo flash on open, default true), cards: [card configs]}
   Accent = kicker, header rule, spiral; a configured accent is also handed to the child cards as --jam-accent (a child's
   own accent option still wins).
   Open while location.hash === hash (navigate action to "#lights-popup", a link, or the address bar).
   Close: CLOSE key, veil click, Esc, browser back. Children are created with HA's card helpers (preview: by tag). */
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
    background:var(--slab2);outline:none}
  .head{flex:none;display:flex;justify-content:space-between;align-items:flex-start;gap:12px}
  .t{display:grid;gap:4px;min-width:0}
  .t .label{color:var(--acc)}
  .t h2{font-size:clamp(1.7rem,6vw,2.4rem);overflow-wrap:anywhere}
  .rule{flex:none;height:5px;background:var(--acc)}
  .body{flex:1 1 auto;min-height:0;overflow:auto;overscroll-behavior:contain;display:grid;gap:10px;align-content:start;padding:2px 2px 4px 0}
  .body > *{display:block;min-width:0}
  .close{flex:none}
  .pop.opening .wipe{animation:jam-wipe 160ms steps(4,start) backwards}
  .pop.opening .spiral{animation:jam-flash 120ms steps(1,end) both}
  @keyframes jam-wipe{from{clip-path:inset(0 100% 0 0)}to{clip-path:inset(0 0 0 0)}}
  @keyframes jam-flash{from{visibility:visible}to{visibility:hidden}}
  @keyframes jam-wipe-up{from{clip-path:inset(100% 0 0 0)}to{clip-path:inset(0 0 0 0)}}
  @media (max-width:600px){
    .stage{align-items:flex-end;padding:0}
    .sheet{max-width:none}
    .sheet > .face{padding-bottom:calc(var(--p-b) + env(safe-area-inset-bottom,0px))}
    .pop.opening .wipe{animation-name:jam-wipe-up}
  }
  @media (prefers-reduced-motion:reduce){.pop.opening .wipe,.pop.opening .spiral{animation:none!important}}`;

/* Local helper: Vertigo spiral (Archimedean, 5 turns) as an aria-hidden SVG stroked in currentColor. */
function vertigoSpiral() {
  const NS = "http://www.w3.org/2000/svg", svg = document.createElementNS(NS, "svg"), path = document.createElementNS(NS, "path");
  svg.setAttribute("viewBox", "-100 -100 200 200"); svg.setAttribute("aria-hidden", "true");
  const pts = [];
  for (let t = 0; t <= Math.PI * 10; t += 0.12) { const r = 2 + t * 3; pts.push((r * Math.cos(t)).toFixed(1) + " " + (r * Math.sin(t)).toFixed(1)); }
  path.setAttribute("d", "M" + pts.join(" L"));
  path.setAttribute("fill", "none"); path.setAttribute("stroke", "currentColor");
  path.setAttribute("stroke-width", "7"); path.setAttribute("stroke-linecap", "square"); path.setAttribute("stroke-linejoin", "miter");
  svg.append(path);
  return svg;
}
/* Local helper: the deepest focused element across shadow roots (to restore focus on close). */
function deepActive() {
  let a = document.activeElement;
  while (a && a.shadowRoot && a.shadowRoot.activeElement) a = a.shadowRoot.activeElement;
  return a;
}

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
    this._config = config;
    this._shell();
    const sig = JSON.stringify(config.cards || []);
    if (sig !== this._cardsSig) { this._cardsSig = sig; this._makeKids(config.cards || []); }
    if (this.isConnected) this._sync(true);
  }
  set hass(h) {
    this._hass = h;
    for (const k of this._kids) { try { k.hass = h; } catch (e) { /* child without hass setter */ } }
  }
  get hass() { return this._hass; }
  connectedCallback() {
    window.addEventListener("location-changed", this._onLoc);
    window.addEventListener("hashchange", this._onLoc);
    window.addEventListener("popstate", this._onLoc);
    document.addEventListener("keydown", this._onKey);
    this._sync(true);
  }
  disconnectedCallback() {
    window.removeEventListener("location-changed", this._onLoc);
    window.removeEventListener("hashchange", this._onLoc);
    window.removeEventListener("popstate", this._onLoc);
    document.removeEventListener("keydown", this._onKey);
    if (this._open) this._hide(false);
  }
  /* Static DOM: veil, spiral, sheet (sheet cut: top-right 18px; a bottom sheet on phones). */
  _shell() {
    const c = this._config, root = this.shadowRoot;
    root.textContent = "";
    const st = el("style"); st.textContent = BASE_CSS + POPUP_CSS;
    const pop = el("div", "pop"); setAccent(pop, c.accent);
    const veil = el("div", "veil"); veil.setAttribute("aria-hidden", "true");
    veil.onclick = () => this.close();
    const spiral = el("div", "spiral"); spiral.append(vertigoSpiral());
    if (c.spiral === false) spiral.hidden = true;
    const stage = el("div", "stage");
    const key = "jam-popup|" + c.hash;
    const {root: sheet, face} = this.paper(key, {kind: "sheet", cls: "sheet wipe"});
    face.tabIndex = -1; face.setAttribute("role", "dialog"); face.setAttribute("aria-modal", "true");
    face.setAttribute("aria-label", c.title || c.kicker || "Pop-up");
    const head = el("div", "head"), t = el("div", "t");
    if (c.kicker) t.append(el("div", "label", c.kicker));
    if (c.title) t.append(el("h2", "disp", c.title));
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
    root.append(st, pop);
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
    else if (!want && this._open) this._hide(true);
  }
  _show(animate) {
    this._open = true; clearTimeout(this._backT);
    // history.back() is only safe when the hash was pushed onto this same page: we saw the page without the hash and
    // the hash entry is the very next one (Navigation API index; else history.length grew by one). Otherwise
    // (deep link, replace navigation, unknown history) close() clears the hash in place.
    const l = this._last, idx = navIndex();
    this._viaNav = !!l && l.path === location.pathname + location.search &&
      (idx != null && l.idx != null ? idx === l.idx + 1 : history.length === l.len + 1);
    this._prevFocus = deepActive();
    const de = document.documentElement, bd = document.body;
    this._scroll = [de.style.overflow, bd.style.overflow];
    de.style.overflow = "hidden"; bd.style.overflow = "hidden";
    this._pop.classList.add("open");
    this._pop.classList.remove("opening");
    if (animate) { void this._pop.offsetWidth; this._pop.classList.add("opening"); }
    this._face.scrollTop = 0; this._bodyEl.scrollTop = 0;
    try { this._face.focus({preventScroll: true}); } catch (e) { this._face.focus(); }
  }
  _hide(restoreFocus) {
    this._open = false;
    this._pop.classList.remove("open", "opening");
    if (this._scroll) {
      document.documentElement.style.overflow = this._scroll[0]; document.body.style.overflow = this._scroll[1];
      this._scroll = null;
    }
    const f = this._prevFocus; this._prevFocus = null;
    if (restoreFocus && f && f.isConnected && typeof f.focus === "function") { try { f.focus({preventScroll: true}); } catch (e) { /* ignore */ } }
  }
  /* Close: back out of the navigation that opened us; if that did not clear the hash (deep link, odd history),
     drop the hash in place and tell HA's router. */
  close() {
    if (!this._open) return;
    const hash = this._config.hash, back = this._viaNav;
    this._hide(true);
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
