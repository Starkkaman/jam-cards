// Buttons / gauge / list interactions + no mid-word label breaks at 390 px.
// Contract: module.exports = async (page, check, helpers) => {}; runs on the dark/1280 preview page, files in name order.
module.exports = async (page, check, {callsNow}) => {
  const btn = name => page.locator("jam-button").filter({hasText: name}).first();
  const since = async n => (await callsNow()).slice(n);
  const push = (sel, id, patch) => page.evaluate(([sel, id, patch]) => {
    const h = window.__hass; h.states[id] = {...h.states[id], ...patch, last_updated: String(Math.random())};
    document.querySelectorAll(sel).forEach(t => t.hass = {...h});
  }, [sel, id, patch]);
  let n = (await callsNow()).length;
  // Configured service (automation.trigger with skip_condition).
  await btn("Jellyfin").click();
  let c = await since(n);
  check(c.length === 1 && c[0].domain === "automation" && c[0].service === "trigger" && c[0].data.skip_condition === true, "jam-button tap calls automation.trigger (skip_condition)");
  // Scene default: scene.turn_on.
  n = (await callsNow()).length; await btn("Movie Time").click(); c = await since(n);
  check(c.length === 1 && c[0].domain === "scene" && c[0].service === "turn_on" && c[0].data.entity_id === "scene.movie_time", "scene button calls scene.turn_on");
  // Stateless domains: "unknown" / timestamp states are normal (not greyed); default tap presses; only "unavailable" greys.
  const greyed = name => btn(name).locator(".kf.unavail").count();
  check(await greyed("Restart TV") === 0 && await greyed("Porch Chime") === 0 && await greyed("Movie Time") === 0,
    "jam-button: stateless button/input_button 'unknown' and scene timestamp are not greyed");
  n = (await callsNow()).length; await btn("Restart TV").click(); c = await since(n);
  check(c.length === 1 && c[0].domain === "button" && c[0].service === "press" && c[0].data.entity_id === "button.hisense_tv_restart", "jam-button: button.* default tap = button.press");
  n = (await callsNow()).length; await btn("Porch Chime").click(); c = await since(n);
  check(c.length === 1 && c[0].domain === "input_button" && c[0].service === "press" && c[0].data.entity_id === "input_button.porch_chime", "jam-button: input_button default tap = input_button.press");
  await push("jam-button", "button.hisense_tv_restart", {state: "unavailable"});
  check(await greyed("Restart TV") === 1, "jam-button: stateless button greys only when unavailable");
  await push("jam-button", "button.hisense_tv_restart", {state: "unknown"});
  // Accent square (Poster): small cut square in the accent when off (28px, big 36px), ink square on an on face; accent wins
  // over color; HA colour names map to the new hues; ink/grey = plain key without a square.
  const look = await page.evaluate(() => {
    const r0 = document.querySelector("jam-button").shadowRoot;
    const col = v => { const p = document.createElement("span"); p.style.color = v; r0.append(p); const c = getComputedStyle(p).color; p.remove(); return c; };
    const W = {}; for (const k of ["ochre", "teal", "blue", "pink", "violet", "green", "red", "on-fg"]) W[k] = col(`var(--${k})`);
    const find = n => [...document.querySelectorAll("#view jam-button")].find(b => b.shadowRoot.textContent.includes(n));
    const sq = b => { const q = b.shadowRoot.querySelector(".sq"); if (!q) return null; const r = q.getBoundingClientRect(); return {bg: getComputedStyle(q).backgroundColor, w: r.width, h: r.height}; };
    const face = b => { const f = b.shadowRoot.querySelector(".kf"); return {bg: getComputedStyle(f).backgroundColor, fg: getComputedStyle(f).color, on: f.classList.contains("on")}; };
    const mk = cfg => { const e = document.createElement("jam-button"); e.setConfig({type: "custom:jam-button", ...cfg}); e.hass = window.__hass; document.body.append(e); return e; };
    const onPink = mk({entity: "switch.dehumidifier", accent: "pink"}), onMarissa = mk({entity: "switch.dehumidifier", accent: "marissa"});
    const out = {W, jelly: sq(find("Jellyfin")), sw: sq(find("Switch")), bato: sq(find("Batocera")), movie: sq(find("Movie Time")), normal: sq(find("Normal")),
      chime: sq(find("Porch Chime")), restart: sq(find("Restart TV")), dehum: face(find("Dehumidifier")), dsq: sq(find("Dehumidifier")),
      pink: face(onPink), pinkSq: sq(onPink), alias: face(onMarissa)};
    onPink.remove(); onMarissa.remove();
    return out;
  });
  const W = look.W;
  check(look.jelly.bg === W.violet && look.sw.bg === W.blue && look.bato.bg === W.green && look.movie.bg === W.red && look.restart.bg === W.teal,
    `jam-button: color purple/blue/green -> violet/blue/green squares, accent red/teal squares (${look.jelly.bg}, ${look.sw.bg}, ${look.bato.bg})`);
  check(look.normal === null && look.restart.w === 28 && look.restart.h === 28 && look.chime.w === 36,
    `jam-button: grey = plain key, accent square 28px (big ${look.chime && look.chime.w}px)`);
  check(look.dehum.on && look.dehum.bg === W.ochre && look.dehum.fg === W["on-fg"] && look.dsq.bg === W["on-fg"],
    `jam-button: on face = card accent (room living: ${look.dehum.bg}) with ink text and an ink square`);
  check(look.pink.on && look.pink.bg === W.pink && look.pink.fg === W["on-fg"] && look.pinkSq.bg === W["on-fg"] && look.alias.bg === W.pink,
    `jam-button: on face uses the configured accent (pink ${look.pink.bg}; alias marissa ${look.alias.bg})`);
  // On/off entity (round 3): "on" switch prints a full accent face; power corner = toggle, tap = more-info, P / Shift+Enter = power.
  check(await btn("Dehumidifier").locator(".kf.on").count() === 1, "on switch button has the accent face");
  await page.evaluate(() => { window.__mi3 = []; window.addEventListener("hass-more-info", e => window.__mi3.push(e.detail.entityId)); });
  n = (await callsNow()).length; await btn("Dehumidifier").locator(".lbl").click(); c = await since(n);
  check(c.length === 0 && (await page.evaluate(() => window.__mi3.join())) === "switch.dehumidifier", "on/off button tap opens more-info (no toggle)");
  n = (await callsNow()).length; await btn("Dehumidifier").locator("button.pw").click(); c = await since(n);
  check(c.length === 1 && c[0].service === "toggle" && c[0].data.entity_id === "switch.dehumidifier" && (await page.evaluate(() => window.__mi3.length)) === 1,
    "power corner toggles switch.dehumidifier (no more-info)");
  await btn("Dehumidifier").locator(".paper").first().focus();
  n = (await callsNow()).length; await page.keyboard.press("p"); await page.keyboard.press("Shift+Enter"); c = await since(n);
  check(c.length === 2 && c.every(x => x.service === "toggle") && (await page.evaluate(() => window.__mi3.length)) === 1, "keyboard: P and Shift+Enter = power, no more-info");
  const pw = await page.evaluate(() => {
    const b = [...document.querySelectorAll("#view jam-button")].find(e => e._config.entity === "switch.dehumidifier"), r = b.shadowRoot;
    const J = window.JamCards, face = getComputedStyle(r.querySelector(".kf")).backgroundColor.match(/\d+/g).map(Number);
    const tri = r.querySelector(".pw .tri"), box = tri.getBoundingClientRect(), f = r.querySelector(".kf").getBoundingClientRect();
    const scene = [...document.querySelectorAll("#view jam-button")].find(e => e._config.entity === "scene.vibes");
    return {bg: getComputedStyle(tri).backgroundColor, mid: "rgb(" + J.shade(face, 1).join(", ") + ")", w: box.width, right: Math.round(f.right - box.right), top: Math.round(box.top - f.top),
      cut: r.querySelector(".paper").dataset.cut, sceneCorner: !!scene.shadowRoot.querySelector(".pw"), sceneCut: scene.shadowRoot.querySelector(".paper").dataset.cut};
  });
  check(pw.bg === pw.mid && pw.w === 46 && pw.right === 0 && pw.top === 0 && pw.cut === "card" && !pw.sceneCorner && pw.sceneCut === "key",
    `on/off button: 46px corner in the face's mid shade (${pw.bg}), card cut; a scene key keeps the key cut and no corner`);
  // Navigate.
  await btn("Lights").click();
  check(await page.evaluate(() => location.hash) === "#livingroom-popup", "Lights button navigates to #livingroom-popup");
  // Close whatever opened on that hash (the jam-popup fixture listens for it) before the next clicks.
  await page.evaluate(() => { history.replaceState(null, "", location.pathname + location.search);
    window.dispatchEvent(new CustomEvent("location-changed", {detail: {replace: true}})); });
  await page.waitForTimeout(150);
  // Gauge: 111.4 W over max 100 clamps the arc, numeral keeps the value.
  const g = page.locator("jam-gauge").first(), meter = g.locator("[role=meter]");
  check(await meter.getAttribute("aria-valuenow") === "100" && (await g.locator(".big").textContent()) === "111W", "gauge clamps to max and shows the numeral 111 W");
  await push("jam-gauge", "sensor.dehumidifier_current_consumption", {state: "-5"});
  check(await meter.getAttribute("aria-valuenow") === "0", "gauge clamps below min to 0");
  await push("jam-gauge", "sensor.dehumidifier_current_consumption", {state: "unavailable"});
  check((await g.locator(".big.c-alert").textContent()) === "Unavailable" && await g.locator("path.cut").count() === 0, "unavailable gauge: red label, no value cut");
  await push("jam-gauge", "sensor.dehumidifier_current_consumption", {state: "111.4"});
  const bar = page.locator("jam-gauge").filter({hasText: "NAS_Effect"});
  const bw = await bar.locator(".fill").evaluate(f => parseFloat(f.style.width));
  check(Math.abs(bw - 45.0028 / 47.8 * 100) < 0.1, `bar gauge fill ${bw.toFixed(1)}%`);
  // List: switch key toggles, tracker reads HOME, row tap = more-info.
  const list = page.locator("jam-list").first();
  n = (await callsNow()).length; await list.locator("button.sw").click(); c = await since(n);
  check(c.length === 1 && c[0].service === "toggle" && c[0].data.entity_id === "switch.dehumidifier", "list switch key toggles");
  check((await list.locator(".row").first().locator(".v").innerText()) === "HOME", "device_tracker home reads HOME");
  await page.evaluate(() => { window.__mi2 = []; window.addEventListener("hass-more-info", e => window.__mi2.push(e.detail.entityId)); });
  await list.locator(".row").nth(2).click();
  check((await page.evaluate(() => window.__mi2)).includes("sensor.system_monitor_processor_use"), "list row tap opens more-info");
  // 390 px: key labels never break mid-word (no horizontal overflow), and stay readable.
  await page.setViewportSize({width: 390, height: 900});
  await page.waitForTimeout(300);
  const bad = await page.evaluate(() => {
    const out = [];
    for (const b of document.querySelectorAll("jam-button")) for (const l of b.shadowRoot.querySelectorAll(".lbl")) {
      const fs = parseFloat(getComputedStyle(l).fontSize);
      if (l.scrollWidth > l.clientWidth + 0.5 || fs < 12) out.push(`${l.textContent} (${l.scrollWidth}/${l.clientWidth}, ${fs}px)`);
    }
    return out;
  });
  check(bad.length === 0, "jam-button labels fit by word at 390 px" + (bad.length ? " — " + bad.join("; ") : ""));
  await page.setViewportSize({width: 1280, height: 900});
};
