// jam-screensaver + jam-weather huge clock (fixture preview/fixtures/90-kiosk.js). Also writes
// preview/shots/screensaver-{poster,images}-961.png at the Echo Show 8 viewport (961x601).
// Contract: module.exports = async (page, check, helpers) => {}; runs on the dark/1280 preview page, files in name order.
const path = require("path");

module.exports = async (page, check, {callsNow}) => {
  const SS = "#view jam-screensaver";
  const release = (idx, hold, state = "off") => page.evaluate(([idx, hold, state]) => {
    const h = window.__hass, o = h.states[hold];
    h.states[hold] = {...o, state, last_updated: String(Math.random())};
    document.querySelectorAll("#view jam-screensaver")[idx].hass = {...h};
  }, [idx, hold, state]);
  const ov = idx => page.evaluate(i => {
    const e = document.querySelectorAll("#view jam-screensaver")[i], o = e.overlay, r = o.getBoundingClientRect();
    return {shown: o.classList.contains("show"), display: getComputedStyle(o).display, view: o.dataset.view,
      cover: Math.abs(r.width - innerWidth) < 1 && Math.abs(r.height - innerHeight) < 1 && Math.abs(r.top) < 1 && Math.abs(r.left) < 1,
      hostH: e.getBoundingClientRect().height, imgs: o.querySelectorAll("img").length,
      loaded: [...o.querySelectorAll("img.cur")].filter(i => i.complete && i.naturalWidth > 0).length,
      time: o.querySelector(".time").textContent, word: (o.querySelector(".word") || {}).textContent, chip: o.querySelector(".tchip .tt").textContent,
      tickAt: e._tickAt, layout: o.querySelector(".poster").className};
  }, idx);

  // ---- huge kiosk clock on jam-weather ----
  const wx = await page.locator("#view jam-weather").filter({has: page.locator(".cs-huge")}).first().evaluate(e => {
    const t = e.shadowRoot.querySelector(".cs-huge .time");
    const f = e.shadowRoot.querySelector(".cs-huge"), fc = getComputedStyle(f), w = f.clientWidth - parseFloat(fc.paddingLeft) - parseFloat(fc.paddingRight), want = Math.min(192, Math.max(70.4, .24 * w));
    return {fs: parseFloat(getComputedStyle(t).fontSize), want, txt: t.textContent};
  }).catch(() => null);
  check(wx && Math.abs(wx.fs - wx.want) < 1 && /^\d{1,2}:\d{2}/.test(wx.txt), `jam-weather clock_size huge: big minute clock (${wx && wx.fs}px, "${wx && wx.txt}")`);

  // ---- poster: hidden + zero footprint, then appears after idle ----
  let s = await ov(0);
  check(!s.shown && s.display === "none" && s.hostH === 0, "screensaver overlay hidden initially, card takes no space");
  const btn = page.locator("#view jam-button").filter({hasText: "Kiosk test key"});
  await btn.scrollIntoViewIfNeeded();
  await page.evaluate(() => { window.__raf = 0; const r = window.requestAnimationFrame; window.requestAnimationFrame = f => { window.__raf++; return r(f); }; });
  await release(0, "input_boolean.jam_preview_hold");
  await page.waitForTimeout(1200);
  check(!(await ov(0)).shown, "not shown before idle_seconds have passed");
  await page.waitForTimeout(1500);
  s = await ov(0);
  check(s.shown && s.cover && s.view === "poster", `poster overlay covers the viewport after idle (${JSON.stringify({shown: s.shown, cover: s.cover})})`);
  check(/^\d{1,2}:\d{2}/.test(s.time) && s.word === "Clear night", `poster shows the time + weather word (${s.time}, ${s.word})`);
  const off = (s.tickAt % 60000);
  check(s.tickAt > Date.now() && s.tickAt - Date.now() <= 60100 && off >= 0 && off < 1000, `clock timer aligned to the minute boundary (fires at :${(off / 1000).toFixed(2)}s)`);
  await page.waitForTimeout(800);
  const anim = await page.evaluate(() => {
    const o = document.querySelectorAll("#view jam-screensaver")[0].overlay, bad = [];
    for (const e of [o, ...o.querySelectorAll("*")]) {
      const cs = getComputedStyle(e);
      if (cs.animationIterationCount.split(",").some(v => v.trim() === "infinite")) bad.push(e.className + " infinite");
      if (cs.filter !== "none" || cs.backdropFilter !== "none" && cs.backdropFilter) bad.push(e.className + " filter");
      if (/gradient/.test(cs.backgroundImage)) bad.push(e.className + " gradient");
    }
    return {bad, raf: window.__raf};
  });
  check(anim.bad.length === 0, "no infinite animation, filter or gradient in the overlay" + (anim.bad.length ? ": " + anim.bad.join("; ") : ""));
  check(anim.raf === 0, `no requestAnimationFrame calls while the overlay is up (${anim.raf})`);
  // Layout shift: all six layouts render inside the viewport (text block not cut off).
  const lays = await page.evaluate(() => {
    const e = document.querySelectorAll("#view jam-screensaver")[0], p = e.overlay.querySelector(".poster"), keep = p.className, out = [];
    for (let n = 0; n < 6; n++) {
      p.className = "poster l" + n + " " + ["", "r", "", "c", "", "r"][n];
      const r = p.querySelector(".txt").getBoundingClientRect();
      if (r.left < 0 || r.top < 0 || r.right > innerWidth + 1 || r.bottom > innerHeight + 1) out.push(n);
    }
    p.className = keep; return out;
  });
  check(lays.length === 0, `all 6 poster layouts keep the text inside 1280x900 (${lays.join(",")})`);
  await page.setViewportSize({width: 961, height: 601});
  await page.waitForTimeout(300);
  const lays961 = await page.evaluate(() => {
    const e = document.querySelectorAll("#view jam-screensaver")[0], p = e.overlay.querySelector(".poster"), keep = p.className, out = [];
    for (let n = 0; n < 6; n++) {
      p.className = "poster l" + n + " " + ["", "r", "", "c", "", "r"][n];
      const t = p.querySelector(".txt").getBoundingClientRect();
      if (t.left < 0 || t.top < 0 || t.right > innerWidth + 1 || t.bottom > innerHeight + 1) out.push(n + " outside");
      for (const sh of p.querySelectorAll(".sh")) { const r = sh.getBoundingClientRect();
        const ov = Math.max(0, Math.min(r.right, t.right) - Math.max(r.left, t.left)) * Math.max(0, Math.min(r.bottom, t.bottom) - Math.max(r.top, t.top));
        if (ov > 0.04 * t.width * t.height) out.push(n + " shape over text"); }
    }
    p.className = keep; return out;
  });
  check(lays961.length === 0, `all 6 poster layouts fit 961x601 without shapes over the text (${lays961.join(",")})`);
  await page.screenshot({path: path.join(__dirname, "..", "shots", "screensaver-poster-961.png")});

  // ---- first tap dismisses and does not press the button underneath ----
  await page.setViewportSize({width: 1280, height: 900});
  await page.waitForTimeout(200);
  const bb = await btn.boundingBox();
  let n = (await callsNow()).length;
  await page.mouse.click(bb.x + bb.width / 2, bb.y + bb.height / 2);
  await page.waitForTimeout(100);
  s = await ov(0);
  let c = (await callsNow()).slice(n);
  check(!s.shown && c.length === 0, `first tap dismisses the overlay and is swallowed (calls: ${c.length})`);
  await page.mouse.click(bb.x + bb.width / 2, bb.y + bb.height / 2);
  c = (await callsNow()).slice(n);
  check(c.length === 1 && c[0].domain === "script", "the next tap reaches the dashboard again");
  await page.keyboard.press("Shift"); // activity: restart the idle count
  await page.waitForTimeout(2600);
  s = await ov(0);
  check(s.shown, "overlay comes back after idle again");
  await page.keyboard.press("Escape");
  check(!(await ov(0)).shown, "a key press dismisses it");
  await release(0, "input_boolean.jam_preview_hold", "on");
  await page.waitForTimeout(2300);
  check(!(await ov(0)).shown, "disable_on holds it off");

  // ---- active_hours + containing-block fallback (cards made here, removed after) ----
  const extra = await page.evaluate(async () => {
    const hm = d => String(d.getHours()).padStart(2, "0") + ":" + String(d.getMinutes()).padStart(2, "0");
    const t = Date.now(), mk = (cfg, parent) => {
      const e = document.createElement("jam-screensaver"); e.setConfig({type: "custom:jam-screensaver", idle_seconds: 1, ...cfg});
      e.hass = window.__hass; (parent || document.body).append(e); return e;
    };
    const outside = mk({active_hours: {from: hm(new Date(t + 2 * 3600e3)), to: hm(new Date(t + 3 * 3600e3))}});
    const box = document.createElement("div"); box.style.cssText = "transform:translateZ(0);width:100px;height:40px;margin:20px";
    document.getElementById("view").prepend(box);
    const inside = mk({active_hours: {from: hm(new Date(t - 3600e3)), to: hm(new Date(t + 3600e3))}}, box);
    await new Promise(r => setTimeout(r, 1500));
    const r = inside.overlay.getBoundingClientRect();
    const res = {outside: outside.overlay.classList.contains("show"), inside: inside.overlay.classList.contains("show"),
      body: inside.layer.parentNode === document.body, cover: Math.abs(r.width - innerWidth) < 1 && Math.abs(r.height - innerHeight) < 1 && r.top === 0};
    inside.remove(); outside.remove(); box.remove();
    res.cleaned = !document.querySelector("body > .jam-screensaver-layer");
    return res;
  });
  check(!extra.outside, "active_hours: no screensaver outside the hours");
  check(extra.inside, "active_hours: shown inside the hours");
  check(extra.body && extra.cover && extra.cleaned, `inside a transformed ancestor the layer moves to document.body and covers the viewport (${JSON.stringify(extra)})`);

  // ---- images mode ----
  await release(1, "input_boolean.jam_preview_hold_images");
  await page.waitForTimeout(3000);
  s = await ov(1);
  check(s.shown && s.view === "images" && s.loaded === 1 && s.imgs <= 2 && /^\d{1,2}:\d{2}/.test(s.chip),
    `images mode shows a loaded slide, <=2 <img>, time chip (${JSON.stringify({view: s.view, imgs: s.imgs, loaded: s.loaded, chip: s.chip})})`);
  let maxImgs = s.imgs, views = new Set([s.view]);
  for (let i = 0; i < 14; i++) { await page.waitForTimeout(500); const x = await ov(1); maxImgs = Math.max(maxImgs, x.imgs); views.add(x.view); }
  check(maxImgs <= 2, `slideshow never holds more than 2 <img> (${maxImgs})`);
  check(views.has("poster") && views.has("images"), `poster_every 3 interleaves the poster (${[...views]})`);
  await page.setViewportSize({width: 961, height: 601});
  for (let i = 0; i < 12 && (await ov(1)).view !== "images"; i++) await page.waitForTimeout(250);
  await page.waitForTimeout(200);
  await page.screenshot({path: path.join(__dirname, "..", "shots", "screensaver-images-961.png")});
  await page.setViewportSize({width: 1280, height: 900});
  await page.keyboard.press("Escape");
  await release(1, "input_boolean.jam_preview_hold_images", "on");
  s = await ov(1);
  check(!s.shown && s.imgs === 0, "dismissing the slideshow drops its images");

  // ---- images mode falls back to the poster when the index 404s ----
  const fb = await page.evaluate(async () => {
    const e = document.createElement("jam-screensaver");
    e.setConfig({type: "custom:jam-screensaver", idle_seconds: 1, mode: "images", images: {index: "fixtures/slides/missing.json", interval: 1}});
    e.hass = window.__hass; document.body.append(e);
    await new Promise(r => setTimeout(r, 2600));
    const o = e.overlay, out = {shown: o.classList.contains("show"), view: o.dataset.view, imgs: o.querySelectorAll("img").length,
      poster: getComputedStyle(o.querySelector(".poster")).display, time: o.querySelector(".time").textContent};
    e.remove(); return out;
  });
  check(fb.shown && fb.view === "poster" && fb.imgs === 0 && fb.poster !== "none" && /\d:\d\d/.test(fb.time),
    `index 404 -> poster fallback, never a black screen (${JSON.stringify(fb)})`);
  // ---- kiosk chrome: fake HA 2026.10 shadow DOM (home-assistant > home-assistant-main > ha-drawer / ha-sidebar,
  //      partial-panel-resolver > ha-panel-lovelace > hui-root > .header + hui-view-container) ----
  const kiosk = await page.evaluate(async () => {
    const orig = location.href, tick = () => new Promise(r => setTimeout(r, 30)), out = {};
    let raf = 0; const rafOrig = window.requestAnimationFrame; window.requestAnimationFrame = f => { raf++; return rafOrig(f); };
    const shadow = (tag, css, html) => { const e = document.createElement(tag), sr = e.attachShadow({mode: "open"}); sr.innerHTML = `<style>${css}</style>${html || ""}`; return e; };
    const ha = shadow("home-assistant", ":host{display:block}");
    const main = shadow("home-assistant-main", ":host{display:block;--ha-sidebar-width:256px;--ha-top-app-bar-width:calc(100% - var(--ha-sidebar-width))}ha-sidebar{display:block;width:var(--ha-sidebar-width);height:10px}");
    const drawer = shadow("ha-drawer", ".sidebar-shell{width:var(--ha-sidebar-width);position:fixed;height:100%}.app-content{padding-inline-start:var(--ha-sidebar-width)}",
      '<div class="layout"><div class="sidebar-shell"><slot></slot></div><div class="app-content"><slot name="appContent"></slot></div></div>');
    const sidebar = document.createElement("ha-sidebar");
    const ppr = document.createElement("partial-panel-resolver"); ppr.slot = "appContent";
    const panel = shadow("ha-panel-lovelace", ":host{display:block}");
    const root = shadow("hui-root", ":host{display:block;--header-height:56px}.header{position:fixed;top:0;height:var(--header-height);width:var(--ha-top-app-bar-width,100%);z-index:4}" +
      "hui-view-container{display:flex;padding-top:calc(var(--header-height) + var(--safe-area-inset-top,0px) + var(--view-container-padding-top,0px))}",
      '<div><div class="header"><div class="toolbar">Header</div></div><hui-view-container id="view"></hui-view-container></div>');
    drawer.append(sidebar, ppr); ppr.append(panel); panel.shadowRoot.append(root); main.shadowRoot.append(drawer); ha.shadowRoot.append(main);
    const stage = document.createElement("div"); stage.style.cssText = "position:absolute;left:0;top:0;width:600px;visibility:hidden"; stage.append(ha);
    document.body.append(stage);
    const vc = root.shadowRoot.getElementById("view");
    const mk = cfg => { const e = document.createElement("jam-screensaver"); e.setConfig({type: "custom:jam-screensaver", idle_seconds: 999, ...cfg}); e.hass = window.__hass; return e; };
    const kstyles = h => [...h.shadowRoot.children].filter(e => e.localName === "style" && e.hasAttribute("data-jam-kiosk")).length;
    const state = () => ({
      styles: [main, drawer, root].map(kstyles),
      sidebar: getComputedStyle(sidebar).display, shell: getComputedStyle(drawer.shadowRoot.querySelector(".sidebar-shell")).display,
      pad: getComputedStyle(drawer.shadowRoot.querySelector(".app-content")).paddingInlineStart,
      header: getComputedStyle(root.shadowRoot.querySelector(".header")).display, top: getComputedStyle(vc).paddingTop,
    });
    // 1: no ?kiosk -> default "url" does nothing
    history.pushState({}, "", "/plain-dash/0");
    let card = mk({}); vc.append(card); await tick();
    out.plain = {...state(), active: card.kioskActive};
    card.remove(); await tick();
    // 2: ?kiosk -> hidden
    history.pushState({}, "", "/jam-test/0?kiosk");
    card = mk({}); vc.append(card); await tick();
    out.on = {...state(), active: card.kioskActive};
    // 3: HA drops the style on re-render -> the MutationObserver puts it back
    [...root.shadowRoot.children].find(e => e.hasAttribute && e.hasAttribute("data-jam-kiosk")).remove(); await tick();
    out.readd = state();
    // 4: view switch inside the dashboard (card leaves, query dropped) keeps it; another dashboard restores HA's chrome
    card.remove(); history.pushState({}, "", "/jam-test/1"); window.dispatchEvent(new Event("location-changed")); await tick();
    out.viewSwitch = state();
    history.pushState({}, "", "/other-dash/0"); window.dispatchEvent(new Event("location-changed")); await tick();
    out.away = state();
    // 5: back on the kiosk dashboard without the query (remembered until reload)
    history.pushState({}, "", "/jam-test/0"); window.dispatchEvent(new Event("location-changed"));
    card = mk({}); vc.append(card); await tick();
    out.back = state();
    // 6: kiosk: false on a fresh dashboard
    card.remove(); history.pushState({}, "", "/off-dash/0?kiosk"); window.dispatchEvent(new Event("location-changed"));
    const off = mk({kiosk: false}); vc.append(off); await tick();
    out.off = state(); off.remove();
    history.pushState({}, "", "/jam-test/0"); window.dispatchEvent(new Event("location-changed"));
    card = mk({kiosk: true}); vc.append(card); await tick();
    out.forced = state();
    window.__kioskCard = card; window.__kioskState = state; window.__kioskStage = stage; window.__kioskOrig = orig;
    window.requestAnimationFrame = rafOrig; out.raf = raf;
    return out;
  });
  const hidden = s => s.styles.join() === "1,1,1" && s.sidebar === "none" && s.shell === "none" && s.pad === "0px" && s.header === "none" && s.top === "0px";
  const shown = s => s.styles.join() === "0,0,0" && s.sidebar === "block" && s.shell === "block" && s.pad === "256px" && s.header === "block" && s.top === "56px";
  check(shown(kiosk.plain) && !kiosk.plain.active, `kiosk "url" without ?kiosk leaves HA's sidebar + header alone (${JSON.stringify(kiosk.plain)})`);
  check(hidden(kiosk.on) && kiosk.on.active, `?kiosk hides ha-sidebar, the drawer shell, hui-root's header and zeroes the top padding (${JSON.stringify(kiosk.on)})`);
  check(hidden(kiosk.readd), `MutationObserver re-adds the style after a re-render drops it (${JSON.stringify(kiosk.readd)})`);
  check(hidden(kiosk.viewSwitch), `a view switch inside the kiosk dashboard keeps the chrome hidden (${JSON.stringify(kiosk.viewSwitch)})`);
  check(shown(kiosk.away), `navigating to another dashboard removes every injected style (${JSON.stringify(kiosk.away)})`);
  check(hidden(kiosk.back), `back on the kiosk dashboard (query dropped) it is hidden again (${JSON.stringify(kiosk.back)})`);
  check(shown(kiosk.off) && hidden(kiosk.forced), `kiosk: false never hides, kiosk: true always does (${JSON.stringify({off: kiosk.off.styles, forced: kiosk.forced.styles})})`);
  check(kiosk.raf === 0, `kiosk chrome uses no requestAnimationFrame (${kiosk.raf})`);
  // Way out: a short press in the corner does nothing, a 2 s long-press restores the chrome until reload.
  await page.mouse.move(10, 10); await page.mouse.down(); await page.waitForTimeout(600); await page.mouse.up();
  const short = await page.evaluate(() => window.__kioskState());
  await page.mouse.down(); await page.waitForTimeout(2200); await page.mouse.up();
  const esc = await page.evaluate(async () => {
    const s = window.__kioskState(), c = window.__kioskCard, active = c.kioskActive;
    c.remove(); document.querySelector("#view").append(c); await new Promise(r => setTimeout(r, 30)); // reconnect: stays restored
    const again = window.__kioskState();
    c.remove(); window.__kioskStage.remove(); history.replaceState({}, "", window.__kioskOrig);
    return {s, active, again};
  });
  check(hidden(short), "a short press in the top-left corner keeps kiosk mode");
  check(shown(esc.s) && !esc.active && esc.again.styles.join() === "0,0,0", `2 s long-press in the top-left 48x48 corner restores the chrome until reload (${JSON.stringify(esc)})`);
};
