// jam-light + jam-popup interactions (fixture preview/fixtures/30-light.js). Also writes preview/shots/popup-{dark,light}-390.png.
// Contract: module.exports = async (page, check, helpers) => {}; runs on the dark/1280 preview page, files in name order.
const path = require("path");
const HASH = "#livingroom-popup";

module.exports = async (page, check, {callsNow}) => {
  const light = name => page.locator(".sec > jam-light").filter({hasText: name});
  const newCalls = async n => (await callsNow()).slice(n);
  const setState = (id, state, attrs) => page.evaluate(([id, state, attrs]) => {
    const h = window.__hass, o = h.states[id];
    h.states[id] = {...o, state, attributes: {...o.attributes, ...attrs}, last_updated: String(Math.random())};
    const nh = {...h};
    document.querySelectorAll(".sec > jam-light, jam-popup").forEach(c => c.hass = nh);
  }, [id, state, attrs]);

  // ---- jam-light: ON key ----
  let n = (await callsNow()).length;
  await light("Table Lamp").locator("button.pw").click();
  let c = await newCalls(n);
  check(c.length === 1 && c[0].domain === "light" && c[0].service === "toggle" && c[0].data.color_temp_kelvin === 2700 && c[0].data.brightness_pct === 80,
    "jam-light ON key runs the custom perform-action light.toggle with its data");
  n = (await callsNow()).length;
  await light("Floor Lamp").locator("button.pw").click();
  c = await newCalls(n);
  check(c.length === 1 && c[0].service === "toggle" && c[0].data.entity_id === "light.living_room_floor_lamp", "jam-light ON key toggles by default");
  check((await light("Floor Lamp").locator("button.pw").textContent()) === "Off" &&
    await light("Floor Lamp").locator(".chips, .sws").count() === 0 && await light("Floor Lamp").locator(".track[role=slider]").count() === 1,
    "off light shows only the OFF key + brightness");
  const swatch = await light("Floor Lamp").evaluate(e => getComputedStyle(e.shadowRoot.querySelector(".swatch")).backgroundColor);
  const swOn = await light("Table Lamp").evaluate(e => getComputedStyle(e.shadowRoot.querySelector(".swatch")).backgroundColor);
  check(swOn === "rgb(255, 159, 70)" && swatch === "rgb(52, 48, 42)", `swatch block shows the light colour / line when off (${swOn}, ${swatch})`);

  // ---- brightness drag (a hass update mid-drag must not break it) ----
  const drag = async (name, from, to) => {
    await light(name).locator(".track").scrollIntoViewIfNeeded();
    const b = await light(name).locator(".track").boundingBox();
    await page.mouse.move(b.x + b.width * from, b.y + b.height / 2);
    await page.mouse.down();
    await setState("light.garage", "on", {brightness: 129});
    await page.mouse.move(b.x + b.width * ((from + to) / 2), b.y + b.height / 2, {steps: 3});
    await page.mouse.move(b.x + b.width * to, b.y + b.height / 2, {steps: 3});
    await page.mouse.up();
  };
  n = (await callsNow()).length;
  await drag("Table Lamp", 0.2, 0.6);
  c = await newCalls(n);
  check(c.length === 1 && c[0].service === "turn_on" && c[0].data.entity_id === "light.kajplats_e26_cws_globe_1100lm" && Math.abs(c[0].data.brightness_pct - 60) <= 1,
    `brightness drag -> light.turn_on brightness_pct 60 (got ${JSON.stringify(c.map(x => x.data))})`);
  n = (await callsNow()).length;
  await drag("Garage", 0.5, -0.1);
  c = await newCalls(n);
  check(c.length === 1 && c[0].service === "turn_off" && c[0].data.entity_id === "light.garage", "releasing brightness at 0 turns the light off");
  n = (await callsNow()).length;
  await drag("Floor Lamp", 0.1, 0.5);
  c = await newCalls(n);
  check(c.length === 1 && c[0].service === "turn_on" && Math.abs(c[0].data.brightness_pct - 50) <= 1, "dragging brightness on an off light turns it on");
  n = (await callsNow()).length;
  await light("Table Lamp").locator(".track").focus();
  await page.keyboard.press("ArrowRight");
  c = await newCalls(n);
  check(c.length === 1 && c[0].data.brightness_pct === 65, `brightness ArrowRight steps +5 from the dragged 60 (got ${c.map(x => x.data.brightness_pct)})`);

  // ---- colour temp chips ----
  const warm = light("Table Lamp").locator(".chips button", {hasText: "Warm"});
  check((await warm.getAttribute("aria-pressed")) === "true", "temp chip closest to 2500 K (Warm) is active");
  n = (await callsNow()).length;
  await light("Table Lamp").locator(".chips button", {hasText: "Day"}).click();
  c = await newCalls(n);
  check(c.length === 1 && c[0].service === "turn_on" && c[0].data.color_temp_kelvin === 6000, "Day chip -> color_temp_kelvin 6000");
  await setState("light.kajplats_e26_cws_globe_1100lm", "on", {min_color_temp_kelvin: 2600, max_color_temp_kelvin: 5000});
  n = (await callsNow()).length;
  await light("Table Lamp").locator(".chips button", {hasText: "Day"}).click();
  await light("Table Lamp").locator(".chips button").first().click();
  c = await newCalls(n);
  const temps = await light("Table Lamp").locator(".chips button").allTextContents();
  check(c.length === 2 && c[0].data.color_temp_kelvin === 5000 && c[1].data.color_temp_kelvin === 2600 && temps.length === 4,
    `temp chips clamp to the light's range 2600-5000 K (${temps.join("/")}, sent ${c.map(x => x.data.color_temp_kelvin)})`);
  await setState("light.kajplats_e26_cws_globe_1100lm", "on", {min_color_temp_kelvin: 2700, max_color_temp_kelvin: 4000});
  const t2 = await light("Table Lamp").locator(".chips button").allTextContents();
  check(t2.join("/") === "Warm/Neutral", `chips that clamp to the same kelvin collapse to the nearest name (${t2.join("/")})`);
  await setState("light.kajplats_e26_cws_globe_1100lm", "on", {min_color_temp_kelvin: 1801, max_color_temp_kelvin: 6535});

  // ---- colour swatches + presets ----
  check(await light("Garage").locator(".chips, .sws").count() === 0, "brightness-only light shows no temp chips or swatches");
  const teal = light("TV light").locator("button.sw[aria-label=Teal]");
  check((await teal.getAttribute("aria-pressed")) === "true" && await light("TV light").locator(".chips").count() === 1,
    "rgb-only light: current colour swatch active, no temp chips (only presets)");
  n = (await callsNow()).length;
  await light("TV light").locator("button.sw[aria-label=Violet]").click();
  await light("TV light").locator("button", {hasText: "Movie"}).click();
  c = await newCalls(n);
  check(c.length === 2 && JSON.stringify(c[0].data.rgb_color) === "[166,108,196]" && JSON.stringify(c[1].data.rgb_color) === "[212,58,28]",
    "swatch / preset -> light.turn_on rgb_color");
  const hall = light("Hall");
  check(await hall.locator("button.pw").isDisabled() && await hall.locator(".track[role=slider]").count() === 0 &&
    (await hall.evaluate(e => getComputedStyle(e.shadowRoot.querySelector(".swatch")).backgroundColor)) === "rgb(224, 85, 59)",
    "unavailable light: red swatch, controls disabled");

  // ---- jam-popup ----
  const pop = page.locator("jam-popup");
  const state = () => pop.evaluate(e => {
    const p = e.shadowRoot.querySelector(".pop"), r = e.getBoundingClientRect(), body = e.shadowRoot.querySelector(".body");
    return {display: getComputedStyle(p).display, h: r.height, hash: location.hash, kids: [...body.children].map(k => k.localName),
      kidHass: [...body.children].every(k => k.hass === e.hass), overflow: document.body.style.overflow,
      focus: document.activeElement === e && e.shadowRoot.activeElement === e.shadowRoot.querySelector(".face")};
  });
  const waitClosed = () => page.waitForFunction(h => location.hash !== h, HASH, {timeout: 2000}).catch(() => null);
  let s = await state();
  check(s.display === "none" && s.h === 0 && s.hash === "", "popup hidden initially, zero height");
  await page.locator("jam-tile").filter({hasText: "Open living room pop-up"}).locator(".name").click();
  s = await state();
  check(s.hash === HASH && s.display === "block", "navigate tap opens the popup");
  check(s.kids.join() === "jam-light,jam-light,jam-choice" && s.kidHass, `popup children rendered with hass (${s.kids})`);
  check(s.focus && s.overflow === "hidden", "focus moves into the sheet, body scroll locked");
  const vis = await pop.evaluate(e => {
    const f = e.shadowRoot.querySelector(".face").getBoundingClientRect(), v = e.shadowRoot.querySelector(".veil").getBoundingClientRect();
    const l = e.shadowRoot.querySelector("jam-light"), t = l.shadowRoot.querySelector("h3");
    return {sheetW: f.width, veilW: v.width, veilH: v.height, title: t && t.textContent};
  });
  check(vis.veilW === 1280 && vis.veilH === 900 && vis.sheetW <= 560 && vis.title === "Table Lamp", `veil covers the viewport, sheet <= 560 px (${vis.sheetW})`);
  // Children receive hass updates.
  await setState("light.living_room_floor_lamp", "on", {brightness: 200, color_mode: "color_temp", color_temp_kelvin: 4000, rgb_color: [255, 210, 170]});
  const kidKey = await pop.evaluate(e => e.shadowRoot.querySelectorAll("jam-light")[1].shadowRoot.querySelector("button.pw").textContent);
  check(kidKey === "On", "popup children receive hass updates");
  await setState("light.living_room_floor_lamp", "off", {brightness: null, color_mode: null, color_temp_kelvin: null, rgb_color: null});
  await page.keyboard.press("Escape");
  await waitClosed();
  s = await state();
  check(s.display === "none" && s.hash === "" && s.overflow === "", "Esc closes the popup, clears the hash, unlocks scroll");
  // Close key.
  await page.evaluate(h => { location.hash = h; }, HASH);
  await page.waitForFunction(() => getComputedStyle(document.querySelector("jam-popup").shadowRoot.querySelector(".pop")).display === "block");
  await page.waitForTimeout(250);
  await pop.locator("button.close").click();
  await waitClosed();
  s = await state();
  check(s.display === "none" && s.hash === "", "CLOSE key closes the popup and clears the hash");
  // Veil click.
  await page.evaluate(h => { location.hash = h; }, HASH);
  await page.waitForFunction(() => getComputedStyle(document.querySelector("jam-popup").shadowRoot.querySelector(".pop")).display === "block");
  await page.mouse.click(12, 12);
  await waitClosed();
  s = await state();
  check(s.display === "none" && s.hash === "", "veil click closes the popup");
  // Browser back closes; a hash set without a new history entry (replace / deep link) is cleared in place.
  await page.evaluate(h => { location.hash = h; }, HASH);
  await page.waitForFunction(() => getComputedStyle(document.querySelector("jam-popup").shadowRoot.querySelector(".pop")).display === "block");
  await page.goBack();
  await waitClosed();
  s = await state();
  check(s.display === "none" && s.hash === "", "browser back closes the popup");
  const before = await page.evaluate(() => history.length);
  await page.evaluate(h => { history.replaceState(null, "", h); window.dispatchEvent(new CustomEvent("location-changed")); }, HASH);
  check((await state()).display === "block", "location-changed with the hash opens the popup");
  await page.waitForTimeout(250); // let the 160 ms opening wipe finish (a click on a still-clipped sheet hits the veil)
  await pop.locator("button.close").click();
  s = await state();
  check(s.display === "none" && s.hash === "" && (await page.evaluate(() => history.length)) === before && page.url().includes("preview/index.html"),
    "close after a replace navigation clears the hash in place (no history.back)");

  // ---- accent (Poster): ON pill, brightness fill, active temp chip in the card accent; popup hands its accent to children ----
  const acc = await page.evaluate(() => {
    const e = document.createElement("jam-light");
    e.setConfig({type: "custom:jam-light", entity: "light.kajplats_e26_cws_globe_1100lm", accent: "music"});
    e.hass = window.__hass; document.body.append(e);
    const r = e.shadowRoot, col = v => { const p = document.createElement("span"); p.style.color = v; r.append(p); const c = getComputedStyle(p).color; p.remove(); return c; };
    const bg = sel => getComputedStyle(r.querySelector(sel)).backgroundColor;
    const out = {violet: col("var(--violet)"), onfg: col("var(--on-fg)"), key: bg("button.pw > .face"), keyFg: getComputedStyle(r.querySelector("button.pw > .face")).color,
      fill: bg(".fill"), chip: bg('.chips button[aria-pressed="true"] > .face'), offChip: bg('.chips button[aria-pressed="false"] > .face'), slab2: col("var(--slab2)"),
      fillClip: getComputedStyle(r.querySelector(".fill")).clipPath, teal: col("var(--teal)")};
    e.remove();
    return out;
  });
  // A pop-up with accent kitchen: its body hands --jam-accent (teal) to a child without its own accent.
  const popAcc = await page.evaluate(async () => {
    const e = document.createElement("jam-popup");
    e.setConfig({type: "custom:jam-popup", hash: "#jam-accent-test", accent: "kitchen", cards: [{type: "custom:jam-light", entity: "light.kajplats_e26_cws_globe_1100lm"}]});
    document.body.append(e); e.hass = window.__hass;
    await new Promise(r => setTimeout(r, 50));
    const kid = e.shadowRoot.querySelector(".body > jam-light");
    const out = kid ? {key: getComputedStyle(kid.shadowRoot.querySelector("button.pw > .face")).backgroundColor,
      rule: getComputedStyle(e.shadowRoot.querySelector(".rule")).backgroundColor} : {};
    e.remove();
    return out;
  });
  check(acc.key === acc.violet && acc.keyFg === acc.onfg && acc.fill === acc.violet && acc.chip === acc.violet && acc.offChip === acc.slab2,
    `jam-light accent music: ON pill ${acc.key}, fill ${acc.fill}, active chip ${acc.chip} in violet, idle chip slab2, ink text`);
  check(/^polygon\(/.test(acc.fillClip) && acc.fillClip.split(",").length === 4 && acc.fillClip.includes("8px"), `brightness fill has a straight 8px diagonal end (${acc.fillClip})`);
  check(popAcc.key === acc.teal && popAcc.rule === acc.teal, `jam-popup accent kitchen: teal header rule, child without accent follows it (ON key ${popAcc.key})`);

  // ---- popup screenshots (390 px, both modes) ----
  const browser = page.context().browser(), url = new URL(page.url());
  for (const mode of ["dark", "light"]) {
    const p2 = await browser.newPage({viewport: {width: 390, height: 844}});
    url.search = "?mode=" + mode; url.hash = "";
    await p2.goto(url.toString());
    await p2.waitForFunction(() => window.__ready);
    await p2.waitForTimeout(1200); // web fonts
    await p2.evaluate(h => { location.hash = h; }, HASH);
    await p2.waitForTimeout(400);
    const ok = await p2.evaluate(() => {
      const e = document.querySelector("jam-popup"), f = e.shadowRoot.querySelector(".face").getBoundingClientRect();
      return getComputedStyle(e.shadowRoot.querySelector(".pop")).display === "block" && Math.round(f.width) === 390 && Math.round(f.bottom) === 844;
    });
    check(ok, `${mode}/390: popup is a full-width bottom sheet`);
    await p2.screenshot({path: path.join(__dirname, "..", "shots", `popup-${mode}-390.png`)});
    await p2.close();
  }
};
