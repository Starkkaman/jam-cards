// Brutal (docs/looks/BRUTAL.md "Built", review fixes 2026-11-04): on the dark/1280 preview page, switched to the brutal look
// (light, its primary mode) and back to Poster. Stub for the jam-kiosk dock state: the check writes data-state="on|off|action"
// on the dock blocks itself (jam-kiosk writes it once that change is merged) and reads the pack's answer: on = the room fill,
// latched down 4px with the 2px shadow; off = a white slab; action = an outlined slab on the page ground. Also the one tactile
// grammar (an on key stays down), the play key filled only while playing, power keys as white slabs, the pill switch (on =
// black track, off = white track with a hollow knob), the heading sticker and the d-pad's drop-shadow border. JAM_SHOTS=<dir>
// also writes brutal-dock-states.png. The page is left as it was. No fixture. Contract: module.exports = async (page, check) => {}.
const path = require("path");
module.exports = async (page, check) => {
  const r = await page.evaluate(async () => {
    const h = window.__hass, de = document.documentElement;
    const tick = (ms = 60) => new Promise(res => setTimeout(res, ms));
    const deep = () => { const out = []; const walk = n => { for (const e of n.querySelectorAll("*")) { if (e._config && e.localName.startsWith("jam-")) out.push(e); if (e.shadowRoot) walk(e.shadowRoot); } }; walk(document); return out; };
    const theme = async dark => { const nh = {...h, themes: {...h.themes, darkMode: dark}}; for (const c of deep()) c.hass = nh; await tick(); };
    const probe = document.createElement("i"); document.body.append(probe);
    const rgb = v => { probe.style.color = ""; probe.style.color = v; return getComputedStyle(probe).color; };
    const find = sel => { for (const c of deep()) { const e = c.shadowRoot.querySelector(sel); if (e) return e; } return null; };
    de.dataset.look = "brutal"; de.classList.add("light");
    await theme(false); await tick(250);
    const o = {};
    const k = deep().find(c => c.localName === "jam-kiosk");
    const blks = k ? [...k.shadowRoot.querySelectorAll(".dock .blk")] : [];
    const states = ["on", "off", "on", "off", "action"];
    blks.forEach((b, i) => b.setAttribute("data-state", states[i % states.length]));
    await tick(80);
    o.dock = blks.map(b => { const cs = getComputedStyle(b);
      return {st: b.dataset.state, none: b.classList.contains("none"), bg: cs.backgroundColor, bc: rgb(cs.getPropertyValue("--bc").trim() || cs.getPropertyValue("--acc").trim()),
        slab: rgb(cs.getPropertyValue("--slab").trim()), tf: cs.transform, sh: cs.boxShadow}; });
    if (k) k.scrollIntoView({block: "center"});
    o.kioskRect = k ? (r => [r.left, r.top, r.width, r.height])(k.getBoundingClientRect()) : null;
    // one tactile grammar: an on key is down; a playing play key is filled + down, a paused one a white slab
    const on = find(".key.on:not([data-key=play_pause]):not(:disabled) > .face");
    o.onKey = on ? getComputedStyle(on).transform : "none";
    const keys = deep().flatMap(c => [...c.shadowRoot.querySelectorAll('[data-key="play_pause"]:not(:disabled)')]);
    o.play = keys.map(x => ({p: x.dataset.bruPlay, label: (x.getAttribute("aria-label") || x.textContent).trim(), bg: getComputedStyle(x.querySelector(".face")).backgroundColor}));
    o.slab = rgb("var(--jam-slab)");
    const pw = find('.pw[aria-pressed="true"]:not(.paper)'), pwOff = find('.pw[aria-pressed="false"]:not(.paper):not(:disabled)');
    o.sw = pw && pwOff ? {onTrack: getComputedStyle(pw, "::before").backgroundColor, offTrack: getComputedStyle(pwOff, "::before").backgroundColor,
      offKnob: getComputedStyle(pwOff, "::after").backgroundColor, line: rgb("var(--jam-line)")} : null;
    const h2 = find("h2.disp"), rule = find(".h > .rule");
    o.heading = h2 ? {bg: getComputedStyle(h2).backgroundColor, rule: rule ? getComputedStyle(rule).display : "none"} : null;
    const arm = find('.pad > .paper[data-cut="arrow"]');
    o.pad = arm ? getComputedStyle(arm).filter : "none";
    o.power = (find(".key.turnon > .face") || find('.key[data-key="power"].alert > .face'));
    o.power = o.power ? getComputedStyle(o.power).backgroundColor : "none";
    probe.remove();
    return o;
  });
  if (process.env.JAM_SHOTS && r.kioskRect) {
    const [x, y, w, hh] = r.kioskRect;
    await page.screenshot({path: path.join(process.env.JAM_SHOTS, "brutal-dock-states.png"), clip: {x: Math.max(0, x - 8), y: Math.max(0, y - 8), width: w + 16, height: hh + 16}});
  }
  await page.evaluate(async () => {
    const h = window.__hass, de = document.documentElement;
    const deep = () => { const out = []; const walk = n => { for (const e of n.querySelectorAll("*")) { if (e._config && e.localName.startsWith("jam-")) out.push(e); if (e.shadowRoot) walk(e.shadowRoot); } }; walk(document); return out; };
    for (const c of deep()) if (c.localName === "jam-kiosk") c.shadowRoot.querySelectorAll(".dock .blk[data-state]").forEach(b => b.removeAttribute("data-state"));
    de.classList.remove("light"); delete de.dataset.look;
    const nh = {...h, themes: {...h.themes, darkMode: true}}; for (const c of deep()) c.hass = nh;
    await new Promise(res => setTimeout(res, 120));
    h.themes = {...h.themes};
  });
  const d = r.dock, down = "matrix(1, 0, 0, 1, 4, 4)";
  check(d.length >= 3 && d.every(b => b.st === "on" ? b.tf === down && (b.none || b.bg === b.bc) && /2px 2px/.test(b.sh)
      : b.st === "off" ? b.tf === "none" && b.bg === b.slab : b.bg === "rgba(0, 0, 0, 0)" && b.tf === "none"),
    `brutal dock (data-state stub): on = room fill + latched down, off = white slab, action = outlined slab (${JSON.stringify(d.map(b => [b.st, b.bg, b.tf]))})`);
  check(/matrix\(1, 0, 0, 1, [24], [24]\)/.test(r.onKey), `brutal: an on key stays down (${r.onKey})`);
  check(r.play.some(p => p.p === "on") && r.play.some(p => p.p === "off") && r.play.every(p => p.p === "on" ? p.bg !== r.slab : p.bg === r.slab),
    `brutal: the play key is filled only while playing (${JSON.stringify(r.play)})`);
  check(r.sw && r.sw.onTrack === r.sw.line && r.sw.offTrack === r.slab && r.sw.offKnob === "rgba(0, 0, 0, 0)",
    `brutal switch: on = black track, off = white track + hollow knob (${JSON.stringify(r.sw)})`);
  check(r.heading && r.heading.rule === "none" && r.heading.bg !== "rgba(0, 0, 0, 0)", `brutal heading: a colour sticker behind the title, no long rule (${JSON.stringify(r.heading)})`);
  check(/drop-shadow/.test(r.pad) && r.power === r.slab, `brutal: d-pad arms bordered by drop-shadow filters, power keys white slabs (${r.power})`);
};
