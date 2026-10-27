// Preview fixture: control-room cards — jam-panel (NAS, Network, Serenity, Downloads & batteries) + jam-alerts.
// Entity ids, names and units follow the real HA (read-only lookup 2026-10-27); values are the blueprint's healthy-day
// numbers (the real router and Serenity were offline at lookup time). Serenity power is unavailable on purpose (red row);
// note it overrides the 40-data state of sensor.serenity_current_consumption. sensor.truenas_datasets_nas_effect comes from 20-buttons.
{ // block scope: every fixture file may declare its own st
const {st} = jamPreview;
const now = Date.now(), day0 = new Date(new Date().setHours(0, 0, 0, 0)).getTime();
/* An ISO time `min` minutes ago, kept inside today when the offset is small (stable "today" rows). */
const ago = (min, today) => new Date(today ? Math.max(now - min * 60e3, day0 + 60e3) : now - min * 60e3).toISOString();
const A = (name, last, state = "on") => ({friendly_name: name, last_triggered: last, mode: "single", current: 0, id: name.toLowerCase().replace(/\W+/g, "_")});
const pct = (friendly_name, extra) => ({friendly_name, unit_of_measurement: "%", state_class: "measurement", ...extra});
const bat = n => pct(n, {device_class: "battery"});
jamPreview.add({
  states: [
    st("sensor.truenas_system_cpu_usage", "12.4", pct("System CPU usage")),
    st("sensor.truenas_system_temperature", "48.25", {friendly_name: "System Temperature", unit_of_measurement: "°C", device_class: "temperature"}),
    st("sensor.truenas_system_enp5s0_rx", "248.7", {friendly_name: "System enp5s0 RX", unit_of_measurement: "Mbit/s", device_class: "data_rate"}),
    st("sensor.truenas_system_enp5s0_tx", "16.2", {friendly_name: "System enp5s0 TX", unit_of_measurement: "Mbit/s", device_class: "data_rate"}),
    st("sensor.dream_router_state", "connected", {friendly_name: "The Bungalow State", device_class: "enum"}),
    st("sensor.dream_router_cpu_utilization", "9.1", pct("The Bungalow CPU utilization")),
    st("sensor.dream_router_memory_utilization", "61.3", pct("The Bungalow Memory utilization")),
    st("sensor.dream_router_uptime", new Date(now - (12 * 86400 + 4 * 3600 + 120) * 1000).toISOString(), {friendly_name: "The Bungalow Uptime", device_class: "timestamp"}),
    st("sensor.serenity_sessionstate", "Unlocked", {friendly_name: "SERENITY State"}),
    st("sensor.serenity_cpuload", "14", pct("SERENITY cpu")),
    st("sensor.serenity_gpuload", "3", pct("SERENITY gpu")),
    st("sensor.serenity_current_consumption", "unavailable", {friendly_name: "Serenity Current consumption", unit_of_measurement: "W", device_class: "power"}),
    st("sensor.downloader_speed", "0.0", {friendly_name: "Downloader Speed", unit_of_measurement: "MB/s", device_class: "data_rate"}),
    st("sensor.downloader_status", "Idle", {friendly_name: "Downloader Status"}),
    st("sensor.kitchen_sensor_battery", "18", bat("Kitchen Sensor Battery")),
    st("sensor.front_door_button_battery", "80.5", bat("Front Door Button Battery")),
    st("sensor.bedroom_sensor_battery", "15", bat("Bedroom Sensor Battery")),
    // Automations (real ids/names; times relative to now so the preview always has a "today" row).
    st("automation.dim_kiosks_for_tv_at_night", "on", A("Dim kiosks for TV at night", ago(35, true))),
    st("automation.auto_lock_just_in_case", "on", A("Auto Lock when someone leaves", ago(190, true))),
    st("automation.audio_restore_on_tv_power", "on", A("Audio restore on TV power", ago(26 * 60))),
    st("automation.front_door_button_toggle", "on", A("Front Door Button Toggle", ago(11 * 1440 + 300))),
    st("automation.air_quality_alert", "off", A("Air quality alert", ago(86 * 1440))),
    st("automation.charge_ipad", "on", A("Kiosk Charger On", ago(130 * 1440))),
    st("automation.humidifier_full", "on", A("Humidifier Full", null)),
    // Watched: lock.front_door (healthy, from 10-house) + one unavailable.
    st("sensor.stove_lights_power", "unavailable", {friendly_name: "Stove lights"}),
    // Excluded from the unavailable count (domains update/button/scene/event).
    st("update.dream_router", "unavailable", {friendly_name: "The Bungalow Firmware"}),
    st("button.serenity_sleep", "unavailable", {friendly_name: "SERENITY Sleep"}),
  ],
  sections: [
    ["wide", [
      ["half", {type: "custom:jam-panel", title: "NAS", accent: "nerd", rows: [
        {entity: "sensor.truenas_system_cpu_usage", name: "CPU", format: "pct", bad: {above: 90}},
        {entity: "sensor.truenas_system_temperature", name: "Temp", format: "temp", bad: {above: 70}},
        {entity: "sensor.truenas_datasets_nas_effect", name: "NAS_Effect", max: 47.8, bad: {above: 46.5}},
        {entity: "sensor.truenas_system_enp5s0_rx", name: "Network in", format: "bytes_rate"},
        {entity: "sensor.truenas_system_enp5s0_tx", name: "Network out", format: "bytes_rate"},
      ]}],
      ["half", {type: "custom:jam-panel", title: "Network", rows: [
        {entity: "sensor.dream_router_state", name: "Router", bad: {state: ["disconnected", "offline"]}},
        {entity: "sensor.dream_router_cpu_utilization", name: "CPU", format: "pct", bad: {above: 90}},
        {entity: "sensor.dream_router_memory_utilization", name: "Memory", format: "pct", bad: {above: 90}},
        {entity: "sensor.dream_router_uptime", name: "Uptime", format: "duration"},
      ]}],
      ["half", {type: "custom:jam-panel", title: "Serenity", rows: [
        {entity: "sensor.serenity_sessionstate", name: "Session"},
        {entity: "sensor.serenity_cpuload", name: "CPU", format: "pct"},
        {entity: "sensor.serenity_gpuload", name: "GPU", format: "pct"},
        {entity: "sensor.serenity_current_consumption", name: "Power"},
      ]}],
      ["half", {type: "custom:jam-panel", title: "Downloads & batteries", rows: [
        {entity: "sensor.downloader_status", name: "SABnzbd"},
        {entity: "sensor.downloader_speed", name: "Speed", format: "bytes_rate"},
        {entity: "sensor.kitchen_sensor_battery", name: "Kitchen sensor", format: "pct", bad: {below: 20}},
        {entity: "sensor.front_door_button_battery", name: "Front door button", format: "pct", bad: {below: 20}},
        {entity: "sensor.bedroom_sensor_battery", name: "Bedroom sensor", format: "pct", bad: {below: 20}},
      ]}],
      {type: "custom:jam-alerts", automations: ["automation.charge_ipad", "automation.auto_lock_just_in_case", "automation.air_quality_alert",
        "automation.dim_kiosks_for_tv_at_night", "automation.front_door_button_toggle", "automation.audio_restore_on_tv_power"],
        watch: ["lock.front_door", "sensor.stove_lights_power"]},
    ]],
  ],
});
}
