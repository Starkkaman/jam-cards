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

  const tv = page.locator("jam-tv").nth(0), idle = page.locator("jam-tv").nth(1), offc = page.locator("jam-tv").nth(2);
  const mode = loc => loc.locator(".paper[data-mode]").first().getAttribute("data-mode");
  const tab = loc => loc.locator(".paper[data-tab]").first().getAttribute("data-tab");
  const tok = v => page.evaluate(v => { const p = document.createElement("span"); p.style.color = `var(${v})`; document.body.append(p); const c = getComputedStyle(p).color; p.remove(); return c; }, v);
  const [RED, OCHRE, VIOLET, PINK, TEAL, INK, FG, SLAB2] = await Promise.all(["--jam-red", "--jam-ochre", "--jam-violet", "--jam-pink", "--jam-teal", "--jam-on-fg", "--jam-fg", "--jam-slab2"].map(tok));
  const bg = loc => loc.evaluate(e => getComputedStyle(e).backgroundColor);

  // Playing: poster (118px, 16px bottom-right cut), kicker = app, title, sub = position / duration, progress strip.
  check(await mode(tv) === "playing" && await tab(tv) === "now", "jam-tv: playing -> playing layout, Now playing tab by default");
  const po = tv.locator(".poster");
  const pg = await po.evaluate(p => ({cut: p.dataset.cut, h: Math.round(p.getBoundingClientRect().height), clip: getComputedStyle(p).getPropertyValue("--clip"),
    kick: p.querySelector(".kick").textContent, title: p.querySelector(".title").textContent, sub: p.querySelector(".sub").textContent,
    prog: p.querySelector(".prog i") ? p.querySelector(".prog i").style.width : null, bars: !!p.querySelector(".arm"), bg: getComputedStyle(p.querySelector(".face")).backgroundColor}));
  check(pg.h === 118 && /100% - 16px/.test(pg.clip) && pg.cut === "poster", `jam-tv: poster 118px with a 16px cut (${pg.h}, ${pg.clip})`);
  check(pg.kick === "Jellyfin" && pg.title === "Close Encounters of the Third Kind" && pg.sub === "1:12 / 2:17", `jam-tv: poster kicker / title / sub (${pg.kick} | ${pg.title} | ${pg.sub})`);
  check(pg.prog === "52.6%" && pg.bars && pg.bg === OCHRE, `jam-tv: progress strip ${pg.prog}; no art -> accent poster + Golden Arm bars (${pg.bg})`);
  const pwOn = await tv.locator("button.pw").evaluate(b => ({bg: getComputedStyle(b).backgroundColor, w: b.getBoundingClientRect().width, clip: getComputedStyle(b).clipPath}));
  check(pwOn.bg === INK && pwOn.w === 44 && /polygon/.test(pwOn.clip), `jam-tv: power triangle 44px, ink when on (${pwOn.bg})`);
  const pk = await tv.locator(".pane .keys").first().locator("button").evaluateAll(bs => bs.map(b => b.dataset.key + (b.classList.contains("on") ? "*" : "")));
  check(pk.join(",") === "prev,play_pause*,next,remote", `jam-tv: row 1 Prev / Play-Pause (accent) / Next / Remote (${pk})`);
  const vk = await tv.locator(".pane .keys").nth(1).locator("button").evaluateAll(bs => bs.map(b => b.dataset.key));
  check(vk.join(",") === "vol_down,mute,vol_up", `jam-tv: row 2 Vol − / Mute / Vol + (${vk})`);
  check(await tv.locator('button[data-key="stereo"]').count() === 0 && await tv.locator(".apps").count() === 0, "jam-tv: no Stereo key, no old launcher layout");
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

  // Switch: Source tab = 3-up tiles; the user's choice survives state updates while on.
  await tv.locator('.seg button[data-tab="source"]').click();
  check(await tab(tv) === "source", "jam-tv: Source tab opens the source grid");
  const tiles = tv.locator(".src button");
  check(await tiles.count() === 6, "jam-tv: 6 source tiles");
  const ty = await tiles.evaluateAll(bs => bs.map(b => Math.round(b.getBoundingClientRect().top)));
  check(ty.slice(0, 3).every(y => y === ty[0]) && ty[3] > ty[0], `jam-tv: sources 3-up (${ty.join(",")})`);
  const onNow = () => tv.locator(".src button.on").evaluateAll(bs => bs.map(b => b.dataset.app + (b.classList.contains("jam-stamp") ? "*" : "")).join(","));
  const APP = "sensor.preview_tv_current_app", INP = "select.hisense_tv_input";
  check(await onNow() === "", "jam-tv: current_app \"HDMI 2\" (Projectivy home) + stale input -> no source filled");
  await push(TV, {attributes: {media_position: 4400}});
  check(await tab(tv) === "source", "jam-tv: tab choice kept across state updates");
  // 0.3.5: highlight only from live signals; select states and tap options never light a tile.
  await push("select.hisense_tv_launch_app", {state: "HDMI 2"});
  check(await onNow() === "", `jam-tv: launch_app select "HDMI 2" alone lights nothing (${await onNow()})`);
  await push(TV, {attributes: {app_name: "YouTube"}});
  check(await onNow() === "", "jam-tv: media_player app_name is not a highlight signal");
  await push(TV, {attributes: {app_name: "Jellyfin"}});
  await push(APP, {state: "com.google.android.apps.tv.dreamx"});
  check(await onNow() === "", "jam-tv: screensaver (dreamx) -> no source filled");
  await push(APP, {state: "Dropout"});
  let on = await onNow();
  const onBg = await bg(tv.locator(".src button.on > .face"));
  check(on === "Dropout*" && onBg === PINK, `jam-tv: current_app "Dropout" fills the Dropout tile pink, stamped once (${on} ${onBg})`);
  await push(TV, {attributes: {media_position: 4410}});
  check(await onNow() === "Dropout", "jam-tv: a plain update keeps the tile filled without a new stamp");
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
  check(await onNow() === "", "jam-tv: back on the home screen -> no source filled although the input select still says HDMI 1");
  await push(INP, {state: "Switch 2"});
  // Source tap actions.
  for (const [n, ent, opt] of [["Switch", "select.hisense_tv_input", "HDMI 1"], ["Nerv//OS", "select.hisense_tv_launch_app", "HDMI 2"], ["Corridor Digital", "select.hisense_tv_launch_app", "Corridor TV"]]) {
    await reset(); await tiles.filter({hasText: n}).click();
    c = await callsNow();
    check(c.length === 1 && c[0].domain === "select" && c[0].service === "select_option" && c[0].target.entity_id === ent && c[0].data.option === opt, `jam-tv: ${n} tile selects ${ent} ${opt}`);
  }
  const sq = await tiles.first().locator(".sq").evaluate(e => getComputedStyle(e).backgroundColor);
  check(sq === TEAL, `jam-tv: source colour square is a flat jam colour (Nerv//OS teal ${sq})`);
  await tv.locator('.seg button[data-tab="now"]').click();

  // Idle (on, no title): poster names the app; default tab Now playing.
  check(await mode(idle) === "idle" && await tab(idle) === "now" && (await idle.locator(".title").textContent()) === "Home", "jam-tv: idle -> poster title = app (Home), Now playing tab");
  // Off: slab2 poster, TV off, red power, Source tab by default, custom label.
  check(await mode(offc) === "off" && await tab(offc) === "source", "jam-tv: off -> Source tab by default");
  const og = await offc.locator(".poster").evaluate(p => ({bg: getComputedStyle(p.querySelector(".face")).backgroundColor, t: p.querySelector(".title").textContent,
    s: p.querySelector(".sub").textContent, pw: getComputedStyle(p.querySelector(".pw")).backgroundColor, pwc: getComputedStyle(p.querySelector(".pw")).color}));
  check(og.bg === SLAB2 && og.t === "TV off" && og.s === "Pick a source to start", `jam-tv: off poster slab2, "TV off", "Pick a source to start" (${og.bg})`);
  check(og.pw === RED && og.pwc === INK, `jam-tv: power is red with an ink glyph when off (${og.pw} / ${og.pwc})`);
  check((await offc.locator('.seg button[data-tab="source"]').textContent()) === "Watch" && (await tv.locator('.seg button[data-tab="source"]').textContent()) === "Source",
    "jam-tv: source_label renames the switch (default Source)");
  check(await offc.locator(".src button.on").count() === 0, "jam-tv: off -> no source filled");
  // Memory: choose Now playing while off, turn on (kept), choose Source, turn off -> reset to default (Source), turn on -> Now playing.
  await offc.locator('.seg button[data-tab="now"]').click();
  check(await tab(offc) === "now" && await offc.locator('button[data-key="prev"]').isDisabled(), "jam-tv: Now playing while off: transport disabled");
  await push("media_player.preview_tv_off", {state: "on"});
  check(await tab(offc) === "now", "jam-tv: choice kept off -> on");
  await offc.locator('.seg button[data-tab="source"]').click();
  await push("media_player.preview_tv_off", {state: "off"});
  check(await tab(offc) === "source", "jam-tv: on -> off resets to the default (Source)");
  await push("media_player.preview_tv_off", {state: "on"});
  check(await tab(offc) === "now", "jam-tv: then on -> default Now playing");
  await push("media_player.preview_tv_off", {state: "off"});
  // Idle -> playing when a title arrives; package id shown as YouTube.
  await push("media_player.preview_tv_idle", {attributes: {media_title: "Lobby", app_id: "com.google.android.youtube.tv", app_name: "com.google.android.youtube.tv"}});
  check(await mode(idle) === "playing" && (await idle.locator(".kick").textContent()) === "YouTube", "jam-tv: idle -> playing when a title arrives (package id shown as YouTube)");
  await push("media_player.preview_tv_idle", {attributes: {media_title: null, app_id: "com.spocky.projengmenu", app_name: null}});
  // Art: image cover, text colour by luminance (light art -> ink text), busy -> ink band.
  const svg = col => "data:image/svg+xml," + encodeURIComponent(`<svg xmlns='http://www.w3.org/2000/svg' width='40' height='40'><rect width='40' height='40' fill='${col}'/></svg>`);
  await push(TV, {attributes: {entity_picture: svg("#f4f0e0")}});
  await page.waitForTimeout(150);
  const art1 = await po.evaluate(p => ({img: !!p.querySelector("img"), cls: p.className, fg: getComputedStyle(p.querySelector(".face")).color, fit: getComputedStyle(p.querySelector("img")).objectFit, bars: !!p.querySelector(".arm")}));
  check(art1.img && art1.fit === "cover" && !art1.bars && /light/.test(art1.cls) && art1.fg === INK, `jam-tv: light art -> cover image, ink text (${art1.cls} ${art1.fg})`);
  await push(TV, {attributes: {entity_picture: svg("#101418")}});
  await page.waitForTimeout(150);
  const art2 = await po.evaluate(p => ({cls: p.className, band: getComputedStyle(p.querySelector(".txt")).backgroundColor}));
  check(/dark/.test(art2.cls) && /rgba?\(0, 0, 0, 0\)|transparent/.test(art2.band), `jam-tv: dark art -> paper text, no band (${art2.cls})`);
  const busy = "data:image/svg+xml," + encodeURIComponent("<svg xmlns='http://www.w3.org/2000/svg' width='40' height='40'>" +
    Array.from({length: 64}, (_, i) => `<rect x='${(i % 8) * 5}' y='${Math.floor(i / 8) * 5}' width='5' height='5' fill='${(i + Math.floor(i / 8)) % 2 ? "#fff" : "#000"}'/>`).join("") + "</svg>");
  await push(TV, {attributes: {entity_picture: busy}});
  await page.waitForTimeout(150);
  const art3 = await po.evaluate(p => ({cls: p.className, band: getComputedStyle(p.querySelector(".txt")).backgroundColor}));
  check(/busy/.test(art3.cls) && /0\.5\)|\/ 0\.5\)/.test(art3.band), `jam-tv: busy art -> flat 50% ink band behind the text (${art3.band})`);
  if (process.env.JAM_SHOTS) {
    await page.setViewportSize({width: 390, height: 844});
    await tv.scrollIntoViewIfNeeded();
    await tv.screenshot({path: path.join(process.env.JAM_SHOTS, "tv-art-busy-390.png")});
    await push(TV, {attributes: {entity_picture: svg("#c43a2a")}});
    await page.waitForTimeout(150);
    await tv.screenshot({path: path.join(process.env.JAM_SHOTS, "tv-art-390.png")});
    await page.setViewportSize({width: 1280, height: 900});
  }
  await push(TV, {attributes: {entity_picture: null}});

  // Remote sheet: keyboard glyph in the header, TV + Stereo sections.
  await tv.locator('button[data-key="remote"]').click();
  const sheet = page.locator(".jam-sheet-host .pop");
  check(await sheet.count() === 1 && (await sheet.locator("h2").textContent()) === "Remote" && await sheet.locator('.paper[data-cut="sheet"]').count() === 1,
    "jam-tv: Remote opens a sheet (sheet cut)");
  const rem = sheet.locator("jam-remote");
  check(await rem.count() === 1 && await rem.evaluate(r => !!r.hass && r.hass.states !== undefined), "jam-tv: the sheet holds a jam-remote with hass");
  const kbk = sheet.locator('.head .acts button[data-key="keyboard"]');
  const kh = await sheet.locator(".head .acts").evaluate(a => { const [k, cl] = a.querySelectorAll("button");
    return {k: Math.round(k.getBoundingClientRect().height), c: Math.round(cl.getBoundingClientRect().height), order: k.nextElementSibling === cl, svg: !!k.querySelector("svg rect"),
      txt: k.textContent.trim(), aria: k.getAttribute("aria-label"), fg: getComputedStyle(k.firstChild).color, bg: getComputedStyle(k.firstChild).backgroundColor,
      rx: [...k.querySelectorAll("rect")].some(r => r.getAttribute("rx"))}; });
  check(await kbk.count() === 1 && kh.order && kh.k === kh.c && kh.svg && !kh.txt && kh.aria === "Keyboard" && !kh.rx,
    `jam-tv: keyboard glyph key in the sheet header left of Close, same height (${kh.k}/${kh.c}), aria-label Keyboard`);
  check(kh.fg === OCHRE, `jam-tv: keyboard glyph in the TV accent (${kh.fg} on ${kh.bg})`);
  const secs = await rem.evaluate(r => [...r.shadowRoot.querySelectorAll(".sec")].map(s => ({t: s.dataset.section, rule: getComputedStyle(s.querySelector(".rule")).backgroundColor,
    rh: s.querySelector(".rule").getBoundingClientRect().height, kick: s.querySelector(".label").textContent,
    keys: [...s.querySelectorAll("button[data-key]")].map(b => b.dataset.key + (b.classList.contains("alert") ? "!" : b.classList.contains("on") ? "*" : "")).join(","),
    labels: [...s.querySelectorAll(".row button")].map(b => b.textContent).join("/"),
    ok: s.querySelector(".ok > .face") ? getComputedStyle(s.querySelector(".ok > .face")).backgroundColor : null,
    face: getComputedStyle(s.querySelector(".face")).backgroundColor, key: getComputedStyle(s.querySelector(".row .key > .face")).backgroundColor})));
  const [S1, S2] = secs;
  check(secs.length === 2 && S1.t === "TV" && S2.t === "Stereo" && S1.kick === "TV" && S2.kick === "Stereo" && S1.rh === 5 && S2.rh === 5, `jam-tv: remote sheet has TV + Stereo sections with 5px rules (${secs.map(s => s.t)})`);
  check(S1.keys === "power!,back,home,settings,up,left,ok,right,down,prev,play_pause,next,captions,audio_track,source", `jam-tv: TV section keys (${S1.keys})`);
  check(S1.labels.startsWith("Power/Back/Home/Settings/Prev/Play/Next/Subs/Audio/Input"), `jam-tv: TV labels incl. Subs / Audio / Input (${S1.labels})`);
  check(S1.rule === OCHRE && S1.ok === OCHRE && S2.rule === VIOLET, `jam-tv: TV accent ochre (rule + OK), Stereo violet (${S1.rule} ${S1.ok} ${S2.rule})`);
  check(S2.keys === "power!,input_0*,input_1,input_2,vol_down,mute,vol_up" && S2.labels === "Power/TV/Turntable/Music sync/Vol −/Mute/Vol +", `jam-tv: Stereo section Power / inputs (TV active) / volume (${S2.keys} ${S2.labels})`);
  check(S1.face !== S1.key, `jam-tv: section face and its keys are different surfaces (${S1.face} / ${S1.key})`);
  const actBg = await rem.evaluate(r => getComputedStyle(r.shadowRoot.querySelector('.sec[data-section="Stereo"] button[data-key="input_0"] > .face')).backgroundColor);
  check(actBg === VIOLET, `jam-tv: active stereo input filled violet (${actBg})`);
  await push("input_select.preview_stereo_source", {state: "BLUETOOTH"});
  const act2 = await rem.evaluate(r => [...r.shadowRoot.querySelectorAll('.sec[data-section="Stereo"] button.on')].map(b => b.dataset.key).join(","));
  check(act2 === "input_2", `jam-tv: input_entity BLUETOOTH -> Music sync active via match (${act2})`);
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
  for (const [k, cmd] of [["captions", "CAPTIONS"], ["audio_track", "MEDIA_AUDIO_TRACK"], ["source", "TV_INPUT"], ["prev", "MEDIA_PREVIOUS"], ["back", "BACK"]]) {
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
  const lay = await page.evaluate(() => {
    const keys = cfg => { const e = document.createElement("jam-remote"); e.setConfig({type: "custom:jam-remote", entity: "remote.living_room_phoster_android_tv", ...cfg});
      e.hass = window.__hass; return [...e.shadowRoot.querySelectorAll("button[data-key]")].map(b => b.dataset.key).join(","); };
    return {full: keys({layout: "full"}), rows: keys({layout: "full", rows: [["home"]]})};
  });
  check(lay.full === "power,back,home,settings,tv,vol_down,vol_up,up,left,ok,right,down,prev,play_pause,next,keyboard,captions,audio_track,source" && lay.rows === "home",
    `jam-remote layout full rows; rows override layout (${lay.rows})`);
  const remHead = await rem.evaluate(r => r.shadowRoot.querySelectorAll(".wrap > .label, .title").length);
  check(remHead === 0 && await rem.evaluate(r => r._config.hide_title === true), `jam-tv: the jam-remote in the sheet hides its own name/title (${remHead})`);
  for (const w of [360, 390]) {
    await page.setViewportSize({width: w, height: 844}); await page.waitForTimeout(60);
    const broken = await rem.evaluate(r => [...r.shadowRoot.querySelectorAll(".row .key")].filter(b => {
      const f = b.firstChild, lh = parseFloat(getComputedStyle(f).lineHeight) || 12, pad = parseFloat(getComputedStyle(f).paddingTop) + parseFloat(getComputedStyle(f).paddingBottom) + 4;
      const words = f.textContent.split(/\s+/).length;
      return f.scrollWidth > f.clientWidth + 1 || (words === 1 && f.getBoundingClientRect().height - pad > lh * 1.5 && f.scrollHeight > 0 && (() => { const rg = document.createRange(); rg.selectNodeContents(f); return rg.getClientRects().length > 1; })());
    }).map(b => b.textContent));
    check(broken.length === 0, `jam-tv remote sheet ${w}px: row key labels fit, no mid-word breaks (${broken.join(", ") || "ok"})`);
  }
  await page.setViewportSize({width: 1280, height: 900});
  const defCfg = await page.evaluate(() => {
    const mk = extra => { const t = document.createElement("jam-tv");
      t.setConfig({type: "custom:jam-tv", media_player: "media_player.living_room_phoster_android_tv", remote: "remote.living_room_phoster_android_tv", ...extra}); return t._remoteCfg(); };
    const a = mk({}), b = mk({remote_card: {layout: "full"}});
    return {secs: a.sections.map(s => s.title).join(","), full: !b.sections && b.layout};
  });
  check(defCfg.secs === "TV" && defCfg.full === "full", `jam-tv: no stereo -> TV section only; remote_card layout replaces the sections (${defCfg.secs} / ${defCfg.full})`);
  const alias = await page.evaluate(() => { const t = document.createElement("jam-tv");
    t.setConfig({type: "custom:jam-tv", media_player: "media_player.preview_tv_off", launchers: [{name: "Old", color: "pink"}]}); t.hass = window.__hass;
    return [...t.shadowRoot.querySelectorAll(".src button")].map(b => b.dataset.app).join(","); });
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
  check(await fan.locator('button[data-key="power"]').evaluate(b => b.classList.contains("pw") && b.getAttribute("aria-pressed") === "true"), "jam-fan: power corner (round 3) pressed while on");
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
  check((await callsNow()).some(x => x.service === "turn_off" && x.data.entity_id === FID), "jam-fan: power corner turns the fan off");
  const pres = await page.evaluate(() => [undefined, false, []].map(p => { const e = document.createElement("jam-fan");
    e.setConfig({type: "custom:jam-fan", entity: "fan.vital_200s_series", ...(p === undefined ? {} : {presets: p})}); e.hass = window.__hass;
    return e.shadowRoot.querySelectorAll("[data-preset]").length; }));
  check(pres.join(",") === "3,0,0", `jam-fan: presets default 3 chips; false / [] hide them (${pres})`);
  await push(FID, {state: "unavailable"});
  check(await fan.locator("button:not([disabled])").count() === 0, "jam-fan: unavailable disables every control");
  await push(FID, {state: "on", attributes: {preset_mode: null}});

  // Per-source exact (0.3.8): match.app "YouTube" with exact: true lights only for an exact app name, not "YouTube Music" /
  // "YouTube TV"; without exact the substring match stays (default false).
  const ex = await page.evaluate(() => {
    const h = window.__hass, out = {};
    const yt = exact => ({name: "YouTube", color: "red", ...(exact === undefined ? {} : {exact}), match: {app: ["YouTube", "com.google.android.youtube.tv"]}});
    for (const exact of [true, undefined]) {
      const e = document.createElement("jam-tv");
      e.setConfig({type: "custom:jam-tv", media_player: "media_player.preview_tv_idle", current_app_entity: "sensor.x_tv_app",
        sources: [yt(exact), {name: "Jamfin", match: {app: "Jamfin"}}]});
      document.body.append(e);
      const lit = app => {
        e.hass = {...h, states: {...h.states, "sensor.x_tv_app": {entity_id: "sensor.x_tv_app", state: app, attributes: {}, last_updated: app}}};
        e.shadowRoot.querySelector('.seg button[data-tab="source"]').click();
        const on = e.shadowRoot.querySelector(".src .key.on");
        return on ? on.dataset.app : "-";
      };
      out[exact ? "exact" : "loose"] = ["YouTube", "com.google.android.youtube.tv", "YouTube Music", "YouTube TV", "Jamfin"].map(lit).join(",");
      e.remove();
    }
    return out;
  });
  check(ex.exact === "YouTube,YouTube,-,-,Jamfin" && ex.loose === "YouTube,YouTube,YouTube,YouTube,Jamfin",
    `jam-tv: source exact: true lights YouTube only for YouTube / its package, not YouTube Music / TV (${ex.exact}); default substring (${ex.loose})`);
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
      pb = p.getBoundingClientRect(), xb = p.querySelector(".txt").getBoundingClientRect();
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
