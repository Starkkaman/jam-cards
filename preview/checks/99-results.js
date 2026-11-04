// jam-results (Olympia look card; fixture preview/fixtures/99-results.js): values (66.2°, 8.4 kWh, a word), square
// squares >= 112px, `columns`, colours (item colour, neutral face-2 square without colour / threshold, a threshold breach
// with its inverted "high" plate, re-coloured live with a custom word), numerals >= 3.4rem on squares >= 160px, text on the
// squares >= 4.5:1, a missing sensor = name + "Offline", values fit their square, Enter = more-info.
// Contract: module.exports = async (page, check) => {}; Poster dark/1280.
module.exports = async (page, check) => {
  await page.waitForTimeout(100);
  const read = () => page.evaluate(() => {
    const J = window.JamCards, rgb = s => (/rgba?\(([\d.]+),\s*([\d.]+),\s*([\d.]+)/.exec(s) || []).slice(1, 4).map(Number);
    const tok = (n, v) => { const p = document.createElement("span"); p.style.color = v; n.shadowRoot.append(p); const c = getComputedStyle(p).color; p.remove(); return c; };
    return [...document.querySelectorAll("#view jam-results")].filter(c => !c.closest(".errors")).map(c => ({
      cols: getComputedStyle(c.shadowRoot.querySelector(".grid")).gridTemplateColumns.split(" ").length,
      sq: [...c.shadowRoot.querySelectorAll(".rsq")].map(s => {
        const f = s.querySelector(".face"), cs = getComputedStyle(f), b = s.getBoundingClientRect(), v = s.querySelector(".val"), lb = s.querySelector(".lb"), big = s.querySelector(".big");
        const lc = getComputedStyle(lb), lbg = lc.backgroundColor === "rgba(0, 0, 0, 0)" ? cs.backgroundColor : lc.backgroundColor;
        return {v: big.textContent, u: (s.querySelector(".u") || {}).textContent || "", lb: lb.textContent, br: lb.classList.contains("br"),
          w: b.width, h: b.height, bg: cs.backgroundColor, ratio: J.contrastRatio(rgb(lbg), rgb(lc.color)), fs: parseFloat(getComputedStyle(big).fontSize), shrunk: !!big.style.fontSize,
          fit: v.scrollWidth <= v.clientWidth + 1, un: s.classList.contains("un"), nt: s.classList.contains("nt"), role: s.getAttribute("role"), aria: s.getAttribute("aria-label"),
          red: tok(c, "var(--red)"), green: tok(c, "var(--green)"), pink: tok(c, "var(--pink)"), slab2: tok(c, "var(--slab2)")};
      })}));
  });
  const [a, b] = await read();
  check(a && b && JSON.stringify(a.sq.map(s => s.v + s.u)) === JSON.stringify(["66.2°", "8.4kWh", "Good"]), `jam-results: values ${a && a.sq.map(s => s.v + " " + s.u).join(" / ")}`);
  const all = [...a.sq, ...b.sq];
  check(all.every(s => s.w >= 112 && Math.abs(s.w - s.h) < 1.5 && s.role === "button" && s.fit), `jam-results: squares >= 112px, square, buttons, values fit (${all.map(s => Math.round(s.w) + "x" + Math.round(s.h)).join(" ")})`);
  check(b.cols === 2 && a.cols >= 3, `jam-results: columns: 2 -> ${b.cols} columns; auto -> ${a.cols}`);
  check(a.sq[0].bg === a.sq[0].pink && a.sq[1].nt && a.sq[1].bg === a.sq[1].slab2 && b.sq[0].nt,
    "jam-results: item colour (pink); no colour and no threshold = a neutral face-2 square (energy, humidity)");
  check(b.sq[1].bg === b.sq[1].red && b.sq[1].br && /· high$/.test(b.sq[1].lb) && /high/.test(b.sq[1].aria),
    `jam-results: CO2 above 1000 -> red + inverted label plate "${b.sq[1].lb}" (no colour needed to read it)`);
  check(all.filter(s => !s.un).every(s => s.ratio >= 4.5), `jam-results: labels on the squares >= 4.5:1 (${all.filter(s => !s.un).map(s => s.ratio.toFixed(1)).join(", ")})`);
  const large = b.sq.filter(s => s.w >= 160 && !s.un && !s.shrunk && !/[a-z]/i.test(s.v));
  check(large.length >= 2 && large.every(s => s.fs >= 3.4 * 16 - .5), `jam-results: numerals >= 3.4rem on squares >= 160px (${large.map(s => s.fs + "px").join(", ")})`);
  check(b.sq[3].un && b.sq[3].v === "Offline" && b.sq[3].lb === "Outside", `jam-results: a missing sensor = its name + "Offline" ("${b.sq[3].lb}" / "${b.sq[3].v}")`);
  // Live threshold: CO2 500 -> below 600 -> green with its own word; back.
  await page.evaluate(() => {
    const c = [...document.querySelectorAll("#view jam-results")].filter(x => !x.closest(".errors"))[1], h = window.__hass, s = h.states["sensor.rs_co2"];
    c.hass = {...h, states: {...h.states, "sensor.rs_co2": {...s, state: "500"}}};
  });
  const live = (await read())[1].sq[1];
  await page.evaluate(() => { const c = [...document.querySelectorAll("#view jam-results")].filter(x => !x.closest(".errors"))[1]; c.hass = window.__hass; });
  check(live.bg === live.green && live.v === "500" && /· good$/.test(live.lb), `jam-results: CO2 500 -> below 600 -> green, "${live.lb}"`);
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
