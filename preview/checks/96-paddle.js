// jam-light `switch: paddle` (opt-in, Jam Design pass 7 + "give OFF its own clear marking", 2026-11-06): on the dark/1280
// preview page, test cards in a scratch box (no fixture, so every preview shot stays as it was), Poster dark + light, then
// the Braun look dark + light, then back to Poster.
//   - default configs keep the power corner (the preview page's own jam-light cards have .pw and no .paddle);
//   - the paddle is a real button "<name> power" with aria-pressed = the state, inside the face, right of the text and strip;
//   - the face stays the panel (no flood, no label plate, no wash, no member bands) in every mode and in Braun;
//   - ON: light mode = an --fg block with the light's colour legend over a 5px band (kiosk 8px), dark mode = a block in
//     the light's colour; the rim takes the block colour; the ON legend >= 4.5:1 on its block (a dark lamp falls back to
//     the look's light text by day);
//   - OFF: the OFF half carries a --fg frame (2px; kiosk 3px) and a hollow ring (a circle with a 2px border), OFF in --fg
//     >= 4.5:1 on the panel, the frame >= 3:1 on the panel, the ON legend --dim, and the ON half is not a block;
//   - offline: disabled, dashed rim, legends hidden, "Offline" on the card; off: the number slot is empty (OFF said once);
//   - size kiosk: 96px wide paddle, 18px legends;
//   - a paddle press calls light.turn_on / turn_off and never opens the pop-up.
// Contract: module.exports = async (page, check, helpers) => {}.
module.exports = async (page, check) => {
  const r = await page.evaluate(async () => {
    const h = window.__hass, de = document.documentElement;
    const tick = (ms = 80) => new Promise(res => setTimeout(res, ms));
    const st = (id, state, attributes) => ({entity_id: id, state, attributes, last_changed: "x", last_updated: "x"});
    const S = {
      "light.pd_warm": st("light.pd_warm", "on", {friendly_name: "Warm lamp", brightness: 191, color_mode: "color_temp", color_temp_kelvin: 2200,
        supported_color_modes: ["color_temp"], min_color_temp_kelvin: 2000, max_color_temp_kelvin: 6500}),
      "light.pd_blue": st("light.pd_blue", "on", {friendly_name: "TV light", brightness: 60, color_mode: "rgb", rgb_color: [127, 182, 255], hs_color: [214, 50], supported_color_modes: ["rgb"]}),
      "light.pd_deep": st("light.pd_deep", "on", {friendly_name: "Deep blue", brightness: 255, color_mode: "rgb", rgb_color: [0, 0, 255], hs_color: [240, 100], supported_color_modes: ["rgb"]}),
      "light.pd_off": st("light.pd_off", "off", {friendly_name: "Kitchen lamp", supported_color_modes: ["color_temp"]}),
      "light.pd_dead": st("light.pd_dead", "unavailable", {friendly_name: "Stove lights"}),
      "light.pd_m1": st("light.pd_m1", "on", {friendly_name: "Table", brightness: 128, color_mode: "color_temp", color_temp_kelvin: 2700, supported_color_modes: ["color_temp"]}),
      "light.pd_m2": st("light.pd_m2", "off", {friendly_name: "Floor", supported_color_modes: ["color_temp"]}),
      "light.pd_grp": st("light.pd_grp", "on", {friendly_name: "Living room", brightness: 128, entity_id: ["light.pd_m1", "light.pd_m2"], color_mode: "color_temp",
        color_temp_kelvin: 2700, supported_color_modes: ["color_temp"]}),
    };
    const saved = {...h.states};
    Object.assign(h.states, S);
    const box = document.createElement("div");
    box.style.cssText = "position:absolute;left:0;top:0;width:440px;display:grid;grid-template-columns:1fr 1fr;gap:8px;padding:8px;z-index:50";
    const cfgs = [["warm", "light.pd_warm"], ["blue", "light.pd_blue"], ["deep", "light.pd_deep"], ["off", "light.pd_off"], ["dead", "light.pd_dead"],
      ["grp", "light.pd_grp"], ["koff", "light.pd_off", {size: "kiosk"}], ["kon", "light.pd_warm", {size: "kiosk"}]];
    const cards = {};
    for (const [k, id, extra] of cfgs) {
      const e = document.createElement("jam-light");
      e.setConfig({type: "custom:jam-light", entity: id, switch: "paddle", accent: "living", ...(extra || {})});
      if (extra && extra.size) e.style.gridColumn = "1 / -1";
      e.hass = h; box.append(e); cards[k] = e;
    }
    document.body.append(box);
    const rehass = async dark => { const nh = {...h, states: {...h.states}, themes: {...h.themes, darkMode: dark}}; for (const e of Object.values(cards)) e.hass = nh; await tick(150); };
    const probe = document.createElement("i"); document.body.append(probe);
    const rgb = v => { probe.style.color = ""; probe.style.color = v; const s = getComputedStyle(probe).color, n = (s.match(/[\d.]+/g) || [0, 0, 0]).map(Number);
      return s.startsWith("color(") ? n.slice(0, 3).map(x => Math.round(x * 255)) : n.slice(0, 3).map(Math.round); };
    const lum = c => { const l = c.map(v => { v /= 255; return v <= .04045 ? v / 12.92 : ((v + .055) / 1.055) ** 2.4; }); return .2126 * l[0] + .7152 * l[1] + .0722 * l[2]; };
    const cr = (a, b) => { const x = lum(a), y = lum(b); return +((Math.max(x, y) + .05) / (Math.min(x, y) + .05)).toFixed(2); };
    const same = (a, b) => a.every((v, i) => Math.abs(v - b[i]) <= 1);
    const snap = () => {
      const o = {};
      for (const [k, e] of Object.entries(cards)) {
        const sr = e.shadowRoot, lc = sr.querySelector(".lc"), face = lc.querySelector(":scope > .face"), pad = sr.querySelector(".paddle");
        const on = pad && pad.querySelector(".pd-on"), off = pad && pad.querySelector(".pd-off"), tap = sr.querySelector(".tap"), bs = sr.querySelector(".bs");
        const lcs = getComputedStyle(lc), slab = rgb(lcs.getPropertyValue("--slab")), fg = rgb(lcs.getPropertyValue("--fg")), dim = rgb(lcs.getPropertyValue("--dim"));
        const x = {cls: lc.className, pw: !!sr.querySelector(".pw"), bands: !!sr.querySelector(".bands"), pad: !!pad, pct: (sr.querySelector(".pct") || {}).textContent};
        if (pad) {
          const ps = getComputedStyle(pad), os = getComputedStyle(on), fs = getComputedStyle(off), fa = getComputedStyle(off, "::after"), fb = getComputedStyle(off, "::before");
          const pr = pad.getBoundingClientRect(), fr = face.getBoundingClientRect(), tr = tap.getBoundingClientRect(), tps = getComputedStyle(tap);
          const textRight = Math.max(...[...tap.querySelectorAll(".nm, .sub, .pct")].map(n => n.getBoundingClientRect().right));
          x.label = pad.getAttribute("aria-label"); x.pressed = pad.getAttribute("aria-pressed"); x.disabled = pad.disabled;
          x.inFace = pr.left >= fr.left && pr.right <= fr.right + .5 && pr.top >= fr.top && pr.bottom <= fr.bottom + .5;
          x.clear = textRight <= pr.left + .5 && tr.right - parseFloat(tps.paddingRight) <= pr.left + .5;
          x.stripClear = !bs || getComputedStyle(bs).display === "none" || bs.getBoundingClientRect().right <= pr.left + .5;
          x.w = Math.round(pr.width); x.fontPx = parseFloat(os.fontSize);
          x.faceIsSlab = same(rgb(getComputedStyle(face).backgroundColor), slab);
          const block = rgb(os.backgroundColor), legend = rgb(os.color);
          x.onBlock = !same(block, slab) && os.backgroundColor !== "rgba(0, 0, 0, 0)";
          x.blockIsFg = same(block, fg); x.block = block; x.onLegendCr = cr(legend, block); x.legendIsLc = same(legend, rgb(lcs.getPropertyValue("--lc")));
          x.rimIsBlock = same(rgb(ps.borderTopColor), block); x.band = os.boxShadow;
          x.lc = rgb(lcs.getPropertyValue("--lc"));
          x.frame = fa.content !== "none" && fa.content !== "normal" ? {w: parseFloat(fa.borderTopWidth), col: rgb(fa.borderTopColor), style: fa.borderTopStyle} : null;
          x.ring = fb.content !== "none" && fb.content !== "normal" ? {w: parseFloat(fb.borderTopWidth), round: fb.borderTopLeftRadius === "50%" || parseFloat(fb.borderTopLeftRadius) >= parseFloat(fb.width) / 2 - .5, size: parseFloat(fb.width)} : null;
          x.offWordFg = same(rgb(fs.color), fg); x.offWordCr = cr(rgb(fs.color), slab); x.frameCr = x.frame ? cr(x.frame.col, slab) : 0;
          x.onWordDim = same(legend, dim);
          x.dashed = ps.borderTopStyle === "dashed"; x.hidden = getComputedStyle(on).visibility === "hidden" && fs.visibility === "hidden";
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
    const day = tag.endsWith("light");
    const live = ["warm", "blue", "deep", "off", "grp", "koff", "kon"];
    check(live.every(k => o[k].pad && !o[k].pw && o[k].inFace && o[k].clear && o[k].stripClear && o[k].faceIsSlab && !/\b(on|off|plate)\b/.test(o[k].cls)),
      `paddle ${tag}: a paddle instead of the corner, inside the face, right of the text and strip, the face stays the panel (pon/poff, no plate)` +
      ` ${JSON.stringify(Object.fromEntries(live.map(k => [k, [o[k].inFace, o[k].clear, o[k].stripClear, o[k].faceIsSlab, o[k].cls]])))}`);
    check(o.warm.label === "Warm lamp power" && o.warm.pressed === "true" && o.off.pressed === "false" && !o.grp.bands,
      `paddle ${tag}: button "<name> power", aria-pressed = state, no member bands on a group (${o.warm.label}, ${o.warm.pressed}/${o.off.pressed}, bands ${o.grp.bands})`);
    const onK = ["warm", "blue", "deep", "grp", "kon"];
    check(onK.every(k => o[k].onBlock && o[k].rimIsBlock && o[k].onLegendCr >= 4.5 && (day ? o[k].blockIsFg : same3(o[k].block, o[k].lc))),
      `paddle ${tag}: ON = a solid ${day ? "--fg" : "light-colour"} block, rim in its colour, legend >= 4.5:1 ` +
      JSON.stringify(Object.fromEntries(onK.map(k => [k, [o[k].onBlock, o[k].rimIsBlock, o[k].onLegendCr, day ? o[k].blockIsFg : o[k].block.join(",")]]))));
    if (day) check(/inset/.test(o.warm.band) && /-5px/.test(o.warm.band) && /-8px/.test(o.kon.band) && o.warm.legendIsLc && !o.deep.legendIsLc,
      `paddle ${tag}: by day the ON legend is the light's colour over a 5px band (kiosk 8px); a dark lamp falls back to the light text (${o.warm.band} | ${o.kon.band} | deep ${o.deep.onLegendCr}:1)`);
    else check(!/-[1-9]px/.test(o.warm.band), `paddle ${tag}: no band in dark mode (${o.warm.band})`);
    const offK = ["off", "koff"];
    check(offK.every(k => !o[k].onBlock && o[k].frame && o[k].frame.style === "solid" && o[k].ring && o[k].ring.round && o[k].offWordFg && o[k].onWordDim &&
      o[k].offWordCr >= 4.5 && o[k].frameCr >= 3) && o.off.frame.w === 2 && o.koff.frame.w === 3 && o.off.ring.w === 2,
      `paddle ${tag}: OFF = a --fg frame (2px, kiosk 3px) + a hollow ring + OFF in --fg (>= 4.5:1), ON dim, no block ` +
      JSON.stringify(Object.fromEntries(offK.map(k => [k, [o[k].frame, o[k].ring, o[k].offWordCr, o[k].frameCr, o[k].onWordDim]]))));
    check(!o.warm.frame && !o.warm.ring, `paddle ${tag}: the OFF mark shows only while off`);
    check(o.dead.pad && o.dead.disabled && o.dead.dashed && o.dead.hidden && !o.dead.frame && o.dead.pct === "Offline" && o.off.pct === "" && o.koff.pct === "",
      `paddle ${tag}: offline = disabled, dashed rim, no legends, "Offline" on the card; off says OFF once (number slot empty: "${o.off.pct}", "${o.dead.pct}")`);
    check(o.kon.w === 96 && o.kon.fontPx === 18 && o.warm.w === 64 && o.warm.fontPx >= 12, `paddle ${tag}: 64px paddle with >= 12px legends, size kiosk 96px with 18px (${o.warm.w}/${o.warm.fontPx}, ${o.kon.w}/${o.kon.fontPx})`);
  }
  check(r.calls.length === 2 && r.calls[0] === "light.turn_off light.pd_warm" && r.calls[1] === "light.turn_on light.pd_off" && r.sheets === 0,
    `paddle: a press toggles the light (offline does nothing) and opens no pop-up (${r.calls.join("; ")}; sheets ${r.sheets})`);
};
function same3(a, b) { return a.every((v, i) => Math.abs(v - b[i]) <= 1); }
