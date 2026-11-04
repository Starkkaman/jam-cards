// Preview fixture: jam-results (Olympia look card, renders in every look). Own rs_* entities: inside temperature, energy
// today, a word state (air "Good"), humidity, CO2 over its threshold, a long word and a sensor missing from the states (no unavailable state: jam-alerts counts those); error paths
// in a section .errors. Checks: preview/checks/99-results.js.
{
const {st} = jamPreview;
jamPreview.add({
  states: [
    st("sensor.rs_inside", "66.24", {friendly_name: "Inside", unit_of_measurement: "°F", device_class: "temperature"}),
    st("sensor.rs_energy_today", "8.43", {friendly_name: "Energy today", unit_of_measurement: "kWh", device_class: "energy"}),
    st("sensor.rs_air", "Good", {friendly_name: "Air quality"}),
    st("sensor.rs_humidity", "57.6", {friendly_name: "Humidity", unit_of_measurement: "%", device_class: "humidity"}),
    st("sensor.rs_co2", "1240", {friendly_name: "Office CO2", unit_of_measurement: "ppm", device_class: "carbon_dioxide"}),
    st("sensor.rs_washer", "Spinning", {friendly_name: "Washer"}),
  ],
  sections: [
    ["", [
      {type: "custom:jam-results", items: [
        {entity: "sensor.rs_inside", name: "inside", color: "pink"},
        {entity: "sensor.rs_energy_today", name: "energy today"},
        {entity: "sensor.rs_air", name: "air", color: "green"}]},
    ]],
    ["", [
      {type: "custom:jam-results", columns: 2, items: [
        "sensor.rs_humidity",
        {entity: "sensor.rs_co2", name: "CO2", color: "teal", thresholds: [{above: 1000, color: "red"}, {below: 600, color: "green"}]},
        {entity: "sensor.rs_washer", color: "violet"},
        {entity: "sensor.rs_outside", name: "Outside"}]},
    ]],
    ["errors", [
      ["half", {type: "custom:jam-results", items: ["sensor.rs_missing", {entity: "sensor.rs_gone", name: "Err results"}]}],
    ]],
  ],
});
}
