// Landing strip checks: jam-house door chip + people + air lines, jam-tabs current tab + navigate, jam-scenes call + active scene.
module.exports = async (page, check, {callsNow}) => {
  const house = page.locator("jam-house").first();
  // People: only those home, as chips (amber is not_home).
  const people = await house.locator("[data-role=person]").allTextContents();   // "Isaac Hulter" -> first name
  check(JSON.stringify(people) === JSON.stringify(["Isaac", "Marissa", "Nick"]), `jam-house shows only people at home (${people.join(", ")})`);
  check((await house.locator(".temp").textContent()) === "73.9°F" && (await house.locator(".otemp").textContent()) === "63°",
    "jam-house shows inside 73.9°F and outside 63°");
  check(/Outside · Clear night/.test(await house.locator(".out .label:not(.aq)").textContent()), "jam-house outside kicker names the condition");
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
  // full_names: true keeps the full friendly name.
  const full = await page.evaluate(() => { const e = document.querySelector("jam-house"); const c = e._config;
    e.setConfig({...c, full_names: true}); e.hass = {...window.__hass};
    const t = [...e.shadowRoot.querySelectorAll("[data-role=person]")].map(x => x.textContent); e.setConfig(c); e.hass = {...window.__hass}; return t; });
  check(full[0] === "Isaac Hulter", `jam-house full_names: true shows full names (${full.join(", ")})`);
  // Air lines (0.3.5): words only. Word state capitalised, numeric = US AQI band word, extra ignored, no numbers; missing -> no line.
  const aq = await house.evaluate(e => [...e.shadowRoot.querySelectorAll("[data-role=aq]")].map(x => x.closest(".in") ? "in:" + x.textContent : "out:" + x.textContent));
  check(JSON.stringify(aq) === JSON.stringify(["in:Air · Excellent", "out:Air · Good"]) && !aq.some(t => /\d/.test(t)),
    `jam-house air lines under both temperatures, words only (${aq.join(" | ")})`);
  const caq = await page.locator("jam-house").nth(1).evaluate(e => [...e.shadowRoot.querySelectorAll("[data-role=aq]")].map(x => x.textContent));
  check(caq.length === 1 && caq[0] === "Air · Excellent", `compact jam-house: id-only inside_aq, missing outside_aq hidden (${caq.join(" | ")})`);
  const bands = await page.evaluate(() => {
    const h = window.__hass, keep = h.states["sensor.airnow_aqi"], e = document.querySelector("jam-house"), out = [];
    for (const v of ["50", "51", "101", "150.4", "151", "201", "301", "unavailable"]) {
      h.states["sensor.airnow_aqi"] = {...keep, state: v, last_updated: "b" + v}; e.hass = {...h};
      const l = [...e.shadowRoot.querySelectorAll(".out [data-role=aq]")].map(x => x.textContent.replace("Air · ", ""));
      out.push(l[0] || "hidden");
    }
    delete h.states["sensor.airnow_aqi"]; e.hass = {...h};
    out.push(e.shadowRoot.querySelector(".out [data-role=aq]") ? "shown" : "hidden");
    h.states["sensor.airnow_aqi"] = keep; e.hass = {...h};
    return out;
  });
  check(bands.join(" | ") === "Good | Moderate | Unhealthy for sensitive | Unhealthy for sensitive | Unhealthy | Very unhealthy | Hazardous | hidden | hidden",
    `jam-house AQI bands, unavailable / missing hidden (${bands.join(" | ")})`);
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
  check((await scenes.locator(".scene.on").textContent()) === "Movie Time", "input_select changed after every scene activation -> its option is active ('Movie Time')");
  // Newest scene activation wins over a stale input_select; the select wins again once it changes later; live updates.
  const sceneSet = (id, patch) => page.evaluate(([id, patch]) => {
    const h = window.__hass, s = h.states[id];
    h.states[id] = {...s, ...patch, attributes: {...s.attributes, ...(patch.attributes || {})}, last_updated: "s" + Math.random()};
    document.querySelectorAll("jam-scenes").forEach(e => e.hass = {...h});
  }, [id, patch]);
  const keepSc = await page.evaluate(() => JSON.stringify(["input_select.light_scenes", "scene.vibes", "scene.spring_vibes"].map(id => window.__hass.states[id])));
  await sceneSet("input_select.light_scenes", {last_changed: "2026-10-26T00:25:02+00:00"});
  check((await scenes.locator(".scene.on").textContent()) === "Movie Time", "stale input_select: newest scene state (movie_time 10-26 04:53) is active");
  await sceneSet("scene.vibes", {state: "2026-10-27T20:58:37+00:00"});
  check((await scenes.locator(".scene.on").allTextContents()).join() === "Vibes", "scene.vibes activated later -> Vibes is active (live)");
  await sceneSet("scene.spring_vibes", {state: "2026-10-27T21:00:00+00:00", attributes: {friendly_name: "Spooky Vibes"}});
  const spooky = await scenes.locator(".scene.on").allTextContents();
  check(spooky.join() === "Spooky Vibes", `button name = friendly_name, newest activation active (${spooky})`);
  await sceneSet("input_select.light_scenes", {state: "Normal", last_changed: "2026-10-27T21:05:00+00:00"});
  check((await scenes.locator(".scene.on").allTextContents()).join() === "Normal", "input_select changed after the newest scene -> its option (Normal) is active");
  await page.evaluate(k => { const h = window.__hass; for (const s of JSON.parse(k)) h.states[s.entity_id] = {...s, last_updated: "r" + Math.random()};
    document.querySelectorAll("jam-scenes").forEach(e => e.hass = {...h}); }, keepSc);
  await scenes.locator(".scene", {hasText: "Vibes"}).first().click();
  check((await callsNow()).some(c => c.domain === "scene" && c.service === "turn_on" && c.data.entity_id === "scene.vibes" && c.data.transition === 2),
    "scene tap calls scene.turn_on with its data (transition 2)");
  // wrap: true -> keys wrap onto more rows, no sideways scroll.
  const wr = page.locator("jam-scenes").nth(1);
  await wr.evaluate(e => { e.style.display = "block"; e.style.width = "280px"; });
  const wrap = await wr.locator(".scenes").evaluate(r => ({cls: r.classList.contains("wrap"), sw: r.scrollWidth, cw: r.clientWidth,
    rows: new Set([...r.children].map(b => Math.round(b.getBoundingClientRect().top))).size}));
  check(wrap.cls && wrap.sw <= wrap.cw + 1 && wrap.rows > 1, `jam-scenes wrap (280 px): more rows, no horizontal overflow (${wrap.sw}/${wrap.cw}, ${wrap.rows} rows)`);
  await wr.evaluate(e => { e.style.display = ""; e.style.width = ""; });
};
