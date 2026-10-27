// Preview fixture: states merged into hass.states, sections appended to the view (file-name order).
{ // block scope: every fixture file may declare its own st
const {st} = jamPreview;
jamPreview.add({
  states: [
    st("lock.front_door", "locked", {friendly_name: "Front door"}),
    st("lock.back_door", "jammed", {friendly_name: "Back door"}),
    st("input_button.doorbell_test", "2026-10-26T17:02:00+00:00", {friendly_name: "Doorbell test"}),
    st("fan.bedroom", "on", {friendly_name: "Bedroom fan", percentage: 40, percentage_step: 1}),
    st("light.reading_lamp", "on", {friendly_name: "Reading lamp", brightness: 128}),
  ],
  sections: [
    ["", jamPreview.room("marissa", [
      {type: "custom:jam-heading", kicker: "House", title: "Doors & air"},
      ["half", {type: "custom:jam-tile", entity: "lock.front_door"}],
      ["half", {type: "custom:jam-tile", entity: "lock.back_door"}],
      {type: "custom:jam-tile", entity: "input_button.doorbell_test", label: "Ring"},
      {type: "custom:jam-tile", entity: "light.reading_lamp", name: "Lamp (hold = full, double = toggle)",
        hold_action: {action: "perform-action", perform_action: "light.turn_on", data: {entity_id: "light.reading_lamp", brightness_pct: 100}},
        double_tap_action: {action: "toggle", confirmation: {text: "Toggle the lamp?"}}},
      {type: "custom:jam-slider", entity: "fan.bedroom", name: "Fan speed"},
    ])],
  ],
});
}
