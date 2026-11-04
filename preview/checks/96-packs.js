// Look packs (theming plan R6): the pack registry (JamCards.looks / lookPack / registerLook), the shared constructable
// stylesheets (one BASE sheet for every shadow root, the active pack's sheet adopted last), the URL @font-face loader
// (one font <style> in head; a pack's faces are declared on <asset base>fonts/ and only fetched when text uses them), the
// fx gate (data-fx from --jam-fx; a card's `fx: false` forces it off) and a live look switch WITHOUT reload: every card,
// an open sheet and the jam-screensaver layer adopt the new pack and come back to Poster. jam-kiosk re-measures when web
// fonts finish loading. A test pack ("packtest") marks its sheet with custom properties only, so nothing visible changes.
// Runs on the dark/1280 preview page and leaves it as it was. No fixture.
// Contract: module.exports = async (page, check, helpers) => {}.
module.exports = async (page, check) => {
  const r = await page.evaluate(async () => {
    const J = window.JamCards, h = window.__hass, de = document.documentElement;
    const tick = (ms = 40) => new Promise(res => setTimeout(res, ms));
    const deep = () => { const out = []; const walk = n => { for (const e of n.querySelectorAll("*")) { if (e._config && e.localName.startsWith("jam-")) out.push(e); if (e.shadowRoot) walk(e.shadowRoot); } }; walk(document); return out; };
    const top = [...document.querySelectorAll("#view *")].filter(e => e._config && e.localName.startsWith("jam-") && e.shadowRoot && !e.closest(".errors"));
    const theme = extra => { const nh = {...h, themes: {...h.themes, ...extra}}; for (const c of deep()) c.hass = nh; return tick(); };
    const out = {};
    // ---- registry + fonts ----
    out.looks = J.looks().filter(l => !/test$/.test(l)); // test packs of other checks (96-motifs) are left registered
    const braun = J.lookPack("braun"), oly = J.lookPack("olympia");
    const grid = J.lookPack("grid");
    out.packs = !!braun && !!oly && braun.fonts[0].family === "Archivo" && oly.fonts[0].family === "Albert Sans" && J.lookPack("poster") === null &&
      !!grid && grid.fonts[0].family === "Hanken Grotesk";
    const fs = document.head.querySelectorAll("style[data-jam-fonts]");
    out.fontStyles = fs.length;
    out.base = J.ASSET_BASE;
    const css = fs[0] ? fs[0].textContent : "";
    out.faces = ["archivo-var-latin.woff2", "albert-sans-var-latin.woff2"].every(f => css.includes(`url("${J.ASSET_BASE}fonts/${f}")`)) &&
      /font-family:"Archivo";font-style:normal;font-weight:300 700;font-display:swap/.test(css) && /font-family:"Albert Sans";[^}]*font-weight:300 600/.test(css);
    const fetched = () => performance.getEntriesByType("resource").map(e => e.name).filter(n => /\.woff2/.test(n)).map(n => n.replace(location.origin, ""));
    out.posterFetch = fetched();
    out.declared = [...document.fonts].filter(f => /Archivo|Albert Sans/.test(f.family)).map(f => f.family.replace(/"/g, "") + ":" + f.status);
    // ---- shared sheets under Poster ----
    const styled = top.filter(c => c.localName !== "jam-screensaver"); // its root holds a layer; the layer's root is styled (checked below)
    const sheets = styled.map(c => c.shadowRoot.adoptedStyleSheets || []);
    out.adopt = sheets.every(s => s.length === 2) && new Set(sheets.map(s => s[0])).size === 1 && sheets[0][0].jamText === J.BASE_CSS;
    out.styleEls = top.filter(c => c.shadowRoot.querySelector(":scope > style:not([data-jam-kiosk])") && c.localName !== "jam-screensaver").map(c => c.localName);
    out.distinct = new Set(sheets.flat()).size;
    // ---- live switch to a test pack ----
    J.registerLook({id: "packtest", css: ".face,.pop .sheet,.ov{--packtest:1} :host([data-fx]) .host,.pop[data-fx] .sheet,.ov[data-fx]{--packfx:1}"});
    const tile = top.find(c => c.localName === "jam-tile"), ss = top.find(c => c.localName === "jam-screensaver"), kiosk = top.find(c => c.localName === "jam-kiosk");
    const sheet = J.openSheet({from: tile, title: "Pack", history: false});
    const kid = document.createElement("jam-heading"); kid.setConfig({type: "custom:jam-heading", title: "In sheet"}); kid.hass = h; sheet.body.append(kid);
    const off = document.createElement("jam-heading"); off.setConfig({type: "custom:jam-heading", title: "fx off", fx: false}); off.hass = h;
    document.getElementById("view").append(off);
    await tick();
    const mark = (n, p = "--packtest") => n ? getComputedStyle(n).getPropertyValue(p).trim() : "missing";
    const firstFace = c => c.shadowRoot.querySelector(".face") || c.shadowRoot.querySelector(".host");
    const state = () => ({
      hosts: [...new Set(top.map(c => c.dataset.look))].join(","),
      faces: top.filter(c => c.shadowRoot.querySelector(".face")).every(c => mark(firstFace(c)) === "1"),
      packSheet: styled.every(c => { const a = c.shadowRoot.adoptedStyleSheets; return a.length === 3 && /--packtest/.test(a[2].jamText); }),
      pop: sheet.pop.dataset.look, popMark: mark(sheet.pop.querySelector(".sheet")), kid: kid.dataset.look, kidMark: mark(firstFace(kid)),
      ov: ss ? ss.overlay.dataset.look : "none", ovMark: ss ? mark(ss.overlay) : "none"});
    de.style.setProperty("--jam-look", "packtest");
    await theme({darkMode: true});
    out.on = state();
    out.same = {tile: tile.isConnected && top.every(c => c.isConnected), ready: window.__ready === true};
    // fx gate
    de.style.setProperty("--jam-fx", "1");
    await theme({darkMode: true});
    out.fx = {hosts: top.every(c => c.hasAttribute("data-fx")), mark: mark(tile.shadowRoot.querySelector(".host"), "--packfx"), pop: sheet.pop.hasAttribute("data-fx"),
      popMark: mark(sheet.pop.querySelector(".sheet"), "--packfx"), ov: ss ? ss.overlay.hasAttribute("data-fx") : "none", ovMark: ss ? mark(ss.overlay, "--packfx") : "none",
      off: !off.hasAttribute("data-fx") && mark(off.shadowRoot.querySelector(".host"), "--packfx") === ""};
    de.style.removeProperty("--jam-fx");
    // ---- a real pack: braun (preview looks.css block) -> Archivo from <base>fonts/, jam-kiosk re-measures on load ----
    de.style.removeProperty("--jam-look"); de.dataset.look = "braun";
    let fits = 0; const fit0 = kiosk._fit; kiosk._fit = function () { fits++; return fit0.apply(this, arguments); };
    await theme({darkMode: true});
    const val = tile.shadowRoot.querySelector(".val");
    out.braun = {hosts: [...new Set(top.map(c => c.dataset.look))].join(","), pop: sheet.pop.dataset.look, ff: getComputedStyle(val).fontFamily,
      // [BASE, own css] + the braun pack sheet once the pack has CSS (the test pack's sheet is gone either way)
      noPacktest: mark(firstFace(tile)) === "" && (() => { const ad = tile.shadowRoot.adoptedStyleSheets, bp = J.lookPack("braun");
        return bp.css ? ad.length === 3 && ad[2].jamText === bp.css : ad.length === 2; })()};
    await document.fonts.ready; await tick(200);
    out.braun.loaded = document.fonts.check('700 1em "Archivo"') && [...document.fonts].some(f => f.family.replace(/"/g, "") === "Archivo" && f.status === "loaded");
    out.braun.fetched = fetched();
    out.fits = fits;
    kiosk._fit = fit0;
    // ---- back to Poster ----
    delete de.dataset.look;
    await theme({darkMode: true});
    out.back = {hosts: [...new Set(top.map(c => c.dataset.look))].join(","), sheets: styled.every(c => c.shadowRoot.adoptedStyleSheets.length === 2), pop: sheet.pop.dataset.look,
      ov: ss ? ss.overlay.dataset.look : "none", fx: top.some(c => c.hasAttribute("data-fx")), ff: getComputedStyle(tile.shadowRoot.querySelector(".val")).fontFamily};
    sheet.close({silent: true}); off.remove();
    h.themes = {...h.themes};
    // A missing font file (e.g. HACS without dist/fonts/): the face fails quietly and the fallback stack draws the text.
    J.registerLook({id: "fonttest", fonts: [{family: "Jam Missing", weight: "400", file: "missing-latin.woff2"}]});
    out.late = document.head.querySelector("style[data-jam-fonts]").textContent.includes("missing-latin.woff2");
    let err = null;
    try { await document.fonts.load('400 16px "Jam Missing"'); } catch (e) { err = String(e); }
    const face = [...document.fonts].find(f => f.family.replace(/"/g, "") === "Jam Missing");
    out.missing = {late: out.late, status: face ? face.status : "none", err};
    return out;
  });
  // Poster first, then every pack in the bundle (src/looks/ by name); other looks may be added next to these.
  check(r.looks[0] === "poster" && ["braun", "olympia", "grid"].every(l => r.looks.includes(l)) && r.packs,
    `look packs: JamCards.looks() = ${r.looks.join(", ")}; braun (Archivo), olympia (Albert Sans), grid (Hanken Grotesk), Poster has no pack`);
  check(r.fontStyles === 1 && r.faces && r.posterFetch.length === 0 && r.declared.length === 2 && r.declared.every(d => d.endsWith(":unloaded")),
    `fonts: one font style in head with the packs' URL @font-face on ${r.base}fonts/; under Poster declared but not fetched (${r.declared.join(", ")}; fetched ${JSON.stringify(r.posterFetch)})`);
  check(r.adopt && r.styleEls.length === 0, `shared stylesheets: every card adopts [BASE, own css], one BASE sheet for all, ${r.distinct} distinct sheets, no per-card <style>` +
    (r.styleEls.length ? " — " + r.styleEls.join(",") : ""));
  check(r.on.hosts === "packtest" && r.on.faces && r.on.packSheet && r.on.pop === "packtest" && r.on.popMark === "1" && r.on.kid === "packtest" && r.on.kidMark === "1" &&
    r.on.ov === "packtest" && r.on.ovMark === "1" && r.same.tile && r.same.ready,
    `live look switch (no reload): every card, an open sheet + a card inside it and the screensaver layer adopt the pack sheet (${JSON.stringify(r.on)})`);
  check(r.fx.hosts && r.fx.mark === "1" && r.fx.pop && r.fx.popMark === "1" && r.fx.ov === true && r.fx.ovMark === "1" && r.fx.off,
    `fx gate: --jam-fx: 1 sets data-fx on cards, sheets and the screensaver layer (pack effects apply); a card with fx: false stays off (${JSON.stringify(r.fx)})`);
  check(r.braun.hosts === "braun" && r.braun.pop === "braun" && /^Archivo/.test(r.braun.ff) && r.braun.noPacktest && r.braun.loaded &&
    r.braun.fetched.some(f => f.endsWith("/fonts/archivo-var-latin.woff2")) && !r.braun.fetched.some(f => /albert/.test(f)),
    `braun: Archivo loads from the asset base on demand (only that look's file: ${JSON.stringify(r.braun.fetched)}), the previous pack's sheet is dropped`);
  check(r.missing.late && r.missing.status === "error", // document.fonts.load() rejects for it; no page error, the text keeps its fallback face
    `a pack registered later adds its faces to the font style; a missing font file fails quietly (face ${r.missing.status}), the fallback stack draws`);
  check(r.fits > 0, `jam-kiosk re-measures after the look's fonts load (${r.fits} fit passes)`);
  check(r.back.hosts === "poster" && r.back.sheets && r.back.pop === "poster" && r.back.ov === "poster" && !r.back.fx && /Londrina/.test(r.back.ff),
    `back to Poster: hosts, sheet and screensaver poster, two sheets per card, no data-fx (${JSON.stringify(r.back)})`);
};
