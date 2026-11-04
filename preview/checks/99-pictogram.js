// jam-pictogram (Olympia look card; fixture preview/fixtures/99-pictogram.js): pictograms from 45° / 90° strokes only, the
// state rule (TV playing -> watch, off -> sofa-tv), facts (group members on, a list count, media app, 66.2°), stroke colour
// on the field >= 3:1, the tile as one control (aria-label, Enter = action, more-info default), a tile without entity /
// actions is not a control, error paths show "—". Contract: module.exports = async (page, check) => {}; Poster dark/1280.
module.exports = async (page, check) => {
  const r = await page.evaluate(() => {
    const J = window.JamCards, cards = [...document.querySelectorAll("#view jam-pictogram")];
    const by = n => cards.find(c => c._config.name === n);
    const info = c => {
      const R = c.shadowRoot, root = R.querySelector(".host > .paper"), fld = R.querySelector(".fld"), svg = R.querySelector("svg.pic");
      const rgb = s => (/rgba?\(([\d.]+),\s*([\d.]+),\s*([\d.]+)/.exec(s) || []).slice(1, 4).map(Number);
      const cs = getComputedStyle(fld);
      return {pic: svg && svg.dataset.pic, facts: [...R.querySelectorAll(".f .v")].map(v => v.textContent), role: root.getAttribute("role"),
        tab: root.tabIndex, label: root.getAttribute("aria-label") || "", h: root.getBoundingClientRect().height,
        ratio: J.contrastRatio(rgb(cs.backgroundColor), rgb(cs.color)), un: R.querySelectorAll(".v.unavail").length};
    };
    // Every stroke / fill path: each segment horizontal, vertical or 45 degrees.
    const bad = [];
    for (const c of cards) for (const p of c.shadowRoot.querySelectorAll("svg.pic path")) {
      let x = 0, y = 0, sx = 0, sy = 0;
      for (const [, cmd, args] of p.getAttribute("d").matchAll(/([MLHVZ])([^MLHVZ]*)/g)) {
        const n = args.trim().split(/[\s,]+/).filter(Boolean).map(Number);
        let nx = x, ny = y;
        if (cmd === "M") { x = sx = n[0]; y = sy = n[1]; continue; }
        if (cmd === "L") { nx = n[0]; ny = n[1]; } else if (cmd === "H") nx = n[0]; else if (cmd === "V") ny = n[0]; else { nx = sx; ny = sy; }
        const dx = Math.abs(nx - x), dy = Math.abs(ny - y);
        if (dx && dy && dx !== dy) bad.push(`${p.closest("svg").dataset.pic}: ${x},${y} -> ${nx},${ny}`);
        x = nx; y = ny;
      }
    }
    const all = cards.filter(c => !c.closest(".errors")).map(info);
    return {n: cards.length, bad, all, living: info(by("Living room")), kitchen: info(by("Kitchen")), bedroom: info(by("Bedroom")),
      office: info(by("Office")), music: info(by("Music room")), err: info(by("Err pictogram"))};
  });
  check(r.n >= 7 && r.bad.length === 0, `jam-pictogram: ${r.n} tiles, every pictogram segment is 0 / 45 / 90 degrees` + (r.bad.length ? " — " + r.bad.slice(0, 4).join("; ") : ""));
  const L = r.living;
  check(L.pic === "watch" && /watching/.test(L.label) && JSON.stringify(L.facts) === JSON.stringify(["4", "YouTube", "66.2°"]),
    `jam-pictogram: living room shows the watching figure while the TV plays, facts 4 lights on / YouTube / 66.2° (${L.pic}, ${JSON.stringify(L.facts)})`);
  check(r.kitchen.facts[0] === "2" && r.bedroom.facts[0] === "0" && r.kitchen.pic === "cook" && r.bedroom.pic === "sleep",
    `jam-pictogram: list counts (kitchen ${r.kitchen.facts[0]} of 3 on, bedroom ${r.bedroom.facts[0]})`);
  check(r.all.every(x => x.ratio >= 3), `jam-pictogram: pictogram colour on its field >= 3:1 (${r.all.map(x => x.ratio.toFixed(1)).join(", ")})`);
  check(L.role === "button" && L.tab === 0 && L.h >= 44 && r.office.role === null && r.office.tab < 0,
    `jam-pictogram: a tile with an action is one button (${L.role}, ${Math.round(L.h)}px); the office tile without entity / actions is not a control (${r.office.role})`);
  check(r.err.un === 2 && r.err.pic === "bath", `jam-pictogram: missing entities show "—" (${r.err.un} facts), a rule on a missing entity is ignored (${r.err.pic})`);
  // Rule off: TV off -> the sofa figure, label without "watching".
  const off = await page.evaluate(async () => {
    const c = [...document.querySelectorAll("#view jam-pictogram")].find(x => x._config.name === "Living room"), h = window.__hass;
    const tv = h.states["media_player.pg_tv"];
    c.hass = {...h, states: {...h.states, "media_player.pg_tv": {...tv, state: "off"}}};
    const out = {pic: c.shadowRoot.querySelector("svg.pic").dataset.pic, label: c.shadowRoot.querySelector(".paper").getAttribute("aria-label"),
      tv: c.shadowRoot.querySelectorAll(".f .v")[1].textContent};
    c.hass = h;
    out.back = c.shadowRoot.querySelector("svg.pic").dataset.pic;
    return out;
  });
  check(off.pic === "sofa-tv" && !/watching/.test(off.label) && off.back === "watch", `jam-pictogram: TV off -> sofa-tv, tv fact "${off.tv}"; playing again -> watch`);
  // Keyboard: Enter on the music room = more-info of its entity; Enter on the living room = navigate.
  const keys = await page.evaluate(async () => {
    const got = [];
    const on = e => got.push(e.detail.entityId);
    window.addEventListener("hass-more-info", on);
    const c = [...document.querySelectorAll("#view jam-pictogram")].find(x => x._config.name === "Music room");
    c.shadowRoot.querySelector(".paper").dispatchEvent(new KeyboardEvent("keydown", {key: "Enter", bubbles: true, composed: true}));
    window.removeEventListener("hass-more-info", on);
    const url = location.href, lv = [...document.querySelectorAll("#view jam-pictogram")].find(x => x._config.name === "Living room");
    lv.shadowRoot.querySelector(".paper").dispatchEvent(new KeyboardEvent("keydown", {key: "Enter", bubbles: true, composed: true}));
    const hash = location.hash;
    history.replaceState(null, "", url);
    return {got, hash};
  });
  check(keys.got.join() === "media_player.pg_speaker" && keys.hash === "#pg-living", `jam-pictogram: Enter = more-info (${keys.got.join()}) / navigate (${keys.hash})`);
};
