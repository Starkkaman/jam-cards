/* ---------- jam-tv: smart TV card (Android TV media_player + remote): poster, transport, volume rocker, Remote / Source sheets ----------
   {type: custom:jam-tv, media_player (media_player.*), remote? (remote.*), name? (kicker when idle / off; default the player's name),
    sources?: [{name, color? (accent name, room alias or HA colour name; default the card accent), icon? (round 3: a glyph name
                — input, app, game, disc, download, grid, home, tv, music, film — or an mdi: icon inside HA; default input
                for a source with match.input, else app), tap_action, hold_action?,
                match?: {app?: text | [texts], input?: text | [texts]} (when this source is on screen; a plain text or
                list = app), exact? (0.3.8, default false: true = match.app only lights on an exact app name, so
                "YouTube" does not light for "YouTube Music" / "YouTube TV")}]  (`launchers` = alias),
    source_label? ("Source": the Source tab and sheet title),
    current_app_entity? (sensor whose state is the app in front: a label or package id, e.g. sensor.hisense_tv_current_app),
    input_entity? (select/sensor whose state names the TV input, e.g. select.hisense_tv_input),
    input_app? (text | [texts]: current_app values that mean the TV is showing an input, e.g. "Live TV"; without it the
      input counts whenever it matches), input_signal_entity? (optional: the input only counts while this sensor reports
      a signal, i.e. not "No signal" / off / unavailable),
    source_entities? (ignored since 0.3.5: select states are not live signals),
    power_action? (default remote.toggle, else media_player toggle),
    volume_up_action?, volume_down_action?, mute_action? (the violet rocker − | Mute | +; keys without an action are left
      out; vol keys repeat while held),
    stereo?: {power_action, inputs: [{name, tap_action, match?}], volume_up_action, volume_down_action, mute_action, input_entity?,
      title? ("Stereo"), accent? ("violet")} (Stereo group of the Remote sheet; hidden without it),
    remote_card? (jam-remote config merged over the default: entity = remote, media_player, sections TV (+ Stereo); set rows /
      layout / sections there to replace them; commands / labels / actions are merged; commands.home / actions.home also
      drive the Source sheet's Home screen tile), remote_title? ("Remote"),
    accent? (DESIGN "Colour system"), size? ("kiosk", 0.6.0: fullscreen-sheet layout, see below)}
   Round 3 (2026-10-30, docs/ROUND3.md "TV"): the card always opens on Now playing; there is no tab switch any more.
   Poster (min 178px, bottom-right 16px cut): artwork (entity_picture, cover) or a flat accent block with Golden Arm bars;
   the text sits on a solid ink band at the bottom (both modes): kicker = app / source (13px, cream), title = media_title
   (34px display, 2 lines, cream; tap = more-info), time = position / duration (13px, cream), 5px accent progress strip.
   Power = the 44px top-right corner triangle (ink, accent glyph; red with an ink glyph when the TV is off).
   Idle (on, no title): title = the source on screen, else the app. Off / unavailable: slab2 poster, "TV off" /
   "Unavailable", then a big red Turn on key (power_action) and quick source tiles (3-up colour tiles, tap = the source).
   On: Prev / Play-Pause (accent, 1.5x) / Next with SVG glyphs, the violet volume rocker, then outlined Remote and Source
   tabs with glyphs. Remote = a sheet (jamCardSheet) with a jam-remote in groups: TV (teal rule, red power: d-pad with teal
   OK, Back / Home / Menu / Settings, Rewind / Play / Forward) and Stereo (violet rule, violet power: rocker, inputs, the
   current one filled from stereo.input_entity); the keyboard key (keyboard glyph) sits in the sheet header left of Close.
   Source = its own sheet (openSheet): "Inputs" (sources whose match has `input`, 2-up) and "Apps" (the rest, 3-up) as
   big colour tiles (name, glyph), then a "Home screen" tile (remote HOME command, or remote_card actions.home /
   commands.home); the source on screen gets a cream (--fg) outline + an "On now" stamp. Highlight (0.3.5) only from live
   signals: the current_app_entity state against each source's match.app (case-insensitive; an exact match on any source
   wins, else a substring unless the source sets exact), then, while the TV shows an input (input_app /
   input_signal_entity), the input_entity state against match.input (exact). Nothing matches (home screen, screensaver,
   other apps) -> no tile marked. A newly matched tile in an open sheet gets the one-shot stamp. The open sheet follows
   state updates.
   size: "kiosk" (0.6.0, for jam-kiosk's fullscreen sheets; fills its parent's height, 420px when that has none): same
   parts, scaled for a wall screen: the controls keep their own height (transport 64-80px, rocker 56-72px, tabs 56-64px, by
   the card height) and the poster takes all the rest; its band puts kicker and time on one 18px line over a 30-44px title
   (2 lines, 1 on short cards), so the art keeps over half the poster; 8px progress, 72px power corner. Off: poster 38%,
   Turn on and source tiles (>= 64px) fill the rest. Nothing under 18px. */
