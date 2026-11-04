/* ---------- jam-linemap: the house as a subway map (designed for the Transit look, drawn in every look) ----------
   {type: custom:jam-linemap, title?, accent? (title rule), lines: [{name, color? (hue or room alias; default: ochre, teal,
    blue, pink, violet, green by position), path? (navigation path: tap the line name), stations: [entity ids]}]}
   Every room is a line in its colour (8px track, 45-degree chamfers, a 90-degree terminal tick); every entity is a station
   along it, in the order given: a 20px filled disc = on (name 600), a 12px hollow one = off (name --dim), a dashed ring =
   unavailable / missing ("Offline", a missing entity named from its object id), a tick across the track = a sensor (its
   value under the name). A line with on / off stations and nothing on is out of service (dashed, faded track; "Out of
   service" in place of the count). A lit interchange's core takes the line colour. A line longer than a row turns
   back on the next row (boustrophedon, a 45 / 90 / 45 U-turn in the side gutter). An entity on two or more lines is an
   interchange: a bigger ring on each line, its name followed by small bullets of the other lines. The line name starts
   the track with a route bullet (the line colour with its first letter; the letter in the look's dark or light text,
   whichever reads 4.5:1 on that colour, else a ring bullet with the letter in --fg). Tap a station = toggle (on / off
   entities) or more-info (anything else, unavailable ones too); tap the line name = navigate to its path (no path: plain
   text). Layout in px from the card width (ResizeObserver; columns of 76-150px, no more than the longest line needs, so every
   station is >= 44px wide). */
const LM_G = 16, LM_CW = 76, LM_HEAD = 44, LM_ROW = 96, LM_DOT = 18, LM_CH = 14, LM_NS = "http://www.w3.org/2000/svg";
const LM_HUES = ["ochre", "teal", "blue", "pink", "violet", "green"];
/* First letter or digit of a name, uppercase ("" when none). */
function jamInitial(t) { const m = /[\p{L}\p{N}]/u.exec(String(t || "")); return m ? m[0].toLocaleUpperCase() : ""; }
/* A route bullet: span.lb with the letter, --lc = its hue (a CSS colour, e.g. var(--teal)). jamPaintBullets colours the
   letters once the card is in the page. */
function jamBullet(letter, hue, cls) {
  const b = el("span", "lb ring" + (cls ? " " + cls : ""), letter);
  b.style.setProperty("--lc", hue);
  b.setAttribute("aria-hidden", "true");
  return b;
}
/* Letter colour per bullet: the look's dark / light text on the resolved hue (textOn); a hue where neither reaches 4.5:1,
   or a detached card, keeps the ring bullet (letter in --fg on the face). Returns false while detached. */
function jamPaintBullets(root, body) {
  if (!body || !body.isConnected) return false;
  const tc = textColors(body), seen = new Map();
  for (const b of root.querySelectorAll(".lb")) {
    const hue = b.style.getPropertyValue("--lc");
    if (!seen.has(hue)) { const rgb = resolveRgb(b, "var(--lc)"); seen.set(hue, rgb ? textOn(rgb, tc) : null); }
    const t = seen.get(hue), ring = !t || t.plate;
    b.classList.toggle("ring", ring);
    if (ring) b.style.removeProperty("--lb-fg"); else b.style.setProperty("--lb-fg", t.fg);
  }
  return true;
}
const JAM_BULLET_CSS = `
    .lb{flex:none;display:inline-grid;place-items:center;width:28px;height:28px;border-radius:50%;background:var(--lc);color:var(--lb-fg,var(--on-fg));
      font:700 15px/1 var(--body);letter-spacing:0;text-transform:none;font-variant-numeric:tabular-nums}
    .lb.ring{background:var(--slab);color:var(--fg);box-shadow:inset 0 0 0 4px var(--lc)}
    .lb.sm{width:16px;height:16px;font-size:10px}
    .lb.sm.ring{box-shadow:inset 0 0 0 2px var(--lc)}`;
