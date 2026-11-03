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
    const NAMES = ["empty", "idleArt", "flash", "wxGlyph", "remoteGlyph", "powerGlyph", "screensaver"];
    const out = {};
    // Poster motifs are the old helpers.
    out.poster = {
      empty: J.motif("empty", "poster", "k|1").outerHTML === J.armBars("k|1").outerHTML,
      flash: J.motif("flash", "poster").outerHTML === J.vertigoSpiral().outerHTML,
      remote: typeof J.motif("remoteGlyph", "poster", "power") === "string" && J.motif("remoteGlyph", "poster", "nope") === null,
      power: J.motif("powerGlyph", "poster").localName === "svg",
      ss: J.motif("screensaver", "poster").map(n => n.className).join(",") === "sh b1 bar,sh b2 bar,sh b3 bar,sh dk disc",
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
    }});
    const before = {arm: all(".arm"), idle: all(".abs"), mt: all("[data-mt]")};
    const tile = document.querySelector("#view jam-tile");
    const sheet = J.openSheet({from: tile, title: "Motifs", history: false});
    de.style.setProperty("--jam-look", "motiftest");
    await theme(); await tick(200);
    const count = name => all(`[data-mt="${name}"]`);
    out.on = Object.fromEntries(NAMES.map(n => [n, count(n)]));
    out.onSheet = !!sheet.pop.querySelector('.spiral [data-mt="flash"]');
    out.before = before;
    de.style.removeProperty("--jam-look");
    await theme(); await tick(200);
    out.back = {mt: all("[data-mt]"), arm: all(".arm"), idle: all(".abs"), sheet: !sheet.pop.querySelector("[data-mt]") && !!sheet.pop.querySelector(".spiral svg")};
    sheet.close({silent: true});
    h.themes = {...h.themes};
    return out;
  });
  check(Object.values(r.poster).every(Boolean), `motifs: Poster versions equal the old helpers (armBars, vertigoSpiral, JAM_GLYPHS, power glyph, screensaver shapes), unknown names throw ${JSON.stringify(r.poster)}`);
  const ok = r.on.empty === r.before.arm && r.on.empty > 0 && r.on.idleArt >= r.before.idle && r.on.idleArt > 0 && r.on.flash >= 1 && r.on.wxGlyph > 0 &&
    r.on.remoteGlyph > 0 && r.on.powerGlyph > 0 && r.on.screensaver > 0 && r.on.screensaver % 4 === 0 && r.onSheet;
  check(ok, `a look switch redraws every motif through the pack: ${JSON.stringify(r.on)} (Poster had ${r.before.arm} arm bars, ${r.before.idle} idle arts), open sheet flash ${r.onSheet}`);
  check(r.back.mt === 0 && r.back.arm === r.before.arm && r.back.idle === r.before.idle && r.back.sheet,
    `back to Poster: no pack motif left, the Poster motifs are back (${JSON.stringify(r.back)})`);
};
