/* ---------- jam-remote: TV remote (d-pad cross of cut arrows + keys) ----------
   {type: custom:jam-remote, entity? (remote.*), media_player? (title/state), name?, hide_title? (hide the name label + title;
    jam-tv / jam-media sheets set it, the sheet header already names the remote),
    rows?: [[key, ...], ["dpad"], ...], commands?: {key: send_command value}, actions?: {key: action object},
    labels?: {key: text}, accent? (OK disc + arrow marks; DESIGN "Colour system")}
   Row keys = key cut (top-right 12px); power is red. D-pad arms are fixed straight arrows (45° point toward the arm's
   direction), the OK key a disc.
   A key runs actions[key] if set, else remote.send_command commands[key] (Android TV defaults);
   power without a command = remote.toggle.
   Without `entity` (e.g. NerveOS: button.* presses / select options) keys only run `actions`: the card is valid when
   `actions` has at least one entry; every key without one (and dpad arms / OK without one) is disabled, not an error. D-pad arms and volume keys repeat while held (400 ms, then every 180 ms).
   layout?: "full" (0.3.2) = the universal-remote-card set: [power, back, home, settings] / [tv, vol_down, vol_up] / d-pad /
   [prev, play_pause, next] / [keyboard, captions, audio_track, source]; `rows` wins over `layout`.
   Default commands (Android TV, remote.send_command): settings SETTINGS, captions CAPTIONS, audio_track MEDIA_AUDIO_TRACK,
   source TV_INPUT, tv TV (override per key with commands / actions).
   keyboard key: opens a small sheet (openSheet) with a text field + Send / Backspace / Enter, sent like
   universal-remote-card's Android TV keyboard: Send = remote.send_command command "text:<field>" (androidtv_remote types
   the text), Backspace = command "DEL", Enter = command "ENTER" (Enter in the field = Send, or ENTER when it is empty).
   Needs `entity` (or actions.keyboard, which then runs instead of the sheet).
   sections? (0.3.4): [{title?, accent?, rows, entity? (default the card's; null = keys run actions only), actions?, commands?,
     labels? (merged over the card's), active_entity?, active_match?: {key: state text}}] = colour-coded blocks instead of
     rows: each block is a --slab face (slab2 inside a sheet) with a 5px rule in its accent and a small kicker; its keys, OK
     disc and arrow marks use that accent. A key is "active" (accent fill) when active_entity's state equals (case-insensitive)
     active_match[key], else its label. `rows` / `layout` are ignored when sections are set.
   jamRemoteKeyboard(host, {entity, name, title, accent, hass: () => hass}) opens the keyboard sheet (jam-tv's header key uses it);
   el.openKeyboard() opens it for this card.
   Title: media_title, else app_name unless it is a package id (has a dot), else a known name for the current package (app_id, else
   app_name, else the remote's current_activity; JAM_REMOTE_APPS, null = skip), else name / the media_player's friendly_name. */