const JAM_TV_PLAYING = new Set(["playing", "paused", "buffering"]);
const JAM_TV_TV_ROWS = [["power"], ["dpad"], ["back", "home", "menu", "settings"], ["rewind", "play_pause", "forward"]];
/* h:mm when the duration is an hour or more, else m:ss. */
function jamTvTime(sec, long) {
  sec = Math.max(0, Math.floor(sec));
  const h = Math.floor(sec / 3600), m = Math.floor((sec % 3600) / 60), s = sec % 60;
  return long ? `${h}:${String(m).padStart(2, "0")}` : `${Math.floor(sec / 60)}:${String(s).padStart(2, "0")}`;
}
/* size: "kiosk" (0.6.0, round 3 look): the face is a size container; rows = poster 45% / controls (rest). */
const JAM_TV_KIOSK_CSS = `
    :host{height:100%;min-height:420px}
    .kiosk{height:100%}
    .kiosk > .face.wrap{--p-t:18px;--p-r:18px;--p-b:20px;--p-l:18px;container-type:size;grid-template-rows:minmax(0,1fr) auto;align-content:stretch;gap:12px;overflow:hidden}
    .kiosk .poster{height:auto;min-height:0}
    .kiosk .poster > .face{min-height:0;height:100%}
    .kiosk .poster .sky{flex:1 1 0;min-height:0}
    .kiosk .poster .arm{right:96px;gap:12px}
    .kiosk .poster .arm span{min-width:22px}
    /* Kiosk band: kicker and time share the first line, title (30-44px, max 2 lines) under them, so the art keeps most of the poster. */
    .kiosk .poster .band{padding:12px 22px 16px;gap:6px 18px;grid-template-columns:minmax(0,1fr) auto;align-items:baseline}
    .kiosk .poster .kick{grid-row:1;grid-column:1;font-size:18px;letter-spacing:.14em;-webkit-line-clamp:1}
    .kiosk .poster .sub{grid-row:1;grid-column:2;font-size:18px;white-space:nowrap}
    .kiosk .poster .title{grid-row:2;grid-column:1/-1;font-size:clamp(30px,8cqh,44px)}
    .kiosk .poster .prog{height:8px}
    .kiosk .pw{width:72px;height:72px}
    .kiosk .pw svg{right:8px;top:8px;width:26px;height:26px}
    .kiosk .pane{gap:10px;min-height:0}
    .kiosk .keys{gap:10px}
    .kiosk .keys .key > .face{min-height:clamp(64px,13cqh,80px)}
    .kiosk .keys .gl svg{width:34px;height:34px}
    .kiosk .rock > .face{min-height:clamp(56px,11cqh,72px)}
    .kiosk .rock .key > .face{font-size:18px}
    .kiosk .rock .key.vol > .face{font-size:2.4rem}
    .kiosk .rock .key .gl svg{width:28px;height:28px}
    .kiosk .seg{gap:10px}
    .kiosk .seg .key > .face{min-height:clamp(56px,10cqh,64px);font-size:18px;gap:12px}
    .kiosk .seg .gl svg{width:28px;height:28px}
    .kiosk > .face.wrap.off{grid-template-rows:minmax(0,38%) minmax(0,1fr)}
    .kiosk .wrap.off > .pane{height:100%;grid-template-rows:minmax(64px,.7fr) minmax(0,2fr)}
    .kiosk .turnon > .face{min-height:64px;height:100%;font-size:32px;gap:14px}
    .kiosk .turnon .gl svg{width:32px;height:32px}
    .kiosk .src{min-height:0;gap:10px;grid-auto-rows:minmax(64px,1fr)}
    .kiosk .src .tile > .face{min-height:64px;height:100%;font-size:24px}
    .kiosk .src .tile .gl svg{width:26px;height:26px}
    @container (max-width:440px){ .kiosk .seg .key > .face{letter-spacing:.06em} .kiosk .src .tile > .face{font-size:18px} }
    @container (max-height:470px){ .kiosk .poster .title > .tl{-webkit-line-clamp:1} .kiosk .poster .band{padding:10px 20px 12px;row-gap:4px} }`;
