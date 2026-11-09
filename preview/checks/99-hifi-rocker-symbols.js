// The rocker's I / O symbols sit in the middle of their halves in every engine (1.1.2). Bug (Isaac 2026-11-08, the
// living-room iPad, iPadOS 17 WKWebView, Jam Cards 1.1.1): "The symbols on the paddles on the iPad kiosk look weird": the I
// stuck to the top of the upper half against the lamp band (it read like a "T") and the O sat right under the split. Cause:
// WebKit's UA style gives every <button> `align-items: flex-start` (Chromium dropped it), and the rocker is a <button> grid
// of two 1fr rows whose halves relied on the default stretch: in WebKit each half shrank to its symbol's height at the top of
// its row (the pressed tone filled only that small box). Fixed twice: the rocker sets align-items / justify-items: stretch
// (and its halves align-self: stretch), and core's button reset sets align-items: normal for every jam button.
// Fresh pages of the preview with WebKit's rule emulated (an author sheet `button{align-items:flex-start}` put first in every
// shadow root and the document, so like the UA rule it loses to any author rule that sets align-items), Hi-Fi Day and Night,
// at 1024x768 and 390x844, and once without the emulation: scratch jam-light cards (switch: paddle, on and off, normal and
// size: kiosk) and the group pop-up's mini rockers. Asserts per rocker: both halves fill their rows (each about half the
// rocker), each symbol's box is centred in its half (<= 1.5px both ways), the I and the O are the same size.
// Contract: module.exports = async (page, check) => {}.
const WEBKIT_UA = () => {
  const ua = new CSSStyleSheet(); ua.replaceSync("button{align-items:flex-start}");
  const d = Object.getOwnPropertyDescriptor(ShadowRoot.prototype, "adoptedStyleSheets");
  Object.defineProperty(ShadowRoot.prototype, "adoptedStyleSheets", {configurable: true, get() { return d.get.call(this); }, set(v) { d.set.call(this, [ua, ...[...v].filter(x => x !== ua)]); }});
  const at = Element.prototype.attachShadow;
  Element.prototype.attachShadow = function (o) { const r = at.call(this, o); d.set.call(r, [ua]); return r; };
  document.addEventListener("DOMContentLoaded", () => { const s = document.createElement("style"); s.textContent = "button{align-items:flex-start}"; document.head.prepend(s); });
};
module.exports = async (page, check) => {
  const url = page.url().replace(/\?.*$/, ""), browser = page.context().browser();
  for (const [w, h, mode, emu] of [[1024, 768, "dark", true], [1024, 768, "light", true], [390, 844, "dark", true], [1024, 768, "dark", false]]) {
    const p = await browser.newPage({viewport: {width: w, height: h}});
    const errs = []; p.on("pageerror", e => errs.push(e.message));
    if (emu) await p.addInitScript(WEBKIT_UA);
    await p.goto(url + `?mode=${mode}`);
    await p.waitForFunction(() => window.__ready);
    const r = await p.evaluate(async () => {
      const H = window.__hass, wait = ms => new Promise(res => setTimeout(res, ms));
      const box = document.createElement("div"); box.style.cssText = "display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:8px;padding:8px";
      document.body.prepend(box);
      const ids = ["light.kitchen_lamp", "light.tree"].filter(id => H.states[id]);
      const mk = (id, extra) => { const e = document.createElement("jam-light"); e.setConfig({type: "custom:jam-light", entity: id, switch: "paddle", ...extra}); e.hass = H; box.append(e); return e; };
      const cards = [...ids.map(id => mk(id)), ...ids.map(id => mk(id, {size: "kiosk"}))];
      const g = mk("light.living_room"); await wait(300);
      [...g.shadowRoot.querySelectorAll("button")].find(b => /open light controls/.test(b.getAttribute("aria-label") || "")).click();
      await wait(500);
      const R = e => e.getBoundingClientRect(), out = [];
      const measure = (rk, where) => {
        const q = R(rk), halves = [...rk.querySelectorAll(":scope > i")].map(i => { const a = R(i), s = R(i.querySelector("svg"));
          return {h: a.height, dy: (s.top + s.height / 2) - (a.top + a.height / 2), dx: (s.left + s.width / 2) - (a.left + a.width / 2), sw: Math.round(s.width * 10) / 10, sh: Math.round(s.height * 10) / 10}; });
        out.push({where, rk: Math.round(q.height), halves});
      };
      for (const c of [...cards, g]) { const rk = c.shadowRoot.querySelector(".c-rk"); if (rk) measure(rk, (c._config.size ? "kiosk " : "card ") + c._config.entity); }
      const hs = [...document.querySelectorAll(".jam-sheet-host")].pop();
      for (const rk of hs ? hs.shadowRoot.querySelectorAll(".c-rk.c-mini") : []) measure(rk, "member");
      return out;
    });
    const tag = `rocker symbols ${w}x${h} ${mode}${emu ? " (WebKit button rule)" : ""}`, bad = [];
    if (r.length < 7) bad.push(`${r.length} rockers, want >= 7`);
    for (const x of r) {
      const [a, b] = x.halves;
      if (!a || !b) { bad.push(`${x.where}: halves missing`); continue; }
      const inner = x.rk - 4; // the rim
      for (const [n, v] of [["I", a], ["O", b]]) {
        if (v.h < inner / 2 - 3) bad.push(`${x.where}: the ${n} half is ${Math.round(v.h)}px of ${x.rk} (not filling its row)`);
        if (Math.abs(v.dy) > 1.5 || Math.abs(v.dx) > 1.5) bad.push(`${x.where}: the ${n} sits ${Math.round(v.dx)} / ${Math.round(v.dy)}px off its half's centre`);
      }
      if (a.sw !== b.sw || a.sh !== b.sh) bad.push(`${x.where}: I ${a.sw}x${a.sh}, O ${b.sw}x${b.sh}`);
    }
    check(!bad.length && !errs.length, `${tag}: ${r.length} rockers (cards, kiosk, pop-up members), I and O centred in halves that fill their rows` + (bad.length || errs.length ? " — " + [...bad, ...errs].slice(0, 6).join("; ") : ""));
    await p.close();
  }
};
