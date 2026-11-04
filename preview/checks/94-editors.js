// Visual editors (theming plan §4, phase 1; src/editors.js): every card with getConfigForm returns a schema whose top-level
// names (flattened through unnamed / flatten grids and expandables) are documented keys of that card in README.md (its
// option table, plus `accent` which every card takes), uses only known selectors / layout types, and its assertConfig
// accepts the starter config. getStubConfig(hass) (the preview hass, and an empty hass for the fallbacks) returns a config
// the card's setConfig accepts and that renders with card.preview = true without page errors. assertConfig sends
// {entity, name} list items (and other values the form cannot show) to YAML, and keys outside the schema survive an
// ha-form style edit ({...config, ...change}). window.customCards: name, description, documentationURL (README anchor that
// exists), preview: true exactly for the cards with a starter config. Fixture cards: logs how many configs fit the form.
// No fixture; runs on the dark/1280 preview page and waits out the entrance batch window for 95-motion.
const fs = require("fs");
const path = require("path");

const PHASE1 = ["jam-heading", "jam-hero", "jam-tile", "jam-choice", "jam-slider", "jam-button", "jam-gauge", "jam-fan",
  "jam-weather", "jam-graph", "jam-alerts", "jam-light", "jam-speaker", "jam-looks"];
const SELECTORS = new Set(["entity", "text", "number", "boolean", "select", "icon", "ui_action", "ui_color", "config_entry"]);

/* README "### jam-x" section -> the backticked option names of its table's first column. */
function readmeKeys() {
  const md = fs.readFileSync(path.join(__dirname, "..", "..", "README.md"), "utf8");
  const out = {};
  for (const sec of md.split(/^### /m).slice(1)) {
    const tag = sec.split("\n")[0].trim();
    const keys = new Set(["accent"]);
    for (const line of sec.split("\n")) {
      const m = /^\| ([^|]+) \|/.exec(line);
      if (m) for (const k of m[1].matchAll(/`([a-z_]+)`/g)) keys.add(k[1]);
    }
    out[tag] = keys;
  }
  return out;
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
        c.badSel = all(form.schema).filter(f => f.schema ? !["grid", "expandable"].includes(f.type) || !Array.isArray(f.schema)
          : !f.selector || !known.has(Object.keys(f.selector)[0])).map(f => f.name || f.type);
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
            el.hass = e.type !== "jam-looks" ? window.__hass : {...window.__hass, themes: {...window.__hass.themes, themes: {JamBoard: window.__hass.themes.themes.JamBoard}}};
            box.append(el); await tick(60);
            s.rendered = !!el.shadowRoot && el.shadowRoot.querySelectorAll("*").length > 2;
            s.overlay = !!document.querySelector("body > .jam-sheet, body > .pop");
            // ha-form edit: {...data, ...change}; an unknown key survives and the edited config is still accepted.
            const edited = {...cfg, jam_unknown: {keep: [1, 2]}, [c.optional[c.optional.length - 1]]: undefined};
            form.assertConfig(edited); el.setConfig(edited); s.edit = edited.jam_unknown.keep.length === 2;
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
    for (const el of document.querySelectorAll("#view *")) {
      const cls = el._config && customElements.get(el.localName);
      if (!cls || !cls.getConfigForm) continue;
      const f = res.fixtures[el.localName] || (res.fixtures[el.localName] = {ok: 0, yaml: []});
      try { cls.getConfigForm().assertConfig(el._config); f.ok++; } catch (err) { f.yaml.push(String(err.message)); }
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
    return res;
  }, {PHASE1, SELECTORS: [...SELECTORS]});
  page.off("pageerror", onErr);

  const docs = readmeKeys();
  const withForm = r.cards.map(c => c.tag).sort();
  check(JSON.stringify(withForm) === JSON.stringify([...PHASE1].sort()), `editors: getConfigForm on ${PHASE1.length} cards (phase 1 + jam-looks) (${withForm.join(", ")})`);
  for (const c of r.cards) {
    if (c.err) { check(false, `editors ${c.tag}: getConfigForm threw ${c.err}`); continue; }
    const undoc = c.names.filter(n => !(docs[c.tag] && docs[c.tag].has(n)));
    check(!undoc.length, `editors ${c.tag}: form keys documented in README (${c.names.join(" ")})` + (undoc.length ? ` — undocumented: ${undoc.join(", ")}` : ""));
    check(!c.badSel.length && c.labelsOk, `editors ${c.tag}: known selectors / layout types, labels` + (c.badSel.length ? ` — bad: ${c.badSel.join(", ")}` : ""));
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
  check(r.entries.length === 25, `editors: 25 jam customCards entries (${r.entries.length})`);
  for (const [tag, f] of Object.entries(r.fixtures))
    console.log(`INFO editors fixtures ${tag}: ${f.ok} fit the form, ${f.yaml.length} go to YAML${f.yaml.length ? " (" + [...new Set(f.yaml)].join(" | ") + ")" : ""}`);
  check(r.graphObj && !r.graphStr, "editors: jam-graph {entity, name} items go to YAML, plain ids + unknown keys stay in the form");
  check(r.fanSensorObj && !r.fanPresetsFalse, "editors: jam-fan sensor object goes to YAML; presets / speeds (YAML-only keys) are kept");
  check(!r.gaugeSev && r.gaugeSevBad, "editors: jam-gauge severity object fits the nested form, a list does not");
  check(!r.heroChips && !r.accentAlias, "editors: jam-hero chips kept outside the form; accent room alias accepted");
  check(!errors.length, "editors: no page errors" + (errors.length ? " — " + errors.join(" | ") : ""));
};
