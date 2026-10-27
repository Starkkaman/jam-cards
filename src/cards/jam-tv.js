/* ---------- jam-tv: smart TV card (Android TV media_player + remote): now playing, or app launchers ----------
   {type: custom:jam-tv, media_player (media_player.*), remote? (remote.*), name? (kicker; default the player's name),
    launchers?: [{name, icon?, color? (accent name, room alias or HA colour name; default the card accent),
                  tap_action, hold_action?}],
    keys?: [power | stereo | remote | {name, tap_action, hold_action?}] (idle row; default [power, stereo, remote]),
    power_action? (default remote.toggle, else media_player toggle), stereo_action? (the Stereo key; hidden without it),
    remote_card? (jam-remote config for the Remote sheet, merged over the default: entity = remote, media_player,
      rows d-pad / back home settings / vol − mute vol +; commands and labels are merged), remote_title? ("Remote"),
    accent? (DESIGN "Colour system")}
   Playing (playing / paused / buffering, or on with a media_title): art (entity_picture as a duotone print, else Golden Arm
   bars in the accent), title, app (friendly name, never a package id) · position / duration, keys Prev / Play-Pause /
   Next / Remote. Idle (on / idle / standby without a title): launchers 4-up (flat colour square + name), then the keys
   row. Off / unavailable: launchers (their actions wake the TV) + Power. Remote = a sheet with a jam-remote
   (jamCardSheet, jam-media.js). Keys use the key cut (top-right 12px); Play-Pause is the accent key. */
