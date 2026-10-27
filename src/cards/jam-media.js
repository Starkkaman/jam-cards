/* ---------- jam-media (v2): now playing as a duotone print + transport, volume, sources, players, group ----------
   {type: custom:jam-media, entity (media_player), name?, controls?: [prev, play_pause, next, stop],
    show_art? (true), show_volume? (default: when the player supports volume), sources?: true | [subset],
    players?: [media_player ids] (chip row switching the controlled player, kept in memory),
    group?: [media_player ids] (toggle chips: media_player.join / unjoin with the controlled player;
    hidden unless both have the GROUPING feature bit), accent? (DESIGN "Colour system"),
    compact? (mini layout: 52px art, title, sub line, one key = ⋯ with `more`, else play/pause),
    more?: {title?, kicker?, cards: [card configs]} (⋯ key opening a sheet with these cards; they get this card's hass),
    title_entity?, state_entity?, picture_entity?, sub_entities?: [id | {entity, name?}] (players without a media_player,
    e.g. NerveOS: title = title_entity's state, on/paused/off tone = state_entity, art = picture_entity's entity_picture,
    sub line = name · each sub entity "name value"; `entity` is optional then and transport/volume need it)}
   Accent = art block (paused: dim), play key, volume fill, active chips. Transport keys and chips use the chip cut.
   v1 configs (entity, name, controls) render unchanged in meaning. */
const JAM_MEDIA_VOLUME_SET = 4, JAM_MEDIA_VOLUME_MUTE = 8, JAM_MEDIA_GROUPING = 524288;
const jamCanGroup = st => !!st && ((Number(st.attributes.supported_features) || 0) & JAM_MEDIA_GROUPING) !== 0;
/* Local helpers (also used by jam-tv): child cards in a core openSheet() sheet.
   jamCardSheet(host, {title?, kicker?, accent?, cards: [card configs], css?, headerActions?, rule? (openSheet)}) opens a sheet (theme tokens copied from host, back /
   Esc / veil / CLOSE close it) whose body holds the cards, created with HA's card helpers (preview: by tag). They get
   host.hass, and later updates through sheet.hass(h) (JamSheetHost does that). A configured accent becomes the sheet accent
   and the children's --jam-accent; a custom:jam-remote child gets hide_title: true unless set. One sheet per card (host._jamSheet). Returns {close, hass, sheet}. */
