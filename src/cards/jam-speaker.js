/* ---------- jam-speaker: Music Assistant speaker (round 3, 2026-10-30): TV-style poster card, panel B, kiosk K1 ----------
   Music Assistant from the HA frontend (checked read-only on the user's HA 2026-10-30; details in jam-music-panel.js):
   - Favourite = button.press on the player's MA button "Favorite current song" (same device, translation_key
     favorite_now_playing; e.g. button.oneplus_speaker_favorite_current_song_2 for media_player.oneplus_speaker_2,
     button.kitchen_favorite_current_song, button.phoster_favorite_current_song). Add only (no un-favourite). Lit when
     music_assistant.get_queue says current_item.media_item.favorite (MA-queue playback only) or after a press.
   - Shuffle = media_player.shuffle_set {shuffle: !attributes.shuffle} (SHUFFLE_SET 32768).
   - Library / search / recent / play = music_assistant.get_library / search (response actions over
     hass.callWS({type: "call_service", ..., return_response: true}), config_entry_id found automatically) and
     music_assistant.play_media {entity_id, media_id: uri, media_type}.
   - Power: the MA players report no TURN_ON / TURN_OFF (supported_features 8322623 / 8320575), so the corner falls back
     to media_stop (while playing / paused) / media_play (idle); a player with TURN_ON / TURN_OFF gets media_player.toggle.
   {type: custom:jam-speaker, entity (media_player, a Music Assistant player), name? (room name; default the player's
    friendly name), accent? (default violet = music), speakers?: [media_player id | {entity, name?}] (grouping view: the
    panel's Speakers key; the kiosk's Speakers key), pinned?: [MA uri | {uri, name?, image?, media_type?}] (panel Pinned
    tab + kiosk shelf, before the user's own pins), show_shuffle? (true), show_favorite? (true), favorite_entity? (button id;
    default found in the entity registry; false = no Favourite key), config_entry_id? (MA config entry; default found),
    power_action? (Lovelace action for the power corner), poster_height? (px of art above the band, default 150, min 72),
    size? ("kiosk")}
   Card (mockup round 3 "Take 3"): poster (poster cut) = an art area (poster_height, default 150px: the hero, also on a
   phone) with the ink band under it: the artwork (entity_picture_local / entity_picture), or the accent
   with Golden Arm bars while playing without art, or — idle — a cut-paper abstract (jam-music-panel jamMuIdleArt, seeded
   by entity + last_changed: a new arrangement each time the player goes idle, stable until then; no motion); offline =
   slab2 + dim bars. Ink title band: kicker = source dot (Spotify green / MA violet / Grouped teal / Idle, Paused dim /
   Offline red / else the accent) + "Room · source", title (media_title; idle: the room), artist (idle: "Last played:
   title · artist"), and at its right two 32px keys: Shuffle (accent when on) and Favourite (pink when on). 5px progress
   strip (accent) at the poster foot while playing with a duration (position at render time). Power corner: 46px top-right
   triangle, ink with an accent power glyph (red when the player is off). Tap anywhere else on the poster (art or band) =
   panel B. Under it: Prev / big Play-Pause (accent) / Next (60px glyph keys), then − / volume bar / + / number (44px).
   Panel B (jam-music-panel jamMusicPanel, openSheet): mini header, tabs Pinned / Recent / Playlists / Albums / Search,
   rows with Play + pin corner tab, docked player bar; the Speakers key (with `speakers`) swaps the list for the grouping
   view: "This room" + one row per speaker: name, Join / Playing toggle (GROUPING players only; Join = media_player.join on
   this entity with group_members [it], Playing = media_player.unjoin on it), thin volume bar; a new join stamps once.
   size: "kiosk" = K1 (for jam-kiosk fullscreen sheets; fills its parent's height, 420px without one): the art flush left
   (58 %; tap = panel B, opened fullscreen), the right panel filled with the art's dominant colour (jamMuArtColor on a
   24px canvas; violet without art / on a tainted canvas; text ink or paper, a mid-tone is nudged until it reads 4.5:1):
   kicker + Shuffle / Favourite (48px), huge title (2-3 lines by height), artist · album, progress line with times
   (refreshed every 5 s only while shown inside a sheet and playing), Prev / Play / Next, volume − / bar (+ number) / + and
   the Speakers key (with `speakers`: the grouping view over the top area, "Now playing" goes back); bottom shelf (ink):
   label + 5 covers (pinned, then recent; tap = play) + "Browse" (panel B). Nothing under 18px; no continuous animation. */
