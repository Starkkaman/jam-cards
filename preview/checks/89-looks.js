// jam-looks (look picker, fixture 89-looks): tiles per look from hass.themes.themes (JamBoard + "Jam " themes by name, or
// `looks:` subset / order), live swatches from the theme's own values in the current mode, current pick marked
// (aria-pressed + accent fill), "Use system default" marked when no theme is picked. A tap / Enter fires HA's profile
// picker event: `settheme` (bubbles, composed) with {theme, primaryColor: undefined, accentColor: undefined} and no `dark`
// key (the user's auto / light / dark choice is kept by HA's {...selectedTheme, ...detail} merge); "" = system default;
// the current tile fires nothing. 44px targets, keyboard, focus kept over a re-render, config validation.
// Test themes reuse the Poster fonts (Londrina / Jost), so this check fetches no look-pack font (96-packs runs later).
module.exports = async (page, check) => {
  const r = await page.evaluate(async () => {
    const h = window.__hass, tick = (ms = 60) => new Promise(res => setTimeout(res, ms));
    const out = {};
    // ---- the fixture card: JamBoard + system default, JamBoard current (the page's selectedTheme) ----
    const fx = [...document.querySelectorAll("#view jam-looks")][0];
    const tiles = c => [...c.shadowRoot.querySelectorAll(".opt")];
    const fxT = tiles(fx);
    const jb = h.themes.themes.JamBoard, sw0 = fxT[0].querySelector(".sw"), face0 = fxT[0].querySelector(".sw-face");
    const rgb = v => { const p = document.createElement("i"); p.style.color = v; document.body.append(p); const c = getComputedStyle(p).color; p.remove(); return c; };
    out.fixture = {names: fxT.map(t => t.querySelector(".nm").firstChild.textContent), pressed: fxT.map(t => t.getAttribute("aria-pressed")),
      on: fxT.map(t => t.classList.contains("on")), ground: getComputedStyle(sw0).backgroundColor === rgb(jb.modes.dark["jam-ink"]),
      slab: getComputedStyle(face0).backgroundColor === rgb(jb.modes.dark["jam-slab"]), fg: getComputedStyle(face0).color === rgb(jb.modes.dark["jam-fg"]),
      font: getComputedStyle(face0).fontFamily, hidden: sw0.getAttribute("aria-hidden"), look: fx.dataset.look};
    // ---- test themes: Poster values with other colours / names ----
    const T = (ink, slab, fg, extra = {}) => ({...jb, ...extra, modes: {dark: {...jb.modes.dark, "jam-ink": ink, "jam-slab": slab, "jam-fg": fg},
      light: {...jb.modes.light, "jam-ink": "#eeeeee", "jam-slab": "var(--jam-paper)", "jam-paper": "#ffffff", "jam-fg": "#111111"}}});
    const themes = {"JamBoard": jb, "Jam Zeta": T("#102030", "#203040", "#f0f0f0", {"jam-display": '"Jost", sans-serif', "jam-display-case": "lowercase"}),
      "Jam Alpha": T("#300000", "#400000", "#ffffff"), "Other": T("#000000", "#111111", "#ffffff"), "Jammy": T("#000000", "#111111", "#ffffff")};
    const hz = {...h, themes: {...h.themes, themes, darkMode: true, default_theme: "JamBoard"}, selectedTheme: {theme: "JamBoard", dark: true}};
    const box = document.createElement("div"); box.style.cssText = "position:absolute;left:0;top:0;width:520px"; document.body.append(box);
    const mk = cfg => { const e = document.createElement("jam-looks"); e.setConfig({type: "custom:jam-looks", ...cfg}); e.hass = hz; box.append(e); return e; };
    const a = mk({title: "Dashboard look"});
    await tick();
    const names = c => tiles(c).map(t => t.querySelector(".nm").firstChild.textContent);
    out.def = {names: names(a), keys: tiles(a).map(t => t.dataset.theme), title: a.shadowRoot.querySelector(".label").textContent,
      sub: tiles(a).pop().querySelector(".sub").textContent, pressed: tiles(a).map(t => t.getAttribute("aria-pressed")).join(),
      zetaCase: getComputedStyle(tiles(a)[2].querySelector(".sw-face")).textTransform, zetaFont: getComputedStyle(tiles(a)[2].querySelector(".sw-face")).fontFamily,
      // the system default tile shows the backend theme's swatch (JamBoard here)
      defGround: getComputedStyle(tiles(a).pop().querySelector(".sw")).backgroundColor === rgb(jb.modes.dark["jam-ink"])};
    await tick(400); // view entrance (translateX) done
    const sizes = tiles(a).map(t => t.getBoundingClientRect()).map(b => Math.min(b.width, b.height));
    out.minSize = Math.round(Math.min(...sizes));
    out.inside = tiles(a).every(t => { const b = t.getBoundingClientRect(), c = a.getBoundingClientRect(); return b.left >= c.left - .5 && b.right <= c.right + .5; });
    // ---- events ----
    const got = [];
    const on = e => got.push({detail: e.detail, keys: Object.keys(e.detail), composed: e.composed, bubbles: e.bubbles, path: e.composedPath().includes(document)});
    document.addEventListener("settheme", on);
    const before = window.__settheme.length;
    tiles(a)[1].click(); // Jam Alpha
    tiles(a)[0].click(); // JamBoard = current: nothing
    tiles(a).pop().click(); // system default
    out.events = got.map(g => ({...g, detail: JSON.stringify(g.detail)}));
    out.alphaDetail = got[0] && got[0].detail; out.defDetail = got[1] && got[1].detail;
    out.preview = window.__settheme.length - before;
    // HA's merge keeps the user's dark choice: {...{theme: JamBoard, dark: true}, ...detail}
    out.merged = got[0] ? JSON.stringify({...hz.selectedTheme, ...got[0].detail}) : "";
    // ---- the pick lands as a new selectedTheme: marks follow, focus stays on the tile ----
    tiles(a)[1].focus();
    a.hass = {...hz, selectedTheme: {theme: "Jam Alpha", dark: true}};
    await tick();
    out.after = {pressed: tiles(a).map(t => t.getAttribute("aria-pressed")).join(), on: tiles(a).map(t => t.classList.contains("on")).join(),
      focus: a.shadowRoot.activeElement ? a.shadowRoot.activeElement.dataset.theme : null};
    a.hass = {...hz, selectedTheme: {theme: "", dark: true}};
    await tick();
    out.none = tiles(a).map(t => t.getAttribute("aria-pressed")).join();
    a.hass = {...hz, selectedTheme: null};
    await tick();
    out.nullSel = tiles(a).map(t => t.getAttribute("aria-pressed")).join();
    // light mode: the swatch shows the theme's light values (var() resolved inside the theme)
    a.hass = {...hz, themes: {...hz.themes, darkMode: false}};
    await tick();
    const fz = tiles(a)[1].querySelector(".sw-face");
    out.light = {ground: getComputedStyle(tiles(a)[1].querySelector(".sw")).backgroundColor, face: getComputedStyle(fz).backgroundColor, fg: getComputedStyle(fz).color};
    // ---- looks: subset + order (unknown names skipped, non-Jam theme allowed) ----
    const b = mk({looks: ["Other", "Jam Zeta", "Missing", "JamBoard"]});
    await tick();
    out.subset = names(b);
    // ---- keyboard: Tab between tiles, Enter fires ----
    a.hass = hz; await tick();
    tiles(a)[1].focus();
    window.__lk = {a, got, tiles: () => tiles(a)};
    // ---- validation ----
    const throws = cfg => { try { document.createElement("jam-looks").setConfig({type: "custom:jam-looks", ...cfg}); return false; } catch (e) { return true; } };
    out.valid = {str: throws({looks: "Jam Braun"}), num: throws({looks: [1]}), empty: throws({looks: [""]}), title: throws({title: 5}), ok: !throws({looks: ["Jam Braun"], title: "x"})};
    // no themes at all (HA without themes): only the system default tile
    const c = mk({}); c.hass = {...h, themes: {darkMode: true}, selectedTheme: null}; await tick();
    out.bare = {n: tiles(c).length, pressed: tiles(c)[0] && tiles(c)[0].getAttribute("aria-pressed"), sub: tiles(c)[0] && tiles(c)[0].querySelector(".sub").textContent};
    b.remove(); c.remove();
    window.__lk.off = () => document.removeEventListener("settheme", on);
    return out;
  });
  // keyboard (real key presses)
  await page.keyboard.press("Tab");
  const tabbed = await page.evaluate(() => { const a = window.__lk.a.shadowRoot.activeElement; return a ? a.dataset.theme : null; });
  const n0 = await page.evaluate(() => window.__lk.got.length);
  await page.keyboard.press("Shift+Tab");
  await page.keyboard.press("Enter");
  const kb = await page.evaluate(n0 => { const g = window.__lk.got; return {n: g.length - n0}; }, n0);
  const ring = await page.evaluate(() => { const t = window.__lk.a.shadowRoot.activeElement; const cs = t && getComputedStyle(t); return cs ? `${cs.outlineStyle} ${cs.outlineWidth}` : "none"; });
  const geo = await page.evaluate(() => { const a = window.__lk.a, c = a.getBoundingClientRect();
    return window.__lk.tiles().map(t => { const b = t.getBoundingClientRect(); return [Math.round(b.left - c.left), Math.round(c.right - b.right), Math.round(b.width), Math.round(b.height)]; }); });
  console.log("INFO jam-looks tile geometry [left gap, right gap, w, h]: " + JSON.stringify(geo));
  await page.evaluate(() => { window.__lk.off(); window.__lk.a.parentNode.remove(); delete window.__lk; });

  const f = r.fixture;
  check(f.names.join() === "JamBoard,Use system default" && f.pressed.join() === "true,false" && f.on.join() === "true,false" && f.ground && f.slab && f.fg &&
    /Londrina/.test(f.font) && f.hidden === "true" && f.look === "poster",
    `jam-looks fixture: JamBoard tile current (aria-pressed, accent fill), swatch = JamBoard dark ink / slab / fg in ${f.font.split(",")[0]}, decorative (aria-hidden) (${JSON.stringify(f)})`);
  check(r.def.names.join() === "JamBoard,Alpha,Zeta,Use system default" && r.def.keys.join() === "JamBoard,Jam Alpha,Jam Zeta," && r.def.title === "Dashboard look" &&
    r.def.sub === "JamBoard" && r.def.pressed === "true,false,false,false" && r.def.zetaCase === "lowercase" && /Jost/.test(r.def.zetaFont) && r.def.defGround,
    `jam-looks default list: JamBoard + "Jam " themes by name (Other / Jammy left out), system default last with the backend theme's swatch; swatch type from the theme (${JSON.stringify(r.def)})`);
  check(r.minSize >= 44 && r.inside, `jam-looks tiles: >= 44px each way (${r.minSize}px), inside the card at 520px`);
  const ev = r.events;
  check(ev.length === 2 && ev.every(e => e.composed && e.bubbles && e.path) && r.alphaDetail.theme === "Jam Alpha" &&
    JSON.stringify(ev[0].keys) === '["theme","primaryColor","accentColor"]' && r.alphaDetail.primaryColor === undefined && r.alphaDetail.accentColor === undefined &&
    r.defDetail.theme === "" && JSON.stringify(ev[1].keys) === '["theme","primaryColor","accentColor"]' && r.preview === 2,
    `jam-looks tap: settheme (bubbles, composed, reaches document) {theme, primaryColor: undefined, accentColor: undefined}, "" = system default, no dark key; the current tile fires nothing (${JSON.stringify(ev)})`);
  check(r.merged === '{"theme":"Jam Alpha","dark":true}', `jam-looks: HA's merge keeps the user's dark choice (${r.merged})`);
  check(r.after.pressed === "false,true,false,false" && r.after.on === "false,true,false,false" && r.after.focus === "Jam Alpha" &&
    r.none === "false,false,false,true" && r.nullSel === "false,false,false,true",
    `jam-looks: the mark follows hass.selectedTheme (Alpha / "" / null = system default), focus stays on the tile over the re-render (${JSON.stringify(r.after)})`);
  check(r.light.ground === "rgb(238, 238, 238)" && r.light.face === "rgb(255, 255, 255)" && r.light.fg === "rgb(17, 17, 17)",
    `jam-looks: light mode swatch from the theme's light values, var() resolved within the theme (${JSON.stringify(r.light)})`);
  check(r.subset.join() === "Other,Zeta,JamBoard,Use system default", `jam-looks looks: subset + order, unknown names skipped (${r.subset.join(", ")})`);
  check(tabbed === "Jam Zeta" && kb.n === 1 && /solid 3px/.test(ring), `jam-looks keyboard: Tab / Shift+Tab move between tiles, Enter picks (${kb.n} event), 3px focus ring (${ring})`);
  check(Object.entries(r.valid).every(([k, v]) => k === "ok" ? v : v), `jam-looks validation: looks must be a list of names, title text (${JSON.stringify(r.valid)})`);
  check(r.bare.n === 1 && r.bare.pressed === "true" && r.bare.sub === "Home Assistant", `jam-looks without themes: only "Use system default", current (${JSON.stringify(r.bare)})`);
};
