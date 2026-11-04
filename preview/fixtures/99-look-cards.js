// Preview fixture: the look cards of 2026-11-03 (night plan §3): jam-linemap (Transit), jam-arrivals (Transit), jam-matrix
// (Grid), jam-ridge (Pulsar), jam-sticker (New Wave). Own mc_* entities (synthetic, house-like names). Installs a fake
// hass.callApi (GET calendars/<id>?start&end; events placed relative to now) and chains a fake history/history_during_period
// for the mc_* sensors onto hass.callWS (deterministic: seeded by entity id, shaped by position in the window).
// No state is "unavailable" (unknown instead): jam-alerts counts every unavailable entity of the page, and its Poster shot
// must stay pixel-identical.
// Recorded for checks: window.__api (callApi paths), window.__ws (callWS messages, shared with 40-data).
// Checks: preview/checks/99-look-cards.js.
{ // block scope: every fixture file may declare its own st
const {st} = jamPreview;
const J = window.JamCards;
const L = (name, state, extra) => st("light." + name[0], state, {friendly_name: name[1], supported_color_modes: ["brightness"], ...(extra || {})});
const T = (id, name, v, unit = "°F", dc = "temperature") => st(id, v, {friendly_name: name, unit_of_measurement: unit, device_class: dc, state_class: "measurement"});
jamPreview.add({
  states: [
    L(["mc_floor", "Floor lamp"], "on", {brightness: 180}), L(["mc_sofa", "Sofa lights"], "off"), L(["mc_ceiling", "Ceiling"], "on", {brightness: 255}),
    L(["mc_island", "Island"], "off"), L(["mc_pendant", "Pendants"], "unknown"), L(["mc_cabinet", "Under cabinet"], "on", {brightness: 90}),
    L(["mc_bed", "Bed lamp"], "off"), L(["mc_reading", "Reading light"], "on", {brightness: 120}),
    st("switch.mc_hall", "on", {friendly_name: "Hallway"}), st("switch.mc_kettle", "off", {friendly_name: "Kettle"}),
    st("switch.mc_coffee", "on", {friendly_name: "Coffee maker"}), st("fan.mc_fan", "on", {friendly_name: "Ceiling fan", percentage: 50}),
    st("media_player.mc_tv", "off", {friendly_name: "Living TV"}),
    L(["mc_porch", "Porch light"], "off"), st("switch.mc_sprinkler", "off", {friendly_name: "Sprinkler"}),
    T("sensor.mc_living_temp", "Living temperature", "72.4"),
    st("binary_sensor.mc_leak", "on", {friendly_name: "Sink leak", device_class: "moisture"}),
    st("sensor.mc_battery", "12", {friendly_name: "Front door battery", unit_of_measurement: "%", device_class: "battery"}),
    st("media_player.mc_kitchen_speaker", "playing", {friendly_name: "Kitchen speaker", media_title: "Saturn", media_artist: "Sleeping at Last"}),
    st("calendar.mc_family", "off", {friendly_name: "Family", message: "Dinner with Amber", all_day: false,
      start_time: "2026-10-28 19:00:00", end_time: "2026-10-28 20:30:00"}),
    st("calendar.mc_school", "off", {friendly_name: "School"}),
    st("sensor.mc_washer", "Rinse", {friendly_name: "Washer"}), st("sensor.mc_dryer", "Idle", {friendly_name: "Dryer"}),
    st("lock.mc_front", "locked", {friendly_name: "Front door"}),
    T("sensor.mc_t_living", "Living room", "72.4"), T("sensor.mc_t_kitchen", "Kitchen", "73.1"), T("sensor.mc_t_bedroom", "Bedroom", "70.2"),
    T("sensor.mc_t_office", "Office", "76.8"), T("sensor.mc_t_outside", "Outside", "58.6"),
    T("sensor.mc_humidity", "Humidity", "44", "%", "humidity"), T("sensor.mc_power", "House power", "1240", "W", "power"),
    st("sensor.mc_t_garage", "unknown", {friendly_name: "Garage", unit_of_measurement: "°F"}),
    st("sensor.mc_dishwasher", "done", {friendly_name: "Dishwasher"}), st("input_boolean.mc_emptied", "off", {friendly_name: "Dishwasher emptied"}),
    st("sensor.mc_filter", "12", {friendly_name: "Air filter life", unit_of_measurement: "%"}),
    st("cover.mc_garage", "closed", {friendly_name: "Garage door"}),
  ],
  sections: [
    ["wide", [
      {type: "custom:jam-linemap", title: "House lines", lines: [
        {name: "Living", color: "living", path: "/lovelace/living", stations: ["light.mc_floor", "light.mc_sofa", "switch.mc_hall", "media_player.mc_tv", "sensor.mc_living_temp"]},
        {name: "Kitchen", color: "kitchen", path: "/lovelace/kitchen", stations: ["light.mc_ceiling", "light.mc_island", "light.mc_pendant", "switch.mc_kettle", "switch.mc_coffee", "light.mc_cabinet"]},
        {name: "Bedroom", color: "master", stations: ["light.mc_bed", "light.mc_reading", "switch.mc_hall", "fan.mc_fan", "light.attic_lamp"]},
        {name: "Porch", color: "nerd", stations: ["light.mc_porch", "switch.mc_sprinkler"]},
      ]},
    ]],
    ["", [
      {type: "custom:jam-arrivals", title: "Arrivals",
        alerts: [{entity: "binary_sensor.mc_leak", message: "Water under the sink", severity: "alert"}, {entity: "sensor.mc_battery", below: 15, message: "Front door lock battery low"},
          {entity: "lock.mc_front", state: "unlocked", message: "Front door unlocked"}],
        media: ["media_player.mc_kitchen_speaker", "media_player.mc_tv"],
        calendars: [{entity: "calendar.mc_family", name: "Family", accent: "blue"}, {entity: "calendar.mc_school", name: "School", accent: "green"}], events: 4, hours: 72,
        entities: [{entity: "sensor.mc_washer", accent: "teal"}, {entity: "sensor.mc_dryer", accent: "pink"}, "lock.mc_front"]},
    ]],
    ["", [
      {type: "custom:jam-matrix", title: "Lights", entities: ["light.mc_floor", "light.mc_sofa", "light.mc_ceiling", "light.mc_island", "light.mc_pendant",
        "light.mc_cabinet", "light.mc_bed", "light.mc_reading", "switch.mc_hall", "switch.mc_kettle", "switch.mc_coffee", "binary_sensor.mc_leak"]},
      ["half", {type: "custom:jam-matrix", title: "Kitchen", accent: "kitchen", columns: 2, entities: ["light.mc_ceiling", "light.mc_island", "switch.mc_kettle"]}],
      ["half", {type: "custom:jam-sticker", severity: "warn", title: "Filter soon", text: "12% life left.", conditions: [{condition: "numeric_state", entity: "sensor.mc_filter", below: 20}]}],
    ]],
    ["wide", [
      {type: "custom:jam-ridge", title: "Temperatures", entities: [{entity: "sensor.mc_t_outside", name: "Outside"}, "sensor.mc_t_living", "sensor.mc_t_kitchen",
        "sensor.mc_t_bedroom", "sensor.mc_t_office", "sensor.mc_t_garage", "sensor.mc_humidity", "sensor.mc_power"]},
    ]],
    ["", [
      {type: "custom:jam-sticker", title: "Dishwasher is done", text: "Unload it before dinner.", conditions: [{entity: "sensor.mc_dishwasher", state: "done"}],
        action_name: "Mark emptied", tap_action: {action: "perform-action", perform_action: "input_boolean.turn_on", target: {entity_id: "input_boolean.mc_emptied"}}},
      {type: "custom:jam-sticker", severity: "alert", title: "Water under the sink", text: "The leak sensor is wet. Check the trap and the dishwasher hose.",
        conditions: [{entity: "binary_sensor.mc_leak"}], action_name: "Show sensor", entity: "binary_sensor.mc_leak", tap_action: {action: "more-info"}},
      {type: "custom:jam-sticker", title: "Garage open", text: "Close it for the night.", conditions: [{entity: "cover.mc_garage", state: "open"}]},
    ]],
  ],
});

/* ---- fake calendar API: events relative to now (the shots run on a fixed clock); the order is the same at any time of
   day: pickup +0.8 h, dinner +2.3 h, recycling all day the day after tomorrow (+24..48 h), band +50 h, parent night +60 h ---- */
function events(id, t0) {
  const H = 3600e3, day = new Date(t0); day.setHours(0, 0, 0, 0);
  const iso = t => new Date(t).toISOString(), date = t => { const d = new Date(t); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`; };
  if (id === "calendar.mc_family") return [
    {summary: "Dinner with Amber", start: {dateTime: iso(t0 + 2.3 * H)}, end: {dateTime: iso(t0 + 3.8 * H)}},
    {summary: "Recycling out", start: {date: date(+day + 54 * H)}, end: {date: date(+day + 78 * H)}},
    {summary: "Band practice", start: {dateTime: iso(t0 + 50 * H)}, end: {dateTime: iso(t0 + 52 * H)}},
  ];
  if (id === "calendar.mc_school") return [
    {summary: "Marissa pickup", start: {dateTime: iso(t0 + .8 * H)}, end: {dateTime: iso(t0 + 1.1 * H)}},
    {summary: "Parent night", start: {dateTime: iso(t0 + 60 * H)}, end: {dateTime: iso(t0 + 62 * H)}},
  ];
  return [];
}
/* ---- fake history for the mc_* sensors: compressed rows {s, lu} like HA's minimal_response ---- */
const SHAPE = {
  "sensor.mc_t_outside": {now: 58.6, swing: 9, noise: .3}, "sensor.mc_t_living": {now: 72.4, swing: 1.6, noise: .12, lag: .08},
  "sensor.mc_t_kitchen": {now: 73.1, swing: 2.4, noise: .35, spikes: [.3, .77]}, "sensor.mc_t_bedroom": {now: 70.2, swing: 1.2, noise: .1, lag: -.1},
  "sensor.mc_t_office": {now: 76.8, swing: 3.4, noise: .2, lag: .15, rise: 9}, /* climbs past its range in the last 36 min */ "sensor.mc_humidity": {now: 44, swing: 6, noise: .8, lag: .3},
  "sensor.mc_power": {now: 1240, power: true},
};
function history(id, t0, t1) {
  const cfg = SHAPE[id];
  if (!cfg) return [];
  const r = J.rng(J.seed("ridge|" + id)), rows = [], span = t1 - t0;
  let walk = 0;
  for (let t = t0; t <= t1; t += 300e3 * (.6 + r() * .8)) {
    const f = (t - t0) / span;
    let v;
    if (cfg.power) v = 380 + r() * 120 + ((f > .28 && f < .34) || (f > .7 && f < .78) ? 1800 + r() * 600 : 0) + (f > .97 ? 800 : 0);
    else {
      walk = walk * .85 + (r() - .5) * cfg.noise * 2;
      v = cfg.swing * Math.sin(2 * Math.PI * (f - .25 + (cfg.lag || 0))) + walk + (cfg.spikes || []).reduce((a, s) => a + 3 * Math.exp(-Math.pow((f - s) / .012, 2)), 0)
        + (cfg.rise ? cfg.rise * Math.max(0, (f - .975) / .025) : 0);
    }
    rows.push({t, v});
  }
  const shift = cfg.power ? 0 : cfg.now - rows[rows.length - 1].v;
  return rows.map((x, i) => { const o = {s: String(+(x.v + shift).toFixed(2)), lu: x.t / 1000}; if (i === 0) o.a = {}; return o; });
}
function install(h) {
  if (!h || h.__jamLook) return;
  h.__jamLook = true;
  wrapWS(h);
  window.__api = window.__api || [];
  window.__ws = window.__ws || [];
  h.callApi = function (method, path) {
    window.__api.push({method, path});
    const m = /^calendars\/([^?]+)\?start=([^&]+)&end=(.+)$/.exec(path);
    if (method !== "GET" || !m) return Promise.reject(new Error("unknown api " + path));
    const t0 = Date.parse(decodeURIComponent(m[2])), t1 = Date.parse(decodeURIComponent(m[3]));
    return new Promise(res => setTimeout(() => res(events(m[1], t0).filter(e => Date.parse(e.start.dateTime || e.start.date) < t1)), 20));
  };
}
/* The mc_* history in front of whatever callWS is there (30-light replaces callWS on DOMContentLoaded: wrap again then). */
function wrapWS(h) {
  const prevWS = h.callWS;
  if (prevWS && prevWS.__jamLook) return;
  const fn = function (msg) {
    if (msg && msg.type === "history/history_during_period" && msg.entity_ids.some(id => id.startsWith("sensor.mc_"))) {
      window.__ws.push(msg);
      const t0 = Date.parse(msg.start_time), t1 = msg.end_time ? Date.parse(msg.end_time) : Date.now(), out = {};
      for (const id of msg.entity_ids) { const rows = history(id, t0, t1); if (rows.length) out[id] = rows; }
      return new Promise(res => setTimeout(() => res(out), 30));
    }
    return prevWS ? prevWS.call(this, msg) : Promise.reject(new Error("unknown command " + (msg && msg.type)));
  };
  fn.__jamLook = true;
  h.callWS = fn;
}
/* index.html assigns window.__hass right before it creates the cards: hook that assignment (chaining any earlier hook). */
const prev = Object.getOwnPropertyDescriptor(window, "__hass");
let val = prev && "value" in prev ? prev.value : undefined;
if (val) install(val);
try {
  Object.defineProperty(window, "__hass", {configurable: true, enumerable: true,
    get() { return prev && prev.get ? prev.get.call(window) : val; },
    set(h) { if (prev && prev.set) prev.set.call(window, h); else val = h; install(h); }});
} catch (e) { console.warn("99-look-cards: cannot hook window.__hass", e); }
document.addEventListener("DOMContentLoaded", () => { if (window.__hass) wrapWS(window.__hass); });
}
