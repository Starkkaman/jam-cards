// Error paths (fixture preview/fixtures/98-errors.js, section .errors): missing / unavailable / unknown entities, bare state
// objects, empty lists, null media_title. No card throws (shoot.js fails on any page error); each one renders and shows its
// unavailable look. Then entities are removed while a sheet is open (light pop-up, TV remote sheet, media ⋯ sheet).
// Contract: module.exports = async (page, check, helpers) => {}; runs on the dark/1280 preview page, files in name order.
module.exports = async (page, check) => {
  const cards = await page.evaluate(() => [...document.querySelectorAll("#view .sec.errors > *")].map(e => {
    const host = e.shadowRoot && e.shadowRoot.querySelector(".host"), text = host ? host.textContent : "";
    // Hi-Fi's own drawings: [data-st=offline], the offline card (.c-ofl), alert words (.c-al), a dashed / unavailable switch
    const MARK = ".unavail, .dead, .bad, .c-alert, .s-alert, .alert, [data-mode=off], [data-badge=Offline], .c-dim, [data-st=offline], .c-ofl, .c-al, .c-dis, .jsw[data-un], .c-dw.c-alert, .c-dash";
    return {tag: e.localName, name: e._config.name || e._config.title || e._config.entity || "",
      rendered: !!host && host.childElementCount > 0,
      marked: !!(host && host.querySelector(MARK)) || /unavailable|—|No data|No forecast|Missing|N\/A|Entity not found|No options|Forecast…|Offline|Nothing played/i.test(text)};
  }));
  const tags = new Set(cards.map(c => c.tag));
  check(cards.length >= 28 && tags.size >= 20, `errors fixture: ${cards.length} error-path cards of ${tags.size} types render`);
  // Bare state objects (no attributes) and the null-title player are "must not throw" cases, not unavailable ones; the hero
  // falls back to its title.
  const EXEMPT = /bare$|^Err (TV|speaker|hero)$|^media_player\.err_null$|^Error paths$/; // + the section heading (no entity)
  const blank = cards.filter(c => !c.rendered), plain = cards.filter(c => c.rendered && !c.marked && !EXEMPT.test(c.name));
  check(!blank.length && !plain.length, "errors fixture: every error-path card renders with an unavailable look" +
    (blank.length ? " — blank: " + blank.map(c => c.tag + " " + c.name).join(", ") : "") + (plain.length ? " — no unavailable look: " + plain.map(c => c.tag + " " + c.name).join(", ") : ""));
  const nulls = await page.evaluate(() => {
    const q = (tag, n) => [...document.querySelectorAll(`#view .sec.errors > ${tag}`)].filter(e => (e._config.name || "") === n || e._config.entity === n || e._config.media_player === n)[0];
    const t = (e, s) => { const x = e && e.shadowRoot.querySelector(s); return x ? x.textContent : null; };
    // Hi-Fi draws jam-tv / jam-speaker: the title is .c-mtitle, the state words .c-wd
    return {media: t(q("jam-media", "media_player.err_null"), ".title"), tv: t(q("jam-tv", "Err TV"), ".c-mtitle"),
      spk: t(q("jam-speaker", "Err speaker"), ".c-mtitle"), spkName: t(q("jam-speaker", "Err speaker"), ".c-nm"), tvGone: t(q("jam-tv", "Err TV gone"), ".c-wd"),
      all: [...document.querySelectorAll("#view .sec.errors > *")].filter(e => e.shadowRoot && /\bnull\b/.test(e.shadowRoot.textContent)).map(e => e.localName)};
  });
  check(nulls.media && nulls.media !== "null" && nulls.tv && nulls.tv !== "null" && nulls.spk !== "null" && /Err speaker/.test(nulls.spkName || "") && /Offline/i.test(nulls.tvGone || "") && !nulls.all.length,
    `errors fixture: null media_title never prints "null" (media "${nulls.media}", tv "${nulls.tv}", speaker "${nulls.spk}"); a missing TV reads Offline ("${nulls.tvGone}")`);

  // Entity removed while a sheet is open: the sheet keeps working, shows the loss, and closes cleanly.
  const drop = ids => page.evaluate(ids => {
    const h = window.__hass;
    window.__dropped = window.__dropped || {};
    for (const id of ids) { window.__dropped[id] = h.states[id]; delete h.states[id]; }
    const nh = {...h};
    for (const e of document.querySelectorAll("#view *")) if (e._config && e.localName.startsWith("jam-") && !(e.parentNode && e.parentNode.host)) e.hass = nh;
  }, ids);
  const restore = () => page.evaluate(() => {
    const h = window.__hass;
    Object.assign(h.states, window.__dropped || {}); window.__dropped = {};
    for (const e of document.querySelectorAll("#view *")) if (e._config && e.localName.startsWith("jam-") && !(e.parentNode && e.parentNode.host)) e.hass = {...h};
  });
  const sheetText = () => page.evaluate(() => { const s = document.querySelector(".jam-sheet-host"); return s ? s.shadowRoot.querySelector(".body").textContent : null; });
  const closeAll = async () => { for (let i = 0; i < 3 && await page.evaluate(() => document.querySelectorAll(".jam-sheet-host").length); i++) { await page.keyboard.press("Escape"); await page.waitForTimeout(30); } };

  // Light pop-up.
  const lightCard = page.locator("#view .sec.errors > jam-light").filter({hasText: "Err light bare"});
  await lightCard.locator(".c-pn").click(); // Hi-Fi: the name row opens the light pop-up
  const lOpen = await sheetText();
  await drop(["light.err_bare"]);
  const lGone = await sheetText();
  const lDead = await lightCard.evaluate(e => !!e.shadowRoot.querySelector("[data-st=offline]"));
  await closeAll(); await restore();
  // Hi-Fi: the pop-up stays open and keeps working; the card itself turns Offline (the pop-up has no offline form of its own yet)
  check(lOpen !== null && lGone !== null && lDead, `light removed while its pop-up is open: the pop-up stays, the card reads Offline (${(lGone || "").slice(0, 30)})`);

  // TV remote sheet (jam-remote child gets the update through the sheet host).
  const tv = page.locator("#view .sec.errors > jam-tv").first();
  await tv.locator('button[data-key="remote"]').click();
  const tOpen = await page.evaluate(() => !!document.querySelector(".jam-sheet-host"));
  await drop(["media_player.err_null", "remote.err_unknown"]);
  const tGone = await page.evaluate(() => {
    // Hi-Fi's remote (a drawn object, .c-remote): it stays open and whole; the keys stay (an IR remote works without the TV entity)
    const s = document.querySelector(".jam-sheet-host"), r = s && s.shadowRoot.querySelector(".c-remote");
    return r ? {keys: r.querySelectorAll("button[data-key]").length} : null;
  });
  const tTitle = await tv.evaluate(e => (e.shadowRoot.querySelector(".c-wd") || {}).textContent || "");
  await closeAll(); await restore();
  check(tOpen && tGone && tGone.keys > 0 && /Offline/i.test(tTitle),
    `TV + remote removed while the remote pop-up is open: the remote stays whole (${tGone && tGone.keys} keys), the card says Offline ("${tTitle}")`);

  // jam-media ⋯ sheet (NerveOS, fixture 70-tv): its state entities removed while the sheet is open.
  await page.locator("#view jam-media").filter({hasText: "Hades"}).first().evaluate(e => { e.dataset.err = "nv"; });
  const nv = page.locator('#view jam-media[data-err="nv"]');
  await nv.locator(".c-pn").click(); // Hi-Fi's PC row: the name row opens the ⋯ sheet
  const mOpen = await page.evaluate(() => !!document.querySelector(".jam-sheet-host"));
  await drop(["sensor.living_room_nerveos_aero_15_now_playing", "sensor.living_room_nerveos_aero_15_power", "number.living_room_nerveos_aero_15_volume"]);
  const mGone = await page.evaluate(() => { const s = document.querySelector(".jam-sheet-host"); return s ? s.shadowRoot.querySelectorAll(".body > *").length : 0; });
  const mCard = await nv.evaluate(e => !!e.shadowRoot.querySelector(".unavail, [data-st=off] .c-al, .c-wd.c-al") || /Offline/.test(e.shadowRoot.textContent));
  await closeAll(); await restore();
  check(mOpen && mGone > 0 && mCard, `media entities removed while the ⋯ sheet is open: sheet children stay (${mGone}), card unavailable`);
  check(await page.evaluate(() => document.querySelectorAll(".jam-sheet-host").length === 0 && document.documentElement.style.overflow !== "hidden"), "sheets closed, page scroll restored");
};
