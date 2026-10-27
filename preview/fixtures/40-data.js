// Preview fixture: data cards — jam-graph (single line, multi-series, bars) + jam-weather (clock + daily, twice_daily).
// Entities, units and value ranges follow the real HA (read-only lookup 2026-10-26); the series are synthetic.
// Installs a fake hass.callWS (history/history_during_period) and hass.connection.subscribeMessage
// (weather/subscribe_forecast) onto window.__hass when index.html sets it. Both are deterministic (seeded by entity id,
// shaped by position in the requested window, not by wall-clock time) so screenshots are stable.
// Recorded for checks: window.__ws (callWS messages), window.__wsSubs ([{msg, active}]).
{ // block scope: every fixture file may declare its own st
const {st} = jamPreview;
const J = window.JamCards;
const T = friendly_name => ({friendly_name, unit_of_measurement: "°F", device_class: "temperature", state_class: "measurement"});
/* Shape per entity: base °F/W, day swing, noise, mean sample interval (s). The last value is pinned to the state. */
const SERIES = {
  "sensor.home_temperature": {now: 73.4, swing: 2.6, noise: .08, every: 170},
  "sensor.living_room_sensor_temperature": {now: 73.22, swing: 2.2, noise: .1, every: 540},
  "sensor.bedroom_sensor_temperature": {now: 72.248, swing: 1.6, noise: .08, every: 600, lag: .06},
  "sensor.office_sensor_temperature": {now: 79.556, swing: 4, noise: .12, every: 520, lag: -.04},
  "sensor.kitchen_sensor_temperature": {now: 73.49, swing: 2.4, noise: .25, every: 480, lag: .02, gap: [.52, .58]},
  "sensor.serenity_current_consumption": {now: 286, power: true, every: 30},
};
jamPreview.add({
  states: [
    st("sensor.home_temperature", "73.4", T("Home Temperature")),
    st("sensor.living_room_sensor_temperature", "73.22", T("Living Room Sensor Temperature")),
    st("sensor.bedroom_sensor_temperature", "72.248", T("Bedroom Sensor Temperature")),
    st("sensor.office_sensor_temperature", "79.556", T("Office Sensor Temperature")),
    st("sensor.kitchen_sensor_temperature", "73.49", T("Kitchen Sensor Temperature")),
    st("sensor.serenity_current_consumption", "286", {friendly_name: "Serenity Current consumption", unit_of_measurement: "W", device_class: "power", state_class: "measurement"}),
    st("weather.bungalo_weather", "clear-night", {friendly_name: "Bungalo Weather", temperature: 64, apparent_temperature: 64, dew_point: 55,
      temperature_unit: "°F", humidity: 72, cloud_coverage: 5, pressure: 30.06, pressure_unit: "inHg", wind_bearing: 311, wind_speed: 1.99,
      wind_speed_unit: "mph", precipitation_unit: "in", supported_features: 3}),
    st("weather.cabin_weather", "snowy", {friendly_name: "Cabin Weather", temperature: -2.4, temperature_unit: "°C", humidity: 91,
      wind_speed: 22, wind_speed_unit: "km/h", supported_features: 7}),
  ],
  sections: [
    ["wide", [
      {type: "custom:jam-graph", title: "Temperature", entities: [
        {entity: "sensor.home_temperature", name: "House"}, {entity: "sensor.living_room_sensor_temperature", name: "Living"},
        {entity: "sensor.bedroom_sensor_temperature", name: "Bedroom"}, {entity: "sensor.office_sensor_temperature", name: "Office"},
        {entity: "sensor.kitchen_sensor_temperature", name: "Kitchen"}]},
      {type: "custom:jam-graph", title: "Serenity power", entities: ["sensor.serenity_current_consumption"], style: "bars"},
    ]],
    ["", jamPreview.room("master", [
      {type: "custom:jam-weather", entity: "weather.bungalo_weather", clock: true},
      {type: "custom:jam-graph", entities: [{entity: "sensor.home_temperature", name: "House temperature"}], style: "step"},
    ])],
    ["", jamPreview.room("kitchen", [
      {type: "custom:jam-weather", entity: "weather.cabin_weather", forecast_type: "twice_daily", days: 6},
    ])],
  ],
});

/* ---- fake history: compressed rows {s, lu} like HA's minimal_response ---- */
function history(id, t0, t1) {
  const cfg = SERIES[id];
  if (!cfg) return [];
  const r = J.rng(J.seed("hist|" + id)), rows = [], span = t1 - t0;
  let walk = 0;
  for (let t = t0, i = 0; t <= t1; t += (cfg.every * (.4 + r() * 1.2)) * 1000, i++) {
    const f = (t - t0) / span;
    let v;
    if (cfg.power) { // idle desktop ~48 W, two gaming sessions ~300 W
      const on = (f > .30 && f < .41) || (f > .74 && f < .93) || f > .985;
      v = on ? 270 + r() * 70 : 44 + r() * 9;
    } else { // one day cycle across the window; ends near the current state
      walk = walk * .9 + (r() - .5) * cfg.noise * 3;
      v = cfg.swing * Math.sin(2 * Math.PI * (f + (cfg.lag || 0))) + walk;
    }
    const s = cfg.gap && f > cfg.gap[0] && f < cfg.gap[1] ? "unavailable" : null;
    rows.push({t, v, s});
  }
  const last = rows.filter(x => !x.s).pop(), shift = cfg.power ? 0 : cfg.now - last.v;
  if (cfg.power) last.v = cfg.now;
  return rows.map((x, i) => {
    const o = {s: x.s || String(+(x.v + shift).toFixed(cfg.power ? 1 : 3)), lu: x.t / 1000};
    if (i === 0) o.a = {};
    return o;
  });
}
/* ---- fake forecasts ---- */
function forecast(entity_id, type) {
  const d0 = new Date(); d0.setHours(12, 0, 0, 0);
  if (entity_id === "weather.bungalo_weather") {
    const c = ["sunny", "partlycloudy", "rainy", "lightning-rainy", "cloudy", "windy", "fog", "sunny"];
    const hi = [78, 74, 66, 63, 67, 70, 68, 75], lo = [57, 58, 55, 52, 53, 56, 57, 56];
    return c.map((condition, i) => ({datetime: new Date(+d0 + i * 864e5).toISOString(), condition, temperature: hi[i], templow: lo[i],
      precipitation: condition.includes("rain") ? 0.2 : 0, humidity: 60 + i * 3, wind_speed: 4 + i}));
  }
  if (entity_id === "weather.cabin_weather" && type === "twice_daily") {
    const c = ["snowy", "clear-night", "snowy-rainy", "hail", "pouring", "fog", "sunny", "clear-night"];
    const t = [-1, -9, 2, -3, 4, 0, 3, -6];
    return c.map((condition, i) => ({datetime: new Date(+d0 + i * 432e5).toISOString(), condition, is_daytime: i % 2 === 0,
      temperature: t[i], templow: t[i] - 4 - (i % 3)}));
  }
  return [];
}
function install(h) {
  if (!h || h.__jamData) return;
  h.__jamData = true;
  window.__ws = window.__ws || [];
  window.__wsSubs = window.__wsSubs || [];
  const prevWS = h.callWS;
  h.callWS = function (msg) {
    if (msg && msg.type === "history/history_during_period") {
      window.__ws.push(msg);
      const t0 = Date.parse(msg.start_time), t1 = msg.end_time ? Date.parse(msg.end_time) : Date.now(), out = {};
      for (const id of msg.entity_ids) { const rows = history(id, t0, t1); if (rows.length) out[id] = rows; }
      return new Promise(res => setTimeout(() => res(out), 30));
    }
    return prevWS ? prevWS.call(this, msg) : Promise.reject(new Error("unknown command " + (msg && msg.type)));
  };
  const conn = h.connection || (h.connection = {});
  const prevSub = conn.subscribeMessage;
  conn.subscribeMessage = function (cb, msg) {
    if (msg && msg.type === "weather/subscribe_forecast") {
      const sub = {msg, active: true};
      window.__wsSubs.push(sub);
      setTimeout(() => { if (sub.active) cb({type: msg.forecast_type, forecast: forecast(msg.entity_id, msg.forecast_type)}); }, 20);
      return Promise.resolve(() => { sub.active = false; return Promise.resolve(); });
    }
    return prevSub ? prevSub.call(this, cb, msg) : Promise.reject(new Error("unknown subscription " + (msg && msg.type)));
  };
}
/* index.html assigns window.__hass right before it creates the cards: hook that assignment (chaining any earlier hook). */
const prev = Object.getOwnPropertyDescriptor(window, "__hass");
let val = prev && "value" in prev ? prev.value : undefined;
if (val) install(val);
try {
  Object.defineProperty(window, "__hass", {configurable: true, enumerable: true,
    get() { return prev && prev.get ? prev.get.call(window) : val; },
    set(h) { if (prev && prev.set) prev.set.call(window, h); else val = h; install(h); }});
} catch (e) { console.warn("40-data: cannot hook window.__hass", e); }
}
