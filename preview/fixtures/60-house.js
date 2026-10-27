// Preview fixture: landing strip — jam-house (full + compact kiosk), jam-tabs (four rooms), jam-scenes (living room).
{ // block scope: every fixture file may declare its own st
const {st} = jamPreview;
jamPreview.add({
  states: [
    st("sensor.home_temperature", "73.9", {friendly_name: "Home temperature", unit_of_measurement: "°F", device_class: "temperature"}),
    st("weather.bungalo_weather", "clear-night", {friendly_name: "Bungalo weather", temperature: 63, temperature_unit: "°F"}),
    st("lock.level_bolt_matter", "unlocked", {friendly_name: "Level Bolt"}),
    st("person.isaac", "home", {friendly_name: "Isaac"}),
    st("person.amber", "not_home", {friendly_name: "Amber"}),
    st("person.marissa", "home", {friendly_name: "Marissa"}),
    st("person.nick", "home", {friendly_name: "Nick"}),
    // scene.normal/movie_time/vibes/spring_vibes come from 20-buttons.js, input_select.light_scenes ("Movie Time") from 30-light.js.
    st("binary_sensor.washer_leak", "on", {friendly_name: "Washer leak", device_class: "moisture"}),
  ],
  sections: [
    ["full", [
      {type: "custom:jam-house", title: "The Bungalow", inside_entity: "sensor.home_temperature", outside_entity: "weather.bungalo_weather",
        lock_entity: "lock.level_bolt_matter", people: ["person.isaac", "person.amber", "person.marissa", "person.nick"]},
      {type: "custom:jam-tabs", tabs: [
        {name: "Living", path: "/jam-overview/living", accent: "living"},
        {name: "Kitchen", path: "/jam-overview/kitchen", accent: "kitchen"},
        {name: "Master", path: "/jam-overview/master", accent: "master"},
        {name: "Marissa", path: "/jam-overview/marissa", accent: "marissa"}]},
      {type: "custom:jam-scenes", accent: "living", current_entity: "input_select.light_scenes", scenes: [
        {entity: "scene.normal", data: {transition: 2}}, {entity: "scene.movie_time", data: {transition: 2}},
        {entity: "scene.vibes", data: {transition: 2}}, {entity: "scene.spring_vibes", data: {transition: 2}}]},
      {type: "custom:jam-house", compact: true, kicker: "Kitchen kiosk · inside", inside_entity: "sensor.home_temperature",
        outside_entity: "weather.bungalo_weather", lock_entity: "lock.level_bolt_matter", people: ["person.isaac", "person.amber"],
        alerts: [{entity: "binary_sensor.washer_leak", state: "on", name: "Washer leak"}]},
    ]],
  ],
});
}
