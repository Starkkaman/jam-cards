// Kiosk Lights sheets (1.1.1). Isaac 2026-11-08 on the kitchen Echo Show (961 x 601): "Kitchen kiosk dash looks a little silly
// with the giant paddles on the light popup", and on the living-room iPad (1024 x 768): "The living room one looks silly too".
// The sheet's rows of lights took the height left (minmax(min-content, 1fr)) and the size: kiosk light cards stretched their
// rocker and fader with them (404px tall on the Echo, 296px on the iPad); the switch card (Tree) became a tall empty panel
// with POWER at the bottom; the purifier / All off row got what was left.
// Fresh pages of the preview, day and night, scratch jam-kiosk cards shaped like the live dashboards: the kitchen (rows [3]:
// three kiosk lights) at 961x601 and the living room (rows [1, 4, [3, 2]]: scenes; three kiosk lights + a kiosk switch tile;
// the purifier + an All off action) at 1024x768, plus both at 1440x900 and 1920x1080 (a kiosk dashboard on a desktop).
// Asserts: every kiosk rocker and fader is at most 200px tall (and at least 160px: not squeezed); a switch card's plate is as
// tall as the rockers (the row lines up, no empty slab); every card in a row is as tall as the row's tallest content (not
// stretched to the sheet) and the rockers / plates of a row end on one line; nothing in the sheet runs past its card, the purifier row gets its natural height (its content fits), the body
// does not scroll; the group of rows sits in the middle of the body when there is room (the gaps above and below it differ
// by <= 2px).
// Contract: module.exports = async (page, check) => {}.
module.exports = async (page, check) => {
  const url = page.url().replace(/\?.*$/, ""), browser = page.context().browser();
  const runs = [["kitchen", 961, 601, "light"], ["kitchen", 961, 601, "dark"], ["living", 1024, 768, "light"], ["living", 1024, 768, "dark"],
    ["living", 1440, 900, "dark"], ["kitchen", 1920, 1080, "light"]];
  for (const [kind, w, h, mode] of runs) {
    const p = await browser.newPage({viewport: {width: w, height: h}});
    const errs = []; p.on("pageerror", e => errs.push(e.message));
    await p.goto(url + `?mode=${mode}`);
    await p.waitForFunction(() => window.__ready);
    const m = await p.evaluate(async kind => {
      const H = window.__hass, wait = ms => new Promise(r => setTimeout(r, ms));
      const lights = ["light.kitchen_lamp", "light.tree", "light.living_room", "light.wled", "light.garage"].filter(id => H.states[id]);
      const sw = Object.keys(H.states).find(id => /^switch\./.test(id) && ["on", "off"].includes(H.states[id].state));
      const scenes = [...document.querySelectorAll("#view jam-scenes")].map(x => x._config).find(Boolean);
      if (lights.length < 3 || !sw || !scenes || !H.states["fan.vital_200s_series"]) return {missing: true};
      const L = id => ({type: "custom:jam-light", entity: id, size: "kiosk"});
      const block = kind === "kitchen" ? {name: "Lights", title: "Kitchen", rows: [3], cards: lights.slice(0, 3).map(L)}
        : {name: "Lights", title: "Living room", rows: [1, 4, [3, 2]], cards: [{...scenes, size: "kiosk"}, ...lights.slice(0, 3).map(L), {type: "custom:jam-tile", entity: sw, size: "kiosk"},
          {type: "custom:jam-fan", entity: "fan.vital_200s_series", size: "kiosk"}, {type: "custom:jam-button", name: "All lights off", tap_action: {action: "perform-action", perform_action: "light.turn_off"}}]};
      window.loadCardHelpers = async () => ({createCardElement: c => { const e = document.createElement(c.type.slice(7)); e.setConfig(c); return e; }});
      const k = document.createElement("jam-kiosk");
      k.setConfig({type: "custom:jam-kiosk", dock: [block, {name: "Music", state: {text: "Idle"}, cards: []}]}); k.hass = H;
      document.body.prepend(k); await wait(400);
      [...k.shadowRoot.querySelectorAll(".c-kt .c-open")].find(x => /Lights/.test(x.textContent)).click();
      await wait(1200);
      const hs = [...document.querySelectorAll(".jam-sheet-host")].pop(), sr = hs.shadowRoot, body = sr.querySelector(".body");
      const R = e => e.getBoundingClientRect(), kids = [...body.children], out = {rk: [], vf: [], plates: [], cards: [], spill: [], appl: null};
      for (const c of kids) {
        const r = c.shadowRoot, cr = R(c);
        if (!r) continue;
        for (const x of r.querySelectorAll(".c-rk:not(.c-mini)")) out.rk.push(Math.round(R(x).height));
        for (const x of r.querySelectorAll(".c-vf")) out.vf.push(Math.round(R(x).height));
        for (const x of r.querySelectorAll(".c-swp")) out.plates.push(Math.round(R(x).height));
        const lc = r.querySelector(".c-lc");
        if (lc) { const cs = getComputedStyle(lc), n = lc.children.length; // its content's height: children + padding + gaps
          const need = [...lc.children].reduce((s, x) => s + R(x).height, 0) + parseFloat(cs.paddingTop) + parseFloat(cs.paddingBottom) + parseFloat(cs.borderTopWidth) * 2 + (n - 1) * parseFloat(cs.rowGap);
          const rocker = lc.querySelector(".c-rk:not(.c-mini), .c-swp");
          out.cards.push({top: Math.round(cr.top), h: Math.round(R(lc).height), need: Math.round(need), foot: rocker ? Math.round(R(rocker).bottom) : null}); }
        for (const x of r.querySelectorAll("*")) { const q = R(x); if (q.width && q.height && (q.bottom > cr.bottom + 2 || q.right > cr.right + 2)) { out.spill.push(c.localName + " " + (x.getAttribute("class") || x.localName)); break; } }
        const ap = r.querySelector(".c-appl"); if (ap) out.appl = {sh: ap.scrollHeight, ch: ap.clientHeight};
      }
      const br = R(body), first = R(kids[0]), last = kids.map(R).reduce((a, b) => (b.bottom > a.bottom ? b : a));
      out.gaps = [Math.round(first.top - br.top), Math.round(br.bottom - last.bottom)];
      out.scrolls = body.scrollHeight > body.clientHeight + 1;
      return out;
    }, kind);
    const tag = `kiosk lights ${kind} ${w}x${h} ${mode}`;
    if (m.missing) { check(false, `${tag}: preview fixtures missing`); await p.close(); continue; }
    const bad = [];
    if (m.rk.length < 3) bad.push(`${m.rk.length} rockers`);
    for (const v of [...m.rk, ...m.vf]) if (v > 200.5 || v < 159.5) bad.push(`rocker / fader ${v}px (want 160-200)`);
    for (const v of m.plates) if (Math.abs(v - m.rk[0]) > 1) bad.push(`switch plate ${v}px, rockers ${m.rk[0]}px`);
    if (kind === "living" && !m.plates.length) bad.push("no switch plate");
    // every card in a row is as tall as the tallest content in it (the row is content-sized, not stretched to the sheet), and
    // the rockers / plates of a row end on one line
    const rows = new Map(); for (const c of m.cards) { const r = rows.get(c.top) || []; r.push(c); rows.set(c.top, r); }
    for (const [top, r] of rows) {
      const most = Math.max(...r.map(c => c.need));
      for (const c of r) if (c.h > most + 2) bad.push(`a card at ${top} is ${c.h}px, its row's content ${most}px (stretched)`);
      const feet = new Set(r.map(c => c.foot).filter(v => v !== null)); if (feet.size > 1) bad.push(`rockers of a row end at ${[...feet].join(" / ")}`);
    }
    if (m.spill.length) bad.push("spills: " + m.spill.join(", "));
    if (m.appl && m.appl.sh > m.appl.ch + 1) bad.push(`purifier squeezed (${m.appl.sh} > ${m.appl.ch})`);
    if (m.scrolls) bad.push("the body scrolls");
    if (!m.scrolls && Math.abs(m.gaps[0] - m.gaps[1]) > 2) bad.push(`rows not centred (gaps ${m.gaps.join(" / ")})`);
    check(!bad.length && !errs.length, `${tag}: rockers ${JSON.stringify(m.rk)}px, faders ${JSON.stringify(m.vf)}px${m.plates.length ? `, switch plate ${m.plates}px` : ""}, cards at their content, rows centred (${m.gaps.join(" / ")})` +
      (bad.length || errs.length ? " — " + [...bad, ...errs].join("; ") : ""));
    await p.close();
  }
};
