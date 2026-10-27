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
  const errors = [];
  try {
    for (const mode of ["dark", "light"]) {
      for (const width of [390, 1280]) {
        const page = await browser.newPage({viewport: {width, height: 900}});
        page.on("pageerror", e => errors.push(`${mode}/${width}: ${e.message}`));
        await page.goto(`${base}?mode=${mode}`);
        await page.waitForFunction(() => window.__ready);
        await page.waitForTimeout(1500); // web fonts
        await page.screenshot({path: path.join(__dirname, "shots", `${mode}-${width}.png`), fullPage: true});
        // Layout: every card's paper (plus its 6px shadow) stays inside the card box; no face overflows sideways.
        const layout = await page.evaluate(() => {
          const bad = [];
          for (const card of document.querySelectorAll("#view [class], #view jam-heading, #view jam-hero, #view jam-tile, #view jam-choice, #view jam-slider, #view jam-media")) {
            if (!card.shadowRoot) continue;
            const host = card.getBoundingClientRect(), p = card.shadowRoot.querySelector(".host > .paper");
            if (p) { const r = p.getBoundingClientRect(); if (r.right + 6 > host.right + 0.5 || r.bottom + 6 > host.bottom + 0.5) bad.push(card.localName + " shadow outside box"); }
            for (const f of card.shadowRoot.querySelectorAll(".face")) if (f.scrollWidth > f.clientWidth + 1) bad.push(card.localName + " face overflows: " + f.textContent.slice(0, 30));
          }
          return [...new Set(bad)];
        });
        check(layout.length === 0, `${mode}/${width}: papers fit their boxes` + (layout.length ? " — " + layout.join("; ") : ""));
        if (mode === "dark" && width === 1280) {
          // Edge system: deterministic, polygon() with calc() jitter, cut corner when asked.
          const edge = await page.evaluate(() => {
            const J = window.JamCards, a = J.tornPath(J.seed("x"), {edges: "rb", cut: true}), b = J.tornPath(J.seed("x"), {edges: "rb", cut: true});
            return {same: a === b, poly: /^polygon\(/.test(a) && a.includes("calc(100% - "), diff: a !== J.tornPath(J.seed("y"), {edges: "rb", cut: true}),
              version: J.VERSION, api: ["seed", "rng", "tornPath", "paper", "cutKey", "armBars", "icon", "bindActions", "runAction"].every(k => typeof J[k] === "function")};
          });
          check(edge.same && edge.poly && edge.diff, "tornPath is stable per seed, differs across seeds, uses calc() jitter");
          check(edge.api && edge.version === "0.2.0", `window.JamCards exports the helper API (version ${edge.version})`);


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
    check(errors.length === 0, "no page errors" + (errors.length ? ": " + errors.join("; ") : ""));
  } finally { await browser.close(); server.close(); }
  process.exit(failures ? 1 : 0);
})();
