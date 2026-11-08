// Late view theme (0.11.0-calm.1, bug from lab-calm-home on HA 2026.11; reworked for Jam Cards 1.0.0's one look): HA applies a
// view's pinned theme (applyThemesOnElement: inline custom properties on hui-view) after the view's cards connected, and
// that theme arrives without a new hass.themes. Since 1.0.0 every card draws Hi-Fi whatever the theme, so what a late theme
// changes is the palette source: under no Hi-Fi theme (none, or a stale theme of a removed look) a card carries
// data-jam-builtin and draws the built-in Hi-Fi Night values; under the Hi-Fi theme it follows the theme's values.
// On scratch cards in a wrapper outside #view (the preview shots stay as they were), on the dark preview page:
//   - cards connect under a stale theme (--jam-look: poster inline on the wrapper): built-in palette, Hi-Fi drawn (.c-cm);
//   - the Hi-Fi theme inline, late like HA (a frame + 300 ms after connect; a marker slab #123456): the cards follow it;
//   - a switch while connected (Hi-Fi -> stale braun -> Hi-Fi, inline) and the theme removed (the page's own theme);
//   - nothing is written by the re-checks when nothing changed (a settled wrapper's cards see 0 mutations over 1.2 s);
//   - a card in an open sheet opened from a card in the wrapper follows the opener's late theme;
//   - a theme that lands by a class + stylesheet rule 150 ms after connect is picked up by the timed re-checks.
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
    // The Hi-Fi theme's declarations, as HA would set them (looks.css' first :root rule = Night), with a marker slab; a stale
    // theme = another look id with its own slab (what an old "Jam Braun" file still installed would set).
    const hifi = [];
    for (const s of document.styleSheets) {
      let rules; try { rules = s.cssRules; } catch (e) { continue; }
      const r = [...rules].find(x => x.selectorText === ":root");
      if (r && !hifi.length) for (const p of r.style) if (p.startsWith("--")) hifi.push([p, p === "--jam-slab" ? "#123456" : r.style.getPropertyValue(p)]);
    }
    const T = window.__lt = {vars: {hifi, poster: [["--jam-look", "poster"], ["--jam-slab", "#1f1c19"]], braun: [["--jam-look", "braun"], ["--jam-slab", "#fafafa"]]}};
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
    T.state = cards => cards.map(c => `${c.localName}:${c.hasAttribute("data-jam-builtin") ? "builtin" : "themed"}:${getComputedStyle(c).getPropertyValue("--jam-slab").trim()}:${c.shadowRoot.querySelector(".c-cm") ? "hifi-drawn" : "own"}`);
  });
  const state = sel => page.evaluate(sel => window.__lt.state(window.__lt[sel]), sel);
  // HA's timing: the view theme lands a frame + 300 ms later. Fired in the page and awaited from here (an evaluate awaiting
  // the page's own timers was reported as a destroyed context after 97-robust, with the page intact).
  const late = async id => {
    await page.evaluate(id => { const T = window.__lt; T.applied = false; requestAnimationFrame(() => setTimeout(() => { T.apply(T.view, id); T.applied = true; }, 300)); }, id);
    await page.waitForFunction(() => window.__lt.applied, null, {timeout: 5000});
  };
  const wait = ms => page.waitForTimeout(ms);

  // 1) cards connect under a stale theme; the Hi-Fi theme lands inline on an ancestor a frame + 300 ms later (HA's view theme)
  await page.evaluate(() => {
    const T = window.__lt, view = T.view = T.box("lt-view"), sec = document.createElement("div"); // view > section > cards
    T.apply(view, "poster");
    view.append(sec);
    T.cards = [T.mk(sec, "jam-light", {type: "custom:jam-light", entity: "light.lt_a"}),
      T.mk(sec, "jam-tile", {type: "custom:jam-tile", entity: "switch.lt_plug"}),
      T.mk(sec, "jam-heading", {type: "custom:jam-heading", title: "Late"})];
    document.body.append(view);
  });
  await wait(60);
  const before = await state("cards");
  check(before.every(s => /:builtin:#161c28:/.test(s)) && before.filter(s => s.endsWith(":hifi-drawn")).length >= 2,
    `late theme: cards connect under a stale theme with the built-in Hi-Fi Night palette, Hi-Fi drawn (${before.join(", ")})`);
  await late("hifi");
  await wait(150);
  let s = await state("cards");
  check(s.every(x => /:themed:#123456:/.test(x)), `late theme: the Hi-Fi theme applied a frame + 300 ms after connect is followed (${s.join(", ")})`);

  // 2) a look switch while connected (inline, no new hass), then the theme removed
  await page.evaluate(() => window.__lt.apply(window.__lt.view, "braun"));
  await wait(150);
  s = await state("cards");
  check(s.every(x => /:builtin:#161c28:/.test(x)), `late theme: Hi-Fi -> a stale Braun theme while connected: the built-in palette, never Braun's (${s.join(", ")})`);
  await page.evaluate(() => window.__lt.apply(window.__lt.view, "hifi"));
  await wait(150);
  s = await state("cards");
  check(s.every(x => /:themed:#123456:/.test(x)), `late theme: stale -> Hi-Fi while connected follows the theme again (${s.join(", ")})`);

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

  // 4) the view theme removed -> the page's own (Hi-Fi) theme
  await page.evaluate(() => window.__lt.apply(window.__lt.view, null));
  await wait(150);
  s = await state("cards");
  check(s.every(x => /:themed:#161c28:/.test(x)), `late theme: the view theme removed -> the page's Hi-Fi theme (${s.join(", ")})`);

  // 5) a card in an open sheet opened from a card in the view: the late theme reaches it too
  await page.evaluate(() => {
    const T = window.__lt;
    T.apply(T.view, "poster");
    T.sheet = window.JamCards.openSheet({from: T.cards[0], title: "Late sheet", history: false});
    T.sheetCards = [T.mk(T.sheet.body, "jam-light", {type: "custom:jam-light", entity: "light.lt_a"})];
  });
  await wait(60);
  const sb = await state("sheetCards");
  await late("hifi");
  await wait(150);
  s = await state("sheetCards");
  const popLook = await page.evaluate(() => window.__lt.sheet.pop.dataset.look);
  check(sb.every(x => /:#161c28:hifi-drawn$/.test(x)) && s.every(x => /:#123456:hifi-drawn$/.test(x)) && popLook === "hifi",
    `late theme: a card in an open sheet follows the opener's late theme (${sb.join(", ")} -> ${s.join(", ")}; sheet ${popLook})`);
  await page.evaluate(() => { const T = window.__lt; T.sheet.close({silent: true}); T.view.remove(); });

  // 6) a theme that lands by a class + stylesheet rule (no style attribute changes) 150 ms after connect: timed re-checks
  await page.evaluate(() => {
    const T = window.__lt, st = T.style = document.createElement("style");
    st.textContent = "#lt-view2{--jam-look:poster}#lt-view2.themed{" + T.vars.hifi.map(([p, v]) => `${p}:${v}`).join(";") + "}";
    document.head.append(st);
    const view = T.view2 = T.box("lt-view2");
    T.cards2 = [T.mk(view, "jam-light", {type: "custom:jam-light", entity: "light.lt_a"}), T.mk(view, "jam-tile", {type: "custom:jam-tile", entity: "switch.lt_plug"})];
    document.body.append(view);
    setTimeout(() => view.classList.add("themed"), 150);
  });
  await wait(1300);
  s = await state("cards2");
  check(s.every(x => /:themed:#123456:/.test(x)), `late theme: a theme from a stylesheet rule 150 ms after connect is picked up by the re-checks (${s.join(", ")})`);
  await page.evaluate(() => { const T = window.__lt; T.view2.remove(); T.style.remove(); delete window.__lt; });
};
