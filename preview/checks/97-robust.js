// Long-running kiosk robustness (0.3.8): lifecycle leaks, hass-update render cost, accessibility basics.
//  - lifecycle: on a clean page (?view=none) every card type is mounted / unmounted 20 times (with its sheet opened where it
//    has one) and detached / re-attached 20 times: window + document listeners, live timeouts / intervals, active
//    Mutation/ResizeObservers, weather forecast subscriptions and body-appended nodes return to the baseline, and a
//    re-attached card holds the same resources as a freshly attached one (re-armed).
//  - render cost: a hass update that touches only unrelated entities causes 0 DOM mutations in every preview card
//    (MutationObserver over all shadow roots), while an update of the card's own entity still re-renders it.
//  - a11y: role=button / slider are keyboard reachable, icon-only buttons and sliders are labelled, toggles carry a valid
//    aria-pressed, dialogs are modal and labelled, pointer-only elements outside aria-hidden do not exist, and every
//    control shows a focus ring that its own clip-path does not cut away.
// Contract: module.exports = async (page, check, helpers) => {}; runs on the dark/1280 preview page, files in name order.
module.exports = async (page, check) => {
  // ---------- configs of every card type on the preview page (first two of each tag) ----------
  const cfgs = await page.evaluate(() => {
    const seen = {}, out = [];
    for (const e of document.querySelectorAll("#view *")) {
      if (!e._config || !e.localName.startsWith("jam-") || e.closest(".errors")) continue;
      seen[e.localName] = (seen[e.localName] || 0) + 1;
      if (seen[e.localName] <= 2 || e._config.more) out.push(JSON.parse(JSON.stringify(e._config))); // + every media with a ⋯ sheet
    }
    return out;
  });
  const tags = [...new Set(cfgs.map(c => c.type.slice(7)))].sort();
  check(tags.length === 24, `lifecycle: preview has all 24 card types (${tags.length}: ${tags.join(" ")})`);

  // ---------- lifecycle on a clean page ----------
  const clean = await page.context().browser().newPage();
  const errs = [];
  clean.on("pageerror", e => errs.push(e.message));
  await clean.setViewportSize({width: 1280, height: 900});
  await clean.goto(page.url().replace(/\?.*$/, "") + "?view=none");
  await clean.waitForFunction(() => window.__ready);
  const life = await clean.evaluate(async cfgs => {
    // Instrument listeners on window/document, timers, observers, forecast subscriptions.
    const L = new Map(); // "w|type|cap" -> Map(fn -> wrapper|true)
    for (const [tn, t] of [["w", window], ["d", document]]) {
      const add = t.addEventListener, rem = t.removeEventListener;
      const key = (type, o) => `${tn}|${type}|${typeof o === "boolean" ? o : !!(o && o.capture)}`;
      t.addEventListener = function (type, fn, o) {
        if (!fn) return;
        const k = key(type, o), m = L.get(k) || new Map(); L.set(k, m);
        if (m.has(fn)) return;
        if (o && o.once) {
          const w = function (e) { m.delete(fn); return typeof fn === "function" ? fn.call(this, e) : fn.handleEvent(e); };
          m.set(fn, w); add.call(this, type, w, o);
        } else { m.set(fn, true); add.call(this, type, fn, o); }
      };
      t.removeEventListener = function (type, fn, o) {
        const m = L.get(key(type, o)), w = m && m.get(fn);
        if (m) m.delete(fn);
        rem.call(this, type, w && w !== true ? w : fn, o);
      };
    }
    const T = new Set(), I = new Set(), st = window.setTimeout, ct = window.clearTimeout, si = window.setInterval, ci = window.clearInterval;
    window.setTimeout = (fn, ms, ...a) => { const id = st(() => { T.delete(id); fn(...a); }, ms); T.add(id); return id; };
    window.clearTimeout = id => { T.delete(id); I.delete(id); ct(id); };
    window.setInterval = (fn, ms, ...a) => { const id = si(fn, ms, ...a); I.add(id); return id; };
    window.clearInterval = id => { I.delete(id); T.delete(id); ci(id); };
    const O = new Set();
    for (const C of [MutationObserver, ResizeObserver]) {
      const ob = C.prototype.observe, dc = C.prototype.disconnect;
      C.prototype.observe = function (...a) { O.add(this); return ob.apply(this, a); };
      C.prototype.disconnect = function () { O.delete(this); return dc.call(this); };
    }
    let subs = 0;
    const hass = {...window.__hass, callWS: () => Promise.resolve({}),
      connection: {subscribeMessage: (cb, msg) => {
        subs++; let live = true;
        Promise.resolve().then(() => { if (live) cb({forecast: []}); });
        return Promise.resolve(() => { if (live) { live = false; subs--; } });
      }}};
    const box = document.createElement("div"); box.style.cssText = "width:420px"; document.body.append(box);
    const tick = ms => new Promise(r => st(r, ms || 0));
    const count = () => ({listeners: [...L.values()].reduce((n, m) => n + m.size, 0), timeouts: T.size, intervals: I.size, observers: O.size,
      subs, body: document.body.childElementCount, styles: document.head.querySelectorAll("style").length});
    const sheets = () => document.querySelectorAll(".jam-sheet-host").length;
    // Open the card's sheet where it has one (light tap, media more, tv / remote keyboard sheet).
    const openSheet = e => {
      const r = e.shadowRoot;
      const b = r.querySelector("button.more:not(:disabled)") || r.querySelector(".lc:not(.dead) .tap") || r.querySelector('button[data-key="more"]') ||
        r.querySelector('button[data-key="remote"]') || r.querySelector('button[data-key="keyboard"]:not(:disabled)');
      if (b) b.click();
      return !!b;
    };
    { const w = document.createElement("jam-heading"); w.setConfig({type: "custom:jam-heading", title: "warm-up"}); } // fonts style: once per page
    await tick(50);
    const base = count(), res = {}, bad = [];
    const diff = (a, b) => Object.keys(a).filter(k => a[k] !== b[k]).map(k => `${k} ${a[k]}→${b[k]}`).join(", ");
    for (const cfg of cfgs) {
      const tag = cfg.type.slice(7);
      // 20 fresh mounts / unmounts.
      let opened = false, pressed = false;
      for (let i = 0; i < 20; i++) {
        const e = document.createElement(tag); e.setConfig(cfg); e.hass = hass; box.append(e);
        await tick();
        if (i === 0 || i === 19) opened = openSheet(e) || opened;
        // A hold-repeat key (remote d-pad / TV volume): press and release (window pointerup), like a finger.
        const rk = e.shadowRoot.querySelector('button[data-key="up"]:not(:disabled), button[data-key="vol_up"]:not(:disabled)');
        if (rk) { rk.dispatchEvent(new PointerEvent("pointerdown", {bubbles: true, composed: true, button: 0})); await tick(); window.dispatchEvent(new PointerEvent("pointerup")); pressed = true; }
        await tick();
        e.hass = {...hass};
        e.remove();
        await tick();
      }
      await tick(30);
      const after = count();
      if (diff(base, after) || sheets()) bad.push(`${tag} mount×20: ${diff(base, after)}${sheets() ? " sheets " + sheets() : ""}`);
      // One element detached / re-attached 20 times: same resources each time it is attached (re-armed), baseline when detached.
      const e = document.createElement(tag); e.setConfig(cfg); e.hass = hass; box.append(e);
      await tick(20);
      const first = count(), drift = [];
      for (let i = 0; i < 20; i++) {
        e.remove(); await tick();
        const off = count();
        if (diff(base, off)) drift.push("detached: " + diff(base, off));
        box.append(e); await tick();
        const on = count();
        if (diff(first, on)) drift.push("re-attached: " + diff(first, on));
      }
      e.remove(); await tick(20);
      const end = count();
      if (drift.length || diff(base, end)) bad.push(`${tag} re-attach×20: ${[...new Set(drift)].slice(0, 2).join("; ")}${diff(base, end) ? " end " + diff(base, end) : ""}`);
      res[tag] = {opened: opened || res[tag] && res[tag].opened, pressed: pressed || res[tag] && res[tag].pressed, attached: diff(base, first) || "nothing"};
    }
    box.remove();
    return {bad: [...new Set(bad)], res, base};
  }, cfgs);
  check(life.bad.length === 0,
    `lifecycle: ${cfgs.length} configs mounted/unmounted 20× and re-attached 20×: listeners, timers, observers, subscriptions, body nodes back to baseline` +
    (life.bad.length ? " — " + life.bad.join(" | ") : ""));
  const armed = Object.entries(life.res).filter(([, r]) => r.attached !== "nothing").map(([t, r]) => `${t}: ${r.attached}`);
  check(armed.some(a => a.startsWith("jam-weather") && /subs/.test(a)) && armed.some(a => a.startsWith("jam-graph") && /intervals/.test(a)) &&
    armed.some(a => a.startsWith("jam-tabs") && /listeners/.test(a)),
    `lifecycle: attached cards hold their resources (re-armed on re-attach) — ${armed.join("; ")}`);
  const withSheet = Object.entries(life.res).filter(([, r]) => r.opened).map(([t]) => t);
  check(["jam-light", "jam-media", "jam-tv"].every(t => withSheet.includes(t)), `lifecycle: sheets opened before unmount and closed by it (${withSheet.join(", ")})`);
  const held = Object.entries(life.res).filter(([, r]) => r.pressed).map(([t]) => t);
  check(held.includes("jam-remote") && held.includes("jam-tv"), `lifecycle: hold-repeat keys pressed + released in every mount (${held.join(", ")})`);
  check(errs.length === 0, "lifecycle: no page errors on the clean page" + (errs.length ? ": " + errs.slice(0, 3).join("; ") : ""));
  await clean.close();

  // ---------- render cost: unrelated hass updates write nothing ----------
  const cost = await page.evaluate(async () => {
    const sec = new Date().getSeconds();
    if (sec >= 58) await new Promise(r => setTimeout(r, 3000)); // keep the minute clocks out of the window
    const tops = [...document.querySelectorAll("#view *")].filter(e => e._config && e.localName.startsWith("jam-") && e.shadowRoot &&
      !(e.parentNode && e.parentNode.host) && !e.closest(".errors")); // top-level cards (popup children get hass from the popup)
    const roots = [];
    const walk = (r, top) => { roots.push([r, top]); for (const e of r.querySelectorAll("*")) if (e.shadowRoot) walk(e.shadowRoot, top); };
    const h = window.__hass;
    for (const t of tops) t.hass = {...h}; // earlier checks updated some cards only: bring every card to the current states first
    await new Promise(r => setTimeout(r, 30));
    for (const t of tops) walk(t.shadowRoot, t);
    const hits = new Map();
    const mos = roots.map(([r, top]) => { const mo = new MutationObserver(l => hits.set(top, (hits.get(top) || 0) + l.length)); mo.observe(r, {subtree: true, childList: true, attributes: true, characterData: true}); return mo; });
    const body = new MutationObserver(l => hits.set("body", (hits.get("body") || 0) + l.length)); body.observe(document.body, {childList: true});
    for (let i = 0; i < 5; i++) {
      const nh = {...h, states: {...h.states, ["sensor.unrelated_" + i]: {entity_id: "sensor.unrelated_" + i, state: String(i), attributes: {}, last_changed: "", last_updated: String(Math.random())}}};
      for (const t of tops) t.hass = nh;
      await Promise.resolve();
    }
    await new Promise(r => setTimeout(r, 60));
    for (const mo of mos) mo.disconnect(); body.disconnect();
    for (const t of tops) t.hass = h;
    const writers = [...hits].map(([t, n]) => `${t === "body" ? "body" : t.localName}(${n})`);
    // Sanity: an update of a card's own entity does re-render it.
    const tile = tops.find(t => t.localName === "jam-tile" && h.states[t._config.entity]), id = tile._config.entity;
    let own = 0;
    const mo = new MutationObserver(l => { own += l.length; }); mo.observe(tile.shadowRoot, {subtree: true, childList: true, characterData: true, attributes: true});
    const keep = h.states[id];
    tile.hass = {...h, states: {...h.states, [id]: {...keep, last_updated: "own"}}};
    await Promise.resolve(); mo.disconnect(); tile.hass = h;
    return {cards: tops.length, writers, own};
  });
  check(cost.writers.length === 0 && cost.cards > 80, `render cost: 5 unrelated hass updates → 0 DOM writes in ${cost.cards} preview cards` + (cost.writers.length ? " — " + cost.writers.join(", ") : ""));
  check(cost.own > 0, `render cost: an update of the card's own entity still re-renders it (${cost.own} mutations)`);

  // ---------- a11y basics over every card on the page ----------
  const a11y = await page.evaluate(() => {
    const roots = [];
    const walk = r => { roots.push(r); for (const e of r.querySelectorAll("*")) if (e.shadowRoot) walk(e.shadowRoot); };
    walk(document);
    const bad = [], name = e => (e.getAttribute("aria-label") || (e.getAttribute("aria-labelledby") && e.getRootNode().getElementById(e.getAttribute("aria-labelledby")) || {}).textContent || e.textContent || "").trim();
    const where = e => { let n = e; while (n.getRootNode().host) n = n.getRootNode().host; return n.localName + ">" + e.localName + "." + String(e.className).split(" ")[0]; };
    const hidden = e => { for (let n = e; n; n = n.parentNode || n.host) if (n.getAttribute && n.getAttribute("aria-hidden") === "true") return true; return false; };
    const shown = e => { const r = e.getBoundingClientRect(); return r.width > 0 && r.height > 0; };
    let controls = 0;
    for (const r of roots) for (const e of r.querySelectorAll("*")) {
      if (!e.closest("#view") && r === document) continue;
      const role = e.getAttribute("role"), isBtn = e.localName === "button";
      if (isBtn || role === "button" || role === "slider") {
        controls++;
        if (!isBtn && e.tabIndex < 0 && e.getAttribute("aria-disabled") !== "true") bad.push("not focusable: " + where(e));
        if (!name(e)) bad.push("no name: " + where(e));
        if (e.hasAttribute("aria-pressed") && !/^(true|false|mixed)$/.test(e.getAttribute("aria-pressed"))) bad.push("aria-pressed: " + where(e));
      }
      if (role === "dialog" && (e.getAttribute("aria-modal") !== "true" || !name(e))) bad.push("dialog: " + where(e));
      if (!isBtn && !role && shown(e) && !hidden(e) && getComputedStyle(e).cursor === "pointer" && !e.closest("button,[role=button],[role=slider]") &&
        !(e.parentNode && e.parentNode.closest && e.parentNode.closest("[role=button],button"))) bad.push("pointer-only: " + where(e));
    }
    return {bad: [...new Set(bad)], controls};
  });
  check(a11y.bad.length === 0 && a11y.controls > 300, `a11y: ${a11y.controls} controls are keyboard reachable and named, aria-pressed valid, dialogs modal + labelled, no pointer-only elements` +
    (a11y.bad.length ? " — " + a11y.bad.slice(0, 12).join("; ") : ""));
  // Focus ring: Tab once (keyboard modality), then focus each control: an outline >= 2px, not cut away by its own clip-path.
  await page.keyboard.press("Tab");
  const ring = await page.evaluate(() => {
    const roots = [];
    const walk = r => { roots.push(r); for (const e of r.querySelectorAll("*")) if (e.shadowRoot) walk(e.shadowRoot); };
    walk(document.getElementById("view"));
    const bad = [];
    let n = 0;
    for (const r of roots) for (const e of r.querySelectorAll("button:not(:disabled),[role=button][tabindex='0'],[role=slider][tabindex='0']")) {
      const b = e.getBoundingClientRect();
      if (!b.width || !b.height) continue;
      e.focus({preventScroll: true});
      if (!e.matches(":focus-visible")) continue;
      n++;
      // The ring may sit on the element or (jam-light) on its card via :has().
      let ok = false;
      for (let x = e, i = 0; x && i < 3 && !ok; x = x.parentElement, i++) {
        const cs = getComputedStyle(x);
        if (cs.outlineStyle === "none" || parseFloat(cs.outlineWidth) < 2) continue;
        ok = cs.clipPath === "none" || parseFloat(cs.outlineOffset) < 0;
        if (!ok) bad.push("ring clipped: " + e.localName + "." + String(e.className).split(" ")[0]);
      }
      if (!ok) bad.push("no ring: " + (e.getRootNode().host || {}).localName + ">" + e.localName + "." + String(e.className).split(" ")[0]);
      e.blur();
    }
    return {n, bad: [...new Set(bad)]};
  });
  check(ring.bad.length === 0 && ring.n > 300, `a11y: ${ring.n} focused controls show a focus ring (>= 2px, not clipped by their own cut)` + (ring.bad.length ? " — " + ring.bad.slice(0, 10).join("; ") : ""));
};
