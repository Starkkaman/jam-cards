// Preview fixture (1.1.0): states only, for jam-tv's playback_entity (checked by preview/checks/99-hifi-tv-playback.js on
// scratch cards). Two Android TV Remote players that report "on" and the app only, as Home Assistant's Android TV Remote
// integration does: pv_den shows YouTube while its Google Cast player (registry platform cast, named "Den" like the TV's
// "Den - Android TV") plays a video; pv_loft runs an app without a Cast session (its Cast player is off).
{ // block scope: every fixture file may declare its own st
const {st} = jamPreview;
const at = new Date(Date.now() - 60e3).toISOString();
Object.assign(window.__jamMusicReg.entities, {
  "media_player.pv_den_android_tv": {entity_id: "media_player.pv_den_android_tv", device_id: "dev_pv_den", platform: "androidtv_remote"},
  "media_player.pv_den_cast": {entity_id: "media_player.pv_den_cast", device_id: "dev_pv_den_cast", platform: "cast"},
  "media_player.pv_loft_android_tv": {entity_id: "media_player.pv_loft_android_tv", device_id: "dev_pv_loft", platform: "androidtv_remote"},
  "media_player.pv_loft_cast": {entity_id: "media_player.pv_loft_cast", device_id: "dev_pv_loft_cast", platform: "cast"}});
Object.assign(window.__jamMusicReg.devices, {dev_pv_den: {id: "dev_pv_den", name: "Den"}, dev_pv_den_cast: {id: "dev_pv_den_cast", name: "Den"},
  dev_pv_loft: {id: "dev_pv_loft", name: "Loft"}, dev_pv_loft_cast: {id: "dev_pv_loft_cast", name: "Loft"}});
const ATV = name => ({friendly_name: name + " - Android TV", device_class: "tv", supported_features: 153529, volume_level: .06});
jamPreview.add({
  states: [
    st("media_player.pv_den_android_tv", "on", {...ATV("Den"), app_id: "com.google.android.youtube.tv", app_name: "com.google.android.youtube.tv"}),
    st("media_player.pv_den_cast", "playing", {friendly_name: "Den", app_id: "2C6A6E3D", app_name: "YouTube", media_content_type: "video",
      media_title: "How a Creative Couple Transformed an Abandoned Workshop Into Their Home", media_artist: "NEVER TOO SMALL",
      media_duration: 1159.461, media_position: 338.9, media_position_updated_at: at, supported_features: 152511}),
    st("sensor.pv_den_current_app", "YouTube", {friendly_name: "Den current app"}),
    st("remote.pv_den_android_tv", "on", {friendly_name: "Den - Android TV"}),
    st("media_player.pv_loft_android_tv", "on", {...ATV("Loft"), app_id: "com.isaac.jamfin", app_name: "com.isaac.jamfin"}),
    st("media_player.pv_loft_cast", "off", {friendly_name: "Loft"}),
    st("sensor.pv_loft_current_app", "Jamfin TV", {friendly_name: "Loft current app"}),
  ],
});
}
