// Review views of a non-Poster look (Braun first): the sheets and states the Poster behaviour checks (preview/checks/*) shoot
// only under Poster, written to preview/shots/<look>/views/ for both modes, plus a controls check on each opened view.
// Called by preview/shoot.js for every non-Poster look of LOOKS (JAM_NO_VIEWS=1 skips it):
//   lookViews(browser, base, check, {look, dir})
// Views (dark + light): popup-<mode>-390 (jam-popup bottom sheet), light-cards-<mode>-390, light-sheet-{group,wled,edit}-<mode>-390,
// tv-remote-sheet-<mode>-390, tv-source-sheet-<mode>-390, watch-play-<mode>-390, speakers-<mode>-390 (the speaker section),
// speaker-panel-{pinned,speakers}-<mode>-1280 (panel B), kiosk-sheet-{music,tv}-<mode>-{1024,961} (jam-kiosk sheets; fit.js
// shoots the dark ones too), kiosk-dock-states-<mode>-1024 + kiosk-unlocked-<mode>-1024 (jam-kiosk home with its dock
// states, then the door unlocked), screensaver-{clock,photos}-<mode>-961, looks-picker-<mode>-{390,1280} (jam-looks, every look's
// swatch in its own font, this look picked).
// Check per opened view ("controls present"): every visible button / [role=button] / [role=slider] in the open sheet (or the
// page section) is at least 1px in both directions, inside the viewport horizontally, and its centre hits itself (not
// covered by look CSS); the focus ring of the first control is a visible outline (or, for a Braun toggle, its pill's outline).
const path = require("path");
const fs = require("fs");

