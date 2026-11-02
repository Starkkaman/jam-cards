// 0.7.2 failed actions (shared runAction path): a rejecting hass.callService on a jam-tv Source tile at 390px and on a plain
// jam-button. The tiles keep their size, a flat 2-line strip sits over the bottom of the sheet / card (ink, red rule), HA's
// "valid options are: …" list is dropped, full text in title / aria-label, one-shot shake only with motion on, gone on tap
// and after ~6 s; callService gets notifyOnError = false (no HA toast). Set JAM_SHOTS=<dir> for a 390px screenshot.
// No fixture: uses the 70-tv jam-tv cards.
const path = require("path");
module.exports = async (page, check) => {
  const MSG = "Option Jamfin is not valid for entity select.hisense_tv_launch_app, valid options are: Auto ADB, BT Music, Disney+, Dropout, " +
    "Google Play Store, Jellyfin, Live TV, Netflix, Plex, Prime Video, Spotify, Twitch, YouTube, YouTube Music, YouTube TV.";
  await page.setViewportSize({width: 390, height: 844}); await page.waitForTimeout(150);
  await page.evaluate(msg => {
    const h = window.__hass;
    h.__errOrig = h.callService; window.__errCalls = [];
    h.callService = (d, s, data, target, notify) => { window.__errCalls.push({d, s, notify}); return Promise.reject({code: "service_validation_error", message: msg}); };
    window.JamCards.motion = true;
    const nh = {...h}; for (const e of document.querySelectorAll("jam-tv")) e.hass = nh; // cards hold their own hass copy
  }, MSG);
  const tv = page.locator("jam-tv").filter({has: page.locator('button[data-key="source"]')}).first();
  await tv.locator('button[data-key="source"]').click(); await page.waitForTimeout(450);
  const sheet = page.locator(".jam-sheet-host").last();
  const measure = () => sheet.evaluate(h => {
    const r = h.shadowRoot, face = r.querySelector(".sheet > .face"), body = r.querySelector(".body");
    const tiles = [...r.querySelectorAll(".grid .tile")].map(t => Math.round(t.getBoundingClientRect().height));
    const e = face.querySelector(":scope > .jam-err");
    const out = {tiles, bodyH: Math.round(body.getBoundingClientRect().height), bodySH: body.scrollHeight, faceH: Math.round(face.getBoundingClientRect().height)};
    if (e) {
      const cs = getComputedStyle(e), lh = parseFloat(getComputedStyle(e.querySelector(".em")).lineHeight), fr = face.getBoundingClientRect(), er = e.getBoundingClientRect();
      out.err = {head: e.querySelector(".eh").textContent, msg: e.querySelector(".em").textContent, title: e.title, aria: e.getAttribute("aria-label"), role: e.getAttribute("role"),
        lines: [...e.querySelectorAll("span")].map(s => Math.round(s.getBoundingClientRect().height / lh)).reduce((a, b) => a + b, 0),
        ellipsis: [...e.querySelectorAll("span")].every(s => getComputedStyle(s).textOverflow === "ellipsis" && getComputedStyle(s).whiteSpace === "nowrap"),
        pos: cs.position, bg: cs.backgroundColor, color: cs.color, rule: cs.borderLeftWidth + " " + cs.borderLeftColor, inside: er.bottom <= fr.bottom + 0.5 && er.left >= fr.left && er.right <= fr.right,
        h: Math.round(er.height)};
    }
    return out;
  });
  const before = await measure();
  // Record the shake class as it is added (it is removed on animationend).
  await sheet.evaluate(h => { window.__shakes = 0; const mo = new MutationObserver(ms => { for (const m of ms) if (m.target.classList.contains("jam-shake")) window.__shakes++; });
    mo.observe(h.shadowRoot, {subtree: true, attributes: true, attributeFilter: ["class"]}); window.__shakeMo = mo; });
  await sheet.locator('.tile[data-app="Jamfin"]').click(); await page.waitForTimeout(120);
  const after = await measure();
  const calls = await page.evaluate(() => window.__errCalls);
  const red = await page.evaluate(() => { const p = document.createElement("span"); p.style.color = "var(--jam-red, #e0553b)"; document.body.append(p); const c = getComputedStyle(p).color; p.remove(); return c; });
  check(calls.length === 1 && calls[0].notify === false, `action error: the shared path calls HA with notifyOnError = false (${JSON.stringify(calls)})`);
  check(JSON.stringify(after.tiles) === JSON.stringify(before.tiles) && before.tiles.every(h => h >= 80) && after.bodyH === before.bodyH && after.bodySH === before.bodySH && after.faceH === before.faceH,
    `action error: Source tiles keep their height at 390px (${before.tiles} -> ${after.tiles}); sheet body ${before.bodyH}/${before.bodySH} -> ${after.bodyH}/${after.bodySH}, face ${before.faceH} -> ${after.faceH}`);
  const e = after.err || {};
  check(!!after.err && e.role === "alert" && e.pos === "absolute" && e.inside, `action error: a strip is pinned inside the sheet face, out of flow (${e.pos}, inside ${e.inside}, ${e.h}px)`);
  check(e.head === "Couldn't start Jamfin" && e.msg === "Option Jamfin is not valid for entity select.hisense_tv_launch_app." && !/valid options/i.test(e.msg),
    `action error: headline "${e.head}", short HA message without the options list ("${e.msg}")`);
  check(e.lines <= 2 && e.ellipsis && e.title && e.title.includes("YouTube TV") && e.aria === e.title, `action error: at most 2 lines (${e.lines}), ellipsis, full text in title / aria-label`);
  check(e.bg === "rgb(20, 18, 16)" && e.color === "rgb(236, 226, 201)" && e.rule === "6px " + red, `action error: flat ink strip, cream text, red left rule (${e.bg}, ${e.color}, ${e.rule})`);
  check(await page.evaluate(() => window.__shakes) === 1, `action error: the failed tile shakes once with motion on (${await page.evaluate(() => window.__shakes)})`);
  if (process.env.JAM_SHOTS) await page.screenshot({path: path.join(process.env.JAM_SHOTS, "tv-source-action-error-390.png")});
  // Tap dismisses it.
  await sheet.locator(".jam-err").click(); await page.waitForTimeout(50);
  check(!(await measure()).err, "action error: a tap on the strip removes it");
  // Motion off: no shake, a second failure replaces (never stacks) and is gone after ~6 s.
  await page.evaluate(() => { window.JamCards.motion = false; window.__shakes = 0; });
  await sheet.locator('.tile[data-app="Jamfin"]').click(); await page.waitForTimeout(60);
  await sheet.locator('.tile[data-app="Jamfin"]').click(); await page.waitForTimeout(60);
  const n2 = await sheet.evaluate(h => h.shadowRoot.querySelectorAll(".jam-err").length);
  check(n2 === 1 && await page.evaluate(() => window.__shakes) === 0, `action error: motion off -> no shake; a repeat replaces the strip (${n2} strip)`);
  await page.waitForTimeout(6200);
  check(!(await measure()).err, "action error: the strip is gone after ~6 s");
  await page.evaluate(() => { window.__shakeMo.disconnect(); window.JamCards.motion = true; });
  await page.keyboard.press("Escape"); await page.waitForTimeout(100);

  // A plain card on the same path: jam-button with a failing perform-action keeps its size; the strip is in its .host.
  const b = await page.evaluate(async () => {
    const e = document.createElement("jam-button");
    e.setConfig({type: "custom:jam-button", name: "Movie night", tap_action: {action: "perform-action", perform_action: "script.movie_night"}});
    e.hass = window.__hass; e.style.cssText = "display:block;width:180px"; document.body.append(e);
    await new Promise(r => setTimeout(r, 80));
    const h0 = e.getBoundingClientRect().height, root = e.shadowRoot.querySelector(".host .paper") || e.shadowRoot.querySelector(".host");
    root.click(); await new Promise(r => setTimeout(r, 80));
    const err = e.shadowRoot.querySelector(".host > .jam-err");
    const res = {h0: Math.round(h0), h1: Math.round(e.getBoundingClientRect().height), head: err && err.querySelector(".eh").textContent, pos: err && getComputedStyle(err).position};
    e.remove();
    return res;
  });
  check(b.head && /^Couldn't (start Movie night|run script\.movie_night)$/.test(b.head) && b.pos === "absolute" && b.h0 === b.h1,
    `action error: jam-button on the shared path shows "${b.head}" over its card, height ${b.h0} -> ${b.h1}`);

  // Direct calls (0.7.2 follow-up): a failing remote key in the TV's Remote sheet and a failing transport key on the card take
  // the same path (notifyOnError = false, strip, no layout change).
  await page.evaluate(() => { window.__errCalls.length = 0; });
  await tv.locator('button[data-key="remote"]').click(); await page.waitForTimeout(450);
  const rsheet = page.locator(".jam-sheet-host").last(), rem = rsheet.locator("jam-remote");
  await rem.evaluate(r => { r.hass = {...window.__hass}; });
  const keyHs = () => rem.evaluate(r => [...r.shadowRoot.querySelectorAll("button[data-key]")].map(b => Math.round(b.getBoundingClientRect().height)).join(","));
  const kh0 = await keyHs();
  const rk = rem.locator('button[data-key="up"]').first();
  const rkName = await rk.getAttribute("aria-label");
  await rk.click(); await page.waitForTimeout(120);
  const re = await rem.evaluate(r => { const e = r.shadowRoot.querySelector(".host > .jam-err"); return e ? {head: e.querySelector(".eh").textContent, msg: e.querySelector(".em").textContent, pos: getComputedStyle(e).position} : null; });
  const rc = await page.evaluate(() => window.__errCalls.slice());
  check(re && re.head === `Couldn't send ${rkName}` && re.pos === "absolute" && /^Option Jamfin is not valid/.test(re.msg) && rc.length === 1 && rc[0].d === "remote" && rc[0].notify === false && await keyHs() === kh0,
    `action error: a failing remote key (${rc.map(x => x.d + "." + x.s).join(",")}, notify ${rc[0] && rc[0].notify}) shows "${re && re.head}" in the jam-remote, key heights unchanged`);
  await page.keyboard.press("Escape"); await page.waitForTimeout(150);
  await page.evaluate(() => { window.__errCalls.length = 0; });
  const ph0 = await tv.evaluate(t => Math.round(t.getBoundingClientRect().height));
  const tk = tv.locator('.pane .keys button[data-key="next"]');
  if (await tk.count()) {
    await tk.click(); await page.waitForTimeout(120);
    const te = await tv.evaluate(t => { const e = t.shadowRoot.querySelector(".host > .jam-err"); return e ? e.querySelector(".eh").textContent : null; });
    const tc = await page.evaluate(() => window.__errCalls.slice());
    check(te === "Couldn't run Next" && tc.length === 1 && tc[0].s === "media_next_track" && tc[0].notify === false && await tv.evaluate(t => Math.round(t.getBoundingClientRect().height)) === ph0,
      `action error: a failing transport key on the jam-tv card shows "${te}" over the card (card height ${ph0} unchanged)`);
    await tv.evaluate(t => { const e = t.shadowRoot.querySelector(".jam-err"); if (e) e.click(); });
  } else check(false, "action error: jam-tv transport key present");

  await page.evaluate(() => { const h = window.__hass; h.callService = h.__errOrig; delete h.__errOrig;
    const nh = {...h}; for (const e of document.querySelectorAll("jam-tv")) e.hass = nh; });
  await page.setViewportSize({width: 1280, height: 900}); await page.waitForTimeout(100);
};
