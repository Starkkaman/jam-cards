/* ---------- jam-house: the house strip (inside / outside temperature, front door, who's home, alerts) ----------
   {type: custom:jam-house, inside_entity (temperature sensor), outside_entity (weather.* or sensor.*), lock_entity?,
    people?: [person ids] (only those home are shown, as teal chips with the first name), full_names?: true (chips show
    the full friendly name), alerts?: [{entity, state?, name}] (red chip while
    the entity matches `state`, or without `state` while it is on/open/problem), title? (default
    hass.config.location_name), kicker? (default "<title> · inside"), compact?: true (kiosk: one row, smaller),
    inside_aq? / outside_aq?: {entity, extra?} (or just an entity id; extra is accepted and ignored since 0.3.5),
    attention?: true | {lights?: [light ids]} (audit 2026-11-03, opt-in), humidity_entity? (Hi-Fi: the % beside the inside
    temperature), inside_more? / outside_more? (1.1.0, Hi-Fi: the inside half opens an indoor climate pop-up, the outside
    half a forecast pop-up; false = HA's more-info; options in src/looks/hifi.js "the house's two pop-ups" and the README)}
   Attention strip (opt-in): a strip at the top of the card listing what needs someone, invisible when all is well: the door
   (unlocked / open / jammed / offline; tap on unlocked / open = lock.lock), "N lights offline" (the `lights` list, else every
   light.* in hass; tap = more-info of the first), and poor air ("Air poor inside" / "outside": aqPoor, poor or worse; tap =
   more-info). Alert-red fill, ink text, one 44px key per item.
   Air line under each temperature, words only (0.3.5): "Air · Good". A word state is capitalised ("poor" -> "Poor"); a
   numeric state is a US AQI turned into its category word (Good ≤50, Moderate ≤100, Unhealthy for sensitive ≤150,
   Unhealthy ≤200, Very unhealthy ≤300, Hazardous); no AQI or PM numbers. The line is hidden while the AQ entity is
   missing or unavailable (the config may name a sensor that does not exist yet).
   Door chip: unlocked / open -> red "Door unlocked · lock" (tap = lock.lock, no confirmation); locked -> slab "Door locked"
   (tap = more-info); jammed -> red, tap = more-info; unavailable -> dashed "Door offline" (state grammar), tap = more-info. */
