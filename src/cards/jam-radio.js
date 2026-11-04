/* ---------- jam-radio: a media_player as the T3 pocket radio (Braun look card, 2026-11-03; a jam-speaker variant) ----------
   {type: custom:jam-radio, entity (media_player, a Music Assistant player), name? (room; default the friendly name),
    accent? (default violet = music), speakers?, pinned?, show_shuffle? (true), show_favorite? (true), favorite_entity?,
    config_entry_id? (all as jam-speaker: the panel B and its Speakers view, the Favourite button)}
   After the Braun look-cards mockup (T3 speaker): a dot grille as the full-height left column (aria-hidden; 96px, 72px on
   cards up to 400px, hidden under 300px), and on the right: the kicker ("Room · source" with the source dot, as jam-speaker) with Shuffle / Favourite (as
   jam-speaker: shuffle_set, the MA favourite button), a small dark display (the look's ink) with the title and the artist
   (idle: the room and "Last played: ..."; offline: Offline) that is a button: tap = jam-speaker's panel B (library,
   speakers), then the round 44px keys Prev / Play-Pause (accent fill only while playing) / Next (dashed outlines when
   offline) and the 84px ribbed volume wheel (76px on narrow cards) with the volume number (16px) on it.
   The wheel is a real slider (role=slider 0-100): roll it with a finger or the mouse (vertical drag, up = louder; or
   sideways), the mouse wheel (sent after 300 ms), arrows +/-5, PageUp / PageDown +/-10, Home / End; media_player.volume_set
   on release. The ribs turn with the volume (set once per value, no animation). The class extends JamSpeaker: favourite
   memory, kicker, transport calls and panel B are jam-speaker's own. */
