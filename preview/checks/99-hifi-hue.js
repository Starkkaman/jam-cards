// Hi-Fi light pop-up: stepless hue and saturation sliders (Isaac 2026-11-08: "I want stepless hue and saturation sliders in
// the light popup menu"), and a stepless colour-temperature slider for lights with colour temperature only.
// On scratch cards of the dark/1280 preview page (the preview shots stay as they were):
//   - a light with hs: Hue (0-360) and Saturation (0-100) sliders with role=slider, aria-valuemin/max/now/text, the values
//     read out in Plex Mono ("212°", "64 %") on a line above each track and a live colour chip; Isaac 2026-11-08 ("The hue
//     should replace the color slider. And they should both be the same width as the color slider."): no 12-swatch strip,
//     both tracks span the Colour block's full width; a hue drag of ~1 s sends at most one light.turn_on per
//     300 ms with hs_color, the readout follows the finger, the pop-up is not redrawn under the finger (a state update arrives
//     mid-drag), the last call carries exactly the shown value; a late state from an earlier call does not move the cap back;
//     the same for saturation (the final call = [the hue, the shown saturation]);
//   - keys: ArrowRight x3 = one call +3°, PageUp +10, Home 0, End 360 (one call per burst), focus survives a pop-up refill;
//   - a light that is off: moving a slider turns it on with that colour (light.turn_on with hs_color);
//   - colour temperature only: a Temperature slider (min / max kelvin from the attributes), no hue / saturation; End sends the
//     maximum; brightness only: no colour sliders; the living-room group and the WLED light (presets) get hue + saturation;
//   - sizes: at 390x844, 1440x900, 1920x1080, 1024x768 and 961x601 the group's pop-up (and its size: kiosk pop-up) shows both
//     sliders inside the face with no horizontal overflow, every slider >= 44px with its hit area and its track >= 150px wide;
//     a kiosk pop-up at 1024x768 and 961x601 fits without a scrolling body (the face inside the viewport).
// Contract: module.exports = async (page, check) => {}.
module.exports = async (page, check) => {
  const errs = [], onErr = e => errs.push(e.message);
  page.on("pageerror", onErr);
  await page.evaluate(() => {
    const st = (id, state, attributes) => ({entity_id: id, state, attributes, last_changed: new Date().toISOString(), last_updated: "x"});
    Object.assign(window.__hass.states, {
      "light.hu_a": st("light.hu_a", "on", {friendly_name: "Reading lamp", supported_color_modes: ["hs", "color_temp"], color_mode: "hs", brightness: 180,
        hs_color: [212, 64], rgb_color: [92, 160, 255], min_color_temp_kelvin: 2200, max_color_temp_kelvin: 6500}),
      "light.hu_off": st("light.hu_off", "off", {friendly_name: "Shelf strip", supported_color_modes: ["rgb"], color_mode: null, brightness: null, hs_color: null, rgb_color: null}),
      "light.hu_ct": st("light.hu_ct", "on", {friendly_name: "Desk lamp", supported_color_modes: ["color_temp"], color_mode: "color_temp", brightness: 150,
        color_temp_kelvin: 3000, min_color_temp_kelvin: 2202, max_color_temp_kelvin: 4504}),
      "light.hu_br": st("light.hu_br", "on", {friendly_name: "Hall", supported_color_modes: ["brightness"], color_mode: "brightness", brightness: 120}),
    });
  });
  const calls = () => page.evaluate(() => window.__calls.length);
  const callsFrom = n => page.evaluate(n => window.__calls.slice(n), n);
  // open a pop-up for a scratch card; returns nothing, keeps window.__hu = {card, sr}
  const open = async (p, entity, extra = {}) => p.evaluate(async ([entity, extra]) => {
    for (const s of [...document.querySelectorAll(".jam-sheet-host")].reverse()) window.dispatchEvent(new KeyboardEvent("keydown", {key: "Escape", bubbles: true}));
    await new Promise(r => setTimeout(r, 150));
    if (window.__hu && window.__hu.card) window.__hu.card.remove();
    const e = document.createElement("jam-light");
    e.setConfig({type: "custom:jam-light", entity, ...extra}); e.hass = window.__hass;
    e.style.cssText = "position:absolute;left:0;top:0;width:300px;z-index:60";
    document.body.append(e);
    await new Promise(r => setTimeout(r, 250));
    const b = [...e.shadowRoot.querySelectorAll("button")].find(x => /open light controls/.test(x.getAttribute("aria-label") || ""));
    if (!b) return false;
    b.click();
    await new Promise(r => setTimeout(r, 600));
    const hs = [...document.querySelectorAll(".jam-sheet-host")];
    window.__hu = {card: e, sr: hs[hs.length - 1].shadowRoot};
    return true;
  }, [entity, extra]);
  const sl = (p, key) => p.evaluate(key => {
    const f = window.__hu.sr.querySelector(`[role=slider][data-key="${key}"]`);
    if (!f) return null;
    const row = f.previousElementSibling, v = row && row.querySelector(".c-tv"), chip = f.closest(".c-blk") && f.closest(".c-blk").querySelector(".c-tchip");
    return {now: +f.getAttribute("aria-valuenow"), min: +f.getAttribute("aria-valuemin"), max: +f.getAttribute("aria-valuemax"), text: f.getAttribute("aria-valuetext"),
      label: f.getAttribute("aria-label"), read: v ? v.textContent : null, chip: chip ? getComputedStyle(chip).backgroundColor : null};
  }, key);
  const push = (p, entity, attrs, state) => p.evaluate(([entity, attrs, state]) => {
    const h = window.__hass, s0 = h.states[entity], s = {...s0, state: state || s0.state, attributes: {...s0.attributes, ...attrs}, last_updated: String(Math.random())};
    h.states[entity] = s; window.__hu.card.hass = {...h, states: {...h.states}};
  }, [entity, attrs, state]);
  // drag a slider from fraction a to b over ~1 s; mid: a state update in the middle
  const drag = async (p, key, a, b, mid) => {
    const el = (await p.evaluateHandle(key => window.__hu.sr.querySelector(`[role=slider][data-key="${key}"]`), key)).asElement();
    const bb = await el.boundingBox(), y = bb.y + bb.height / 2, n0 = await calls(), t0 = Date.now(), reads = [];
    await p.evaluate(key => { window.__hu.f0 = window.__hu.sr.querySelector(`[role=slider][data-key="${key}"]`); }, key);
    await p.mouse.move(bb.x + bb.width * a, y); await p.mouse.down();
    for (let i = 1; i <= 10; i++) {
      await p.mouse.move(bb.x + bb.width * (a + (b - a) * i / 10), y);
      if (i === 5 && mid) await mid();
      await p.waitForTimeout(100);
      reads.push(await p.evaluate(() => { const f = window.__hu.f0; return [+f.getAttribute("aria-valuenow"), f.previousElementSibling.querySelector(".c-tv").textContent]; }));
    }
    const during = await callsFrom(n0), ms = Date.now() - t0;
    const same = await p.evaluate(key => window.__hu.sr.querySelector(`[role=slider][data-key="${key}"]`) === window.__hu.f0, key);
    const shown = await p.evaluate(() => +window.__hu.f0.getAttribute("aria-valuenow"));
    await p.mouse.up(); await p.waitForTimeout(150);
    return {during, ms, same, shown, reads, all: await callsFrom(n0)};
  };

  // ---- an hs light ----
  check(await open(page, "light.hu_a"), "hifi hue: the light pop-up opens for an hs light");
  let H = await sl(page, "hue"), S = await sl(page, "sat");
  const lay = await page.evaluate(() => {
    const sr = window.__hu.sr, h = sr.querySelector('[data-key="hue"]'), s = sr.querySelector('[data-key="sat"]'), blk = h.closest(".c-blk"), hl = h.previousElementSibling;
    const w = n => n.getBoundingClientRect();
    return {strip: !!sr.querySelector(".c-hue"), bw: Math.round(w(blk).width), hw: Math.round(w(h).width), sw: Math.round(w(s).width), above: w(hl).bottom <= w(h).top + .5};
  });
  check(!lay.strip && Math.abs(lay.hw - lay.bw) <= 1 && Math.abs(lay.sw - lay.bw) <= 1 && lay.above,
    `hifi hue: no swatch strip, Hue and Saturation span the Colour block (${lay.hw} / ${lay.sw} of ${lay.bw}px), name + value on a line above (${JSON.stringify(lay)})`);
  check(!!H && !!S && H.min === 0 && H.max === 360 && H.now === 212 && H.read === "212°" && /212 degrees/.test(H.text) && /hue/i.test(H.label) &&
    S.min === 0 && S.max === 100 && S.now === 64 && S.read === "64 %" && /64 percent/.test(S.text) && /saturation/i.test(S.label) && /^rgb/.test(H.chip || ""),
    `hifi hue: Hue 0-360 and Saturation 0-100 sliders show the light's colour (${JSON.stringify({H, S})})`);
  const chip0 = H && H.chip;
  let d = await drag(page, "hue", .2, .75, () => push(page, "light.hu_a", {brightness: 181}));
  let last = d.all[d.all.length - 1];
  const readOk = d.reads.every(([v, t]) => t === v + "°");
  check(d.during.length >= 2 && d.during.length <= Math.ceil(d.ms / 300) + 1 && d.all.every(c => c.domain === "light" && c.service === "turn_on" && c.data.entity_id === "light.hu_a" && Array.isArray(c.data.hs_color)) &&
    last && last.data.hs_color[0] === d.shown && last.data.hs_color[1] === 64 && d.same && readOk && d.shown !== 212,
    `hifi hue drag: ${d.during.length} calls in a ${d.ms} ms drag (<= one per 300 ms), the last hs_color ${last && JSON.stringify(last.data.hs_color)} = the shown ${d.shown}°, readout follows (${readOk}), not redrawn under the finger (${d.same})`);
  H = await sl(page, "hue");
  check(H.chip !== chip0, `hifi hue: the chip shows the new colour (${chip0} -> ${H.chip})`);
  // a late state from an earlier call: the cap stays where the finger left it
  const hueShown = d.shown;
  await push(page, "light.hu_a", {hs_color: [d.all[0].data.hs_color[0], 64]}); await page.waitForTimeout(150);
  H = await sl(page, "hue");
  check(H.now === hueShown && H.read === hueShown + "°", `hifi hue: a late state (hue ${d.all[0].data.hs_color[0]}) does not move the cap back (shows ${H.now}, want ${hueShown})`);
  d = await drag(page, "sat", .7, .25);
  last = d.all[d.all.length - 1];
  check(d.during.length >= 2 && d.during.length <= Math.ceil(d.ms / 300) + 1 && last && last.data.hs_color[0] === hueShown && last.data.hs_color[1] === d.shown && d.same &&
    d.reads.every(([v, t]) => t === v + " %"),
    `hifi saturation drag: ${d.during.length} calls in ${d.ms} ms, the last hs_color ${last && JSON.stringify(last.data.hs_color)} = [${hueShown}, ${d.shown}]`);
  const satShown = d.shown;
  // keys
  await page.evaluate(() => window.__hu.sr.querySelector('[data-key="hue"]').focus());
  let n0 = await calls();
  for (let i = 0; i < 3; i++) await page.keyboard.press("ArrowRight");
  await page.waitForTimeout(400);
  let kc = await callsFrom(n0);
  const k1 = kc.length === 1 && kc[0].data.hs_color[0] === Math.min(360, hueShown + 3) && kc[0].data.hs_color[1] === satShown;
  // a pop-up refill (state update) keeps the keyboard focus on the slider
  await push(page, "light.hu_a", {brightness: 170}); await page.waitForTimeout(150);
  const focus = await page.evaluate(() => { const a = window.__hu.sr.activeElement; return a ? a.dataset.key : null; });
  n0 = await calls();
  await page.keyboard.press("PageUp"); await page.waitForTimeout(400);
  const pg = (await callsFrom(n0)).map(c => c.data.hs_color[0]);
  n0 = await calls();
  await page.keyboard.press("Home"); await page.waitForTimeout(400);
  const home = (await callsFrom(n0)).map(c => c.data.hs_color[0]);
  n0 = await calls();
  await page.keyboard.press("End"); await page.waitForTimeout(400);
  const end = (await callsFrom(n0)).map(c => c.data.hs_color[0]);
  H = await sl(page, "hue");
  check(k1 && focus === "hue" && pg.length === 1 && pg[0] === Math.min(360, hueShown + 13) && home.join() === "0" && end.join() === "360" && H.now === 360 && H.read === "360°",
    `hifi hue keys: 3x ArrowRight = one call +3 (${JSON.stringify(kc.map(c => c.data.hs_color))}), focus kept over a refill (${focus}), PageUp +10 (${pg}), Home ${home}, End ${end}`);
  await page.evaluate(() => window.__hu.sr.querySelector('[data-key="sat"]').focus());
  n0 = await calls();
  await page.keyboard.press("ArrowLeft"); await page.keyboard.press("PageDown"); await page.waitForTimeout(400);
  kc = await callsFrom(n0);
  check(kc.length === 1 && kc[0].data.hs_color[1] === Math.max(0, satShown - 11), `hifi saturation keys: ArrowLeft + PageDown = one call -11 (${JSON.stringify(kc.map(c => c.data.hs_color))})`);

  // ---- a light that is off ----
  check(await open(page, "light.hu_off"), "hifi hue: the pop-up opens for a light that is off");
  d = await drag(page, "sat", .1, .6);
  last = d.all[d.all.length - 1];
  check(!!last && last.service === "turn_on" && last.data.entity_id === "light.hu_off" && last.data.hs_color[1] === d.shown && d.shown > 0,
    `hifi hue: moving a slider of a light that is off turns it on with that colour (${JSON.stringify(last && last.data)})`);

  // ---- colour temperature only; brightness only ----
  check(await open(page, "light.hu_ct"), "hifi hue: the pop-up opens for a colour-temperature light");
  const ct = await sl(page, "ct"), noHs = !(await sl(page, "hue")) && !(await sl(page, "sat"));
  await page.evaluate(() => window.__hu.sr.querySelector('[data-key="ct"]').focus());
  n0 = await calls(); await page.keyboard.press("End"); await page.waitForTimeout(400);
  const ce = await callsFrom(n0);
  check(!!ct && ct.min === 2202 && ct.max === 4504 && ct.now === 3000 && ct.read === "3000 K" && noHs && ce.length === 1 && ce[0].data.color_temp_kelvin === 4504,
    `hifi colour temperature: a stepless Temperature slider 2202-4504 K at 3000 K, no hue / saturation, End sends 4504 K (${JSON.stringify({ct, calls: ce.map(c => c.data)})})`);
  d = await drag(page, "ct", .1, .5);
  last = d.all[d.all.length - 1];
  check(d.during.length >= 1 && d.during.length <= Math.ceil(d.ms / 300) + 1 && last && last.data.color_temp_kelvin === d.shown && d.reads.every(([v, t]) => t === v + " K"),
    `hifi colour temperature drag: ${d.during.length} calls in ${d.ms} ms, the last ${last && last.data.color_temp_kelvin} K = the shown ${d.shown} K`);
  check(await open(page, "light.hu_br"), "hifi hue: the pop-up opens for a brightness-only light");
  const none = await page.evaluate(() => [...window.__hu.sr.querySelectorAll("[role=slider][data-key]")].map(f => f.dataset.key));
  check(!none.length, `hifi hue: a brightness-only light has no colour sliders (${none.join(",")})`);
  // ---- the living-room group and the WLED light ----
  check(await open(page, "light.living_room") && !!(await sl(page, "hue")) && !!(await sl(page, "sat")), "hifi hue: the living-room group pop-up has hue + saturation");
  check(await open(page, "light.wled", {preset_entity: "select.wled_preset"}), "hifi hue: the WLED pop-up opens");
  H = await sl(page, "hue"); S = await sl(page, "sat");
  d = await drag(page, "hue", .5, .3);
  last = d.all[d.all.length - 1];
  check(!!H && !!S && H.now === 266 && S.now === 77 && last && last.data.entity_id === "light.wled" && last.data.hs_color[0] === d.shown,
    `hifi hue: WLED (presets) gets hue ${H && H.now}° + saturation ${S && S.now} % and sends hs_color ${last && JSON.stringify(last.data.hs_color)}`);
  await page.evaluate(() => { for (const s of [...document.querySelectorAll(".jam-sheet-host")].reverse()) window.dispatchEvent(new KeyboardEvent("keydown", {key: "Escape", bubbles: true}));
    if (window.__hu && window.__hu.card) window.__hu.card.remove(); delete window.__hu; });
  await page.waitForTimeout(200);

  // ---- sizes ----
  const url = page.url(), browser = page.context().browser(), bad = [];
  for (const [w, h] of [[390, 844], [1440, 900], [1920, 1080], [1024, 768], [961, 601]]) {
    const p = await browser.newPage({viewport: {width: w, height: h}});
    p.on("pageerror", onErr);
    await p.goto(url); await p.waitForFunction(() => window.__ready); await p.evaluate(() => document.fonts.ready);
    for (const kiosk of [false, true]) {
      if (!(await open(p, "light.living_room", kiosk ? {size: "kiosk"} : {}))) { bad.push(`${w}x${h}${kiosk ? " kiosk" : ""}: no pop-up`); continue; }
      const m = await p.evaluate(() => {
        const sr = window.__hu.sr, face = sr.querySelector(".sheet > .face").getBoundingClientRect(), body = sr.querySelector(".body");
        const out = [];
        for (const k of ["hue", "sat"]) {
          const f = sr.querySelector(`[role=slider][data-key="${k}"]`);
          if (!f) { out.push({k, missing: true}); continue; }
          const r = f.getBoundingClientRect(), hit = getComputedStyle(f, "::before");
          out.push({k, l: r.left, r: r.right, b: r.bottom, w: r.width, h: Math.max(r.height, parseFloat(hit.height) || 0)});
        }
        return {face: [face.left, face.top, face.right, face.bottom], scroll: body.scrollHeight > body.clientHeight + 1, hover: body.scrollWidth > body.clientWidth + 1, out};
      });
      const why = [], [fl, ft, fr, fb] = m.face;
      for (const s of m.out) {
        if (s.missing) { why.push(`${s.k} missing`); continue; }
        if (s.l < fl - .5 || s.r > fr + .5) why.push(`${s.k} outside the face`);
        if (s.w < 150) why.push(`${s.k} track ${Math.round(s.w)}px`);
        if (s.h < 43.5) why.push(`${s.k} ${Math.round(s.h)}px tall`);
      }
      if (m.hover) why.push("body overflows horizontally");
      if (ft < -.5 || fb > h + .5 || fl < -.5 || fr > w + .5) why.push(`face outside the viewport [${m.face.map(Math.round)}]`);
      if (kiosk && w > 600 && m.scroll) why.push("kiosk pop-up body scrolls");
      if (why.length) bad.push(`${w}x${h}${kiosk ? " kiosk" : ""}: ${why.join(", ")}`);
    }
    await p.close();
  }
  check(!bad.length, "hifi hue sizes: the group's pop-up and its kiosk pop-up show both sliders (>= 44px, track >= 150px) at 390x844, 1440x900, 1920x1080, 1024x768, 961x601; kiosk pop-ups fit without scrolling" + (bad.length ? " — " + bad.join("; ") : ""));
  await page.evaluate(() => { for (const id of Object.keys(window.__hass.states)) if (/^light\.hu_/.test(id)) delete window.__hass.states[id]; });
  page.off("pageerror", onErr);
  check(!errs.length, "hifi hue: no page errors" + (errs.length ? " — " + errs.slice(0, 4).join("; ") : ""));
};
