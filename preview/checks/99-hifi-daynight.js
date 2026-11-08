// Single-mode themes follow their palette, not the device (1.0.1). Isaac: the two kiosks (iPad living room, Echo kitchen)
// switch between Hi-Fi Day and Hi-Fi Night around sunrise / sunset: an HA automation sets the backend default theme
// (frontend.set_theme, mode light and dark) to "Hi-Fi Day" or "Hi-Fi Night" (themes/jamboard.yaml, no modes), so a device on
// the default theme draws that palette whatever its own dark setting. The cards decide day / night from the theme's
// --jam-mode token (core jamMode), never from hass.themes.darkMode or prefers-color-scheme.
// Fresh pages of preview/index.html with ?theme=<single-mode theme> (applied inline on <html> as HA does) and the device
// set the other way round: "Hi-Fi Day" with hass.themes.darkMode = true and a dark OS scheme, "Hi-Fi Night" with darkMode =
// false and a light OS scheme. Per state (the page with every card, a light pop-up, the jam-popup card, the jam-kiosk home
// and a dock sheet, the screensaver) across every shadow root (sheets and the screensaver layer included):
//   - every card / body layer carries the theme's --jam-mode and --jam-slab, none is data-jam-builtin;
//   - no visible background, text, border or SVG fill / stroke uses a colour of the OTHER palette (its surfaces, text, lines,
//     hues: the values the theme itself does not also hold);
//   - Hi-Fi's night marks follow the theme: [data-n] (night bodies, pop-ups, kiosk) only under Night, every rocker toned
//     from the palette has data-pd = day / night (the light pop-up's rockers at least);
//   - text contrast (preview/contrast.js) passes.
// Then the sunrise / sunset switch in place: the Day page gets the Night theme (as HA re-applies the default theme) and a new
// hass.themes; the cards redraw in Night with no Day colour left.
// Contract: module.exports = async (page, check) => {}.
const fs = require("fs");
const path = require("path");
const contrast = require("../contrast.js");
/* Colours the Hi-Fi pack writes as literals (the same in Day and Night: person tags, the ink number on the cream fader cap,
   white): not palette choices, so they never count as the other palette's colour. */
