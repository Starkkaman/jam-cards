// Pop-up motion (1.1.0, Isaac 2026-11-08: "I'm missing the animations of the popups"; 0.11's open was a 24px rise on the
// settle curve that read as a cut, and closing removed the layer at once). Fresh pages of the light preview:
//   - open: a phone's bottom sheet (390x844) rises 72px and fades in (cm-in-b, 260 ms), a centred pop-up (1280x800) fades in
//     rising from 96.5 % (cm-in-c, 240 ms), a kiosk dock sheet (full screen) fades in rising 10px (cm-in-f); the veil fades
//     to its .6 and never past it (0.11 animated it to 1, then it jumped back: a flash);
//   - placement never depends on the motion: when the open motion has ended (or is cancelled) the face has no transform,
//     opacity 1, at the same place;
//   - close (Esc): the open sheets let go at once (no .jam-sheet-host left, the scroll lock released) while the layer
//     (.jam-sheet-leaving, inert, no pointer events) plays the leave (cm-out-b / cm-out-c, veil out) and is gone by 300 ms;
//   - jam-popup (#hash): the same open, and its leave keeps the overlay (.closing) until it has played;
//   - the calm tier (JamCards.motion = "calm"): open and close only fade (no transform keyframes), no child stagger;
//   - prefers-reduced-motion: no animation, and a close removes the layer at once.
// Contract: module.exports = async (page, check) => {}.
module.exports = async (page, check) => {
  const url = page.url().replace(/\?.*$/, "") + "?mode=light", browser = page.context().browser();
  const PROBE = () => {
    const top = () => [...document.querySelectorAll(".jam-sheet-host")].pop();
    const anims = el => el.getAnimations().map(a => ({name: a.animationName, dur: a.effect.getTiming().duration, keys: a.effect.getKeyframes().map(k => Object.keys(k).filter(x => !["offset", "easing", "composite", "computedOffset"].includes(x)))}));
    window.__mo = {
      top,
      openLight() {
        const l = [...document.querySelectorAll("#view jam-light")].find(x => x._config && x._config.entity === "light.living_room");
        [...l.shadowRoot.querySelectorAll("button")].find(b => /open light controls/.test(b.getAttribute("aria-label") || "")).click();
      },
      state() {
        const hs = top() || [...document.querySelectorAll(".jam-sheet-leaving")].pop(); if (!hs) return null;
        const sr = hs.shadowRoot, pop = sr.querySelector(".pop"), wipe = sr.querySelector(".wipe"), veil = sr.querySelector(".veil");
        return {cls: pop.className, wipe: anims(wipe), veil: anims(veil), leaving: hs.classList.contains("jam-sheet-leaving"), inert: !!hs.inert, pe: getComputedStyle(pop).pointerEvents};
      },
      veilMax() { // sample the veil's opacity over the open motion (paused, seeked)
        const sr = top().shadowRoot, veil = sr.querySelector(".veil"), a = veil.getAnimations()[0];
        if (!a) return Number(getComputedStyle(veil).opacity);
        let mx = 0; a.pause();
        for (let t = 0; t <= a.effect.getTiming().duration; t += 20) { a.currentTime = t; mx = Math.max(mx, Number(getComputedStyle(veil).opacity)); }
        a.finish(); return mx;
      },
      settle() { // finish every animation of the top pop-up; the face's resting transform / opacity / place
        const sr = top().shadowRoot, f = sr.querySelector(".sheet > .face"), w = sr.querySelector(".wipe");
        for (const a of sr.querySelector(".pop").getAnimations({subtree: true})) a.finish();
        const r1 = f.getBoundingClientRect(), cs = getComputedStyle(w), out = {tf: cs.transform, op: cs.opacity, r: [r1.left, r1.top, r1.right, r1.bottom].map(Math.round)};
        sr.querySelector(".pop").classList.remove("opening"); // no motion at all: the same place
        const r2 = f.getBoundingClientRect(); out.same = [r2.left, r2.top, r2.right, r2.bottom].map(Math.round).join() === out.r.join();
        return out;
      },
    };
  };
  const leave = async (p, tag, bad, want) => {
    await p.keyboard.press("Escape");
    const now = await p.evaluate(() => ({hosts: document.querySelectorAll(".jam-sheet-host").length, leaving: document.querySelectorAll(".jam-sheet-leaving").length,
      lock: document.documentElement.style.overflow, st: window.__mo.state()}));
    if (now.hosts) bad.push(`${tag}: ${now.hosts} sheet hosts right after close`);
    if (now.lock === "hidden") bad.push(`${tag}: scroll lock kept while leaving`);
    if (want) {
      if (now.leaving !== 1 || !now.st) bad.push(`${tag}: no leaving layer`);
      else {
        if (!/closing/.test(now.st.cls) || !now.st.inert || now.st.pe !== "none") bad.push(`${tag}: leaving layer ${now.st.cls} inert ${now.st.inert} pointer-events ${now.st.pe}`);
        if (!now.st.wipe.some(a => a.name === want)) bad.push(`${tag}: leave ${JSON.stringify(now.st.wipe.map(a => a.name))}, want ${want}`);
        if (!now.st.veil.some(a => a.name === "cm-veil-out" || a.name === "calm-fade-out")) bad.push(`${tag}: veil leave ${JSON.stringify(now.st.veil.map(a => a.name))}`);
      }
    } else if (now.leaving) bad.push(`${tag}: a leaving layer with motion off`);
    await p.waitForTimeout(320);
    const gone = await p.evaluate(() => document.querySelectorAll(".jam-sheet-leaving, .jam-sheet-host").length);
    if (gone) bad.push(`${tag}: ${gone} layers still there 320 ms after close`);
  };
  for (const [w, h, kind, inName, outName] of [[390, 844, "phone", "cm-in-b", "cm-out-b"], [1280, 800, "desktop", "cm-in-c", "cm-out-c"]]) {
    for (const tier of ["full", "calm", "reduced"]) {
      const p = await browser.newPage({viewport: {width: w, height: h}});
      const errs = []; p.on("pageerror", e => errs.push(e.message));
      if (tier === "reduced") await p.emulateMedia({reducedMotion: "reduce"});
      await p.goto(url);
      await p.waitForFunction(() => window.__ready);
      await p.waitForTimeout(500);
      await p.evaluate(PROBE);
      if (tier === "calm") await p.evaluate(() => { window.JamCards.motion = "calm"; });
      const tag = `motion ${kind} ${tier}`, bad = [];
      await p.evaluate(() => window.__mo.openLight());
      const st = await p.evaluate(() => window.__mo.state());
      if (!st) { check(false, `${tag}: the light pop-up did not open`); await p.close(); continue; }
      if (tier === "full") {
        if (!st.wipe.some(a => a.name === inName)) bad.push(`open ${JSON.stringify(st.wipe.map(a => a.name))}, want ${inName}`);
        if (!st.veil.some(a => a.name === "cm-veil-in")) bad.push(`veil ${JSON.stringify(st.veil.map(a => a.name))}`);
        const mx = await p.evaluate(() => window.__mo.veilMax());
        if (mx > .61) bad.push(`veil reaches ${mx} (> .6: a flash)`);
      } else if (tier === "calm") {
        if (!/jam-calm/.test(st.cls)) bad.push("no jam-calm class");
        const moves = st.wipe.filter(a => a.keys.some(k => k.includes("transform")));
        if (!st.wipe.length || moves.length) bad.push(`calm open ${JSON.stringify(st.wipe)} (want a fade only)`);
      } else if (st.wipe.length || st.veil.length || /opening/.test(st.cls)) bad.push(`reduced motion animates ${JSON.stringify([st.cls, st.wipe, st.veil])}`);
      const rest = await p.evaluate(() => window.__mo.settle());
      if (rest.tf !== "none" || rest.op !== "1" || !rest.same) bad.push(`at rest: transform ${rest.tf}, opacity ${rest.op}, ${rest.same ? "" : "moved without the motion"}`);
      await leave(p, "close", bad, tier === "full" ? outName : tier === "calm" ? "calm-fade-out" : null);
      if (tier === "full" && kind === "desktop") {
        // a kiosk dock sheet (full screen) and the jam-popup
        const ok = await p.evaluate(() => { const k = [...document.querySelectorAll("#view jam-kiosk")].find(x => x.shadowRoot.querySelector(".c-kt .c-open"));
          const b = k && k.shadowRoot.querySelector(".c-kt .c-open"); if (b) b.click(); return !!b; });
        const ds = ok && await p.evaluate(() => window.__mo.state());
        if (!ds || !/full/.test(ds.cls) || !ds.wipe.some(a => a.name === "cm-in-f")) bad.push(`dock sheet open ${ds ? JSON.stringify([ds.cls, ds.wipe.map(a => a.name)]) : "missing"}`);
        if (ds) await leave(p, "dock sheet close", bad, "calm-fade-out");
        const jp = await p.evaluate(async () => {
          const pu = [...document.querySelectorAll("#view jam-popup")].find(x => x._config && x._config.hash);
          if (!pu) return null;
          location.hash = pu._config.hash; dispatchEvent(new HashChangeEvent("hashchange"));
          const pop = pu.shadowRoot.querySelector(".pop"), names = el => el.getAnimations().map(a => a.animationName);
          const open = {cls: pop.className, wipe: names(pu.shadowRoot.querySelector(".wipe")), veil: names(pu.shadowRoot.querySelector(".veil"))};
          pu.close();
          const closing = {cls: pop.className, wipe: names(pu.shadowRoot.querySelector(".wipe"))};
          await new Promise(r => setTimeout(r, 320));
          return {open, closing, after: pop.className};
        });
        if (!jp) bad.push("no jam-popup in the preview");
        else {
          if (!jp.open.wipe.includes("cm-in-c") || !jp.open.veil.includes("cm-veil-in")) bad.push(`jam-popup open ${JSON.stringify(jp.open)}`);
          if (!/open/.test(jp.closing.cls) || !/closing/.test(jp.closing.cls) || !jp.closing.wipe.includes("cm-out-c")) bad.push(`jam-popup leave ${JSON.stringify(jp.closing)}`);
          if (/open|closing/.test(jp.after)) bad.push(`jam-popup still ${jp.after} after 320 ms`);
        }
      }
      if (tier === "calm") await p.evaluate(() => { window.JamCards.motion = true; });
      check(!bad.length && !errs.length, `${tag}: ${tier === "reduced" ? "no motion, the layer goes at once" : tier === "calm" ? "a fade in and out only" :
        `opens with ${inName}, veil to .6, leaves with ${outName}` + (kind === "desktop" ? ", dock sheet cm-in-f, jam-popup open + leave" : "")}, rests in place` +
        (bad.length || errs.length ? " — " + [...bad, ...errs].join("; ") : ""));
      await p.close();
    }
  }
};
