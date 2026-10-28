/* ---------- jam-tv: smart TV card (Android TV media_player + remote): poster + Now playing / Source switch ----------
   {type: custom:jam-tv, media_player (media_player.*), remote? (remote.*), name? (off kicker; default the player's name),
    sources?: [{name, color? (accent name, room alias or HA colour name; default the card accent), tap_action, hold_action?,
                match?: {app?: text | [texts], input?: text | [texts]} (when this source is on screen; a plain text or
                list = app)}]  (`launchers` = alias),
    source_label? ("Source"),
    current_app_entity? (sensor whose state is the app in front: a label or package id, e.g. sensor.hisense_tv_current_app),
    input_entity? (select/sensor whose state names the TV input, e.g. select.hisense_tv_input),
    input_app? (text | [texts]: current_app values that mean the TV is showing an input, e.g. "Live TV"; without it the
      input counts whenever it matches), input_signal_entity? (optional: the input only counts while this sensor reports
      a signal, i.e. not "No signal" / off / unavailable),
    source_entities? (ignored since 0.3.5: select states are not live signals),
    power_action? (default remote.toggle, else media_player toggle),
    volume_up_action?, volume_down_action?, mute_action? (row Vol − / Mute / Vol +; keys without an action are left out;
      vol keys repeat while held),
    stereo?: {power_action, inputs: [{name, tap_action, match?}], volume_up_action, volume_down_action, mute_action, input_entity?,
      title? ("Stereo"), accent? ("violet")} (Stereo section of the Remote sheet; hidden without it),
    remote_card? (jam-remote config merged over the default: entity = remote, media_player, sections TV (+ Stereo); set rows /
      layout / sections there to replace them; commands / labels / actions are merged), remote_title? ("Remote"),
    accent? (DESIGN "Colour system")}
   Poster (118px, bottom-right 16px cut): artwork (entity_picture, cover) or a flat accent block with Golden Arm bars; kicker =
   app / source, title = media_title (2 lines), sub = position / duration, 5px progress strip. Text over art is ink or paper by
   the art's luminance; busy art gets a flat 50% ink band behind the text. Power = the top-right corner triangle (ink, accent
   glyph; red with an ink glyph when the TV is off). Idle (on, no title): title = the source on screen, else the app. Off: slab2 poster, "TV off", "Pick a source to start".
   Switch row "Now playing" | source_label: default Now playing when on, Source when off; the choice is kept in memory until
   the TV goes on -> off. Now playing = Prev / Play-Pause (accent) / Next / Remote, then the volume row. Source = 3-up tiles
   (flat colour square + name). Highlight (0.3.5) only from live signals: the current_app_entity state against each
   source's match.app (case-insensitive; an exact match on any source wins, else a substring), then, while the TV shows an
   input (input_app / input_signal_entity), the input_entity state against match.input (exact). Nothing matches (home
   screen, screensaver, other apps) -> no tile filled. A newly matched tile gets the one-shot stamp + colour wipe.
   Remote = a sheet (jamCardSheet) with a jam-remote in colour-coded sections: TV (card accent) and Stereo (violet); the
   keyboard key sits in the sheet header (keyboard glyph, opens jamRemoteKeyboard). */
const JAM_TV_PLAYING = new Set(["playing", "paused", "buffering"]);
const JAM_TV_TV_ROWS = [["power", "back", "home", "settings"], ["dpad"], ["prev", "play_pause", "next"], ["captions", "audio_track", "source"]];
const JAM_TV_KB_SVG = '<svg viewBox="0 0 26 17" aria-hidden="true" focusable="false" fill="currentColor" shape-rendering="crispEdges">' +
  [1, 5, 9, 13, 17, 21].map(x => `<rect x="${x}" y="1" width="3" height="3"/>`).join("") +
  [3, 7, 11, 15, 19].map(x => `<rect x="${x}" y="6.5" width="3" height="3"/>`).join("") +
  '<rect x="6" y="12" width="14" height="3"/></svg>';
