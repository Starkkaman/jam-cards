/* ---------- jam-speaker: Music Assistant speaker (0.3.6): poster + source badge + Now playing / Speakers switch ----------
   {type: custom:jam-speaker, entity (media_player, a Music Assistant player), name? (kicker "<name> speakers"; default the
    player's friendly name), accent? (default violet = music), speakers?: [media_player id | {entity, name?}] (Speakers tab;
    none -> no tab), show_shuffle? (true), poster_height? (px, default 170, min 72; below 110 the title is one line; kiosks shrink it)}
   Poster (poster cut): artwork (entity_picture via hassUrl) or a flat accent block with Golden Arm bars; kicker, title =
   media_title (2 lines), sub = artist. Text over art is ink or paper by the art's luminance (jam-tv's sampler); busy art gets
   a flat 50% ink band. Idle (idle / off / standby / on with nothing playing): slab2 poster, title = the last media_title, else
   the speaker name; no hint. Corner badge (top-right chip, flat square + word): Offline (red) / Grouped (teal, a member of
   another player's group) / Idle (dim) / Paused (dim) / Spotify Connect (green: source or app_id says Spotify) / Music
   Assistant (violet: the MA queue) / else the source name.
   Switch "Now playing" | "Speakers" (in memory). Now playing = Prev / Play-Pause (accent) / Next / Shuffle (toggle, accent
   when on; hidden without SHUFFLE_SET or show_shuffle: false), then a 30px volume bar (drag = volume_set, − / + = 5% steps,
   number at the right). Speakers = "This room" (own volume) + one row per speaker: name, Join / Playing toggle (only when both
   players have GROUPING; Join = media_player.join on this entity with group_members [it], Playing = media_player.unjoin on it),
   thin volume bar (drag sets that player's volume). A speaker that just joined gets the one-shot stamp; the rows slide in
   when the tab opens. */
