/* Look pack: Pulsar (decided brief docs/looks/PULSAR.md, 2026-11-03). After Peter Saville / Factory Records: Unknown
   Pleasures (1979), Blue Monday and Power, Corruption & Lies (1983). The theme ("Jam Pulsar", tokens/looks/pulsar.mjs)
   sets the palette (black field / cream, white / black lines, one warm accent), the square shapes (every shape token none,
   a 1px rule border), Archivo 300 values and wide-tracked capitals, and slow fades; this pack draws what tokens cannot:
   - no fill boxes: keys, chips, tabs, tiles and strips are outlined with the 1px rule; "on" / "needs attention" = the warm
     accent as outline + text; the primary key (play) is inverted (text colour fill);
   - the "pulse": a level (slider, volume, light brightness, gauge bar) is a baseline with one ridge whose height is the
     level (--lv from the cards, 0..1) at the value's position; a gauge is a stack of ridge lines whose pulse height is
     the level; a graph is stacked ridgelines, one per series (motif "graph"); static, redrawn only when the value changes;
   - the colour code (Blue Monday floppy code) instead of icon squares: a name's first four letters on the 12-colour wheel
     (a..l, m..x; digits d*7) + one check square (motif "code": jam-heading, jam-button, jam-kiosk dock); a pressed dock
     block / button lights its code one square at a time (stepped, 120 ms per square);
   - motifs: empty = a small dim ridge stack, idleArt = an Unknown Pleasures field (seeded), flash = none, powerGlyph =
     a 1.5px stroke, screensaver = a ridge band on the black field (placed per layout, clear of the text);
   - the kiosk: thin wide-tracked clock, the accent bar becomes a ridge band across the poster.
   No continuous animation anywhere (kiosks): ridges are static SVG / clip-path shapes; motion is one-shot fades.
   Font: Archivo (SIL OFL 1.1, latin subset from Google Fonts, variable wght; the same file as Braun, declared 300-700). */
