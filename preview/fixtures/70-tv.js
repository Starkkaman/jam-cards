// Preview fixture: Watch & play — jam-tv (playing + idle), NerveOS as a compact jam-media with a ⋯ sheet, a compact
// speaker, and jam-fan (Vital 200S air purifier). Launcher actions are the ones the living-room dashboards use today.
{ // block scope: every fixture file may declare its own st
const {st} = jamPreview;
const TV = "media_player.living_room_phoster_android_tv", RC = "remote.living_room_phoster_android_tv";
const NV = "living_room_nerveos_aero_15";
const auto = id => ({action: "perform-action", perform_action: "automation.trigger", target: {entity_id: id}, data: {skip_condition: true}});
const app = option => ({action: "perform-action", perform_action: "select.select_option", target: {entity_id: "select.hisense_tv_launch_app"}, data: {option}});
const launchers = [
  {name: "Jellyfin", icon: "mdi:jellyfish", color: "violet", tap_action: auto("automation.launch_jellyfin")},
  {name: "YouTube", icon: "mdi:youtube", color: "red", tap_action: auto("automation.launch_youtube")},
  {name: "Switch", icon: "mdi:nintendo-switch", color: "red", tap_action: auto("automation.nintendo_input")},
  {name: "Batocera", icon: "mdi:gamepad-variant", color: "teal", tap_action: auto("automation.batocera_input")},
  {name: "Jamfin", icon: "mdi:disc-player", color: "ochre", tap_action: app("Jamfin")},
  {name: "Dropout", icon: "mdi:television-play", color: "pink", tap_action: app("Dropout")},
  {name: "Corridor Digital", icon: "mdi:movie-open", color: "blue", tap_action: app("Corridor TV")},
];
const tv = {
  remote: RC, launchers, keys: ["power", "stereo", "remote"],
  stereo_action: {action: "navigate", navigation_path: "#stereo-popup"},
  remote_card: {actions: {
    vol_up: {action: "perform-action", perform_action: "script.stereo_volume_up"},
    vol_down: {action: "perform-action", perform_action: "script.stereo_volume_down"},
  }},
};
const press = (name, id, extra) => ({type: "custom:jam-button", name, tap_action: {action: "perform-action", perform_action: "button.press", target: {entity_id: id}}, ...extra});
jamPreview.add({
  states: [
    // Overrides the 00-tv state (same title, app now Jellyfin, position/duration); no volume features, like the real entity.
    st(TV, "playing", {friendly_name: "Phoster", app_name: "Jellyfin", media_title: "Close Encounters of the Third Kind",
      media_position: 4320, media_duration: 8220, supported_features: 153529}),
    st("media_player.preview_tv_idle", "on", {friendly_name: "Phoster", app_id: "com.spocky.projengmenu", supported_features: 153529}),
    st(`sensor.${NV}_now_playing`, "Hades II", {friendly_name: "NervOS (Aero 15) Now playing"}),
    st(`sensor.${NV}_power`, "on", {friendly_name: "NervOS (Aero 15) Power"}),
    st(`image.${NV}_cover_art`, "2026-10-27T04:13:43+00:00", {friendly_name: "NervOS (Aero 15) Cover art"}), // no picture: Golden Arm bars
    st(`number.${NV}_volume`, "79", {friendly_name: "NervOS (Aero 15) Volume", min: 0, max: 100, step: 1, unit_of_measurement: "%"}),
    st(`button.${NV}_sleep`, "unknown", {friendly_name: "Sleep"}),
    st(`button.${NV}_quit_game`, "unknown", {friendly_name: "Quit game"}),
    st(`switch.${NV}_mute`, "off", {friendly_name: "Mute"}),
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
      ["full", {type: "custom:jam-media", compact: true, name: "NerveOS", accent: "kitchen",
        title_entity: `sensor.${NV}_now_playing`, state_entity: `sensor.${NV}_power`, picture_entity: `image.${NV}_cover_art`,
        sub_entities: [{entity: `number.${NV}_volume`, name: "vol"}],
        // The real pop-up also needs a d-pad: jam-remote wants a remote.* entity, which NerveOS lacks (see the task report).
        more: {title: "NerveOS", kicker: "Living room", cards: [
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
