// Visual editors (theming plan §4, phase 1; src/editors.js): every card with getConfigForm returns a schema whose top-level
// names (flattened through unnamed / flatten grids and expandables) are documented keys of that card in README.md (its
// option table, plus `accent` which every card takes), uses only known selectors / layout types, and its assertConfig
// accepts the starter config. getStubConfig(hass) (the preview hass, and an empty hass for the fallbacks) returns a config
// the card's setConfig accepts and that renders with card.preview = true without page errors. assertConfig sends
// {entity, name} list items (and other values the form cannot show) to YAML, and keys outside the schema survive an
// ha-form style edit ({...config, ...change}). window.customCards: name, description, documentationURL (README anchor that
// exists), preview: true exactly for the cards with a starter config. Fixture cards: logs how many configs fit the form.
// Phase 1b / 2 (object lists): every object field's item keys are named in its README row; for every fixture config that
// fits, each object list round-trips through a simulated item dialog ({...item, ...change}, an unknown item key kept) and
// every item key is a form field; mixed lists (bare ids / uris), a string bad.state and jam-tv `launchers` go to YAML.
// jam-screensaver with card.preview: no idle timer, no overlay, no kiosk chrome, no motion switch; it starts when preview
// turns false and restores everything when removed.
// No fixture; runs on the dark/1280 preview page and waits out the entrance batch window for 95-motion.
const fs = require("fs");
const path = require("path");

const PHASE1 = ["jam-heading", "jam-hero", "jam-tile", "jam-choice", "jam-slider", "jam-button", "jam-gauge", "jam-fan",
  "jam-weather", "jam-graph", "jam-alerts", "jam-light", "jam-speaker",
  "jam-media", "jam-house", "jam-screensaver", // phase 1b
  "jam-list", "jam-panel", "jam-tabs", "jam-scenes", "jam-tv"]; // phase 2 (object lists; jam-tv: main keys + sources). 1.0.0: jam-looks and the look cards are gone
const SELECTORS = new Set(["entity", "text", "number", "boolean", "select", "icon", "ui_action", "ui_color", "config_entry", "object", "color_rgb"]);

