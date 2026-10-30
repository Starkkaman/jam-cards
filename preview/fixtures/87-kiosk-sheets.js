// Preview fixture: size "kiosk" (0.6.0; jam-speaker = K1 since round 3) — the fullscreen-sheet layouts of jam-speaker, jam-tv and jam-media (NerveOS), with
// their own ks_* entities. On this page they sit in one full-width section (420px tall each: no sized parent); the checks
// (preview/checks/87-kiosk-sheets.js) put the same configs into jam-kiosk dock sheets at 1024x768 / 961x601.
{ // block scope: every fixture file may declare its own st
const {st} = jamPreview;
const svg = (bg, a, b) => "data:image/svg+xml," + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 300">' +
  `<rect width="300" height="300" fill="${bg}"/><rect x="0" y="190" width="300" height="110" fill="${a}"/><rect x="36" y="36" width="110" height="110" fill="${b}"/></svg>`);
const F = 8322623; // Music Assistant player features (GROUPING + SHUFFLE_SET + VOLUME_SET ...)
const at = new Date(Date.now() - 5000).toISOString();
const app = option => ({action: "perform-action", perform_action: "select.select_option", target: {entity_id: "select.ks_tv_launch"}, data: {option}});
const script = id => ({action: "perform-action", perform_action: id});
const press = id => ({action: "perform-action", perform_action: "button.press", target: {entity_id: id}});
// ks_speaker's MA "Favorite current song" button on the same device: registry entries for the 75-speaker fixture's
// hass.entities / hass.devices hook (that fixture also answers the Music Assistant library calls).
Object.assign(window.__jamMusicReg.entities, {"media_player.ks_speaker": {entity_id: "media_player.ks_speaker", device_id: "dev_ks", platform: "music_assistant"},
  "button.ks_speaker_favorite_current_song": {entity_id: "button.ks_speaker_favorite_current_song", device_id: "dev_ks", platform: "music_assistant", translation_key: "favorite_now_playing"}});
Object.assign(window.__jamMusicReg.devices, {dev_ks: {id: "dev_ks", primary_config_entry: "preview_ma", config_entries: ["preview_ma"]}});
jamPreview.add({
  states: [
    st("button.ks_speaker_favorite_current_song", "unknown", {friendly_name: "Kiosk living Favorite current song"}),
    st("media_player.ks_speaker", "playing", {friendly_name: "Kiosk living speakers", source: "Spotify Connect (Living room)", media_title: "The Less I Know the Better",
      media_artist: "Tame Impala", media_album_name: "Currents", entity_picture: svg("#2b2d42", "#ef233c", "#edf2f4"), volume_level: 0.42, shuffle: false,
      media_position: 95, media_duration: 216, media_position_updated_at: at, group_members: ["media_player.ks_speaker"], supported_features: F}),
    st("media_player.ks_kitchen", "idle", {friendly_name: "Kiosk kitchen speakers", volume_level: 0.3, group_members: [], supported_features: F}),
    st("media_player.ks_phoster", "idle", {friendly_name: "Kiosk phoster", volume_level: 0.8, group_members: [], supported_features: F}),
    st("media_player.ks_tv", "playing", {friendly_name: "Kiosk TV", app_name: "Jellyfin", media_title: "Close Encounters of the Third Kind",
      media_position: 4320, media_duration: 8220, media_position_updated_at: at, entity_picture: svg("#0b3954", "#e0553b", "#ffd166"), supported_features: 153529}),
    st("remote.ks_tv", "on", {friendly_name: "Kiosk TV remote"}),
    st("sensor.ks_tv_app", "Jamfin", {friendly_name: "Kiosk TV app"}),
    st("select.ks_tv_input", "HDMI 2", {friendly_name: "Kiosk TV input", options: ["HDMI 1", "HDMI 2"]}),
    st("select.ks_tv_launch", "Jamfin", {friendly_name: "Kiosk TV launch", options: ["HDMI 2", "YouTube", "Jamfin", "Dropout", "Corridor TV"]}),
    st("sensor.ks_nv_now", "Hollow Knight: Silksong", {friendly_name: "Kiosk NerveOS now playing"}),
    st("sensor.ks_nv_power", "on", {friendly_name: "Kiosk NerveOS power"}),
    st("image.ks_nv_art", "2026-10-28T10:00:00+00:00", {friendly_name: "Kiosk NerveOS cover art", entity_picture: svg("#3d348b", "#f7b801", "#f18701")}),
    st("number.ks_nv_volume", "79", {friendly_name: "Kiosk NerveOS volume", min: 0, max: 100, step: 1, unit_of_measurement: "%"}),
    st("switch.ks_nv_mute", "off", {friendly_name: "Kiosk NerveOS mute"}),
  ],
  sections: [
    ["full", [
      {type: "custom:jam-speaker", entity: "media_player.ks_speaker", name: "Living room", accent: "music", size: "kiosk",
        speakers: ["media_player.ks_kitchen", "media_player.ks_phoster"],
        pinned: [{uri: "library://playlist/1", name: "Cooking"}, "library://playlist/2", {uri: "library://playlist/3", name: "Dinner party"}]},
      {type: "custom:jam-tv", media_player: "media_player.ks_tv", remote: "remote.ks_tv", name: "TV · Phoster", accent: "living", size: "kiosk",
        current_app_entity: "sensor.ks_tv_app", input_entity: "select.ks_tv_input", input_app: ["Live TV"],
        sources: [
          {name: "Nerv//OS", color: "teal", tap_action: app("HDMI 2"), match: {input: ["HDMI 2"]}},
          {name: "Switch", color: "red", tap_action: {action: "perform-action", perform_action: "select.select_option", target: {entity_id: "select.ks_tv_input"}, data: {option: "HDMI 1"}}, match: {input: "HDMI 1"}},
          {name: "YouTube", exact: true, color: "red", tap_action: app("YouTube"), match: {app: "YouTube"}},
          {name: "Jamfin", color: "ochre", tap_action: app("Jamfin"), match: {app: "Jamfin"}},
          {name: "Dropout", color: "pink", tap_action: app("Dropout"), match: {app: "Dropout"}},
          {name: "Corridor Digital", color: "blue", tap_action: app("Corridor TV"), match: {app: "Corridor TV"}},
        ],
        volume_down_action: script("script.ks_volume_down"), mute_action: press("button.ks_mute"), volume_up_action: script("script.ks_volume_up")},
      {type: "custom:jam-media", size: "kiosk", name: "NerveOS", accent: "teal", title_entity: "sensor.ks_nv_now", state_entity: "sensor.ks_nv_power",
        picture_entity: "image.ks_nv_art", sub_entities: [{entity: "number.ks_nv_volume", name: "vol"}],
        more: {title: "NerveOS", kicker: "Living room · Aero 15", cards: [
          {type: "custom:jam-tile", entity: "switch.ks_nv_mute", name: "Mute"},
          {type: "custom:jam-slider", entity: "number.ks_nv_volume", name: "Volume"},
        ]}},
    ]],
  ],
});
}
