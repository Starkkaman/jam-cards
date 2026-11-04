// The look cards of 2026-11-03 (night plan §3): jam-linemap, jam-arrivals, jam-matrix, jam-ridge, jam-sticker.
// Fixture: preview/fixtures/99-look-cards.js. Runs on the Poster dark/1280 preview page (contrast, fit and the other looks run
// in shoot.js / fit.js for every look). Every card is put back the way the fixture made it.
module.exports = async (page, check, {callsNow}) => {
  const card = (tag, n = 0) => `[...document.querySelectorAll("#view ${tag}")][${n}]`;
  await page.evaluate(() => {
    window.__mi = [];
    window.addEventListener("hass-more-info", e => window.__mi.push(e.detail.entityId));
  });
  const set = (id, state, attrs) => page.evaluate(([id, state, attrs]) => {
    const h = window.__hass, old = h.states[id];
    h.states[id] = {...old, state, attributes: {...old.attributes, ...(attrs || {})}, last_updated: "chk" + Math.random()};
    for (const e of document.querySelectorAll("#view *")) if (e._config && e.localName.startsWith("jam-") && !(e.parentNode && e.parentNode.host)) e.hass = {...h};
  }, [id, state, attrs]);
  const tick = ms => page.waitForTimeout(ms);

  // ---------- jam-linemap ----------
  const lm = await page.evaluate(c => {
    const e = eval(c), r = e.shadowRoot, lines = [...r.querySelectorAll(".ln")];
    const host = e.getBoundingClientRect();
    const sts = lines.map(l => [...l.querySelectorAll(".st")].map(s => {
      const b = s.getBoundingClientRect();
      return {id: s.dataset.entity, cls: s.className, pressed: s.getAttribute("aria-pressed"), label: s.getAttribute("aria-label"), w: b.width, h: b.height,
        inside: b.left >= host.left - .5 && b.right <= host.right + .5 && b.top >= host.top - .5 && b.bottom <= host.bottom + .5,
        x: b.left, y: b.top, extra: [...s.querySelectorAll(".lb")].map(x => x.textContent).join(""), sv: (s.querySelector(".sv") || {}).textContent || ""};
    }));
    const heads = lines.map(l => { const h = l.querySelector(".lh"); return {tag: h.localName, text: h.textContent, bullet: h.querySelector(".lb").textContent}; });
    const paths = lines.map(l => [...l.querySelectorAll(".trk path")].map(p => p.getAttribute("d")));
    return {sts, heads, paths};
  }, card("jam-linemap"));
  const flat = lm.sts.flat();
  check(lm.sts.map(l => l.length).join() === "5,6,5" && lm.heads.map(h => h.bullet).join("") === "LKB",
    `jam-linemap: 3 lines (5, 6, 5 stations) with route bullets L K B (${lm.sts.map(l => l.length)}; ${lm.heads.map(h => h.bullet).join("")})`);
  const hall = flat.filter(s => s.id === "switch.mc_hall");
  check(hall.length === 2 && hall.every(s => /\bix\b/.test(s.cls) && s.pressed === "true") && hall[0].extra === "B" && hall[1].extra === "L" && /change for Bedroom/.test(hall[0].label),
    `jam-linemap: the hallway is an interchange on Living and Bedroom (ring, the other line's bullet, "${hall[0] && hall[0].label}")`);
  const by = id => flat.find(s => s.id === id);
  check(/\bon\b/.test(by("light.mc_floor").cls) && by("light.mc_sofa").pressed === "false" && /\bna\b/.test(by("light.mc_pendant").cls) && by("light.mc_pendant").pressed === null &&
    by("light.mc_gone").sv === "Missing" && by("sensor.mc_living_temp").sv.includes("72.4") && by("sensor.mc_living_temp").pressed === null,
    "jam-linemap: on = filled + aria-pressed, unavailable and missing stations dashed without aria-pressed, a sensor shows its value");
  check(flat.every(s => s.w >= 44 && s.h >= 44 && s.inside), `jam-linemap: every station >= 44x44 and inside the card (${Math.min(...flat.map(s => s.w)).toFixed(0)}px wide at least)`);
  const overl = lm.sts.some(l => l.some((a, i) => l.some((b, j) => i < j && Math.abs(a.x - b.x) < a.w - 1 && Math.abs(a.y - b.y) < a.h - 1)));
  check(!overl && lm.paths.every(p => p.length === 2 && /L/.test(p[0])), "jam-linemap: stations of a line never overlap; each track = chamfered line + terminal tick");
  check(lm.heads[0].tag === "button" && lm.heads[2].tag === "div", "jam-linemap: a line with a path has a name button, one without is plain text");
  // Taps: toggle, more-info for a sensor, navigate on the line name.
  const n0 = (await callsNow()).length;
  await page.evaluate(c => eval(c).shadowRoot.querySelector('.st[data-entity="light.mc_island"]').click(), card("jam-linemap"));
  await page.evaluate(c => eval(c).shadowRoot.querySelector('.st[data-entity="sensor.mc_living_temp"]').click(), card("jam-linemap"));
  const nav = await page.evaluate(c => {
    const before = location.pathname + location.search; let to = null;
    const f = () => { to = location.pathname; }; window.addEventListener("location-changed", f);
    eval(c).shadowRoot.querySelector(".lh").click();
    window.removeEventListener("location-changed", f); history.replaceState(null, "", before);
    return to;
  }, card("jam-linemap"));
  const calls = (await callsNow()).slice(n0);
  check(calls.some(x => x.domain === "homeassistant" && x.service === "toggle" && x.data.entity_id === "light.mc_island") &&
    (await page.evaluate(() => window.__mi)).includes("sensor.mc_living_temp") && nav === "/lovelace/living",
    `jam-linemap: station tap toggles, a sensor opens more-info, the line name navigates (${nav})`);
  // Narrow card: the kitchen line turns back on a second row; focus stays on a station over a re-render; bullets readable.
  const narrow = await page.evaluate(async c => {
    const e = eval(c); e.style.display = "block"; e.style.width = "340px";
    await new Promise(r => setTimeout(r, 120));
    const r = e.shadowRoot, k = r.querySelectorAll(".ln")[1], ys = new Set([...k.querySelectorAll(".st")].map(s => Math.round(s.getBoundingClientRect().top)));
    const d = k.querySelector(".trk path").getAttribute("d"), host = e.getBoundingClientRect();
    const inside = [...r.querySelectorAll(".st")].every(s => { const b = s.getBoundingClientRect(); return b.left >= host.left - .5 && b.right <= host.right + .5; });
    const st = r.querySelector('.st[data-entity="light.mc_sofa"]'); st.focus();
    const h = window.__hass; h.states["light.mc_sofa"] = {...h.states["light.mc_sofa"], state: "on", last_updated: "nf"}; e.hass = {...h};
    const kept = r.activeElement && r.activeElement.dataset.entity === "light.mc_sofa" && r.activeElement.getAttribute("aria-pressed") === "true";
    h.states["light.mc_sofa"] = {...h.states["light.mc_sofa"], state: "off", last_updated: "nf2"}; e.hass = {...h};
    r.activeElement && r.activeElement.blur();
    const J = window.JamCards, lb = [...r.querySelectorAll(".lb:not(.ring)")].map(b => {
      const cs = getComputedStyle(b), rgb = s => J.parseRgb(s);
      return J.contrastRatio(rgb(cs.color), rgb(cs.backgroundColor));
    });
    e.style.width = ""; e.style.display = "";
    await new Promise(r => setTimeout(r, 120));
    return {rows: ys.size, turns: (d.match(/V/g) || []).length, inside, kept, lb};
  }, card("jam-linemap"));
  check(narrow.rows === 2 && narrow.turns === 2 && narrow.inside, `jam-linemap at 340px: the 6-station line turns back on a 2nd row (${narrow.rows} rows, ${narrow.turns} vertical runs), all stations inside`);
  check(narrow.kept, "jam-linemap: the focused station keeps the focus over a state re-render");
  check(narrow.lb.length >= 3 && narrow.lb.every(x => x >= 4.5), `jam-linemap: filled route bullets read >= 4.5:1 (${narrow.lb.map(x => x.toFixed(1)).join(" ")})`);

  // ---------- jam-arrivals ----------
  await page.waitForFunction(c => eval(c).shadowRoot.querySelectorAll(".row.ev").length === 4, card("jam-arrivals"), {timeout: 3000}).catch(() => {});
  const ar = await page.evaluate(c => {
    const r = eval(c).shadowRoot;
    return {rows: [...r.querySelectorAll(".row")].map(x => ({cls: x.className.replace("row ", ""), name: x.querySelector(".dn").textContent,
      st: (x.querySelector(".stt") || {}).textContent || "", lb: (x.querySelector(".lb") || {}).textContent || "", label: x.getAttribute("aria-label")})),
      api: window.__api.map(a => a.path)};
  }, card("jam-arrivals"));
  check(ar.rows.map(r => r.cls).join() === "svc,svc,np,ev,ev,ev,ev,en,en,en",
    `jam-arrivals: service changes, now playing, 4 events, 3 entities in that order (${ar.rows.map(r => r.cls).join()})`);
  check(ar.rows[0].name === "Water under the sink" && /^Service change/.test(ar.rows[0].label) && ar.rows[2].name === "Saturn" && ar.rows[2].st === "Now" && ar.rows[2].lb === "M",
    "jam-arrivals: a service change row says so, now playing = Saturn \"Now\" with the M bullet");
  check(ar.rows.slice(3, 7).map(r => r.name).join("|") === "Marissa pickup|Dinner with Amber|Recycling out|Band practice" &&
    ar.rows.slice(3, 7).every(r => r.st) && /^\p{L}{2,}\.?$/u.test(ar.rows[5].st) && ar.rows[3].lb === "S" && ar.rows[4].lb === "F",
    `jam-arrivals: next 4 events of both calendars in time order with times (${ar.rows.slice(3, 7).map(r => r.name + " " + r.st).join("; ")})`);
  check(ar.api.length >= 2 && ["calendar.mc_family", "calendar.mc_school"].every(id => ar.api.some(p => p.startsWith(`calendars/${id}?start=`) && p.includes("&end="))),
    "jam-arrivals: events read with GET calendars/<id>?start&end per calendar");
  check(ar.rows[7].name === "Washer" && ar.rows[7].st === "Rinse" && ar.rows[9].st === "locked", "jam-arrivals: entity rows show the state as the status");
  await set("binary_sensor.mc_leak", "off");
  await set("lock.mc_front", "unlocked");
  const ar2 = await page.evaluate(c => [...eval(c).shadowRoot.querySelectorAll(".row.svc .dn")].map(x => x.textContent), card("jam-arrivals"));
  await set("binary_sensor.mc_leak", "on"); await set("lock.mc_front", "locked");
  check(ar2.join("|") === "Front door lock battery low|Front door unlocked", `jam-arrivals: service changes follow their conditions (${ar2.join(", ")})`);
  await page.evaluate(c => { window.__mi.length = 0; eval(c).shadowRoot.querySelectorAll(".row.en")[0].click(); }, card("jam-arrivals"));
  check((await page.evaluate(() => window.__mi)).includes("sensor.mc_washer"), "jam-arrivals: row tap = more-info");

  // ---------- jam-matrix ----------
  const mx = await page.evaluate(c => {
    const r = eval(c).shadowRoot, cells = [...r.querySelectorAll(".cell")];
    return {n: cells.length, slots: r.querySelectorAll(".slot").length, on: cells.filter(x => x.classList.contains("on")).length, big: r.querySelector(".big").textContent,
      tab: cells.filter(x => x.tabIndex === 0).length, sizes: cells.map(x => { const b = x.getBoundingClientRect(); return [b.width, b.height]; }),
      cap: r.querySelector(".mxcap").textContent, pressed: cells.filter(x => x.hasAttribute("aria-pressed")).length};
  }, card("jam-matrix"));
  check(mx.n === 12 && mx.slots === 0 && mx.big.trim() === "6" && mx.pressed === 10 && mx.tab === 1,
    `jam-matrix: 12 cells, 6 of 10 toggles on as the big numeral, one tab stop (${mx.n} cells, "${mx.big}", ${mx.pressed} toggles, ${mx.tab} tab stops)`);
  check(mx.sizes.every(([w, h]) => w >= 44 && Math.abs(w - h) < 1), `jam-matrix: square cells >= 44px (${mx.sizes[0].map(v => v.toFixed(0)).join("x")})`);
  check(/^On: Floor lamp, Ceiling/.test(mx.cap), `jam-matrix: at rest the caption lists what is on ("${mx.cap.slice(0, 40)}")`);
  const half = await page.evaluate(c => { const r = eval(c).shadowRoot; return [r.querySelectorAll(".cell").length, r.querySelectorAll(".slot").length]; }, card("jam-matrix", 1));
  check(half.join() === "3,1", `jam-matrix columns 2: 3 cells + 1 empty slot (${half})`);
  // Keyboard: arrows move the one tab stop, Enter toggles; hover names the cell.
  await page.evaluate(c => eval(c).shadowRoot.querySelector(".cell").focus(), card("jam-matrix"));
  const keys = [];
  for (const k of ["ArrowRight", "ArrowDown", "End", "Home"]) {
    await page.keyboard.press(k);
    keys.push(await page.evaluate(c => { const r = eval(c).shadowRoot; return [...r.querySelectorAll(".cell")].indexOf(r.activeElement); }, card("jam-matrix")));
  }
  const capF = await page.evaluate(c => eval(c).shadowRoot.querySelector(".mxcap").textContent, card("jam-matrix"));
  const n1 = (await callsNow()).length;
  await page.keyboard.press("ArrowRight"); await page.keyboard.press("Enter");
  const tg = (await callsNow()).slice(n1);
  check(keys.join() === "1,7,11,0" && capF === "Floor lamp · on" && tg.some(x => x.service === "toggle" && x.data.entity_id === "light.mc_sofa"),
    `jam-matrix: arrows / End / Home move the focus (${keys}), the caption names the focused cell ("${capF}"), Enter toggles`);
  await page.evaluate(c => document.activeElement && document.activeElement.blur(), card("jam-matrix"));
  const box = await page.evaluate(c => { const b = eval(c).shadowRoot.querySelectorAll(".cell")[3].getBoundingClientRect(); return [b.x + b.width / 2, b.y + b.height / 2]; }, card("jam-matrix"));
  await page.mouse.move(box[0], box[1]);
  const capH = await page.evaluate(c => eval(c).shadowRoot.querySelector(".mxcap").textContent, card("jam-matrix"));
  await page.mouse.move(2, 2);
  const capR = await page.evaluate(c => eval(c).shadowRoot.querySelector(".mxcap").textContent, card("jam-matrix"));
  check(capH === "Island · off" && /^On: /.test(capR), `jam-matrix: hover names the cell ("${capH}"), leaving restores the caption`);

  // ---------- jam-ridge ----------
  await page.waitForFunction(c => eval(c).shadowRoot.querySelectorAll(".plot mask").length === 8, card("jam-ridge"), {timeout: 3000}).catch(() => {});
  const rg = await page.evaluate(c => {
    const e = eval(c), r = e.shadowRoot, q = window.__ws.find(m => (m.entity_ids || []).includes("sensor.mc_t_outside"));
    return {rows: [...r.querySelectorAll(".row")].map(x => ({v: x.querySelector(".v").textContent, label: x.getAttribute("aria-label"), h: x.getBoundingClientRect().height})),
      masks: r.querySelectorAll(".plot mask").length, lines: r.querySelectorAll(".plot > path:not(.base)").length,
      q: q && {n: q.entity_ids.length, win: Date.parse(q.end_time) - Date.parse(q.start_time), min: q.minimal_response},
      dbg: JSON.stringify({d: !!e._data, n: e._data && e._data.series.map(x => x.length), qs: window.__ws.filter(m => (m.entity_ids || []).includes("sensor.mc_t_outside")).length,
        mine: !!(e._hass && e._hass.__jamLook), same: e._hass === window.__hass})};
  }, card("jam-ridge"));
  check(rg.q && rg.q.n === 8 && Math.abs(rg.q.win - 24 * 3600e3) < 1000 && rg.q.min === true, "jam-ridge: one history WS query for the 8 entities over 24 h");
  check(rg.rows.length === 8 && rg.masks === 8 && rg.lines === 8 && rg.rows[5].v === "—" && rg.rows.every(x => x.h >= 44),
    `jam-ridge: 8 rows >= 44px, 8 masked ridges, an unavailable sensor reads "—" (${rg.rows.map(x => x.v).join(" | ")})`);
  check(/Outside, 58\.6 °F, 24 h range [\d.]+ to [\d.]+ °F/.test(rg.rows[0].label), `jam-ridge: a row names its value and range ("${rg.rows[0].label}")` + (/range/.test(rg.rows[0].label) ? "" : " " + rg.dbg));
  await page.evaluate(c => { window.__mi.length = 0; eval(c).shadowRoot.querySelectorAll(".row")[1].click(); }, card("jam-ridge"));
  check((await page.evaluate(() => window.__mi)).includes("sensor.mc_t_living"), "jam-ridge: row tap = more-info");

  // ---------- jam-sticker ----------
  const sk = () => page.evaluate(() => [...document.querySelectorAll("#view jam-sticker")].map(e => {
    const f = e.shadowRoot.querySelector(".sk"), J = window.JamCards;
    if (!f) return {title: e._config.title, hidden: e.hidden};
    const cs = getComputedStyle(f), rgb = s => J.parseRgb(s);
    return {title: e._config.title, hidden: e.hidden, shown: e.getBoundingClientRect().height > 0, sev: f.className, role: f.getAttribute("role"),
      sr: f.querySelector(".sr").textContent, ratio: +J.contrastRatio(rgb(cs.color), rgb(cs.backgroundColor)).toFixed(2)};
  }));
  const s0 = await sk();
  check(s0.length === 4 && s0.filter(x => !x.hidden && x.shown).map(x => x.title).join("|") === "Filter soon|Dishwasher is done|Water under the sink" &&
    s0[3].hidden === true, `jam-sticker: 3 stickers whose conditions hold are shown, the garage one hidden (${s0.map(x => x.title + (x.hidden ? " (hidden)" : "")).join(", ")})`);
  check(s0.filter(x => !x.hidden).every(x => x.role === "status" && x.ratio >= 4.5) && s0[2].sr === "Alert: " && /\balert\b/.test(s0[2].sev),
    `jam-sticker: role status, severity word for screen readers, text >= 4.5:1 on the sticker (${s0.filter(x => !x.hidden).map(x => x.ratio).join(", ")})`);
  const n2 = (await callsNow()).length;
  await page.evaluate(() => [...document.querySelectorAll("#view jam-sticker")][1].shadowRoot.querySelector(".act").click());
  const sc = (await callsNow()).slice(n2);
  check(sc.some(x => x.domain === "input_boolean" && x.service === "turn_on"), "jam-sticker: the key runs its tap_action");
  await set("cover.mc_garage", "open"); await set("sensor.mc_dishwasher", "clean"); await set("sensor.mc_filter", "64");
  const s1 = await sk();
  await set("cover.mc_garage", "closed"); await set("sensor.mc_dishwasher", "done"); await set("sensor.mc_filter", "12");
  const s2 = await sk();
  check(s1.map(x => x.hidden).join() === "true,true,false,false" && s2.map(x => x.hidden).join() === s0.map(x => x.hidden).join(),
    `jam-sticker: state / numeric_state conditions show and hide it live (${s1.map(x => x.hidden)})`);
  await tick(50);
};
