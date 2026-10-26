// Screenshots + interaction checks for preview/index.html. Run: pw-node preview/shoot.js  (exit 0 = all checks passed)
// Writes preview/shots/{dark,light}-{390,1280}.png.
const http = require("http");
const fs = require("fs");
const path = require("path");
const {chromium} = require("playwright");

const ROOT = path.join(__dirname, "..");
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
        if (mode === "dark" && width === 1280) {
          // Interactions: choice chip, tile toggle, slider drag, media button.
          await page.locator("jam-choice").nth(1).locator("button", {hasText: "HDMI 3"}).click();
          await page.locator("jam-tile").first().locator("button.sw").click();
          const track = page.locator("jam-slider .track");
          const box = await track.boundingBox();
          await page.mouse.move(box.x + box.width * 0.5, box.y + box.height / 2);
          await page.mouse.down(); await page.mouse.up();
          await page.locator("jam-media button.main").click();
          const calls = await page.evaluate(() => window.__calls);
          check(calls.some(c => c.domain === "select" && c.service === "select_option" && c.data.option === "HDMI 3"), "choice chip calls select.select_option HDMI 3");
          check(calls.some(c => c.service === "toggle" && c.data.entity_id === "switch.hisense_tv_power"), "tile button toggles power");
          check(calls.some(c => c.domain === "number" && c.service === "set_value" && c.data.value === 50), "slider click at 50% sets 50");
          check(calls.some(c => c.service === "media_play_pause"), "media play/pause");
          // Off state of the hero.
          await page.evaluate(() => { const h = window.__hass; h.states["switch.hisense_tv_power"] = {...h.states["switch.hisense_tv_power"], state: "off", last_updated: "x"};
            document.querySelector("jam-hero").hass = {...h}; });
          const title = await page.locator("jam-hero h1").textContent();
          check(title === "TV off", `hero shows off title (got "${title}")`);
        }
        await page.close();
      }
    }
    check(errors.length === 0, "no page errors" + (errors.length ? ": " + errors.join("; ") : ""));
  } finally { await browser.close(); server.close(); }
  process.exit(failures ? 1 : 0);
})();
