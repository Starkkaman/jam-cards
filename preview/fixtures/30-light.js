// Preview fixture: jam-light v2 (group in its colour, kitchen lamp at 2000 K, WLED with presets, off, brightness-only,
// unavailable) + a jam-popup opened by "#livingroom-popup". Fakes hass.callWS for frontend/{get,set}_user_data.
{ // block scope: every fixture file may declare its own st
const {st} = jamPreview;
const LR = ["light.kajplats_e26_cws_globe_1100lm", "light.living_room_floor_lamp"];
jamPreview.add({
  states: [
    st("light.living_room", "on", {friendly_name: "Living room", entity_id: LR, supported_color_modes: ["color_temp", "hs", "xy"],
      color_mode: "xy", brightness: 191, rgb_color: [255, 159, 71], hs_color: [28.9, 72.3], xy_color: [0.546, 0.389],
      min_color_temp_kelvin: 1801, max_color_temp_kelvin: 6535}),
    st("light.kajplats_e26_cws_globe_1100lm", "on", {friendly_name: "Table Lamp", supported_color_modes: ["color_temp", "xy"],
      color_mode: "color_temp", brightness: 191, color_temp_kelvin: 2500, min_color_temp_kelvin: 1801, max_color_temp_kelvin: 6535,
      rgb_color: [255, 159, 70], xy_color: [0.546, 0.389], hs_color: [28.874, 72.522]}),
    // Kept off: preview/checks/00-tv.js uses it as an off light.
    st("light.living_room_floor_lamp", "off", {friendly_name: "Floor Lamp", supported_color_modes: ["color_temp", "hs", "xy"],
      color_mode: null, brightness: null, color_temp_kelvin: null, min_color_temp_kelvin: 1801, max_color_temp_kelvin: 6535, rgb_color: null}),
    st("light.kitchen_lamp", "on", {friendly_name: "Kitchen lamp", supported_color_modes: ["color_temp"], color_mode: "color_temp",
      brightness: 143, color_temp_kelvin: 2000, min_color_temp_kelvin: 2000, max_color_temp_kelvin: 5000, rgb_color: [255, 137, 14]}),
    st("light.wled", "on", {friendly_name: "TV light", supported_color_modes: ["color_temp", "rgbww"], color_mode: "rgbww", brightness: 82,
      rgb_color: [140, 60, 255], hs_color: [266, 76.5], min_color_temp_kelvin: 2000, max_color_temp_kelvin: 6535}),
    st("select.wled_preset", "Vibes", {friendly_name: "TV light Preset",
      options: ["Bright Vibes", "Halloween", "Movie Time", "Rainbow", "Spring", "Standard", "Vibes", "Vibes (warm)"]}),
    st("light.tree", "off", {friendly_name: "Tree", supported_color_modes: ["color_temp", "hs"], color_mode: null, brightness: null,
      min_color_temp_kelvin: 2000, max_color_temp_kelvin: 6500}),
    st("light.garage", "on", {friendly_name: "Garage", supported_color_modes: ["brightness"], color_mode: "brightness", brightness: 128}),
    st("light.hall", "unavailable", {friendly_name: "Hall", supported_color_modes: ["brightness"]}),
    st("script.jam_light_off_in", "off", {friendly_name: "Jam light off in"}),
    st("light.porch", "on", {friendly_name: "Porch", supported_color_modes: ["color_temp"], color_mode: "color_temp", brightness: 200, color_temp_kelvin: 2700}),
    st("switch.mood_lighting", "on", {friendly_name: "Mood Lighting"}),
    // Used by preview/fixtures/60-house.js (jam-scenes current_entity) and the jam-popup below.
    st("input_select.light_scenes", "Movie Time", {friendly_name: "Light Scenes", options: ["Normal", "Movie Time", "Vibes"]}),
  ],
  sections: [
    ["", jamPreview.room("living", [
      {type: "custom:jam-heading", kicker: "Lights", title: "Living room"},
      ["half", {type: "custom:jam-light", entity: "light.living_room", kicker: "Living room"}],
      ["half", {type: "custom:jam-light", entity: "light.kitchen_lamp", whites: [{name: "Cozy", kelvin: 2200}, {name: "Daylight", kelvin: 6500}],
        tap_action: {action: "perform-action", perform_action: "light.toggle", target: {entity_id: "light.kitchen_lamp"},
          data: {color_temp_kelvin: 2700, brightness_pct: 80}},
        presets: [{name: "Reading", color_temp_kelvin: 4000, brightness_pct: 100}]}],
      ["half", {type: "custom:jam-light", entity: "light.wled", preset_entity: "select.wled_preset", kicker: "Living room"}],
      ["half", {type: "custom:jam-light", entity: "light.tree"}],
      ["half", {type: "custom:jam-light", entity: "light.garage"}],
      ["half", {type: "custom:jam-light", entity: "light.hall"}],
      // 0.3.5: a switch key (size normal) next to a light card is exactly as tall (84 px).
      ["half", {type: "custom:jam-button", entity: "switch.mood_lighting", name: "Tree", size: "normal"}],
      ["half", {type: "custom:jam-light", entity: "light.porch"}],
      // Opener: a tile whose tap navigates to the pop-up hash.
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
// Fake per-user frontend storage (hass is created after the fixtures; DOMContentLoaded runs after that script).
window.__userData = {jam_colors: [[255, 60, 140], [90, 160, 255], [255, 120, 40], [140, 60, 255]]};
window.__ws = [];
document.addEventListener("DOMContentLoaded", () => {
  window.__hass.callWS = msg => {
    window.__ws.push(JSON.parse(JSON.stringify(msg)));
    if (msg.type === "frontend/get_user_data") return Promise.resolve({value: window.__userData[msg.key] ?? null});
    if (msg.type === "frontend/set_user_data") { window.__userData[msg.key] = msg.value; return Promise.resolve(null); }
    return Promise.reject(new Error("unknown command " + msg.type));
  };
});
}
