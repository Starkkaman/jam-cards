/* ---------- jam-pictogram: a room tile with an Aicher-style pictogram (Olympia look card, renders in every look) ----------
   {type: custom:jam-pictogram, name?, entity?, pictogram?: home|sofa-tv|watch|cook|sleep|music|work-desk|bath|play|car|garden
    (aliases tv, work, garage), rules?: [{entity, state?: string | [..], pictogram}], facts?: [entity | {entity?, entities?,
    name?, attribute?, unit?}] (up to 4; 2 on a narrow tile), tap_action?, hold_action?, double_tap_action?, accent?}
   A field with the pictogram drawn as an inline SVG from 45° / 90° strokes (square caps, round heads), then the room name and
   the facts (value over a small label). rules: the first rule whose entity is in `state` (default: an "on" state, core
   tone()) swaps the pictogram (a TV playing -> the watching figure) and writes its activity word on the field. A fact counts
   the "on" entities of `entities` (or the members of a group entity: lights on), shows a media player's app / title, or an
   entity's value (temperatures as 66°); a missing / unavailable fact reads "Offline" under its configured name.
   The room's state (root data-state, .on): on = a rule matched, the entity is on, a count fact > 0 or a media fact is
   playing / paused -> the full accent field, pictogram and word in the look's dark or light text, whichever contrasts more
   (jamFieldInk); off -> a face-2 field, the pictogram in --dim under a 6px accent strip; offline (the entity, or every fact
   entity, missing / unavailable) -> face 2, dashed pictogram, "Offline". The whole tile is one control: tap = tap_action
   (navigate to the room), default more-info of `entity`; without entity and actions it is not a control. Static: no motion. */
const JP_NS = "http://www.w3.org/2000/svg";
/* Pictograms on a 120 grid, stroke 8 (square caps, miter joins): ["p", d] = stroked path, ["w", d] = thin stroked path (5),
   ["f", d] = filled path, ["c", cx, cy, r] = filled circle (heads, wheels). Every straight line is horizontal, vertical or
   45 degrees. */
/* Reclined figure on a long sofa facing right (sofa-tv / watch). */
const JP_LOUNGE = [["c", 16, 44, 8], ["p", "M24 60L40 76H74"], ["p", "M8 64V100M8 88H72V100"]];
const JP_GLYPHS = Object.freeze({
  home: [["p", "M16 58L60 14L104 58"], ["p", "M28 50V102H92V50"], ["f", "M52 72H68V102H52Z"]],
  "sofa-tv": [...JP_LOUNGE, ["p", "M80 28H116V52H80Z"]],
  watch: [...JP_LOUNGE, ["p", "M30 66L44 52"], ["f", "M76 24H118V56H76Z"]],
  cook: [["c", 32, 22, 9], ["p", "M32 40V72"], ["p", "M32 72L26 78V104M32 72L38 78V104"], ["p", "M32 50H58"],
    ["p", "M64 54V74H98V54"], ["p", "M56 82H106"], ["w", "M72 26V40M81 22V40M90 26V40"]],
  sleep: [["p", "M14 42V100M14 82H106V100"], ["c", 30, 64, 9], ["p", "M46 70H102"], ["w", "M64 22H80L64 38H80"], ["w", "M88 12H98L88 22H98"]],
  music: [["c", 32, 86, 11], ["c", 84, 86, 11], ["p", "M40 84V26M92 84V26"], ["f", "M36 18H96V32H36Z"], ["p", "M40 44H92"]],
  "work-desk": [["c", 30, 20, 8], ["p", "M30 36V64H52V98"], ["p", "M30 50H62"], ["p", "M14 34V98M14 76H40V98"],
    ["p", "M60 58H114M108 58V98"], ["p", "M74 24H102V44H74Z"], ["p", "M88 44V54"]],
  bath: [["c", 40, 36, 9], ["p", "M40 52V60"], ["p", "M12 62H108"], ["p", "M18 62V82L28 92H92L102 82V62"], ["p", "M30 92L22 100M90 92L98 100"],
    ["p", "M98 58V18H78"], ["p", "M70 26H86"], ["w", "M72 36V44M80 36V44"]],
  play: [["c", 42, 20, 9], ["p", "M42 36V62"], ["p", "M42 44L28 58M42 44L56 30"], ["p", "M42 62L34 70V100"], ["p", "M42 62L66 86"], ["c", 88, 94, 10]],
  car: [["p", "M24 44L60 8L96 44"], ["f", "M12 90V72H28L42 58H78L92 72H108V90Z"], ["c", 34, 92, 11], ["c", 86, 92, 11]],
  garden: [["p", "M6 104H114"], ["c", 26, 22, 8], ["p", "M26 38V68"], ["p", "M26 68L18 76V100M26 68L34 76V100"], ["p", "M26 46H44"],
    ["f", "M42 40H58V56H42Z"], ["p", "M58 44L66 52"], ["w", "M70 58V64M76 60V66"],
    ["p", "M94 104V50"], ["p", "M94 88L82 76M94 70L108 56"], ["c", 94, 38, 11]],
});
const JP_ALIAS = {tv: "sofa-tv", work: "work-desk", garage: "car"};
const JP_WORDS = {home: "", "sofa-tv": "lounging", watch: "watching", cook: "cooking", sleep: "sleeping", music: "music", "work-desk": "working",
  bath: "bathing", play: "playing", car: "garage", garden: "garden"};
