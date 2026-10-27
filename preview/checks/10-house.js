// House fixture interactions: more-info tap, locks, press key, fan slider, hold / double tap actions.
// Contract: module.exports = async (page, check, helpers) => {}; runs on the dark/1280 preview page, files in name order.
module.exports = async (page, check, {tile, callsNow}) => {
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
};
