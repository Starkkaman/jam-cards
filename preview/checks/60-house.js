// Landing strip checks: jam-house door chip + people, jam-tabs current tab + navigate, jam-scenes call + active scene.
module.exports = async (page, check, {callsNow}) => {
  const house = page.locator("jam-house").first();
  // People: only those home, as chips (amber is not_home).
  const people = await house.locator("[data-role=person]").allTextContents();
  check(JSON.stringify(people) === JSON.stringify(["Isaac", "Marissa", "Nick"]), `jam-house shows only people at home (${people.join(", ")})`);
  check((await house.locator(".temp").textContent()) === "73.9°F" && (await house.locator(".otemp").textContent()) === "63°",
    "jam-house shows inside 73.9°F and outside 63°");
  check(/Outside · Clear night/.test(await house.locator(".out .label").textContent()), "jam-house outside kicker names the condition");
  // Door: unlocked -> red chip, tap calls lock.lock without a confirmation dialog.
  let dialog = false; const onDialog = d => { dialog = true; d.dismiss(); };
  page.on("dialog", onDialog);
  const door = house.locator("[data-role=door]");
  check((await door.textContent()) === "Door unlocked · lock" && await door.evaluate(e => e.classList.contains("red")), "unlocked door chip is red 'Door unlocked · lock'");
  await door.click();
  page.off("dialog", onDialog);
  check(!dialog && (await callsNow()).some(c => c.domain === "lock" && c.service === "lock" && c.data.entity_id === "lock.level_bolt_matter"),
    "door chip tap calls lock.lock (no confirmation)");
  await page.evaluate(() => { const h = window.__hass; h.states["lock.level_bolt_matter"] = {...h.states["lock.level_bolt_matter"], state: "locked", last_updated: "z"};
    document.querySelectorAll("jam-house").forEach(t => t.hass = {...h}); });
  check((await door.textContent()) === "Door locked" && !(await door.evaluate(e => e.classList.contains("red"))), "locked door chip reads 'Door locked' (slab)");
  // Compact house: matching alert chip.
  const alert = page.locator("jam-house").nth(1).locator("[data-role=alert]");
  check(await alert.count() === 1 && (await alert.textContent()) === "Washer leak", "compact jam-house shows the matching alert chip");

  // Tabs: current from location.pathname; tap navigates (pushState + location-changed).
  const tabs = page.locator("jam-tabs").first();
  const start = await page.evaluate(() => location.pathname);
  check(await tabs.locator(".tab.on").count() === 0, "no tab is current on an unrelated path");
  await page.evaluate(() => { history.pushState(null, "", "/jam-overview/master"); window.dispatchEvent(new CustomEvent("location-changed")); });
  check((await tabs.locator(".tab.on").textContent()) === "Master", "tab matching location.pathname is current");
  await page.evaluate(() => { window.__loc = 0; window.addEventListener("location-changed", () => window.__loc++); });
  await tabs.locator(".tab", {hasText: "Kitchen"}).click();
  const nav = await page.evaluate(() => ({path: location.pathname, n: window.__loc}));
  check(nav.path === "/jam-overview/kitchen" && nav.n === 1, `tab tap navigates + fires location-changed (${nav.path}, ${nav.n})`);
  check((await tabs.locator(".tab.on").textContent()) === "Kitchen" &&
    (await tabs.locator(".tab.on").evaluate(e => getComputedStyle(e).backgroundColor)) === "rgb(34, 163, 154)", "current tab follows navigation, filled with its accent (kitchen = teal)");
  await page.evaluate(p => { history.replaceState(null, "", p); window.dispatchEvent(new CustomEvent("location-changed")); }, start);

  // Scenes: active from input_select (case-insensitive), tap = scene.turn_on with data.
  const scenes = page.locator("jam-scenes").first();
  check((await scenes.locator(".scene.on").textContent()) === "Movie Time", "active scene comes from input_select.light_scenes ('Movie Time')");
  await scenes.locator(".scene", {hasText: "Vibes"}).first().click();
  check((await callsNow()).some(c => c.domain === "scene" && c.service === "turn_on" && c.data.entity_id === "scene.vibes" && c.data.transition === 2),
    "scene tap calls scene.turn_on with its data (transition 2)");
};
