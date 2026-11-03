// Screenshots, layout + generic checks for preview/index.html; per-fixture interaction checks live in preview/checks/*.js. Run: pw-node preview/shoot.js  (exit 0 = all checks passed)
// Writes preview/shots/{dark,light}-{390,1280}.png (fixed clock). JAM_SHOTS=<dir>: extra review shots (some checks + the fixed-clock
// screensaver set). JAM_BASELINE=<dir>: pixel diff of every shot against <dir> (JAM_BASELINE_WRITE=1 writes it), see pixelDiff.
// Look matrix (theming plan R9): LOOKS=<id,...> (default: every non-harness look of tokens/, Poster first) runs the page checks
// per look x mode x width; Poster's shots stay in preview/shots/, another look's go to preview/shots/<look>/ (full pages +
// kiosk screens), per-card crops to preview/shots/cards/<look>/ and the contact sheet preview/shots/looks.html (one row per
// preview item, one column per look). Poster-only invariants (bundled Londrina / Jost, the CUTS sizes, the 5px heading rule
// and every behaviour check in preview/checks/) run on Poster dark/1280 only; text contrast (preview/contrast.js) runs per
// look x mode, text fit + kiosk sizes (preview/fit.js) per non-Poster look.
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
/* Query string of a look + mode page; Poster is the page's own default (no look parameter). */
const lookQuery = (look, mode) => `?mode=${mode}${look === "poster" ? "" : "&look=" + look}`;
/* Shot folder of a look: preview/shots/ for Poster (as before R9, so its pixel baselines keep their names), else shots/<look>/. */
const shotDir = look => { const d = path.join(__dirname, "shots", ...(look === "poster" ? [] : [look])); fs.mkdirSync(d, {recursive: true}); return d; };
/* <shot dir of look>/{mode}-{width}.png (full page). */
async function fixedShot(browser, base, look, mode, width) {
  const p = await fixedPage(browser, base + lookQuery(look, mode), {width, height: 900});
  try {
    await p.waitForTimeout(1500); // layout + view entrance settle
    await p.screenshot({path: path.join(shotDir(look), `${mode}-${width}.png`), fullPage: true});
  } finally { await p.close(); }
}
/* Contact sheet (R9): every top-level preview item (#view > *: a card or a section) of every look, dark mode at 1280 on a
   fixed clock, cropped to preview/shots/cards/<look>/NN.png, and preview/shots/looks.html = one row per item, one column per
   look (plus links to each look's full-page and kiosk shots). */
