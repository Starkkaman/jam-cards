// Pop-ups keep the page where it was (0.11.0-calm.3). Bug (Isaac 2026-11-07, living-room iPad, lab-calm-kiosk): "When I open
// a popup it scrolls the page all the way to the top." Cause: openSheet / jam-popup locked scrolling with overflow:hidden on
// <html> AND <body>; Home Assistant's body is height:100% (html 100vh), and a body whose overflow is no longer propagated to
// the viewport clips the page to one screen, so the document's scroll range collapsed and the browser clamped it to 0 (every
// look, every browser). Now only <html> is locked (counted across sheets and jam-popups), and the scroll positions of the
// page and of every scrolled ancestor of the opener are saved before and written back after open and after close.
// Fresh pages of the Poster dark page (the preview shots stay as they were) with HA's html / body CSS
// (html{height:100vh} body{height:100%}) and an old-WebKit emulation (any change of <html> / <body> overflow resets the page's
// scroll to 0 before the next frame), at 1024x768 (iPad), 961x601 (Echo Show) and 1280x800, in two scroll set-ups:
//   - "page": the document scrolls (HA's lovelace view), scrolled to 1500;
//   - "inner": #view moved into a fixed full-screen overflow:auto scroller (an HA-like inner scroll container), scrolled to
//     1200, the document at 0;
// and in each, these pop-ups, opened and closed one after another: Poster jam-light pop-up, jam-tv Remote and Source sheets,
// a jam-kiosk dock sheet with a light pop-up stacked on it, the jam-popup (#hash), then the Calm look (theme inline on a
// wrapper, HA's view theme): light, kiosk light, TV Remote, Source, speaker, the action confirmation, a dock sheet + a light
// pop-up on it. Asserts every scroll position is unchanged after each open (300 ms) and after each close.
// Contract: module.exports = async (page, check) => {}.
module.exports = async (page, check) => {
  const url = page.url(), browser = page.context().browser();
  const runs = [[1024, 768, "page"], [1024, 768, "inner"], [961, 601, "page"], [1280, 800, "page"], [1280, 800, "inner"]];
  for (const [w, h, mode] of runs) {
    const p = await browser.newPage({viewport: {width: w, height: h}});
    const errs = [];
    p.on("pageerror", e => errs.push(e.message));
    await p.addInitScript(() => {
      // old WebKit: a change of the root / body overflow resets the page's scroll (emulated right after the change, before the
      // next frame)
      const seen = new WeakMap();
      new MutationObserver(recs => {
        for (const r of recs) {
          const n = r.target, o = n.style.overflow;
          if (seen.has(n) && seen.get(n) !== o) { const se = document.scrollingElement; if (se) se.scrollTop = 0; }
          seen.set(n, o);
        }
      }).observe(document, {attributes: true, attributeFilter: ["style"], subtree: true});
      document.addEventListener("DOMContentLoaded", () => { for (const n of [document.documentElement, document.body]) seen.set(n, n.style.overflow); });
    });
    await p.goto(url);
    await p.waitForFunction(() => window.__ready);
    await p.addStyleTag({content: "html{height:100vh}body{height:100%}"}); // HA's index.html + _style_base
    const setup = await p.evaluate(async mode => {
      const H = window.__hass, de = document.documentElement;
      delete de.dataset.look; de.classList.remove("light");
      const vars = [];
      for (const s of document.styleSheets) {
        let rules; try { rules = s.cssRules; } catch (e) { continue; }
        for (const r of rules) if (r.selectorText === ':root[data-look="calm"]') for (const q of r.style) if (q.startsWith("--")) vars.push([q, r.style.getPropertyValue(q)]);
      }
      const cfgOf = (tag, ok) => { const e = [...document.querySelectorAll("#view " + tag)].find(x => x._config && ok(x._config)); return e ? JSON.parse(JSON.stringify(e._config)) : null; };
      const tv = cfgOf("jam-tv", c => c.remote && (c.sources || []).length && !c.size && H.states[c.media_player] && H.states[c.media_player].state === "playing");
      const spk = cfgOf("jam-speaker", c => (c.speakers || []).length && !c.size);
      const kiosk = cfgOf("jam-kiosk", c => (c.dock || []).some(b => b.name === "Lights") && (c.dock || []).some(b => b.tap_action && b.tap_action.confirmation));
      const light = cfgOf("jam-light", c => H.states[c.entity] && H.states[c.entity].state === "on" && !c.size);
      if (!tv || !spk || !kiosk || !light) return {missing: true};
      const L = kiosk.dock.find(b => b.name === "Lights"), A = kiosk.dock.find(b => b.tap_action && b.tap_action.confirmation);
      const ckiosk = {...kiosk, dock: [L, A, ...kiosk.dock.filter(b => b !== L && b !== A)].slice(0, 3)};
      const offLights = A.tap_action.target.entity_id;
      // Calm cards in a wrapper with the theme inline, appended to #view (so they scroll with it)
      const wrap = document.createElement("div"); wrap.id = "sk-calm";
      for (const [q, v] of vars) wrap.style.setProperty(q, v);
      wrap.style.cssText += ";display:grid;gap:8px;grid-column:1 / -1";
      const mk = (cfg, box) => { const e = document.createElement(cfg.type.slice(7)); e.setConfig(cfg); e.hass = H; (box || wrap).append(e); return e; };
      const C = window.__sk = {calm: {
        light: mk(light), klight: mk({...light, size: "kiosk"}), tv: mk(tv), spk: mk(spk),
        act: mk({type: "custom:jam-button", name: "All lights off", label: "lights on", entities: offLights,
          tap_action: {action: "perform-action", perform_action: "light.turn_off", target: {entity_id: offLights}, confirmation: {text: "Turn off every light?"}}}),
        kiosk: mk(ckiosk)}};
      const view = document.getElementById("view");
      view.append(wrap);
      if (mode === "inner") { // HA-like inner scroller: the view scrolls inside a fixed full-screen box, the document does not
        const sc = document.createElement("div"); sc.id = "sk-scroller";
        sc.style.cssText = "position:fixed;left:0;top:0;right:0;bottom:0;overflow:auto;z-index:1";
        view.parentNode.insertBefore(sc, view); sc.append(view);
      }
      await new Promise(r => setTimeout(r, 1200));
      const btn = (card, test) => card && [...card.shadowRoot.querySelectorAll("button,[role=button]")].find(b => test((b.getAttribute("aria-label") || "") + "|" + b.textContent.trim()));
      const top = () => { const hs = [...document.querySelectorAll(".jam-sheet-host")]; return hs[hs.length - 1]; };
      const inTop = tag => { const t = top(); return t && t.shadowRoot.querySelector(tag); };
      const posterTv = [...document.querySelectorAll("#view jam-tv")].find(x => x._config && x._config.remote && !x._config.size && !x.closest("#sk-calm"));
      const posterLight = [...document.querySelectorAll("#view jam-light")].find(x => x._config && !x.closest("#sk-calm") && typeof x._openSheet === "function");
      const posterKiosk = [...document.querySelectorAll("#view jam-kiosk")].find(x => !x.closest("#sk-calm"));
      const popup = [...document.querySelectorAll("#view jam-popup")].find(x => x._config && x._config.hash);
      // [name, open() -> truthy, stacked on the previous one]
      C.openers = [
        ["poster light", () => { posterLight._openSheet(); return true; }],
        ["poster TV remote", () => { const b = btn(posterTv, t => /\|Remote$/i.test(t) || /^Remote/i.test(t)); if (b) b.click(); return !!b; }],
        ["poster TV source", () => { const b = btn(posterTv, t => /\|(Source|Watch)$/i.test(t) || /^(Source|Watch)/i.test(t)); if (b) b.click(); return !!b; }],
        ["poster dock sheet", () => { const b = posterKiosk && [...posterKiosk.shadowRoot.querySelectorAll(".blk")].find(x => x.textContent.includes("Lights")); if (b) b.click(); return !!b; }],
        ["poster light in dock sheet", () => { const l = inTop("jam-light"); if (l) l._openSheet(); return !!l; }, true],
        ["poster jam-popup", () => { if (!popup) return false; location.hash = popup._config.hash; dispatchEvent(new HashChangeEvent("hashchange")); return true; }],
        ["calm light", () => { const b = btn(C.calm.light, t => /open light controls/.test(t)); if (b) b.click(); return !!b; }],
        ["calm kiosk light", () => { const b = btn(C.calm.klight, t => /open light controls/.test(t)); if (b) b.click(); return !!b; }],
        ["calm TV remote", () => { const b = btn(C.calm.tv, t => /\|Remote$/.test(t)); if (b) b.click(); return !!b; }],
        ["calm TV source", () => { const b = btn(C.calm.tv, t => /\|Source$/.test(t)); if (b) b.click(); return !!b; }],
        ["calm speaker", () => { const b = btn(C.calm.spk, t => /: open\|/.test(t)); if (b) b.click(); return !!b; }],
        ["calm confirm", () => { const b = btn(C.calm.act, t => /…$/.test(t)); if (b) b.click(); return !!b; }],
        ["calm dock sheet", () => { const b = [...C.calm.kiosk.shadowRoot.querySelectorAll(".c-kt .c-open")].find(x => x.textContent.includes("Lights")); if (b) b.click(); return !!b; }],
        ["calm light in dock sheet", () => { const l = inTop("jam-light"); const b = btn(l, t => /open light controls/.test(t)); if (b) b.click(); return !!b; }, true],
      ];
      C.isOpen = () => document.querySelectorAll(".jam-sheet-host").length + (popup && popup.shadowRoot.querySelector(".pop.open") ? 1 : 0);
      C.closeAll = async () => {
        for (let i = 0; i < 4 && C.isOpen(); i++) { dispatchEvent(new KeyboardEvent("keydown", {key: "Escape", bubbles: true})); await new Promise(r => setTimeout(r, 120)); }
      };
      C.pos = () => { const sc = document.getElementById("sk-scroller"), se = document.scrollingElement; return [Math.round(se.scrollTop), sc ? Math.round(sc.scrollTop) : null]; };
      C.scroll = () => { const sc = document.getElementById("sk-scroller"); if (sc) { document.scrollingElement.scrollTop = 0; sc.scrollTop = 1200; } else document.scrollingElement.scrollTop = 1500; };
      return {n: C.openers.length, names: C.openers.map(o => o[0])};
    }, mode);
    const tag = `pop-ups keep the scroll ${w}x${h} ${mode}`;
    if (setup.missing) { check(false, `${tag}: preview fixtures missing`); await p.close(); continue; }
    const bad = [];
    let seen = 0;
    for (let i = 0; i < setup.n; i++) {
      const name = setup.names[i], stacked = await p.evaluate(i => !!window.__sk.openers[i][2], i);
      if (!stacked) { await p.evaluate(() => window.__sk.closeAll()); await p.waitForTimeout(200); await p.evaluate(() => window.__sk.scroll()); await p.waitForTimeout(100); }
      const before = await p.evaluate(() => window.__sk.pos());
      const ok = await p.evaluate(i => window.__sk.openers[i][1](), i);
      if (!ok) { bad.push(`${name}: no opener`); continue; }
      await p.waitForTimeout(300);
      const open = await p.evaluate(() => window.__sk.isOpen()), afterOpen = await p.evaluate(() => window.__sk.pos());
      if (!open) { bad.push(`${name}: nothing opened`); continue; }
      seen++;
      if (afterOpen.join() !== before.join()) bad.push(`${name}: open moved the scroll ${before.join("/")} -> ${afterOpen.join("/")}`);
      const next = setup.names[i + 1] && await p.evaluate(i => !!(window.__sk.openers[i + 1] || [])[2], i);
      if (next) continue; // the next one stacks on this sheet; both close together below
      await p.evaluate(() => window.__sk.closeAll());
      await p.waitForTimeout(250);
      const afterClose = await p.evaluate(() => window.__sk.pos());
      if (afterClose.join() !== before.join()) bad.push(`${name}: close moved the scroll ${before.join("/")} -> ${afterClose.join("/")}`);
    }
    check(!bad.length && !errs.length && seen === setup.n,
      `${tag}: ${seen}/${setup.n} pop-ups (Poster + Calm) opened and closed without moving the page` + (bad.length || errs.length ? " — " + [...bad, ...errs].join("; ") : ""));
    await p.close();
  }
};
