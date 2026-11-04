/* Look pack: Grid (after Wim Crouwel: the New Alphabet, 1967, and the Stedelijk Museum posters; decided brief
   docs/looks/GRID.md). The theme ("Jam Grid", tokens/looks/grid.mjs) sets the palette (white / black ground, one signal
   colour, the secondary blue as the focus token), the page grid (HA lovelace-background), square shapes with a 1px ink
   hairline, Hanken Grotesk in mixed case and no motion; this pack draws what tokens cannot:
   - cell numerals: big numbers (light %, the light pop-up's brightness, kiosk / screensaver / weather clocks, temperatures,
     gauge and graph values) are drawn as 5x7 grid cells (squares, 45-degree cut cells on round strokes; digits, %, :, .,
     -, degree) through the root hook motif "decorateRoot" (core look hooks, lookDecorateRoot). The real text stays in the DOM in a
     visually hidden span (screen readers, find, the contrast audit read it); the cells are an aria-hidden SVG. A value
     that has other characters (Off, N/A, a dash) stays Hanken text; non-numeral units (small PM, °F, kWh) stay text after
     the cells. When a value changes the numeral rebuilds cell by cell (stepped, 30 ms per cell, the whole rebuild at most
     300 ms; none with reduced motion or JamCards.motion = false), otherwise nothing moves;
   - jam-light on: a white face with the signal top edge, the brightness as a row of 10 grid cells (filled black: ceil(%/10)),
     group members as small filled squares under the power square; no colour flood, no plates;
   - keys, chips, dock blocks and the power corner as outlined squares (on / active = the signal fill, black text);
   - motifs: empty = a seeded block of grid cells, idleArt = one New Alphabet digit on a cell grid with one signal cell,
     flash = none, powerGlyph = a square-capped 2px stroke, screensaver = the page grid behind the cell clock.
   Font: Hanken Grotesk (SIL OFL 1.1, latin subset from Google Fonts, variable wght 100-900) from <asset base>fonts/. */
