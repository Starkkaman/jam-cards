/* ---------- jam-results: a results board of big numbers on flat colour squares (Olympia look card, every look) ----------
   {type: custom:jam-results, items: [entity | {entity, name?, unit?, attribute?, decimals?, color?, thresholds?: [{above?,
    below?, color, word?}], tap_action?, hold_action?}] (1-12), columns? (auto: squares of at least 112px), accent?}
   One square per item, each its own surface (card kind: Poster's cut corner, a look's shape): the label at the top, the value
   big at the bottom (the look's numeral font, at least 3.4rem once the square is 160px wide; temperatures as 66°, other units
   small beside it; words like "good" smaller; shrunk to fit). Colour: the first threshold the value passes (above: value >
   above, below: value < below, both = inside) -> its colour, and the label turns into an inverted plate with the threshold's
   word (`word`, default "high" for above, "low" for below; none for a range) so a breach reads without colour; else `color`
   (an accent name); else a neutral face-2 square with --fg text. Text on a colour = the look's dark or light text,
   whichever contrasts more (jamFieldInk), a label plate when neither reaches 4.5:1. A missing / unavailable sensor = a
   face-2 square, its name (never the raw id) and "Offline". Tap a square = its tap_action, default more-info. Static. */
const JRS_MAX = 12;
class JamResults extends JamBase {
  validate(c) {
    if (!Array.isArray(c.items) || !c.items.length) throw new Error("jam-results: items is a list of 1-12 entities");
    if (c.items.length > JRS_MAX) throw new Error(`jam-results: ${c.items.length} items, max ${JRS_MAX}`);
    for (const x of c.items) {
      const id = typeof x === "string" ? x : x && x.entity;
      if (typeof id !== "string" || !id.includes(".")) throw new Error("jam-results: each item is an entity id or {entity, name?, color?, ...}");
      if (x.thresholds !== undefined && !Array.isArray(x.thresholds)) throw new Error("jam-results: thresholds is a list of {above?, below?, color}");
    }
  }
  _items() { return this._config.items.map(x => (typeof x === "string" ? {entity: x} : x)); }
  watched() { return this._items().map(x => x.entity); }
  css() { return `
    .host{container-type:inline-size}
    .grid{display:grid;grid-template-columns:repeat(var(--cols,auto-fill),minmax(min(112px,100%),1fr));gap:8px}
    .rsq{aspect-ratio:1;height:auto;min-height:112px;container-type:inline-size}
    .rsq > .face{--p-t:12px;--p-r:14px;--p-b:14px;--p-l:14px;display:flex;flex-direction:column;justify-content:space-between;gap:8px;
      background:var(--sc);color:var(--fld-fg,var(--on-fg));overflow:hidden}
    .rsq.un > .face,.rsq.nt > .face{background:var(--slab2);color:var(--fg)}
    .lb{font:500 .8rem/1.2 var(--body);overflow-wrap:break-word;hyphens:auto;align-self:start;max-width:100%}
    .rsq .face.pl .lb,.rsq .face.pl .u{background:var(--plate);color:var(--plate-fg);padding:1px 5px}
    /* A threshold breach: the label on an inverted plate (the text colour as the plate, the square colour as the text). */
    .lb.br{font-weight:600;background:var(--fld-fg,var(--on-fg));color:var(--sc);padding:2px 6px}
    .rsq .face.pl .lb.br{background:var(--plate-fg);color:var(--plate)}
    .val{display:flex;align-items:baseline;gap:5px;min-width:0;white-space:nowrap}
    .big{font-family:var(--num-font);font-weight:var(--disp-w);text-transform:var(--disp-case);font-size:calc(2.6rem * var(--num-scale));
      line-height:calc(.95 * var(--disp-lead));letter-spacing:var(--jam-display-track,-.01em)}
    .big.w{font-size:calc(2.1rem * var(--num-scale))}
    .u{font:500 .85rem/1 var(--body);text-transform:none}
    @container (min-width:160px){.big{font-size:calc(3.4rem * max(1, var(--num-scale)))}.big.w{font-size:calc(2.4rem * max(1, var(--num-scale)))}}`; }
  /* The square's colour and breach word: the first threshold the value passes, else color, else none (neutral). */
  _color(x, n) {
    if (isFinite(n)) for (const t of x.thresholds || []) {
      if (!t || !accentVar(t.color)) continue;
      const a = t.above !== undefined && t.above !== null && t.above !== "" ? +t.above : null, b = t.below !== undefined && t.below !== null && t.below !== "" ? +t.below : null;
      if ((a === null || n > a) && (b === null || n < b) && (a !== null || b !== null))
        return {color: accentVar(t.color), word: t.word !== undefined && t.word !== null ? String(t.word) : a !== null && b !== null ? "" : a !== null ? "high" : "low"};
    }
    return {color: accentVar(x.color), word: null};
  }
  render(b) {
    const c = this._config, h = this._hass, grid = el("div", "grid");
    if (+c.columns > 0) grid.style.setProperty("--cols", Math.min(12, Math.round(+c.columns)));
    this._items().forEach((x, i) => {
      const s = stateObj(h, x.entity), gone = !s || UNAVAILABLE.has(s.state), v = gone ? {v: "Offline", u: "", word: true, text: "offline"} : jamValue(h, s, x);
      const name = x.name || (s ? friendly(h, x.entity) : jamIdName(x.entity)), col = gone ? {color: null, word: null} : this._color(x, v.n);
      const {root, face} = paper("div", "jam-results|" + x.entity + "|" + i, {cls: "rsq press" + (gone ? " un" : col.color ? "" : " nt"), face: ""});
      if (col.color) { face.style.setProperty("--sc", col.color); face.dataset.fld = ""; }
      const big = el("span", "big num" + (v.word ? " w" : "") + (gone ? " unavail" : ""), v.v), val = el("div", "val");
      val.append(big);
      if (v.u) val.append(el("span", "u", v.u));
      const breach = !!col.word && !!col.color;
      const lb = el("div", "lb" + (breach ? " br" : ""), breach ? `${name} · ${col.word}` : name);
      face.append(lb, val);
      root.tabIndex = 0; root.setAttribute("role", "button");
      root.setAttribute("aria-label", `${name}: ${v.text}${breach ? ", " + col.word : ""}`);
      bindActions(root, () => this._hass, x, x.entity);
      grid.append(root);
    });
    b.append(grid);
    this._inkWait = !jamFieldInk(b);
    this._fit();
  }
  /* Values that are wider than their square (long words, fallback fonts) shrink to fit; watched while attached. */
  _fit() {
    if (this._ro) { this._ro.disconnect(); this._ro = null; }
    if (!this.isConnected || !this._body) return;
    const grid = this._body.querySelector(".grid");
    if (!grid) return;
    let w = -1;
    const fit = () => {
      if (!grid.isConnected || grid.clientWidth === w) return;
      w = grid.clientWidth;
      for (const v of grid.querySelectorAll(".val")) {
        const big = v.firstChild;
        big.style.fontSize = "";
        if (v.scrollWidth > v.clientWidth + 0.5) big.style.fontSize = (parseFloat(getComputedStyle(big).fontSize) * Math.max(.3, (v.clientWidth - (v.scrollWidth - big.offsetWidth)) / big.offsetWidth) - 0.3).toFixed(2) + "px";
      }
    };
    if (window.ResizeObserver) { this._ro = new ResizeObserver(fit); this._ro.observe(grid); } else fit();
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => { w = -1; fit(); });
  }
  connectedCallback() {
    super.connectedCallback();
    if (this._inkWait && this._body) this._inkWait = !jamFieldInk(this._body);
    if (!this._ro) this._fit();
  }
  disconnectedCallback() { super.disconnectedCallback(); if (this._ro) { this._ro.disconnect(); this._ro = null; } }
  getCardSize() { return 3; }
  getGridOptions() { return {columns: 12, rows: "auto", min_columns: 3}; }
}
register("jam-results", JamResults, "Jam Results", "A results board: big numbers on flat colour squares for any sensors, with thresholds.");
