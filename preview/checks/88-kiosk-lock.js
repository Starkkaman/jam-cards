// jam-kiosk 0.6.2 lock button (fixture preview/fixtures/85-kiosk-home.js, lock_entity lock.kh_door). On clean pages
// (?view=none, clock fixed at 2026-10-28 14:41 America/Los_Angeles) at the iPad (1024x768) and Echo Show (961x601) viewports:
//  - the disc exists only with lock_entity; it is a circle (border-radius 50%, width = height), ≈104px / ≈88px
//  - top-right: right edge on the accent bar's right edge, just under the bar
//  - disc + label never overlap the clock, date / facts lines, the "now" block or the dock (dark + light, now = weather
//    and now = a long 2-line TV title)
//  - locked: --fg disc, ground-colour glyph, closed shackle, "FRONT DOOR · LOCKED"; unlocked: red disc, ink glyph ≥ 4.5:1,
//    open shackle, label in --alert-text; transitional / jammed / open words; unavailable: outline only, dim, "—"
//  - tap locked -> confirmation "Unlock the front door?" (cancel = no call, OK = lock.unlock); tap unlocked -> lock.lock
//    at once; unavailable -> nothing; keyboard Enter works; stamp on press; aria-label
// Writes preview/shots/kiosk-home-unlocked-{dark,light}-1024.png.
const path = require("path");

