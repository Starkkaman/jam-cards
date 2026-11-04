// Audit fixes (jam-home docs/audit, 2026-11-03): the state grammar (locks, Offline), the small-type floor, the look bugs
// and the opt-in options (jam-kiosk dock_state / attention / now_band / sheet_heading, jam-screensaver lock + alerts,
// jam-house attention, size kiosk for jam-light / jam-scenes / jam-fan, jam-speaker compact_idle). Cards are made on
// the page (no fixture section); other looks open their own pages (?look=). Runs on the Poster dark/1280 page.
// Writes preview/shots/optin/<look>-*.png (the opt-in features in Poster, Olympia and Transit).
// Contract: module.exports = async (page, check, helpers) => {}.
const path = require("path");
const fs = require("fs");
const OPT = path.join(__dirname, "..", "shots", "optin");

/* In-page helpers, installed once per page. */
const install = p => p.evaluate(() => {
  if (window.__au) return;
  const st = (id, state, attributes = {}) => ({entity_id: id, state, attributes, last_changed: "2026-10-28T20:00:00Z", last_updated: String(Math.random())});
  const L = c => { const v = String(c).match(/[\d.]+/g).slice(0, 3).map(x => { x /= 255; return x <= .03928 ? x / 12.92 : ((x + .055) / 1.055) ** 2.4; }); return .2126 * v[0] + .7152 * v[1] + .0722 * v[2]; };
  const ratio = (a, b) => { const x = L(a), y = L(b); return (Math.max(x, y) + .05) / (Math.min(x, y) + .05); };
  const extra = {
    "lock.au_door": st("lock.au_door", "locked", {friendly_name: "Front door"}),
    "light.au_lamp": st("light.au_lamp", "on", {friendly_name: "Lamp", brightness: 190, color_mode: "color_temp", color_temp_kelvin: 2700, supported_color_modes: ["color_temp"]}),
    "light.au_ceiling": st("light.au_ceiling", "on", {friendly_name: "Ceiling", brightness: 255, color_mode: "rgb", rgb_color: [80, 140, 255], supported_color_modes: ["rgb"]}),
    "light.au_floor": st("light.au_floor", "off", {friendly_name: "Floor lamp", supported_color_modes: ["color_temp"]}),
    "light.au_dead": st("light.au_dead", "unavailable", {friendly_name: "Boob light"}),
    "media_player.au_speaker": st("media_player.au_speaker", "idle", {friendly_name: "Living Room Speakers", media_title: "Saturn", media_artist: "The Olympians"}),
    "media_player.au_tv": st("media_player.au_tv", "off", {friendly_name: "Living TV"}),
    "sensor.au_aq": st("sensor.au_aq", "good", {friendly_name: "Air inside"}),
    "binary_sensor.au_leak": st("binary_sensor.au_leak", "off", {friendly_name: "Water leak", device_class: "moisture"}),
    "scene.au_movie": st("scene.au_movie", "2026-10-28T19:00:00Z", {friendly_name: "Movie"}),
    "scene.au_bright": st("scene.au_bright", "unknown", {friendly_name: "Bright"}),
    "scene.au_gone": st("scene.au_gone", "unavailable", {friendly_name: "Gone"}),
    "switch.au_plug": st("switch.au_plug", "unavailable", {friendly_name: "Plug"}),
  };
  window.__au = {st, ratio, states: extra,
    hass: () => ({...window.__hass, states: {...window.__hass.states, ...window.__au.states}}),
    set: (id, state, attrs) => { const o = window.__au.states[id]; window.__au.states[id] = {...o, state, attributes: {...o.attributes, ...(attrs || {})}, last_updated: String(Math.random())}; },
    mount: (tag, cfg, parent) => { const e = document.createElement(tag); e.setConfig(cfg); e.hass = window.__au.hass(); (parent || document.body).append(e); return e; },
    col: (node, v) => { const s = document.createElement("span"); s.style.color = v; node.append(s); const c = getComputedStyle(s).color; s.remove(); return c; },
  };
});
/* A page of another look (same harness URL, ?look= / ?mode=), viewport w x h, fixtures off (view=none). */
async function lookPage(page, look, mode, w, h) {
  const u = new URL(page.url());
  u.searchParams.set("mode", mode); u.searchParams.set("view", "none");
  if (look === "poster") u.searchParams.delete("look"); else u.searchParams.set("look", look);
  const p = await page.context().browser().newPage({viewport: {width: w, height: h}});
  await p.clock.setFixedTime(new Date("2026-10-28T14:41:00-07:00"));
  await p.goto(u.href);
  await p.waitForFunction(() => window.__ready);
  await p.evaluate(() => document.fonts.ready);
  await install(p);
  return p;
}
/* Kiosk config for the opt-in shots and checks. */
const KIOSK = {type: "custom:jam-kiosk", accent: "living", lock_entity: "lock.au_door", dock_state: "fill", now_band: true,
  attention: [{entity: "lock.au_door"}, {entity: "binary_sensor.au_leak", state: "on", text: "Water leak"}],
  now: [{type: "media", entity: "media_player.au_speaker", states: ["playing"]}, {type: "weather", entity: "weather.bungalo_weather"}],
  sheet_heading: false,
  dock: [
    {name: "Lights", accent: "living", columns: 2, state: {count_on: ["light.au_lamp", "light.au_ceiling", "light.au_floor", "light.au_dead"]},
      cards: [
        {type: "custom:jam-heading", title: "Living room"},
        {type: "custom:jam-light", entity: "light.au_lamp", size: "kiosk"}, {type: "custom:jam-light", entity: "light.au_ceiling", size: "kiosk"},
        {type: "custom:jam-light", entity: "light.au_floor", size: "kiosk"}, {type: "custom:jam-light", entity: "light.au_dead", size: "kiosk"},
        {type: "custom:jam-scenes", size: "kiosk", scenes: [{entity: "scene.au_movie"}, {entity: "scene.au_bright"}, {entity: "scene.au_gone"}]},
        {type: "custom:jam-fan", entity: "fan.vital_200s_series", size: "kiosk"},
      ]},
    {name: "TV", accent: "teal", state: {entity: "media_player.au_tv"}, cards: []},
    {name: "Music", accent: "violet", state: {entity: "media_player.au_speaker"}, cards: []},
    {name: "Door", accent: "none", state: {entity: "lock.au_door"}, cards: []},
    {name: "All off", accent: "none", state: {text: "Lights"}, tap_action: {action: "perform-action", perform_action: "light.turn_off"}},
  ]};
