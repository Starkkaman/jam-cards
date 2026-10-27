/* ---------- jam-remote: TV remote (cut-paper d-pad cross + cut keys) ----------
   {type: custom:jam-remote, entity (remote.*), media_player? (title/state), name?,
    rows?: [[key, ...], ["dpad"], ...], commands?: {key: send_command value}, actions?: {key: action object},
    labels?: {key: text}}
   A key runs actions[key] if set, else remote.send_command commands[key] (Android TV defaults);
   power without a command = remote.toggle. D-pad arms and volume keys repeat while held (400 ms, then every 180 ms).
   Title: media_title, else app_name unless it is a package id (has a dot), else a known name for the current package (app_id, else
   app_name, else the remote's current_activity; JAM_REMOTE_APPS, null = skip), else name / the media_player's friendly_name. */
const JAM_REMOTE_ROWS = [["power", "back", "home", "menu"], ["dpad"], ["prev", "play_pause", "next"], ["vol_down", "mute", "vol_up"]];
const JAM_REMOTE_CMDS = {
  up: "DPAD_UP", down: "DPAD_DOWN", left: "DPAD_LEFT", right: "DPAD_RIGHT", ok: "DPAD_CENTER",
  back: "BACK", home: "HOME", menu: "MENU", prev: "MEDIA_PREVIOUS", next: "MEDIA_NEXT", play_pause: "MEDIA_PLAY_PAUSE",
  mute: "VOLUME_MUTE", vol_up: "VOLUME_UP", vol_down: "VOLUME_DOWN",
};
const JAM_REMOTE_LABELS = {
  power: "Power", back: "Back", home: "Home", menu: "Menu", prev: "Prev", next: "Next", play_pause: "Play",
  mute: "Mute", vol_up: "Vol +", vol_down: "Vol −", ok: "OK", up: "Up", down: "Down", left: "Left", right: "Right",
};
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

