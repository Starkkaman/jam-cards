// Preview fixture: Music — jam-speaker (round 3: TV-style poster, ink band with Shuffle / Favourite, power corner, panel B).
// Own preview_spk_* entities (50-av / 70-tv keep the real ids for their checks): Kitchen playing over Spotify Connect with
// art + Phoster joined, Living room idle (last title, cut-paper abstract, config pins), Phoster grouped into Kitchen, an
// MA-queue player without art (its track is a favourite per get_queue), a paused one, a TV-source one without shuffle /
// speakers whose MA config entry is down (library errors), House (no GROUPING feature) and an unavailable one.
// Entity registry + devices (hass.entities / hass.devices, merged from window.__jamMusicReg; 87-kiosk-sheets adds its own)
// tie each player to its MA "Favorite current song" button, like Home Assistant. A fake hass.callWS answers the Music
// Assistant response actions (config_entries/get, get_library, search, get_queue) from a small fake library (data: SVG
// covers) and chains everything else to the earlier fake (30-light's user data, 40-data's history); it is installed when
// index.html assigns window.__hass (like 40-data) and again after 30-light replaces callWS on DOMContentLoaded. Its
// messages are recorded in window.__ws.
{
const {st} = jamPreview;
const K = "media_player.preview_spk_kitchen", L = "media_player.preview_spk_living", P = "media_player.preview_spk_phoster";
const MA = "media_player.preview_spk_ma";
const F = 8322623; // Music Assistant player features (GROUPING 524288 + SHUFFLE_SET 32768 + VOLUME_SET 4 ...; no TURN_ON / TURN_OFF)
const svg = body => "data:image/svg+xml," + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 300">' + body + "</svg>");
const art = svg('<rect width="300" height="300" fill="#1d3557"/><rect x="0" y="180" width="300" height="120" fill="#e63946"/><rect x="40" y="40" width="90" height="90" fill="#f1faee"/>');
// Album-cover stand-ins (the mockup's c1-c6).
const C = {
  c1: svg('<rect width="300" height="300" fill="#e8d6b0"/><path d="M-40 150 340 80v110L-40 260z" fill="#1d3557"/><circle cx="215" cy="70" r="45" fill="#e63946"/>'),
  c2: svg('<rect width="300" height="300" fill="#2b2d42"/><rect x="36" y="54" width="174" height="156" fill="#f4a261"/><rect x="60" y="216" width="180" height="14" fill="#e9c46a"/><rect x="60" y="246" width="180" height="14" fill="#e76f51"/>'),
  c3: svg('<rect width="300" height="300" fill="#0b6e4f"/><circle cx="110" cy="110" r="70" fill="none" stroke="#f2e8cf" stroke-width="26"/><rect y="210" width="300" height="90" fill="#08a045"/>'),
  c4: svg('<rect width="300" height="300" fill="#f15bb5"/><rect width="150" height="300" fill="#00bbf9"/><rect x="115" y="90" width="70" height="70" fill="#fee440" transform="rotate(45 150 125)"/>'),
  c5: svg('<rect width="300" height="300" fill="#ffbe0b"/><rect y="80" width="300" height="24" fill="#3a0ca3"/><rect y="138" width="300" height="24" fill="#3a0ca3"/><rect y="196" width="300" height="24" fill="#3a0ca3"/>'),
  c6: svg('<rect width="300" height="300" fill="#14213d"/><circle cx="150" cy="170" r="105" fill="#fca311"/><rect y="170" width="300" height="130" fill="#14213d"/>'),
};
const item = (media_type, id, name, image, artist) => ({media_type, uri: `library://${media_type}/${id}`, name, version: "", image, favorite: false,
  ...(artist ? {artists: [{media_type: "artist", uri: "library://artist/" + id, name: artist, version: "", image: null}]} : {})});
const LIB = {
  playlist: [item("playlist", 1, "Cooking", C.c2), item("playlist", 2, "Sunday", C.c3), item("playlist", 3, "Dinner party", C.c4),
    item("playlist", 4, "Night drive", C.c5), item("playlist", 5, "Focus", null)],
  album: [item("album", 11, "Sunrise Sessions", C.c6, "The Olympians"), item("album", 12, "Currents", C.c1, "Tame Impala"),
    item("album", 13, "Saturn", C.c1, "The Olympians"), item("album", 14, "Mezzanine", "/broken/cover.png", "Massive Attack")],
  artist: [item("artist", 21, "The Olympians", C.c1)],
  track: [item("track", 31, "Saturn", C.c1, "The Olympians"), item("track", 32, "Lobby", null, "AERwave")],
  radio: [],
};
const RECENT = {playlist: ["Night drive", "Cooking", "Dinner party"], album: ["Sunrise Sessions", "Currents"]};
const ma = m => {
  if (m.type === "config_entries/get" && m.domain === "music_assistant") return [{entry_id: "preview_ma", domain: "music_assistant", title: "Music Assistant", state: "loaded"}];
  if (m.type !== "call_service" || m.domain !== "music_assistant") return undefined;
  const d = m.service_data || {};
  if (d.config_entry_id === "preview_down") return Promise.reject(new Error("Music Assistant is not responding"));
  if (m.service === "get_library") {
    let items = LIB[d.media_type] || [];
    if (d.order_by === "last_played_desc") items = (RECENT[d.media_type] || []).map(n => items.find(x => x.name === n)).filter(Boolean);
    return {response: {items: items.slice(0, d.limit || 25), limit: d.limit || 25, offset: 0, order_by: d.order_by || "name", media_type: d.media_type}};
  }
  if (m.service === "search") {
    const q = String(d.name || "").toLowerCase(), hit = k => (LIB[k] || []).filter(x => x.name.toLowerCase().includes(q) || (x.artists || []).some(a => a.name.toLowerCase().includes(q)));
    return {response: {artists: hit("artist"), albums: hit("album"), tracks: hit("track"), playlists: hit("playlist"), radio: [], audiobooks: [], podcasts: []}};
  }
  if (m.service === "get_queue") {
    const id = m.target && m.target.entity_id, s = window.__hass.states[id], a = (s && s.attributes) || {};
    return {response: {[id]: {queue_id: "q_" + id, active: true, name: a.friendly_name || id, items: 12, shuffle_enabled: !!a.shuffle, repeat_mode: "off",
      current_index: 3, elapsed_time: 20, current_item: a.media_title ? {queue_item_id: "qi1", name: a.media_title, duration: 240,
        media_item: {media_type: "track", uri: "library://track/99", name: a.media_title, version: "", image: null, favorite: id === MA}} : null, next_item: null}}};
  }
  return undefined;
};
const reg = window.__jamMusicReg = {entities: {}, devices: {}}, dev = reg.devices;
for (const [p, d, fav] of [[K, "dev_k", true], [L, "dev_l", true], [P, "dev_p", true], [MA, "dev_ma", true], ["media_player.preview_spk_paused", "dev_pa", false]]) {
  reg.entities[p] = {entity_id: p, device_id: d, platform: "music_assistant", translation_key: null};
  dev[d] = {id: d, name: p.slice(13), primary_config_entry: "preview_ma", config_entries: ["preview_ma"]};
  if (fav) { const b = "button." + p.slice(13) + "_favorite_current_song_x"; reg.entities[b] = {entity_id: b, device_id: d, platform: "music_assistant", translation_key: "favorite_now_playing"}; }
}
const favBtn = p => st("button." + p.slice(13) + "_favorite_current_song_x", "unknown", {friendly_name: p.slice(13) + " Favorite current song"});
const wrap = h => {
  const prev = h.callWS;
  if (prev && prev.__jamMusic) return;
  const fn = function (msg) {
    const r = ma(msg);
    if (r !== undefined) { (window.__ws = window.__ws || []).push(JSON.parse(JSON.stringify(msg))); return Promise.resolve(r); }
    if (prev) return prev.call(this, msg);
    // Before 30-light's fake storage is installed (DOMContentLoaded): the same per-page user data.
    const ud = window.__userData = window.__userData || {};
    if (msg.type === "frontend/get_user_data") return Promise.resolve({value: ud[msg.key] ?? null});
    if (msg.type === "frontend/set_user_data") { ud[msg.key] = msg.value; return Promise.resolve(null); }
    return Promise.reject(new Error("unknown command " + msg.type));
  };
  fn.__jamMusic = true;
  h.callWS = fn;
};
const install = h => {
  if (!h || h.__jamMusic) return;
  h.__jamMusic = true;
  h.entities = {...(h.entities || {}), ...reg.entities}; h.devices = {...(h.devices || {}), ...reg.devices};
  wrap(h);
};
const prevDesc = Object.getOwnPropertyDescriptor(window, "__hass");
let hv = prevDesc && !prevDesc.get ? prevDesc.value : undefined;
Object.defineProperty(window, "__hass", {configurable: true, enumerable: true,
  get() { return prevDesc && prevDesc.get ? prevDesc.get.call(window) : hv; },
  set(h) { if (prevDesc && prevDesc.set) prevDesc.set.call(window, h); else hv = h; install(h); }});
document.addEventListener("DOMContentLoaded", () => { if (window.__hass) wrap(window.__hass); });
jamPreview.add({
  states: [
    st(K, "playing", {friendly_name: "Kitchen Speakers", source: "Spotify Connect (Kitchen)", source_list: ["Music Assistant Queue", "Spotify Connect (Kitchen)"],
      media_title: "Lobby", media_artist: "AERwave", entity_picture: art, volume_level: 0.48, shuffle: true, media_content_id: "spotify_connect://audio_source/k",
      media_duration: 240, media_position: 84, media_position_updated_at: new Date().toISOString(),
      group_members: [K, P], supported_features: F}),
    st(L, "idle", {friendly_name: "Living Room Speakers", source: "Music Assistant Queue", media_title: "Saturn", media_artist: "The Olympians",
      volume_level: 0.4, shuffle: false, group_members: [], supported_features: F, app_id: "music_assistant"}),
    st(P, "playing", {friendly_name: "Phoster", source: "Spotify", media_title: "Lobby", media_artist: "AERwave", volume_level: 1,
      group_members: [K, P], supported_features: 8320575}),
    st(MA, "playing", {friendly_name: "Office Speakers", source: "Music Assistant Queue", app_id: "music_assistant", media_title: "Midnight City",
      media_artist: "M83", media_content_id: "library://track/77", volume_level: 0.3, shuffle: false, group_members: [], supported_features: F}),
    st("media_player.preview_spk_paused", "paused", {friendly_name: "Porch Speakers", source: "Music Assistant Queue", media_title: "Teardrop",
      media_artist: "Massive Attack", volume_level: 0.25, group_members: [], supported_features: F}),
    st("media_player.preview_spk_tv", "playing", {friendly_name: "Den Speakers", source: "TV", media_title: "Evening news", volume_level: 0.6,
      supported_features: 4 | 16 | 32 | 128 | 256 | 16384}),
    st("media_player.preview_spk_house", "idle", {friendly_name: "House", source: "Music Assistant Queue", volume_level: 0.4, supported_features: 7798335}),
    st("media_player.preview_spk_gone", "unavailable", {friendly_name: "Garage Speakers", supported_features: F}),
    favBtn(K), favBtn(L), favBtn(P), favBtn(MA),
  ],
  sections: [
    ["", [
      {type: "custom:jam-heading", kicker: "Whole house", title: "Speakers", accent: "music"},
      {type: "custom:jam-speaker", entity: K, name: "Kitchen", speakers: [L, P]},
      {type: "custom:jam-speaker", entity: L, name: "Living room", speakers: [K, P, "media_player.preview_spk_house", "media_player.preview_spk_gone"],
        pinned: ["library://playlist/1", {uri: "library://playlist/2", name: "Sunday"}, {uri: "spotify://playlist/abc", name: "Discover Weekly"}]},
      {type: "custom:jam-speaker", entity: P, name: "Phoster", speakers: [K, L]},
    ]],
    ["", [
      {type: "custom:jam-speaker", entity: MA, name: "Office", speakers: [K]},
      {type: "custom:jam-speaker", entity: "media_player.preview_spk_paused", name: "Porch", show_shuffle: false, poster_height: 120},
      {type: "custom:jam-speaker", entity: "media_player.preview_spk_tv", name: "Den", config_entry_id: "preview_down"},
      {type: "custom:jam-speaker", entity: "media_player.preview_spk_house", name: "House"},
    ]],
  ],
});
}
