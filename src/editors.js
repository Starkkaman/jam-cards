/* ---------- visual editors (theming plan §4, phase 1): getConfigForm + getStubConfig + card picker entries ----------
   Home Assistant (frontend 20260930.x = HA 2026.10; checked in the frontend source) renders a static getConfigForm()
   schema with its own ha-form (hui-form-editor):
   - ha-form merges every change as {...data, ...change}, so config keys outside the schema (chips, tones, whites, ...)
     survive form edits; a `grid` / `expandable` WITHOUT a name or with `flatten: true` writes its fields at the top level,
     a named one without flatten writes a sub-object (jam-gauge `severity`).
   - assertConfig(config) runs on every change; throwing sends the user to the YAML editor until the config fits again.
     Here it is derived from the schema (jeAssert): a value the form's selector cannot show (a {entity, name} item in an
     entity list, presets: false, ...) throws instead of being overwritten.
   - A non-required field's `default` is only the placeholder (a boolean shows it as its state); nothing is written.
   - getStubConfig(hass, entities, entitiesFallback) returns the starter config without `type` (HA adds it); the picker
     preview (customCards preview: true) renders it with card.preview = true.
   Cards are looked up by tag, so this file only adds statics and touches no rendering code. Phase 2 (object lists) and
   phase 3 (custom editors) are listed in docs/THEMING-PLAN.md §4. */
const JE_DOCS = "https://github.com/Starkkaman/jam-cards#";
const JE_HUES = ["ochre", "teal", "blue", "pink", "violet", "green", "red", "ink", "paper"];
const JE_ACCENT = {name: "accent", selector: {select: {mode: "dropdown", custom_value: true,
  options: JE_HUES.map(v => ({value: v, label: v[0].toUpperCase() + v.slice(1)}))}}};
const jeEnt = (name, domain, extra) => ({name, selector: {entity: domain ? {filter: {domain}} : {}}, ...extra});
const jeEnts = (name, domain, extra) => ({name, selector: {entity: {multiple: true, ...(domain ? {filter: {domain}} : {})}}, ...extra});
const jeText = (name, extra) => ({name, selector: {text: {}}, ...extra});
const jeNum = (name, opt, extra) => ({name, selector: {number: {mode: "box", ...opt}}, ...extra});
const jeBool = (name, def) => ({name, selector: {boolean: {}}, ...(def === undefined ? {} : {default: def})});
const jeSel = (name, options, extra) => ({name, selector: {select: {mode: "dropdown", options}}, ...extra});
const jeGrid = (...schema) => ({type: "grid", name: "", schema});
const jeMore = (title, schema, extra) => ({type: "expandable", name: "", flatten: true, title, schema, ...extra});
const jeActions = (keys = ["tap_action", "hold_action", "double_tap_action"]) =>
  jeMore("Actions", keys.map(name => ({name, selector: {ui_action: {}}})));
const JE_NUMERIC = ["sensor", "number", "input_number", "counter"];

const JE_LABELS = {
  entity: "Entity", name: "Name", title: "Title", kicker: "Kicker (small label above)", accent: "Accent colour",
  entities: "Entities", icon: "Icon", tap_action: "Tap action", hold_action: "Hold action", double_tap_action: "Double tap action",
  title_entity: "Title from entity", meta_entities: "Meta line entities", power_entity: "Power entity",
  off_title: "Title while off", off_text: "Text while off", label: "Fixed text instead of the state", control: "Control",
  show_last_changed: "Show last changed", options: "Options to show (subset and order)", columns: "Columns", min: "Minimum",
  max: "Maximum", step: "Step", color: "HA colour (instead of accent)", show_state: "Show state", size: "Size", unit: "Unit",
  style: "Style", severity: "Severity bands", green: "Green from", yellow: "Yellow from", red: "Red from", sensor: "Sensor in the label",
  extra_sensor: "Second sensor in the label", forecast_type: "Forecast type", days: "Forecast entries", clock: "Show a clock",
  clock_size: "Clock size", temperature_entity: "Temperature sensor", show_current: "Show current values",
  show_forecast: "Show forecast", hours_to_show: "Hours to show", refresh_minutes: "Refresh (minutes)",
  auto: "All automations", automations: "Automations", limit: "Rows (all automations)", watch: "Watched entities",
  show_unavailable_count: "Show unavailable count", preset_entity: "Preset select (e.g. WLED)", timer_script: "Off-timer script",
  show_brightness: "Pop-up: brightness", show_color_temp: "Pop-up: whites", show_color: "Pop-up: hue strip + your colours",
  show_members: "Pop-up: group members", member_bands: "Group member bands", speakers: "Speakers (grouping view)",
  show_shuffle: "Shuffle key", show_favorite: "Favourite key", favorite_entity: "Favourite button",
  config_entry_id: "Music Assistant entry", power_action: "Power corner action", poster_height: "Art height (px)",
};
const JE_HELP = {
  accent: "A hue, or type a room alias (living, kitchen, master, marissa, music, nerd, alert).",
  show_color_temp: "Default: when the light supports colour temperature.",
  show_color: "Default: when the light supports colour.",
};

