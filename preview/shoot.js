// Screenshots, layout + generic checks for preview/index.html; per-fixture interaction checks live in preview/checks/*.js. Run: pw-node preview/shoot.js  (exit 0 = all checks passed)
// Jam Cards 1.0.0: one look, Hi-Fi. Per mode (dark / light) x width (390 / 1280): the Hi-Fi fonts (Jost bundled, IBM Plex Mono
// + Jost 300 from the asset base, no other font host), every card carries data-look=hifi, papers fit their boxes, Hi-Fi's
// edges (no cut corners: every paper's clip is none), text contrast (preview/contrast.js) at 1280; on dark / 1280 the core API
// checks and every behaviour check in preview/checks/; then the built-in palette page (?theme=none: no Hi-Fi theme, the cards
// draw Hi-Fi Night from their own values), text fit + kiosk screens (preview/fit.js) and the contact sheet
// preview/shots/cards.html (one row per preview item, dark + light at 1280; crops in preview/shots/cards/).
// Writes preview/shots/{dark,light}-{390,1280}.png (fixed clock). JAM_SHOTS=<dir>: extra review shots (some checks + the
// fixed-clock screensaver set). JAM_BASELINE=<dir>: pixel diff of every shot against <dir> (JAM_BASELINE_WRITE=1 writes it).
const http = require("http");
const fs = require("fs");
const path = require("path");
const {chromium} = require("playwright");
const {execFileSync} = require("child_process");
const {pathToFileURL} = require("url");

const ROOT = path.join(__dirname, "..");
execFileSync(process.execPath, [path.join(ROOT, "tools", "bundle.mjs")], {stdio: "inherit"}); // dist/jam-cards.js + fixtures/index.js are generated
const TYPES = {".html": "text/html", ".js": "text/javascript", ".png": "image/png", ".css": "text/css"};
let failures = 0;
const check = (cond, what) => { console.log((cond ? "PASS " : "FAIL ") + what); if (!cond) failures++; };

/* Deterministic shots: the page clock is fixed (Playwright clock.setFixedTime: Date is frozen, timers keep running), so
   clocks, relative times and graph histories render the same in every run and a pixel diff (below) means a real change.
   The checks run on a normal page; only screenshots use these. */
const FIXED_TIME = new Date("2026-10-28T14:41:00-07:00");
async function fixedPage(browser, url, viewport) {
  const p = await browser.newPage({viewport});
  await p.clock.setFixedTime(FIXED_TIME);
  await p.goto(url);
  await p.waitForFunction(() => window.__ready);
  await p.evaluate(() => document.fonts.ready);
  return p;
}
/* <preview/shots>/{mode}-{width}.png (full page, fixed clock). */
const SHOTS = path.join(__dirname, "shots");
async function fixedShot(browser, base, mode, width) {
  const p = await fixedPage(browser, base + `?mode=${mode}`, {width, height: 900});
  try {
    await p.waitForTimeout(1500); // layout + view entrance settle
    await p.screenshot({path: path.join(SHOTS, `${mode}-${width}.png`), fullPage: true});
  } finally { await p.close(); }
}
/* Contact sheet: every top-level preview item (#view > *: a card or a section), dark and light at 1280 on a fixed clock,
   cropped to preview/shots/cards/{dark,light}/NN.png; preview/shots/cards.html = one row per item. */