const JAM_REMOTE_ROWS = [["power", "back", "home", "menu"], ["dpad"], ["prev", "play_pause", "next"], ["vol_down", "mute", "vol_up"]];
const JAM_REMOTE_LAYOUTS = {
  full: [["power", "back", "home", "settings"], ["tv", "vol_down", "vol_up"], ["dpad"], ["prev", "play_pause", "next"],
    ["keyboard", "captions", "audio_track", "source"]],
};
const JAM_REMOTE_CMDS = {
  up: "DPAD_UP", down: "DPAD_DOWN", left: "DPAD_LEFT", right: "DPAD_RIGHT", ok: "DPAD_CENTER",
  back: "BACK", home: "HOME", menu: "MENU", prev: "MEDIA_PREVIOUS", next: "MEDIA_NEXT", play_pause: "MEDIA_PLAY_PAUSE",
  mute: "VOLUME_MUTE", vol_up: "VOLUME_UP", vol_down: "VOLUME_DOWN",
  settings: "SETTINGS", captions: "CAPTIONS", audio_track: "MEDIA_AUDIO_TRACK", source: "TV_INPUT", tv: "TV",
};
const JAM_REMOTE_LABELS = {
  power: "Power", back: "Back", home: "Home", menu: "Menu", prev: "Prev", next: "Next", play_pause: "Play",
  mute: "Mute", vol_up: "Vol +", vol_down: "Vol −", ok: "OK", up: "Up", down: "Down", left: "Left", right: "Right",
  settings: "Settings", tv: "TV", keyboard: "Keyboard", captions: "Captions", audio_track: "Audio", source: "Input",
};
const JAM_REMOTE_KB_CSS = `
  .kb{display:grid;gap:10px}
  .kb input{box-sizing:border-box;width:100%;min-width:0;height:52px;padding:0 14px;border:0;border-radius:0;background:var(--slab2);color:var(--fg);
    font:500 1.15rem/1 var(--body);outline:none;-webkit-appearance:none;appearance:none}
  .kb input::placeholder{color:var(--dim)}
  .kb input:focus-visible{outline:3px solid var(--ochre);outline-offset:-3px}
  .kb .keys{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px}
  .kb .keys .key{min-width:0}
  .kb .keys .key > .face{--p-t:13px;--p-b:13px;--p-l:6px;--p-r:6px;min-height:48px;display:flex;align-items:center;justify-content:center}`;
/* Package id -> short title; null = never show (fall through to the name). Prefix keys end with "." */
const JAM_REMOTE_APPS = {
  "com.spocky.projengmenu": "Home", "org.jellyfin.androidtv": "Jellyfin", "com.jellywatch.tv": "Jellywatch",
  "com.google.android.youtube.tv": "YouTube", "com.netflix.ninja": "Netflix", "com.nintendo.": null,
};
function jamRemoteApp(id) {
  if (typeof id !== "string" || !id) return undefined;
  if (id in JAM_REMOTE_APPS) return JAM_REMOTE_APPS[id];
  for (const k in JAM_REMOTE_APPS) if (k.endsWith(".") && id.startsWith(k)) return JAM_REMOTE_APPS[k];
  return undefined;
}

const JAM_REMOTE_REPEAT = new Set(["up", "down", "left", "right", "vol_up", "vol_down"]);
/* Hold-repeat on a button: run on pointerdown, repeat after 400 ms every 180 ms until up/leave/cancel (20 s cap);
   keyboard activation (click with detail 0) runs once. `owner._hold` stops the previous hold (one hold per card). */
function jamHoldRepeat(btn, run, owner) {
  let t = null, iv = null;
  const stop = () => { clearTimeout(t); clearInterval(iv); t = iv = null; };
  btn.addEventListener("pointerdown", e => {
    if (e.button || btn.disabled) return;
    if (owner && owner._hold) owner._hold();
    stop(); if (owner) owner._hold = stop; run();
    const t0 = Date.now();
    t = setTimeout(() => { iv = setInterval(() => (Date.now() - t0 > 20000 ? stop() : run()), 180); }, 400);
    // Release anywhere ends the hold, also when a state update re-rendered the key mid-hold.
    window.addEventListener("pointerup", stop, {once: true}); window.addEventListener("pointercancel", stop, {once: true});
  });
  for (const ev of ["pointerup", "pointerleave", "pointercancel", "blur"]) btn.addEventListener(ev, stop);
  btn.addEventListener("contextmenu", e => e.preventDefault());
  btn.addEventListener("click", e => { if (e.detail === 0) run(); });
}
/* Keyboard sheet (Android TV, as universal-remote-card): text via "text:<s>", Backspace "DEL", Enter "ENTER".
   o: {entity (remote.*), name (kicker), title, accent (accent name), hass: () => hass, onClose}. Returns the sheet. */
