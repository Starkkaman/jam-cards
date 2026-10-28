// Preview fixture: Watch & play — jam-tv (playing + idle + off), NerveOS as a compact jam-media with a ⋯ sheet, a compact
// speaker, and jam-fan (Vital 200S air purifier). Sources are the ones the living-room dashboards use.
{ // block scope: every fixture file may declare its own st
const {st} = jamPreview;
const TV = "media_player.living_room_phoster_android_tv", RC = "remote.living_room_phoster_android_tv";
const NV = "living_room_nerveos_aero_15";
const auto = id => ({action: "perform-action", perform_action: "automation.trigger", target: {entity_id: id}, data: {skip_condition: true}});
const app = option => ({action: "perform-action", perform_action: "select.select_option", target: {entity_id: "select.hisense_tv_launch_app"}, data: {option}});
const sel = (entity_id, option) => ({action: "perform-action", perform_action: "select.select_option", target: {entity_id}, data: {option}});
const script = id => ({action: "perform-action", perform_action: id});
// The user's sources (jam-home dashboards, G1): highlight from sensor.hisense_tv_current_app (labels from Control Freak's
// app list, or the package id) and, while the TV shows an input ("Live TV"), select.hisense_tv_input.
const sources = [
  {name: "Nerv//OS", color: "teal", tap_action: app("HDMI 2"), match: {input: ["Switch 2", "HDMI 2"]}},
  {name: "Switch", color: "red", tap_action: sel("select.hisense_tv_input", "HDMI 1"), match: {input: "HDMI 1"}},
  {name: "YouTube", color: "red", tap_action: app("YouTube"), match: {app: ["YouTube", "com.google.android.youtube.tv"]}},
  {name: "Jamfin", color: "ochre", tap_action: app("Jamfin"), match: {app: ["Jamfin", "com.isaac.jamfin"]}},
  {name: "Dropout", color: "pink", tap_action: app("Dropout"), match: {app: "Dropout"}},
  {name: "Corridor Digital", color: "blue", tap_action: app("Corridor TV"), match: {app: ["Corridor TV", "com.corridordigital.watchcorridortv"]}},
];
const tv = {
  remote: RC, sources, current_app_entity: "sensor.preview_tv_current_app", input_entity: "select.hisense_tv_input",
  input_app: ["Live TV", "com.vt.tv.tvcenter"],
  volume_up_action: script("script.stereo_volume_up"), volume_down_action: script("script.stereo_volume_down"),
  mute_action: {action: "perform-action", perform_action: "button.press", target: {entity_id: "button.stereo_volume_mute"}},
  stereo: {power_action: script("script.stereo_power"), input_entity: "input_select.preview_stereo_source",
    inputs: [{name: "TV", tap_action: script("script.stereo_input_select_video")},
      {name: "Turntable", tap_action: script("script.stereo_input_select_turntable"), match: "AUX"},
      {name: "Music sync", tap_action: script("script.stereo_input_select_music_sync"), match: "BLUETOOTH"}],
    volume_up_action: script("script.stereo_volume_up"), volume_down_action: script("script.stereo_volume_down"),
    mute_action: {action: "perform-action", perform_action: "button.press", target: {entity_id: "button.stereo_volume_mute"}}},
  // Settings sends HOME in their setup.
  remote_card: {commands: {settings: "HOME"}},
};
const press = (name, id, extra) => ({type: "custom:jam-button", name, tap_action: {action: "perform-action", perform_action: "button.press", target: {entity_id: id}}, ...extra});
jamPreview.add({
  states: [
    // Overrides the 00-tv state (same title, app now Jellyfin, position/duration); no volume features, like the real entity.
    st(TV, "playing", {friendly_name: "Phoster", app_name: "Jellyfin", media_title: "Close Encounters of the Third Kind",
      media_position: 4320, media_duration: 8220, supported_features: 153529}),
    st("media_player.preview_tv_off", "off", {friendly_name: "Phoster", supported_features: 153529}),
    // Projectivy home: Control Freak labels its package with the first app-list label it owns ("HDMI 2", an input shortcut).
    st("sensor.preview_tv_current_app", "HDMI 2", {friendly_name: "Current app"}),
    st("input_select.preview_stereo_source", "TV", {friendly_name: "Stereo source", options: ["TV", "AUX", "BLUETOOTH"]}),
    st("media_player.preview_tv_idle", "on", {friendly_name: "Phoster", app_id: "com.spocky.projengmenu", supported_features: 153529}),
    st(`sensor.${NV}_now_playing`, "Hades II", {friendly_name: "NervOS (Aero 15) Now playing"}),
    st(`sensor.${NV}_power`, "on", {friendly_name: "NervOS (Aero 15) Power"}),
    st(`image.${NV}_cover_art`, "2026-10-27T04:13:43+00:00", {friendly_name: "NervOS (Aero 15) Cover art"}), // no picture: Golden Arm bars
    st(`number.${NV}_volume`, "79", {friendly_name: "NervOS (Aero 15) Volume", min: 0, max: 100, step: 1, unit_of_measurement: "%"}),
    st(`button.${NV}_sleep`, "unknown", {friendly_name: "Sleep"}),
    st(`button.${NV}_quit_game`, "unknown", {friendly_name: "Quit game"}),
    st(`switch.${NV}_mute`, "off", {friendly_name: "Mute"}),
    st("select.nerveos_remote", "Home", {friendly_name: "NerveOS remote", options: ["Back", "Home"]}),
    st("fan.vital_200s_series", "on", {friendly_name: "Vital 200S Series", preset_modes: ["auto", "pet", "sleep"], percentage: 50,
      percentage_step: 25, preset_mode: null, mode: "manual", supported_features: 57}),
    st("sensor.vital_200s_series_air_quality", "excellent", {friendly_name: "Vital 200S Series Air quality"}),
    st("sensor.vital_200s_series_pm2_5", "1", {friendly_name: "Vital 200S Series PM2.5", device_class: "pm25", unit_of_measurement: "μg/m³"}),
  ],
  sections: [
    ["", jamPreview.room("living", [
      {type: "custom:jam-heading", kicker: "Living room", title: "Watch & play"},
      ["full", {type: "custom:jam-tv", media_player: TV, name: "TV · Phoster", ...tv}],
      ["full", {type: "custom:jam-tv", media_player: "media_player.preview_tv_idle", name: "TV · Phoster (idle)", ...tv}],
      ["full", {type: "custom:jam-tv", media_player: "media_player.preview_tv_off", name: "TV · Phoster", source_label: "Watch", ...tv}],
      ["full", {type: "custom:jam-media", compact: true, name: "NerveOS", accent: "kitchen",
        title_entity: `sensor.${NV}_now_playing`, state_entity: `sensor.${NV}_power`, picture_entity: `image.${NV}_cover_art`,
        sub_entities: [{entity: `number.${NV}_volume`, name: "vol"}],
        // NerveOS has no remote.* entity: the jam-remote runs button presses / select options only (menu has none -> disabled).
        more: {title: "NerveOS", kicker: "Living room", cards: [
          {type: "custom:jam-remote", rows: [["dpad"], ["back", "home", "menu"]], actions: {
            ...Object.fromEntries(["up", "down", "left", "right", "ok"].map(k => [k, {action: "perform-action", perform_action: "button.press", target: {entity_id: `button.${NV}_${k}`}}])),
            back: {action: "perform-action", perform_action: "select.select_option", target: {entity_id: "select.nerveos_remote"}, data: {option: "Back"}},
            home: {action: "perform-action", perform_action: "select.select_option", target: {entity_id: "select.nerveos_remote"}, data: {option: "Home"}},
          }},
          press("Sleep", `button.${NV}_sleep`),
          press("Quit game", `button.${NV}_quit_game`, {accent: "red"}),
          {type: "custom:jam-tile", entity: `switch.${NV}_mute`, name: "Mute"},
          {type: "custom:jam-slider", entity: `number.${NV}_volume`, name: "Volume"},
        ]}}],
      ["full", {type: "custom:jam-media", compact: true, entity: "media_player.phoster", name: "Phoster speaker", accent: "music"}],
      ["full", {type: "custom:jam-fan", entity: "fan.vital_200s_series", name: "Air purifier",
        sensor: "sensor.vital_200s_series_air_quality", extra_sensor: "sensor.vital_200s_series_pm2_5"}],
    ])],
  ],
});
}