const SAVER = {type: "custom:jam-screensaver", idle_seconds: 3600, weather_entity: "weather.bungalo_weather", kicker: "The Bungalow · living room",
  accent: "living", lock_entity: "lock.au_door", alerts: [{entity: "binary_sensor.au_leak", state: "on", name: "Water leak"}],
  now: [{type: "media", entity: "media_player.au_speaker", states: ["playing"]}]};

module.exports = async (page, check) => {
  fs.mkdirSync(OPT, {recursive: true});
  await install(page);

  // ---------- A1: locks are never "on"; unlocked / open / jammed = alert, locked = quiet ----------
  const tones = await page.evaluate(() => {
    const J = window.JamCards, t = (id, state, a = {}) => J.tone({entity_id: id, state, attributes: a});
    return {unlocked: t("lock.x", "unlocked"), open: t("lock.x", "open"), jammed: t("lock.x", "jammed"), locked: t("lock.x", "locked"),
      locking: t("lock.x", "locking"), bare: J.tone({state: "unlocked"}), bsOn: t("binary_sensor.d", "on", {device_class: "lock"}),
      bsOff: t("binary_sensor.d", "off", {device_class: "lock"}), cover: t("cover.g", "open"), sw: t("switch.s", "on"),
      fmt: J.fmtState(window.__hass, {entity_id: "sensor.x", state: "unavailable", attributes: {}}), word: J.OFFLINE};
  });
  check(tones.unlocked === "alert" && tones.open === "alert" && tones.jammed === "alert" && tones.locked === "off" && tones.locking === "calm" &&
    tones.bare === "alert" && tones.bsOn === "alert" && tones.bsOff === "off" && tones.cover === "on" && tones.sw === "on",
    `state grammar: tone() lock unlocked/open/jammed = alert, locked = off, locking = calm, lock binary_sensor on = alert; cover open / switch on stay "on" (${JSON.stringify(tones)})`);
  check(tones.fmt === "Offline" && tones.word === "Offline", `state grammar: fmtState(unavailable) = "${tones.fmt}" (JamCards.OFFLINE)`);
  const locks = await page.evaluate(() => {
    const A = window.__au, out = {};
    const box = document.createElement("div"); box.style.cssText = "position:absolute;left:0;top:0;width:420px"; document.body.append(box);
    const tile = A.mount("jam-tile", {type: "custom:jam-tile", entity: "lock.au_door", control: "lock"}, box);
    const head = A.mount("jam-heading", {type: "custom:jam-heading", title: "Door", entities: ["lock.au_door"]}, box);
    const al = A.mount("jam-alerts", {type: "custom:jam-alerts", watch: ["lock.au_door"], show_unavailable_count: false}, box);
    const house = A.mount("jam-house", {type: "custom:jam-house", inside_entity: "sensor.serenity_cpuload", outside_entity: "weather.bungalo_weather", lock_entity: "lock.au_door"}, box);
    const read = () => {
      const tr = tile.shadowRoot, f = tr.querySelector(".face");
      const ch = head.shadowRoot.querySelector("button.chip"), row = al.shadowRoot.querySelector(".row.watch"), door = house.shadowRoot.querySelector('[data-role="door"]');
      return {tile: f.className.match(/s-\w+/)[0] + " " + (tr.querySelector(".val").className.match(/c-\w+/) || [""])[0] + " key " + (tr.querySelector(".sw").classList.contains("alert") ? "alert" : "plain"),
        chip: ch ? (ch.className.match(/t-\w+/) || [""])[0] : "none", row: row.classList.contains("bad") ? "bad" : "plain",
        door: door.className.replace("chip", "").trim() + ":" + door.textContent, doorBg: getComputedStyle(door, "::before").borderStyle};
    };
    const apply = () => { for (const e of [tile, head, al, house]) e.hass = A.hass(); };
    out.locked = read();
    A.set("lock.au_door", "unlocked"); apply(); out.unlocked = read();
    A.set("lock.au_door", "unavailable"); apply(); out.offline = read();
    A.set("lock.au_door", "locked"); box.remove();
    return out;
  });
  check(locks.locked.tile === "s-off c-dim key plain" && locks.locked.chip === "t-dim" && locks.locked.row === "plain" && locks.locked.door === ":Door locked",
    `state grammar: locked is quiet in jam-tile / jam-heading / jam-alerts / jam-house (${JSON.stringify(locks.locked)})`);
  check(locks.unlocked.tile === "s-alert c-alert key alert" && locks.unlocked.chip === "t-alert" && locks.unlocked.row === "bad" && locks.unlocked.door === "red:Door unlocked · lock",
    `state grammar: unlocked = alert in jam-tile (stripe, value, Lock key) / jam-heading chip / jam-alerts row / jam-house chip (${JSON.stringify(locks.unlocked)})`);
  check(locks.offline.door === "offline:Door offline" && locks.offline.doorBg === "dashed",
    `state grammar: an offline door chip is a dashed "Door offline", not the alert fill (${locks.offline.door}, ${locks.offline.doorBg})`);

  // ---------- A2: unavailable = "Offline" + a broken form, everywhere ----------
  const off = await page.evaluate(() => {
    const A = window.__au, box = document.createElement("div"); box.style.cssText = "position:absolute;left:0;top:0;width:420px"; document.body.append(box);
    const face = e => { const f = e.shadowRoot.querySelector(".host > .paper > .face"), cs = getComputedStyle(f); return {cls: f.className, bg: cs.backgroundColor, b: cs.borderTopStyle + " " + cs.borderLeftStyle}; };
    const tile = A.mount("jam-tile", {type: "custom:jam-tile", entity: "switch.au_plug"}, box);
    const btn = A.mount("jam-button", {type: "custom:jam-button", entity: "switch.au_plug", name: "Plug"}, box);
    const light = A.mount("jam-light", {type: "custom:jam-light", entity: "light.au_dead"}, box);
    const list = A.mount("jam-list", {type: "custom:jam-list", entities: ["switch.au_plug", "sensor.serenity_cpuload"]}, box);
    const sc = A.mount("jam-scenes", {type: "custom:jam-scenes", scenes: [{entity: "scene.au_gone"}, {entity: "scene.au_bright"}]}, box);
    const r = {tile: {...face(tile), v: tile.shadowRoot.querySelector(".val").textContent}, btn: face(btn), light: {...face(light), v: light.shadowRoot.querySelector(".pct").textContent},
      list: (() => { const row = list.shadowRoot.querySelector(".row.offline"); return row ? row.querySelector(".v").textContent + (row.querySelector(".tmk.t-offline") ? "+mark" : "") : "none"; })(),
      scenes: [...sc.shadowRoot.querySelectorAll(".scene")].map(b => (b.classList.contains("offline") ? "offline" : "ok") + ":" + getComputedStyle(b.querySelector(".sf")).outlineStyle)};
    // every visible text of the whole page: no "N/A" / "Unavailable" / "unavailable" words left
    const roots = [], walk = x => { roots.push(x); for (const e of x.querySelectorAll("*")) if (e.shadowRoot) walk(e.shadowRoot); }; walk(document);
    const words = [];
    for (const x of roots) for (const e of x.querySelectorAll("*")) {
      if (!e.getClientRects().length) continue;
      for (const n of e.childNodes) if (n.nodeType === 3 && /^(N\/A|unavailable|\d+ unavailable)$/i.test(n.textContent.trim())) words.push((x.host ? x.host.localName : "doc") + ": " + n.textContent.trim().slice(0, 30));
    }
    box.remove();
    return {...r, words};
  });
  const hollow = f => /\bunavail\b/.test(f.cls) && f.bg === "rgba(0, 0, 0, 0)" && f.b === "dashed dashed";
  check(off.tile.v === "Offline" && hollow(off.tile) && hollow(off.btn) && hollow(off.light) && off.light.v === "Offline",
    `state grammar: offline jam-tile / jam-button / jam-light = "Offline" on a hollow dashed face (${JSON.stringify([off.tile, off.btn, off.light])})`);
  check(off.list === "Offline+mark" && off.scenes.join(",") === "offline:dashed,ok:none",
    `state grammar: jam-list row "Offline" after the hollow mark (${off.list}); an unavailable scene is dashed, a never-run ("unknown") one is not (${off.scenes})`);
  check(off.words.length === 0, `state grammar: no "N/A" / "unavailable" words left on the preview page (${off.words.slice(0, 6).join("; ") || "none"})`);

  // ---------- A4: the small-type floor (labels >= 12px, chips >= 13px) and 44px keys, Poster 390 + 1280 ----------
  const small = async () => page.evaluate(() => {
    const roots = [], walk = x => { roots.push(x); for (const e of x.querySelectorAll("*")) if (e.shadowRoot) walk(e.shadowRoot); }; walk(document);
    const bad = new Set(); let n = 0;
    for (const r of roots) for (const e of r.querySelectorAll("*")) {
      if (!e.getClientRects().length || e.closest("[aria-hidden=true]")) continue;
      if (![...e.childNodes].some(x => x.nodeType === 3 && x.textContent.trim())) continue;
      const cs = getComputedStyle(e); if (cs.visibility === "hidden") continue;
      n++;
      const chip = !!e.closest(".chip"), fs = parseFloat(cs.fontSize);
      if (fs < (chip ? 13 : 12) - .01) bad.add(`${r.host ? r.host.localName : "doc"} ${e.localName}.${String(e.className).trim().split(/\s+/)[0]} ${fs}px`);
    }
    const scenes = [...document.querySelectorAll("#view jam-scenes")].flatMap(c => [...c.shadowRoot.querySelectorAll(".scene > .sf")].map(f => Math.round(f.getBoundingClientRect().height)));
    const legend = [...document.querySelectorAll("#view jam-graph")].flatMap(c => [...c.shadowRoot.querySelectorAll(".lg button")].map(b => Math.round(parseFloat(getComputedStyle(b, "::after").height))));
    return {n, bad: [...bad], scenes, legend};
  });
  for (const w of [390, 1280]) {
    await page.setViewportSize({width: w, height: 900}); await page.waitForTimeout(250);
    const s = await small();
    check(s.n > 200 && s.bad.length === 0, `type floor ${w}px: every visible text >= 12px, chips >= 13px (${s.n} texts)` + (s.bad.length ? " — " + s.bad.slice(0, 8).join("; ") + (s.bad.length > 8 ? ` (+${s.bad.length - 8})` : "") : ""));
    check(s.scenes.length > 0 && s.scenes.every(x => x >= 44) && s.legend.length > 0 && s.legend.every(x => x >= 44),
      `44px targets ${w}px: scene keys ${Math.min(...s.scenes)}px+, graph legend hits ${Math.min(...s.legend)}px+`);
  }
  await page.setViewportSize({width: 1280, height: 900}); await page.waitForTimeout(200);

  // ---------- A3: look bugs ----------
  {
    // New Wave (fx on, light): the lit jam-button is the ink block; '%' not in pixels; default partner not sticker yellow; mint now-playing sticker
    const p = await lookPage(page, "newwave", "light", 1280, 900);
    const nw = await p.evaluate(async () => {
      const A = window.__au, b = A.mount("jam-button", {type: "custom:jam-button", entity: "light.au_lamp", name: "Tree", accent: "living"});
      const l = A.mount("jam-light", {type: "custom:jam-light", entity: "light.au_lamp"});
      await new Promise(r => setTimeout(r, 400)); // the look pack is adopted after connect
      const kf = b.shadowRoot.querySelector(".kf"), lbl = b.shadowRoot.querySelector(".lbl"), cs = getComputedStyle(kf);
      const out = {fx: b.hasAttribute("data-fx"), bg: cs.backgroundColor, fg: A.col(b.shadowRoot, "var(--fg)"), lbl: getComputedStyle(lbl).color, slab: A.col(b.shadowRoot, "var(--slab)"),
        ratio: A.ratio(getComputedStyle(lbl).color, cs.backgroundColor), pct: getComputedStyle(l.shadowRoot.querySelector(".pct small")).fontFamily,
        t2: getComputedStyle(b.shadowRoot.querySelector(".host")).getPropertyValue("--nw-t2").trim()};
      b.remove(); l.remove();
      return out;
    });
    check(nw.fx && nw.bg === nw.fg && nw.lbl === nw.slab && nw.ratio >= 4.5,
      `New Wave (fx): a lit jam-button is the ink block with its label in the plane colour (${nw.bg} / ${nw.lbl}, ${nw.ratio.toFixed(1)}:1)`);
    check(!/Silkscreen/.test(nw.pct.split(",")[0]) && !/art-6/.test(nw.t2), `New Wave: the % of a light in the display face (${nw.pct.split(",")[0]}), default partner hue ${nw.t2} (not the sticker yellow)`);
    await p.close();
  }
  {
    // Transit (light): unlocked kiosk label readable on the page; a jam-heading inside a sheet reads on the sheet face
    const p = await lookPage(page, "transit", "light", 1024, 768);
    const tr = await p.evaluate(async () => {
      const A = window.__au; A.set("lock.au_door", "unlocked");
      const k = A.mount("jam-kiosk", {type: "custom:jam-kiosk", lock_entity: "lock.au_door", dock: [{name: "A", cards: [{type: "custom:jam-heading", title: "Living room"}]}, {name: "B", cards: []}]});
      await new Promise(r => setTimeout(r, 300));
      const lb = k.shadowRoot.querySelector(".lk .lbl"), lcs = getComputedStyle(lb);
      const label = A.ratio(lcs.color, lcs.backgroundColor === "rgba(0, 0, 0, 0)" ? getComputedStyle(document.body).backgroundColor : lcs.backgroundColor);
      k.shadowRoot.querySelector(".blk").click();
      await new Promise(r => setTimeout(r, 700));
      const host = [...document.querySelectorAll(".jam-sheet-host")].pop(), sr = host.shadowRoot, hd = sr.querySelector("jam-heading");
      const t = hd.shadowRoot.querySelector("h2"), face = getComputedStyle(sr.querySelector(".pop .face, .pop")).backgroundColor;
      const out = {label, heading: A.ratio(getComputedStyle(t).color, A.col(sr.querySelector(".pop"), "var(--slab)")), face};
      document.dispatchEvent(new KeyboardEvent("keydown", {key: "Escape"}));
      A.set("lock.au_door", "locked"); k.remove();
      return out;
    });
    check(tr.label >= 4.5 && tr.heading >= 4.5, `Transit light: unlocked kiosk label ${tr.label.toFixed(1)}:1 (was 1.52:1), jam-heading in a sheet ${tr.heading.toFixed(1)}:1 (was 1:1)`);
    await p.keyboard.press("Escape").catch(() => {});
    await p.close();
  }
  {
    // Olympia: the alert has its own colour (not the living hue) and a hatch; Braun: living is not the signal orange
    const p = await lookPage(page, "olympia", "light", 1280, 900);
    const ol = await p.evaluate(async () => {
      const A = window.__au; A.set("lock.au_door", "unlocked");
      const h = A.mount("jam-house", {type: "custom:jam-house", inside_entity: "sensor.serenity_cpuload", outside_entity: "weather.bungalo_weather", lock_entity: "lock.au_door", accent: "living"});
      await new Promise(r => setTimeout(r, 400));
      const r = h.shadowRoot, chip = r.querySelector('[data-role="door"]');
      const out = {red: A.col(r, "var(--red)"), living: A.col(r, "var(--living)"), ochre: A.col(r, "var(--ochre)"), hatch: getComputedStyle(chip, "::before").backgroundImage};
      A.set("lock.au_door", "locked"); h.remove(); return out;
    });
    check(ol.red !== ol.living && ol.red !== ol.ochre && /repeating-linear-gradient/.test(ol.hatch),
      `Olympia: alert ${ol.red} is not the living / default hue (${ol.living}), alert chips are hatched (${ol.hatch.slice(0, 40)})`);
    await p.close();
    const b = await lookPage(page, "braun", "light", 1280, 900);
    const br = await b.evaluate(async () => { const A = window.__au, h = A.mount("jam-heading", {type: "custom:jam-heading", title: "Living", accent: "living"}), r = h.shadowRoot;
      await new Promise(r => setTimeout(r, 400));
      const out = {rule: getComputedStyle(r.querySelector(".rule")).backgroundColor, ochre: A.col(r, "var(--ochre)")}; h.remove(); return out; });
    check(br.rule !== br.ochre, `Braun: the living room hue (${br.rule}) is not the orange signal (${br.ochre})`);
    await b.close();
  }
  {
    // Grid: no cell gaps under 12px cells; the 12 h kiosk clock in 24px cells on both kiosks
    for (const [w, h] of [[1024, 768], [961, 601]]) {
      const p = await lookPage(page, "grid", "light", w, h);
      const g = await p.evaluate(async () => {
        const A = window.__au; Object.assign(window.__hass, {locale: {language: "en", time_format: "12"}});
        const k = A.mount("jam-kiosk", {type: "custom:jam-kiosk", dock: [{name: "A", cards: []}, {name: "B", cards: []}]});
        const hs = A.mount("jam-house", {type: "custom:jam-house", inside_entity: "sensor.serenity_cpuload", outside_entity: "weather.bungalo_weather"});
        await new Promise(r => setTimeout(r, 400));
        const clock = k.shadowRoot.querySelector(".clock"), cell = clock._gn ? clock._gn.c : 0;
        const gaps = [...hs.shadowRoot.querySelectorAll(".gn")].filter(n => n._gn && n._gn.c < 12).map(n => {
          const d = n.querySelector("svg.gn-cells path").getAttribute("d"), m = /[hv]-?([\d.]+)/.exec(d); return n._gn.c + "/" + (m ? m[1] : "?"); });
        k.remove(); hs.remove(); return {cell, gaps};
      });
      check(g.cell === 24 && g.gaps.length > 0 && g.gaps.every(x => { const [c, s] = x.split("/"); return c === s; }),
        `Grid ${w}x${h}: 12 h kiosk clock in ${g.cell}px cells (on the 24px grid), small numerals without gaps (${g.gaps.join(", ")})`);
      await p.close();
    }
  }

  // ---------- B: opt-in options; defaults keep today's look ----------
  for (const look of ["poster", "olympia", "transit"]) for (const [w, h] of [[1024, 768], [961, 601]]) {
    const p = await lookPage(page, look, "dark", w, h);
    const tag = `${look} ${w}x${h}`;
    const k0 = await p.evaluate(async cfg => {
      const A = window.__au, wrap = document.createElement("div"); wrap.style.cssText = "padding:8px 16px 16px"; document.body.append(wrap);
      A.set("media_player.au_speaker", "playing");
      const k = A.mount("jam-kiosk", cfg, wrap); window.__k = k;
      await new Promise(r => setTimeout(r, 400));
      const r = k.shadowRoot, box = n => { const b = n.getBoundingClientRect(); return {l: b.left, t: b.top, r: b.right, b: b.bottom}; };
      const hit = (a, b) => a.l < b.r && b.l < a.r && a.t < b.b && b.t < a.b;
      const blocks = [...r.querySelectorAll(".blk")].map(b => ({cls: ["on", "out", "alert"].find(c => b.classList.contains(c)) || "-", ds: b.dataset.state, bg: getComputedStyle(b).backgroundColor,
        cnt: (b.querySelector(".dn") || {}).textContent || "", cntPx: b.querySelector(".dn") ? parseFloat(getComputedStyle(b.querySelector(".dn")).fontSize) : 0}));
      const band = r.querySelector(".band"), bt = r.querySelector(".band .bt"), clock = r.querySelector(".clock"), lk = r.querySelector(".lk"), now = r.querySelector(".now");
      const range = e => { const g = document.createRange(); g.selectNodeContents(e); const q = g.getBoundingClientRect(); return {l: q.left, t: q.top, r: q.right, b: q.bottom}; };
      return {blocks, band: band && band.childElementCount ? {txt: bt.textContent, px: parseFloat(getComputedStyle(bt).fontSize),
          over: [hit(range(bt), range(clock)) && "clock", hit(box(band), box(lk.querySelector(".disc"))) && "lock", hit(box(band), range(lk.querySelector(".lbl"))) && "lock label", hit(box(band), box(r.querySelector(".day"))) && "date"].filter(Boolean)} : null,
        now: now.dataset.source || "", scroll: document.scrollingElement.scrollHeight > innerHeight + 1};
    }, KIOSK);
    check(k0.blocks.map(b => b.cls).join(",") === "on,out,on,out,out" && k0.blocks.map(b => b.ds).join(",") === "on,off,on,off,action" && k0.blocks[0].cnt === "2" && k0.blocks[0].cntPx >= 64 && k0.blocks[1].bg === "rgba(0, 0, 0, 0)" && k0.blocks[4].bg === "rgba(0, 0, 0, 0)",
      `jam-kiosk dock_state fill ${tag}: Lights (2 on) and Music (playing) filled, TV off / Door locked / the action block outlined, count ${k0.blocks[0].cnt} at ${k0.blocks[0].cntPx}px (${k0.blocks.map(b => b.cls + ":" + b.bg).join(" ")})`);
    check(!!k0.band && k0.band.txt === "Saturn" && k0.band.px >= 64 && k0.band.over.length === 0 && k0.now === "weather:weather.bungalo_weather" && !k0.scroll,
      `jam-kiosk now_band ${tag}: "${k0.band && k0.band.txt}" at ${k0.band && k0.band.px}px in the top band, clear of clock / lock / date (${k0.band && k0.band.over.join(",")}), weather in the right block (${k0.now})`);
    if (w === 1024) await p.screenshot({path: path.join(OPT, `${look}-kiosk-fill-now-1024.png`)});
    const k1 = await p.evaluate(async () => {
      const A = window.__au, k = window.__k; A.set("lock.au_door", "unlocked"); k.hass = A.hass();
      await new Promise(r => setTimeout(r, 200));
      const r = k.shadowRoot, att = r.querySelector(".att"), lk = r.querySelector(".lk .disc"), a = att.getBoundingClientRect(), d = lk.getBoundingClientRect();
      const out = {shown: getComputedStyle(att).display !== "none", txt: att.textContent, px: parseFloat(getComputedStyle(att).fontSize), h: Math.round(a.height),
        clear: d.top >= a.bottom, band: !!r.querySelector(".band").childElementCount && getComputedStyle(r.querySelector(".band")).display !== "none",
        now: r.querySelector(".now").dataset.source || "", door: [...r.querySelectorAll(".blk")][3].className};
      window.__calls.length = 0; att.click();
      out.call = window.__calls.map(c => `${c.domain}.${c.service}:${JSON.stringify((c.target || {}).entity_id)}`).join(",");
      return out;
    });
    check(k1.shown && k1.txt === "Front door unlocked · tap to lock" && k1.h >= 64 && k1.clear && !k1.band && /media_player\.au_speaker/.test(k1.now) && /\balert\b/.test(k1.door) && k1.call === 'lock.lock:"lock.au_door"',
      `jam-kiosk attention ${tag}: "${k1.txt}" bar ${k1.h}px at ${k1.px}px, the lock under it (${k1.clear}), the band steps aside (media in the right block: ${k1.now}), Door block alert, tap = ${k1.call}`);
    if (w === 1024) await p.screenshot({path: path.join(OPT, `${look}-kiosk-attention-1024.png`)});
    // sheet: size kiosk lights / scenes / fan, no repeated jam-heading
    const sh = await p.evaluate(async () => {
      const A = window.__au, k = window.__k; A.set("lock.au_door", "locked"); k.hass = A.hass();
      k.shadowRoot.querySelector(".blk").click();
      await new Promise(r => setTimeout(r, 900));
      const host = [...document.querySelectorAll(".jam-sheet-host")].pop(), sr = host.shadowRoot;
      const roots = [], walk = x => { roots.push(x); for (const e of x.querySelectorAll("*")) if (e.shadowRoot) walk(e.shadowRoot); }; walk(sr);
      const small = new Set();
      for (const x of roots) for (const e of x.querySelectorAll("*")) {
        if (!e.getClientRects().length || e.closest("[aria-hidden=true]")) continue;
        if ([...e.childNodes].some(n => n.nodeType === 3 && n.textContent.trim()) && parseFloat(getComputedStyle(e).fontSize) < 18) small.add(`${x.host ? x.host.localName : "sheet"} ${e.localName}.${String(e.className).split(" ")[0]} ${getComputedStyle(e).fontSize}`);
      }
      const keys = [...sr.querySelectorAll("jam-scenes, jam-fan")].flatMap(c => [...c.shadowRoot.querySelectorAll(".scene > .sf, .seg .key > .face, .chips .key > .face")].map(f => Math.round(f.getBoundingClientRect().height)));
      const pw = [...sr.querySelectorAll("jam-light, jam-fan")].map(c => Math.round(c.shadowRoot.querySelector(".pw").getBoundingClientRect().width));
      const lights = [...sr.querySelectorAll("jam-light")].map(c => Math.round(c.getBoundingClientRect().height));
      const b = sr.querySelector(".body");
      return {heads: sr.querySelectorAll("jam-heading").length, small: [...small], keys, pw, lights, scroll: b.scrollHeight > b.clientHeight + 1};
    });
    check(sh.heads === 0 && sh.small.length === 0 && sh.keys.length > 0 && sh.keys.every(x => x >= 64) && sh.pw.every(x => x >= 64) && sh.lights.every(x => x >= 150),
      `size kiosk ${tag}: Lights sheet without the repeated jam-heading (${sh.heads}), nothing under 18px, keys ${Math.min(...sh.keys)}px+, power corners ${Math.min(...sh.pw)}px+, light cards ${Math.min(...sh.lights)}px+` +
      (sh.small.length ? " — " + sh.small.slice(0, 5).join("; ") : "") + (sh.scroll ? " (body scrolls)" : ""));
    if (w === 1024 || look === "poster") await p.screenshot({path: path.join(OPT, `${look}-kiosk-lights-sheet-${w}.png`)});
    await p.keyboard.press("Escape"); await p.waitForTimeout(200);
    // screensaver with the door: quiet when locked, loud when unlocked (+ an alert), both modes of the card, all layouts
    const ss = await p.evaluate(async cfg => {
      const A = window.__au; window.__k.remove();
      const e = A.mount("jam-screensaver", cfg); window.__ss = e; e._show();
      await new Promise(r => setTimeout(r, 300));
      const o = e.overlay, P = o.querySelector(".poster .al"), S = o.querySelector(".sdock .al");
      const quiet = {cls: P.className, txt: P.textContent};
      A.set("lock.au_door", "unlocked"); A.set("binary_sensor.au_leak", "on"); e.hass = A.hass();
      await new Promise(r => setTimeout(r, 100));
      const loud = {cls: P.className, txt: P.textContent, bg: getComputedStyle(P).backgroundColor, red: A.col(o, "var(--red)"), px: parseFloat(getComputedStyle(P.querySelector(".at")).fontSize)};
      const p = o.querySelector(".poster"), bad = [];
      const rect = n => n.getBoundingClientRect(), hit = (a, b) => a.left < b.right && b.left < a.right && a.top < b.bottom && b.top < a.bottom;
      for (let n = 0; n < 6; n++) {
        p.className = "poster l" + n + " " + ["", "r", "", "c", "", "r"][n];
        const t = rect(o.querySelector(".poster .txt")), al = rect(P);
        if (t.left < 0 || t.top < 0 || t.right > innerWidth + 1 || t.bottom > innerHeight + 1) bad.push(n + " outside");
        for (const s of [".time", ".date", ".wx", ".poster .np"]) { const x = o.querySelector(s); if (x && x.getClientRects().length && hit(al, rect(x))) bad.push(n + " over " + s); }
      }
      o.dataset.view = "images";
      const photo = {shown: S.getClientRects().length > 0, cls: S.className};
      o.dataset.view = "poster"; p.className = "poster l0 ";
      return {quiet, loud, bad, photo};
    }, SAVER);
    check(/\bquiet\b/.test(ss.quiet.cls) && ss.quiet.txt === "Front door · locked" && /\bloud\b/.test(ss.loud.cls) && ss.loud.txt === "Front door unlocked · Water leak" &&
      ss.loud.bg === ss.loud.red && ss.photo.shown && /\bloud\b/.test(ss.photo.cls) && ss.bad.length === 0,
      `jam-screensaver lock + alerts ${tag}: quiet "${ss.quiet.txt}", loud "${ss.loud.txt}" on the alert fill at ${ss.loud.px}px, also on photos (${ss.photo.cls}), inside the screen and clear of the clock in all 6 layouts` +
      (ss.bad.length ? " — " + ss.bad.join("; ") : ""));
    if (w === 1024) await p.screenshot({path: path.join(OPT, `${look}-screensaver-door-1024.png`)});
    await p.close();
  }
  {
    // Defaults: none of the options -> no attention bar, no band, no fill classes (live dashboards keep today's look)
    const d = await page.evaluate(() => {
      const A = window.__au, k = A.mount("jam-kiosk", {type: "custom:jam-kiosk", lock_entity: "lock.au_door", dock: [{name: "Lights", state: {count_on: ["light.au_lamp"]}, cards: []}, {name: "B", cards: []}]});
      const r = k.shadowRoot, out = {att: r.querySelectorAll(".att").length, band: r.querySelectorAll(".band").length, fill: r.querySelector(".k").classList.contains("dfill"),
        cls: [...r.querySelectorAll(".blk")].map(b => b.className).join("|"), cnt: r.querySelectorAll(".dn").length,
        ds: [...r.querySelectorAll(".blk")].map(b => b.dataset.state).join(",")};
      const L = A.mount("jam-light", {type: "custom:jam-light", entity: "light.au_dead"}), B = A.mount("jam-button", {type: "custom:jam-button", entity: "light.au_lamp"});
      const T = A.mount("jam-tile", {type: "custom:jam-tile", entity: "light.au_floor"});
      out.cards = [L, B, T].map(e => e.dataset.state).join(","); L.remove(); B.remove(); T.remove();
      const s = A.mount("jam-screensaver", {type: "custom:jam-screensaver", idle_seconds: 3600});
      out.al = s.overlay.querySelectorAll(".al").length;
      const hs = A.mount("jam-house", {type: "custom:jam-house", inside_entity: "sensor.serenity_cpuload", outside_entity: "weather.bungalo_weather", lock_entity: "lock.au_door"});
      out.house = hs.shadowRoot.querySelectorAll(".att").length;
      k.remove(); s.remove(); hs.remove(); return out;
    });
    check(d.ds === "on,off" && d.cards === "offline,on,off", `pack contract: dock blocks carry data-state without dock_state (${d.ds}); jam-light / jam-button / jam-tile hosts data-state (${d.cards})`);
    check(d.att === 0 && d.band === 0 && !d.fill && d.cnt === 0 && !/\b(on|out|alert)\b/.test(d.cls) && d.al === 0 && d.house === 0,
      `opt-ins default off: no attention bar / now band / fill dock / count on jam-kiosk, no door block on jam-screensaver, no attention strip on jam-house (${JSON.stringify(d)})`);
  }
  {
    // jam-house attention: invisible when all is well; door, offline lights, poor air
    const ha = await page.evaluate(() => {
      const A = window.__au, cfg = {type: "custom:jam-house", inside_entity: "sensor.serenity_cpuload", outside_entity: "weather.bungalo_weather", lock_entity: "lock.au_door",
        inside_aq: "sensor.au_aq", attention: {lights: ["light.au_lamp", "light.au_floor"]}};
      const h = A.mount("jam-house", cfg), items = () => [...h.shadowRoot.querySelectorAll('[data-role="attention"] button')].map(b => b.textContent);
      const out = {calm: items()};
      A.set("lock.au_door", "unlocked"); A.set("light.au_floor", "unavailable"); A.set("sensor.au_aq", "poor"); h.hass = A.hass();
      out.bad = items();
      const strip = h.shadowRoot.querySelector('[data-role="attention"]');
      out.first = strip.parentNode.firstElementChild === strip; out.keyH = Math.round(strip.querySelector("button").getBoundingClientRect().height);
      window.__calls.length = 0; strip.querySelector("button").click(); out.call = window.__calls.map(c => `${c.domain}.${c.service}`).join(",");
      A.set("lock.au_door", "locked"); A.set("light.au_floor", "off"); A.set("sensor.au_aq", "good"); h.remove();
      return out;
    });
    check(ha.calm.length === 0 && ha.bad.join(" | ") === "Door unlocked · lock | 1 light offline | Air poor inside" && ha.first && ha.keyH >= 44 && ha.call === "lock.lock",
      `jam-house attention: none while all is well; "${ha.bad.join(" | ")}" at the top, ${ha.keyH}px keys, door tap = ${ha.call}`);
  }
  {
    // jam-speaker compact_idle: one row while idle, the full card while playing / paused
    const sp = await page.evaluate(() => {
      const A = window.__au; A.set("media_player.au_speaker", "idle");
      const s = A.mount("jam-speaker", {type: "custom:jam-speaker", entity: "media_player.au_speaker", name: "Living room", compact_idle: true});
      const r = s.shadowRoot, idle = {row: !!r.querySelector(".cidle"), poster: !!r.querySelector(".poster"), h: Math.round(s.getBoundingClientRect().height), sub: (r.querySelector(".cs") || {}).textContent};
      A.set("media_player.au_speaker", "paused"); s.hass = A.hass();
      const paused = {row: !!r.querySelector(".cidle"), poster: !!r.querySelector(".poster")};
      s.remove(); return {idle, paused};
    });
    check(sp.idle.row && !sp.idle.poster && sp.idle.h <= 110 && sp.idle.sub === "Last played: Saturn · The Olympians" && !sp.paused.row && sp.paused.poster,
      `jam-speaker compact_idle: idle = one ${sp.idle.h}px row ("${sp.idle.sub}"), paused = the full poster card`);
  }
};
