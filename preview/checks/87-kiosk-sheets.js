// size "kiosk" (0.6.0; fixture preview/fixtures/87-kiosk-sheets.js): jam-speaker, jam-tv and jam-media (NerveOS) in jam-kiosk
// fullscreen sheets, on clean pages at the iPad (1024x768) and Echo Show (961x601) viewports, dark + light:
//  - Music sheet (jam-speaker kiosk = K1, round 3): art flush left (58 %), right panel in the art's dominant colour (text ink
//    or paper by luminance, >= 4.5:1), title 36-76px (<= 3 lines), Prev / Play / Next >= 52px, volume bar >= 48px + Speakers
//    key, bottom shelf >= 88px of 5 covers + Browse (labels 18px); Speakers view rows >= 64px; Browse opens panel B
//    fullscreen; a shelf cover plays its uri; the card fills the sheet body and nothing scrolls or overflows
//  - TV sheet (columns [3, 2]): jam-tv ≈ 60% + jam-media ≈ 40%, poster ≈ 45% of the card height, keys >= 64px, source
//    tiles >= 64px, NerveOS art square + ⋯ sheet still opens; NerveOS idle ("Nothing") shows "Idle" (0.6.1)
//  - nothing under 18px in any kiosk card; art present (img) with a picture, Golden Arm bars without one / on a broken URL
// Writes preview/shots/kiosk-sheet-{music,tv}-{dark,light}-{1024,961}.png + kiosk-sheet-{speakers,sources}-dark-{1024,961}.png
// + kiosk-sheet-music-panel-{dark,light}-{1024,961}.png.
const path = require("path");

