// Calm pop-ups land on the screen (0.11.0-calm.2). Bug (Isaac 2026-11-07, living-room iPad, PadKiosk = WKWebView, iPadOS 17,
// lab-calm-kiosk): "Popups appear mostly outside the view of the iPad with parts of it in the corner of the screen."
// Cause: Calm's pack CSS had a bare `:host{container-type:inline-size}`; the pack is adopted on every Calm-styled shadow root,
// the body-attached sheet holder (.jam-sheet-host) included, and Safari / WKWebView up to 18.x still gives a query container
// layout containment (WebKit bug 284945), so the holder (a 0px-tall block at the end of <body>) became the containing block
// of the fixed .pop and every pop-up / dock sheet opened at the bottom edge of the page. Chromium (the labs runner) does not
// do that, so the preview looked right. Fixed twice: Calm scopes the query container to jam-scenes, and openSheet pins the
// holder's containment / container-type / transform / filter properties to their initial values inline, which no :host rule
// can override, so the holder can never become the containing block of .pop again.
// This check runs in fresh pages of the Poster dark page (the preview shots stay as they were), at 1024x768 (iPad), 961x601
// (Echo Show), 1920x1080, 1280x800 and 390x844, with what the preview otherwise lacks:
//   - Old WebKit emulation: a holder whose computed container-type is not `normal` gets `contain: layout style inline-size`
//     (what Safari <= 18 applies); at 1024x768 and 390x844 also a second pass that adds a :host rule with containment, a
//     query container, a transform and a filter to every holder's shadow root (the core guard's inline values must win);
//   - the Calm theme set inline on a wrapper, like HA's view theme on hui-view-container (not on <html>, so the body-attached
//     holder only has the copied tokens);
//   - the page scrolled down before each pop-up opens (scroll lock on html / body);
//   - every Calm pop-up: light (and size: kiosk), TV controls, Remote, Source, kiosk Remote, speaker, an action card's
//     confirmation, a jam-kiosk dock sheet, a light pop-up opened from a card inside that dock sheet (two sheets stacked) and
//     the dock's All off confirmation.
// Remote (0.11.0-calm.3, the Echo Show's 601px was 88px short): a kiosk remote on a kiosk-wide screen (> 600px) stays inside
// its face with no scrolling body (compact only when it lacks room: never at 768px high or more); every other remote (desktop,
// phone, a kiosk card at phone width; 0.11.0-calm.4, "squished on my desktop" / "on mobile") is the mockup's full 264px
// remote (>= 640px tall, not compact, not zoomed), inside its face or in a scrolling body; every remote key is >= 44px.
// Viewports 0.11.0-calm.4: + 1440x900, 1440x800, 1366x768, 1280x720 (laptop windows) and 412x915, 375x667 (phones).
// Per pop-up: the look is calm, the holder is not a query container and .pop covers the viewport (the holder is not its
// containing block), the sheet face is fully inside
// the viewport and horizontally centred; above 600px wide it is vertically centred too (unless it fills the height), at
// 600px and below a non-kiosk pop-up is a bottom sheet (flush with the bottom edge); dock sheets cover the viewport exactly.
// Contract: module.exports = async (page, check) => {}.
module.exports = async (page, check) => {
  const url = page.url(), browser = page.context().browser();
  const VPS = [[1024, 768, true], [961, 601], [1920, 1080], [1280, 800], [390, 844, true], [1440, 900], [1440, 800], [1366, 768], [1280, 720], [412, 915], [375, 667]];
  const runs = [];
  for (const [w, h, both] of VPS) { runs.push([w, h, false]); if (both) runs.push([w, h, true]); }
  for (const [w, h, force] of runs) {
    const p = await browser.newPage({viewport: {width: w, height: h}});
    const errs = [];
    p.on("pageerror", e => errs.push(e.message));
    await p.addInitScript(force => {
      // Old WebKit: a query container gets layout containment, i.e. it becomes the containing block of fixed descendants.
      new MutationObserver(() => {
        for (const n of document.querySelectorAll(".jam-sheet-host, .jam-screensaver-layer")) {
          if (n.dataset.cpOld) continue;
          n.dataset.cpOld = "1";
          const ct = getComputedStyle(n).containerType;
          if (ct && ct !== "normal") n.style.contain = "layout style inline-size";
          // forced pass: a look's :host rule that would make the holder a containing block (the core guard must win)
          if (force && n.shadowRoot) {
            const st = document.createElement("style");
            st.textContent = ":host{contain:layout style inline-size;container-type:inline-size;transform:translateZ(0);filter:opacity(1)}";
            n.shadowRoot.append(st);
          }
        }
      }).observe(document, {childList: true, subtree: true});
    }, force);
    await p.goto(url);
    await p.waitForFunction(() => window.__ready);
    const setup = await p.evaluate(async () => {
      const h = window.__hass, de = document.documentElement;
      delete de.dataset.look; de.classList.remove("light");
      const vars = [];
      for (const s of document.styleSheets) {
        let rules; try { rules = s.cssRules; } catch (e) { continue; }
        for (const r of rules) if (r.selectorText === ':root[data-look="calm"]') for (const q of r.style) if (q.startsWith("--")) vars.push([q, r.style.getPropertyValue(q)]);
      }
      const cfgOf = (tag, ok) => { const e = [...document.querySelectorAll("#view " + tag)].find(x => x._config && ok(x._config)); return e ? JSON.parse(JSON.stringify(e._config)) : null; };
      const tv = cfgOf("jam-tv", c => c.remote && (c.sources || []).length && !c.size && h.states[c.media_player] && h.states[c.media_player].state === "playing");
      const spk = cfgOf("jam-speaker", c => (c.speakers || []).length && !c.size);
      const kiosk = cfgOf("jam-kiosk", c => (c.dock || []).some(b => b.name === "Lights") && (c.dock || []).some(b => b.tap_action && b.tap_action.confirmation));
      const light = cfgOf("jam-light", c => h.states[c.entity] && h.states[c.entity].state === "on" && !c.size);
      const offLights = (kiosk && kiosk.dock.find(b => b.tap_action && b.tap_action.confirmation).tap_action.target.entity_id) || [];
      // Calm draws the first three dock blocks: Lights (a sheet), the confirmed action, one more
      if (kiosk) { const L = kiosk.dock.find(b => b.name === "Lights"), A = kiosk.dock.find(b => b.tap_action && b.tap_action.confirmation);
        kiosk.dock = [L, A, ...kiosk.dock.filter(b => b !== L && b !== A)].slice(0, 3); }
      const missing = Object.entries({tv, spk, kiosk, light}).filter(([, v]) => !v).map(([k]) => k);
      if (missing.length) return {missing};
      const view = document.createElement("div"); view.id = "cp-view"; // HA: hui-view-container with the view theme inline
      for (const [q, v] of vars) view.style.setProperty(q, v);
      view.style.cssText += ";display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px;padding:8px;max-width:900px;margin:0 auto";
      const mk = (cfg, full) => { const e = document.createElement(cfg.type.slice(7)); e.setConfig(cfg); e.hass = h; if (full) e.style.gridColumn = "1 / -1"; view.append(e); return e; };
      const C = window.__cp = {
        light: mk(light), klight: mk({...light, size: "kiosk"}), tv: mk(tv, true), ktv: mk({...tv, size: "kiosk"}, true), spk: mk(spk, true),
        act: mk({type: "custom:jam-button", name: "All lights off", label: "lights on", entities: offLights,
          tap_action: {action: "perform-action", perform_action: "light.turn_off", target: {entity_id: offLights}, confirmation: {text: "Turn off every light?"}}}),
        kiosk: mk(kiosk, true),
      };
      document.body.append(view);
      const spacer = document.createElement("div"); spacer.id = "cp-spacer"; spacer.style.height = "2400px"; document.body.append(spacer);
      await new Promise(r => setTimeout(r, 1200)); // late-theme re-checks, fonts
      const btn = (card, test) => [...card.shadowRoot.querySelectorAll("button,[role=button]")].find(b => test((b.getAttribute("aria-label") || "") + "|" + b.textContent.trim()));
      const dock = name => [...C.kiosk.shadowRoot.querySelectorAll(".c-kt .c-open, .blk")].find(b => b.textContent.includes(name));
      C.openers = [
        ["light", () => btn(C.light, t => /open light controls/.test(t))],
        ["light kiosk", () => btn(C.klight, t => /open light controls/.test(t))],
        ["TV controls", () => btn(C.tv, t => /open controls/.test(t))],
        ["TV remote", () => btn(C.tv, t => /\|Remote$/.test(t))],
        ["TV source", () => btn(C.tv, t => /\|Source$/.test(t))],
        ["kiosk remote", () => btn(C.ktv, t => /\|Remote$/.test(t))],
        ["speaker", () => btn(C.spk, t => /: open\|/.test(t))],
        ["action confirm", () => btn(C.act, t => /…$/.test(t))],
        ["dock sheet", () => dock("Lights"), true],
        ["light in dock sheet", () => { const hs = [...document.querySelectorAll(".jam-sheet-host")], s = hs[hs.length - 1];
          if (!s) return null; const l = s.shadowRoot.querySelector("jam-light"); return l ? btn(l, t => /open light controls/.test(t)) : null; }, false, true],
        ["dock all off", () => dock(C.kiosk._config.dock[1].name)],
      ];
      return {looks: Object.fromEntries(Object.entries(C).filter(([, v]) => v && v.dataset).map(([k, v]) => [k, v.dataset.look]))};
    });
    const tag = `calm pop-ups ${w}x${h}${force ? " (hostile :host rule)" : " (old WebKit)"}`;
    if (setup.missing) { check(false, `${tag}: preview fixtures for ${setup.missing.join(", ")}`); await p.close(); continue; }
    check(Object.values(setup.looks).every(l => l === "calm"), `${tag}: the scratch cards under the inline (view) theme are calm (${JSON.stringify(setup.looks)})`);
    const names = await p.evaluate(() => window.__cp.openers.map(o => o[0]));
    const bad = [], seen = [];
    for (const [i, name] of names.entries()) {
      const keep = await p.evaluate(i => window.__cp.openers[i][3] === true, i); // opens on top of the sheet left open before
      if (!keep) {
        await p.evaluate(() => { for (const s of [...document.querySelectorAll(".jam-sheet-host")].reverse()) { const k = new KeyboardEvent("keydown", {key: "Escape", bubbles: true}); window.dispatchEvent(k); } });
        await p.waitForTimeout(150);
        await p.evaluate(() => window.scrollTo(0, Math.min(1500, document.scrollingElement.scrollHeight - innerHeight)));
      }
      const ok = await p.evaluate(i => { const b = window.__cp.openers[i][1](); if (!b) return false; b.click(); return true; }, i);
      if (!ok) { bad.push(`${name}: no opener`); continue; }
      await p.waitForTimeout(600); // the open animation (220 ms) and the staggered body
      const m = await p.evaluate(() => {
        const hs = [...document.querySelectorAll(".jam-sheet-host")], hh = hs[hs.length - 1];
        if (!hh) return null;
        const pop = hh.shadowRoot.querySelector(".pop"), f = hh.shadowRoot.querySelector(".sheet > .face"), r = f.getBoundingClientRect(), hr = pop.getBoundingClientRect();
        return {n: hs.length, full: pop.classList.contains("full"), kio: pop.classList.contains("c-kio"), look: pop.dataset.look, ct: getComputedStyle(hh).containerType,
          host: [hr.left, hr.top, hr.width, hr.height].map(Math.round), f: [r.left, r.top, r.right, r.bottom], sy: window.scrollY,
          rem: (() => { // the remote (0.11.0-calm.3): inside its face (kiosk: no scrolling body), keys >= 44px
            const x = hh.shadowRoot.querySelector(".c-remote"), body = hh.shadowRoot.querySelector(".body");
            if (!x) return null;
            const q = x.getBoundingClientRect(), keys = [...x.querySelectorAll("button")].map(k => k.getBoundingClientRect()).map(k => Math.min(k.width, k.height));
            return {bottom: q.bottom, top: q.top, w: Math.round(q.width), h: Math.round(q.height), cmp: pop.classList.contains("c-rcmp"),
              scrolls: body.scrollHeight > body.clientHeight + 1, minKey: Math.round(Math.min(...keys) * 10) / 10, zoom: x.style.zoom || ""};
          })()};
      });
      if (!m) { bad.push(`${name}: no sheet opened`); continue; }
      const [l, t, r, b] = m.f, fh = b - t, why = [];
      if (m.look !== "calm") why.push(`look ${m.look}`);
      if (m.ct !== "normal") why.push(`holder container-type ${m.ct}`);
      if (m.host.join() !== [0, 0, w, h].join()) why.push(`.pop ${m.host.join(",")} is not the viewport (the holder is its containing block)`);
      if (l < -.5 || t < -.5 || r > w + .5 || b > h + .5) why.push(`face outside the viewport`);
      if (Math.abs(l - (w - r)) > 1) why.push(`not centred horizontally`);
      if (m.full) { if (Math.abs(l) > .5 || Math.abs(t) > .5 || Math.abs(r - w) > .5 || Math.abs(b - h) > .5) why.push("dock sheet does not cover the viewport"); }
      else if (w > 600 || m.kio) { if (fh < h - 32 && Math.abs(t - (h - b)) > 1) why.push("not centred vertically"); }
      else if (Math.abs(b - h) > .5) why.push("bottom sheet not on the bottom edge");
      if (m.rem) {
        const kw = m.kio && w > 600; // a kiosk pop-up on a kiosk-wide screen: fits, compact / zoomed if it must
        if (kw && (m.rem.bottom > b + .5 || m.rem.scrolls)) why.push(`remote past its face (${Math.round(m.rem.bottom)} > ${Math.round(b)}${m.rem.scrolls ? ", body scrolls" : ""})`);
        if (kw && m.rem.cmp && h >= 768) why.push(`kiosk remote compact at ${w}x${h} (room enough for the full remote)`);
        if (!kw && (m.rem.cmp || m.rem.zoom || m.rem.w !== 264 || m.rem.h < 640)) // desktop / phone: the mockup's full-size remote
          why.push(`remote squished (${m.rem.w}x${m.rem.h}${m.rem.cmp ? ", compact" : ""}${m.rem.zoom ? ", zoom " + m.rem.zoom : ""}), want the full 264px remote`);
        if (!kw && m.rem.bottom > b + .5 && !m.rem.scrolls) why.push("remote past its face and the body does not scroll");
        if (m.rem.minKey < 43.5) why.push(`remote key ${m.rem.minKey}px < 44${m.rem.zoom ? " (zoom " + m.rem.zoom + ")" : ""}`);
      }
      if (name === "light in dock sheet" && m.n !== 2) why.push(`${m.n} sheets open, want 2 (stacked)`);
      seen.push(`${name} [${m.f.map(Math.round).join(",")}]${m.sy ? " scrolled " + m.sy : ""}`);
      if (why.length) bad.push(`${name} [${m.f.map(Math.round).join(",")}] scrolled ${m.sy}: ${why.join(", ")}`);
    }
    check(!bad.length && !errs.length && seen.length === names.length,
      `${tag}: ${seen.length}/${names.length} pop-ups on screen and placed as designed` + (bad.length || errs.length ? " — " + [...bad, ...errs].join("; ") : ""));
    await p.close();
  }
};
