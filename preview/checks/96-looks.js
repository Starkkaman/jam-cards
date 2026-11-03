// Looks runtime (theming plan R1): data-look on every card host from the --jam-look token ("poster" when unset), a theme /
// dark-mode switch (new hass.themes object) re-renders the cards and re-reads the look, openSheet's .pop and the
// jam-screensaver overlay carry data-look, and the body-layer token copy list (JamCards.TOKENS) holds every token.
// R2: a --jam-shape-<kind> / --jam-radius-<kind> token on <html> reshapes every paper of that kind, the chips, strips and
// power corners (computed clip-path / border-radius), and removing it brings the Poster cuts back.
// The page is left as it was (tokens, themes object, looks). No fixture. Runs on the dark/1280 preview page.
// Contract: module.exports = async (page, check, helpers) => {}.
module.exports = async (page, check) => {
  const r = await page.evaluate(async () => {
    const J = window.JamCards, h = window.__hass, de = document.documentElement;
    const tick = () => new Promise(res => setTimeout(res, 40));
    const cards = [...document.querySelectorAll("#view *")].filter(e => e._config && e.localName.startsWith("jam-") && e.shadowRoot &&
      !(e.parentNode && e.parentNode.host) && !e.closest(".errors"));
    const looks = () => [...new Set(cards.map(c => c.dataset.look || "-"))].join(",");
    const out = {cards: cards.length, before: looks()};
    out.missing = ["--jam-alert-text", "--jam-ink-fg", "--jam-ink-dim", "--jam-slab3", "--jam-paper-dim", "--jam-s5", "--jam-band", "--jam-band-fg",
      "--jam-plate", "--jam-focus", "--jam-look", "--jam-accent", "--jam-display"].filter(t => !J.TOKENS.includes(t));
    // An unrelated hass object with the same themes object: no look write, no render (97-robust covers the render count).
    const tile = cards.find(c => c.localName === "jam-tile"), kiosk = cards.find(c => c.localName === "jam-kiosk");
    let n = 0; const mo = new MutationObserver(l => { n += l.length; });
    mo.observe(tile.shadowRoot, {subtree: true, childList: true});
    for (const c of cards) c.hass = {...h};
    await tick(); out.same = n;
    // Theme switch: --jam-look on <html> + a new themes object (light) -> every card re-renders and reads the new look.
    de.style.setProperty("--jam-look", "Stress-Look");
    const light = {...h, themes: {...h.themes, darkMode: false}};
    n = 0;
    for (const c of cards) c.hass = light;
    await tick(); mo.disconnect();
    out.switchRender = n; out.after = looks();
    out.kioskLight = !!kiosk && kiosk.shadowRoot.querySelector(".host").classList.contains("light");
    const s = J.openSheet({from: tile, title: "Look", history: false});
    out.sheet = s.pop.dataset.look; s.close({silent: true});
    const ss = cards.find(c => c.localName === "jam-screensaver");
    out.ss = ss ? ss.overlay.dataset.look : "none";
    out.lookOfBad = (de.style.setProperty("--jam-look", "'x y'"), J.lookOf(tile));
    // Back: no --jam-look (poster), dark themes object kept on window.__hass for the following checks.
    de.style.removeProperty("--jam-look");
    const back = {...h.themes, darkMode: true};
    h.themes = back;
    for (const c of cards) c.hass = {...h};
    await tick();
    out.back = looks(); out.kioskDark = !!kiosk && !kiosk.shadowRoot.querySelector(".host").classList.contains("light");
    // Shape tokens (R2).
    const tops = cards.map(c => c.shadowRoot);
    const q = sel => { for (const r of tops) { const e = r.querySelector(sel); if (e) return e; } return null; };
    const card = q('.paper[data-cut=card] > .face'), key = q('.paper[data-cut=key] > .face'), chip = q('span.chip, div.chip'),
      fill = q('.fill'), tri = q('.pw .tri');
    const shapes = () => [card, key, chip, fill, tri].map(e => e ? getComputedStyle(e).clipPath : "missing");
    const before = shapes();
    de.style.setProperty("--jam-shape-card", "inset(0 round 0 26px 26px 0)");
    de.style.setProperty("--jam-shape-key", "none"); de.style.setProperty("--jam-radius-key", "12px");
    de.style.setProperty("--jam-shape-chip", "inset(0 round 4px)");
    de.style.setProperty("--jam-shape-strip-end", "none"); de.style.setProperty("--jam-shape-pw", "circle(50% at 100% 0)");
    out.shaped = shapes(); out.keyRadius = key ? getComputedStyle(key).borderTopLeftRadius : "missing";
    for (const t of ["card", "key", "chip", "strip-end", "pw"]) de.style.removeProperty("--jam-shape-" + t);
    de.style.removeProperty("--jam-radius-key");
    out.shapesBack = JSON.stringify(shapes()) === JSON.stringify(before) && before.every(v => v.startsWith("polygon("));
    return out;
  });
  check(r.shaped[0] === "inset(0px round 0px 26px 26px 0px)" && r.shaped[1] === "none" && r.keyRadius === "12px" && r.shaped[2] === "inset(0px round 4px)" &&
    r.shaped[3] === "none" && r.shaped[4] === "circle(50% at 100% 0%)" && r.shapesBack,
    `looks: shape tokens reshape card / key (+ radius ${r.keyRadius}) / chip / strip end / power corner (${r.shaped.join(" | ")}), Poster cuts back without them (${r.shapesBack})`);
  check(r.before === "poster" && r.cards > 80, `looks: every card host has data-look=poster without a --jam-look token (${r.before}, ${r.cards} cards)`);
  check(r.missing.length === 0, `looks: JamCards.TOKENS (body-layer copy list) holds every token incl. alert-text, ink-fg, slab3, look` + (r.missing.length ? " — missing " + r.missing.join(", ") : ""));
  check(r.same === 0, `looks: a new hass with the same themes object re-renders nothing (${r.same} mutations)`);
  check(r.switchRender > 0 && r.after === "stress-look" && r.kioskLight, `looks: a theme switch (new themes object, light) re-renders (${r.switchRender} mutations), data-look follows --jam-look (${r.after}), jam-kiosk turns light (${r.kioskLight})`);
  check(r.sheet === "stress-look" && r.ss === "stress-look", `looks: openSheet .pop and the screensaver overlay carry data-look (${r.sheet}, ${r.ss})`);
  check(r.lookOfBad === "poster", `looks: a --jam-look that is not an id falls back to poster (${r.lookOfBad})`);
  check(r.back === "poster" && r.kioskDark, `looks: back to poster + dark (${r.back}, kiosk dark ${r.kioskDark})`);
};
