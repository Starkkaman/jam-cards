// Text contrast audit (theming plan R9, ported from the DOM pass of ../jam-home/preview/qa/run.js): every visible text
// in the jam cards of a page (shadow roots walked, sheets included) against its background, >= 4.5:1, or >= 3:1 for large
// text (>= 24px, or bold >= 18.66px). The background is the first opaque background up the composed tree (through shadow
// hosts), with translucent layers and the element's opacity blended; text over an image, a gradient or a background
// image cannot be measured from the DOM and is skipped (counted as `approx`), as are disabled controls (WCAG exempts
// them). The real-pixel pass stays in jam-home's QA; this one is cheap enough to run per look x mode.
// contrast(page) -> {texts, approx, findings: [{card, text, ratio, need, fg, bg, font}]}.
module.exports = page => page.evaluate(() => {
  const cv = document.createElement("canvas"); cv.width = cv.height = 1;
  const cx = cv.getContext("2d", {willReadFrequently: true}), cache = new Map();
  const rgba = s => {
    if (cache.has(s)) return cache.get(s);
    cx.clearRect(0, 0, 1, 1); cx.fillStyle = "rgba(0,0,0,0)"; cx.fillStyle = s; cx.fillRect(0, 0, 1, 1);
    const d = cx.getImageData(0, 0, 1, 1).data, v = [d[0], d[1], d[2], d[3] / 255];
    cache.set(s, v); return v;
  };
  const over = (f, b) => [0, 1, 2].map(i => f[i] * f[3] + b[i] * (1 - f[3])).concat(1);
  const lum = c => { const l = c.slice(0, 3).map(v => { v /= 255; return v <= .03928 ? v / 12.92 : ((v + .055) / 1.055) ** 2.4; }); return .2126 * l[0] + .7152 * l[1] + .0722 * l[2]; };
  const ratio = (a, b) => { const x = lum(a), y = lum(b); return (Math.max(x, y) + .05) / (Math.min(x, y) + .05); };
  const hex = c => "#" + c.slice(0, 3).map(v => Math.round(v).toString(16).padStart(2, "0")).join("");
  const parentOf = n => n.assignedSlot || n.parentElement || (n.parentNode && n.parentNode.host) || null;
  const pageBg = rgba(getComputedStyle(document.body).backgroundColor);
  const hidden = e => !e.checkVisibility || !e.checkVisibility({opacityProperty: true, visibilityProperty: true});
  const cardOf = e => { let c = null; for (let x = e; x; x = parentOf(x)) { if (x.localName && x.localName.startsWith("jam-")) c = x; if (x.classList && x.classList.contains("jam-sheet-host")) return c ? "sheet:" + c.localName : "sheet"; } return c ? c.localName : "?"; };
  const roots = [];
  const collect = (root, inCard) => {
    for (const e of root.querySelectorAll("*")) {
      if (!e.shadowRoot) continue;
      const jam = e.localName.startsWith("jam-") || e.classList.contains("jam-sheet-host") || e.classList.contains("jam-screensaver-layer");
      if (jam || inCard) { roots.push(e.shadowRoot); collect(e.shadowRoot, true); } else collect(e.shadowRoot, inCard);
    }
  };
  collect(document, false);
  const imgs = [];
  for (const r of roots) for (const m of r.querySelectorAll("img, canvas, video")) if (!hidden(m)) imgs.push(m.getBoundingClientRect());
  const seen = new Set(), findings = [];
  let texts = 0, approx = 0;
  for (const root of roots) {
    const tw = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    for (let t = tw.nextNode(); t; t = tw.nextNode()) {
      if (!t.data.trim()) continue;
      const e = t.parentElement;
      if (!e || seen.has(e) || e.localName === "style" || e.localName === "script" || hidden(e)) continue;
      seen.add(e);
      const rg = document.createRange(); rg.selectNodeContents(t);
      const rect = [...rg.getClientRects()].find(r => r.width > 1 && r.height > 1);
      if (!rect) continue;
      let dis = false; for (let x = e; x; x = parentOf(x)) if (x.matches && x.matches(":disabled, [aria-disabled=true]")) { dis = true; break; }
      if (dis) continue;
      texts++;
      const cs = getComputedStyle(e);
      let fg = rgba(e instanceof SVGElement ? cs.fill : (cs.webkitTextFillColor || cs.color)), op = 1, skip = false;
      const layers = [];
      for (let n = e; n; n = parentOf(n)) {
        const s = getComputedStyle(n);
        if (s.backgroundImage && s.backgroundImage !== "none") { skip = true; break; }
        // A face drawn by a ::before plate under the text (button.chip faces, jam-remote / jam-tv outlined keys): an
        // absolutely placed ::before covering the element (inset <= 6px) with a background is the layer under the text.
        const b = getComputedStyle(n, "::before");
        if (b.content !== "none" && b.position === "absolute" && ["top", "right", "bottom", "left"].every(k => /^-?\d+(\.\d+)?px$/.test(b[k]) && Math.abs(parseFloat(b[k])) <= 6)) {
          const pc = rgba(b.backgroundColor);
          if (b.backgroundImage !== "none") { skip = true; break; }
          if (pc[3] > 0) { layers.push(pc); if (pc[3] >= .999) break; }
        }
        const c = rgba(s.backgroundColor);
        if (c[3] > 0) { layers.push(c); if (c[3] >= .999) break; }
        else op *= +s.opacity;
      }
      if (!skip && imgs.some(r => !(r.right <= rect.left || r.left >= rect.right || r.bottom <= rect.top || r.top >= rect.bottom))) skip = true;
      if (skip) { approx++; continue; }
      let bg = layers.length && layers[layers.length - 1][3] >= .999 ? layers.pop() : pageBg;
      for (let i = layers.length - 1; i >= 0; i--) bg = over(layers[i], bg);
      fg = [fg[0], fg[1], fg[2], fg[3] * op];
      const fs = parseFloat(cs.fontSize), big = fs >= 24 || (+cs.fontWeight >= 700 && fs >= 18.66), need = big ? 3 : 4.5;
      const cr = ratio(over(fg, bg), bg);
      if (cr + 1e-6 < need) findings.push({card: cardOf(e), el: e.localName + (e.classList.length ? "." + [...e.classList].slice(0, 2).join(".") : ""),
        text: t.data.trim().slice(0, 30), ratio: +cr.toFixed(2), need, fg: hex(over(fg, bg)), bg: hex(bg), font: `${fs}px/${cs.fontWeight}`});
    }
  }
  return {texts, approx, findings};
});
