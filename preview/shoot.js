// Screenshots, layout + generic checks for preview/index.html; per-fixture interaction checks live in preview/checks/*.js. Run: pw-node preview/shoot.js  (exit 0 = all checks passed)
// Writes preview/shots/{dark,light}-{390,1280}.png.
const http = require("http");
const fs = require("fs");
const path = require("path");
const {chromium} = require("playwright");
const {execFileSync} = require("child_process");

const ROOT = path.join(__dirname, "..");
execFileSync(process.execPath, [path.join(ROOT, "tools", "bundle.mjs")], {stdio: "inherit"}); // jam-cards.js + fixtures/index.js are generated
const TYPES = {".html": "text/html", ".js": "text/javascript", ".png": "image/png"};
let failures = 0;
const check = (cond, what) => { console.log((cond ? "PASS " : "FAIL ") + what); if (!cond) failures++; };

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
    for (const mode of ["dark", "light"]) {
      for (const width of [390, 1280]) {
        const page = await browser.newPage({viewport: {width, height: 900}});
        page.on("pageerror", e => errors.push(`${mode}/${width}: ${e.message}`));
        page.on("request", r => { if (/fonts\.(googleapis|gstatic)\.com/.test(r.url())) fontRequests.push(r.url()); });
        await page.goto(`${base}?mode=${mode}`);
        await page.waitForFunction(() => window.__ready);
        await page.evaluate(() => document.fonts.ready);
        await page.waitForTimeout(1500); // layout settles
        // Fonts are bundled: both faces load from the data: URIs that core injects once into document.head.
        const fonts = await page.evaluate(async () => {
          await Promise.all(['900 1em "Londrina Solid"', '400 1em "Jost"', '600 1em "Jost"'].map(f => document.fonts.load(f)));
          await document.fonts.ready;
          const faces = [...document.fonts].filter(f => f.status === "loaded").map(f => f.family.replace(/"/g, "") + " " + f.weight);
          return {londrina: document.fonts.check('900 1em "Londrina Solid"'), jost: document.fonts.check('400 1em "Jost"') && document.fonts.check('600 1em "Jost"'),
            styles: document.head.querySelectorAll("style[data-jam-fonts]").length, links: document.querySelectorAll('link[href*="fonts.googleapis"]').length, faces};
        });
        check(fonts.londrina && fonts.jost && fonts.faces.includes("Londrina Solid 900") && fonts.faces.includes("Jost 400 600") && fonts.styles === 1 && fonts.links === 0,
          `${mode}/${width}: bundled fonts loaded (${fonts.faces.join(", ")}), one font style in head, no Google Fonts link`);
        await page.screenshot({path: path.join(__dirname, "shots", `${mode}-${width}.png`), fullPage: true});
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
        check(layout.length === 0, `${mode}/${width}: papers fit their boxes` + (layout.length ? " — " + layout.join("; ") : ""));
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
              const k = p.dataset.cut, clip = p.style.getPropertyValue("--clip").trim();
              kinds[k] = (kinds[k] || 0) + 1;
              if (J.CUTS[k]) { if (clip !== J.cutPath(...J.CUTS[k]) || pts(clip) !== 5) bad.push(`${k}: ${clip}`); }
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
          `${mode}/${width}: ${edges.papers} surfaces, every clip is a straight cut (<=5 points; card/key/chip/hero/sheet sizes) ${JSON.stringify(edges.kinds)}` +
          (edges.bad.length ? " — " + edges.bad.slice(0, 5).join("; ") : ""));
        check(edges.shadows === 0, `${mode}/${width}: no shadow slab elements (${edges.shadows})`);
        if (mode === "dark" && width === 1280) {
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
          check(core.api && core.version === "0.7.0", `window.JamCards exports the helper API (version ${core.version})`);
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
    check(fontRequests.length === 0, "no requests to fonts.googleapis.com / fonts.gstatic.com" + (fontRequests.length ? ": " + fontRequests.slice(0, 3).join(", ") : ""));
    check(errors.length === 0, "no page errors" + (errors.length ? ": " + errors.join("; ") : ""));
  } finally { await browser.close(); server.close(); }
  process.exit(failures ? 1 : 0);
})();