module.exports = async (page, check) => {
  const cfg = await page.evaluate(() => { const e = document.querySelector("#view jam-kiosk"); return e && JSON.parse(JSON.stringify(e._config)); });
  if (!cfg || !cfg.lock_entity) { check(false, "jam-kiosk lock: fixture card has lock_entity"); return; }
  const browser = page.context().browser(), base = page.url().replace(/\?.*$/, "");
  const errs = [];
  const mount = async (w, h, mode, conf) => {
    const ctx = await browser.newContext({viewport: {width: w, height: h}, timezoneId: "America/Los_Angeles"});
    const p = await ctx.newPage();
    p.on("pageerror", e => errs.push(`${w}/${mode}: ${e.message}`));
    await p.clock.setFixedTime(new Date("2026-10-28T14:41:00-07:00"));
    await p.goto(`${base}?view=none&mode=${mode}`);
    await p.waitForFunction(() => window.__ready);
    await p.evaluate(conf => {
      document.getElementById("view").remove();
      const h = window.__hass;
      Object.assign(h, {locale: {language: "en", time_format: "12"}, language: "en"});
      const wrap = document.createElement("div"); wrap.style.cssText = "padding:8px 16px 16px";
      const e = document.createElement("jam-kiosk"); e.setConfig(conf); e.hass = h;
      wrap.append(e); document.body.append(wrap);
    }, conf || cfg);
    await p.evaluate(() => document.fonts.ready);
    await p.waitForTimeout(300);
    return {ctx, p};
  };
  const set = (p, id, state, attrs) => p.evaluate(([id, state, attrs]) => {
    const h = window.__hass, o = h.states[id];
    h.states[id] = {...o, state, attributes: {...o.attributes, ...(attrs || {})}, last_updated: String(Math.random())};
    const k = document.querySelector("jam-kiosk"); k.hass = {...h}; window.__hass = k.hass;
  }, [id, state, attrs || null]);
  const measure = p => p.evaluate(() => {
    const k = document.querySelector("jam-kiosk"), r = k.shadowRoot, q = s => r.querySelector(s);
    const rgb = c => (c.match(/\d+(\.\d+)?/g) || []).slice(0, 3).map(Number);
    const lum = c => { const l = rgb(c).map(v => { v /= 255; return v <= .04045 ? v / 12.92 : ((v + .055) / 1.055) ** 2.4; }); return .2126 * l[0] + .7152 * l[1] + .0722 * l[2]; };
    const ratio = (a, b) => { const x = lum(a), y = lum(b); return (Math.max(x, y) + .05) / (Math.min(x, y) + .05); };
    const col = v => { const s = document.createElement("span"); s.style.color = v; r.append(s); const c = getComputedStyle(s).color; s.remove(); return c; };
    const disc = q(".lk .disc"), lbl = q(".lk .lbl");
    if (!disc) return null;
    const rect = e => { const b = e.getBoundingClientRect(); return {l: b.left, t: b.top, r: b.right, b: b.bottom, w: b.width, h: b.height}; };
    const d = rect(disc), lb = rect(lbl), bar = rect(q(".bar"));
    // Ink of the text runs, not the boxes: clock / day / facts are measured by their text ranges.
    const textRect = e => { if (!e || !e.textContent.trim()) return null; const rg = document.createRange(); rg.selectNodeContents(e); const b = rg.getBoundingClientRect(); return {l: b.left, t: b.top, r: b.right, b: b.bottom}; };
    const others = {clock: textRect(q(".clock")), day: textRect(q(".day")), facts: textRect(q(".date")),
      now: q(".now").childElementCount ? rect(q(".now")) : null, dock: rect(q(".dock"))};
    const hit = (a, b) => b && a.l < b.r && b.l < a.r && a.t < b.b && b.t < a.b;
    const overlaps = Object.entries(others).filter(([, o]) => hit(d, o) || hit(lb, o)).map(([n]) => n);
    const dcs = getComputedStyle(disc), svg = disc.querySelector("svg");
    const pageBg = getComputedStyle(document.body).backgroundColor;
    return {d, lb, bar, overlaps, radius: dcs.borderRadius, bg: dcs.backgroundColor, glyph: getComputedStyle(svg).color,
      fg: col("var(--fg)"), red: col("var(--red)"), alertText: col("var(--alert-text)"), dim: col("var(--dim)"), pageBg,
      border: dcs.borderTopWidth + " " + dcs.borderTopStyle + " " + dcs.borderTopColor, shape: disc.dataset.glyph,
      label: lbl.textContent, labelCol: getComputedStyle(lbl).color, labelFs: parseFloat(getComputedStyle(lbl).fontSize), upper: getComputedStyle(lbl).textTransform,
      labelLines: Math.round(lb.h / parseFloat(getComputedStyle(lbl).lineHeight)), aria: disc.getAttribute("aria-label"), tag: disc.localName,
      glyphRatio: ratio(getComputedStyle(svg).color, dcs.backgroundColor), labelRatio: ratio(getComputedStyle(lbl).color, pageBg),
      shadow: dcs.boxShadow, bgImage: dcs.backgroundImage};
  });

  // ---------- no lock_entity, no disc ----------
  {
    const conf = {...cfg}; delete conf.lock_entity;
    const {ctx, p} = await mount(1024, 768, "dark", conf);
    const n = await p.evaluate(() => document.querySelector("jam-kiosk").shadowRoot.querySelectorAll(".lk, .disc").length);
    check(n === 0, `jam-kiosk lock: no lock button without lock_entity (${n})`);
    const bad = await p.evaluate(c => { try { document.createElement("jam-kiosk").setConfig({...c, lock_entity: "light.x"}); return false; } catch (e) { return true; } }, cfg);
    check(bad, "jam-kiosk lock: lock_entity must be a lock.* entity");
    await ctx.close();
  }

  // ---------- geometry, colours, glyph, label at both sizes, dark + light ----------
  for (const [w, h, want] of [[1024, 768, 104], [961, 601, 88]]) for (const mode of ["dark", "light"]) {
    const {ctx, p} = await mount(w, h, mode);
    const tag = `jam-kiosk lock ${w}x${h} ${mode}`;
    // Locked, now = weather.
    let m = await measure(p);
    check(!!m && m.tag === "button" && m.radius === "50%" && Math.abs(m.d.w - m.d.h) < 0.5 && Math.abs(m.d.w - want) <= 3,
      `${tag}: round button ${m && Math.round(m.d.w)}x${m && Math.round(m.d.h)}px (≈${want}), border-radius ${m && m.radius}`);
    check(Math.abs(m.d.r - m.bar.r) <= 1 && m.d.t >= m.bar.b + 4 && m.d.t <= m.bar.b + 32 && Math.abs(m.lb.r - m.bar.r) <= 1 && m.lb.t >= m.d.b,
      `${tag}: top-right, right edge on the accent bar (${Math.round(m.d.r)} / ${Math.round(m.bar.r)}), ${Math.round(m.d.t - m.bar.b)}px under it, label under the disc`);
    check(m.overlaps.length === 0, `${tag}: clear of clock, date, facts, now and dock (weather)` + (m.overlaps.length ? " — overlaps " + m.overlaps.join(", ") : ""));
    check(m.bg === m.fg && m.shape === "closed" && m.glyphRatio >= 4.5 && m.label === "Front door · Locked" && m.upper === "uppercase" &&
      m.labelFs >= 18 && m.labelLines === 1 && m.labelCol === m.fg && m.shadow === "none" && m.bgImage === "none",
      `${tag}: locked = --fg disc (${m.bg}), glyph ${m.glyph} ${m.glyphRatio.toFixed(1)}:1, closed shackle, label "${m.label}" ${m.labelFs}px uppercase, no shadow/gradient`);
    check(m.aria === "Front door, Locked", `${tag}: aria-label "${m.aria}"`);
    // Unlocked + a long 2-line TV title in the now block.
    await set(p, "lock.kh_door", "unlocked");
    await set(p, "media_player.kh_tv", "paused", {media_title: "Close Encounters of the Third Kind"});
    m = await measure(p);
    check(m.bg === m.red && m.shape === "open" && m.glyphRatio >= 4.5 && m.label === "Front door · Unlocked" && m.labelCol === m.alertText && m.labelRatio >= 4.5,
      `${tag}: unlocked = red disc (${m.bg}), glyph ${m.glyphRatio.toFixed(1)}:1, open shackle, label "${m.label}" in --alert-text ${m.labelRatio.toFixed(1)}:1`);
    check(m.overlaps.length === 0, `${tag}: clear of clock, date, facts, now and dock (2-line TV title, unlocked label)` + (m.overlaps.length ? " — overlaps " + m.overlaps.join(", ") : ""));
    if (w === 1024) await p.screenshot({path: path.join(__dirname, "..", "shots", `kiosk-home-unlocked-${mode}-1024.png`)});
    await set(p, "media_player.kh_tv", "off", {media_title: null});
    // Unavailable: outline only, dim, "—".
    await set(p, "lock.kh_door", "unavailable");
    m = await measure(p);
    check(m.bgImage === "none" && /^rgba\(0, 0, 0, 0\)$|transparent/.test(m.bg) && m.border.startsWith("4px solid") && m.border.endsWith(m.dim) &&
      m.glyph === m.dim && m.label === "—" && m.labelCol === m.dim && m.aria === "Front door, Unavailable",
      `${tag}: unavailable = dim outline (${m.border}), dim glyph, label "${m.label}"`);
    await set(p, "lock.kh_door", "locked");
    await ctx.close();
  }

  // ---------- state words, taps, keyboard, stamp ----------
  {
    const {ctx, p} = await mount(961, 601, "dark");
    const words = [];
    for (const st of ["locking", "unlocking", "jammed", "open", "unknown"]) { await set(p, "lock.kh_door", st); const m = await measure(p); words.push(`${st}:${m.label}:${m.bg === m.red ? "red" : m.bg === m.fg ? "fg" : "none"}`); }
    check(words.join("|") === "locking:Front door · Locking…:red|unlocking:Front door · Unlocking…:red|jammed:Front door · Jammed:red|open:Front door · Open:red|unknown:—:none",
      `jam-kiosk lock: state words + tones ${words.join(" | ")}`);
    // Narrow label slot: falls back to the state alone.
    const short = await p.evaluate(() => {
      const r = document.querySelector("jam-kiosk").shadowRoot, l = r.querySelector(".lk .lbl");
      l.style.maxWidth = "120px"; document.querySelector("jam-kiosk")._lockFit(); const t = l.textContent; l.style.maxWidth = ""; document.querySelector("jam-kiosk")._lockFit();
      return {t, back: l.textContent};
    });
    await set(p, "lock.kh_door", "locked");
    const s2 = await p.evaluate(() => { const r = document.querySelector("jam-kiosk").shadowRoot, l = r.querySelector(".lk .lbl"); l.style.maxWidth = "120px"; document.querySelector("jam-kiosk")._lockFit(); const t = l.textContent; l.style.maxWidth = ""; document.querySelector("jam-kiosk")._lockFit(); return {t, back: l.textContent}; });
    check(s2.t === "Locked" && s2.back === "Front door · Locked" && short.t === "—", `jam-kiosk lock: label falls back to the state when the long form does not fit ("${s2.t}", back to "${s2.back}")`);
    const tap = async (ok) => p.evaluate(ok => {
      const d = document.querySelector("jam-kiosk").shadowRoot.querySelector(".lk .disc");
      window.__calls.length = 0; let asked = null;
      window.confirm = t => { asked = t; return ok; };
      d.click();
      return {asked, calls: window.__calls.map(c => `${c.domain}.${c.service}:${JSON.stringify((c.target || {}).entity_id || (c.data || {}).entity_id)}`).join(",")};
    }, ok);
    const no = await tap(false), yes = await tap(true);
    check(no.asked === "Unlock the front door?" && no.calls === "" && yes.asked === "Unlock the front door?" && yes.calls === 'lock.unlock:"lock.kh_door"',
      `jam-kiosk lock: tap locked asks "${no.asked}" (cancel -> no call, OK -> ${yes.calls})`);
    await set(p, "lock.kh_door", "unlocked");
    const un = await tap(true);
    check(un.asked === null && un.calls === 'lock.lock:"lock.kh_door"', `jam-kiosk lock: tap unlocked locks at once, no confirmation (${un.calls})`);
    await set(p, "lock.kh_door", "unavailable");
    const na = await tap(true);
    check(na.asked === null && na.calls === "", `jam-kiosk lock: tap unavailable does nothing (${JSON.stringify(na)})`);
    await set(p, "lock.kh_door", "unlocked");
    await p.evaluate(() => { window.__calls.length = 0; document.querySelector("jam-kiosk").shadowRoot.querySelector(".lk .disc").focus(); });
    await p.keyboard.press("Enter");
    await p.keyboard.press("Space");
    const kb = await p.evaluate(() => window.__calls.map(c => `${c.domain}.${c.service}`).join(","));
    check(kb === "lock.lock,lock.lock", `jam-kiosk lock: keyboard Enter / Space trigger it (${kb})`);
    const stamp = await p.evaluate(async () => {
      const d = document.querySelector("jam-kiosk").shadowRoot.querySelector(".lk .disc");
      d.dispatchEvent(new PointerEvent("pointerdown", {bubbles: true, button: 0}));
      const on = d.classList.contains("stamp");
      await new Promise(r => setTimeout(r, 400));
      return {on, after: d.classList.contains("stamp")};
    });
    check(stamp.on && !stamp.after, `jam-kiosk lock: stamps on press and drops the class afterwards (${JSON.stringify(stamp)})`);
    await ctx.close();
  }
  check(errs.length === 0, "jam-kiosk lock: no page errors" + (errs.length ? ": " + errs.slice(0, 3).join("; ") : ""));
};
