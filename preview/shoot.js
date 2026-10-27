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
          // Interactions: choice chip, tile toggle, slider drag, media button.
          await page.locator("jam-choice").nth(1).locator("button", {hasText: "HDMI 3"}).click();
          await page.locator("jam-tile").first().locator("button.sw").click();
          const track = page.locator("jam-slider .track").first();
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

          // Edge system: deterministic, polygon() with calc() jitter, cut corner when asked.
          const edge = await page.evaluate(() => {
            const J = window.JamCards, a = J.tornPath(J.seed("x"), {edges: "rb", cut: true}), b = J.tornPath(J.seed("x"), {edges: "rb", cut: true});
            return {same: a === b, poly: /^polygon\(/.test(a) && a.includes("calc(100% - "), diff: a !== J.tornPath(J.seed("y"), {edges: "rb", cut: true}),
              version: J.VERSION, api: ["seed", "rng", "tornPath", "paper", "cutKey", "armBars", "icon", "bindActions", "runAction"].every(k => typeof J[k] === "function")};
          });
          check(edge.same && edge.poly && edge.diff, "tornPath is stable per seed, differs across seeds, uses calc() jitter");
          check(edge.api && edge.version === "0.2.0-dev", `window.JamCards exports the helper API (version ${edge.version})`);

          const tile = name => page.locator("jam-tile").filter({hasText: name});
          const callsNow = () => page.evaluate(() => window.__calls);
          await page.evaluate(() => { window.__mi = []; window.addEventListener("hass-more-info", e => window.__mi.push(e.detail.entityId)); });
          // Plain tap (no double_tap_action) runs at once: more-info without a 250 ms wait.
          await page.locator("jam-tile").first().locator(".name").click();
          const mi = await page.evaluate(() => window.__mi.slice());
          check(mi.includes("switch.hisense_tv_power"), "tile tap opens more-info immediately");
          // Lock: locked -> UNLOCK key calls lock.unlock; unlocked -> LOCK key calls lock.lock; jammed key is red.
          const fk = tile("Front door").locator("button.sw");
          check((await fk.textContent()) === "Unlock", "locked lock shows Unlock key");
          await fk.click();
          check((await callsNow()).some(c => c.domain === "lock" && c.service === "unlock" && c.data.entity_id === "lock.front_door"), "lock key calls lock.unlock");
          await page.evaluate(() => { const h = window.__hass; h.states["lock.front_door"] = {...h.states["lock.front_door"], state: "unlocked", last_updated: "y"};
            document.querySelectorAll("jam-tile").forEach(t => t.hass = {...h}); });
          check((await fk.textContent()) === "Lock", "unlocked lock shows Lock key");
          await fk.click();
          check((await callsNow()).some(c => c.domain === "lock" && c.service === "lock" && c.data.entity_id === "lock.front_door"), "lock key calls lock.lock");
          check(await tile("Back door").locator("button.sw.alert").count() === 1, "jammed lock key is red (alert)");
          // Press key for input_button.
          await tile("Doorbell test").locator("button.sw").click();
          check((await callsNow()).some(c => c.domain === "input_button" && c.service === "press" && c.data.entity_id === "input_button.doorbell_test"), "press key calls input_button.press");
          // Fan slider: click at 25% -> fan.set_percentage 25.
          const ft = page.locator("jam-slider").filter({hasText: "Fan speed"}).locator(".track");
          const fb = await ft.boundingBox();
          await page.mouse.click(fb.x + fb.width * 0.25, fb.y + fb.height / 2);
          check((await callsNow()).some(c => c.domain === "fan" && c.service === "set_percentage" && c.data.percentage === 25), "fan slider sets percentage 25");
          // hold_action (500 ms) on a tile; the click after the hold must not also tap.
          const lamp = tile("Lamp").locator(".name");
          const lb = await lamp.boundingBox();
          const nCalls = (await callsNow()).length, nMi = (await page.evaluate(() => window.__mi.length));
          await page.mouse.move(lb.x + 10, lb.y + lb.height / 2);
          await page.mouse.down(); await page.waitForTimeout(700); await page.mouse.up();
          await page.waitForTimeout(400);
          const afterHold = (await callsNow()).slice(nCalls);
          check(afterHold.length === 1 && afterHold[0].domain === "light" && afterHold[0].service === "turn_on" && afterHold[0].data.brightness_pct === 100, "hold_action calls light.turn_on 100%");
          check((await page.evaluate(() => window.__mi.length)) === nMi, "hold does not also fire the tap action");
          // double_tap_action with confirmation.
          let dialogText = null;
          page.once("dialog", d => { dialogText = d.message(); d.accept(); });
          await lamp.dblclick();
          await page.waitForTimeout(400);
          check(dialogText === "Toggle the lamp?", `double tap asks for confirmation (got ${JSON.stringify(dialogText)})`);
          check((await callsNow()).some(c => c.service === "toggle" && c.data.entity_id === "light.reading_lamp"), "double_tap_action toggles the lamp");
          check((await page.evaluate(() => window.__mi.length)) === nMi, "double tap does not also fire the tap action");
          // Single tap on a tile with double_tap_action waits 250 ms, then taps.
          await lamp.click();
          const early = await page.evaluate(() => window.__mi.includes("light.reading_lamp"));
          await page.waitForTimeout(400);
          check(!early && await page.evaluate(() => window.__mi.includes("light.reading_lamp")), "single tap with double_tap_action configured runs tap after the wait");
        }
        await page.close();
      }
    }
    check(errors.length === 0, "no page errors" + (errors.length ? ": " + errors.join("; ") : ""));
  } finally { await browser.close(); server.close(); }
  process.exit(failures ? 1 : 0);
})();
