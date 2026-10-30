/* ---------- jam-music-panel (round 3, 2026-10-30): Music Assistant library panel "B" + shared music helpers ----------
   Not a card (no element). jam-speaker opens the panel (tap on the poster art / band; the kiosk art; the kiosk shelf's
   Browse tile) and uses the helpers here: glyphs, the cut-paper idle art, the art colour sampler, pins, MA calls.

   Music Assistant from the HA frontend (checked read-only on the user's HA, 2026-10-30: core integration music_assistant,
   one config entry; players media_player.oneplus_speaker_2 = Living Room Speakers, media_player.kitchen = Kitchen Speakers,
   media_player.phoster = Phoster; HA source homeassistant/components/music_assistant services.py / schemas.py / button.py):
   - Response actions go over the websocket: hass.callWS({type: "call_service", domain: "music_assistant", service,
     service_data, target?, return_response: true}) -> {context, response}. Any HA user may call them. They need
     config_entry_id: config `config_entry_id`, else callWS config_entries/get {domain: "music_assistant"} (first loaded
     entry), else the player's device primary_config_entry (hass.entities[player].device_id -> hass.devices[id]).
   - music_assistant.get_library {config_entry_id, media_type: playlist | album | artist | track | radio | podcast |
     audiobook, limit (default 25), offset, order_by (name, sort_name, last_played_desc, play_count_desc,
     timestamp_added_desc, random, ...), favorite?, search?} -> {items: [{media_type, uri, name, version, image, favorite,
     explicit, artists?: [{name, uri, ...}], album?: {name, ...}}], limit, offset, order_by, media_type}. Items carry no
     play time, so Recent = playlists + albums by last_played_desc, interleaved; the detail line is type · artist.
   - music_assistant.search {config_entry_id, name, media_type: [...], limit (per type, default 5), library_only?}
     -> {artists, albums, tracks, playlists, radio, audiobooks, podcasts: [item]}.
   - music_assistant.play_media {entity_id (the player), media_id: uri, media_type?, enqueue?} (no response; without
     enqueue MA uses the player's default for the type).
   - music_assistant.get_queue (target the player, response only) -> {<entity_id>: {queue_id, active, name, items,
     shuffle_enabled, repeat_mode, current_index, elapsed_time, current_item: {queue_item_id, name, duration, media_item:
     {media_type, uri, name, image, favorite, ...}} | null, next_item}}: lights the Favourite key for MA-queue playback.
   - Favourite: no service. Every MA player has a button entity "Favorite current song" (translation_key / unique_id suffix
     favorite_now_playing, same device as the player; e.g. button.oneplus_speaker_favorite_current_song_2 for
     media_player.oneplus_speaker_2, button.kitchen_favorite_current_song): button.press adds the playing track to the MA
     favourites. Add only: there is no un-favourite.
   - Shuffle: media_player.shuffle_set {shuffle} (SHUFFLE_SET 32768, attribute `shuffle`).
   - Per-user pins: frontend/get_user_data + set_user_data, key jam_pins (like jam-light's jam_colors), value
     [{uri, name, media_type, image}] plus {uri, hidden: true} for a config pin the user unpinned; in memory if that fails.
   Panel B (openSheet; fullscreen from a kiosk card): mini header (thumb, room, source line, Speakers key with `speakers`,
   Close), tabs Pinned / Recent / Playlists / Albums / Search, list rows (cover thumb or cut-paper thumb, name,
   "type · detail", Play key = music_assistant.play_media, corner tab = pin / unpin), docked ink bar (thumb, title /
   artist, Prev, Play-Pause, Next, Favourite). Loading / error (with Retry) / empty states in plain words. */
const JAM_MU = {entry: null, pins: null, pinsLoad: null, lib: new Map(), fav: new Map(), favLoad: new Set(), art: new Map(), names: new Map()};
const JAM_MU_TYPES = {playlist: "Playlist", album: "Album", artist: "Artist", track: "Track", radio: "Radio", podcast: "Podcast",
  audiobook: "Audiobook", folder: "Folder"};