const JAM_SPK_ACTIVE = new Set(["playing", "paused", "buffering"]);
const JAM_SPK_SHUFFLE = 32768, JAM_SPK_POWER = 128 | 256;
const JAM_SPK_CSS = `
    .wrap{display:grid;gap:10px;align-content:start;--p-t:12px;--p-r:12px;--p-b:14px;--p-l:12px}
    .poster,.poster > .face{height:auto}
    .poster > .face{padding:0;position:relative;overflow:hidden;background:var(--acc);color:#ece2c9;display:grid;grid-template-rows:var(--ah,150px) auto}
    .poster.off > .face{background:var(--slab2)}
    .pa{position:relative;overflow:hidden;min-height:0}
    .poster img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;display:block}
    .poster .arm{position:absolute;left:16px;top:0;height:52%;gap:8px;align-items:flex-start}
    .poster .arm span{background:var(--acc-fg)}
    .poster.off .arm span{background:var(--slab3)}
    .open{position:absolute;inset:0;z-index:1;cursor:pointer}
    .open:focus-visible{outline-offset:-4px}
    .band{position:relative;z-index:2;background:var(--ink);color:#ece2c9;padding:10px 12px 12px 14px;display:grid;
      grid-template-columns:minmax(0,1fr) auto;align-items:end;column-gap:10px;pointer-events:none}
    .bt{display:grid;gap:3px;min-width:0}
    .kk{display:flex;gap:8px;align-items:center;min-width:0;font:600 11px/1.15 var(--body);letter-spacing:.14em;text-transform:uppercase;color:#9a8f7c}
    .kk i{flex:none;width:10px;height:10px;background:var(--b,#9a8f7c)}
    .kk span{min-width:0;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;overflow-wrap:normal}
    .band .title{font-family:var(--display);font-weight:900;font-size:30px;line-height:.95;text-transform:uppercase;letter-spacing:-.005em;overflow-wrap:anywhere}
    .band .title > .tl{display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}
    .band .ss{font:500 14px/1.2 var(--body);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
    .poster.small .band{padding:6px 10px 8px 12px} .poster.small .band .title{font-size:24px} .poster.small .band .title > .tl{-webkit-line-clamp:1}
    .bk{display:flex;gap:6px;pointer-events:auto}
    .bk .ikey{min-width:0;width:32px;height:32px}
    .bk .ikey > .face{height:32px;--ic:16px;background:#36312b;color:#ece2c9}
    .bk .shuf.on > .face{background:var(--acc);color:var(--acc-fg)}
    .bk .fav > .face{color:var(--pink)} .bk .fav.on > .face{background:var(--pink);color:#141210}
    .bk .ikey:disabled > .face{color:#6b6152}
    .pg{position:absolute;left:0;bottom:0;height:5px;z-index:3;background:var(--acc);pointer-events:none}
    .pw{z-index:4} /* shared power corner (core powerCorner / POWER_CSS): ink, accent glyph; red with a cream glyph when off */
    .keys{display:grid;grid-template-columns:1fr 1.5fr 1fr;gap:8px}
    .keys .ikey{min-width:0}
    .keys .ikey > .face{height:60px;--ic:24px}
    .ikey.main > .face{background:var(--acc);color:var(--acc-fg)}
    .ikey.main:disabled > .face{background:var(--slab2);color:var(--dim)}
    .vol{display:grid;grid-template-columns:48px minmax(0,1fr) 48px 48px;gap:6px;align-items:center}
    .vol .key{min-width:0}
    .vol .key > .face{height:44px;display:grid;place-items:center;padding:0;font:900 22px/1 var(--display)}
    .vol .vt{height:44px} .vol .vt .strip{inset:0}
    .vol .v{font:900 24px/1 var(--display);text-align:center}
    .spk .tog > .face{min-height:32px}`;
/* size: "kiosk" = K1. The face is a size container (the grid inside sizes the shelf by its height); the right panel is one
   too (title size / lines). */
