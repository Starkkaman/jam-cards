// Calm dock sheets lay out any sheet config at any size (0.11.0-calm.4). Bug (Isaac 2026-11-07, live jam-living-room in
// Firefox on a Mac, ~1000x500 CSS px, user look Jam Calm): the TV sheet clipped the TV card at a fixed height and drew the
// NerveOS PC row on top of the source tiles; the Lights sheet put every card in one full-width column, the rocker stretched
// into a giant horizontal bar, the purifier's readout showed an unlit "888". Calm's sheet ignored the block's `columns`,
// clipped its body (overflow hidden) and squeezed kiosk rows to the height left (minmax(0, 1fr)); the PC row kept the kiosk
// host's 420px min-height; the readout had no sensor to show.
// Fresh pages of the Calm dark page (?look=calm), HA's card helpers stood in for (vertical-stack / grid as plain grids, as
// jam-home's preview does), one scratch jam-kiosk shaped like the live jam-living-room one (preview fixture entities):
//   Lights (columns 2: a vertical-stack of heading + scenes + purifier without sensors + an "All lights off" action, and a
//   1-column grid of three lights + a switch button), TV (columns [3, 2]: jam-tv size kiosk with every source + the NerveOS
//   jam-media size kiosk), Music (jam-speaker size kiosk);
// at 1024x768, 961x601, 1000x500, 1440x900, 1920x1080, 390x844, 375x667 and 412x915. Per sheet: no two cards overlap, no card's
// content runs past its card (> 2px), the body scrolls (overflow auto) when its content is taller, the Lights sheet has 2
// columns above 600px and 1 at or below, every rocker is at most 190px wide, the purifier never shows an unlit readout while
// running (a number, or no readout).
// Contract: module.exports = async (page, check) => {}.
module.exports = async (page, check) => {
  const url = page.url().replace(/\?.*$/, "") + "?mode=dark", browser = page.context().browser();
  const VPS = [[1024, 768], [961, 601], [1000, 500], [1440, 900], [1920, 1080], [390, 844], [375, 667], [412, 915]];
  for (const [w, h] of VPS) {
    const p = await browser.newPage({viewport: {width: w, height: h}});
    const errs = [];
    p.on("pageerror", e => errs.push(e.message));
    await p.goto(url);
    await p.waitForFunction(() => window.__ready);
    const setup = await p.evaluate(async () => {
      const H = window.__hass;
      const all = [...document.querySelectorAll("#view *")].filter(e => e._config && e.localName.startsWith("jam-"));
      const cfg = (tag, ok) => { const e = all.find(x => x.localName === tag && ok(x._config)); return e ? JSON.parse(JSON.stringify(e._config)) : null; };
      const tvs = all.filter(x => x.localName === "jam-tv" && (x._config.sources || []).length).map(x => x._config).sort((a, b) => b.sources.length - a.sources.length);
      const tv = tvs[0] && {...JSON.parse(JSON.stringify(tvs[0])), size: "kiosk"};
      const media = cfg("jam-media", c => c.size === "kiosk" && c.title_entity);
      const spk = cfg("jam-speaker", c => c.size === "kiosk");
      const scenes = cfg("jam-scenes", c => c.wrap) || cfg("jam-scenes", () => true);
      const lights = all.filter(x => x.localName === "jam-light" && x._config.entity && H.states[x._config.entity] && !x._config.size).slice(0, 3).map(x => ({type: "custom:jam-light", entity: x._config.entity, name: x._config.name}));
      const sw = Object.keys(H.states).find(id => id.startsWith("switch."));
      const temp = Object.keys(H.states).filter(id => /^sensor\..*(temperature|humidity)/.test(id)).slice(0, 2);
      if (!tv || !media || !spk || !scenes || lights.length < 3 || !sw || !H.states["fan.vital_200s_series"]) return {missing: true};
      // HA's card helpers (createCardElement): jam cards, and vertical-stack / grid as plain grids
      window.loadCardHelpers = async () => ({createCardElement: function make(c) {
        if (String(c.type).startsWith("custom:")) { const e = document.createElement(c.type.slice(7)); e.setConfig(c); e.hass = window.__hass; return e; }
        const d = document.createElement("div"); d.className = "hui-" + c.type;
        d.style.cssText = `display:grid;gap:8px;min-width:0;grid-template-columns:repeat(${c.type === "grid" ? c.columns || 3 : 1},minmax(0,1fr))`;
        for (const k of c.cards || []) d.append(make(k));
        Object.defineProperty(d, "hass", {set(v) { for (const k of d.querySelectorAll("*")) if (k._config) k.hass = v; }});
        return d;
      }});
      const kiosk = {type: "custom:jam-kiosk", inside_entity: temp[0], dock: [
        {name: "Lights", kicker: "Living room", columns: 2, state: {count_on: lights.map(l => l.entity), suffix: "on"}, cards: [
          {type: "vertical-stack", cards: [{type: "custom:jam-heading", title: "Living room", entities: temp}, scenes,
            {type: "custom:jam-fan", entity: "fan.vital_200s_series", name: "Air purifier", presets: false},
            {type: "custom:jam-button", name: "All lights off", tap_action: {action: "perform-action", perform_action: "light.turn_off",
              target: {entity_id: lights.map(l => l.entity)}, confirmation: {text: "Turn off every light in the house?"}}}]},
          {type: "grid", columns: 1, square: false, cards: [...lights, {type: "custom:jam-button", entity: sw, name: "Tree", size: "normal"}]}]},
        {name: "TV", kicker: "Living room", columns: [3, 2], state: {entity: tv.media_player}, cards: [tv, media]},
        {name: "Music", kicker: "Living room", state: {entity: spk.entity}, cards: [spk]}]};
      const k = document.createElement("jam-kiosk"); k.setConfig(kiosk); k.hass = H;
      k.style.cssText = "display:block;width:100%";
      document.getElementById("view").prepend(k);
      await new Promise(r => setTimeout(r, 1000));
      window.__ck = k;
      return {blocks: [...k.shadowRoot.querySelectorAll(".c-kt .c-open")].map(b => b.querySelector(".c-nm").textContent)};
    });
    const tag = `hifi sheets ${w}x${h}`;
    if (setup.missing || !setup.blocks || setup.blocks.length !== 3) { check(false, `${tag}: scratch kiosk (${JSON.stringify(setup)})`); await p.close(); continue; }
    const bad = [], seen = [];
    for (const name of setup.blocks) {
      await p.evaluate(() => { for (let i = 0; i < 3; i++) dispatchEvent(new KeyboardEvent("keydown", {key: "Escape"})); });
      await p.waitForTimeout(150);
      await p.evaluate(n => [...window.__ck.shadowRoot.querySelectorAll(".c-kt .c-open")].find(b => b.textContent.includes(n)).click(), name);
      await p.waitForTimeout(1100);
      const r = await p.evaluate(() => {
        const hs = [...document.querySelectorAll(".jam-sheet-host")], hh = hs[hs.length - 1];
        if (!hh) return null;
        const sr = hh.shadowRoot, body = sr.querySelector(".body"), cards = [];
        const walk = r => { for (const e of r.querySelectorAll("*")) { if (e.localName.startsWith("jam-") && e.shadowRoot) cards.push(e); if (e.shadowRoot) walk(e.shadowRoot); } };
        walk(sr);
        const R = e => e.getBoundingClientRect(), nm = c => c.localName + (c._config && c._config.name ? `("${c._config.name}")` : "");
        const inside = (a, b) => { for (let x = b; x; x = x.parentNode || x.host) if (x === a) return true; return false; };
        const out = [];
        for (let i = 0; i < cards.length; i++) for (let j = i + 1; j < cards.length; j++) {
          if (inside(cards[i], cards[j]) || inside(cards[j], cards[i])) continue;
          const a = R(cards[i]), b = R(cards[j]), ox = Math.min(a.right, b.right) - Math.max(a.left, b.left), oy = Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top);
          if (ox > 1 && oy > 1) out.push(`${nm(cards[i])} overlaps ${nm(cards[j])} ${Math.round(ox)}x${Math.round(oy)}`);
        }
        for (const c of cards) {
          const cr = R(c); let worst = 0, what = "";
          for (const e of c.shadowRoot.querySelectorAll("*")) {
            if (!e.getClientRects().length || getComputedStyle(e).position === "fixed") continue;
            const q = R(e); if (!q.width || !q.height) continue;
            const d = Math.max(q.bottom - cr.bottom, q.right - cr.right, cr.left - q.left, cr.top - q.top);
            if (d > worst) { worst = d; what = e.localName + "." + String(e.className).split(" ")[0]; }
          }
          if (worst > 2) out.push(`content past ${nm(c)} by ${Math.round(worst)}px (${what})`);
        }
        const bs = getComputedStyle(body);
        if (body.scrollHeight > body.clientHeight + 1 && !/auto|scroll/.test(bs.overflowY)) out.push(`body clips ${body.scrollHeight}>${body.clientHeight}`);
        const rk = cards.flatMap(c => [...c.shadowRoot.querySelectorAll(".c-rk")]).map(x => Math.round(R(x).width));
        if (rk.some(x => x > 190.5)) out.push(`rocker ${Math.max(...rk)}px wide (> 190)`);
        const fan = cards.find(c => c.localName === "jam-fan");
        if (fan) { const ro = fan.shadowRoot.querySelector(".c-seg7"), st = window.__hass.states["fan.vital_200s_series"].state;
          if (ro && st === "on" && /^Off$/.test(ro.getAttribute("aria-label") || "")) out.push("purifier running with an unlit readout"); }
        return {n: cards.length, cols: bs.gridTemplateColumns.split(" ").filter(Boolean).length, scrolls: body.scrollHeight > body.clientHeight + 1, out};
      });
      if (!r) { bad.push(`${name}: no sheet`); continue; }
      if (name === "Lights" && r.cols !== (w > 600 ? 2 : 1)) r.out.push(`${r.cols} column(s), want ${w > 600 ? 2 : 1}`);
      seen.push(`${name} ${r.n} cards ${r.cols} col${r.scrolls ? " scrolls" : ""}`);
      for (const f of r.out) bad.push(`${name}: ${f}`);
    }
    check(!bad.length && !errs.length && seen.length === 3, `${tag}: ${seen.join(", ")}` + (bad.length || errs.length ? " — " + [...bad, ...errs].join("; ") : ""));
    await p.close();
  }
};
