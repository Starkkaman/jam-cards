// Preview fixture: jam-light (colour temp, off, rgb-only, brightness-only) + a jam-popup opened by "#livingroom-popup".
{ // block scope: every fixture file may declare its own st
const {st} = jamPreview;
jamPreview.add({
  states: [
    st("light.kajplats_e26_cws_globe_1100lm", "on", {friendly_name: "Table Lamp", supported_color_modes: ["color_temp", "xy"],
      color_mode: "color_temp", brightness: 191, color_temp_kelvin: 2500, min_color_temp_kelvin: 1801, max_color_temp_kelvin: 6535,
      rgb_color: [255, 159, 70], xy_color: [0.546, 0.389], hs_color: [28.874, 72.522]}),
    st("light.living_room_floor_lamp", "off", {friendly_name: "Floor Lamp", supported_color_modes: ["color_temp", "hs", "xy"],
      color_mode: null, brightness: null, color_temp_kelvin: null, min_color_temp_kelvin: 1801, max_color_temp_kelvin: 6535, rgb_color: null}),
    st("light.wled", "on", {friendly_name: "WLED", supported_color_modes: ["rgb"], color_mode: "rgb", brightness: 82,
      rgb_color: [63, 154, 165], hs_color: [186, 62]}),
    st("light.garage", "on", {friendly_name: "Garage", supported_color_modes: ["brightness"], color_mode: "brightness", brightness: 128}),
    st("light.hall", "unavailable", {friendly_name: "Hall", supported_color_modes: ["brightness"]}),
    st("input_select.light_scenes", "Movie Time", {friendly_name: "Light Scenes", options: ["Normal", "Movie Time", "Vibes"]}),
  ],
  sections: [
    ["", jamPreview.room("living", [
      {type: "custom:jam-heading", kicker: "Lights", title: "Living room"},
      {type: "custom:jam-light", entity: "light.kajplats_e26_cws_globe_1100lm",
        tap_action: {action: "perform-action", perform_action: "light.toggle", target: {entity_id: "light.kajplats_e26_cws_globe_1100lm"},
          data: {color_temp_kelvin: 2700, brightness_pct: 80}}},
      {type: "custom:jam-light", entity: "light.living_room_floor_lamp"},
      {type: "custom:jam-light", entity: "light.wled", name: "TV light",
        presets: [{name: "Movie", rgb_color: [212, 58, 28]}, {name: "Reading", color_temp_kelvin: 4000}]},
      ["half", {type: "custom:jam-light", entity: "light.garage"}],
      ["half", {type: "custom:jam-light", entity: "light.hall"}],
      // Opener: a tile whose tap navigates to the pop-up hash (jam-button is built in parallel, so no dependency on it).
      {type: "custom:jam-tile", entity: "input_select.light_scenes", name: "Open living room pop-up", control: "none",
        tap_action: {action: "navigate", navigation_path: "#livingroom-popup"}},
      {type: "custom:jam-popup", hash: "#livingroom-popup", kicker: "Pop-up", title: "Living room", cards: [
        {type: "custom:jam-light", entity: "light.kajplats_e26_cws_globe_1100lm"},
        {type: "custom:jam-light", entity: "light.living_room_floor_lamp"},
        {type: "custom:jam-choice", entity: "input_select.light_scenes"},
      ]},
    ])],
  ],
});
}