/* Focus kept over a re-render: the focused control's data-entity (and its line, for a station on two lines). */
function jamFocusRef(card) {
  const a = card.shadowRoot && card.shadowRoot.activeElement;
  return a && a.dataset && a.dataset.entity ? {e: a.dataset.entity, l: a.closest(".ln") ? [...card.shadowRoot.querySelectorAll(".ln")].indexOf(a.closest(".ln")) : -1} : null;
}
function jamFocusBack(card, ref) {
  if (!ref) return;
  const all = [...card.shadowRoot.querySelectorAll("[data-entity]")].filter(n => n.dataset.entity === ref.e);
  const n = all.find(x => ref.l < 0 || [...card.shadowRoot.querySelectorAll(".ln")].indexOf(x.closest(".ln")) === ref.l) || all[0];
  if (n) { n.tabIndex = 0; n.focus({preventScroll: true}); }
}
/* A station that shows a value (a sensor, any numeric state) is a tick on the track, not an on / off station. */
function lmTick(id, s) { const d = id.split(".")[0]; return d === "sensor" || d === "input_number" || d === "number" || (s.state !== "" && isFinite(Number(s.state))); }
/* A missing entity's name from its object id ("light.porch_lamp" -> "Porch lamp"), never the raw id. */
function lmPretty(id) { const t = String(id).split(".").pop().replace(/_/g, " ").trim(); return t ? t[0].toUpperCase() + t.slice(1) : "Offline"; }
function lmSvg(tag, attrs) { const e = document.createElementNS(LM_NS, tag); for (const k in attrs) e.setAttribute(k, attrs[k]); return e; }

