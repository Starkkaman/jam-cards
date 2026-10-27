// Data cards: jam-graph (history WS query, downsampling, legend, crosshair tooltip, throttle, config error) and
// jam-weather (forecast subscription + unsubscribe, clock, forecast columns). Fixture: preview/fixtures/40-data.js.
module.exports = async (page, check) => {
  const graphs = () => page.evaluate(() => [...document.querySelectorAll("jam-graph")].map(g => {
    const r = g.shadowRoot;
    return {title: g._config.title || "", ids: g._config.entities.map(e => e.entity || e), style: g._config.style || "line",
      svg: !!r.querySelector("svg"), legend: r.querySelectorAll(".lg button").length, cur: !!r.querySelector(".cur"),
      n: [...r.querySelectorAll("[data-n]")].map(p => +p.dataset.n),
      segs: [...r.querySelectorAll("path.ln")].map(p => (p.getAttribute("d").match(/[MLHV]/g) || []).length)};
  }));
  await page.waitForFunction(() => [...document.querySelectorAll("jam-graph")].every(g => g.shadowRoot.querySelector("svg")), null, {timeout: 5000}).catch(() => {});
  const gs = await graphs();
  const multi = gs.find(g => g.title === "Temperature"), bars = gs.find(g => g.style === "bars"), single = gs.find(g => g.style === "step");
  check(multi && bars && single && gs.every(g => g.svg), `jam-graph: three fixture graphs drew an SVG (${gs.length})`);

  // History query: one WS call per card with exactly its entity_ids and a hours_to_show window ending now.
  const ws = await page.evaluate(() => window.__ws || []);
  const ids5 = ["sensor.home_temperature", "sensor.living_room_sensor_temperature", "sensor.bedroom_sensor_temperature", "sensor.office_sensor_temperature", "sensor.kitchen_sensor_temperature"];
  const q = ws.find(m => JSON.stringify(m.entity_ids) === JSON.stringify(ids5));
  const win = q ? Date.parse(q.end_time) - Date.parse(q.start_time) : 0;
  check(q && q.type === "history/history_during_period" && Math.abs(win - 24 * 3600e3) < 1000 && Math.abs(Date.now() - Date.parse(q.end_time)) < 60e3
    && q.minimal_response === true && q.no_attributes === true && q.significant_changes_only === false,
    `jam-graph: history WS called with the 5 entity_ids and a 24 h window ending now (window ${win / 3600e3} h)`);
  check(ws.some(m => JSON.stringify(m.entity_ids) === '["sensor.serenity_current_consumption"]'), "jam-graph: bars card queries its own entity");

  // ≤240 points per series (the fixture sends ~500 rows for the house and ~2900 for the power sensor).
  const all = gs.flatMap(g => g.n);
  check(all.length === 5 + 1 + 1 && all.every(n => n > 0 && n <= 240), `jam-graph: every series has 1..240 points (${all.join(",")})`);
  check(single.n[0] > 150 && single.segs[0] <= 2 * 240, `jam-graph: downsampled series keep shape (${single.n[0]} points, ${single.segs[0]} path commands)`);
  check(bars.n[0] === 24 || bars.n[0] === 25, `jam-graph: bars = one mean per clock hour over 24 h (${bars.n[0]} bars)`);

  // Legend chips only for ≥2 series; single series shows the big current value instead.
  check(multi.legend === 5 && single.legend === 0 && bars.legend === 0, `jam-graph: legend chips for multi (${multi.legend}), none for single (${single.legend}, ${bars.legend})`);
  check(single.cur && bars.cur && !multi.cur, "jam-graph: big current numeral on single-series cards only");

  // Crosshair tooltip on hover: one value per series.
  const box = await page.evaluate(() => {
    const g = [...document.querySelectorAll("jam-graph")].find(x => x._config.title === "Temperature");
    g.scrollIntoView({block: "center"});
    const r = g.shadowRoot.querySelector(".plot").getBoundingClientRect();
    return {x: r.x, y: r.y, w: r.width, h: r.height};
  });
  await page.mouse.move(box.x + box.w * 0.6, box.y + box.h / 2);
  const tip = await page.evaluate(() => {
    const r = [...document.querySelectorAll("jam-graph")].find(x => x._config.title === "Temperature").shadowRoot, t = r.querySelector(".tip");
    return {shown: !!t && !t.hidden && t.offsetWidth > 0, vals: t ? [...t.querySelectorAll(".v")].map(v => v.textContent) : [],
      cross: r.querySelector(".cross") && r.querySelector(".cross").getAttribute("visibility")};
  });
  check(tip.shown && tip.vals.length === 5 && tip.vals.every(v => /\d/.test(v)) && tip.cross === "visible",
    `jam-graph: hover shows crosshair + tooltip with one value per series (${tip.vals.join(" | ")})`);
  await page.mouse.move(2, 2);
  check(await page.evaluate(() => [...document.querySelectorAll("jam-graph")].find(x => x._config.title === "Temperature").shadowRoot.querySelector(".tip").hidden),
    "jam-graph: tooltip hides when the pointer leaves");

  // Throttle: a new entity set fetches at once; a state change right after that fetch waits for the minute to pass.
  const thr = await page.evaluate(async () => {
    const g = [...document.querySelectorAll("jam-graph")].find(x => x._config.style === "step"), h = window.__hass;
    const n0 = window.__ws.length;
    g.setConfig({...g._config, entities: ["sensor.office_sensor_temperature"]});
    await new Promise(r => setTimeout(r, 120));
    const after = window.__ws.slice(n0), n1 = window.__ws.length;
    h.states["sensor.office_sensor_temperature"] = {...h.states["sensor.office_sensor_temperature"], state: "79.7", last_updated: "t1"};
    g.hass = {...h};
    await new Promise(r => setTimeout(r, 120));
    return {refetch: after.length === 1 && after[0].entity_ids.join() === "sensor.office_sensor_temperature",
      throttled: window.__ws.length === n1, pending: !!g._pending, cur: g.shadowRoot.querySelector(".cur").textContent};
  });
  check(thr.refetch, "jam-graph: changing the entities refetches at once");
  check(thr.throttled && thr.pending && /79[.,]7/.test(thr.cur), `jam-graph: state change within a minute of the last fetch is deferred, live value still updates (${thr.cur})`);

  // Unavailable / non-numeric current value: "—" in --dim, no unit.
  const na = await page.evaluate(() => {
    const g = [...document.querySelectorAll("jam-graph")].find(x => x._config.style === "step"), h = window.__hass, id = "sensor.office_sensor_temperature", keep = h.states[id], out = [];
    for (const st of ["unavailable", "unknown", "n/a"]) {
      h.states[id] = {...keep, state: st, last_updated: "na" + st}; g.hass = {...h};
      const c = g.shadowRoot.querySelector(".cur"), probe = document.createElement("span");
      probe.style.color = "var(--jam-dim, #9a8f7c)"; g.shadowRoot.append(probe);
      out.push({t: c.textContent, unit: !!c.querySelector("small"), dim: getComputedStyle(c).color === getComputedStyle(probe).color});
      probe.remove();
    }
    h.states[id] = keep; g.hass = {...h};
    return out;
  });
  check(na.every(x => x.t === "—" && !x.unit && x.dim), `jam-graph: unavailable/unknown/non-numeric current = dim "—", no unit (${na.map(x => x.t + (x.unit ? "+unit" : "") + (x.dim ? "" : " not dim")).join(", ")})`);

  // Loading motif before data, then a 6th series is an in-card config error (no throw).
  const tmp = await page.evaluate(() => {
    const g = document.createElement("jam-graph");
    g.setConfig({type: "custom:jam-graph", entities: ["sensor.a", "sensor.b", "sensor.c", "sensor.d", "sensor.e", "sensor.f"]});
    g.hass = window.__hass;
    document.body.append(g);
    const err = g.shadowRoot.querySelector(".err"), text = err ? err.textContent : "";
    const svgOrArm = !!g.shadowRoot.querySelector("svg, .arm");
    const g2 = document.createElement("jam-graph");
    g2.setConfig({type: "custom:jam-graph", entities: ["sensor.bedroom_sensor_temperature"]});
    g2.hass = window.__hass;
    document.body.append(g2);
    const loading = !!g2.shadowRoot.querySelector(".plot .arm");
    g.remove(); g2.remove();
    return {text, svgOrArm, loading};
  });
  check(/max 5/.test(tmp.text) && !tmp.svgOrArm, `jam-graph: 6 entities -> in-card config error ("${tmp.text}")`);
  check(tmp.loading, "jam-graph: Golden Arm loading motif while history loads");

  // Weather: subscriptions per card with the configured forecast_type.
  await page.waitForFunction(() => [...document.querySelectorAll("jam-weather")].every(w => w.shadowRoot.querySelector(".col")), null, {timeout: 5000}).catch(() => {});
  const subs = await page.evaluate(() => (window.__wsSubs || []).map(s => ({...s.msg, active: s.active})));
  check(subs.some(s => s.type === "weather/subscribe_forecast" && s.entity_id === "weather.bungalo_weather" && s.forecast_type === "daily" && s.active),
    "jam-weather: subscribes weather/subscribe_forecast daily (default) for bungalo");
  check(subs.some(s => s.entity_id === "weather.cabin_weather" && s.forecast_type === "twice_daily" && s.active), "jam-weather: subscribes with forecast_type twice_daily");
  const wx = await page.evaluate(() => [...document.querySelectorAll("jam-weather")].map(w => ({
    entity: w._config.entity, cols: w.shadowRoot.querySelectorAll(".fc > .col").length, today: w.shadowRoot.querySelectorAll(".col.today").length,
    time: (w.shadowRoot.querySelector(".time") || {}).textContent, word: w.shadowRoot.querySelector(".word").textContent,
    glyphs: [...w.shadowRoot.querySelectorAll("svg.gl")].map(s => s.children.length)})));
  const bung = wx.find(w => w.entity === "weather.bungalo_weather"), cabin = wx.find(w => w.entity === "weather.cabin_weather");
  check(bung.cols === 5 && cabin.cols === 6, `jam-weather: forecast renders \`days\` columns (${bung.cols}/5, ${cabin.cols}/6)`);
  check(bung.today === 1, "jam-weather: today's column is highlighted");
  const d = new Date(), hhmm = `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
  check(/^\d{1,2}:\d\d/.test(bung.time || "") && cabin.time === undefined, `jam-weather: clock shows the time (${bung.time}, now ${hhmm}); none without clock`);
  // Time format follows hass.locale.time_format: "12" -> "6:54" + small "PM"; "24" -> "18:54". Graph axis + tooltip too.
  const tfmt = await page.evaluate(async () => {
    const w = [...document.querySelectorAll("jam-weather")].find(x => x._config.clock), g = [...document.querySelectorAll("jam-graph")].find(x => x._config.title === "Temperature");
    const out = {};
    for (const tf of ["12", "24"]) {
      const h = {...window.__hass, locale: {language: "en", time_format: tf}};
      w.hass = h; g.hass = h; w._clock();
      const t = w.shadowRoot.querySelector(".time"), per = t.querySelector(".per");
      g._show((g._data.t0 + g._data.t1) / 2);
      const n = new Date(), mm = String(n.getMinutes()).padStart(2, "0");
      out[tf] = {want: tf === "12" ? `${n.getHours() % 12 || 12}:${mm}` : `${String(n.getHours()).padStart(2, "0")}:${mm}`, num: t.firstChild.textContent, per: per ? per.textContent : null, perFont: per ? getComputedStyle(per).fontFamily : "",
        axis: [...g.shadowRoot.querySelectorAll("text.ax")].map(x => x.textContent).filter(x => x.includes(":")),
        tip: g.shadowRoot.querySelector(".tip .label").textContent};
      g._hide();
    }
    w.hass = window.__hass; g.hass = window.__hass;
    return out;
  });
  check(tfmt["12"].num === tfmt["12"].want && /^(AM|PM)$/.test(tfmt["12"].per) && /Jost/.test(tfmt["12"].perFont),
    `jam-weather: time_format 12 -> "${tfmt["12"].num}" + small "${tfmt["12"].per}" in Jost (want ${tfmt["12"].want})`);
  check(tfmt["24"].num === tfmt["24"].want && tfmt["24"].per === null, `jam-weather: time_format 24 -> "${tfmt["24"].num}" (want ${tfmt["24"].want})`);
  check(tfmt["12"].axis.length > 0 && tfmt["12"].axis.every(x => /AM|PM/.test(x)) && /AM|PM/.test(tfmt["12"].tip)
    && tfmt["24"].axis.every(x => /^\d\d:\d\d$/.test(x)) && /^\d\d:\d\d$/.test(tfmt["24"].tip),
    `jam-graph: axis + tooltip follow time_format (12: ${tfmt["12"].axis.join(" ")} / ${tfmt["12"].tip}; 24: ${tfmt["24"].axis.join(" ")} / ${tfmt["24"].tip})`);
  check(bung.word === "Clear night" && cabin.word === "Snow", `jam-weather: condition words (${bung.word}, ${cabin.word})`);
  check(wx.every(w => w.glyphs.every(n => n >= 1 && n <= 6)), "jam-weather: every glyph is 1-6 cut shapes");

  // Removing a card unsubscribes; a config change re-subscribes with the new forecast_type.
  const life = await page.evaluate(async () => {
    const w = document.createElement("jam-weather");
    w.setConfig({type: "custom:jam-weather", entity: "weather.bungalo_weather", forecast_type: "hourly"});
    w.hass = window.__hass;
    document.body.append(w);
    await new Promise(r => setTimeout(r, 60));
    const mine = () => window.__wsSubs.filter(s => s.msg.entity_id === "weather.bungalo_weather" && s.msg.forecast_type !== "daily");
    const a = mine().length === 1 && mine()[0].msg.forecast_type === "hourly" && mine()[0].active;
    w.setConfig({type: "custom:jam-weather", entity: "weather.bungalo_weather", forecast_type: "twice_daily"});
    await new Promise(r => setTimeout(r, 30));
    const b = mine().length === 2 && !mine()[0].active && mine()[1].active && mine()[1].msg.forecast_type === "twice_daily";
    w.remove();
    await new Promise(r => setTimeout(r, 30));
    return {a, b, removed: mine().every(s => !s.active)};
  });
  check(life.a, "jam-weather: hourly card subscribes with forecast_type hourly");
  check(life.b, "jam-weather: config change unsubscribes the old forecast and subscribes the new type");
  check(life.removed, "jam-weather: removing the card unsubscribes");

  // show_current: false hides the temperature/condition block; clock and forecast remain.
  const sc = await page.evaluate(async () => {
    const w = document.createElement("jam-weather");
    w.setConfig({type: "custom:jam-weather", entity: "weather.bungalo_weather", clock: true, show_current: false});
    w.hass = window.__hass; document.body.append(w);
    await new Promise(r => setTimeout(r, 60));
    const r = w.shadowRoot, out = {now: !!r.querySelector(".now, .temp, .word"), clock: !!r.querySelector(".time"), fc: !!r.querySelector(".fc")};
    w.remove();
    return out;
  });
  check(!sc.now && sc.clock && sc.fc, `jam-weather: show_current false hides temp/condition, keeps clock + forecast (${JSON.stringify(sc)})`);
};
