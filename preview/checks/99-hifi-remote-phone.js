// The phone remote (1.1.0, Isaac 2026-11-08, Companion app: "Can the popup for the TV remote be taller? The bottom of the
// remote is getting cut off."). The phone pop-up was capped at 90vh, so the 647px remote's Stereo inputs row ended under the
// sheet's edge on his phone (about 411 x 817 CSS px inside the app). Now the phone remote's sheet may reach 24px under the top
// edge (plus the notch). Fresh pages of the preview at 411x817, 390x844 and 412x915: the whole full-size remote (264px,
// >= 640px tall, not compact) shows inside its face and the body does not scroll; at 375x667 the face starts 24px from the
// top and the body scrolls to the rest (never clipped, never squished); at 1280x800 the desktop pop-up is as before
// (centred, the full remote, its body scrolls when the window is short). Day and night.
// Contract: module.exports = async (page, check) => {}.
module.exports = async (page, check) => {
  const url = page.url().replace(/\?.*$/, ""), browser = page.context().browser();
  for (const [w, h, fits, mode] of [[411, 817, true, "light"], [390, 844, true, "dark"], [412, 915, true, "light"], [375, 667, false, "light"], [1280, 800, null, "dark"]]) {
    const p = await browser.newPage({viewport: {width: w, height: h}});
    const errs = []; p.on("pageerror", e => errs.push(e.message));
    await p.goto(url + `?mode=${mode}`);
    await p.waitForFunction(() => window.__ready);
    await p.waitForTimeout(400);
    const ok = await p.evaluate(() => {
      const t = [...document.querySelectorAll("#view jam-tv")].find(x => x._config && x._config.remote && !x._config.size);
      const b = t && [...t.shadowRoot.querySelectorAll("button")].find(x => /^Remote$/.test(x.textContent.trim()));
      if (b) b.click(); return !!b;
    });
    const tag = `phone remote ${w}x${h} ${mode}`;
    if (!ok) { check(false, `${tag}: no jam-tv Remote key in the preview`); await p.close(); continue; }
    await p.waitForTimeout(500);
    const m = await p.evaluate(() => {
      const hs = [...document.querySelectorAll(".jam-sheet-host")].pop(), sr = hs.shadowRoot, f = sr.querySelector(".sheet > .face").getBoundingClientRect();
      const r = sr.querySelector(".c-remote").getBoundingClientRect(), body = sr.querySelector(".body"), pop = sr.querySelector(".pop");
      const last = [...sr.querySelectorAll(".c-remote button")].pop().getBoundingClientRect();
      return {f: [f.left, f.top, f.right, f.bottom].map(Math.round), r: [Math.round(r.top), Math.round(r.bottom), Math.round(r.width), Math.round(r.height)], lastBottom: Math.round(last.bottom),
        scrolls: body.scrollHeight > body.clientHeight + 1, cmp: pop.classList.contains("c-rcmp"), zoom: sr.querySelector(".c-remote").style.zoom || ""};
    });
    const bad = [];
    if (m.r[2] !== 264 || m.r[3] < 640 || m.cmp || m.zoom) bad.push(`remote squished ${m.r[2]}x${m.r[3]}${m.cmp ? " compact" : ""}${m.zoom ? " zoom " + m.zoom : ""}`);
    if (fits === null) { if (m.r[1] > m.f[3] + .5 && !m.scrolls) bad.push("remote past its face and the body does not scroll"); }
    else if (fits) {
      if (m.scrolls) bad.push("the body scrolls");
      if (m.r[1] > m.f[3] + .5 || m.lastBottom > m.f[3] + .5) bad.push(`remote ends at ${m.r[1]} (inputs ${m.lastBottom}) past its face ${m.f[3]}`);
    } else {
      if (!m.scrolls) bad.push("too short for the remote and the body does not scroll");
      if (m.f[1] !== 24) bad.push(`face top ${m.f[1]}, want 24 (the tall phone sheet)`);
    }
    if (w <= 600 && (m.f[3] !== h || m.f[0] !== 0)) bad.push(`not a bottom sheet [${m.f}]`);
    if (w <= 600 && m.f[1] < 24) bad.push(`face top ${m.f[1]} < 24`);
    check(!bad.length && !errs.length, `${tag}: the full remote ${m.r[2]}x${m.r[3]} ${fits ? "shows whole inside its face" : fits === null ? "as on the desktop before" : "in a scrolling body"} (face [${m.f}])` +
      (bad.length || errs.length ? " — " + [...bad, ...errs].join("; ") : ""));
    await p.close();
  }
};
