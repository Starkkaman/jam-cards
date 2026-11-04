// Grid cell numerals (docs/looks/GRID.md; the Grid pack's root decorator motif "numerals", core jamDecorate): on a separate
// ?look=grid page (so this page's look, fonts and state stay untouched): big numbers are drawn as aria-hidden cells while
// the real text stays in the DOM (visually hidden) for assistive tech; a value change rebuilds the numeral cell by cell
// (stepped, at most 300 ms); JamCards.motion = false draws it at once; the brightness row shows ceil(%/10) filled cells;
// the kiosk clock is a numeral too; switching the page back to Poster leaves no cells and the cards' own text.
// Contract: module.exports = async (page, check, helpers) => {}.
module.exports = async (page, check) => {
  const u = new URL(page.url());
  u.searchParams.set("look", "grid"); u.searchParams.set("mode", "light");
  const p = await page.context().browser().newPage({viewport: {width: 1280, height: 900}});
  const errs = []; p.on("pageerror", e => errs.push(e.message));
  await p.goto(u.href);
  await p.waitForFunction(() => window.__ready);
  await p.evaluate(() => document.fonts.ready);
  await p.waitForTimeout(300);
  const r = await p.evaluate(async () => {
    const J = window.JamCards, h = window.__hass, de = document.documentElement;
    const tick = (ms = 40) => new Promise(res => setTimeout(res, ms));
    const card = [...document.querySelectorAll("#view jam-light")].find(c => c._config.entity === "light.kitchen_lamp");
    const pct = () => card.shadowRoot.querySelector(".pct");
    const look = n => { const svg = n.querySelector(":scope > svg.gn-cells"), sr = n.querySelector(":scope > .gn-sr");
      return {gn: n.classList.contains("gn"), cells: svg ? svg.querySelectorAll("path").length : 0, hidden: !!svg && svg.getAttribute("aria-hidden") === "true",
        sr: sr ? sr.textContent : null, srClip: sr ? getComputedStyle(sr).clipPath + " " + getComputedStyle(sr).width : "", text: n.textContent}; };
    const filled = () => card.shadowRoot.querySelectorAll(".bs > b.gb.f").length;
    const out = {look: card.dataset.look, first: look(pct()), bar: filled()};
    const setPct = v => { const s = h.states["light.kitchen_lamp"], nh = {...h, states: {...h.states, "light.kitchen_lamp": {...s, attributes: {...s.attributes, brightness: Math.round(v * 2.55)}}}};
      window.__hass = nh; card.hass = nh; };
    // a change: cells rebuild in steps, done within ~300 ms
    const seen = [];
    const t0 = performance.now();
    setPct(30);
    for (let i = 0; i < 30; i++) {
      await new Promise(res => requestAnimationFrame(res));
      const n = pct(), svg = n.querySelector(":scope > svg.gn-cells");
      seen.push([Math.round(performance.now() - t0), svg ? [...svg.querySelectorAll("path")].map(x => x.getAttribute("d")).join("|") : ""]);
    }
    const states = [...new Set(seen.map(s => s[1]))];
    // the rebuild's span: from the frame that showed the first changed cell to the one that showed the last (frames of this
    // heavy page are slow, so the time from the hass update to the first frame is not the rebuild's)
    const changes = seen.filter((x, i) => i && x[1] !== seen[i - 1][1]).map(x => x[0]);
    const first = seen.findIndex((x, i) => i && x[1] !== seen[i - 1][1]), prevFrame = first > 0 ? seen[first - 1][0] : 0;
    const frame = Math.max(...seen.slice(1).map((x, i) => x[0] - seen[i][0]));
    out.rebuild = {steps: states.length, span: changes.length ? changes[changes.length - 1] - prevFrame : -1, frame, after: look(pct()), bar: filled()};
    // motion off: at once
    J.motion = false;
    setPct(90); await tick(0);
    const n = pct(), svg = n.querySelector(":scope > svg.gn-cells"), d0 = svg ? [...svg.querySelectorAll("path")].map(x => x.getAttribute("d")).join("|") : "";
    await tick(120);
    const d1 = [...pct().querySelector(":scope > svg.gn-cells").querySelectorAll("path")].map(x => x.getAttribute("d")).join("|");
    out.instant = {same: d0 === d1 && !!d0, sr: look(pct()).sr};
    J.motion = true;
    // the kiosk clock
    const kiosk = document.querySelector("#view jam-kiosk"), clock = kiosk && kiosk.shadowRoot.querySelector(".clock");
    out.clock = clock ? look(clock) : null;
    // back to Poster on this page: no cells, the cards' own text
    delete de.dataset.look;
    const nh = {...window.__hass, themes: {...window.__hass.themes}};
    const all = []; const walk = r => { for (const e of r.querySelectorAll("*")) { if (e._config && e.localName.startsWith("jam-")) all.push(e); if (e.shadowRoot) walk(e.shadowRoot); } }; walk(document);
    for (const c of all) c.hass = nh;
    await tick(200);
    let left = 0; const count = r => { left += r.querySelectorAll(".gn, svg.gn-cells, .gn-sr, b.gb").length; for (const e of r.querySelectorAll("*")) if (e.shadowRoot) count(e.shadowRoot); }; count(document);
    out.back = {left, look: card.dataset.look, text: pct().textContent, clock: clock ? clock.textContent : null};
    return out;
  });
  await p.close();
  const f = r.first;
  check(r.look === "grid" && f.gn && f.cells > 10 && f.hidden && f.sr === "56%" && /inset\(50%\)/.test(f.srClip) && f.text === "56%" && r.bar === 6,
    `grid numerals: jam-light 56% drawn as ${f.cells} aria-hidden cells, the text "${f.sr}" kept visually hidden (${f.srClip}), brightness row ${r.bar}/10 cells`);
  check(r.rebuild.steps >= 4 && r.rebuild.span <= 300 + r.rebuild.frame && r.rebuild.after.sr === "30%" && r.rebuild.bar === 3,
    `grid numerals: 56% -> 30% rebuilds cell by cell (${r.rebuild.steps} states over ${r.rebuild.span} ms <= 300 ms + a frame of ${r.rebuild.frame} ms), row ${r.rebuild.bar}/10`);
  check(r.instant.same && r.instant.sr === "90%", `grid numerals: with JamCards.motion = false the new value is drawn at once (${JSON.stringify(r.instant)})`);
  check(!!r.clock && r.clock.gn && r.clock.cells > 20 && /^\d{1,2}:\d\d/.test(r.clock.sr || ""), `grid numerals: the kiosk clock is a cell numeral (${r.clock && r.clock.sr}, ${r.clock && r.clock.cells} cells)`);
  check(r.back.left === 0 && r.back.look === "poster" && r.back.text === "90%" && /^\d{1,2}:\d\d/.test(r.back.clock || "") && !errs.length,
    `grid numerals: back to Poster nothing of the cells is left (${JSON.stringify(r.back)}), page errors: ${errs.join(" | ") || "none"}`);
};