function jamMakeCard(cfg, helpers, onRebuild) {
  try {
    if (helpers && helpers.createCardElement) {
      const k = helpers.createCardElement(cfg);
      // HA swaps in an error card while a custom card is still loading and fires ll-rebuild once it is defined.
      k.addEventListener("ll-rebuild", ev => { ev.stopPropagation(); onRebuild(k, jamMakeCard(cfg, helpers, onRebuild)); }, {once: true});
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
function jamCardSheet(host, opts) {
  if (host._jamSheet) host._jamSheet.close({silent: true});
  const o = opts || {}, acc = accentVar(o.accent);
  let kids = [], hass = host.hass, done = false;
  const sheet = openSheet({from: host, title: o.title, kicker: o.kicker, accent: acc || undefined, accentFg: acc ? accentFg(o.accent) : undefined,
    css: ".body > *{display:block;min-width:0}" + (o.css || ""), headerActions: o.headerActions, rule: o.rule, onClose: () => { done = true; if (host._jamSheet === api) host._jamSheet = null; }});
  const body = sheet.body;
  if (acc) body.style.setProperty("--jam-accent", acc);
  const feed = k => { if (hass) { try { k.hass = hass; } catch (e) { /* child without hass setter */ } } };
  const rebuild = (old, n) => { const i = kids.indexOf(old); if (i < 0 || done) return; kids[i] = n; if (old.parentNode) old.replaceWith(n); feed(n); };
  // A jam-remote in a sheet hides its own name/title (the sheet header names it) unless hide_title is set explicitly.
  const cfgs = (o.cards || []).map(cfg => (cfg && cfg.type === "custom:jam-remote" && cfg.hide_title === undefined ? {...cfg, hide_title: true} : cfg));
  const build = helpers => { kids = cfgs.map(cfg => jamMakeCard(cfg, helpers, rebuild)); body.textContent = ""; body.append(...kids); kids.forEach(feed); };
  if (window.loadCardHelpers) window.loadCardHelpers().then(hp => { if (!done) build(hp); }, () => { if (!done) build(null); });
  else build(null);
  const api = {sheet, hass(h) { hass = h; kids.forEach(feed); }, close: a => sheet.close(a)};
  host._jamSheet = api;
  return api;
}
/* Card plumbing for jamCardSheet: forward hass to an open sheet, close it on setConfig / disconnect. */
const JamSheetHost = Base => class extends Base {
  setConfig(c) { if (this._jamSheet) this._jamSheet.close({silent: true}); super.setConfig(c); }
  set hass(h) { super.hass = h; if (this._jamSheet) this._jamSheet.hass(h); }
  get hass() { return this._hass; }
  disconnectedCallback() { if (this._jamSheet) this._jamSheet.close({silent: true}); }
};
class JamMedia extends JamSheetHost(JamBase) {
  validate(c) {
    if (c.entity ? !c.entity.startsWith("media_player.") : !c.title_entity) throw new Error("jam-media: entity must be a media_player (or set title_entity)");
    if (c.sub_entities !== undefined && !Array.isArray(c.sub_entities)) throw new Error("jam-media: sub_entities must be a list");
    if (c.more !== undefined && !(c.more && Array.isArray(c.more.cards))) throw new Error("jam-media: more needs cards: [card configs]");
    for (const k of ["players", "group"]) if (c[k] !== undefined && !Array.isArray(c[k])) throw new Error(`jam-media: ${k} must be a list of media_player ids`);
  }
  setConfig(c) {
    if (c && this._active && !(Array.isArray(c.players) && c.players.includes(this._active))) this._active = null;
    super.setConfig(c);
  }
  /* The player the card currently controls: the in-memory pick from `players`, else `entity`. */
  get _id() { return this._active || this._config.entity; }
  watched() {
    const c = this._config, subs = (c.sub_entities || []).map(x => (x && x.entity) || x);
    return [...new Set([this._id, c.entity, ...(c.players || []), ...(c.group || []), c.title_entity, c.state_entity, c.picture_entity, ...subs])]
      .filter(x => typeof x === "string" && x);
  }
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
    .chips .key > .face{--p-t:8px;--p-b:8px;--p-l:10px;--p-r:10px;font-size:.66rem;letter-spacing:.12em;overflow-wrap:anywhere;min-height:34px;display:flex;align-items:center}
    .ctl .more > .face{font-size:1rem;letter-spacing:0}
    .mini{--p-t:10px;--p-r:14px;--p-b:14px;--p-l:10px;display:grid;grid-template-columns:52px minmax(0,1fr) auto;gap:10px;align-items:center}
    .mini .art{width:52px}
    .mini .art .arm{gap:3px} .mini .art .arm span{max-width:7px}
    .mini .title{font-size:1.05rem;line-height:.95}
    .mini .sub{font-size:.74rem;line-height:1.25;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}
    .mini .one{width:48px;min-width:48px;height:48px}
    .mini .one > .face{padding:0;display:grid;place-items:center;font:900 1.05rem/1 var(--body);letter-spacing:0}`; }
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
  /* What is playing: the media_player's attributes, or (title_entity / state_entity / picture_entity) for players without one. */
  _np() {
    const c = this._config, h = this._hass, id = this._id, s = stateObj(h, id), a = (s && s.attributes) || {};
    const ss = c.state_entity ? stateObj(h, c.state_entity) : s;
    const ts = c.title_entity ? stateObj(h, c.title_entity) : null;
    const ps = c.picture_entity ? stateObj(h, c.picture_entity) : null;
    const off = !ss || UNAVAILABLE.has(ss.state);
    const tv = ts && !UNAVAILABLE.has(ts.state) && String(ts.state).trim() ? String(ts.state) : null;
    const name = (id === c.entity && c.name) || (!id && c.name) || friendly(h, id || c.state_entity || c.title_entity);
    const title = c.title_entity ? (tv || name || "—") : (a.media_title || a.app_name || (s ? fmtState(h, s) : "—"));
    const pic = c.picture_entity ? (ps && !UNAVAILABLE.has(ps.state) ? ps.attributes.entity_picture : null) : (a.entity_picture_local || a.entity_picture);
    const paused = !!ss && (ss.state === "paused" || (!!c.state_entity && !off && tone(ss) !== "on"));
    return {s, a, ss, off, name, title, pic, paused, playing: !!s && s.state === "playing"};
  }
  _art(np, size) {
    const id = this._id || this._config.state_entity || this._config.title_entity;
    const {root: art, face} = paper("div", "jam-media-art|" + id, {kind: "chip", cls: "art" + (np.paused ? " paused" : "")});
    art.setAttribute("aria-hidden", "true"); art.onclick = () => moreInfo(this, id);
    const src = this._url(np.pic);
    if (src && !np.off) {
      const img = el("img"); img.alt = ""; img.decoding = "async"; img.src = src;
      img.onerror = () => { img.remove(); face.append(armBars("jam-media|" + id)); };
      face.append(img);
    } else face.append(armBars("jam-media|" + id));
    return art;
  }
  /* Sub line: media_player = artist / album lines; title_entity players = name · "name value" per sub entity. */
  _subParts(np) {
    const c = this._config, h = this._hass;
    return (c.sub_entities || []).map(x => {
      const e = (x && x.entity) || x, st = stateObj(h, e);
      if (!st || UNAVAILABLE.has(st.state)) return null;
      return ((x && x.name) ? x.name + " " : "") + fmtState(h, st);
    }).filter(Boolean);
  }
  _moreKey(cls) {
    const c = this._config, m = c.more;
    const k = cutKey("⋯", `jam-media|${c.entity || c.title_entity}|more`, "more" + (cls ? " " + cls : ""), "chip");
    k.dataset.key = "more"; k.setAttribute("aria-label", (m.title || c.name || "Player") + " controls");
    k.onclick = () => jamCardSheet(this, {title: m.title || this._np().name, kicker: m.kicker, accent: c.accent, cards: m.cards});
    return k;
  }
  _compact(b) {
    const c = this._config, np = this._np(), id = this._id;
    const {root, face: wrap} = this.paper(c.entity || c.title_entity, {face: `mini${np.off ? " unavail" : ""}`});
    const txt = el("div", "txt");
    const tt = el("div", "title", np.title); tt.onclick = () => moreInfo(this, id || c.title_entity);
    const parts = c.title_entity ? [np.name, ...this._subParts(np)] : [np.a.media_artist, np.name];
    txt.append(tt, el("div", "sub", parts.filter(Boolean).join(" · ")));
    wrap.append(c.show_art === false ? el("span") : this._art(np), txt);
    if (c.more) wrap.append(this._moreKey("one on"));
    else if (id) {
      const k = cutKey(np.playing ? "❚❚" : "▶", `jam-media|${c.entity}|play_pause`, "one on main", "chip");
      k.dataset.key = "play_pause"; k.setAttribute("aria-label", np.playing ? "Pause" : "Play");
      k.disabled = np.off; k.onclick = () => this._call("media_play_pause");
      wrap.append(k);
    }
    b.append(root);
  }
  render(b) {
    if (this._config.compact) { this._compact(b); return; }
    const c = this._config, h = this._hass, id = this._id, np = this._np(), s = np.s, off = np.off;
    const a = np.a, feat = Number(a.supported_features) || 0;
    const {root, face: wrap} = this.paper(c.entity || c.title_entity, {face: `wrap stripe s-${tone(np.ss)}${off ? " unavail" : ""}`});
    wrap.append(el("div", "label", np.name));

    // Player switch (in memory).
    if (c.players && c.players.length) wrap.append(this._chipRow("Player", c.players.map(p => ({
      key: p, text: friendly(h, p), on: p === id, disabled: !stateObj(h, p),
      run: () => { this._active = p === c.entity ? null : p; this._sig = null; this.hass = this._hass; },
    })), "players"));

    // Now playing: duotone art + title / artist / album.
    const np2 = el("div", "np"), showArt = c.show_art !== false;
    if (showArt) np2.append(this._art(np)); else np2.classList.add("noart");
    const txt = el("div", "txt");
    const tt = el("div", "title", np.title);
    tt.onclick = () => moreInfo(this, id || c.title_entity);
    txt.append(tt);
    if (a.media_artist) { const sb = el("div", "sub"); sb.append(el("b", "", a.media_artist)); txt.append(sb); }
    if (a.media_album_name) txt.append(el("div", "sub", a.media_album_name));
    const subs = c.title_entity ? this._subParts(np) : [];
    if (subs.length) txt.append(el("div", "sub", subs.join(" · ")));
    np2.append(txt); wrap.append(np2);

    // Transport.
    const ctl = el("div", "ctl");
    const playing = s && s.state === "playing";
    const map = {
      prev: ["Prev", "media_previous_track"], next: ["Next", "media_next_track"], stop: ["Stop", "media_stop"],
      play_pause: [playing ? "Pause" : "Play", "media_play_pause"],
    };
    for (const k of id ? c.controls || ["prev", "play_pause", "next"] : []) {
      const m = map[k]; if (!m) continue;
      const btn = cutKey(m[0], `jam-media|${c.entity}|${k}`, k === "play_pause" ? "main on" : "", "chip");
      btn.dataset.key = k; btn.disabled = off;
      btn.onclick = () => this._call(m[1]);
      ctl.append(btn);
    }
    if (c.more) ctl.append(this._moreKey());
    if (id || ctl.children.length) wrap.append(ctl);

    // Volume strip + mute.
    const hasVol = !!(feat & JAM_MEDIA_VOLUME_SET) || a.volume_level !== undefined;
    if (id && (c.show_volume === true || (c.show_volume !== false && hasVol))) wrap.append(this._volume(id, a, feat, off));

    // Sources.
    if (id && c.sources) {
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
