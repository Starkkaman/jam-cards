// Text-fit harness (theming plan R3; since Jam Cards 1.0.0 for the one look, Hi-Fi). Called by preview/shoot.js:
//   fitLooks(browser, base, check, {dir}) — every scenario runs once under Hi-Fi and must be clean (absolute, no comparison
// with another look any more). Measured per scenario, across every shadow root:
//  - face overflow: a .face (or a named kiosk container) whose content is wider / taller than its box;
//  - text spill: an element with its own text, overflow visible, whose content is wider than its box (text running over
//    its neighbours); clipped text (ellipsis, line clamps, overflow hidden) is a deliberate cut, not a spill;
//  - kiosk floors: own-text elements under 15px on the kiosk screens (jam-kiosk home, kiosk sheets, screensaver; Hi-Fi's
//    kiosk labels are Plex Mono 15px, the approved pass 6 / 7 kiosk);
//  - page scroll on the fixed-viewport kiosk screens, a scrolling kiosk sheet body;
//  - text contrast on the kiosk home, kiosk sheets and screensaver layouts (preview/contrast.js, >= 4.5:1, large 3:1).
// Scenarios: the preview page (all fixtures; dark + light at 390 and 1280, plus "papers fit" like shoot.js), jam-kiosk home
// (85 fixture) and the kiosk Music + TV sheets (87 fixtures) at 1024x768 and 961x601, the screensaver's 6 layouts at 961x601
// (text block inside the viewport), dark + light. With dir (JAM_SHOTS) it writes <dir>/fit-*.png for review.
const path = require("path");

/* In-page: overflow lists keyed by a stable DOM path (tag.firstClass:index from the document down, across shadow roots),
   so the Poster and look runs of one scenario can be compared. kiosk = also list text under 18px. */
function measure(kiosk) {
  const FLOOR = 15;
  const roots = [];
  const walk = r => { roots.push(r); for (const e of r.querySelectorAll("*")) if (e.shadowRoot) walk(e.shadowRoot); };
  walk(document);
  const key = e => {
    const parts = [];
    for (let x = e; x && x.nodeType === 1; ) {
      const par = x.parentNode, i = par && par.children ? [...par.children].indexOf(x) : 0;
      const c = typeof x.className === "string" ? x.className.trim().split(/\s+/)[0] : "";
      parts.unshift(x.localName + (c ? "." + c : "") + ":" + i);
      x = par && par.nodeType === 11 ? par.host : par;
    }
    return parts.join(">");
  };
  const say = e => `${e.localName}.${typeof e.className === "string" ? e.className.trim().replace(/\s+/g, ".") : ""} "${e.textContent.trim().slice(0, 24)}"`;
  const face = {}, spill = {}, small = {};
  const CONTAINERS = ".face, .poster, .now, .left, .dock, .blk, .kmain, .pane, .ktxt, .know, .kbot, .side, .kb, .shelf, .kspk, .txt, .np, .c-cw, .c-kt, .c-dock, .c-kh, .c-khome";
  for (const r of roots) for (const e of r.querySelectorAll("*")) {
    if (!e.getClientRects().length) continue;
    const cs = getComputedStyle(e);
    if (e.matches(CONTAINERS) && (e.scrollWidth > e.clientWidth + 1 || (cs.overflowY !== "visible" && cs.overflowY !== "clip" && e.scrollHeight > e.clientHeight + 1 && cs.webkitLineClamp === "none")))
      face[key(e)] = `${say(e)} ${e.scrollWidth}x${e.scrollHeight} > ${e.clientWidth}x${e.clientHeight}`;
    const own = [...e.childNodes].some(n => n.nodeType === 3 && n.textContent.trim());
    if (!own) continue;
    if (cs.display !== "inline" && cs.display !== "contents" && cs.overflowX === "visible" && e.scrollWidth > e.clientWidth + 1)
      spill[key(e)] = `${say(e)} ${e.scrollWidth} > ${e.clientWidth}`;
    if (kiosk && parseFloat(cs.fontSize) < FLOOR) small[key(e)] = `${say(e)} ${cs.fontSize}`;
  }
  const se = document.scrollingElement;
  return {face, spill, small, scroll: se.scrollHeight > innerHeight + 1 || se.scrollWidth > innerWidth + 1 ? `${se.scrollWidth}x${se.scrollHeight}` : ""};
}

