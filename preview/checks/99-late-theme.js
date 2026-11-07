// Late view theme (0.11.0-calm.1, bug from lab-calm-home on HA 2026.11): HA applies a view's pinned theme
// (applyThemesOnElement: inline --jam-* custom properties on hui-view) AFTER the view's cards are created and connected, and
// that theme arrives without a new hass.themes. The cards read their look once on connect (Poster then), so a look that
// draws with JS (motifs, Calm's whole-card render hook) stayed Poster while the CSS tokens (inherited) were Calm.
// On scratch cards in a wrapper outside #view (the preview shots stay as they were), on the Poster page:
//   - inline theme, late like HA (a frame + 300 ms after connect): the cards re-read their look and Calm draws them (.c-cm);
//   - a theme change while connected (Calm -> Braun -> Calm, inline) and the theme removed (-> Poster, no Calm node left);
//   - a theme that lands by a class + stylesheet rule (no style attribute to observe) within 1 s: the cards' timed re-checks
//     after connect still pick it up;
//   - a card inside an open sheet (openSheet from a card in the wrapper, as jam-kiosk / jam-popup do): the sheet re-copies
//     the opener's late tokens and its card turns Calm too;
//   - nothing is written by the re-checks when nothing changed (a settled wrapper's cards see 0 mutations over 1.2 s).
// Contract: module.exports = async (page, check) => {}.
module.exports = async (page, check) => {
  await page.evaluate(() => {
    const h = window.__hass, de = document.documentElement;
    delete de.dataset.look; de.classList.remove("light");
    const st = (id, state, attributes) => ({entity_id: id, state, attributes, last_changed: new Date().toISOString(), last_updated: "x"});
    Object.assign(h.states, {
      "light.lt_a": st("light.lt_a", "on", {friendly_name: "Late lamp", brightness: 128, color_mode: "color_temp", color_temp_kelvin: 2700, supported_color_modes: ["color_temp"], min_color_temp_kelvin: 2000, max_color_temp_kelvin: 6500}),
      "switch.lt_plug": st("switch.lt_plug", "off", {friendly_name: "Late plug"}),
    });
    // The theme's declarations, as HA would set them (theme vars from looks.css' :root[data-look=<id>] rule).
    const vars = id => {
      const out = [];
      for (const s of document.styleSheets) {
        let rules; try { rules = s.cssRules; } catch (e) { continue; }
        for (const r of rules) if (r.selectorText === `:root[data-look="${id}"]`) for (const p of r.style) if (p.startsWith("--")) out.push([p, r.style.getPropertyValue(p)]);
      }
      return out;
    };
    const T = window.__lt = {vars: {calm: vars("calm"), braun: vars("braun")}};
    // HA's applyThemesOnElement: removes the last theme's keys, sets the new ones one by one (style.setProperty).
    T.apply = (node, id) => {
      for (const p of node._ltKeys || []) node.style.removeProperty(p);
      node._ltKeys = [];
      if (id) for (const [p, v] of T.vars[id]) { node.style.setProperty(p, v); node._ltKeys.push(p); }
    };
    T.mk = (box, tag, cfg) => { const e = document.createElement(tag); e.setConfig(cfg); e.hass = h; box.append(e); return e; };
    T.box = (id) => {
      const b = document.createElement("div"); b.id = id;
      b.style.cssText = "position:absolute;left:0;top:0;width:420px;display:grid;gap:8px;padding:8px;z-index:60";
      return b;
    };
    T.state = cards => cards.map(c => `${c.localName}:${c.dataset.look || "-"}:${c.shadowRoot.querySelector(".c-cm") ? "calm-drawn" : "own"}`);
  });
  const state = sel => page.evaluate(sel => window.__lt.state(window.__lt[sel]), sel);
  // HA's timing: the view theme lands a frame + 300 ms later. Fired in the page and awaited from here (an evaluate awaiting
  // the page's own timers was reported as a destroyed context after 97-robust, with the page intact).
  const late = async id => {
    await page.evaluate(id => { const T = window.__lt; T.applied = false; requestAnimationFrame(() => setTimeout(() => { T.apply(T.view, id); T.applied = true; }, 300)); }, id);
    await page.waitForFunction(() => window.__lt.applied, null, {timeout: 5000});
  };
  const wait = ms => page.waitForTimeout(ms);

  // 1) inline theme on an ancestor, a frame + 300 ms after the cards connect (HA's view theme)
  await page.evaluate(() => {
    const T = window.__lt, view = T.view = T.box("lt-view"), sec = document.createElement("div"); // view > section > cards
    view.append(sec);
    T.cards = [T.mk(sec, "jam-light", {type: "custom:jam-light", entity: "light.lt_a"}),
      T.mk(sec, "jam-tile", {type: "custom:jam-tile", entity: "switch.lt_plug"}),
      T.mk(sec, "jam-heading", {type: "custom:jam-heading", title: "Late"})];
    document.body.append(view);
  });
  await wait(60);
  const before = await state("cards");
  check(before.every(s => s.endsWith(":poster:own")), `late theme: cards connect under Poster (${before.join(", ")})`);
  await late("calm");
  await wait(150);
  let s = await state("cards");
  check(s.every(x => x.endsWith(":calm:calm-drawn")), `late theme: a view theme applied a frame + 300 ms after connect turns the cards Calm (${s.join(", ")})`);

  // 2) a look switch while connected (inline, no new hass), then the theme removed
  await page.evaluate(() => window.__lt.apply(window.__lt.view, "braun"));
  await wait(150);
  s = await state("cards");
  check(s.every(x => x.endsWith(":braun:own")), `late theme: Calm -> Braun while connected re-reads the look, no Calm node left (${s.join(", ")})`);
  await page.evaluate(() => window.__lt.apply(window.__lt.view, "calm"));
  await wait(150);
  s = await state("cards");
  check(s.every(x => x.endsWith(":calm:calm-drawn")), `late theme: Braun -> Calm while connected draws Calm again (${s.join(", ")})`);

  // 3) nothing written when nothing changed: a fresh connect wave (50 ms / 250 ms / 1 s re-checks) over settled cards
  const writes = await page.evaluate(async () => {
    const T = window.__lt, sec = T.view.firstChild;
    let n = 0; const mos = T.cards.map(c => { const mo = new MutationObserver(l => { n += l.length; }); mo.observe(c.shadowRoot, {subtree: true, childList: true, attributes: true, characterData: true}); mo.observe(c, {attributes: true}); return mo; });
    const extra = T.mk(sec, "jam-heading", {type: "custom:jam-heading", title: "Extra"}); // starts a re-check wave
    await new Promise(r => setTimeout(r, 1200));
    mos.forEach(m => m.disconnect()); extra.remove();
    return n;
  });
  check(writes === 0, `late theme: the re-checks after a connect write nothing to settled cards (${writes} mutations in 1.2 s)`);

  // 4) the theme removed -> Poster
  await page.evaluate(() => window.__lt.apply(window.__lt.view, null));
  await wait(150);
  s = await state("cards");
  check(s.every(x => x.endsWith(":poster:own")), `late theme: the view theme removed -> Poster again (${s.join(", ")})`);

  // 5) a card in an open sheet opened from a card in the view: the late theme reaches it too
  await page.evaluate(() => {
    const T = window.__lt;
    T.sheet = window.JamCards.openSheet({from: T.cards[0], title: "Late sheet", history: false});
    T.sheetCards = [T.mk(T.sheet.body, "jam-light", {type: "custom:jam-light", entity: "light.lt_a"})];
  });
  await wait(60);
  const sb = await state("sheetCards");
  await late("calm");
  await wait(150);
  s = await state("sheetCards");
  const popLook = await page.evaluate(() => window.__lt.sheet.pop.dataset.look);
  check(sb.every(x => x.endsWith(":poster:own")) && s.every(x => x.endsWith(":calm:calm-drawn")) && popLook === "calm",
    `late theme: a card in an open sheet follows the opener's late theme (${sb.join(", ")} -> ${s.join(", ")}; sheet ${popLook})`);
  await page.evaluate(() => { const T = window.__lt; T.sheet.close({silent: true}); T.view.remove(); });

  // 6) a theme that lands by a class + stylesheet rule (no style attribute changes) 150 ms after connect: timed re-checks
  await page.evaluate(() => {
    const T = window.__lt, st = T.style = document.createElement("style");
    st.textContent = "#lt-view2.themed{" + T.vars.calm.map(([p, v]) => `${p}:${v}`).join(";") + "}";
    document.head.append(st);
    const view = T.view2 = T.box("lt-view2");
    T.cards2 = [T.mk(view, "jam-light", {type: "custom:jam-light", entity: "light.lt_a"}), T.mk(view, "jam-tile", {type: "custom:jam-tile", entity: "switch.lt_plug"})];
    document.body.append(view);
    setTimeout(() => view.classList.add("themed"), 150);
  });
  await wait(1300);
  s = await state("cards2");
  check(s.every(x => x.endsWith(":calm:calm-drawn")), `late theme: a theme from a stylesheet rule 150 ms after connect is picked up by the re-checks (${s.join(", ")})`);
  await page.evaluate(() => { const T = window.__lt; T.view2.remove(); T.style.remove(); delete window.__lt; });
};