const JAM_MU_PLAYABLE = new Set(["artist", "album", "audiobook", "folder", "playlist", "podcast", "track", "radio"]);
/* Static glyph markup (no data), 24px grid, flat: fill or square-capped strokes. */
const JAM_MU_SVG = (() => {
  const f = d => `<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false" fill="currentColor">${d}</svg>`;
  const s = (d, w) => `<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false" fill="none" stroke="currentColor" stroke-width="${w || 2.5}" ` +
    `stroke-linecap="square" stroke-linejoin="miter">${d}</svg>`;
  return {
    power: s('<path d="M12 3v8"/><path d="M6.3 6.3a8 8 0 1 0 11.4 0"/>', 3),
    prev: f('<path d="M6 5h3v14H6zM20 5v14L10 12z"/>'),
    play: f('<path d="M7 4v16l13-8z"/>'),
    pause: f('<path d="M6 4h4v16H6zM14 4h4v16h-4z"/>'),
    next: f('<path d="M15 5h3v14h-3zM4 5v14l10-7z"/>'),
    shuffle: s('<path d="M3 7h4l10 10h4M3 17h4l3-3M14 10l3-3h4M18 4l3 3-3 3M18 14l3 3-3 3"/>'),
    heart: f('<path d="M12 21 3 12a5 5 0 0 1 9-6 5 5 0 0 1 9 6z"/>'),
    heartOff: s('<path d="M12 20 4 12a4.5 4.5 0 0 1 8-5 4.5 4.5 0 0 1 8 5z"/>'),
    speakers: s('<rect x="3" y="4" width="7" height="16"/><rect x="14" y="4" width="7" height="16"/><circle cx="6.5" cy="14" r="2"/><circle cx="17.5" cy="14" r="2"/>'),
    pin: f('<path d="M8 3h8v2l-2 1v5l3 3v2h-4v6h-2v-6H7v-2l3-3V6L8 5z"/>'),
    more: f('<path d="M3 10h4v4H3zM10 10h4v4h-4zM17 10h4v4h-4z"/>'),
  };
})();
/* entity_picture / MA image -> absolute URL (hass.hassUrl in HA; http(s): / data: / blob: as is). */
function jamMuUrl(h, u) {
  if (!u) return null;
  u = String(u);
  if (/^(https?:|data:|blob:)/i.test(u)) return u;
  try { if (h && typeof h.hassUrl === "function") return h.hassUrl(u); } catch (e) { /* fall through */ }
  return u;
}
/* Seconds -> "m:ss" (or "h:mm" for an hour or more). */
function jamMuTime(sec, long) {
  sec = Math.max(0, Math.floor(sec));
  const h = Math.floor(sec / 3600), m = Math.floor((sec % 3600) / 60), s = sec % 60;
  return long ? `${h}:${String(m).padStart(2, "0")}` : `${Math.floor(sec / 60)}:${String(s).padStart(2, "0")}`;
}
function jamMuIcon(name) { const s = el("span", "ico"); s.setAttribute("aria-hidden", "true"); s.innerHTML = JAM_MU_SVG[name] || ""; return s; } // static markup
/* Icon key on the chip cut: real <button>, aria-label = label. */
function jamMuKey(icon, label, key, cls, run, disabled) {
  const k = cutKey("", "jam-music|" + key, "ikey" + (cls ? " " + cls : ""), "chip");
  k.firstChild.append(jamMuIcon(icon)); k.setAttribute("aria-label", label); k.dataset.key = key;
  k.disabled = !!disabled; if (run) k.onclick = run;
  return k;
}
/* Cut-paper idle art (seeded, flat, no motion): a palette ground + 2-3 shapes (disc, ring, bar, strip, tilted square).
   Sizes in cqmin (the box is a size container), so one seed reads the same on a poster, a thumb or the kiosk art. Red is
   left out (reserved for alerts). Same seed = same picture. */
const JAM_MU_POOL = ["var(--ink)", "#ece2c9", "var(--ochre)", "var(--teal)", "var(--blue)", "var(--pink)", "var(--violet)", "var(--green)"];
function jamMuIdleArt(sd) {
  const r = rng((sd >>> 0) ^ 0x5bd1e995), pick = a => a[Math.floor(r() * a.length)], box = el("div", "abs");
  box.setAttribute("aria-hidden", "true");
  const used = [], col = () => { let c; do c = pick(JAM_MU_POOL); while (used.includes(c)); used.push(c); return c; };
  const R = (a, b) => +(a + r() * (b - a)).toFixed(1);
  box.style.background = col();
  for (let i = 0, n = 2 + Math.floor(r() * 2); i < n; i++) {
    const k = pick(["disc", "ring", "hbar", "vbar", "square"]), s = el("i"), st = s.style, c = col();
    if (k === "disc" || k === "ring") {
      const d = R(45, 95); st.width = st.height = d + "cqmin"; st.borderRadius = "50%"; st.left = R(-25, 70) + "%"; st.top = R(-35, 50) + "%";
      if (k === "ring") st.border = R(9, 15) + "cqmin solid " + c; else st.background = c;
    } else if (k === "hbar") { st.width = R(50, 110) + "%"; st.height = R(10, 22) + "cqmin"; st.left = R(-10, 50) + "%"; st.top = R(8, 70) + "%"; st.background = c; }
    else if (k === "vbar") { st.width = R(9, 20) + "cqmin"; st.height = "130%"; st.left = R(8, 85) + "%"; st.top = "-15%"; st.background = c; if (r() < .5) st.transform = `skewX(${R(-16, 16)}deg)`; }
    else { const d = R(30, 60); st.width = st.height = d + "cqmin"; st.left = R(0, 75) + "%"; st.top = R(5, 55) + "%"; st.transform = `rotate(${R(-25, 25)}deg)`; st.background = c; }
    box.append(s);
  }
  return box;
}
/* Cover thumb: the item's image, or its own cut-paper art (seeded by the uri); a broken image falls back to the art. */
function jamMuThumb(h, src, key, cls) {
  const t = el("div", "thumb" + (cls ? " " + cls : "")), art = () => jamMuIdleArt(seed(String(key || "")));
  t.setAttribute("aria-hidden", "true");
  const u = src && jamMuUrl(h, src);
  if (u) { const img = el("img"); img.alt = ""; img.decoding = "async"; img.loading = "lazy"; img.onerror = () => { img.replaceWith(art()); }; img.src = u; t.append(img); }
  else t.append(art());
  return t;
}
/* ---- colour ---- */
const JAM_MU_INK = [20, 18, 16], JAM_MU_PAPER = [236, 226, 201];
const jamMuContrast = (a, b) => { const x = luminance(a), y = luminance(b); return (Math.max(x, y) + .05) / (Math.min(x, y) + .05); };
/* A fill [r,g,b] and its text: ink or paper, whichever reads better; a mid-tone where neither reaches 4.5:1 is pushed
   lighter (ink text) or darker (paper text) until it does. -> {bg, fg, ink, track} (track = a flat 22% mix of fg into bg). */