/* Every field of a schema with its selector, flattened through unnamed / flatten groups; a named group = one object field. */
function jeFields(schema, out = []) {
  for (const f of schema) {
    if (f.schema && (!f.name || f.flatten)) jeFields(f.schema, out);
    else out.push(f);
  }
  return out;
}
const jeIsStr = v => typeof v === "string";
const jeIsNum = v => typeof v === "number" || (typeof v === "string" && v.trim() !== "" && !isNaN(Number(v)));
/* Can the field's selector show (and so keep) value v? null / undefined = absent = always fine. */
function jeFits(f, v) {
  if (v === undefined || v === null) return true;
  if (f.schema) return typeof v === "object" && !Array.isArray(v) && jeFields(f.schema).every(g => jeFits(g, v[g.name]));
  const [kind, opt] = Object.entries(f.selector)[0];
  const multi = !!(opt && opt.multiple);
  if (multi) return Array.isArray(v) && v.every(x => jeIsStr(x));
  switch (kind) {
    case "entity": case "icon": case "config_entry": return jeIsStr(v);
    case "text": case "select": case "ui_color": return jeIsStr(v) || typeof v === "number";
    case "number": return jeIsNum(v);
    case "boolean": return typeof v === "boolean";
    case "ui_action": return typeof v === "object" && !Array.isArray(v);
    default: return true;
  }
}
function jeAssert(tag, schema) {
  const fields = jeFields(schema);
  return config => {
    for (const f of fields) if (!jeFits(f, config[f.name]))
      throw new Error(`${tag}: "${f.name}" uses a form the visual editor cannot show; edit it in YAML (code editor).`);
  };
}
/* The getConfigForm result for a schema (labels, helpers and the derived assertConfig). */
function jeForm(tag, schema) {
  return {
    schema,
    computeLabel: f => JE_LABELS[f.name] || (f.name ? f.name.replace(/_/g, " ") : undefined),
    computeHelper: f => JE_HELP[f.name] || undefined,
    assertConfig: jeAssert(tag, schema),
  };
}

/* First entity that passes test(id, stateObj): entities not yet on the dashboard first, then the fallback list, then every
   state; available ones before unavailable ones. */
function jePick(hass, entities, test, fallback) {
  const st = (hass && hass.states) || {};
  const pool = [...(Array.isArray(entities) ? entities : []), ...Object.keys(st)].filter(id => st[id] && test(id, st[id]));
  return pool.find(id => !UNAVAILABLE.has(st[id].state)) || pool[0] || fallback;
}
const jeDom = (...d) => id => d.includes(String(id).split(".")[0]);
const jeNumeric = (id, s) => jeDom(...JE_NUMERIC)(id) && s.state !== "" && !isNaN(Number(s.state));
const jeArgs = (hass, entities, fb) => [hass, [...(entities || []), ...(fb || [])]];

