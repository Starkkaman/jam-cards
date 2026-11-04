// jam-programme (Olympia look card; fixture preview/fixtures/99-programme.js with fake WS answers): the WS calls (schedule/list,
// config/entity_registry/get, call_service calendar.get_events with return_response, one history/history_during_period
// for the history lanes, not for a schedule found in the list), the bands per source (schedule blocks, fixed ranges incl.
// one past midnight, calendar events, an all-day event filling the window, history periods ending by now), the now line,
// band buttons (aria-label, 44px hit area) and the details line (tap / Enter / Esc), error lanes marked.
// Contract: module.exports = async (page, check) => {}; Poster dark/1280 (wall clock: history lanes are checked by rule).
module.exports = async (page, check) => {
  await page.waitForFunction(() => [...document.querySelectorAll("#view jam-programme")].every(c => c.shadowRoot.querySelector(".lanes")), null, {timeout: 5000}).catch(() => {});
  const r = await page.evaluate(() => {
    const cards = [...document.querySelectorAll("#view jam-programme")], by = t => cards.find(c => c._config.title === t);
    const lanes = c => Object.fromEntries([...c.shadowRoot.querySelectorAll(".lane")].map(l => [l.querySelector(".lnm").textContent,
      [...l.querySelectorAll(".bd")].map(b => ({l: parseFloat(b.style.left), w: parseFloat(b.style.width), label: b.getAttribute("aria-label")}))]));
    const ws = (window.__ws || []).map(m => ({type: m.type, domain: m.domain, service: m.service, rr: m.return_response, target: m.target, ids: m.entity_ids, id: m.entity_id}));
    const P = by("Programme"), now = P.shadowRoot.querySelector(".now"), d = P._data;
    const frac = (Date.now() - d.t0) / (d.t1 - d.t0);
    const trk = P.shadowRoot.querySelector(".trk").getBoundingClientRect(), nr = now.getBoundingClientRect();
    const b0 = P.shadowRoot.querySelector(".bd"), after = getComputedStyle(b0, "::after");
    return {n: cards.length, main: lanes(P), eve: lanes(by("Evening")), errU: by("Err programme").shadowRoot.querySelectorAll(".lnm.unavail").length, ws,
      nowX: nr.left + nr.width / 2, wantX: trk.left + trk.width * frac, nowShown: now.style.display !== "none",
      hit: [parseFloat(after.width), parseFloat(after.height)], btn: b0.localName, det: P.shadowRoot.querySelector(".det").textContent, nowMs: Date.now(), t0: d.t0, t1: d.t1};
  });
  const has = f => r.ws.some(f);
  const hist = r.ws.filter(m => m.type === "history/history_during_period" && m.ids && m.ids.some(i => /\.pr_/.test(i)));
  check(has(m => m.type === "schedule/list") && has(m => m.type === "config/entity_registry/get" && m.id === "schedule.pr_screens_off") &&
    has(m => m.type === "call_service" && m.domain === "calendar" && m.service === "get_events" && m.rr === true && [].concat(m.target.entity_id).includes("calendar.pr_family")) &&
    hist.length >= 1 && hist.every(m => !m.ids.includes("schedule.pr_screens_off")) && hist.some(m => m.ids.includes("schedule.pr_quiet") || m.ids.includes("input_boolean.pr_work")),
    `jam-programme: WS schedule/list + entity_registry/get, calendar.get_events with return_response, history only for history lanes (${hist.map(m => m.ids.join("+")).join(" | ")})`);
  const M = r.main, E = r.eve, near = (a, b) => Math.abs(a - b) < 0.05;
  check(M["Screens off"].length === 2 && near(M["Screens off"][0].l, 0) && near(M["Screens off"][0].w, 6.5 / 24 * 100) && near(M["Screens off"][1].l, 22.5 / 24 * 100),
    `jam-programme: schedule blocks for today 00:00-06:30 + 22:30-24:00 (${JSON.stringify(M["Screens off"].map(b => [b.l.toFixed(1), b.w.toFixed(1)]))})`);
  check(M.Briefs.length === 3 && M.Family.length === 4 && M.Family.some(b => /Dentist/.test(b.label)) && E.Bedtime.length === 1 && near(E.Bedtime[0].l, 9.5 / 12 * 100) &&
    E.Holidays.length === 1 && near(E.Holidays[0].l, 0) && near(E.Holidays[0].w, 100),
    `jam-programme: fixed ranges (3; bedtime 21:30 -> past midnight clipped to the window), 4 calendar events, an all-day event fills the window`);
  const nowPct = (r.nowMs - r.t0) / (r.t1 - r.t0) * 100;
  const histOk = ["Work", "Porch light"].every(k => M[k].every(b => b.l >= 0 && b.l + b.w <= nowPct + 0.2));
  check(histOk, `jam-programme: history periods start after the window opens and end by now (${["Work", "Porch light"].map(k => M[k].length).join(" + ")} bands)`);
  check(r.nowShown && Math.abs(r.nowX - r.wantX) < 2, `jam-programme: the now line sits at now (${r.nowX.toFixed(1)} vs ${r.wantX.toFixed(1)})`);
  check(r.btn === "button" && r.hit[0] >= 44 && r.hit[1] >= 44 && /^Now /.test(r.det), `jam-programme: bands are buttons with a 44px hit area (${r.hit}), default details line "${r.det}"`);
  check(r.errU === 2, `jam-programme: a calendar without events data and a missing entity mark their lanes (${r.errU})`);
  // Details: click the dentist band, Esc, Enter.
  const det = await page.evaluate(async () => {
    const P = [...document.querySelectorAll("#view jam-programme")].find(c => c._config.title === "Programme"), R = P.shadowRoot;
    const b = [...R.querySelectorAll(".bd")].find(x => /Dentist/.test(x.getAttribute("aria-label")));
    const txt = () => R.querySelector(".det").textContent;
    b.click(); const a = {t: txt(), p: b.getAttribute("aria-pressed"), sel: b.classList.contains("sel")};
    b.dispatchEvent(new KeyboardEvent("keydown", {key: "Escape", bubbles: true}));
    const e = {t: txt(), p: b.getAttribute("aria-pressed")};
    b.click(); b.click(); const t = txt();
    return {a, e, t};
  });
  check(/Family/.test(det.a.t) && /Dentist/.test(det.a.t) && /Main St Dental/.test(det.a.t) && det.a.p === "true" && det.a.sel && /^Now /.test(det.e.t) && det.e.p === "false" && /^Now /.test(det.t),
    `jam-programme: tap a band = its details ("${det.a.t}"), Esc / a second tap = back to now`);
};
