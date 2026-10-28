// size "kiosk" (0.6.0; fixture preview/fixtures/87-kiosk-sheets.js): jam-speaker, jam-tv and jam-media (NerveOS) in jam-kiosk
// fullscreen sheets, on clean pages at the iPad (1024x768) and Echo Show (961x601) viewports, dark + light:
//  - Music sheet (jam-speaker kiosk): two columns, square art ≈ 46% (<= 440px) left, title 44-72px (<= 3 lines), keys >= 72px,
//    volume bar >= 48px; Speakers tab rows >= 64px; the card fills the sheet body and nothing scrolls or overflows
//  - TV sheet (columns [3, 2]): jam-tv ≈ 60% + jam-media ≈ 40%, poster ≈ 45% of the card height, keys >= 64px, source
//    tiles >= 64px, NerveOS art square + ⋯ sheet still opens
//  - nothing under 18px in any kiosk card; art present (img) with a picture, Golden Arm bars without one / on a broken URL
// Writes preview/shots/kiosk-sheet-{music,tv}-{dark,light}-{1024,961}.png + kiosk-sheet-{speakers,sources}-dark-{1024,961}.png.
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
      for (const e of s.querySelectorAll(".face, .kmain, .pane, .ktxt, .know, .kbot")) if (e.getClientRects().length && (e.scrollWidth > e.clientWidth + 1 || e.scrollHeight > e.clientHeight + 1)) over.push(`${e.className} ${e.scrollWidth}x${e.scrollHeight}>${e.clientWidth}x${e.clientHeight}`);
      const tl = q(".title .tl"), title = q(".title");
      const kart = q(".kart, .poster");
      return {tag: c.localName, box: R(c), small, over, img: !!(kart && kart.querySelector("img")), bars: !!(kart && kart.querySelector(".arm")),
        art: kart ? R(kart) : null, title: title ? fs(title) : 0, lines: tl ? Math.round(tl.getBoundingClientRect().height / (fs(title) * .92)) : 0,
        keys: qa(".keys .key, .kkeys .key").map(k => Math.round(k.getBoundingClientRect().height)),
        vol: qa(".kiosk .vol .vt").map(k => Math.round(k.getBoundingClientRect().height)),
        rows: qa(".klist .spk").map(k => Math.round(k.getBoundingClientRect().height)),
        tiles: qa(".src .key").map(k => Math.round(k.getBoundingClientRect().height)),
        seg: qa(".seg .key").map(k => Math.round(k.getBoundingClientRect().height))};
    });
    return {body: R(body), scroll: body.scrollHeight > body.clientHeight + 1 ? `${body.scrollHeight}>${body.clientHeight}` : "", cards};
  });
  const fits = (m, c) => c.box.b <= m.body.b + 1 && c.box.r <= m.body.r + 1 && c.box.h >= m.body.h - 8; // body has 2px/4px padding
  const minOf = a => a.length ? Math.min(...a) : 0;

  for (const [w, h] of [[1024, 768], [961, 601]]) for (const mode of ["dark", "light"]) {
    const tag = `kiosk sheets ${w}x${h} ${mode}`;
    const {ctx, p} = await mount(w, h, mode);
    // ---- Music ----
    await openBlock(p, 0);
    let m = await measure(p), s = m.cards[0];
    check(m.cards.length === 1 && s.tag === "jam-speaker" && !m.scroll && fits(m, s) && s.over.length === 0,
      `${tag}: Music sheet — jam-speaker kiosk fills the body (${s.box.w}x${s.box.h} in ${m.body.w}x${m.body.h}), no scroll` + (m.scroll ? " — scrolls " + m.scroll : "") + (s.over.length ? " — " + s.over.join("; ") : ""));
    const aw = s.art.w / (s.box.w - 48);
    check(s.img && s.art.w === s.art.h && s.art.w <= 440 && s.art.w >= 280 && aw <= .47 && s.title >= 44 && s.title <= 72 && s.lines <= 3 &&
      minOf(s.keys) >= 72 && s.keys.length === 4 && minOf(s.vol) >= 48 && minOf(s.seg) >= 56,
      `${tag}: Music — square art ${s.art.w}px (${Math.round(aw * 100)}% of the width), title ${s.title}px / ${s.lines} lines, keys ${s.keys.join(",")}, volume ${s.vol}, switch ${s.seg}`);
    check(s.small.length === 0, `${tag}: Music — nothing under 18px` + (s.small.length ? " — " + s.small.slice(0, 4).join("; ") : ""));
    await p.screenshot({path: path.join(shots, `kiosk-sheet-music-${mode}-${w}.png`)});
    // Speakers tab
    await p.evaluate(() => [...document.querySelectorAll(".jam-sheet-host")].pop().shadowRoot.querySelector("jam-speaker").shadowRoot.querySelector('.seg [data-tab="speakers"]').click());
    await p.waitForTimeout(400);
    m = await measure(p); s = m.cards[0];
    check(s.rows.length === 3 && minOf(s.rows) >= 64 && !m.scroll && s.over.length === 0 && s.small.length === 0 && s.img,
      `${tag}: Speakers tab — ${s.rows.length} rows (${s.rows.join(",")}px), art kept, no scroll, nothing under 18px` + (s.over.length ? " — " + s.over.join("; ") : "") + (s.small.length ? " — " + s.small.slice(0, 3).join("; ") : ""));
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
      check(!s.img && s.bars && s.lines <= 3 && !m.scroll && s.over.length === 0, `kiosk sheets: Music without art -> Golden Arm bars; a long title clamps to ${s.lines} lines, still fits (${JSON.stringify({img: s.img, bars: s.bars, lines: s.lines, scroll: m.scroll, over: s.over})})`);
      await p.screenshot({path: path.join(shots, "kiosk-sheet-music-noart-dark-1024.png")});
      await p.keyboard.press("Escape"); await p.waitForTimeout(200);
      await openBlock(p, 1);
      await p.waitForTimeout(300);
      m = await measure(p);
      check(!m.cards[0].img && m.cards[0].bars && !m.cards[1].img && m.cards[1].bars, "kiosk sheets: TV with a broken art URL and NerveOS without art -> Golden Arm bars");
    }
    await ctx.close();
  }
  check(errs.length === 0, "kiosk sheets: no page errors" + (errs.length ? ": " + errs.slice(0, 3).join("; ") : ""));
};