function jamMuReadable(rgb) {
  let c = rgb.slice(0, 3).map(v => Math.max(0, Math.min(255, Number(v) || 0)));
  const ink = jamMuContrast(c, JAM_MU_INK) >= jamMuContrast(c, JAM_MU_PAPER), to = ink ? [255, 255, 255] : [0, 0, 0], fgc = ink ? JAM_MU_INK : JAM_MU_PAPER;
  for (let i = 0; i < 20 && jamMuContrast(c, fgc) < 4.5; i++) c = c.map((v, j) => v + (to[j] - v) * .12);
  c = c.map(Math.round);
  return {bg: rgbCss(c), fg: rgbCss(fgc), ink, track: rgbCss(c.map((v, j) => v + (fgc[j] - v) * .22)), rgb: c};
}
const JAM_MU_VIOLET = [155, 109, 214];
/* Dominant colour of a loaded <img> (24x24 canvas, 3 bits per channel buckets, the biggest wins; saturation counts up to
   1.5x, so a cream sleeve stays cream but a vivid block beats a dull one of similar size), made readable.
   null when the canvas is tainted (cross-origin art) or the image is empty. Bounded cache by src. */
function jamMuArtColor(img, key) {
  const k = key || img.currentSrc || img.src;
  if (JAM_MU.art.has(k)) return JAM_MU.art.get(k);
  let out = null;
  try {
    const N = 24, cv = document.createElement("canvas"); cv.width = cv.height = N;
    const x = cv.getContext("2d", {willReadFrequently: true});
    x.drawImage(img, 0, 0, N, N);
    const d = x.getImageData(0, 0, N, N).data, B = new Map();
    for (let i = 0; i < d.length; i += 4) {
      if (d[i + 3] < 128) continue;
      const key = (d[i] >> 5) << 6 | (d[i + 1] >> 5) << 3 | (d[i + 2] >> 5), e = B.get(key) || [0, 0, 0, 0];
      e[0] += d[i]; e[1] += d[i + 1]; e[2] += d[i + 2]; e[3]++; B.set(key, e);
    }
    let best = null, bs = -1;
    for (const e of B.values()) {
      const n = e[3], c = [e[0] / n, e[1] / n, e[2] / n], mx = Math.max(...c), mn = Math.min(...c), sc = n * (1 + .5 * (mx ? (mx - mn) / mx : 0));
      if (sc > bs) { bs = sc; best = c; }
    }
    out = best ? jamMuReadable(best) : null;
  } catch (e) { out = null; }
  if (JAM_MU.art.size >= 64) JAM_MU.art.delete(JAM_MU.art.keys().next().value);
  JAM_MU.art.set(k, out);
  return out;
}
/* ---- Music Assistant calls ---- */
function jamMuWs(h, msg) {
  if (!h || typeof h.callWS !== "function") return Promise.reject(new Error("No connection to Home Assistant"));
  return Promise.resolve().then(() => h.callWS(msg));
}
function jamMuCall(h, service, data, target) {
  const msg = {type: "call_service", domain: "music_assistant", service, service_data: data || {}, return_response: true};
  if (target) msg.target = target;
  return jamMuWs(h, msg).then(r => (r && r.response) || {});
}
function jamMuEntry(h, cfg) {
  if (cfg && cfg.config_entry_id) return Promise.resolve(cfg.config_entry_id);
  if (JAM_MU.entry) return Promise.resolve(JAM_MU.entry);
  const dev = () => {
    const e = h && h.entities && h.entities[cfg.entity], d = e && e.device_id && h.devices && h.devices[e.device_id];
    return (d && (d.primary_config_entry || (Array.isArray(d.config_entries) && d.config_entries[0]))) || null;
  };
  return jamMuWs(h, {type: "config_entries/get", domain: "music_assistant"}).then(list => {
    const ok = Array.isArray(list) ? list.filter(x => x && x.domain === "music_assistant" && x.entry_id) : [];
    const hit = ok.find(x => x.state === "loaded") || ok[0];
    if (hit) JAM_MU.entry = hit.entry_id;
    return hit ? hit.entry_id : dev();
  }, () => dev()).then(id => { if (!id) throw new Error("Music Assistant was not found for this player"); return id; });
}
/* Library call with a short cache (key -> {at, p}); failures are not cached. */
function jamMuLib(h, cfg, key, service, data, ttl) {
  const k = (cfg.config_entry_id || "") + "|" + key, c = JAM_MU.lib.get(k);
  if (c && Date.now() - c.at < ttl) return c.p;
  const p = jamMuEntry(h, cfg).then(entry => jamMuCall(h, service, {config_entry_id: entry, ...data}));
  JAM_MU.lib.set(k, {at: Date.now(), p});
  if (JAM_MU.lib.size > 40) JAM_MU.lib.delete(JAM_MU.lib.keys().next().value);
  p.catch(() => { const x = JAM_MU.lib.get(k); if (x && x.p === p) JAM_MU.lib.delete(k); });
  return p;
}
const jamMuItems = r => (r && Array.isArray(r.items) ? r.items.filter(x => x && x.uri) : []);
/* MA item -> {uri, name, media_type, image, detail}. */
function jamMuItem(x) {
  const uri = String(x.uri), m = /^[a-z_]+:\/\/([a-z_]+)\//i.exec(uri);
  const t = String(x.media_type || (m && m[1]) || "").toLowerCase();
  const artists = Array.isArray(x.artists) ? x.artists.map(a => a && a.name).filter(Boolean).join(", ") : "";
  const it = {uri, name: String(x.name || uri), media_type: t, image: x.image || null, detail: artists || (x.album && x.album.name) || ""};
  // Remember names / covers by uri: a config pin given as a bare uri shows them once the library has been read.
  if (x.name) { JAM_MU.names.delete(uri); JAM_MU.names.set(uri, it); if (JAM_MU.names.size > 500) JAM_MU.names.delete(JAM_MU.names.keys().next().value); }
  return it;
}
function jamMuRecent(h, cfg, ttl) {
  const one = t => jamMuLib(h, cfg, "recent|" + t, "get_library", {media_type: t, order_by: "last_played_desc", limit: 12}, ttl).then(jamMuItems, e => e);
  return Promise.all([one("playlist"), one("album")]).then(([p, a]) => {
    if (p instanceof Error && a instanceof Error) throw p;
    const P = p instanceof Error ? [] : p, A = a instanceof Error ? [] : a, out = [];
    for (let i = 0; i < Math.max(P.length, A.length); i++) { if (P[i]) out.push(P[i]); if (A[i]) out.push(A[i]); }
    return out.map(jamMuItem);
  });
}
const jamMuErr = e => String((e && (e.message || (e.error && e.error.message))) || e || "unknown error");
/* ---- favourite (per track, page-wide) ---- */
function jamMuFavSet(k, v) {
  JAM_MU.fav.delete(k); JAM_MU.fav.set(k, !!v);
  if (JAM_MU.fav.size > 200) JAM_MU.fav.delete(JAM_MU.fav.keys().next().value);
}
/* ---- pins (config `pinned` + per-user jam_pins) ---- */
function jamMuPinsLoad(h) {
  if (JAM_MU.pins) return Promise.resolve(JAM_MU.pins);
  if (JAM_MU.pinsLoad) return JAM_MU.pinsLoad;
  const p = jamMuWs(h, {type: "frontend/get_user_data", key: "jam_pins"})
    .then(r => { const v = r && r.value; JAM_MU.pins = Array.isArray(v) ? v.filter(x => x && typeof x.uri === "string").slice(-60) : []; },
      () => { JAM_MU.pins = JAM_MU.pins || []; })
    .then(() => { JAM_MU.pinsLoad = null; return JAM_MU.pins; });
  JAM_MU.pinsLoad = p;
  return p;
}
function jamMuCfgPins(cfg) {
  return (cfg.pinned || []).map(x => (typeof x === "string" ? {uri: x} : x)).filter(x => x && typeof x.uri === "string" && x.uri)
    .map(x => {
      const k = JAM_MU.names.get(x.uri) || {}, m = /^[a-z_]+:\/\/([a-z_]+)\//i.exec(x.uri);
      return {uri: x.uri, name: x.name ? String(x.name) : k.name || "", media_type: x.media_type || k.media_type || (m ? m[1].toLowerCase() : ""),
        image: x.image || k.image || null, detail: k.detail || "", cfg: true};
    });
}
/* Pinned list: config pins (unless the user unpinned them), then the user's own. Names fall back to the uri's last part. */
function jamMuPinned(cfg) {
  const user = JAM_MU.pins || [], hidden = new Set(user.filter(x => x.hidden).map(x => x.uri)), cp = jamMuCfgPins(cfg);
  const seen = new Set(cp.map(x => x.uri));
  const out = cp.filter(x => !hidden.has(x.uri)).concat(user.filter(x => !x.hidden && !seen.has(x.uri)));
  return out.map(x => ({...x, name: x.name || JAM_MU_TYPES[x.media_type] || "Pinned", detail: x.detail || ""}));
}
/* Config pins given as a bare uri: read the library list of their type once (cached 10 min, the same call as the panel's
   Playlists / Albums tabs) so jamMuItem remembers their names and covers. Promise, or null when nothing is missing.
   Callers guard against calling it again on their own refill. */
