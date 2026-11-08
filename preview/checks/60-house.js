// Landing strip checks: jam-house door chip + people + air lines, jam-tabs current tab + navigate, jam-scenes call + active scene.
module.exports = async (page, check, {callsNow}) => {
  // jam-house in Hi-Fi (the pass 7 house strip): inside / outside, the door row (state word, Lock key while unlocked),
  // the people at home by first name (away = "· out"); no air lines (the purifier says the air word).
  const house = page.locator("jam-house").first();
  const hs = await house.evaluate(e => { const r = e.shadowRoot;
    return {people: [...r.querySelectorAll(".c-ppl > span:not(.c-away)")].map(x => x.textContent.replace(/^\S\s*/, "").trim()),
      away: [...r.querySelectorAll(".c-ppl > span.c-away")].map(x => x.textContent), big: [...r.querySelectorAll(".c-big")].map(x => x.textContent),
      word: (r.querySelector(".c-dw") || {}).textContent || "", aq: r.querySelectorAll("[data-role=aq]").length}; });
  check(JSON.stringify(hs.people) === JSON.stringify(["Isaac", "Marissa", "Nick"]) && hs.away.every(t => /· out$/.test(t)), `jam-house: people at home by first name, away ones "· out" (${hs.people.join(", ")} | ${hs.away.join(", ")})`);
  check(/^74°/.test(hs.big[0] || "") && /^63°/.test(hs.big[1] || "") && hs.aq === 0, `jam-house: inside 74° and outside 63° (${hs.big.join(" | ")}), no air lines`);
  let dialog = false; const onDialog = d => { dialog = true; d.dismiss(); };
  page.on("dialog", onDialog);
  check(/unlocked/i.test(hs.word), `jam-house: the door reads unlocked ("${hs.word}")`);
  await house.locator(".c-dr button").first().click();
  page.off("dialog", onDialog);
  check(!dialog && (await callsNow()).some(c => c.domain === "lock" && c.service === "lock" && c.data.entity_id === "lock.level_bolt_matter"), "jam-house: the Lock key calls lock.lock (no confirmation)");
  await page.evaluate(() => { const h = window.__hass; h.states["lock.level_bolt_matter"] = {...h.states["lock.level_bolt_matter"], state: "locked", last_updated: "z"};
    document.querySelectorAll("jam-house").forEach(t => t.hass = {...h}); });
  const locked = await house.evaluate(e => ({word: (e.shadowRoot.querySelector(".c-dw") || {}).textContent || "", key: !!e.shadowRoot.querySelector(".c-dr button")}));
  check(/^locked$/i.test(locked.word.trim()) && !locked.key, `jam-house: locked door reads locked, no key (${JSON.stringify(locked)})`);

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
    (await tabs.locator(".tab.on").count()) === 1, "current tab follows navigation");
  await page.evaluate(p => { history.replaceState(null, "", p); window.dispatchEvent(new CustomEvent("location-changed")); }, start);

  // Scenes: active from input_select (case-insensitive), tap = scene.turn_on with data.
  const scenes = page.locator("jam-scenes").first();
  check((await scenes.locator('.c-k[aria-pressed="true"]').textContent()) === "Movie Time", "input_select changed after every scene activation -> its option is active ('Movie Time')");
  // Newest scene activation wins over a stale input_select; the select wins again once it changes later; live updates.
  const sceneSet = (id, patch) => page.evaluate(([id, patch]) => {
    const h = window.__hass, s = h.states[id];
    h.states[id] = {...s, ...patch, attributes: {...s.attributes, ...(patch.attributes || {})}, last_updated: "s" + Math.random()};
    document.querySelectorAll("jam-scenes").forEach(e => e.hass = {...h});
  }, [id, patch]);
  const keepSc = await page.evaluate(() => JSON.stringify(["input_select.light_scenes", "scene.vibes", "scene.spring_vibes"].map(id => window.__hass.states[id])));
  await sceneSet("input_select.light_scenes", {last_changed: "2026-10-26T00:25:02+00:00"});
  check((await scenes.locator('.c-k[aria-pressed="true"]').textContent()) === "Movie Time", "stale input_select: newest scene state (movie_time 10-26 04:53) is active");
  await sceneSet("scene.vibes", {state: "2026-10-27T20:58:37+00:00"});
  check((await scenes.locator('.c-k[aria-pressed="true"]').allTextContents()).join() === "Vibes", "scene.vibes activated later -> Vibes is active (live)");
  await sceneSet("scene.spring_vibes", {state: "2026-10-27T21:00:00+00:00", attributes: {friendly_name: "Spooky Vibes"}});
  const spooky = await scenes.locator('.c-k[aria-pressed="true"]').allTextContents();
  check(spooky.join() === "Spooky Vibes", `button name = friendly_name, newest activation active (${spooky})`);
  await sceneSet("input_select.light_scenes", {state: "Normal", last_changed: "2026-10-27T21:05:00+00:00"});
  check((await scenes.locator('.c-k[aria-pressed="true"]').allTextContents()).join() === "Normal", "input_select changed after the newest scene -> its option (Normal) is active");
  await page.evaluate(k => { const h = window.__hass; for (const s of JSON.parse(k)) h.states[s.entity_id] = {...s, last_updated: "r" + Math.random()};
    document.querySelectorAll("jam-scenes").forEach(e => e.hass = {...h}); }, keepSc);
  await scenes.locator(".c-k", {hasText: "Vibes"}).first().click();
  check((await callsNow()).some(c => c.domain === "scene" && c.service === "turn_on" && c.data.entity_id === "scene.vibes" && c.data.transition === 2),
    "scene tap calls scene.turn_on with its data (transition 2)");
  // wrap: true -> keys wrap onto more rows, no sideways scroll.
  const wr = page.locator("jam-scenes").nth(1);
  await wr.evaluate(e => { e.style.display = "block"; e.style.width = "280px"; });
  // Hi-Fi: the pills wrap (a 4-up grid in a narrow column) whatever `wrap` says
  const wrap = await wr.locator(".c-scn").evaluate(r => ({sw: r.scrollWidth, cw: r.clientWidth,
    rows: new Set([...r.children].map(b => Math.round(b.getBoundingClientRect().top))).size}));
  check(wrap.sw <= wrap.cw + 1 && wrap.rows > 1, `jam-scenes at 280 px: more rows, no horizontal overflow (${wrap.sw}/${wrap.cw}, ${wrap.rows} rows)`);
  await wr.evaluate(e => { e.style.display = ""; e.style.width = ""; });
};