/* README "### jam-x" section -> the backticked option names of its table's first column (+ rows: option -> its table row). */
function readmeKeys() {
  const md = fs.readFileSync(path.join(__dirname, "..", "..", "README.md"), "utf8");
  const out = {}, rows = {};
  for (const sec of md.split(/^### /m).slice(1)) {
    const tag = sec.split("\n")[0].trim();
    const keys = new Set(["accent"]);
    rows[tag] = {};
    for (const line of sec.split("\n")) {
      const m = /^\| ([^|]+) \|/.exec(line);
      if (m) for (const k of m[1].matchAll(/`([a-z_]+)`/g)) { keys.add(k[1]); rows[tag][k[1]] = line; }
    }
    out[tag] = keys;
  }
  return {keys: out, rows};
}

module.exports = async (page, check) => {
  const errors = [];
  const onErr = e => errors.push(e.message);
  page.on("pageerror", onErr);
  const r = await page.evaluate(async ({PHASE1, SELECTORS}) => {
    const tick = ms => new Promise(res => setTimeout(res, ms));
    const known = new Set(SELECTORS);
    const fields = (schema, out = []) => {
      for (const f of schema) { if (f.schema && (!f.name || f.flatten)) fields(f.schema, out); else out.push(f); }
      return out;
    };
    const all = (schema, out = []) => { for (const f of schema) { out.push(f); if (f.schema) all(f.schema, out); } return out; };
    const res = {cards: [], entries: [], fixtures: {}};
    const box = document.createElement("div"); box.style.cssText = "position:absolute;left:0;top:0;width:420px"; document.body.append(box);
    for (const e of window.customCards.filter(e => /^jam-/.test(e.type))) {
      const cls = customElements.get(e.type);
      res.entries.push({type: e.type, name: e.name, description: e.description, doc: e.documentationURL, preview: e.preview,
        stub: !!(cls && cls.getStubConfig), form: !!(cls && cls.getConfigForm)});
      if (!cls || !cls.getConfigForm) continue;
      const c = {tag: e.type};
      try {
        const form = cls.getConfigForm();
        c.names = fields(form.schema).map(f => f.name);
        c.optional = fields(form.schema).filter(f => !f.required && f.selector && f.name !== "accent").map(f => f.name);
        // Object fields: their item fields (recursively), checked like top-level ones.
        const sub = f => { const o = f.selector && f.selector.object; return o && o.fields ? Object.entries(o.fields).map(([name, x]) => ({name, ...x})) : []; };
        const deep = (list, out = []) => { for (const f of list) { out.push(f); deep(sub(f), out); } return out; };
        const tree = f => sub(f).map(g => sub(g).length ? {name: g.name, sub: tree(g)} : {name: g.name});
        c.objs = fields(form.schema).filter(f => sub(f).length).map(f => ({name: f.name, multiple: !!f.selector.object.multiple, sub: tree(f)}));
        c.badSel = deep(all(form.schema)).filter(f => f.schema ? !["grid", "expandable"].includes(f.type) || !Array.isArray(f.schema)
          : !f.selector || !known.has(Object.keys(f.selector)[0])).map(f => f.name || f.type);
        c.objDefaults = deep(fields(form.schema).flatMap(sub)).filter(f => "default" in f).map(f => f.name); // written into new items
        c.labelsOk = fields(form.schema).every(f => typeof form.computeLabel(f) === "string");
        c.stubs = [];
        for (const [which, hass] of [["preview", window.__hass], ["empty", {...window.__hass, states: {}}]]) {
          const s = {which};
          try {
            const stub = await cls.getStubConfig(hass, [], []);
            s.hasType = "type" in stub;
            const cfg = {type: "custom:" + e.type, ...stub};
            s.cfg = JSON.stringify(stub);
            form.assertConfig(cfg); s.assert = true;
            const el = document.createElement(e.type); el.preview = true;
            el.setConfig(cfg); s.set = true;
            // jam-looks draws each look's swatch in that look's font: here only the Poster theme, so the Poster page
            // fetches no look-pack font before 96-packs checks exactly that.
            el.hass = window.__hass;
            box.append(el); await tick(60);
            s.rendered = !!el.shadowRoot && (el.shadowRoot.querySelectorAll("*").length > 2 || !!el.layer); // screensaver: style + layer
            s.overlay = !!document.querySelector("body > .jam-sheet, body > .pop");
            // ha-form edit: {...data, ...change}; an unknown key survives and the edited config is still accepted.
            const edited = {...cfg, jam_unknown: {keep: [1, 2]}, [c.optional[c.optional.length - 1]]: undefined};
            form.assertConfig(edited); el.setConfig(edited); s.edit = edited.jam_unknown.keep.length === 2;
            // Object list in the stub: an item dialog edit ({...item, ...change}) with an unknown item key is accepted.
            for (const o of c.objs.filter(o => o.multiple && Array.isArray(cfg[o.name]) && cfg[o.name].length)) {
              const ed2 = {...cfg, [o.name]: cfg[o.name].map((x, i) => i ? x : {...x, jam_item: 1})};
              form.assertConfig(ed2); el.setConfig(ed2); s.items = (s.items || 0) + 1;
            }
            el.remove();
          } catch (err) { s.err = String(err && err.message || err); }
          c.stubs.push(s);
        }
      } catch (err) { c.err = String(err && err.message || err); }
      res.cards.push(c);
    }
    box.remove();
    await tick(450); // the view entrance counts cards connected within 400 ms as one batch (95-motion measures a fresh one)
    // assertConfig against every fixture card on the page: which configs the form sends to YAML.
    const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);
    const fixtureCfgs = [];
    for (const el of document.querySelectorAll("#view *")) {
      const cls = el._config && customElements.get(el.localName);
      if (!cls || !cls.getConfigForm) continue;
      const f = res.fixtures[el.localName] || (res.fixtures[el.localName] = {ok: 0, yaml: [], lists: 0, uncovered: [], trip: []});
      try { cls.getConfigForm().assertConfig(el._config); f.ok++; fixtureCfgs.push([el.localName, el._config]); } catch (err) { f.yaml.push(String(err.message)); }
    }
    res.extra = {};
    /* Configs from the README examples and the kiosk fixture (no fixture has them on these cards). */
    const extra = [
      ["jam-screensaver", {type: "custom:jam-screensaver", mode_entity: "input_select.kitchen_kiosk_screensaver",
        now: [{type: "media", entity: "media_player.tv", states: ["playing", "paused"], kicker: "On the TV", app_entity: "sensor.tv_app"},
          {type: "media", entity: "media_player.kitchen"}],
        disable_on: [{entity: "media_player.tv", state: "playing"}, {entity: "input_boolean.guests"}], active_hours: {from: "06:00", to: "23:00"}}],
      ["jam-screensaver", {type: "custom:jam-screensaver", mode: "images", images: {media: "media-source://media_source/local/Photos/slides", interval: 20, shuffle: true}, poster_every: 4}],
      ["jam-tv", {type: "custom:jam-tv", media_player: "media_player.living_room_tv", remote: "remote.living_room_tv",
        sources: [{name: "YouTube", color: "red", exact: true, match: {app: ["YouTube", "com.google.android.youtube.tv"]},
          tap_action: {action: "perform-action", perform_action: "select.select_option", target: {entity_id: "select.tv_launch_app"}, data: {option: "YouTube"}}},
          {name: "Console", color: "green", match: {input: "HDMI 1"}, tap_action: {action: "none"}}],
        stereo: {power_action: {action: "none"}, inputs: [{name: "TV", tap_action: {action: "none"}}]}}],
      ["jam-light", {type: "custom:jam-light", entity: "light.kitchen_lamp", presets: [{name: "Red", rgb_color: [255, 0, 0], brightness_pct: 40}]}],
      ["jam-speaker", {type: "custom:jam-speaker", entity: "media_player.kitchen", pinned: [{uri: "library://playlist/12", name: "Cooking"}]}],
      ["jam-list", {type: "custom:jam-list", title: "Smol Boi", entities: [{entity: "device_tracker.smol_boi"},
        {entity: "sensor.system_monitor_memory_usage", name: "Memory", secondary_info: "last-changed"}]}],
    ];
    for (const [tag, cfg] of extra) {
      try { customElements.get(tag).getConfigForm().assertConfig(cfg); fixtureCfgs.push([tag, cfg]); res.extra[tag] = (res.extra[tag] || 0) + 1; }
      catch (err) { (res.extraErr || (res.extraErr = [])).push(`${tag}: ${err.message}`); }
    }
    /* Round trip of every object list in a config that fits: the item keys are form fields (nested objects too), and an
       item dialog edit ({...item, ...change} with an unknown key, then a real field set to its own value) gives a config
       assertConfig and the card's setConfig accept, with every other item unchanged. */
    for (const [tag, cfg] of fixtureCfgs) {
      const f = res.fixtures[tag] || (res.fixtures[tag] = {ok: 0, yaml: [], lists: 0, uncovered: [], trip: []});
      const form = customElements.get(tag).getConfigForm();
      const objs = form.schema && (function flat(schema, out = []) { for (const x of schema) { if (x.schema && (!x.name || x.flatten)) flat(x.schema, out); else out.push(x); } return out; })(form.schema)
        .filter(x => x.selector && x.selector.object && x.selector.object.fields);
      for (const o of objs) {
        const v = cfg[o.name];
        if (v === undefined || v === null || v === "") continue;
        f.lists++;
        const keysOf = (sel, item, at) => { // item keys outside the fields, recursively
          const fl = sel.object.fields;
          for (const k of Object.keys(item)) {
            if (!(k in fl)) f.uncovered.push(`${at}.${k}`);
            else if (fl[k].selector.object && fl[k].selector.object.fields && item[k] && typeof item[k] === "object") {
              for (const y of fl[k].selector.object.multiple ? [].concat(item[k]) : [item[k]]) keysOf(fl[k].selector, y, `${at}.${k}`);
            }
          }
        };
        const items = o.selector.object.multiple ? [].concat(v) : [v];
        items.forEach(x => keysOf(o.selector, x, o.name));
        const first = Object.keys(o.selector.object.fields)[0];
        items.forEach((item, i) => {
          const edited = {...item, jam_item: {keep: true}, ...(first in item ? {[first]: item[first]} : {})};
          const list = items.map((x, j) => j === i ? edited : x);
          const next = {...cfg, [o.name]: o.selector.object.multiple ? list : edited};
          try {
            form.assertConfig(next);
            const card = document.createElement(tag); card.preview = true; card.setConfig(next);
            const ok = list.every((x, j) => j === i ? same({...x, jam_item: undefined}, {...item, jam_item: undefined}) && x.jam_item.keep : x === items[j]);
            if (!ok) f.trip.push(`${o.name}[${i}] changed`);
          } catch (err) { f.trip.push(`${o.name}[${i}]: ${err.message}`); }
        });
      }
    }
    // Explicit cases.
    const gf = customElements.get("jam-graph").getConfigForm();
    const throws = (form, cfg) => { try { form.assertConfig(cfg); return false; } catch (e) { return true; } };
    res.graphObj = throws(gf, {type: "custom:jam-graph", entities: [{entity: "sensor.a", name: "A"}]});
    res.graphStr = throws(gf, {type: "custom:jam-graph", entities: ["sensor.a"], chips: [{x: 1}]});
    const ff = customElements.get("jam-fan").getConfigForm();
    res.fanPresetsFalse = throws(ff, {type: "custom:jam-fan", entity: "fan.x", presets: false, speeds: [25, 50]});
    res.fanSensorObj = throws(ff, {type: "custom:jam-fan", entity: "fan.x", sensor: {entity: "sensor.q", name: "Q"}});
    const gg = customElements.get("jam-gauge").getConfigForm();
    res.gaugeSev = throws(gg, {type: "custom:jam-gauge", entity: "sensor.x", severity: {green: 0, yellow: 60, red: 85}});
    res.gaugeSevBad = throws(gg, {type: "custom:jam-gauge", entity: "sensor.x", severity: [0, 60]});
    const hf = customElements.get("jam-hero").getConfigForm();
    res.heroChips = throws(hf, {type: "custom:jam-hero", title: "x", chips: [{entity: "sensor.x", tone: "paper"}]});
    res.accentAlias = throws(customElements.get("jam-tile").getConfigForm(), {type: "custom:jam-tile", entity: "light.x", accent: "kitchen"});
    const form = tag => customElements.get(tag).getConfigForm();
    res.yamlCases = {
      listBareId: throws(form("jam-list"), {type: "custom:jam-list", entities: ["sun.sun", {entity: "sun.sun", name: "Sun"}]}),
      pinnedBareUri: throws(form("jam-speaker"), {type: "custom:jam-speaker", entity: "media_player.x", pinned: ["library://playlist/1"]}),
      tvLaunchers: throws(form("jam-tv"), {type: "custom:jam-tv", media_player: "media_player.x", launchers: [{name: "A"}]}),
      panelBadStateText: throws(form("jam-panel"), {type: "custom:jam-panel", title: "x", rows: [{entity: "sensor.x", bad: {state: "off"}}]}),
      heroChipNotObject: throws(form("jam-hero"), {type: "custom:jam-hero", chips: ["sensor.x"]}),
      tabsNotList: throws(form("jam-tabs"), {type: "custom:jam-tabs", tabs: {name: "A", path: "/a"}}),
      lightRgbText: throws(form("jam-light"), {type: "custom:jam-light", entity: "light.x", presets: [{name: "A", rgb_color: "red"}]}),
    };
    res.formCases = {
      disableOnOne: !throws(form("jam-screensaver"), {type: "custom:jam-screensaver", disable_on: {entity: "media_player.x", state: "playing"}}),
      imagesRemoved: !throws(form("jam-screensaver"), {type: "custom:jam-screensaver", images: ""}),
      tvMatchText: !throws(form("jam-tv"), {type: "custom:jam-tv", media_player: "media_player.x", sources: [{name: "A", match: {app: "A", input: ["HDMI 1"]}}], input_app: "Live TV"}),
      sceneData: !throws(form("jam-scenes"), {type: "custom:jam-scenes", scenes: [{entity: "scene.x", data: {transition: 2, any: [1, {x: 2}]}}]}),
      itemUnknownKey: !throws(form("jam-tabs"), {type: "custom:jam-tabs", tabs: [{name: "A", path: "/a", jam_future: {x: 1}}]}),
    };
    // jam-screensaver with card.preview (HA sets it in the picker, the card editor and edit mode).
    {
      const motion0 = window.JamCards.motion, kiosk0 = (() => { const c = document.querySelector("jam-screensaver"); return c ? c.kioskActive : false; })();
      const ss = document.createElement("jam-screensaver"); ss.preview = true;
      ss.setConfig({type: "custom:jam-screensaver", idle_seconds: 1, kiosk: true, motion: false});
      ss.hass = window.__hass; document.body.append(ss);
      await tick(1400);
      const p = {idle: ss._idleT === null, shown: ss._shown, show: !!(ss.overlay && ss.overlay.classList.contains("show")),
        kiosk: ss.kioskActive === kiosk0, motion: window.JamCards.motion === motion0, layerInCard: !!ss.layer && ss.layer.parentNode === ss.shadowRoot};
      ss.setConfig({type: "custom:jam-screensaver", idle_seconds: 600, kiosk: false, motion: false});
      p.idleAfterSet = ss._idleT === null;
      ss.preview = false;
      p.live = ss._idleT !== null && window.JamCards.motion === false;
      ss.preview = true;
      p.back = ss._idleT === null && window.JamCards.motion === motion0;
      ss.preview = false;
      ss.remove();
      p.removed = ss._idleT === null && window.JamCards.motion === motion0;
      res.ssPreview = p;
    }
    return res;
  }, {PHASE1, SELECTORS: [...SELECTORS]});
  page.off("pageerror", onErr);

  const {keys: docs, rows} = readmeKeys();
  const withForm = r.cards.map(c => c.tag).sort();
  check(JSON.stringify(withForm) === JSON.stringify([...PHASE1].sort()), `editors: getConfigForm on the ${PHASE1.length} phase 1 / 1b / 2 cards (${withForm.join(", ")})`);
  for (const c of r.cards) {
    if (c.err) { check(false, `editors ${c.tag}: getConfigForm threw ${c.err}`); continue; }
    const undoc = c.names.filter(n => !(docs[c.tag] && docs[c.tag].has(n)));
    check(!undoc.length, `editors ${c.tag}: form keys documented in README (${c.names.join(" ")})` + (undoc.length ? ` — undocumented: ${undoc.join(", ")}` : ""));
    check(!c.badSel.length && c.labelsOk, `editors ${c.tag}: known selectors / layout types, labels` + (c.badSel.length ? ` — bad: ${c.badSel.join(", ")}` : ""));
    for (const o of c.objs) {
      const row = (rows[c.tag] || {})[o.name] || "";
      const names = (function flat(t, out = []) { for (const x of t) { out.push(x.name); if (x.sub) flat(x.sub, out); } return out; })(o.sub);
      const missing = names.filter(n => !new RegExp(`\\b${n}\\b`).test(row));
      check(!!row && !missing.length, `editors ${c.tag}: ${o.name} item fields named in its README row (${names.join(" ")})` + (missing.length ? ` — missing: ${missing.join(", ")}` : ""));
    }
    check(!c.objDefaults.length, `editors ${c.tag}: no defaults in object fields (they would be written into new items)` + (c.objDefaults.length ? ` — ${c.objDefaults.join(", ")}` : ""));
    for (const s of c.stubs)
      check(!s.err && !s.hasType && s.assert && s.set && s.rendered && !s.overlay && s.edit,
        `editors ${c.tag}: stub (${s.which} hass) ${s.cfg || ""} passes assertConfig + setConfig, renders, survives a form edit` + (s.err ? ` — ${s.err}` : ""));
  }
  const readmeTags = new Set(Object.keys(docs));
  for (const e of r.entries) {
    const anchor = e.doc && e.doc.split("#")[1];
    check(!!e.name && !!e.description && e.doc === "https://github.com/Starkkaman/jam-cards#" + e.type && readmeTags.has(anchor) && e.preview === e.stub,
      `editors customCards ${e.type}: name, description, documentationURL, preview=${e.preview}`);
  }
  check(r.entries.length === 24 && !r.entries.some(e => e.type === "jam-looks"), `editors: 24 jam customCards entries, the retired jam-looks not offered (${r.entries.length})`);
  for (const [tag, f] of Object.entries(r.fixtures)) {
    console.log(`INFO editors fixtures ${tag}: ${f.ok} fit the form, ${f.yaml.length} go to YAML${f.yaml.length ? " (" + [...new Set(f.yaml)].join(" | ") + ")" : ""}`);
    if (f.lists) check(!f.uncovered.length && !f.trip.length, `editors ${tag}: ${f.lists} object lists in fitting fixture / README configs round-trip, every item key is a field` +
      (f.uncovered.length ? ` — not fields: ${[...new Set(f.uncovered)].join(", ")}` : "") + (f.trip.length ? ` — ${f.trip.join(" | ")}` : ""));
  }
  check(!r.extraErr, "editors: README example configs (screensaver now / disable_on / images, tv sources, light rgb preset, speaker pin, list of objects) fit the form" +
    (r.extraErr ? " — " + r.extraErr.join(" | ") : ""));
  for (const [k, v] of Object.entries(r.yamlCases)) check(v, `editors: goes to YAML: ${k}`);
  for (const [k, v] of Object.entries(r.formCases)) check(v, `editors: stays in the form: ${k}`);
  const p = r.ssPreview;
  check(p.idle && !p.shown && !p.show && p.kiosk && p.motion && p.layerInCard && p.idleAfterSet,
    `editors: jam-screensaver with preview: no idle timer, no overlay, no kiosk chrome, no motion switch (${JSON.stringify(p)})`);
  check(p.live && p.back && p.removed, "editors: jam-screensaver starts when preview turns false, stops when it turns true again, restores motion on removal");
  check(r.graphObj && !r.graphStr, "editors: jam-graph {entity, name} items go to YAML, plain ids + unknown keys stay in the form");
  check(r.fanSensorObj && !r.fanPresetsFalse, "editors: jam-fan sensor object goes to YAML; presets / speeds (YAML-only keys) are kept");
  check(!r.gaugeSev && r.gaugeSevBad, "editors: jam-gauge severity object fits the nested form, a list does not");
  check(!r.heroChips && !r.accentAlias, "editors: jam-hero chips fit the chips list; accent room alias accepted");
  check(!errors.length, "editors: no page errors" + (errors.length ? " — " + errors.join(" | ") : ""));
};
