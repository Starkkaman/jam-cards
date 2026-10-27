/* ---------- jam-media (v2): now playing as a duotone print + transport, volume, sources, players, group ----------
   {type: custom:jam-media, entity (media_player), name?, controls?: [prev, play_pause, next, stop],
    show_art? (true), show_volume? (default: when the player supports volume), sources?: true | [subset],
    players?: [media_player ids] (chip row switching the controlled player, kept in memory),
    group?: [media_player ids] (toggle chips: media_player.join / unjoin with the controlled player;
    hidden unless both have the GROUPING feature bit), accent? (DESIGN "Colour system")}
   Accent = art block (paused: dim), play key, volume fill, active chips. Transport keys and chips use the chip cut.
   v1 configs (entity, name, controls) render unchanged in meaning. */
const JAM_MEDIA_VOLUME_SET = 4, JAM_MEDIA_VOLUME_MUTE = 8, JAM_MEDIA_GROUPING = 524288;
const jamCanGroup = st => !!st && ((Number(st.attributes.supported_features) || 0) & JAM_MEDIA_GROUPING) !== 0;
class JamMedia extends JamBase {
  validate(c) {
    if (!c.entity || !c.entity.startsWith("media_player.")) throw new Error("jam-media: entity must be a media_player");
    for (const k of ["players", "group"]) if (c[k] !== undefined && !Array.isArray(c[k])) throw new Error(`jam-media: ${k} must be a list of media_player ids`);
  }
  setConfig(c) {
    if (c && this._active && !(Array.isArray(c.players) && c.players.includes(this._active))) this._active = null;
    super.setConfig(c);
  }
  /* The player the card currently controls: the in-memory pick from `players`, else `entity`. */
  get _id() { return this._active || this._config.entity; }
  watched() { const c = this._config; return [...new Set([this._id, c.entity, ...(c.players || []), ...(c.group || [])])]; }
  css() { return `
    .wrap{display:grid;gap:12px;align-content:start;container-type:inline-size}
    .np{display:grid;grid-template-columns:minmax(84px,min(36%,200px)) minmax(0,1fr);gap:14px;align-items:start}
    .np.noart{grid-template-columns:minmax(0,1fr)}
    .art{aspect-ratio:1;height:auto;cursor:pointer}
    .art > .face{padding:0;background:var(--acc);overflow:hidden;display:flex;align-items:flex-end;justify-content:center}
    .art.paused > .face{background:var(--dim)}
    .art img{display:block;width:100%;height:100%;object-fit:cover;filter:grayscale(1) contrast(1.15);mix-blend-mode:multiply}
    .art .arm{height:62%;padding-bottom:10%} .art .arm span{background:var(--acc-fg)}
    .txt{display:grid;gap:6px;min-width:0;align-content:start}
    .title{font-family:var(--display);font-weight:900;font-size:clamp(1.4rem,1rem + 4cqi,2.2rem);line-height:.92;text-transform:uppercase;
      overflow-wrap:anywhere;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;cursor:pointer}
    .sub{font:500 .9rem/1.3 var(--body);color:var(--dim);overflow-wrap:anywhere}
    .sub b{font-weight:600;color:var(--fg)}
    .ctl{display:flex;gap:8px;flex-wrap:wrap}
    .ctl .key{min-width:72px;flex:1 1 72px}
    .ctl .key > .face{--p-t:12px;--p-b:12px;--p-l:10px;--p-r:10px}
    .vol{display:grid;grid-template-columns:auto minmax(0,1fr) 3.4em;gap:10px;align-items:center}
    .vol .key{min-width:64px}
    .vol .v{font-family:var(--display);font-weight:900;font-size:1.4rem;line-height:1;text-align:right}
    .track{cursor:pointer}
    .muted .fill{background:var(--dim)}
    .grp{display:grid;gap:6px}
    .chips{display:flex;flex-wrap:wrap;gap:6px}
    .chips .key{min-width:0;max-width:100%;height:auto}
    .chips .key > .face{--p-t:8px;--p-b:8px;--p-l:10px;--p-r:10px;font-size:.66rem;letter-spacing:.12em;overflow-wrap:anywhere;min-height:34px;display:flex;align-items:center}`; }
  _url(u) {
    if (!u) return null;
    const h = this._hass;
    if (/^(https?:|data:|blob:)/i.test(u)) return u;
    try { if (h && typeof h.hassUrl === "function") return h.hassUrl(u); } catch (e) { /* fall through */ }
    return u;
  }
  _call(svc, data) { this._hass.callService("media_player", svc, {entity_id: this._id, ...data}); }
  _chipRow(label, items, kind) {
    const g = el("div", "grp " + kind); g.append(el("div", "label", label));
    const row = el("div", "chips"); g.append(row);
    for (const it of items) {
      const b = cutKey(it.text, `jam-media|${this._config.entity}|${kind}|${it.key}`, it.on ? "on" : "", "chip");
      b.setAttribute("aria-pressed", it.on ? "true" : "false");
      b.dataset.id = it.key; b.disabled = !!it.disabled; b.onclick = it.run;
      row.append(b);
    }
    return g;
  }
  render(b) {
    const c = this._config, h = this._hass, id = this._id, s = stateObj(h, id);
    const off = !s || UNAVAILABLE.has(s.state);
    const a = (s && s.attributes) || {}, feat = Number(a.supported_features) || 0;
    const {root, face: wrap} = this.paper(c.entity, {face: `wrap stripe s-${tone(s)}${off ? " unavail" : ""}`});
    wrap.append(el("div", "label", (id === c.entity && c.name) || friendly(h, id)));

    // Player switch (in memory).
    if (c.players && c.players.length) wrap.append(this._chipRow("Player", c.players.map(p => ({
      key: p, text: friendly(h, p), on: p === id, disabled: !stateObj(h, p),
      run: () => { this._active = p === c.entity ? null : p; this._sig = null; this.hass = this._hass; },
    })), "players"));

    // Now playing: duotone art + title / artist / album.
    const np = el("div", "np"), showArt = c.show_art !== false;
    if (showArt) {
      const paused = s && s.state === "paused";
      const {root: art, face} = paper("div", "jam-media-art|" + id, {kind: "chip", cls: "art" + (paused ? " paused" : "")});
      art.setAttribute("aria-hidden", "true"); art.onclick = () => moreInfo(this, id);
      const src = this._url(a.entity_picture_local || a.entity_picture);
      if (src && !off) {
        const img = el("img"); img.alt = ""; img.decoding = "async"; img.src = src;
        img.onerror = () => { img.remove(); face.append(armBars("jam-media|" + id)); };
        face.append(img);
      } else face.append(armBars("jam-media|" + id));
      np.append(art);
    } else np.classList.add("noart");
    const txt = el("div", "txt");
    const tt = el("div", "title", a.media_title || a.app_name || (s ? fmtState(h, s) : "—"));
    tt.onclick = () => moreInfo(this, id);
    txt.append(tt);
    if (a.media_artist) { const sb = el("div", "sub"); sb.append(el("b", "", a.media_artist)); txt.append(sb); }
    if (a.media_album_name) txt.append(el("div", "sub", a.media_album_name));
    np.append(txt); wrap.append(np);

    // Transport.
    const ctl = el("div", "ctl");
    const playing = s && s.state === "playing";
    const map = {
      prev: ["Prev", "media_previous_track"], next: ["Next", "media_next_track"], stop: ["Stop", "media_stop"],
      play_pause: [playing ? "Pause" : "Play", "media_play_pause"],
    };
    for (const k of c.controls || ["prev", "play_pause", "next"]) {
      const m = map[k]; if (!m) continue;
      const btn = cutKey(m[0], `jam-media|${c.entity}|${k}`, k === "play_pause" ? "main on" : "", "chip");
      btn.dataset.key = k; btn.disabled = off;
      btn.onclick = () => this._call(m[1]);
      ctl.append(btn);
    }
    wrap.append(ctl);

    // Volume strip + mute.
    const hasVol = !!(feat & JAM_MEDIA_VOLUME_SET) || a.volume_level !== undefined;
    if (c.show_volume === true || (c.show_volume !== false && hasVol)) wrap.append(this._volume(id, a, feat, off));

    // Sources.
    if (c.sources) {
      const all = a.source_list || [];
      const list = Array.isArray(c.sources) ? (all.length ? c.sources.filter(x => all.includes(x)) : c.sources) : all;
      if (list.length) wrap.append(this._chipRow("Source", list.map(x => ({
        key: x, text: x, on: a.source === x, disabled: off, run: () => this._call("select_source", {source: x}),
      })), "sources"));
    }

    // Group: join / unjoin with the controlled player. Only players with the GROUPING feature (row and member chips).
    const grp = (c.group || []).filter(g => g !== id && jamCanGroup(stateObj(h, g)));
    if (grp.length && jamCanGroup(s)) {
      const members = a.group_members || [];
      wrap.append(this._chipRow("Group", grp.map(g => {
        const gs = stateObj(h, g), joined = members.includes(g) || ((gs && gs.attributes.group_members) || []).includes(id);
        return {key: g, text: friendly(h, g), on: joined, disabled: off || !gs || UNAVAILABLE.has(gs.state),
          run: () => joined ? h.callService("media_player", "unjoin", {entity_id: g}) : this._call("join", {group_members: [g]})};
      }), "group"));
    }
    b.append(root);
  }
  _volume(id, a, feat, off) {
    const row = el("div", "vol" + (a.is_volume_muted ? " muted" : ""));
    const muted = !!a.is_volume_muted;
    const mute = cutKey(muted ? "Unmute" : "Mute", `jam-media|${this._config.entity}|mute`, muted ? "alert" : "", "chip");
    mute.dataset.key = "mute";
    mute.disabled = off || !(feat & JAM_MEDIA_VOLUME_MUTE || a.is_volume_muted !== undefined);
    mute.onclick = () => this._call("volume_mute", {is_volume_muted: !muted});
    const track = el("div", "track"), strip = el("div", "strip"), fill = el("div", "fill");
    strip.append(fill); track.append(strip);
    let cur = Math.round((Number(a.volume_level) || 0) * 100);
    const val = el("div", "v num", off ? "—" : String(cur));
    row.append(mute, track, val);
    const show = v => { cur = Math.max(0, Math.min(100, Math.round(v))); fill.style.width = cur + "%"; val.textContent = String(cur); track.setAttribute("aria-valuenow", cur); };
    fill.style.width = (off ? 0 : cur) + "%";
    if (off) return row;
    track.tabIndex = 0; track.setAttribute("role", "slider"); track.setAttribute("aria-label", "Volume");
    track.setAttribute("aria-valuemin", 0); track.setAttribute("aria-valuemax", 100); track.setAttribute("aria-valuenow", cur);
    const send = () => this._call("volume_set", {volume_level: cur / 100});
    const at = e => { const r = track.getBoundingClientRect(); return Math.max(0, Math.min(1, (e.clientX - r.left) / r.width)) * 100; };
    track.onpointerdown = e => { track.setPointerCapture(e.pointerId); show(at(e)); track.dataset.drag = "1"; };
    track.onpointermove = e => { if (track.dataset.drag) show(at(e)); };
    track.onpointerup = e => { if (!track.dataset.drag) return; delete track.dataset.drag; show(at(e)); send(); };
    track.onkeydown = e => {
      const k = {ArrowRight: 1, ArrowUp: 1, ArrowLeft: -1, ArrowDown: -1}[e.key];
      if (!k) return; e.preventDefault(); show(cur + k * 2); send();
    };
    return row;
  }
  getCardSize() { return 5; }
}
register("jam-media", JamMedia, "Jam Media", "Now playing as a duotone print, transport, volume, sources, player switch and grouping.");