function jamMuResolvePins(h, cfg) {
  const need = [...new Set(jamMuCfgPins(cfg).filter(x => !x.name && JAM_MU_PLAYABLE.has(x.media_type)).map(x => x.media_type))];
  if (!need.length) return null;
  return Promise.all(need.map(t => jamMuLib(h, cfg, "lib|" + t, "get_library", {media_type: t, order_by: "name", limit: 100}, 600e3)
    .then(r => { jamMuItems(r).forEach(x => jamMuItem(x)); }, () => {})));
}
function jamMuIsPinned(cfg, uri) { return jamMuPinned(cfg).some(x => x.uri === uri); }
function jamMuTogglePin(h, cfg, it) {
  let list = (JAM_MU.pins || []).filter(x => x.uri !== it.uri);
  const isCfg = jamMuCfgPins(cfg).some(x => x.uri === it.uri), was = jamMuIsPinned(cfg, it.uri);
  if (was && isCfg) list.push({uri: it.uri, hidden: true});
  else if (!was && !isCfg) list.push({uri: it.uri, name: it.name, media_type: it.media_type, image: it.image || null});
  JAM_MU.pins = list.slice(-60);
  try { jamMuWs(h, {type: "frontend/set_user_data", key: "jam_pins", value: JAM_MU.pins}).catch(() => { /* kept in memory */ }); } catch (e) { /* kept in memory */ }
  return !was;
}
/* Speaker rows (This room + one per speaker) and the volume track: shared by jam-speaker's card / kiosk and the panel. */
const JAM_MU_ROWS_CSS = `
    .vt{position:relative;height:30px;touch-action:none}
    .vt[role=slider]{cursor:pointer}
    .vt .strip{inset:0}
    .vt.thin{height:22px} .vt.thin .strip{inset:7px 0}
    .vt:focus-visible{outline:3px solid var(--ochre);outline-offset:2px}
    .spk{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:4px 10px;align-items:center;padding-top:8px;border-top:2px solid var(--line)}
    .spk .n{font-family:var(--display);font-weight:900;text-transform:uppercase;font-size:1rem;line-height:1;overflow:hidden;white-space:nowrap;text-overflow:ellipsis}
    .spk .vt{grid-column:1/-1}
    .spk .tog{min-width:0}
    .spk .tog > .face{--p-t:7px;--p-b:7px;--p-l:10px;--p-r:10px;font-size:.58rem;letter-spacing:.14em}
    .spk .here{font:600 .58rem/1 var(--body);letter-spacing:.14em;text-transform:uppercase;color:var(--dim)}`;
