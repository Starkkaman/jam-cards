// jam-light `switch: paddle` (opt-in; Jam Design pass 7, then Isaac 2026-11-06: "I prefer the binary on off symbols to the
// words", "It should just look like it's rocking between on and off"): on the dark/1280 preview page, test cards in a
// scratch box (no fixture, so every preview shot stays as it was), Poster dark + light, then the Braun look dark + light,
// then back to Poster.
//   - default configs keep the power corner (the preview page's own jam-light cards have .pw and no .paddle);
//   - the paddle is one rocker button: aria-pressed = the state, aria-label "<name> power, On|Off|Offline" + the same word
//     as title, no visible text, the IEC symbols as SVG (top = a line, bottom = a circle without fill) in --fg, of the same
//     size, stroke and colour in every state; inside the face, right of the text and strip; the face stays the panel;
//   - ON = the top half pressed, OFF = the bottom half pressed: the same tones flipped (on.top = off.bottom, on.bottom =
//     off.top), the same rim; pressed is the darker tone and the halves are >= 3:1 apart; each symbol >= 3:1 on its half;
//     the raised half has a thin shading edge on its pivot side; the lamp's colour shows only as a thin band on the
//     pressed top half while on;
//   - offline = the same rocker with a dashed rim, both halves unpressed, the symbols visible in --dim; "Offline" on the
//     card; off = "Off" on the card;
//   - a real on/off change rocks the paddle once (an animation <= 300 ms), none with JamCards.motion = false;
//   - size kiosk: a 96px rocker with >= 30px symbols and >= 4.5px strokes;
//   - a paddle press calls light.turn_on / turn_off and never opens the pop-up.
// Contract: module.exports = async (page, check, helpers) => {}.
module.exports = async (page, check) => {
  const r = await page.evaluate(async () => {
    const h = window.__hass, de = document.documentElement, J = window.JamCards;
    const tick = (ms = 80) => new Promise(res => setTimeout(res, ms));
    const st = (id, state, attributes) => ({entity_id: id, state, attributes, last_changed: "x", last_updated: "x"});
    const S = {
      "light.pd_warm": st("light.pd_warm", "on", {friendly_name: "Warm lamp", brightness: 191, color_mode: "color_temp", color_temp_kelvin: 2200,
        supported_color_modes: ["color_temp"], min_color_temp_kelvin: 2000, max_color_temp_kelvin: 6500}),
      "light.pd_blue": st("light.pd_blue", "on", {friendly_name: "TV light", brightness: 60, color_mode: "rgb", rgb_color: [127, 182, 255], hs_color: [214, 50], supported_color_modes: ["rgb"]}),
      "light.pd_off": st("light.pd_off", "off", {friendly_name: "Kitchen lamp", supported_color_modes: ["color_temp"]}),
      "light.pd_dead": st("light.pd_dead", "unavailable", {friendly_name: "Stove lights"}),
      "light.pd_m1": st("light.pd_m1", "on", {friendly_name: "Table", brightness: 128, color_mode: "color_temp", color_temp_kelvin: 2700, supported_color_modes: ["color_temp"]}),
      "light.pd_m2": st("light.pd_m2", "off", {friendly_name: "Floor", supported_color_modes: ["color_temp"]}),
      "light.pd_grp": st("light.pd_grp", "on", {friendly_name: "Living room", brightness: 128, entity_id: ["light.pd_m1", "light.pd_m2"], color_mode: "color_temp",
        color_temp_kelvin: 2700, supported_color_modes: ["color_temp"]}),
      "light.pd_flip": st("light.pd_flip", "off", {friendly_name: "Flip lamp", supported_color_modes: ["onoff"]}),
    };
    const saved = {...h.states};
    Object.assign(h.states, S);
    const box = document.createElement("div");
    box.style.cssText = "position:absolute;left:0;top:0;width:440px;display:grid;grid-template-columns:1fr 1fr;gap:8px;padding:8px;z-index:50";
    const cfgs = [["warm", "light.pd_warm"], ["blue", "light.pd_blue"], ["off", "light.pd_off"], ["dead", "light.pd_dead"], ["grp", "light.pd_grp"],
      ["flip", "light.pd_flip"], ["koff", "light.pd_off", {size: "kiosk"}], ["kon", "light.pd_warm", {size: "kiosk"}]];
    const cards = {};
    for (const [k, id, extra] of cfgs) {
      const e = document.createElement("jam-light");
      e.setConfig({type: "custom:jam-light", entity: id, switch: "paddle", accent: "living", ...(extra || {})});
      if (extra && extra.size) e.style.gridColumn = "1 / -1";
      e.hass = h; box.append(e); cards[k] = e;
    }
    document.body.append(box);
    let dark = true;
    const rehass = async d => { dark = d; const nh = {...h, states: {...h.states}, themes: {...h.themes, darkMode: d}}; for (const e of Object.values(cards)) e.hass = nh; await tick(150); };
    const probe = document.createElement("i"); document.body.append(probe);
    const rgb = v => { probe.style.color = ""; probe.style.color = v; const s = getComputedStyle(probe).color, n = (s.match(/[\d.]+/g) || [0, 0, 0]).map(Number);
      return s.startsWith("color(") ? n.slice(0, 3).map(x => Math.round(x * 255)) : n.slice(0, 3).map(Math.round); };
    const lum = c => { const l = c.map(v => { v /= 255; return v <= .04045 ? v / 12.92 : ((v + .055) / 1.055) ** 2.4; }); return .2126 * l[0] + .7152 * l[1] + .0722 * l[2]; };
    const cr = (a, b) => { const x = lum(a), y = lum(b); return +((Math.max(x, y) + .05) / (Math.min(x, y) + .05)).toFixed(2); };
    const same = (a, b) => !!a && !!b && a.every((v, i) => Math.abs(v - b[i]) <= 1);
    const hx = c => c ? "#" + c.map(v => v.toString(16).padStart(2, "0")).join("") : null;
    /* box-shadow list -> [{col, y}] (inset shadows only) */
    const shadows = v => !v || v === "none" ? [] : v.split(/,(?![^(]*\))/).map(x => x.trim()).filter(x => /inset/.test(x)).map(x => {
      const c = x.match(/rgba?\([^)]*\)|color\([^)]*\)/), px = x.replace(c ? c[0] : "", "").match(/-?[\d.]+px/g) || [];
      return {col: c ? hx(rgb(c[0])) : null, y: parseFloat(px[1] || 0)};
    });
    const snap = () => {
      const o = {};
      for (const [k, e] of Object.entries(cards)) {
        const sr = e.shadowRoot, lc = sr.querySelector(".lc"), face = lc.querySelector(":scope > .face"), pad = sr.querySelector(".paddle");
        const lcs = getComputedStyle(lc), slab = rgb(lcs.getPropertyValue("--slab")), dim = rgb(lcs.getPropertyValue("--dim")), fg = rgb(lcs.getPropertyValue("--fg"));
        const x = {cls: lc.className, pw: !!sr.querySelector(".pw"), bands: !!sr.querySelector(".bands"), pad: !!pad, pct: (sr.querySelector(".pct") || {}).textContent,
          lc: hx(rgb(lcs.getPropertyValue("--lc"))), slab: hx(slab)};
        if (pad) {
          const top = pad.querySelector(".pd-on"), bot = pad.querySelector(".pd-off"), ps = getComputedStyle(pad), tap = sr.querySelector(".tap"), bs = sr.querySelector(".bs");
          const pr = pad.getBoundingClientRect(), fr = face.getBoundingClientRect(), tr = tap.getBoundingClientRect(), tps = getComputedStyle(tap);
          const textRight = Math.max(...[...tap.querySelectorAll(".nm, .sub, .pct")].map(n => n.getBoundingClientRect().right));
          const half = n => {
            const cs = getComputedStyle(n), shape = n.querySelector("svg > *"), svg = shape && shape.ownerSVGElement;
            const sb = svg ? svg.getBoundingClientRect() : {width: 0}, k = sb.width / 24, ss = shape ? getComputedStyle(shape) : null, bg = rgb(cs.backgroundColor);
            return {bg: cs.backgroundColor === "rgba(0, 0, 0, 0)" ? "transparent" : hx(bg), bgRgb: bg, sym: shape ? shape.localName : null, symFill: ss && ss.fill,
              symCol: ss ? rgb(ss.stroke) : null, symW: +sb.width.toFixed(1), symSw: ss ? +(parseFloat(ss.strokeWidth) * k).toFixed(2) : 0,
              symVis: ss ? ss.visibility : "", shadows: shadows(cs.boxShadow)};
          };
          x.top = half(top); x.bot = half(bot);
          x.label = pad.getAttribute("aria-label"); x.title = pad.title; x.pressed = pad.getAttribute("aria-pressed"); x.disabled = pad.disabled;
          x.text = pad.textContent.trim(); x.svgs = pad.querySelectorAll("svg").length;
          x.rim = {col: hx(rgb(ps.borderTopColor)), style: ps.borderTopStyle, w: ps.borderTopWidth};
          x.inFace = pr.left >= fr.left && pr.right <= fr.right + .5 && pr.top >= fr.top && pr.bottom <= fr.bottom + .5;
          x.clear = textRight <= pr.left + .5 && tr.right - parseFloat(tps.paddingRight) <= pr.left + .5;
          x.stripClear = !bs || getComputedStyle(bs).display === "none" || bs.getBoundingClientRect().right <= pr.left + .5;
          x.faceIsSlab = same(rgb(getComputedStyle(face).backgroundColor), slab);
          x.w = Math.round(pr.width);
          const pressedH = x.pressed === "true" ? x.top : x.pressed === "false" ? x.bot : null, raisedH = x.pressed === "true" ? x.bot : x.pressed === "false" ? x.top : null;
          if (pressedH && raisedH) {
            x.halvesCr = cr(pressedH.bgRgb, raisedH.bgRgb); x.pressedDarker = lum(pressedH.bgRgb) < lum(raisedH.bgRgb);
            x.symCr = Math.min(cr(x.top.symCol, x.top.bgRgb), cr(x.bot.symCol, x.bot.bgRgb));
          }
          x.dimSyms = same(x.top.symCol, dim) && same(x.bot.symCol, dim); x.fgSyms = same(x.top.symCol, fg) && same(x.bot.symCol, fg);
        }
        o[k] = x;
      }
      return o;
    };
    const out = {};
    const page0 = [...document.querySelectorAll("#view jam-light")].filter(e => e.shadowRoot && e.shadowRoot.querySelector(".lc"));
    out.defaults = {n: page0.length, pw: page0.every(e => !!e.shadowRoot.querySelector(".pw")), pad: page0.some(e => !!e.shadowRoot.querySelector(".paddle"))};
    await rehass(true); out.posterDark = snap();
    de.classList.add("light"); await rehass(false); out.posterLight = snap();
    de.dataset.look = "braun"; await rehass(false); await tick(250); out.braunLight = snap();
    de.classList.remove("light"); await rehass(true); await tick(150); out.braunDark = snap();
    delete de.dataset.look; await rehass(true);
    // Motion: a real change rocks the paddle once; JamCards.motion = false: no rock.
    const flip = async state => { h.states["light.pd_flip"] = {...h.states["light.pd_flip"], state, last_updated: String(Math.random())}; await rehass(dark);
      const p = cards.flip.shadowRoot.querySelector(".paddle"), cs = getComputedStyle(p);
      return {cls: [...p.classList].filter(c => /^rock/.test(c)).join(" "), anim: cs.animationName, dur: parseFloat(cs.animationDuration) * (/ms$/.test(cs.animationDuration) ? 1 : 1000)}; };
    const flipNow = async state => { h.states["light.pd_flip"] = {...h.states["light.pd_flip"], state, last_updated: String(Math.random())};
      const nh = {...h, states: {...h.states}, themes: h.themes}; cards.flip.hass = nh;
      const p = cards.flip.shadowRoot.querySelector(".paddle"), cs = getComputedStyle(p);
      return {cls: [...p.classList].filter(c => /^rock/.test(c)).join(" "), anim: cs.animationName, dur: parseFloat(cs.animationDuration) * (/ms$/.test(cs.animationDuration) ? 1 : 1000)}; };
    out.rockOn = await flipNow("on"); await tick(400); out.rockOff = await flipNow("off"); await tick(400);
    J.motion = false; out.rockNone = await flipNow("on"); J.motion = true; await tick(100);
    // Presses: the paddle toggles, never the pop-up.
    const n0 = window.__calls.length;
    cards.warm.shadowRoot.querySelector(".paddle").click(); cards.off.shadowRoot.querySelector(".paddle").click();
    cards.dead.shadowRoot.querySelector(".paddle").click();
    await tick(60);
    out.calls = window.__calls.slice(n0).map(c => `${c.domain}.${c.service} ${c.data && c.data.entity_id}`);
    out.sheets = document.querySelectorAll(".jam-sheet-host").length;
    box.remove(); probe.remove();
    for (const k of Object.keys(S)) delete h.states[k];
    Object.assign(h.states, saved);
    h.themes = {...h.themes};
    return out;
  });
  check(r.defaults.n >= 3 && r.defaults.pw && !r.defaults.pad, `paddle: default jam-light configs keep the power corner (${r.defaults.n} preview cards, no paddle)`);
  for (const [tag, o] of [["poster dark", r.posterDark], ["poster light", r.posterLight], ["braun light", r.braunLight], ["braun dark", r.braunDark]]) {
    const live = ["warm", "blue", "off", "grp", "koff", "kon"], all = [...live, "dead"];
    check(live.every(k => o[k].pad && !o[k].pw && o[k].inFace && o[k].clear && o[k].stripClear && o[k].faceIsSlab && !/\b(on|off|plate)\b/.test(o[k].cls)) && !o.grp.bands,
      `paddle ${tag}: a rocker instead of the corner, inside the face, right of the text and strip, the face stays the panel (pon/poff, no plate, no bands)` +
      ` ${JSON.stringify(Object.fromEntries(live.map(k => [k, [o[k].inFace, o[k].clear, o[k].stripClear, o[k].faceIsSlab]])))}`);
    check(o.warm.label === "Warm lamp power, On" && o.warm.title === "On" && o.warm.pressed === "true" && o.off.label === "Kitchen lamp power, Off" && o.off.title === "Off" &&
      o.off.pressed === "false" && o.dead.label === "Stove lights power, Offline" && o.dead.title === "Offline",
      `paddle ${tag}: aria-label "<name> power, On|Off|Offline" + title, aria-pressed = state (${o.warm.label} / ${o.off.label} / ${o.dead.label})`);
    check(all.every(k => o[k].text === "" && o[k].svgs === 2 && o[k].top.sym === "line" && o[k].bot.sym === "circle" && o[k].bot.symFill === "none") &&
      live.every(k => o[k].fgSyms) &&
      ["warm", "off"].every(k => o[k].top.symW === o.warm.top.symW && o[k].bot.symW === o.warm.bot.symW && o[k].top.symSw === o.warm.top.symSw && o[k].bot.symSw === o.warm.bot.symSw),
      `paddle ${tag}: no visible words, the IEC symbols as SVG (top line, bottom circle without fill) in --fg, the same size, stroke and colour on and off (${o.warm.top.symW}px / ${o.warm.top.symSw}px)`);
    // The same rocker flipped: on.top = off.bottom (pressed), on.bottom = off.top (raised), the same rim.
    check(o.warm.top.bg === o.off.bot.bg && o.warm.bot.bg === o.off.top.bg && o.warm.top.bg !== o.warm.bot.bg && o.warm.rim.col === o.off.rim.col &&
      o.warm.rim.style === "solid" && o.koff.top.bg === o.kon.bot.bg,
      `paddle ${tag}: ON and OFF are the same rocker flipped (pressed ${o.warm.top.bg}, raised ${o.warm.bot.bg}; off: ${o.off.top.bg} / ${o.off.bot.bg}; rim ${o.warm.rim.col} = ${o.off.rim.col})`);
    const st = ["warm", "blue", "off", "grp", "koff", "kon"];
    check(st.every(k => o[k].pressedDarker && o[k].halvesCr >= 3 && o[k].symCr >= 3),
      `paddle ${tag}: the pressed half is the darker tone, the halves >= 3:1 apart, each symbol >= 3:1 on its half ` +
      JSON.stringify(Object.fromEntries(st.map(k => [k, [o[k].halvesCr, o[k].symCr]]))));
    const edge = (sh, y) => sh.some(s => s.y === y && s.col !== null);
    check(edge(o.off.top.shadows, -3) && edge(o.warm.bot.shadows, 3) && edge(o.koff.top.shadows, -4) && edge(o.kon.bot.shadows, 4) &&
      !o.off.bot.shadows.length,
      `paddle ${tag}: the raised half has a thin shading edge on its pivot side (3px; kiosk 4px), the pressed O half none ` +
      JSON.stringify({offTop: o.off.top.shadows, onBot: o.warm.bot.shadows}));
    const lampBand = (x, y) => x.top.shadows.some(s => s.y === y && s.col === x.lc);
    const noLamp = x => ![...x.top.shadows, ...x.bot.shadows].some(s => s.col === x.lc);
    check(lampBand(o.warm, 3) && lampBand(o.blue, 3) && lampBand(o.kon, 5) && noLamp(o.off) && noLamp(o.koff) && o.warm.top.bg === o.blue.top.bg,
      `paddle ${tag}: the lamp's colour only as a thin band on the pressed I half while on (3px; kiosk 5px), the tones themselves don't change with the lamp ` +
      JSON.stringify({warm: o.warm.top.shadows, lc: o.warm.lc}));
    check(o.dead.pad && o.dead.disabled && o.dead.rim.style === "dashed" && o.dead.top.bg === "transparent" && o.dead.bot.bg === "transparent" && o.dead.dimSyms &&
      o.dead.top.symVis === "visible" && o.dead.pct === "Offline" && o.off.pct === "Off" && o.koff.pct === "Off",
      `paddle ${tag}: offline = the same rocker, dashed rim, nothing pressed, dim symbols, "Offline" on the card; off = "Off" on the card ("${o.off.pct}", "${o.dead.pct}")`);
    check(o.kon.w === 96 && o.warm.w === 64 && o.kon.top.symW >= 30 && o.kon.bot.symSw >= 4.5 && o.warm.bot.symSw >= 3,
      `paddle ${tag}: 64px rocker with 18px symbols (>= 3px strokes), size kiosk 96px with >= 30px symbols (>= 4.5px) (${o.warm.top.symW}/${o.warm.bot.symSw}px, ${o.kon.top.symW}/${o.kon.bot.symSw}px)`);
  }
  check(r.rockOn.cls === "rock-on" && /jam-pd-rock-on/.test(r.rockOn.anim) && r.rockOn.dur > 0 && r.rockOn.dur <= 300 && r.rockOff.cls === "rock-off" &&
    /jam-pd-rock-off/.test(r.rockOff.anim) && r.rockNone.cls === "",
    `paddle: a real change rocks the paddle once (<= 300 ms), towards the new pressed half; none with JamCards.motion = false (${JSON.stringify([r.rockOn, r.rockOff, r.rockNone])})`);
  check(r.calls.length === 2 && r.calls[0] === "light.turn_off light.pd_warm" && r.calls[1] === "light.turn_on light.pd_off" && r.sheets === 0,
    `paddle: a press toggles the light (offline does nothing) and opens no pop-up (${r.calls.join("; ")}; sheets ${r.sheets})`);
};
