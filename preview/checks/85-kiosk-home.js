// jam-kiosk 0.5.0 (fixture preview/fixtures/85-kiosk-home.js): the kiosk home screen "B · Poster + dock".
// On clean pages (?view=none, clock fixed at 2026-10-28 14:41 America/Los_Angeles) the fixture config is mounted alone
// at the iPad (1024x768) and Echo Show (961x601) viewports, dark + light:
//  - fits the viewport with no scroll, clock / now / dock sizes as in the mockup, nothing under 18px (computed font sizes)
//  - clock follows hass.locale (12 h "2:41" + small PM, 24 h "14:41", live switch on a new locale object)
//  - now-source fallback order (TV paused > speaker playing > weather), weather outlook from the hourly forecast
//    ("Rain at 3 · high 68°") or humidity without a forecast
//  - dock states: count_on ("3 on" / "All off"), media (app / title / Idle / Off), AQ word, text
//  - a sheet block opens a fullscreen sheet whose child cards get hass (and later updates); disconnect closes it
//  - the action block asks for confirmation (cancel = no call, OK = light.turn_off)
//  - a dock block stamps on press (one-shot class, removed afterwards)
// Writes preview/shots/kiosk-home-{dark,light}-{1024,961}.png + kiosk-home-sheet-dark-1024.png.
// Contract: module.exports = async (page, check, helpers) => {}; runs on the dark/1280 preview page, files in name order.
const path = require("path");

