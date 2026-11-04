// Preview fixture: jam-pictogram (Olympia look card, renders in every look). Own pg_* entities: a living room with a light
// group (4 of 5 on), a TV playing YouTube (rule -> the watching figure) and a temperature; kitchen, bedroom, music room,
// garage, garden (off) and a non-interactive office tile; error paths (offline) in a section .errors. Checks: preview/checks/99-pictogram.js.
{
const {st} = jamPreview;
const L = (id, state) => st("light.pg_" + id, state, {friendly_name: id.replace(/_/g, " ")});
const T = (id, v, name) => st("sensor.pg_" + id, v, {friendly_name: name, unit_of_measurement: "°F", device_class: "temperature"});
jamPreview.add({
  states: [
    L("floor", "on"), L("ceiling", "on"), L("reading", "on"), L("shelf", "on"), L("strip", "off"),
    st("light.pg_living", "on", {friendly_name: "Living Room Lights", entity_id: ["light.pg_floor", "light.pg_ceiling", "light.pg_reading", "light.pg_shelf", "light.pg_strip"]}),
    st("media_player.pg_tv", "playing", {friendly_name: "Living Room TV", app_name: "YouTube", media_title: "Olympic rowing final"}),
    T("living_temp", "66.2", "Living Room Temperature"),
    L("counter", "on"), L("stove", "off"), L("pendant", "on"),
    T("kitchen_temp", "68.4", "Kitchen Temperature"),
    L("bedside", "off"), L("closet", "off"),
    T("bedroom_temp", "64.9", "Bedroom Temperature"),
    st("media_player.pg_speaker", "idle", {friendly_name: "Music Room Speaker"}),
    st("binary_sensor.pg_garage_door", "off", {friendly_name: "Garage Door", device_class: "garage_door"}),
    st("cover.pg_garage", "closed", {friendly_name: "Garage Door"}),
    L("garage", "on"), L("garden_path", "off"),
    T("garden_temp", "51.8", "Garden Temperature"),
  ],
  sections: [
    ["", [
      {type: "custom:jam-pictogram", name: "Living room", pictogram: "sofa-tv", accent: "living", entity: "light.pg_living",
        rules: [{entity: "media_player.pg_tv", state: "playing", pictogram: "watch"}],
        facts: [{entity: "light.pg_living", name: "lights on"}, {entity: "media_player.pg_tv", name: "tv"}, {entity: "sensor.pg_living_temp", name: "inside"}],
        tap_action: {action: "navigate", navigation_path: "#pg-living"}},
    ]],
    ["", [
      ["half", {type: "custom:jam-pictogram", name: "Kitchen", pictogram: "cook", accent: "kitchen",
        facts: [{entities: ["light.pg_counter", "light.pg_stove", "light.pg_pendant"], name: "lights on"}, {entity: "sensor.pg_kitchen_temp", name: "inside"}],
        tap_action: {action: "navigate", navigation_path: "#pg-kitchen"}}],
      ["half", {type: "custom:jam-pictogram", name: "Bedroom", pictogram: "sleep", accent: "master",
        facts: [{entities: ["light.pg_bedside", "light.pg_closet"], name: "lights on"}, {entity: "sensor.pg_bedroom_temp", name: "inside"},
          {entity: "media_player.pg_speaker", name: "speaker"}],
        tap_action: {action: "navigate", navigation_path: "#pg-bedroom"}}],
      ["half", {type: "custom:jam-pictogram", name: "Music room", pictogram: "music", accent: "music", entity: "media_player.pg_speaker",
        facts: [{entity: "media_player.pg_speaker", name: "speaker"}]}],
      ["half", {type: "custom:jam-pictogram", name: "Garage", pictogram: "garage", accent: "nerd", entity: "cover.pg_garage",
        facts: [{entity: "cover.pg_garage", name: "door"}, {entities: ["light.pg_garage"], name: "light on"}]}],
      ["half", {type: "custom:jam-pictogram", name: "Garden", pictogram: "garden", accent: "green",
        facts: [{entities: ["light.pg_garden_path"], name: "path lights"}, {entity: "sensor.pg_garden_temp", name: "outside"}],
        tap_action: {action: "navigate", navigation_path: "#pg-garden"}}],
      {type: "custom:jam-pictogram", name: "Office", pictogram: "work-desk", accent: "pink",
        facts: [{entities: ["light.pg_reading"], name: "lamp on"}, {entity: "sensor.pg_living_temp", name: "inside"}]},
    ]],
    ["errors", [
      ["half", {type: "custom:jam-pictogram", name: "Err pictogram", pictogram: "bath", entity: "light.pg_missing",
        rules: [{entity: "media_player.pg_missing", pictogram: "watch"}], facts: ["sensor.pg_missing", {entity: "light.pg_missing_group", name: "lights on"}]}],
    ]],
  ],
});
}