(() => {
  const NS = "http://www.w3.org/2000/svg";
  const svgEl = (tag, attrs) => { const n = document.createElementNS(NS, tag); for (const k in attrs) n.setAttribute(k, attrs[k]); return n; };
  /* The 12-colour wheel (brief): red, orange, amber, yellow, lime, green, teal, blue, indigo, violet, magenta, pink. */
  const WHEEL = ["#e5382d", "#f26b21", "#f7a823", "#f2d21b", "#9ec43c", "#2aa148", "#1aa59a", "#2e8fd8", "#2f4fb1", "#6a3fa0", "#b6449a", "#ec5a8a"];
  /* Wheel indices of a name: the first four letters (a..l -> 0..11, m..x -> 0..11, y z -> 0 1; a digit d -> d*7 mod 12)
     + a check square (the sum of all, mod 12). Accents fold to their letter; other characters are skipped. */
  function codeOf(name) {
    const v = [...String(name || "").normalize("NFD").toLowerCase().replace(/[^a-z0-9]/g, "")].map(ch => (ch >= "a" ? ch.charCodeAt(0) - 97 : +ch * 7));
    if (!v.length) return [];
    return [...v.slice(0, 4).map(x => x % 12), v.reduce((a, b) => a + b, 0) % 12];
  }
  function pulsarCode(name) {
    const c = codeOf(name);
    if (!c.length) return null;
    const box = el("span", "pcode"); box.setAttribute("aria-hidden", "true");
    c.forEach((k, i) => { const q = el("i", i === c.length - 1 ? "ck" : ""); q.style.background = WHEEL[k]; q.style.setProperty("--n", i); box.append(q); });
    return box;
  }
  /* One ridge line: n points over [0,1]; y = envelope (a peak in the middle) x smoothed seeded noise, 0..1 (1 = full). */
  const env = u => .07 + .93 * Math.exp(-Math.pow((u - .5) / .2, 2));
  function ridge(r, n, jag = .22) {
    const ctl = Array.from({length: 13}, () => r()), out = [];
    for (let k = 0; k <= n; k++) {
      const u = k / n, p = u * 12, i = Math.min(11, Math.floor(p)), f = p - i, s = f * f * (3 - 2 * f);
      const smooth = ctl[i] * (1 - s) + ctl[i + 1] * s, fine = r();
      out.push([u, env(u) * ((1 - jag) * (.35 + .65 * smooth) + jag * fine)]);
    }
    return out;
  }
  /* SVG of stacked ridges in a w x h box: rows lines, amplitude amp (px), the front (lower) lines hide those behind. */
  function ridgeStack(seedNum, {w = 200, h = 100, rows = 12, amp = 28, top = 26, bottom = 4, n = 48, jag = .22, x0 = 0, x1 = 1, cls = "pridges"} = {}) {
    const r = rng((seedNum >>> 0) ^ 0x2545f491), svg = svgEl("svg", {viewBox: `0 0 ${w} ${h}`, "aria-hidden": "true", class: cls, preserveAspectRatio: "none"});
    const gap = rows > 1 ? (h - top - bottom) / (rows - 1) : 0;
    for (let i = 0; i < rows; i++) {
      const base = top + i * gap, pts = ridge(r, n, jag).map(([u, y]) => [(x0 + u * (x1 - x0)) * w, base - y * amp]);
      const line = "M" + pts.map(p => p[0].toFixed(1) + " " + p[1].toFixed(1)).join("L");
      svg.append(svgEl("path", {d: `${line}L${(x1 * w).toFixed(1)} ${(base + 2).toFixed(1)}L${(x0 * w).toFixed(1)} ${(base + 2).toFixed(1)}Z`, class: "pf"}),
        svgEl("path", {d: line, class: "pl"}));
    }
    return svg;
  }
  /* The same stack as one static SVG for a CSS mask (the kiosk's ridge band: jam-kiosk draws a plain .bar div): every line
     is white and masked by the fills of the lines in front of it, so the mask holds only the visible line pixels. */
  function ridgeMask(seedNum, {w = 400, h = 100, rows = 10, amp = 30, top = 34, bottom = 3, n = 72, jag = .22, x0 = 0, x1 = 1} = {}) {
    const r = rng((seedNum >>> 0) ^ 0x2545f491), gap = rows > 1 ? (h - top - bottom) / (rows - 1) : 0, L = [], F = [];
    for (let i = 0; i < rows; i++) {
      const base = top + i * gap, pts = ridge(r, n, jag).map(([u, y]) => [(x0 + u * (x1 - x0)) * w, base - y * amp]);
      const line = "M" + pts.map(p => p[0].toFixed(1) + " " + p[1].toFixed(1)).join("L");
      L.push(line); F.push(`${line}L${(x1 * w).toFixed(1)} ${(base + 2).toFixed(1)}L${(x0 * w).toFixed(1)} ${(base + 2).toFixed(1)}Z`);
    }
    const masks = L.map((_, i) => `<mask id="m${i}"><rect width="${w}" height="${h}" fill="#fff"/>${F.slice(i + 1).map(d => `<path d="${d}" fill="#000"/>`).join("")}</mask>`).join("");
    const lines = L.map((d, i) => `<path d="${d}" mask="url(#m${i})" fill="none" stroke="#fff" stroke-width="1.2" vector-effect="non-scaling-stroke" stroke-linejoin="round"/>`).join("");
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" preserveAspectRatio="none"><defs>${masks}</defs>${lines}</svg>`;
    return `url("data:image/svg+xml,${encodeURIComponent(svg)}")`;
  }
  const KIOSK_BAND = ridgeMask(0x4b1d, {w: 600, h: 100, rows: 9, amp: 34, top: 40, bottom: 2, n: 90, x0: 0, x1: 1});
  /* empty: a small dim ridge stack (5 lines). */
  function pulsarEmpty(key) {
    const box = el("div", "arm pulse"), s = typeof key === "number" ? key >>> 0 : seed(key);
    box.setAttribute("aria-hidden", "true");
    box.append(ridgeStack(s, {w: 120, h: 44, rows: 5, amp: 14, top: 14, bottom: 3, n: 36}));
    return box;
  }
  /* idleArt: an Unknown Pleasures field (seeded), lines in the text colour on the card face. */
  function pulsarIdle(sd) {
    const box = el("div", "abs pidle");
    box.setAttribute("aria-hidden", "true");
    box.append(ridgeStack(sd >>> 0, {w: 100, h: 100, rows: 16, amp: 15, top: 24, bottom: 14, n: 50, x0: .2, x1: .8}));
    return box;
  }
  /* powerGlyph: a 1.5px stroke. */
  function pulsarPower() {
    const svg = svgEl("svg", {viewBox: "0 0 24 24", "aria-hidden": "true", fill: "none", stroke: "currentColor", "stroke-width": "1.5", "stroke-linecap": "square"});
    for (const d of ["M12 3.5v8", "M6.6 7.2a7.5 7.5 0 1 0 10.8 0"]) svg.append(svgEl("path", {d}));
    return svg;
  }
  /* flash: none (an empty hidden svg keeps the sheet code path). */
  function pulsarFlash() { return svgEl("svg", {viewBox: "0 0 1 1", "aria-hidden": "true"}); }
  /* screensaver: three hidden bar nodes (Poster's node count and order) + a ridge band placed per layout. */
  function pulsarScreensaver() {
    const out = ["b1 bar", "b2 bar", "b3 bar"].map(k => { const s = el("div", "sh " + k); s.setAttribute("aria-hidden", "true"); return s; });
    const band = el("div", "sh pband"); band.setAttribute("aria-hidden", "true");
    band.append(ridgeStack(0x5a71, {w: 400, h: 100, rows: 14, amp: 30, top: 26, bottom: 3, n: 80, x0: .12, x1: .88}));
    out.push(band);
    return out;
  }
  /* gauge: a stack of ridge lines whose pulse height is the level (level 0..1, or null when unavailable: flat, dim);
     a value in the gauge's red band draws in the warm accent ("needs attention"). */
  function pulsarGauge(level, band) {
    const lv = level == null ? 0 : Math.max(0, Math.min(1, level));
    const svg = ridgeStack(0x9a7c3, {w: 200, h: 104, rows: 9, amp: 3 + 46 * lv, top: 54, bottom: 4, n: 44, jag: .18, x0: .04, x1: .96, cls: "pridges pgauge"});
    if (level == null) svg.classList.add("dead");
    else if (band && band.col === "red") svg.classList.add("warm");
    return svg;
  }
  /* graph: stacked ridgelines, one per series (legend order top to bottom), each on its own scale; one series keeps the
     card's y scale (axis labels stay). Each line occludes the ones behind it. Returns the y scale per series. */
  function pulsarGraph(svg, d, g) {
    const n = d.series.length, top = g.mt, bot = g.H - g.mb, ys = [];
    const gap = n > 1 ? (bot - top) / (n + 1.5) : 0, A = n > 1 ? gap * 2.5 : bot - top; // ridges rise ~2.5 rows
    svg.classList.add(n > 1 ? "pstack" : "pone");
    d.series.forEach((pts, i) => {
      const base = top + A + i * gap;
      let lo = Infinity, hi = -Infinity;
      for (const p of pts) if (p[1] !== null) { lo = Math.min(lo, p[1]); hi = Math.max(hi, p[1]); }
      const y = n > 1 ? (v => base - (hi > lo ? (v - lo) / (hi - lo) : .5) * A * .94) : g.y;
      ys.push(y);
      const segs = [];
      let cur = null;
      for (const [t, v] of pts) {
        if (v === null) { cur = null; continue; }
        if (!cur) segs.push(cur = []);
        const xa = g.x(Math.max(d.t0, t));
        if (g.style === "bars") cur.push([xa, y(v)], [g.x(Math.min(d.t1, t + g.per)), y(v)]);
        else if (g.style === "step" && cur.length) cur.push([xa, cur[cur.length - 1][1]], [xa, y(v)]);
        else cur.push([xa, y(v)]);
      }
      const gp = svgEl("g", {class: "pser", "data-n": pts.length});
      for (const s of segs) {
        if (s.length === 1) s.push([s[0][0] + .1, s[0][1]]);
        const line = "M" + s.map(p => p[0].toFixed(1) + " " + p[1].toFixed(1)).join("L");
        gp.append(svgEl("path", {d: `${line}L${s[s.length - 1][0].toFixed(1)} ${(base + 1).toFixed(1)}L${s[0][0].toFixed(1)} ${(base + 1).toFixed(1)}Z`, class: "pf"}),
          svgEl("path", {d: line, class: "ln pl"}));
      }
      if (n > 1) gp.append(svgEl("rect", {x: g.ml - 14, y: (base - 3).toFixed(1), width: 6, height: 6, fill: `var(--s${i + 1})`, class: "psq"}));
      svg.append(gp);
    });
    return ys;
  }

  /* The ridge of a level: a bump centred on the value end of a .fill (or jam-light's .bs i), height = --lv x --rh. The
     polygon is an Unknown Pleasures pulse profile; ::before draws it in the line colour, ::after in the face colour 1.5px
     lower, so a thin line remains on top and the baseline is hidden under the bump. */
  const BUMP = "polygon(0 100%,10% 98%,18% 95%,25% 88%,31% 76%,36% 52%,40% 34%,44% 12%,48% 0,52% 16%,56% 6%,60% 36%,65% 62%,70% 80%,77% 91%,86% 97%,100% 100%)";
  const CSS = `
/* ---------- surfaces: outlined, no fill boxes ---------- */
.paper[data-cut=hero] > .face{border:1px solid var(--line)}
.paper.btn[data-cut] > .face{border:1px solid var(--line)}
.unavail{color:var(--dim)}
/* ---------- type: values and numerals 300, tabular ---------- */
.num,.pct,.big,.cur,.time,.temp,.otemp,.hi,.lo,.clock,.tt,.vol .v,.vn,.bigbar b,.kbar b,.val,.v{font-weight:300;font-variant-numeric:tabular-nums}
/* ---------- focus: 2px line in the text colour ---------- */
:focus-visible{outline-width:2px!important}
/* ---------- tone marks / stripes ---------- */
.stripe{border-left-width:var(--stripe-w)}
/* ---------- keys: outlined; on / alert = warm outline + warm text; primary (play) inverted ---------- */
.key > .face{background:transparent;color:var(--fg);border:1px solid var(--line)}
.key:not(:disabled):hover > .face{border-color:var(--fg)}
.key.on > .face{background:transparent;border-color:var(--acc);color:var(--alert-text)}
.key.alert > .face{background:transparent;border-color:var(--red);color:var(--alert-text)}
.ikey.main > .face,.dock .ikey.main > .face{background:transparent;border-color:var(--fg);color:var(--fg);box-shadow:inset 0 0 0 1px var(--fg)}
.key:disabled > .face{color:var(--dim);border-color:var(--line)}
.key.on:disabled > .face,.ikey.main:disabled > .face{background:transparent;border-color:var(--line);color:var(--dim)}
/* chips: outlined pills without fill */
.chip,.chip.red,.chip.home,.chip.hot,.chips .chip,.chips .chip.hot{--chip-bg:transparent}
.chip:not(button){box-shadow:inset 0 0 0 1px var(--line)}
button.chip::before{box-shadow:inset 0 0 0 1px var(--line)}
.chip.red,.chips .chip.hot,.chip.hot{color:var(--alert-text)}
.chip.red:not(button),.chip.hot:not(button){box-shadow:inset 0 0 0 1px var(--red)}
button.chip.red::before,button.chip.hot::before{box-shadow:inset 0 0 0 1px var(--red)}
.chip.home{color:var(--fg)}
:host(jam-hero) .chips .chip{color:var(--paper-fg)}
:host(jam-hero) .chips .chip.hot{color:var(--alert-text)}
/* ---------- the pulse: strips are a baseline with one ridge at the value, height = level ---------- */
.strip{inset:auto 0 6px 0;height:1px;background:var(--line);--rh:22px;--rb:56px}
.fill{inset:0 auto auto 0;height:1px;background:var(--fg);overflow:visible}
.fill::before,.fill::after,.bs i::before,.bs i::after,.bigbar i::before,.bigbar i::after,.mtrack .mb i::before,.mtrack .mb i::after{content:"";position:absolute;bottom:0;
  right:calc(var(--rb) / -2 * (1 - var(--lv,0)));width:var(--rb);height:calc(var(--lv,0) * var(--rh) + 1px);clip-path:${BUMP};pointer-events:none}
.fill::before,.bs i::before,.bigbar i::before,.mtrack .mb i::before{background:var(--fg)}
.fill::after,.bs i::after,.bigbar i::after,.mtrack .mb i::after{background:var(--pface,var(--slab));transform:translateY(1.5px)}
.muted .fill,.muted .fill::before{background:var(--dim)}
.track[role=slider]:hover .strip{background:var(--dim)}
/* ---------- motifs ---------- */
.pridges{display:block;overflow:visible}
.pridges .pf{fill:var(--pface,var(--slab));stroke:none}
.pridges .pl{fill:none;stroke:currentColor;stroke-width:1.2px;vector-effect:non-scaling-stroke;stroke-linejoin:round}
.arm.pulse.pulse.pulse{display:block;position:absolute;left:50%;top:50%;right:auto;bottom:auto;transform:translate(-50%,-50%);width:min(64%,220px);height:min(56%,84px);
  margin:0;padding:0;max-width:none;color:var(--dim)}
.arm.pulse svg{width:100%;height:100%}
.pidle{background:var(--slab);color:var(--fg)}
.pidle svg{width:100%;height:100%}
.pgauge{color:var(--fg)}
.pgauge.warm{color:var(--alert-text)}
.pgauge.dead{color:var(--dim)}
.jam-wash{display:none}
.spiral{display:none}
.jam-stamp > .face::before,.jam-stamp:not(.paper)::before{content:none}
/* ---------- colour code ---------- */
.pcode{display:inline-flex;gap:2px;align-items:center;flex:none;line-height:0;vertical-align:middle}
.pcode i{display:block;width:7px;height:7px}
.pcode i.ck{margin-left:4px}
/* a press lights the code one square at a time (stepped, 120 ms per square) */
.stamp .pcode i,.jam-stamp .pcode i,.pressing .pcode i,.press:active .pcode i{animation:pulsar-lit 120ms steps(1,end) backwards;animation-delay:calc(var(--n) * 120ms)}
@keyframes pulsar-lit{from{opacity:.12}to{opacity:1}}
/* a dock block's stamp lasts until its code is lit (5 x 120 ms), then oneShot clears it */
.blk.stamp{animation:pulsar-hold 600ms linear}
@keyframes pulsar-hold{from{opacity:.75}to{opacity:1}}
@keyframes pulsar-stamp{from{opacity:.6}to{opacity:1}}
/* ---------- motion: slow fades ---------- */
@keyframes pulsar-fade{from{opacity:0}to{opacity:1}}
@keyframes pulsar-press{to{transform:var(--press)}}

/* ---------- power corner: a 26px outlined square, thin glyph; on = warm ---------- */
.pw .tri{inset:10px 10px auto auto;width:26px;height:26px;background:none;box-shadow:inset 0 0 0 1px var(--line)}
.pw svg{right:15px;top:15px;width:16px;height:16px;color:var(--fg)}
.pw[aria-pressed=true] .tri{box-shadow:inset 0 0 0 1px var(--acc)}
.pw[aria-pressed=true] svg{color:var(--alert-text)}
.pw:disabled .tri{box-shadow:inset 0 0 0 1px var(--line)} .pw:disabled svg{color:var(--dim)}
.pw:focus-visible{outline-offset:-10px}
:host(jam-tv) .pw{background:none;color:var(--alert-text)}
:host(jam-tv) .pw::before{content:"";position:absolute;right:6px;top:6px;width:30px;height:30px;box-shadow:inset 0 0 0 1px var(--acc)}
:host(jam-tv) .pw.off{color:var(--fg)} :host(jam-tv) .pw.off::before{box-shadow:inset 0 0 0 1px var(--line)}
:host(jam-tv) .pw svg{right:13px;top:13px;width:16px;height:16px;color:inherit}
:host(jam-tv) .kiosk .pw::before{right:10px;top:10px;width:48px;height:48px}
:host(jam-tv) .kiosk .pw svg{right:22px;top:22px;width:24px;height:24px}

/* ---------- jam-light: the face stays black; a square in the light's colour before the name; the brightness ridge ---------- */
.lc.on > .face{background:var(--slab);color:var(--fg)}
.lc.on .sub{color:var(--dim)}
.lc .tap{padding-bottom:40px}
.lc.on .nm::before{content:"";flex:none;width:8px;height:8px;background:var(--lc)}
.lc.on.plate .top{margin:0;padding:0;background:none;color:inherit;clip-path:none}
.lc.on.plate .pct{margin-left:0;padding:0;background:none;color:inherit}
.lc .bs{left:14px;right:14px;bottom:10px;height:1px;background:var(--line);overflow:visible;--rh:24px;--rb:64px}
.lc .bs i{height:1px;background:var(--fg);clip-path:none;overflow:visible}
.lc .bands{top:auto;bottom:44px;right:14px;width:auto;height:8px;gap:3px;padding:0;background:none}
.lc .bands i{flex:none;width:8px;height:8px}
.lc .bands i[style*="slab2"]{background:transparent!important;box-shadow:inset 0 0 0 1px var(--dim)}
/* light pop-up: the brightness bar is a big ridge; whites / presets outlined */
.bigbar{background:transparent;border-bottom:1px solid var(--line);clip-path:none;overflow:visible;--rh:60px;--rb:120px}
.bigbar i{top:auto;bottom:-1px;height:1px;background:var(--fg);clip-path:none;overflow:visible}
.bigbar b,.bigbar.hi b{color:var(--fg);top:16px;transform:none}
.mtrack .mb{top:auto;bottom:4px;height:1px;background:var(--line);overflow:visible;--rh:14px;--rb:40px}
.mtrack .mb i{height:1px;background:var(--fg)!important;overflow:visible}
.kbar{background:transparent;border-bottom:1px solid var(--line)}
.kbar i{top:auto;height:3px}
.kbar b{background:transparent}
.wt > .face,.wp > .face{border:1px solid var(--line)}
.wt.on > .face{outline:1px solid var(--fg);outline-offset:-3px}
.wp.on > .face::after{border:1px solid var(--fg);inset:2px}
.wp b{left:8px;right:auto;max-width:calc(100% - 16px);padding:3px 6px 4px;background:var(--plate);color:var(--plate-fg)}
.hb{clip-path:none}
.mem{border-top:1px solid var(--line)}

/* ---------- jam-button: outlined; on = warm outline; the code replaces the icon ---------- */
.kf.on{background:var(--slab);color:var(--fg)}
.paper.btn.on > .face,.btn:has(.kf.on) > .face{border-color:var(--acc)}
.on .st{color:var(--dim)}
.kf .sq{background:none;color:var(--fg);clip-path:none;box-shadow:inset 0 0 0 1px var(--line)}
.kf .sq.coded{width:auto;height:auto;box-shadow:none;place-items:start}
.kf .sq.coded .ic{display:none}
.kf.on .sq{background:none;color:var(--fg)}

/* ---------- jam-heading: code before the title, thin rule ---------- */
.t > .pcode{margin-bottom:4px}
.t > .pcode i{width:9px;height:9px}

/* ---------- jam-tabs / jam-scenes / choices / lists ---------- */
.tab{background:transparent;color:var(--dim);box-shadow:inset 0 0 0 1px var(--line)}
.tab.on{background:transparent;color:var(--fg);box-shadow:inset 0 0 0 1px var(--fg)}
.tab::after{content:none}
.scene > .sf{background:transparent;box-shadow:inset 0 0 0 1px var(--line)}
.scene.on > .sf{background:transparent;color:var(--alert-text);box-shadow:inset 0 0 0 1px var(--acc)}
.opt > .face{border:1px solid var(--line)}
.opt.on > .face{border-color:var(--acc)}
.row + .row{border-top-width:1px}
.acc{height:1px}
.cnt{background:transparent;color:var(--alert-text);box-shadow:inset 0 0 0 1px var(--red)}

/* ---------- jam-gauge bar: the label and the value may wrap (wide-tracked label) ---------- */
:host(jam-gauge) .bar .row{flex-wrap:wrap}
/* ---------- jam-weather ---------- */
/* glyphs: the text colour (Poster's paper fill is this look's black face), rain dim, a bolt warm */
.gl{--g-sun:var(--fg);--g-paper:var(--fg);--g-rain:var(--dim);--g-bolt:var(--acc)}
.col > .face{background:transparent;box-shadow:inset 0 0 0 1px var(--line);--g-bg:var(--slab)}
.col .gl{--g-bg:var(--slab)}
.col.today > .face{background:transparent;color:var(--fg);box-shadow:inset 0 0 0 1px var(--fg);--g-sun:var(--fg);--g-paper:var(--fg);--g-rain:var(--dim);--g-bolt:var(--acc);--g-bg:var(--slab)}
.col.today .label,.col.today .lo{color:var(--dim)}
.span > .bar,.col.today .span > .bar{left:1px;right:1px;background:var(--slab);box-shadow:inset 0 0 0 1px var(--dim)}
.col.today .span > .bar{box-shadow:inset 0 0 0 1px var(--fg)}
.span::before,.col.today .span::before{left:3.5px;width:1px;background:var(--line)}

/* ---------- jam-graph: ridges ---------- */
.plot svg .pf{fill:var(--slab)}
.plot svg .pl{fill:none;stroke:var(--fg);stroke-width:1.3;stroke-linejoin:round;stroke-linecap:butt}
.pstack .rule,.pstack .ax[text-anchor=end]{display:none}
.rule{stroke:var(--line)}
.sq{width:7px;height:7px}
.tip{background:var(--slab);border:1px solid var(--line)}

/* ---------- jam-media / jam-tv / jam-speaker art and bands ---------- */
.art > .face,.art.paused > .face{background:var(--slab)}
.art img{filter:none;mix-blend-mode:normal}
.poster > .face,.poster.off > .face{background:var(--slab);color:var(--fg)}
:host(jam-tv) .poster.off > .face{box-shadow:inset 0 0 0 1px var(--line)}
.poster .prog{height:1px;background:var(--line)}
.poster .prog i{background:var(--fg)}
.tile > .face{background:transparent;color:var(--fg);border:1px solid var(--line)}
.tile.cur{outline:none}
.tile.cur > .face{background:transparent;border-color:var(--acc);color:var(--alert-text)}
.tile.home > .face{background:transparent}
.tile .now{background:transparent;color:var(--alert-text);box-shadow:inset 0 0 0 1px var(--acc)}
.pg{height:1px;background:var(--fg)}
.kprog .bar{height:1px;background:var(--line)}
.kprog .bar i{background:var(--fg)}

/* ---------- jam-remote: d-pad / rocker / outlined keys ---------- */
.pad > .paper > .face{background:var(--slab3)}
.pad > .paper:not(:disabled):hover > .face{background:var(--line)}
.pad .ok > .face,.pad .ok:not(:disabled):hover > .face{background:transparent;color:var(--fg)}
.pad .ok > .face::before{content:"";position:absolute;inset:1px;border-radius:50%;border:1px solid var(--fg);pointer-events:none}
.pad .tri{background:var(--fg)}
.ol > .face{background:transparent} .ol > .face::before{content:none}
.ol.on > .face{border-color:var(--acc);color:var(--alert-text)}
.sec .gh .pw.on > .face{background:transparent;border-color:var(--acc);color:var(--alert-text)}
.rock > .face{background:transparent;gap:4px}
.rock .key > .face{background:transparent;border:1px solid var(--line);color:var(--fg)}
.rock .key:disabled > .face{background:transparent;color:var(--dim)}

/* ---------- jam-speaker + Music Assistant panel ---------- */
.bk .shuf.on > .face,.kbk .shuf.on > .face,.bk .fav.on > .face,.kbk .fav.on > .face{background:transparent;border-color:var(--acc);color:var(--alert-text)}
.bk .fav > .face,.kbk .fav > .face{color:var(--fg)}
.side{--kbg:var(--slab)!important;--kfg:var(--fg)!important;--ktr:var(--line)!important;background:var(--slab);color:var(--fg);box-shadow:inset 1px 0 0 var(--line)}
.kart{background:var(--slab)}
.kt .ikey > .face,.kv .key > .face,.kbk .ikey > .face{background:transparent;color:var(--fg);border:1px solid var(--line)}
.kt .ikey.main > .face{background:transparent;color:var(--fg);border-color:var(--fg);box-shadow:inset 0 0 0 1px var(--fg)}
.kt .ikey:disabled > .face,.kv .key:disabled > .face{background:transparent;color:var(--dim)}
.khead .kk i{outline:none}
.kiosk .poster .prog{height:2px}
.kv .vt .strip{inset:auto 0 8px 0;height:1px;background:var(--line);--rh:30px;--rb:80px}
.kv .vt .fill{background:var(--fg)}
.kv .vn,.kv .vn.hi{color:var(--fg)}
.mu .tabs{border-bottom:1px solid var(--line)}
.mu .tabs button.on::before{height:1px;background:var(--fg)}
.pin.on::before{background:transparent;box-shadow:inset 0 0 0 1px var(--acc)}
.pin.on{color:var(--alert-text)}
.row .play > .face{background:transparent}
.sbar input{border:1px solid var(--line)}

/* ---------- sheets ---------- */
.veil{opacity:.82}
.t .label{color:var(--dim)}

/* ---------- jam-kiosk: thin wide-tracked clock, a ridge band across the poster, outlined dock blocks with codes ---------- */
.clock{font-weight:300;letter-spacing:.02em}
.k .date{font-weight:400}
.blk .st{letter-spacing:.16em}
.k .bar{height:clamp(56px,16cqh,128px);right:calc(clamp(24px,4cqw,44px) + min(10.5cqw,15.2cqh) + 40px);background:var(--fg);
  -webkit-mask:${KIOSK_BAND} 0 0/100% 100% no-repeat;mask:${KIOSK_BAND} 0 0/100% 100% no-repeat}
.blk,.blk.none{--bc:transparent;--bf:var(--fg);background:transparent;color:var(--fg);box-shadow:inset 0 0 0 1px var(--line)}
.host.light .blk.none{--bc:transparent;--bf:var(--fg)}
.blk .st,.blk.none .st,.host.light .blk.none .st{color:var(--dim)}
.blk .nm{font-weight:300}
.blk > .pcode i{width:10px;height:10px}
.blk > .pcode i.ck{margin-left:6px}
.blk:active{box-shadow:inset 0 0 0 1px var(--fg)}
.blk:focus-visible{outline:2px solid var(--focus);outline-offset:-6px}
.lk{--lk-bg:transparent;--lk-gl:var(--fg);--lk-tx:var(--fg)}
.host.light .lk:not(.alert):not(.off){--lk-gl:var(--fg)}
.lk .disc{box-shadow:inset 0 0 0 1px var(--fg)}
/* unlocked = the one warm fill (audit: a 1px warm ring was weaker than the locked ring) */
.lk.alert{--lk-bg:var(--red);--lk-gl:var(--on-fg);--lk-tx:var(--alert-text)}
.lk.alert .disc{box-shadow:none}
.lk.off .disc{border:1px dashed var(--dim);box-shadow:none}

/* ---------- offline (state grammar): no fill, the 1px rule dashed, dim text ---------- */
.paper[data-cut] > .face.unavail{background:none;border:1px dashed var(--dim);box-shadow:none}
.tmk.t-offline{--tc:transparent;box-shadow:inset 0 0 0 1px var(--dim)}

/* ---------- jam-screensaver: black field, ridge band, thin time ---------- */
.ov .time,.ov .tchip .tt{font-weight:300}
.sh.bar{display:none}
.sh.pband{background:none;color:var(--sfg);--pface:var(--ink);left:6vw;right:6vw;width:auto;height:30vh}
.sh.pband svg{width:100%;height:100%}
.l0 .pband,.l4 .pband,.l5 .pband{top:7vh} .l1 .pband,.l2 .pband,.l3 .pband{bottom:6vh}
.l2 .pband,.l3 .pband{height:24vh}
/* With a now-playing block the text column grows: the band shrinks to the edge strip away from it (audit: the ridges
   struck through the title). preview/fit.js checks text against motif shapes in every layout. */
.ov[data-now=on] .pband{height:13vh}
.ov[data-now=on] .l0 .pband,.ov[data-now=on] .l4 .pband,.ov[data-now=on] .l5 .pband{top:4vh}
.ov[data-now=on] .l1 .pband,.ov[data-now=on] .l2 .pband,.ov[data-now=on] .l3 .pband{bottom:3vh}
.tchip{background:transparent;color:var(--sfg);box-shadow:inset 0 0 0 1px var(--sdim)}
.tchip small{color:var(--sdim)}
.np .th{background:var(--ink);box-shadow:inset 0 0 0 1px var(--sdim)}
.np .th .arm span{background:var(--sfg)}
.sdock .np{background:var(--ink);box-shadow:inset 0 0 0 1px var(--line)}
.ov .kick{color:var(--sdim)}
.ov .temp{color:var(--sfg)}

/* ---------- failed action strip ---------- */
.jam-err{border:1px solid var(--line);border-left:var(--stripe-w) solid var(--red)}
/* jam-programme (Pulsar: every hue is the warm accent): lanes told apart by shape, not colour: lane variant 1 = outlined bands, 2 = half-height
   bands (the current band keeps its taller outline). */
:host(jam-programme) .lane[data-lv="1"] .bd{background:var(--slab);border:3px solid var(--bf)}
:host(jam-programme) .lane[data-lv="2"] .bd:not(.bnow){top:25%;bottom:25%}
`;

  registerLook({
    id: "pulsar",
    name: "Pulsar",
    fonts: [{family: "Archivo", weight: "300 700", file: "archivo-var-latin.woff2"}],
    css: CSS,
    motifs: {empty: pulsarEmpty, idleArt: pulsarIdle, powerGlyph: pulsarPower, flash: pulsarFlash, screensaver: pulsarScreensaver,
      code: pulsarCode, gauge: pulsarGauge, graph: pulsarGraph},
  });
})();
