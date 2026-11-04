// Motif registry (theming plan R7): every decorative drawing goes through JamCards.motif(name, ctx, ...): Golden Arm bars
// (empty), cut-paper idle art (idleArt), the Vertigo spiral (flash), weather glyphs (wxGlyph), remote / transport glyphs
// (remoteGlyph), the power corner glyph (powerGlyph) and the screensaver composition (screensaver). Poster's motifs equal
// the old helpers. A test pack ("motiftest") overrides all of them by extending the Poster ones (this.poster) with a
// data-mt marker: a live look switch re-renders the cards that draw motifs, the open sheet's flash and the screensaver
// shapes; switching back leaves no marker. Runs on the dark/1280 preview page and leaves it as it was. No fixture.
// Contract: module.exports = async (page, check, helpers) => {}.
module.exports = async (page, check) => {
  const r = await page.evaluate(async () => {
    const J = window.JamCards, h = window.__hass, de = document.documentElement;
    const tick = (ms = 60) => new Promise(res => setTimeout(res, ms));
    const roots = () => { const out = [document]; const walk = n => { for (const e of n.querySelectorAll("*")) if (e.shadowRoot) { out.push(e.shadowRoot); walk(e.shadowRoot); } }; walk(document); return out; };
    const cards = () => { const out = []; for (const r of roots()) for (const e of r.querySelectorAll("*")) if (e._config && e.localName.startsWith("jam-")) out.push(e); return out; };
    const all = sel => roots().reduce((n, r) => n + r.querySelectorAll(sel).length, 0);
    const theme = () => { const nh = {...h, themes: {...h.themes}}; for (const c of cards()) c.hass = nh; return tick(); };
    const NAMES = ["empty", "idleArt", "flash", "wxGlyph", "remoteGlyph", "powerGlyph", "screensaver", "code", "gauge", "graph"];
    const out = {};
    // Poster motifs are the old helpers.
    out.poster = {
      empty: J.motif("empty", "poster", "k|1").outerHTML === J.armBars("k|1").outerHTML,
      flash: J.motif("flash", "poster").outerHTML === J.vertigoSpiral().outerHTML,
      remote: typeof J.motif("remoteGlyph", "poster", "power") === "string" && J.motif("remoteGlyph", "poster", "nope") === null,
      power: J.motif("powerGlyph", "poster").localName === "svg",
      ss: J.motif("screensaver", "poster").map(n => n.className).join(",") === "sh b1 bar,sh b2 bar,sh b3 bar,sh dk disc",
      hooks: J.motif("code", "poster", "Living") === null && J.motif("gauge", "poster", .5, null) === null && J.motif("graph", "poster") === null &&
        J.motif("decorate", "poster", document.createElement("div"), null) === undefined && J.motif("decorateRoot", "poster", document.createElement("div")) === null,
      unknown: (() => { try { J.motif("nope", "poster"); return false; } catch (e) { return true; } })(),
    };
    // Test pack: each motif = the Poster one + a data-mt marker.
    const mark = (n, name) => { n.setAttribute("data-mt", name); return n; };
    J.registerLook({id: "motiftest", motifs: {
      empty(...a) { return mark(this.poster(...a), "empty"); },
      idleArt(...a) { return mark(this.poster(...a), "idleArt"); },
      flash(...a) { return mark(this.poster(...a), "flash"); },
      wxGlyph(...a) { return mark(this.poster(...a), "wxGlyph"); },
      remoteGlyph(...a) { const m = this.poster(...a); return m && m.replace("<svg", '<svg data-mt="remoteGlyph"'); },
      powerGlyph(...a) { return mark(this.poster(...a), "powerGlyph"); },
      screensaver(...a) { return this.poster(...a).map(n => mark(n, "screensaver")); },
      // R10 hooks (Poster draws none: null): the name code, the gauge meter, the graph series.
      code(name) { const n = document.createElement("span"); n.className = "mtcode"; n.setAttribute("aria-hidden", "true"); n.dataset.name = name; return mark(n, "code"); },
      gauge() { return mark(document.createElementNS("http://www.w3.org/2000/svg", "svg"), "gauge"); },
      graph(svg) { svg.setAttribute("data-mt", "graph"); return null; }, // marks the svg, then lets the card draw (null = not handled)
    }});
    const before = {arm: all(".arm"), idle: all(".abs"), mt: all("[data-mt]")};
    const tile = document.querySelector("#view jam-tile");
    const sheet = J.openSheet({from: tile, title: "Motifs", history: false});
    de.style.setProperty("--jam-look", "motiftest");
    await theme(); await tick(200);
    const count = name => all(`[data-mt="${name}"]`);
    out.on = Object.fromEntries(NAMES.map(n => [n, count(n)]));
    out.onSheet = !!sheet.pop.querySelector('.spiral [data-mt="flash"]');
    const inCard = tag => [...document.querySelectorAll("#view " + tag), ...[...document.querySelectorAll("#view *")].filter(e => e.shadowRoot).flatMap(e => [...e.shadowRoot.querySelectorAll(tag)])]
      .some(c => c.shadowRoot && c.shadowRoot.querySelector('[data-mt="code"]'));
    // jam-graph draws its series (and asks the graph motif) only once it has history: earlier checks may leave a graph
    // loading, so the marks must equal the graphs that have a plot now.
    out.graphPlots = cards().filter(c => c.localName === "jam-graph" && c._plot && c._plot.isConnected).length;
    out.codeIn = {heading: inCard("jam-heading"), button: inCard("jam-button"), kiosk: inCard("jam-kiosk")};
    out.before = before;
    de.style.removeProperty("--jam-look");
    await theme(); await tick(200);
    out.back = {mt: all("[data-mt]"), arm: all(".arm"), idle: all(".abs"), sheet: !sheet.pop.querySelector("[data-mt]") && !!sheet.pop.querySelector(".spiral svg")};
    sheet.close({silent: true});
    h.themes = {...h.themes};
    return out;
  });
  check(Object.values(r.poster).every(Boolean), `motifs: Poster versions equal the old helpers (armBars, vertigoSpiral, JAM_GLYPHS, power glyph, screensaver shapes), the R10 look hooks (code, gauge, graph, decorate, decorateRoot) draw nothing, unknown names throw ${JSON.stringify(r.poster)}`);
  check(r.on.code > 0 && r.on.gauge > 0 && r.on.graph === r.graphPlots && r.codeIn.heading && r.codeIn.button && r.codeIn.kiosk,
    `R10 hooks reach the cards through the pack: code ${r.on.code} (jam-heading ${r.codeIn.heading}, jam-button ${r.codeIn.button}, jam-kiosk dock ${r.codeIn.kiosk}), gauge ${r.on.gauge}, graph ${r.on.graph} (of ${r.graphPlots} graphs with history)`);
  const ok = r.on.empty === r.before.arm && r.on.empty > 0 && r.on.idleArt >= r.before.idle && r.on.idleArt > 0 && r.on.flash >= 1 && r.on.wxGlyph > 0 &&
    r.on.remoteGlyph > 0 && r.on.powerGlyph > 0 && r.on.screensaver > 0 && r.on.screensaver % 4 === 0 && r.onSheet;
  check(ok, `a look switch redraws every motif through the pack: ${JSON.stringify(r.on)} (Poster had ${r.before.arm} arm bars, ${r.before.idle} idle arts), open sheet flash ${r.onSheet}`);
  check(r.back.mt === 0 && r.back.arm === r.before.arm && r.back.idle === r.before.idle && r.back.sheet,
    `back to Poster: no pack motif left, the Poster motifs are back (${JSON.stringify(r.back)})`);
};
