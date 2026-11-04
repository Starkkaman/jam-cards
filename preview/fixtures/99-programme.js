// Preview fixture: jam-programme (Olympia look card, renders in every look). Own pr_* entities and a fake hass.callWS for
// the four WS commands the card uses, chained onto the earlier fakes (40-data history, 30-light user data, 75-speaker MA):
//   schedule/list                     -> one storage schedule (id pr_screens), its weekday blocks
//   config/entity_registry/get        -> {entity_id, unique_id}: schedule.pr_screens_off = pr_screens; schedule.pr_quiet
//                                        (a YAML schedule) has a unique_id that is not in the list -> history fallback
//   call_service calendar.get_events  -> {context, response: {calendar.pr_family: {events}}} (return_response); the other
//                                        calendars get no entry (-> the lane's unavailable mark)
//   history/history_during_period     -> on / off rows {s, lu} for input_boolean.pr_work, light.pr_porch, schedule.pr_quiet
// Every answer is placed by hour offsets from the requested day's midnight (not by the wall clock), so fixed-clock shots
// are stable. Installed when index.html assigns window.__hass and again after 30-light replaces callWS on
// DOMContentLoaded (like 75-speaker); recorded in window.__ws. Checks: preview/checks/99-programme.js.
{
const {st} = jamPreview;
const midOf = iso => { const d = new Date(iso); d.setHours(0, 0, 0, 0); return d.getTime(); };
const at = (mid, h) => mid + h * 3600e3;
const SCHED = [{id: "pr_screens", name: "Screens off", icon: "mdi:television-off",
  ...Object.fromEntries(["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"].map(d => [d,
    [{from: "00:00:00", to: "06:30:00"}, {from: "22:30:00", to: "24:00:00"}]]))}];
const HIST = {"input_boolean.pr_work": [[0, "off"], [9.5, "on"], [12.25, "off"], [13, "on"], [17, "off"]],
  "light.pr_porch": [[0, "on"], [6.75, "off"], [17.5, "on"]],
  "schedule.pr_quiet": [[0, "on"], [7, "off"], [13.5, "on"], [14.5, "off"]]};
function answer(msg) {
  if (!msg) return undefined;
  if (msg.type === "schedule/list") return SCHED;
  if (msg.type === "config/entity_registry/get") {
    const u = {"schedule.pr_screens_off": "pr_screens", "schedule.pr_quiet": "yaml_quiet"}[msg.entity_id];
    return u ? {entity_id: msg.entity_id, unique_id: u, platform: "schedule"} : Promise.reject({code: "not_found", message: "Entity not found"});
  }
  if (msg.type === "call_service" && msg.domain === "calendar" && msg.service === "get_events") {
    const mid = midOf(msg.service_data.start_date_time), iso = h => new Date(at(mid, h)).toISOString(), out = {};
    const ymd = t => { const d = new Date(t); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`; };
    for (const id of [].concat(msg.target.entity_id)) if (id === "calendar.pr_family") out[id] = {events: [
      {start: iso(8), end: iso(8.5), summary: "School run", location: "Lincoln Elementary"},
      {start: iso(12), end: iso(13), summary: "Lunch with Amber"},
      {start: iso(15.5), end: iso(16.25), summary: "Dentist", description: "Bring the insurance card", location: "Main St Dental"},
      {start: iso(19), end: iso(21.5), summary: "Movie night"}]};
    else if (id === "calendar.pr_holidays") out[id] = {events: [{start: ymd(mid), end: ymd(at(mid, 30)), summary: "Election Day"}]}; // all day: the end is the next day
    return {context: {id: "x"}, response: out};
  }
  if (msg.type === "history/history_during_period" && msg.entity_ids.some(id => HIST[id])) {
    const t0 = Date.parse(msg.start_time), t1 = msg.end_time ? Date.parse(msg.end_time) : Date.now(), mid = midOf(msg.start_time), out = {};
    for (const id of msg.entity_ids) {
      const rows = (HIST[id] || []).map(([h, s]) => ({s, lu: at(mid, h) / 1000})).filter(r => r.lu * 1000 <= t1);
      // like HA: the state at the start comes first, stamped with the start time
      const before = rows.filter(r => r.lu * 1000 <= t0).pop(), after = rows.filter(r => r.lu * 1000 > t0);
      const list = [...(before ? [{s: before.s, lu: t0 / 1000}] : []), ...after];
      if (list.length) out[id] = list;
    }
    return out;
  }
  return undefined;
}
// Areas like the user's HA (read-only lookup 2026-11-04: living_room "Living Room", office "Master Bedroom", ...): the porch
// light sits in the living room, so its lane takes the living accent without a color.
const AREAS = {living_room: {area_id: "living_room", name: "Living Room"}, office: {area_id: "office", name: "Master Bedroom"}};
const ENTS = {"light.pr_porch": {entity_id: "light.pr_porch", area_id: "living_room", device_id: null}};
const wrap = h => {
  if (h && !h.__jamProgrammeReg) { h.__jamProgrammeReg = true; h.entities = {...(h.entities || {}), ...ENTS}; h.areas = {...(h.areas || {}), ...AREAS}; }
  const prev = h.callWS;
  if (!h || (prev && prev.__jamProgramme)) return;
  const fn = function (msg) {
    const r = answer(msg);
    if (r !== undefined) { (window.__ws = window.__ws || []).push(JSON.parse(JSON.stringify(msg))); return Promise.resolve(r).then(x => new Promise(res => setTimeout(() => res(x), 20))); }
    return prev ? prev.call(this, msg) : Promise.reject(new Error("unknown command " + (msg && msg.type)));
  };
  fn.__jamProgramme = true;
  h.callWS = fn;
};
const prevDesc = Object.getOwnPropertyDescriptor(window, "__hass");
let hv = prevDesc && !prevDesc.get ? prevDesc.value : undefined;
Object.defineProperty(window, "__hass", {configurable: true, enumerable: true,
  get() { return prevDesc && prevDesc.get ? prevDesc.get.call(window) : hv; },
  set(h) { if (prevDesc && prevDesc.set) prevDesc.set.call(window, h); else hv = h; if (h) wrap(h); }});
document.addEventListener("DOMContentLoaded", () => { if (window.__hass) wrap(window.__hass); });
jamPreview.add({
  states: [
    st("schedule.pr_screens_off", "off", {friendly_name: "Screens off", next_event: null}),
    st("schedule.pr_quiet", "off", {friendly_name: "Quiet hours"}),
    st("calendar.pr_family", "off", {friendly_name: "Family"}),
    st("calendar.pr_holidays", "on", {friendly_name: "Holidays", all_day: true}),
    st("calendar.pr_broken", "off", {friendly_name: "Work calendar"}),
    st("input_boolean.pr_work", "on", {friendly_name: "Work mode"}),
    st("light.pr_porch", "off", {friendly_name: "Porch light"}),
  ],
  sections: [
    ["wide", [
      {type: "custom:jam-programme", title: "Programme", lanes: [
        {entity: "schedule.pr_screens_off", name: "Screens off", color: "blue"},
        {entity: "input_boolean.pr_work", name: "Work", color: "green"},
        {name: "Briefs", color: "ochre", ranges: [{from: "07:00", to: "07:20", label: "Morning brief"}, {from: "12:30", to: "12:45", label: "Midday"}, {from: "17:00", to: "17:20", label: "Evening brief"}]},
        {entity: "calendar.pr_family", name: "Family"},
        {entity: "light.pr_porch", name: "Porch light"}]},
    ]],
    ["", [
      {type: "custom:jam-programme", title: "Evening", from: "12:00", to: "24:00", lanes: [
        {entity: "schedule.pr_quiet", name: "Quiet hours", color: "violet"},
        {entity: "calendar.pr_holidays", name: "Holidays", color: "pink"},
        {name: "Bedtime", ranges: [{from: "21:30", to: "07:00", label: "Kids in bed"}]}]},
    ]],
    ["errors", [
      {type: "custom:jam-programme", title: "Err programme", lanes: [{entity: "calendar.pr_broken", name: "Work calendar"}, {entity: "input_boolean.pr_missing", name: "Missing"}]},
    ]],
  ],
});
}