async function contactSheet(browser, base) {
  const rows = [];
  for (const mode of ["dark", "light"]) {
    const dir = path.join(SHOTS, "cards", mode);
    fs.rmSync(dir, {recursive: true, force: true}); fs.mkdirSync(dir, {recursive: true});
    const p = await fixedPage(browser, base + `?mode=${mode}`, {width: 1280, height: 900});
    try {
      await p.waitForTimeout(1500);
      const items = await p.evaluate(() => [...document.querySelectorAll("#view > *")].map(e => {
        const first = e.localName.startsWith("jam-") ? e : e.querySelector("[class], *");
        const cfg = (first && first._config) || {}, c = e.localName.startsWith("jam-") ? e : first;
        return `${c ? c.localName : e.localName}${cfg.title ? " · " + cfg.title : cfg.name ? " · " + cfg.name : ""}${e.localName.startsWith("jam-") ? "" : ` (+${e.children.length - 1})`}`;
      }));
      for (let i = 0; i < items.length; i++) {
        const name = String(i + 1).padStart(2, "0") + ".png";
        await p.locator("#view > *").nth(i).screenshot({path: path.join(dir, name)});
        (rows[i] = rows[i] || {label: items[i], cells: {}}).cells[mode] = `cards/${mode}/${name}`;
      }
    } finally { await p.close(); }
  }
  const esc = s => String(s).replace(/[&<>"]/g, c => ({"&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;"})[c]);
  const html = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Jam Cards Hi-Fi</title><style>body{margin:0;padding:16px;background:#10141d;color:#ece5d3;font:14px/1.4 system-ui,sans-serif}
table{border-collapse:collapse}th,td{border:1px solid #2a3244;padding:6px;vertical-align:top;text-align:left}th{position:sticky;top:0;background:#161c28}
td img{display:block;max-width:560px;height:auto}.l{color:#a29d8f;max-width:160px}</style></head><body>
<h1>Jam Cards · Hi-Fi</h1><p>GENERATED by preview/shoot.js: one row per preview item (1280 px, fixed clock), Night and Day.</p>
<table><thead><tr><th>item</th><th>dark</th><th>light</th></tr></thead><tbody>
${rows.map((r, i) => `<tr><td class="l">${i + 1}. ${esc(r.label)}</td>${["dark", "light"].map(m => `<td>${r.cells[m] ? `<img loading="lazy" src="${r.cells[m]}" alt="">` : ""}</td>`).join("")}</tr>`).join("\n")}
</tbody></table></body></html>
`;
  fs.writeFileSync(path.join(SHOTS, "cards.html"), html);
  return rows.length;
}
/* With JAM_SHOTS=<dir>: the jam-screensaver poster in all 6 layouts (with the now block) and the photos view, at the
   Echo Show 8 size, dark + light, on a fixed clock: <dir>/screensaver-fixed-{mode}-{l0..l5,photos}-961.png. The
   preview/shots screensaver shots follow the wall clock (layout seeded per minute), so these are the ones to diff. */
async function fixedScreensaver(browser, base, dir) {
  for (const mode of ["dark", "light"]) {
    const p = await fixedPage(browser, `${base}?view=none&mode=${mode}`, {width: 961, height: 601});
    try {
      await p.evaluate(async () => {
        const st = (id, state, attributes = {}) => ({entity_id: id, state, attributes, last_changed: "x", last_updated: "x"});
        const h = window.__hass;
        Object.assign(h.states, {"media_player.fx_speaker": st("media_player.fx_speaker", "playing",
          {friendly_name: "Living Room Speakers", media_title: "Lobby", media_artist: "AERwave"})});
        const e = document.createElement("jam-screensaver");
        e.setConfig({type: "custom:jam-screensaver", idle_seconds: 3600, weather_entity: "weather.bungalo_weather", kicker: "The Bungalow · living room",
          accent: "living", images: {index: "fixtures/slides/index.json", interval: 3600, fade: 0},
          now: [{type: "media", entity: "media_player.fx_speaker", states: ["playing"]}]});
        e.hass = {...h}; document.body.append(e); window.__fx = e; e._show();
      });
      await p.waitForTimeout(400);
      for (let n = 0; n < 6; n++) {
        await p.evaluate(n => { const o = window.__fx.overlay; o.dataset.view = "poster";
          o.querySelector(".poster").className = "poster l" + n + " " + ["", "r", "", "c", "", "r"][n]; }, n);
        await p.waitForTimeout(300);
        await p.screenshot({path: path.join(dir, `screensaver-fixed-${mode}-l${n}-961.png`)});
      }
      await p.evaluate(() => { window.__fx.overlay.dataset.view = "images"; });
      await p.waitForFunction(() => [...window.__fx.overlay.querySelectorAll("img.cur")].some(i => i.complete && i.naturalWidth > 0), null, {timeout: 5000}).catch(() => {});
      await p.waitForTimeout(300);
      await p.screenshot({path: path.join(dir, `screensaver-fixed-${mode}-photos-961.png`)});
    } finally { await p.close(); }
  }
}

/* Pixel diff (theming plan §3): JAM_BASELINE=<dir> compares every PNG this run wrote (preview/shots/, plus JAM_SHOTS when
   set) with the file of the same name in <dir>, decoded and compared in a blank page (canvas getImageData, no deps). One
   check per file: identical, or the count + bounding box of differing pixels. JAM_BASELINE_WRITE=1 copies the shots into
   <dir> instead (make the baseline on the commit before a refactor, then run again after it). Files only in one side are
   listed, not failed. Not failed either, but reported: preview/shots/screensaver-* (wall clock: time + layout seeded per
   minute; the JAM_SHOTS screensaver-fixed-* set is the one to compare), and differences of at most 2 per channel
   (anti-aliasing noise: a sheet shot taken while the compositor still settles shifts a cut edge by ±1-2 in some runs of
   the same code). */
async function pixelDiff(browser, dir) {
  const dirs = [path.join(__dirname, "shots"), process.env.JAM_SHOTS].filter(Boolean);
  const files = new Map(); // relative name (R9: <look>/x.png, cards/<look>/NN.png) -> path
  const pngs = (d, rel = "") => fs.existsSync(d) ? fs.readdirSync(d, {withFileTypes: true}).flatMap(e =>
    e.isDirectory() ? pngs(path.join(d, e.name), rel + e.name + "/") : e.name.endsWith(".png") ? [[rel + e.name, path.join(d, e.name)]] : []) : [];
  const other = () => false;
  for (const d of dirs) for (const [f, p] of pngs(d)) files.set(f, p);
  fs.mkdirSync(dir, {recursive: true});
  if (process.env.JAM_BASELINE_WRITE) {
    for (const [f, p] of files) { fs.mkdirSync(path.dirname(path.join(dir, f)), {recursive: true}); fs.copyFileSync(p, path.join(dir, f)); }
    console.log(`baseline: wrote ${files.size} PNGs to ${dir}`);
    return;
  }
  const page = await browser.newPage();
  try {
    const only = pngs(dir).map(([f]) => f).filter(f => !files.has(f) && !other(f));
    if (only.length) console.log("baseline only (not written this run): " + only.join(", "));
    for (const [f, p] of [...files].sort()) {
      const b = path.join(dir, f);
      if (!fs.existsSync(b)) { console.log("new shot (no baseline): " + f); continue; }
      const r = await page.evaluate(async ([x, y]) => {
        const img = async s => { const bm = await createImageBitmap(await (await fetch("data:image/png;base64," + s)).blob());
          const c = new OffscreenCanvas(bm.width, bm.height), g = c.getContext("2d"); g.drawImage(bm, 0, 0);
          return {w: bm.width, h: bm.height, d: g.getImageData(0, 0, bm.width, bm.height).data}; };
        const A = await img(x), B = await img(y);
        if (A.w !== B.w || A.h !== B.h) return {size: `${A.w}x${A.h} vs baseline ${B.w}x${B.h}`};
        let n = 0, max = 0, x0 = Infinity, y0 = Infinity, x1 = -1, y1 = -1;
        for (let i = 0; i < A.d.length; i += 4) {
          if (A.d[i] === B.d[i] && A.d[i + 1] === B.d[i + 1] && A.d[i + 2] === B.d[i + 2] && A.d[i + 3] === B.d[i + 3]) continue;
          for (let c = 0; c < 4; c++) max = Math.max(max, Math.abs(A.d[i + c] - B.d[i + c]));
          n++; const px = (i >> 2) % A.w, py = Math.floor((i >> 2) / A.w);
          x0 = Math.min(x0, px); y0 = Math.min(y0, py); x1 = Math.max(x1, px); y1 = Math.max(y1, py);
        }
        return {n, max, w: A.w, h: A.h, box: n ? `${x0},${y0} to ${x1},${y1}` : ""};
      }, [fs.readFileSync(p).toString("base64"), fs.readFileSync(b).toString("base64")]);
      const what = r.size ? "size " + r.size : r.n ? `${r.n} pixels differ by up to ${r.max} (${r.box}) of ${r.w}x${r.h}` : `identical (${r.w}x${r.h})`;
      if (!r.size && r.n && /^screensaver-(?!fixed-)/.test(f)) console.log(`INFO pixel diff ${f}: ${what} (wall clock, not compared)`);
      else if (!r.size && r.n && r.max <= 2) console.log(`INFO pixel diff ${f}: ${what} (anti-aliasing noise, not failed)`);
      else check(!r.size && r.n === 0, `pixel diff ${f}: ` + what);
    }
  } finally { await page.close(); }
}

const server = http.createServer((req, res) => {
  const p = path.join(ROOT, decodeURIComponent(new URL(req.url, "http://x").pathname));
  if (!p.startsWith(ROOT) || !fs.existsSync(p) || fs.statSync(p).isDirectory()) { res.writeHead(404); res.end(); return; }
  res.writeHead(200, {"content-type": TYPES[path.extname(p)] || "application/octet-stream"});
  fs.createReadStream(p).pipe(res);
});

(async () => {
  await new Promise(r => server.listen(0, "127.0.0.1", r));
  const base = `http://127.0.0.1:${server.address().port}/preview/index.html`;
  fs.mkdirSync(SHOTS, {recursive: true});
  const browser = await chromium.launch();
  const errors = [], fontRequests = [];
  try {
    // JAM_FAST=1 (iteration): only the dark/1280 page and its behaviour checks (no shots, no fit, no contact sheet).
    const FAST = !!process.env.JAM_FAST;
    for (const mode of ["dark", "light"]) for (const width of [390, 1280]) {
      if (FAST && (mode !== "dark" || width !== 1280)) continue;
      const T = `${mode}/${width}`;
      const page = await browser.newPage({viewport: {width, height: 900}});
      page.on("pageerror", e => errors.push(`${T}: ${e.message}`));
      page.on("request", r => { if (/fonts\.(googleapis|gstatic)\.com/.test(r.url())) fontRequests.push(r.url()); });
      await page.goto(base + `?mode=${mode}`);
      await page.waitForFunction(() => window.__ready);
      await page.evaluate(() => document.fonts.ready);
      await page.waitForTimeout(1500); // layout settles
      // Fonts: Jost 400-600 bundled (one data: face), the Hi-Fi pack's IBM Plex Mono + Jost 300 from <asset base>fonts/.
      const fonts = await page.evaluate(async () => {
        const J = window.JamCards, pack = J.lookPack("hifi"), want = pack ? pack.fonts : [];
        await Promise.all(['400 1em "Jost"', '600 1em "Jost"', '500 1em "IBM Plex Mono"'].map(f => document.fonts.load(f)));
        await document.fonts.ready;
        const loaded = want.map(f => [...document.fonts].some(x => x.family.replace(/"/g, "") === f.family && x.status === "loaded"));
        const got = performance.getEntriesByType("resource").map(e => e.name).filter(n => /\.woff2(\?|$)/.test(n));
        const faces = [...document.fonts].filter(f => f.status === "loaded").map(f => f.family.replace(/"/g, "") + " " + f.weight);
        return {pack: !!pack, families: [...new Set(want.map(f => f.family))], loaded, jost: faces.includes("Jost 400 600"),
          plex: want.filter(f => f.family === "IBM Plex Mono").every(f => got.includes(J.ASSET_BASE + "fonts/" + f.file)),
          foreign: got.filter(n => !n.startsWith(J.ASSET_BASE + "fonts/")), looks: [...new Set([...document.querySelectorAll("#view > *, #view .sec > *")].filter(c => c._config).map(c => c.dataset.look))],
          londrina: faces.some(f => /Londrina/.test(f)), styles: document.head.querySelectorAll("style[data-jam-fonts]").length, links: document.querySelectorAll('link[href*="fonts.googleapis"]').length};
      });
      check(fonts.looks.length === 1 && fonts.looks[0] === "hifi", `${T}: every card carries data-look=hifi (${fonts.looks.join(",")})`);
      check(fonts.pack && fonts.jost && fonts.plex && fonts.loaded.every(Boolean) && !fonts.londrina && fonts.foreign.length === 0 && fonts.styles === 1 && fonts.links === 0,
        `${T}: Jost bundled, ${fonts.families.join(" + ")} loaded from the asset base fonts/, no Londrina, one font style, no other font host` + (fonts.foreign.length ? " — " + fonts.foreign.join(", ") : ""));
      if (!FAST) await fixedShot(browser, base, mode, width); // the shot itself comes from a page with a fixed clock (pixel diff)
      // Layout: every card's paper stays inside the card box; no face overflows sideways.
      const layout = await page.evaluate(() => {
        const bad = [];
        for (const card of document.querySelectorAll("#view [class], #view jam-heading, #view jam-hero, #view jam-tile, #view jam-choice, #view jam-slider, #view jam-media, #view jam-speaker")) {
          if (!card.shadowRoot) continue;
          const host = card.getBoundingClientRect(), p = card.shadowRoot.querySelector(".host > .paper");
          if (p) { const r = p.getBoundingClientRect(); if (r.right > host.right + 0.5 || r.bottom > host.bottom + 0.5) bad.push(card.localName + " paper outside box"); }
          for (const f of card.shadowRoot.querySelectorAll(".face")) if (f.scrollWidth > f.clientWidth + 1) bad.push(card.localName + " face overflows: " + f.textContent.slice(0, 30));
        }
        return [...new Set(bad)];
      });
      check(layout.length === 0, `${T}: papers fit their boxes` + (layout.length ? " — " + layout.join("; ") : ""));
      // Hi-Fi edges: soft corners, no cuts. Every paper's computed clip is its kind token (none), never inline; no element
      // keeps a polygon clip-path (a cut corner) anywhere in the cards.
      const edges = await page.evaluate(() => {
        const J = window.JamCards, roots = [];
        const walk = r => { roots.push(r); for (const e of r.querySelectorAll("*")) if (e.shadowRoot) walk(e.shadowRoot); };
        walk(document);
        const bad = [], kinds = {};
        let papers = 0, shadows = 0;
        for (const r of roots) {
          shadows += r.querySelectorAll(".shadow").length;
          for (const p of r.querySelectorAll(".paper")) {
            papers++;
            const k = p.dataset.cut, inline = p.style.getPropertyValue("--clip").trim(), clip = getComputedStyle(p).getPropertyValue("--clip").trim();
            kinds[k] = (kinds[k] || 0) + 1;
            if (inline && J.CUTS[k]) bad.push(`${k}: inline --clip ${inline}`); // arrow / disc keys (jam-remote's d-pad) set theirs inline; their faces are unclipped by the skin
            if (J.CUTS[k] && clip !== "none") bad.push(`${k}: --clip ${clip}`);
          }
          for (const e of r.querySelectorAll("*")) {
            const cp = getComputedStyle(e).clipPath;
            // a glyph drawn as a clipped shape (jam-remote's d-pad .tri arrows) is a symbol, not a cut corner
            if (cp && cp.startsWith("polygon(") && e.getClientRects().length && !e.classList.contains("tri")) bad.push(`${e.localName}.${String(e.className).replace(/\s+/g, ".")} clip ${cp.slice(0, 40)}`);
          }
        }
        return {bad: [...new Set(bad)], kinds, papers, shadows};
      });
      check(edges.papers > 30 && edges.bad.length === 0, `${T}: ${edges.papers} surfaces, no cut corners (every paper's clip = none, no polygon clips) ${JSON.stringify(edges.kinds)}` +
        (edges.bad.length ? " — " + edges.bad.slice(0, 5).join("; ") + (edges.bad.length > 5 ? ` (+${edges.bad.length - 5})` : "") : ""));
      check(edges.shadows === 0, `${T}: no shadow slab elements (${edges.shadows})`);
      if (width === 1280) {
        // Text contrast per mode: >= 4.5:1, large text >= 3:1, DOM background walk (preview/contrast.js).
        const ct = await require("./contrast.js")(page);
        check(ct.texts > 200 && ct.findings.length === 0, `${T}: text contrast >= 4.5:1 (large >= 3:1) for ${ct.texts} texts (${ct.approx} over images skipped)` +
          (ct.findings.length ? " — " + ct.findings.slice(0, 5).map(f => `${f.card} ${f.el} "${f.text}" ${f.ratio}:1 ${f.fg} on ${f.bg} ${f.font}`).join("; ") + (ct.findings.length > 5 ? ` (+${ct.findings.length - 5})` : "") : ""));
      }
      if (mode === "dark" && width === 1280) {
        const core = await page.evaluate(() => {
          const J = window.JamCards;
          const want = {ochre: "ochre", teal: "teal", blue: "blue", pink: "pink", violet: "violet", green: "green", red: "red",
            living: "living", kitchen: "teal", master: "blue", marissa: "pink", music: "violet", nerd: "green", alert: "red", ink: "ink", paper: "paper"};
          const names = Object.entries(want).every(([a, n]) => J.accentVar(a) === `var(--${n})`) && J.accentVar("Kitchen") === "var(--teal)" && J.accentVar("nope") === null;
          return {names, version: J.VERSION, looks: J.looks().join(","), look: J.LOOK,
            api: ["seed", "rng", "tornPath", "paper", "cutKey", "cutPath", "accentName", "accentVar", "accentFg", "setAccent", "armBars", "icon", "bindActions", "runAction", "lookOf", "motif", "registerLook", "lookPack"].every(k => typeof J[k] === "function")};
        });
        check(core.names, "accent names + room aliases resolve (living→living, kitchen→teal, master→blue, marissa→pink, music→violet, nerd→green, alert→red)");
        check(core.api && core.version === "1.0.0" && core.looks === "hifi" && core.look === "hifi", `window.JamCards exports the helper API (version ${core.version}, looks ${core.looks}, default ${core.look})`);
        const helpers = {
          tile: name => page.locator("jam-tile").filter({hasText: name}),
          callsNow: () => page.evaluate(() => window.__calls),
        };
        // JAM_CHECKS=<regex> runs only the matching check files (iteration). A check that throws is one FAIL, the run goes on
        // (on a fresh page: a half-done check may leave sheets or scratch cards behind).
        const only = process.env.JAM_CHECKS ? new RegExp(process.env.JAM_CHECKS) : null;
        let cur = page;
        for (const f of fs.readdirSync(path.join(__dirname, "checks")).filter(f => f.endsWith(".js") && (!only || only.test(f))).sort()) {
          try { await require(path.join(__dirname, "checks", f))(cur, check, helpers); }
          catch (e) {
            check(false, `checks/${f} threw: ${String(e && e.message || e).split("\n")[0].slice(0, 200)}`);
            await cur.close().catch(() => {});
            cur = await browser.newPage({viewport: {width, height: 900}});
            cur.on("pageerror", e => errors.push(`${T}: ${e.message}`));
            await cur.goto(base + `?mode=${mode}`); await cur.waitForFunction(() => window.__ready); await cur.waitForTimeout(800);
            helpers.tile = name => cur.locator("jam-tile").filter({hasText: name});
            helpers.callsNow = () => cur.evaluate(() => window.__calls);
          }
        }
        if (cur !== page) await cur.close();
      }
      await page.close();
    }
    if (!FAST) {
    // Without the Hi-Fi theme (HA's default theme, or a stale theme of a removed look): the cards carry data-jam-builtin and
    // draw the Hi-Fi Night palette from their own values, a sheet copies it, a page theme of another look id changes nothing.
    {
      const p = await browser.newPage({viewport: {width: 1280, height: 900}});
      try {
        p.on("pageerror", e => errors.push(`theme=none: ${e.message}`));
        await p.goto(base + "?theme=none");
        await p.waitForFunction(() => window.__ready);
        await p.waitForTimeout(600);
        const r = await p.evaluate(async () => {
          const cards = [...document.querySelectorAll("#view > *, #view .sec > *")].filter(c => c._config);
          const val = (e, t) => getComputedStyle(e).getPropertyValue(t).trim();
          const c = document.querySelector("#view jam-light"), out = {n: cards.length, builtin: cards.filter(x => x.hasAttribute("data-jam-builtin")).length,
            look: [...new Set(cards.map(x => x.dataset.look))].join(","), slab: val(c, "--jam-slab"), ground: val(c, "--jam-ground"), groove: val(c, "--jam-groove"), display: val(c, "--jam-display")};
          // a stale Poster theme on the page: still Hi-Fi Night on the cards
          document.documentElement.style.cssText = "--jam-look:poster;--jam-slab:#1f1c19;--jam-display:'Londrina Solid'";
          await new Promise(r => setTimeout(r, 120));
          out.staleSlab = val(c, "--jam-slab"); out.staleDisplay = val(c, "--jam-display"); out.staleBuiltin = c.hasAttribute("data-jam-builtin");
          // the Hi-Fi theme arrives (as HA applies it): the cards follow the theme again
          document.documentElement.style.cssText = "--jam-look:hifi;--jam-slab:#123456";
          await new Promise(r => setTimeout(r, 120));
          out.themedSlab = val(c, "--jam-slab"); out.themedBuiltin = c.hasAttribute("data-jam-builtin");
          document.documentElement.style.cssText = "";
          return out;
        });
        check(r.n > 20 && r.builtin === r.n && r.look === "hifi" && r.slab === "#161c28" && r.ground === "#10141d" && r.groove === "#0a0e15" && /^"Jost"/.test(r.display),
          `no theme: every card (${r.builtin}/${r.n}) draws the built-in Hi-Fi Night palette (slab ${r.slab}, ground ${r.ground}, groove ${r.groove}), Jost, data-look ${r.look}`);
        check(r.staleBuiltin && r.staleSlab === "#161c28" && /^"Jost"/.test(r.staleDisplay) && !r.themedBuiltin && r.themedSlab === "#123456",
          `a stale theme (--jam-look: poster) keeps Hi-Fi Night (${r.staleSlab}, ${r.staleDisplay.split(",")[0]}); the Hi-Fi theme is followed again (${r.themedSlab})`);
        await p.screenshot({path: path.join(SHOTS, "builtin-dark-1280.png"), fullPage: false});
      } finally { await p.close(); }
    }
    if (process.env.JAM_SHOTS) await fixedScreensaver(browser, base, process.env.JAM_SHOTS);
    // Text fit + kiosk screens (preview/fit.js; JAM_NO_FIT=1 skips it).
    if (!process.env.JAM_NO_FIT) await require("./fit.js")(browser, base, check, {dir: process.env.JAM_SHOTS});
    if (!process.env.JAM_NO_CONTACT) {
      const n = await contactSheet(browser, base);
      check(n > 10, `contact sheet preview/shots/cards.html: ${n} items, dark + light`);
    }
    if (process.env.JAM_BASELINE) await pixelDiff(browser, process.env.JAM_BASELINE);
    }
    check(fontRequests.length === 0, "no requests to fonts.googleapis.com / fonts.gstatic.com" + (fontRequests.length ? ": " + fontRequests.slice(0, 3).join(", ") : ""));
    check(errors.length === 0, "no page errors" + (errors.length ? ": " + errors.join("; ") : ""));
  } finally { await browser.close(); server.close(); }
  process.exit(failures ? 1 : 0);
})();
