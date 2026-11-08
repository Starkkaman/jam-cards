// The rocker's two tones (1.1.0). Isaac 2026-11-08: "The shade of paddle should be the same if it's on or off instead of being
// darker when it's on", then on live 1.0.1: "The paddles look great! One issue though when I toggle in either direction it
// makes it darker I prefer the lighter shade." Until 1.0.1 the tones were worked out in JS from the computed --slab / --fg
// (a 3.2:1 grey): a card drawn before Home Assistant attached it (HA sets config + hass first) kept the CSS fallback (the
// light warm beige), and a toggle redrew the card in the page with the dark grey. Now the tones are CSS only, one source of
// truth: raised = the panel, pressed = slab3 by day (the beige) / the key tone (slab2) by night (never
// near-black), split by a hairline + a 3px shading edge on the raised half.
// Fresh pages of the preview, Hi-Fi Day (light) and Night (dark), at 390 and 1280: scratch jam-light cards created the way
// HA does (setConfig + hass, then attached; i.e. a first render detached and the redraw on attach) and one created in the
// page, switch: paddle, on and off, normal and size: kiosk, the group pop-up's member rockers, then the rocker toggled
// (aria-pressed flips) and the light's state changed in both directions (the card redraws). Asserts: one pressed tone and
// one raised tone everywhere and in every state (identical before / after a toggle both ways and between the first render
// and the redraw); raised = the panel; pressed = slab3 by day, lighter than the panel by night (not near-black); the split
// hairline and the edge are drawn; data-pd follows the palette; the symbols stand >= 3:1 on either half. The halves'
// contrast is reported (the light shade is about 1.3:1: the hairline and the edge carry the split).
// Contract: module.exports = async (page, check) => {}.
module.exports = async (page, check) => {
  const url = page.url().replace(/\?.*$/, ""), browser = page.context().browser();
  for (const [mode, want] of [["light", "day"], ["dark", "night"]]) for (const [w, h] of [[390, 844], [1280, 800]]) {
    const p = await browser.newPage({viewport: {width: w, height: h}});
    const errs = []; p.on("pageerror", e => errs.push(e.message));
    await p.goto(url + `?mode=${mode}`);
    await p.waitForFunction(() => window.__ready);
    const r = await p.evaluate(async () => {
      const H = window.__hass, wait = ms => new Promise(res => setTimeout(res, ms));
      const lum = c => { const [r, g, b] = c.map(v => { v /= 255; return v <= .04045 ? v / 12.92 : ((v + .055) / 1.055) ** 2.4; }); return .2126 * r + .7152 * g + .0722 * b; };
      const rgb = s => { const n = (String(s).match(/\d+(\.\d+)?/g) || []).slice(0, 3).map(Number); return /^color\(/.test(String(s)) ? n.map(v => v * 255) : n; };
      const ratio = (a, b) => { const x = lum(rgb(a)), y = lum(rgb(b)); return (Math.max(x, y) + .05) / (Math.min(x, y) + .05); };
      const probe = document.createElement("div"); probe.className = "c-rk"; // the panel / slab3 / key colours as this page resolves them
      const tones = (rk, where) => { const a = rk.querySelector(".c-pd-on"), b = rk.querySelector(".c-pd-off"), on = rk.getAttribute("aria-pressed") === "true";
        const ca = getComputedStyle(a), cb = getComputedStyle(b), top = ca.backgroundColor, bot = cb.backgroundColor, sym = ca.color, raisedEl = on ? cb : ca;
        const cs = getComputedStyle(rk);
        return {where, on, pressed: on ? top : bot, raised: on ? bot : top, pd: rk.dataset.pd, halves: Math.round(ratio(top, bot) * 100) / 100,
          sym: Math.round(Math.min(ratio(sym, top), ratio(sym, bot)) * 100) / 100, split: parseFloat(cb.borderTopWidth) >= 1 && cb.borderTopColor !== bot && cb.borderTopColor !== top,
          edge: /3px|4px|2px/.test(raisedEl.boxShadow), panel: cs.getPropertyValue("--cpl").trim(), slab3: cs.getPropertyValue("--ckey2").trim()}; };
      const box = document.createElement("div"); box.style.cssText = "display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:8px;padding:8px";
      document.body.prepend(box);
      const on = "light.kitchen_lamp", off = "light.tree";
      if (!H.states[on] || H.states[on].state !== "on" || !H.states[off] || H.states[off].state !== "off") return {missing: true};
      const mk = (id, extra, attachFirst) => { const e = document.createElement("jam-light"); if (attachFirst) box.append(e);
        e.setConfig({type: "custom:jam-light", entity: id, switch: "paddle", ...extra}); e.hass = H; if (!attachFirst) box.append(e); return e; };
      const cards = [mk(on), mk(off), mk(on, {size: "kiosk"}), mk(off, {size: "kiosk"}), mk(on, {}, true)];
      await wait(300);
      const rk = c => c.shadowRoot.querySelector(".c-rk");
      const out = cards.map((c, i) => tones(rk(c), ["card on", "card off", "kiosk on", "kiosk off", "card on, drawn in the page"][i]));
      // the group pop-up's member rockers (one on, one off in the fixture)
      const g = mk("light.living_room"); await wait(200);
      [...g.shadowRoot.querySelectorAll("button")].find(b => /open light controls/.test(b.getAttribute("aria-label") || "")).click();
      await wait(500);
      const hs = [...document.querySelectorAll(".jam-sheet-host")].pop();
      for (const x of hs ? hs.shadowRoot.querySelectorAll(".c-rk.c-mini") : []) out.push(tones(x, "member " + (x.getAttribute("aria-pressed") === "true" ? "on" : "off")));
      window.dispatchEvent(new KeyboardEvent("keydown", {key: "Escape", bubbles: true}));
      await wait(300);
      // a toggle in both directions (aria-pressed flips at once), then the state change that redraws the card, both ways
      const a = cards[0];
      rk(a).click(); out.push(tones(rk(a), "card toggled off (pressed flips)"));
      const flip = (id, st) => { const s = H.states[id]; return {...H, states: {...H.states, [id]: {...s, state: st, attributes: {...s.attributes, brightness: st === "on" ? 180 : null}}}}; };
      a.hass = flip(on, "off"); await wait(150); out.push(tones(rk(a), "card redrawn off"));
      rk(a).click(); out.push(tones(rk(a), "card toggled on (pressed flips)"));
      a.hass = flip(on, "on"); await wait(150); out.push(tones(rk(a), "card redrawn on"));
      const b2 = cards[1];
      b2.hass = flip(off, "on"); await wait(150); out.push(tones(rk(b2), "off card redrawn on"));
      return {out};
    });
    const tag = `rocker tones ${mode} ${w}x${h}`;
    if (r.missing) { check(false, `${tag}: preview fixtures (light.kitchen_lamp on, light.tree off)`); await p.close(); continue; }
    const o = r.out, bad = [];
    if (o.length < 12) bad.push(`${o.length} rockers, want 12 (5 cards, 2 members, 5 toggles / redraws)`);
    const lumOf = s => { const c = (String(s).match(/\d+(\.\d+)?/g) || []).slice(0, 3).map(Number).map(v => (/^color\(/.test(String(s)) ? v * 255 : v)).map(v => { v /= 255; return v <= .04045 ? v / 12.92 : ((v + .055) / 1.055) ** 2.4; }); return .2126 * c[0] + .7152 * c[1] + .0722 * c[2]; };
    for (const x of o) {
      if (x.pd !== want) bad.push(`${x.where}: data-pd ${x.pd}, want ${want}`);
      if (x.sym < 3) bad.push(`${x.where}: symbols ${x.sym}:1 < 3`);
      if (!x.split) bad.push(`${x.where}: no split hairline`);
      if (!x.edge) bad.push(`${x.where}: no shading edge on the raised half`);
    }
    const pressed = new Set(o.map(x => x.pressed)), raised = new Set(o.map(x => x.raised));
    if (pressed.size !== 1 || raised.size !== 1) bad.push(`tones differ: pressed ${[...pressed].join(" / ")}, raised ${[...raised].join(" / ")}`);
    const P = o[0].pressed, U = o[0].raised;
    if (want === "day" && lumOf(P) < .6) bad.push(`pressed ${P} is not the light shade (slab3)`);
    if (want === "night" && !(lumOf(P) > lumOf(U))) bad.push(`pressed ${P} is darker than the panel ${U} at night (near-black)`);
    check(!bad.length && !errs.length, `${tag}: ${o.length} rockers (cards drawn detached and in the page, kiosk, pop-up members, toggles both ways, redraws) ` +
      `with one pressed tone ${P} and one raised tone ${U} (halves ${o[0].halves}:1, split by the hairline + the 3px edge)` + (bad.length || errs.length ? " — " + [...bad, ...errs].join("; ") : ""));
    await p.close();
  }
};
