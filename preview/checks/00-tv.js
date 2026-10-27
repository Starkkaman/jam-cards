// TV fixture interactions: choice chip, tile toggle, slider, media key, hero off state.
// Contract: module.exports = async (page, check, helpers) => {}; runs on the dark/1280 preview page, files in name order.
module.exports = async (page, check, {tile, callsNow}) => {
  // Interactions: choice chip, tile toggle, slider drag, media button.
  await page.locator("jam-choice").nth(1).locator("button", {hasText: "HDMI 3"}).click();
  await page.locator("jam-tile").first().locator("button.sw").click();
  const track = page.locator("jam-slider .track").first();
  const box = await track.boundingBox();
  await page.mouse.move(box.x + box.width * 0.5, box.y + box.height / 2);
  await page.mouse.down(); await page.mouse.up();
  await page.locator("jam-media").first().locator("button.main").click(); // first = the v1-config card (50-av adds a v2 one)
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
};