/* Shared glyph-key / thumb / idle-art CSS (card and panel). */
const JAM_MU_BASE_CSS = `
    .ico{display:block;width:var(--ic,24px);height:var(--ic,24px)} .ico svg{display:block;width:100%;height:100%}
    .ikey > .face{display:flex;align-items:center;justify-content:center;padding:0}
    .abs{position:absolute;inset:0;overflow:hidden;container-type:size}
    .abs i{position:absolute;display:block;box-sizing:border-box}
    .thumb{position:relative;overflow:hidden;flex:none;background:var(--slab3)}
    .thumb img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;display:block}`;
const JAM_MU_PANEL_CSS = JAM_MU_BASE_CSS + JAM_MU_ROWS_CSS + `
  .mu .sheet{max-width:620px}
  .mu .sheet > .face{height:min(700px,90vh);gap:10px}
  .mu .head{align-items:center}
  .mu .head > .thumb{width:52px;height:52px}
  .mu .t{flex:1;gap:3px}
  .mu .t h2{font-size:22px;line-height:1;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
  .mu .t .ss{font:500 13px/1.2 var(--body);color:var(--dim);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
  .mu .acts > .key{min-width:0}
  .mu .acts > .key > .face{display:flex;align-items:center}
  .mu .acts .key.sel > .face{background:var(--fg);color:var(--slab)}
  .tabs{flex:none;display:flex;border-bottom:3px solid var(--slab3);overflow-x:auto;scrollbar-width:none}
  .tabs button{flex:none;position:relative;padding:12px 12px;font:600 12px/1 var(--body);letter-spacing:.12em;text-transform:uppercase;color:var(--dim)}
  .tabs button.on{color:var(--fg)}
  .tabs button.on::before{content:"";position:absolute;left:0;right:0;bottom:0;height:4px;background:var(--acc)}
  .tabs button::after{content:"";position:absolute;left:0;right:0;top:50%;height:max(100%,44px);transform:translateY(-50%)}
  .mu .body{gap:2px;padding:0;align-content:start}
  .row{position:relative;display:grid;grid-template-columns:44px minmax(0,1fr) auto;gap:12px;align-items:center;background:var(--slab2);padding:6px 34px 6px 6px}
  .row > .thumb{width:44px;height:44px}
  .row .nm{font:900 16px/1 var(--display);text-transform:uppercase;overflow-wrap:anywhere;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}
  .row .dt{font:500 12px/1.25 var(--body);color:var(--dim);margin-top:3px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
  .row .play > .face{--p-t:0;--p-b:0;--p-l:14px;--p-r:16px;height:34px;display:flex;align-items:center;font-size:12px;background:var(--slab3)}
  .pin{position:absolute;right:0;top:0;width:28px;height:28px;color:var(--fg)}
  .pin::before{content:"";position:absolute;inset:0;background:var(--slab3);clip-path:polygon(0 0,100% 0,100% 100%)}
  .pin.on::before{background:var(--acc)}
  .pin.on{color:var(--acc-fg)}
  .pin .ico{position:absolute;right:2px;top:2px;--ic:13px}
  .pin:not(.on) .ico{color:var(--dim)}
  .pin:focus-visible{outline-offset:-3px}
  .msg{padding:18px 6px;display:grid;gap:12px;justify-items:start;font:500 14px/1.4 var(--body);color:var(--dim)}
  .msg b{font:900 18px/1 var(--display);text-transform:uppercase;color:var(--fg)}
  .msg .key > .face{display:flex;align-items:center;height:40px;--p-t:0;--p-b:0}
  .grp{font:600 11px/1 var(--body);letter-spacing:.16em;text-transform:uppercase;color:var(--dim);padding:12px 6px 6px}
  .sbar{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:6px;padding-bottom:8px}
  .sbar input{min-width:0;height:44px;border:0;border-bottom:3px solid var(--slab3);background:var(--slab2);color:var(--fg);padding:0 12px;
    font:500 16px/1 var(--body);border-radius:0;outline:none;-webkit-appearance:none;appearance:none}
  .sbar input:focus-visible{outline:3px solid var(--ochre);outline-offset:2px}
  .sbar .key > .face{display:flex;align-items:center;height:44px;--p-t:0;--p-b:0}
  .res{display:grid;gap:2px}
  .spks{display:grid;gap:8px;padding:4px 2px}
  .dock{flex:none;display:grid;grid-template-columns:44px minmax(0,1fr) 44px 56px 44px 44px;gap:6px;align-items:center;background:var(--ink);color:#ece2c9;padding:8px}
  .dock.nofav{grid-template-columns:44px minmax(0,1fr) 44px 56px 44px}
  .dock > .thumb{width:44px;height:44px}
  .dock .tt{font:900 15px/1 var(--display);text-transform:uppercase;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
  .dock .st{font:500 11px/1.3 var(--body);color:#9a8f7c;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
  .dock .ikey{min-width:0}
  .dock .ikey > .face{height:44px;background:#36312b;color:#ece2c9;--ic:20px}
  .dock .ikey.main > .face{background:var(--acc);color:var(--acc-fg)}
  .dock .ikey.fav > .face{color:var(--pink)}
  .dock .ikey.fav.on > .face{background:var(--pink);color:#141210}
  .dock .ikey:disabled > .face{color:#6b6152}
  /* phones: tabs fit the width, the room name may take two lines */
  @media (max-width:600px){
    .tabs button{padding:12px 7px;letter-spacing:.06em}
    .mu:not(.full) .t h2{white-space:normal;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow-wrap:anywhere}
    .mu:not(.full) .acts > .key > .face{--p-l:9px;--p-r:11px}
  }
  /* kiosk (fullscreen, from a size: kiosk card): bigger type, 18px floor */
  .mu.full .sheet > .face{height:100%}
  .mu.full .head > .thumb{width:64px;height:64px}
  .mu.full .t h2{font-size:clamp(28px,4vw,40px)}
  .mu.full .t .ss{font-size:18px}
  .mu.full .acts > .key > .face{font-size:18px;--p-l:20px;--p-r:22px}
  .mu.full .tabs button{font-size:18px;padding:16px 18px}
  .mu.full .row{grid-template-columns:64px minmax(0,1fr) auto;padding:6px 44px 6px 6px;gap:16px}
  .mu.full .row > .thumb{width:64px;height:64px}
  .mu.full .row .nm{font-size:24px}
  .mu.full .row .dt{font-size:18px}
  .mu.full .row .play > .face{height:52px;font-size:18px;--p-l:20px;--p-r:22px}
  .mu.full .pin{width:38px;height:38px} .mu.full .pin .ico{--ic:16px}
  .mu.full .msg{font-size:18px} .mu.full .msg b{font-size:24px}
  .mu.full .grp{font-size:18px}
  .mu.full .sbar input{height:56px;font-size:20px} .mu.full .sbar .key > .face{height:56px;font-size:18px}
  .mu.full .dock{grid-template-columns:64px minmax(0,1fr) 64px 84px 64px 64px;gap:8px;padding:10px}
  .mu.full .dock.nofav{grid-template-columns:64px minmax(0,1fr) 64px 84px 64px}
  .mu.full .dock > .thumb{width:64px;height:64px}
  .mu.full .dock .ikey > .face{height:64px;--ic:28px}
  .mu.full .dock .tt{font-size:24px} .mu.full .dock .st{font-size:18px}
  .mu.full .spk .n{font-size:28px} .mu.full .spk .tog > .face,.mu.full .spk .here{font-size:18px}
  .mu.full .spk .vt.thin{height:44px} .mu.full .spk .vt.thin .strip{inset:8px 0}`;
