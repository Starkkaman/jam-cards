// jam-results (Olympia look card; fixture preview/fixtures/99-results.js): values (66.2°, 8.4 kWh, a word), square
// squares >= 112px, `columns`, colours (item colour, default hue order, a threshold, re-coloured live), text on the
// squares >= 4.5:1, unavailable squares, values fit their square, Enter = more-info.
// Contract: module.exports = async (page, check) => {}; Poster dark/1280.
module.exports = async (page, check) => {
  await page.waitForTimeout(100);
  const read = () => page.evaluate(() => {
    const J = window.JamCards, rgb = s => (/rgba?\(([\d.]+),\s*([\d.]+),\s*([\d.]+)/.exec(s) || []).slice(1, 4).map(Number);
    const tok = (n, v) => { const p = document.createElement("span"); p.style.color = v; n.shadowRoot.append(p); const c = getComputedStyle(p).color; p.remove(); return c; };
    return [...document.querySelectorAll("#view jam-results")].filter(c => !c.closest(".errors")).map(c => ({
      cols: getComputedStyle(c.shadowRoot.querySelector(".grid")).gridTemplateColumns.split(" ").length,
      sq: [...c.shadowRoot.querySelectorAll(".rsq")].map(s => {
        const f = s.querySelector(".face"), cs = getComputedStyle(f), b = s.getBoundingClientRect(), v = s.querySelector(".val");
        return {v: s.querySelector(".big").textContent, u: (s.querySelector(".u") || {}).textContent || "", lb: s.querySelector(".lb").textContent,
          w: b.width, h: b.height, bg: cs.backgroundColor, ratio: J.contrastRatio(rgb(cs.backgroundColor), rgb(getComputedStyle(s.querySelector(".lb")).color)),
          fit: v.scrollWidth <= v.clientWidth + 1, un: s.classList.contains("un"), role: s.getAttribute("role"),
          red: tok(c, "var(--red)"), green: tok(c, "var(--green)"), blue: tok(c, "var(--blue)"), pink: tok(c, "var(--pink)")};
      })}));
  });
  const [a, b] = await read();
  check(a && b && JSON.stringify(a.sq.map(s => s.v + s.u)) === JSON.stringify(["66.2°", "8.4kWh", "Good"]), `jam-results: values ${a && a.sq.map(s => s.v + " " + s.u).join(" / ")}`);
  const all = [...a.sq, ...b.sq];
  check(all.every(s => s.w >= 112 && Math.abs(s.w - s.h) < 1.5 && s.role === "button" && s.fit), `jam-results: squares >= 112px, square, buttons, values fit (${all.map(s => Math.round(s.w) + "x" + Math.round(s.h)).join(" ")})`);
  check(b.cols === 2 && a.cols >= 3, `jam-results: columns: 2 -> ${b.cols} columns; auto -> ${a.cols}`);
  check(a.sq[0].bg === a.sq[0].pink && b.sq[0].bg === b.sq[0].blue && b.sq[1].bg === b.sq[1].red, "jam-results: item colour (pink), default hue order (blue first), threshold above 1000 -> red");
  check(all.filter(s => !s.un).every(s => s.ratio >= 4.5), `jam-results: labels on the squares >= 4.5:1 (${all.filter(s => !s.un).map(s => s.ratio.toFixed(1)).join(", ")})`);
  check(b.sq[3].un && b.sq[3].v === "—", `jam-results: unavailable sensor = "—" on face 2`);
  // Live threshold: CO2 500 -> below 600 -> green; back.
  await page.evaluate(() => {
    const c = [...document.querySelectorAll("#view jam-results")].filter(x => !x.closest(".errors"))[1], h = window.__hass, s = h.states["sensor.rs_co2"];
    c.hass = {...h, states: {...h.states, "sensor.rs_co2": {...s, state: "500"}}};
  });
  const live = (await read())[1].sq[1];
  await page.evaluate(() => { const c = [...document.querySelectorAll("#view jam-results")].filter(x => !x.closest(".errors"))[1]; c.hass = window.__hass; });
  check(live.bg === live.green && live.v === "500", `jam-results: CO2 500 -> below 600 -> green (${live.bg})`);
  const got = await page.evaluate(() => {
    const out = [], on = e => out.push(e.detail.entityId);
    window.addEventListener("hass-more-info", on);
    const c = document.querySelector("#view jam-results");
    c.shadowRoot.querySelectorAll(".rsq")[1].dispatchEvent(new KeyboardEvent("keydown", {key: "Enter", bubbles: true, composed: true}));
    window.removeEventListener("hass-more-info", on);
    return out;
  });
  check(got.join() === "sensor.rs_energy_today", `jam-results: Enter on a square = more-info (${got.join()})`);
};
