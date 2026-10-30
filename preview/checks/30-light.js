// jam-light (round 3) + light pop-up (openSheet, Edit mode) + jam-popup interactions (fixture preview/fixtures/30-light.js).
// Also writes preview/shots/popup-{dark,light}-390.png, light-sheet-{group,wled,edit}-{dark,light}-390.png and
// light-cards-{dark,light}-390.png.
// Contract: module.exports = async (page, check, helpers) => {}; runs on the dark/1280 preview page, files in name order.
const path = require("path");
const HASH = "#livingroom-popup";

module.exports = async (page, check, {callsNow}) => {
  const light = name => page.locator(".sec > jam-light").filter({hasText: name});
  const newCalls = async n => (await callsNow()).slice(n);
  const mark = async () => (await callsNow()).length;
  const setState = (id, state, attrs) => page.evaluate(([id, state, attrs]) => {
    const h = window.__hass;
    if (state === null) delete h.states[id];
    else { const o = h.states[id]; h.states[id] = {...o, state, attributes: {...o.attributes, ...attrs}, last_updated: String(Math.random())}; }
    const nh = {...h};
    document.querySelectorAll(".sec > jam-light, jam-popup").forEach(c => c.hass = nh);
  }, [id, state, attrs]);
  const sheet = page.locator(".jam-sheet-host");
  const sheetOpen = () => page.evaluate(() => document.querySelectorAll(".jam-sheet-host").length);
  const closeSheet = async () => { if (await sheetOpen()) { await page.keyboard.press("Escape"); await page.waitForTimeout(50); } };
  const corner = name => light(name).locator("button.pw");
  const openTap = async name => { await light(name).locator(".tap").click(); await page.waitForTimeout(60); };
  // Lights with a configured tap_action open their pop-up by hold.
  const openHold = async name => {
    const b = await tapBox(name);
    await page.mouse.move(b.x + b.width / 2, b.y + b.height / 2); await page.mouse.down();
    await page.waitForTimeout(650); await page.mouse.up(); await page.waitForTimeout(60);
  };
  const tapBox = async name => { await light(name).scrollIntoViewIfNeeded(); return light(name).locator(".tap").boundingBox(); };

  // ---- card colour: real output colour, ink/paper text by luminance; off/unavailable ----
  const look = await page.evaluate(() => {
    const out = {}, J = window.JamCards;
    for (const c of document.querySelectorAll(".sec > jam-light")) {
      const r = c.shadowRoot, f = r.querySelector(".lc > .face"), cs = getComputedStyle(f);
      out[c._config.entity] = {bg: cs.backgroundColor, fg: cs.color, pct: r.querySelector(".pct").textContent,
        sub: (r.querySelector(".sub") || {}).textContent || "", cls: r.querySelector(".lc").className,
        strip: getComputedStyle(r.querySelector(".bs")).display, h: r.querySelector(".lc").getBoundingClientRect().height,
        moreDisabled: r.querySelector("button.pw").disabled, plate: r.querySelector(".lc").classList.contains("plate")};
    }
    const r = document.querySelector(".sec > jam-light").shadowRoot;
    const col = v => { const p = document.createElement("span"); p.style.color = v; r.append(p); const c = getComputedStyle(p).color; p.remove(); return c; };
    out.tok = {slab: col("var(--slab)"), fg: col("var(--fg)"), ochre: col("var(--ochre)"), onfg: col("var(--on-fg)"), red: col("var(--red)")};
    out.k2000 = "rgb(" + J.kelvinToRgb(2000).join(", ") + ")";
    out.k2200 = J.kelvinToRgb(2200);
    return out;
  });
  const g = look["light.living_room"], k = look["light.kitchen_lamp"], w = look["light.wled"], t = look["light.tree"], ga = look["light.garage"], ha = look["light.hall"];
  check(g.bg === "rgb(255, 159, 70)" && g.fg === "rgb(20, 18, 16)" && g.pct === "75%" && g.strip === "block",
    `group card face = average of its ON members (only Table Lamp [255,159,70]), ink text, 75 %, strip shown (${g.bg} / ${g.fg} / ${g.pct})`);
  check(w.bg === "rgb(140, 60, 255)" && w.fg === "rgb(236, 226, 201)" && w.plate,
    `WLED violet: paper text, and on ink label plates (neither ink nor paper reaches 4.5:1) (${w.bg} / ${w.fg})`);
  const nt = look["light.night"], bd = look["light.bedside"];
  check(nt.fg === "rgb(236, 226, 201)" && !nt.plate && bd.fg === "rgb(20, 18, 16)" && !bd.plate && !g.plate,
    `single colours: deep blue takes paper text, pink takes ink text, no plates (${nt.fg} / ${bd.fg})`);
  check(k.bg === look.k2000 && k.fg === "rgb(20, 18, 16)", `color_temp light fills with its kelvin colour (2000 K -> ${k.bg})`);
  check(Math.abs(look.k2200[1] - 147) <= 3 && look.k2200[0] === 255 && Math.abs(look.k2200[2] - 44) <= 8, `kelvinToRgb(2200) ≈ [255,147,44] (${look.k2200})`);
  check(t.bg === look.tok.slab && t.fg === look.tok.fg && t.pct === "Off" && t.strip === "none" && /\boff\b/.test(t.cls),
    `off light: slab face, fg text, OFF, no strip (${t.bg}, ${t.pct})`);
  check(ga.bg === look.tok.ochre && ga.fg === look.tok.onfg, `light without colour falls back to the accent (living -> ochre ${ga.bg})`);
  check(ha.pct === "N/A" && ha.moreDisabled && /\bdead\b/.test(ha.cls), "unavailable light: N/A, power corner disabled");
  check(g.sub === "1 of 2 on" && w.sub === "WLED" && k.sub === "", `sub lines: "${g.sub}", "${w.sub}"`);
  check(Math.abs(look["light.porch"].h - 96) <= 1, `light card is 96 px tall (${look["light.porch"].h})`);
  // WLED reports brightness-scaled rgb_color: [51,20,0] paints its full-value hue [255,100,0] (ink text on it), also in the pop-up.
  const fr = await page.evaluate(() => JSON.stringify([window.JamCards.fullRgb([51, 20, 0]), window.JamCards.fullRgb([0, 0, 0]), window.JamCards.fullRgb(null)]));
  check(fr === "[[255,100,0],null,null]", `fullRgb scales the max channel to 255, black/missing -> null (${fr})`);
  const wledRgb = (await page.evaluate(() => window.__hass.states["light.wled"].attributes.rgb_color));
  await setState("light.wled", "on", {rgb_color: [51, 20, 0]});
  const sc = await light("TV light").evaluate(e => { const cs = getComputedStyle(e.shadowRoot.querySelector(".lc > .face")); return [cs.backgroundColor, cs.color]; });
  check(sc[0] === "rgb(255, 100, 0)" && sc[1] === "rgb(20, 18, 16)", `scaled WLED rgb [51,20,0] -> card fill ${sc[0]}, ink text by the scaled colour (${sc[1]})`);
  await openTap("TV light");
  await page.waitForTimeout(20);
  const sl = await page.evaluate(() => { const p = document.querySelector(".jam-sheet-host").shadowRoot.querySelector(".pop"); return [p.style.getPropertyValue("--lc"), p.style.getPropertyValue("--lc-fg")]; });
  check(sl[0] === "rgb(255,100,0)" && sl[1] === "#141210", `light pop-up bar colour uses the scaled colour (${sl.join(" / ")})`);
  await closeSheet();
  await setState("light.wled", "on", {rgb_color: wledRgb});
  const geo = await light("Porch").evaluate(e => {
    const r = e.shadowRoot, m = r.querySelector("button.pw").getBoundingClientRect(), f = r.querySelector(".lc").getBoundingClientRect();
    const s = r.querySelector(".bs").getBoundingClientRect(), tri = getComputedStyle(r.querySelector(".pw .tri"));
    return {w: m.width, h: m.height, right: f.right - m.right, top: m.top - f.top, strip: s.height, stripBottom: f.bottom - s.bottom,
      triBg: tri.backgroundColor, clip: tri.clipPath, fill: getComputedStyle(r.querySelector(".bs i")).clipPath, touch: getComputedStyle(r.querySelector(".tap")).touchAction,
      grid: JSON.stringify(e.getGridOptions())};
  });
  check(geo.w === 46 && geo.h === 46 && geo.right === 0 && geo.top === 0 && geo.clip.startsWith("polygon("),
    `46x46 power corner triangle top-right (${geo.w}x${geo.h}, ${geo.triBg})`);
  // Shades (ROUND3): corner = mid shade of the face, strip track = deep shade, strip fill = mid shade; glyph ink/paper.
  const sh = await page.evaluate(() => {
    const J = window.JamCards, out = {};
    for (const c of document.querySelectorAll(".sec > jam-light")) {
      const r = c.shadowRoot, f = getComputedStyle(r.querySelector(".lc > .face")).backgroundColor.match(/\d+/g).map(Number);
      const css = n => getComputedStyle(r.querySelector(n)).backgroundColor;
      out[c._config.name || c._config.entity] = {face: f, corner: css(".pw .tri"), track: css(".bs"), fill: css(".bs i"),
        glyph: getComputedStyle(r.querySelector(".pw svg")).color, mid: "rgb(" + J.shade(f, 1).join(", ") + ")", deep: "rgb(" + J.shade(f, 2).join(", ") + ")",
        label: r.querySelector(".pw").getAttribute("aria-label"), pressed: r.querySelector(".pw").getAttribute("aria-pressed")};
    }
    out.tok = {slab2: (() => { const p = document.createElement("span"); p.style.color = "var(--slab2)"; const r = document.querySelector(".sec > jam-light").shadowRoot; r.append(p); const v = getComputedStyle(p).color; p.remove(); return v; })()};
    out.fn = [J.shade([246, 136, 78], 1), J.shade([246, 136, 78], 2), J.shade([0, 0, 255], 1), J.textOn([140, 60, 255]), Math.round(J.contrastRatio([20, 18, 16], [236, 226, 201]) * 10) / 10];
    return out;
  });
  const po = sh["light.porch"], ni = sh["light.night"];
  check(po.corner === po.mid && po.track === po.deep && po.fill === po.mid && po.glyph === "rgb(20, 18, 16)" && po.label === "Porch power" && po.pressed === "true",
    `single light: corner + strip fill = mid shade (${po.mid}), track = deep shade (${po.deep}), ink glyph, aria "Porch power"`);
  check(ni.corner === ni.mid && JSON.parse("[" + ni.mid.slice(4, -1) + "]")[2] > 0 && sh.fn[2][0] > 0,
    `dark face (deep blue): the shades are lighter (${ni.mid})`);
  check(sh.fn[0][0] < 246 && sh.fn[1][0] < sh.fn[0][0] && sh.fn[3].plate === true && sh.fn[4] > 12,
    `shade() darkens light faces (mockup #f6884e -> mid ${sh.fn[0]}, deep ${sh.fn[1]}), textOn flags the plate (${JSON.stringify(sh.fn[3])})`);
  check(sh["light.tree"].corner === sh.tok.slab2 && sh["light.tree"].pressed === "false", `off light: corner in slab2 (${sh["light.tree"].corner})`);
  // Group member bands (ROUND3 + user decision 2026-10-30: "full" = V2 is the default; "corner" = V1).
  const bands = await page.evaluate(() => {
    const out = {};
    for (const c of document.querySelectorAll(".sec > jam-light")) {
      if (c._config.entity !== "light.stove_lights") continue;
      const r = c.shadowRoot, f = r.querySelector(".lc").getBoundingClientRect(), b = r.querySelector(".bands"), br = b.getBoundingClientRect();
      out[c._config.member_bands || "full"] = {n: b.children.length, cls: b.className, top: Math.round(br.top - f.top), right: Math.round(f.right - br.right),
        bottom: Math.round(f.bottom - br.bottom), w: Math.round(br.width), cols: [...b.children].map(i => getComputedStyle(i).backgroundColor),
        face: getComputedStyle(r.querySelector(".lc > .face")).backgroundColor, corner: getComputedStyle(r.querySelector(".pw .tri")).backgroundColor,
        glyph: getComputedStyle(r.querySelector(".pw svg")).color, sub: r.querySelector(".sub").textContent,
        nmRight: Math.round(f.right - r.querySelector(".nm").getBoundingClientRect().right)};
    }
    return out;
  });
  const V2 = bands.full, V1 = bands.corner;
  check(V2 && V2.n === 3 && V2.top === 0 && V2.right === 0 && V2.bottom === 10 && V2.w === 48 && V2.cols[0] === "rgb(255, 106, 61)" &&
    V2.cols[1] === "rgb(255, 179, 71)" && V2.cols[2] === sh.tok.slab2 && V2.corner === "rgb(20, 18, 16)" && V2.glyph === "rgb(236, 226, 201)",
    `V2 (default "full"): 3 vertical bands full height of the right edge, 16px each, off bulb slab2, ink corner with a cream glyph (${V2 && V2.cols.join(" | ")})`);
  check(V2 && V2.face === "rgb(255, 143, 66)" && V2.sub === "2 of 3 on" && V2.nmRight >= 48,
    `group face = average of the ON members (${V2 && V2.face}), sub "${V2 && V2.sub}", name clear of the bands`);
  check(V1 && V1.n === 3 && V1.top === 46 && V1.w === 46 && V1.right === 0 && V1.corner === sh["Stove V1"].mid,
    `V1 ("corner"): 46px band block under the power corner, corner in the face's mid shade (${V1 && V1.corner})`);
  check(geo.strip === 10 && geo.stripBottom === 0 && geo.fill.includes("9px") && geo.touch === "pan-y",
    `10 px bottom strip with a 9 px diagonal end; touch-action ${geo.touch}`);
  check(geo.grid.includes('"columns":6') && geo.grid.includes('"rows":"auto"') && geo.grid.includes('"min_columns":4'), `getGridOptions ${geo.grid}`);
  const ty = await light("Living room").evaluate(e => { const r = e.shadowRoot, f = n => parseFloat(getComputedStyle(r.querySelector(n)).fontSize); return {pct: f(".pct"), nm: f(".nm"), sub: f(".sub")}; });
  check(ty.pct === 26 && ty.nm === 24 && ty.sub === 10, `light type: name 24px, sub 10px, brightness 26px (${ty.nm} / ${ty.sub} / ${ty.pct})`);

  // ---- tap = pop-up (round 3), corner = power, tap_action still honoured ----
  let n = await mark();
  await light("Tree").locator(".tap").click();
  let c = await newCalls(n);
  check(c.length === 0 && (await sheetOpen()) === 1, `tap opens the pop-up, no service call (${JSON.stringify(c)})`);
  await closeSheet();
  n = await mark();
  await corner("Tree").click();
  await corner("Living room").click();
  c = await newCalls(n);
  check(c.length === 2 && c[0].domain === "light" && c[0].service === "turn_on" && c[0].data.entity_id === "light.tree" &&
    c[1].service === "turn_off" && c[1].data.entity_id === "light.living_room" && !(await sheetOpen()),
    `power corner: off light -> light.turn_on, on light -> light.turn_off, no pop-up (${JSON.stringify(c.map(x => x.service + " " + x.data.entity_id))})`);
  n = await mark();
  await light("Kitchen lamp").locator(".tap").click();
  c = await newCalls(n);
  check(c.length === 1 && c[0].domain === "light" && c[0].service === "toggle" && c[0].data.brightness_pct === 80 && c[0].data.color_temp_kelvin === 2700,
    "tap honours a configured tap_action (light.toggle with data)");
  n = await mark();
  await light("Hall").locator(".tap").click({force: true});
  await corner("Hall").click({force: true});
  check((await newCalls(n)).length === 0 && !(await sheetOpen()), "unavailable light ignores taps and its power corner");

  // ---- horizontal drag = dim (live preview, one call on release, no toggle); a hass update mid-drag is deferred ----
  let b = await tapBox("Living room");
  n = await mark();
  await page.mouse.move(b.x + b.width * 0.2, b.y + b.height / 2);
  await page.mouse.down();
  await page.mouse.move(b.x + b.width * 0.4, b.y + b.height / 2, {steps: 3});
  await setState("light.garage", "on", {brightness: 129});
  await page.mouse.move(b.x + b.width * 0.6, b.y + b.height / 2 + 4, {steps: 3});
  const mid = await light("Living room").evaluate(e => e.shadowRoot.querySelector(".pct").textContent);
  await page.mouse.up();
  c = await newCalls(n);
  check(/^(59|60|61)%$/.test(mid), `drag previews the brightness live (${mid})`);
  check(c.length === 1 && c[0].service === "turn_on" && c[0].data.entity_id === "light.living_room" && Math.abs(c[0].data.brightness_pct - 60) <= 1,
    `drag -> one light.turn_on brightness_pct ≈ 60, no toggle (${JSON.stringify(c.map(x => x.service + " " + JSON.stringify(x.data)))})`);
  check(!(await sheetOpen()), "drag does not open the pop-up");
  b = await tapBox("Tree");
  n = await mark();
  await page.mouse.move(b.x + b.width * 0.1, b.y + b.height / 2);
  await page.mouse.down();
  await page.mouse.move(b.x + b.width * 0.5, b.y + b.height / 2, {steps: 4});
  await page.mouse.up();
  c = await newCalls(n);
  check(c.length === 1 && c[0].service === "turn_on" && c[0].data.entity_id === "light.tree" && Math.abs(c[0].data.brightness_pct - 50) <= 2,
    "dragging an off light turns it on at the dragged brightness");
  // Vertical movement is a scroll, not a tap or a dim.
  b = await tapBox("Living room");
  n = await mark();
  await page.mouse.move(b.x + b.width / 2, b.y + 20);
  await page.mouse.down();
  await page.mouse.move(b.x + b.width / 2 + 2, b.y + 70, {steps: 4});
  await page.mouse.up();
  check((await newCalls(n)).length === 0, "vertical movement neither toggles nor dims");

  // ---- hold 500 ms = pop-up (no toggle); corner = pop-up ----
  b = await tapBox("Living room");
  n = await mark();
  await page.mouse.move(b.x + b.width / 2, b.y + b.height / 2);
  await page.mouse.down();
  await page.waitForTimeout(650);
  const heldOpen = await sheetOpen();
  await page.mouse.up();
  await page.waitForTimeout(50);
  check(heldOpen === 1 && (await newCalls(n)).length === 0, `hold opens the pop-up without toggling (${heldOpen} sheet)`);
  const hs = await sheet.evaluate(e => {
    const r = e.shadowRoot, f = r.querySelector(".face");
    return {kicker: r.querySelector(".t .label").textContent, title: r.querySelector(".t h2").textContent, role: f.getAttribute("role"),
      focus: document.activeElement === e && r.activeElement === f, overflow: document.body.style.overflow, cut: r.querySelector(".sheet").dataset.cut,
      flash: getComputedStyle(r.querySelector(".spiral")).color, state: history.state && history.state.jamSheet};
  });
  check(hs.kicker === "Living room · Group · 2 bulbs" && hs.title === "Living room" && hs.role === "dialog" && hs.cut === "sheet",
    `pop-up header: kicker "${hs.kicker}", title "${hs.title}", sheet cut`);
  check(hs.focus && hs.overflow === "hidden" && !!hs.state, "focus moves into the sheet, scroll locked, history entry pushed");
  check(hs.flash === "rgb(255, 159, 71)", `spiral flash in the light's colour (${hs.flash})`);
  await page.keyboard.press("Escape");
  const esc = await page.evaluate(() => ({n: document.querySelectorAll(".jam-sheet-host").length, overflow: document.body.style.overflow}));
  await page.waitForTimeout(100);
  const st2 = await page.evaluate(() => history.state && history.state.jamSheet);
  check(esc.n === 0 && esc.overflow === "" && !st2, "Esc closes the pop-up, unlocks scroll and steps back out of its history entry");
  await openTap("Living room");
  check((await sheetOpen()) === 1, "tap opens the pop-up");
  await page.goBack();
  await page.waitForTimeout(100);
  check((await sheetOpen()) === 0 && page.url().includes("preview/index.html") && !page.url().includes("#"), "browser back closes the pop-up (URL unchanged)");

  // ---- keyboard on the card ----
  await light("Living room").locator(".tap").focus();
  n = await mark();
  await page.keyboard.press("ArrowRight");
  await page.keyboard.press("p");
  await page.keyboard.press("Shift+Enter");
  c = await newCalls(n);
  check(c.length === 3 && c[0].service === "turn_on" && c[0].data.brightness_pct === 85 && c[1].service === "turn_off" && c[2].service === "turn_off" &&
    !(await sheetOpen()), `keyboard: → = +10 % (75 -> ${c[0] && c[0].data.brightness_pct}), P and Shift+Enter = power`);
  await light("Living room").locator(".tap").focus();
  n = await mark();
  await page.keyboard.press("Enter");
  check((await sheetOpen()) === 1 && (await newCalls(n)).length === 0, "Enter opens the pop-up without a service call");

  // ---- group pop-up: brightness bar, whites, hue strip, your colours, members, timer ----
  const ws = await page.evaluate(() => window.__ws.map(m => m.type));
  const keys = await page.evaluate(() => window.__ws.filter(m => m.type === "frontend/get_user_data").map(m => m.key).sort().join());
  check(ws.filter(x => x === "frontend/get_user_data").length === 2 && keys === "jam_colors,jam_whites", `saved colours + whites loaded once via frontend/get_user_data (${keys})`);
  await page.waitForTimeout(500); // the sheet's children stagger in (0.3.5 motion, <= ~400 ms); measure once they have landed
  const bar = sheet.locator(".bwrap"), bb = await bar.boundingBox();
  check(Math.round(bb.height) === 72, `brightness bar is 72 px (${bb.height})`);
  n = await mark();
  await page.mouse.move(bb.x + bb.width * 0.2, bb.y + 36);
  await page.mouse.down();
  await page.mouse.move(bb.x + bb.width * 0.4, bb.y + 36, {steps: 3});
  await page.mouse.up();
  c = await newCalls(n);
  check(c.length === 1 && c[0].service === "turn_on" && c[0].data.entity_id === "light.living_room" && Math.abs(c[0].data.brightness_pct - 40) <= 1,
    `pop-up brightness drag -> brightness_pct 40 (${JSON.stringify(c.map(x => x.data))})`);
  await setState("light.living_room", "on", {brightness: 102});
  const shown = await sheet.evaluate(e => e.shadowRoot.querySelector(".bigbar b").textContent);
  check(shown === "40%", `the open pop-up follows hass updates (${shown})`);
  n = await mark();
  await bar.focus();
  await page.keyboard.press("ArrowLeft");
  c = await newCalls(n);
  const refocus = await sheet.evaluate(e => e.shadowRoot.activeElement && e.shadowRoot.activeElement.dataset.k);
  check(c.length === 1 && c[0].data.brightness_pct === 35, `pop-up brightness ← = -5 % (${c.map(x => x.data.brightness_pct)})`);
  await setState("light.living_room", "on", {brightness: 89});
  const refocus2 = await sheet.evaluate(e => e.shadowRoot.activeElement && e.shadowRoot.activeElement.dataset.k);
  check(refocus === "bright" && refocus2 === "bright", "keyboard focus survives a pop-up refresh");
  const wt = await sheet.locator(".wt").allTextContents();
  check(wt.length === 2 && wt[0] === "Cozy2200 K" && wt[1] === "Clean4000 K", `default whites Cozy 2200 / Clean 4000 (${wt})`);
  n = await mark();
  const hb = await sheet.locator(".hwrap").boundingBox();
  await page.mouse.click(hb.x + hb.width * (8.5 / 12), hb.y + hb.height / 2);
  c = await newCalls(n);
  check(c.length === 1 && c[0].service === "turn_on" && JSON.stringify(c[0].data.hs_color) === "[240,90]",
    `hue strip band 9 -> hs_color [240, 90] (${JSON.stringify(c.map(x => x.data))})`);
  check(await sheet.locator(".hb span").count() === 12, "hue strip has 12 flat bands");
  const sw0 = await sheet.locator(".sw:not(.add)").count();
  n = await mark();
  await sheet.locator(".sw:not(.add)").nth(1).click();
  c = await newCalls(n);
  check(sw0 === 4 && c.length === 1 && JSON.stringify(c[0].data.rgb_color) === "[90,160,255]", `saved swatch -> rgb_color (${sw0} swatches)`);
  await sheet.locator(".sw.add").click();
  const saved = await page.evaluate(() => ({last: window.__ws[window.__ws.length - 1], n: document.querySelector(".jam-sheet-host").shadowRoot.querySelectorAll(".sw:not(.add)").length}));
  check(saved.last.type === "frontend/set_user_data" && saved.last.key === "jam_colors" && saved.last.value.length === 5 &&
    JSON.stringify(saved.last.value[4]) === "[255,159,71]" && saved.n === 5, `+ saves the current colour via frontend/set_user_data (${JSON.stringify(saved.last)})`);
  const mem = await sheet.locator(".mrow").allTextContents();
  check(mem.length === 2 && mem[0].startsWith("Table Lamp") && mem[0].endsWith("75%") && mem[1].endsWith("Off"), `group members: ${mem.join(" | ")}`);
  const pill = await sheet.evaluate(e => getComputedStyle(e.shadowRoot.querySelector(".mrow .chip")).backgroundColor);
  check(pill === "rgb(255, 159, 70)", `member % pill in that light's colour (${pill})`);
  n = await mark();
  await sheet.locator(".mrow").nth(1).click();
  const mt = sheet.locator(".mtrack").first(), mb = await mt.boundingBox();
  await page.mouse.move(mb.x + mb.width * 0.3, mb.y + mb.height / 2);
  await page.mouse.down();
  await page.mouse.move(mb.x + mb.width * 0.5, mb.y + mb.height / 2, {steps: 3});
  await page.mouse.up();
  c = await newCalls(n);
  check(c.length === 2 && c[0].service === "toggle" && c[0].data.entity_id === "light.living_room_floor_lamp" &&
    c[1].service === "turn_on" && c[1].data.entity_id === "light.kajplats_e26_cws_globe_1100lm" && Math.abs(c[1].data.brightness_pct - 50) <= 1,
    `member row toggles that member; its bar dims it (${JSON.stringify(c.map(x => [x.service, x.data]))})`);
  n = await mark();
  await sheet.locator(".timer button", {hasText: "30 min"}).click();
  c = await newCalls(n);
  check(c.length === 1 && c[0].domain === "script" && c[0].service === "turn_on" && c[0].data.entity_id === "script.jam_light_off_in" &&
    JSON.stringify(c[0].data.variables) === JSON.stringify({entity_id: "light.living_room", minutes: 30}),
    `timer chip -> script.turn_on with variables (${JSON.stringify(c.map(x => x.data))})`);
  // ---- Edit mode (round 3): rename + kelvin of the whites (jam_whites), × removes saved colours (jam_colors), Done ----
  const ed = sheet.locator("button.edit");
  check(await ed.count() === 1 && (await ed.textContent()) === "Edit", "pop-up header has an Edit key");
  await ed.click();
  const em = await sheet.evaluate(e => { const r = e.shadowRoot; return {lbl: r.querySelector("button.edit").textContent, pressed: r.querySelector("button.edit").getAttribute("aria-pressed"),
    pencils: r.querySelectorAll(".wt .gl.pencil").length, xs: r.querySelectorAll(".sw.rm .gl.x").length, add: r.querySelectorAll(".sw.add").length,
    rm: [...r.querySelectorAll(".sw.rm")].map(b => b.getAttribute("aria-label"))}; });
  check(em.lbl === "Done" && em.pressed === "true" && em.pencils === 2 && em.xs === 5 && em.add === 0 && em.rm[0] === "Remove saved colour 1",
    `Edit mode: Done key, a pencil on each white, an × on each saved colour, + hidden (${JSON.stringify(em)})`);
  n = await mark();
  await sheet.locator(".wt").first().click();
  check(await sheet.locator(".wedit").count() === 1 && (await newCalls(n)).length === 0, "pencil opens the white editor (no light call)");
  const nin = sheet.locator(".nin");
  await nin.fill("Reading");
  await nin.press("Enter");
  let last = await page.evaluate(() => window.__ws[window.__ws.length - 1]);
  check(last.type === "frontend/set_user_data" && last.key === "jam_whites" && JSON.stringify(last.value["light.living_room"]) ===
    JSON.stringify([{name: "Reading", kelvin: 2200}, {name: "Clean", kelvin: 4000}]), `rename saves jam_whites per entity (${JSON.stringify(last.value)})`);
  await setState("light.living_room", "on", {brightness: 120}); // a refresh mid-edit keeps the editor and the focus
  await sheet.locator(".kwrap").focus();
  await page.keyboard.press("ArrowRight");
  last = await page.evaluate(() => window.__ws[window.__ws.length - 1]);
  const kv = await sheet.evaluate(e => { const r = e.shadowRoot, k = r.querySelector(".kwrap"); return {min: k.getAttribute("aria-valuemin"), max: k.getAttribute("aria-valuemax"), now: k.getAttribute("aria-valuenow"),
    tile: r.querySelector(".wt").textContent}; });
  check(last.key === "jam_whites" && last.value["light.living_room"][0].kelvin === 2300 && kv.min === "1801" && kv.max === "6535" && kv.tile === "Reading2300 K",
    `kelvin slider within the light's range (${kv.min}-${kv.max}): → saves 2300 K; the white previews it (${kv.tile})`);
  await sheet.locator(".sw.rm").first().click();
  last = await page.evaluate(() => window.__ws[window.__ws.length - 1]);
  check(last.key === "jam_colors" && last.value.length === 4 && JSON.stringify(last.value[0]) === "[90,160,255]" && await sheet.locator(".sw.rm").count() === 4,
    `× removes a saved colour from jam_colors (${JSON.stringify(last.value)})`);
  await ed.click();
  const done = await sheet.evaluate(e => { const r = e.shadowRoot; return {lbl: r.querySelector("button.edit").textContent, pencils: r.querySelectorAll(".gl").length,
    add: r.querySelectorAll(".sw.add").length, edit: r.querySelectorAll(".wedit").length, wt: r.querySelector(".wt").textContent}; });
  check(done.lbl === "Edit" && done.pencils === 0 && done.add === 1 && done.edit === 0 && done.wt === "Reading2300 K", `Done leaves Edit mode; the saved white shows (${JSON.stringify(done)})`);
  n = await mark();
  await sheet.locator(".wt").first().click();
  c = await newCalls(n);
  check(c.length === 1 && c[0].data.color_temp_kelvin === 2300, "an edited white turns the light to its saved kelvin");
  await sheet.locator("button.close").click();
  check((await sheetOpen()) === 0, "CLOSE key closes the pop-up");
  await setState("light.living_room", "on", {brightness: 191});

  // ---- timer row hidden without the script ----
  const keep = await page.evaluate(() => window.__hass.states["script.jam_light_off_in"]);
  await setState("script.jam_light_off_in", null);
  await openTap("Living room");
  const noTimer = await sheet.locator(".timer").count();
  await closeSheet();
  await page.evaluate(s => { window.__hass.states[s.entity_id] = s; }, keep);
  await setState("light.tree", "off", {});
  check(noTimer === 0, "off-timer row hidden when the timer script does not exist");

  // ---- whites clamp to the light's range ----
  await openHold("Kitchen lamp");
  const kw = await sheet.locator(".wt").allTextContents();
  n = await mark();
  await sheet.locator(".wt", {hasText: "Daylight"}).click();
  c = await newCalls(n);
  check(kw.join("|") === "Cozy2200 K|Daylight5000 K" && c.length === 1 && c[0].data.color_temp_kelvin === 5000 && c[0].data.entity_id === "light.kitchen_lamp",
    `configured whites clamp to the light's max 5000 K (${kw.join(" / ")})`);
  check(await sheet.locator(".hwrap").count() === 0 && await sheet.locator(".mem").count() === 0,
    "colour_temp-only single light: no hue strip, no members");
  n = await mark();
  await sheet.locator(".chips button", {hasText: "Reading"}).click();
  c = await newCalls(n);
  check(c.length === 1 && c[0].data.color_temp_kelvin === 4000 && c[0].data.brightness_pct === 100, "legacy presets still work as pop-up chips");
  await closeSheet();

  // ---- WLED: preset cards instead of whites ----
  await openTap("TV light");
  const wp = await sheet.evaluate(e => [...e.shadowRoot.querySelectorAll(".wp")].map(b => [b.textContent, b.getAttribute("aria-pressed"), b.querySelectorAll("polygon").length]));
  const cols = await sheet.evaluate(e => getComputedStyle(e.shadowRoot.querySelector(".wp").parentElement).gridTemplateColumns.split(" ").length);
  check(wp.length === 8 && wp.find(x => x[0] === "Vibes")[1] === "true" && wp.filter(x => x[1] === "true").length === 1 && wp.every(x => x[2] >= 16) && cols === 2,
    `WLED: 8 preview cards in 2 columns, current option outlined (${wp.map(x => x[0]).join(", ")})`);
  check(await sheet.locator(".wt").count() === 0 && await sheet.locator(".hwrap").count() === 1, "WLED: preset cards replace the whites; hue strip kept");
  n = await mark();
  await sheet.locator(".wp", {hasText: "Halloween"}).click();
  c = await newCalls(n);
  check(c.length === 1 && c[0].domain === "select" && c[0].service === "select_option" && c[0].data.entity_id === "select.wled_preset" && c[0].data.option === "Halloween",
    "WLED preset card -> select.select_option");
  await closeSheet();

  // ---- jam-popup (hash): children, focus, Esc/close/veil/back; a light sheet inside it closes on its own ----
  const pop = page.locator("jam-popup");
  const state = () => pop.evaluate(e => {
    const p = e.shadowRoot.querySelector(".pop"), r = e.getBoundingClientRect(), body = e.shadowRoot.querySelector(".body");
    return {display: getComputedStyle(p).display, h: r.height, hash: location.hash, kids: [...body.children].map(k => k.localName),
      kidHass: [...body.children].every(k => k.hass === e.hass), overflow: document.body.style.overflow,
      focus: document.activeElement === e && e.shadowRoot.activeElement === e.shadowRoot.querySelector(".face")};
  });
  const waitClosed = () => page.waitForFunction(h => location.hash !== h, HASH, {timeout: 2000}).catch(() => null);
  const waitOpen = () => page.waitForFunction(() => getComputedStyle(document.querySelector("jam-popup").shadowRoot.querySelector(".pop")).display === "block");
  let s = await state();
  check(s.display === "none" && s.h === 0 && s.hash === "", "popup hidden initially, zero height");
  await page.locator("jam-tile").filter({hasText: "Open living room pop-up"}).locator(".name").click();
  s = await state();
  check(s.hash === HASH && s.display === "block", "navigate tap opens the popup");
  check(s.kids.join() === "jam-light,jam-light,jam-choice" && s.kidHass, `popup children rendered with hass (${s.kids})`);
  check(s.focus && s.overflow === "hidden", "focus moves into the sheet, body scroll locked");
  const vis = await pop.evaluate(e => {
    const f = e.shadowRoot.querySelector(".face").getBoundingClientRect(), v = e.shadowRoot.querySelector(".veil").getBoundingClientRect();
    const l = e.shadowRoot.querySelector("jam-light"), t = l.shadowRoot.querySelector(".nm");
    return {sheetW: f.width, veilW: v.width, veilH: v.height, title: t && t.textContent};
  });
  check(vis.veilW === 1280 && vis.veilH === 900 && vis.sheetW <= 560 && vis.title === "Table Lamp", `veil covers the viewport, sheet <= 560 px (${vis.sheetW})`);
  await setState("light.living_room_floor_lamp", "on", {brightness: 200, color_mode: "color_temp", color_temp_kelvin: 4000, rgb_color: [255, 210, 170]});
  const kidPct = await pop.evaluate(e => e.shadowRoot.querySelectorAll("jam-light")[1].shadowRoot.querySelector(".pct").textContent);
  check(kidPct === "78%", `popup children receive hass updates (${kidPct})`);
  await setState("light.living_room_floor_lamp", "off", {brightness: null, color_mode: null, color_temp_kelvin: null, rgb_color: null});
  await page.waitForTimeout(250); // opening wipe
  await pop.locator("jam-light").first().locator(".tap").click();
  const nested = await page.evaluate(() => {
    const host = document.querySelector(".jam-sheet-host"), p = document.querySelector("jam-popup").shadowRoot.querySelector(".pop");
    return {sheet: !!host, z: host && getComputedStyle(host.shadowRoot.querySelector(".pop")).zIndex, pop: getComputedStyle(p).display};
  });
  await page.keyboard.press("Escape");
  await page.waitForTimeout(150);
  s = await state();
  check(nested.sheet && nested.pop === "block" && (await sheetOpen()) === 0 && s.display === "block" && s.hash === HASH,
    "a light pop-up opened inside a jam-popup: Esc closes only the light pop-up");
  await page.keyboard.press("Escape");
  await waitClosed();
  s = await state();
  check(s.display === "none" && s.hash === "" && s.overflow === "", "Esc closes the popup, clears the hash, unlocks scroll");
  await page.evaluate(h => { location.hash = h; }, HASH);
  await waitOpen();
  await page.waitForTimeout(250);
  await pop.locator("button.close").click();
  await waitClosed();
  s = await state();
  check(s.display === "none" && s.hash === "", "CLOSE key closes the popup and clears the hash");
  await page.evaluate(h => { location.hash = h; }, HASH);
  await waitOpen();
  await page.mouse.click(12, 12);
  await waitClosed();
  s = await state();
  check(s.display === "none" && s.hash === "", "veil click closes the popup");
  await page.evaluate(h => { location.hash = h; }, HASH);
  await waitOpen();
  await page.goBack();
  await waitClosed();
  s = await state();
  check(s.display === "none" && s.hash === "", "browser back closes the popup");
  const before = await page.evaluate(() => history.length);
  await page.evaluate(h => { history.replaceState(null, "", h); window.dispatchEvent(new CustomEvent("location-changed")); }, HASH);
  check((await state()).display === "block", "location-changed with the hash opens the popup");
  await page.waitForTimeout(250);
  await pop.locator("button.close").click();
  s = await state();
  check(s.display === "none" && s.hash === "" && (await page.evaluate(() => history.length)) === before && page.url().includes("preview/index.html"),
    "close after a replace navigation clears the hash in place (no history.back)");

  // ---- accent: a light without colour fills with its accent; a jam-popup hands its accent to children ----
  const acc = await page.evaluate(async () => {
    const mk = cfg => { const e = document.createElement("jam-light"); e.setConfig({type: "custom:jam-light", ...cfg}); e.hass = window.__hass; document.body.append(e); return e; };
    const e = mk({entity: "light.garage", accent: "music"}), r = e.shadowRoot;
    const col = v => { const p = document.createElement("span"); p.style.color = v; r.append(p); const c = getComputedStyle(p).color; p.remove(); return c; };
    const out = {violet: col("var(--violet)"), teal: col("var(--teal)"), onfg: col("var(--on-fg)"),
      face: getComputedStyle(r.querySelector(".lc > .face")).backgroundColor, fg: getComputedStyle(r.querySelector(".lc > .face")).color};
    e.remove();
    const p = document.createElement("jam-popup");
    p.setConfig({type: "custom:jam-popup", hash: "#jam-accent-test", accent: "kitchen", cards: [{type: "custom:jam-light", entity: "light.garage"}]});
    document.body.append(p); p.hass = window.__hass;
    await new Promise(res => setTimeout(res, 50));
    const kid = p.shadowRoot.querySelector(".body > jam-light");
    out.kid = kid ? getComputedStyle(kid.shadowRoot.querySelector(".lc > .face")).backgroundColor : null;
    out.rule = getComputedStyle(p.shadowRoot.querySelector(".rule")).backgroundColor;
    p.remove();
    return out;
  });
  check(acc.face === acc.violet && acc.fg === acc.onfg, `jam-light accent music fills a colourless light violet with ink text (${acc.face})`);
  check(acc.kid === acc.teal && acc.rule === acc.teal, `jam-popup accent kitchen: teal rule, child follows it (${acc.kid})`);

  // ---- screenshots at 390 px: jam-popup, light pop-up (group) and WLED pop-up, both modes ----
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
    await p2.keyboard.press("Escape");
    await p2.waitForTimeout(200);
    await p2.locator(".sec").filter({has: p2.locator("jam-light")}).first().screenshot({path: path.join(__dirname, "..", "shots", `light-cards-${mode}-390.png`)});
    for (const [shot, name] of [["group", "Living room"], ["wled", "TV light"], ["edit", "Living room"]]) {
      await p2.locator(".sec > jam-light").filter({hasText: name}).locator(".tap").click();
      await p2.waitForTimeout(400);
      if (shot === "edit") {
        const r = p2.locator(".jam-sheet-host");
        await r.locator("button.edit").click();
        await r.locator(".wt").first().click();
        await p2.waitForTimeout(100);
      }
      const fit = await p2.evaluate(() => {
        const r = document.querySelector(".jam-sheet-host").shadowRoot, f = r.querySelector(".face").getBoundingClientRect(), body = r.querySelector(".body");
        return {w: Math.round(f.width), bottom: Math.round(f.bottom), over: body.scrollWidth > body.clientWidth + 1};
      });
      check(fit.w === 390 && fit.bottom === 844 && !fit.over, `${mode}/390: light pop-up (${shot}) is a full-width bottom sheet, no sideways overflow`);
      await p2.screenshot({path: path.join(__dirname, "..", "shots", `light-sheet-${shot}-${mode}-390.png`)});
      await p2.keyboard.press("Escape");
      await p2.waitForTimeout(150);
    }
    await p2.close();
  }
};
