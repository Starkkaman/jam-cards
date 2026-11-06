// Jam Calm (look `calm`, 2026-11-06; Jam Design pass 6 + 7): the look draws the cards it knows in layouts of its own through
// the whole-card `render` hook, so shoot.js's look matrix (which measures the cards' own DOM) leaves it out (tokens/looks/
// calm.mjs `layouts: true`) and this check covers it on the dark/1280 preview page, switched to calm (dark, then light) and
// back to Poster:
//   - the hook: Poster's render motif is false (every other look renders as before); under calm, jam-light / jam-tile /
//     jam-fan / jam-scenes / jam-house / jam-heading / jam-tv / jam-speaker / jam-kiosk draw Calm nodes (c-cm root), none
//     throws, the cards Calm does not know keep their own DOM; back under Poster no Calm node is left;
//   - floors on every Calm card: text >= 12px (kiosk home >= 18px), controls (button, slider, switch) >= 44px with their hit
//     area, text contrast >= 4.5:1 (large 3:1; preview/contrast.js, Calm cards only), in dark and light;
//   - behaviour on scratch cards (no fixture, so the preview shots stay as they were): the rocker turns the light off / on
//     (aria-pressed flips at once), `switch: toggle` and jam-tile's small switch call their services, the purifier's switch
//     is the climate kind (teal), a light's vertical fader sends at most one call per 300 ms while dragged and the final
//     value on release without redrawing the card under the finger, arrow keys send one call per burst, the small switch
//     moves in 180 ms and instantly with JamCards.motion = false;
//   - Isaac 2026-11-06 ("remote popup should be selectable even with the TV off"): jam-tv off keeps Remote (Calm and Poster),
//     the remote opens and its power key runs the TV power.
// Contract: module.exports = async (page, check, helpers) => {}.
const path = require("path");
module.exports = async (page, check) => {
  const contrast = require(path.join(__dirname, "..", "contrast.js"));
  const look = async (id, dark) => page.evaluate(async ([id, dark]) => {
    const h = window.__hass, de = document.documentElement;
    if (id === "poster") delete de.dataset.look; else de.dataset.look = id;
    de.classList.toggle("light", !dark);
    const out = [], walk = n => { for (const e of n.querySelectorAll("*")) { if (e._config && e.localName.startsWith("jam-")) out.push(e); if (e.shadowRoot) walk(e.shadowRoot); } };
    walk(document);
    const nh = {...h, themes: {...h.themes, darkMode: dark}};
    for (const c of out) c.hass = nh;
    await new Promise(r => setTimeout(r, 400));
    await document.fonts.ready;
  }, [id, dark]);
  const errs = [];
  const onErr = e => errs.push(e.message);
  page.on("pageerror", onErr);
  const scan = async () => page.evaluate(() => {
    const cards = [], walk = n => { for (const e of n.querySelectorAll("*")) { if (e._config && e.localName.startsWith("jam-") && e.shadowRoot) cards.push(e); if (e.shadowRoot) walk(e.shadowRoot); } };
    walk(document);
    const vis = e => e.getClientRects().length && (!e.checkVisibility || e.checkVisibility({opacityProperty: true, visibilityProperty: true}));
    const drawn = {}, small = [], tiny = [], other = new Set();
    for (const c of cards) {
      const root = c.shadowRoot.querySelector(".c-cm");
      if (!root) { if (["jam-light", "jam-fan", "jam-scenes", "jam-house", "jam-heading", "jam-tv", "jam-speaker", "jam-kiosk"].includes(c.localName) && vis(c)) other.add(c.localName); continue; }
      drawn[c.localName] = (drawn[c.localName] || 0) + 1;
      if (!vis(c)) continue;
      const kioskHome = !!c.shadowRoot.querySelector(".c-khome");
      for (const e of c.shadowRoot.querySelectorAll("*")) {
        if (!vis(e)) continue;
        const own = [...e.childNodes].some(n => n.nodeType === 3 && n.textContent.trim());
        const fs = parseFloat(getComputedStyle(e).fontSize);
        if (own && fs < (kioskHome ? 18 : 12) - .01) small.push(`${c.localName} "${e.textContent.trim().slice(0, 20)}" ${fs}px`);
        if (e.matches("button,[role=slider],[role=switch]") && !e.disabled) {
          const r = e.getBoundingClientRect();
          let w = r.width, hh = r.height;
          for (const ps of ["::before", "::after"]) { const p = getComputedStyle(e, ps); if (p.content !== "none" && p.position === "absolute") { w = Math.max(w, parseFloat(p.width) || 0); hh = Math.max(hh, parseFloat(p.height) || 0); } }
          if (w < 43.5 || hh < 43.5) tiny.push(`${c.localName} ${e.localName}.${String(e.className).split(" ")[0]} "${(e.getAttribute("aria-label") || e.textContent).trim().slice(0, 24)}" ${Math.round(w)}x${Math.round(hh)}`);
        }
      }
    }
    return {drawn, small: [...new Set(small)], tiny: [...new Set(tiny)], other: [...other]};
  });

  const poster = await page.evaluate(() => window.JamCards.motif("render", "poster", document.createElement("div"), document.createElement("div")) === false);
  check(poster, "calm hook: Poster's render motif is false (every other look renders its cards as before)");
  for (const dark of [true, false]) {
    await look("calm", dark);
    const r = await scan(), mode = dark ? "dark" : "light";
    const want = ["jam-light", "jam-tile", "jam-fan", "jam-scenes", "jam-house", "jam-heading", "jam-tv", "jam-speaker", "jam-kiosk"];
    check(want.every(t => r.drawn[t] > 0) && !r.other.length,
      `calm ${mode}: Calm draws ${Object.entries(r.drawn).map(([k, n]) => k + " ×" + n).join(", ")}` + (r.other.length ? ` — not drawn: ${r.other.join(", ")}` : ""));
    check(!r.small.length, `calm ${mode}: Calm text >= 12px (kiosk home >= 18px)` + (r.small.length ? " — " + r.small.slice(0, 8).join("; ") : ""));
    check(!r.tiny.length, `calm ${mode}: Calm controls >= 44px with their hit areas` + (r.tiny.length ? " — " + r.tiny.slice(0, 8).join("; ") : ""));
    const ct = await contrast(page), calmCards = Object.keys(r.drawn);
    // Calm's own nodes only (their classes carry the c- prefix; a card type Calm does not draw in some config keeps its own DOM)
    const bad = ct.findings.filter(f => calmCards.includes(String(f.card).replace(/^sheet:/, "")) && /\.c-|^b\.num/.test(f.el));
    check(!bad.length, `calm ${mode}: text contrast on the Calm cards >= 4.5:1 (large 3:1)` + (bad.length ? " — " + bad.slice(0, 6).map(f => `${f.card} "${f.text}" ${f.ratio}:1`).join("; ") : ""));
  }

  // ---- behaviour on scratch cards (calm, dark) ----
  await look("calm", true);
  await page.evaluate(async () => {
    const h = window.__hass, st = (id, state, attributes) => ({entity_id: id, state, attributes, last_changed: new Date().toISOString(), last_updated: "x"});
    const S = {
      "light.cm_a": st("light.cm_a", "on", {friendly_name: "Desk lamp", brightness: 128, color_mode: "color_temp", color_temp_kelvin: 2700, supported_color_modes: ["color_temp"], min_color_temp_kelvin: 2000, max_color_temp_kelvin: 6500}),
      "light.cm_b": st("light.cm_b", "off", {friendly_name: "Porch", supported_color_modes: ["color_temp"]}),
      "switch.cm_plug": st("switch.cm_plug", "off", {friendly_name: "Tree"}),
      "fan.cm_air": st("fan.cm_air", "on", {friendly_name: "Air purifier", percentage: 50, percentage_step: 25, supported_features: 1}),
      "media_player.cm_tv": st("media_player.cm_tv", "off", {friendly_name: "TV"}),
      "remote.cm_tv": st("remote.cm_tv", "off", {friendly_name: "TV remote"}),
    };
    Object.assign(h.states, S);
    const box = document.createElement("div"); box.id = "cm-box";
    box.style.cssText = "position:absolute;left:0;top:0;width:440px;display:grid;grid-template-columns:1fr 1fr;gap:8px;padding:8px;z-index:60;background:#10141d";
    const mk = (tag, cfg, full) => { const e = document.createElement(tag); e.setConfig(cfg); if (full) e.style.gridColumn = "1 / -1"; e.hass = h; box.append(e); return e; };
    window.__cm = {
      rock: mk("jam-light", {type: "custom:jam-light", entity: "light.cm_a", switch: "paddle"}),
      tog: mk("jam-light", {type: "custom:jam-light", entity: "light.cm_b", switch: "toggle"}),
      plug: mk("jam-tile", {type: "custom:jam-tile", entity: "switch.cm_plug"}),
      air: mk("jam-fan", {type: "custom:jam-fan", entity: "fan.cm_air"}, true),
      tv: mk("jam-tv", {type: "custom:jam-tv", media_player: "media_player.cm_tv", remote: "remote.cm_tv", name: "TV · Test"}, true),
    };
    document.body.append(box);
    window.scrollTo(0, 0);
    await new Promise(r => setTimeout(r, 300));
  });
  const calls = () => page.evaluate(() => window.__calls.length);
  const callsFrom = n => page.evaluate(n => window.__calls.slice(n), n);
  const q = (card, sel) => page.evaluateHandle(([card, sel]) => window.__cm[card].shadowRoot.querySelector(sel), [card, sel]);
  // the rocker
  let n0 = await calls();
  await (await q("rock", ".c-rk")).asElement().click();
  let c1 = await callsFrom(n0), pressed = await page.evaluate(() => window.__cm.rock.shadowRoot.querySelector(".c-rk").getAttribute("aria-pressed"));
  check(c1.length === 1 && c1[0].domain === "light" && c1[0].service === "turn_off" && pressed === "false",
    `calm rocker: a press turns the light off and the rocker flips at once (${JSON.stringify(c1)}, aria-pressed ${pressed})`);
  // switch: toggle on a light, jam-tile's switch, the purifier's switch
  n0 = await calls();
  await (await q("tog", ".jsw")).asElement().click();
  await (await q("plug", ".jsw")).asElement().click();
  await (await q("air", ".jsw")).asElement().click();
  c1 = await callsFrom(n0);
  const kinds = await page.evaluate(() => ["tog", "plug", "air"].map(k => window.__cm[k].shadowRoot.querySelector(".jsw").dataset.kind));
  check(c1.length === 3 && c1[0].service === "turn_on" && c1[0].domain === "light" && c1[1].domain === "homeassistant" && c1[1].service === "toggle" &&
    c1[2].domain === "fan" && c1[2].service === "turn_off" && kinds.join() === "plug,plug,climate",
    `calm small switches: light switch: toggle, a plug and the purifier call their services; kinds ${kinds.join(", ")} (${JSON.stringify(c1.map(c => c.domain + "." + c.service))})`);
  // the small switch's motion: 180 ms, instant without motion
  const mo = await page.evaluate(async () => {
    const th = window.__cm.plug.shadowRoot.querySelector(".jsw .th"), a = getComputedStyle(th).transitionDuration;
    window.JamCards.motion = false; const b = getComputedStyle(th).transitionDuration; window.JamCards.motion = true;
    return [a, b];
  });
  check(mo[0] === "0.18s" && mo[1] === "0s", `calm small switch: the thumb moves in 180 ms, instantly with JamCards.motion = false (${mo.join(" / ")})`);
  // the vertical fader: drag ~1 s, at most one call per 300 ms, the final value on release, no redraw under the finger
  await page.evaluate(() => { const r = window.__cm.rock; r.hass = {...window.__hass, states: {...window.__hass.states, "light.cm_a": {...window.__hass.states["light.cm_a"], state: "on"}}}; });
  await page.waitForTimeout(200);
  const vf = (await q("rock", ".c-vf")).asElement(), bb = await vf.boundingBox();
  await page.evaluate(() => { window.__cm.vf0 = window.__cm.rock.shadowRoot.querySelector(".c-vf"); });
  n0 = await calls();
  const t0 = Date.now();
  await page.mouse.move(bb.x + bb.width / 2, bb.y + bb.height * .8); await page.mouse.down();
  for (let i = 1; i <= 10; i++) {
    await page.mouse.move(bb.x + bb.width / 2, bb.y + bb.height * (.8 - i * .06));
    if (i === 5) await page.evaluate(() => { const c = window.__cm.rock; c.hass = {...window.__hass, states: {...window.__hass.states, "light.cm_a": {...window.__hass.states["light.cm_a"], last_updated: "y"}}}; });
    await page.waitForTimeout(100);
  }
  const during = await callsFrom(n0), same = await page.evaluate(() => window.__cm.rock.shadowRoot.querySelector(".c-vf") === window.__cm.vf0);
  const shown = await page.evaluate(() => +window.__cm.vf0.getAttribute("aria-valuenow"));
  const ms = Date.now() - t0;
  await page.mouse.up(); await page.waitForTimeout(150);
  const all = await callsFrom(n0), last = all[all.length - 1];
  check(during.length >= 2 && during.length <= Math.ceil(ms / 300) + 1 && all.every(c => c.domain === "light" && c.service === "turn_on") && last && last.data.brightness_pct === shown && same,
    `calm fader: ${during.length} calls in a ${ms} ms drag (<= one per 300 ms), the last = the shown ${shown} %, the card kept its fader under the finger (${same})`);
  // keys: one call per burst
  n0 = await calls();
  // (the card drew its real state after the release: the fake hass does not follow the calls)
  const v0 = await page.evaluate(() => { const f = window.__cm.rock.shadowRoot.querySelector(".c-vf"); f.focus(); return +f.getAttribute("aria-valuenow"); });
  for (let i = 0; i < 3; i++) await page.keyboard.press("ArrowDown");
  await page.waitForTimeout(400);
  const kc = await callsFrom(n0);
  check(kc.length === 1 && kc[0].data.brightness_pct === v0 - 15, `calm fader keys: three ArrowDown presses send one call, ${v0} -> ${v0 - 15} % (${JSON.stringify(kc.map(c => c.data))})`);
  // the TV off: Remote is there and works
  const tv = await page.evaluate(() => [...window.__cm.tv.shadowRoot.querySelectorAll("button.c-k")].map(b => [b.textContent.trim(), b.disabled]));
  check(tv.some(([t, d]) => t === "Remote" && !d) && tv.some(([t]) => t === "Turn on"), `calm TV off: Turn on + Remote (enabled) + Source (${JSON.stringify(tv)})`);
  await page.evaluate(() => [...window.__cm.tv.shadowRoot.querySelectorAll("button.c-k")].find(b => b.textContent.trim() === "Remote").click());
  await page.waitForTimeout(300);
  n0 = await calls();
  const rem = await page.evaluate(() => { const hs = [...document.querySelectorAll(".jam-sheet-host")], x = hs[hs.length - 1]; const sr = x && x.shadowRoot;
    const pw = sr && sr.querySelector('.c-remote [data-key="power"]'); if (pw) pw.click(); return {remote: !!(sr && sr.querySelector(".c-remote")), power: !!pw}; });
  await page.waitForTimeout(100);
  const rc = await callsFrom(n0);
  check(rem.remote && rem.power && rc.length === 1 && rc[0].domain === "remote" && rc[0].service === "toggle",
    `calm TV off: the Remote pop-up opens and its power key turns the TV on (${JSON.stringify(rc)})`);
  await page.keyboard.press("Escape"); await page.waitForTimeout(150);
  // ---- Poster: the same off TV keeps its Remote tab (all looks); no Calm node left anywhere ----
  await look("poster", true);
  await page.evaluate(async () => { const t = window.__cm.tv; t.hass = {...window.__hass, themes: {...window.__hass.themes}}; await new Promise(r => setTimeout(r, 300)); });
  const pst = await page.evaluate(() => {
    const k = [...window.__cm.tv.shadowRoot.querySelectorAll('.key[data-key="remote"]')];
    const left = []; const walk = n => { for (const e of n.querySelectorAll("*")) { if (e.classList && e.classList.contains("c-cm")) left.push(e); if (e.shadowRoot) walk(e.shadowRoot); } }; walk(document);
    return {remote: k.length === 1 && !k[0].disabled, left: left.length};
  });
  check(pst.remote, "jam-tv off (Poster and every look): the Remote tab stays on the off card");
  await page.evaluate(() => { document.getElementById("cm-box").remove(); delete window.__cm; for (const id of Object.keys(window.__hass.states)) if (/\.cm_/.test(id)) delete window.__hass.states[id]; });
  const left = await page.evaluate(() => { let n = 0; const walk = r => { for (const e of r.querySelectorAll("*")) { if (e.classList && e.classList.contains("c-cm")) n++; if (e.shadowRoot) walk(e.shadowRoot); } }; walk(document); return n; });
  check(left === 0 && pst.left >= 0, `calm: back under Poster no Calm node is left (${left})`);
  page.off("pageerror", onErr);
  check(!errs.length, "calm: no page errors" + (errs.length ? " — " + errs.slice(0, 4).join("; ") : ""));
};