const JAM_TV_PLAYING = new Set(["playing", "paused", "buffering"]);
const JAM_TV_REMOTE = {
  rows: [["dpad"], ["back", "home", "settings"], ["vol_down", "mute", "vol_up"]],
  commands: {settings: "SETTINGS"}, labels: {settings: "Settings"},
};
/* h:mm when the duration is an hour or more, else m:ss. */
function jamTvTime(sec, long) {
  sec = Math.max(0, Math.floor(sec));
  const h = Math.floor(sec / 3600), m = Math.floor((sec % 3600) / 60), s = sec % 60;
  return long ? `${h}:${String(m).padStart(2, "0")}` : `${Math.floor(sec / 60)}:${String(s).padStart(2, "0")}`;
}
class JamTv extends JamSheetHost(JamBase) {
  validate(c) {
    if (!c.media_player || !c.media_player.startsWith("media_player.")) throw new Error("jam-tv: media_player must be a media_player");
    if (c.remote && !c.remote.startsWith("remote.")) throw new Error("jam-tv: remote must be a remote");
    for (const k of ["launchers", "keys"]) if (c[k] !== undefined && !Array.isArray(c[k])) throw new Error(`jam-tv: ${k} must be a list`);
  }
  watched() { return [this._config.media_player, this._config.remote].filter(Boolean); }
  css() { return `
    .wrap{display:grid;gap:10px;align-content:start;container-type:inline-size}
    .top{display:grid;grid-template-columns:64px minmax(0,1fr);gap:12px;align-items:center}
    .art{aspect-ratio:1;height:auto;cursor:pointer}
    .art > .face{padding:0;background:var(--acc);overflow:hidden;display:flex;align-items:flex-end;justify-content:center}
    .art.paused > .face{background:var(--dim)}
    .art img{display:block;width:100%;height:100%;object-fit:cover;filter:grayscale(1) contrast(1.15);mix-blend-mode:multiply}
    .art .arm{height:62%;padding-bottom:10%;gap:3px} .art .arm span{background:var(--acc-fg);max-width:7px}
    .txt{display:grid;gap:4px;min-width:0}
    .title{font-family:var(--display);font-weight:900;font-size:clamp(1.2rem,.95rem + 2.4cqi,1.8rem);line-height:.92;text-transform:uppercase;
      overflow-wrap:anywhere;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;cursor:pointer}
    .sub{font:500 .8rem/1.3 var(--body);color:var(--dim);overflow-wrap:anywhere}
    .keys{display:grid;grid-template-columns:repeat(var(--n,3),minmax(0,1fr));gap:6px}
    .keys .key{min-width:0}
    .keys .key > .face{--p-t:14px;--p-b:13px;--p-l:4px;--p-r:4px;min-height:48px;display:flex;align-items:center;justify-content:center;
      font-size:.66rem;overflow-wrap:anywhere}
    .apps{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:6px}
    .apps .key{min-width:0}
    .apps .key > .face{--p-t:14px;--p-b:10px;--p-l:4px;--p-r:4px;min-height:76px;display:flex;flex-direction:column;align-items:center;
      justify-content:flex-start;gap:7px;font-size:.62rem;letter-spacing:.1em;line-height:1.15;overflow-wrap:anywhere}
    .sq{flex:none;display:grid;place-items:center;width:24px;height:24px;background:var(--app,var(--acc));color:var(--on-fg);
      clip-path:polygon(0 0,100% 0,100% 70%,70% 100%,0 100%)}
    .sq ha-icon{--mdc-icon-size:16px;display:block;width:16px;height:16px}`; }
  _remoteCfg() {
    const c = this._config, rc = c.remote_card || {};
    return {type: "custom:jam-remote", entity: c.remote, media_player: c.media_player, name: c.name, rows: JAM_TV_REMOTE.rows, ...rc,
      commands: {...JAM_TV_REMOTE.commands, ...(rc.commands || {})}, labels: {...JAM_TV_REMOTE.labels, ...(rc.labels || {})}};
  }
  /* Current app as a friendly name: app_name unless it is a package id, else a known package (jam-remote's list). */
  _app(a) {
    if (a.app_name && !String(a.app_name).includes(".")) return String(a.app_name);
    return jamRemoteApp(a.app_id || a.app_name) || null;
  }
  _pos(s) {
    const a = s.attributes, dur = Number(a.media_duration);
    if (!(dur > 0) || a.media_position == null) return null;
    let pos = Number(a.media_position) || 0;
    const at = Date.parse(a.media_position_updated_at || "");
    if (s.state === "playing" && at) pos += (Date.now() - at) / 1000;
    const long = dur >= 3600;
    return `${jamTvTime(Math.min(pos, dur), long)} / ${jamTvTime(dur, long)}`;
  }
  _openRemote() {
    const c = this._config;
    jamCardSheet(this, {kicker: c.name || friendly(this._hass, c.media_player), title: c.remote_title || "Remote", accent: c.accent, cards: [this._remoteCfg()]});
  }
  _key(label, id, cls, run, disabled) {
    const k = cutKey(label, `jam-tv|${this._config.media_player}|${id}`, cls);
    k.dataset.key = id; k.disabled = !!disabled; k.onclick = run;
    return k;
  }
  _row(keys) { const r = el("div", "keys"); r.style.setProperty("--n", Math.max(1, keys.length)); r.append(...keys); return r; }
  _power() {
    const c = this._config, h = this._hass;
    if (c.power_action) runAction(this, h, c.power_action, c.remote || c.media_player);
    else if (c.remote) h.callService("remote", "toggle", {entity_id: c.remote});
    else h.callService("media_player", "toggle", {entity_id: c.media_player});
  }
  /* Idle / off row: power, stereo (only with stereo_action), remote (only with a remote entity), custom keys. */
  _keys(off) {
    const c = this._config, h = this._hass, out = [], canRemote = !!this._remoteCfg().entity;
    for (const k of c.keys || ["power", "stereo", "remote"]) {
      if (k === "power") out.push(this._key("Power", "power", "", () => this._power()));
      else if (off) continue;
      else if (k === "stereo") { if (c.stereo_action) out.push(this._key("Stereo", "stereo", "", () => runAction(this, h, c.stereo_action))); }
      else if (k === "remote") { if (canRemote) out.push(this._key("Remote", "remote", "", () => this._openRemote())); }
      else if (k && typeof k === "object") {
        const b = cutKey(k.name || "", `jam-tv|${c.media_player}|${k.name}`, "");
        b.dataset.key = "custom"; bindActions(b, () => this._hass, k, k.entity);
        out.push(b);
      }
    }
    return out;
  }
  _launchers(off) {
    const c = this._config, g = el("div", "apps");
    for (const l of c.launchers || []) {
      if (!l) continue;
      const b = cutKey("", `jam-tv|${c.media_player}|app|${l.name}`, "app");
      const face = b.firstChild; face.textContent = "";
      const sq = el("span", "sq"); sq.setAttribute("aria-hidden", "true");
      const col = accentVar(l.accent || l.color) || accentVar(JB_COLOR[String(l.color || "").toLowerCase()]);
      if (col) sq.style.setProperty("--app", col);
      const ic = icon(l.icon); if (ic) sq.append(ic);
      face.append(sq, el("span", "nm", l.name || ""));
      b.dataset.app = l.name || ""; if (l.name) b.setAttribute("aria-label", l.name + (off ? " (wakes the TV)" : ""));
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
    const {root, face: wrap} = this.paper(c.media_player, {face: `wrap ${mode}`});
    root.dataset.mode = mode;
    const name = c.name || friendly(h, c.media_player);
    wrap.append(el("div", "label", off ? `${name} · ${s && s.state !== "off" ? "Unavailable" : "Off"}` : name));

    if (playing) {
      const top = el("div", "top");
      const paused = s.state !== "playing";
      const {root: art, face} = paper("div", "jam-tv-art|" + c.media_player, {kind: "chip", cls: "art" + (paused ? " paused" : "")});
      art.setAttribute("aria-hidden", "true"); art.onclick = () => moreInfo(this, c.media_player);
      const src = jamTvUrl(h, a.entity_picture_local || a.entity_picture);
      if (src) {
        const img = el("img"); img.alt = ""; img.decoding = "async"; img.src = src;
        img.onerror = () => { img.remove(); face.append(armBars("jam-tv|" + c.media_player)); };
        face.append(img);
      } else face.append(armBars("jam-tv|" + c.media_player));
      const txt = el("div", "txt");
      const tt = el("div", "title", a.media_title || this._app(a) || fmtState(h, s)); tt.onclick = () => moreInfo(this, c.media_player);
      txt.append(tt);
      const sub = [a.media_title ? this._app(a) : null, this._pos(s)].filter(Boolean).join(" · ");
      if (sub) txt.append(el("div", "sub", sub));
      top.append(art, txt);
      const call = svc => () => h.callService("media_player", svc, {entity_id: c.media_player});
      const keys = [
        this._key("Prev", "prev", "", call("media_previous_track")),
        this._key(s.state === "playing" ? "Pause" : "Play", "play_pause", "on main", call("media_play_pause")),
        this._key("Next", "next", "", call("media_next_track")),
      ];
      if (this._remoteCfg().entity) keys.push(this._key("Remote", "remote", "", () => this._openRemote()));
      wrap.append(top, this._row(keys));
    } else {
      if ((c.launchers || []).length) wrap.append(this._launchers(off));
      const keys = this._keys(off);
      if (keys.length) wrap.append(this._row(keys));
    }
    b.append(root);
  }
  getCardSize() { return 4; }
}
/* Local helper: entity_picture -> absolute URL (hass.hassUrl in HA; data:/http(s): as is). */
function jamTvUrl(h, u) {
  if (!u) return null;
  if (/^(https?:|data:|blob:)/i.test(u)) return u;
  try { if (h && typeof h.hassUrl === "function") return h.hassUrl(u); } catch (e) { /* fall through */ }
  return u;
}
register("jam-tv", JamTv, "Jam TV", "Smart TV: now playing with transport, or app launchers + power / stereo / remote keys; remote in a sheet.");
