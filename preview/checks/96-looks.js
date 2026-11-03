// Looks runtime (theming plan R1): data-look on every card host from the --jam-look token ("poster" when unset), a theme /
// dark-mode switch (new hass.themes object) re-renders the cards and re-reads the look, openSheet's .pop and the
// jam-screensaver overlay carry data-look, and the body-layer token copy list (JamCards.TOKENS) holds every token.
// R2: a --jam-shape-<kind> / --jam-radius-<kind> token on <html> reshapes every paper of that kind, the chips, strips and
// power corners (computed clip-path / border-radius), and removing it brings the Poster cuts back.
// R4: the colour maths (textOn / inkOn / cornerColors, jam-light faces + corners) follow the look's --jam-on-fg / --jam-ink-fg.
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
    // Pad tokens (R3): --jam-pad-<kind> raises the least inner padding of that kind's faces (incl. faces whose card sets a 0px side).
    const pads = e => { const cs = getComputedStyle(e); return [cs.paddingTop, cs.paddingRight, cs.paddingBottom, cs.paddingLeft].map(parseFloat); };
    const P = ["--p-t", "--p-r", "--p-b", "--p-l"], zero = tops.map(r => [...r.querySelectorAll('.paper[data-cut=key] > .face')]
      .find(f => pads(f).some((v, j) => v === 0 && getComputedStyle(f).getPropertyValue(P[j]).trim() === "0px"))).find(Boolean);
    const padBefore = [card, key, zero].map(e => e ? pads(e) : null);
    de.style.setProperty("--jam-pad-card", "30px"); de.style.setProperty("--jam-pad-key", "11px");
    out.padded = [card, key, zero].map(e => e ? pads(e) : null);
    de.style.removeProperty("--jam-pad-card"); de.style.removeProperty("--jam-pad-key");
    out.padOk = !!zero && out.padded[0].every(v => v >= 30) && out.padded.slice(1).every(p => p.every(v => v >= 11)) &&
      out.padded.every((p, i) => p.every((v, j) => v === Math.max(padBefore[i][j], i ? 11 : 30))) &&
      JSON.stringify([card, key, zero].map(pads)) === JSON.stringify(padBefore);
    out.padInfo = JSON.stringify({before: padBefore, padded: out.padded});
    // Colour maths per look (R4): the text pair comes from the look's --jam-on-fg / --jam-ink-fg; a theme switch re-renders
    // jam-light's face text and power-corner glyph in it; the idle-art pool reads jam-art-1..8.
    const lights = cards.filter(c => c.localName === "jam-light");
    const lc = () => lights.map(c => { const p = c.shadowRoot.querySelector(".paper.lc.on"), g = c.shadowRoot.querySelector(".pw");
      return p ? [p.style.getPropertyValue("--lc-fg"), g ? g.style.getPropertyValue("--pw-fg") : ""] : null; }).filter(Boolean);
    const lcBefore = lc(), tcBefore = J.textColors(tile.shadowRoot.querySelector(".host"));
    de.style.setProperty("--jam-on-fg", "#202a44"); de.style.setProperty("--jam-ink-fg", "rgb(255, 250, 240)");
    for (const c of lights) c.hass = {...h, themes: {...h.themes}};
    await tick();
    const tc = J.textColors(tile.shadowRoot.querySelector(".host")), lcAfter = lc();
    out.tc = {before: [tcBefore.darkCss, tcBefore.lightCss], after: [tc.darkCss, tc.lightCss, tc.dark.join(","), tc.light.join(",")],
      textOn: [J.textOn([255, 200, 120], tc).fg, J.textOn([40, 30, 90], tc).fg, J.inkOn([255, 200, 120], tc), J.cornerColors([255, 200, 120], null, tc)[1]],
      lcBefore, lcAfter};
    de.style.removeProperty("--jam-on-fg"); de.style.removeProperty("--jam-ink-fg");
    for (const c of lights) c.hass = {...h, themes: {...h.themes}};
    await tick();
    out.tc.lcBack = JSON.stringify(lc()) === JSON.stringify(lcBefore);
    // R4: jam-border (card + sheet faces only), jam-rule-h, jam-stripe-w.
    const heading = cards.find(c => c.localName === "jam-heading"), rule = heading && heading.shadowRoot.querySelector(".rule");
    const stripe = tops.map(r => r.querySelector(".stripe")).find(Boolean);
    const geo = () => ({card: getComputedStyle(card).borderTopWidth + " " + getComputedStyle(card).borderTopStyle, key: getComputedStyle(key).borderTopWidth,
      zero: zero ? getComputedStyle(zero).borderTopWidth : "", rule: rule ? rule.getBoundingClientRect().height : 0, stripe: stripe ? getComputedStyle(stripe).borderLeftWidth : ""});
    out.geo = {before: geo()};
    de.style.setProperty("--jam-border", "1px solid rgb(9, 9, 9)"); de.style.setProperty("--jam-rule-h", "2px"); de.style.setProperty("--jam-stripe-w", "3px");
    out.geo.set = geo();
    for (const t of ["border", "rule-h", "stripe-w"]) de.style.removeProperty("--jam-" + t);
    out.geo.back = geo();
    const art = document.createElement("div"); document.body.append(art);
    out.pool = (() => { const probe = document.createElement("i"); art.append(probe);
      de.style.setProperty("--jam-art-3", "rgb(1, 2, 3)"); probe.style.background = "var(--jam-art-3,var(--ochre))";
      const v = getComputedStyle(probe).backgroundColor; de.style.removeProperty("--jam-art-3"); art.remove(); return v; })();
    return out;
  });
  check(r.shaped[0] === "inset(0px round 0px 26px 26px 0px)" && r.shaped[1] === "none" && r.keyRadius === "12px" && r.shaped[2] === "inset(0px round 4px)" &&
    r.shaped[3] === "none" && r.shaped[4] === "circle(50% at 100% 0%)" && r.shapesBack,
    `looks: shape tokens reshape card / key (+ radius ${r.keyRadius}) / chip / strip end / power corner (${r.shaped.join(" | ")}), Poster cuts back without them (${r.shapesBack})`);
  check(r.padOk, `looks: pad tokens raise each side of card / key faces to at least --jam-pad-<kind> (a 0px side too), Poster paddings back without them ${r.padInfo}`);
  const T = r.tc, used = T.lcAfter.flat().filter(Boolean);
  check(T.before.join() === "#141210,#ece2c9" && T.after.join() === "#202a44,rgb(255, 250, 240),32,42,68,255,250,240" &&
    T.textOn.join() === "#202a44,rgb(255, 250, 240),#202a44,#202a44" && T.lcBefore.length > 0 &&
    used.length > 0 && used.every(v => v === "#202a44" || v === "rgb(255, 250, 240)" || v === "var(--ink-fg)") && used.includes("#202a44") && T.lcAfter.length === T.lcBefore.length && T.lcBack,
    `looks: colour maths take the look's text pair (--jam-on-fg / --jam-ink-fg): textOn / inkOn / cornerColors and jam-light face text + corner glyph follow it, Poster back after (${JSON.stringify(T)})`);
  const G = r.geo;
  check(G.before.card === "0px none" && G.before.rule === 5 && G.before.stripe === "6px" && G.set.card === "1px solid" && G.set.key === G.before.key &&
    G.set.rule === 2 && G.set.stripe === "3px" && JSON.stringify(G.back) === JSON.stringify(G.before),
    `looks: jam-border sets card faces only (keys keep theirs), jam-rule-h / jam-stripe-w size the title rule and tone stripe, Poster back after (${JSON.stringify(G)})`);
  check(r.pool === "rgb(1, 2, 3)", `looks: idle-art colours read jam-art-<n> tokens (${r.pool})`);
  check(r.before === "poster" && r.cards > 80, `looks: every card host has data-look=poster without a --jam-look token (${r.before}, ${r.cards} cards)`);
  check(r.missing.length === 0, `looks: JamCards.TOKENS (body-layer copy list) holds every token incl. alert-text, ink-fg, slab3, look` + (r.missing.length ? " — missing " + r.missing.join(", ") : ""));
  check(r.same === 0, `looks: a new hass with the same themes object re-renders nothing (${r.same} mutations)`);
  check(r.switchRender > 0 && r.after === "stress-look" && r.kioskLight, `looks: a theme switch (new themes object, light) re-renders (${r.switchRender} mutations), data-look follows --jam-look (${r.after}), jam-kiosk turns light (${r.kioskLight})`);
  check(r.sheet === "stress-look" && r.ss === "stress-look", `looks: openSheet .pop and the screensaver overlay carry data-look (${r.sheet}, ${r.ss})`);
  check(r.lookOfBad === "poster", `looks: a --jam-look that is not an id falls back to poster (${r.lookOfBad})`);
  check(r.back === "poster" && r.kioskDark, `looks: back to poster + dark (${r.back}, kiosk dark ${r.kioskDark})`);
};