const JAM_TV_POWER_SVG = '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false" fill="none" stroke="currentColor" stroke-width="3" ' +
  'stroke-linecap="square"><path d="M12 3v8"/><path d="M6.3 6.3a8 8 0 1 0 11.4 0"/></svg>';
/* h:mm when the duration is an hour or more, else m:ss. */
function jamTvTime(sec, long) {
  sec = Math.max(0, Math.floor(sec));
  const h = Math.floor(sec / 3600), m = Math.floor((sec % 3600) / 60), s = sec % 60;
  return long ? `${h}:${String(m).padStart(2, "0")}` : `${Math.floor(sec / 60)}:${String(s).padStart(2, "0")}`;
}
/* Art analysis cache: src -> {light, busy} (luminance of the text area + its spread). */
const JAM_TV_ART = new Map();
class JamTv extends JamSheetHost(JamBase) {
  validate(c) {
    if (!c.media_player || !c.media_player.startsWith("media_player.")) throw new Error("jam-tv: media_player must be a media_player");
    if (c.remote && !c.remote.startsWith("remote.")) throw new Error("jam-tv: remote must be a remote");
    for (const k of ["sources", "launchers", "source_entities"]) if (c[k] !== undefined && !Array.isArray(c[k])) throw new Error(`jam-tv: ${k} must be a list`);
    if (c.stereo !== undefined && (!c.stereo || typeof c.stereo !== "object")) throw new Error("jam-tv: stereo must be an object");
  }
  setConfig(c) { this._tab = null; super.setConfig(c); }
  watched() {
    const c = this._config, st = c.stereo || {};
    return [c.media_player, c.remote, c.current_app_entity, c.input_entity, c.input_signal_entity, st.input_entity].filter(x => typeof x === "string" && x);
  }
  get _sources() { const c = this._config; return (c.sources || c.launchers || []).filter(Boolean); }
  css() { return `
    .wrap{display:grid;gap:9px;align-content:start;--p-t:12px;--p-r:12px;--p-b:14px;--p-l:12px}
    .poster{height:118px;cursor:default}
    .poster > .face{padding:0;position:relative;overflow:hidden;background:var(--acc);color:var(--acc-fg)}
    .poster.off > .face{background:var(--slab2);color:var(--fg)}
    .poster img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;display:block}
    .poster.art.light > .face{color:var(--on-fg)} /* Paper text over art is the fixed paper colour (theme --paper flips in light mode). */
    .poster.art.dark > .face,.poster.art.busy > .face{color:#ece2c9}
    .poster .arm{position:absolute;right:12px;bottom:0;height:84%;gap:7px;align-items:flex-end}
    .poster .arm span{background:var(--acc-fg)}
    .poster .txt{position:absolute;left:0;right:0;bottom:5px;padding:8px 56px 7px 12px;display:grid;gap:3px;min-width:0}
    .poster.bars .txt{padding-right:96px}
    .poster.art.busy .txt{background:color-mix(in srgb,var(--ink) 50%,transparent)}
    .poster .kick{font:600 .6rem/1.15 var(--body);letter-spacing:.16em;text-transform:uppercase;white-space:normal;overflow-wrap:normal;word-break:normal}
    .poster .title{font-family:var(--display);font-weight:900;font-size:1.55rem;line-height:.92;text-transform:uppercase;letter-spacing:-.005em;
      overflow-wrap:anywhere;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;cursor:pointer}
    .poster .sub{font:500 .72rem/1.2 var(--body)}
    .poster .prog{position:absolute;left:0;right:0;bottom:0;height:5px}
    .poster.art .prog{background:color-mix(in srgb,var(--ink) 50%,transparent)}
    .poster .prog i{position:absolute;inset:0 auto 0 0;background:currentColor}
    .pw{position:absolute;z-index:2;right:0;top:0;width:44px;height:44px;background:var(--on-fg);color:var(--acc);clip-path:polygon(0 0,100% 0,100% 100%)}
    .pw.off{background:var(--red);color:var(--on-fg)}
    .pw svg{position:absolute;right:5px;top:5px;width:16px;height:16px}
    .pw:focus-visible{outline-offset:-3px}
    .seg{display:grid;grid-template-columns:1fr 1fr;gap:4px}
    .seg .key > .face{--p-t:10px;--p-b:10px;--p-l:6px;--p-r:8px;font-size:.62rem;letter-spacing:.14em}
    .seg .key.sel > .face{background:var(--fg);color:var(--slab)}
    .pane{display:grid;gap:6px}
    .keys{display:grid;grid-template-columns:repeat(var(--n,3),minmax(0,1fr));gap:6px}
    .keys .key{min-width:0}
    .keys .key > .face{--p-t:13px;--p-b:12px;--p-l:3px;--p-r:5px;min-height:44px;display:flex;align-items:center;justify-content:center;
      font-size:.62rem;overflow-wrap:normal;word-break:normal}
    .src{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:6px}
    .src .key{min-width:0}
    .src .key > .face{--p-t:10px;--p-b:9px;--p-l:4px;--p-r:6px;min-height:62px;display:flex;flex-direction:column;align-items:center;justify-content:flex-start;
      gap:6px;font:900 .76rem/1 var(--display);letter-spacing:.01em;text-transform:uppercase}
    .src .key.on > .face{background:var(--app);color:var(--on-fg)}
    .src .nm{max-width:100%;text-align:center;overflow-wrap:normal;word-break:normal;hyphens:none;
      display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}
    .sq{flex:none;width:20px;height:20px;background:var(--app)}
    .src .key.on .sq{background:var(--on-fg)}`; }
  /* Remote sheet config: jam-remote with a TV section (card accent) and, with `stereo`, a Stereo section (violet). */
  _remoteCfg() {
    const c = this._config, rc = c.remote_card || {}, sections = [];
    if (rc.rows === undefined && rc.layout === undefined) {
      sections.push({title: "TV", accent: accentName(c.accent) || "ochre", rows: JAM_TV_TV_ROWS, labels: {captions: "Subs"}});
      const st = c.stereo;
      if (st) {
        const ins = (st.inputs || []).filter(Boolean).slice(0, 3), actions = {}, labels = {}, match = {};
        if (st.power_action) actions.power = st.power_action;
        ins.forEach((x, i) => { actions["input_" + i] = x.tap_action; labels["input_" + i] = x.name || `Input ${i + 1}`; if (x.match) match["input_" + i] = x.match; });
        const vol = [["vol_down", st.volume_down_action], ["mute", st.mute_action], ["vol_up", st.volume_up_action]].filter(([, a]) => a);
        vol.forEach(([k, a]) => { actions[k] = a; });
        const rows = [["power", ...ins.map((x, i) => "input_" + i)]];
        if (vol.length) rows.push(vol.map(([k]) => k));
        sections.push({title: st.title || "Stereo", accent: st.accent || "violet", entity: null, rows, actions, labels,
          active_entity: st.input_entity, active_match: match});
      }
    }
    const cfg = {type: "custom:jam-remote", entity: c.remote, media_player: c.media_player, name: c.name, ...rc,
      commands: {...(rc.commands || {})}, labels: {...(rc.labels || {})}, actions: {...(rc.actions || {})}};
    if (sections.length && !rc.sections) cfg.sections = sections;
    return cfg;
  }
  /* Current app as a friendly name: app_name unless it is a package id, else a known package (jam-remote's list). */
  _app(a) {
    if (a.app_name && !String(a.app_name).includes(".")) return String(a.app_name);
    return jamRemoteApp(a.app_id || a.app_name) || null;
  }
  _posParts(s) {
    const a = s.attributes, dur = Number(a.media_duration);
    if (!(dur > 0) || a.media_position == null) return null;
    let pos = Number(a.media_position) || 0;
    const at = Date.parse(a.media_position_updated_at || "");
    if (s.state === "playing" && at) pos += (Date.now() - at) / 1000;
    pos = Math.min(pos, dur);
    const long = dur >= 3600;
    return {text: `${jamTvTime(pos, long)} / ${jamTvTime(dur, long)}`, frac: pos / dur};
  }
  /* The source on screen, from live signals only (0.3.5): current_app_entity vs match.app, then the input. null = none. */
  _activeSource() {
    const c = this._config, h = this._hass, low = v => String(v).trim().toLowerCase();
    const live = id => { const e = id && stateObj(h, id); return e && !UNAVAILABLE.has(e.state) && String(e.state).trim() !== "" ? low(e.state) : null; };
    const list = this._sources.map(x => {
      const m = x.match && typeof x.match === "object" && !Array.isArray(x.match) ? x.match : {app: x.match};
      return {x, app: [].concat(m.app || []).filter(Boolean).map(low), input: [].concat(m.input || []).filter(Boolean).map(low)};
    });
    const app = live(c.current_app_entity);
    if (app) {
      const hit = list.find(k => k.app.includes(app)) || list.find(k => k.app.some(t => app.includes(t)));
      if (hit) return hit.x;
    }
    const inp = live(c.input_entity);
    if (!inp) return null;
    const apps = [].concat(c.input_app || []).filter(Boolean).map(low);
    if (apps.length && !(app && apps.some(t => app === t || app.includes(t)))) return null;
    if (c.input_signal_entity) {
      const sig = live(c.input_signal_entity);
      if (!sig || sig === "no signal" || sig === "off") return null;
    }
    const hit = list.find(k => k.input.includes(inp));
    return hit ? hit.x : null;
  }
  _openRemote() {
    const c = this._config, name = c.name || friendly(this._hass, c.media_player), rc = this._remoteCfg();
    const extra = [];
    const kbOk = rc.entity && !(rc.actions && rc.actions.keyboard) && rc.sections;
    if (kbOk) {
      const kb = cutKey("", `jam-tv|${c.media_player}|kb`, "kbd", "chip");
      kb.dataset.key = "keyboard"; kb.setAttribute("aria-label", "Keyboard");
      kb.firstChild.innerHTML = JAM_TV_KB_SVG; // static markup, no data
      kb.onclick = () => {
        if (this._kb && this._kb.isOpen()) return;
        this._kb = jamRemoteKeyboard(this._body || this, {entity: rc.entity, name, title: (rc.labels && rc.labels.keyboard) || "Keyboard",
          accent: c.accent, hass: () => this._hass, onClose: () => { this._kb = null; }});
      };
      extra.push(kb);
    }
    jamCardSheet(this, {kicker: name, title: c.remote_title || "Remote", accent: c.accent, cards: [rc], headerActions: extra, rule: rc.sections ? false : undefined,
      css: `.kbd > .face{--p-t:6px;--p-b:6px;--p-l:10px;--p-r:12px;height:100%;display:flex;align-items:center;justify-content:center;color:var(--acc)}
        .kbd svg{display:block;width:26px;height:17px}`});
  }
  disconnectedCallback() { super.disconnectedCallback(); if (this._kb) this._kb.close({silent: true}); }
  _key(label, id, cls, run, disabled) {
    const k = cutKey(label, `jam-tv|${this._config.media_player}|${id}`, cls);
    k.dataset.key = id; k.disabled = !!disabled; if (run) k.onclick = run;
    return k;
  }
  _row(keys) { const r = el("div", "keys"); r.style.setProperty("--n", Math.max(1, keys.length)); r.append(...keys); return r; }
  _power() {
    const c = this._config, h = this._hass;
    if (c.power_action) runAction(this, h, c.power_action, c.remote || c.media_player);
    else if (c.remote) h.callService("remote", "toggle", {entity_id: c.remote});
    else h.callService("media_player", "toggle", {entity_id: c.media_player});
  }
  /* Text colour over art: sample the text area (lower 60%, left 75%) on a small canvas; cross-origin art -> busy (band). */
  _artTone(img, poster) {
    let r = JAM_TV_ART.get(img.src);
    if (!r) {
      try {
        const W = 16, H = 10, cv = document.createElement("canvas"); cv.width = W; cv.height = H;
        const x = cv.getContext("2d");
        x.drawImage(img, 0, img.naturalHeight * .4, img.naturalWidth * .75, img.naturalHeight * .6, 0, 0, W, H);
        const d = x.getImageData(0, 0, W, H).data, ls = [];
        for (let i = 0; i < d.length; i += 4) ls.push(luminance([d[i], d[i + 1], d[i + 2]]));
        const m = ls.reduce((p, v) => p + v, 0) / ls.length, sd = Math.sqrt(ls.reduce((p, v) => p + (v - m) ** 2, 0) / ls.length);
        r = {light: m > .18, busy: sd > .14 || (m > .1 && m < .3)};
      } catch (e) { r = {light: false, busy: true}; }
      JAM_TV_ART.set(img.src, r);
    }
    poster.classList.remove("light", "dark", "busy");
    poster.classList.add(r.busy ? "busy" : r.light ? "light" : "dark");
  }
  _poster(s, off, playing) {
    const c = this._config, h = this._hass, a = (s && s.attributes) || {};
    const name = c.name || friendly(h, c.media_player);
    const {root, face} = paper("div", "jam-tv|poster|" + c.media_player, {kind: "poster", cls: "poster" + (off ? " off" : "")});
    const src = !off && jamTvUrl(h, a.entity_picture_local || a.entity_picture);
    const bars = () => { root.classList.add("bars"); face.prepend(armBars("jam-tv|" + c.media_player)); };
    if (src) {
      root.classList.add("art", "busy");
      const img = el("img"); img.alt = ""; img.decoding = "async";
      const cached = JAM_TV_ART.get(src);
      if (cached) this._artTone({src}, root);
      img.onload = () => this._artTone(img, root);
      img.onerror = () => { img.remove(); root.classList.remove("art", "busy", "light", "dark"); bars(); };
      img.src = src; face.append(img);
    } else if (!off) bars();
    const txt = el("div", "txt"), act = !off ? this._activeSource() : null;
    let kick, title, sub = null, frac = null;
    if (off) { kick = name; title = s && s.state !== "off" ? "Unavailable" : "TV off"; sub = "Pick a source to start"; }
    else {
      const app = this._app(a) || (act && act.name) || (a.source ? String(a.source) : null);
      const p = playing ? this._posParts(s) : null;
      if (a.media_title) { kick = app || name; title = a.media_title; }
      else { kick = name; title = (act && act.name) || app || fmtState(h, s); } // idle: the source on screen beats the launcher app
      if (p) { sub = p.text; frac = p.frac; }
    }
    txt.append(el("div", "kick", kick));
    const tt = el("div", "title", title); tt.onclick = () => moreInfo(this, c.media_player);
    txt.append(tt);
    if (sub) txt.append(el("div", "sub", sub));
    face.append(txt);
    if (frac !== null) {
      const pr = el("div", "prog"), i = el("i"); pr.setAttribute("aria-hidden", "true");
      i.style.width = (Math.max(0, Math.min(1, frac)) * 100).toFixed(1) + "%"; pr.append(i); face.append(pr);
    }
    const pw = el("button", "pw" + (off ? " off" : "")); pw.type = "button"; pw.dataset.key = "power";
    pw.setAttribute("aria-label", off ? "Power on" : "Power off");
    pw.innerHTML = JAM_TV_POWER_SVG; // static markup, no data
    pw.onclick = () => this._power();
    face.append(pw);
    return root;
  }
  _nowPane(s, off) {
    const c = this._config, h = this._hass, pane = el("div", "pane");
    const call = svc => () => h.callService("media_player", svc, {entity_id: c.media_player});
    const keys = [
      this._key("Prev", "prev", "", call("media_previous_track"), off),
      this._key(s && s.state === "playing" ? "Pause" : "Play", "play_pause", "on main", call("media_play_pause"), off),
      this._key("Next", "next", "", call("media_next_track"), off),
    ];
    if (this._remoteCfg().entity) keys.push(this._key("Remote", "remote", "", () => this._openRemote()));
    pane.append(this._row(keys));
    const vol = [["vol_down", "Vol −", c.volume_down_action, true], ["mute", "Mute", c.mute_action, false], ["vol_up", "Vol +", c.volume_up_action, true]]
      .filter(([, , a]) => a).map(([id, label, a, rep]) => {
        const k = this._key(label, id, "");
        const run = () => runAction(this, this._hass, a, c.media_player);
        if (rep) jamHoldRepeat(k, run, this); else k.onclick = run;
        return k;
      });
    if (vol.length) pane.append(this._row(vol));
    return pane;
  }
  _sourcePane(s, off, stamp) {
    const c = this._config, g = el("div", "src"), act = off ? null : this._activeSource();
    for (const l of this._sources) {
      const on = l === act;
      const b = cutKey("", `jam-tv|${c.media_player}|src|${l.name}`, (on ? "on" : "") + (on && stamp ? " jam-stamp" : ""), "chip");
      const face = b.firstChild; face.textContent = "";
      const col = accentVar(l.accent || l.color) || accentVar(JB_COLOR[String(l.color || "").toLowerCase()]) || "var(--acc)";
      b.style.setProperty("--app", col);
      const sq = el("span", "sq"); sq.setAttribute("aria-hidden", "true");
      face.append(sq, el("span", "nm", l.name || ""));
      b.dataset.app = l.name || "";
      if (l.name) b.setAttribute("aria-label", l.name + (on ? " (on screen)" : off ? " (wakes the TV)" : ""));
      if (on) b.setAttribute("aria-current", "true");
      bindActions(b, () => this._hass, {tap_action: l.tap_action || {action: "none"}, hold_action: l.hold_action}, l.entity);
      g.append(b);
    }
    return g;
  }
  render(b) {
    const c = this._config, h = this._hass, s = stateObj(h, c.media_player), a = (s && s.attributes) || {};
    const off = !s || UNAVAILABLE.has(s.state) || s.state === "off";
    const playing = !off && (JAM_TV_PLAYING.has(s.state) || !!a.media_title);
    const mode = off ? "off" : playing ? "playing" : "idle";
    if (off && this._wasOn) this._tab = null; // on -> off forgets the user's tab choice
    this._wasOn = !off;
    // Stamp the source tile that just came on screen (not on the first render, a tab switch or a plain update).
    const act = off ? null : this._activeSource(), actName = act ? act.name || "" : null;
    const stamp = this._srcSeen && actName !== null && actName !== this._srcPrev && motionOn();
    this._srcPrev = actName; this._srcSeen = true;
    const tab = this._tab || (off ? "source" : "now");
    const {root, face: wrap} = this.paper(c.media_player, {face: `wrap ${mode}`});
    root.dataset.mode = mode; root.dataset.tab = tab;
    wrap.append(this._poster(s, off, playing));
    const seg = el("div", "seg"), label = c.source_label || "Source";
    for (const [id, text] of [["now", "Now playing"], ["source", label]]) {
      const k = cutKey(text, `jam-tv|${c.media_player}|tab|${id}`, id === tab ? "sel" : "", "chip");
      k.dataset.tab = id; k.setAttribute("aria-pressed", String(id === tab));
      k.onclick = () => { this._tab = id; this._render(false); };
      seg.append(k);
    }
    wrap.append(seg, tab === "now" ? this._nowPane(s, off) : this._sourcePane(s, off, stamp));
    b.append(root);
  }
  getCardSize() { return 5; }
}
/* Local helper: entity_picture -> absolute URL (hass.hassUrl in HA; data:/http(s): as is). */
function jamTvUrl(h, u) {
  if (!u) return null;
  if (/^(https?:|data:|blob:)/i.test(u)) return u;
  try { if (h && typeof h.hassUrl === "function") return h.hassUrl(u); } catch (e) { /* fall through */ }
  return u;
}
register("jam-tv", JamTv, "Jam TV", "Smart TV: artwork poster with power, Now playing / Source switch, volume; remote with TV + Stereo sections in a sheet.");
