// jam-screensaver 0.7.1: "now" (now playing on the poster + photos label) and pure modes with a mode_entity.
// Cards are made on the page (fake hass states, fixture slides), no fixture section. Runs on the dark/1280 page.
// Writes preview/shots/screensaver-now-{poster,photos}-{1024,961}.png and screensaver-now-none-poster-1024.png.
// Contract: module.exports = async (page, check, helpers) => {}.
const path = require("path");
const SHOTS = path.join(__dirname, "..", "shots");

module.exports = async (page, check) => {
  // One screensaver on the page, shown at once; states for a TV (YouTube) + a speaker; returns nothing (kept on window.__np).
  const setup = cfg => page.evaluate(async cfg => {
    if (window.__np) window.__np.remove();
    const st = (id, state, attributes = {}) => ({entity_id: id, state, attributes, last_changed: "x", last_updated: String(Math.random())});
    const base = window.__hass.states;
    window.__npStates = {
      "media_player.np_tv": st("media_player.np_tv", "off", {friendly_name: "Living TV", app_name: "com.google.android.youtube.tv"}),
      "sensor.np_app": st("sensor.np_app", "YouTube", {friendly_name: "TV app"}),
      "media_player.np_speaker": st("media_player.np_speaker", "idle", {friendly_name: "Living Room Speakers"}),
      "input_select.np_mode": st("input_select.np_mode", cfg.__mode || "Clock", {options: ["Photos", "Clock"]}),
    };
    delete cfg.__mode;
    window.__npHass = () => ({...window.__hass, states: {...base, ...window.__npStates},
      entities: {"media_player.np_speaker": {entity_id: "media_player.np_speaker", device_id: "dev1"}}, devices: {dev1: {id: "dev1", area_id: "living"}},
      areas: {living: {area_id: "living", name: "Living room"}}});
    const e = document.createElement("jam-screensaver");
    e.setConfig({type: "custom:jam-screensaver", idle_seconds: 3600, weather_entity: "weather.bungalo_weather", kicker: "The Bungalow · living room",
      accent: "living", mode_entity: "input_select.np_mode", images: {index: "fixtures/slides/index.json", interval: 1, fade: 0},
      now: [{type: "weather", entity: "weather.bungalo_weather"},
        {type: "media", entity: "media_player.np_tv", states: ["playing", "paused"], kicker: "On the TV", app_entity: "sensor.np_app"},
        {type: "media", entity: "media_player.np_speaker", states: ["playing"]}], ...cfg});
    e.hass = window.__npHass(); document.body.append(e);
    window.__np = e; e._show();
  }, cfg);
  const setState = (id, state, attrs) => page.evaluate(([id, state, attrs]) => {
    const o = window.__npStates[id];
    window.__npStates[id] = {...o, state, attributes: {...o.attributes, ...(attrs || {})}, last_updated: String(Math.random())};
    window.__np.hass = window.__npHass();
  }, [id, state, attrs]);
  const look = () => page.evaluate(() => {
    const o = window.__np.overlay, view = o.dataset.view, P = o.querySelector(".poster .np"), S = o.querySelector(".sdock .np");
    const blk = view === "images" ? S : P, vis = b => getComputedStyle(b).display !== "none" && !!b.getClientRects().length;
    const tx = b => b ? {kick: b.querySelector(".kick").textContent, big: b.querySelector(".nb").textContent, sub: b.querySelector(".ns").textContent,
      bars: b.querySelector(".th").classList.contains("bars"), cover: b.querySelector(".cv").style.backgroundImage} : null;
    return {view, shown: vis(blk), poster: vis(P), photo: vis(S), ...tx(blk), imgs: o.querySelectorAll("img").length};
  });
  // Overlap: the now block vs the clock / date / weather / kicker text (poster), vs the time chip (photos); inside the viewport.
  const overlap = () => page.evaluate(() => {
    const o = window.__np.overlay, p = o.querySelector(".poster"), keep = p.className, out = [], sizes = {};
    const tr = e => { if (!e || !e.textContent.trim() || !e.getClientRects().length) return null; const g = document.createRange(); g.selectNodeContents(e); return g.getBoundingClientRect(); };
    const hit = (a, b) => b && a.left < b.right && b.left < a.right && a.top < b.bottom && b.top < a.bottom;
    const inside = r => r.left >= 0 && r.top >= 0 && r.right <= innerWidth + 1 && r.bottom <= innerHeight + 1;
    if (o.dataset.view === "poster") {
      for (let n = 0; n < 6; n++) {
        p.className = "poster l" + n + " " + ["", "r", "", "c", "", "r"][n];
        const np = p.querySelector(".np"), r = np.getBoundingClientRect();
        if (!np.getClientRects().length) { out.push(n + " no block"); continue; }
        for (const [k, s] of [["clock", ".time"], ["date", ".date"], ["weather", ".wx"], ["kicker", ".txt > .kick"]]) if (hit(r, tr(p.querySelector(s)))) out.push(n + " over " + k);
        if (!inside(r) || !inside(p.querySelector(".txt").getBoundingClientRect())) out.push(n + " outside");
        for (const sh of p.querySelectorAll(".sh")) { const b = sh.getBoundingClientRect();
          const a = Math.max(0, Math.min(r.right, b.right) - Math.max(r.left, b.left)) * Math.max(0, Math.min(r.bottom, b.bottom) - Math.max(r.top, b.top));
          if (a > 0.04 * r.width * r.height) out.push(n + " shape over the block"); }
        sizes["l" + n] = Math.round(r.width) + "x" + Math.round(r.height);
      }
      p.className = keep;
      const nb = p.querySelector(".np .nb"), th = p.querySelector(".np .th");
      return {out, sizes, title: parseFloat(getComputedStyle(nb).fontSize), thumb: th.getBoundingClientRect().width};
    }
    const np = o.querySelector(".sdock .np"), r = np.getBoundingClientRect(), chip = o.querySelector(".tchip").getBoundingClientRect();
    if (hit(r, chip)) out.push("over the time chip");
    if (!inside(r)) out.push("outside");
    const cs = getComputedStyle(np);
    if (/gradient/.test(cs.backgroundImage) || cs.filter !== "none" || (cs.backdropFilter && cs.backdropFilter !== "none")) out.push("gradient / filter");
    const ink = document.createElement("span"); ink.style.color = "var(--ink)"; o.append(ink); const inkC = getComputedStyle(ink).color; ink.remove();
    if (cs.backgroundColor !== inkC) out.push("not solid ink: " + cs.backgroundColor);
    return {out, title: parseFloat(getComputedStyle(np.querySelector(".nb")).fontSize), thumb: np.querySelector(".th").getBoundingClientRect().width};
  });

  // ---- poster (Clock): nothing playing = no block; speaker playing; TV paused wins; cover art preloaded ----
  await setup({__mode: "Clock"});
  let s = await look();
  check(s.view === "poster" && !s.poster && !s.photo, `now: nothing playing -> no now block on the poster (${JSON.stringify(s)})`);
  await page.setViewportSize({width: 1024, height: 768}); await page.waitForTimeout(200);
  await page.screenshot({path: path.join(SHOTS, "screensaver-now-none-poster-1024.png")});
  await setState("media_player.np_speaker", "playing", {media_title: "Lobby", media_artist: "AERwave"});
  s = await look();
  check(s.shown && s.kick === "Now playing · Living room" && s.big === "Lobby" && s.sub === "AERwave" && s.bars,
    `now: speaker playing -> "${s.kick}" / "${s.big}" / "${s.sub}", no art = accent square with bars (${s.bars})`);
  await setState("media_player.np_speaker", "paused");
  s = await look();
  check(!s.shown, `now: a state outside the source's states (speaker paused) -> no block (${s.shown})`);
  await setState("media_player.np_speaker", "playing");
  // The new cover's response is held until the "not shown yet" look ran: slide-1.png is already in the memory cache (the
  // photo slides), and even a local fetch can finish before the next page.evaluate, so without the hold the preload could
  // land first (the old flake). A query of its own keeps the request off the cache, so page.route sees it.
  let release;
  const held = new Promise(r => { release = r; });
  const isHeld = u => u.pathname.endsWith("/fixtures/slides/slide-1.png") && u.search === "?np=held";
  await page.route(isHeld, async route => { await held; await route.continue(); });
  await setState("media_player.np_tv", "paused", {media_title: "Lofi beats to study to", media_artist: "Lofi Girl", entity_picture: "fixtures/slides/slide-1.png?np=held"});
  s = await look();
  check(s.shown && s.kick === "On the TV · YouTube" && s.big === "Lofi beats to study to" && s.sub === "Lofi Girl",
    `now: the first active source wins (TV paused over the speaker): "${s.kick}" / "${s.big}" / "${s.sub}"`);
  check(s.bars && !s.cover, `now: a new cover is not shown before it has loaded (${JSON.stringify([s.bars, s.cover])})`);
  release();
  await page.waitForTimeout(400);
  s = await look();
  await page.unroute(isHeld);
  check(!s.bars && /slide-1\.png/.test(s.cover) && s.imgs === 0, `now: the cover is swapped in after preloading (background, not an <img>: ${s.imgs})`);
  await setState("media_player.np_tv", "paused", {entity_picture: "fixtures/slides/missing.png"});
  await page.waitForTimeout(400);
  s = await look();
  check(s.bars, `now: a cover that fails to load -> accent square with bars (${s.bars})`);
  await setState("media_player.np_tv", "paused", {entity_picture: "fixtures/slides/slide-1.png", media_title: null, media_artist: null});
  await page.waitForTimeout(300);
  s = await look();
  check(s.kick === "On the TV" && s.big === "YouTube" && s.sub === "", `now: no title -> the app is the title, not repeated in the kicker ("${s.kick}" / "${s.big}" / "${s.sub}")`);
  await setState("media_player.np_tv", "paused", {media_title: "Lofi beats to study to", media_artist: "Lofi Girl"});
  await page.waitForTimeout(300);
  for (const [w, h] of [[1024, 768], [961, 601]]) {
    await page.setViewportSize({width: w, height: h}); await page.waitForTimeout(250);
    const o = await overlap();
    const scale = await page.evaluate(() => parseFloat(getComputedStyle(window.__np.overlay).getPropertyValue("--disp-scale")) || 1); // Hi-Fi .72
    const want = (w === 1024 ? 44 : 34) * scale;
    check(o.out.length === 0 && Math.abs(o.title - want) <= 2, `now (poster ${w}x${h}): block clear of clock / date / weather in all 6 layouts, title ${o.title}px, cover ${Math.round(o.thumb)}px` +
      (o.out.length ? " — " + o.out.join("; ") : "") + " " + JSON.stringify(o.sizes));
    await page.evaluate(() => { const p = window.__np.overlay.querySelector(".poster"); p.className = "poster l0 "; });
    await page.screenshot({path: path.join(SHOTS, `screensaver-now-poster-${w}.png`)});
  }
  // hass updates without a now change leave the block alone; clock mode never shows a photo
  const same = await page.evaluate(() => { const b = window.__np.overlay.querySelector(".poster .np .nb"), t = b.firstChild; window.__np.hass = window.__npHass(); return b.firstChild === t; });
  check(same, "now: an unrelated hass update does not rewrite the block");

  // ---- photos (pure, mode_entity Photos): the label, never a poster slide even with poster_every ----
  await page.setViewportSize({width: 1024, height: 768});
  await setup({__mode: "Photos", poster_every: 2});
  await setState("media_player.np_speaker", "playing", {media_title: "Lobby", media_artist: "AERwave", entity_picture: "fixtures/slides/slide-2.png"});
  const views = new Set();
  for (let i = 0; i < 18; i++) { await page.waitForTimeout(250); views.add((await look()).view); }
  check(views.size === 1 && views.has("images"), `pure Photos (mode_entity) + poster_every 2: never a poster slide over 4.5 s (views ${[...views]})`);
  s = await look();
  check(s.photo && !s.poster && s.kick === "Now playing · Living room" && s.big === "Lobby" && !s.bars, `now (photos): ink label at the bottom-left ("${s.kick}" / "${s.big}", cover ${!s.bars})`);
  for (const [w, h] of [[1024, 768], [961, 601]]) {
    await page.setViewportSize({width: w, height: h}); await page.waitForTimeout(250);
    const o = await overlap();
    const scale = await page.evaluate(() => parseFloat(getComputedStyle(window.__np.overlay).getPropertyValue("--disp-scale")) || 1);
    const want = (w === 1024 ? 34 : 27) * scale;
    check(o.out.length === 0 && Math.abs(o.title - want) <= 2 && Math.abs(o.thumb - (w === 1024 ? 88 : 69)) <= 2,
      `now (photos ${w}x${h}): solid ink label clear of the time chip, inside the screen, title ${o.title}px, cover ${Math.round(o.thumb)}px` + (o.out.length ? " — " + o.out.join("; ") : ""));
    await page.screenshot({path: path.join(SHOTS, `screensaver-now-photos-${w}.png`)});
  }
  await setState("media_player.np_speaker", "idle");
  s = await look();
  check(!s.photo && s.view === "images", `now (photos): nothing playing -> no label (${s.photo})`);
  // Without a mode_entity poster_every still interleaves the poster (unchanged behaviour).
  await setup({mode: "images", mode_entity: undefined, poster_every: 2});
  const v2 = new Set();
  for (let i = 0; i < 18; i++) { await page.waitForTimeout(250); v2.add((await look()).view); }
  check(v2.has("poster") && v2.has("images"), `no mode_entity: poster_every 2 still shows the poster between photos (${[...v2]})`);
  // Clock (mode_entity) stays the poster only, never a photo.
  await setup({__mode: "Clock", mode: "images"});
  const v3 = new Set(); let imgs = 0;
  for (let i = 0; i < 10; i++) { await page.waitForTimeout(250); const x = await look(); v3.add(x.view); imgs = Math.max(imgs, x.imgs); }
  check(v3.size === 1 && v3.has("poster") && imgs === 0, `pure Clock (mode_entity) over mode: images: only the poster, no <img> (${[...v3]}, ${imgs})`);
  // Validation
  const bad = await page.evaluate(() => { const e = document.createElement("jam-screensaver"); try { e.setConfig({type: "custom:jam-screensaver", now: {type: "media"}}); return false; } catch (x) { return /now/.test(x.message); } });
  check(bad, "now: a non-list now is a config error");
  await page.evaluate(() => { window.__np.remove(); window.__np = null; });
  await page.setViewportSize({width: 1280, height: 900});
  await page.waitForTimeout(200);
};