module.exports = async function lookViews(browser, base, check, {look, dir}) {
  const out = path.join(dir, "views");
  fs.mkdirSync(out, {recursive: true});
  const T = `look ${look} views`;
  const open = async (mode, viewport, query = "", fixed = true) => {
    const ctx = await browser.newContext({viewport, timezoneId: "America/Los_Angeles"});
    const p = await ctx.newPage();
    if (fixed) await p.clock.setFixedTime(new Date("2026-10-28T14:41:00-07:00")); // the screensaver's idle timer needs a running clock
    await p.goto(`${base}?mode=${mode}&look=${look}${process.env.JAM_FX === "0" ? "&fx=0" : ""}${query}`); // JAM_FX=0: effects off (shoot.js)
    await p.waitForFunction(() => window.__ready);
    await p.evaluate(() => document.fonts.ready);
    await p.waitForTimeout(900);
    return {ctx, p};
  };
  const shot = (p, name, opts = {}) => p.screenshot({path: path.join(out, name), ...opts});
  /* Controls in the topmost sheet (.jam-sheet-host / jam-popup .pop.open), or under `sel` on the page. */
  const controls = (p, what, sel) => p.evaluate(sel => {
    const roots = [];
    const walk = r => { roots.push(r); for (const e of r.querySelectorAll("*")) if (e.shadowRoot) walk(e.shadowRoot); };
    let scope;
    if (sel) { const e = document.querySelector(sel); scope = e && (e.shadowRoot || e); }
    else {
      const host = [...document.querySelectorAll(".jam-sheet-host")].pop();
      if (host) scope = host.shadowRoot;
      else { const pop = [...document.querySelectorAll("jam-popup")].find(e => e.shadowRoot.querySelector(".pop.open")); scope = pop && pop.shadowRoot; }
    }
    if (!scope) return {n: 0, bad: ["no open view"]};
    walk(scope);
    const deep = (x, y) => { let e = document.elementFromPoint(x, y); while (e && e.shadowRoot) { const n = e.shadowRoot.elementFromPoint(x, y); if (!n || n === e) break; e = n; } return e; };
    const within = (a, b) => { for (let x = a; x; x = x.parentNode || x.host) if (x === b) return true; return false; };
    const bad = [];
    let n = 0;
    for (const r of roots) for (const b of r.querySelectorAll("button, [role=button], [role=slider]")) {
      if (!b.getClientRects().length || getComputedStyle(b).visibility === "hidden") continue;
      const rc = b.getBoundingClientRect();
      if (rc.bottom < 0 || rc.top > innerHeight) continue; // scrolled out of the view
      n++;
      const name = (b.getAttribute("aria-label") || b.textContent || b.className).trim().slice(0, 24);
      if (rc.width < 1 || rc.height < 1) { bad.push(`${name}: ${rc.width}x${rc.height}`); continue; }
      if (rc.left < -1 || rc.right > innerWidth + 1) { bad.push(`${name}: outside the viewport`); continue; }
      const cx = Math.min(innerWidth - 1, Math.max(0, rc.left + rc.width / 2)), cy = Math.min(innerHeight - 1, Math.max(0, rc.top + rc.height / 2));
      const hit = deep(cx, cy);
      if (cy > 0 && cy < innerHeight - 1 && hit && !within(hit, b) && !within(b, hit)) bad.push(`${name}: covered by ${hit.localName}.${hit.className}`);
    }
    return {n, bad};
  }, sel || null);
  const ctlCheck = async (p, what, sel) => {
    const c = await controls(p, what, sel);
    check(c.n > 0 && c.bad.length === 0, `${T}: ${what}: ${c.n} controls present, sized, inside the view and not covered` + (c.bad.length ? " — " + c.bad.slice(0, 5).join("; ") : ""));
    if (!sel) await ctCheck(p, what);
  };
  /* Text contrast with the view open (preview/contrast.js walks the sheets and the screensaver layer too). */
  const ctCheck = async (p, what) => {
    // Let finite animations end first: the screensaver views run on the wall clock, and a minute tick re-cuts the layout
    // (.shift .txt pops its opacity in); text measured mid-fade read as low contrast (New Wave "AM" 3.76:1 = #4d4675 at ~70%).
    await p.evaluate(() => Promise.race([new Promise(r => setTimeout(r, 2000)),
      (() => { const all = new Set(document.getAnimations()), walk = n => { for (const e of n.querySelectorAll("*")) if (e.shadowRoot) {
          for (const x of e.shadowRoot.getAnimations()) all.add(x); walk(e.shadowRoot); } }; walk(document);
        return Promise.all([...all].filter(a => { const t = a.effect && a.effect.getComputedTiming(); return t && Number.isFinite(t.endTime); })
          .map(a => a.finished.catch(() => {}))); })()]));
    const ct = await require("./contrast.js")(p);
    check(ct.findings.length === 0, `${T}: ${what}: text contrast >= 4.5:1 (large >= 3:1) for ${ct.texts} texts` +
      (ct.findings.length ? " — " + ct.findings.slice(0, 4).map(f => `${f.card} "${f.text}" ${f.ratio}:1 ${f.fg} on ${f.bg}`).join("; ") : ""));
  };

  for (const mode of ["dark", "light"]) {
    // ---- 390: popup, light sheets, TV sheets, speakers ----
    {
      const {ctx, p} = await open(mode, {width: 390, height: 844});
      try {
        await p.evaluate(() => { location.hash = "#livingroom-popup"; });
        await p.waitForTimeout(500);
        await ctlCheck(p, `${mode}/390 jam-popup`);
        await shot(p, `popup-${mode}-390.png`);
        await p.keyboard.press("Escape"); await p.waitForTimeout(250);
        await p.locator(".sec").filter({has: p.locator("jam-light")}).first().screenshot({path: path.join(out, `light-cards-${mode}-390.png`)});
        for (const [name, card] of [["group", "Living room"], ["wled", "TV light"], ["edit", "Living room"]]) {
          await p.locator(".sec > jam-light").filter({hasText: card}).locator(".tap").click();
          await p.waitForTimeout(450);
          if (name === "edit") {
            const r = p.locator(".jam-sheet-host");
            await r.locator("button.edit").click();
            await r.locator(".wt").first().click();
            await p.waitForTimeout(150);
          }
          await ctlCheck(p, `${mode}/390 light sheet (${name})`);
          await shot(p, `light-sheet-${name}-${mode}-390.png`);
          await p.keyboard.press("Escape"); await p.waitForTimeout(200);
        }
        const tv = p.locator("jam-tv").nth(0);
        await tv.scrollIntoViewIfNeeded();
        await p.locator("#view > .sec", {has: p.locator("jam-tv")}).first().screenshot({path: path.join(out, `watch-play-${mode}-390.png`)});
        await ctlCheck(p, `${mode}/390 jam-tv card`, "#view jam-tv");
        await tv.locator('button[data-key="remote"]').click(); await p.waitForTimeout(450);
        await ctlCheck(p, `${mode}/390 TV remote sheet`);
        await shot(p, `tv-remote-sheet-${mode}-390.png`);
        await p.keyboard.press("Escape"); await p.waitForTimeout(250);
        await tv.locator('button[data-key="source"]').click(); await p.waitForTimeout(450);
        await ctlCheck(p, `${mode}/390 TV source sheet`);
        await shot(p, `tv-source-sheet-${mode}-390.png`);
        await p.keyboard.press("Escape"); await p.waitForTimeout(250);
        const spk = p.locator("#view > .sec", {has: p.locator("jam-speaker")}).first();
        await spk.scrollIntoViewIfNeeded();
        await spk.screenshot({path: path.join(out, `speakers-${mode}-390.png`)});
        // Focus ring: Tab onto the first jam-light toggle (power corner) and read its outline (the pill's in Braun).
        const ring = await p.evaluate(() => {
          const c = document.querySelector("#view jam-light"), b = c.shadowRoot.querySelector("button.pw");
          b.focus({focusVisible: true});
          const own = getComputedStyle(b), pill = getComputedStyle(b, "::before");
          const vis = s => s.outlineStyle !== "none" && parseFloat(s.outlineWidth) >= 2;
          return {own: vis(own), pill: vis(pill), w: own.outlineWidth + "/" + pill.outlineWidth};
        });
        check(ring.own || ring.pill, `${T}: ${mode} focus ring visible on a jam-light power toggle (${ring.w})`);
      } finally { await ctx.close(); }
    }
    // ---- jam-looks (look picker): the full picker alone on the page, this look's theme picked, 390 + 1280 ----
    for (const width of [390, 1280]) {
      const {ctx, p} = await open(mode, {width, height: 844});
      try {
        const st = await p.evaluate(async () => {
          document.getElementById("view").remove();
          window.JamCards.motion = false; // a card mounted late on the fixed-clock page would sit in its entrance start frame
          const h = window.__hass, wrap = document.createElement("div"); wrap.id = "looks-view"; wrap.style.cssText = "max-width:640px;padding:16px";
          const e = document.createElement("jam-looks"); e.setConfig({type: "custom:jam-looks", title: "Look"});
          e.hass = h; wrap.append(e); document.body.append(wrap);
          await new Promise(r => setTimeout(r, 400)); await document.fonts.ready;
          const tiles = [...e.shadowRoot.querySelectorAll(".opt")];
          return {look: e.dataset.look, tiles: tiles.length, want: Object.keys(window.jamPreviewLookThemes || {}).length + 1, on: tiles.filter(t => t.getAttribute("aria-pressed") === "true").map(t => t.dataset.theme).join(), sel: (h.selectedTheme || {}).theme};
        });
        check(st.look === look && st.tiles === st.want && st.want >= 9 && st.on === st.sel, `${T}: ${mode}/${width} jam-looks: data-look=${st.look}, ${st.tiles} tiles (every look's theme + system default), current ${st.on} marked`);
        await ctlCheck(p, `${mode}/${width} jam-looks`, "#looks-view jam-looks");
        await ctCheck(p, `${mode}/${width} jam-looks`);
        await p.locator("#looks-view").screenshot({path: path.join(out, `looks-picker-${mode}-${width}.png`)});
      } finally { await ctx.close(); }
    }
    // ---- 1280: panel B ----
    {
      const {ctx, p} = await open(mode, {width: 1280, height: 900});
      try {
        const i = await p.evaluate(() => [...document.querySelectorAll("#view jam-speaker")].findIndex(e => /living/.test((e._config || {}).entity || "") && e.shadowRoot.querySelector("button.open")));
        const card = p.locator("#view jam-speaker").nth(Math.max(0, i));
        await card.scrollIntoViewIfNeeded();
        await card.locator("button.open").click(); await p.waitForTimeout(500);
        await ctlCheck(p, `${mode}/1280 speaker panel B (pinned)`);
        await shot(p, `speaker-panel-pinned-${mode}-1280.png`);
        await p.evaluate(() => [...document.querySelectorAll(".jam-sheet-host")].pop().shadowRoot.querySelector('.acts [data-key="speakers"]').click());
        await p.waitForTimeout(250);
        await ctlCheck(p, `${mode}/1280 speaker panel B (speakers)`);
        await shot(p, `speaker-panel-speakers-${mode}-1280.png`);
      } finally { await ctx.close(); }
    }
    // ---- kiosk sheets (same fixture configs as preview/fit.js) ----
    for (const [w, h] of [[1024, 768], [961, 601]]) {
      const {ctx, p} = await open(mode, {width: w, height: h});
      try {
        const ok = await p.evaluate(() => {
          const get = (tag, key, id) => { const e = [...document.querySelectorAll("#view " + tag)].find(x => x._config && x._config[key] === id); return e && JSON.parse(JSON.stringify(e._config)); };
          const spk = get("jam-speaker", "entity", "media_player.ks_speaker"), tv = get("jam-tv", "media_player", "media_player.ks_tv"), nv = get("jam-media", "title_entity", "sensor.ks_nv_now");
          if (!spk || !tv || !nv) return false;
          document.getElementById("view").remove();
          Object.assign(window.__hass, {locale: {language: "en", time_format: "12"}, language: "en"});
          const wrap = document.createElement("div"); wrap.style.cssText = "padding:8px 16px 16px";
          const e = document.createElement("jam-kiosk");
          e.setConfig({type: "custom:jam-kiosk", accent: "living", dock: [
            {name: "Music", accent: "violet", kicker: "Living room", cards: [spk]},
            {name: "TV", accent: "teal", kicker: "Living room", columns: [3, 2], cards: [tv, nv]}]});
          e.hass = window.__hass; wrap.append(e); document.body.append(wrap);
          return true;
        });
        check(ok, `${T}: ${mode} kiosk sheet fixtures found`);
        if (!ok) continue;
        await p.waitForTimeout(400);
        for (const [k, name] of [[0, "music"], [1, "tv"]]) {
          await p.evaluate(k => document.querySelector("jam-kiosk").shadowRoot.querySelectorAll(".blk")[k].click(), k);
          await p.waitForTimeout(900);
          await ctlCheck(p, `${mode} kiosk ${name} sheet ${w}x${h}`);
          await shot(p, `kiosk-sheet-${name}-${mode}-${w}.png`);
          await p.keyboard.press("Escape"); await p.waitForTimeout(300);
        }
      } finally { await ctx.close(); }
    }
    // ---- kiosk home: dock states + the door unlocked (1024x768). jam-kiosk writes data-state = on | off | action on each
    // dock block (85-kiosk-home: Lights on, TV / Music / Air off, All off = action), so a look's state styles can be
    // reviewed. Then the door is unlocked. ----
    {
      const {ctx, p} = await open(mode, {width: 1024, height: 768});
      try {
        const st = await p.evaluate(async () => {
          const src = document.querySelector("#view jam-kiosk");
          if (!src) return null;
          const cfg = JSON.parse(JSON.stringify(src._config));
          document.getElementById("view").remove();
          Object.assign(window.__hass, {locale: {language: "en", time_format: "12"}, language: "en"});
          const wrap = document.createElement("div"); wrap.style.cssText = "padding:8px 16px 16px";
          const e = document.createElement("jam-kiosk"); e.setConfig(cfg); e.hass = window.__hass;
          wrap.append(e); document.body.append(wrap);
          await new Promise(r => setTimeout(r, 300));
          const blks = [...e.shadowRoot.querySelectorAll(".blk")];
          const bg = b => getComputedStyle(b).backgroundColor;
          return {n: blks.length, states: blks.map(b => b.dataset.state).join(","), bg: blks.map(bg)};
        });
        check(!!st && st.n === 5 && st.states === "on,off,off,off,action", `${T}: ${mode} kiosk dock states from jam-kiosk (${st && st.states})`);
        if (look === "girard" && st) check(st.bg[0] !== st.bg[1] && st.bg[4] === "rgba(0, 0, 0, 0)",
          `${T}: ${mode} kiosk dock: the on block is filled (${st.bg[0]}), off tinted (${st.bg[1]}), the action block outlined (${st.bg[4]})`);
        await ctlCheck(p, `${mode} kiosk dock states`, "jam-kiosk");
        await ctCheck(p, `${mode} kiosk dock states`);
        await shot(p, `kiosk-dock-states-${mode}-1024.png`);
        const lk = await p.evaluate(async () => {
          const hs = window.__hass, e = document.querySelector("jam-kiosk"), o = hs.states["lock.kh_door"];
          hs.states["lock.kh_door"] = {...o, state: "unlocked", last_updated: String(Math.random())};
          e.hass = {...hs};
          await new Promise(r => setTimeout(r, 500));
          const l = e.shadowRoot.querySelector(".lk");
          return {alert: !!l && l.classList.contains("alert"), label: l ? l.textContent : ""};
        });
        check(lk.alert, `${T}: ${mode} kiosk door unlocked: the lock shows its alert state (${lk.label})`);
        await ctCheck(p, `${mode} kiosk door unlocked`);
        await shot(p, `kiosk-unlocked-${mode}-1024.png`);
      } finally { await ctx.close(); }
    }
    // ---- screensaver: clock (poster view) and photos, 961x601 (Echo Show 8) ----
    {
      const {ctx, p} = await open(mode, {width: 961, height: 601}, "", false);
      try {
        const release = (idx, hold, state = "off") => p.evaluate(([idx, hold, state]) => {
          const hs = window.__hass, o = hs.states[hold];
          hs.states[hold] = {...o, state, last_updated: String(Math.random())};
          document.querySelectorAll("#view jam-screensaver")[idx].hass = {...hs};
        }, [idx, hold, state]);
        const view = idx => p.evaluate(i => { const o = document.querySelectorAll("#view jam-screensaver")[i].overlay;
          return {shown: o.classList.contains("show"), view: o.dataset.view, loaded: [...o.querySelectorAll("img.cur")].filter(x => x.complete && x.naturalWidth > 0).length}; }, idx);
        await release(0, "input_boolean.jam_preview_hold");
        await p.waitForTimeout(3200);
        const a = await view(0);
        check(a.shown && a.view === "poster", `${T}: ${mode} screensaver clock shown (${JSON.stringify(a)})`);
        await ctCheck(p, `${mode} screensaver clock`);
        await shot(p, `screensaver-clock-${mode}-961.png`);
        await p.keyboard.press("Escape"); await p.waitForTimeout(200);
        await release(0, "input_boolean.jam_preview_hold", "on");
        await release(1, "input_boolean.jam_preview_hold_images");
        let b = null;
        for (let k = 0; k < 40; k++) { await p.waitForTimeout(250); b = await view(1); if (b.shown && b.view === "images" && b.loaded) break; }
        check(!!b && b.shown && b.view === "images" && b.loaded > 0, `${T}: ${mode} screensaver photos shown (${JSON.stringify(b)})`);
        await p.waitForTimeout(1500); // the photo crossfade (images.fade, 900 ms) settles
        await shot(p, `screensaver-photos-${mode}-961.png`);
      } finally { await ctx.close(); }
    }
  }
};
