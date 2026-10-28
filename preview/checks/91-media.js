// jam-screensaver images.media (0.4.0): Home Assistant media source folder via a fake hass.callWS
// (browse = 3 images + 1 json; resolve = a local test image with a fake authSig token). Runs on the dark/1280 page.
// Contract: module.exports = async (page, check, helpers) => {}.
module.exports = async (page, check) => {
  const r = await page.evaluate(async () => {
    const DIR = "media-source://media_source/local/test/jam-slides";
    const wait = ms => new Promise(res => setTimeout(res, ms));
    const logged = [], orig = {};
    for (const k of ["log", "info", "warn", "error", "debug"]) { orig[k] = console[k]; console[k] = (...a) => { logged.push(a.map(String).join(" ")); return orig[k].apply(console, a); }; }
    const ls0 = (() => { try { return JSON.stringify(localStorage); } catch (e) { return ""; } })();
    const calls = {browse: 0, resolve: [], failBrowse: false};
    const kids = [
      {title: "c.jpg", media_class: "image", media_content_id: DIR + "/c.jpg"},
      {title: "index.json", media_class: "app", media_content_id: DIR + "/index.json"},
      {title: "a.jpg", media_class: "image", media_content_id: DIR + "/a.jpg"},
      {title: "b.jpg", media_class: "image", media_content_id: DIR + "/b.jpg"},
    ];
    const hassFor = fail => ({...window.__hass,
      hassUrl: u => u,
      callWS: async m => {
        if (m.type === "media_source/browse_media") { calls.browse++; if (fail || calls.failBrowse) throw new Error("browse failed"); return {title: "jam-slides", children: kids}; }
        if (m.type === "media_source/resolve_media") {
          calls.resolve.push(m.media_content_id + "|" + m.expires);
          const n = /a\.jpg$/.test(m.media_content_id) ? 1 : 2;
          return {url: `fixtures/slides/slide-${n}.png?authSig=SECRET${calls.resolve.length}`, mime_type: "image/png"};
        }
        throw new Error("unexpected " + m.type);
      }});
    const mk = (fail, extra) => {
      const e = document.createElement("jam-screensaver");
      e.setConfig({type: "custom:jam-screensaver", idle_seconds: 1, mode: "images", images: {media: DIR, interval: 1}, ...extra});
      e.hass = hassFor(fail); document.body.append(e); return e;
    };
    const out = {};
    // 1: normal run
    let e = mk(false);
    await wait(1600);
    const o = e.overlay;
    out.list = (e._list || []).map(x => x.id.split("/").pop());
    out.first = {shown: o.classList.contains("show"), view: o.dataset.view, imgs: o.querySelectorAll("img").length,
      loaded: [...o.querySelectorAll("img.cur")].filter(i => i.complete && i.naturalWidth > 0).length};
    let maxImgs = 0, shown = new Set(), srcs = new Set();
    for (let i = 0; i < 14; i++) {
      await wait(250);
      maxImgs = Math.max(maxImgs, o.querySelectorAll("img").length);
      const c = o.querySelector("img.cur"); if (c) { shown.add(c); srcs.add(c.getAttribute("src")); }
    }
    out.maxImgs = maxImgs; out.shownCount = shown.size; out.srcs = srcs.size;
    out.resolves = calls.resolve.length; out.imgsCreated = e._resolves;
    out.expires = calls.resolve.every(x => x.endsWith("|3600"));
    out.onlyImages = calls.resolve.every(x => /\.jpg\|/.test(x));
    out.browse1 = calls.browse;
    // throttle: hide + show again, and minute ticks, within the hour -> no new browse
    e._hide(); e._show(); await wait(300); e._minute(); e._minute(); await wait(100);
    out.browse2 = calls.browse;
    // re-applying the same config keeps the list
    e.setConfig({...e._config}); e._show(); await wait(200);
    out.browse3 = calls.browse;
    // an hour later -> one more browse
    e._listAt = Date.now() - 3601e3; e._minute(); await wait(100); e._minute(); await wait(100);
    out.browse4 = calls.browse;
    e.remove();
    // 2: browse fails -> poster, retry only after 10 min
    calls.browse = 0;
    e = mk(true, {poster_every: 0});
    await wait(1600);
    const o2 = e.overlay;
    out.fail = {shown: o2.classList.contains("show"), view: o2.dataset.view, imgs: o2.querySelectorAll("img").length,
      poster: getComputedStyle(o2.querySelector(".poster")).display, time: o2.querySelector(".time").textContent, browse: calls.browse};
    e._minute(); await wait(50);
    out.fail.afterMinute = calls.browse;
    e._listAt = Date.now() - 601e3; e._minute(); await wait(50);
    out.fail.after10 = calls.browse;
    e.remove();
    // 3: no callWS (plain preview hass) -> poster, no error
    e = document.createElement("jam-screensaver");
    e.setConfig({type: "custom:jam-screensaver", idle_seconds: 1, mode: "images", images: {media: DIR, interval: 1}});
    e.hass = window.__hass; document.body.append(e);
    await wait(1600);
    out.nows = {shown: e.overlay.classList.contains("show"), view: e.overlay.dataset.view, imgs: e.overlay.querySelectorAll("img").length};
    e.remove();
    for (const k of Object.keys(orig)) console[k] = orig[k];
    let ls1 = ""; try { ls1 = JSON.stringify(localStorage); } catch (err) { /* none */ }
    out.leakConsole = logged.some(l => /authSig|SECRET|media-source:\/\//.test(l));
    out.leakStorage = /authSig|SECRET/.test(ls1) || ls1 !== ls0 && /slide-/.test(ls1);
    return out;
  });
  check(JSON.stringify(r.list) === '["a.jpg","b.jpg","c.jpg"]', `media: browse keeps images only, sorted by title (${r.list})`);
  check(r.first.shown && r.first.view === "images" && r.first.loaded === 1 && r.first.imgs <= 2, `media: shows a resolved, loaded slide (${JSON.stringify(r.first)})`);
  check(r.maxImgs <= 2, `media: never more than 2 <img> (${r.maxImgs})`);
  check(r.onlyImages && r.expires && r.resolves === r.imgsCreated && r.resolves >= r.shownCount && r.shownCount >= 3,
    `media: resolve_media (expires 3600) called once per image, right before it is preloaded (${r.resolves} resolves, ${r.shownCount} shown)`);
  check(r.browse1 === 1 && r.browse2 === 1 && r.browse3 === 1 && r.browse4 === 2, `media: browse throttled to once per hour (${r.browse1}/${r.browse2}/${r.browse3}/${r.browse4})`);
  check(r.fail.shown && r.fail.view === "poster" && r.fail.imgs === 0 && r.fail.poster !== "none" && /\d:\d\d/.test(r.fail.time) && r.fail.browse === 1,
    `media: browse error -> poster fallback (${JSON.stringify(r.fail)})`);
  check(r.fail.afterMinute === 1 && r.fail.after10 === 2, `media: failed browse retried after 10 min, not before (${r.fail.afterMinute}/${r.fail.after10})`);
  check(r.nows.shown && r.nows.view === "poster" && r.nows.imgs === 0, `media: no hass.callWS -> poster (${JSON.stringify(r.nows)})`);
  check(!r.leakConsole && !r.leakStorage, "media: signed URLs never reach the console or localStorage");
};
