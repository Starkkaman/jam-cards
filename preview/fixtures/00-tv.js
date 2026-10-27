// Preview fixture: states merged into hass.states, sections appended to the view (file-name order).
{ // block scope: every fixture file may declare its own st
const {st} = jamPreview;
jamPreview.add({
  states: [
    st("switch.hisense_tv_power", "on", {friendly_name: "Hisense TV Power"}),
    st("sensor.hisense_tv_current_app", "JellyWatch Player", {friendly_name: "Current app"}),
    st("select.hisense_tv_input", "Switch 2", {friendly_name: "Input", options: ["HDMI 1", "Switch 2", "HDMI 3"]}),
    st("select.hisense_tv_launch_app", "JellyWatch Player", {friendly_name: "Launch app", options: ["YouTube", "JellyWatch Player", "Jamfin", "Dropout", "Corridor Digital", "Settings"]}),
    st("sensor.hisense_tv_input_signal", "3840x2080 @ 24 Hz", {friendly_name: "Input signal"}),
    st("sensor.hisense_tv_hdr_format", "Dolby Vision", {friendly_name: "HDR format"}),
    st("sensor.hisense_tv_vrr_refresh_rate", "24", {friendly_name: "VRR refresh", unit_of_measurement: "Hz"}),
    st("binary_sensor.hisense_tv_signal_present", "on", {friendly_name: "Signal present"}),
    st("binary_sensor.hisense_tv_game_signal", "off", {friendly_name: "Game signal"}),
    st("select.hisense_tv_picture_mode", "Dolby Vision Custom", {friendly_name: "Picture mode", options: ["Standard", "Theater Day", "Theater Night", "Dolby Vision Custom", "Filmmaker"]}),
    st("number.hisense_tv_backlight", "100", {friendly_name: "Backlight", min: 0, max: 100, step: 1, unit_of_measurement: "%"}),
    st("select.hisense_tv_audio_output", "Optical", {friendly_name: "Audio output", options: ["Speaker", "Optical", "Bluetooth"]}),
    st("select.hisense_tv_sound_mode", "Standard", {friendly_name: "Sound mode", options: ["Standard", "Theater", "Music", "Speech", "Late Night"]}),
    st("media_player.living_room_phoster_android_tv", "playing", {friendly_name: "Phoster", app_name: "JellyWatch Player", media_title: "Close Encounters of the Third Kind"}),
  ],
  sections: [
    ["full", {type: "custom:jam-hero", kicker: "Living room TV", title_entity: "sensor.hisense_tv_current_app", power_entity: "switch.hisense_tv_power",
      meta_entities: ["select.hisense_tv_input", "sensor.hisense_tv_input_signal", "sensor.hisense_tv_hdr_format"], off_title: "TV off",
      chips: [{entity: "sensor.hisense_tv_vrr_refresh_rate", name: "VRR"}, {entity: "binary_sensor.hisense_tv_game_signal", name: "Game mode", show_state: "on", hide_value: true}], accent: "living"}],
    ["wide", jamPreview.room("living", [
      {type: "custom:jam-heading", kicker: "Now", title: "Playing"},
      ["half", {type: "custom:jam-tile", entity: "switch.hisense_tv_power", name: "Power"}],
      ["half", {type: "custom:jam-tile", entity: "binary_sensor.hisense_tv_signal_present", name: "Signal", label: "Present"}],
      {type: "custom:jam-choice", entity: "select.hisense_tv_launch_app", name: "Launch app"},
      {type: "custom:jam-choice", entity: "select.hisense_tv_input", name: "Input", columns: 3},
      {type: "custom:jam-media", entity: "media_player.living_room_phoster_android_tv", name: "Playback"},
    ])],
    ["", jamPreview.room("master", [
      {type: "custom:jam-heading", kicker: "Picture", title: "Image"},
      {type: "custom:jam-choice", entity: "select.hisense_tv_picture_mode", name: "Picture mode"},
      {type: "custom:jam-slider", entity: "number.hisense_tv_backlight", name: "Backlight"},
    ])],
    ["", jamPreview.room("kitchen", [
      {type: "custom:jam-heading", kicker: "Sound", title: "Audio"},
      {type: "custom:jam-choice", entity: "select.hisense_tv_audio_output", name: "Audio output", columns: 3},
      {type: "custom:jam-choice", entity: "select.hisense_tv_sound_mode", name: "Sound mode"},
    ])],
    ["", jamPreview.room("nerd", [
      {type: "custom:jam-heading", kicker: "Signal", title: "Source", entities: ["sensor.hisense_tv_hdr_format"]},
      {type: "custom:jam-tile", entity: "sensor.hisense_tv_input_signal", name: "Resolution & rate"},
      ["half", {type: "custom:jam-tile", entity: "sensor.hisense_tv_vrr_refresh_rate", name: "VRR"}],
      ["half", {type: "custom:jam-tile", entity: "binary_sensor.hisense_tv_game_signal", name: "Game signal"}],
    ])],
  ],
});
}