/* tag -> {schema, stub(hass, entities)}. Keys not listed here stay YAML-only (README per card). */
const JAM_EDITORS = {
  "jam-heading": {
    schema: [jeText("title", {required: true}), jeText("kicker"), JE_ACCENT, jeEnts("entities"), jeActions()],
    stub: () => ({title: "Living room", kicker: "Downstairs"}),
  },
  "jam-hero": {
    schema: [jeText("kicker"), jeGrid(jeText("title"), jeEnt("title_entity")), jeEnts("meta_entities"), JE_ACCENT,
      jeMore("Power", [jeEnt("power_entity"), jeGrid(jeText("off_title"), jeText("off_text"))])],
    stub: (h, e) => { const m = jePick(h, e, jeNumeric); return {kicker: "Home", title: "Good evening", ...(m ? {meta_entities: [m]} : {})}; },
  },
  "jam-tile": {
    schema: [jeEnt("entity", null, {required: true}), jeGrid(jeText("name"), jeText("label")),
      jeSel("control", ["auto", "toggle", "lock", "press", "none"], {default: "auto"}), JE_ACCENT, jeBool("show_last_changed"), jeActions()],
    stub: (h, e) => ({entity: jePick(h, e, jeDom("switch", "input_boolean", "light", "lock"), null) || jePick(h, e, () => true, "sun.sun")}),
  },
  "jam-choice": {
    schema: [jeEnt("entity", ["select", "input_select"], {required: true}), jeText("name"),
      {name: "options", selector: {text: {multiple: true}}}, jeNum("columns", {min: 1, max: 8}), JE_ACCENT],
    stub: (h, e) => ({entity: jePick(h, e, jeDom("input_select", "select"), "input_select.house_mode")}),
  },
  "jam-slider": {
    schema: [jeEnt("entity", ["number", "input_number", "light", "media_player", "fan"], {required: true}), jeText("name"), JE_ACCENT,
      jeMore("Range", [jeGrid(jeNum("min", {step: "any"}), jeNum("max", {step: "any"}), jeNum("step", {step: "any"}))])],
    stub: (h, e) => ({entity: jePick(h, e, (id, s) => jeDom("input_number", "number")(id) ||
      (jeDom("light")(id) && (s.attributes.supported_color_modes || []).some(m => m !== "onoff")), "input_number.jam")}),
  },
  "jam-button": {
    schema: [jeEnt("entity"), jeGrid(jeText("name"), {name: "icon", selector: {icon: {}}, context: {icon_entity: "entity"}}),
      JE_ACCENT, jeGrid(jeSel("size", ["normal", "big"], {default: "normal"}), jeBool("show_state")),
      jeMore("Advanced", [{name: "color", selector: {ui_color: {include_none: true}}}]), jeActions()],
    stub: (h, e) => { const id = jePick(h, e, jeDom("scene", "script", "light", "switch"), null);
      return id ? {entity: id} : {name: "Movie night", icon: "mdi:movie-open"}; },
  },
  "jam-gauge": {
    schema: [jeEnt("entity", JE_NUMERIC, {required: true}), jeText("name"),
      jeGrid(jeNum("min", {step: "any"}, {default: 0}), jeNum("max", {step: "any"}, {default: 100}), jeText("unit")),
      jeSel("style", ["arc", "bar"], {default: "arc"}), JE_ACCENT,
      {type: "expandable", name: "severity", title: "Severity bands",
        schema: [jeGrid(jeNum("green", {step: "any"}), jeNum("yellow", {step: "any"}), jeNum("red", {step: "any"}))]},
      jeActions()],
    stub: (h, e) => ({entity: jePick(h, e, (id, s) => jeNumeric(id, s) && s.attributes.unit_of_measurement === "%", null) ||
      jePick(h, e, jeNumeric, "sensor.jam")}),
  },
  "jam-fan": {
    schema: [jeEnt("entity", "fan", {required: true}), jeText("name"), jeGrid(jeEnt("sensor", "sensor"), jeEnt("extra_sensor", "sensor")), JE_ACCENT],
    stub: (h, e) => ({entity: jePick(h, e, jeDom("fan"), "fan.jam")}),
  },
  "jam-weather": {
    schema: [jeEnt("entity", "weather", {required: true}),
      jeGrid(jeSel("forecast_type", ["daily", "hourly", "twice_daily"], {default: "daily"}), jeNum("days", {min: 1, max: 14}, {default: 5})),
      jeGrid(jeBool("show_current", true), jeBool("show_forecast", true)),
      jeGrid(jeBool("clock", false), jeSel("clock_size", ["normal", "big", "huge"], {default: "normal"})), JE_ACCENT,
      jeMore("Advanced", [jeEnt("temperature_entity", "sensor")]), jeActions()],
    stub: (h, e) => ({entity: jePick(h, e, jeDom("weather"), "weather.home")}),
  },
  "jam-graph": {
    schema: [jeText("title"), jeEnts("entities", JE_NUMERIC, {required: true}),
      jeGrid(jeNum("hours_to_show", {min: 1}, {default: 24}), jeSel("style", ["line", "step", "bars"], {default: "line"})),
      jeBool("show_current", true), JE_ACCENT,
      jeMore("Advanced", [jeGrid(jeNum("min", {step: "any"}), jeNum("max", {step: "any"}), jeNum("refresh_minutes", {min: 1}, {default: 5}))])],
    stub: (h, e) => { const id = jePick(h, e, (id, s) => jeNumeric(id, s) && !!s.attributes.unit_of_measurement, null) || jePick(h, e, jeNumeric, "sensor.jam");
      return {title: "History", entities: [id]}; },
  },
  "jam-alerts": {
    schema: [jeText("title"), jeGrid(jeBool("auto"), jeNum("limit", {min: 1}, {default: 6})), jeEnts("automations", "automation"),
      jeEnts("watch"), jeBool("show_unavailable_count", true), JE_ACCENT],
    stub: () => ({auto: true, limit: 6}),
  },
  "jam-light": {
    schema: [jeEnt("entity", "light", {required: true}), jeGrid(jeText("name"), {name: "icon", selector: {icon: {}}, context: {icon_entity: "entity"}}),
      jeText("kicker"), JE_ACCENT,
      jeMore("Pop-up", [jeGrid(jeBool("show_brightness", true), jeBool("show_members", true), jeBool("show_color_temp"), jeBool("show_color")),
        jeEnt("preset_entity", ["select", "input_select"]), jeEnt("timer_script", "script"),
        jeSel("member_bands", ["full", "corner"], {default: "full"})]),
      jeActions(["tap_action", "hold_action"])],
    stub: (h, e) => ({entity: jePick(h, e, jeDom("light"), "light.jam")}),
  },
  "jam-speaker": {
    schema: [jeEnt("entity", "media_player", {required: true}), jeText("name"), JE_ACCENT,
      jeGrid(jeBool("show_shuffle", true), jeBool("show_favorite", true)),
      jeGrid(jeNum("poster_height", {min: 72, max: 600}, {default: 150}), jeSel("size", ["normal", "kiosk"], {default: "normal"})),
      jeEnts("speakers", "media_player"),
      jeMore("Advanced", [jeEnt("favorite_entity", "button"), {name: "config_entry_id", selector: {config_entry: {integration: "music_assistant"}}},
        {name: "power_action", selector: {ui_action: {}}}])],
    /* A Music Assistant player: entity registry platform (hass.entities), else app_id while it plays MA. */
    stub: (h, e) => ({entity: jePick(h, e, (id, s) => jeDom("media_player")(id) &&
      ((h.entities && h.entities[id] && h.entities[id].platform === "music_assistant") || s.attributes.app_id === "music_assistant"), null) ||
      jePick(h, e, jeDom("media_player"), "media_player.jam")}),
  },
};

/* Attach the statics to the registered classes and complete the card picker entries (register() added them with
   preview: false): documentationURL for every jam card, preview: true for the ones with a starter config. */
for (const [tag, ed] of Object.entries(JAM_EDITORS)) {
  const cls = customElements.get(tag);
  if (!cls || cls.getConfigForm) continue;
  cls.getConfigForm = () => jeForm(tag, ed.schema);
  cls.getStubConfig = (hass, entities, fallback) => ed.stub(...jeArgs(hass, entities, fallback));
}
for (const entry of window.customCards) {
  if (!/^jam-/.test(entry.type)) continue;
  entry.documentationURL = entry.documentationURL || JE_DOCS + entry.type;
  const cls = customElements.get(entry.type);
  if (cls && cls.getStubConfig) entry.preview = true;
}
