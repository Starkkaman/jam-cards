/* ---------- jam-button: chunky key for launchers, scenes, scripts, stereo keys and openers ----------
   {type: custom:jam-button, entity?, name?, icon?, accent?: colour or room alias | paper | ink (DESIGN "Colour system"),
    color?: HA colour name, show_state?, size?: normal|big, tap_action?, hold_action?, double_tap_action?}
   Default tap: scene./script. -> <domain>.turn_on, button./input_button. -> <domain>.press, toggleable entity -> toggle,
   other entity -> more-info. Stateless domains (button, input_button, scene, script) are only greyed when "unavailable":
   "unknown" and a timestamp are their normal states.
   Shape: key cut (top-right 12px), slab face. Accent (accent, else color mapped by JB_COLOR, else the card default ochre)
   = a small square with a cut corner in the top-left carrying the icon in ink (28px, big 36px); light/switch/fan/input_boolean
   "on" = the whole face in the accent with ink text, the square turns ink with the icon in the accent.
   ink (and HA grey colours) = plain key without a square (on = inverted fg face).
   Height (0.3.5): size normal = 84px with grid rows "auto", exactly a jam-light card, so a switch key sits level with light
   cards in the same row; big = 120px (grid rows 2). */
const JB_COLOR = {red: "red", "deep-orange": "red", orange: "ochre", amber: "ochre", yellow: "ochre", primary: "ochre",
  pink: "pink", blue: "blue", "light-blue": "blue", indigo: "blue", cyan: "teal", teal: "teal",
  purple: "violet", "deep-purple": "violet", green: "green", "light-green": "green", lime: "green", "light-grey": "ink", grey: "ink"};
const JB_ON = new Set(["light", "switch", "fan", "input_boolean"]);
const JB_STATELESS = new Set(["button", "input_button", "scene", "script"]);
class JamButton extends JamBase {
  validate(c) { if (!c.entity && !c.name && !c.icon) throw new Error("jam-button: entity, name or icon is required"); }
  watched() { return this._config.entity ? [this._config.entity] : []; }
  css() { return `
    .btn{min-height:84px}
    .kf{--p-t:10px;--p-r:12px;--p-b:10px;--p-l:10px;display:flex;min-height:84px}
    .big,.big .kf{min-height:120px}
    .kf.on{background:var(--acc);color:var(--acc-fg)}
    .k{position:relative;flex:1;min-width:0;display:flex;flex-direction:column;justify-content:space-between;gap:6px;container-type:inline-size}
    .sq{flex:none;display:grid;place-items:center;width:28px;height:28px;background:var(--acc);color:var(--acc-fg);
      clip-path:polygon(0 0,100% 0,100% 70%,70% 100%,0 100%)}
    .big .sq{width:36px;height:36px}
    .on .sq{background:var(--acc-fg);color:var(--acc)}
    .layer{min-width:0;display:flex;flex-direction:column;justify-content:flex-end;gap:6px;margin-top:auto}
    .ic{--mdc-icon-size:28px;display:block;width:28px;height:28px}
    .sq .ic{--mdc-icon-size:18px;width:18px;height:18px}
    .big .sq .ic{--mdc-icon-size:24px;width:24px;height:24px}
    .lbl{font-family:var(--display);font-weight:900;text-transform:uppercase;line-height:.92;letter-spacing:-.005em;
      font-size:min(var(--fs,1.25rem), calc(100cqi / (var(--fit) * .5)));overflow-wrap:normal;word-break:normal;hyphens:none;text-wrap:balance}
    .big{--fs:1.9rem}
    .st{font:600 .66rem/1.2 var(--body);letter-spacing:.14em;text-transform:uppercase;overflow-wrap:anywhere}
    .st{color:var(--dim)} .on .st{color:var(--acc-fg)}`; }
  /* Configured accent name (accent wins over color), or null = the card default. */
  _accent() {
    const c = this._config;
    return accentName(c.accent) || JB_COLOR[c.color] || null;
  }
  _tap() {
    const c = this._config, d = (c.entity || "").split(".")[0];
    if (c.tap_action) return c.tap_action;
    if (d === "scene" || d === "script") return {action: "perform-action", perform_action: d + ".turn_on", data: {entity_id: c.entity}};
    if (d === "button" || d === "input_button") return {action: "perform-action", perform_action: d + ".press", data: {entity_id: c.entity}};
    if (c.entity && toggleable(c.entity)) return {action: "toggle"};
    return {action: c.entity ? "more-info" : "none"};
  }
  render(b) {
    const c = this._config, h = this._hass, s = stateObj(h, c.entity), d = (c.entity || "").split(".")[0];
    const on = !!s && s.state === "on" && JB_ON.has(d), acc = this._accent(), plain = acc === "ink";
    const un = !!c.entity && (!s || (JB_STATELESS.has(d) ? s.state === "unavailable" : UNAVAILABLE.has(s.state)));
    const name = c.name || friendly(h, c.entity) || "";
    const {root, face} = this.paper(c.entity || name || c.icon, {kind: "key",
      cls: "press btn" + (c.size === "big" ? " big" : ""), face: "kf" + (on ? " on" : "") + (un ? " unavail" : "")});
    if (plain) { root.style.setProperty("--acc", "var(--fg)"); root.style.setProperty("--acc-fg", "var(--slab)"); }
    else if (acc) setAccent(root, acc);
    root.tabIndex = 0; root.setAttribute("role", "button"); root.setAttribute("aria-label", name);
    if (s && JB_ON.has(d)) root.setAttribute("aria-pressed", on ? "true" : "false");
    bindActions(root, () => this._hass, {...c, tap_action: this._tap()}, c.entity);
    const k = el("div", "k");
    /* Font fits the longest word into the key width, so labels wrap by word and never mid-word. */
    k.style.setProperty("--fit", Math.max(4, ...String(name).split(/\s+/).map(w => w.length)));
    const ic = icon(c.icon || (s && s.attributes.icon)), L = el("div", "layer");
    if (ic) ic.classList.add("ic");
    if (!plain) {
      const sq = el("span", "sq");
      sq.setAttribute("aria-hidden", "true");
      if (ic) sq.append(ic);
      k.append(sq);
    } else if (ic) L.append(ic);
    if (name) L.append(el("div", "lbl", name));
    if (c.show_state && s) L.append(keepUnit(el("div", "st num", fmtState(h, s)), s));
    k.append(L);
    face.append(k);
    b.append(root);
    this._fit(k);
  }
  /* Safety net for fallback fonts: shrink a label that still overflows its key (a word never breaks). */
  _fit(k) {
    if (this._ro) this._ro.disconnect();
    let w = -1;
    const fit = () => {
      if (!k.isConnected || k.clientWidth === w) return;
      w = k.clientWidth;
      for (const l of k.querySelectorAll(".lbl")) {
        l.style.fontSize = "";
        if (l.scrollWidth > l.clientWidth + 0.5) l.style.fontSize = (parseFloat(getComputedStyle(l).fontSize) * l.clientWidth / l.scrollWidth - 0.3).toFixed(2) + "px";
      }
    };
    if (window.ResizeObserver) { this._ro = new ResizeObserver(fit); this._ro.observe(k); }
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => { w = -1; fit(); });
  }
  getCardSize() { return this._config.size === "big" ? 3 : 2; }
  getGridOptions() { return {columns: 3, rows: this._config.size === "big" ? 2 : "auto", min_columns: 2}; }
}
register("jam-button", JamButton, "Jam Button", "Chunky key for launchers, scenes, scripts and openers.");
