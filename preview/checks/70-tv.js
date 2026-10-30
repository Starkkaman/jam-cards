// Watch & play interactions (fixture preview/fixtures/70-tv.js): jam-tv (round 3) playing / idle / off, transport, rocker, Source sheet,
// power / stereo, Remote sheet with a jam-remote in TV + Stereo groups; jam-media compact + ⋯ sheet (NerveOS) with child cards; jam-fan speeds / presets / pill.
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

  const tv = page.locator("jam-tv").nth(0), idle = page.locator("jam-tv").nth(1), offc = page.locator("jam-tv").nth(2);
  const mode = loc => loc.locator(".paper[data-mode]").first().getAttribute("data-mode");
  const tok = v => page.evaluate(v => { const p = document.createElement("span"); p.style.color = `var(${v})`; document.body.append(p); const c = getComputedStyle(p).color; p.remove(); return c; }, v);
  const [RED, OCHRE, VIOLET, PINK, TEAL, INK, FG, SLAB2] = await Promise.all(["--jam-red", "--jam-ochre", "--jam-violet", "--jam-pink", "--jam-teal", "--jam-on-fg", "--jam-fg", "--jam-slab2"].map(tok));
  const CREAM = "rgb(236, 226, 201)";
  const bg = loc => loc.evaluate(e => getComputedStyle(e).backgroundColor);
  const sheet = page.locator(".jam-sheet-host .pop");

  // Round 3 playing: poster (>= 178px, 16px bottom-right cut) with the text on a solid ink band; kicker = app, title, time, progress.
  check(await mode(tv) === "playing" && await tv.locator("[data-tab]").count() === 0, "jam-tv: playing -> playing layout, no tab switch (always Now playing)");
  const po = tv.locator(".poster");
  const pg = await po.evaluate(p => { const cs = e => getComputedStyle(e), b = p.querySelector(".band");
    return {cut: p.dataset.cut, h: Math.round(p.getBoundingClientRect().height), clip: cs(p).getPropertyValue("--clip"),
      kick: p.querySelector(".kick").textContent, title: p.querySelector(".title").textContent, sub: p.querySelector(".sub").textContent,
      prog: p.querySelector(".prog i") ? p.querySelector(".prog i").style.width : null, progBg: p.querySelector(".prog i") ? cs(p.querySelector(".prog i")).backgroundColor : null,
      bars: !!p.querySelector(".sky .arm"), bg: cs(p.querySelector(".face")).backgroundColor, band: cs(b).backgroundColor,
      tFs: parseFloat(cs(p.querySelector(".title")).fontSize), tC: cs(p.querySelector(".title")).color, kFs: parseFloat(cs(p.querySelector(".kick")).fontSize),
      kC: cs(p.querySelector(".kick")).color, sFs: parseFloat(cs(p.querySelector(".sub")).fontSize), sC: cs(p.querySelector(".sub")).color,
      bandBottom: Math.round(p.getBoundingClientRect().bottom - b.getBoundingClientRect().bottom)}; });
  check(pg.h >= 178 && /100% - 16px/.test(pg.clip) && pg.cut === "poster", `jam-tv: poster >= 178px with a 16px cut (${pg.h}, ${pg.clip})`);
  check(pg.kick === "Jellyfin" && pg.title === "Close Encounters of the Third Kind" && pg.sub === "1:12 / 2:17", `jam-tv: poster kicker / title / time (${pg.kick} | ${pg.title} | ${pg.sub})`);
  check(pg.band === "rgb(20, 18, 16)" && pg.bandBottom === 0 && pg.tFs === 34 && pg.tC === CREAM && pg.kFs >= 12 && pg.kFs <= 14 && pg.kC === CREAM && pg.sFs >= 12 && pg.sFs <= 14 && pg.sC === CREAM,
    `jam-tv: text on a solid ink band at the poster bottom: title 34px, kicker ${pg.kFs}px / time ${pg.sFs}px, all full cream (${pg.band}; ${pg.tC} ${pg.kC} ${pg.sC})`);
  check(pg.prog === "52.6%" && pg.progBg === OCHRE && pg.bars && pg.bg === OCHRE, `jam-tv: accent progress strip ${pg.prog} (${pg.progBg}); no art -> accent poster + Golden Arm bars above the band (${pg.bg})`);
  const pwOn = await tv.locator("button.pw").evaluate(b => ({bg: getComputedStyle(b).backgroundColor, w: b.getBoundingClientRect().width, clip: getComputedStyle(b).clipPath}));
  check(pwOn.bg === INK && pwOn.w === 44 && /polygon/.test(pwOn.clip), `jam-tv: power triangle 44px, ink when on (${pwOn.bg})`);
  // Keys by job: Prev / big Play-Pause (accent) / Next with glyphs; one violet rocker; outlined Remote / Source tabs with glyphs.
  const tk0 = await tv.locator(".pane .keys button").evaluateAll(bs => bs.map(b => ({k: b.dataset.key + (b.classList.contains("on") ? "*" : ""), svg: !!b.querySelector("svg"),
    txt: b.textContent.trim(), aria: b.getAttribute("aria-label"), w: Math.round(b.getBoundingClientRect().width), h: Math.round(b.getBoundingClientRect().height),
    bg: getComputedStyle(b.firstChild).backgroundColor})));
  check(tk0.map(x => x.k).join(",") === "prev,play_pause*,next" && tk0.every(x => x.svg && !x.txt && x.aria && x.h >= 56) && tk0[1].bg === OCHRE && tk0[1].w > tk0[0].w * 1.3,
    `jam-tv: transport Prev / Play-Pause (accent, ${tk0[1] && tk0[1].w}px vs ${tk0[0] && tk0[0].w}px) / Next, glyph keys with aria-labels (${tk0.map(x => x.k + ":" + x.aria).join(", ")})`);
  check(tk0[1].aria === "Pause", `jam-tv: playing -> the play key shows Pause (${tk0[1].aria})`);
  const rk = await tv.locator(".pane .rock").evaluateAll(rs => rs.map(r => ({n: r.querySelectorAll(".rock").length, keys: [...r.querySelectorAll("button")].map(b => b.dataset.key).join(","),
    bg: [...r.querySelectorAll("button")].map(b => getComputedStyle(b.firstChild).backgroundColor), mute: !!r.querySelector('[data-key="mute"] svg') && /mute/i.test(r.textContent),
    gap: getComputedStyle(r.firstChild).columnGap, ink: getComputedStyle(r.firstChild).backgroundColor, cut: r.dataset.cut})));
  check(rk.length === 1 && rk[0].keys === "vol_down,mute,vol_up" && rk[0].bg.every(x => x === VIOLET) && rk[0].mute && rk[0].gap === "3px" && rk[0].ink === "rgb(20, 18, 16)" && rk[0].cut === "key",
    `jam-tv: volume = one violet rocker − | Mute (speaker glyph) | + split by 3px ink gaps (${JSON.stringify(rk[0])})`);
  const tabs = await tv.locator(".pane .seg button").evaluateAll(bs => bs.map(b => ({k: b.dataset.key, t: b.textContent.trim(), svg: !!b.querySelector("svg"), ol: b.classList.contains("ol"),
    edge: getComputedStyle(b.firstChild).backgroundColor, inner: getComputedStyle(b.firstChild, "::before").backgroundColor})));
  check(tabs.map(x => x.k + ":" + x.t).join(",") === "remote:Remote,source:Source" && tabs.every(x => x.svg && x.ol && x.edge !== x.inner),
    `jam-tv: bottom row = outlined Remote and Source tabs with glyphs (${tabs.map(x => x.k + " " + x.edge + "/" + x.inner).join(", ")})`);
  check(await tv.locator('button[data-key="stereo"]').count() === 0 && await tv.locator(".apps").count() === 0 && await tv.locator(".turnon").count() === 0, "jam-tv: no Stereo key, no old launcher layout, no Turn on key while on");
  for (const [k, svc] of [["prev", "media_previous_track"], ["play_pause", "media_play_pause"], ["next", "media_next_track"]]) {
    await reset(); await tv.locator(`button[data-key="${k}"]`).click();
    const c = await callsNow();
    check(c.length === 1 && c[0].domain === "media_player" && c[0].service === svc && c[0].data.entity_id === TV, `jam-tv: ${k} calls media_player.${svc}`);
  }
  await reset(); await tv.locator('button[data-key="mute"]').click();
  let c = await callsNow();
  check(c.length === 1 && c[0].domain === "button" && c[0].service === "press" && c[0].target.entity_id === "button.stereo_volume_mute", "jam-tv: Mute runs mute_action");
  await reset();
  const vb0 = await tv.locator('button[data-key="vol_up"]').boundingBox();
  await page.mouse.move(vb0.x + vb0.width / 2, vb0.y + vb0.height / 2); await page.mouse.down(); await page.waitForTimeout(800); await page.mouse.up();
  const heldUp = (await callsNow()).filter(x => x.domain === "script" && x.service === "stereo_volume_up").length;
  check(heldUp >= 3, `jam-tv: holding Vol + repeats volume_up_action (${heldUp} calls)`);
  await reset(); await tv.locator('button.pw').click({position: {x: 34, y: 10}});
  c = await callsNow();
  check(c.length === 1 && c[0].domain === "remote" && c[0].service === "toggle" && c[0].data.entity_id === RC, "jam-tv: power triangle = remote.toggle (default power_action)");

  // Source sheet (round 3): its own sheet, Inputs 2-up + Apps 3-up big colour tiles with glyphs, Home screen last.
  await tv.locator('button[data-key="source"]').click();
  check(await sheet.count() === 1 && (await sheet.locator("h2").textContent()) === "Source" && await mode(tv) === "playing", "jam-tv: Source opens its own sheet (the card stays on Now playing)");
  const tiles = sheet.locator(".tile");
  const lay = await sheet.evaluate(p => ({labels: [...p.querySelectorAll(".body > .label")].map(l => l.textContent).join(","),
    two: [...p.querySelectorAll(".grid.two .tile")].map(t => t.dataset.app).join(","), three: [...p.querySelectorAll(".grid.three .tile")].map(t => t.dataset.app || t.dataset.key).join(","),
    tops: [...p.querySelectorAll(".grid.three .tile")].map(t => Math.round(t.getBoundingClientRect().top)), h: [...p.querySelectorAll(".tile")].map(t => Math.round(t.getBoundingClientRect().height)),
    svg: [...p.querySelectorAll(".tile")].every(t => t.querySelector(".gl svg")), ink: getComputedStyle(p.querySelector(".tile .nm")).color,
    icons: [...p.querySelectorAll(".tile .gl svg")].map(s => s.innerHTML.length).join(",")}));
  check(lay.labels === "Inputs,Apps" && lay.two === "Nerv//OS,Switch" && lay.three === "YouTube,Jamfin,Dropout,Corridor Digital,home",
    `jam-tv source sheet: Inputs (match.input) ${lay.two} / Apps ${lay.three}`);
  check(lay.tops.slice(0, 3).every(y => y === lay.tops[0]) && lay.tops[3] > lay.tops[0] && lay.h.every(x => x >= 80) && lay.svg && lay.ink === INK,
    `jam-tv source sheet: Apps 3-up, tiles ${Math.min(...lay.h)}px+ with a glyph, ink names (${lay.tops.join(",")})`);
  check(new Set(lay.icons.split(",")).size >= 5, `jam-tv source sheet: per-kind / per-source glyphs differ (${lay.icons})`);
  const onNow = () => sheet.locator(".tile.cur").evaluateAll(bs => bs.map(b => b.dataset.app + (b.classList.contains("jam-stamp") ? "*" : "")).join(","));
  const APP = "sensor.preview_tv_current_app", INP = "select.hisense_tv_input";
  check(await onNow() === "", "jam-tv: current_app \"HDMI 2\" (Projectivy home) + stale input -> no source marked");
  // 0.3.5: highlight only from live signals; select states and tap options never mark a tile.
  await push("select.hisense_tv_launch_app", {state: "HDMI 2"});
  check(await onNow() === "", `jam-tv: launch_app select "HDMI 2" alone marks nothing (${await onNow()})`);
  await push(TV, {attributes: {app_name: "YouTube"}});
  check(await onNow() === "", "jam-tv: media_player app_name is not a highlight signal");
  await push(TV, {attributes: {app_name: "Jellyfin"}});
  await push(APP, {state: "com.google.android.apps.tv.dreamx"});
  check(await onNow() === "", "jam-tv: screensaver (dreamx) -> no source marked");
  await push(APP, {state: "Dropout"});
  let on = await onNow();
  const cur = await sheet.locator(".tile.cur").evaluate(b => ({bg: getComputedStyle(b.firstChild).backgroundColor, ol: getComputedStyle(b).outlineWidth + " " + getComputedStyle(b).outlineStyle,
    olc: getComputedStyle(b).outlineColor, now: (b.querySelector(".now") || {}).textContent, aria: b.getAttribute("aria-current")}));
  check(on === "Dropout*" && cur.bg === PINK && cur.ol === "4px solid" && cur.olc === FG && cur.now === "On now" && cur.aria === "true",
    `jam-tv: current_app "Dropout" -> Dropout tile (pink) gets the cream outline + "On now" stamp, stamped once (${on} ${JSON.stringify(cur)})`);
  check(await sheet.locator(".now").count() === 1, "jam-tv: exactly one On now stamp");
  if (process.env.JAM_SHOTS) {
    await page.setViewportSize({width: 390, height: 844}); await page.waitForTimeout(150);
    await page.screenshot({path: path.join(process.env.JAM_SHOTS, "tv-source-sheet-390.png")});
    await page.setViewportSize({width: 1280, height: 900});
  }
  await push(TV, {attributes: {media_position: 4410}});
  check(await onNow() === "Dropout", "jam-tv: a plain update keeps the tile marked without a new stamp");
  for (const [v, want] of [["Jamfin (2)", "Jamfin"], ["com.corridordigital.watchcorridortv", "Corridor Digital"], ["YouTube", "YouTube"], ["Settings", ""]]) {
    await push(APP, {state: v});
    on = (await onNow()).replace("*", "");
    check(on === want, `jam-tv: current_app "${v}" -> ${want || "none"} (${on || "none"})`);
  }
  await push(APP, {state: "Live TV"});
  check(await onNow() === "Nerv//OS*", `jam-tv: on an input ("Live TV") + input "Switch 2" -> Nerv//OS (${await onNow()})`);
  await push(INP, {state: "HDMI 1"});
  check(await onNow() === "Switch*", `jam-tv: input "HDMI 1" -> Switch (${await onNow()})`);
  await push(APP, {state: "YouTube"});
  check((await onNow()).replace("*", "") === "YouTube", "jam-tv: an app in front wins over the (stale) input");
  await push(APP, {state: "HDMI 2"});
  check(await onNow() === "", "jam-tv: back on the home screen -> no source marked although the input select still says HDMI 1");
  await push(INP, {state: "Switch 2"});
  // Source tap actions; Home screen = remote HOME.
  for (const [n, ent, opt] of [["Switch", "select.hisense_tv_input", "HDMI 1"], ["Nerv//OS", "select.hisense_tv_launch_app", "HDMI 2"], ["Corridor Digital", "select.hisense_tv_launch_app", "Corridor TV"]]) {
    await reset(); await sheet.locator(`.tile[data-app="${n}"]`).click();
    c = await callsNow();
    check(c.length === 1 && c[0].domain === "select" && c[0].service === "select_option" && c[0].target.entity_id === ent && c[0].data.option === opt, `jam-tv: ${n} tile selects ${ent} ${opt}`);
  }
  await reset(); await sheet.locator('.tile[data-key="home"]').click();
  c = await callsNow();
  check(c.length === 1 && c[0].domain === "remote" && c[0].service === "send_command" && c[0].data.entity_id === RC && c[0].data.command === "HOME", "jam-tv: Home screen tile = remote.send_command HOME");
  const sq = await bg(sheet.locator('.tile[data-app="Nerv//OS"] > .face'));
  check(sq === TEAL, `jam-tv: source tile is a flat jam colour block (Nerv//OS teal ${sq})`);
  await page.keyboard.press("Escape");
  check(await page.locator(".jam-sheet-host").count() === 0, "jam-tv: Esc closes the Source sheet");

  // Idle (on, no title): poster names the app.
  check(await mode(idle) === "idle" && (await idle.locator(".title").textContent()) === "Home" && (await idle.locator('button[data-key="play_pause"]').getAttribute("aria-label")) === "Play",
    "jam-tv: idle -> poster title = app (Home), Play key shows Play");
  // Off: slab2 poster, TV off, red power, big Turn on key + quick source tiles; no transport / volume / tabs.
  check(await mode(offc) === "off", "jam-tv: off -> off layout");
  const og = await offc.locator(".poster").evaluate(p => ({bg: getComputedStyle(p.querySelector(".face")).backgroundColor, t: p.querySelector(".title").textContent,
    sub: p.querySelectorAll(".sub").length, pw: getComputedStyle(p.querySelector(".pw")).backgroundColor, pwc: getComputedStyle(p.querySelector(".pw")).color}));
  check(og.bg === SLAB2 && og.t === "TV off" && og.sub === 0, `jam-tv: off poster slab2, "TV off" (${og.bg})`);
  check(og.pw === RED && og.pwc === INK, `jam-tv: power is red with an ink glyph when off (${og.pw} / ${og.pwc})`);
  const offKeys = await offc.locator(".pane").evaluate(p => ({turn: [...p.querySelectorAll(".turnon")].map(b => ({t: b.textContent.trim(), bg: getComputedStyle(b.firstChild).backgroundColor,
    svg: !!b.querySelector("svg"), h: Math.round(b.getBoundingClientRect().height)})), tiles: [...p.querySelectorAll(".src .tile")].map(t => t.dataset.app + (t.classList.contains("cur") ? "*" : "")),
    other: p.querySelectorAll(".keys, .rock, .seg").length}));
  check(offKeys.turn.length === 1 && offKeys.turn[0].t === "Turn on" && offKeys.turn[0].bg === RED && offKeys.turn[0].svg && offKeys.turn[0].h >= 56,
    `jam-tv: off -> big red Turn on key with a power glyph (${JSON.stringify(offKeys.turn[0])})`);
  check(offKeys.tiles.length === 6 && !offKeys.tiles.some(x => x.endsWith("*")) && offKeys.other === 0, `jam-tv: off -> quick source tiles (${offKeys.tiles}), nothing marked, no transport / rocker / tabs`);
  await reset(); await offc.locator(".turnon").click();
  c = await callsNow();
  check(c.length === 1 && c[0].domain === "remote" && c[0].service === "toggle", "jam-tv: Turn on runs the power action (remote.toggle)");
  await reset(); await offc.locator('.src .tile[data-app="Switch"]').click();
  c = await callsNow();
  check(c.length === 1 && c[0].service === "select_option" && c[0].data.option === "HDMI 1", "jam-tv: an off quick tile runs its source action");
  await push("media_player.preview_tv_off", {state: "on"});
  check(await mode(offc) === "idle" && (await offc.locator('.seg button[data-key="source"]').textContent()) === "Watch" && (await tv.locator('.seg button[data-key="source"]').textContent()) === "Source",
    "jam-tv: off -> on shows Now playing; source_label renames the Source tab (default Source)");
  await push("media_player.preview_tv_off", {state: "off"});
  // Idle -> playing when a title arrives; package id shown as YouTube.
  await push("media_player.preview_tv_idle", {attributes: {media_title: "Lobby", app_id: "com.google.android.youtube.tv", app_name: "com.google.android.youtube.tv"}});
  check(await mode(idle) === "playing" && (await idle.locator(".kick").textContent()) === "YouTube", "jam-tv: idle -> playing when a title arrives (package id shown as YouTube)");
  await push("media_player.preview_tv_idle", {attributes: {media_title: null, app_id: "com.spocky.projengmenu", app_name: null}});
  // Art: image cover over the poster; the text stays on the solid ink band (cream) whatever the art.
  const svg = col => "data:image/svg+xml," + encodeURIComponent(`<svg xmlns='http://www.w3.org/2000/svg' width='40' height='40'><rect width='40' height='40' fill='${col}'/></svg>`);
  for (const col of ["#f4f0e0", "#101418"]) {
    await push(TV, {attributes: {entity_picture: svg(col)}});
    await page.waitForTimeout(150);
    const art = await po.evaluate(p => ({img: !!p.querySelector("img"), fit: getComputedStyle(p.querySelector("img")).objectFit, bars: !!p.querySelector(".arm"),
      band: getComputedStyle(p.querySelector(".band")).backgroundColor, fg: getComputedStyle(p.querySelector(".title")).color}));
    check(art.img && art.fit === "cover" && !art.bars && art.band === "rgb(20, 18, 16)" && art.fg === CREAM, `jam-tv: art ${col} -> cover image, cream text on the ink band (${art.band} ${art.fg})`);
  }
  await push(TV, {attributes: {entity_picture: "/broken/art.png"}});
  await page.waitForTimeout(250);
  check(await po.evaluate(p => !p.querySelector("img") && !!p.querySelector(".sky .arm")), "jam-tv: a broken art URL -> Golden Arm bars");
  if (process.env.JAM_SHOTS) {
    await page.setViewportSize({width: 390, height: 844});
    await push(TV, {attributes: {entity_picture: svg("#c43a2a")}});
    await page.waitForTimeout(150);
    await tv.scrollIntoViewIfNeeded();
    await tv.screenshot({path: path.join(process.env.JAM_SHOTS, "tv-art-390.png")});
    await page.setViewportSize({width: 1280, height: 900});
  }
  await push(TV, {attributes: {entity_picture: null}});
  // Remote sheet (round 3): header Remote + keyboard key + Close; TV group (teal rule, red power), Stereo group (violet rule, violet power).
  await tv.locator('button[data-key="remote"]').click();
  check(await sheet.count() === 1 && (await sheet.locator("h2").textContent()) === "Remote" && await sheet.locator('.paper[data-cut="sheet"]').count() === 1,
    "jam-tv: Remote opens a sheet (sheet cut)");
  const rem = sheet.locator("jam-remote");
  check(await rem.count() === 1 && await rem.evaluate(r => !!r.hass && r.hass.states !== undefined), "jam-tv: the sheet holds a jam-remote with hass");
  const kbk = sheet.locator('.head .acts button[data-key="keyboard"]');
  const kh = await sheet.locator(".head .acts").evaluate(a => { const [k, cl] = a.querySelectorAll("button");
    return {k: Math.round(k.getBoundingClientRect().height), c: Math.round(cl.getBoundingClientRect().height), order: k.nextElementSibling === cl,
      svg: !!k.querySelector("svg path"), parts: (k.querySelector("svg path:last-child") || {getAttribute: () => ""}).getAttribute("d"),
      txt: k.textContent.trim(), aria: k.getAttribute("aria-label"), fg: getComputedStyle(k.firstChild).color, bg: getComputedStyle(k.firstChild).backgroundColor}; });
  check(await kbk.count() === 1 && kh.order && kh.k === kh.c && kh.svg && /M7 14h10/.test(kh.parts) && !kh.txt && kh.aria === "Keyboard",
    `jam-tv: keyboard key (keyboard outline glyph with keys + space bar) in the sheet header left of Close, same height (${kh.k}/${kh.c}), aria-label Keyboard`);
  check(kh.fg === FG, `jam-tv: keyboard glyph in --fg (${kh.fg} on ${kh.bg})`);
  const secs = await rem.evaluate(r => [...r.shadowRoot.querySelectorAll(".sec")].map(s => { const f = s.querySelector(".face"), pw = s.querySelector(".gh .pw");
    return {t: s.dataset.section, rule: getComputedStyle(f).borderLeftColor, rw: getComputedStyle(f).borderLeftWidth, kick: s.querySelector(".gh .label").textContent,
      keys: [...s.querySelectorAll("button[data-key]")].map(b => b.dataset.key + (b.classList.contains("alert") ? "!" : b.classList.contains("on") ? "*" : "")).join(","),
      labels: [...s.querySelectorAll(".row button")].map(b => b.textContent).join("/"),
      ico: [...s.querySelectorAll(".row button")].filter(b => b.querySelector(".gl svg")).map(b => b.dataset.key).join(","),
      pw: pw ? {bg: getComputedStyle(pw.firstChild).backgroundColor, svg: !!pw.querySelector("svg"), aria: pw.getAttribute("aria-label"), txt: pw.textContent.trim()} : null,
      ok: s.querySelector(".ok > .face") ? getComputedStyle(s.querySelector(".ok > .face")).backgroundColor : null,
      play: s.querySelector('[data-key="play_pause"]') ? [getComputedStyle(s.querySelector('[data-key="play_pause"] > .face')).backgroundColor,
        Math.round(s.querySelector('[data-key="play_pause"]').getBoundingClientRect().width), Math.round(s.querySelector('[data-key="rewind"]').getBoundingClientRect().width)] : null,
      face: getComputedStyle(f).backgroundColor, key: getComputedStyle(s.querySelector(".row .key > .face")).backgroundColor}; }));
  const [S1, S2] = secs;
  check(secs.length === 2 && S1.t === "TV" && S2.t === "Stereo" && S1.kick === "TV" && S2.kick === "Stereo" && S1.rw === "6px" && S2.rw === "6px",
    `jam-tv: remote sheet has TV + Stereo groups with 6px left rules (${secs.map(s => s.t + " " + s.rw)})`);
  check(S1.keys === "power!,up,left,ok,right,down,back,home,menu,settings,rewind,play_pause*,forward", `jam-tv: TV group keys: power in the header, d-pad, Back/Home/Menu/Settings, Rewind/Play/Forward (${S1.keys})`);
  check(S1.labels === "Back/Home/Menu/Settings/Rewind/Play/Forward" && S1.ico === "back,home,menu,settings,rewind,play_pause,forward", `jam-tv: TV keys carry glyphs + labels (${S1.labels})`);
  check(S1.rule === TEAL && S1.ok === TEAL && S1.play[0] === TEAL && S1.play[1] > S1.play[2] * 1.3 && S2.rule === VIOLET,
    `jam-tv: TV group teal (rule, OK, Play ${S1.play[1]}px vs ${S1.play[2]}px), Stereo violet (${S1.rule} ${S1.ok} ${S2.rule})`);
  check(S1.pw && S1.pw.bg === RED && S1.pw.svg && !S1.pw.txt && S1.pw.aria === "TV power" && S2.pw && S2.pw.bg === VIOLET && S2.pw.aria === "Stereo power",
    `jam-tv: group headers: red TV power, violet Stereo power, glyph keys (${S1.pw && S1.pw.bg} / ${S2.pw && S2.pw.bg})`);
  check(S2.keys === "power*,vol_down,mute,vol_up,input_0*,input_1,input_2" && S2.labels === "TV/Turntable/Music sync", `jam-tv: Stereo group power / rocker / inputs (TV active) (${S2.keys} ${S2.labels})`);
  check(S1.face !== S1.key, `jam-tv: group face and its keys are different surfaces (${S1.face} / ${S1.key})`);
  const srk = await rem.evaluate(r => { const k = r.shadowRoot.querySelector('.sec[data-section="Stereo"] .rock'); return k ? {keys: [...k.querySelectorAll("button")].map(b => b.dataset.key).join(","),
    bg: getComputedStyle(k.querySelector("button > .face")).backgroundColor, first: !k.previousElementSibling.classList.contains("row")} : null; });
  check(srk && srk.keys === "vol_down,mute,vol_up" && srk.bg === VIOLET && srk.first, `jam-tv: Stereo rocker − | Mute | + in violet, above the inputs (${JSON.stringify(srk)})`);
  const ins = await rem.evaluate(r => [...r.shadowRoot.querySelectorAll('.sec[data-section="Stereo"] .row button')].map(b => ({k: b.dataset.key, p: b.getAttribute("aria-pressed"),
    edge: getComputedStyle(b.firstChild).backgroundColor, inner: getComputedStyle(b.firstChild, "::before").display === "none" ? "none" : getComputedStyle(b.firstChild, "::before").backgroundColor})));
  check(ins[0].edge === VIOLET && ins[0].inner === "none" && ins[0].p === "true" && ins.slice(1).every(x => x.edge === VIOLET && x.inner !== "none" && x.inner !== VIOLET && x.p === "false"),
    `jam-tv: stereo inputs outlined violet, the current one filled (${ins.map(x => x.k + ":" + x.p + ":" + x.inner).join(", ")})`);
  await push("input_select.preview_stereo_source", {state: "BLUETOOTH"});
  const act2 = await rem.evaluate(r => [...r.shadowRoot.querySelectorAll('.sec[data-section="Stereo"] button.on')].map(b => b.dataset.key).join(","));
  check(act2 === "power,input_2", `jam-tv: input_entity BLUETOOTH -> Music sync active via match (${act2})`);
  await push("input_select.preview_stereo_source", {state: "TV"});
  const sk = k => rem.locator(`.sec[data-section="Stereo"] button[data-key="${k}"]`), tk = k => rem.locator(`.sec[data-section="TV"] button[data-key="${k}"]`);
  for (const [k, svc] of [["power", "stereo_power"], ["input_0", "stereo_input_select_video"], ["input_1", "stereo_input_select_turntable"], ["input_2", "stereo_input_select_music_sync"], ["vol_down", "stereo_volume_down"]]) {
    await reset(); await sk(k).click();
    const cc = await callsNow();
    check(cc.length >= 1 && cc.every(x => x.domain === "script" && x.service === svc), `jam-tv stereo: ${k} runs script.${svc}`);
  }
  await reset(); await sk("mute").click();
  check((await callsNow()).some(x => x.domain === "button" && x.service === "press" && x.target.entity_id === "button.stereo_volume_mute"), "jam-tv stereo: Mute presses button.stereo_volume_mute");
  await reset();
  const vb = await sk("vol_up").boundingBox();
  await page.mouse.move(vb.x + vb.width / 2, vb.y + vb.height / 2); await page.mouse.down(); await page.waitForTimeout(800); await page.mouse.up();
  const held = (await callsNow()).filter(x => x.service === "stereo_volume_up").length;
  check(held >= 3, `jam-tv stereo: holding Vol + repeats (${held} calls)`);
  await reset(); await tk("up").click();
  c = await callsNow();
  check(c.length === 1 && c[0].domain === "remote" && c[0].service === "send_command" && c[0].data.entity_id === RC && c[0].data.command === "DPAD_UP",
    "jam-tv: sheet d-pad up = remote.send_command DPAD_UP");
  await reset(); await tk("settings").click();
  check((await callsNow()).some(x => x.service === "send_command" && x.data.command === "HOME"), "jam-tv: Settings key sends the configured command (HOME)");
  for (const [k, cmd] of [["rewind", "MEDIA_REWIND"], ["forward", "MEDIA_FAST_FORWARD"], ["play_pause", "MEDIA_PLAY_PAUSE"], ["menu", "MENU"], ["home", "HOME"], ["back", "BACK"]]) {
    await reset(); await tk(k).click();
    const cc = await callsNow();
    check(cc.length === 1 && cc[0].service === "send_command" && cc[0].data.command === cmd && cc[0].data.entity_id === RC, `jam-tv remote: ${k} sends ${cmd}`);
  }
  await reset(); await tk("power").click();
  c = await callsNow();
  check(c.length === 1 && c[0].domain === "remote" && c[0].service === "toggle" && c[0].data.entity_id === RC, "jam-tv remote: TV Power = remote.toggle (not the stereo)");
  // Keyboard (header key): a second sheet with a text field; Send = text:<field>, Backspace = DEL, Enter = ENTER.
  await kbk.click();
  await page.waitForTimeout(80);
  check(await page.locator(".jam-sheet-host").count() === 2, "jam-tv: header Keyboard key opens the keyboard sheet over the remote sheet");
  const kb = page.locator(".jam-sheet-host").nth(1).locator(".pop");
  check((await kb.locator("h2").textContent()) === "Keyboard" && await kb.locator("input").count() === 1 &&
    (await kb.locator(".kb button").evaluateAll(bs => bs.map(b => b.dataset.key).join(","))) === "send,backspace,enter", "keyboard sheet: text field + Send / Backspace / Enter");
  await reset();
  await kb.locator("input").fill("star trek");
  await kb.locator('button[data-key="send"]').click();
  await kb.locator('button[data-key="backspace"]').click();
  await kb.locator('button[data-key="enter"]').click();
  await kb.locator("input").fill("ok");
  await kb.locator("input").press("Enter");
  await kb.locator("input").press("Enter");
  const kc = (await callsNow()).map(x => `${x.domain}.${x.service}:${x.data.entity_id === RC ? "rc" : x.data.entity_id}:${x.data.command}`);
  check(kc.join(" | ") === "remote.send_command:rc:text:star trek | remote.send_command:rc:DEL | remote.send_command:rc:ENTER | remote.send_command:rc:text:ok | remote.send_command:rc:ENTER",
    `keyboard sheet sends like universal-remote-card Android TV (${kc.join(" | ")})`);
  check((await kb.locator("input").inputValue()) === "", "keyboard sheet: Send clears the field");
  if (process.env.JAM_SHOTS) {
    await page.setViewportSize({width: 390, height: 844});
    await kb.locator("input").fill("Close enc");
    await page.screenshot({path: path.join(process.env.JAM_SHOTS, "tv-keyboard-sheet-390.png")});
    await kb.locator("input").fill("");
    await page.setViewportSize({width: 1280, height: 900});
  }
  await page.keyboard.press("Escape");
  check(await page.locator(".jam-sheet-host").count() === 1, "keyboard sheet: Esc closes only the keyboard sheet");
  // layout: full = the universal-remote-card rows; explicit rows win over layout.
  const lay2 = await page.evaluate(() => {
    const keys = cfg => { const e = document.createElement("jam-remote"); e.setConfig({type: "custom:jam-remote", entity: "remote.living_room_phoster_android_tv", ...cfg});
      e.hass = window.__hass; return [...e.shadowRoot.querySelectorAll("button[data-key]")].map(b => b.dataset.key).join(","); };
    return {full: keys({layout: "full"}), rows: keys({layout: "full", rows: [["home"]]}), rocker: keys({rows: [["rocker"]]})};
  });
  check(lay2.full === "power,back,home,settings,tv,vol_down,vol_up,up,left,ok,right,down,prev,play_pause,next,keyboard,captions,audio_track,source" && lay2.rows === "home" && lay2.rocker === "vol_down,mute,vol_up",
    `jam-remote layout full rows; rows override layout (${lay2.rows}); row token rocker (${lay2.rocker})`);
  const remHead = await rem.evaluate(r => r.shadowRoot.querySelectorAll(".wrap > .label, .title").length);
  check(remHead === 0 && await rem.evaluate(r => r._config.hide_title === true), `jam-tv: the jam-remote in the sheet hides its own name/title (${remHead})`);
  for (const w of [360, 390]) {
    await page.setViewportSize({width: w, height: 844}); await page.waitForTimeout(60);
    const broken = await rem.evaluate(r => [...r.shadowRoot.querySelectorAll(".row .key")].filter(b => {
      const f = b.firstChild, t = f.querySelector(".lb") || f, lh = parseFloat(getComputedStyle(t).lineHeight) || 12;
      const rg = document.createRange(); rg.selectNodeContents(t);
      const lines = new Set([...rg.getClientRects()].map(x => Math.round(x.top))).size;
      return f.scrollWidth > f.clientWidth + 1 || (t.textContent.split(/\s+/).length === 1 && lines > 1) || (t !== f && t.getBoundingClientRect().height > lh * 1.5 && t.textContent.split(/\s+/).length === 1);
    }).map(b => b.textContent));
    check(broken.length === 0, `jam-tv remote sheet ${w}px: row key labels fit, no mid-word breaks (${broken.join(", ") || "ok"})`);
  }
  await page.setViewportSize({width: 1280, height: 900});
  const defCfg = await page.evaluate(() => {
    const mk = extra => { const t = document.createElement("jam-tv");
      t.setConfig({type: "custom:jam-tv", media_player: "media_player.living_room_phoster_android_tv", remote: "remote.living_room_phoster_android_tv", ...extra}); return t._remoteCfg(); };
    const a = mk({}), b = mk({remote_card: {layout: "full"}});
    return {secs: a.sections.map(s => s.title + ":" + s.accent).join(","), full: !b.sections && b.layout};
  });
  check(defCfg.secs === "TV:teal" && defCfg.full === "full", `jam-tv: no stereo -> TV group only (teal); remote_card layout replaces the groups (${defCfg.secs} / ${defCfg.full})`);
  const alias = await page.evaluate(() => { const t = document.createElement("jam-tv");
    t.setConfig({type: "custom:jam-tv", media_player: "media_player.preview_tv_off", launchers: [{name: "Old", color: "pink"}]}); t.hass = window.__hass;
    return [...t.shadowRoot.querySelectorAll(".src .tile")].map(b => b.dataset.app).join(","); });
  check(alias === "Old", `jam-tv: launchers still work as an alias of sources (${alias})`);
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
    await page.setViewportSize({width: 390, height: 1800}); await page.waitForTimeout(260);
    await page.screenshot({path: path.join(process.env.JAM_SHOTS, "tv-remote-sheet-tall-390.png")});
    await page.setViewportSize({width: 390, height: 844});
    await page.keyboard.press("Escape");
    await tv.scrollIntoViewIfNeeded();
    await page.locator("#view > .sec", {has: page.locator("jam-tv")}).first().screenshot({path: path.join(process.env.JAM_SHOTS, "watch-play-390.png")});
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
  const fan = page.locator("jam-fan").first(), FID = "fan.vital_200s_series";
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
  const pres = await page.evaluate(() => [undefined, false, []].map(p => { const e = document.createElement("jam-fan");
    e.setConfig({type: "custom:jam-fan", entity: "fan.vital_200s_series", ...(p === undefined ? {} : {presets: p})}); e.hass = window.__hass;
    return e.shadowRoot.querySelectorAll("[data-preset]").length; }));
  check(pres.join(",") === "3,0,0", `jam-fan: presets default 3 chips; false / [] hide them (${pres})`);
  await push(FID, {state: "unavailable"});
  check(await fan.locator("button:not([disabled])").count() === 0, "jam-fan: unavailable disables every control");
  await push(FID, {state: "on", attributes: {preset_mode: null}});

  // Per-source exact (0.3.8): match.app "YouTube" with exact: true marks only an exact app name, not "YouTube Music" /
  // "YouTube TV"; without exact the substring match stays (default false). Read from the open Source sheet.
  const ex = await page.evaluate(async () => {
    const h = window.__hass, out = {};
    const yt = exact => ({name: "YouTube", color: "red", ...(exact === undefined ? {} : {exact}), match: {app: ["YouTube", "com.google.android.youtube.tv"]}});
    for (const exact of [true, undefined]) {
      const e = document.createElement("jam-tv");
      e.setConfig({type: "custom:jam-tv", media_player: "media_player.preview_tv_idle", current_app_entity: "sensor.x_tv_app",
        sources: [yt(exact), {name: "Jamfin", match: {app: "Jamfin"}}]});
      document.body.append(e);
      e.hass = h;
      e.shadowRoot.querySelector('.seg button[data-key="source"]').click();
      const lit = app => {
        e.hass = {...h, states: {...h.states, "sensor.x_tv_app": {entity_id: "sensor.x_tv_app", state: app, attributes: {}, last_updated: app}}};
        const hosts = document.querySelectorAll(".jam-sheet-host"), on = hosts.length && hosts[hosts.length - 1].shadowRoot.querySelector(".tile.cur");
        return on ? on.dataset.app : "-";
      };
      out[exact ? "exact" : "loose"] = ["YouTube", "com.google.android.youtube.tv", "YouTube Music", "YouTube TV", "Jamfin"].map(lit).join(",");
      e.remove(); // disconnect closes the open Source sheet
      out.left = (out.left || 0) + document.querySelectorAll(".jam-sheet-host").length;
    }
    return out;
  });
  check(ex.exact === "YouTube,YouTube,-,-,Jamfin" && ex.loose === "YouTube,YouTube,YouTube,YouTube,Jamfin" && ex.left === 0,
    `jam-tv: source exact: true marks YouTube only for YouTube / its package, not YouTube Music / TV (${ex.exact}); default substring (${ex.loose}); removing the card closes its Source sheet (${ex.left} left)`);
  // Without a remote: no Remote tab, no Home screen tile; no sources either -> no tabs at all.
  const bare = await page.evaluate(() => {
    const mk = cfg => { const e = document.createElement("jam-tv"); e.setConfig({type: "custom:jam-tv", media_player: "media_player.preview_tv_idle", ...cfg}); e.hass = window.__hass; return e; };
    const a = mk({sources: [{name: "A"}]}), b = mk({});
    return {a: [...a.shadowRoot.querySelectorAll(".seg button")].map(x => x.dataset.key).join(","), b: b.shadowRoot.querySelectorAll(".seg").length, home: !!a._homeRun()};
  });
  check(bare.a === "source" && bare.b === 0 && !bare.home, `jam-tv: without a remote only the Source tab (${bare.a}), no Home screen tile; nothing to open -> no tab row (${bare.b})`);
  // Narrow card (280 px): a long kicker (the TV's friendly name while no app is known) wraps at word boundaries (no ellipsis), above the title without overlap, inside the poster.
  const narrowAt = fname => page.evaluate(fname => {
    const h = window.__hass, e = document.createElement("jam-tv");
    e.setConfig({type: "custom:jam-tv", media_player: "media_player.x_narrow_tv"});
    e.style.cssText = "display:block;width:280px";
    e.hass = {...h, states: {...h.states, "media_player.x_narrow_tv": {entity_id: "media_player.x_narrow_tv", state: "playing", last_updated: "n",
      attributes: {friendly_name: fname, media_title: "Close Encounters of the Third Kind",
        media_position: 60, media_duration: 600}}}};
    document.body.append(e);
    const p = e.shadowRoot.querySelector(".poster"), k = p.querySelector(".kick"), t = p.querySelector(".title");
    const cs = getComputedStyle(k), lh = parseFloat(cs.lineHeight), kb = k.getBoundingClientRect(), tb = t.getBoundingClientRect(),
      pb = p.getBoundingClientRect(), xb = p.querySelector(".band").getBoundingClientRect();
    const out = {text: k.textContent, w: Math.round(pb.width), ell: cs.textOverflow, ws: cs.whiteSpace, lines: Math.round(kb.height / lh),
      over: kb.bottom > tb.top + 0.5, inside: xb.top >= pb.top - 0.5 && xb.bottom <= pb.bottom + 0.5, clipped: k.scrollWidth > k.clientWidth + 1};
    e.remove(); return out;
  }, fname);
  const narrow = await narrowAt("Living Room Phoster Android TV");
  check(narrow.w <= 282 && narrow.ell !== "ellipsis" && narrow.ws === "normal" && !narrow.clipped && narrow.lines >= 2 && !narrow.over && narrow.inside,
    `jam-tv: ${narrow.w}px poster kicker "${narrow.text}" wraps to ${narrow.lines} lines, no ellipsis (${narrow.ell}/${narrow.ws}), not clipped, no title overlap (${narrow.over}), text inside poster (${narrow.inside})`);
  // 0.3.9: a kicker that needs a third line is clamped at 2 lines (ellipsis only at the end of line 2); the text block stays inside the poster.
  const n3 = await narrowAt("Upstairs Living Room Phoster Android Television Projector Corner Unit");
  check(n3.lines === 2 && n3.ell !== "ellipsis" && !n3.over && n3.inside,
    `jam-tv: 280px kicker needing 3 lines is clamped to ${n3.lines}, no title overlap (${n3.over}), text inside poster (${n3.inside})`);

  await page.evaluate(() => { const h = window.__hass; h.callService = h.__orig; delete h.__orig; });
};