(() => {
  const NS = "http://www.w3.org/2000/svg";
  const svgEl = (tag, attrs) => { const n = document.createElementNS(NS, tag); for (const k in attrs) n.setAttribute(k, attrs[k]); return n; };

  /* ---------- cell numerals ---------- */
  /* Glyphs on a 5 x 7 cell grid (narrower for : . - and the degree sign): # = full cell; q p b d = a cell cut at 45 degrees
     (q: bottom-right half, p: bottom-left half, b: top-right half, d: top-left half), as in the approved mockup (v8-grid). */
  const GLYPHS = {
    "0": ["q###p", "#...#", "#...#", "#...#", "#...#", "#...#", "b###d"],
    "1": ["q##..", "..#..", "..#..", "..#..", "..#..", "..#..", "..#.."],
    "2": ["q###p", "....#", "....#", "q###d", "#....", "#....", "#####"],
    "3": ["####p", "....#", "....#", ".####", "....#", "....#", "####d"],
    "4": ["#...#", "#...#", "#...#", "b####", "....#", "....#", "....#"],
    "5": ["#####", "#....", "#....", "####p", "....#", "....#", "####d"],
    "6": ["q###.", "#....", "#....", "####p", "#...#", "#...#", "b###d"],
    "7": ["####p", "....#", "....#", "....#", "....#", "....#", "....#"],
    "8": ["q###p", "#...#", "#...#", "#####", "#...#", "#...#", "b###d"],
    "9": ["q###p", "#...#", "#...#", "b####", "....#", "....#", "####d"],
    "%": ["##..#", "##.#.", "...#.", "..#..", ".#...", ".#.##", "#..##"],
    ":": [".", ".", "#", ".", "#", ".", "."],
    ".": [".", ".", ".", ".", ".", ".", "#"],
    "-": ["...", "...", "...", "###", "...", "...", "..."],
    "°": ["q#p", "#.#", "b#d", "...", "...", "...", "..."],
  };
  const norm = s => String(s).replace(/[−‒–]/g, "-").replace(/[   ]/g, " ").trim();
  const drawable = s => s !== "" && [...s].every(c => c === " " || c in GLYPHS);
  /* str -> {m: Map("x,y" -> cell type), w: columns}; a space advances one empty column. */
  function layout(str) {
    let x = 0; const m = new Map();
    for (const ch of str) {
      const g = GLYPHS[ch];
      if (!g) { x += 1; continue; }
      g.forEach((row, y) => [...row].forEach((c, i) => { if (c !== ".") m.set((x + i) + "," + y, c); }));
      x += g[0].length + 1;
    }
    return {m, w: Math.max(0, x - 1)};
  }
  const cellPath = (t, x, y, s) =>
    t === "#" ? `M${x} ${y}h${s}v${s}h${-s}z` : t === "q" ? `M${x + s} ${y}v${s}h${-s}z` : t === "p" ? `M${x} ${y}l${s} ${s}h${-s}z`
      : t === "b" ? `M${x} ${y}h${s}v${s}z` : `M${x} ${y}h${s}l${-s} ${s}z`;
  /* Big-number hooks (one selector for every root; each class pair belongs to one card): jam-light .pct + its pop-up's
     brightness value, jam-kiosk .clock, jam-weather / jam-screensaver .time + .temp, the screensaver time chip .tt,
     jam-house .temp / .otemp, jam-gauge .big, jam-graph .cur. Tails (units that are not numerals) stay text. */
  const SEL = ".pct.num,.bigbar > b.num,.clock.num,.time.num,.tt.num,.temp.num,.otemp.num,.big.num,.cur.num";
  const TAIL = "small,.unit,.per,.u";
  /* Cell size: --gn-cell (px) when the pack CSS sets one, else 12 % of the font size snapped down to a size that sits on the
     24px grid (3, 4, 6, 8, 12, 16, 24, 48: divisors or multiples of 24 except 16 = 2/3 of 48), at least 3px. */
  const SIZES = [48, 24, 16, 12, 8, 6, 4, 3];
  function cellSize(n, w) {
    const cs = getComputedStyle(n), own = parseFloat(cs.getPropertyValue("--gn-cell"));
    /* --gn-fit: 1 (the kiosk clock, audit 2026-11-03): the largest of 24 / 16 / 12 whose string (w columns) fits the clock
       column (64 % of the poster, less the AM/PM tail) and 45 % of the poster's height; so a 12 h "2:41" gets one cell
       per grid module on both kiosks (24 h "14:41" = 600px falls back to 16 on the Echo Show). */
    const po = w > 0 && cs.getPropertyValue("--gn-fit").trim() === "1" ? n.closest(".poster") : null;
    if (po && po.clientWidth) {
      const pc = getComputedStyle(po), avail = (po.clientWidth - parseFloat(pc.paddingLeft) - parseFloat(pc.paddingRight)) * .64 - 80;
      const fit = [24, 16, 12].find(x => w * x <= avail && 7 * x <= po.clientHeight * .45);
      if (fit) return fit;
    }
    if (own > 0) return Math.round(own);
    const raw = parseFloat(cs.fontSize) * .12;
    return SIZES.find(s => s <= raw) || 3;
  }
  /* Back to the card's own DOM: stop a rebuild, drop the cells, unwrap the hidden text. */
  function plain(n) {
    const st = n._gn;
    if (st && st.stop) st.stop();
    for (const c of [...n.children]) {
      if (c.localName === "svg" && c.classList.contains("gn-cells")) c.remove();
      else if (c.classList.contains("gn-sr")) { while (c.firstChild) n.insertBefore(c.firstChild, c); c.remove(); }
    }
    n.classList.remove("gn");
  }
  /* Draws n's value as cells. prev = the slot's last cell map (animate from it), or null (instant). Returns the value string
     drawn, or "" when n stays text. */
  function draw(n, prev) {
    plain(n);
    const keep = [], parts = [];
    for (const c of n.childNodes) {
      if (c.nodeType === 1 && c.matches(TAIL) && !drawable(norm(c.textContent))) keep.push(c);
      else if (c.nodeType === 1 || c.nodeType === 3) parts.push(c.textContent);
    }
    const str = norm(parts.join(""));
    if (!drawable(str)) return "";
    const sr = el("span", "gn-sr");
    for (const c of [...n.childNodes]) if (!keep.includes(c)) sr.append(c);
    // Gaps only from 12px cells (audit 2026-11-03): below that a 1px gap breaks the strokes into dots.
    const {m, w} = layout(str), c = cellSize(n, w), g = c >= 12 ? Math.max(1, Math.round(c * .08)) : 0, s = c - g;
    const from = prev && motionOn() ? prev : null, cols = Math.max(w, from ? from.w : 0);
    const svg = svgEl("svg", {class: "gn-cells", "aria-hidden": "true", width: cols * c - g, height: 7 * c - g,
      viewBox: `0 0 ${cols * c - g} ${7 * c - g}`, fill: "currentColor"});
    const paths = new Map();
    const put = (k, t) => {
      let p = paths.get(k);
      if (!t) { if (p) { p.remove(); paths.delete(k); } return; }
      const [x, y] = k.split(",").map(Number);
      if (!p) { p = svgEl("path", {}); paths.set(k, p); svg.append(p); }
      p.setAttribute("d", cellPath(t, x * c, y * c, s));
    };
    const start = from ? from.m : m;
    start.forEach((t, k) => put(k, t));
    n.prepend(sr); sr.after(svg); n.classList.add("gn");
    n._gn = {m, w, c, stop: null};
    if (from) {
      const q = [...new Set([...from.m.keys(), ...m.keys()])].filter(k => from.m.get(k) !== m.get(k));
      const P = k => k.split(",").map(Number);
      q.sort((a, b) => { const [ax, ay] = P(a), [bx, by] = P(b); return ax + ay - (bx + by) || ay - by; });
      const step = q.length ? Math.min(30, 300 / q.length) : 30, t0 = performance.now();
      let i = 0, raf = 0;
      const end = () => { svg.setAttribute("width", w * c - g); svg.setAttribute("viewBox", `0 0 ${w * c - g} ${7 * c - g}`); };
      const tick = () => {
        const due = Math.floor((performance.now() - t0) / step) + 1;
        for (; i < q.length && i < due; i++) put(q[i], m.get(q[i]));
        if (i < q.length) raf = requestAnimationFrame(tick); else { raf = 0; end(); }
      };
      n._gn.stop = () => { if (raf) cancelAnimationFrame(raf); raf = 0; for (; i < q.length; i++) put(q[i], m.get(q[i])); end(); };
      raf = requestAnimationFrame(tick);
    }
    return str;
  }
  /* jam-light brightness: 10 grid cells, ceil(%/10) of them filled (the card's own bar <i> keeps its width, hidden). */
  function bar(bs) {
    const i = bs.querySelector(":scope > i"), pct = i ? parseFloat(i.style.width) || 0 : 0, f = Math.min(10, Math.ceil(pct / 10 - 1e-9));
    let cells = bs.querySelectorAll(":scope > b.gb");
    if (cells.length !== 10) { cells.forEach(b => b.remove()); for (let k = 0; k < 10; k++) bs.append(el("b", "gb")); cells = bs.querySelectorAll(":scope > b.gb"); }
    cells.forEach((b, k) => b.classList.toggle("f", k < f));
  }
  /* Grid snap (--gn-snap: 1 in the pack CSS: the kiosk and screensaver clocks), for 24px cells only (one cell per
     module): moves the cells (at most half a module) so each starts one pixel inside a line of the 24px page grid, which is
     anchored at the viewport's top-left (the screensaver's own grid layer; the HA view background / the preview page on a
     kiosk that does not scroll). */
  function snap(n) {
    const svg = n.querySelector(":scope > svg.gn-cells");
    if (!svg || !n._gn || n._gn.c !== 24) return; // only a cell of one module can sit in the grid
    svg.style.transform = "";
    const r = svg.getBoundingClientRect();
    if (!r.width) return;
    const d = v => Math.round(v / 24) * 24 + 1 - v;
    svg.style.transform = `translate(${d(r.left).toFixed(2)}px,${d(r.top).toFixed(2)}px)`;
  }
  /* The root hook (motif "decorateRoot"): draws every big number of root now and whenever a card writes one (a
     MutationObserver on the root); returns the cleanup (observer off, the card's own DOM back). Slots (class + index) remember
     the last value, so a card that renders a new node for a new value still gets the cell-by-cell rebuild. */
  function numerals(root) {
    const slots = new Map();
    const slotOf = n => { const k = n.className.replace(/\s*\bgn\b/, ""), all = [...root.querySelectorAll(SEL)].filter(x => x.className.replace(/\s*\bgn\b/, "") === k); return k + "#" + all.indexOf(n); };
    const one = n => {
      const slot = slotOf(n), was = slots.get(slot), str = draw(n, was && was.str !== undefined ? was : null);
      if (!str) { slots.delete(slot); return; }
      if (was && was.str === str && n._gn.stop) n._gn.stop(); // same value on a new node: no rebuild
      slots.set(slot, {str, m: n._gn.m, w: n._gn.w});
    };
    const scan = node => {
      const nums = new Set(), bars = new Set();
      if (node.nodeType !== 1 && node.nodeType !== 11) return {nums, bars};
      if (node.nodeType === 1 && node.matches(SEL)) nums.add(node);
      if (node.nodeType === 1 && node.matches(".lc .bs")) bars.add(node);
      node.querySelectorAll(SEL).forEach(x => nums.add(x));
      node.querySelectorAll(".lc .bs").forEach(x => bars.add(x));
      return {nums, bars};
    };
    let snapRaf = 0;
    const resnap = () => {
      if (snapRaf) return;
      snapRaf = requestAnimationFrame(() => { snapRaf = 0; root.querySelectorAll(".gn").forEach(n => { if (n._gn && n._gn.snap) snap(n); }); });
    };
    const run = (nums, bars) => {
      let sn = false;
      nums.forEach(n => {
        if (!n.isConnected) return;
        one(n);
        if (n._gn && n.classList.contains("gn")) sn = (n._gn.snap = getComputedStyle(n).getPropertyValue("--gn-snap").trim() === "1") || sn;
      });
      bars.forEach(b => { if (b.isConnected) bar(b); });
      if (sn) resnap();
    };
    const obs = new MutationObserver(recs => {
      const nums = new Set(), bars = new Set();
      for (const r of recs) {
        const t = r.target.nodeType === 1 ? r.target : r.target.parentElement;
        if (!t) continue;
        if (r.type === "attributes") {
          if (t.localName === "i" && t.parentElement && t.parentElement.matches(".lc .bs")) bars.add(t.parentElement);
          else if (t.matches(".k, .ov")) resnap(); // a kiosk height / screensaver layout change moves a snapped clock
          continue;
        }
        if (t.closest("svg.gn-cells")) continue;
        const own = t.closest(SEL); if (own) nums.add(own);
        for (const a of r.addedNodes) { const s = scan(a); s.nums.forEach(x => nums.add(x)); s.bars.forEach(x => bars.add(x)); }
      }
      run(nums, bars);
      obs.takeRecords(); // our own writes
    });
    const all = scan(root);
    run(all.nums, all.bars);
    obs.observe(root, {subtree: true, childList: true, characterData: true, attributes: true, attributeFilter: ["style", "class"]});
    addEventListener("resize", resnap);
    return () => {
      obs.disconnect();
      removeEventListener("resize", resnap);
      if (snapRaf) cancelAnimationFrame(snapRaf);
      root.querySelectorAll(".gn").forEach(plain);
      root.querySelectorAll(".lc .bs > b.gb").forEach(b => b.remove());
    };
  }

  /* ---------- motifs ---------- */
  /* empty (Golden Arm placeholder): a 4 x 3 block of grid cells, some filled ink, one in the signal (seeded). */
  function gridEmpty(key) {
    const r = rng((typeof key === "number" ? key >>> 0 : seed(key)) ^ 0x9e3779b9), box = el("div", "arm gempty");
    box.setAttribute("aria-hidden", "true");
    const sig = Math.floor(r() * 12);
    for (let k = 0; k < 12; k++) box.append(el("i", k === sig ? "s" : r() < .45 ? "f" : ""));
    return box;
  }
  /* idleArt: one New Alphabet digit (seeded) on a 9 x 9 cell grid (a centred square), ink cells, one cell in the signal. */
  function gridIdle(sd) {
    const r = rng((sd >>> 0) ^ 0x5bd1e995), box = el("div", "abs gidle"), d = String(Math.floor(r() * 10));
    box.setAttribute("aria-hidden", "true");
    const svg = svgEl("svg", {viewBox: "0 0 9 9", preserveAspectRatio: "xMidYMid meet"});
    for (let k = 0; k <= 9; k++) svg.append(svgEl("path", {class: "gl", d: `M${k} 0v9M0 ${k}h9`}));
    const cells = [...layout(d).m];
    const lit = Math.floor(r() * cells.length);
    cells.forEach(([k, t], i) => { const [x, y] = k.split(",").map(Number); svg.append(svgEl("path", {class: i === lit ? "sig" : "", d: cellPath(t, x + 2.06, y + 1.06, .88)})); });
    box.append(svg);
    return box;
  }
  /* screensaver: the page grid over the whole layer (b1) behind the cell clock; the other three Poster nodes stay hidden,
     so the composition keeps its node count and order. */
  function gridScreen() {
    return ["b1 bar ggrid", "b2 bar gx", "b3 bar gx", "dk disc gx"].map(k => { const s = el("div", "sh " + k); s.setAttribute("aria-hidden", "true"); return s; });
  }

  const CSS = `
/* ---------- cell numerals: the cells replace the text, which stays readable to assistive tech ---------- */
.gn{line-height:0!important;letter-spacing:0!important;white-space:nowrap}
.gn > .gn-sr{position:absolute!important;width:1px;height:1px;margin:-1px;padding:0;overflow:hidden;clip-path:inset(50%);white-space:nowrap;border:0}
.gn > svg.gn-cells{display:inline-block;vertical-align:baseline;overflow:visible;width:auto;height:auto;max-width:none;margin:0} /* card svg rules (jam-gauge's dial) must not size the cells */
.gn > small,.gn > .unit,.gn > .per,.gn > .u{line-height:1}
/* ---------- type: small numbers Hanken 500, tabular ---------- */
.num{font-weight:500;font-variant-numeric:tabular-nums}
/* ---------- tone colours: the calm / info tone is the secondary blue (focus token); the signal stays for on / alerts ---------- */
.s-calm{border-left-color:var(--focus)}
:focus-visible{outline-width:2px!important}
.jam-wash{display:none}
.spiral{display:none}
/* ---------- keys and chips: square, outlined; on / active = signal fill, black text ---------- */
.key > .face{background:var(--slab);color:var(--fg);box-shadow:inset 0 0 0 1px var(--fg)}
.key.on > .face,.ikey.main > .face{background:var(--ochre);color:var(--on-fg);box-shadow:inset 0 0 0 1px var(--ochre)}
.key.alert > .face{background:var(--slab);color:var(--alert-text);box-shadow:inset 0 0 0 1px var(--red)}
.key:disabled > .face{color:var(--dim);box-shadow:inset 0 0 0 1px var(--line)}
.key.on:disabled > .face,.ikey.main:disabled > .face{background:var(--slab);color:var(--dim);box-shadow:inset 0 0 0 1px var(--line)}
button.chip::before{box-shadow:inset 0 0 0 1px var(--fg)}
/* ---------- strips: square, a 1px track outline, the fill in ink ---------- */
.strip{background:var(--slab);box-shadow:inset 0 0 0 1px var(--fg)}
.fill{background:var(--fg)}
/* ---------- power corner: a 32px outlined square top-right, the glyph centred; on = signal fill ---------- */
.pw .tri{inset:8px 8px auto auto;width:32px;height:32px;background:var(--slab);box-shadow:inset 0 0 0 1px var(--fg)}
.pw svg{right:15px;top:15px;width:18px;height:18px;color:var(--fg)}
.pw[aria-pressed=true] .tri{background:var(--ochre);box-shadow:none}
.pw[aria-pressed=true] svg{color:var(--on-fg)}
.pw:disabled .tri{background:var(--slab);box-shadow:inset 0 0 0 1px var(--line)} .pw:disabled svg{color:var(--dim)}
.pw:focus-visible{outline-offset:-8px}
/* ---------- jam-light: white face, signal top edge, brightness cells, member squares ---------- */
.lc.on > .face{background:var(--slab);color:var(--fg);border-top:var(--rule-h) solid var(--ochre)}
.lc.on .sub{color:var(--dim)}
.lc.on.plate .top{margin:0;padding:0;background:none;color:inherit;clip-path:none}
.lc.on.plate .pct{margin-left:0;padding:0;background:none;color:inherit}
.lc .pct{--gn-cell:5px}
.lc .tap{padding-bottom:30px}
.lc.on .tap{padding-right:52px}
.lc .bs{left:14px;right:auto;bottom:12px;height:10px;display:grid;grid-template-columns:repeat(10,10px);gap:2px;background:none}
.lc .bs i{display:none}
.lc .bs b.gb{display:block;box-shadow:inset 0 0 0 1px var(--line)}
.lc .bs b.gb.f{background:var(--fg);box-shadow:none}
.lc .bands{top:48px;right:8px;bottom:auto;width:32px;display:flex;flex-wrap:wrap;align-content:flex-start;gap:4px;padding:0;background:none}
.lc .bands.corner{top:48px}
.lc .bands i{flex:none;width:8px;height:8px;background:var(--fg)!important}
.lc .bands i[style*="slab2"]{background:transparent!important;box-shadow:inset 0 0 0 1px var(--fg)}
/* light pop-up */
.wt > .face,.wp > .face{border-top:var(--bord,0px none)}
.wt.on > .face{outline:2px solid var(--ochre);outline-offset:-2px}
.wp b{left:8px;right:auto;max-width:calc(100% - 16px);padding:3px 6px 4px;background:var(--plate);color:var(--plate-fg)} /* preset names on a black plate */
:host(jam-gauge) .bar .big.num{--gn-cell:3px}
/* ---------- jam-button: on = signal fill (the key rule) ---------- */
.kf{box-shadow:inset 0 0 0 1px var(--fg)}
.kf.on{background:var(--ochre);color:var(--on-fg);box-shadow:none}
.kf.on .st{color:var(--on-fg)}
.kf .sq{background:var(--slab);color:var(--fg);box-shadow:inset 0 0 0 1px var(--fg)}
.kf.on .sq{background:var(--slab);color:var(--fg);box-shadow:none}
/* ---------- empty art / idle art / covers ---------- */
.arm.gempty.gempty.gempty{display:grid;grid-template-columns:repeat(4,1fr);grid-template-rows:repeat(3,1fr);gap:2px;width:min(48%,96px);height:auto;aspect-ratio:4/3;
  padding:0;margin:0;position:absolute;left:50%;top:50%;right:auto;bottom:auto;max-width:none;transform:translate(-50%,-50%)}
.arm.gempty i{display:block;box-shadow:inset 0 0 0 1px var(--line)}
.arm.gempty i.f{background:var(--fg);box-shadow:none}
.arm.gempty i.s{background:var(--ochre);box-shadow:none}
.gidle{background:var(--slab)}
.gidle svg{display:block;width:100%;height:100%}
.gidle .gl{stroke:var(--line);stroke-width:.04;fill:none}
.gidle path:not(.gl){fill:var(--fg)}
.gidle path.sig{fill:var(--ochre)}
:host(jam-media) .art > .face,:host(jam-tv) .poster > .face,:host(jam-speaker) .poster > .face{background:var(--slab2);color:var(--fg)}
:host(jam-speaker) .kart{background:var(--slab2)}
:host(jam-media) .art img{filter:none;mix-blend-mode:normal}
/* jam-speaker K1 (kiosk sheet): a white / black side panel with outlined keys, not the sampled art colour */
:host(jam-speaker) .side{--kbg:var(--slab)!important;--kfg:var(--fg)!important;--ktr:var(--slab2)!important;background:var(--slab);color:var(--fg)}
:host(jam-speaker) .kbk .ikey > .face{border-width:1px}
:host(jam-speaker) .kbk .shuf.on > .face{background:var(--ochre);color:var(--on-fg);border-color:var(--ochre)}
:host(jam-speaker) .kt .ikey > .face,:host(jam-speaker) .kv .key > .face{background:var(--slab);color:var(--fg);box-shadow:inset 0 0 0 1px var(--fg)}
:host(jam-speaker) .kt .ikey.main > .face{background:var(--ochre);color:var(--on-fg);box-shadow:none}
:host(jam-speaker) .kt .ikey:disabled > .face,:host(jam-speaker) .kv .key:disabled > .face{background:var(--slab);color:var(--dim);box-shadow:inset 0 0 0 1px var(--line)}
:host(jam-speaker) .kv .vt .strip{background:var(--slab);box-shadow:inset 0 0 0 1px var(--fg)}
:host(jam-speaker) .kv .vn.hi{color:var(--slab)}
/* ---------- jam-remote / jam-tv ---------- */
.ol > .face{background:var(--slab)} .ol > .face::before{content:none} .ol > .face{box-shadow:inset 0 0 0 1px var(--fg)}
.ol.on > .face{background:var(--ochre);color:var(--on-fg)}
.rock > .face{background:var(--slab);gap:2px}
:host(jam-tv) .pw{background:none;color:var(--fg)}
:host(jam-tv) .pw::before{content:"";position:absolute;right:6px;top:6px;width:32px;height:32px;background:var(--ochre)}
:host(jam-tv) .pw:not(.off){color:var(--on-fg)}
:host(jam-tv) .pw.off::before{background:var(--slab);box-shadow:inset 0 0 0 1px var(--fg)}
:host(jam-tv) .pw svg{right:13px;top:13px;width:18px;height:18px}
:host(jam-tv) .kiosk .pw::before{right:10px;top:10px;width:52px;height:52px}
:host(jam-tv) .kiosk .pw svg{right:23px;top:23px;width:26px;height:26px}
/* ---------- offline (state grammar): the square stays, its hairline turns dashed; no signal ---------- */
.paper[data-cut] > .face.unavail{background:var(--slab);border:1px dashed var(--fg);box-shadow:none}
.tmk.t-offline{--tc:var(--slab);box-shadow:inset 0 0 0 1px var(--fg)}
/* ---------- failed-action strip ---------- */
.jam-err{border:1px solid var(--fg);border-left:var(--stripe-w) solid var(--red)}
/* the kiosk / screensaver clocks: one cell per grid module when there is room (else 2/3 or 1/2 of one), snapped to the grid */
:host(jam-kiosk) .clock{--gn-cell:12px;--gn-snap:1;--gn-fit:1} /* cell size from the string's width (cellSize) */
.ov{container-type:size}
.ov .time.num{--gn-cell:8px;--gn-snap:1}
@container (min-width:600px){.ov .time.num{--gn-cell:16px}}
@container (min-width:900px) and (min-height:560px){.ov .time.num{--gn-cell:24px}}
/* ---------- jam-kiosk: cell clock, outlined dock squares (pressed = signal fill), square lock ---------- */
:host(jam-kiosk) .bar{height:var(--rule-h);background:var(--ochre)}
:host(jam-kiosk) .host .blk,:host(jam-kiosk) .host.light .blk.none{background:var(--slab);color:var(--fg);box-shadow:inset 0 0 0 1px var(--fg)}
:host(jam-kiosk) .host .blk .st,:host(jam-kiosk) .host.light .blk.none .st{color:var(--dim)}
:host(jam-kiosk) .host .blk:active{background:var(--ochre);color:var(--on-fg);box-shadow:none}
:host(jam-kiosk) .host .blk:active .st{color:var(--on-fg)}
:host(jam-kiosk) .blk:focus-visible{outline:2px solid var(--focus);outline-offset:2px}
:host(jam-kiosk) .lk .disc{border-radius:0}
:host(jam-kiosk) .lk{--lk-bg:var(--slab);--lk-gl:var(--fg)}
:host(jam-kiosk) .host.light .lk:not(.alert):not(.off){--lk-gl:var(--fg)}
:host(jam-kiosk) .lk:not(.off) .disc{box-shadow:inset 0 0 0 1px var(--fg)}
:host(jam-kiosk) .lk.alert{--lk-bg:var(--ochre);--lk-gl:var(--on-fg)}
:host(jam-kiosk) .lk.off .disc{border-width:1px}
/* ---------- jam-screensaver: the page (white / black) with the grid, the cell clock in ink ---------- */
.ov{background:var(--slab);--sfg:var(--fg);--sdim:var(--dim)}
.ov .img{background:var(--slab)}
.ov .sh.ggrid{left:0;top:0;right:0;bottom:0;width:auto;height:auto;clip-path:none;
  background:linear-gradient(var(--line) 1px,transparent 1px) 0 0/24px 24px,linear-gradient(90deg,var(--line) 1px,transparent 1px) 0 0/24px 24px}
.ov .sh.gx{display:none}
.ov .kick{color:var(--alert-text)}
:host(jam-popup) .t .label{color:var(--fg)}
.ov .temp{color:var(--ochre)}
.tchip{background:var(--slab);color:var(--fg);box-shadow:inset 0 0 0 1px var(--fg)}
.tchip small{color:var(--dim)}
.np .th{background:var(--slab2)}
.np .th .arm span{background:var(--fg)}
.sdock .np{background:var(--slab);box-shadow:inset 0 0 0 1px var(--fg)}
/* jam-programme (Grid: every hue is the signal): lanes told apart by shape, not colour: lane variant 1 = outlined bands, 2 = half-height
   bands (the current band keeps its taller outline). */
:host(jam-programme) .lane[data-lv="1"] .bd{background:var(--slab);border:3px solid var(--bf)}
:host(jam-programme) .lane[data-lv="2"] .bd:not(.bnow){top:25%;bottom:25%}
/* jam-results: cell numerals sized to the square (4 digits + a unit fit a 112px square at 4px cells, a 185px one at 5px). */
:host(jam-results) .big.num{--gn-cell:4px}
@container (min-width:185px){:host(jam-results) .big.num{--gn-cell:5px}}
/* ---------- look cards (2026-11-03): jam-matrix cells = outlined squares (on = the ink fill, a problem = the signal), the info sticker = an
   outlined white / black note (warn and alert keep the signal) ---------- */
:host(jam-matrix) .cell{background:var(--slab);box-shadow:inset 0 0 0 1px var(--fg)}
:host(jam-matrix){--mx-on:var(--fg);--mx-on-fg:var(--slab)}
:host(jam-matrix) .cell.on{background:var(--fg)}
:host(jam-matrix) .cell.alert{background:var(--acc)}
:host(jam-matrix) .cell.na{background:none;box-shadow:inset 0 0 0 1px var(--line)}
:host(jam-matrix) .cell:hover,:host(jam-matrix) .cell.sel{box-shadow:inset 0 0 0 3px var(--focus)}
:host(jam-matrix) .slot{box-shadow:inset 0 0 0 1px var(--line)}
:host(jam-sticker) .sk.info{--sk:var(--slab);box-shadow:inset 0 0 0 1px var(--fg)}
:host(jam-linemap) .trk path{stroke-linecap:square}
`;

  registerLook({
    id: "grid",
    name: "Grid",
    fonts: [{family: "Hanken Grotesk", weight: "100 900", file: "hanken-grotesk-var-latin.woff2"}],
    css: CSS,
    motifs: {
      decorateRoot: numerals,
      empty: gridEmpty,
      idleArt: gridIdle,
      flash() { return svgEl("svg", {viewBox: "0 0 1 1", "aria-hidden": "true"}); },
      powerGlyph() {
        const svg = this.poster();
        svg.setAttribute("stroke-width", "2"); svg.setAttribute("stroke-linecap", "square");
        return svg;
      },
      screensaver: gridScreen,
    },
  });
})();