async function contactSheet(browser, base, looks) {
  const root = path.join(__dirname, "shots"), rows = [];
  for (const look of looks) {
    const dir = path.join(root, "cards", look);
    fs.rmSync(dir, {recursive: true, force: true}); fs.mkdirSync(dir, {recursive: true});
    const p = await fixedPage(browser, base + lookQuery(look, "dark"), {width: 1280, height: 900});
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
        (rows[i] = rows[i] || {label: items[i], cells: {}}).cells[look] = `cards/${look}/${name}`;
      }
    } finally { await p.close(); }
  }
  const esc = s => String(s).replace(/[&<>"]/g, c => ({"&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;"})[c]);
  const sub = look => (look === "poster" ? "" : look + "/");
  const link = (look, f) => fs.existsSync(path.join(root, sub(look) + f)) ? `<a href="${sub(look)}${f}">${f.replace(".png", "")}</a>` : "";
  const pages = ["dark-390.png", "dark-1280.png", "light-390.png", "light-1280.png"];
  const kiosk = look => look === "poster" ? ["kiosk-home-dark-1024.png", "kiosk-home-light-961.png", "kiosk-sheet-music-dark-1024.png", "kiosk-sheet-tv-dark-1024.png"]
    : fs.existsSync(path.join(root, look)) ? fs.readdirSync(path.join(root, look)).filter(f => /^(kiosk|screensaver)-/.test(f)).sort() : [];
  const html = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Jam Cards looks</title><style>body{margin:0;padding:16px;background:#141210;color:#ece2c9;font:14px/1.4 system-ui,sans-serif}
table{border-collapse:collapse}th,td{border:1px solid #3a342d;padding:6px;vertical-align:top;text-align:left}th{position:sticky;top:0;background:#1f1c19}
td img{display:block;max-width:420px;height:auto}a{color:#e5a31b;margin-right:8px}.l{white-space:nowrap;color:#9a8f7c;max-width:160px;white-space:normal}</style></head><body>
<h1>Jam Cards looks</h1><p>GENERATED by preview/shoot.js (theming plan R9): one row per preview item (dark, 1280 px, fixed clock), one column per look.</p>
<table><thead><tr><th>item</th>${looks.map(l => `<th>${esc(l)}</th>`).join("")}</tr></thead><tbody>
<tr><td class="l">pages</td>${looks.map(l => `<td>${pages.map(f => link(l, f)).join(" ")}</td>`).join("")}</tr>
<tr><td class="l">kiosk</td>${looks.map(l => `<td>${kiosk(l).map(f => link(l, f)).join(" ")}</td>`).join("")}</tr>
${rows.map((r, i) => `<tr><td class="l">${i + 1}. ${esc(r.label)}</td>${looks.map(l => `<td>${r.cells[l] ? `<img loading="lazy" src="${r.cells[l]}" alt="">` : ""}</td>`).join("")}</tr>`).join("\n")}
</tbody></table></body></html>
`;
  fs.writeFileSync(path.join(root, "looks.html"), html);
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
async function pixelDiff(browser, dir, looks, allLooks) {
  const dirs = [path.join(__dirname, "shots"), process.env.JAM_SHOTS].filter(Boolean);
  const files = new Map(); // relative name (R9: <look>/x.png, cards/<look>/NN.png) -> path
  const pngs = (d, rel = "") => fs.existsSync(d) ? fs.readdirSync(d, {withFileTypes: true}).flatMap(e =>
    e.isDirectory() ? pngs(path.join(d, e.name), rel + e.name + "/") : e.name.endsWith(".png") ? [[rel + e.name, path.join(d, e.name)]] : []) : [];
  // Only the looks of this run: another look's folder (<look>/..., cards/<look>/...) holds shots of an earlier run.
  const other = f => { const m = /^(?:cards\/)?([a-z][a-z0-9-]*)\//.exec(f); return !!m && allLooks.includes(m[1]) && !looks.includes(m[1]); };
  for (const d of dirs) for (const [f, p] of pngs(d)) if (!other(f)) files.set(f, p);
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
  fs.mkdirSync(path.join(__dirname, "shots"), {recursive: true});
  const browser = await chromium.launch();
  const errors = [], fontRequests = [];
  try {
    const {SHOT_LOOKS, LOOKS: ALL_LOOKS} = await import(pathToFileURL(path.join(ROOT, "tokens", "index.mjs")).href);
    const LOOKS = process.env.LOOKS ? process.env.LOOKS.split(",").map(x => x.trim()).filter(Boolean) : SHOT_LOOKS;
    const unknown = LOOKS.filter(l => !ALL_LOOKS.some(x => x.id === l));
    if (unknown.length) throw new Error("LOOKS: unknown look(s) " + unknown.join(", ") + " (tokens/looks/)");
    console.log("looks: " + LOOKS.join(", "));
    /* A draft look (tokens/looks/<id>.mjs draft: true: registered with its fonts, design pending) reports text fit as INFO,
       not FAIL: Poster's type tokens with another face do not fit everywhere, and choosing the look's case / scale is its
       design task. Every other check is hard for it; removing `draft` makes fit hard too. */
    const DRAFTS = ALL_LOOKS.filter(l => l.draft).map(l => l.id);
    const fitCheck = look => !DRAFTS.includes(look) ? check : (ok, what) => console.log((ok ? "PASS " : "INFO (draft look, design pending) ") + what);
    for (const look of LOOKS) for (const mode of ["dark", "light"]) {
      for (const width of [390, 1280]) {
        const T = (look === "poster" ? "" : look + " ") + `${mode}/${width}`; // check label (Poster keeps its pre-R9 labels)
        const page = await browser.newPage({viewport: {width, height: 900}});
        page.on("pageerror", e => errors.push(`${T}: ${e.message}`));
        page.on("request", r => { if (/fonts\.(googleapis|gstatic)\.com/.test(r.url())) fontRequests.push(r.url()); });
        await page.goto(base + lookQuery(look, mode));
        await page.waitForFunction(() => window.__ready);
        await page.evaluate(() => document.fonts.ready);
        await page.waitForTimeout(1500); // layout settles
        if (look === "poster") {
          // Fonts are bundled: both faces load from the data: URIs that core injects once into document.head.
          const fonts = await page.evaluate(async () => {
            await Promise.all(['900 1em "Londrina Solid"', '400 1em "Jost"', '600 1em "Jost"'].map(f => document.fonts.load(f)));
            await document.fonts.ready;
            const faces = [...document.fonts].filter(f => f.status === "loaded").map(f => f.family.replace(/"/g, "") + " " + f.weight);
            return {londrina: document.fonts.check('900 1em "Londrina Solid"'), jost: document.fonts.check('400 1em "Jost"') && document.fonts.check('600 1em "Jost"'),
              styles: document.head.querySelectorAll("style[data-jam-fonts]").length, links: document.querySelectorAll('link[href*="fonts.googleapis"]').length, faces};
          });
          check(fonts.londrina && fonts.jost && fonts.faces.includes("Londrina Solid 900") && fonts.faces.includes("Jost 400 600") && fonts.styles === 1 && fonts.links === 0,
            `${T}: bundled fonts loaded (${fonts.faces.join(", ")}), one font style in head, no Google Fonts link`);
        } else {
          // A look pack's fonts (R6/R8): URL faces on <asset base>fonts/, fetched because the cards use them, from no other host.
          const fonts = await page.evaluate(async look => {
            const J = window.JamCards, pack = J.lookPack(look), want = pack ? pack.fonts : [];
            await document.fonts.ready;
            const loaded = want.map(f => [...document.fonts].some(x => x.family.replace(/"/g, "") === f.family && x.status === "loaded"));
            const got = performance.getEntriesByType("resource").map(e => e.name).filter(n => /\.woff2(\?|$)/.test(n));
            const fam = getComputedStyle(document.querySelector("#view jam-tile").shadowRoot.querySelector(".val")).fontFamily;
            return {pack: !!pack, families: want.map(f => f.family), loaded, fromBase: want.every(f => got.includes(J.ASSET_BASE + "fonts/" + f.file)),
              foreign: got.filter(n => !n.startsWith(J.ASSET_BASE + "fonts/")), fam, looks: [...new Set([...document.querySelectorAll("#view > *, #view .sec > *")].filter(c => c._config).map(c => c.dataset.look))],
              styles: document.head.querySelectorAll("style[data-jam-fonts]").length, links: document.querySelectorAll('link[href*="fonts.googleapis"]').length};
          }, look);
          check(fonts.looks.length === 1 && fonts.looks[0] === look, `${T}: every card carries data-look=${look} (${fonts.looks.join(",")})`);
          check(fonts.loaded.every(Boolean) && fonts.fromBase && fonts.foreign.length === 0 && fonts.styles === 1 && fonts.links === 0 &&
            (!fonts.families.length || fonts.fam.replace(/"/g, "").startsWith(fonts.families[0])),
            `${T}: the look's fonts (${fonts.families.join(", ") || "none"}) loaded from the asset base fonts/, display type in ${fonts.fam.split(",")[0]}, one font style, no other font host` +
            (fonts.foreign.length ? " — " + fonts.foreign.join(", ") : ""));
        }
        await fixedShot(browser, base, look, mode, width); // the shot itself comes from a page with a fixed clock (pixel diff)
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
        fitCheck(look)(layout.length === 0, `${T}: papers fit their boxes` + (layout.length ? " — " + layout.join("; ") : ""));
        // Edge system (every mode/width): straight cuts only, one cut corner per surface fixed by kind, no shadow slabs.
        const edges = await page.evaluate(() => {
          const J = window.JamCards, roots = [];
          const walk = r => { roots.push(r); for (const e of r.querySelectorAll("*")) if (e.shadowRoot) walk(e.shadowRoot); };
          walk(document);
          const pts = cp => { const m = /^polygon\((.*)\)$/.exec(cp); return m ? m[1].split(",").length : -1; };
          const bad = [], kinds = {};
          let papers = 0, shadows = 0;
          for (const r of roots) {
            shadows += r.querySelectorAll(".shadow").length;
            for (const p of r.querySelectorAll(".paper")) {
              papers++;
              const k = p.dataset.cut, inline = p.style.getPropertyValue("--clip").trim(), clip = getComputedStyle(p).getPropertyValue("--clip").trim();
              kinds[k] = (kinds[k] || 0) + 1;
              if (J.CUTS[k]) {
                // R2: the kind's shape comes from CSS (--jam-shape-<kind>, else the Poster cut), never an inline --clip; the
                // computed --clip equals the kind token resolved at the paper (a probe child), and under Poster the cut itself.
                const pr = document.createElement("i"), poster = J.cutPath(...J.CUTS[k]);
                pr.style.setProperty("--probe", `var(--jam-shape-${k},${poster})`); p.append(pr);
                const tok = getComputedStyle(pr).getPropertyValue("--probe").trim(); pr.remove();
                if (inline) bad.push(`${k}: inline --clip ${inline}`);
                if (clip !== tok) bad.push(`${k}: --clip ${clip} is not the kind token ${tok}`);
                if (J.lookOf(p) === "poster" && (clip !== poster || pts(clip) !== 5)) bad.push(`${k}: ${clip}`);
              }
              else if (k === "arrow") { if (pts(clip) !== 5) bad.push("arrow: " + clip); }
              else if (k === "disc") { if (!clip.startsWith("circle(")) bad.push("disc: " + clip); }
              else bad.push(`unknown kind ${k}: ${clip}`);
            }
            for (const e of r.querySelectorAll("*")) {
              const cp = getComputedStyle(e).clipPath;
              if (cp && cp.startsWith("polygon(") && pts(cp) > 5) bad.push(`${e.localName}.${e.className} has ${pts(cp)} points`);
            }
          }
          return {bad, kinds, papers, shadows};
        });
        check(edges.papers > 50 && edges.bad.length === 0,
          `${T}: ${edges.papers} surfaces, every clip is a straight cut (<=5 points; card/key/chip/hero/sheet sizes), each paper's computed clip = its kind token (no inline --clip) ${JSON.stringify(edges.kinds)}` +
          (edges.bad.length ? " — " + edges.bad.slice(0, 5).join("; ") : ""));
        check(edges.shadows === 0, `${T}: no shadow slab elements (${edges.shadows})`);
        if (width === 1280) {
          // Text contrast per look x mode (R9): >= 4.5:1, large text >= 3:1, DOM background walk (preview/contrast.js).
          const ct = await require("./contrast.js")(page);
          check(ct.texts > 300 && ct.findings.length === 0, `${T}: text contrast >= 4.5:1 (large >= 3:1) for ${ct.texts} texts (${ct.approx} over images skipped)` +
            (ct.findings.length ? " — " + ct.findings.slice(0, 5).map(f => `${f.card} ${f.el} "${f.text}" ${f.ratio}:1 ${f.fg} on ${f.bg} ${f.font}`).join("; ") + (ct.findings.length > 5 ? ` (+${ct.findings.length - 5})` : "") : ""));
        }
        if (look === "poster" && mode === "dark" && width === 1280) {
          // Edge + colour system API.
          const core = await page.evaluate(() => {
            const J = window.JamCards;
            const cuts = Object.entries({card: ["br", 14], key: ["tr", 12], chip: ["br", 6], hero: ["br", 22], sheet: ["tr", 18]})
              .every(([k, v]) => JSON.stringify(J.CUTS[k]) === JSON.stringify(v));
            const br = J.cutPath("br", 14) === "polygon(0 0,100% 0,100% calc(100% - 14px),calc(100% - 14px) 100%,0 100%)";
            const want = {ochre: "ochre", teal: "teal", blue: "blue", pink: "pink", violet: "violet", green: "green", red: "red",
              living: "ochre", kitchen: "teal", master: "blue", marissa: "pink", music: "violet", nerd: "green", alert: "red", ink: "ink", paper: "paper"};
            const names = Object.entries(want).every(([a, n]) => J.accentVar(a) === `var(--${n})`) && J.accentVar("Kitchen") === "var(--teal)" && J.accentVar("nope") === null;
            return {cuts, br, names, version: J.VERSION,
              api: ["seed", "rng", "tornPath", "paper", "cutKey", "cutPath", "accentName", "accentVar", "accentFg", "setAccent", "armBars", "icon", "bindActions", "runAction"].every(k => typeof J[k] === "function")};
          });
          check(core.cuts && core.br, "JamCards.CUTS / cutPath: card br14, key tr12, chip br6, hero br22, sheet tr18");
          check(core.names, "accent names + room aliases resolve (living→ochre, kitchen→teal, master→blue, marissa→pink, music→violet, nerd→green, alert→red)");
          check(core.api && core.version === "0.7.2", `window.JamCards exports the helper API (version ${core.version})`);
          // A rendered card resolves an alias: accent kitchen -> teal heading rule; no accent -> ochre; the fixture rooms differ.
          const rule = await page.evaluate(() => {
            const mk = accent => { const e = document.createElement("jam-heading"); e.setConfig({type: "custom:jam-heading", title: "T", ...(accent ? {accent} : {})});
              e.hass = window.__hass; document.body.append(e); return e; };
            const a = mk("kitchen"), b = mk(null), r = a.shadowRoot;
            const col = v => { const p = document.createElement("span"); p.style.color = v; r.append(p); const c = getComputedStyle(p).color; p.remove(); return c; };
            const bg = e => getComputedStyle(e.shadowRoot.querySelector(".rule")).backgroundColor;
            const out = {kitchen: bg(a), teal: col("var(--teal)"), def: bg(b), ochre: col("var(--ochre)"),
              h: a.shadowRoot.querySelector(".rule").getBoundingClientRect().height};
            a.remove(); b.remove();
            out.rooms = new Set([...document.querySelectorAll("#view jam-heading")].map(bg)).size;
            return out;
          });
          check(rule.kitchen === rule.teal && rule.def === rule.ochre && rule.h === 5,
            `jam-heading accent kitchen -> teal rule (${rule.kitchen}), default ochre (${rule.def}), 5px tall`);
          check(rule.rooms >= 6, `preview headings show ${rule.rooms} accent colours (>= 6)`);

          const helpers = {
            tile: name => page.locator("jam-tile").filter({hasText: name}),
            callsNow: () => page.evaluate(() => window.__calls),
          };
          for (const f of fs.readdirSync(path.join(__dirname, "checks")).filter(f => f.endsWith(".js")).sort())
            await require(path.join(__dirname, "checks", f))(page, check, helpers);
        }
        await page.close();
      }
    }
    if (process.env.JAM_SHOTS) await fixedScreensaver(browser, base, process.env.JAM_SHOTS);
    // Looks other than Poster (theming plan R3 / R9): the harness-only stress look (tokens/looks/stress.mjs: mixed case, a wide
    // fallback grotesque, display scale .85) must re-type the cards through the tokens, and it and every non-Poster look of
    // LOOKS must still fit everywhere, kiosk sizes included (preview/fit.js; each look's kiosk screens are written to
    // preview/shots/<look>/). JAM_FIT_LOOKS=<id,...> picks the looks ("" skips the fit runs).
    const fitIds = (process.env.JAM_FIT_LOOKS ?? ["stress", ...LOOKS.filter(l => l !== "poster")].join(",")).split(",").map(x => x.trim()).filter(Boolean);
    if (fitIds.includes("stress")) {
      const p = await browser.newPage({viewport: {width: 1280, height: 900}});
      try {
        await p.goto(`${base}?look=stress`);
        await p.waitForFunction(() => window.__ready);
        await p.evaluate(() => document.fonts.ready);
        const t = await p.evaluate(() => {
          const r = document.querySelector("#view jam-tile").shadowRoot, cs = s => getComputedStyle(r.querySelector(s));
          const kr = document.querySelector("#view jam-button").shadowRoot, key = getComputedStyle(kr.querySelector(".lbl"));
          const ch = [...document.querySelectorAll("#view jam-choice")].map(c => c.shadowRoot.querySelector(".key > .face")).find(Boolean);
          return {look: document.querySelector("#view jam-tile").dataset.look, val: {tt: cs(".val").textTransform, fw: cs(".val").fontWeight,
            fs: cs(".val").fontSize, ff: cs(".val").fontFamily, lh: cs(".val").lineHeight}, name: {tt: cs(".name").textTransform, ls: cs(".name").letterSpacing, fs: cs(".name").fontSize},
            lbl: {tt: key.textTransform, fw: key.fontWeight}, key: ch ? {tt: getComputedStyle(ch).textTransform, ls: getComputedStyle(ch).letterSpacing} : null};
        });
        // tile value: 1.7rem x .85 = 23.12px, line-height .95 x 1.12; tile name .74rem = 11.84px, .14em x .4 tracking = .6630px
        check(t.look === "stress" && t.val.tt === "none" && t.val.fw === "700" && t.val.fs === "23.12px" && /^"?Stress Wide/.test(t.val.ff) &&
          Math.abs(parseFloat(t.val.lh) - 23.12 * .95 * 1.12) < .05 && t.name.tt === "none" && Math.abs(parseFloat(t.name.ls) - 11.84 * .14 * .4) < .01 &&
          t.lbl.tt === "none" && t.lbl.fw === "700" && t.key && t.key.tt === "none",
          `stress look re-types the cards through the type tokens (${JSON.stringify(t)})`);
      } finally { await p.close(); }
    }
    if (fitIds.length) await require("./fit.js")(browser, base, check, {looks: fitIds, dir: process.env.JAM_SHOTS, fitCheck,
      lookDir: id => (id !== "stress" && LOOKS.includes(id) ? shotDir(id) : null)});
    // Review views of every non-Poster look (preview/views.js): its sheets, panel B, kiosk sheets and screensaver in both
    // modes (shots/<look>/views/), each with a controls-present check. JAM_NO_VIEWS=1 skips them.
    if (!process.env.JAM_NO_VIEWS) for (const look of LOOKS.filter(l => l !== "poster")) await require("./views.js")(browser, base, check, {look, dir: shotDir(look)});
    if (!process.env.JAM_NO_CONTACT) {
      const n = await contactSheet(browser, base, LOOKS);
      check(n > 10, `contact sheet preview/shots/looks.html: ${n} items x ${LOOKS.length} looks (${LOOKS.join(", ")})`);
    }
    if (process.env.JAM_BASELINE) await pixelDiff(browser, process.env.JAM_BASELINE, LOOKS, ALL_LOOKS.map(l => l.id));
    check(fontRequests.length === 0, "no requests to fonts.googleapis.com / fonts.gstatic.com" + (fontRequests.length ? ": " + fontRequests.slice(0, 3).join(", ") : ""));
    check(errors.length === 0, "no page errors" + (errors.length ? ": " + errors.join("; ") : ""));
  } finally { await browser.close(); server.close(); }
  process.exit(failures ? 1 : 0);
})();