const FIXED = [...new Set([...fs.readFileSync(path.join(__dirname, "..", "..", "src", "looks", "hifi.js"), "utf8").matchAll(/#([\da-f]{6}|[\da-f]{3})\b(?![\da-f])/gi)]
  .map(m => "#" + (m[1].length === 3 ? [...m[1]].map(c => c + c).join("") : m[1]).toLowerCase()))];
/* Contrast findings that are not about day / night (they show under the Hi-Fi theme with modes too), reported as INFO.
   Empty since 1.1.0: the jam-popup kicker in the living accent (#6b4428, 2.18:1 on the Night ground) was the one entry; every
   kicker is dim text now (the accent is a mark beside it), so a finding there fails like any other. */
const KNOWN = [];

/* In-page audit: [theme name, the other theme's name, "day" | "night"] -> {n, cards, bad, wrong, nightMarks, rockers}. */
function audit([name, otherName, want, fixed]) {
  const T = window.jamPreviewThemes, P = T[name], O = T[otherName];
  const hex6 = v => { const m = /^#([\da-f]{6})$/i.exec(String(v).trim()); return m ? "#" + m[1].toLowerCase() : null; };
  const mine = new Set([...Object.values(P).map(hex6).filter(Boolean), ...fixed]);
  const KEYS = ["jam-ink", "jam-slab", "jam-slab2", "jam-slab3", "jam-paper", "jam-paper-fg", "jam-paper-dim", "jam-fg", "jam-dim", "jam-line",
    "jam-ground", "jam-hair", "jam-groove", "jam-cap", "jam-band", "jam-band-fg", "jam-band-dim", "jam-band-key", "jam-band-off", "jam-band-tile",
    "jam-plate", "jam-plate-fg", "jam-ink-fg", "jam-ink-dim", "jam-switch-off", "jam-switch-thumb", "jam-win", "jam-win-off", "jam-readout",
    "jam-readout-off", "jam-dot", "jam-ochre", "jam-teal", "jam-blue", "jam-violet", "jam-green", "jam-pink", "jam-alert-text", "jam-focus"];
  const wrong = new Map();
  for (const k of KEYS) { const v = hex6(O[k]); if (v && !mine.has(v)) wrong.set(v, k); }
  const cv = document.createElement("canvas").getContext("2d", {willReadFrequently: true});
  const toHex = s => { // computed colour -> #rrggbb, or null when transparent / none
    if (!s || s === "none" || /^rgba\([^)]*,\s*0\)$/.test(s) || s === "transparent") return null;
    const m = /^rgba?\(\s*([\d.]+)[,\s]+([\d.]+)[,\s]+([\d.]+)/.exec(s);
    if (m) return "#" + [m[1], m[2], m[3]].map(x => Math.round(+x).toString(16).padStart(2, "0")).join("");
    cv.fillStyle = "#000"; cv.fillStyle = s; return hex6(cv.fillStyle);
  };
  const roots = [];
  const walk = r => { roots.push(r); for (const e of r.querySelectorAll("*")) if (e.shadowRoot) walk(e.shadowRoot); };
  walk(document);
  const where = e => { let x = e, c = ""; while (x) { if (x.localName && x.localName.startsWith("jam-")) c = x.localName;
    if (x.classList && (x.classList.contains("jam-sheet-host") || x.classList.contains("jam-screensaver-layer"))) return (c ? c + " in " : "") + x.className.split(" ")[0];
    x = x.parentElement || (x.parentNode && x.parentNode.host); } return c || "page"; };
  const bad = [];
  let n = 0;
  for (const r of roots) for (const e of r.querySelectorAll("*")) {
    if (!e.getClientRects().length || (e.checkVisibility && !e.checkVisibility({opacityProperty: true, visibilityProperty: true}))) continue;
    const cs = getComputedStyle(e), seen = [];
    seen.push(["background", cs.backgroundColor]);
    if ([...e.childNodes].some(t => t.nodeType === 3 && t.textContent.trim())) seen.push(["text", cs.color]);
    if (parseFloat(cs.borderTopWidth) > 0 && cs.borderTopStyle !== "none") seen.push(["border", cs.borderTopColor]);
    if (e instanceof SVGElement && !(e instanceof SVGSVGElement)) { seen.push(["fill", cs.fill]); seen.push(["stroke", cs.stroke]); }
    n++;
    for (const [what, v] of seen) {
      const h = toHex(v);
      if (h && wrong.has(h)) bad.push(`${where(e)} ${e.localName}.${String(e.className && e.className.baseVal !== undefined ? e.className.baseVal : e.className).trim().split(/\s+/)[0] || ""} ${what} ${h} (${otherName} ${wrong.get(h)})`);
    }
  }
  // cards + body layers carry the theme's tokens
  const val = (e, t) => getComputedStyle(e).getPropertyValue(t).trim().replace(/^["']|["']$/g, "");
  const layers = roots.flatMap(r => [...r.querySelectorAll("*")]).filter(e => (e.localName.startsWith("jam-") && e._config) || e.classList.contains("jam-sheet-host") || e.classList.contains("jam-screensaver-layer"));
  const cards = layers.filter(e => e.hasAttribute("data-jam-builtin") || val(e, "--jam-mode") !== want || val(e, "--jam-slab").toLowerCase() !== P["jam-slab"].toLowerCase())
    .map(e => `${e.localName}.${e.className.split(" ")[0]} builtin=${e.hasAttribute("data-jam-builtin")} mode=${val(e, "--jam-mode")} slab=${val(e, "--jam-slab")}`);
  let nightMarks = 0;
  const rockers = {};
  for (const r of roots) {
    // Hi-Fi's night mark is a bare attribute (toggleAttribute); jam-graph's data-n="<points>" is something else
    for (const e of r.querySelectorAll("[data-n]")) if (e.getAttribute("data-n") === "" && (e.getClientRects().length || /\bpop\b/.test(e.className))) nightMarks++;
    // every rocker's day / night (1.1.0: its tones are CSS, data-pd picks the night one; a card drawn before it was in the
    // page draws again once attached, so none keeps a guessed mode)
    for (const e of r.querySelectorAll("[data-pd]")) rockers[e.dataset.pd] = (rockers[e.dataset.pd] || 0) + 1;
  }
  return {n, layers: layers.length, cards, bad: [...new Set(bad)], wrong: wrong.size, nightMarks, rockers, html: val(document.documentElement, "--jam-mode")};
}

module.exports = async (page, check) => {
  const base = page.url().replace(/\?.*$/, ""), browser = page.context().browser();
  const RUNS = [
    {name: "Hi-Fi Day", other: "Hi-Fi Night", want: "day", dark: 1, scheme: "dark"},
    {name: "Hi-Fi Night", other: "Hi-Fi Day", want: "night", dark: 0, scheme: "light"},
  ];
  // fixture configs from the normal page
  const cfgs = await page.evaluate(() => {
    const all = [...document.querySelectorAll("#view *")].filter(e => e._config && e.localName.startsWith("jam-"));
    const j = e => e && JSON.parse(JSON.stringify(e._config));
    return {kiosk: j(all.find(x => x.localName === "jam-kiosk" && (x._config.dock || []).some(b => (b.cards || []).length)))};
  });
  for (const R of RUNS) {
    const T = `daynight ${R.name} (darkMode ${!!R.dark}, OS ${R.scheme})`;
    const ctx = await browser.newContext({viewport: {width: 1280, height: 900}, colorScheme: R.scheme});
    const errs = [];
    const open = async (q = "") => {
      const p = await ctx.newPage();
      p.on("pageerror", e => errs.push(e.message));
      await p.goto(`${base}?theme=${encodeURIComponent(R.name)}&dark=${R.dark}${q}`);
      await p.waitForFunction(() => window.__ready);
      await p.evaluate(() => document.fonts.ready);
      await p.waitForTimeout(900);
      return p;
    };
    const verify = async (p, label, {marks = true} = {}) => {
      const a = await p.evaluate(audit, [R.name, R.other, R.want, FIXED]);
      const ct = await contrast(p);
      ct.findings = ct.findings.filter(f => { const k = KNOWN.find(k => k.card === f.card && k.text === f.text);
        if (k) console.log(`INFO ${T} ${label}: known contrast finding not about day / night: ${f.card} "${f.text}" ${f.ratio}:1 (${k.why})`); return !k; });
      const nightOk = R.want === "night" ? (!marks || a.nightMarks > 0) : a.nightMarks === 0;
      const rk = Object.keys(a.rockers);
      const rockOk = rk.every(k => k === R.want);
      check(a.html === R.want && a.layers > 0 && a.cards.length === 0 && a.bad.length === 0 && nightOk && rockOk && a.wrong > 10,
        `${T} ${label}: ${a.layers} cards / layers on the ${R.want} palette (--jam-mode, --jam-slab, none built-in), ${a.n} elements with no ${R.other} colour (${a.wrong} checked), ` +
        `night marks ${a.nightMarks}, rockers ${JSON.stringify(a.rockers)}` +
        (a.cards.length ? " — tokens: " + a.cards.slice(0, 4).join("; ") : "") + (a.bad.length ? " — colours: " + a.bad.slice(0, 6).join("; ") + (a.bad.length > 6 ? ` (+${a.bad.length - 6})` : "") : "") +
        (nightOk ? "" : " — night marks wrong") + (rockOk ? "" : " — rocker palette wrong"));
      check(ct.texts >= 5 && ct.findings.length === 0, `${T} ${label}: text contrast for ${ct.texts} texts` +
        (ct.findings.length ? " — " + ct.findings.slice(0, 4).map(f => `${f.card} "${f.text}" ${f.ratio}:1 ${f.fg} on ${f.bg}`).join("; ") : ""));
      return a;
    };
    try {
      // the page with every card; the device disagrees with the theme
      const p = await open();
      const env = await p.evaluate(() => ({dark: window.__hass.themes.darkMode, os: matchMedia("(prefers-color-scheme: dark)").matches, theme: window.__hass.themes.theme}));
      check(env.dark === !!R.dark && env.os === (R.scheme === "dark") && env.theme === R.name, `${T}: setup (darkMode ${env.dark}, OS dark ${env.os}, default theme ${env.theme})`);
      await verify(p, "page");
      // a light pop-up (Hi-Fi popup: the sheet copies the tokens)
      const opened = await p.evaluate(() => { const l = [...document.querySelectorAll("#view jam-light")].find(x => x._hass && x.shadowRoot.querySelector('[aria-label*="open light controls"]'));
        const b = l && l.shadowRoot.querySelector('[aria-label*="open light controls"]'); if (b) b.click(); return !!b; });
      await p.waitForTimeout(600);
      check(opened, `${T}: a light pop-up opens`);
      if (opened) { const a = await verify(p, "light pop-up");
        check(a.rockers[R.want] > 0, `${T} light pop-up: rockers drawn in the ${R.want} tones (${JSON.stringify(a.rockers)})`); }
      await p.keyboard.press("Escape"); await p.waitForTimeout(300);
      // the jam-popup card (#livingroom-popup)
      await p.evaluate(() => { location.hash = "#livingroom-popup"; });
      await p.waitForTimeout(900);
      const pop = await p.evaluate(() => { const c = document.querySelector("#view jam-popup"); const o = c && c.shadowRoot.querySelector(".pop"); return !!(o && o.classList.contains("open")); });
      check(pop, `${T}: the jam-popup card opens`);
      if (pop) await verify(p, "jam-popup", {marks: false});
      await p.evaluate(() => { history.replaceState(null, "", location.pathname + location.search); window.dispatchEvent(new Event("location-changed")); window.dispatchEvent(new HashChangeEvent("hashchange")); });
      await p.waitForTimeout(400);
      // sunrise / sunset in place: HA applies the other single-mode theme on <html> and pushes new hass.themes
      if (R.want === "day") {
        await p.evaluate(other => {
          const th = window.jamPreviewThemes[other], de = document.documentElement;
          for (const [k, v] of Object.entries(th)) de.style.setProperty("--" + k, v);
          const h = window.__hass;
          h.themes = {...h.themes, default_theme: other, theme: other};
          for (const e of document.querySelectorAll("#view *")) if (e._config && e.localName.startsWith("jam-")) e.hass = {...h};
        }, R.other);
        await p.waitForTimeout(900);
        const b = await p.evaluate(audit, [R.other, R.name, "night", FIXED]);
        check(b.html === "night" && b.cards.length === 0 && b.bad.length === 0 && b.nightMarks > 0 && Object.keys(b.rockers).every(k => k === "night"),
          `${T}: switched to ${R.other} in place, the cards redraw in night (${b.layers} cards, night marks ${b.nightMarks}, rockers ${JSON.stringify(b.rockers)})` +
          (b.cards.length ? " — tokens: " + b.cards.slice(0, 4).join("; ") : "") + (b.bad.length ? " — colours: " + b.bad.slice(0, 6).join("; ") : ""));
      }
      await p.close();
      // jam-kiosk home + a dock sheet
      if (cfgs.kiosk) {
        const k = await open("&view=none");
        await k.evaluate(cfg => { const e = document.createElement("jam-kiosk"); e.setConfig(cfg); e.hass = window.__hass; document.body.append(e); }, cfgs.kiosk);
        await k.waitForTimeout(700);
        await verify(k, "kiosk home");
        const ok = await k.evaluate(() => { const b = document.querySelector("jam-kiosk").shadowRoot.querySelector(".c-kt .c-open"); if (b) b.click(); return !!b; });
        await k.waitForTimeout(1000);
        check(ok, `${T}: a kiosk dock sheet opens`);
        if (ok) await verify(k, "kiosk dock sheet");
        await k.close();
      } else check(false, `${T}: preview fixture jam-kiosk with a dock sheet`);
      // the screensaver
      const s = await open("&view=none");
      await s.evaluate(() => {
        const h = window.__hass, st = (id, state, attributes = {}) => ({entity_id: id, state, attributes, last_changed: "x", last_updated: "x"});
        h.states["media_player.fx_speaker"] = st("media_player.fx_speaker", "playing", {friendly_name: "Living Room Speakers", media_title: "Lobby", media_artist: "AERwave"});
        const e = document.createElement("jam-screensaver");
        e.setConfig({type: "custom:jam-screensaver", idle_seconds: 3600, weather_entity: "weather.bungalo_weather", kicker: "The Bungalow · living room",
          accent: "living", now: [{type: "media", entity: "media_player.fx_speaker", states: ["playing"]}]});
        e.hass = {...h}; document.body.append(e); window.__fx = e; e._show();
      });
      await s.waitForTimeout(600);
      const ss = await s.evaluate(() => !!(window.__fx._layer && window.__fx._layer.isConnected && window.__fx.overlay));
      check(ss, `${T}: the screensaver layer is up`);
      for (let n = 0; n < 6 && ss; n += 3) {
        await s.evaluate(n => { const o = window.__fx.overlay; o.dataset.view = "poster"; o.querySelector(".poster").className = "poster l" + n; }, n);
        await s.waitForTimeout(300);
        await verify(s, `screensaver l${n}`, {marks: false});
      }
      await s.close();
      check(errs.length === 0, `${T}: no page errors` + (errs.length ? " — " + errs.slice(0, 3).join("; ") : ""));
    } finally { await ctx.close(); }
  }
};