class JamLinemap extends JamBase {
  validate(c) {
    if (!Array.isArray(c.lines) || !c.lines.length) throw new Error("jam-linemap: lines is required (a list of {name, stations})");
    c.lines.forEach((l, i) => {
      if (!l || typeof l !== "object") throw new Error(`jam-linemap: line ${i + 1} is not an object`);
      if (!Array.isArray(l.stations) || !l.stations.length || !l.stations.every(s => typeof s === "string" && s.includes(".")))
        throw new Error(`jam-linemap: line ${i + 1} needs stations (a list of entity ids)`);
    });
  }
  watched() { return [...new Set(this._config.lines.flatMap(l => l.stations))]; }
  css() { return `
    .lm{display:grid;gap:10px;align-content:start}
    .ttl{font-size:calc(1.6rem * var(--disp-scale));margin:0}
    .rule{height:var(--rule-h);background:var(--acc);margin-top:-2px}
    .map{display:grid;gap:14px}
    .ln{position:relative}
    .trk{position:absolute;left:0;top:0;overflow:visible;pointer-events:none}
    .trk path{fill:none;stroke:var(--lc);stroke-width:var(--lm-w,8px);stroke-linejoin:miter;stroke-linecap:butt}
    .lh{position:relative;display:flex;align-items:center;gap:10px;height:${LM_HEAD - 8}px;min-width:0;text-align:left;color:var(--fg)}
    button.lh{max-width:100%}
    .lh .nm{min-width:0;font-family:var(--display);font-weight:var(--disp-w);text-transform:var(--disp-case);font-size:calc(1.25rem * var(--disp-scale));
      line-height:calc(1 * var(--disp-lead));white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
    .lh .ct{flex:none;font:500 .78rem/1.2 var(--body);color:var(--dim);font-variant-numeric:tabular-nums}
    .st{position:absolute;display:flex;flex-direction:column;align-items:stretch;gap:2px;padding:${LM_DOT + 16}px 4px 0;text-align:center;color:var(--fg)}
    /* stations: on = 20px filled, off = 12px hollow, unavailable = dashed ring, interchange = 26px ring (lit: line-colour core),
       a sensor = a tick across the track (a value, not an off station) */
    .dot{--d:12px;position:absolute;left:50%;top:calc(${LM_DOT}px - var(--d) / 2);width:var(--d);height:var(--d);margin-left:calc(var(--d) / -2);
      border-radius:50%;background:var(--slab);box-shadow:inset 0 0 0 2.5px var(--fg)}
    .st.on .dot{--d:20px;background:var(--fg);box-shadow:none}
    .st.na .dot{--d:16px;background:var(--slab);box-shadow:none;border:2.5px dashed var(--dim)}
    .st.ix .dot{--d:26px;box-shadow:inset 0 0 0 4px var(--fg)}
    .st.ix.on .dot{background:var(--lc);box-shadow:inset 0 0 0 4px var(--fg)}
    .st.tk .dot{--d:20px;width:5px;margin-left:-2.5px;border-radius:0;background:var(--fg);box-shadow:none}
    .sn{font:500 .78rem/1.25 var(--body);color:var(--dim);overflow-wrap:anywhere;
      display:-webkit-box;-webkit-box-orient:vertical;-webkit-line-clamp:2;overflow:hidden}
    .st.on .sn,.st.tk .sn{font-weight:600;color:var(--fg)}
    .sn .lb{vertical-align:-3px;margin-left:3px}
    .sv{font:500 .72rem/1.2 var(--body);color:var(--dim);white-space:nowrap;overflow:hidden;
      text-overflow:ellipsis;font-variant-numeric:tabular-nums}
    .st.tk .sv{color:var(--fg);font-weight:600}
    .st:not(:disabled):hover .dot{outline:3px solid var(--line);outline-offset:2px}
    /* a line with nothing on is out of service: the track dashed and faded (text keeps its colour) */
    .ln.oos .trk path{stroke-dasharray:10 7;opacity:.35}
    ${JAM_BULLET_CSS}`; }
  connectedCallback() {
    super.connectedCallback();
    if (!this._ro && window.ResizeObserver) this._ro = new ResizeObserver(() => this._layout());
    if (this._ro) this._ro.observe(this);
    if (this._body && this._wait) this._wait = !jamPaintBullets(this.shadowRoot, this._body);
  }
  disconnectedCallback() { super.disconnectedCallback(); if (this._ro) this._ro.disconnect(); }
  /* A look / mode switch (queueLook) changes the hues: colour the letters again. */
  _themeRefresh() { if (this._body) this._wait = !jamPaintBullets(this.shadowRoot, this._body); }
  _render(force) { const ref = jamFocusRef(this); super._render(force); jamFocusBack(this, ref); }
  _lines() {
    return this._config.lines.map((l, i) => ({name: l.name || `Line ${i + 1}`, hue: accentVar(l.color) || `var(--${LM_HUES[i % LM_HUES.length]})`,
      path: typeof l.path === "string" && l.path ? l.path : null, stations: l.stations}));
  }
  render(b) {
    const c = this._config, h = this._hass, lines = this._lines();
    const {root, face} = this.paper("map", {face: "lm"});
    if (c.title) { face.append(el("h2", "disp ttl", c.title), el("div", "rule")); }
    const map = el("div", "map");
    map.setAttribute("role", "group"); map.setAttribute("aria-label", c.title || "Line map");
    const linesOf = new Map(); // entity -> line indexes
    lines.forEach((l, i) => l.stations.forEach(id => { if (!linesOf.has(id)) linesOf.set(id, []); if (!linesOf.get(id).includes(i)) linesOf.get(id).push(i); }));
    this._ln = lines.map((l, i) => {
      const ln = el("div", "ln");
      ln.style.setProperty("--lc", l.hue);
      ln.setAttribute("role", "group"); ln.setAttribute("aria-label", l.name);
      const trk = lmSvg("svg", {class: "trk", "aria-hidden": "true"});
      ln.append(trk);
      const tog = l.stations.filter(id => { const s = stateObj(h, id); return s && toggleable(id) && (s.state === "on" || s.state === "off"); });
      const on = tog.filter(id => h.states[id].state === "on").length;
      const lit = l.stations.some(id => { const s = stateObj(h, id); return s && !UNAVAILABLE.has(s.state) && !lmTick(id, s) && tone(s) === "on"; });
      const oos = tog.length > 0 && !lit;
      if (oos) ln.classList.add("oos");
      const count = !tog.length ? "" : oos ? "Out of service" : `${on} of ${tog.length} on`;
      const head = el(l.path ? "button" : "div", l.path ? "lh hit" : "lh"); // .hit: a 44px touch target over the 36px row
      head.append(jamBullet(jamInitial(l.name), l.hue), el("span", "nm", l.name));
      if (count) head.append(el("span", "ct", count));
      if (l.path) {
        head.setAttribute("aria-label", `${l.name}${count ? ", " + count : ""}, open`);
        head.onclick = () => navigate(l.path);
      }
      ln.append(head);
      const sts = l.stations.map(id => {
        const s = stateObj(h, id), na = !s || UNAVAILABLE.has(s.state), name = s ? friendly(h, id) : lmPretty(id);
        const flip = !na && toggleable(id) && (s.state === "on" || s.state === "off"), tick = !na && !flip && lmTick(id, s);
        const isOn = !na && !tick && tone(s) === "on", others = linesOf.get(id).filter(j => j !== i);
        const st = el("button", "st" + (isOn ? " on" : "") + (na ? " na" : "") + (tick ? " tk" : "") + (others.length ? " ix" : ""));
        st.dataset.entity = id; st.dataset.jamName = name;
        const dot = el("span", "dot"), sn = el("span", "sn", name);
        for (const j of others) sn.append(jamBullet(jamInitial(lines[j].name), lines[j].hue, "sm"));
        st.append(dot, sn);
        const val = na ? "Offline" : flip ? "" : fmtState(h, s);
        if (val) st.append(el("span", "sv", val));
        const via = others.length ? `, change for ${others.map(j => lines[j].name).join(", ")}` : "";
        if (flip) {
          st.setAttribute("aria-pressed", isOn ? "true" : "false");
          st.setAttribute("aria-label", `${name}${via}`);
          st.onclick = () => jamCall(st, this._hass, "homeassistant", "toggle", {entity_id: id}, "toggle", `Couldn't toggle ${name}`);
        } else {
          st.setAttribute("aria-label", `${name}, ${val}${via}`);
          st.onclick = () => moreInfo(this, id);
        }
        ln.append(st);
        return st;
      });
      map.append(ln);
      return {ln, trk, sts};
    });
    face.append(map);
    b.append(root);
    this._map = map; this._w = -1;
    this._wait = !jamPaintBullets(this.shadowRoot, b);
    this._layout();
  }
  /* Positions every station from the map width (only when it changed since the last layout) and draws the tracks. */
  _layout() {
    const map = this._map;
    if (!map || !map.isConnected) return;
    const W = Math.round(map.clientWidth);
    if (!W || W === this._w) return;
    this._w = W;
    // Columns of at least 76px; no more than the longest line needs (so short maps spread out), each at most 150px.
    const most = Math.max(...this._ln.map(l => l.sts.length));
    const cols = Math.max(2, Math.min(12, most, Math.floor((W - 2 * LM_G) / LM_CW))), cw = Math.min(150, (W - 2 * LM_G) / cols);
    for (const {ln, trk, sts} of this._ln) {
      const n = sts.length, rows = Math.ceil(n / cols), H = LM_HEAD + rows * LM_ROW;
      ln.style.height = H + "px";
      trk.setAttribute("width", W); trk.setAttribute("height", H); trk.setAttribute("viewBox", `0 0 ${W} ${H}`);
      const pos = sts.map((st, i) => {
        const r = Math.floor(i / cols), k = i - r * cols, x = r % 2 ? W - LM_G - (k + .5) * cw : LM_G + (k + .5) * cw, y = LM_HEAD + r * LM_ROW;
        st.style.left = (x - cw / 2).toFixed(1) + "px"; st.style.top = y + "px"; st.style.width = cw.toFixed(1) + "px"; st.style.height = (LM_ROW - 6) + "px";
        return [x, y + LM_DOT, r];
      });
      // Track: from the bullet down a 45-degree chamfer, through the stations, U-turns in the gutter, a terminal tick.
      const f = v => +v.toFixed(1), bx = 14, by = 18, y0 = pos[0][1];
      let d = `M${bx} ${by}V${y0 - LM_CH}L${bx + LM_CH} ${y0}`;
      for (let i = 0; i < n; i++) {
        const [x, y, r] = pos[i];
        d += `H${f(x)}`;
        if (i + 1 < n && pos[i + 1][2] !== r) {
          const xe = r % 2 ? 8 : W - 8, s = r % 2 ? 1 : -1, y1 = pos[i + 1][1];
          d += `H${f(xe + s * LM_CH)}L${xe} ${y + LM_CH}V${y1 - LM_CH}L${f(xe + s * LM_CH)} ${y1}`;
        }
      }
      const [xl, yl, rl] = pos[n - 1], dir = rl % 2 ? -1 : 1, xt = f(xl + dir * Math.min(24, cw / 2 - 4));
      d += `H${xt}`;
      trk.textContent = "";
      trk.append(lmSvg("path", {d}), lmSvg("path", {d: `M${xt} ${yl - 11}V${yl + 11}`}));
    }
  }
  getCardSize() { return 2 + this._config.lines.length * 2; }
  getGridOptions() { return {columns: 12, rows: "auto", min_columns: 6}; }
}
register("jam-linemap", JamLinemap, "Jam Line Map", "Rooms as subway lines, entities as stations: tap a station to toggle it, a line name to open its room.");
