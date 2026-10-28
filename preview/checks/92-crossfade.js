// jam-screensaver 0.4.1: photo crossfade (images.fade) + mode_entity. Cards are made on the page (fixture slides
// preview/fixtures/slides/index.json, fake hass states), no fixture section. Runs on the dark/1280 page.
// Contract: module.exports = async (page, check, helpers) => {}.
module.exports = async (page, check) => {
  // Watch one card for `ms`, sampling every 40 ms: <img> count, visible <img>s, and the incoming image's transition.
  const run = (cfg, ms) => page.evaluate(async ([cfg, ms]) => {
    const wait = t => new Promise(r => setTimeout(r, t));
    const e = document.createElement("jam-screensaver");
    e.setConfig({type: "custom:jam-screensaver", idle_seconds: 1, mode: "images", poster_every: 0, ...cfg});
    e.hass = window.__hass; document.body.append(e);
    const o = e.overlay, out = {maxImgs: 0, maxVis: 0, two: 0, tr: new Set(), slidesTr: new Set(), afterVis: [], views: new Set()};
    const t0 = Date.now();
    while (Date.now() - t0 < ms) {
      const imgs = [...o.querySelectorAll("img")], vis = imgs.filter(i => getComputedStyle(i).visibility === "visible");
      out.maxImgs = Math.max(out.maxImgs, imgs.length); out.maxVis = Math.max(out.maxVis, vis.length);
      if (vis.length === 2) out.two++;
      for (const i of imgs) { const t = getComputedStyle(i).transition; if (/opacity/.test(t) && parseFloat(getComputedStyle(i).transitionDuration) > 0) out.tr.add(t); }
      const st = getComputedStyle(o.querySelector(".slides"));
      if (parseFloat(st.transitionDuration) > 0) out.slidesTr.add(st.transitionProperty + " " + st.transitionTimingFunction);
      out.views.add(o.dataset.view);
      if (o.dataset.view === "images" && !o.querySelector("img.in") && !o.classList.contains("xf")) out.afterVis.push(vis.length);
      await wait(40);
    }
    e.remove();
    return {...out, tr: [...out.tr], slidesTr: [...out.slidesTr], views: [...out.views], afterVis: [...new Set(out.afterVis)]};
  }, [cfg, ms]);

  const imgs = {index: "fixtures/slides/index.json", interval: 2, fade: 900};
  const a = await run({images: imgs}, 6500);
  check(a.two > 0 && a.maxImgs <= 2, `crossfade: two <img> visible during the fade, never more than 2 in the DOM (${JSON.stringify({two: a.two, maxImgs: a.maxImgs})})`);
  check(a.tr.length > 0 && a.tr.every(t => /opacity 0\.9s ease-in-out/.test(t)), `crossfade: incoming photo has an opacity transition 900 ms ease-in-out (${a.tr})`);
  check(JSON.stringify(a.afterVis) === "[1]", `crossfade: one visible <img> outside the fade (${a.afterVis})`);
  check(a.slidesTr.some(t => /opacity/.test(t)), `crossfade: poster -> photo fades the slides layer (opacity) (${a.slidesTr})`);

  const c = await run({images: {...imgs, fade: 0}}, 5000);
  check(c.two === 0 && c.tr.length === 0 && c.slidesTr.length === 0 && c.views.includes("images"), `images.fade 0: a cut, no transition (${JSON.stringify(c)})`);

  await page.emulateMedia({reducedMotion: "reduce"});
  const r = await run({images: imgs}, 5000);
  await page.emulateMedia({reducedMotion: "no-preference"});
  check(r.two === 0 && r.tr.length === 0 && r.slidesTr.length === 0 && r.views.includes("images") && r.maxImgs <= 2,
    `reduced motion: instant cut, no transition (${JSON.stringify(r)})`);

  // ---- mode_entity ----
  const m = await page.evaluate(async () => {
    const wait = t => new Promise(res => setTimeout(res, t));
    const st = (id, state) => ({entity_id: id, state, attributes: {}, last_updated: String(Math.random())});
    const hassWith = (id, state) => ({...window.__hass, states: {...window.__hass.states, [id]: st(id, state)}});
    const mk = (cfg, id, state) => {
      const e = document.createElement("jam-screensaver");
      e.setConfig({type: "custom:jam-screensaver", idle_seconds: 1, images: {index: "fixtures/slides/index.json", interval: 1, fade: 200}, ...cfg});
      e.hass = hassWith(id, state); document.body.append(e); return e;
    };
    const look = e => ({shown: e.overlay.classList.contains("show"), view: e.overlay.dataset.view, live: e._live, imgs: e.overlay.querySelectorAll("img").length});
    const SEL = "input_select.ss_mode", out = {};
    for (const [k, state, cfg, id] of [["photos", "Photos", {}, SEL], ["clock", "Clock", {mode: "images"}, SEL],
      ["unavailImages", "unavailable", {mode: "images"}, SEL], ["unavailPoster", "unknown", {}, SEL],
      ["boolOn", "on", {}, "input_boolean.ss_photos"], ["boolOff", "off", {mode: "images"}, "input_boolean.ss_photos"],
      ["noImages", "Slideshow", {images: undefined}, SEL]]) {
      const e = mk({mode_entity: id, ...cfg}, id, state);
      await wait(2000); out[k] = look(e); e.remove();
    }
    // live: Photos -> Clock while shown switches at the next slide tick (not on the hass update), then back
    const e = mk({mode_entity: SEL}, SEL, "Photos");
    await wait(2000); out.liveA = look(e);
    e.hass = hassWith(SEL, "Clock"); out.liveB = look(e);
    await wait(1600); out.liveC = look(e);
    e.hass = hassWith(SEL, "Photos");
    await wait(2200); out.liveD = look(e);
    e.remove();
    return out;
  });
  check(m.photos.shown && m.photos.view === "images" && m.photos.live === "images", `mode_entity "Photos" -> images (${JSON.stringify(m.photos)})`);
  check(m.clock.shown && m.clock.view === "poster" && m.clock.live === "poster" && m.clock.imgs === 0, `mode_entity "Clock" -> poster over mode: images (${JSON.stringify(m.clock)})`);
  check(m.unavailImages.view === "images" && m.unavailPoster.view === "poster" && m.unavailPoster.live === "poster",
    `mode_entity unavailable/unknown -> the configured mode (${JSON.stringify([m.unavailImages, m.unavailPoster])})`);
  check(m.boolOn.view === "images" && m.boolOff.view === "poster", `mode_entity input_boolean on -> images, off -> poster (${JSON.stringify([m.boolOn, m.boolOff])})`);
  check(m.noImages.shown && m.noImages.view === "poster" && m.noImages.imgs === 0, `mode_entity images without an images config -> poster (${JSON.stringify(m.noImages)})`);
  check(m.liveA.view === "images" && m.liveB.view === "images" && m.liveC.view === "poster" && m.liveC.imgs === 0 && m.liveD.view === "images",
    `mode_entity switches live at the next slide, not on the update (${JSON.stringify([m.liveA, m.liveB, m.liveC, m.liveD])})`);
};
