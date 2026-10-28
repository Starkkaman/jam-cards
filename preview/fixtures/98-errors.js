// Preview fixture: error paths (0.3.8). Every card type once against missing / unavailable / unknown entities, bare state
// objects without the usual attributes, empty lists and a playing player with null media_title. Nothing may throw; each card
// shows its own unavailable look. Checks: preview/checks/98-errors.js (the section has class "errors").
{ // block scope: every fixture file may declare its own st
const {st} = jamPreview;
const M = "sensor.err_missing"; // never in states
jamPreview.add({
  states: [
    st("sensor.err_unknown", "unknown", {friendly_name: "Err unknown"}),
    st("sensor.err_unavail", "unavailable", {}),
    st("media_player.err_unavail", "unavailable", {friendly_name: "Err unavailable player"}),
    st("light.err_bare", "on", {}), // no brightness, colour modes or friendly_name
    st("media_player.err_null", "playing", {friendly_name: "Err player", media_title: null, media_artist: null, entity_picture: null,
      source_list: null, group_members: null, volume_level: null, supported_features: 0}),
    st("weather.err_bare", "sunny", {}),
    st("fan.err_bare", "on", {}),
    st("select.err_empty", "unknown", {friendly_name: "Err select", options: []}),
    st("remote.err_unknown", "unknown", {}),
    st("scene.err_unknown", "unknown", {}),
  ],
  sections: [
    ["errors", [
      {type: "custom:jam-heading", kicker: "Preview", title: "Error paths", entities: [M, "sensor.err_unknown", "sensor.err_unavail"]},
      {type: "custom:jam-hero", title: "Err hero", title_entity: M, meta_entities: [M, "sensor.err_unknown"], chips: [{entity: M, name: "Gone"}, null]},
      ["half", {type: "custom:jam-tile", entity: M, name: "Err tile missing"}],
      ["half", {type: "custom:jam-tile", entity: "sensor.err_unavail", name: "Err tile unavailable"}],
      ["half", {type: "custom:jam-button", entity: "switch.err_missing", name: "Err key"}],
      ["half", {type: "custom:jam-gauge", entity: "sensor.err_unknown", name: "Err gauge"}],
      {type: "custom:jam-choice", entity: "select.err_empty"},
      {type: "custom:jam-slider", entity: "number.err_missing", name: "Err slider"},
      {type: "custom:jam-list", title: "Err list", entities: [M, "sensor.err_unknown", {entity: "switch.err_missing", secondary_info: "last-changed"}]},
      ["half", {type: "custom:jam-light", entity: "light.err_missing", name: "Err light gone"}],
      ["half", {type: "custom:jam-light", entity: "light.err_bare", name: "Err light bare"}],
      {type: "custom:jam-media", entity: "media_player.err_null", sources: true, group: ["media_player.err_missing"], players: ["media_player.err_missing"]},
      {type: "custom:jam-media", entity: "media_player.err_missing", name: "Err media gone", compact: true},
      {type: "custom:jam-media", entity: "media_player.err_unavail", show_volume: true},
      {type: "custom:jam-graph", title: "Err graph", entities: [M]},
      {type: "custom:jam-weather", entity: "weather.err_bare", clock: false},
      {type: "custom:jam-weather", entity: "weather.err_missing"},
      {type: "custom:jam-remote", entity: "remote.err_unknown", media_player: "media_player.err_missing", name: "Err remote"},
      {type: "custom:jam-tv", media_player: "media_player.err_null", name: "Err TV", remote: "remote.err_unknown", current_app_entity: M, input_entity: M,
        sources: [{name: "Err source", match: {app: "x"}}]},
      {type: "custom:jam-tv", media_player: "media_player.err_missing", name: "Err TV gone"},
      {type: "custom:jam-speaker", entity: "media_player.err_null", name: "Err speaker", speakers: ["media_player.err_missing"]},
      {type: "custom:jam-speaker", entity: "media_player.err_unavail", name: "Err speaker unavailable"},
      ["half", {type: "custom:jam-fan", entity: "fan.err_bare", name: "Err fan bare", sensor: M}],
      ["half", {type: "custom:jam-fan", entity: "fan.err_missing", name: "Err fan gone"}],
      {type: "custom:jam-house", title: "Err house", inside_entity: M, outside_entity: "weather.err_bare", lock_entity: "lock.err_missing",
        people: ["person.err_missing"], alerts: [{entity: M, name: "Gone"}], inside_aq: M},
      {type: "custom:jam-scenes", scenes: [{entity: "scene.err_unknown", name: "Err scene"}, {entity: "scene.err_missing", name: "Err scene gone"}]},
      ["half", {type: "custom:jam-panel", title: "Err panel", rows: [{entity: M, name: "Gone"}, {entity: "sensor.err_unknown", attribute: "nope", name: "No attr"}]}],
      ["half", {type: "custom:jam-alerts", title: "Err alerts", automations: ["automation.err_missing"], watch: [M], show_unavailable_count: false}],
    ]],
  ],
});
}