module.exports = async function fitLooks(browser, base, check, {dir}) {
  const errs = [];
  const open = async (look, mode, viewport, query = "") => {
    const ctx = await browser.newContext({viewport, timezoneId: "America/Los_Angeles"});
    const p = await ctx.newPage();
    p.on("pageerror", e => errs.push(`${look}/${mode}/${viewport.width}: ${e.message}`));
    await p.clock.setFixedTime(new Date("2026-10-28T14:41:00-07:00"));
    await p.goto(`${base}?mode=${mode}${query}`);
    await p.waitForFunction(() => window.__ready);
    await p.evaluate(() => document.fonts.ready);
    return {ctx, p};
  };
  const shot = async (p, name) => {
    const n = name.replace(/^look-hifi-/, ""); // kiosk + screensaver screens go to preview/shots/, every shot to dir (JAM_SHOTS)
    if (dir) await p.screenshot({path: path.join(dir, "fit-" + n), fullPage: true});
    if (/^(kiosk|screensaver)-/.test(n)) await p.screenshot({path: path.join(__dirname, "shots", n), fullPage: true});
  };
  // Text contrast of a look's kiosk screens (preview/contrast.js; shoot.js covers the preview page): every finding fails.
  const contrastOf = async p => (await require("./contrast.js")(p)).findings;
  // A look's URL fonts load when text first uses them: measure only after they are in (a swap would change the widths).
  const meas = async (p, kiosk) => { await p.evaluate(() => document.fonts.ready); return p.evaluate(measure, kiosk); };
  // Fixture configs (taken from a normal preview page).
  const cfgs = await (async () => {
    const {ctx, p} = await open("hifi", "dark", {width: 1280, height: 900});
    try {
      return await p.evaluate(() => {
        const get = (tag, key, id) => { const e = [...document.querySelectorAll("#view " + tag)].find(x => x._config && (key ? x._config[key] === id : true)); return e && JSON.parse(JSON.stringify(e._config)); };
        return {home: get("jam-kiosk"), spk: get("jam-speaker", "entity", "media_player.ks_speaker"), tv: get("jam-tv", "media_player", "media_player.ks_tv"),
          nv: get("jam-media", "title_entity", "sensor.ks_nv_now")};
      });
    } finally { await ctx.close(); }
  })();
  const mountCard = (p, cfg, tag) => p.evaluate(([cfg, tag]) => {
    document.getElementById("view").remove();
    Object.assign(window.__hass, {locale: {language: "en", time_format: "12"}, language: "en"});
    const wrap = document.createElement("div"); wrap.style.cssText = "padding:8px 16px 16px";
    const e = document.createElement(tag); e.setConfig(cfg); e.hass = window.__hass;
    wrap.append(e); document.body.append(wrap);
  }, [cfg, tag]);

  /* Scenarios: name -> async (look) => [{label, m, layout?}] (one entry per measured state). */
  const scenarios = [];
  for (const mode of ["dark", "light"]) for (const width of [390, 1280]) scenarios.push([`preview ${mode}/${width}`, async look => {
    const {ctx, p} = await open(look, mode, {width, height: 900});
    try {
      await p.waitForTimeout(1500);
      const m = await meas(p, false);
      // Same rule as shoot.js: every card's paper stays inside the card box.
      m.layout = await p.evaluate(() => {
        const bad = [];
        for (const card of document.querySelectorAll("#view > *, #view .sec > *")) {
          if (!card.shadowRoot) continue;
          const host = card.getBoundingClientRect(), pp = card.shadowRoot.querySelector(".host > .paper");
          if (pp) { const r = pp.getBoundingClientRect(); if (r.right > host.right + 0.5 || r.bottom > host.bottom + 0.5) bad.push(card.localName + " paper outside box"); }
        }
        return [...new Set(bad)];
      });
      m.applied = await p.evaluate(() => { const c = document.querySelector("#view jam-tile"); return c ? c.dataset.look : ""; });
      await shot(p, `look-${look}-${mode}-${width}.png`);
      return [{label: "", m}];
    } finally { await ctx.close(); }
  }]);
  for (const [w, h] of [[1024, 768], [961, 601]]) {
    if (cfgs.home) for (const mode of ["dark", "light"]) scenarios.push([`jam-kiosk home ${w}x${h} ${mode}`, async look => {
      const {ctx, p} = await open(look, mode, {width: w, height: h}, "&view=none");
      try {
        await mountCard(p, cfgs.home, "jam-kiosk");
        await p.waitForTimeout(400);
        await shot(p, `look-${look}-kiosk-home-${mode}-${w}.png`);
        const m = await meas(p, true);
        m.contrast = await contrastOf(p);
        return [{label: "", m}];
      } finally { await ctx.close(); }
    }]);
    if (cfgs.spk && cfgs.tv && cfgs.nv) for (const mode of ["dark", "light"]) scenarios.push([`kiosk sheets ${w}x${h} ${mode}`, async look => {
      const {ctx, p} = await open(look, mode, {width: w, height: h}, "&view=none");
      const kiosk = {type: "custom:jam-kiosk", accent: "living", dock: [
        {name: "Music", accent: "violet", kicker: "Living room", cards: [cfgs.spk]},
        {name: "TV", accent: "teal", kicker: "Living room", columns: [3, 2], cards: [cfgs.tv, cfgs.nv]}]};
      try {
        await mountCard(p, kiosk, "jam-kiosk");
        const out = [];
        for (const [i, name] of [[0, "music"], [1, "tv"]]) {
          await p.evaluate(i => document.querySelector("jam-kiosk").shadowRoot.querySelectorAll(".c-kt .c-open")[i].click(), i);
          await p.waitForTimeout(1000);
          const m = await meas(p, true);
          m.body = await p.evaluate(() => { const b = [...document.querySelectorAll(".jam-sheet-host")].pop().shadowRoot.querySelector(".body");
            return b.scrollHeight > b.clientHeight + 1 ? `${b.scrollHeight} > ${b.clientHeight}` : ""; });
          m.contrast = await contrastOf(p);
          await shot(p, `look-${look}-kiosk-sheet-${name}${mode === "dark" ? "" : "-" + mode}-${w}.png`);
          out.push({label: name, m});
          await p.keyboard.press("Escape");
          await p.waitForTimeout(300);
        }
        return out;
      } finally { await ctx.close(); }
    }]);
  }
  for (const mode of ["dark", "light"]) scenarios.push([`screensaver layouts 961x601${mode === "dark" ? "" : " " + mode}`, async look => {
    const {ctx, p} = await open(look, mode, {width: 961, height: 601}, "&view=none");
    try {
      await p.evaluate(() => {
        const h = window.__hass, st = (id, state, attributes = {}) => ({entity_id: id, state, attributes, last_changed: "x", last_updated: "x"});
        h.states["media_player.fx_speaker"] = st("media_player.fx_speaker", "playing", {friendly_name: "Living Room Speakers", media_title: "Lobby (Extended Version)", media_artist: "AERwave"});
        const e = document.createElement("jam-screensaver");
        e.setConfig({type: "custom:jam-screensaver", idle_seconds: 3600, weather_entity: "weather.bungalo_weather", kicker: "The Bungalow · living room",
          accent: "living", now: [{type: "media", entity: "media_player.fx_speaker", states: ["playing"]}]});
        e.hass = {...h}; document.body.append(e); window.__fx = e; e._show();
      });
      await p.waitForTimeout(400);
      const out = [];
      for (let n = 0; n < 6; n++) {
        await p.evaluate(n => { const o = window.__fx.overlay; o.dataset.view = "poster";
          o.querySelector(".poster").className = "poster l" + n + " " + ["", "r", "", "c", "", "r"][n]; }, n);
        await p.waitForTimeout(300);
        const m = await meas(p, true);
        m.outside = await p.evaluate(() => { const t = window.__fx.overlay.querySelector(".poster .txt").getBoundingClientRect();
          return t.left < 0 || t.top < 0 || t.right > innerWidth + 1 || t.bottom > innerHeight + 1 ? `${Math.round(t.left)},${Math.round(t.top)} to ${Math.round(t.right)},${Math.round(t.bottom)}` : ""; });
        // Text over motif shapes (audit 2026-11-03: Pulsar's ridge band struck through the now-playing title): the ink box of
        // every text in the poster's text block (clock, date, weather, kicker, now block) against each visible look shape
        // (.sh, the layout's bars / disc / band). Any overlap larger than 2 % of the text box fails, in every look, Poster too.
        m.motif = await p.evaluate(() => {
          const o = window.__fx.overlay, out = [];
          const shapes = [...o.querySelectorAll(".poster .sh")].filter(e => e.getClientRects().length && getComputedStyle(e).visibility !== "hidden" && getComputedStyle(e).display !== "none")
            .map(e => ({e, r: e.getBoundingClientRect()})).filter(x => x.r.width > 1 && x.r.height > 1 && x.r.width * x.r.height < .5 * innerWidth * innerHeight); // a full-screen layer (Grid's page grid) is a ground, not a shape
          for (const t of o.querySelectorAll(".poster .txt *")) {
            if (![...t.childNodes].some(n => n.nodeType === 3 && n.textContent.trim()) || !t.getClientRects().length) continue;
            const g = document.createRange(); g.selectNodeContents(t); const r = g.getBoundingClientRect(); if (!r.width) continue;
            for (const {e, r: b} of shapes) {
              const a = Math.max(0, Math.min(r.right, b.right) - Math.max(r.left, b.left)) * Math.max(0, Math.min(r.bottom, b.bottom) - Math.max(r.top, b.top));
              if (a > .02 * r.width * r.height) out.push(`"${t.textContent.trim().slice(0, 16)}" under ${String(e.className).replace(/\s+/g, ".")}`);
            }
          }
          return [...new Set(out)];
        });
        m.contrast = await contrastOf(p);
        await shot(p, `look-${look}-screensaver-l${n}${mode === "dark" ? "" : "-" + mode}-961.png`);
        out.push({label: "l" + n, m});
      }
      return out;
    } finally { await ctx.close(); }
  }]);

  for (const [name, run] of scenarios) {
    const L = await run("hifi");
    for (const x of L) {
      const a = x.m, tag = `fit: ${name}${x.label ? " " + x.label : ""}`;
      const bad = [...Object.values(a.face).map(v => "overflows: " + v), ...Object.values(a.spill).map(v => "spills: " + v), ...Object.values(a.small).map(v => "under 15px: " + v)];
      if (a.scroll && !/^preview /.test(name)) bad.push("page scrolls " + a.scroll); // the preview page is long on purpose; the kiosk screens must not scroll
      if (a.body) bad.push("sheet body scrolls " + a.body);
      if (a.outside) bad.push("text block outside the viewport " + a.outside);
      if (a.motif && a.motif.length) bad.push(...a.motif.map(v => "text over a motif shape: " + v));
      if (a.layout && a.layout.length) bad.push(...a.layout);
      if ("applied" in a && a.applied !== "hifi") bad.push(`cards carry data-look=${a.applied}, not hifi`);
      if (a.contrast && a.contrast.length) bad.push(...a.contrast.map(f => `contrast ${f.card} ${f.el} "${f.text}" ${f.ratio}:1 < ${f.need} (${f.fg} on ${f.bg} ${f.font})`));
      check(bad.length === 0, `${tag}: text fits, nothing overflows, spills or scrolls` + (bad.length ? " — " + bad.slice(0, 6).join("; ") + (bad.length > 6 ? ` (+${bad.length - 6})` : "") : ""));
    }
  }
  check(errs.length === 0, "fit pages: no page errors" + (errs.length ? ": " + errs.slice(0, 3).join("; ") : ""));
};
