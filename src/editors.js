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
   - Object lists (phase 2): the `object` selector with `fields` + `multiple` (frontend 20260930.x) shows a list of items,
     each edited in a dialog whose ha-form also merges {...item, ...change}, so unknown item keys survive. An item that is
     not an object (a bare id / uri in a mixed list) or a field value its selector cannot show sends the card to YAML.
     Rows can be dragged in 2026.10's list but `reorder` is documented only from 2026.11; nothing here relies on it.
     A field's `default` IS written into a newly added item, so object fields carry no defaults.
   Cards are looked up by tag, so this file only adds statics and touches no rendering code (jam-screensaver honours
   card.preview itself). Phase 3 (custom editors: jam-remote, jam-tv's remaining keys, jam-kiosk, jam-popup) is listed in
   docs/THEMING-PLAN.md §4. */
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
/* Object lists. fields = schema-style fields (jeEnt, jeText ...; `loose: true` on a text list = a plain text is accepted
   too, `one: true` on an object list = a single object is accepted too, both as the card does). opt: {label, desc} = the
   item fields shown as the row's label and supporting text. */
const jeObjFields = list => Object.fromEntries(list.map(f => [f.name, {selector: f.selector, label: JE_LABELS[f.name] || f.name.replace(/_/g, " "),
  ...(f.required ? {required: true} : {}), ...(f.loose ? {loose: true} : {}), ...(f.one ? {one: true} : {})}]));
const jeList = (name, fields, opt = {}, extra) => ({name, selector: {object: {multiple: true, fields: jeObjFields(fields),
  ...(opt.label ? {label_field: opt.label} : {}), ...(opt.desc ? {description_field: opt.desc} : {})}}, ...extra});
const jeObj = (name, fields, opt = {}, extra) => ({name, selector: {object: {fields: jeObjFields(fields),
  ...(opt.label ? {label_field: opt.label} : {}), ...(opt.desc ? {description_field: opt.desc} : {})}}, ...extra});
const jeYaml = name => ({name, selector: {object: {}}}); // free YAML value inside an item (e.g. a scene's data)
const jeTexts = (name, extra) => ({name, selector: {text: {multiple: true}}, loose: true, ...extra});
const JE_TONE = {name: "tone", selector: JE_ACCENT.selector};

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
  chips: "Chips", show_state: "Only in state", hide_value: "Hide value", tone: "Hot colour", whites: "Whites", kelvin: "Kelvin",
  presets: "Preset chips", color_temp_kelvin: "Colour temperature (K)", rgb_color: "Colour", brightness_pct: "Brightness (%)",
  pinned: "Pinned", uri: "Music Assistant uri", image: "Image URL", media_type: "Media type",
  controls: "Transport keys", show_art: "Show artwork", show_volume: "Show volume", compact: "Compact", players: "Player switch",
  group: "Group with", state_entity: "On / off from entity", picture_entity: "Artwork from entity",
  inside_entity: "Inside temperature", outside_entity: "Outside (weather or sensor)", lock_entity: "Door lock", people: "People",
  full_names: "Full names", alerts: "Alert chips", state: "State", inside_aq: "Inside air quality", outside_aq: "Outside air quality",
  idle_seconds: "Idle seconds", mode: "Mode", mode_entity: "Mode from entity", weather_entity: "Weather", images: "Photos",
  index: "Index URL (JSON list)", media: "Media folder (media-source://)", interval: "Seconds per photo", shuffle: "Shuffle",
  fade: "Crossfade (ms)", poster_every: "Clock every Nth slide", now: "Now playing sources", type: "Type", states: "States",
  app_entity: "App sensor", active_hours: "Active hours", from: "From (HH:MM)", to: "To (HH:MM)", disable_on: "Not while",
  motion: "Motion", fx: "Look effects", secondary_info: "Secondary info", state_color: "Colour states", rows: "Rows",
  attribute: "Attribute", format: "Format", bad: "Bad when", above: "Above", below: "Below", tabs: "Tabs", path: "Path",
  sticky: "Sticky", scenes: "Scenes", data: "Data", current_entity: "Current scene (input_select)", wrap: "Wrap",
  media_player: "Media player", remote: "Remote", source_label: "Source tab name", sources: "Sources", app: "Apps",
  input: "Inputs", exact: "Exact app name", current_app_entity: "Current app", input_entity: "Input entity",
  input_app: "Apps that mean \"showing an input\"", input_signal_entity: "Input signal", volume_up_action: "Volume up",
  volume_down_action: "Volume down", mute_action: "Mute", match: "Lights up for",
  looks: "Looks to show (theme names, subset and order)",
  show_swatches: "Swatches (whites and colours)", colors: "Colour swatches", keys: "Keys", all_on: "All on key", all_off: "All off key",
  pictogram: "Pictogram", rules: "Pictogram rules (first match wins)", facts: "Facts (up to 4)", lanes: "Lanes",
  ranges: "Fixed ranges", items: "Squares", thresholds: "Thresholds", word: "Word on the label (default high / low)", decimals: "Decimals", above: "Above", below: "Below",
  lines: "Lines (rooms)", stations: "Stations (entities, in order)", calendars: "Calendars",
  events: "Events to show", hours: "Look ahead (hours)", message: "Message", text: "Text", severity: "Severity",
  conditions: "Show while (all hold)", condition: "Condition", state_not: "State is not", action_name: "Key name",
};
/* Per card labels where a shared key means something else (jam-house `alerts` = alert chips). */
const JE_TAG_LABELS = {};
const JE_HELP = {
  accent: "A hue, or type a room alias (living, kitchen, master, marissa, music, nerd, alert).",
  show_color_temp: "Default: when the light supports colour temperature.",
  show_color: "Default: when the light supports colour.",
  show_volume: "Default: when the player supports it.",
  chips: "Hot (accent) while the entity is on.",
  pinned: "Bare uris (not {uri, name}) are edited in YAML.",
  now: "The first active source shows a Now playing block (weather sources are ignored here).",
  disable_on: "No screensaver while one of these entities is in the state (default on / playing).",
  sources: "A source whose match has inputs is listed under Inputs, the rest under Apps.",
  looks: "Default: JamBoard and every installed theme named \"Jam ...\". Any installed theme name works.",
  rules: "Swap the pictogram while an entity is in a state (default: on / playing).",
  facts: "An entity's value, a group's members that are on, or the count of on entities in a list.",
  lanes: "schedule.*, calendar.*, any on / off entity (its history today) or fixed ranges.",
  thresholds: "The first one the value passes sets the colour and puts its word on the label.",
  stations: "An entity on two lines is an interchange.",
  conditions: "Like HA's visibility conditions: state (state / state is not) or numeric_state (above / below).",
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
const jePlain = v => !!v && typeof v === "object" && !Array.isArray(v);
/* An object selector's fields as schema-style fields ({name, selector, ...}). */
const jeSubFields = o => Object.entries((o && o.fields) || {}).map(([name, x]) => ({name, ...x}));
/* Can the field's selector show (and so keep) value v? null / undefined = absent = always fine. */
function jeFits(f, v) {
  if (v === undefined || v === null) return true;
  if (f.schema) return jePlain(v) && jeFields(f.schema).every(g => jeFits(g, v[g.name]));
  const [kind, opt] = Object.entries(f.selector)[0];
  if (kind === "object") {
    if (!opt || !opt.fields) return true; // a YAML editor shows any value
    const sub = jeSubFields(opt), item = x => jePlain(x) && sub.every(g => jeFits(g, x[g.name]));
    if (opt.multiple) return (Array.isArray(v) && v.every(item)) || (!!f.one && item(v));
    return v === "" || item(v); // "" = the object selector's own "removed"
  }
  const multi = !!(opt && opt.multiple);
  if (multi) return (Array.isArray(v) && v.every(x => jeIsStr(x))) || (!!f.loose && jeIsStr(v));
  switch (kind) {
    case "color_rgb": return Array.isArray(v) && v.length === 3 && v.every(x => typeof x === "number");
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
function jeForm(tag, schema, check) {
  const base = jeAssert(tag, schema);
  return {
    schema,
    computeLabel: f => (JE_TAG_LABELS[tag] || {})[f.name] || JE_LABELS[f.name] || (f.name ? f.name.replace(/_/g, " ") : undefined),
    computeHelper: f => JE_HELP[f.name] || undefined,
    assertConfig: check ? config => { base(config); check(config); } : base,
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
/* Up to n entities that pass test, in jePick's order (available first). */
function jePickN(hass, entities, test, n) {
  const st = (hass && hass.states) || {};
  const pool = [...new Set([...(Array.isArray(entities) ? entities : []), ...Object.keys(st)])].filter(id => st[id] && test(id, st[id]));
  return [...pool.filter(id => !UNAVAILABLE.has(st[id].state)), ...pool.filter(id => UNAVAILABLE.has(st[id].state))].slice(0, n);
}
const jeTemp = (id, s) => jeNumeric(id, s) && (s.attributes.device_class === "temperature" || /°/.test(s.attributes.unit_of_measurement || ""));
const JE_ACTION = name => ({name, selector: {ui_action: {}}});
const JE_TV_GLYPHS = ["input", "app", "game", "disc", "download", "grid", "home", "tv", "music", "film"];

/* tag -> {schema, stub(hass, entities)}. Keys not listed here stay YAML-only (README per card). */
const JAM_EDITORS = {
  "jam-heading": {
    schema: [jeText("title", {required: true}), jeText("kicker"), JE_ACCENT, jeEnts("entities"), jeActions()],
    stub: () => ({title: "Living room", kicker: "Downstairs"}),
  },
  "jam-hero": {
    schema: [jeText("kicker"), jeGrid(jeText("title"), jeEnt("title_entity")), jeEnts("meta_entities"), JE_ACCENT,
      jeMore("Power", [jeEnt("power_entity"), jeGrid(jeText("off_title"), jeText("off_text"))]),
      jeList("chips", [jeEnt("entity", null, {required: true}), jeText("name"), jeText("show_state"), jeBool("hide_value"), JE_TONE],
        {label: "entity", desc: "name"})],
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
      jeText("kicker"), JE_ACCENT, jeSel("switch", ["corner", "paddle", "toggle"], {default: "corner"}),
      jeMore("Pop-up", [jeGrid(jeBool("show_brightness", true), jeBool("show_members", true), jeBool("show_color_temp"), jeBool("show_color")),
        jeEnt("preset_entity", ["select", "input_select"]), jeEnt("timer_script", "script"),
        jeSel("member_bands", ["full", "corner"], {default: "full"})]),
      jeMore("Whites and presets", [jeList("whites", [jeText("name"), jeNum("kelvin", {min: 1000, max: 10000, step: 50})], {label: "name", desc: "kelvin"}),
        jeList("presets", [jeText("name", {required: true}), jeNum("color_temp_kelvin", {min: 1000, max: 10000, step: 50}),
          {name: "rgb_color", selector: {color_rgb: {}}}, jeNum("brightness_pct", {min: 1, max: 100})], {label: "name"})]),
      jeActions(["tap_action", "hold_action"])],
    stub: (h, e) => ({entity: jePick(h, e, jeDom("light"), "light.jam")}),
  },
  "jam-speaker": {
    schema: [jeEnt("entity", "media_player", {required: true}), jeText("name"), JE_ACCENT,
      jeGrid(jeBool("show_shuffle", true), jeBool("show_favorite", true)),
      jeGrid(jeNum("poster_height", {min: 72, max: 600}, {default: 150}), jeSel("size", ["normal", "kiosk"], {default: "normal"})),
      jeEnts("speakers", "media_player"),
      jeList("pinned", [jeText("uri", {required: true}), jeText("name"), jeText("image"), jeText("media_type")], {label: "name", desc: "uri"}),
      jeMore("Advanced", [jeEnt("favorite_entity", "button"), {name: "config_entry_id", selector: {config_entry: {integration: "music_assistant"}}},
        {name: "power_action", selector: {ui_action: {}}}])],
    /* A Music Assistant player: entity registry platform (hass.entities), else app_id while it plays MA. */
    stub: (h, e) => ({entity: jePick(h, e, (id, s) => jeDom("media_player")(id) &&
      ((h.entities && h.entities[id] && h.entities[id].platform === "music_assistant") || s.attributes.app_id === "music_assistant"), null) ||
      jePick(h, e, jeDom("media_player"), "media_player.jam")}),
  },
  /* ---- phase 1b: main fields as a form; YAML-only: jam-media `sources` (true or a list), `more`, `sub_entities`;
     jam-screensaver `kiosk` (true / false / "url"). ---- */
  "jam-media": {
    schema: [jeEnt("entity", "media_player"), jeText("name"), JE_ACCENT,
      {name: "controls", selector: {select: {multiple: true, mode: "list", options: ["prev", "play_pause", "next", "stop"]}}},
      jeGrid(jeBool("show_art", true), jeBool("show_volume"), jeBool("compact"), jeSel("size", ["normal", "kiosk"], {default: "normal"})),
      jeEnts("players", "media_player"), jeEnts("group", "media_player"),
      jeMore("Without a media player", [jeEnt("title_entity"), jeEnt("state_entity"), jeEnt("picture_entity")])],
    stub: (h, e) => ({entity: jePick(h, e, jeDom("media_player"), "media_player.jam")}),
  },
  "jam-house": {
    schema: [jeGrid(jeEnt("inside_entity", "sensor", {required: true}), jeEnt("outside_entity", ["weather", "sensor"], {required: true})),
      jeGrid(jeText("title"), jeText("kicker")), jeEnt("lock_entity", "lock"), jeEnts("people", "person"),
      jeGrid(jeBool("full_names"), jeBool("compact")),
      jeList("alerts", [jeEnt("entity", null, {required: true}), jeText("state"), jeText("name")], {label: "entity", desc: "name"}),
      jeMore("Air quality", [jeGrid(jeEnt("inside_aq", "sensor"), jeEnt("outside_aq", "sensor"))])],
    stub: (h, e) => ({inside_entity: jePick(h, e, jeTemp, "sensor.jam_temperature"), outside_entity: jePick(h, e, jeDom("weather"), "weather.home")}),
  },
  "jam-screensaver": {
    schema: [jeNum("idle_seconds", {min: 1}, {default: 120}),
      jeGrid(jeSel("mode", ["poster", "images"], {default: "poster"}), jeEnt("mode_entity", ["input_select", "select", "input_boolean"])),
      jeGrid(jeEnt("weather_entity", "weather"), jeEnt("temperature_entity", "sensor")), jeText("kicker"), JE_ACCENT,
      jeMore("Photos", [jeObj("images", [jeText("index"), jeText("media"), jeNum("interval", {min: 1}), jeBool("shuffle"), jeNum("fade", {min: 0, max: 5000})]),
        jeNum("poster_every", {min: 1})]),
      jeList("now", [jeSel("type", ["media", "weather"], {required: true}), jeEnt("entity", ["media_player", "weather"], {required: true}),
        jeTexts("states"), jeText("kicker"), jeEnt("app_entity")], {label: "entity", desc: "kicker"}),
      jeMore("When", [jeObj("active_hours", [jeText("from", {required: true}), jeText("to", {required: true})]),
        jeList("disable_on", [jeEnt("entity", null, {required: true}), jeTexts("state")], {label: "entity"}, {one: true})]),
      jeMore("Advanced", [jeGrid(jeBool("motion", true), jeBool("fx", true))])],
    stub: (h, e) => { const w = jePick(h, e, jeDom("weather"), null); return {idle_seconds: 120, ...(w ? {weather_entity: w} : {})}; },
  },
  /* ---- phase 2: object lists (`object` selector, fields + multiple). A bare id in jam-list `entities` or a bare uri in
     jam-speaker `pinned` is not an object: such configs go to YAML. ---- */
  "jam-list": {
    schema: [jeText("title"),
      jeList("entities", [jeEnt("entity", null, {required: true}), jeText("name"), jeSel("secondary_info", ["last-changed", "none"])],
        {label: "entity", desc: "name"}, {required: true}),
      jeBool("state_color", true)],
    stub: (h, e) => { const ids = jePickN(h, e, jeDom("sensor", "binary_sensor", "lock", "switch", "light"), 3);
      return {title: "Entities", entities: (ids.length ? ids : ["sun.sun"]).map(entity => ({entity}))}; },
  },
  "jam-panel": {
    schema: [jeText("title", {required: true}),
      jeList("rows", [jeEnt("entity", null, {required: true}), jeText("name"), jeText("attribute"), jeNum("max", {step: "any"}),
        jeSel("format", ["pct", "temp", "bytes_rate", "duration", "relative"]),
        jeObj("bad", [jeNum("above", {step: "any"}), jeNum("below", {step: "any"}), {name: "state", selector: {text: {multiple: true}}}]),
        JE_ACTION("tap_action")], {label: "entity", desc: "name"}, {required: true}),
      JE_ACCENT],
    stub: (h, e) => { const ids = jePickN(h, e, jeNumeric, 3);
      return {title: "System", rows: (ids.length ? ids : ["sensor.jam"]).map(entity => ({entity}))}; },
  },
  "jam-tabs": {
    schema: [jeList("tabs", [jeText("name", {required: true}), jeText("path", {required: true}), {name: "accent", selector: JE_ACCENT.selector}],
      {label: "name", desc: "path"}, {required: true}), jeBool("sticky")],
    stub: () => ({tabs: [{name: "Home", path: "/lovelace/0"}, {name: "Rooms", path: "/lovelace/1"}]}),
  },
  "jam-scenes": {
    schema: [jeList("scenes", [jeEnt("entity", ["scene", "script"], {required: true}), jeText("name"), jeYaml("data")],
      {label: "entity", desc: "name"}, {required: true}),
      jeEnt("current_entity", "input_select"), jeBool("wrap"), JE_ACCENT],
    stub: (h, e) => { const ids = jePickN(h, e, jeDom("scene"), 3);
      return {scenes: (ids.length ? ids : jePickN(h, e, jeDom("script"), 3).concat(["scene.jam"]).slice(0, 3)).map(entity => ({entity}))}; },
  },
  /* jam-tv: main options + `sources`; `stereo`, `remote_card` / `remote_title` stay YAML (phase 3: a custom editor).
     The `launchers` alias goes to YAML (a form `sources` list would silently replace it). */
  "jam-tv": {
    schema: [jeEnt("media_player", "media_player", {required: true}), jeEnt("remote", "remote"),
      jeGrid(jeText("name"), jeText("source_label")), JE_ACCENT, jeSel("size", ["normal", "kiosk"], {default: "normal"}),
      jeList("sources", [jeText("name", {required: true}), {name: "color", selector: JE_ACCENT.selector},
        {name: "icon", selector: {select: {mode: "dropdown", custom_value: true, options: JE_TV_GLYPHS}}},
        JE_ACTION("tap_action"), JE_ACTION("hold_action"), jeObj("match", [jeTexts("app"), jeTexts("input")]), jeBool("exact")], {label: "name"}),
      jeMore("On now", [jeEnt("current_app_entity", ["sensor", "select", "input_select"]), jeEnt("input_entity", ["select", "input_select", "sensor"]),
        jeTexts("input_app"), jeEnt("input_signal_entity")]),
      jeMore("Power and volume", ["power_action", "volume_up_action", "volume_down_action", "mute_action"].map(JE_ACTION))],
    check: c => { if (c.launchers !== undefined) throw new Error('jam-tv: "launchers" (the old name of sources) is edited in YAML (code editor); rename it to sources to use the form.'); },
    stub: (h, e) => { const r = jePick(h, e, jeDom("remote"), null);
      return {media_player: jePick(h, e, (id, s) => jeDom("media_player")(id) && s.attributes.device_class === "tv", null) ||
        jePick(h, e, jeDom("media_player"), "media_player.jam"), ...(r ? {remote: r} : {})}; },
  },
};

/* Attach the statics to the registered classes and complete the card picker entries (register() added them with
   preview: false): documentationURL for every jam card, preview: true for the ones with a starter config. */
for (const [tag, ed] of Object.entries(JAM_EDITORS)) {
  const cls = customElements.get(tag);
  if (!cls || Object.prototype.hasOwnProperty.call(cls, "getConfigForm")) continue; // own statics: jam-dial / jam-radio extend jam-light / jam-speaker
  cls.getConfigForm = () => jeForm(tag, ed.schema, ed.check);
  cls.getStubConfig = (hass, entities, fallback) => ed.stub(...jeArgs(hass, entities, fallback));
}
for (const entry of window.customCards) {
  if (!/^jam-/.test(entry.type)) continue;
  entry.documentationURL = entry.documentationURL || JE_DOCS + entry.type;
  const cls = customElements.get(entry.type);
  if (cls && cls.getStubConfig) entry.preview = true;
}