const JAM_MU_TABS = [["pinned", "Pinned"], ["recent", "Recent"], ["playlists", "Playlists"], ["albums", "Albums"], ["search", "Search"]];
const JAM_MU_EMPTY = {pinned: ["Nothing pinned yet", "Use the corner tab on any playlist or album to pin it here."],
  recent: ["Nothing played yet", "Music played through Music Assistant shows up here."],
  playlists: ["No playlists", "The Music Assistant library has no playlists."], albums: ["No albums", "The Music Assistant library has no albums."]};
/* Panel B for a jam-speaker `card` (uses card._config, card._hass, card._room(), card._badge(s), card._artSrc(s),
   card._transportKeys(s, off), card._favKey(s, off), card._speakers, card._speakersPane(s, stamp), card._play(item)).
   Returns {update(), close(opts), isOpen()}. */
function jamMusicPanel(card) {
  const c = card._config, H = () => card._hass, full = !!card._kiosk;
  const P = {tab: null, view: "lib", data: {}, q: "", res: null, seq: 0};
  const room = card._room();
  let spkKey = null;
  if (card._speakers.length) {
    spkKey = cutKey("Speakers", "jam-music|speakers", "", "chip"); spkKey.dataset.key = "speakers";
    spkKey.onclick = () => { P.view = P.view === "spk" ? "lib" : "spk"; hdr(); tabs(); fill(true); };
  }
  const acc = card._body ? getComputedStyle(card._body).getPropertyValue("--acc").trim() : "";
  // Theme tokens from the sheet that holds the card (a kiosk sheet shifts its children's surfaces one step up), else the card.
  const from = composedChain(card).reverse().find(x => x !== card && x.classList && x.classList.contains("jam-sheet-host")) || card;
  const sheet = openSheet({from, title: room, label: room + " music", rule: false, fullscreen: full, cls: "mu", css: JAM_MU_PANEL_CSS,
    accent: acc || null, headerActions: [spkKey], onClose: () => { if (card._panel === api) card._panel = null; if (full && card.isConnected) card._render(false); }});
  const face = sheet.face, body = sheet.body, head = face.querySelector(".head"), t = head.querySelector(".t");
  const sub = el("div", "ss"); t.append(sub);
  let thumbKey = null;
  const tabBar = el("div", "tabs"); tabBar.setAttribute("role", "group"); tabBar.setAttribute("aria-label", "Library");
  face.insertBefore(tabBar, body);
  const dock = el("div", "dock");
  face.append(dock);
  const hdr = () => {
    const s = stateObj(H(), c.entity), src = card._artSrc(s), k = src || "abs:" + c.entity;
    if (k !== thumbKey) { thumbKey = k; const old = head.querySelector(":scope > .thumb"), n = jamMuThumb(H(), src, c.entity); if (old) old.replaceWith(n); else head.prepend(n); }
    sub.textContent = card._badge(s)[0];
    if (spkKey) { spkKey.classList.toggle("sel", P.view === "spk"); spkKey.setAttribute("aria-pressed", String(P.view === "spk")); }
  };
  const dockFill = () => {
    const s = stateObj(H(), c.entity), a = (s && s.attributes) || {}, off = !s || UNAVAILABLE.has(s.state), idle = off || !JAM_SPK_ACTIVE.has(s.state);
    const tx = el("div"); tx.style.minWidth = "0";
    tx.append(el("div", "tt", (!idle && a.media_title) || (a.media_title ? a.media_title : room)), el("div", "st", !idle ? (a.media_artist || card._badge(s)[0]) : (a.media_title ? "Last played" : card._badge(s)[0])));
    const fav = card._favKey(s, off, "fav");
    dock.textContent = "";
    dock.classList.toggle("nofav", !fav);
    dock.append(jamMuThumb(H(), card._artSrc(s), c.entity), tx, ...card._transportKeys(s, off));
    if (fav) dock.append(fav);
  };
  const tabs = () => {
    tabBar.textContent = "";
    for (const [id, label] of JAM_MU_TABS) {
      const b = el("button", P.view === "lib" && P.tab === id ? "on" : "", label); b.type = "button"; b.dataset.tab = id;
      b.setAttribute("aria-pressed", String(P.view === "lib" && P.tab === id));
      b.onclick = () => { if (P.view === "lib" && P.tab === id) return; P.view = "lib"; P.tab = id; tabs(); hdr(); fill(true); };
      tabBar.append(b);
    }
  };
  const msg = (title, text, retry) => {
    const m = el("div", "msg"); m.append(el("b", "", title)); if (text) m.append(el("div", "", text));
    if (retry) { const k = cutKey("Retry", "jam-music|retry", "", "chip"); k.dataset.key = "retry"; k.onclick = retry; m.append(k); }
    return m;
  };
  const row = it => {
    const r = el("div", "row"); r.dataset.uri = it.uri;
    const tx = el("div"); tx.style.minWidth = "0";
    tx.append(el("div", "nm", it.name), el("div", "dt", [JAM_MU_TYPES[it.media_type] || it.media_type, it.detail].filter(Boolean).join(" · ")));
    const play = cutKey("Play", "jam-music|play", "play", "chip"); play.dataset.key = "play"; play.setAttribute("aria-label", "Play " + it.name);
    play.onclick = () => { card._play(it); if (motionOn()) oneShot(play, "jam-stamp"); };
    const on = jamMuIsPinned(c, it.uri), pin = el("button", "pin hit" + (on ? " on" : "")); pin.type = "button"; pin.dataset.key = "pin";
    pin.setAttribute("aria-pressed", String(on)); pin.setAttribute("aria-label", (on ? "Unpin " : "Pin ") + it.name);
    pin.append(jamMuIcon("pin"));
    pin.onclick = () => { jamMuPinsLoad(H()).then(() => { jamMuTogglePin(H(), c, it); if (sheet.isOpen()) fill(false); }); };
    r.append(jamMuThumb(H(), it.image, it.uri), tx, play, pin);
    return r;
  };
  const list = (items, empty) => {
    if (!items.length) return [msg(...empty)];
    return items.map(row);
  };
  const load = (tab, force) => {
    if (!force && P.data[tab]) return; // an error stays until Retry (no retry loop)
    const h = H(), my = P.data[tab] = {status: "loading"};
    let p;
    if (tab === "pinned") p = jamMuPinsLoad(h).then(() => null);
    else if (tab === "recent") p = jamMuRecent(h, c, force ? 0 : 60e3);
    else {
      const mt = tab === "playlists" ? "playlist" : "album";
      p = jamMuLib(h, c, "lib|" + mt, "get_library", {media_type: mt, order_by: "name", limit: 100}, force ? 0 : 600e3).then(r => jamMuItems(r).map(jamMuItem));
    }
    p.then(items => { if (P.data[tab] === my) P.data[tab] = {status: "ok", items: items || []}; },
      e => { if (P.data[tab] === my) P.data[tab] = {status: "error", error: jamMuErr(e)}; })
      .then(() => { if (sheet.isOpen() && P.view === "lib" && P.tab === tab) fill(false); });
  };
  let sbar = null, input = null;
  const search = () => {
    const q = input.value.trim();
    if (q.length < 2) { P.res = {status: "short"}; fill(false); return; }
    const n = ++P.seq, h = H();
    P.q = q; P.res = {status: "loading"}; fill(false);
    jamMuEntry(h, c).then(entry => jamMuCall(h, "search", {config_entry_id: entry, name: q, media_type: ["playlist", "album", "artist", "track", "radio"], limit: 6}))
      .then(r => {
        if (n !== P.seq) return;
        const groups = [["playlists", "Playlists"], ["albums", "Albums"], ["artists", "Artists"], ["tracks", "Tracks"], ["radio", "Radio"]]
          .map(([k, label]) => [label, (Array.isArray(r[k]) ? r[k] : []).filter(x => x && x.uri).map(jamMuItem)]).filter(g => g[1].length);
        P.res = {status: "ok", groups};
      }, e => { if (n === P.seq) P.res = {status: "error", error: jamMuErr(e)}; })
      .then(() => { if (n === P.seq && sheet.isOpen() && P.view === "lib" && P.tab === "search") fill(false); });
  };
  const searchBar = () => {
    if (sbar) return sbar;
    sbar = el("div", "sbar"); input = el("input"); input.type = "search"; input.placeholder = "Playlists, albums, artists, tracks";
    input.setAttribute("aria-label", "Search the music library"); input.setAttribute("enterkeyhint", "search"); input.autocomplete = "off";
    input.onkeydown = e => { if (e.key === "Enter") { e.preventDefault(); search(); } };
    const go = cutKey("Search", "jam-music|search", "on", "chip"); go.dataset.key = "search"; go.onclick = search;
    sbar.append(input, go);
    return sbar;
  };
  /* Fills the body for the current view / tab (keeps the scroll position on refills). */
  function fill(top) {
    const s = stateObj(H(), c.entity), scroll = top ? 0 : body.scrollTop;
    body.textContent = "";
    if (P.view === "spk") {
      const pane = card._speakersPane(s, card._stamp || new Set()); pane.classList.add("spks"); body.append(pane);
    } else if (P.tab === "search") {
      body.append(searchBar());
      const res = el("div", "res"), r = P.res;
      if (!r) res.append(msg("Search", "Find playlists, albums, artists, tracks and radio in Music Assistant."));
      else if (r.status === "short") res.append(msg("Search", "Type at least two letters."));
      else if (r.status === "loading") res.append(msg("Searching…", ""));
      else if (r.status === "error") res.append(msg("Search failed", r.error, search));
      else if (!r.groups.length) res.append(msg("No results", `Nothing found for "${P.q}".`));
      else for (const [label, items] of r.groups) { res.append(el("div", "grp", label)); res.append(...items.map(row)); }
      body.append(res);
    } else {
      const tab = P.tab;
      if (tab === "pinned") {
        if (!JAM_MU.pins) { load(tab); body.append(msg("Loading…", "")); }
        else body.append(...list(jamMuPinned(c), JAM_MU_EMPTY.pinned));
      } else {
        load(tab);
        const d = P.data[tab];
        if (!d || d.status === "loading") body.append(msg("Loading…", ""));
        else if (d.status === "error") body.append(msg("Couldn't load the library", d.error, () => { load(tab, true); fill(false); }));
        else body.append(...list(d.items, JAM_MU_EMPTY[tab]));
      }
    }
    body.scrollTop = scroll;
  }
  const api = {
    update() { if (!sheet.isOpen()) return; hdr(); dockFill(); if (P.view === "spk") fill(false); },
    close(o) { sheet.close(o); },
    isOpen: () => sheet.isOpen(),
    get tab() { return P.view === "spk" ? "speakers" : P.tab; },
  };
  // Open on Pinned when there is something pinned (config pins count at once), else Recent; the user pins and the names of
  // bare-uri config pins load meanwhile.
  P.tab = jamMuCfgPins(c).length || (JAM_MU.pins && JAM_MU.pins.some(x => !x.hidden)) ? "pinned" : "recent";
  const refillPinned = () => { if (sheet.isOpen() && P.view === "lib" && P.tab === "pinned") fill(false); };
  jamMuPinsLoad(H()).then(refillPinned);
  const rp = jamMuResolvePins(H(), c);
  if (rp) rp.then(refillPinned);
  hdr(); tabs(); dockFill(); fill(true);
  return api;
}