const jpName = p => { const k = String(p || "").trim().toLowerCase(); return JP_ALIAS[k] || k; };
function jamPictogram(name) {
  const svg = document.createElementNS(JP_NS, "svg");
  svg.setAttribute("viewBox", "0 0 120 120"); svg.setAttribute("aria-hidden", "true"); svg.setAttribute("class", "pic");
  svg.dataset.pic = name;
  for (const [k, a, b, r] of JP_GLYPHS[name] || JP_GLYPHS.home) {
    const e = document.createElementNS(JP_NS, k === "c" ? "circle" : "path");
    if (k === "c") { e.setAttribute("cx", a); e.setAttribute("cy", b); e.setAttribute("r", r); e.setAttribute("class", "pf"); }
    else { e.setAttribute("d", a); e.setAttribute("class", k === "f" ? "pf" : k === "w" ? "ps pth" : "ps"); }
    svg.append(e);
  }
  return svg;
}
/* Text / stroke colour on flat colour fields ([data-fld] nodes under scope: pictogram fields, result squares): the look's
   dark or light text pair (textColors), whichever contrasts more with the field's computed background (core textOn);
   .pl when neither reaches 4.5:1 (small text then sits on a label plate). Writes only on change; false while detached (the
   card calls it again when attached). */
function jamFieldInk(scope) {
  if (!scope || !scope.isConnected) return false;
  let ok = true;
  for (const n of scope.querySelectorAll("[data-fld]")) {
    const rgb = parseRgb(getComputedStyle(n).backgroundColor);
    if (!rgb) { ok = false; continue; }
    const t = textOn(rgb, textColors(n));
    if (n.style.getPropertyValue("--fld-fg") !== t.fg) n.style.setProperty("--fld-fg", t.fg);
    if (n.classList.contains("pl") !== t.plate) n.classList.toggle("pl", t.plate);
  }
  return ok;
}
/* Default colours of lanes / squares without a colour, in order: accent hues, never red (a look maps them: Olympia's
   spectrum, Grid's signal). */
