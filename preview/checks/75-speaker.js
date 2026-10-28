// jam-speaker interactions (fixture preview/fixtures/75-speaker.js): source badge per source / state, idle poster without a
// hint, transport + shuffle, volume bar (drag, − / +), Speakers tab (join / unjoin, per-speaker volume, GROUPING only,
// stamp on a new join), tab hidden without speakers.
// Set JAM_SHOTS=<dir> to also write 390 px review screenshots of the speaker cards.
// Contract: module.exports = async (page, check, helpers) => {}; runs on the dark/1280 preview page, files in name order.
const path = require("path");
module.exports = async (page, check, {callsNow}) => {
  const K = "media_player.preview_spk_kitchen", L = "media_player.preview_spk_living", P = "media_player.preview_spk_phoster";
  const reset = () => page.evaluate(() => { window.__calls.length = 0; });
  const push = (id, patch) => page.evaluate(([id, patch]) => {
    const h = window.__hass, s = h.states[id];
    h.states[id] = {...s, ...patch, attributes: {...s.attributes, ...(patch.attributes || {})}, last_updated: "p" + Math.random()};
    const nh = {...h};
    for (const e of document.querySelectorAll("jam-speaker")) e.hass = nh;
  }, [id, patch]);
  const card = id => page.locator(`jam-speaker[data-e="${id}"]`);
  await page.evaluate(() => { for (const e of document.querySelectorAll("jam-speaker")) e.dataset.e = e._config.entity; });
  const tok = v => page.evaluate(v => { const p = document.createElement("span"); p.style.color = `var(${v})`; document.body.append(p); const c = getComputedStyle(p).color; p.remove(); return c; }, v);
  const [GREEN, VIOLET, TEAL, DIM, SLAB2] = await Promise.all(["--jam-green", "--jam-violet", "--jam-teal", "--jam-dim", "--jam-slab2"].map(tok));

  // Badges.
  const info = id => card(id).evaluate(e => {
    const r = e.shadowRoot, p = r.querySelector(".poster"), b = r.querySelector(".badge");
    return {badge: b.dataset.badge, sq: getComputedStyle(b.querySelector("i")).backgroundColor, idle: p.classList.contains("idle"),
      h: Math.round(p.getBoundingClientRect().height), kick: p.querySelector(".kick").textContent, title: p.querySelector(".title").textContent,
      txt: p.querySelector(".txt").textContent, parts: p.querySelector(".txt").children.length, bg: getComputedStyle(p.querySelector(".face")).backgroundColor,
      art: !!p.querySelector("img"), bars: !!p.querySelector(".arm"), seg: !!r.querySelector(".seg"),
      keys: [...r.querySelectorAll(".keys button")].map(k => k.dataset.key + (k.classList.contains("on") ? "*" : ""))};
  });
  const want = [[K, "Spotify Connect", GREEN], [L, "Idle", DIM], [P, "Grouped", TEAL], ["media_player.preview_spk_ma", "Music Assistant", VIOLET],
    ["media_player.preview_spk_paused", "Paused", DIM], ["media_player.preview_spk_tv", "TV", null], ["media_player.preview_spk_house", "Idle", DIM]];
  for (const [id, word, col] of want) {
    const i = await info(id);
    check(i.badge === word && (!col || i.sq === col), `jam-speaker: ${id.slice(13)} badge "${i.badge}" (${i.sq})`);
  }
  const k = await info(K);
  check(k.h === 170 && k.kick === "Kitchen speakers" && k.title === "Lobby" && k.txt.includes("AERwave") && k.art && !k.idle,
    `jam-speaker: playing poster 170px, kicker / title / artist, artwork (${k.h}, ${k.kick} | ${k.title})`);
  check(k.keys.join(",") === "prev,play_pause*,next,shuffle*" && k.seg, `jam-speaker: Prev / Play-Pause (accent) / Next / Shuffle on (${k.keys})`);
  const ma = await info("media_player.preview_spk_ma");
  check(!ma.art && ma.bars && ma.bg === VIOLET, `jam-speaker: no art -> flat accent (violet default) + Golden Arm bars (${ma.bg})`);
  const li = await info(L);
  check(li.idle && li.bg === SLAB2 && li.title === "Saturn" && li.parts === 3 && !/spotify|open|pick/i.test(li.txt),
    `jam-speaker: idle = slab2 poster, last title, no hint (${li.title} | ${li.txt})`);
  const ho = await info("media_player.preview_spk_house");
  check(ho.idle && ho.title === "House" && ho.parts === 2 && !ho.seg, `jam-speaker: idle without a title -> name; no speakers -> no tab (${ho.title})`);
  const po = await info("media_player.preview_spk_paused");
  check(po.h === 120 && po.keys.join(",") === "prev,play_pause*,next", `jam-speaker: poster_height 120, show_shuffle false (${po.h}, ${po.keys})`);
  const tv = await info("media_player.preview_spk_tv");
  check(tv.keys.join(",") === "prev,play_pause*,next" && !tv.seg, `jam-speaker: no SHUFFLE_SET -> no shuffle key (${tv.keys})`);

  // Transport, shuffle, volume.
  const kc = card(K);
  for (const [key, svc, data] of [["prev", "media_previous_track", {}], ["play_pause", "media_play_pause", {}], ["next", "media_next_track", {}],
    ["shuffle", "shuffle_set", {shuffle: false}], ["vol_up", "volume_set", {volume_level: .53}], ["vol_down", "volume_set", {volume_level: .43}]]) {
    await reset(); await kc.locator(`.pane button[data-key="${key}"]`).click();
    const c = await callsNow();
    const ok = c.length === 1 && c[0].domain === "media_player" && c[0].service === svc && c[0].data.entity_id === K &&
      Object.entries(data).every(([a, v]) => Math.abs(Number(c[0].data[a]) - Number(v)) < 1e-9 || c[0].data[a] === v);
    check(ok, `jam-speaker: ${key} -> media_player.${svc} ${JSON.stringify(data)} (${JSON.stringify(c)})`);
    if (key === "vol_up") await push(K, {attributes: {volume_level: 0.48}}); // card shows the entity's level again
  }
  const vt = kc.locator(".vol .vt");
  const vh = await vt.evaluate(t => Math.round(t.getBoundingClientRect().height));
  const bb = await vt.boundingBox();
  await reset(); await page.mouse.click(bb.x + bb.width * .25, bb.y + bb.height / 2);
  let c = await callsNow();
  check(vh === 30 && c.length === 1 && c[0].service === "volume_set" && Math.abs(c[0].data.volume_level - .25) <= .02,
    `jam-speaker: 30px volume bar, tap at 25% -> volume_set ${c[0] && c[0].data.volume_level}`);
  check((await kc.locator(".vol .v").textContent()) === "25", "jam-speaker: volume number follows the bar");

  // Speakers tab.
  await kc.locator('.seg button[data-tab="speakers"]').click();
  const rows = () => kc.locator(".spk").evaluateAll(rs => rs.map(r => ({e: r.dataset.entity, n: r.querySelector(".n").textContent,
    t: r.querySelector(".tog") ? r.querySelector(".tog").textContent + (r.querySelector(".tog").classList.contains("on") ? "*" : "") : null,
    vt: !!r.querySelector(".vt"), stamp: !!r.querySelector(".jam-stamp")})));
  let rs = await rows();
  check(rs.length === 3 && rs[0].n === "This room" && rs[0].t === null && rs[1].e === L && rs[1].t === "Join" && rs[2].e === P && rs[2].t === "Playing*" && rs.every(r => r.vt),
    `jam-speaker: Speakers tab = This room + Join / Playing rows with volume (${JSON.stringify(rs)})`);
  await reset(); await kc.locator(`.spk[data-entity="${L}"] .tog`).click();
  c = await callsNow();
  check(c.length === 1 && c[0].service === "join" && c[0].data.entity_id === K && JSON.stringify(c[0].data.group_members) === JSON.stringify([L]),
    `jam-speaker: Join -> media_player.join on the card's player with group_members [it] (${JSON.stringify(c)})`);
  await reset(); await kc.locator(`.spk[data-entity="${P}"] .tog`).click();
  c = await callsNow();
  check(c.length === 1 && c[0].service === "unjoin" && c[0].data.entity_id === P, `jam-speaker: Playing -> media_player.unjoin on that speaker (${JSON.stringify(c)})`);
  const tb = await kc.locator(`.spk[data-entity="${P}"] .vt`).boundingBox();
  await reset(); await page.mouse.click(tb.x + tb.width * .75, tb.y + tb.height / 2);
  c = await callsNow();
  check(c.length === 1 && c[0].service === "volume_set" && c[0].data.entity_id === P && Math.abs(c[0].data.volume_level - .75) <= .02,
    `jam-speaker: a speaker's thin bar sets that player's volume (${JSON.stringify(c)})`);
  await push(K, {attributes: {group_members: [K, P, L]}});
  rs = await rows();
  check(rs[1].t === "Playing*" && rs[1].stamp && !rs[2].stamp, `jam-speaker: newly joined speaker -> Playing + one-shot stamp (${JSON.stringify(rs.map(r => r.t + (r.stamp ? "!" : "")))})`);
  await push(K, {attributes: {group_members: [K, P]}});
  const lc = card(L);
  await lc.locator('.seg button[data-tab="speakers"]').click();
  rs = await lc.locator(".spk").evaluateAll(rs => rs.map(r => r.dataset.entity.slice(25) + ":" + (r.querySelector(".tog") ? r.querySelector(".tog").textContent : "-")));
  check(rs.join(",") === "living:-,kitchen:Join,phoster:Join,house:-,gone:-",
    `jam-speaker: Join only for GROUPING players that are available (${rs})`);
  await lc.locator('.seg button[data-tab="now"]').click();
  await kc.locator('.seg button[data-tab="now"]').click();

  if (process.env.JAM_SHOTS) {
    const dir = process.env.JAM_SHOTS;
    await page.setViewportSize({width: 390, height: 900});
    await page.waitForTimeout(300);
    for (const [id, name] of [[K, "kitchen"], [L, "living"], [P, "phoster"], ["media_player.preview_spk_ma", "ma"]])
      await card(id).screenshot({path: path.join(dir, `speaker-${name}-390.png`)});
    await kc.locator('.seg button[data-tab="speakers"]').click();
    await page.mouse.move(0, 0); await page.waitForTimeout(600); // rows slide in first
    await card(K).screenshot({path: path.join(dir, "speaker-kitchen-speakers-390.png")});
    await kc.locator('.seg button[data-tab="now"]').click();
    await page.setViewportSize({width: 1280, height: 900});
  }
  // Narrow card (~280 px): the kicker wraps at word boundaries (no ellipsis), 2 lines, above the title without overlap.
  const narrow = await card(L).evaluate(e => {
    const w = e.style.width, d = e.style.display; e.style.display = "block"; e.style.width = "280px";
    const r = e.shadowRoot, p = r.querySelector(".poster"), k = p.querySelector(".kick"), t = p.querySelector(".title");
    const cs = getComputedStyle(k), lh = parseFloat(cs.lineHeight), kb = k.getBoundingClientRect(), tb = t.getBoundingClientRect(),
      pb = p.getBoundingClientRect(), xb = p.querySelector(".txt").getBoundingClientRect();
    const out = {text: k.textContent, ell: cs.textOverflow, ws: cs.whiteSpace, lines: Math.round(kb.height / lh),
      over: kb.bottom > tb.top + 0.5, inside: xb.top >= pb.top - 0.5 && xb.bottom <= pb.bottom + 0.5, clipped: k.scrollWidth > k.clientWidth + 1};
    e.style.width = w; e.style.display = d; return out;
  });
  check(narrow.ell !== "ellipsis" && narrow.ws === "normal" && !narrow.clipped && narrow.lines === 2 && !narrow.over && narrow.inside,
    `jam-speaker: 280px kicker "${narrow.text}" wraps to ${narrow.lines} lines, no ellipsis (${narrow.ell}/${narrow.ws}), no title overlap (${narrow.over}), text inside poster (${narrow.inside})`);
};
