// Preview fixture: jam-kiosk (0.5.0) — the kiosk home screen "B · Poster + dock" with its own kh_* entities, so
// preview/checks/85-kiosk-home.js can drive the now-source order, dock states, sheet and action without touching other cards.
// On this page it sits in a full-width row (its height floors at 420px); the checks mount it alone at 1024x768 / 961x601.
{ // block scope: every fixture file may declare its own st
const {st} = jamPreview;
jamPreview.add({
  states: [
    st("media_player.kh_tv", "off", {friendly_name: "Kiosk TV", device_class: "tv", app_name: "com.spocky.projengmenu"}),
    st("sensor.kh_tv_app", "Jamfin", {friendly_name: "Kiosk TV app"}),
    st("media_player.kh_speaker", "idle", {friendly_name: "Kiosk speaker", media_title: "Saturn", media_artist: "The Olympians"}),
    st("weather.kh_weather", "cloudy", {friendly_name: "Kiosk weather", temperature: 51, temperature_unit: "°F", humidity: 63}),
    st("sensor.kh_inside", "66.2", {friendly_name: "Kiosk inside", unit_of_measurement: "°F", device_class: "temperature"}),
    st("light.kh_lamp", "on", {friendly_name: "Kiosk lamp", brightness: 190}),
    st("light.kh_ceiling", "on", {friendly_name: "Kiosk ceiling", brightness: 255}),
    st("light.kh_wled", "off", {friendly_name: "Kiosk WLED"}),
    st("switch.kh_tree", "on", {friendly_name: "Kiosk tree"}),
    st("sensor.kh_air_quality", "excellent", {friendly_name: "Kiosk air quality"}),
    st("lock.kh_door", "locked", {friendly_name: "Kiosk door"}),
  ],
  sections: [
    ["full", {type: "custom:jam-kiosk", accent: "living", inside_entity: "sensor.kh_inside",
      now: [
        {type: "media", entity: "media_player.kh_tv", states: ["playing", "paused"], kicker: "On the TV", app_entity: "sensor.kh_tv_app"},
        {type: "media", entity: "media_player.kh_speaker"},
        {type: "weather", entity: "weather.kh_weather"},
      ],
      dock: [
        {name: "Lights", accent: "living", kicker: "Living room", columns: 2,
          state: {count_on: ["light.kh_lamp", "light.kh_ceiling", "light.kh_wled", "switch.kh_tree"], suffix: "on"},
          cards: [
            {type: "custom:jam-light", entity: "light.kh_lamp", name: "Lamp"},
            {type: "custom:jam-light", entity: "light.kh_ceiling", name: "Ceiling"},
            {type: "custom:jam-tile", entity: "switch.kh_tree", name: "Tree"},
          ]},
        {name: "TV", accent: "teal", state: {entity: "media_player.kh_tv", app_entity: "sensor.kh_tv_app"},
          cards: [{type: "custom:jam-tile", entity: "media_player.kh_tv", name: "TV"}]},
        {name: "Music", accent: "violet", state: {entity: "media_player.kh_speaker"},
          cards: [{type: "custom:jam-speaker", entity: "media_player.kh_speaker", name: "Living room"}]},
        {name: "Air", accent: "none", state: {entity: "sensor.kh_air_quality"},
          cards: [{type: "custom:jam-tile", entity: "lock.kh_door", name: "Door"}]},
        {name: "All off", accent: "none", state: {text: "Lights"}, tap_action: {action: "perform-action", perform_action: "light.turn_off",
          target: {entity_id: ["light.kh_lamp", "light.kh_ceiling", "light.kh_wled"]}, confirmation: {text: "Turn off every light?"}}},
      ]}],
  ],
});
}
