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
  // Hero chip tone overrides the hot colour; paper = paper-fg block like a cold chip but still .hot.
  const tones = await page.evaluate(() => {
    const e = document.createElement("jam-hero"), on = "binary_sensor.hisense_tv_signal_present";
    e.setConfig({type: "custom:jam-hero", title: "Tones", accent: "red", chips: [{entity: on, name: "A"}, {entity: on, name: "B", tone: "teal"},
      {entity: on, name: "C", tone: "paper"}, {entity: on, name: "D", tone: "ochre"}, {entity: "binary_sensor.hisense_tv_game_signal", name: "E", tone: "teal"}]});
    e.hass = window.__hass; document.body.append(e);
    const r = e.shadowRoot, col = v => { const p = document.createElement("span"); p.style.color = v; r.append(p); const c = getComputedStyle(p).color; p.remove(); return c; };
    const ch = [...r.querySelectorAll(".chip")].map(c => ({hot: c.classList.contains("hot"), bg: getComputedStyle(c).backgroundColor, fg: getComputedStyle(c).color}));
    const want = {red: col("var(--red)"), teal: col("var(--teal)"), ochre: col("var(--ochre)"), pfg: col("var(--paper-fg)"), paper: col("var(--paper)")};
    e.remove();
    return {ch, want};
  });
  const [ta, tb, tc, td, te] = tones.ch, W = tones.want;
  check(ta.hot && ta.bg === W.red && tb.hot && tb.bg === W.teal && tc.hot && tc.bg === W.pfg && tc.fg === W.paper && td.bg === W.ochre && !te.hot && te.bg === W.pfg,
    `jam-hero: chip tone overrides the hot colour (default ${ta.bg}, teal ${tb.bg}, paper ${tc.bg}/${tc.fg}, ochre ${td.bg}, cold ${te.bg})`);
  // Off state of the hero.
  await page.evaluate(() => { const h = window.__hass; h.states["switch.hisense_tv_power"] = {...h.states["switch.hisense_tv_power"], state: "off", last_updated: "x"};
    document.querySelector("jam-hero").hass = {...h}; });
  const title = await page.locator("jam-hero h1").textContent();
  check(title === "TV off", `hero shows off title (got "${title}")`);
};