const JAM_SPK_KIOSK_CSS = `
    :host{height:100%;min-height:420px}
    .kiosk{height:100%}
    .kiosk > .face.k1{padding:0;overflow:hidden;container-type:size}
    .kg{height:100%;display:grid;grid-template-columns:58% minmax(0,1fr);grid-template-rows:minmax(0,1fr) clamp(88px,20cqh,150px)}
    .kart{grid-area:1/1/2/2;position:relative;overflow:hidden;background:var(--acc);min-height:0}
    .kart.off{background:var(--slab2)}
    .kart img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;display:block}
    .kart .arm{position:absolute;left:14%;right:14%;bottom:0;height:70%;gap:6%;align-items:flex-end;justify-content:center}
    .kart .arm span{background:var(--acc-fg);flex:1 1 0;max-width:none}
    .kart.off .arm span{background:var(--dim)}
    .side{grid-area:1/2/2/3;min-width:0;min-height:0;container-type:size;background:var(--kbg);color:var(--kfg);padding:clamp(12px,3.5cqh,22px) 24px clamp(12px,3cqh,16px);
      display:grid;grid-template-rows:auto minmax(0,1fr) auto;gap:10px}
    .khead{display:flex;align-items:flex-start;justify-content:space-between;gap:12px;min-width:0}
    .khead .kk{font-size:18px;letter-spacing:.12em;color:var(--kfg);padding-top:12px;gap:10px}
    .khead .kk i{width:14px;height:14px;outline:2px solid var(--kfg)}
    .kbk{display:flex;gap:8px;flex:none}
    .kbk .ikey{min-width:0}
    .kbk .ikey > .face{width:48px;height:48px;--ic:24px;background:none;color:var(--kfg);border:3px solid var(--kfg)}
    .kbk .shuf.on > .face{background:var(--kfg);color:var(--kbg)}
    .kbk .fav.on > .face{background:var(--pink);color:#141210;border-color:var(--pink)}
    .kbk .ikey:disabled > .face{border-style:dashed}
    .ktx{min-height:0;overflow:hidden;display:grid;align-content:start;gap:8px}
    .ktx .title{--tl:3;font-family:var(--display);font-weight:900;text-transform:uppercase;letter-spacing:-.005em;line-height:.92;overflow-wrap:anywhere;
      font-size:clamp(36px,14cqh,76px)}
    .ktx .title > .tl{display:-webkit-box;-webkit-line-clamp:var(--tl);-webkit-box-orient:vertical;overflow:hidden}
    .ktx .artist{font:500 clamp(18px,5.5cqh,24px)/1.2 var(--body);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
    .kb{display:grid;gap:10px}
    .kprog{display:grid;grid-template-columns:auto minmax(0,1fr) auto;gap:12px;align-items:center;font:600 18px/1 var(--body);letter-spacing:.04em}
    .kprog .bar{position:relative;height:6px;background:var(--ktr)}
    .kprog .bar i{position:absolute;inset:0 auto 0 0;background:var(--kfg)}
    .kt{display:grid;grid-template-columns:1fr 1.4fr 1fr;gap:8px}
    .kt .ikey{min-width:0}
    .kt .ikey > .face{height:clamp(52px,17cqh,72px);--ic:28px;background:var(--kfg);color:var(--kbg)}
    .kt .ikey.main > .face{background:var(--kfg);color:var(--kbg)}
    .kt .ikey:disabled > .face{background:var(--ktr);color:var(--kbg)}
    .kv{display:grid;grid-template-columns:56px minmax(0,1fr) 56px;gap:6px;align-items:center}
    .kv.sp{grid-template-columns:56px minmax(0,1fr) 56px 56px}
    .kv .key{min-width:0}
    .kv .key > .face{height:clamp(48px,15cqh,56px);display:grid;place-items:center;padding:0;font:900 26px/1 var(--display);background:var(--kfg);color:var(--kbg)}
    .kv .key:disabled > .face{background:var(--ktr)}
    .kv .ikey > .face{--ic:24px}
    .kv .vt{height:clamp(48px,15cqh,56px)} .kv .vt .strip{inset:0;background:var(--ktr)} .kv .vt .fill{background:var(--kfg)}
    .kv .vn{position:absolute;right:10px;top:50%;transform:translateY(-50%);font:900 22px/1 var(--display);color:var(--kfg);pointer-events:none}
    .kv .vn.hi{color:var(--kbg)}
    .shelf{grid-area:2/1/3/3;display:grid;grid-template-columns:auto repeat(6,minmax(0,1fr));background:var(--ink);min-height:0;color:#ece2c9}
    .shelf .lb{writing-mode:vertical-rl;transform:rotate(180deg);font:600 18px/1 var(--body);letter-spacing:.1em;text-transform:uppercase;color:#9a8f7c;
      display:grid;place-items:center;padding:0 10px;white-space:nowrap;overflow:hidden}
    .shelf .none{grid-column:2/7;align-self:center;padding:0 16px;font:500 18px/1.3 var(--body);color:#9a8f7c}
    .tile{position:relative;overflow:hidden;min-width:0;border-left:4px solid var(--ink);background:#2c2824;color:#ece2c9;cursor:pointer}
    .tile > .thumb{position:absolute;inset:0;width:auto;height:auto}
    .tile .nm{position:absolute;left:6px;bottom:6px;max-width:calc(100% - 12px);background:var(--ink);color:#ece2c9;font:900 18px/1 var(--display);
      text-transform:uppercase;padding:4px 6px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
    .tile.browse{background:#36312b}
    .tile.browse > .ico{position:absolute;left:50%;top:38%;transform:translate(-50%,-50%);--ic:40px}
    .tile:focus-visible{outline-offset:-4px}
    .kart .open:focus-visible{outline-offset:-4px}
    .kspk{grid-area:1/1/2/3;min-height:0;display:grid;grid-template-rows:auto minmax(0,1fr);gap:8px;padding:16px 24px 12px;background:var(--slab);overflow:hidden}
    .kspk .kh{display:flex;justify-content:space-between;align-items:center;gap:12px}
    .kspk .kh b{font:900 36px/1 var(--display);text-transform:uppercase}
    .kspk .kh .key > .face{display:flex;align-items:center;height:56px;--p-t:0;--p-b:0;--p-l:20px;--p-r:22px;font-size:18px;letter-spacing:.12em}
    .klist{display:grid;gap:0;align-content:start;overflow:auto;min-height:0}
    .klist .spk{grid-template-columns:minmax(0,1.25fr) minmax(0,1fr) minmax(120px,auto);gap:16px;min-height:72px;padding:8px 0}
    .klist .spk:first-child{border-top:0}
    .klist .spk .n{font-size:30px;line-height:.95;white-space:normal;overflow-wrap:anywhere;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical}
    .klist .spk .vt.thin{height:44px} .klist .spk .vt.thin .strip{inset:8px 0}
    .klist .spk .n{grid-row:1;grid-column:1} .klist .spk .vt{grid-column:2;grid-row:1} .klist .spk > :nth-child(2){grid-column:3;grid-row:1}
    .klist .spk .tog > .face{--p-t:0;--p-b:0;--p-l:14px;--p-r:16px;min-height:56px;display:flex;align-items:center;justify-content:center;font-size:18px}
    .klist .spk .here{font-size:18px;text-align:center}
    @container (max-height:420px){ .ktx .title{--tl:2} .side{gap:8px} .kb{gap:8px} }
    @container (max-height:360px){ .ktx .title{font-size:36px} .ktx{gap:4px} .khead .kk{padding-top:4px} .kbk .ikey > .face{width:44px;height:44px} }
    /* (.side's own query container is the card face: an Echo Show sheet is about 446px tall) */
    @container (max-height:480px){ .side{padding:12px 20px 10px} }
    /* Not a kiosk sheet (narrower than 600px): the art steps aside, the panel takes the width. */
    @container (max-width:600px){ .kart{display:none} .side{grid-column:1/3} }`;
