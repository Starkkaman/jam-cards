// TV fixture interactions: choice chip, tile toggle, slider, media key, hero off state.
// Contract: module.exports = async (page, check, helpers) => {}; runs on the dark/1280 preview page, files in name order.
module.exports = async (page, check, {tile, callsNow}) => {
  // Interactions: choice chip, tile toggle, slider drag, media button.
  await page.locator("jam-choice").nth(1).locator("button", {hasText: "HDMI 3"}).click();
  await page.locator("jam-tile").first().locator(".jsw").click(); // Hi-Fi: an on / off tile is the switch card (small switch)
  const track = page.locator("jam-slider .track").first();
  const box = await track.boundingBox();
  await page.mouse.move(box.x + box.width * 0.5, box.y + box.height / 2);
  await page.mouse.down(); await page.mouse.up();
  await page.locator("jam-media").first().locator("button.main").click(); // first = the v1-config card (50-av adds a v2 one)
  const calls = await page.evaluate(() => window.__calls);
  check(calls.some(c => c.domain === "select" && c.service === "select_option" && c.data.option === "HDMI 3"), "choice chip calls select.select_option HDMI 3");
  check(calls.some(c => c.service === "toggle" && c.data.entity_id === "switch.hisense_tv_power"), "tile switch toggles power");
  check(calls.some(c => c.domain === "number" && c.service === "set_value" && c.data.value === 50), "slider click at 50% sets 50");
  check(calls.some(c => c.service === "media_play_pause"), "media play/pause");
  // Hero chip tone overrides the hot colour; paper = paper-fg block like a cold chip but still .hot.
  const tones = await page.evaluate(() => {
    const e = document.createElement("jam-hero"), on = "binary_sensor.hisense_tv_signal_present";
    e.setConfig({type: "custom:jam-hero", title: "Tones", accent: "red", chips: [{entity: on, name: "A"}, {entity: on, name: "B", tone: "teal"},
      {entity: on, name: "C", tone: "paper"}, {entity: on, name: "D", tone: "ochre"}, {entity: "binary_sensor.hisense_tv_game_signal", name: "E", tone: "teal"}]});
    e.hass = window.__hass; document.body.append(e);
    const r = e.shadowRoot, col = v => { const p = document.createElement("span"); p.style.color = v; r.append(p); const c = getComputedStyle(p).color; p.remove(); return c; };
    const ch = [...r.querySelectorAll(".chip")].map(c => ({hot: c.classList.contains("hot"), bg: getComputedStyle(c, "::before").backgroundColor, fg: getComputedStyle(c).color}));
    const want = {red: col("var(--red)"), teal: col("var(--teal)"), ochre: col("var(--ochre)"), pfg: col("var(--paper-fg)"), paper: col("var(--paper)")};
    e.remove();
    return {ch, want};
  });
  const [ta, tb, tc, td, te] = tones.ch, W = tones.want;
  // Hi-Fi: a chip's tone still fills it (teal, paper, ochre); a hot chip without a tone is the pressed key (no accent fill)
  check(ta.hot && ta.bg !== W.red && tb.hot && tb.bg === W.teal && tc.hot && tc.bg === W.pfg && tc.fg === W.paper && td.bg === W.ochre && !te.hot,
    `jam-hero: chip tone overrides the hot colour (default ${ta.bg}, teal ${tb.bg}, paper ${tc.bg}/${tc.fg}, ochre ${td.bg}, cold ${te.bg})`);
  // Hi-Fi colour rule: no room-colour fills: a list's on key is the pressed paper with an ink edge, not the accent.
  const acc = await page.evaluate(() => {
    const mk = (tag, cfg) => { const e = document.createElement(tag); e.setConfig({type: "custom:" + tag, ...cfg}); e.hass = window.__hass; document.body.append(e); return e; };
    const list = mk("jam-list", {entities: ["switch.hisense_tv_power", "binary_sensor.hisense_tv_game_signal"], accent: "green"});
    const r = list.shadowRoot, f = r.querySelector("button.sw > .face"), col = v => { const p = document.createElement("span"); p.style.color = v; r.append(p); const c = getComputedStyle(p).color; p.remove(); return c; };
    const out = {on: getComputedStyle(f).backgroundColor, green: col("var(--green)"), key2: col("var(--slab3)"), edge: getComputedStyle(f).borderTopColor, fg: col("var(--fg)")};
    list.remove();
    return out;
  });
  check(acc.on !== acc.green && acc.on === acc.key2 && acc.edge === acc.fg, `jam-list: an on key is the pressed paper with an ink edge, not the accent (${acc.on}, edge ${acc.edge})`);
  // Off state of the hero.
  await page.evaluate(() => { const h = window.__hass; h.states["switch.hisense_tv_power"] = {...h.states["switch.hisense_tv_power"], state: "off", last_updated: "x"};
    document.querySelector("jam-hero").hass = {...h}; });
  const title = await page.locator("jam-hero h1").first().textContent();
  check(title === "TV off", `hero shows off title (got "${title}")`);
};
