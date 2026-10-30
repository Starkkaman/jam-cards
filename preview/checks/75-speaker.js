// jam-speaker interactions (fixture preview/fixtures/75-speaker.js), round 3: ink title band (source dot + "Room · source",
// title, artist, 32px Shuffle / Favourite), power corner, poster art / Golden Arm bars / seeded cut-paper idle art, progress
// strip, transport + volume, and panel B (mini header, tabs Pinned / Recent / Playlists / Albums / Search over fake Music
// Assistant responses, Play = music_assistant.play_media, pin / unpin = jam_pins user data, Speakers grouping view, docked
// player, error + empty states).
// Writes preview/shots/speaker-panel-{pinned,recent,search,speakers}-dark-1280.png; with JAM_SHOTS=<dir> also 390 px
// card shots speaker-{kitchen,living,phoster,ma}-390.png.
// Contract: module.exports = async (page, check, helpers) => {}; runs on the dark/1280 preview page, files in name order.
const path = require("path");
module.exports = async (page, check, {callsNow}) => {
  const K = "media_player.preview_spk_kitchen", L = "media_player.preview_spk_living", P = "media_player.preview_spk_phoster";
  const MA = "media_player.preview_spk_ma", TV = "media_player.preview_spk_tv", H = "media_player.preview_spk_house";
  const shots = path.join(__dirname, "..", "shots");
  const reset = () => page.evaluate(() => { window.__calls.length = 0; });
  const push = (id, patch) => page.evaluate(([id, patch]) => {
    const h = window.__hass, s = h.states[id];
    h.states[id] = {...s, ...patch, attributes: {...s.attributes, ...(patch.attributes || {})}, last_updated: "p" + Math.random()};
    const nh = {...h};
    for (const e of document.querySelectorAll("jam-speaker")) e.hass = nh;
  }, [id, patch]);
  await page.evaluate(() => { for (const e of document.querySelectorAll("#view jam-speaker")) e.dataset.e = e._config.entity; });
  const card = id => page.locator(`#view jam-speaker[data-e="${id}"]`);
  const tok = v => page.evaluate(v => { const p = document.createElement("span"); p.style.color = v.startsWith("#") ? v : `var(${v})`; document.body.append(p); const c = getComputedStyle(p).color; p.remove(); return c; }, v);
  const [VIOLET, TEAL, DIM, INK, PINK, SPOT] = await Promise.all(["--jam-violet", "--jam-teal", "--jam-dim", "--jam-ink", "--jam-pink", "#1db954"].map(tok));

  // ---------- card ----------
  const info = id => card(id).evaluate(e => {
    const r = e.shadowRoot, p = r.querySelector(".poster"), band = p.querySelector(".band"), kk = band.querySelector(".kk");
    const box = x => { const b = x.getBoundingClientRect(); return {w: Math.round(b.width), h: Math.round(b.height), l: Math.round(b.left), t: Math.round(b.top), r: Math.round(b.right), b: Math.round(b.bottom)}; };
    const pw = p.querySelector(".pw"), abs = p.querySelector(".abs"), pg = p.querySelector(".pg");
    return {word: kk.dataset.badge, kick: kk.textContent, dot: getComputedStyle(kk.querySelector("i")).backgroundColor,
      title: band.querySelector(".title").textContent, sub: (band.querySelector(".ss") || {}).textContent || null, bandBg: getComputedStyle(band).backgroundColor,
      ph: box(p).h, poster: box(p), pw: pw ? {...box(pw), bg: getComputedStyle(pw, "::before").backgroundColor, fg: getComputedStyle(pw).color, label: pw.getAttribute("aria-label")} : null,
      img: !!p.querySelector("img"), bars: !!p.querySelector(".arm"), abs: abs ? {bg: abs.style.background, n: abs.children.length, sig: abs.innerHTML} : null,
      face: getComputedStyle(p.querySelector(".face")).backgroundColor, pg: pg ? parseFloat(pg.style.width) : null,
      bk: [...band.querySelectorAll(".bk button")].map(k => ({key: k.dataset.key, on: k.getAttribute("aria-pressed"), w: Math.round(k.getBoundingClientRect().width), h: Math.round(k.getBoundingClientRect().height), dis: k.disabled})),
      keys: [...r.querySelectorAll(".keys button")].map(k => k.dataset.key + (k.classList.contains("main") ? "*" : "")),
      keyH: [...r.querySelectorAll(".keys button")].map(k => Math.round(k.getBoundingClientRect().height)),
      playBg: getComputedStyle(r.querySelector('.keys [data-key="play_pause"] > .face')).backgroundColor,
      vol: Math.round(r.querySelector(".vol .vt").getBoundingClientRect().height), seg: !!r.querySelector(".seg")};
  });
  const want = [[K, "Spotify Connect", SPOT, "Kitchen · Spotify Connect"], [L, "Idle", DIM, "Living room · Idle"], [P, "Grouped", TEAL, "Phoster · Grouped"],
    [MA, "Music Assistant", VIOLET, "Office · Music Assistant"], ["media_player.preview_spk_paused", "Paused", DIM, "Porch · Paused"], [TV, "TV", VIOLET, "Den · TV"], [H, "Idle", DIM, "House · Idle"]];
  for (const [id, word, col, kick] of want) {
    const i = await info(id);
    check(i.word === word && i.dot === col && i.kick === kick && i.bandBg === INK, `jam-speaker: ${id.slice(25)} band kicker "${i.kick}", dot ${i.dot}, ink band (${i.bandBg})`);
  }
  const k = await info(K);
  check(k.ph === 178 && k.img && !k.abs && k.title === "Lobby" && k.sub === "AERwave" && k.pg > 33 && k.pg < 37,
    `jam-speaker: playing poster 178px with artwork, title / artist on the band, progress strip ${k.pg}% (${k.ph}px, ${k.title} | ${k.sub})`);
  check(JSON.stringify(k.bk.map(b => b.key + ":" + b.on)) === JSON.stringify(["shuffle:true", "favorite:false"]) && k.bk.every(b => b.w === 32 && b.h === 32 && !b.dis),
    `jam-speaker: 32px Shuffle (on) + Favourite keys at the right of the band (${JSON.stringify(k.bk)})`);
  check(k.pw && k.pw.w === 46 && k.pw.h === 46 && k.pw.r === k.poster.r && k.pw.t === k.poster.t && k.pw.bg === INK && k.pw.fg === VIOLET,
    `jam-speaker: power corner 46px top-right, ink with a violet glyph (${JSON.stringify(k.pw)})`);
  check(k.keys.join(",") === "prev,play_pause*,next" && k.keyH.every(h => h === 60) && k.playBg === VIOLET && k.vol === 44 && !k.seg,
    `jam-speaker: Prev / big Play (accent) / Next 60px, 44px volume bar, no switch (${k.keys} ${k.keyH} ${k.playBg} ${k.vol})`);
  const ma = await info(MA);
  check(!ma.img && ma.bars && ma.face === VIOLET && ma.bk.find(b => b.key === "favorite").on === "true",
    `jam-speaker: no art -> violet + Golden Arm bars; MA-queue track that is a favourite (get_queue) lights Favourite (${ma.face} ${JSON.stringify(ma.bk)})`);
  const q = await page.evaluate(MA => (window.__ws || []).filter(m => m.service === "get_queue").map(m => m.target && m.target.entity_id), MA);
  check(q.includes(MA) && !q.includes(K), `jam-speaker: get_queue asked for the MA-queue player only (${q.join(", ")})`);
  const li = await info(L);
  check(li.abs && li.abs.n >= 2 && li.abs.n <= 3 && li.title === "Living room" && li.sub === "Last played: Saturn · The Olympians" && !li.img && !li.pg &&
    li.bk.find(b => b.key === "favorite").dis && li.pw.label === "Turn on (play)",
    `jam-speaker: idle = cut-paper abstract (${li.abs && li.abs.n} shapes on ${li.abs && li.abs.bg}), room title, "Last played" line, Favourite disabled (${li.title} | ${li.sub})`);
  await push(L, {attributes: {volume_level: 0.41}}); // same last_changed -> same picture
  const li2 = await info(L);
  await push(L, {last_changed: "2026-10-30T20:00:00Z", attributes: {volume_level: 0.4}}); // went idle again -> a new arrangement
  const li3 = await info(L);
  check(li2.abs.sig === li.abs.sig && li3.abs.sig !== li.abs.sig, "jam-speaker: idle art is stable across updates and changes when the player goes idle again (new last_changed)");
  const ho = await info(H);
  check(ho.title === "House" && ho.sub === null && ho.abs && !ho.bk.some(b => b.key === "favorite"), `jam-speaker: idle without a title -> name, no sub line; no MA button -> no Favourite (${ho.title})`);
  const po = await info("media_player.preview_spk_paused");
  check(po.ph === 120 && !po.bk.some(b => b.key === "shuffle"), `jam-speaker: poster_height 120, show_shuffle false (${po.ph}, ${JSON.stringify(po.bk)})`);
  const tv = await info(TV);
  check(!tv.bk.length, `jam-speaker: no SHUFFLE_SET and no favourite button -> no band keys (${JSON.stringify(tv.bk)})`);

  // Transport, shuffle, favourite, power, volume.
  const kc = card(K);
  for (const [key, svc, data, dom] of [["prev", "media_previous_track", {}], ["play_pause", "media_play_pause", {}], ["next", "media_next_track", {}],
    ["shuffle", "shuffle_set", {shuffle: false}], ["vol_up", "volume_set", {volume_level: .53}], ["vol_down", "volume_set", {volume_level: .43}]]) {
    await reset(); await kc.locator(`button[data-key="${key}"]`).first().click();
    const c = await callsNow();
    const ok = c.length === 1 && c[0].domain === (dom || "media_player") && c[0].service === svc && c[0].data.entity_id === K &&
      Object.entries(data).every(([a, v]) => Math.abs(Number(c[0].data[a]) - Number(v)) < 1e-9 || c[0].data[a] === v);
    check(ok, `jam-speaker: ${key} -> media_player.${svc} ${JSON.stringify(data)} (${JSON.stringify(c)})`);
    if (key === "vol_up") await push(K, {attributes: {volume_level: 0.48}}); // card shows the entity's level again
  }
  await reset(); await kc.locator('.bk button[data-key="favorite"]').click();
  let c = await callsNow();
  const favOn = await kc.evaluate(e => e.shadowRoot.querySelector('.bk [data-key="favorite"]').getAttribute("aria-pressed"));
  check(c.length === 1 && c[0].domain === "button" && c[0].service === "press" && c[0].data.entity_id === "button.preview_spk_kitchen_favorite_current_song_x" && favOn === "true",
    `jam-speaker: Favourite -> button.press on the player's MA "Favorite current song" button (registry), key lit after (${JSON.stringify(c)}, ${favOn})`);
  for (const [id, svc] of [[K, "media_stop"], [L, "media_play"], [TV, "toggle"]]) {
    await reset(); await card(id).locator(".pw").click();
    c = await callsNow();
    check(c.length === 1 && c[0].service === svc && c[0].data.entity_id === id, `jam-speaker: power corner on ${id.slice(25)} -> media_player.${svc} (${JSON.stringify(c)})`);
  }
  const vt = kc.locator(".vol .vt"), bb = await vt.boundingBox();
  await reset(); await page.mouse.click(bb.x + bb.width * .25, bb.y + bb.height / 2);
  c = await callsNow();
  check(c.length === 1 && c[0].service === "volume_set" && Math.abs(c[0].data.volume_level - .25) <= .02, `jam-speaker: tap at 25% of the bar -> volume_set ${c[0] && c[0].data.volume_level}`);
  check((await kc.locator(".vol .v").textContent()) === "25", "jam-speaker: volume number follows the bar");
  await push(K, {attributes: {volume_level: 0.48}});

  // Tap on the band text (passes through to the poster) and on the art: both open panel B; power / band keys do not.
  const sheets = () => page.evaluate(() => document.querySelectorAll(".jam-sheet-host").length);
  const closeAll = async () => { for (let i = 0; i < 3 && await sheets(); i++) { await page.keyboard.press("Escape"); await page.waitForTimeout(40); } };
  const tb = await kc.locator(".band .title").boundingBox();
  await page.mouse.click(tb.x + 10, tb.y + tb.height / 2); await page.waitForTimeout(250);
  const viaBand = await sheets(); await closeAll();
  const pb = await kc.locator(".poster").boundingBox();
  await page.mouse.click(pb.x + pb.width / 2, pb.y + 20); await page.waitForTimeout(250);
  const viaArt = await sheets(); await closeAll();
  check(viaBand === 1 && viaArt === 1, `jam-speaker: tap on the band or the art opens panel B (${viaBand}, ${viaArt})`);

  // Narrow card (~280 px): the kicker wraps (<= 2 lines) above the title, band inside the poster, keys clear of the text.
  const narrow = await card(L).evaluate(e => {
    const w = e.style.width, d = e.style.display; e.style.display = "block"; e.style.width = "280px";
    const r = e.shadowRoot, p = r.querySelector(".poster"), k = p.querySelector(".kk span"), t = p.querySelector(".title"), bk = p.querySelector(".bk"), band = p.querySelector(".band");
    const lh = parseFloat(getComputedStyle(k).lineHeight), kb = k.getBoundingClientRect(), tb = t.getBoundingClientRect(), pb = p.getBoundingClientRect(), xb = band.getBoundingClientRect(), bb = bk.getBoundingClientRect();
    const out = {lines: Math.round(kb.height / lh), over: kb.bottom > tb.top + 0.5, inside: xb.top >= pb.top - 0.5 && xb.bottom <= pb.bottom + 0.5,
      keys: bb.left >= tb.right - 0.5 && bb.left >= kb.right - 0.5, clipped: k.scrollWidth > k.clientWidth + 1};
    e.style.width = w; e.style.display = d; return out;
  });
  check(narrow.lines <= 2 && !narrow.over && narrow.inside && narrow.keys && !narrow.clipped, `jam-speaker: 280px card — kicker ${narrow.lines} lines, no overlap, band inside the poster, keys right of the text (${JSON.stringify(narrow)})`);

  if (process.env.JAM_SHOTS) {
    const dir = process.env.JAM_SHOTS;
    await page.setViewportSize({width: 390, height: 900}); await page.waitForTimeout(300);
    for (const [id, name] of [[K, "kitchen"], [L, "living"], [P, "phoster"], [MA, "ma"]]) await card(id).screenshot({path: path.join(dir, `speaker-${name}-390.png`)});
    await page.setViewportSize({width: 1280, height: 900});
  }

  // ---------- panel B (living room) ----------
  const S = fn => page.evaluate(fn);
  const panel = () => S(() => {
    const host = [...document.querySelectorAll(".jam-sheet-host")].pop(); if (!host) return null;
    const r = host.shadowRoot, face = r.querySelector(".face[role=dialog]");
    return {dialog: face.getAttribute("aria-modal") === "true" && face.getAttribute("aria-label") === "Living room music", title: r.querySelector(".t h2").textContent,
      sub: r.querySelector(".t .ss").textContent, thumb: !!r.querySelector(".head > .thumb"),
      acts: [...r.querySelectorAll(".acts > button")].map(b => b.textContent.trim()),
      tabs: [...r.querySelectorAll(".tabs button")].map(b => b.textContent + (b.getAttribute("aria-pressed") === "true" ? "*" : "")),
      rows: [...r.querySelectorAll(".body .row")].map(x => ({uri: x.dataset.uri, nm: x.querySelector(".nm").textContent, dt: x.querySelector(".dt").textContent,
        pin: x.querySelector(".pin").getAttribute("aria-pressed"), img: !!x.querySelector(".thumb img"), abs: !!x.querySelector(".thumb .abs")})),
      msg: (r.querySelector(".body .msg") || {}).textContent || null, grp: [...r.querySelectorAll(".body .grp")].map(g => g.textContent),
      spk: [...r.querySelectorAll(".body .spk")].map(x => x.dataset.entity.slice(25) + ":" + (x.querySelector(".tog") ? x.querySelector(".tog").textContent + (x.querySelector(".tog").classList.contains("on") ? "*" : "") : "-")),
      dock: (() => { const d = r.querySelector(".dock"); return {tt: d.querySelector(".tt").textContent, keys: [...d.querySelectorAll("button")].map(b => b.dataset.key + (b.disabled ? "-" : "")), bg: getComputedStyle(d).backgroundColor}; })()};
  });
  const inPanel = (sel, i) => page.evaluate(([sel, i]) => { const r = [...document.querySelectorAll(".jam-sheet-host")].pop().shadowRoot; r.querySelectorAll(sel)[i || 0].click(); }, [sel, i]);
  const tab = async t => { await inPanel(`.tabs [data-tab="${t}"]`); await page.waitForTimeout(80); };
  const lc = card(L);
  await lc.locator("button.open").click(); await page.waitForTimeout(250);
  let pn = await panel();
  check(!!pn && pn.dialog && pn.title === "Living room" && pn.sub === "Idle" && pn.thumb && pn.acts.join("|") === "Speakers|Close ×" &&
    pn.tabs.join(",") === "Pinned*,Recent,Playlists,Albums,Search",
    `jam-speaker panel: mini header (thumb, room, source, Speakers, Close), tabs, opens on Pinned (${JSON.stringify(pn && {t: pn.title, s: pn.sub, a: pn.acts, tabs: pn.tabs})})`);
  check(pn.rows.map(x => x.nm).join(",") === "Cooking,Sunday,Discover Weekly" && pn.rows.every(x => x.pin === "true") && pn.rows[0].img && pn.rows[2].abs &&
    pn.rows[0].dt === "Playlist",
    `jam-speaker panel: Pinned = config pins (bare uri named from the library), pinned corner tabs, cover or cut-paper thumb (${JSON.stringify(pn.rows.map(x => x.nm + "/" + x.dt))})`);
  check(pn.dock.bg === INK && pn.dock.tt === "Saturn" && pn.dock.keys.join(",") === "prev,play_pause,next,favorite-",
    `jam-speaker panel: docked ink bar — thumb, last title, Prev / Play / Next / Favourite (idle: disabled) (${JSON.stringify(pn.dock)})`);
  await page.screenshot({path: path.join(shots, "speaker-panel-pinned-dark-1280.png")});
  await reset(); await inPanel(".body .row .play", 0);
  c = await callsNow();
  check(c.length === 1 && c[0].domain === "music_assistant" && c[0].service === "play_media" && c[0].data.entity_id === L && c[0].data.media_id === "library://playlist/1" &&
    c[0].data.media_type === "playlist", `jam-speaker panel: Play -> music_assistant.play_media {entity_id, media_id: uri, media_type} (${JSON.stringify(c)})`);
  await tab("recent"); await page.waitForTimeout(150);
  pn = await panel();
  const ws = await S(() => window.__ws.filter(m => m.type === "call_service" && m.service === "get_library").map(m => `${m.service_data.media_type}/${m.service_data.order_by}/${m.service_data.config_entry_id}/${m.return_response}`));
  check(pn.rows.map(x => x.nm).join(",") === "Night drive,Sunrise Sessions,Cooking,Currents,Dinner party" && pn.rows[1].dt === "Album · The Olympians" &&
    ws.includes("playlist/last_played_desc/preview_ma/true") && ws.includes("album/last_played_desc/preview_ma/true"),
    `jam-speaker panel: Recent = playlists + albums by last_played_desc, interleaved, "type · artist" (${pn.rows.map(x => x.nm).join(", ")} | ${[...new Set(ws)].join(", ")})`);
  await page.screenshot({path: path.join(shots, "speaker-panel-recent-dark-1280.png")});
  // Pin from a list row, unpin a config pin, unpin again.
  await inPanel(".body .row .pin", 0); await page.waitForTimeout(60);
  pn = await panel();
  let ud = await S(() => JSON.stringify(window.__userData.jam_pins || null));
  check(pn.rows[0].pin === "true" && /library:\/\/playlist\/4/.test(ud), `jam-speaker panel: corner tab pins "Night drive" (jam_pins ${ud})`);
  await tab("pinned");
  await inPanel(".body .row .pin", 1); await page.waitForTimeout(60); // unpin "Sunday" (a config pin)
  pn = await panel();
  ud = await S(() => JSON.stringify(window.__userData.jam_pins));
  check(pn.rows.map(x => x.nm).join(",") === "Cooking,Discover Weekly,Night drive" && /"uri":"library:\/\/playlist\/2","hidden":true/.test(ud),
    `jam-speaker panel: Pinned = config + user pins; unpinning a config pin hides it for this user (${pn.rows.map(x => x.nm).join(", ")} | ${ud})`);
  await inPanel(".body .row .pin", 2); await page.waitForTimeout(60);
  pn = await panel();
  check(pn.rows.map(x => x.nm).join(",") === "Cooking,Discover Weekly", `jam-speaker panel: unpin a user pin (${pn.rows.map(x => x.nm).join(", ")})`);
  await tab("playlists"); await page.waitForTimeout(100);
  pn = await panel();
  const pl = pn.rows.map(x => x.nm).join(",");
  await tab("albums"); await page.waitForTimeout(250);
  const al = await panel();
  check(pl === "Cooking,Sunday,Dinner party,Night drive,Focus" && pn.rows[4].abs && al.rows.length === 4 && al.rows[3].nm === "Mezzanine" && al.rows[3].abs && !al.rows[3].img,
    `jam-speaker panel: Playlists (${pl}) / Albums (${al.rows.map(x => x.nm).join(", ")}); no cover or a broken one -> cut-paper thumb`);
  // Search.
  await tab("search");
  const type = async v => { await page.evaluate(v => { const r = [...document.querySelectorAll(".jam-sheet-host")].pop().shadowRoot, i = r.querySelector(".sbar input"); i.value = v; }, v); await page.keyboard.press("Tab"); };
  await type("x"); await inPanel('.sbar [data-key="search"]'); await page.waitForTimeout(60);
  const short = (await panel()).msg;
  await page.evaluate(() => { const r = [...document.querySelectorAll(".jam-sheet-host")].pop().shadowRoot, i = r.querySelector(".sbar input"); i.value = "olymp"; i.focus(); });
  await page.keyboard.press("Enter"); await page.waitForTimeout(120);
  pn = await panel();
  const sw = await S(() => window.__ws.filter(m => m.service === "search").map(m => JSON.stringify(m.service_data)).pop());
  check(/two letters/.test(short) && pn.grp.join(",") === "Albums,Artists,Tracks" && pn.rows.map(x => x.nm).join(",") === "Sunrise Sessions,Saturn,The Olympians,Saturn" &&
    /"name":"olymp"/.test(sw) && /"media_type":\["playlist","album","artist","track","radio"\]/.test(sw),
    `jam-speaker panel: Search (Enter) -> music_assistant.search, grouped results (${pn.grp.join(", ")}: ${pn.rows.map(x => x.nm).join(", ")}); 1 letter -> hint (${short})`);
  await page.screenshot({path: path.join(shots, "speaker-panel-search-dark-1280.png")});
  await page.evaluate(() => { const r = [...document.querySelectorAll(".jam-sheet-host")].pop().shadowRoot, i = r.querySelector(".sbar input"); i.value = "zzzz"; });
  await inPanel('.sbar [data-key="search"]'); await page.waitForTimeout(100);
  check(/No results/.test((await panel()).msg || ""), "jam-speaker panel: no search results -> plain message");
  // Speakers view (grouping).
  await inPanel('.acts [data-key="speakers"]'); await page.waitForTimeout(80);
  pn = await panel();
  check(pn.spk.join(",") === "living:-,kitchen:Join,phoster:Join,house:-,gone:-" && pn.tabs.every(t => !t.endsWith("*")),
    `jam-speaker panel: Speakers key -> This room + Join only for GROUPING players that are available (${pn.spk})`);
  await page.screenshot({path: path.join(shots, "speaker-panel-speakers-dark-1280.png")});
  await reset(); await inPanel('.spk[data-entity="media_player.preview_spk_kitchen"] .tog');
  c = await callsNow();
  check(c.length === 1 && c[0].service === "join" && c[0].data.entity_id === L && JSON.stringify(c[0].data.group_members) === JSON.stringify([K]),
    `jam-speaker panel: Join -> media_player.join on the card's player with group_members [it] (${JSON.stringify(c)})`);
  await push(L, {state: "playing", attributes: {group_members: [L, K], media_title: "Saturn", media_artist: "The Olympians"}});
  pn = await panel();
  const stamped = await S(() => !![...document.querySelectorAll(".jam-sheet-host")].pop().shadowRoot.querySelector('.spk[data-entity="media_player.preview_spk_kitchen"] .jam-stamp'));
  check(pn.spk[1] === "kitchen:Playing*" && stamped && pn.dock.tt === "Saturn" && pn.dock.keys.join(",") === "prev,play_pause,next,favorite" && pn.sub === "Music Assistant",
    `jam-speaker panel: live update — newly joined speaker Playing + stamp, dock + header follow the player (${pn.spk[1]}, ${pn.dock.tt}, ${pn.sub})`);
  await reset(); await inPanel('.spk[data-entity="media_player.preview_spk_kitchen"] .tog');
  c = await callsNow();
  check(c.length === 1 && c[0].service === "unjoin" && c[0].data.entity_id === K, `jam-speaker panel: Playing -> media_player.unjoin on that speaker (${JSON.stringify(c)})`);
  await reset(); await inPanel('.dock [data-key="play_pause"]');
  c = await callsNow();
  check(c.length === 1 && c[0].service === "media_play_pause" && c[0].data.entity_id === L, `jam-speaker panel: dock Play-Pause -> media_play_pause (${JSON.stringify(c)})`);
  await push(L, {state: "idle", last_changed: "2026-10-30T21:00:00Z", attributes: {group_members: []}});
  await page.keyboard.press("Escape"); await page.waitForTimeout(80);
  check(await sheets() === 0, "jam-speaker panel: Esc closes it");
  // Error + empty states: Den's MA entry is down; House has nothing pinned for this user.
  await card(TV).locator("button.open").click(); await page.waitForTimeout(150);
  pn = await panel();
  const n0 = await S(() => window.__ws.length);
  await inPanel('.body [data-key="retry"]'); await page.waitForTimeout(120);
  const n1 = await S(() => window.__ws.length), pe = await panel();
  check(pn.tabs[1] === "Recent*" && /Couldn't load the library/.test(pn.msg) && /not responding/.test(pn.msg) && n1 > n0 && /Couldn't load/.test(pe.msg),
    `jam-speaker panel: library error shows the reason + Retry (asks again, ${n1 - n0} calls) (${pn.msg})`);
  await page.keyboard.press("Escape"); await page.waitForTimeout(60);
  await card(H).locator("button.open").click(); await page.waitForTimeout(150);
  await tab("pinned");
  pn = await panel();
  check(/Nothing pinned yet/.test(pn.msg || "") && pn.rows.length === 0 && !pn.acts.includes("Speakers"), `jam-speaker panel: empty Pinned -> plain message; no speakers -> no Speakers key (${pn.msg})`);
  await page.keyboard.press("Escape"); await page.waitForTimeout(60);
  await closeAll();
};