class JamSpeaker extends JamBase {
  validate(c) {
    if (!c.entity || !String(c.entity).startsWith("media_player.")) throw new Error("jam-speaker: entity must be a media_player");
    if (c.speakers !== undefined && !Array.isArray(c.speakers)) throw new Error("jam-speaker: speakers must be a list of media_player ids");
    if (c.pinned !== undefined && !Array.isArray(c.pinned)) throw new Error("jam-speaker: pinned must be a list of Music Assistant uris");
    if (c.size !== undefined && !["kiosk", "normal"].includes(c.size)) throw new Error("jam-speaker: size is kiosk or normal");
  }
  setConfig(c) {
    if (this._panel) this._panel.close({silent: true});
    this._tab = null; this._joined = null; this._fav = null; this._recent = null; this._recentAt = 0; this._namesAt = 0;
    super.setConfig(c.accent ? c : {...c, accent: "music"});
  }
  connectedCallback() {
    super.connectedCallback();
    if (!this._hass || !this._config) return;
    this._favFetch(stateObj(this._hass, this._config.entity));
    if (this._kiosk && this._kroot) { this._refillShelf(); this._tick(); }
  }
  disconnectedCallback() {
    super.disconnectedCallback();
    if (this._panel) this._panel.close({silent: true});
    clearTimeout(this._tk); this._tk = null;
  }
  get _kiosk() { return !!this._config && this._config.size === "kiosk"; }
  get _speakers() {
    return (this._config.speakers || []).map(x => (typeof x === "string" ? {entity: x} : x)).filter(x => x && x.entity && x.entity !== this._config.entity);
  }
  watched() { return [this._config.entity, ...this._speakers.map(x => x.entity), this._favId()].filter(Boolean); }
  css() { return POWER_CSS + JAM_MU_BASE_CSS + JAM_MU_ROWS_CSS + JAM_SPK_CSS + (this._kiosk ? JAM_SPK_KIOSK_CSS : ""); }
  _room() { const c = this._config; return c.name || friendly(this._hass, c.entity); }
  _artSrc(s) { const a = (s && s.attributes) || {}; return jamMuUrl(this._hass, a.entity_picture_local || a.entity_picture); }
  /* The player's MA "Favorite current song" button: config favorite_entity, else the button on the player's device
     (entity registry), else button.<object_id>_favorite_current_song. Cached until hass.entities changes. */
  _favId() {
    const c = this._config, h = this._hass;
    if (c.favorite_entity !== undefined) return c.favorite_entity || null;
    const ents = h && h.entities;
    if (!this._fav || this._fav.ents !== ents) { // scan the registry once per registry change (hass.entities is replaced then)
      let id = null;
      const me = ents && ents[c.entity];
      if (me && me.device_id) for (const k in ents) {
        const e = ents[k];
        if (k.startsWith("button.") && e && e.device_id === me.device_id && (e.translation_key === "favorite_now_playing" || /favou?rite/.test(k))) { id = k; break; }
      }
      this._fav = {ents, id, guess: "button." + c.entity.slice(13) + "_favorite_current_song"};
    }
    if (this._fav.id) return this._fav.id;
    return h && h.states && h.states[this._fav.guess] ? this._fav.guess : null;
  }
  /* Source word + dot colour: Offline / Grouped / Idle / Paused / Spotify Connect / Music Assistant / the source. */
  _badge(s) {
    const id = this._config.entity, a = (s && s.attributes) || {};
    if (!s || UNAVAILABLE.has(s.state)) return ["Offline", "var(--red)"];
    if (s.state === "off" || s.state === "standby") return ["Off", "var(--dim)"];
    const gm = a.group_members || [];
    const member = (gm.length > 1 && gm[0] !== id) || this._speakers.some(x => {
      const o = stateObj(this._hass, x.entity), m = (o && o.attributes.group_members) || [];
      return m.length > 1 && m[0] === x.entity && m.includes(id);
    });
    if (member) return ["Grouped", "var(--teal)"];
    if (!JAM_SPK_ACTIVE.has(s.state)) return ["Idle", "var(--dim)"];
    if (s.state === "paused") return ["Paused", "var(--dim)"];
    const src = String(a.source || ""), app = String(a.app_id || "").toLowerCase();
    if (/spotify/i.test(src) || app.includes("spotify")) return ["Spotify Connect", "var(--jam-spotify,#1db954)"];
    if (/music assistant/i.test(src) || app.includes("music_assistant")) return ["Music Assistant", "var(--violet)"];
    return [src || fmtState(this._hass, s), "var(--acc)"];
  }
  _kicker(s, short) {
    let [word, col] = this._badge(s);
    if (short && word === "Spotify Connect") word = "Spotify";
    const k = el("div", "kk"), i = el("i");
    i.setAttribute("aria-hidden", "true"); k.style.setProperty("--b", col); k.dataset.badge = word;
    k.append(i, el("span", "", `${this._room()} · ${word}`));
    return k;
  }
  /* Art layer: playing = the artwork (broken -> accent + bars) or accent + Golden Arm bars; idle = cut-paper abstract
     (seeded by entity + last_changed); offline = bars on slab2 (the parent's .off class). */
  _art(s, off, idle, host, onImg) {
    const c = this._config, src = !idle && this._artSrc(s);
    const bars = () => { host.classList.add("bars"); return armBars("jam-speaker|" + c.entity); };
    if (off) return bars();
    if (idle) return jamMuIdleArt(seed(c.entity + "|" + ((s && s.last_changed) || "")));
    if (!src) return bars();
    const img = el("img"); img.alt = ""; img.decoding = "async";
    img.onerror = () => { img.replaceWith(bars()); };
    if (onImg) img.onload = () => onImg(img, src);
    img.src = src;
    return img;
  }
  /* Track identity for the favourite memory. */
  _trackKey(s) { const a = (s && s.attributes) || {}; return a.media_content_id || (a.media_title ? a.media_title + "|" + (a.media_artist || "") : null); }
  _favKey(s, off, cls) {
    const id = this._favId();
    if (!id || this._config.show_favorite === false) return null;
    const b = stateObj(this._hass, id), idle = off || !JAM_SPK_ACTIVE.has(s.state), k = this._trackKey(s), on = !idle && !!k && JAM_MU.fav.get(k) === true;
    const key = jamMuKey(on ? "heart" : "heartOff", "Favourite", "favorite", "fav" + (on ? " on" : "") + (cls ? " " + cls : ""),
      () => this._favPress(), idle || !b || b.state === "unavailable"); // a button's state is "unknown" until its first press
    key.setAttribute("aria-pressed", String(on));
    return key;
  }
  _favPress() {
    const id = this._favId(), s = stateObj(this._hass, this._config.entity), k = this._trackKey(s);
    if (!id) return;
    this._hass.callService("button", "press", {entity_id: id});
    if (k) { jamMuFavSet(k, true); this._render(false); }
  }
  /* MA-queue playback: ask get_queue once per track whether it is a favourite (lights the key). */
  _favFetch(s) {
    const a = (s && s.attributes) || {}, k = this._trackKey(s), h = this._hass, id = this._config.entity;
    if (!this.isConnected || !k || !s || !JAM_SPK_ACTIVE.has(s.state) || JAM_MU.fav.has(k) || JAM_MU.favLoad.has(k) || !this._favId()) return;
    if (!(a.app_id === "music_assistant" || /music assistant/i.test(String(a.source || ""))) || !h || typeof h.callWS !== "function") return;
    JAM_MU.favLoad.add(k);
    jamMuCall(h, "get_queue", {}, {entity_id: id}).then(r => {
      const q = r && r[id], mi = q && q.current_item && q.current_item.media_item;
      const same = mi && (!a.media_title || String(mi.name || "").toLowerCase() === String(a.media_title).toLowerCase());
      jamMuFavSet(k, !!(same && mi.favorite === true));
    }, () => { jamMuFavSet(k, false); }).then(() => {
      JAM_MU.favLoad.delete(k);
      if (JAM_MU.fav.get(k) && this.isConnected && this._trackKey(stateObj(this._hass, id)) === k) this._render(false);
    });
  }
  _shuffleKey(s, off) {
    const a = (s && s.attributes) || {};
    if (this._config.show_shuffle === false || ((Number(a.supported_features) || 0) & JAM_SPK_SHUFFLE) === 0) return null;
    const on = a.shuffle === true;
    const k = jamMuKey("shuffle", "Shuffle", "shuffle", "shuf" + (on ? " on" : ""),
      () => this._hass.callService("media_player", "shuffle_set", {entity_id: this._config.entity, shuffle: !on}), off);
    k.setAttribute("aria-pressed", String(on));
    return k;
  }
  /* Prev / Play-Pause / Next glyph keys (card, kiosk, panel dock). */
  _transportKeys(s, off) {
    const id = this._config.entity, call = svc => () => this._hass.callService("media_player", svc, {entity_id: id});
    const playing = !!s && s.state === "playing";
    return [
      jamMuKey("prev", "Previous track", "prev", "", call("media_previous_track"), off),
      jamMuKey(playing ? "pause" : "play", playing ? "Pause" : "Play", "play_pause", "main", call("media_play_pause"), off),
      jamMuKey("next", "Next track", "next", "", call("media_next_track"), off),
    ];
  }
  _power(s) {
    const c = this._config, h = this._hass, f = Number(s && s.attributes.supported_features) || 0;
    if (c.power_action) { runAction(this, h, c.power_action, c.entity); return; }
    if (f & JAM_SPK_POWER) h.callService("media_player", "toggle", {entity_id: c.entity});
    else h.callService("media_player", s && JAM_SPK_ACTIVE.has(s.state) ? "media_stop" : "media_play", {entity_id: c.entity});
  }
  _powerKey(s, off) {
    const down = !s || ["off", "standby"].includes(s.state), f = Number(s && s.attributes.supported_features) || 0;
    const pw = powerCorner({on: !down, disabled: off && !!s && UNAVAILABLE.has(s.state), cls: down ? "off" : "",
      bg: down ? "var(--red)" : "var(--ink)", fg: down ? "var(--on-fg)" : "var(--acc)",
      onClick: () => this._power(stateObj(this._hass, this._config.entity))});
    // The speaker says what the corner does (players without turn_on / turn_off stop / play instead).
    pw.setAttribute("aria-label", this._config.power_action || f & JAM_SPK_POWER ? (down ? "Turn on" : "Turn off")
      : s && JAM_SPK_ACTIVE.has(s.state) ? "Turn off (stop playing)" : "Turn on (play)");
    return pw;
  }
  _key(label, id, cls, run, disabled) {
    const k = cutKey(label, `jam-speaker|${this._config.entity}|${id}`, cls, "chip");
    k.dataset.key = id; k.disabled = !!disabled; if (run) k.onclick = run;
    return k;
  }
  _play(it) {
    const d = {entity_id: this._config.entity, media_id: it.uri};
    if (JAM_MU_PLAYABLE.has(it.media_type)) d.media_type = it.media_type;
    this._hass.callService("music_assistant", "play_media", d);
  }
  _openPanel() {
    if (this._panel && this._panel.isOpen()) return;
    this._panel = jamMusicPanel(this);
  }
  /* Volume track for one player. thin = the Speakers rows. Drag previews, release sends volume_set. Returns {track, cur, set}. */
  _track(id, s, thin, onShow) {
    const off = !s || UNAVAILABLE.has(s.state);
    const track = el("div", "vt hit" + (thin ? " thin" : "")), strip = el("div", "strip"), fill = el("div", "fill");
    strip.append(fill); track.append(strip); track.dataset.entity = id;
    let cur = Math.round((Number(s && s.attributes.volume_level) || 0) * 100);
    const show = v => { cur = Math.max(0, Math.min(100, Math.round(v))); fill.style.width = cur + "%"; track.setAttribute("aria-valuenow", cur); if (onShow) onShow(cur); };
    fill.style.width = (off ? 0 : cur) + "%";
    if (off) return {track, cur: () => cur, set: () => {}};
    const send = () => this._hass.callService("media_player", "volume_set", {entity_id: id, volume_level: cur / 100});
    track.tabIndex = 0; track.setAttribute("role", "slider"); track.setAttribute("aria-label", friendly(this._hass, id) + " volume");
    track.setAttribute("aria-valuemin", 0); track.setAttribute("aria-valuemax", 100); track.setAttribute("aria-valuenow", cur);
    const at = e => { const r = track.getBoundingClientRect(); return Math.max(0, Math.min(1, (e.clientX - r.left) / r.width)) * 100; };
    track.onpointerdown = e => { try { track.setPointerCapture(e.pointerId); } catch (err) { /* synthetic pointer */ } show(at(e)); track.dataset.drag = "1"; };
    track.onpointermove = e => { if (track.dataset.drag) show(at(e)); };
    track.onpointerup = e => { if (!track.dataset.drag) return; delete track.dataset.drag; show(at(e)); send(); };
    track.onpointercancel = () => { delete track.dataset.drag; };
    track.onkeydown = e => {
      const k = {ArrowRight: 1, ArrowUp: 1, ArrowLeft: -1, ArrowDown: -1}[e.key];
      if (!k) return; e.preventDefault(); show(cur + k * 5); send();
    };
    return {track, cur: () => cur, set: v => { show(v); send(); }};
  }
  _volRow(s, off, kiosk) {
    const c = this._config, row = el("div", kiosk ? "kv" : "vol");
    const val = el("div", (kiosk ? "vn" : "v") + " num", off ? "—" : "");
    const t = this._track(c.entity, s, false, v => { val.textContent = String(v); if (kiosk) val.classList.toggle("hi", v >= 75); });
    if (!off) { val.textContent = String(t.cur()); if (kiosk) val.classList.toggle("hi", t.cur() >= 75); }
    const dn = this._key("−", "vol_down", "", () => t.set(t.cur() - 5), off), up = this._key("+", "vol_up", "", () => t.set(t.cur() + 5), off);
    dn.setAttribute("aria-label", "Volume down"); up.setAttribute("aria-label", "Volume up");
    if (kiosk) { t.track.append(val); row.append(dn, t.track, up); } else row.append(dn, t.track, up, val);
    return row;
  }
  _speakersPane(s, stampIds) {
    const c = this._config, h = this._hass, pane = el("div", "pane spks");
    const meOk = !!s && !UNAVAILABLE.has(s.state) && jamCanGroup(s);
    const here = el("div", "spk"); here.dataset.entity = c.entity;
    here.append(el("div", "n", "This room"), el("span", "here", this._room()), this._track(c.entity, s, true).track);
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
  /* Position / duration strings + fraction, or null (no duration). Position extrapolated while playing (at render time). */
  _kPos(s) {
    const a = (s && s.attributes) || {}, dur = Number(a.media_duration);
    if (!(dur > 0) || a.media_position == null) return null;
    let pos = Number(a.media_position) || 0;
    const at = Date.parse(a.media_position_updated_at || "");
    if (s.state === "playing" && at) pos += (Date.now() - at) / 1000;
    pos = Math.min(Math.max(0, pos), dur);
    const long = dur >= 3600;
    return {pos: jamMuTime(pos, long), dur: jamMuTime(dur, long), frac: pos / dur};
  }
  render(b) {
    const c = this._config, h = this._hass, s = stateObj(h, c.entity);
    const off = !s || UNAVAILABLE.has(s.state), idle = off || !JAM_SPK_ACTIVE.has(s.state);
    // Stamp a speaker that just joined (not on the first render or a view switch).
    const spk = this._speakers, joined = new Set(spk.map(x => x.entity).filter(id => this._isJoined(id))), stamp = new Set();
    if (this._joined && motionOn()) for (const id of joined) if (!this._joined.has(id)) stamp.add(id);
    this._joined = joined; this._stamp = stamp;
    this._favFetch(s);
    if (this._panel) this._panel.update();
    if (this._kiosk) { this._k1(b, s, off, idle, stamp); return; }
    const {root, face} = this.paper(c.entity, {face: "wrap"});
    root.dataset.mode = off ? "off" : idle ? "idle" : s.state;
    face.append(this._poster(s, off, idle));
    const keys = el("div", "keys"); keys.append(...this._transportKeys(s, off));
    face.append(keys, this._volRow(s, off, false));
    b.append(root);
  }
  _poster(s, off, idle) {
    const c = this._config, a = (s && s.attributes) || {};
    const {root, face} = paper("div", "jam-speaker|poster|" + c.entity, {kind: "poster", cls: "poster" + (off ? " off" : idle ? " idle" : "")});
    const ah = Math.max(72, Number(c.poster_height) || 150);
    if (c.poster_height) root.style.setProperty("--ah", ah + "px");
    if (ah < 110) root.classList.add("small");
    const pa = el("div", "pa"); pa.append(this._art(s, off, idle, root));
    face.append(pa);
    const open = el("button", "open"); open.type = "button"; open.dataset.key = "more";
    open.setAttribute("aria-label", `${this._room()} music: library and speakers`);
    open.onclick = () => this._openPanel();
    face.append(open);
    const band = el("div", "band"), bt = el("div", "bt"), room = this._room();
    const title = !idle && a.media_title ? a.media_title : room;
    const sub = off ? null : !idle ? (a.media_title ? a.media_artist : null) : a.media_title ? `Last played: ${a.media_title}${a.media_artist ? " · " + a.media_artist : ""}` : null;
    bt.append(this._kicker(s), clampTitle(title));
    if (sub) bt.append(el("div", "ss", sub));
    const bk = el("div", "bk"), sh = this._shuffleKey(s, off), fv = this._favKey(s, off);
    if (sh) bk.append(sh);
    if (fv) bk.append(fv);
    band.append(bt, bk);
    face.append(band);
    const p = s && s.state === "playing" ? this._kPos(s) : null;
    if (p) { const pg = el("div", "pg"); pg.setAttribute("aria-hidden", "true"); pg.style.width = (p.frac * 100).toFixed(1) + "%"; face.append(pg); }
    face.append(this._powerKey(s, off));
    return root;
  }
  /* ---- size: "kiosk" = K1 ---- */
  _kpaint(root, col) {
    root.style.setProperty("--kbg", col.bg); root.style.setProperty("--kfg", col.fg); root.style.setProperty("--ktr", col.track);
    root.dataset.ink = col.ink ? "1" : "0";
  }
  _k1(b, s, off, idle, stamp) {
    const c = this._config, spk = this._speakers;
    const view = spk.length && this._tab === "speakers" ? "speakers" : "now";
    const {root, face} = this.paper(c.entity, {face: "k1"});
    root.classList.add("kiosk");
    root.dataset.mode = off ? "off" : idle ? "idle" : s.state; root.dataset.tab = view;
    this._kroot = root;
    const src = !idle && this._artSrc(s);
    if (!src) this._kcol = null;
    else if (JAM_MU.art.has(src)) this._kcol = JAM_MU.art.get(src); // null = tainted / empty art: violet
    this._kpaint(root, this._kcol || jamMuReadable(JAM_MU_VIOLET));
    const g = el("div", "kg");
    face.append(g);
    if (view === "speakers") {
      const box = el("div", "kspk"), kh = el("div", "kh"), back = this._key("Now playing", "now", "", () => { this._tab = null; this._render(false); });
      kh.append(el("b", "", "Speakers"), back);
      const pane = this._speakersPane(s, stamp); pane.classList.add("klist");
      box.append(kh, pane);
      g.append(box);
    } else {
      const art = el("div", "kart" + (off ? " off" : idle ? " idle" : ""));
      art.append(this._art(s, off, idle, art, (img, key) => {
        const col = JAM_MU.art.has(key) ? JAM_MU.art.get(key) : jamMuArtColor(img, key);
        this._kcol = col;
        if (this._kroot === root) this._kpaint(root, col || jamMuReadable(JAM_MU_VIOLET));
      }));
      const open = el("button", "open"); open.type = "button"; open.dataset.key = "more";
      open.setAttribute("aria-label", `${this._room()} music: library`); open.onclick = () => this._openPanel();
      art.append(open);
      g.append(art, this._kSide(s, off, idle));
    }
    g.append(this._shelf());
    b.append(root);
    this._tick();
  }
  _kSide(s, off, idle) {
    const a = (s && s.attributes) || {}, side = el("div", "side");
    const head = el("div", "khead"), bk = el("div", "kbk"), sh = this._shuffleKey(s, off), fv = this._favKey(s, off);
    if (sh) bk.append(sh);
    if (fv) bk.append(fv);
    head.append(this._kicker(s, true), bk);
    const tx = el("div", "ktx"), room = this._room();
    tx.append(clampTitle(!idle && a.media_title ? a.media_title : room));
    const line = off ? "Offline" : !idle ? [a.media_artist, a.media_album_name].filter(Boolean).join(" · ")
      : a.media_title ? `Last played: ${a.media_title}${a.media_artist ? " · " + a.media_artist : ""}` : "Nothing playing";
    if (line) tx.append(el("div", "artist", line));
    const kb = el("div", "kb"), p = !idle ? this._kPos(s) : null;
    this._kprog = null;
    if (p) {
      const pr = el("div", "kprog"), bar = el("div", "bar"), i = el("i"), t0 = el("span", "pt num", p.pos);
      bar.setAttribute("aria-hidden", "true"); i.style.width = (p.frac * 100).toFixed(1) + "%"; bar.append(i);
      pr.append(t0, bar, el("span", "pt num", p.dur));
      kb.append(pr);
      this._kprog = {i, t0};
    }
    const keys = el("div", "kt"); keys.append(...this._transportKeys(s, off));
    const vol = this._volRow(s, off, true);
    if (this._speakers.length) {
      vol.classList.add("sp");
      const sk = jamMuKey("speakers", "Speakers", "speakers", "", () => { this._tab = "speakers"; this._render(false); const p2 = this.shadowRoot.querySelector(".klist"); if (p2) staggerIn(p2.children, 0); });
      vol.append(sk);
    }
    kb.append(keys, vol);
    side.append(head, tx, kb);
    return side;
  }
  /* Bottom shelf: label + 5 covers (pinned, then recent) + Browse. Pins / recent load on demand and refill only the shelf. */
  _shelf() {
    const c = this._config, h = this._hass, sh = el("div", "shelf"), pins = jamMuPinned(c), seen = new Set(), items = [];
    for (const x of [...pins, ...(this._recent || [])]) if (!seen.has(x.uri) && items.length < 5) { seen.add(x.uri); items.push(x); }
    const lb = el("div", "lb", pins.length ? "Pinned" : "Recent"); lb.setAttribute("aria-hidden", "true");
    sh.append(lb);
    sh.dataset.sig = lb.textContent + "|" + items.map(x => x.uri + "=" + x.name).join(",");
    if (!items.length) sh.append(el("div", "none", this._recentAt && this._recent ? "Pin playlists and albums from Browse." : "Loading your music…"));
    for (const it of items) {
      const t = el("button", "tile"); t.type = "button"; t.dataset.key = "tile"; t.dataset.uri = it.uri;
      t.setAttribute("aria-label", "Play " + it.name);
      t.append(jamMuThumb(h, it.image, it.uri), el("span", "nm", it.name));
      t.onclick = () => { this._play(it); if (motionOn()) oneShot(t, "jam-stamp"); };
      sh.append(t);
    }
    const br = el("button", "tile browse"); br.type = "button"; br.dataset.key = "browse"; br.setAttribute("aria-label", "Browse the music library");
    br.style.gridColumn = "7"; br.append(jamMuIcon("more"), el("span", "nm", "Browse"));
    br.onclick = () => this._openPanel();
    sh.append(br);
    if (this.isConnected && h) {
      if (!JAM_MU.pins && !JAM_MU.pinsLoad) jamMuPinsLoad(h).then(() => this._refillShelf());
      if (!this._namesAt || Date.now() - this._namesAt > 600e3) {
        this._namesAt = Date.now();
        const rp = jamMuResolvePins(h, c);
        if (rp) rp.then(() => this._refillShelf());
      }
      if (!this._recentAt || Date.now() - this._recentAt > 300e3) {
        this._recentAt = Date.now();
        jamMuRecent(h, c, 300e3).then(r => { this._recent = r; }, () => { this._recent = this._recent || []; }).then(() => this._refillShelf());
      }
    }
    return sh;
  }
  _refillShelf() {
    if (!this._kroot || !this.isConnected) return;
    const old = this._kroot.querySelector(".shelf");
    if (!old) return;
    const n = this._shelf();
    if (old.dataset.sig !== n.dataset.sig || old.querySelector(".none") && !n.querySelector(".none") || old.textContent !== n.textContent) old.replaceWith(n);
  }
  /* K1 progress line: refreshed every 5 s while playing, only while the card is inside a sheet (the kiosk's fullscreen sheet). */
  _tick() {
    clearTimeout(this._tk); this._tk = null;
    if (!this._kiosk || !this.isConnected || !this._kprog) return;
    const s = stateObj(this._hass, this._config.entity);
    if (!s || s.state !== "playing" || !composedChain(this).some(x => x.classList && x.classList.contains("jam-sheet-host"))) return;
    this._tk = setTimeout(() => {
      this._tk = null;
      const st = stateObj(this._hass, this._config.entity), p = st && st.state === "playing" ? this._kPos(st) : null;
      if (p && this._kprog) { this._kprog.i.style.width = (p.frac * 100).toFixed(1) + "%"; this._kprog.t0.textContent = p.pos; }
      this._tick();
    }, 5000);
  }
  getCardSize() { return 6; }
}
register("jam-speaker", JamSpeaker, "Jam Speaker", "Music Assistant speaker: artwork / cut-paper poster with an ink title band (shuffle, favourite), power corner, transport, volume; library panel (pinned, recent, playlists, albums, search); kiosk K1.");
