// Look cards (fixture preview/fixtures/99-look-cards.js, 2026-11-03): jam-dial, jam-keypad, jam-radio on the Poster
// dark/1280 page. Dial: slider semantics, light colour arc, keyboard / drag in a circle / tap on the ring / wheel dimming,
// centre tap = toggle, hold = the jam-light pop-up, name = pop-up, whites + colour swatches, off / on-off / unavailable
// lights. Keypad: active key (current_entity vs newest activation), display, stamp, scene / script / button / action calls,
// all on / all off keys, disabled missing key, accent keys >= 4.5:1 with their text. Radio: display + kicker, panel B on the
// display, round transport keys, shuffle / favourite, the volume wheel (keys, drag), offline player. Every control >= 44px,
// no continuous animation (no running animations once settled).
// Contract: module.exports = async (page, check, helpers) => {}; runs on the dark/1280 preview page, files in name order.
module.exports = async (page, check, {callsNow}) => {
  const reset = () => page.evaluate(() => { window.__calls.length = 0; });
  const calls = () => callsNow();
  const push = (tag, id, patch) => page.evaluate(([tag, id, patch]) => {
    const h = window.__hass, s = h.states[id];
    h.states[id] = {...s, ...patch, attributes: {...s.attributes, ...(patch.attributes || {})}, last_updated: "p" + Math.random()};
    const nh = {...h};
    for (const e of document.querySelectorAll(tag)) e.hass = nh;
  }, [tag, id, patch]);
  const sheetOpen = () => page.evaluate(() => document.querySelectorAll(".jam-sheet-host").length);
  const closeSheet = async () => { for (let i = 0; i < 3 && await sheetOpen(); i++) { await page.keyboard.press("Escape"); await page.waitForTimeout(80); } };
  await page.evaluate(() => { for (const e of document.querySelectorAll("#view jam-dial, #view jam-keypad, #view jam-radio")) e.dataset.e = e._config.entity || e._config.title; });
  const dial = id => page.locator(`#view jam-dial[data-e="${id}"]`);
  const kp = t => page.locator(`#view jam-keypad[data-e="${t}"]`);
  const radio = id => page.locator(`#view jam-radio[data-e="${id}"]`);

  // ---------- jam-dial ----------
  const D = "light.lc_living";
  const dInfo = id => dial(id).evaluate(e => {
    const r = e.shadowRoot, ring = r.querySelector(".dl-ring"), cap = r.querySelector(".dl-cap"), arc = r.querySelector(".dl-arc");
    const sz = n => { const b = n.getBoundingClientRect(); return [Math.round(b.width), Math.round(b.height)]; };
    return {role: ring.getAttribute("role"), now: ring.getAttribute("aria-valuenow"), text: ring.getAttribute("aria-valuetext"), label: ring.getAttribute("aria-label"),
      tab: ring.tabIndex, cap: cap.textContent, pressed: cap.getAttribute("aria-pressed"), capDis: cap.disabled, capSz: sz(cap),
      arc: getComputedStyle(arc).stroke, dash: arc.getAttribute("stroke-dasharray"), arcShown: getComputedStyle(arc).display !== "none",
      sw: [...r.querySelectorAll(".dl-s")].map(b => ({l: b.getAttribute("aria-label"), p: b.getAttribute("aria-pressed"), sz: sz(b), w: b.classList.contains("w")})),
      ticks: [...r.querySelectorAll(".dl-tk")].filter(t => getComputedStyle(t).display !== "none").length, mark: getComputedStyle(r.querySelector(".dl-mk")).display !== "none",
      pw: !!r.querySelector("button.pw"), name: (r.querySelector(".dl-name") || {}).localName, sub: (r.querySelector(".dl-sub") || {}).textContent,
      cut: r.querySelector(".paper").dataset.cut};
  });
  let d = await dInfo(D);
  check(d.role === "slider" && d.now === "75" && d.text === "75%" && d.label === "Living room brightness" && d.tab === 0 && d.cap === "75%" && d.pressed === "true",
    `jam-dial: the dial is a slider (role, aria-valuenow 75 = brightness 191, label), the cap shows 75% and is a pressed toggle (${JSON.stringify(d).slice(0, 160)})`);
  check(d.arc === "rgb(255, 160, 64)" && d.dash === "75 100" && d.arcShown, `jam-dial: arc in the light's colour (${d.arc}), 75 of 100 of the sweep (${d.dash})`);
  check(d.sub === "2 of 2 on" && d.name === "button" && d.pw && d.cut === "card", `jam-dial: group sub line "${d.sub}", the name is a button, power corner, card cut`);
  // Colours: this user's saved colours once loaded (the 30-light checks saved some), else Rose / Blue / Green; near-duplicates left out.
  const cols = d.sw.slice(2).map(s => s.l).join("|");
  check(d.sw.length >= 4 && d.sw[0].l === "Cozy, 2200 K" && d.sw[1].l === "Clean, 4000 K" && d.sw[0].w && d.sw[1].w && !d.sw[2].w &&
    (cols === "Rose|Blue|Green" || /^Your colour \d(\|Your colour \d)*$/.test(cols)) &&
    d.sw.filter(s => s.p === "true").length <= 1 && d.sw.every(s => s.sz[0] >= 44 && s.sz[1] >= 44) && d.capSz[0] >= 44 && d.ticks === 7 && d.mark,
    `jam-dial: swatches = two half-disc whites + the colour discs (saved or default), at most one pressed, 44px targets; 7 ticks + mark (${d.sw.map(s => s.l + ":" + s.p).join(", ")})`);
  // Keyboard: arrows / End on the slider.
  await reset();
  await dial(D).locator(".dl-ring").focus();
  await page.keyboard.press("ArrowRight");
  let c = await calls();
  check(c.length === 1 && c[0].domain === "light" && c[0].service === "turn_on" && c[0].data.entity_id === D && c[0].data.brightness_pct === 80,
    `jam-dial: ArrowRight = light.turn_on brightness_pct 80 (${JSON.stringify(c)})`);
  await page.keyboard.press("End"); await page.keyboard.press("PageDown");
  c = await calls();
  check(c.length === 3 && c[1].data.brightness_pct === 100 && c[2].data.brightness_pct === 90, `jam-dial: End = 100, PageDown = 90 (${c.map(x => x.data.brightness_pct)})`);
  // Drag in a circle: press on the left of the ring (value ~17), move over the top to the right (75), release = one call.
  await push("jam-dial", D, {attributes: {brightness: 191}});
  await reset();
  const box = await dial(D).locator(".dl-ring").boundingBox();
  const cx = box.x + box.width / 2, cy = box.y + box.height / 2, R = box.width * .42;
  const pt = a => [cx + R * Math.sin(a * Math.PI / 180), cy - R * Math.cos(a * Math.PI / 180)];
  await page.mouse.move(...pt(-90)); await page.mouse.down();
  for (const a of [-80, -60, -30, 0, 30, 60, 67.5]) await page.mouse.move(...pt(a), {steps: 2});
  const mid = await dInfo(D);
  c = await calls();
  check(c.length === 0 && mid.now === "75" && mid.cap === "75%", `jam-dial: a drag previews live and calls nothing yet (now ${mid.now}, ${c.length} calls)`);
  await page.mouse.up();
  c = await calls();
  check(c.length === 1 && c[0].service === "turn_on" && Math.abs(c[0].data.brightness_pct - 75) <= 1, `jam-dial: drag over the top to the right sends one turn_on ~75 (${JSON.stringify(c.map(x => x.data))})`);
  // The bottom gap clamps to the nearer end: from the right end down past 135 degrees = 100.
  await reset();
  await page.mouse.move(...pt(120)); await page.mouse.down();
  for (const a of [130, 150, 175]) await page.mouse.move(...pt(a), {steps: 2});
  await page.mouse.up();
  c = await calls();
  check(c.length === 1 && c[0].data.brightness_pct === 100, `jam-dial: dragging into the bottom gap clamps to 100 (${JSON.stringify(c.map(x => x.data))})`);
  // A tap on the ring jumps there (the top = 50).
  await reset();
  await page.mouse.click(...pt(0));
  c = await calls();
  check(c.length === 1 && c[0].data.brightness_pct === 50, `jam-dial: a tap on the ring top = 50 (${JSON.stringify(c.map(x => x.data))})`);
  // Mouse wheel: steps the preview, one call after 300 ms.
  await push("jam-dial", D, {attributes: {brightness: 191}});
  await reset();
  await page.mouse.move(...pt(-100));
  await page.mouse.wheel(0, 100); await page.mouse.wheel(0, 100);
  await page.waitForTimeout(80);
  const c0 = (await calls()).length;
  await page.waitForTimeout(400);
  c = await calls();
  check(c0 === 0 && c.length === 1 && c[0].data.brightness_pct === 65, `jam-dial: two wheel notches down = one call 65 after 300 ms (${c0} before; ${JSON.stringify(c.map(x => x.data))})`);
  // Cap: tap = toggle (turn_off while on); hold = the pop-up, no toggle.
  await reset();
  await dial(D).locator(".dl-cap").click();
  c = await calls();
  check(c.length === 1 && c[0].service === "turn_off" && c[0].data.entity_id === D, `jam-dial: a tap on the cap toggles (light.turn_off) (${JSON.stringify(c)})`);
  await reset();
  const cb = await dial(D).locator(".dl-cap").boundingBox();
  await page.mouse.move(cb.x + cb.width / 2, cb.y + cb.height / 2); await page.mouse.down(); await page.waitForTimeout(650); await page.mouse.up();
  await page.waitForTimeout(60);
  const held = await sheetOpen();
  c = await calls();
  const title = held ? await page.evaluate(() => document.querySelector(".jam-sheet-host").shadowRoot.textContent) : "";
  check(held === 1 && c.length === 0 && /Living room/.test(title), `jam-dial: hold on the cap opens the jam-light pop-up without toggling (${held} sheet, ${c.length} calls, "${title.slice(0, 40)}")`);
  await closeSheet();
  await dial(D).locator(".dl-name").click();
  check(await sheetOpen() === 1, "jam-dial: the name button opens the pop-up");
  await closeSheet();
  // Swatches: a white = color_temp_kelvin, a colour = rgb_color.
  await reset();
  await dial(D).locator(".dl-s").nth(0).click(); await dial(D).locator(".dl-s").nth(2).click();
  c = await calls();
  check(c.length === 2 && c[0].data.color_temp_kelvin === 2200 && Array.isArray(c[1].data.rgb_color) && c[1].data.rgb_color.length === 3,
    `jam-dial: Cozy = color_temp_kelvin 2200, a colour = rgb_color (${JSON.stringify(c.map(x => x.data))})`);
  // Off, color_temp only: whites only, Off on the cap, no arc; ArrowUp from off = 5 %.
  d = await dInfo("light.lc_desk");
  check(d.cap === "Off" && d.pressed === "false" && d.now === "0" && d.text === "Off" && !d.arcShown && d.sw.length === 2 && d.sub === "Study",
    `jam-dial off: Off, aria-valuenow 0 / "Off", no arc, two whites, kicker "Study" (${JSON.stringify(d).slice(0, 200)})`);
  await reset();
  await dial("light.lc_desk").locator(".dl-ring").focus(); await page.keyboard.press("ArrowUp");
  c = await calls();
  check(c.length === 1 && c[0].service === "turn_on" && c[0].data.brightness_pct === 5, `jam-dial off: ArrowUp turns it on at 5 % (${JSON.stringify(c.map(x => x.data))})`);
  d = await dInfo("light.lc_plug");
  check(d.role === null && d.tab === -1 && d.cap === "On" && d.pressed === "true" && d.sw.length === 0 && d.dash === "100 100" && d.ticks === 0 && !d.mark && d.capSz[0] >= 150,
    `jam-dial on/off light: no slider / ticks / mark, a big push button cap "On" (${d.capSz}), full ring, show_swatches: false`);
  d = await dInfo("light.lc_hall");
  check(d.role === null && d.capDis && d.cap === "Offline" && d.sw.length === 0 && d.name === "h3" && d.sub === undefined,
    `jam-dial unavailable: "Offline" on the cap only, cap disabled, no slider / swatches / pop-up button (${JSON.stringify(d).slice(0, 160)})`);

  // ---------- jam-keypad ----------
  const kInfo = t => kp(t).evaluate(e => {
    const r = e.shadowRoot, keys = [...r.querySelectorAll(".kp-key")];
    return {room: r.querySelector(".kp-room").textContent, cur: (r.querySelector(".kp-cur") || {}).textContent || "",
      fs: parseFloat(getComputedStyle(r.querySelector(".kp-cap")).fontSize),
      bar: [...r.querySelectorAll(".kp-bar .kp-act")].map(k => ({n: k.textContent, w: Math.round(k.getBoundingClientRect().width), h: Math.round(k.getBoundingClientRect().height),
        bg: getComputedStyle(k.querySelector(".kp-cap")).backgroundColor, fg: getComputedStyle(k.querySelector(".kp-cap")).color})),
      keyW: keys.length ? Math.round(keys[0].getBoundingClientRect().width) : 0,
      keys: keys.map(k => ({n: k.textContent, on: k.classList.contains("on"), p: k.getAttribute("aria-pressed"), dis: k.disabled, stamp: k.classList.contains("jam-stamp"),
        w: Math.round(k.getBoundingClientRect().width), h: Math.round(k.getBoundingClientRect().height),
        bg: getComputedStyle(k.querySelector(".kp-cap")).backgroundColor, fg: getComputedStyle(k.querySelector(".kp-cap")).color, ring: getComputedStyle(k, "::after").content})),
      body: getComputedStyle(r.querySelector(".kp-body")).backgroundColor};
  });
  let k = await kInfo("Living room");
  check(k.room === "Living room" && k.cur === "Movie time" && k.keys.length === 7 && k.keys.filter(x => x.on).map(x => x.n).join() === "Movie time" &&
    k.keys[1].p === "true" && k.keys[0].p === "false" && k.bar.map(x => x.n).join() === "All on,All off" && k.bar.every(x => x.h >= 56 && x.w > k.keyW),
    `jam-keypad: display "Living room" / "${k.cur}", 7 round keys, All on / All off in the wide bottom bar, Movie time active + aria-pressed (${k.keys.map(x => x.n + (x.on ? "*" : "")).join(", ")})`);
  const offBg = k.keys.find(x => !x.on && x.n === "Normal").bg, lit = k.keys.find(x => x.on);
  check(lit.bg !== offBg && k.fs >= 16 && k.bar[1].w >= 1.5 * k.keyW && k.bar[1].h < k.keyW,
    `jam-keypad: the active key lights up (${lit.bg} vs ${offBg}), 16px labels (${k.fs}), All off is a wide bar key, not a round scene key like Night (${k.bar[1].w}x${k.bar[1].h} vs ${k.keyW})`);
  check(k.keys.every(x => x.w >= 56 && x.h >= 56 && Math.abs(x.w - x.h) <= 1), `jam-keypad: round keys >= 56px (${k.keys.map(x => x.w).join(",")})`);
  const lumOf = s => { const m = s.match(/[\d.]+/g).slice(0, 3).map(Number).map(v => { v /= 255; return v <= .03928 ? v / 12.92 : ((v + .055) / 1.055) ** 2.4; }); return .2126 * m[0] + .7152 * m[1] + .0722 * m[2]; };
  const cr = (a, b) => { const x = lumOf(a), y = lumOf(b); return (Math.max(x, y) + .05) / (Math.min(x, y) + .05); };
  const k2 = await kInfo("Hall");
  const all = [...k.keys, ...k.bar, ...k2.keys].filter(x => !x.dis), low = all.filter(x => cr(x.bg, x.fg) < 4.5);
  check(!low.length, `jam-keypad: every key's text reads >= 4.5:1 on its fill (accent + lit keys nudged): ${all.map(x => x.n + " " + cr(x.bg, x.fg).toFixed(1)).join(", ")}`);
  // current_entity changes later -> Vibes, with a one-shot stamp.
  await push("jam-keypad", "input_select.lc_scene", {state: "Vibes", last_changed: new Date().toISOString()});
  k = await kInfo("Living room");
  check(k.cur === "Vibes" && k.keys.filter(x => x.on).map(x => x.n).join() === "Vibes" && k.keys[2].stamp, `jam-keypad: current_entity -> Vibes is active (stamp once) (${k.cur})`);
  // A newer scene activation wins over an older current_entity change.
  await push("jam-keypad", "scene.lc_dinner", {state: new Date(Date.now() + 60000).toISOString()});
  k = await kInfo("Living room");
  check(k.cur === "Dinner" && k.keys.filter(x => x.on).map(x => x.n).join() === "Dinner", `jam-keypad: a scene activated after the select change is active (${k.cur})`);
  await reset();
  await kp("Living room").locator(".kp-key").nth(0).click();
  await kp("Living room").locator(".kp-key").nth(5).click();
  await kp("Living room").locator(".kp-act").nth(0).click();
  await kp("Living room").locator(".kp-act").nth(1).click();
  c = await calls();
  check(c.length === 4 && c[0].domain === "scene" && c[0].service === "turn_on" && c[0].data.entity_id === "scene.lc_normal" &&
    c[1].domain === "script" && c[1].service === "turn_on" && c[1].data.entity_id === "script.lc_read" &&
    c[2].domain === "light" && c[2].service === "turn_on" && c[2].target.area_id === "living_room" && c[3].service === "turn_off",
    `jam-keypad: scene / script turn_on, All on / All off run their actions (${c.map(x => x.domain + "." + x.service).join(", ")})`);
  await reset();
  k = await kInfo("Hall");
  await kp("Hall").locator(".kp-key").nth(2).click();
  await kp("Hall").locator(".kp-key").nth(4).click();
  c = await calls();
  check(k.keys[3].dis && k.keys[3].n === "Gone" && c.length === 2 && c[0].domain === "button" && c[0].service === "press" && c[0].data.entity_id === "button.lc_doorbell" &&
    c[1].domain === "script" && c[1].target.entity_id === "script.lc_read",
    `jam-keypad: missing entity = disabled key; button.press; a key's tap_action (${c.map(x => x.domain + "." + x.service).join(", ")})`);

  // ---------- jam-radio ----------
  const RK = "media_player.lc_kitchen";
  const rInfo = id => radio(id).evaluate(e => {
    const r = e.shadowRoot, w = r.querySelector(".rd-wh"), sz = n => { const b = n.getBoundingClientRect(); return [Math.round(b.width), Math.round(b.height)]; };
    return {kick: r.querySelector(".kk").textContent, title: r.querySelector(".rd-lcd b").textContent, sub: (r.querySelector(".rd-lcd small") || {}).textContent,
      keys: [...r.querySelectorAll(".rd-k")].map(k => k.dataset.key + (k.disabled ? "-" : "") + (k.classList.contains("main") ? "*" : "") + ":" + sz(k).join("x")),
      vnFs: parseFloat(getComputedStyle(r.querySelector(".rd-vn")).fontSize), kkFs: parseFloat(getComputedStyle(r.querySelector(".kk")).fontSize),
      grH: Math.round(r.querySelector(".rd-gr").getBoundingClientRect().height), faceH: Math.round(r.querySelector(".rd > .face").getBoundingClientRect().height),
      bk: [...r.querySelectorAll(".bk button")].map(k => k.dataset.key + ":" + k.getAttribute("aria-pressed") + (k.disabled ? "-" : "")),
      role: w.getAttribute("role"), now: w.getAttribute("aria-valuenow"), wlabel: w.getAttribute("aria-label"), wdis: w.getAttribute("aria-disabled"), vn: w.textContent, wsz: sz(w),
      grille: getComputedStyle(r.querySelector(".rd-gr")).display, lcdSz: sz(r.querySelector(".rd-lcd"))};
  });
  let rd = await rInfo(RK);
  check(rd.kick === "Kitchen · Spotify" && rd.title === "Lobby" && rd.sub === "AERwave" && rd.grille !== "none" && rd.lcdSz[1] >= 44,
    `jam-radio: kicker "${rd.kick}", display Lobby / AERwave, grille shown`);
  check(rd.keys.join() === "prev:44x44,play_pause*:52x44,next:44x44" && rd.role === "slider" && rd.now === "36" && rd.vn === "36" && rd.wlabel === "Kitchen volume" &&
    rd.wsz[0] >= 76 && rd.wsz[0] <= 88 && rd.vnFs >= 16 && rd.kkFs >= 12 && rd.grH >= rd.faceH - 30 && rd.bk.join() === "shuffle:false,favorite:false",
    `jam-radio: round keys, play filled while playing (${rd.keys}), wheel ${rd.wsz} with a ${rd.vnFs}px number, ${rd.kkFs}px kicker, full-height grille (${rd.grH}/${rd.faceH}), shuffle + favourite (${rd.bk})`);
  await reset();
  await radio(RK).locator('.rd-k[data-key="play_pause"]').click();
  await radio(RK).locator('.rd-k[data-key="prev"]').click();
  await radio(RK).locator('.bk [data-key="shuffle"]').click();
  await radio(RK).locator('.bk [data-key="favorite"]').click();
  c = await calls();
  check(c.length === 4 && c[0].service === "media_play_pause" && c[1].service === "media_previous_track" && c[2].service === "shuffle_set" && c[2].data.shuffle === true &&
    c[3].domain === "button" && c[3].data.entity_id === "button.lc_kitchen_favorite_current_song",
    `jam-radio: play / prev / shuffle_set / favourite button.press (${c.map(x => x.domain + "." + x.service).join(", ")})`);
  // Wheel: keys, then a drag up by 20px = +10.
  await push("jam-radio", RK, {attributes: {volume_level: 0.36}});
  await reset();
  await radio(RK).locator(".rd-wh").focus(); await page.keyboard.press("ArrowUp");
  c = await calls();
  check(c.length === 1 && c[0].service === "volume_set" && Math.abs(c[0].data.volume_level - .41) < 1e-9, `jam-radio: ArrowUp on the wheel = volume_set 0.41 (${JSON.stringify(c.map(x => x.data))})`);
  await push("jam-radio", RK, {attributes: {volume_level: 0.36}});
  await reset();
  const wb = await radio(RK).locator(".rd-wh").boundingBox();
  await page.mouse.move(wb.x + wb.width / 2, wb.y + wb.height / 2); await page.mouse.down();
  await page.mouse.move(wb.x + wb.width / 2, wb.y + wb.height / 2 - 10, {steps: 3}); await page.mouse.move(wb.x + wb.width / 2, wb.y + wb.height / 2 - 20, {steps: 3});
  const rmid = await rInfo(RK); c = await calls();
  await page.mouse.up();
  const c2 = await calls();
  check(c.length === 0 && rmid.vn === "46" && c2.length === 1 && Math.abs(c2[0].data.volume_level - .46) < 1e-9,
    `jam-radio: rolling the wheel up 20px previews 46 and sends volume_set 0.46 on release (${rmid.vn}; ${JSON.stringify(c2.map(x => x.data))})`);
  // Display = panel B.
  await radio(RK).locator(".rd-lcd").click();
  await page.waitForTimeout(100);
  const pb = await page.evaluate(() => { const h = document.querySelector(".jam-sheet-host"); return h ? !!h.shadowRoot.querySelector(".mu") : false; });
  check(pb, "jam-radio: the display opens jam-speaker's panel B");
  await closeSheet();
  rd = await rInfo("media_player.lc_den");
  check(rd.title === "Den" && /^Last played: Teardrop/.test(rd.sub) && rd.bk.join() === "shuffle:true" && rd.keys[1].startsWith("play_pause:"),
    `jam-radio idle: room + "Last played", play not filled (${rd.keys[1]}), shuffle on (${rd.bk})`);
  rd = await rInfo("media_player.lc_garage");
  check(rd.title === "Garage" && rd.sub === "Offline" && rd.keys.every(x => x.includes("-:")) && rd.role === null && rd.wdis === "true" && rd.vn === "—",
    `jam-radio offline: keys and wheel disabled (${rd.keys}; wheel ${rd.wdis})`);

  // ---------- no continuous animation ----------
  await page.waitForTimeout(400);
  const anim = await page.evaluate(() => [...document.querySelectorAll("#view jam-dial, #view jam-keypad, #view jam-radio")]
    .flatMap(e => e.shadowRoot.getAnimations({subtree: true})).filter(a => a.playState === "running" && (a.effect.getTiming().iterations === Infinity || a.currentTime > 2000)).length);
  check(anim === 0, `look cards: no running / infinite animations once settled (${anim})`);
};
