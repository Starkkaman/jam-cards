/* ---------- jam-fan: fan / air purifier with on/off pill, speed steps and preset chips ----------
   {type: custom:jam-fan, entity (fan.*), name?, speeds?: [percent, ...] (default from percentage_step, e.g. 25 -> 25/50/75/100;
    none when the fan cannot set a speed), presets?: [mode, ...] (default the fan's preset_modes; false or [] = no preset chips),
    sensor?: id | {entity, name?} (kicker, e.g. air quality "Excellent"), extra_sensor?: id | {entity, name?}
    (kicker, "PM2.5 1 µg/m³"; name defaults from the device class), accent? (DESIGN "Colour system")}
   Slab card: name + On/Off pill (accent when on; fan.turn_on / turn_off), segmented speed keys (active = accent;
   fan.set_percentage), preset chips (active = accent; fan.set_preset_mode). While a preset runs no speed is active.
   Pill, speed keys and preset chips use the chip cut (bottom-right 6px). Unavailable = red pill, controls disabled. */
const JAM_FAN_SET_SPEED = 1, JAM_FAN_PRESET = 8;
const JAM_FAN_DC = {pm25: "PM2.5", pm10: "PM10", pm1: "PM1", carbon_dioxide: "CO₂", volatile_organic_compounds: "VOC", aqi: "AQI"};
class JamFan extends JamBase {
  validate(c) {
    if (!c.entity || !c.entity.startsWith("fan.")) throw new Error("jam-fan: entity must be a fan");
    for (const k of ["speeds", "presets"]) if (c[k] !== undefined && !Array.isArray(c[k]) && !(k === "presets" && c[k] === false))
      throw new Error(`jam-fan: ${k} must be a list` + (k === "presets" ? " (or false)" : ""));
  }
  _sid(x) { return (x && x.entity) || (typeof x === "string" ? x : null); }
  watched() { const c = this._config; return [c.entity, this._sid(c.sensor), this._sid(c.extra_sensor)].filter(Boolean); }
  css() { return `
    .wrap{display:grid;gap:10px;align-content:start}
    .head{display:flex;justify-content:space-between;align-items:center;gap:10px}
    .nm{display:grid;gap:5px;min-width:0}
    .nm h3{font-size:1.45rem;overflow-wrap:anywhere;cursor:pointer}
    .nm .label .nc{text-transform:none;letter-spacing:.06em}
    .pill{flex:none;min-width:64px;height:auto}
    .pill > .face{--p-t:10px;--p-b:10px}
    .seg{display:grid;grid-template-columns:repeat(var(--n,4),minmax(0,1fr));gap:4px}
    .seg .key{min-width:0}
    .seg .key > .face{--p-t:14px;--p-b:14px;--p-l:4px;--p-r:6px;min-height:48px;display:flex;align-items:center;justify-content:center}
    .chips{display:flex;flex-wrap:wrap;gap:6px}
    .chips .key{min-width:0}
    .chips .key > .face{--p-t:10px;--p-b:10px;--p-l:12px;--p-r:12px;min-height:38px;display:flex;align-items:center;font-size:.66rem}`; }
  _speeds(a) {
    const c = this._config;
    if (Array.isArray(c.speeds)) return c.speeds.map(Number).filter(v => v > 0 && v <= 100);
    const step = Number(a.percentage_step), feat = Number(a.supported_features) || 0;
    if (step > 0 && step < 100 && 100 / step <= 10) {
      const out = [];
      for (let v = step; v < 100 - 0.5; v += step) out.push(Math.round(v));
      return [...out, 100];
    }
    return (feat & JAM_FAN_SET_SPEED) || a.percentage != null ? [25, 50, 75, 100] : [];
  }
  _kicker() {
    const c = this._config, h = this._hass, k = el("div", "label");
    const part = (x, isExtra) => {
      const id = this._sid(x), st = stateObj(h, id);
      if (!st || UNAVAILABLE.has(st.state)) return null;
      const name = (x && x.name) || (isExtra ? JAM_FAN_DC[st.attributes.device_class] : null);
      const span = el("span");
      if (name) span.append(el("span", "", name + " "));
      span.append(el("span", isExtra ? "nc" : "", fmtState(h, st)));
      return span;
    };
    const parts = [part(c.sensor, false), part(c.extra_sensor, true)].filter(Boolean);
    parts.forEach((p, i) => { if (i) k.append(document.createTextNode(" · ")); k.append(p); });
    return parts.length ? k : null;
  }
  render(b) {
    const c = this._config, h = this._hass, s = stateObj(h, c.entity), a = (s && s.attributes) || {};
    const bad = !s || UNAVAILABLE.has(s.state), on = !bad && s.state === "on", feat = Number(a.supported_features) || 0;
    const {root, face: wrap} = this.paper(c.entity, {face: "wrap" + (bad ? " unavail" : "")});
    const call = (svc, data) => h.callService("fan", svc, {entity_id: c.entity, ...data});

    const head = el("div", "head"), nm = el("div", "nm");
    const t = asButton(el("h3", "disp", c.name || friendly(h, c.entity)), () => moreInfo(this, c.entity));
    nm.append(t);
    const kick = this._kicker(); if (kick) nm.append(kick);
    const pill = cutKey(bad ? "N/A" : on ? "On" : "Off", `jam-fan|${c.entity}|pill`, "pill" + (bad ? " alert" : on ? " on" : ""), "chip");
    pill.dataset.key = "power"; pill.disabled = bad; pill.setAttribute("aria-pressed", on ? "true" : "false");
    pill.setAttribute("aria-label", `${c.name || friendly(h, c.entity)} power`);
    pill.onclick = () => call(on ? "turn_off" : "turn_on");
    head.append(nm, pill); wrap.append(head);

    const speeds = this._speeds(a);
    if (speeds.length) {
      const pct = Number(a.percentage), preset = a.preset_mode;
      let act = null;
      if (on && !preset && pct > 0) {
        act = speeds.reduce((m, v) => (Math.abs(v - pct) < Math.abs(m - pct) ? v : m), speeds[0]);
        const gap = speeds.length > 1 ? Math.min(...speeds.slice(1).map((v, i) => v - speeds[i])) : 100;
        if (Math.abs(act - pct) > gap / 2) act = null;
      }
      const seg = el("div", "seg"); seg.style.setProperty("--n", speeds.length);
      for (const v of speeds) {
        const k = cutKey(v + "%", `jam-fan|${c.entity}|speed|${v}`, v === act ? "on" : "", "chip");
        k.dataset.pct = String(v); k.disabled = bad; k.setAttribute("aria-pressed", v === act ? "true" : "false");
        k.onclick = () => call("set_percentage", {percentage: v});
        seg.append(k);
      }
      wrap.append(seg);
    }

    const presets = c.presets === false ? [] : Array.isArray(c.presets) ? c.presets : (feat & JAM_FAN_PRESET) || a.preset_modes ? a.preset_modes || [] : [];
    if (presets.length) {
      const row = el("div", "chips");
      for (const p of presets) {
        const act = on && a.preset_mode === p;
        const k = cutKey(String(p), `jam-fan|${c.entity}|preset|${p}`, act ? "on" : "", "chip");
        k.dataset.preset = String(p); k.disabled = bad; k.setAttribute("aria-pressed", act ? "true" : "false");
        k.onclick = () => call("set_preset_mode", {preset_mode: p});
        row.append(k);
      }
      wrap.append(row);
    }
    b.append(root);
  }
  getCardSize() { return 3; }
}
register("jam-fan", JamFan, "Jam Fan", "Fan / air purifier: on/off pill, speed steps, preset chips and an air-quality kicker.");
