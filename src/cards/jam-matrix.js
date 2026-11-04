/* ---------- jam-matrix: a toggle matrix, one square cell per entity (designed for the Grid look, drawn in every look) ----------
   {type: custom:jam-matrix, title?, entities: [ids | {entity, name?}], columns? (default: the count, 3..6), accent?}
   Cells are squares (>= 44px) in rows of `columns`, the last row completed with empty outlined slots. A cell is filled with
   the accent while its entity is on, slab2 while off, an outline while unavailable, red for a problem state. Tap a cell =
   toggle (on / off entities) or more-info (anything else). Names show in the caption row under the matrix while a cell is
   hovered, focused or touched ("Floor lamp · On"); at rest the caption lists what is on. The count of entities that are on
   is a big numeral in the header (class .big.num: the Grid look draws it in cell numerals). Keyboard: one tab stop (roving
   tabindex), arrow keys / Home / End move between cells, Enter / Space press. */
class JamMatrix extends JamBase {
  validate(c) {
    if (!Array.isArray(c.entities) || !c.entities.length) throw new Error("jam-matrix: entities is required");
    if (c.columns !== undefined && !(Number.isInteger(+c.columns) && +c.columns >= 1 && +c.columns <= 12)) throw new Error("jam-matrix: columns is a whole number 1-12");
  }
  _items() { return this._config.entities.map(x => (typeof x === "string" ? {entity: x} : x)).filter(x => x && typeof x.entity === "string"); }
  watched() { return this._items().map(x => x.entity); }
  _cols(n) { return +this._config.columns || Math.max(3, Math.min(6, n)); }
  css() { return `
    .mx{display:grid;gap:12px;align-content:start}
    .hd{display:flex;flex-wrap:wrap;align-items:flex-end;justify-content:space-between;gap:8px 12px;min-width:0}
    .ttl{font-size:calc(1.6rem * var(--disp-scale));margin:0;min-width:0;overflow-wrap:break-word}
    .ct{flex:none;display:flex;align-items:baseline;gap:8px}
    .big{font-family:var(--num-font,var(--display));font-weight:var(--disp-w);font-size:calc(2.6rem * var(--num-scale,var(--disp-scale)));line-height:.9;font-variant-numeric:tabular-nums}
    .grid{display:grid;grid-template-columns:repeat(var(--cols),minmax(44px,1fr));gap:var(--mx-gap,6px);max-width:calc(var(--cols) * 96px)}
    .cell,.slot{aspect-ratio:1;min-height:44px;position:relative;display:block}
    .cell{background:var(--slab2);clip-path:var(--jam-shape-chip,polygon(0 0,100% 0,100% calc(100% - 6px),calc(100% - 6px) 100%,0 100%));border-radius:var(--jam-radius-chip,0px)}
    .cell:focus-visible{outline-offset:-3px;outline-color:var(--focus)}
    .cell:hover{box-shadow:inset 0 0 0 3px var(--dim)}
    .cell.on{background:var(--acc)}
    .cell.alert{background:var(--red)}
    .cell.na{background:none;box-shadow:inset 0 0 0 2px var(--line)}
    .cell.na::before{content:"";position:absolute;left:50%;top:22%;bottom:22%;width:2px;margin-left:-1px;background:var(--line);transform:rotate(45deg)}
    .slot{box-shadow:inset 0 0 0 1px var(--line)}
    .mxcap{min-height:1.3em;font:500 .9rem/1.3 var(--body);color:var(--fg);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
    .mxcap.rest{color:var(--dim)}`; }
  /* A state change re-renders the cells: the focused one keeps the focus (keyboard toggling). */
  _render(force) { const ref = jamFocusRef(this); super._render(force); jamFocusBack(this, ref); }
  _label(x, s) {
    const nm = x.name || friendly(this._hass, x.entity);
    return [nm, !s ? "Missing" : UNAVAILABLE.has(s.state) ? "Unavailable" : fmtState(this._hass, s)];
  }
  render(b) {
    const c = this._config, h = this._hass, items = this._items(), n = items.length, cols = this._cols(n);
    const {root, face} = this.paper(c.title || items[0].entity, {face: "mx"});
    const hd = el("div", "hd");
    hd.append(el("h2", "disp ttl", c.title || "Matrix"));
    const ons = [], tog = [];
    const grid = el("div", "grid");
    grid.style.setProperty("--cols", cols);
    grid.setAttribute("role", "group"); grid.setAttribute("aria-label", c.title || "Matrix");
    const cap = el("div", "mxcap rest");
    cap.setAttribute("aria-live", "polite");
    const cells = items.map((x, i) => {
      const s = stateObj(h, x.entity), na = !s || UNAVAILABLE.has(s.state), t = na ? "na" : tone(s);
      const flip = !na && toggleable(x.entity) && (s.state === "on" || s.state === "off");
      const [nm, st] = this._label(x, s);
      if (t === "on") ons.push(nm);
      if (flip) tog.push(x.entity);
      const cell = el("button", "cell" + (t === "on" ? " on" : t === "alert" ? " alert" : na ? " na" : ""));
      cell.dataset.entity = x.entity; cell.dataset.jamName = nm;
      cell.tabIndex = i === (this._focus || 0) ? 0 : -1;
      if (flip) { cell.setAttribute("aria-pressed", s.state === "on" ? "true" : "false"); cell.setAttribute("aria-label", nm); }
      else cell.setAttribute("aria-label", `${nm}, ${st}`);
      cell.dataset.st = st;
      const show = () => { cap.textContent = `${nm} · ${st}`; cap.classList.remove("rest"); };
      cell.addEventListener("pointerenter", show);
      cell.addEventListener("pointerdown", show);
      cell.addEventListener("focus", () => { show(); this._focus = i; });
      cell.addEventListener("pointerleave", () => this._rest(cap));
      cell.addEventListener("blur", () => this._rest(cap));
      cell.onclick = () => flip ? jamCall(cell, this._hass, "homeassistant", "toggle", {entity_id: x.entity}, "toggle", `Couldn't toggle ${nm}`) : moreInfo(this, x.entity);
      grid.append(cell);
      return cell;
    });
    if (cells.length && !cells.some(x => x.tabIndex === 0)) cells[0].tabIndex = 0;
    for (let k = n % cols ? cols - (n % cols) : 0; k > 0; k--) { const sl = el("span", "slot"); sl.setAttribute("aria-hidden", "true"); grid.append(sl); }
    grid.addEventListener("keydown", e => {
      const i = cells.indexOf(e.target);
      if (i < 0) return;
      const j = {ArrowRight: i + 1, ArrowLeft: i - 1, ArrowDown: i + cols, ArrowUp: i - cols, Home: 0, End: n - 1}[e.key];
      if (j === undefined || j < 0 || j >= n) return;
      e.preventDefault();
      cells[i].tabIndex = -1; cells[j].tabIndex = 0; cells[j].focus();
    });
    const count = tog.length ? tog.filter(id => h.states[id].state === "on").length : ons.length;
    const ct = el("div", "ct");
    ct.append(el("span", "big num", String(count)), el("span", "label", `of ${tog.length || n} on`));
    ct.setAttribute("role", "img"); ct.setAttribute("aria-label", `${count} of ${tog.length || n} on`);
    hd.append(ct);
    this._restText = ons.length ? `On: ${ons.join(", ")}` : "All off";
    cap.textContent = this._restText;
    face.append(hd, grid, cap);
    b.append(root);
  }
  _rest(cap) {
    const a = this.shadowRoot.activeElement;
    if (a && a.classList && a.classList.contains("cell")) { cap.textContent = `${a.dataset.jamName} · ${a.dataset.st}`; return; }
    cap.textContent = this._restText; cap.classList.add("rest");
  }
  getCardSize() { return 3; }
  getGridOptions() { return {columns: 6, rows: "auto", min_columns: 4}; }
}
register("jam-matrix", JamMatrix, "Jam Matrix", "A toggle matrix: one square cell per entity, filled while on, with the count of what is on as a big numeral.");
