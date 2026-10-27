// Watch & play interactions (fixture preview/fixtures/70-tv.js): jam-tv playing / idle / off, launchers, power / stereo,
// Remote sheet with a jam-remote; jam-media compact + ⋯ sheet (NerveOS) with child cards; jam-fan speeds / presets / pill.
// Set JAM_SHOTS=<dir> to also write 390 px review screenshots of the cards and both sheets.
// Contract: module.exports = async (page, check, helpers) => {}; runs on the dark/1280 preview page, files in name order.
const path = require("path");
module.exports = async (page, check, {callsNow}) => {
  const TV = "media_player.living_room_phoster_android_tv", RC = "remote.living_room_phoster_android_tv";
  // The preview hass drops the 4th callService argument (target); record it while these checks run.
  await page.evaluate(() => {
    const h = window.__hass;
    h.__orig = h.callService;
    h.callService = (domain, service, data, target) => { window.__calls.push({domain, service, data, target}); return Promise.resolve(); };
  });
  const reset = () => page.evaluate(() => { window.__calls.length = 0; });
  const push = (id, patch) => page.evaluate(([id, patch]) => {
    const h = window.__hass, s = h.states[id];
    h.states[id] = {...s, ...patch, attributes: {...s.attributes, ...(patch.attributes || {})}, last_updated: "p" + Math.random()};
    const nh = {...h};
    for (const e of document.querySelectorAll("jam-tv, jam-media, jam-fan")) e.hass = nh;
  }, [id, patch]);

  const tv = page.locator("jam-tv").nth(0), idle = page.locator("jam-tv").nth(1);
  const mode = loc => loc.locator(".paper[data-mode]").first().getAttribute("data-mode");

  // Playing layout.
  check(await mode(tv) === "playing", "jam-tv: playing state -> playing layout");
  check((await tv.locator(".title").textContent()) === "Close Encounters of the Third Kind", "jam-tv: title = media_title");
  const sub = await tv.locator(".sub").textContent();
  check(sub === "Jellyfin · 1:12 / 2:17", `jam-tv: sub = app · position / duration (${sub})`);
  check(await tv.locator(".art .arm").count() === 1 && await tv.locator(".apps").count() === 0, "jam-tv: no picture -> Golden Arm bars; no launchers while playing");
  const pk = await tv.locator(".keys button").evaluateAll(bs => bs.map(b => b.dataset.key + (b.classList.contains("on") ? "*" : "")));
  check(pk.join(",") === "prev,play_pause*,next,remote", `jam-tv: playing keys Prev / Play-Pause (accent) / Next / Remote (${pk})`);
  for (const [k, svc] of [["prev", "media_previous_track"], ["play_pause", "media_play_pause"], ["next", "media_next_track"]]) {
    await reset(); await tv.locator(`button[data-key="${k}"]`).click();
    const c = await callsNow();
    check(c.length === 1 && c[0].domain === "media_player" && c[0].service === svc && c[0].data.entity_id === TV, `jam-tv: ${k} calls media_player.${svc}`);
  }

  // Idle layout: 7 launchers 4-up, then Power / Stereo / Remote.
  check(await mode(idle) === "idle", "jam-tv: on without a title -> idle layout");
  const apps = idle.locator(".apps button");
  check(await apps.count() === 7, "jam-tv: idle shows the 7 launchers");
  const ys = await apps.evaluateAll(bs => bs.map(b => Math.round(b.getBoundingClientRect().top)));
  check(ys.slice(0, 4).every(y => y === ys[0]) && ys[4] > ys[0], `jam-tv: launchers are 4-up (${ys.join(",")})`);
  // Narrow card (300 px): 3-up, names wrap on word boundaries only (each word fits on one line, max 2 lines).
  await idle.evaluate(e => { e.style.display = "block"; e.style.width = "300px"; });
  const nys = await apps.evaluateAll(bs => bs.map(b => Math.round(b.getBoundingClientRect().top)));
  check(nys.slice(0, 3).every(y => y === nys[0]) && nys[3] > nys[0], `jam-tv: 300 px card -> launchers 3-up (${nys.join(",")})`);
  const names = await apps.evaluateAll(bs => bs.map(b => {
    const nm = b.querySelector(".nm"), lh = parseFloat(getComputedStyle(nm).lineHeight) || 10;
    let wordsFit = true;
    for (const w of nm.textContent.split(/\s+/)) {   // a word wider than the box would be clipped or broken
      const probe = document.createElement("span"); probe.textContent = w; probe.style.whiteSpace = "nowrap";
      nm.append(probe); if (probe.getBoundingClientRect().width > nm.clientWidth + 0.5) wordsFit = false; probe.remove();
    }
    return {n: nm.textContent, wordsFit, lines: Math.round(nm.getBoundingClientRect().height / lh)};
  }));
  const badNames = names.filter(x => !x.wordsFit || x.lines > 2);
  check(badNames.length === 0, `jam-tv: 300 px launcher names fit whole words, max 2 lines (${names.map(x => x.n + ":" + x.lines + (x.wordsFit ? "" : "!")).join(", ")})`);
  await idle.evaluate(e => { e.style.display = ""; e.style.width = ""; });
  const sq = await apps.first().locator(".sq").evaluate(e => getComputedStyle(e).backgroundColor);
  const violet = await page.evaluate(() => { const p = document.createElement("span"); p.style.color = "var(--jam-violet)"; document.body.append(p); const c = getComputedStyle(p).color; p.remove(); return c; });
  check(sq === violet, `jam-tv: launcher colour square is a flat jam colour (Jellyfin violet ${sq})`);
  const ik = await idle.locator(".keys button").evaluateAll(bs => bs.map(b => b.dataset.key));
  check(ik.join(",") === "power,stereo,remote", `jam-tv: idle keys Power / Stereo / Remote (${ik})`);
  await reset(); await apps.filter({hasText: "Jellyfin"}).click();
  let c = await callsNow();
  check(c.length === 1 && c[0].domain === "automation" && c[0].service === "trigger" && c[0].target.entity_id === "automation.launch_jellyfin" && c[0].data.skip_condition === true,
    "jam-tv: Jellyfin launcher triggers automation.launch_jellyfin");
  await reset(); await apps.filter({hasText: "Dropout"}).click();
  c = await callsNow();
  check(c.length === 1 && c[0].domain === "select" && c[0].service === "select_option" && c[0].data.option === "Dropout" && c[0].target.entity_id === "select.hisense_tv_launch_app",
    "jam-tv: Dropout launcher selects the launch_app option");
  await reset(); await idle.locator('button[data-key="power"]').click();
  c = await callsNow();
  check(c.length === 1 && c[0].domain === "remote" && c[0].service === "toggle" && c[0].data.entity_id === RC, "jam-tv: Power = remote.toggle");
  await idle.locator('button[data-key="stereo"]').click();
  check(await page.evaluate(() => location.hash) === "#stereo-popup", "jam-tv: Stereo runs stereo_action (navigate #stereo-popup)");
  await page.evaluate(() => history.replaceState(null, "", location.pathname + location.search));

  // State switch: a title arrives -> playing; off -> launchers + Power only.
  await push("media_player.preview_tv_idle", {attributes: {media_title: "Lobby", app_id: "com.google.android.youtube.tv", app_name: "com.google.android.youtube.tv"}});
  check(await mode(idle) === "playing" && (await idle.locator(".sub").textContent()) === "YouTube", "jam-tv: idle -> playing when a title arrives (package id shown as YouTube)");
  await push("media_player.preview_tv_idle", {state: "off", attributes: {media_title: null}});
  const ok = await idle.locator(".keys button").evaluateAll(bs => bs.map(b => b.dataset.key));
  check(await mode(idle) === "off" && await apps.count() === 7 && ok.join(",") === "power", `jam-tv: off shows launchers + Power only (${ok})`);
  check((await idle.locator(".label").first().textContent()).endsWith("· Off"), "jam-tv: off kicker says Off");
  await push("media_player.preview_tv_idle", {state: "on"});
  // A picture becomes a duotone print.
  await push(TV, {attributes: {entity_picture: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg'/%3E"}});
  check(await tv.locator(".art img").count() === 1, "jam-tv: entity_picture shows as the art image");
  await push(TV, {attributes: {entity_picture: null}});

  // Remote sheet: a jam-remote with the merged config sends remote commands / the custom volume actions.
  await tv.locator('button[data-key="remote"]').click();
  const sheet = page.locator(".jam-sheet-host .pop");
  check(await sheet.count() === 1 && (await sheet.locator("h2").textContent()) === "Remote" && await sheet.locator('.paper[data-cut="sheet"]').count() === 1,
    "jam-tv: Remote opens a sheet (sheet cut)");
  const rem = sheet.locator("jam-remote");
  check(await rem.count() === 1 && await rem.evaluate(r => !!r.hass && r.hass.states !== undefined), "jam-tv: the sheet holds a jam-remote with hass");
  await reset(); await rem.locator('button[data-key="up"]').click();
  c = await callsNow();
  check(c.length === 1 && c[0].domain === "remote" && c[0].service === "send_command" && c[0].data.entity_id === RC && c[0].data.command === "DPAD_UP",
    "jam-tv: sheet d-pad up = remote.send_command DPAD_UP");
  await reset(); await rem.locator('button[data-key="settings"]').click();
  check((await callsNow()).some(x => x.service === "send_command" && x.data.command === "SETTINGS"), "jam-tv: Settings key sends SETTINGS");
  await reset(); await rem.locator('button[data-key="vol_up"]').click();
  check((await callsNow()).some(x => x.domain === "script" && x.service === "stereo_volume_up"), "jam-tv: remote_card actions are merged (vol + = script.stereo_volume_up)");
  const remHead = await rem.evaluate(r => r.shadowRoot.querySelectorAll(".label, .title").length);
  check(remHead === 0 && await rem.evaluate(r => r._config.hide_title === true), `jam-tv: the jam-remote in the sheet hides its own name/title (${remHead})`);
  const rows = await rem.evaluate(r => [...r.shadowRoot.querySelectorAll("button[data-key]")].map(b => b.dataset.key).join(","));
  check(rows === "up,left,ok,right,down,back,home,settings,vol_down,mute,vol_up", `jam-tv: default remote rows d-pad / back home settings / vol (${rows})`);
  await page.keyboard.press("Escape");
  check(await page.locator(".jam-sheet-host").count() === 0, "jam-tv: Esc closes the sheet");

  // NerveOS: compact jam-media without a media_player, ⋯ sheet with child cards that get hass.
  const nv = page.locator("jam-media").filter({hasText: "Hades II"});
  check(await nv.count() === 1 && (await nv.locator(".sub").textContent()) === "NerveOS · vol 79 %", "jam-media compact: NerveOS title + sub from title_entity / sub_entities");
  const artW = await nv.locator(".art").evaluate(e => Math.round(e.getBoundingClientRect().width));
  check(artW === 52 && await nv.locator("button").count() === 1, `jam-media compact: 52px art (${artW}) and one key`);
  await nv.locator('button[data-key="more"]').click();
  const ns = page.locator(".jam-sheet-host .pop");
  const kids = await ns.locator(".body").evaluate(b => [...b.children].map(k => ({tag: k.localName, hass: !!k.hass})));
  check(kids.length === 5 && kids.every(k => k.hass) && kids.map(k => k.tag).join(",") === "jam-remote,jam-button,jam-button,jam-tile,jam-slider",
    `jam-media more: ⋯ opens a sheet with child cards that receive hass (${kids.map(k => k.tag + (k.hass ? "+" : "-")).join(",")})`);
  const fresh = await page.evaluate(() => {
    const m = [...document.querySelectorAll("jam-media")].find(e => e._jamSheet), nh = {...window.__hass};
    m.hass = nh;
    return [...m._jamSheet.sheet.body.children].every(k => k.hass === nh);
  });
  check(fresh, "jam-media more: a new hass reaches the sheet's child cards");
  // Surfaces one step up inside the sheet: sheet face slab, child card face slab2 (≠ sheet), child keys slab3.
  const surf = await page.evaluate(() => {
    const sr = document.querySelector(".jam-sheet-host").shadowRoot, bg = n => n ? getComputedStyle(n).backgroundColor : null;
    const btn = sr.querySelector("jam-button"), tile = sr.querySelector("jam-tile");
    const tok = v => { const p = document.createElement("span"); p.style.color = `var(${v})`; document.body.append(p); const c = getComputedStyle(p).color; p.remove(); return c; };
    return {sheet: bg(sr.querySelector(".sheet > .face")), btn: bg(btn.shadowRoot.querySelector(".face")), tileKey: bg(tile.shadowRoot.querySelector(".key > .face")),
      slab: tok("--jam-slab"), slab2: tok("--jam-slab2"), slab3: tok("--jam-slab3")};
  });
  check(surf.sheet === surf.slab && surf.btn === surf.slab2 && surf.btn !== surf.sheet && (!surf.tileKey || surf.tileKey === surf.slab3),
    `sheet child cards one surface step up (sheet ${surf.sheet}, key face ${surf.btn}, tile key ${surf.tileKey})`);
  // Entity-less jam-remote (NerveOS): keys run their actions; keys without one are disabled; no own title in the sheet.
  const nrem = ns.locator("jam-remote");
  const nr = await nrem.evaluate(r => ({head: r.shadowRoot.querySelectorAll(".label, .title").length, err: r.shadowRoot.querySelectorAll(".c-alert").length,
    dis: [...r.shadowRoot.querySelectorAll("button[data-key]")].filter(b => b.disabled).map(b => b.dataset.key).join(",")}));
  check(nr.head === 0 && nr.err === 0 && nr.dis === "menu", `jam-remote without entity: renders, no own title, only the action-less key disabled (${nr.dis})`);
  await reset(); await nrem.locator('button[data-key="up"]').click();
  c = await callsNow();
  check(c.length === 1 && c[0].domain === "button" && c[0].service === "press" && c[0].target.entity_id === "button.living_room_nerveos_aero_15_up",
    "jam-remote without entity: d-pad up presses button.living_room_nerveos_aero_15_up");
  await reset(); await nrem.locator('button[data-key="back"]').click();
  c = await callsNow();
  check(c.length === 1 && c[0].domain === "select" && c[0].service === "select_option" && c[0].data.option === "Back" && c[0].target.entity_id === "select.nerveos_remote",
    "jam-remote without entity: Back selects the select.nerveos_remote option");
  await reset(); await ns.locator("jam-button").first().click();
  c = await callsNow();
  check(c.some(x => x.domain === "button" && x.service === "press" && x.target && x.target.entity_id === "button.living_room_nerveos_aero_15_sleep"), "jam-media more: Sleep button in the sheet presses the NerveOS button");
  if (process.env.JAM_SHOTS) {
    await page.setViewportSize({width: 390, height: 844});
    await page.screenshot({path: path.join(process.env.JAM_SHOTS, "nerveos-sheet-390.png")});
  }
  await ns.locator("button.close").click();
  check(await page.locator(".jam-sheet-host").count() === 0, "jam-media more: CLOSE key closes the sheet");
  if (process.env.JAM_SHOTS) {
    await tv.locator('button[data-key="remote"]').click();
    await page.screenshot({path: path.join(process.env.JAM_SHOTS, "tv-remote-sheet-390.png")});
    await page.keyboard.press("Escape");
    await tv.scrollIntoViewIfNeeded();
    await page.locator("#view > .sec", {has: page.locator("jam-tv")}).screenshot({path: path.join(process.env.JAM_SHOTS, "watch-play-390.png")});
    await page.setViewportSize({width: 1280, height: 900});
  }

  // Compact player key = play/pause on the speaker.
  const sp = page.locator("jam-media").filter({hasText: "Phoster speaker"});
  await reset(); await sp.locator('button[data-key="play_pause"]').click();
  c = await callsNow();
  check(c.length === 1 && c[0].service === "media_play_pause" && c[0].data.entity_id === "media_player.phoster", "jam-media compact: play key = media_play_pause");
  const bad = await page.evaluate(() => { try { document.createElement("jam-media").setConfig({type: "custom:jam-media", entity: "sensor.x"}); return false; } catch (e) { return true; } });
  check(bad, "jam-media: a non-media_player entity without title_entity is still rejected");

  // jam-fan.
  const fan = page.locator("jam-fan"), FID = "fan.vital_200s_series";
  const kick = await fan.locator(".nm .label").textContent();
  check(kick === "excellent · PM2.5 1 μg/m³", `jam-fan: kicker from sensor + extra_sensor (${kick})`);
  check(await fan.locator('button[data-key="power"]').evaluate(b => b.classList.contains("on") && b.textContent === "On"), "jam-fan: On pill fills with the accent");
  const segs = await fan.locator(".seg button").evaluateAll(bs => bs.map(b => b.dataset.pct + (b.classList.contains("on") ? "*" : "")));
  check(segs.join(",") === "25,50*,75,100", `jam-fan: speeds from percentage_step, 50 active (${segs})`);
  await reset(); await fan.locator('.seg button[data-pct="75"]').click();
  c = await callsNow();
  check(c.length === 1 && c[0].domain === "fan" && c[0].service === "set_percentage" && c[0].data.entity_id === FID && c[0].data.percentage === 75, "jam-fan: speed 75% -> fan.set_percentage 75");
  await reset(); await fan.locator('button[data-preset="sleep"]').click();
  c = await callsNow();
  check(c.length === 1 && c[0].service === "set_preset_mode" && c[0].data.preset_mode === "sleep", "jam-fan: preset chip -> fan.set_preset_mode sleep");
  await push(FID, {attributes: {preset_mode: "sleep"}});
  check(await fan.locator(".seg button.on").count() === 0 && await fan.locator('button[data-preset="sleep"]').evaluate(b => b.classList.contains("on")),
    "jam-fan: active preset lights its chip; no speed active");
  await reset(); await fan.locator('button[data-key="power"]').click();
  check((await callsNow()).some(x => x.service === "turn_off" && x.data.entity_id === FID), "jam-fan: pill turns the fan off");
  await push(FID, {state: "unavailable"});
  check(await fan.locator("button:not([disabled])").count() === 0, "jam-fan: unavailable disables every control");
  await push(FID, {state: "on", attributes: {preset_mode: null}});

  await page.evaluate(() => { const h = window.__hass; h.callService = h.__orig; delete h.__orig; });
};
