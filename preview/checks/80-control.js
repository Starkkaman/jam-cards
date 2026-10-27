// Control-room cards: jam-panel (formats, bad thresholds, unavailable rows, row tap) and jam-alerts (sort by
// last_triggered, 12/24 h time, off rows, watched entities, unavailable count, failure chip). Fixture: preview/fixtures/80-control.js.
module.exports = async (page, check) => {
  const panels = await page.evaluate(() => Object.fromEntries([...document.querySelectorAll("jam-panel")].map(p => [p._config.title,
    [...p.shadowRoot.querySelectorAll(".row")].map(r => {
      const v = r.querySelector(".v");
      return {id: r.dataset.entity, name: r.querySelector(".nm").textContent, v: v.textContent, bad: r.classList.contains("bad"),
        color: getComputedStyle(v).color, font: getComputedStyle(v).fontFamily};
    })])));
  const red = await page.evaluate(() => { const s = document.createElement("span"); s.style.color = "var(--jam-red)"; document.body.append(s); const c = getComputedStyle(s).color; s.remove(); return c; });
  const row = (t, n) => (panels[t] || []).find(r => r.name === n) || {};
  check(Object.keys(panels).length >= 4, `jam-panel: fixture panels render (${Object.keys(panels).join(", ")})`);
  const nas = panels.NAS || [];
  check(row("NAS", "CPU").v === "12%" && row("NAS", "Temp").v === "48°C" && row("NAS", "NAS_Effect").v === "45 / 47.8 TB"
    && row("NAS", "Network in").v === "31 MB/s" && row("NAS", "Network out").v === "2 MB/s",
    `jam-panel: formats pct/temp/max/bytes_rate (${nas.map(r => r.v).join(" | ")})`);
  check(row("Network", "Uptime").v === "12 d 4 h" && row("Network", "Router").v === "connected",
    `jam-panel: duration from a timestamp (${row("Network", "Uptime").v}), plain state (${row("Network", "Router").v})`);
  check(/Londrina/.test(row("NAS", "CPU").font) && !row("NAS", "CPU").bad && row("NAS", "CPU").color !== red, "jam-panel: values in Londrina, healthy rows not red");
  // Bad thresholds: below 20 → red; 80.5 stays plain.
  const bats = ["Kitchen sensor", "Front door button", "Bedroom sensor"].map(n => row("Downloads & batteries", n));
  check(bats[0].bad && bats[2].bad && !bats[1].bad && bats[0].color === red && bats[1].color !== red,
    `jam-panel: bad.below 20 turns 18% / 15% red, 81% plain (${bats.map(b => b.v + (b.bad ? "!" : "")).join(" ")})`);
  const pw = row("Serenity", "Power");
  check(pw.v === "unavailable" && pw.bad && pw.color === red, `jam-panel: unavailable entity → red "unavailable" (${pw.v})`);
  // Threshold kinds on a scratch card: above, below, state list, attribute, missing entity.
  const scratch = await page.evaluate(() => {
    const e = document.createElement("jam-panel");
    e.setConfig({type: "custom:jam-panel", title: "T", rows: [
      {entity: "sensor.truenas_system_temperature", format: "temp", bad: {above: 40}},
      {entity: "sensor.truenas_system_temperature", format: "temp", bad: {above: 60, below: 10}},
      {entity: "sensor.downloader_status", bad: {state: ["IDLE"]}},
      {entity: "automation.dim_kiosks_for_tv_at_night", attribute: "current", bad: {above: 0}},
      {entity: "sensor.does_not_exist"},
      {entity: "sensor.downloader_status", tap_action: {action: "none"}},
    ]});
    e.hass = window.__hass; document.body.append(e);
    const out = [...e.shadowRoot.querySelectorAll(".row")].map(r => ({bad: r.classList.contains("bad"), v: r.querySelector(".v").textContent, btn: r.getAttribute("role") === "button"}));
    e.remove(); return out;
  });
  check(scratch[0].bad && !scratch[1].bad && scratch[2].bad && !scratch[3].bad && scratch[3].v === "0" && scratch[4].bad && scratch[4].v === "unavailable"
    && !scratch[5].btn, `jam-panel: above / in-range / state list (case-insensitive) / attribute / missing / tap none (${JSON.stringify(scratch.map(s => s.v + (s.bad ? "!" : "")))})`);
  // Row tap → more-info.
  await page.evaluate(() => { window.__mi8 = []; window.addEventListener("hass-more-info", e => window.__mi8.push(e.detail.entityId)); });
  await page.evaluate(() => { const p = [...document.querySelectorAll("jam-panel")].find(x => x._config.title === "NAS"); p.scrollIntoView({block: "center"}); });
  await page.locator("jam-panel").filter({hasText: "NAS_Effect"}).locator(".row", {hasText: "Temp"}).click();
  await page.locator("jam-alerts").locator(".row", {hasText: "Stove lights"}).click();
  await page.locator("jam-alerts").locator(".row.count").click();
  const mi = await page.evaluate(() => window.__mi8);
  check(mi[0] === "sensor.truenas_system_temperature" && mi[1] === "sensor.stove_lights_power" && mi.length === 2,
    `jam-panel/jam-alerts: row tap → more-info, count row has none (${mi.join(", ")})`);

  // jam-alerts: rows sorted by last_triggered (newest first), off dims, watch, count, chip.
  const al = await page.evaluate(() => {
    const a = document.querySelector("jam-alerts"), r = a.shadowRoot, H = window.__hass;
    const rows = [...r.querySelectorAll(".row")].map(x => ({id: x.dataset.entity || null, cls: x.className, v: x.querySelector(".v").textContent,
      color: getComputedStyle(x.querySelector(".v")).color}));
    const autos = rows.filter(x => x.cls.includes("auto")).map(x => x.id);
    const ts = autos.map(id => Date.parse(H.states[id].attributes.last_triggered));
    const dim = (() => { const s = document.createElement("span"); s.style.color = "var(--jam-dim)"; document.body.append(s); const c = getComputedStyle(s).color; s.remove(); return c; })();
    const chip = r.querySelector(".hd .cnt");
    return {rows, autos, sorted: ts.every((t, i) => !i || ts[i - 1] >= t), dim, chip: chip ? chip.textContent : null,
      title: r.querySelector(".ttl").textContent};
  });
  check(al.autos.length === 6 && al.sorted && al.autos[0] === "automation.dim_kiosks_for_tv_at_night" && al.autos[5] === "automation.charge_ipad",
    `jam-alerts: automations sorted by last_triggered, newest first (${al.autos.map(x => x.split(".")[1]).join(", ")})`);
  const off = al.rows.find(x => x.id === "automation.air_quality_alert");
  check(off && off.v === "off" && off.color === al.dim, `jam-alerts: automation off → dim "off" (${off && off.v})`);
  const today = al.rows.find(x => x.id === "automation.dim_kiosks_for_tv_at_night"), old = al.rows.find(x => x.id === "automation.charge_ipad");
  check(/^ran \d{1,2}:\d\d/.test(today.v) && /^ran [A-Za-z]{3} \d{1,2}/.test(old.v), `jam-alerts: "ran <time>" today, "ran <date>" older (${today.v}; ${old.v})`);
  const w1 = al.rows.find(x => x.id === "lock.front_door"), w2 = al.rows.find(x => x.id === "sensor.stove_lights_power");
  check(w1 && !w1.cls.includes("bad") && w2 && w2.cls.includes("bad") && w2.v === "unavailable" && w2.color === red,
    `jam-alerts: watched entity unavailable → red row (${w1 && w1.v} / ${w2 && w2.v})`);
  check(al.chip === "1" && al.title === "Automations & alerts", `jam-alerts: header failure chip (${al.chip}), default title`);

  // 12/24 h + weekday, auto mode + limit, unavailable count exclusions — on a scratch card with a controlled hass.
  const sc = await page.evaluate(() => {
    const n = new Date(), at = (h, m, daysAgo = 0) => new Date(n.getFullYear(), n.getMonth(), n.getDate() - daysAgo, h, m).toISOString();
    const S = (id, state, attributes = {}) => [id, {entity_id: id, state, attributes, last_changed: n.toISOString(), last_updated: n.toISOString()}];
    const early = n.getHours() > 0 || n.getMinutes() > 6 ? at(0, 5) : n.toISOString();
    const states = Object.fromEntries([
      S("automation.a", "on", {friendly_name: "A", last_triggered: early}),
      S("automation.b", "on", {friendly_name: "B", last_triggered: at(21, 40, 3)}),
      S("automation.c", "on", {friendly_name: "C", last_triggered: at(9, 0, 1)}),
      S("automation.d", "on", {friendly_name: "D", last_triggered: null}),
      S("automation.e", "unavailable", {friendly_name: "E"}),
      S("sensor.x", "unavailable"), S("sensor.y", "unknown"), S("light.z", "unavailable"), S("switch.ok", "on"),
      S("update.u", "unavailable"), S("button.b", "unavailable"), S("scene.s", "unavailable"), S("event.e", "unavailable"),
    ]);
    const e = document.createElement("jam-alerts"); document.body.append(e);
    e.setConfig({type: "custom:jam-alerts", title: "T", auto: true, limit: 3});
    const out = {};
    for (const tf of ["12", "24"]) {
      e.hass = {...window.__hass, states, locale: {language: "en", time_format: tf}};
      const rows = [...e.shadowRoot.querySelectorAll(".row")];
      out[tf] = {ids: rows.filter(r => r.classList.contains("auto")).map(r => r.dataset.entity), vals: rows.map(r => r.querySelector(".v").textContent)};
    }
    e.setConfig({type: "custom:jam-alerts", auto: true});
    out.all = [...e.shadowRoot.querySelectorAll(".row.auto")].map(r => r.dataset.entity);
    out.chip = (e.shadowRoot.querySelector(".cnt") || {}).textContent;
    e.setConfig({type: "custom:jam-alerts", automations: ["automation.a"], show_unavailable_count: false});
    out.nocount = e.shadowRoot.querySelectorAll(".row.count").length;
    e.remove();
    out.wantA12 = new Date(early).toLocaleTimeString("en", {hour: "numeric", minute: "2-digit", hour12: true});
    out.wantA24 = new Date(early).toLocaleTimeString("en", {hour: "2-digit", minute: "2-digit", hour12: false});
    out.wantB = new Date(at(21, 40, 3)).toLocaleDateString("en", {weekday: "short"});
    return out;
  });
  check(JSON.stringify(sc["12"].ids) === '["automation.a","automation.c","automation.b"]', `jam-alerts: auto picks automation.* by last_triggered, limit 3 (${sc["12"].ids.join(", ")})`);
  check(sc["12"].vals[0] === "ran " + sc.wantA12 && /AM|PM/.test(sc["12"].vals[0]) && sc["24"].vals[0] === "ran " + sc.wantA24 && !/AM|PM/.test(sc["24"].vals[0])
    && sc["12"].vals[2] === "ran " + sc.wantB,
    `jam-alerts: time follows hass.locale.time_format (12: ${sc["12"].vals[0]}; 24: ${sc["24"].vals[0]}), weekday this week (${sc["12"].vals[2]})`);
  check(sc["12"].vals[sc["12"].vals.length - 1] === "3 unavailable",
    `jam-alerts: unavailable count skips update/button/scene/event and unknown (${sc["12"].vals[sc["12"].vals.length - 1]}, want 3: sensor.x, light.z, automation.e)`);
  check(sc.all.length === 5 && sc.all[3] === "automation.d" && sc.chip === "1" && sc.nocount === 0,
    `jam-alerts: default limit, never-run + unavailable rows, chip counts the unavailable automation, count row optional (${sc.all.join(",")}; chip ${sc.chip})`);
};
