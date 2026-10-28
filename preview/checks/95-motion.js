// Motion (0.3.5, DESIGN "Motion") + jam-button / jam-light heights. Uses the cards already on the page plus cards it creates.
// Contract: module.exports = async (page, check, helpers) => {}; runs on the dark/1280 preview page, files in name order.
module.exports = async (page, check) => {
  // ---- heights: a size-normal switch key and a light card side by side are both 84 px ----
  const hh = await page.evaluate(() => {
    const row = document.createElement("div");
    row.style.cssText = "display:flex;align-items:flex-start;gap:8px;width:400px";
    const mk = cfg => { const e = document.createElement(cfg.type.slice(7)); e.setConfig(cfg); e.hass = window.__hass; e.style.flex = "1"; row.append(e); return e; };
    const b = mk({type: "custom:jam-button", entity: "switch.mood_lighting", name: "Tree", size: "normal"});
    const l = mk({type: "custom:jam-light", entity: "light.porch"});
    document.body.append(row);
    const out = {b: b.getBoundingClientRect().height, l: l.getBoundingClientRect().height, rows: b.getGridOptions().rows};
    row.remove();
    return out;
  });
  check(hh.b === 84 && hh.l === 84 && hh.rows === "auto", `jam-button size normal = jam-light height (button ${hh.b}px, light ${hh.l}px, rows ${hh.rows})`);
  const pair = await page.evaluate(() => {
    const b = [...document.querySelectorAll("#view jam-button")].find(e => e._config.entity === "switch.mood_lighting");
    const l = [...document.querySelectorAll("#view jam-light")].find(e => e._config.entity === "light.porch");
    const r = e => e.shadowRoot.querySelector(".host > .paper").getBoundingClientRect();
    return {bt: r(b).top, lt: r(l).top, bh: r(b).height, lh: r(l).height};
  });
  check(pair.bt === pair.lt && pair.bh === pair.lh && pair.bh === 84, `fixture: Tree key and Porch light side by side, equal height (${pair.bh} / ${pair.lh}px)`);

  // ---- every animation is one-shot, stepped, <= 300 ms, transform / clip-path / opacity only ----
  const css = await page.evaluate(() => {
    const roots = [], texts = new Set(), bad = [];
    const walk = r => { roots.push(r); for (const e of r.querySelectorAll("*")) if (e.shadowRoot) walk(e.shadowRoot); };
    walk(document);
    let infinite = 0;
    for (const r of roots) {
      for (const s of r.querySelectorAll("style")) if (!s.dataset.jamFonts) texts.add(s.textContent);
      for (const e of r.querySelectorAll("*")) if (getComputedStyle(e).animationIterationCount.split(",").some(v => v.trim() === "infinite")) infinite++;
    }
    const OK = new Set(["transform", "transform-origin", "clip-path", "opacity", "visibility"]);
    let decls = 0, frames = 0;
    for (const t of texts) {
      if (/infinite/.test(t)) bad.push("'infinite' in a style");
      for (const m of t.matchAll(/animation(?:-duration)?:([^;}]+)/g)) {
        const v = m[1].trim();
        if (v === "none" || v.startsWith("none")) continue;
        decls++;
        const ms = [...v.matchAll(/(\d+(?:\.\d+)?)(ms|s)\b/g)].map(x => +x[1] * (x[2] === "s" ? 1000 : 1));
        if (m[0].startsWith("animation:") && !/steps\(/.test(v)) bad.push("not stepped: " + v);
        if (!ms.length || ms[0] > 300) bad.push("duration: " + v);
      }
      for (const m of t.matchAll(/@keyframes\s+([\w-]+)\s*\{((?:[^{}]*\{[^}]*\})*)\s*\}/g)) {
        frames++;
        for (const p of m[2].matchAll(/([a-z-]+)\s*:/g)) if (!OK.has(p[1])) bad.push(`@keyframes ${m[1]} animates ${p[1]}`);
      }
    }
    return {bad: [...new Set(bad)], infinite, decls, frames};
  });
  check(css.infinite === 0 && css.bad.length === 0 && css.decls > 8 && css.frames > 8,
    `no infinite animations; ${css.decls} animation declarations stepped and <= 300 ms; ${css.frames} keyframes use transform / clip-path / opacity only` + (css.bad.length ? " — " + css.bad.slice(0, 4).join("; ") : ""));

  // ---- view entrance: once, by document order, 40 ms stagger; never again on hass updates ----
  const enter = await page.evaluate(async () => {
    const tick = () => new Promise(r => setTimeout(r, 0));
    const leftover = [...document.querySelectorAll("#view [class], #view *")].filter(e => e.shadowRoot && e.shadowRoot.querySelector(".host.jam-enter")).length;
    const box = document.createElement("div"); document.body.append(box);
    const mk = name => { const e = document.createElement("jam-tile"); e.setConfig({type: "custom:jam-tile", entity: "light.garage", name}); e.hass = window.__hass; return e; };
    const a = mk("A"), b = mk("B"), c = mk("C");
    box.append(c); box.insertBefore(b, c); box.insertBefore(a, b); // connected C, B, A; document order A, B, C
    await tick();
    const delay = e => { const h = e.shadowRoot.querySelector(".host"); return h.classList.contains("jam-enter") ? (parseFloat(h.style.animationDelay) || 0) + "ms" : "-"; };
    const first = [a, b, c].map(delay);
    await new Promise(r => setTimeout(r, 450));
    const after = [a, b, c].map(delay);
    window.__hass.states["light.garage"] = {...window.__hass.states["light.garage"], last_updated: "m" + Math.random()};
    a.hass = {...window.__hass};
    box.remove(); document.body.append(box); await tick(); // re-attach
    const again = [a, b, c].map(delay);
    box.remove();
    return {leftover, first, after, again};
  });
  check(enter.leftover === 0, `page cards: the entrance class is gone once it played (${enter.leftover} left)`);
  check(enter.first.every(x => x !== "-") && enter.first.map(x => parseFloat(x)).every((v, i, l) => i === 0 || v - l[i - 1] === 40),
    `entrance: cards slide in by document order with a 40 ms stagger (${enter.first.join(", ")})`);
  check(enter.after.every(x => x === "-") && enter.again.every(x => x === "-"), `entrance plays once: not after it ended, a hass update or a re-attach (${enter.after} | ${enter.again})`);

  // ---- press = print ----
  const tree = page.locator("#view jam-button").filter({hasText: "Tree"}).first();
  await tree.scrollIntoViewIfNeeded();
  const bb = await tree.boundingBox();
  await page.mouse.move(bb.x + bb.width / 2, bb.y + bb.height / 2); await page.mouse.down();
  await page.waitForTimeout(120);
  const pressed = await tree.evaluate(e => { const f = e.shadowRoot.querySelector(".face"), cs = getComputedStyle(f); return {name: cs.animationName, t: cs.transform}; });
  await page.mouse.up();
  await page.waitForTimeout(30);
  const released = await tree.evaluate(e => getComputedStyle(e.shadowRoot.querySelector(".face")).animationName);
  check(pressed.name === "jam-print" && /matrix\(0\.96, 0, 0, 0\.96, 3, 3\)/.test(pressed.t) && released === "none",
    `press prints: 2-step scale(.96) + 3px on pointerdown (${pressed.name} ${pressed.t}), snaps back on release (${released})`);

  // ---- light wash: on = 3-step wipe in, off = 2-step wipe out, nothing on a plain update ----
  const wash = await page.evaluate(() => {
    const h = window.__hass, id = "light.porch", keep = h.states[id];
    const e = document.createElement("jam-light"); e.setConfig({type: "custom:jam-light", entity: id}); document.body.append(e);
    const set = patch => { h.states[id] = {...h.states[id], ...patch, attributes: {...h.states[id].attributes, ...(patch.attributes || {})}, last_updated: "w" + Math.random()}; e.hass = {...h}; };
    const w = () => { const x = e.shadowRoot.querySelector(".jam-wash"); return x ? x.className.replace("jam-wash ", "") + ":" + getComputedStyle(x).animationTimingFunction : "none"; };
    set({state: "off"}); const first = w();
    set({state: "on", attributes: {brightness: 120}}); const on = w();
    set({state: "on", attributes: {brightness: 60}}); const upd = w();
    set({state: "off"}); const off = w(), offBg = e.shadowRoot.querySelector(".jam-wash") && e.shadowRoot.querySelector(".jam-wash").style.background;
    e.remove(); h.states[id] = keep;
    return {first, on, upd, off, offBg};
  });
  check(wash.first === "none" && /^in:steps\(3/.test(wash.on) && wash.upd === "none" && /^out:steps\(2/.test(wash.off) && /rgb/.test(wash.offBg),
    `light wash: none on first render, on = ${wash.on}, brightness update = ${wash.upd}, off = ${wash.off} in the old colour (${wash.offBg})`);

  // ---- scene stamp ----
  const stamp = await page.evaluate(() => {
    const h = window.__hass, e = document.createElement("jam-scenes");
    const ids = Object.keys(h.states).filter(k => k.startsWith("scene.")).slice(0, 2);
    e.setConfig({type: "custom:jam-scenes", scenes: ids.map(entity => ({entity}))}); document.body.append(e);
    const keep = ids.map(i => h.states[i]);
    const act = i => { h.states[ids[i]] = {...h.states[ids[i]], state: new Date(Date.now() + i * 1000 + Math.random() * 999).toISOString(), last_updated: "s" + Math.random()}; e.hass = {...h}; };
    const st = () => [...e.shadowRoot.querySelectorAll(".scene")].map(b => (b.classList.contains("on") ? "on" : "off") + (b.classList.contains("jam-stamp") ? "*" : "")).join(",");
    act(0); const first = st();
    act(1); const changed = st();
    e.hass = {...h, x: 1}; e._sig = null; e.hass = {...h}; const same = st();
    e.remove(); ids.forEach((i, k) => { h.states[i] = keep[k]; });
    return {n: ids.length, first, changed, same};
  });
  check(stamp.n === 2 && !/\*/.test(stamp.first) && stamp.changed === "off,on*" && stamp.same === "off,on",
    `scenes: newly active scene stamped once (first ${stamp.first}, change ${stamp.changed}, update ${stamp.same})`);

  // ---- sheet: children stagger in once; refills do not replay ----
  await page.locator("#view jam-light").filter({hasText: "Living room"}).first().locator("button.more").click();
  const sh = await page.evaluate(async () => {
    const host = document.querySelector(".jam-sheet-host"), body = host.shadowRoot.querySelector(".body");
    const d = () => [...body.children].map(c => c.classList.contains("jam-in") ? parseFloat(c.style.animationDelay) : "-");
    const first = d();
    await new Promise(r => setTimeout(r, 700));
    const later = d();
    const light = [...document.querySelectorAll("#view jam-light")].find(e => e._sheet && e._sheet.isOpen());
    light._fillSheet();
    const refill = d();
    return {first, later, refill, opening: host.shadowRoot.querySelector(".pop").classList.contains("opening")};
  });
  await page.keyboard.press("Escape");
  check(sh.opening && sh.first.length > 2 && sh.first.every((v, i, l) => typeof v === "number" && (i === 0 || v - l[i - 1] === 40)) &&
    sh.later.every(v => v === "-") && sh.refill.every(v => v === "-"),
    `sheet: stepped open + children stagger in (${sh.first.join(", ")} ms), once (later ${sh.later.join(",")}, refill ${sh.refill.join(",")})`);
  // jam-popup: children stagger in on every open.
  const pop = await page.evaluate(async () => {
    const p = [...document.querySelectorAll("#view jam-popup")][0];
    location.hash = p._config.hash; await new Promise(r => setTimeout(r, 50));
    const kids = [...p.shadowRoot.querySelector(".body").children].map(c => c.classList.contains("jam-in") ? parseFloat(c.style.animationDelay) : "-");
    p.close(); await new Promise(r => setTimeout(r, 350));
    return kids;
  });
  check(pop.length >= 2 && pop.every((v, i, l) => typeof v === "number" && (i === 0 || v - l[i - 1] === 40)), `jam-popup: child cards stagger in on open (${pop.join(", ")} ms)`);

  // ---- motion off: JamCards.motion = false (jam-screensaver motion: false) and prefers-reduced-motion ----
  const off = await page.evaluate(async () => {
    const J = window.JamCards, h = window.__hass, tick = () => new Promise(r => setTimeout(r, 0));
    const ss = document.createElement("jam-screensaver"); ss.setConfig({type: "custom:jam-screensaver", motion: false}); ss.hass = h; document.body.append(ss);
    const flag = J.motion, root = getComputedStyle(document.documentElement).getPropertyValue("--jam-motion").trim();
    const t = document.createElement("jam-tile"); t.setConfig({type: "custom:jam-tile", entity: "light.garage", name: "M"}); t.hass = h; document.body.append(t);
    await tick();
    const entered = t.shadowRoot.querySelector(".host").classList.contains("jam-enter");
    const l = document.createElement("jam-light"); l.setConfig({type: "custom:jam-light", entity: "light.porch"}); document.body.append(l);
    const id = "light.porch", keep = h.states[id];
    h.states[id] = {...keep, state: "off", last_updated: "o1"}; l.hass = {...h};
    h.states[id] = {...keep, state: "on", last_updated: "o2"}; l.hass = {...h};
    const washed = !!l.shadowRoot.querySelector(".jam-wash");
    h.states[id] = keep; t.remove(); l.remove();
    ss.remove();
    return {flag, root, entered, washed, restored: J.motion, rootAfter: getComputedStyle(document.documentElement).getPropertyValue("--jam-motion").trim()};
  });
  check(off.flag === false && off.root === "0" && !off.entered && !off.washed && off.restored === true && off.rootAfter === "",
    `jam-screensaver motion: false -> JamCards.motion off (--jam-motion ${off.root}), no entrance, no wash; restored when it leaves (${off.restored})`);
  await page.emulateMedia({reducedMotion: "reduce"});
  const rm = await page.evaluate(async () => {
    const J = window.JamCards, h = window.__hass;
    const t = document.createElement("jam-tile"); t.setConfig({type: "custom:jam-tile", entity: "light.garage", name: "R"}); t.hass = h; document.body.append(t);
    await new Promise(r => setTimeout(r, 0));
    const host = t.shadowRoot.querySelector(".host"), entered = host.classList.contains("jam-enter");
    host.classList.add("jam-enter");                                      // even when the class is there, CSS disables it
    const anim = getComputedStyle(host).animationName;
    const k = J.cutKey("x", "k", "on jam-stamp", "chip"); t.shadowRoot.append(k);
    const st = getComputedStyle(k).animationName, before = getComputedStyle(k.firstChild, "::before").animationName;
    t.remove();
    return {on: J.motionOn(), entered, anim, st, before};
  });
  await page.emulateMedia({reducedMotion: "no-preference"});
  check(!rm.on && !rm.entered && rm.anim === "none" && rm.st === "none" && rm.before === "none",
    `prefers-reduced-motion: reduce disables everything (motionOn ${rm.on}, entrance ${rm.entered}, CSS ${rm.anim}/${rm.st}/${rm.before})`);
};
