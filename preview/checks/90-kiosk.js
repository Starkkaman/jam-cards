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
};