function jamRemoteKeyboard(host, o) {
  const send = command => o.hass().callService("remote", "send_command", {entity_id: o.entity, command});
  const sheet = openSheet({from: host, kicker: o.name || "Remote", title: o.title || "Keyboard", accent: accentVar(o.accent) || undefined,
    css: JAM_REMOTE_KB_CSS, onClose: o.onClose});
  const box = el("div", "kb"), field = el("input");
  field.type = "text"; field.placeholder = "Type, then Send";
  field.autocomplete = "off"; field.spellcheck = false;
  field.setAttribute("autocapitalize", "off"); field.setAttribute("autocorrect", "off"); field.setAttribute("enterkeyhint", "send");
  field.setAttribute("aria-label", "Text to send to the TV");
  const sendText = () => { const v = field.value; if (!v) return false; send("text:" + v); field.value = ""; return true; };
  const keys = el("div", "keys");
  const mk = (label, id, cls, fn) => { const b = cutKey(label, "jam-remote|kb|" + id, cls); b.dataset.key = id; b.onclick = () => { fn(); field.focus(); }; return b; };
  keys.append(mk("Send", "send", "on", sendText), mk("Backspace", "backspace", "", () => send("DEL")), mk("Enter", "enter", "", () => send("ENTER")));
  field.addEventListener("keydown", e => {
    if (e.key !== "Enter" || e.isComposing) return;
    e.preventDefault(); if (!sendText()) send("ENTER");
  });
  box.append(field, keys); sheet.body.append(box);
  try { field.focus({preventScroll: true}); } catch (e) { field.focus(); }
  return sheet;
}