class JamRadio extends JamSpeaker {
  validate(c) {
    super.validate(c);
    if (c.size !== undefined) throw new Error("jam-radio: no size option (jam-speaker has the kiosk size)");
  }
  get _kiosk() { return false; }
  getCardSize() { return 3; }
  getGridOptions() { return {columns: 12, rows: "auto", min_columns: 6}; }
  css() { return JAM_MU_BASE_CSS + `
    .host{container-type:inline-size}
    .rd > .face{display:grid;grid-template-columns:96px minmax(0,1fr);gap:12px;--p-t:14px;--p-r:14px;--p-b:14px;--p-l:14px}
    .rd-gr{position:relative;align-self:stretch;min-height:120px;background:var(--slab2);color:var(--fg);overflow:hidden;border-radius:var(--jam-radius-poster,0px);
      clip-path:var(--jam-shape-poster,polygon(0 0,100% 0,100% calc(100% - 12px),calc(100% - 12px) 100%,0 100%))}
    .rd-gr svg{position:absolute;inset:6px;width:calc(100% - 12px);height:calc(100% - 12px);display:block}
    .rd.off .rd-gr{color:var(--dim)}
    .rd-r{display:grid;gap:8px;align-content:start;min-width:0}
    .rd-hd{display:flex;align-items:center;justify-content:space-between;gap:8px;min-height:32px}
    .rd .kk{display:flex;gap:8px;align-items:center;min-width:0;font:var(--lbl-w) 12px/1.15 var(--body);letter-spacing:calc(.14em * var(--lbl-track));text-transform:var(--lbl-case);color:var(--dim)}
    .rd .kk i{flex:none;width:10px;height:10px;background:var(--b,var(--dim))}
    .rd .kk span{min-width:0;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}
    .rd .bk{display:flex;gap:6px;flex:none}
    .rd .bk .ikey{min-width:0;width:32px;height:32px}
    .rd .bk .ikey > .face{height:32px;--ic:16px}
    .rd .bk .shuf.on > .face{background:var(--acc);color:var(--acc-fg)}
    .rd .bk .fav > .face{color:var(--pink)} .rd .bk .fav.on > .face{background:var(--pink);color:var(--on-fg)}
    .rd .bk .ikey:disabled > .face{color:var(--dim)}
    .rd-lcd{display:grid;gap:2px;min-height:52px;padding:8px 12px;background:var(--rd-lcd,var(--ink));color:var(--rd-lcd-fg,var(--ink-fg));border:1px solid var(--line);
      text-align:left;border-radius:calc(var(--jam-radius-poster,0px) * .6)}
    .rd-lcd b{font:var(--disp-w) calc(22px * var(--disp-scale))/calc(1.05 * var(--disp-lead)) var(--display);text-transform:var(--disp-case);
      letter-spacing:var(--jam-display-track,.005em);display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;overflow-wrap:anywhere}
    .rd-lcd small{font:500 13px/1.25 var(--body);color:var(--rd-lcd-dim,var(--ink-dim));white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
    .rd-ctl{display:flex;align-items:center;gap:4px;flex-wrap:wrap}
    .rd-k{display:grid;place-items:center;width:44px;height:44px;border-radius:999px;background:var(--slab2);color:var(--fg);--ic:20px;flex:none}
    .rd-k[data-key=play_pause]{width:52px}
    .rd-k.main{background:var(--acc);color:var(--acc-fg)}
    .rd-k:disabled{cursor:default;background:transparent;color:var(--dim);border:1.5px dashed var(--line)}
    .rd-k:not(:disabled):active .ico{transform:var(--press-from)}
    .rd-wh{position:relative;width:84px;height:84px;border-radius:50%;margin-left:auto;background:var(--slab2);color:var(--dim);touch-action:none;flex:none}
    .rd-wh[role=slider]{cursor:ns-resize}
    .rd-wh[role=slider]:focus-visible{outline:3px solid var(--focus);outline-offset:2px}
    .rd-wh svg{position:absolute;inset:0;width:100%;height:100%;display:block}
    .rd-wh line{stroke:currentColor;stroke-width:1.6}
    .rd-wh .rd-vn{position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);min-width:38px;height:38px;padding:0 4px;border-radius:19px;
      display:grid;place-items:center;background:var(--slab);color:var(--fg);font:600 16px/1 var(--body);font-variant-numeric:tabular-nums}
    .rd-wh[aria-disabled=true]{color:var(--line)}
    @container (max-width:400px){.rd > .face{grid-template-columns:72px minmax(0,1fr)} .rd-wh{width:76px;height:76px}}
    @container (max-width:300px){.rd > .face{grid-template-columns:minmax(0,1fr)} .rd-gr{display:none}}`; }
  /* A hass update mid-roll would rebuild the wheel under the finger: render once the roll ends. */
  _render(force) {
    if (this._wdrag && !force) { this._wpend = true; return; }
    super._render(force);
  }
  _wEnd() { this._wdrag = false; if (this._wpend) { this._wpend = false; this._render(false); } }
  disconnectedCallback() {
    if (this._wheelT) { clearTimeout(this._wheelT); this._wheelT = null; if (this._wheelSend) this._wheelSend(); }
    if (this._wdrag) { this._wdrag = false; this._wpend = true; }
    super.disconnectedCallback();
  }
  connectedCallback() {
    super.connectedCallback();
    if (this._wpend && this._config && this._hass) { this._wpend = false; this._render(false); }
  }
  render(b) {
    const c = this._config, h = this._hass, s = stateObj(h, c.entity), a = (s && s.attributes) || {};
    const off = !s || UNAVAILABLE.has(s.state), idle = off || !JAM_SPK_ACTIVE.has(s.state), room = this._room();
    this._favFetch(s);
    if (this._panel) this._panel.update();
    const {root, face} = this.paper(c.entity, {cls: "rd" + (off ? " off" : "")});
    root.dataset.mode = off ? "off" : idle ? "idle" : s.state;
    face.append(this._grille(), this._right(s, a, off, idle, room));
    b.append(root);
  }
  /* T3 dot grille: a field of dots filling the whole left column (an SVG pattern, 10px pitch), aria-hidden. */
  _grille() {
    const g = el("div", "rd-gr"), NS = "http://www.w3.org/2000/svg", svg = document.createElementNS(NS, "svg");
    const mk = (t, a) => { const n = document.createElementNS(NS, t); for (const k in a) n.setAttribute(k, a[k]); return n; };
    g.setAttribute("aria-hidden", "true");
    const pat = mk("pattern", {id: "rd-dots", width: "10", height: "10", patternUnits: "userSpaceOnUse", x: "0", y: "0"});
    pat.append(mk("circle", {cx: "5", cy: "5", r: "2.3", fill: "currentColor"}));
    const defs = mk("defs", {}); defs.append(pat);
    svg.append(defs, mk("rect", {width: "100%", height: "100%", fill: "url(#rd-dots)"}));
    g.append(svg);
    return g;
  }
  _right(s, a, off, idle, room) {
    const r = el("div", "rd-r"), hd = el("div", "rd-hd"), bk = el("div", "bk");
    const sh = this._shuffleKey(s, off), fv = this._favKey(s, off);
    if (sh) bk.append(sh);
    if (fv) bk.append(fv);
    hd.append(this._kicker(s, true));
    if (bk.children.length) hd.append(bk);
    // Display: title + artist; tap = panel B.
    const lcd = el("button", "rd-lcd"); lcd.type = "button"; lcd.dataset.key = "more";
    lcd.setAttribute("aria-haspopup", "dialog");
    const title = off ? room : !idle && a.media_title ? a.media_title : room;
    const sub = off ? (s ? "Offline" : "Missing") : !idle ? (a.media_title ? a.media_artist || "" : this._badge(s)[0])
      : a.media_title ? `Last played: ${a.media_title}${a.media_artist ? " · " + a.media_artist : ""}` : this._badge(s)[0];
    lcd.append(el("b", null, title));
    if (sub) lcd.append(el("small", null, sub));
    lcd.setAttribute("aria-label", `${title}${sub ? ", " + sub : ""}. ${room} music: library and speakers`);
    lcd.onclick = () => this._openPanel();
    // Round keys + the volume wheel.
    const ctl = el("div", "rd-ctl"), id = this._config.entity, playing = !!s && s.state === "playing";
    const key = (glyph, label, k, cls, svc) => {
      const b = el("button", "rd-k" + (cls ? " " + cls : "")); b.type = "button"; b.dataset.key = k;
      b.setAttribute("aria-label", label); b.append(jamMuIcon(glyph)); b.disabled = off;
      b.onclick = () => jamCall(b, this._hass, "media_player", svc, {entity_id: id});
      return b;
    };
    ctl.append(key("prev", "Previous track", "prev", "", "media_previous_track"),
      key(playing ? "pause" : "play", playing ? "Pause" : "Play", "play_pause", playing ? "main" : "", "media_play_pause"), // filled only while playing
      key("next", "Next track", "next", "", "media_next_track"), this._wheel(s, off, room));
    r.append(hd, lcd, ctl);
    return r;
  }
  /* Ribbed volume wheel (role=slider). */
  _wheel(s, off, room) {
    const w = el("div", "rd-wh"), NS = "http://www.w3.org/2000/svg", svg = document.createElementNS(NS, "svg"), g = document.createElementNS(NS, "g");
    svg.setAttribute("viewBox", "-50 -50 100 100"); svg.setAttribute("aria-hidden", "true");
    for (let i = 0; i < 36; i++) {
      const t = i * Math.PI / 18, ln = document.createElementNS(NS, "line");
      ln.setAttribute("x1", (34 * Math.sin(t)).toFixed(2)); ln.setAttribute("y1", (-34 * Math.cos(t)).toFixed(2));
      ln.setAttribute("x2", (48 * Math.sin(t)).toFixed(2)); ln.setAttribute("y2", (-48 * Math.cos(t)).toFixed(2));
      g.append(ln);
    }
    svg.append(g);
    const vn = el("span", "rd-vn");
    w.append(svg, vn);
    let cur = Math.round((Number(s && s.attributes.volume_level) || 0) * 100);
    const show = v => {
      cur = Math.max(0, Math.min(100, Math.round(v)));
      vn.textContent = off ? "—" : String(cur);
      g.setAttribute("transform", `rotate(${(off ? 0 : cur) * 2.7})`);
      w.style.setProperty("--lv", (off ? 0 : cur) / 100); // level 0..1 (R10 look hook)
      if (!off) { w.setAttribute("aria-valuenow", cur); w.setAttribute("aria-valuetext", cur + "%"); }
    };
    if (off) { w.setAttribute("aria-disabled", "true"); w.setAttribute("aria-hidden", "true"); show(0); return w; }
    w.tabIndex = 0; w.setAttribute("role", "slider"); w.setAttribute("aria-label", `${room} volume`);
    w.setAttribute("aria-valuemin", "0"); w.setAttribute("aria-valuemax", "100");
    show(cur);
    const id = this._config.entity;
    const send = () => jamCall(w, this._hass, "media_player", "volume_set", {entity_id: id, volume_level: cur / 100}, "set");
    let p = null; // {x, y, v0, moved}
    w.addEventListener("pointerdown", e => {
      if (e.button || p) return;
      p = {x: e.clientX, y: e.clientY, v0: cur, moved: false};
      try { w.setPointerCapture(e.pointerId); } catch (err) { /* synthetic pointer */ }
    });
    w.addEventListener("pointermove", e => {
      if (!p) return;
      const dx = e.clientX - p.x, dy = e.clientY - p.y;
      if (!p.moved && Math.hypot(dx, dy) < 4) return;
      p.moved = true; this._wdrag = true;
      show(p.v0 + (Math.abs(dy) >= Math.abs(dx) ? -dy : dx) / 2); // 2px per percent; up / right = louder
    });
    const end = cancel => {
      if (!p) return;
      const q = p; p = null;
      if (q.moved && !cancel && cur !== q.v0) send();
      else if (cancel) show(q.v0);
      this._wEnd();
    };
    w.addEventListener("pointerup", () => end(false));
    w.addEventListener("pointercancel", () => end(true));
    w.addEventListener("wheel", e => {
      if (!e.deltaY) return;
      e.preventDefault();
      show(cur - e.deltaY / 20 * (e.deltaMode === 1 ? 20 : 1));
      this._wdrag = true;
      clearTimeout(this._wheelT);
      this._wheelSend = () => { this._wheelSend = null; send(); this._wEnd(); };
      this._wheelT = setTimeout(() => { this._wheelT = null; if (this._wheelSend) this._wheelSend(); }, 300);
    }, {passive: false});
    w.addEventListener("keydown", e => {
      const step = {ArrowRight: 5, ArrowUp: 5, ArrowLeft: -5, ArrowDown: -5, PageUp: 10, PageDown: -10}[e.key];
      let v = null;
      if (step) v = cur + step; else if (e.key === "Home") v = 0; else if (e.key === "End") v = 100;
      if (v == null) return;
      e.preventDefault(); show(v); send();
    });
    return w;
  }
}
register("jam-radio", JamRadio, "Jam Radio", "Music Assistant speaker as a T3 pocket radio: dot grille, dark display (tap = library), round keys, a ribbed volume wheel; shuffle and favourite.");
