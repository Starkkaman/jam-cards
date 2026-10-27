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
  // Toggleable default: toggle; "on" switch prints a full ochre face.
  check(await btn("Dehumidifier").locator(".kf.on").count() === 1, "on switch button has the ochre face");
  n = (await callsNow()).length; await btn("Dehumidifier").click(); c = await since(n);
  check(c.length === 1 && c[0].service === "toggle" && c[0].data.entity_id === "switch.dehumidifier", "toggle button toggles switch.dehumidifier");
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
  const list = page.locator("jam-list");
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
