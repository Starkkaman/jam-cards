// Buttons, gauges, list fixture (real entity ids/values from the user's HA, 2026-10-26).
{ // block scope: every fixture file may declare its own st
const {st} = jamPreview;
// Preview-only grid helper: a 4-up row (HA sections give jam-button columns: 3 of 12).
const q = document.createElement("style"); q.textContent = ".sec > .q{grid-column:span 3}"; document.head.append(q);
const launch = (entity, name, icon, color, auto) => ({type: "custom:jam-button", entity, name, icon, color,
  tap_action: {action: "perform-action", perform_action: "automation.trigger", target: {entity_id: [auto]}, data: {skip_condition: true}}});
jamPreview.add({
  states: [
    st("input_button.jellyfin_button", "2026-05-08T01:18:47+00:00", {friendly_name: "Launch Jellyfin", icon: "mdi:jellyfish"}),
    st("input_button.launch_youtube", "2025-11-13T05:25:40+00:00", {friendly_name: "Launch YouTube", icon: "mdi:youtube"}),
    st("input_button.switch", "2026-02-06T03:07:19+00:00", {friendly_name: "Switch", icon: "mdi:nintendo-switch"}),
    st("input_button.batocera_input", "2026-05-08T06:17:18+00:00", {friendly_name: "Batocera Input", icon: "mdi:nintendo-game-boy"}),
    st("light.living_room", "on", {friendly_name: "Living Room", brightness: 192}),
    st("switch.dehumidifier", "on", {friendly_name: "Dehumidifier"}),
    st("scene.normal", "2026-10-22T02:10:23+00:00", {friendly_name: "Normal", icon: "mdi:lightbulb"}),
    st("scene.movie_time", "2026-10-26T04:53:11+00:00", {friendly_name: "Movie Time", icon: "mdi:netflix"}),
    st("scene.vibes", "2026-10-25T01:20:24+00:00", {friendly_name: "Vibes", icon: "mdi:emoticon-cool"}),
    st("scene.spring_vibes", "2026-08-28T15:19:36+00:00", {friendly_name: "Spring Vibes", icon: "mdi:flower"}),
    st("sensor.dehumidifier_current_consumption", "111.4", {friendly_name: "Dehumidifier Current consumption", unit_of_measurement: "W", device_class: "power"}),
    st("sensor.truenas_datasets_nas_effect", "45.002797206576", {friendly_name: "Datasets NAS_Effect", unit_of_measurement: "TB", device_class: "data_size"}),
    st("sensor.system_monitor_last_boot", "2026-08-23T04:17:28+00:00", {friendly_name: "System Monitor Uptime", device_class: "timestamp"}),
    st("sensor.system_monitor_processor_use", "9", {friendly_name: "System Monitor Processor use", unit_of_measurement: "%"}),
    st("sensor.system_monitor_memory_usage", "48.2", {friendly_name: "System Monitor Memory usage", unit_of_measurement: "%"}),
    st("device_tracker.smol_boi", "home", {friendly_name: "Smol Boi"}),
  ],
  sections: [
    ["", [
      {type: "custom:jam-heading", kicker: "Living room", title: "Launch"},
      ["q", launch("input_button.jellyfin_button", "Jellyfin", "mdi:jellyfish", "purple", "automation.launch_jellyfin")],
      ["q", launch("input_button.launch_youtube", "Youtube", "mdi:youtube", "red", "automation.launch_youtube")],
      ["q", launch("input_button.switch", "Switch", "mdi:nintendo-switch", "blue", "automation.nintendo_input")],
      ["q", launch("input_button.batocera_input", "Batocera", "mdi:nintendo-game-boy", "green", "automation.batocera_input")],
      ["half", {type: "custom:jam-button", entity: "light.living_room", name: "Lights", icon: "mdi:lightbulb-group", size: "big",
        tap_action: {action: "navigate", navigation_path: "#livingroom-popup"}}],
      ["half", {type: "custom:jam-button", entity: "switch.dehumidifier", show_state: true, size: "big"}],
      ["q", {type: "custom:jam-button", entity: "scene.normal", color: "grey"}],
      ["q", {type: "custom:jam-button", entity: "scene.movie_time", accent: "red"}],
      ["q", {type: "custom:jam-button", entity: "scene.vibes", accent: "teal"}],
      ["q", {type: "custom:jam-button", entity: "scene.spring_vibes", accent: "paper"}],
    ]],
    ["", [
      {type: "custom:jam-heading", kicker: "Readings", title: "Gauges"},
      ["half", {type: "custom:jam-gauge", entity: "sensor.dehumidifier_current_consumption", name: "Dehumidifier", max: 100,
        severity: {green: 0, yellow: 25, red: 50}}],
      ["half", {type: "custom:jam-gauge", entity: "sensor.truenas_datasets_nas_effect", name: "NAS_Effect", max: 47.8, unit: "TB", style: "bar"}],
      ["list", {type: "custom:jam-list", title: "Smol Boi", entities: [
        "device_tracker.smol_boi",
        {entity: "sensor.system_monitor_last_boot", name: "Last boot"},
        {entity: "sensor.system_monitor_processor_use", name: "Processor"},
        {entity: "sensor.system_monitor_memory_usage", name: "Memory", secondary_info: "last-changed"},
        {entity: "switch.dehumidifier", name: "Dehumidifier"},
      ]}],
    ]],
  ],
});
}
