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
   source TV_INPUT, tv TV, rewind MEDIA_REWIND, forward MEDIA_FAST_FORWARD (override per key with commands / actions).
   Shared with jam-tv: JAM_GLYPHS / jamGlyph(name) (flat SVG glyphs, static markup), jamRocker(items, owner) + JAM_ROCKER_CSS,
   JAM_OUTLINE_CSS (.ol outlined key: 3px --ol outline drawn inside the cut), jamHoldRepeat, jamRemoteKeyboard, jamRemoteApp.
   keyboard key: opens a small sheet (openSheet) with a text field + Send / Backspace / Enter, sent like
   universal-remote-card's Android TV keyboard: Send = remote.send_command command "text:<field>" (androidtv_remote types
   the text), Backspace = command "DEL", Enter = command "ENTER" (Enter in the field = Send, or ENTER when it is empty).
   Needs `entity` (or actions.keyboard, which then runs instead of the sheet).
   sections? (0.3.4, round 3 look): [{title?, accent?, rows, entity? (default the card's; null = keys run actions only),
     actions?, commands?, labels? (merged over the card's), active_entity?, active_match?: {key: state text}, power_accent?}] =
     colour-coded groups instead of rows: each group is a --slab face (slab2 inside a sheet) with a 6px left rule in its
     accent and a header row: kicker (title) left, the group's "power" key right (a 36px glyph key, red; power_accent: true =
     the group accent). Keys with a glyph (back, home, menu, settings, rewind, play_pause, forward, prev, next, tv, keyboard,
     captions, audio_track, source) show it above the label; play_pause is filled with the accent and a 3-key row with
     play_pause in the middle is 1 : 1.5 : 1. With active_entity the plain row keys are a choice: outlined in the accent, the
     active one filled (active_entity's state equals, case-insensitive, active_match[key], else its label). The OK disc and
     arrow marks use the accent. `rows` / `layout` are ignored when sections are set.
   Row token "rocker" (any rows): vol_down | mute | vol_up as one flat block (key cut) in the accent split by 3px ink gaps
   (jamRocker; − / speaker glyph + Mute / +); keys this remote cannot run are left out, vol keys repeat while held.
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
  rewind: "MEDIA_REWIND", forward: "MEDIA_FAST_FORWARD",
};
const JAM_REMOTE_LABELS = {
  power: "Power", back: "Back", home: "Home", menu: "Menu", prev: "Prev", next: "Next", play_pause: "Play",
  mute: "Mute", vol_up: "Vol +", vol_down: "Vol −", ok: "OK", up: "Up", down: "Down", left: "Left", right: "Right",
  settings: "Settings", tv: "TV", keyboard: "Keyboard", captions: "Captions", audio_track: "Audio", source: "Input",
  rewind: "Rewind", forward: "Forward",
};
/* Flat SVG glyphs (24-unit box, currentColor; static markup only): remote keys, jam-tv transport / tabs / source tiles. */
const JAM_GLYPH_S = (d, w = 2.5) => `<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false" fill="none" stroke="currentColor" stroke-width="${w}" stroke-linecap="square">${d}</svg>`;
const JAM_GLYPH_F = d => `<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false" fill="currentColor"><path d="${d}"/></svg>`;
const JAM_GLYPHS = {
  back: JAM_GLYPH_S('<path d="M10 6L4 12l6 6M4 12h16"/>'), home: JAM_GLYPH_S('<path d="M3 11l9-7 9 7v10H3z"/>'),
  menu: JAM_GLYPH_S('<path d="M4 6h16M4 12h16M4 18h16"/>'),
  settings: JAM_GLYPH_S('<path d="M12 8.5a3.5 3.5 0 1 1 0 7a3.5 3.5 0 1 1 0-7z"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M5 5l2 2M17 17l2 2M5 19l2-2M17 7l2-2"/>'),
  rewind: JAM_GLYPH_F("M11 5v14L3 12zM21 5v14l-8-7z"), forward: JAM_GLYPH_F("M3 5v14l8-7zM13 5v14l8-7z"),
  play: JAM_GLYPH_F("M7 4v16l13-8z"), pause: JAM_GLYPH_F("M6 4h4v16H6zM14 4h4v16h-4z"),
  prev: JAM_GLYPH_F("M5 5h3v14H5zM20 5v14L9 12z"), next: JAM_GLYPH_F("M16 5h3v14h-3zM4 5v14l11-7z"),
  power: JAM_GLYPH_S('<path d="M12 3v8"/><path d="M6.3 6.3a8 8 0 1 0 11.4 0"/>', 3),
  mute: JAM_GLYPH_S('<path d="M3 9h4l5-4v14l-5-4H3z" fill="currentColor" stroke="none"/><path d="M16 9l5 6M21 9l-5 6"/>'),
  keyboard: JAM_GLYPH_S('<path d="M2 6h20v12H2z"/><path d="M6 10h1M10 10h1M14 10h1M18 10h1M7 14h10"/>', 2.2),
  remote: JAM_GLYPH_S('<path d="M7 2h10v20H7z"/><path d="M12 6.5a1.5 1.5 0 1 1 0 3a1.5 1.5 0 1 1 0-3zM10 14h4M10 18h4"/>', 2.2),
  source: JAM_GLYPH_S('<path d="M3 4h7v7H3zM14 4h7v7h-7zM3 15h7v5H3zM14 15h7v5h-7z"/>', 2.2),
  tv: JAM_GLYPH_S('<path d="M3 5h18v12H3z"/><path d="M8 21h8"/>'), captions: JAM_GLYPH_S('<path d="M3 5h18v14H3z"/><path d="M7 11h4M13 11h4M7 15h10"/>', 2.2),
  audio_track: JAM_GLYPH_S('<path d="M9 18V6l11-2v12"/><path d="M6 15.5a3 2.5 0 1 1 0 5a3 2.5 0 1 1 0-5zM17 13.5a3 2.5 0 1 1 0 5a3 2.5 0 1 1 0-5z"/>', 2.2),
  // Source tile kinds (jam-tv; per-source `icon` picks one by name).
  input: JAM_GLYPH_S('<path d="M3 7h18v10H3z"/><path d="M8 12h2M14 12h2"/>'), app: JAM_GLYPH_S('<path d="M3 6h18v12H3z"/><path d="M10 9l5 3-5 3z" fill="currentColor" stroke="none"/>'),
  game: JAM_GLYPH_S('<path d="M3 6h7v12H3zM14 6h7v12h-7z"/>'), disc: JAM_GLYPH_S('<path d="M12 4a8 8 0 1 1 0 16a8 8 0 1 1 0-16zM12 10a2 2 0 1 1 0 4a2 2 0 1 1 0-4z"/>'),
  download: JAM_GLYPH_S('<path d="M12 3v13M6 11l6 6 6-6M4 21h16"/>'), grid: JAM_GLYPH_S('<path d="M4 4h16v16H4z"/><path d="M4 9h16M9 4v16"/>'),
  music: JAM_GLYPH_S('<path d="M9 18V6l11-2v12"/><path d="M6 15.5a3 2.5 0 1 1 0 5a3 2.5 0 1 1 0-5zM17 13.5a3 2.5 0 1 1 0 5a3 2.5 0 1 1 0-5z"/>'),
  film: JAM_GLYPH_S('<path d="M4 3h16v18H4z"/><path d="M8 3v18M16 3v18M4 8h4M4 13h4M4 18h4M16 8h4M16 13h4M16 18h4"/>', 2),
};
/* <span class="gl"> with a glyph (static markup, no data); null for an unknown name. */
function jamGlyph(name, cls) {
  const svg = JAM_GLYPHS[name];
  if (!svg) return null;
  const s = el("span", "gl" + (cls ? " " + cls : "")); s.setAttribute("aria-hidden", "true");
  s.innerHTML = svg; // static markup from JAM_GLYPHS, never entity data
  return s;
}
/* Outlined key (round 3: jam-tv tabs, stereo inputs): the face is filled with --ol and a --slab inner plate 3px in,
   cut parallel to the outer cut, so the outline follows the 45° corner. Works for key (tr 12px) and chip (br 6px) cuts. */
const JAM_OUTLINE_CSS = `
    .ol > .face{background:var(--ol,var(--dim));isolation:isolate}
    .ol > .face::before{content:"";position:absolute;inset:3px;z-index:-1;background:var(--slab);
      clip-path:polygon(0 0,calc(100% - 10.2px) 0,100% 10.2px,100% 100%,0 100%)}
    .ol[data-cut=chip] > .face::before{clip-path:polygon(0 0,100% 0,100% calc(100% - 4.2px),calc(100% - 4.2px) 100%,0 100%)}
    .ol.on > .face::before{display:none}
    .ol.on > .face{background:var(--acc);color:var(--acc-fg)}`;
/* Volume rocker (round 3): ONE flat block (key cut) in --rk (default the accent) split into − | Mute | + by 3px ink gaps. */
const JAM_ROCKER_CSS = `
    .rock{height:auto}
    .rock > .face{--p-t:0;--p-r:0;--p-b:0;--p-l:0;display:grid;gap:3px;background:var(--ink);min-height:56px;height:100%}
    .rock .key{position:relative;min-width:0;height:100%}
    .rock .key > .face{clip-path:none;border:0;height:100%;display:flex;align-items:center;justify-content:center;gap:8px;
      background:var(--rk,var(--acc));color:var(--on-fg);font:600 .8rem/1 var(--body);letter-spacing:.16em}
    .rock .key.vol > .face{font:900 1.75rem/1 var(--display);letter-spacing:0}
    .rock .key .gl svg{display:block;width:20px;height:20px}
    .rock .key:disabled > .face{background:var(--slab2);color:var(--dim)}
    .rock .key:focus-visible{outline-color:var(--on-fg);outline-offset:-4px}`;
/* items: [{id: "vol_down" | "mute" | "vol_up", label (aria), run, repeat, disabled}] -> .paper.rock (append it anywhere). */
function jamRocker(items, owner, key) {
  const {root, face} = paper("div", key || "jam-rocker", {kind: "key", cls: "rock"});
  face.style.gridTemplateColumns = items.map(x => (x.id === "mute" || items.length < 3 ? "minmax(0,1fr)" : "minmax(56px,.3fr)")).join(" ");
  for (const x of items) {
    const b = el("button", "key press " + (x.id === "mute" ? "mute" : "vol")), f = el("span", "face");
    b.type = "button"; b.dataset.key = x.id; b.disabled = !!x.disabled; b.setAttribute("aria-label", x.label);
    if (x.id === "mute") f.append(jamGlyph("mute"), el("span", "lb", x.text || "Mute"));
    else f.textContent = x.id === "vol_up" ? "+" : "−";
    b.append(f);
    if (x.repeat) jamHoldRepeat(b, x.run, owner); else b.onclick = x.run;
    face.append(b);
  }
  return root;
}
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
  // The window listeners go with the hold: a {once} pair would leave the one that did not fire behind on every press.
  const stop = () => {
    clearTimeout(t); clearInterval(iv); t = iv = null;
    window.removeEventListener("pointerup", stop); window.removeEventListener("pointercancel", stop);
    if (owner && owner._hold === stop) owner._hold = null;
  };
  btn.addEventListener("pointerdown", e => {
    if (e.button || btn.disabled) return;
    if (owner && owner._hold) owner._hold();
    stop(); if (owner) owner._hold = stop; run();
    const t0 = Date.now();
    t = setTimeout(() => { iv = setInterval(() => (Date.now() - t0 > 20000 ? stop() : run()), 180); }, 400);
    // Release anywhere ends the hold, also when a state update re-rendered the key mid-hold.
    window.addEventListener("pointerup", stop); window.addEventListener("pointercancel", stop);
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
    /* Sections (round 3): flat group face with a 6px left rule in the group accent; header = kicker + power key. */
    .sec > .face{--p-t:12px;--p-r:12px;--p-b:12px;--p-l:12px;display:grid;gap:10px;align-content:start;border-left:6px solid var(--acc)}
    .sec .gh{display:flex;align-items:center;justify-content:space-between;gap:10px;min-height:36px}
    .sec .gh .label{color:var(--fg)}
    .sec .gh .pw{min-width:48px}
    .sec .gh .pw > .face{--p-t:0;--p-b:0;--p-l:12px;--p-r:12px;height:36px;display:flex;align-items:center;justify-content:center}
    .sec .gh .pw.on > .face{background:var(--acc);color:var(--acc-fg)}
    .gl{display:block;flex:none}
    .gl svg{display:block;width:20px;height:20px}
    .sec .gh .pw .gl svg{width:18px;height:18px}
    /* Glyph keys: glyph above a small label. */
    .sec .row .key.ico > .face{--p-t:8px;--p-b:7px;--p-l:2px;--p-r:2px;min-height:54px;flex-direction:column;gap:5px;font-size:.64rem;letter-spacing:.12em;
      overflow-wrap:normal;word-break:normal}
    .row.tr{grid-auto-flow:row;grid-template-columns:minmax(0,1fr) minmax(0,1.5fr) minmax(0,1fr)}
    .row.pick .key > .face{--ol:var(--acc)}
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
    .pad .up{grid-area:1/2} .pad .left{grid-area:2/1} .pad .ok{grid-area:2/2} .pad .right{grid-area:2/3} .pad .down{grid-area:3/2}` + JAM_OUTLINE_CSS + JAM_ROCKER_CSS; }
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
  /* Key rows into `box`. active(k) -> true fills the key with the accent. sec: section look (glyph keys, main play key,
     transport proportions; pick = the plain keys are an outlined choice). */
  _rows(box, rows, ctx, off, active, sec, pick) {
    const mp = stateObj(this._hass, this._config.media_player);
    for (const row of rows || []) {
      if (!Array.isArray(row) || !row.length) continue;
      if (row.includes("dpad")) { box.append(this._pad(off, ctx)); continue; }
      if (row.includes("rocker")) { const r = this._rocker(ctx, off); if (r) box.append(r); continue; }
      const tr = sec && row.length === 3 && row[1] === "play_pause";
      const r = el("div", "row" + (row.length >= 4 ? " dense" : "") + (tr ? " tr" : "") + (pick ? " pick" : ""));
      for (const k of row) {
        const gname = k === "play_pause" ? (mp && mp.state === "playing" ? "pause" : "play") : k;
        const g = sec && !pick ? jamGlyph(gname) : null;
        const on = active && active(k), cls = k === "power" ? "alert" : on || (sec && k === "play_pause") ? "on" : "";
        const btn = cutKey(this._label(k, ctx), `jam-remote|${ctx.entity}|${k}`, cls + (g ? " ico" : "") + (pick && k !== "power" ? " ol" : ""));
        if (g) { const f = btn.firstChild, lb = el("span", "lb", f.textContent); f.textContent = ""; f.append(g, lb); }
        btn.dataset.key = k;
        if (pick) btn.setAttribute("aria-pressed", String(!!on));
        btn.disabled = off || !this._known(k, ctx);
        this._bind(btn, k, ctx);
        r.append(btn);
      }
      box.append(r);
    }
  }
  /* "rocker" row: vol_down | mute | vol_up as one block (keys this remote cannot run are left out). */
  _rocker(ctx, off) {
    const ks = ["vol_down", "mute", "vol_up"].filter(k => this._known(k, ctx));
    if (!ks.length) return null;
    return jamRocker(ks.map(k => ({id: k, label: this._label(k, ctx), text: this._label("mute", ctx), disabled: off,
      repeat: JAM_REMOTE_REPEAT.has(k), run: () => this._run(k, ctx)})), this, "jam-remote|rocker|" + ctx.entity);
  }
  _section(sec, i) {
    const ctx = this._ctx(sec), {root, face} = paper("div", "jam-remote|sec|" + i, {cls: "sec"});
    root.dataset.section = sec.title || String(i);
    setAccent(root, sec.accent);
    const off = this._offFor(ctx.entity), rows = sec.rows.filter(Array.isArray);
    // The group's power key sits in its header (round 3), not in a row.
    const power = rows.some(r => r.includes("power"));
    if (sec.title || power) {
      const gh = el("div", "gh");
      gh.append(el("div", "label", sec.title || ""));
      if (power) {
        const pw = cutKey("", `jam-remote|${ctx.entity}|power`, "pw " + (sec.power_accent ? "on" : "alert"), "chip");
        pw.dataset.key = "power"; pw.setAttribute("aria-label", (sec.title ? sec.title + " " : "") + this._label("power", ctx).toLowerCase());
        pw.firstChild.textContent = ""; pw.firstChild.append(jamGlyph("power"));
        pw.disabled = off || !this._known("power", ctx);
        this._bind(pw, "power", ctx);
        gh.append(pw);
      }
      face.append(gh);
    }
    const st = stateObj(this._hass, sec.active_entity), cur = st ? String(st.state).toLowerCase() : null, m = sec.active_match || {};
    const active = cur ? k => String(m[k] || this._label(k, ctx)).toLowerCase() === cur : null;
    this._rows(face, rows.map(r => r.filter(k => k !== "power")), ctx, off, active, true, !!sec.active_entity);
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
      if (mi) { tt.style.cursor = "pointer"; asButton(tt, () => moreInfo(this, mi)); }
      wrap.append(tt);
    }
    if (secs) secs.forEach((x, i) => wrap.append(this._section(x, i)));
    else this._rows(wrap, c.rows || JAM_REMOTE_LAYOUTS[c.layout] || JAM_REMOTE_ROWS, this._ctx(), off);
    b.append(root);
  }
  disconnectedCallback() { super.disconnectedCallback(); if (this._hold) this._hold(); if (this._kb) this._kb.close({silent: true}); }
  getCardSize() { return 7; }
}
register("jam-remote", JamRemote, "Jam Remote", "TV remote: d-pad of cut arrows, OK disc and keys sending remote commands or custom actions.");