/* Numeric state as written (73.9 stays 73.9, 63.0 -> 63); anything else -> "—". */
function jamHouseNum(v) {
  const n = Number(v);
  return v === null || v === undefined || v === "" || !Number.isFinite(n) ? "—" : String(Math.round(n * 10) / 10);
}
/* {entity, extra?} | "id" -> {entity}; null when no entity (extra is ignored since 0.3.5: words only). */
function jamHouseAq(x) {
  const id = x && typeof x === "object" ? x.entity : x;
  return id && typeof id === "string" ? {entity: id} : null;
}
class JamHouse extends JamBase {
  validate(c) {
    if (!c.inside_entity) throw new Error("jam-house: inside_entity is required");
    if (!c.outside_entity) throw new Error("jam-house: outside_entity is required");
  }
  watched() {
    const c = this._config;
    const aq = [jamHouseAq(c.inside_aq), jamHouseAq(c.outside_aq)].filter(Boolean).map(a => a.entity);
    const ids = [c.inside_entity, c.outside_entity, c.lock_entity, c.humidity_entity, c.inside_humidity_entity, ...(c.people || []),
      ...(c.alerts || []).map(a => a && a.entity), ...aq, ...(this._cmPopIds || [])].filter(x => typeof x === "string" && x); // + an open pop-up's sensors
    if (c.attention) ids.push(...this._attLights());
    return ids;
  }
  /* Lights the attention strip counts: attention.lights, else every light.* in hass. */
  _attLights() {
    const a = this._config.attention, h = this._hass;
    if (a && Array.isArray(a.lights)) return a.lights.filter(x => typeof x === "string");
    return h && h.states ? Object.keys(h.states).filter(id => id.startsWith("light.")) : [];
  }
  /* Attention items [{text, tap, door?}] (opt-in); empty when all is well. door = the lock item (the chip row then leaves
     out its own door chip, so the door is not shown twice). */
  _attention() {
    const c = this._config, h = this._hass, out = [];
    if (!c.attention) return out;
    if (c.lock_entity) {
      const s = stateObj(h, c.lock_entity), st = s ? String(s.state) : "unavailable";
      if (!s || UNAVAILABLE.has(st)) out.push({door: true, text: "Door " + OFFLINE.toLowerCase(), tap: n => moreInfo(n, c.lock_entity)});
      else if (st === "unlocked" || st === "open") out.push({door: true, text: `Door ${st} · lock`, tap: n => jamCall(n, this._hass, "lock", "lock", {entity_id: c.lock_entity}, "run", "Couldn't lock the door")});
      else if (lockAlert(s)) out.push({door: true, text: `Door ${st}`, tap: n => moreInfo(n, c.lock_entity)});
    }
    const dead = this._attLights().filter(id => { const s = stateObj(h, id); return !!s && s.state === "unavailable"; });
    if (dead.length) out.push({text: `${dead.length} ${dead.length === 1 ? "light" : "lights"} ${OFFLINE.toLowerCase()}`, tap: n => moreInfo(n, dead[0])});
    for (const [cfg, where] of [[c.inside_aq, "inside"], [c.outside_aq, "outside"]]) {
      const a = jamHouseAq(cfg), s = a && stateObj(h, a.entity);
      if (s && aqPoor(s.state)) out.push({text: `Air ${aqWord(s.state).toLowerCase()} ${where}`, tap: () => moreInfo(this, a.entity)});
    }
    return out;
  }
  css() { return `
    .house{display:grid;gap:8px;align-content:start}
    .row{display:flex;justify-content:space-between;align-items:flex-end;gap:10px}
    .in,.out{display:grid;gap:4px;min-width:0}
    .out{text-align:right;justify-items:end}
    .temp{font-family:var(--num-font);font-size:calc(2.6rem * var(--num-scale));line-height:calc(.85 * var(--disp-lead));cursor:pointer}
    .temp small{font:500 1rem/1 var(--body);color:var(--dim);text-transform:none;letter-spacing:0;margin-left:1px}
    .otemp{font-family:var(--num-font);font-size:calc(1.8rem * var(--num-scale));line-height:calc(.85 * var(--disp-lead));cursor:pointer;min-width:44px} /* 44px wide box (text aligned as before), so its hit area does not spill */
    .aq{margin-top:2px;cursor:pointer}
    .chips{display:flex;flex-wrap:wrap;gap:6px}
    .chips .chip{padding:8px 10px}
    .chip.red{--chip-bg:var(--red);color:var(--on-fg)}
    .chip.red:focus-visible{outline-color:currentColor}
    .chip.home{--chip-bg:var(--teal);color:var(--on-fg)}
    .chip.offline{--chip-bg:transparent;color:var(--dim)}
    .chip.offline::before{border:2px dashed var(--dim)}
    .compact .house{display:flex;flex-wrap:wrap;align-items:center;gap:8px 16px;--p-t:10px;--p-b:14px}
    .compact .in,.compact .out{text-align:left;justify-items:start}
    .compact .temp{font-size:calc(1.8rem * var(--num-scale))} .compact .otemp{font-size:calc(1.4rem * var(--num-scale))}
    .compact .chips{flex:1 1 auto;justify-content:flex-end}
    /* Attention strip (opt-in): only while something needs someone. */
    .att{display:flex;flex-wrap:wrap;align-items:center;gap:4px 6px;margin:0 0 4px;padding:4px 6px 4px 12px;background:var(--red);color:var(--on-fg)}
    .att .ah{font:var(--lbl-w) max(12px,.72rem)/1.2 var(--body);letter-spacing:calc(.16em * var(--lbl-track));text-transform:var(--lbl-case);margin-right:6px}
    .att button{min-height:44px;padding:0 10px;font:var(--key-w) max(13px,.8rem)/1.1 var(--body);letter-spacing:calc(.08em * var(--key-track));text-transform:var(--key-case);
      color:var(--on-fg);text-align:left;box-shadow:inset 0 0 0 2px var(--on-fg)}
    .att button:focus-visible{outline:3px solid var(--on-fg);outline-offset:2px}
    .compact .att{flex:1 1 100%}`; }
  /* "Air · Good" line (category word only), or null while the AQ entity is missing / unavailable. */
  _aq(cfg) {
    const h = this._hass, a = jamHouseAq(cfg), s = a && stateObj(h, a.entity);
    const word = s ? aqWord(s.state) : null; /* core: AQI number -> category word, word states capitalised */
    if (!word) return null;
    const line = el("div", "label aq", "Air · " + word);
    line.dataset.role = "aq"; line.title = friendly(h, a.entity);
    return asButton(line, () => moreInfo(this, a.entity));
  }
  render(b) {
    const c = this._config, h = this._hass;
    b.classList.toggle("compact", !!c.compact);
    const {root, face} = this.paper("house", {face: "house"});
    const title = c.title || (h.config && h.config.location_name) || "Home";

    // Inside: kicker + big numeral with a small unit.
    const ins = stateObj(h, c.inside_entity);
    const inBox = el("div", "in");
    inBox.append(el("div", "label", c.kicker || `${title} · inside`));
    const t = el("div", "disp temp num", jamHouseNum(ins && ins.state));
    t.title = friendly(h, c.inside_entity);
    const unit = ins && ins.attributes && ins.attributes.unit_of_measurement;
    if (unit && t.textContent !== "—") t.append(el("small", "unit", unit));
    asButton(t, () => moreInfo(this, c.inside_entity));
    inBox.append(t);
    const inAq = this._aq(c.inside_aq); if (inAq) inBox.append(inAq);

    // Outside: "Outside · <condition>" + temperature (weather attribute or sensor state).
    const out = stateObj(h, c.outside_entity), isWx = c.outside_entity.startsWith("weather.");
    const outBox = el("div", "out");
    let word = "";
    if (isWx && out && !UNAVAILABLE.has(out.state)) word = conditionWord(out.state);
    outBox.append(el("div", "label", word ? `Outside · ${word}` : "Outside"));
    const ov = jamHouseNum(out && (isWx ? (out.attributes || {}).temperature : out.state));
    const ot = el("div", "disp otemp num", ov === "—" ? ov : ov + "°");
    ot.title = friendly(h, c.outside_entity);
    asButton(ot, () => moreInfo(this, c.outside_entity));
    outBox.append(ot);
    const outAq = this._aq(c.outside_aq); if (outAq) outBox.append(outAq);

    // Chips: door (unless the attention strip already carries it), people at home, matching alerts.
    const att = this._attention();
    const chips = el("div", "chips");
    if (c.lock_entity && !att.some(it => it.door)) {
      const ls = stateObj(h, c.lock_entity), st = ls ? ls.state : "unavailable";
      let chip;
      if (st === "unlocked" || st === "open") {
        chip = el("button", "chip red", st === "open" ? "Door open · lock" : "Door unlocked · lock");
        chip.onclick = () => jamCall(chip, this._hass, "lock", "lock", {entity_id: c.lock_entity}, "run", "Couldn't lock the door");
      } else if (!ls || UNAVAILABLE.has(st)) {
        chip = el("button", "chip offline", "Door " + OFFLINE.toLowerCase()); // state grammar: a dashed hole, not the alert fill
        chip.onclick = () => moreInfo(this, c.lock_entity);
      } else {
        const red = st === "jammed";
        chip = el("button", "chip" + (red ? " red" : ""), st === "locked" ? "Door locked" : `Door ${st}`);
        chip.onclick = () => moreInfo(this, c.lock_entity);
      }
      chip.type = "button"; chip.dataset.role = "door";
      chips.append(chip);
    }
    for (const id of c.people || []) {
      const ps = stateObj(h, id);
      if (!ps || ps.state !== "home") continue;
      const full = String(friendly(h, id)).trim();
      const chip = el("span", "chip home", c.full_names ? full : (full.split(/\s+/)[0] || full));
      chip.dataset.role = "person"; chip.dataset.entity = id;
      chips.append(chip);
    }
    for (const a of c.alerts || []) {
      if (!a || !a.entity) continue;
      const s = stateObj(h, a.entity);
      if (!s) continue;
      const hit = a.state !== undefined ? String(s.state) === String(a.state) : ["alert", "on"].includes(tone(s));
      if (!hit) continue;
      const chip = el("button", "chip red", a.name || friendly(h, a.entity));
      chip.type = "button"; chip.dataset.role = "alert";
      chip.onclick = () => moreInfo(this, a.entity);
      chips.append(chip);
    }

    if (att.length) {
      const strip = el("div", "att"); strip.dataset.role = "attention";
      strip.setAttribute("role", "group"); strip.setAttribute("aria-label", "Needs attention");
      strip.append(el("span", "ah", "Needs you"));
      for (const it of att) { const k = el("button", "", it.text); k.type = "button"; k.onclick = () => it.tap(k); strip.append(k); }
      face.append(strip);
    }
    if (c.compact) face.append(inBox, outBox);
    else { const row = el("div", "row"); row.append(inBox, outBox); face.append(row); }
    if (chips.childNodes.length) face.append(chips);
    b.append(root);
  }
  getCardSize() { return this._config && this._config.compact ? 1 : 2; }
  getGridOptions() { return {columns: "full", rows: "auto", min_columns: 6}; }
}
register("jam-house", JamHouse, "Jam House", "House strip: inside and outside temperature, door lock chip, who's home, alerts.");