const JAM_SPK_ACTIVE = new Set(["playing", "paused", "buffering"]);
const JAM_SPK_SHUFFLE = 32768;
class JamSpeaker extends JamBase {
  validate(c) {
    if (!c.entity || !String(c.entity).startsWith("media_player.")) throw new Error("jam-speaker: entity must be a media_player");
    if (c.speakers !== undefined && !Array.isArray(c.speakers)) throw new Error("jam-speaker: speakers must be a list of media_player ids");
  }
  setConfig(c) { this._tab = null; this._joined = null; super.setConfig(c.accent ? c : {...c, accent: "music"}); }
  get _speakers() {
    return (this._config.speakers || []).map(x => (typeof x === "string" ? {entity: x} : x)).filter(x => x && x.entity && x.entity !== this._config.entity);
  }
  watched() { return [this._config.entity, ...this._speakers.map(x => x.entity)]; }
  css() { return `
    .wrap{display:grid;gap:9px;align-content:start;--p-t:12px;--p-r:12px;--p-b:14px;--p-l:12px}
    .poster{height:var(--ph,170px);cursor:default}
    .poster > .face{padding:0;position:relative;overflow:hidden;background:var(--acc);color:var(--acc-fg)}
    .poster.idle > .face{background:var(--slab2);color:var(--fg)}
    .poster img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;display:block}
    .poster.art.light > .face{color:var(--on-fg)}
    .poster.art.dark > .face,.poster.art.busy > .face{color:#ece2c9}
    .poster .arm{position:absolute;right:14px;bottom:0;height:78%;gap:8px;align-items:flex-end}
    .poster .arm span{background:var(--acc-fg)}
    .poster.idle .arm span{background:var(--slab3)}
    .poster .txt{position:absolute;left:0;right:0;bottom:0;padding:8px 22px 12px 14px;display:grid;gap:4px;min-width:0}
    .poster.bars .txt{padding-right:104px}
    .poster.art.busy .txt{background:color-mix(in srgb,var(--ink) 50%,transparent)}
    .poster .kick{font:600 .6rem/1.1 var(--body);letter-spacing:.16em;text-transform:uppercase;overflow:hidden;white-space:nowrap;text-overflow:ellipsis}
    .poster .title{font-family:var(--display);font-weight:900;font-size:2rem;line-height:.92;text-transform:uppercase;letter-spacing:-.005em;
      overflow-wrap:anywhere;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;cursor:pointer}
    .poster .sub{font:500 .8rem/1.2 var(--body);overflow:hidden;white-space:nowrap;text-overflow:ellipsis}
    .poster.small .txt{padding:4px 22px 7px 12px;gap:2px}
    .poster.small .title{font-size:1.6rem;-webkit-line-clamp:1}
    .poster.small .sub{font-size:.74rem}
    .badge{position:absolute;z-index:2;top:8px;right:8px;max-width:calc(100% - 16px);display:flex;align-items:center;gap:6px;
      background:var(--slab2);color:var(--fg);padding:6px 9px 6px 8px;font:600 .58rem/1 var(--body);letter-spacing:.14em;text-transform:uppercase;
      clip-path:polygon(0 0,100% 0,100% calc(100% - 6px),calc(100% - 6px) 100%,0 100%)}
    .poster.idle .badge{background:var(--slab3)}
    .badge i{flex:none;width:8px;height:8px;background:var(--b,var(--dim))}
    .badge span{overflow:hidden;white-space:nowrap;text-overflow:ellipsis}
    .seg{display:grid;grid-template-columns:1fr 1fr;gap:4px}
    .seg .key > .face{--p-t:10px;--p-b:10px;--p-l:6px;--p-r:8px;font-size:.62rem;letter-spacing:.14em}
    .seg .key.sel > .face{background:var(--fg);color:var(--slab)}
    .pane{display:grid;gap:8px}
    .keys{display:grid;grid-template-columns:repeat(var(--n,3),minmax(0,1fr));gap:6px}
    .keys .key{min-width:0}
    .keys .key > .face{--p-t:13px;--p-b:12px;--p-l:3px;--p-r:5px;min-height:44px;display:flex;align-items:center;justify-content:center;font-size:.62rem}
    .vol{display:grid;grid-template-columns:44px minmax(0,1fr) 44px 2.6em;gap:6px;align-items:center}
    .vol .key{min-width:0}
    .vol .key > .face{--p-t:0;--p-b:0;--p-l:0;--p-r:4px;height:30px;display:grid;place-items:center;font:600 1rem/1 var(--body);letter-spacing:0}
    .vol .v{font-family:var(--display);font-weight:900;font-size:1.35rem;line-height:1;text-align:right}
    .vt{position:relative;height:30px;touch-action:none;cursor:pointer}
    .vt .strip{inset:0}
    .vt.thin{height:22px} .vt.thin .strip{inset:7px 0}
    .vt:focus-visible{outline:3px solid var(--ochre);outline-offset:2px}
    .spk{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:4px 10px;align-items:center;padding-top:8px;border-top:2px solid var(--line)}
    .spk .n{font-family:var(--display);font-weight:900;text-transform:uppercase;font-size:1rem;line-height:1;overflow:hidden;white-space:nowrap;text-overflow:ellipsis}
    .spk .vt{grid-column:1/-1}
    .spk .tog{min-width:0}
    .spk .tog > .face{--p-t:7px;--p-b:7px;--p-l:10px;--p-r:10px;font-size:.58rem;letter-spacing:.14em}
    .spk .here{font:600 .58rem/1 var(--body);letter-spacing:.14em;text-transform:uppercase;color:var(--dim)}`; }
  /* Badge [word, colour] for the poster corner. */
  _badge(s) {
    const id = this._config.entity, a = (s && s.attributes) || {};
    if (!s || UNAVAILABLE.has(s.state)) return ["Offline", "var(--red)"];
    const gm = a.group_members || [];
    const member = (gm.length > 1 && gm[0] !== id) || this._speakers.some(x => {
      const o = stateObj(this._hass, x.entity), m = (o && o.attributes.group_members) || [];
      return m.length > 1 && m[0] === x.entity && m.includes(id);
    });
    if (member) return ["Grouped", "var(--teal)"];
    if (!JAM_SPK_ACTIVE.has(s.state)) return ["Idle", "var(--dim)"];
    if (s.state === "paused") return ["Paused", "var(--dim)"];
    const src = String(a.source || ""), app = String(a.app_id || "").toLowerCase();
    if (/spotify/i.test(src) || app.includes("spotify")) return ["Spotify Connect", "var(--green)"];
    if (/music assistant/i.test(src) || app.includes("music_assistant")) return ["Music Assistant", "var(--violet)"];
    return [src || fmtState(this._hass, s), "var(--acc)"];
  }
  _poster(s, idle) {
    const c = this._config, h = this._hass, a = (s && s.attributes) || {};
    const fname = friendly(h, c.entity);
    const {root, face} = paper("div", "jam-speaker|poster|" + c.entity, {kind: "poster", cls: "poster" + (idle ? " idle" : "")});
    const ph = Math.max(72, Number(c.poster_height) || 170);
    if (c.poster_height) root.style.setProperty("--ph", ph + "px");
    if (ph < 110) root.classList.add("small"); // kiosk: one title line, tighter text block
    const src = !idle && jamTvUrl(h, a.entity_picture_local || a.entity_picture);
    const bars = () => { root.classList.add("bars"); face.prepend(armBars("jam-speaker|" + c.entity)); };
    const tone = (img, r) => JamTv.prototype._artTone.call(this, img, r); // shared art sampler (jam-tv)
    if (src) {
      root.classList.add("art", "busy");
      const img = el("img"); img.alt = ""; img.decoding = "async";
      if (JAM_TV_ART.get(src)) tone({src}, root);
      img.onload = () => tone(img, root);
      img.onerror = () => { img.remove(); root.classList.remove("art", "busy", "light", "dark"); bars(); };
      img.src = src; face.append(img);
    } else bars();
    const txt = el("div", "txt");
    txt.append(el("div", "kick", c.name ? `${c.name} speakers` : fname));
    const tt = el("div", "title", a.media_title || c.name || fname); tt.onclick = () => moreInfo(this, c.entity);
    txt.append(tt);
    if (a.media_title && a.media_artist) txt.append(el("div", "sub", a.media_artist));
    face.append(txt);
    const [word, col] = this._badge(s), bd = el("div", "badge"), sq = el("i");
    sq.setAttribute("aria-hidden", "true"); bd.style.setProperty("--b", col); bd.dataset.badge = word;
    bd.append(sq, el("span", "", word));
    face.append(bd);
    return root;
  }
  _key(label, id, cls, run, disabled) {
    const k = cutKey(label, `jam-speaker|${this._config.entity}|${id}`, cls, "chip");
    k.dataset.key = id; k.disabled = !!disabled; if (run) k.onclick = run;
    return k;
  }
  /* Volume track for one player. thin = the Speakers rows. Drag previews, release sends volume_set. Returns {track, show}. */
  _track(id, s, thin, onShow) {
    const off = !s || UNAVAILABLE.has(s.state);
    const track = el("div", "vt" + (thin ? " thin" : "")), strip = el("div", "strip"), fill = el("div", "fill");
    strip.append(fill); track.append(strip); track.dataset.entity = id;
    let cur = Math.round((Number(s && s.attributes.volume_level) || 0) * 100);
    const show = v => { cur = Math.max(0, Math.min(100, Math.round(v))); fill.style.width = cur + "%"; track.setAttribute("aria-valuenow", cur); if (onShow) onShow(cur); };
    fill.style.width = (off ? 0 : cur) + "%";
    if (off) return {track, cur: () => cur, set: () => {}};
    const send = () => this._hass.callService("media_player", "volume_set", {entity_id: id, volume_level: cur / 100});
    track.tabIndex = 0; track.setAttribute("role", "slider"); track.setAttribute("aria-label", friendly(this._hass, id) + " volume");
    track.setAttribute("aria-valuemin", 0); track.setAttribute("aria-valuemax", 100); track.setAttribute("aria-valuenow", cur);
    const at = e => { const r = track.getBoundingClientRect(); return Math.max(0, Math.min(1, (e.clientX - r.left) / r.width)) * 100; };
    track.onpointerdown = e => { track.setPointerCapture(e.pointerId); show(at(e)); track.dataset.drag = "1"; };
    track.onpointermove = e => { if (track.dataset.drag) show(at(e)); };
    track.onpointerup = e => { if (!track.dataset.drag) return; delete track.dataset.drag; show(at(e)); send(); };
    track.onpointercancel = () => { delete track.dataset.drag; };
    track.onkeydown = e => {
      const k = {ArrowRight: 1, ArrowUp: 1, ArrowLeft: -1, ArrowDown: -1}[e.key];
      if (!k) return; e.preventDefault(); show(cur + k * 5); send();
    };
    return {track, cur: () => cur, set: v => { show(v); send(); }};
  }
  _nowPane(s) {
    const c = this._config, h = this._hass, a = (s && s.attributes) || {}, off = !s || UNAVAILABLE.has(s.state);
    const pane = el("div", "pane"), call = (svc, d) => () => h.callService("media_player", svc, {entity_id: c.entity, ...d});
    const keys = [
      this._key("Prev", "prev", "", call("media_previous_track"), off),
      this._key(s && s.state === "playing" ? "Pause" : "Play", "play_pause", "on main", call("media_play_pause"), off),
      this._key("Next", "next", "", call("media_next_track"), off),
    ];
    const canShuffle = ((Number(a.supported_features) || 0) & JAM_SPK_SHUFFLE) !== 0;
    if (c.show_shuffle !== false && canShuffle) {
      const on = a.shuffle === true;
      const k = this._key("Shuffle", "shuffle", on ? "on" : "", call("shuffle_set", {shuffle: !on}), off);
      k.setAttribute("aria-pressed", String(on));
      keys.push(k);
    }
    const row = el("div", "keys"); row.style.setProperty("--n", keys.length); row.append(...keys);
    const vol = el("div", "vol"), val = el("div", "v num", off ? "—" : "");
    const t = this._track(c.entity, s, false, v => { val.textContent = String(v); });
    if (!off) val.textContent = String(t.cur());
    const dn = this._key("−", "vol_down", "", () => t.set(t.cur() - 5), off), up = this._key("+", "vol_up", "", () => t.set(t.cur() + 5), off);
    dn.setAttribute("aria-label", "Volume down"); up.setAttribute("aria-label", "Volume up");
    vol.append(dn, t.track, up, val);
    pane.append(row, vol);
    return pane;
  }
  _speakersPane(s, stampIds) {
    const c = this._config, h = this._hass, a = (s && s.attributes) || {}, pane = el("div", "pane spks");
    const meOk = !!s && !UNAVAILABLE.has(s.state) && jamCanGroup(s), mine = a.group_members || [];
    const here = el("div", "spk"); here.dataset.entity = c.entity;
    here.append(el("div", "n", "This room"), el("span", "here", c.name || friendly(h, c.entity)), this._track(c.entity, s, true).track);
    pane.append(here);
    for (const x of this._speakers) {
      const o = stateObj(h, x.entity), row = el("div", "spk"); row.dataset.entity = x.entity;
      row.append(el("div", "n", x.name || friendly(h, x.entity)));
      const ok = meOk && !!o && !UNAVAILABLE.has(o.state) && jamCanGroup(o);
      if (ok) {
        const joined = this._isJoined(x.entity);
        const t = this._key(joined ? "Playing" : "Join", "group", "tog" + (joined ? " on" : "") + (joined && stampIds.has(x.entity) ? " jam-stamp" : ""),
          () => joined ? h.callService("media_player", "unjoin", {entity_id: x.entity}) : h.callService("media_player", "join", {entity_id: c.entity, group_members: [x.entity]}));
        t.setAttribute("aria-pressed", String(joined));
        row.append(t);
      } else row.append(el("span"));
      row.append(this._track(x.entity, o, true).track);
      pane.append(row);
    }
    return pane;
  }
  _isJoined(id) {
    const me = stateObj(this._hass, this._config.entity), o = stateObj(this._hass, id);
    return ((me && me.attributes.group_members) || []).includes(id) || ((o && o.attributes.group_members) || []).includes(this._config.entity);
  }
  render(b) {
    const c = this._config, h = this._hass, s = stateObj(h, c.entity);
    const idle = !s || !JAM_SPK_ACTIVE.has(s.state);
    const spk = this._speakers, tab = spk.length && this._tab === "speakers" ? "speakers" : "now";
    // Stamp a speaker that just joined (not on the first render or a tab switch).
    const joined = new Set(spk.map(x => x.entity).filter(id => this._isJoined(id))), stamp = new Set();
    if (this._joined && motionOn()) for (const id of joined) if (!this._joined.has(id)) stamp.add(id);
    this._joined = joined;
    const {root, face: wrap} = this.paper(c.entity, {face: "wrap" + (idle ? " idle" : "")});
    root.dataset.mode = !s || UNAVAILABLE.has(s.state) ? "off" : idle ? "idle" : s.state; root.dataset.tab = tab;
    wrap.append(this._poster(s, idle));
    if (spk.length) {
      const seg = el("div", "seg");
      for (const [id, text] of [["now", "Now playing"], ["speakers", "Speakers"]]) {
        const k = cutKey(text, `jam-speaker|${c.entity}|tab|${id}`, id === tab ? "sel" : "", "chip");
        k.dataset.tab = id; k.setAttribute("aria-pressed", String(id === tab));
        k.onclick = () => {
          if (this._tab === id || (id === "now" && !this._tab)) return;
          this._tab = id; this._render(false);
          if (id === "speakers") { const p = this.shadowRoot.querySelector(".spks"); if (p) staggerIn(p.children, 0); }
        };
        seg.append(k);
      }
      wrap.append(seg);
    }
    wrap.append(tab === "speakers" ? this._speakersPane(s, stamp) : this._nowPane(s));
    b.append(root);
  }
  getCardSize() { return 6; }
}
register("jam-speaker", JamSpeaker, "Jam Speaker", "Music Assistant speaker: artwork poster with a source badge, Now playing / Speakers switch, volume, join / unjoin.");