/* Source tiles (round 3): big colour block, name bottom-left in display type (ink), glyph top-right; the source on screen
   gets a 4px --fg outline + an "On now" stamp. Used in the Source sheet and (smaller) as the off-state quick tiles. */
const JAM_TV_TILE_CSS = `
    .tile{min-width:0}
    .tile > .face{--p-t:10px;--p-r:10px;--p-b:10px;--p-l:10px;position:relative;height:84px;display:flex;align-items:flex-end;justify-content:flex-start;
      background:var(--app);color:var(--on-fg);border:0;font:900 1.2rem/.95 var(--display);letter-spacing:.01em;text-transform:uppercase;text-align:left}
    .tile .nm{min-width:0;overflow-wrap:normal;word-break:normal;hyphens:none;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}
    .tile .gl{position:absolute;right:10px;top:10px}
    .tile .gl svg,.tile ha-icon{display:block;width:22px;height:22px;--mdc-icon-size:22px}
    .tile .now{position:absolute;left:10px;top:10px;font:600 .62rem/1 var(--body);letter-spacing:.12em;text-transform:uppercase;white-space:nowrap;background:var(--ink);color:#ece2c9;padding:4px 5px}
    .tile.cur{outline:4px solid var(--fg);outline-offset:3px}
    .tile.cur:focus-visible{outline:3px solid var(--ochre);outline-offset:2px}
    .tile.home > .face{background:var(--slab3);color:var(--fg)}
    .key.tile:not(:disabled):hover > .face{border:0}`;
const JAM_TV_SHEET_CSS = `
    .body{padding:7px 7px 9px}
    .body > .label{margin-bottom:-2px}
    .grid{display:grid;gap:12px 10px}
    .grid.two{grid-template-columns:repeat(2,minmax(0,1fr))}
    .grid.three{grid-template-columns:repeat(3,minmax(0,1fr))}` + JAM_TV_TILE_CSS + `
    @media (max-width:420px){ .tile > .face{font-size:1.05rem} .tile .gl{right:8px} .tile .gl svg{width:20px;height:20px} }`;
