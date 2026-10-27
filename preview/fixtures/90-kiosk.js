// Preview fixture: kitchen kiosk — jam-weather with the huge clock, a jam-button, and two jam-screensavers (poster + images).
// Both screensavers are held off by input_boolean.jam_preview_hold (disable_on) so they never cover the page during the
// shots/other checks; preview/checks/90-kiosk.js releases them one at a time. idle_seconds 2 is for the test only.
{ // block scope: every fixture file may declare its own st
const {st} = jamPreview;
jamPreview.add({
  states: [
    st("input_boolean.jam_preview_hold", "on", {friendly_name: "Preview: hold screensaver"}),
    st("input_boolean.jam_preview_hold_images", "on", {friendly_name: "Preview: hold slideshow"}),
    st("script.kitchen_kiosk_test", "off", {friendly_name: "Kiosk test key"}),
  ],
  sections: [
    ["", jamPreview.room("kitchen", [
      {type: "custom:jam-heading", kicker: "Kiosk", title: "Kitchen"},
      {type: "custom:jam-weather", entity: "weather.bungalo_weather", clock: true, clock_size: "huge", show_forecast: false},
      {type: "custom:jam-button", entity: "script.kitchen_kiosk_test", name: "Kiosk test key",
        tap_action: {action: "perform-action", perform_action: "script.kitchen_kiosk_test"}},
      {type: "custom:jam-screensaver", idle_seconds: 2, kicker: "The Bungalow · kitchen", weather_entity: "weather.bungalo_weather",
        disable_on: {entity: "input_boolean.jam_preview_hold", state: "on"}},
      {type: "custom:jam-screensaver", idle_seconds: 2, mode: "images", weather_entity: "weather.bungalo_weather",
        images: {index: "fixtures/slides/index.json", interval: 2}, poster_every: 3,
        disable_on: {entity: "input_boolean.jam_preview_hold_images", state: "on"}},
    ])],
  ],
});
}