const JAM_HUE_CYCLE = ["blue", "teal", "ochre", "pink", "violet", "green"];
const jamHueAt = i => `var(--${JAM_HUE_CYCLE[i % JAM_HUE_CYCLE.length]})`;
/* A number as the cards show it: >= 100 whole, else one decimal (decimals overrides). */
function jamFmtNum(v, decimals) {
  if (decimals !== undefined && decimals !== null && decimals !== "" && isFinite(+decimals)) return v.toFixed(Math.max(0, Math.min(6, +decimals)));
  return String(Math.abs(v) >= 100 ? Math.round(v) : Math.round(v * 10) / 10);
}
/* A value + its unit for big type: temperatures fold into the number ("66°"), other units stay apart. */
function jamValue(hass, s, opt = {}) {
  if (!s || UNAVAILABLE.has(s.state)) return {v: "—", u: "", un: true, text: s ? "unavailable" : "unknown"};
  const raw = opt.attribute ? s.attributes[opt.attribute] : s.state;
  const unit = opt.unit ?? (opt.attribute ? "" : s.attributes.unit_of_measurement) ?? "";
  const n = typeof raw === "number" ? raw : typeof raw === "string" && raw.trim() !== "" ? Number(raw) : NaN;
  if (isFinite(n)) {
    const v = jamFmtNum(n, opt.decimals), deg = /^°/.test(unit);
    return {v: deg ? v + "°" : v, u: deg ? "" : unit, n, text: `${v} ${unit}`.trim()};
  }
  const t = opt.attribute ? String(raw == null ? "—" : raw) : fmtState(hass, s);
  return {v: t, u: "", word: true, text: t};
}
/* A readable stand-in name for an entity that is not in the states (never the raw id): "sensor.living_temp" -> "living temp". */
const jamIdName = id => String(id || "").split(".").pop().replace(/_/g, " ").trim();
const jamGone = s => !s || UNAVAILABLE.has(s.state);
class JamPictogram extends JamBase {
  validate(c) {
    if (c.pictogram !== undefined && !JP_GLYPHS[jpName(c.pictogram)]) throw new Error(`jam-pictogram: pictogram is one of ${Object.keys(JP_GLYPHS).join(", ")}`);
    if (c.rules !== undefined && !Array.isArray(c.rules)) throw new Error("jam-pictogram: rules is a list");
    for (const r of c.rules || []) if (!r || typeof r.entity !== "string" || !JP_GLYPHS[jpName(r.pictogram)])
      throw new Error("jam-pictogram: each rule is {entity, state?, pictogram}");
    if (c.facts !== undefined && (!Array.isArray(c.facts) || c.facts.length > 4)) throw new Error("jam-pictogram: facts is a list of up to 4");
  }
  _facts() { return (this._config.facts || []).map(f => (typeof f === "string" ? {entity: f} : f || {})); }
  /* The members of a group entity (attributes.entity_id), else null. */
  _members(id) { const s = stateObj(this._hass, id), m = s && s.attributes && s.attributes.entity_id; return Array.isArray(m) ? m : null; }
  watched() {
    const c = this._config, ids = [];
    if (c.entity) ids.push(c.entity);
    for (const r of c.rules || []) ids.push(r.entity);
    for (const f of this._facts()) {
      if (Array.isArray(f.entities)) ids.push(...f.entities);
      if (f.entity) { ids.push(f.entity); ids.push(...(this._members(f.entity) || [])); }
    }
    return [...new Set(ids.filter(x => typeof x === "string"))];
  }
  css() { return `
    .host{container-type:inline-size}
    .pgm{--p-t:0px;--p-r:0px;--p-b:0px;--p-l:0px;display:flex;flex-direction:column;min-height:100%}
    .fld{flex:none;position:relative;height:132px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:2px;
      background:var(--acc);color:var(--fld-fg,var(--acc-fg))}
    .pic{height:96px;width:96px;flex:none;display:block;overflow:visible}
    .fld.hasw .pic{height:84px;width:84px}
    .pic .ps{fill:none;stroke:currentColor;stroke-width:8;stroke-linecap:square;stroke-linejoin:miter}
    .pic .pth{stroke-width:5}
    .pic .pf{fill:currentColor}
    .wd{font:600 .92rem/1.15 var(--body);letter-spacing:calc(.08em * var(--lbl-track));text-transform:var(--lbl-case)}
    .fld.pl .wd span{background:var(--plate);color:var(--plate-fg);padding:1px 6px}
    /* Off: face 2, the pictogram dim under a 6px accent strip. Offline: face 2, dashed outlines, the word "Offline". */
    [data-state=off] .fld,[data-state=offline] .fld{background:var(--slab2);color:var(--dim)}
    [data-state=off] .fld{border-top:6px solid var(--acc)}
    [data-state=offline] .fld .wd{color:var(--fg)}
    [data-state=offline] .pic .ps{stroke-width:5;stroke-dasharray:9 6;stroke-linecap:butt}
    [data-state=offline] .pic .pf{fill:none;stroke:currentColor;stroke-width:4;stroke-dasharray:6 5}
    .bd{flex:1;display:grid;gap:10px;align-content:start;padding:12px 16px 16px}
    .nm{font-size:calc(1.55rem * var(--disp-scale));overflow-wrap:break-word;hyphens:auto}
    .facts{display:grid;grid-template-columns:repeat(var(--n,3),minmax(0,1fr));gap:12px}
    .f{min-width:0;display:grid;gap:3px;align-content:start}
    .v{font-family:var(--num-font);font-weight:var(--disp-w);font-size:calc(1.3rem * var(--num-scale));line-height:calc(1 * var(--disp-lead));
      text-transform:var(--disp-case);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
    .f .label{hyphens:auto;overflow-wrap:break-word}
    /* A half-width tile keeps two facts. */
    @container (max-width:330px){.facts{grid-template-columns:repeat(2,minmax(0,1fr))}.f:nth-child(n+3){display:none}}`; }
  /* The pictogram now: the first matching rule, else the configured one (default home). */
  _pic() {
    const c = this._config;
    for (const r of c.rules || []) {
      const s = stateObj(this._hass, r.entity);
      if (!s) continue;
      const want = r.state === undefined || r.state === null ? null : [].concat(r.state).map(String);
      if (want ? want.includes(String(s.state)) : tone(s) === "on") return {pic: jpName(r.pictogram), rule: true};
    }
    return {pic: jpName(c.pictogram || "home"), rule: false};
  }
  /* One fact: {v (big value), label, text (aria), on (a count > 0 / media playing), gone (missing / unavailable)}. */
  _fact(f) {
    const h = this._hass, ids = Array.isArray(f.entities) ? f.entities : f.entity ? this._members(f.entity) : null;
    if (ids) {
      const known = ids.filter(id => !jamGone(stateObj(h, id))), n = known.filter(id => tone(stateObj(h, id)) === "on").length;
      const label = f.name || (Array.isArray(f.entities) ? "on" : friendly(h, f.entity));
      if (!known.length) return {v: "Offline", label, text: `${label} offline`, word: true, gone: true};
      return {v: String(n), label, text: `${n} ${label}`, on: n > 0};
    }
    const s = stateObj(h, f.entity), label = f.name || (s ? friendly(h, f.entity) : jamIdName(f.entity));
    if (jamGone(s)) return {v: "Offline", label, text: `${label} offline`, word: true, gone: true};
    if (f.entity.startsWith("media_player.") && !f.attribute) {
      const a = s.attributes || {}, on = s.state === "playing" || s.state === "paused";
      const v = on ? a.app_name || a.media_title || a.source || fmtState(h, s) : fmtState(h, s);
      return {v, label, text: `${label} ${v}`, word: true, on};
    }
    const x = jamValue(h, s, f);
    return {v: x.v + (x.u ? " " + x.u : ""), label, text: `${x.text} ${label}`, word: !!x.word};
  }
  render(b) {
    const c = this._config, h = this._hass, es = c.entity ? stateObj(h, c.entity) : null;
    const name = c.name || (c.entity ? (es ? friendly(h, c.entity) : jamIdName(c.entity)) : "Room");
    const live = !!(c.entity || c.tap_action || c.hold_action || c.double_tap_action);
    const {root, face} = this.paper(c.entity || name, {cls: live ? "press" : "", face: "pgm"});
    const {pic, rule} = this._pic(), facts = this._facts().map(f => this._fact(f));
    const backed = facts.filter((f, i) => { const x = this._facts()[i]; return !!x.entity || Array.isArray(x.entities); });
    const offline = c.entity ? jamGone(es) : backed.length > 0 && backed.every(f => f.gone);
    const on = !offline && (rule || (!!es && tone(es) === "on") || facts.some(f => f.on));
    const state = offline ? "offline" : on ? "on" : "off";
    root.dataset.state = state; root.classList.toggle("on", on);
    const fld = el("div", "fld"), word = offline ? "Offline" : rule ? JP_WORDS[pic] : "";
    if (on) fld.dataset.fld = "";
    fld.append(jamPictogram(pic));
    if (word) { const w = el("div", "wd"); w.append(el("span", "", word)); fld.append(w); fld.classList.add("hasw"); }
    const bd = el("div", "bd");
    bd.append(el("div", "nm disp", name));
    if (facts.length) {
      const row = el("div", "facts");
      row.style.setProperty("--n", Math.max(2, facts.length));
      for (const f of facts) {
        const d = el("div", "f");
        d.append(el("div", "v num" + (f.word ? " w" : "") + (f.gone ? " unavail" : ""), f.v), el("div", "label", f.label));
        d.title = f.text;
        row.append(d);
      }
      bd.append(row);
    }
    face.append(fld, bd);
    if (live) {
      root.tabIndex = 0; root.setAttribute("role", "button");
      root.setAttribute("aria-label", `${name}${word ? ", " + word.toLowerCase() : on ? ", on" : ""}${facts.length ? ": " + facts.map(f => f.text).join(", ") : ""}`);
      bindActions(root, () => this._hass, c, c.entity);
    }
    b.append(root);
    this._inkWait = !jamFieldInk(b);
  }
  connectedCallback() { super.connectedCallback(); if (this._inkWait && this._body) this._inkWait = !jamFieldInk(this._body); }
  getCardSize() { return 4; }
  getGridOptions() { return {columns: 6, rows: "auto", min_columns: 3}; }
}
register("jam-pictogram", JamPictogram, "Jam Pictogram", "Room tile with an Aicher-style pictogram that follows what's on, plus 2-4 room facts.");
