// The house's two pop-ups (1.1.0, Isaac 2026-11-08: "Tapping on the indoor temp gave indoor climate stats with some graphs.
// Tapping the outdoor side showed a popup of a 5 day weather forecast with info from open weathermap"). Fresh pages of the
// preview (fixture 62-climate.js: the house temperature / humidity groups of four rooms, OpenWeatherMap's attributes; the fake
// history + forecast of 40-data.js), scratch cards configured like the live dashboards (jam-house of jam-overview, the
// living-room jam-kiosk; the kitchen kiosk on its own sensors):
//   - jam-house: its inside and outside halves are two buttons (click, and Enter from the keyboard);
//   - inside: the readouts (temperature, humidity, air + PM2.5), the four rooms found from the groups (names from the
//     sensors, each with its temperature and humidity and a 24 h sparkline drawn once the history is in), the house's two
//     24 h graphs (jam-graph, one series each in the ink colour, with data); the open pop-up watches its sensors;
//   - outside: now (temperature, the condition), the details (feels like, humidity, wind, pressure, UV, clouds), five days
//     with a low-high bar each and today's temperature on the first, the OpenWeatherMap footnote; one forecast subscription
//     while open, none after it closes;
//   - inside_more / outside_more false: HA's more-info instead;
//   - jam-kiosk at 1024x768 and 961x601 (day / night): its facts line's two parts open the same pop-ups, centred, two
//     columns, all inside the screen, no scrolling body, every text >= 15px;
//   - phone 390x844 and desktop 1440x900 (day / night): every text >= 12px, a bottom sheet / a centred pop-up;
//   - text contrast (preview/contrast.js) with each pop-up open.
// Contract: module.exports = async (page, check) => {}.
const path = require("path");
module.exports = async (page, check) => {
  const contrast = require(path.join(__dirname, "..", "contrast.js"));
  const url = page.url().replace(/\?.*$/, ""), browser = page.context().browser();
  const HOUSE = {type: "custom:jam-house", title: "The Bungalow", inside_entity: "sensor.home_temperature", outside_entity: "weather.bungalo_weather",
    lock_entity: "lock.level_bolt_matter", people: ["person.isaac", "person.amber", "person.marissa"], inside_aq: {entity: "sensor.vital_200s_series_air_quality"},
    outside_aq: {entity: "sensor.airnow_aqi"}, humidity_entity: "sensor.home_humidity"};
  const KIOSK = {type: "custom:jam-kiosk", accent: "living", inside_entity: "sensor.home_temperature", humidity_entity: "sensor.home_humidity",
    aq_entity: "sensor.vital_200s_series_air_quality", lock_entity: "lock.level_bolt_matter", now: [{type: "weather", entity: "weather.bungalo_weather"}],
    dock: [{name: "Lights", state: {count_on: ["light.living_room"]}, cards: []}, {name: "Music", state: {entity: "media_player.living_room_speaker"}, cards: []}]};
  const KITCHEN = {...KIOSK, accent: "kitchen", inside_entity: "sensor.kitchen_sensor_temperature", humidity_entity: "sensor.kitchen_sensor_humidity"};
  const runs = [["house", HOUSE, 390, 844, "light", 12], ["house", HOUSE, 1440, 900, "dark", 12], ["house", HOUSE, 390, 844, "dark", 12],
    ["kiosk", KIOSK, 1024, 768, "light", 15], ["kiosk", KIOSK, 961, 601, "dark", 15], ["kitchen", KITCHEN, 961, 601, "light", 15]];
  for (const [name, cfg, w, h, mode, floor] of runs) {
    const p = await browser.newPage({viewport: {width: w, height: h}});
    const errs = []; p.on("pageerror", e => errs.push(e.message));
    await p.goto(url + `?mode=${mode}`);
    await p.waitForFunction(() => window.__ready);
    await p.evaluate(() => document.fonts.ready);
    await p.evaluate(cfg => {
      document.getElementById("view").style.display = "none"; // the pop-up over one card (the preview's own cards stay out of the way)
      const box = document.createElement("div"); box.id = "cl"; box.style.cssText = "padding:8px;max-width:900px;margin:0 auto";
      const e = document.createElement(cfg.type.slice(7)); e.setConfig(cfg); e.hass = window.__hass; box.append(e); document.body.prepend(box); window.__cl = e;
      window.__mi = []; window.addEventListener("hass-more-info", ev => window.__mi.push(ev.detail.entityId));
    }, cfg);
    await p.waitForTimeout(700);
    for (const half of ["inside", "outside"]) {
      const tag = `climate ${name} ${half} ${w}x${h} ${mode}`, bad = [];
      const how = await p.evaluate(([half, kb]) => {
        const k = window.__cl.shadowRoot.querySelector(`[data-key="${half}"]`);
        if (!k) return null;
        const subs0 = (window.__wsSubs || []).filter(s => s.active && s.msg.entity_id === "weather.bungalo_weather").length;
        if (kb) { k.focus(); k.dispatchEvent(new KeyboardEvent("keydown", {key: "Enter", bubbles: true})); k.click(); } // a native button: Enter = click
        else k.click();
        return {tag: k.localName, label: k.getAttribute("aria-label"), subs0};
      }, [half, name === "house" && w === 390 && mode === "dark"]);
      if (!how) { check(false, `${tag}: no ${half} button`); continue; }
      if (how.tag !== "button") bad.push(`the ${half} target is a ${how.tag}`);
      await p.waitForTimeout(900); // history / forecast (fake: 20-30 ms), the open motion, the refill
      const m = await p.evaluate(([floor]) => {
        const hs = [...document.querySelectorAll(".jam-sheet-host")].pop(); if (!hs) return null;
        const sr = hs.shadowRoot, pop = sr.querySelector(".pop"), f = sr.querySelector(".sheet > .face").getBoundingClientRect(), body = sr.querySelector(".body");
        const small = new Set(), walk = r => { for (const n of r.querySelectorAll("*")) { if (n.shadowRoot) walk(n.shadowRoot);
          if (![...n.childNodes].some(c => c.nodeType === 3 && c.textContent.trim()) || !n.getClientRects().length) continue;
          const fs = parseFloat(getComputedStyle(n).fontSize); if (fs < floor - .01) small.add(`${n.getAttribute("class") || n.localName} ${fs}px`); } };
        walk(sr);
        const graphs = [...sr.querySelectorAll("jam-graph")].map(g => { const ln = g.shadowRoot.querySelector(".ln"); return ln ? getComputedStyle(ln).stroke : null; });
        const fg = getComputedStyle(sr.querySelector(".sheet > .face")).color;
        return {cls: pop.className, f: [f.left, f.top, f.right, f.bottom].map(Math.round), scrolls: body.scrollHeight > body.clientHeight + 1, small: [...small].slice(0, 6),
          readouts: [...sr.querySelectorAll(".c-rd")].map(x => x.textContent), rooms: [...sr.querySelectorAll(".c-rm")].map(x => x.querySelector(".c-rmn").textContent),
          sparks: sr.querySelectorAll(".c-spkl path:not(.c-spn)").length, graphs, fg, days: sr.querySelectorAll(".c-fd").length, bars: sr.querySelectorAll(".c-fbar i").length,
          nowDot: !!sr.querySelector(".c-fd.c-today .c-fnow"), details: [...sr.querySelectorAll(".c-wxi dt")].map(x => x.textContent), attr: (sr.querySelector(".c-attr") || {}).textContent,
          subs: (window.__wsSubs || []).filter(s => s.active && s.msg.entity_id === "weather.bungalo_weather").length, watched: window.__cl.watched()};
      }, [floor]);
      if (!m) { check(false, `${tag}: nothing opened`); continue; }
      const kio = name !== "house";
      if (!m.cls.includes(half === "inside" ? "c-clim" : "c-wxp")) bad.push(`pop-up ${m.cls}`);
      if (m.f[0] < -.5 || m.f[1] < -.5 || m.f[2] > w + .5 || m.f[3] > h + .5) bad.push(`face [${m.f}] outside the viewport`);
      if (kio && (!m.cls.includes("c-kio") || m.scrolls)) bad.push(`kiosk pop-up ${m.cls.includes("c-kio") ? "" : "not centred "}${m.scrolls ? "scrolls" : ""}`);
      if (!kio && w <= 600 && m.f[3] !== h) bad.push("not a bottom sheet");
      if (m.small.length) bad.push(`text under ${floor}px: ${m.small.join(", ")}`);
      if (half === "inside") {
        if (m.readouts.length < (name === "kitchen" ? 2 : 3)) bad.push(`readouts ${JSON.stringify(m.readouts)}`);
        if (name !== "kitchen") {
          if (m.rooms.join() !== "Living Room,Bedroom,Office,Kitchen") bad.push(`rooms ${JSON.stringify(m.rooms)}`);
          if (m.sparks !== 8) bad.push(`${m.sparks} sparklines drawn, want 8`);
          if (!m.watched.includes("sensor.kitchen_sensor_humidity")) bad.push("the open pop-up does not watch the room sensors");
        } else if (m.rooms.length) bad.push(`rooms for one sensor: ${JSON.stringify(m.rooms)}`);
        if (m.graphs.length !== 2 || m.graphs.some(s => !s || s !== m.fg)) bad.push(`graphs ${JSON.stringify(m.graphs)} (want 2 drawn in ${m.fg})`);
      } else {
        if (m.days !== 5 || m.bars !== 5 || !m.nowDot) bad.push(`${m.days} days, ${m.bars} bars, today's mark ${m.nowDot}`);
        for (const d of ["Feels like", "Humidity", "Wind", "Pressure", "UV index", "Clouds"]) if (!m.details.includes(d)) bad.push(`no ${d}`);
        if (!/OpenWeatherMap/.test(m.attr || "")) bad.push("no source footnote");
        if (m.subs !== how.subs0 + 1) bad.push(`${m.subs - how.subs0} forecast subscriptions of the pop-up while open`);
      }
      if (w === 1440 || name === "kiosk") {
        const ct = await contrast(p);
        const mine = ct.findings.filter(x => /sheet|jam-graph/.test(String(x.card)));
        if (mine.length) bad.push("contrast: " + mine.slice(0, 3).map(x => `${x.card} "${x.text}" ${x.ratio}:1`).join(", "));
      }
      await p.keyboard.press("Escape");
      await p.waitForTimeout(350);
      if (half === "outside") { const left = await p.evaluate(() => (window.__wsSubs || []).filter(s => s.active && s.msg.entity_id === "weather.bungalo_weather").length); if (left !== how.subs0) bad.push(`${left - how.subs0} forecast subscriptions left after close`); }
      const left = await p.evaluate(() => document.querySelectorAll(".jam-sheet-host, .jam-sheet-leaving").length);
      if (left) bad.push(`${left} layers after close`);
      check(!bad.length && !errs.length, `${tag}: ${half === "inside" ? `${m.readouts.length} readouts, ${m.rooms.length} rooms, ${m.sparks} sparklines, ${m.graphs.length} graphs` :
        `${m.days} days, ${m.details.length} details, the source`}${kio ? ", fits the kiosk" : ""}` + (bad.length || errs.length ? " — " + [...bad, ...errs].join("; ") : ""));
    }
    if (name === "house" && w === 1440) { // the halves without the pop-ups: HA's more-info
      const mi = await p.evaluate(async cfg => {
        window.__cl.setConfig({...cfg, inside_more: false, outside_more: false}); await new Promise(r => setTimeout(r, 100)); window.__mi.length = 0;
        for (const k of ["inside", "outside"]) window.__cl.shadowRoot.querySelector(`[data-key="${k}"]`).click();
        await new Promise(r => setTimeout(r, 100));
        return {mi: window.__mi.slice(), sheets: document.querySelectorAll(".jam-sheet-host").length};
      }, cfg);
      check(mi.mi.join() === "sensor.home_temperature,weather.bungalo_weather" && !mi.sheets, `climate inside_more / outside_more false: more-info ${JSON.stringify(mi.mi)}, no pop-up`);
    }
    await p.close();
  }
};
