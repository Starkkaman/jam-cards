// Braun colour revision (docs/looks/BRAUN.md "Revision 2026-11-03: more colour"): on the dark/1280 preview page, switched
// to the braun look (dark, then light) and back to Poster: a lit jam-light face is a flat tint of the light's colour over
// the panel (~24% dark, ~18% light; an off light stays the plain panel), the on toggle is olive #6f8f3a, jam-heading's
// rule is a 4px room-colour rule on top, kiosk dock blocks carry a ~15% room tint (a "none" block stays plain), an on
// shuffle / favourite key, the active tab and the current TV source are ET66 yellow #e8b12a, list / tile switch keys that are on are olive.
// The page is left as it was. No fixture. Contract: module.exports = async (page, check, helpers) => {}.
module.exports = async (page, check) => {
  const r = await page.evaluate(async () => {
    const h = window.__hass, de = document.documentElement;
    const tick = (ms = 60) => new Promise(res => setTimeout(res, ms));
    const deep = () => { const out = []; const walk = n => { for (const e of n.querySelectorAll("*")) { if (e._config && e.localName.startsWith("jam-")) out.push(e); if (e.shadowRoot) walk(e.shadowRoot); } }; walk(document); return out; };
    const theme = async dark => { const nh = {...h, themes: {...h.themes, darkMode: dark}}; for (const c of deep()) c.hass = nh; await tick(); };
    // Any computed colour (rgb() or color(srgb ...)) -> [r, g, b] in 0-255.
    const probe = document.createElement("i"); document.body.append(probe);
    const rgb = v => { probe.style.color = ""; probe.style.color = v; const s = getComputedStyle(probe).color, n = s.match(/[\d.]+/g).map(Number);
      return s.startsWith("color(") ? n.slice(0, 3).map(x => Math.round(x * 255)) : n.slice(0, 3); };
    const hex = c => "#" + c.map(x => x.toString(16).padStart(2, "0")).join("");
    const ratio = (face, col, base) => { const d = [0, 1, 2].map(i => col[i] - base[i]), k = d.reduce((m, x, i) => Math.abs(x) > Math.abs(d[m]) ? i : m, 0);
      return d[k] ? (face[k] - base[k]) / d[k] : -1; };
    const all = () => deep();
    const snap = () => {
      const o = {};
      const lights = all().filter(c => c.localName === "jam-light" && c.shadowRoot.querySelector(".lc"));
      const lit = lights.map(c => c.shadowRoot.querySelector(".lc.on")).find(Boolean), off = lights.map(c => c.shadowRoot.querySelector(".lc.off")).find(Boolean);
      if (lit) {
        const f = lit.querySelector(":scope > .face"), cs = getComputedStyle(lit), fs = getComputedStyle(f);
        const lc = rgb(cs.getPropertyValue("--lc")), slab = rgb(cs.getPropertyValue("--slab")), face = rgb(fs.backgroundColor);
        o.tint = +ratio(face, lc, slab).toFixed(2);
        const pw = lit.querySelector(".pw[aria-pressed=true]");
        o.toggle = pw ? hex(rgb(getComputedStyle(pw, "::before").backgroundColor)) : "none";
      }
      if (off) { const f = off.querySelector(":scope > .face"); o.offPlain = hex(rgb(getComputedStyle(f).backgroundColor)) === hex(rgb(getComputedStyle(off).getPropertyValue("--slab"))); }
      const hd = all().find(c => c.localName === "jam-heading"), rule = hd && hd.shadowRoot.querySelector(".h > .rule");
      if (rule) { const rs = getComputedStyle(rule); o.rule = {h: rs.height, top: rule.getBoundingClientRect().top <= rule.parentNode.querySelector(".row").getBoundingClientRect().top}; }
      const k = all().find(c => c.localName === "jam-kiosk");
      if (k) {
        const blks = [...k.shadowRoot.querySelectorAll(".blk")];
        const col = blks.find(b => !b.classList.contains("none")), none = blks.find(b => b.classList.contains("none"));
        if (col) { const cs = getComputedStyle(col); o.dock = +ratio(rgb(cs.backgroundColor), rgb(cs.getPropertyValue("--bc") || cs.getPropertyValue("--acc")), rgb(cs.getPropertyValue("--slab"))).toFixed(2); }
        if (none) o.dockNone = hex(rgb(getComputedStyle(none).backgroundColor)) === hex(rgb(getComputedStyle(none).getPropertyValue("--slab")));
      }
      const face = sel => { for (const c of all()) { const e = c.shadowRoot.querySelector(sel); if (e) return hex(rgb(getComputedStyle(e).backgroundColor)); } return "none"; };
      o.shuffle = face(".shuf.on > .face");
      o.tab = face(".tab.on");
      o.source = face(".tile.cur > .face"); // tabs / source tiles may not be on the page: "none"
      o.sw = face(".key.sw.on > .face");
      return o;
    };
    const out = {};
    de.dataset.look = "braun";
    await theme(true); await tick(200);
    out.dark = snap();
    de.classList.add("light"); await theme(false); await tick(200);
    out.light = snap();
    de.classList.remove("light"); delete de.dataset.look;
    await theme(true);
    probe.remove();
    h.themes = {...h.themes};
    return out;
  });
  const near = (v, want) => typeof v === "number" && Math.abs(v - want) <= .03;
  for (const m of ["dark", "light"]) {
    const o = r[m], want = m === "dark" ? .24 : .18;
    check(near(o.tint, want) && o.offPlain === true, `braun colour (${m}): a lit jam-light face = ${Math.round(want * 100)}% of its light colour over the panel (got ${o.tint}), an off light the plain panel (${o.offPlain})`);
    check(o.toggle === "#6f8f3a", `braun colour (${m}): the on toggle is olive #6f8f3a (${o.toggle})`);
    check(!!o.rule && o.rule.h === "4px" && o.rule.top, `braun colour (${m}): jam-heading rule 4px on top of the title (${JSON.stringify(o.rule)})`);
    check(near(o.dock, .15) && o.dockNone === true, `braun colour (${m}): kiosk dock block = 15% room tint (${o.dock}), a "none" block plain (${o.dockNone})`);
    check(o.shuffle === "#e8b12a" && [o.tab, o.source].every(v => ["#e8b12a", "none"].includes(v)), `braun colour (${m}): shuffle on (+ an active tab, the current TV source when shown) are ET66 yellow (${o.shuffle}, ${o.tab}, ${o.source})`);
    check(o.sw === "#6f8f3a", `braun colour (${m}): an on switch key is olive (${o.sw})`);
  }
};