module.exports = async (page, check) => {
  const cfg = await page.evaluate(() => { const e = document.querySelector("#view jam-kiosk"); return e && JSON.parse(JSON.stringify(e._config)); });
  check(!!cfg, "jam-kiosk: fixture card on the preview page");
  if (!cfg) return;
  const browser = page.context().browser(), base = page.url().replace(/\?.*$/, "");
  const SIZES = [[1024, 768], [961, 601]];
  const errs = [];

  // Mounts the card like a sections view: 8px top / 16px side + bottom padding, theme ground behind it.
  const mount = async (w, h, mode, extra) => {
    const ctx = await browser.newContext({viewport: {width: w, height: h}, timezoneId: "America/Los_Angeles"});
    const p = await ctx.newPage();
    p.on("pageerror", e => errs.push(`${w}/${mode}: ${e.message}`));
    await p.clock.setFixedTime(new Date("2026-10-28T14:41:00-07:00"));
    await p.goto(`${base}?view=none&mode=${mode}`);
    await p.waitForFunction(() => window.__ready);
    await p.evaluate(([cfg, extra]) => {
      document.getElementById("view").remove();
      const h = window.__hass;
      Object.assign(h, {locale: {language: "en", time_format: "12"}, language: "en"}, extra || {});
      if (extra && extra.forecast) h.connection = {subscribeMessage(cb, msg) {
        window.__sub = msg; setTimeout(() => cb({type: "hourly", forecast: extra.forecast}), 5); return Promise.resolve(() => { window.__sub = null; }); }};
      const wrap = document.createElement("div"); wrap.style.cssText = "padding:8px 16px 16px";
      const e = document.createElement("jam-kiosk"); e.setConfig(cfg); e.hass = h;
      wrap.append(e); document.body.append(wrap);
    }, [cfg, extra || null]);
    await p.evaluate(() => document.fonts.ready);
    await p.waitForTimeout(300);
    return {ctx, p};
  };
  const set = (p, id, state, attrs) => p.evaluate(([id, state, attrs]) => {
    const h = window.__hass, o = h.states[id];
    h.states[id] = {...o, state, attributes: {...o.attributes, ...(attrs || {})}, last_updated: String(Math.random())};
    const k = document.querySelector("jam-kiosk"); k.hass = {...h}; window.__hass = k.hass;
  }, [id, state, attrs || null]);
  const read = p => p.evaluate(() => {
    const k = document.querySelector("jam-kiosk"), r = k.shadowRoot, q = s => r.querySelector(s);
    const now = q(".now");
    return {clock: q(".clock").textContent, small: (q(".clock small") || {}).textContent || "", date: q(".date").textContent,
      kick: now.childElementCount ? q(".kick").textContent : "", big: now.childElementCount ? q(".big").textContent : "",
      sml: now.childElementCount ? q(".small").textContent : "", src: now.dataset.source || "",
      states: [...r.querySelectorAll(".blk")].map(b => b.querySelector(".st").textContent)};
  });

  // ---------- layout, sizes, font floor, screenshots ----------
  for (const [w, h] of SIZES) for (const mode of ["dark", "light"]) {
    const {ctx, p} = await mount(w, h, mode);
    const m = await p.evaluate(() => {
      const k = document.querySelector("jam-kiosk"), r = k.shadowRoot, se = document.scrollingElement;
      const box = k.getBoundingClientRect(), fs = e => parseFloat(getComputedStyle(e).fontSize);
      const small = [];
      for (const e of r.querySelectorAll("*")) {
        const own = [...e.childNodes].some(n => n.nodeType === 3 && n.textContent.trim());
        if (own && e.getClientRects().length && fs(e) < 18) small.push(`${e.className}: ${fs(e)}px "${e.textContent.trim().slice(0, 20)}"`);
      }
      const over = [...r.querySelectorAll(".poster, .now, .left, .dock, .blk")].filter(e => e.scrollWidth > e.clientWidth + 1).map(e => e.className);
      const dock = r.querySelector(".dock").getBoundingClientRect(), bar = r.querySelector(".bar").getBoundingClientRect();
      const blk = [...r.querySelectorAll(".blk")].map(b => b.getBoundingClientRect());
      const clipped = [...r.querySelectorAll(".st")].filter(e => e.textContent && e.scrollHeight > e.clientHeight + 2).map(e => e.textContent);
      const gaps = blk.slice(1).map((b, i) => Math.round(b.left - blk[i].right));
      const rgb = c => (c.match(/\d+(\.\d+)?/g) || []).slice(0, 3).map(Number);
      const lum = c => { const l = rgb(c).map(v => { v /= 255; return v <= .04045 ? v / 12.92 : ((v + .055) / 1.055) ** 2.4; }); return .2126 * l[0] + .7152 * l[1] + .0722 * l[2]; };
      const ratio = (a, b) => { const x = lum(a), y = lum(b); return (Math.max(x, y) + .05) / (Math.min(x, y) + .05); };
      const page = getComputedStyle(document.body).backgroundColor, fgc = getComputedStyle(k).color;
      const none = [...r.querySelectorAll(".blk.none")].map(b => {
        const cs = getComputedStyle(b), st = getComputedStyle(b.querySelector(".st"));
        return {bg: cs.backgroundColor, fgOk: cs.color === (fgc === "rgb(20, 18, 16)" ? "rgb(236, 226, 201)" : fgc), vsPage: ratio(cs.backgroundColor, page), st: ratio(st.color, cs.backgroundColor)};
      });
      return {scrollH: se.scrollHeight, scrollW: se.scrollWidth, bottom: box.bottom, cardH: Math.round(box.height),
        clock: fs(r.querySelector(".clock")), big: fs(r.querySelector(".big")), nm: fs(r.querySelector(".nm")), dockH: Math.round(dock.height),
        bar: Math.round(bar.height), barBg: getComputedStyle(r.querySelector(".bar")).backgroundColor,
        equal: blk.every(b => Math.abs(b.width - blk[0].width) < 1 && Math.abs(b.top - blk[0].top) < 1), small, over, gaps, none, clipped};
    });
    const tag = `jam-kiosk ${w}x${h} ${mode}`;
    check(m.scrollH <= h && m.scrollW <= w && m.bottom <= h && m.bottom >= h - 20 && m.over.length === 0,
      `${tag}: fills the viewport without scrolling (card ${m.cardH}px, bottom ${Math.round(m.bottom)}, page ${m.scrollW}x${m.scrollH})` + (m.over.length ? " — overflows: " + m.over.join(", ") : ""));
    check(m.clock >= 150 && m.clock <= 200 && m.big >= 52 && m.big <= 60 && m.nm >= 32 && m.nm <= 36 && m.dockH === 120 && m.bar === 10 && m.equal,
      `${tag}: clock ${m.clock}px, now ${m.big}px, dock names ${m.nm}px, dock ${m.dockH}px of equal blocks, 10px accent bar`);
    check(m.clipped.length === 0, `${tag}: no dock state line is clipped` + (m.clipped.length ? " — " + m.clipped.join(", ") : ""));
    check(m.gaps.length > 0 && m.gaps.every(g => g === 6), `${tag}: 6px gaps between dock blocks (${m.gaps.join(",")})`);
    check(m.none.length > 0 && m.none.every(n => n.fgOk && n.st >= 4.5 && (mode === "dark" || n.vsPage >= 1.3)),
      `${tag}: "none" blocks: ${mode === "light" ? "ink block vs page ≥ 1.3:1, paper name" : "slab2, name in --jam-fg"}, state ≥ 4.5:1 (` +
      m.none.map(n => `${n.bg} page ${n.vsPage.toFixed(2)} state ${n.st.toFixed(2)}`).join("; ") + ")");
    check(m.small.length === 0, `${tag}: nothing under 18px` + (m.small.length ? " — " + m.small.slice(0, 5).join("; ") : ""));
    await p.screenshot({path: path.join(__dirname, "..", "shots", `kiosk-home-${mode}-${w}.png`)});
    await ctx.close();
  }

  // ---------- clock 12/24 h + now order + dock states ----------
  {
    const {ctx, p} = await mount(1024, 768, "dark");
    let s = await read(p);
    check(s.clock === "2:41PM" && s.small === "PM" && /^Wednesday · October 28 · 66° inside$/.test(s.date),
      `jam-kiosk clock 12 h: "${s.clock}" (small "${s.small}"), date "${s.date}"`);
    await p.evaluate(() => { const k = document.querySelector("jam-kiosk"); k.hass = {...window.__hass, locale: {language: "en", time_format: "24"}}; });
    s = await read(p);
    check(s.clock === "14:41" && s.small === "", `jam-kiosk clock 24 h after a locale change: "${s.clock}"`);
    // Weather without a forecast subscription: humidity.
    s = await read(p);
    check(s.src === "weather:weather.kh_weather" && s.kick === "Outside" && s.big === "51° cloudy" && s.sml === "Humidity 63%",
      `jam-kiosk now: TV off + speaker idle -> weather (${s.kick} | ${s.big} | ${s.sml})`);
    await set(p, "media_player.kh_speaker", "playing", {media_title: "Lobby", media_artist: "AERwave"});
    s = await read(p);
    check(s.src === "media:media_player.kh_speaker" && s.kick === "Playing" && s.big === "Lobby" && s.sml === "AERwave",
      `jam-kiosk now: speaker playing wins over weather (${s.kick} | ${s.big} | ${s.sml})`);
    await set(p, "media_player.kh_tv", "paused", {media_title: "Close Encounters of the Third Kind"});
    s = await read(p);
    check(s.src === "media:media_player.kh_tv" && s.kick === "On the TV" && s.big === "Close Encounters of the Third Kind" && s.sml === "Jamfin",
      `jam-kiosk now: TV paused wins over the speaker (${s.kick} | ${s.big} | ${s.sml})`);
    const lines = await p.evaluate(() => { const b = document.querySelector("jam-kiosk").shadowRoot.querySelector(".big"); return Math.round(b.getBoundingClientRect().height / parseFloat(getComputedStyle(b).fontSize) / .9); });
    check(lines <= 2, `jam-kiosk now: a long title is clamped to 2 lines (${lines})`);
    // Dock states.
    check(s.states.join("|") === "3 on|Close Encounters of the Third Kind|Lobby|Excellent|Lights", `jam-kiosk dock states: ${s.states.join(" | ")}`);
    await set(p, "media_player.kh_tv", "on", {media_title: null});
    await set(p, "media_player.kh_speaker", "idle");
    for (const id of ["light.kh_lamp", "light.kh_ceiling", "switch.kh_tree"]) await set(p, id, "off");
    s = await read(p);
    check(s.states.join("|") === "All off|Jamfin|Idle|Excellent|Lights", `jam-kiosk dock states after changes: ${s.states.join(" | ")}`);
    await set(p, "media_player.kh_tv", "off");
    await set(p, "sensor.kh_air_quality", "137");
    s = await read(p);
    check(s.states[1] === "Off" && s.states[3] === "Unhealthy for sensitive", `jam-kiosk dock: TV off -> "${s.states[1]}", AQI 137 -> "${s.states[3]}"`);
    // Stamp on press (one-shot, removed after the animation).
    const stamp = await p.evaluate(async () => {
      const b = document.querySelector("jam-kiosk").shadowRoot.querySelectorAll(".blk")[2];
      b.dispatchEvent(new PointerEvent("pointerdown", {bubbles: true, button: 0}));
      const on = b.classList.contains("stamp");
      await new Promise(r => setTimeout(r, 400));
      return {on, after: b.classList.contains("stamp")};
    });
    check(stamp.on && !stamp.after, `jam-kiosk: a dock block stamps on press and drops the class afterwards (${JSON.stringify(stamp)})`);
    // Action block: confirmation cancel -> nothing, OK -> light.turn_off on the list.
    const act = await p.evaluate(() => {
      const b = document.querySelector("jam-kiosk").shadowRoot.querySelectorAll(".blk")[4], out = [];
      for (const ok of [false, true]) {
        window.__calls.length = 0; let asked = "";
        window.confirm = t => { asked = t; return ok; };
        b.click();
        out.push({asked, calls: window.__calls.map(c => `${c.domain}.${c.service}`).join(",")});
      }
      return {out, sheets: document.querySelectorAll(".jam-sheet-host").length};
    });
    check(act.out[0].asked === "Turn off every light?" && act.out[0].calls === "" && act.out[1].calls === "light.turn_off" && act.sheets === 0,
      `jam-kiosk action block asks first: cancel -> no call, OK -> ${act.out[1].calls}`);
    await ctx.close();
  }

  // ---------- weather outlook from the hourly forecast ----------
  {
    const hr = (hh, condition, temperature) => ({datetime: `2026-10-28T${hh}:00:00-07:00`, condition, temperature});
    const forecast = [hr("14", "cloudy", 51), hr("15", "rainy", 60), hr("16", "rainy", 68), hr("17", "cloudy", 62), {datetime: "2026-10-29T13:00:00-07:00", condition: "sunny", temperature: 75}];
    const {ctx, p} = await mount(961, 601, "dark", {forecast});
    await p.waitForTimeout(100);
    const s = await read(p), sub = await p.evaluate(() => window.__sub);
    check(sub && sub.type === "weather/subscribe_forecast" && sub.forecast_type === "hourly" && s.sml === "Rain at 3 · high 68°",
      `jam-kiosk now: weather outlook from the hourly forecast ("${s.sml}")`);
    await p.evaluate(() => document.querySelector("jam-kiosk").remove());
    check(await p.evaluate(() => window.__sub === null), "jam-kiosk: forecast subscription released on disconnect");
    await ctx.close();
  }

  // ---------- fullscreen sheet ----------
  {
    const {ctx, p} = await mount(1024, 768, "dark");
    await p.evaluate(() => document.querySelector("jam-kiosk").shadowRoot.querySelectorAll(".blk")[0].click());
    await p.waitForTimeout(600);
    const sh = await p.evaluate(() => {
      const host = document.querySelector(".jam-sheet-host"), r = host && host.shadowRoot;
      if (!r) return null;
      const face = r.querySelector(".sheet > .face").getBoundingClientRect(), h2 = r.querySelector(".t h2"), close = r.querySelector(".close");
      const col = v => { const s = document.createElement("span"); s.style.color = v; r.append(s); const c = getComputedStyle(s).color; s.remove(); return c; };
      const kids = [...r.querySelector(".body").children];
      return {full: r.querySelector(".pop").classList.contains("full"), face: [face.left, face.top, face.width, face.height].map(Math.round),
        title: h2.textContent, titleCol: getComputedStyle(h2).color, acc: col("var(--ochre)"), fg: col("var(--fg)"), kick: r.querySelector(".kick").textContent,
        close: close.getBoundingClientRect().height, closeFs: parseFloat(getComputedStyle(close.querySelector(".face")).fontSize),
        cols: getComputedStyle(r.querySelector(".body")).gridTemplateColumns.split(" ").length,
        kids: kids.map(k => k.localName), fed: kids.every(k => k.hass === window.__hass && k.shadowRoot && k.shadowRoot.textContent.length > 0)};
    });
    check(!!sh && sh.full && sh.face.join() === "0,0,1024,768" && sh.title === "Lights" && sh.titleCol === sh.fg && sh.titleCol !== sh.acc && sh.kick === "Living room" &&
      sh.close >= 56 && sh.closeFs >= 18 && sh.cols === 2,
      `jam-kiosk sheet block opens a fullscreen sheet (${sh && sh.face}), title in --fg, kicker, CLOSE ${sh && Math.round(sh.close)}px, ${sh && sh.cols} columns`);
    check(!!sh && sh.kids.join() === "jam-light,jam-light,jam-tile" && sh.fed, `jam-kiosk sheet children get hass (${sh && sh.kids})`);
    await p.screenshot({path: path.join(__dirname, "..", "shots", "kiosk-home-sheet-dark-1024.png")});
    const upd = await p.evaluate(() => {
      const k = document.querySelector("jam-kiosk"), h = {...window.__hass};
      k.hass = h;
      const kids = [...document.querySelector(".jam-sheet-host").shadowRoot.querySelector(".body").children];
      const fed = kids.every(c => c.hass === h);
      document.querySelector(".jam-sheet-host").shadowRoot.querySelector(".close").click();
      return {fed, open: document.querySelectorAll(".jam-sheet-host").length};
    });
    check(upd.fed && upd.open === 0, `jam-kiosk sheet: later hass updates reach the children; CLOSE closes it (${JSON.stringify(upd)})`);
    const gone = await p.evaluate(async () => {
      const k = document.querySelector("jam-kiosk");
      k.shadowRoot.querySelectorAll(".blk")[2].click();
      await new Promise(r => setTimeout(r, 50));
      const opened = document.querySelectorAll(".jam-sheet-host").length;
      k.remove();
      return {opened, left: document.querySelectorAll(".jam-sheet-host").length};
    });
    check(gone.opened === 1 && gone.left === 0, `jam-kiosk: removing the card closes its open sheet (${JSON.stringify(gone)})`);
    await ctx.close();
  }
  check(errs.length === 0, "jam-kiosk: no page errors on the kiosk pages" + (errs.length ? ": " + errs.slice(0, 3).join("; ") : ""));
};