class JamRemote extends JamBase {
  validate(c) {
    if (c.sections !== undefined && !Array.isArray(c.sections)) throw new Error("jam-remote: sections must be a list");
    if (c.entity) { if (!String(c.entity).startsWith("remote.")) throw new Error("jam-remote: entity must be a remote"); return; }
    const acts = [c.actions, ...(c.sections || []).map(x => x && x.actions)];
    if (!acts.some(a => a && typeof a === "object" && Object.values(a).some(Boolean)))
      throw new Error("jam-remote: set entity (remote.*), or actions for the keys");
  }
  watched() {
    const c = this._config;
    return [c.entity, c.media_player, ...(c.sections || []).map(x => x && x.active_entity)].filter(x => typeof x === "string" && x);
  }
  css() { return `
    .wrap{display:grid;gap:12px;align-content:start}
    .wrap.secs{background:none;padding:0;gap:10px}
    .title{font-family:var(--display);font-weight:900;font-size:1.5rem;line-height:.95;text-transform:uppercase;overflow-wrap:anywhere;
      display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}
    .sec > .face{--p-t:0px;--p-r:12px;--p-b:14px;--p-l:12px;display:grid;gap:10px;align-content:start}
    .sec .rule{height:5px;background:var(--acc);margin:0 -12px}
    .sec .label{margin-top:-2px}
    .row{display:grid;grid-auto-flow:column;grid-auto-columns:minmax(0,1fr);gap:8px}
    .row .key{min-width:0}
    .row .key > .face{--p-t:13px;--p-b:13px;--p-l:6px;--p-r:6px;min-height:48px;display:flex;align-items:center;justify-content:center;overflow-wrap:anywhere}
    /* Rows of 4+ keys (layout full: SETTINGS / KEYBOARD / CAPTIONS): smaller, tighter labels that never break mid-word. */
    .row.dense .key > .face{--p-l:3px;--p-r:5px;font-size:.62rem;letter-spacing:.04em;overflow-wrap:normal;word-break:normal}
    .pad{display:grid;grid-template-columns:repeat(3,minmax(56px,78px));grid-template-rows:repeat(3,minmax(56px,78px));justify-content:center;gap:2px;padding:4px 0 8px}
    .pad > .paper{min-width:48px;min-height:48px;aspect-ratio:1}
    .pad > .paper > .face{padding:0;display:grid;place-items:center;background:var(--slab2);color:var(--fg)}
    .pad > .paper:not(:disabled):hover > .face{background:var(--line)}
    .pad .tri{width:34%;height:34%;background:var(--acc)}
    .pad .ok > .face{background:var(--acc);color:var(--acc-fg);font:900 1.35rem/1 var(--display);text-transform:uppercase;letter-spacing:.02em}
    .pad .ok:not(:disabled):hover > .face{background:var(--acc)}
    .pad .up{grid-area:1/2} .pad .left{grid-area:2/1} .pad .ok{grid-area:2/2} .pad .right{grid-area:2/3} .pad .down{grid-area:3/2}`; }
  /* Key context: the card's entity/actions/commands/labels, or a section's merged over them. */
  _ctx(sec) {
    const c = this._config, x = sec || {};
    return {entity: "entity" in x ? x.entity || null : c.entity || null,
      actions: {...(c.actions || {}), ...(x.actions || {})}, commands: {...(c.commands || {}), ...(x.commands || {})},
      labels: {...(c.labels || {}), ...(x.labels || {})}};
  }
  _run(k, ctx = this._ctx()) {
    const h = this._hass, a = ctx.actions[k];
    if (a) { runAction(this, h, a, ctx.entity); return; }
    if (!ctx.entity) return;
    if (k === "keyboard") { this._keyboard(ctx); return; }
    const cmd = ctx.commands[k] || (k === "power" ? null : JAM_REMOTE_CMDS[k]);
    if (cmd) h.callService("remote", "send_command", {entity_id: ctx.entity, command: cmd});
    else if (k === "power") h.callService("remote", "toggle", {entity_id: ctx.entity});
  }
  _known(k, ctx = this._ctx()) {
    if (ctx.actions[k]) return true;
    if (!ctx.entity) return false;
    return !!(ctx.commands[k] || JAM_REMOTE_CMDS[k] || k === "power" || k === "keyboard");
  }
  _label(k, ctx) { return ctx.labels[k] || JAM_REMOTE_LABELS[k] || String(k).replace(/_/g, " "); }
  /* Opens the keyboard sheet for this card's remote (needs entity). */
  openKeyboard() { if (this._config && this._config.entity) this._keyboard(this._ctx()); }
  _keyboard(ctx) {
    const c = this._config;
    if (this._kb && this._kb.isOpen()) return;
    this._kb = jamRemoteKeyboard(this._body || this, {entity: ctx.entity, name: c.name || friendly(this._hass, c.media_player || ctx.entity) || "Remote",
      title: ctx.labels.keyboard || "Keyboard", accent: c.accent, hass: () => this._hass, onClose: () => { this._kb = null; }});
  }
  /* Tap = one send; d-pad arms and volume keys repeat while held (jamHoldRepeat). */
  _bind(btn, k, ctx) {
    if (!JAM_REMOTE_REPEAT.has(k)) { btn.onclick = () => this._run(k, ctx); return; }
    jamHoldRepeat(btn, () => this._run(k, ctx), this);
  }
  /* Arm: straight 5-point arrow pointing `dir` (square block with a 45° point), base on the side touching the OK disc. */
  _arm(dir) {
    const up = [[0, 100], [0, 50], [50, 0], [100, 50], [100, 100]];
    const map = {up: (x, y) => [x, y], right: (x, y) => [100 - y, x], down: (x, y) => [100 - x, 100 - y], left: (x, y) => [y, 100 - x]}[dir];
    return `polygon(${up.map(([x, y]) => map(x, y).map(v => v + "%").join(" ")).join(",")})`;
  }
  _pad(off, ctx) {
    const pad = el("div", "pad");
    const tri = {up: "polygon(50% 0,100% 100%,0 100%)", down: "polygon(0 0,100% 0,50% 100%)", left: "polygon(0 50%,100% 0,100% 100%)", right: "polygon(0 0,100% 50%,0 100%)"};
    ["up", "left", "ok", "right", "down"].forEach(k => {
      const {root, face} = paper("button", "jam-remote|" + k, {cls: k + " press"});
      root.type = "button";
      const lbl = this._label(k, ctx);
      if (k === "ok") {
        root.style.setProperty("--clip", "circle(46% at 50% 50%)"); root.dataset.cut = "disc";
        face.textContent = lbl;
      } else {
        root.style.setProperty("--clip", this._arm(k)); root.dataset.cut = "arrow";
        const t = el("span", "tri"); t.style.clipPath = tri[k]; t.setAttribute("aria-hidden", "true");
        face.append(t); root.setAttribute("aria-label", lbl);
      }
      root.dataset.key = k; root.disabled = off || !this._known(k, ctx);
      this._bind(root, k, ctx);
      pad.append(root);
    });
    return pad;
  }
  _title(s, mp) {
    const c = this._config, a = (mp && mp.attributes) || {};
    if (a.media_title) return String(a.media_title);
    if (a.app_name && !String(a.app_name).includes(".")) return String(a.app_name);
    const t = jamRemoteApp(a.app_id || a.app_name || (s && s.attributes.current_activity)); /* the current app's package */
    if (t) return t;
    return c.name || friendly(this._hass, c.media_player || c.entity) || "Remote";
  }
  _offFor(entity) { if (!entity) return false; const s = stateObj(this._hass, entity); return !s || UNAVAILABLE.has(s.state); }
  /* Key rows into `box`. active(k) -> true fills the key with the accent. */
  _rows(box, rows, ctx, off, active) {
    for (const row of rows || []) {
      if (!Array.isArray(row)) continue;
      if (row.includes("dpad")) { box.append(this._pad(off, ctx)); continue; }
      const r = el("div", "row" + (row.length >= 4 ? " dense" : ""));
      for (const k of row) {
        const btn = cutKey(this._label(k, ctx), `jam-remote|${ctx.entity}|${k}`, k === "power" ? "alert" : active && active(k) ? "on" : "");
        btn.dataset.key = k;
        btn.disabled = off || !this._known(k, ctx);
        this._bind(btn, k, ctx);
        r.append(btn);
      }
      box.append(r);
    }
  }
  _section(sec, i) {
    const ctx = this._ctx(sec), {root, face} = paper("div", "jam-remote|sec|" + i, {cls: "sec"});
    root.dataset.section = sec.title || String(i);
    setAccent(root, sec.accent);
    const rule = el("div", "rule"); rule.setAttribute("aria-hidden", "true");
    face.append(rule);
    if (sec.title) face.append(el("div", "label", sec.title));
    const st = stateObj(this._hass, sec.active_entity), cur = st ? String(st.state).toLowerCase() : null, m = sec.active_match || {};
    const active = cur ? k => String(m[k] || this._label(k, ctx)).toLowerCase() === cur : null;
    this._rows(face, sec.rows, ctx, this._offFor(ctx.entity), active);
    return root;
  }
  render(b) {
    const c = this._config, h = this._hass, s = stateObj(h, c.entity), mp = stateObj(h, c.media_player);
    const secs = Array.isArray(c.sections) && c.sections.length ? c.sections.filter(x => x && Array.isArray(x.rows)) : null;
    // Without a remote entity the keys run actions only; the stripe follows the media_player (if any).
    const off = c.entity ? !s || UNAVAILABLE.has(s.state) : false, st = c.entity ? s : mp;
    const tn = st ? tone(st) : "off";
    const {root, face: wrap} = this.paper(c.entity || c.media_player || c.name || "remote",
      {face: secs ? "wrap secs" : `wrap stripe s-${tn}${off ? " unavail" : ""}`});
    if (!c.hide_title) {
      wrap.append(el("div", "label", c.name || friendly(h, c.entity || c.media_player) || "Remote"));
      const tt = el("div", "title", this._title(s, mp));
      const mi = c.media_player || c.entity;
      if (mi) { tt.style.cursor = "pointer"; tt.onclick = () => moreInfo(this, mi); }
      wrap.append(tt);
    }
    if (secs) secs.forEach((x, i) => wrap.append(this._section(x, i)));
    else this._rows(wrap, c.rows || JAM_REMOTE_LAYOUTS[c.layout] || JAM_REMOTE_ROWS, this._ctx(), off);
    b.append(root);
  }
  disconnectedCallback() { if (this._hold) this._hold(); if (this._kb) this._kb.close({silent: true}); }
  getCardSize() { return 7; }
}
register("jam-remote", JamRemote, "Jam Remote", "TV remote: d-pad of cut arrows, OK disc and keys sending remote commands or custom actions.");