class JamRemote extends JamBase {
  validate(c) { if (!c.entity || !c.entity.startsWith("remote.")) throw new Error("jam-remote: entity must be a remote"); }
  watched() { return [this._config.entity, this._config.media_player].filter(Boolean); }
  css() { return `
    .wrap{display:grid;gap:12px;align-content:start}
    .title{font-family:var(--display);font-weight:900;font-size:1.5rem;line-height:.95;text-transform:uppercase;overflow-wrap:anywhere;
      display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}
    .row{display:grid;grid-auto-flow:column;grid-auto-columns:minmax(0,1fr);gap:8px}
    .row .key{min-width:0}
    .row .key > .face{--p-t:13px;--p-b:13px;--p-l:6px;--p-r:6px;min-height:48px;display:flex;align-items:center;justify-content:center;overflow-wrap:anywhere}
    .pad{display:grid;grid-template-columns:repeat(3,minmax(56px,78px));grid-template-rows:repeat(3,minmax(56px,78px));justify-content:center;gap:2px;padding:4px 0 8px}
    .pad > .paper{--sh:4px;min-width:48px;min-height:48px;aspect-ratio:1}
    .pad > .paper > .face{padding:0;display:grid;place-items:center;background:var(--slab2);color:var(--fg)}
    .pad > .paper:not(:disabled):hover > .face{background:var(--line)}
    .pad .tri{width:34%;height:34%;background:var(--ochre)}
    .pad .ok > .face{background:var(--ochre);color:var(--ink);font:900 1.35rem/1 var(--display);text-transform:uppercase;letter-spacing:.02em}
    .pad .ok:not(:disabled):hover > .face{background:var(--ochre)}
    .pad .up{grid-area:1/2} .pad .left{grid-area:2/1} .pad .ok{grid-area:2/2} .pad .right{grid-area:2/3} .pad .down{grid-area:3/2}`; }
  _run(k) {
    const c = this._config, h = this._hass;
    const a = c.actions && c.actions[k];
    if (a) { runAction(this, h, a, c.entity); return; }
    const cmd = (c.commands && c.commands[k]) || (k === "power" ? null : JAM_REMOTE_CMDS[k]);
    if (cmd) h.callService("remote", "send_command", {entity_id: c.entity, command: cmd});
    else if (k === "power") h.callService("remote", "toggle", {entity_id: c.entity});
  }
  _known(k) {
    const c = this._config;
    return !!((c.actions && c.actions[k]) || (c.commands && c.commands[k]) || JAM_REMOTE_CMDS[k] || k === "power");
  }
  /* Tap = one send. Repeat keys: send on pointerdown, repeat after 400 ms every 180 ms until up/leave/cancel;
     keyboard activation (click with detail 0) sends once. */
  _bind(btn, k) {
    if (!JAM_REMOTE_REPEAT.has(k)) { btn.onclick = () => this._run(k); return; }
    let t = null, iv = null;
    const stop = () => { clearTimeout(t); clearInterval(iv); t = iv = null; };
    btn.addEventListener("pointerdown", e => {
      if (e.button || btn.disabled) return;
      if (this._hold) this._hold();
      stop(); this._hold = stop; this._run(k);
      const t0 = Date.now();
      t = setTimeout(() => { iv = setInterval(() => (Date.now() - t0 > 20000 ? stop() : this._run(k)), 180); }, 400);
      // Release anywhere ends the hold, also when a state update re-rendered the key mid-hold.
      window.addEventListener("pointerup", stop, {once: true}); window.addEventListener("pointercancel", stop, {once: true});
    });
    for (const ev of ["pointerup", "pointerleave", "pointercancel", "blur"]) btn.addEventListener(ev, stop);
    btn.addEventListener("contextmenu", e => e.preventDefault());
    btn.addEventListener("click", e => { if (e.detail === 0) this._run(k); });
  }
  /* Hand-cut arm: arrow pointing `dir`, base on the side touching the OK disc. Jitter from the seed, so the shape is stable. */
  _arm(dir, s) {
    const r = rng(s), j = n => +(n + (r() - .5) * 5).toFixed(1);
    const up = [[j(4), 100], [j(5), j(42)], [j(50), j(3)], [j(95), j(42)], [j(96), 100], [j(70), j(97)], [j(30), j(98)]];
    const map = {up: (x, y) => [x, y], right: (x, y) => [100 - y, x], down: (x, y) => [100 - x, 100 - y], left: (x, y) => [y, 100 - x]}[dir];
    return `polygon(${up.map(([x, y]) => map(x, y).map(v => Math.max(0, Math.min(100, v)) + "%").join(" ")).join(",")})`;
  }
  _pad(off) {
    const c = this._config, pad = el("div", "pad"), base = seed("jam-remote|" + c.entity);
    const tri = {up: "polygon(50% 0,100% 100%,0 100%)", down: "polygon(0 0,100% 0,50% 100%)", left: "polygon(0 50%,100% 0,100% 100%)", right: "polygon(0 0,100% 50%,0 100%)"};
    ["up", "left", "ok", "right", "down"].forEach((k, i) => {
      const {root, face} = paper("button", base + i * 101, {cls: k + " press"});
      root.type = "button";
      const lbl = (c.labels && c.labels[k]) || JAM_REMOTE_LABELS[k];
      if (k === "ok") {
        root.style.setProperty("--clip", "circle(46% at 50% 50%)"); root.style.setProperty("--clip-s", "circle(46% at 50% 50%)");
        face.textContent = lbl;
      } else {
        root.style.setProperty("--clip", this._arm(k, base + i * 101)); root.style.setProperty("--clip-s", this._arm(k, base + i * 101 + 1));
        const t = el("span", "tri"); t.style.clipPath = tri[k]; t.setAttribute("aria-hidden", "true");
        face.append(t); root.setAttribute("aria-label", lbl);
      }
      root.dataset.key = k; root.disabled = off;
      this._bind(root, k);
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
    return c.name || friendly(this._hass, c.media_player || c.entity) || "—";
  }
  render(b) {
    const c = this._config, h = this._hass, s = stateObj(h, c.entity), mp = stateObj(h, c.media_player);
    const off = !s || UNAVAILABLE.has(s.state);
    const {root, face: wrap} = this.paper(c.entity, {edges: "rb", face: `wrap stripe s-${tone(s)}${off ? " unavail" : ""}`});
    wrap.append(el("div", "label", c.name || friendly(h, c.entity)));
    const title = this._title(s, mp);
    const tt = el("div", "title", title); tt.style.cursor = "pointer"; tt.onclick = () => moreInfo(this, c.media_player || c.entity);
    wrap.append(tt);
    for (const row of c.rows || JAM_REMOTE_ROWS) {
      if (!Array.isArray(row)) continue;
      if (row.includes("dpad")) { wrap.append(this._pad(off)); continue; }
      const r = el("div", "row");
      for (const k of row) {
        const lbl = (c.labels && c.labels[k]) || JAM_REMOTE_LABELS[k] || String(k).replace(/_/g, " ");
        const btn = cutKey(lbl, `jam-remote|${c.entity}|${k}`, k === "power" ? "alert" : "");
        btn.dataset.key = k;
        btn.disabled = off || !this._known(k);
        this._bind(btn, k);
        r.append(btn);
      }
      wrap.append(r);
    }
    b.append(root);
  }
  disconnectedCallback() { if (this._hold) this._hold(); }
  getCardSize() { return 7; }
}
register("jam-remote", JamRemote, "Jam Remote", "TV remote: cut-paper d-pad, OK disc and keys sending remote commands or custom actions.");
