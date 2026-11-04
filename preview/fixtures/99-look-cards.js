// Look cards (designed for Braun, 2026-11-03): jam-dial, jam-keypad, jam-radio. Own lc_* entities, so the other fixtures'
// checks never touch them. One full-width section at the end of the page (the earlier items keep their place and size).
{ // block scope: every fixture file may declare its own st
const {st} = jamPreview;
const q = document.createElement("style");
q.textContent = ".sec > .third{grid-column:span 4;align-self:start} @media (max-width:700px){.sec > .third{grid-column:span 12}}";
document.head.append(q);
const t = m => new Date(Date.UTC(2026, 9, 28, 12, m)).toISOString();
const F = 1 | 4 | 16 | 32 | 16384 | 32768; // pause, volume_set, previous, next, play, shuffle_set
jamPreview.add({
  states: [
    st("light.lc_living", "on", {friendly_name: "Living room", entity_id: ["light.lc_lamp_1", "light.lc_lamp_2"],
      supported_color_modes: ["color_temp", "hs"], color_mode: "hs", brightness: 191, rgb_color: [255, 160, 64], hs_color: [30, 75],
      min_color_temp_kelvin: 2000, max_color_temp_kelvin: 6500}),
    st("light.lc_lamp_1", "on", {friendly_name: "Lamp 1", supported_color_modes: ["color_temp", "hs"], color_mode: "hs", brightness: 191, rgb_color: [255, 160, 64]}),
    st("light.lc_lamp_2", "on", {friendly_name: "Lamp 2", supported_color_modes: ["color_temp", "hs"], color_mode: "hs", brightness: 191, rgb_color: [255, 160, 64]}),
    st("light.lc_desk", "off", {friendly_name: "Desk lamp", supported_color_modes: ["color_temp"], color_mode: null, brightness: null,
      min_color_temp_kelvin: 2200, max_color_temp_kelvin: 4000}),
    st("light.lc_hall", "unknown", {friendly_name: "Hall"}),
    st("light.lc_plug", "on", {friendly_name: "Plug lamp", supported_color_modes: ["onoff"], color_mode: "onoff"}),
    st("scene.lc_normal", t(1), {friendly_name: "Normal"}),
    st("scene.lc_movie", t(9), {friendly_name: "Movie time"}),
    st("scene.lc_vibes", t(2), {friendly_name: "Vibes"}),
    st("scene.lc_spooky", t(3), {friendly_name: "Spooky"}),
    st("scene.lc_dinner", t(4), {friendly_name: "Dinner"}),
    st("script.lc_read", "off", {friendly_name: "Read", last_triggered: t(5)}),
    st("scene.lc_night", t(6), {friendly_name: "Night"}),
    st("button.lc_doorbell", "unknown", {friendly_name: "Doorbell"}),
    st("input_select.lc_scene", "Movie time", {friendly_name: "Living room scene", options: ["Normal", "Movie time", "Vibes"]}),
    st("media_player.lc_kitchen", "playing", {friendly_name: "Kitchen", source: "Spotify Connect", app_id: "spotify", media_title: "Lobby",
      media_artist: "AERwave", volume_level: 0.36, shuffle: false, supported_features: F, group_members: []}),
    st("button.lc_kitchen_favorite_current_song", "unknown", {friendly_name: "Kitchen Favorite current song"}),
    st("media_player.lc_den", "idle", {friendly_name: "Den", source: "Music Assistant Queue", media_title: "Teardrop", media_artist: "Massive Attack",
      volume_level: 0.5, shuffle: true, supported_features: F, group_members: []}),
    st("media_player.lc_garage", "unknown", {friendly_name: "Garage", supported_features: F}),
  ],
  sections: [
    ["full", [
      {type: "custom:jam-heading", kicker: "Look cards", title: "Dial, keypad, radio", accent: "living"},
      ["third", {type: "custom:jam-dial", entity: "light.lc_living"}],
      ["third", {type: "custom:jam-keypad", title: "Living room", current_entity: "input_select.lc_scene", keys: [
        {entity: "scene.lc_normal"}, {entity: "scene.lc_movie"}, {entity: "scene.lc_vibes"},
        {entity: "scene.lc_spooky"}, {entity: "scene.lc_dinner"}, {entity: "script.lc_read"},
        {entity: "scene.lc_night", accent: "ochre"}],
        all_on: {action: "perform-action", perform_action: "light.turn_on", target: {area_id: "living_room"}},
        all_off: {action: "perform-action", perform_action: "light.turn_off", target: {area_id: "living_room"}}}],
      ["third", {type: "custom:jam-radio", entity: "media_player.lc_kitchen", accent: "teal"}],
      ["third", {type: "custom:jam-dial", entity: "light.lc_desk", name: "Desk", kicker: "Study", accent: "blue"}],
      ["third", {type: "custom:jam-keypad", title: "Hall", accent: "pink", keys: [
        {entity: "scene.lc_normal", accent: "teal"}, {entity: "scene.lc_vibes", accent: "violet"}, {entity: "button.lc_doorbell", name: "Ring", accent: "blue"},
        {entity: "scene.lc_gone", name: "Gone"}, {name: "Tea", accent: "pink", tap_action: {action: "perform-action", perform_action: "script.turn_on", target: {entity_id: "script.lc_read"}}}]}],
      ["third", {type: "custom:jam-radio", entity: "media_player.lc_den", name: "Den"}],
      ["third", {type: "custom:jam-dial", entity: "light.lc_plug", show_swatches: false}],
      ["third", {type: "custom:jam-dial", entity: "light.lc_hall"}],
      ["third", {type: "custom:jam-radio", entity: "media_player.lc_garage", name: "Garage"}],
    ]],
  ],
});
}