/* Art analysis cache: src -> {light, busy} (luminance of the text area + its spread). */
const JAM_TV_ART = new Map(), JAM_TV_ART_MAX = 64;
class JamTv extends JamSheetHost(JamBase) {
  validate(c) {
    if (!c.media_player || !c.media_player.startsWith("media_player.")) throw new Error("jam-tv: media_player must be a media_player");
    if (c.remote && !c.remote.startsWith("remote.")) throw new Error("jam-tv: remote must be a remote");
    for (const k of ["sources", "launchers", "source_entities"]) if (c[k] !== undefined && !Array.isArray(c[k])) throw new Error(`jam-tv: ${k} must be a list`);
    if (c.stereo !== undefined && (!c.stereo || typeof c.stereo !== "object")) throw new Error("jam-tv: stereo must be an object");
    if (c.size !== undefined && !["kiosk", "normal"].includes(c.size)) throw new Error("jam-tv: size is kiosk or normal");
  }
  setConfig(c) { this._closeSources(); super.setConfig(c); }
  watched() {
    const c = this._config, st = c.stereo || {};
    return [c.media_player, c.remote, c.current_app_entity, c.input_entity, c.input_signal_entity, st.input_entity].filter(x => typeof x === "string" && x);
  }
  get _sources() { const c = this._config; return (c.sources || c.launchers || []).filter(Boolean); }
  css() { return `
    .wrap{display:grid;gap:10px;align-content:start;--p-t:12px;--p-r:12px;--p-b:14px;--p-l:12px}
    .poster{height:auto;cursor:default}
    .poster > .face{padding:0;position:relative;overflow:hidden;height:auto;min-height:178px;display:flex;flex-direction:column;background:var(--acc);color:var(--acc-fg)}
    .poster.off > .face{background:var(--slab2);color:var(--fg)}
    .poster img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;display:block}
    .poster .sky{position:relative;flex:1 0 56px}
    .poster .arm{position:absolute;right:60px;bottom:0;height:84%;gap:7px;align-items:flex-end}
    .poster .arm span{background:var(--acc-fg)}
    /* The text always sits on a solid ink band (round 3), so it is cream in both modes. */
    .poster .band{position:relative;background:var(--ink);color:#ece2c9;padding:10px 14px 14px;display:grid;gap:4px;min-width:0}
    .poster .kick{font:600 13px/1.15 var(--body);letter-spacing:.14em;text-transform:uppercase;white-space:normal;overflow-wrap:normal;word-break:normal;
      display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}
    .poster .title{font-family:var(--display);font-weight:900;font-size:34px;line-height:.92;text-transform:uppercase;letter-spacing:-.005em;
      overflow-wrap:anywhere;cursor:pointer}
    .poster .title > .tl{display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}
    .poster .sub{font:500 13px/1.2 var(--body);letter-spacing:.06em}
    .poster .prog{position:absolute;left:0;right:0;bottom:0;height:5px}
    .poster .prog i{position:absolute;inset:0 auto 0 0;background:var(--acc)}
    .pw{position:absolute;z-index:2;right:0;top:0;width:44px;height:44px;background:var(--on-fg);color:var(--acc);clip-path:polygon(0 0,100% 0,100% 100%)}
    .pw.off{background:var(--red);color:var(--on-fg)}
    .pw svg{position:absolute;right:5px;top:5px;width:16px;height:16px}
    .pw:focus-visible{outline-offset:-3px}
    .pane{display:grid;gap:8px}
    .gl{display:block;flex:none}
    .gl svg{display:block;width:20px;height:20px}
    .keys{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1.5fr) minmax(0,1fr);gap:8px}
    .keys .key{min-width:0}
    .keys .key > .face{--p-t:0;--p-b:0;min-height:60px;display:flex;align-items:center;justify-content:center}
    .keys .gl svg{width:26px;height:26px}
    .seg{display:grid;grid-auto-flow:column;grid-auto-columns:minmax(0,1fr);gap:8px}
    .seg .key{min-width:0}
    .seg .key > .face{--p-t:0;--p-b:0;--p-l:8px;--p-r:10px;min-height:48px;display:flex;align-items:center;justify-content:center;gap:9px;
      font-size:.72rem;letter-spacing:.14em;--ol:var(--dim)}
    .turnon > .face{--p-t:0;--p-b:0;min-height:60px;display:flex;align-items:center;justify-content:center;gap:12px;
      font:900 1.6rem/1 var(--display);letter-spacing:.01em}
    .turnon .gl svg{width:24px;height:24px}
    .src{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px}
    .src .tile > .face{height:auto;min-height:64px;font-size:.95rem}
    .src .tile .gl svg{width:18px;height:18px}` + JAM_TV_TILE_CSS + JAM_OUTLINE_CSS + JAM_ROCKER_CSS +
    (this._config && this._config.size === "kiosk" ? JAM_TV_KIOSK_CSS : ""); }
  /* Remote sheet config: jam-remote with a TV group (teal) and, with `stereo`, a Stereo group (violet). */
  _remoteCfg() {
    const c = this._config, rc = c.remote_card || {}, sections = [];
    if (rc.rows === undefined && rc.layout === undefined) {
      sections.push({title: "TV", accent: "teal", rows: JAM_TV_TV_ROWS});
      const st = c.stereo;
      if (st) {
        const ins = (st.inputs || []).filter(Boolean).slice(0, 3), actions = {}, labels = {}, match = {};
        if (st.power_action) actions.power = st.power_action;
        ins.forEach((x, i) => { actions["input_" + i] = x.tap_action; labels["input_" + i] = x.name || `Input ${i + 1}`; if (x.match) match["input_" + i] = x.match; });
        const vol = [["vol_down", st.volume_down_action], ["mute", st.mute_action], ["vol_up", st.volume_up_action]].filter(([, a]) => a);
        vol.forEach(([k, a]) => { actions[k] = a; });
        const rows = [];
        if (st.power_action) rows.push(["power"]);
        if (vol.length) rows.push(["rocker"]);
        if (ins.length) rows.push(ins.map((x, i) => "input_" + i));
        sections.push({title: st.title || "Stereo", accent: st.accent || "violet", entity: null, rows, actions, labels,
          active_entity: st.input_entity, active_match: match, power_accent: true});
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
      return {x, exact: x.exact === true, app: [].concat(m.app || []).filter(Boolean).map(low), input: [].concat(m.input || []).filter(Boolean).map(low)};
    });
    const app = live(c.current_app_entity);
    if (app) {
      const hit = list.find(k => k.app.includes(app)) || list.find(k => !k.exact && k.app.some(t => app.includes(t)));
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
      kb.firstChild.append(jamGlyph("keyboard"));
      kb.onclick = () => {
        if (this._kb && this._kb.isOpen()) return;
        this._kb = jamRemoteKeyboard(this._body || this, {entity: rc.entity, name, title: (rc.labels && rc.labels.keyboard) || "Keyboard",
          accent: c.accent, hass: () => this._hass, onClose: () => { this._kb = null; }});
      };
      extra.push(kb);
    }
    jamCardSheet(this, {kicker: name, title: c.remote_title || "Remote", accent: c.accent, cards: [rc], headerActions: extra, rule: rc.sections ? false : undefined,
      css: `.kbd > .face{--p-t:6px;--p-b:6px;--p-l:12px;--p-r:12px;height:100%;display:flex;align-items:center;justify-content:center;color:var(--fg)}
        .kbd .gl svg{display:block;width:24px;height:24px}`});
  }
  /* Home screen tile action: remote_card actions.home, else remote.send_command (commands.home or HOME). null = no remote. */
  _homeRun() {
    const rc = this._remoteCfg(), a = rc.actions && rc.actions.home;
    if (a) return () => runAction(this, this._hass, a, rc.entity);
    if (!rc.entity) return null;
    const cmd = (rc.commands && rc.commands.home) || "HOME";
    return () => this._hass.callService("remote", "send_command", {entity_id: rc.entity, command: cmd});
  }
  _isInput(l) { const m = l.match; return !!(m && typeof m === "object" && !Array.isArray(m) && [].concat(m.input || []).filter(Boolean).length); }
  /* One source tile (chip cut): colour block, glyph, name; cur = on screen (outline + "On now"). */
  _tile(l, cur, stamp, off) {
    const c = this._config;
    const b = cutKey("", `jam-tv|${c.media_player}|src|${l.name}`, "tile" + (cur ? " cur" : "") + (cur && stamp ? " jam-stamp" : ""), "chip");
    const face = b.firstChild; face.textContent = "";
    const col = accentVar(l.accent || l.color) || accentVar(JB_COLOR[String(l.color || "").toLowerCase()]) || "var(--acc)";
    b.style.setProperty("--app", col);
    const nm = String(l.icon || ""), ha = /^mdi:|:/.test(nm) ? icon(nm) : null;
    const g = ha || jamGlyph(JAM_GLYPHS[nm] && nm !== "power" ? nm : this._isInput(l) ? "input" : "app");
    if (ha) { const s = el("span", "gl"); s.setAttribute("aria-hidden", "true"); s.append(ha); face.append(s); } else face.append(g);
    if (cur) face.append(el("span", "now", "On now"));
    face.append(el("span", "nm", l.name || ""));
    b.dataset.app = l.name || "";
    if (l.name) b.setAttribute("aria-label", l.name + (cur ? " (on screen)" : off ? " (wakes the TV)" : ""));
    if (cur) b.setAttribute("aria-current", "true");
    bindActions(b, () => this._hass, {tap_action: l.tap_action || {action: "none"}, hold_action: l.hold_action}, l.entity);
    return b;
  }
  /* Source sheet (round 3): Inputs 2-up, Apps 3-up + Home screen. Refilled on every render while open. */
  _openSources() {
    if (this._srcSheet && this._srcSheet.isOpen()) return;
    const c = this._config, acc = accentVar(c.accent);
    const sheet = openSheet({from: this, kicker: c.name || friendly(this._hass, c.media_player), title: c.source_label || "Source",
      accent: acc || undefined, accentFg: acc ? accentFg(c.accent) : undefined, rule: false, css: JAM_TV_SHEET_CSS,
      onClose: () => { if (this._srcSheet === sheet) this._srcSheet = null; }});
    this._srcSheet = sheet;
    this._fillSources(false);
  }
  _fillSources(stamp) {
    const sh = this._srcSheet;
    if (!sh || !sh.isOpen() || !this._hass) return;
    const c = this._config, s = stateObj(this._hass, c.media_player), off = !s || UNAVAILABLE.has(s.state) || s.state === "off";
    const act = off ? null : this._activeSource(), ins = this._sources.filter(l => this._isInput(l)), apps = this._sources.filter(l => !this._isInput(l));
    const grid = (cls, list) => { const g = el("div", "grid " + cls); for (const l of list) g.append(this._tile(l, l === act, stamp, off)); return g; };
    const body = sh.body; body.textContent = "";
    if (ins.length) body.append(el("div", "label", "Inputs"), grid("two", ins));
    const g = grid("three", apps), home = this._homeRun();
    if (home) {
      const h = cutKey("", `jam-tv|${c.media_player}|src|home`, "tile home", "chip");
      h.firstChild.textContent = ""; h.dataset.key = "home"; h.setAttribute("aria-label", "Home screen");
      h.firstChild.append(jamGlyph("home"), el("span", "nm", "Home screen"));
      h.onclick = home;
      g.append(h);
    }
    if (g.children.length) body.append(el("div", "label", ins.length ? "Apps" : "Sources"), g);
  }
  _closeSources() { if (this._srcSheet) { this._srcSheet.close({silent: true}); this._srcSheet = null; } }
  disconnectedCallback() { super.disconnectedCallback(); if (this._hold) this._hold(); if (this._kb) this._kb.close({silent: true}); this._closeSources(); }
  _key(label, id, cls, run, disabled) {
    const k = cutKey(label, `jam-tv|${this._config.media_player}|${id}`, cls);
    k.dataset.key = id; k.disabled = !!disabled; if (run) k.onclick = run;
    return k;
  }
  /* Glyph-only key (aria-label = label). */
  _gkey(glyph, label, id, cls, run) {
    const k = this._key("", id, cls, run);
    k.setAttribute("aria-label", label); k.firstChild.append(jamGlyph(glyph));
    return k;
  }
  _power() {
    const c = this._config, h = this._hass;
    if (c.power_action) runAction(this, h, c.power_action, c.remote || c.media_player);
    else if (c.remote) h.callService("remote", "toggle", {entity_id: c.remote});
    else h.callService("media_player", "toggle", {entity_id: c.media_player});
  }
  /* Art sampler (kept for jam-speaker, which shares it; jam-tv itself puts its text on a solid ink band since round 3):
     sample the text area (lower 60%, left 75%) on a small canvas; cross-origin art -> busy (band). */
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
      // Bounded (a kiosk runs for days and every track has its own art URL): drop the oldest entry.
      if (JAM_TV_ART.size >= JAM_TV_ART_MAX) JAM_TV_ART.delete(JAM_TV_ART.keys().next().value);
      JAM_TV_ART.set(img.src, r);
    }
    poster.classList.remove("light", "dark", "busy");
    poster.classList.add(r.busy ? "busy" : r.light ? "light" : "dark");
  }
  _poster(s, off, playing) {
    const c = this._config, h = this._hass, a = (s && s.attributes) || {};
    const name = c.name || friendly(h, c.media_player);
    const {root, face} = paper("div", "jam-tv|poster|" + c.media_player, {kind: "poster", cls: "poster" + (off ? " off" : "")});
    const sky = el("div", "sky");
    const src = !off && jamTvUrl(h, a.entity_picture_local || a.entity_picture);
    const bars = () => { root.classList.add("bars"); sky.append(armBars("jam-tv|" + c.media_player)); };
    if (src) {
      root.classList.add("art");
      const img = el("img"); img.alt = ""; img.decoding = "async";
      img.onerror = () => { img.remove(); root.classList.remove("art"); bars(); };
      img.src = src; face.append(img);
    } else if (!off) bars();
    face.append(sky);
    const band = el("div", "band"), act = !off ? this._activeSource() : null;
    let kick, title, sub = null, frac = null;
    if (off) { kick = name; title = s && s.state === "off" ? "TV off" : "Unavailable"; } // missing entity = unavailable
    else {
      const app = this._app(a) || (act && act.name) || (a.source ? String(a.source) : null);
      const p = playing ? this._posParts(s) : null;
      if (a.media_title) { kick = app || name; title = a.media_title; }
      else { kick = name; title = (act && act.name) || app || fmtState(h, s); } // idle: the source on screen beats the launcher app
      if (p) { sub = p.text; frac = p.frac; }
    }
    band.append(el("div", "kick", kick));
    band.append(asButton(clampTitle(title), () => moreInfo(this, c.media_player)));
    if (sub) band.append(el("div", "sub", sub));
    face.append(band);
    if (frac !== null) {
      const pr = el("div", "prog"), i = el("i"); pr.setAttribute("aria-hidden", "true");
      i.style.width = (Math.max(0, Math.min(1, frac)) * 100).toFixed(1) + "%"; pr.append(i); face.append(pr);
    }
    const pw = el("button", "pw" + (off ? " off" : "")); pw.type = "button"; pw.dataset.key = "power";
    pw.setAttribute("aria-label", off ? "Power on" : "Power off");
    pw.innerHTML = JAM_GLYPHS.power; // static markup, no data
    pw.onclick = () => this._power();
    face.append(pw);
    return root;
  }
  /* On: transport, rocker, Remote / Source tabs. */
  _onPane(s) {
    const c = this._config, h = this._hass, pane = el("div", "pane");
    const call = svc => () => h.callService("media_player", svc, {entity_id: c.media_player});
    const pl = s && s.state === "playing";
    const keys = el("div", "keys");
    keys.append(this._gkey("prev", "Previous", "prev", "", call("media_previous_track")),
      this._gkey(pl ? "pause" : "play", pl ? "Pause" : "Play", "play_pause", "on main", call("media_play_pause")),
      this._gkey("next", "Next", "next", "", call("media_next_track")));
    pane.append(keys);
    const vol = [["vol_down", "Volume down", c.volume_down_action, true], ["mute", "Mute", c.mute_action, false], ["vol_up", "Volume up", c.volume_up_action, true]]
      .filter(([, , a]) => a);
    if (vol.length) {
      const r = jamRocker(vol.map(([id, label, a, repeat]) => ({id, label, repeat, run: () => runAction(this, this._hass, a, c.media_player)})),
        this, "jam-tv|rocker|" + c.media_player);
      r.style.setProperty("--rk", "var(--violet)");
      pane.append(r);
    }
    const tabs = [];
    if (this._remoteCfg().entity) tabs.push(["remote", "remote", c.remote_title || "Remote", () => this._openRemote()]);
    if (this._sources.length || this._homeRun()) tabs.push(["source", "source", c.source_label || "Source", () => this._openSources()]);
    if (tabs.length) {
      const seg = el("div", "seg");
      for (const [id, g, label, run] of tabs) {
        const k = this._key(label, id, "ol tab", run);
        k.setAttribute("aria-haspopup", "dialog"); k.firstChild.prepend(jamGlyph(g));
        seg.append(k);
      }
      pane.append(seg);
    }
    return pane;
  }
  /* Off / unavailable: big Turn on key + quick source tiles. */
  _offPane() {
    const pane = el("div", "pane");
    const on = this._key("Turn on", "turn_on", "alert turnon", () => this._power());
    on.firstChild.prepend(jamGlyph("power"));
    pane.append(on);
    if (this._sources.length) {
      const g = el("div", "src");
      for (const l of this._sources) g.append(this._tile(l, false, false, true));
      pane.append(g);
    }
    return pane;
  }
  render(b) {
    const c = this._config, h = this._hass, s = stateObj(h, c.media_player), a = (s && s.attributes) || {};
    const off = !s || UNAVAILABLE.has(s.state) || s.state === "off";
    const playing = !off && (JAM_TV_PLAYING.has(s.state) || !!a.media_title);
    const mode = off ? "off" : playing ? "playing" : "idle";
    // Stamp the source tile that just came on screen in an open Source sheet (not on the first render or a plain update).
    const act = off ? null : this._activeSource(), actName = act ? act.name || "" : null;
    const stamp = this._srcSeen && actName !== null && actName !== this._srcPrev && motionOn();
    this._srcPrev = actName; this._srcSeen = true;
    const {root, face: wrap} = this.paper(c.media_player, {face: `wrap ${mode}`});
    root.dataset.mode = mode;
    if (c.size === "kiosk") root.classList.add("kiosk");
    wrap.append(this._poster(s, off, playing), off ? this._offPane() : this._onPane(s));
    b.append(root);
    this._fillSources(stamp);
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
register("jam-tv", JamTv, "Jam TV", "Smart TV: artwork poster with power, transport, volume rocker; Remote (TV + Stereo groups) and Source sheets.");