module.exports = async (page, check) => {
  const cfgs = await page.evaluate(() => {
    const get = (tag, key, id) => { const e = [...document.querySelectorAll("#view " + tag)].find(x => x._config && x._config[key] === id); return e && JSON.parse(JSON.stringify(e._config)); };
    return {spk: get("jam-speaker", "entity", "media_player.ks_speaker"), tv: get("jam-tv", "media_player", "media_player.ks_tv"),
      nv: get("jam-media", "title_entity", "sensor.ks_nv_now")};
  });
  check(!!(cfgs.spk && cfgs.tv && cfgs.nv), "kiosk sheets: fixture cards (speaker, TV, NerveOS) on the preview page");
  if (!(cfgs.spk && cfgs.tv && cfgs.nv)) return;
  const browser = page.context().browser(), base = page.url().replace(/\?.*$/, "");
  const shots = path.join(__dirname, "..", "shots");
  const errs = [];
  const kiosk = {type: "custom:jam-kiosk", accent: "living", dock: [
    {name: "Music", accent: "violet", kicker: "Living room", cards: [cfgs.spk]},
    {name: "TV", accent: "teal", kicker: "Living room", columns: [3, 2], cards: [cfgs.tv, cfgs.nv]},
    {name: "Lights", accent: "living", cards: []},
  ]};

  const mount = async (w, h, mode) => {
    const ctx = await browser.newContext({viewport: {width: w, height: h}, timezoneId: "America/Los_Angeles"});
    const p = await ctx.newPage();
    p.on("pageerror", e => errs.push(`${w}/${mode}: ${e.message}`));
    await p.goto(`${base}?view=none&mode=${mode}`);
    await p.waitForFunction(() => window.__ready);
    await p.evaluate(cfg => {
      document.getElementById("view").remove();
      const wrap = document.createElement("div"); wrap.style.cssText = "padding:8px 16px 16px";
      const e = document.createElement("jam-kiosk"); e.setConfig(cfg); e.hass = window.__hass;
      wrap.append(e); document.body.append(wrap);
    }, kiosk);
    await p.evaluate(() => document.fonts.ready);
    return {ctx, p};
  };
  const openBlock = async (p, i) => {
    await p.evaluate(i => document.querySelector("jam-kiosk").shadowRoot.querySelectorAll(".blk")[i].click(), i);
    await p.waitForTimeout(700);
  };
  // Measures the open sheet: body scroll, every kiosk card (box, overflow, small text, art) + named parts.
  const measure = p => p.evaluate(() => {
    const host = [...document.querySelectorAll(".jam-sheet-host")].pop(), r = host.shadowRoot, body = r.querySelector(".body");
    const bb = body.getBoundingClientRect(), fs = e => parseFloat(getComputedStyle(e).fontSize);
    const R = e => { const b = e.getBoundingClientRect(); return {w: Math.round(b.width), h: Math.round(b.height), l: Math.round(b.left), t: Math.round(b.top), b: Math.round(b.bottom), r: Math.round(b.right)}; };
    const cards = [...body.children].map(c => {
      const s = c.shadowRoot, q = x => s.querySelector(x), qa = x => [...s.querySelectorAll(x)].filter(e => e.getClientRects().length);
      const small = [], over = [];
      for (const e of s.querySelectorAll("*")) {
        if (!e.getClientRects().length) continue;
        const own = [...e.childNodes].some(n => n.nodeType === 3 && n.textContent.trim());
        if (own && fs(e) < 18) small.push(`${e.className}: ${fs(e)}px "${e.textContent.trim().slice(0, 16)}"`);
      }
      for (const e of s.querySelectorAll(".face, .kmain, .pane, .ktxt, .know, .kbot, .side, .kb, .shelf, .kspk")) if (e.getClientRects().length && (e.scrollWidth > e.clientWidth + 1 || e.scrollHeight > e.clientHeight + 1)) over.push(`${e.className} ${e.scrollWidth}x${e.scrollHeight}>${e.clientWidth}x${e.clientHeight}`);
      const tl = q(".title .tl"), title = q(".title");
      const kart = q(".kart, .poster");
      return {tag: c.localName, box: R(c), small, over, img: !!(kart && kart.querySelector("img")), bars: !!(kart && kart.querySelector(".arm")),
        art: kart ? R(kart) : null, title: title ? fs(title) : 0, lines: tl ? Math.round(tl.getBoundingClientRect().height / (fs(title) * .92)) : 0,
        keys: qa(".keys .key, .kkeys .key").map(k => Math.round(k.getBoundingClientRect().height)),
        vol: qa(".kiosk .vol .vt").map(k => Math.round(k.getBoundingClientRect().height)),
        rows: qa(".klist .spk").map(k => Math.round(k.getBoundingClientRect().height)),
        tiles: qa(".src .key").map(k => Math.round(k.getBoundingClientRect().height)),
        seg: qa(".seg .key").map(k => Math.round(k.getBoundingClientRect().height)),
        // K1 (jam-speaker kiosk)
        kt: qa(".kt .key").map(k => Math.round(k.getBoundingClientRect().height)), kv: qa(".kv .vt").map(k => Math.round(k.getBoundingClientRect().height)),
        kspk: qa('.kv [data-key="speakers"]').length, side: q(".side") ? {...R(q(".side")), bg: getComputedStyle(q(".side")).backgroundColor, fg: getComputedStyle(q(".side")).color} : null,
        shelf: q(".shelf") ? R(q(".shelf")) : null, tilesK: qa(".shelf .tile").map(t => t.querySelector(".nm").textContent),
        tileFs: qa(".shelf .tile .nm").map(fs)};
    });
    return {body: R(body), scroll: body.scrollHeight > body.clientHeight + 1 ? `${body.scrollHeight}>${body.clientHeight}` : "", cards};
  });
  const fits = (m, c) => c.box.b <= m.body.b + 1 && c.box.r <= m.body.r + 1 && c.box.h >= m.body.h - 8; // body has 2px/4px padding
  const minOf = a => a.length ? Math.min(...a) : 0;

  for (const [w, h] of [[1024, 768], [961, 601]]) for (const mode of ["dark", "light"]) {
    const tag = `kiosk sheets ${w}x${h} ${mode}`;
    const {ctx, p} = await mount(w, h, mode);
    // ---- Music (K1) ----
    await openBlock(p, 0);
    await p.waitForTimeout(300); // shelf (pins / recent) and the art colour arrive after the first paint
    let m = await measure(p), s = m.cards[0];
    check(m.cards.length === 1 && s.tag === "jam-speaker" && !m.scroll && fits(m, s) && s.over.length === 0,
      `${tag}: Music sheet — jam-speaker K1 fills the body (${s.box.w}x${s.box.h} in ${m.body.w}x${m.body.h}), no scroll` + (m.scroll ? " — scrolls " + m.scroll : "") + (s.over.length ? " — " + s.over.join("; ") : ""));
    const aw = s.art.w / s.box.w, rgb = x => (x.match(/\d+(\.\d+)?/g) || []).slice(0, 3).map(Number);
    const lum = c => { const l = c.map(v => { v /= 255; return v <= .04045 ? v / 12.92 : ((v + .055) / 1.055) ** 2.4; }); return .2126 * l[0] + .7152 * l[1] + .0722 * l[2]; };
    const cr = (a, b) => { const x = lum(rgb(a)), y = lum(rgb(b)); return (Math.max(x, y) + .05) / (Math.min(x, y) + .05); };
    check(s.img && aw > .56 && aw < .6 && s.art.l === s.box.l && s.art.t === s.box.t && s.side.bg !== "rgb(155, 109, 214)" && cr(s.side.bg, s.side.fg) >= 4.5 &&
      s.title >= 36 && s.title <= 76 && s.lines <= 3 && s.kt.length === 3 && minOf(s.kt) >= 52 && minOf(s.kv) >= 48 && s.kspk === 1,
      `${tag}: Music — art flush left ${Math.round(aw * 100)}%, panel ${s.side.bg} / text ${s.side.fg} (${cr(s.side.bg, s.side.fg).toFixed(1)}:1), title ${s.title}px / ${s.lines} lines, keys ${s.kt}, volume ${s.kv}, Speakers key ${s.kspk}`);
    check(s.shelf && s.shelf.h >= 88 && s.shelf.b === s.box.b && s.tilesK.length === 6 && s.tilesK[5] === "Browse" && s.tilesK.slice(0, 3).join(",") === "Cooking,Sunday,Dinner party" &&
      s.tileFs.every(f => f >= 18),
      `${tag}: Music — shelf ${s.shelf && s.shelf.h}px: pinned, then recent, then Browse (${s.tilesK.join(", ")})`);
    check(s.small.length === 0, `${tag}: Music — nothing under 18px` + (s.small.length ? " — " + s.small.slice(0, 4).join("; ") : ""));
    await p.screenshot({path: path.join(shots, `kiosk-sheet-music-${mode}-${w}.png`)});
    // A shelf cover plays its uri; Browse opens panel B fullscreen over the sheet (bigger type, 18px floor).
    const played = await p.evaluate(() => {
      window.__calls.length = 0;
      [...document.querySelectorAll(".jam-sheet-host")].pop().shadowRoot.querySelector("jam-speaker").shadowRoot.querySelector(".shelf .tile").click();
      return window.__calls.slice();
    });
    check(played.length === 1 && played[0].service === "play_media" && played[0].data.media_id === "library://playlist/1" && played[0].data.entity_id === "media_player.ks_speaker",
      `${tag}: a shelf cover -> music_assistant.play_media (${JSON.stringify(played)})`);
    await p.evaluate(() => [...document.querySelectorAll(".jam-sheet-host")].pop().shadowRoot.querySelector("jam-speaker").shadowRoot.querySelector('[data-key="browse"]').click());
    await p.waitForTimeout(450);
    const pb = await p.evaluate(() => {
      const hs = document.querySelectorAll(".jam-sheet-host"), r = hs[hs.length - 1].shadowRoot, pop = r.querySelector(".pop"), face = r.querySelector(".face[role=dialog]");
      const small = [];
      for (const e of r.querySelectorAll(".face *")) {
        if (!e.getClientRects().length || e.closest("input")) continue;
        const own = [...e.childNodes].some(n => n.nodeType === 3 && n.textContent.trim());
        if (own && parseFloat(getComputedStyle(e).fontSize) < 18) small.push(e.className + ": " + e.textContent.trim().slice(0, 12));
      }
      const fb = face.getBoundingClientRect();
      return {n: hs.length, full: pop.classList.contains("full") && pop.classList.contains("mu"), w: Math.round(fb.width), h: Math.round(fb.height),
        rows: r.querySelectorAll(".body .row").length, dock: !!r.querySelector(".dock"), small, scroll: face.scrollHeight > face.clientHeight + 1};
    });
    check(pb.n === 2 && pb.full && pb.w === w && pb.h === h && pb.rows >= 3 && pb.dock && !pb.small.length && !pb.scroll,
      `${tag}: Browse -> panel B fullscreen over the sheet (${pb.w}x${pb.h}, ${pb.rows} rows, dock), nothing under 18px` + (pb.small.length ? " — " + pb.small.slice(0, 4).join("; ") : ""));
    await p.screenshot({path: path.join(shots, `kiosk-sheet-music-panel-${mode}-${w}.png`)});
    await p.keyboard.press("Escape"); await p.waitForTimeout(200);
    // Speakers view (the Speakers key by the volume bar)
    await p.evaluate(() => [...document.querySelectorAll(".jam-sheet-host")].pop().shadowRoot.querySelector("jam-speaker").shadowRoot.querySelector('.kv [data-key="speakers"]').click());
    await p.waitForTimeout(400);
    m = await measure(p); s = m.cards[0];
    check(s.rows.length === 3 && minOf(s.rows) >= 64 && !m.scroll && s.over.length === 0 && s.small.length === 0 && s.shelf,
      `${tag}: Speakers view — ${s.rows.length} rows (${s.rows.join(",")}px), shelf kept, no scroll, nothing under 18px` + (s.over.length ? " — " + s.over.join("; ") : "") + (s.small.length ? " — " + s.small.slice(0, 3).join("; ") : ""));
    if (mode === "dark") await p.screenshot({path: path.join(shots, `kiosk-sheet-speakers-dark-${w}.png`)});
    await p.keyboard.press("Escape"); await p.waitForTimeout(200);
    // ---- TV ----
    await openBlock(p, 1);
    m = await measure(p);
    const [t, n] = m.cards;
    const share = t.box.w / (t.box.w + n.box.w);
    check(m.cards.length === 2 && t.tag === "jam-tv" && n.tag === "jam-media" && share > .57 && share < .63 && !m.scroll && fits(m, t) && fits(m, n) &&
      t.over.length === 0 && n.over.length === 0,
      `${tag}: TV sheet — jam-tv ${t.box.w}px (${Math.round(share * 100)}%) + NerveOS ${n.box.w}px, both ${t.box.h}px tall, no scroll` + (m.scroll ? " — scrolls " + m.scroll : "") + [...t.over, ...n.over].map(x => " — " + x).join(""));
    const ph = t.art.h / t.box.h;
    check(t.img && ph > (w === 1024 ? .38 : .3) && ph < .5 && t.title >= 40 && minOf(t.keys) >= 64 && minOf(t.seg) >= 56,
      `${tag}: TV — poster ${t.art.h}px (${Math.round(ph * 100)}% of the card), title ${t.title}px, keys ${t.keys.join(",")}, switch ${t.seg}`);
    check(n.img && Math.abs(n.art.w - n.art.h) <= 1 && n.art.w >= (w === 1024 ? 260 : 150) && n.title >= 36 && minOf(n.keys) >= 64,
      `${tag}: NerveOS — square art ${n.art.w}px, title ${n.title}px, keys ${n.keys.join(",")}`);
    check(t.small.length === 0 && n.small.length === 0, `${tag}: TV sheet — nothing under 18px` + [...t.small, ...n.small].slice(0, 4).map(x => " — " + x).join(""));
    await p.screenshot({path: path.join(shots, `kiosk-sheet-tv-${mode}-${w}.png`)});
    // Source tab
    await p.evaluate(() => [...document.querySelectorAll(".jam-sheet-host")].pop().shadowRoot.querySelector("jam-tv").shadowRoot.querySelector('.seg [data-tab="source"]').click());
    await p.waitForTimeout(300);
    m = await measure(p);
    check(m.cards[0].tiles.length === 6 && minOf(m.cards[0].tiles) >= 64 && !m.scroll && m.cards[0].over.length === 0 && m.cards[0].small.length === 0,
      `${tag}: TV sources — ${m.cards[0].tiles.length} tiles (${m.cards[0].tiles.join(",")}px), no scroll, nothing under 18px` + m.cards[0].over.map(x => " — " + x).join(""));
    if (mode === "dark") await p.screenshot({path: path.join(shots, `kiosk-sheet-sources-dark-${w}.png`)});
    if (mode === "dark" && w === 1024) {
      // NerveOS ⋯ still opens its sheet (over the TV sheet), with hass for its cards.
      const more = await p.evaluate(async () => {
        const nv = [...document.querySelectorAll(".jam-sheet-host")].pop().shadowRoot.querySelector("jam-media");
        nv.shadowRoot.querySelector('[data-key="more"]').click();
        await new Promise(r => setTimeout(r, 300));
        const hs = document.querySelectorAll(".jam-sheet-host"), top = hs[hs.length - 1].shadowRoot;
        const kids = [...top.querySelector(".body").children];
        return {n: hs.length, title: top.querySelector(".t h2").textContent, kids: kids.map(k => k.localName).join(","), fed: kids.every(k => !!k.hass)};
      });
      check(more.n === 2 && more.title === "NerveOS" && more.kids === "jam-tile,jam-slider" && more.fed, `kiosk sheets: NerveOS ⋯ opens its sheet over the TV sheet (${JSON.stringify(more)})`);
      // Fallback art: no picture -> Golden Arm bars; a broken URL -> bars after the error.
      await p.keyboard.press("Escape"); await p.keyboard.press("Escape"); await p.waitForTimeout(200);
      await p.evaluate(() => {
        const h = window.__hass, set = (id, a) => { h.states[id] = {...h.states[id], attributes: {...h.states[id].attributes, ...a}, last_updated: String(Math.random())}; };
        set("media_player.ks_speaker", {entity_picture: null, media_title: "A very long song title that runs over three whole lines of poster type here"});
        set("media_player.ks_tv", {entity_picture: "/broken/art.png"});
        set("image.ks_nv_art", {entity_picture: null});
        document.querySelector("jam-kiosk").hass = {...h};
      });
      await openBlock(p, 0);
      m = await measure(p); s = m.cards[0];
      check(!s.img && s.bars && s.lines <= 3 && !m.scroll && s.over.length === 0 && s.side.bg === "rgb(155, 109, 214)",
        `kiosk sheets: Music without art -> Golden Arm bars + violet panel; a long title clamps to ${s.lines} lines, still fits (${JSON.stringify({img: s.img, bars: s.bars, lines: s.lines, scroll: m.scroll, over: s.over, bg: s.side.bg})})`);
      await p.screenshot({path: path.join(shots, "kiosk-sheet-music-noart-dark-1024.png")});
      await p.keyboard.press("Escape"); await p.waitForTimeout(200);
      await openBlock(p, 1);
      await p.waitForTimeout(300);
      m = await measure(p);
      check(!m.cards[0].img && m.cards[0].bars && !m.cards[1].img && m.cards[1].bars, "kiosk sheets: TV with a broken art URL and NerveOS without art -> Golden Arm bars");
      // 0.6.1: NerveOS idle — the now-playing sensor says "Nothing" / "none" / "IDLE": title "Idle", "Nothing" nowhere.
      const idle = [];
      for (const word of ["Nothing", "none", "IDLE"]) idle.push(await p.evaluate(async word => {
        const h = window.__hass;
        h.states["sensor.ks_nv_now"] = {...h.states["sensor.ks_nv_now"], state: word, last_updated: String(Math.random())};
        document.querySelector("jam-kiosk").hass = {...h};
        await new Promise(r => setTimeout(r, 100));
        const nv = [...document.querySelectorAll(".jam-sheet-host")].pop().shadowRoot.querySelector("jam-media"), sr = nv.shadowRoot;
        const t = sr.querySelector(".title");
        return {word, title: t ? t.textContent : "", nothing: /nothing/i.test(sr.textContent), ok: !new RegExp("^" + word + "$", "i").test(t ? t.textContent.trim() : "")};
      }, word));
      check(idle.every(x => x.title === "Idle" && !x.nothing && (x.word === "IDLE" || x.ok)),
        `kiosk sheets: NerveOS idle ("Nothing" / "none" / "IDLE") shows "Idle", never "Nothing" (${idle.map(x => x.word + " -> " + x.title).join(", ")})`);
    }
    await ctx.close();
  }
  check(errs.length === 0, "kiosk sheets: no page errors" + (errs.length ? ": " + errs.slice(0, 3).join("; ") : ""));
};
