/* ---------- jam-button: chunky cut-paper key for launchers, scenes, scripts, stereo keys and openers ----------
   {type: custom:jam-button, entity?, name?, icon?, accent?: ochre|red|teal|paper|ink, color?: HA colour name,
    show_state?, size?: normal|big, tap_action?, hold_action?, double_tap_action?}
   Default tap: scene./script. -> <domain>.turn_on, toggleable entity -> toggle, other entity -> more-info.
   Accent = flat block on the left 40% of the face (text over it is reprinted in the block's ink); light/switch/fan/
   input_boolean "on" = full ochre face. ink (and HA grey colours) = plain key without a block. */
const JB_COLOR = {red: "red", pink: "red", "deep-orange": "red", orange: "ochre", amber: "ochre", yellow: "ochre", primary: "ochre",
  blue: "teal", "light-blue": "teal", cyan: "teal", teal: "teal", green: "teal", indigo: "teal", purple: "teal", "light-grey": "ink", grey: "ink"};
const JB_ACC = {ochre: ["var(--ochre)", "var(--ink)"], red: ["var(--red)", "var(--ink)"], teal: ["var(--teal)", "var(--ink)"],
  paper: ["var(--paper)", "var(--paper-fg)"]};
const JB_ON = new Set(["light", "switch", "fan", "input_boolean"]);
class JamButton extends JamBase {
  validate(c) { if (!c.entity && !c.name && !c.icon) throw new Error("jam-button: entity, name or icon is required"); }
  watched() { return this._config.entity ? [this._config.entity] : []; }
  css() { return `
    .btn{min-height:88px}
    .kf{--p-t:10px;--p-r:10px;--p-b:10px;--p-l:10px;display:flex;min-height:88px}
    .big .kf{min-height:120px}
    .kf.on{background:var(--ochre);color:var(--ink)}
    .k{position:relative;flex:1;min-width:0;display:flex;container-type:inline-size}
    .blk{position:absolute;top:calc(-1 * (var(--p-t) + var(--tt,0px)));bottom:calc(-1 * (var(--p-b) + var(--tb,0px)));
      left:calc(-1 * (var(--p-l) + var(--tl,0px)));width:calc(var(--p-l) + var(--tl,0px) + 40%);background:var(--acc)}
    .layer{position:relative;flex:1;min-width:0;display:flex;flex-direction:column;justify-content:flex-end;gap:6px}
    .over{position:absolute;inset:0;color:var(--acc-fg);clip-path:inset(0 60% 0 0)}
    .ic{--mdc-icon-size:28px;display:block;width:28px;height:28px}
    .lbl{font-family:var(--display);font-weight:900;text-transform:uppercase;line-height:.92;letter-spacing:-.005em;
      font-size:min(var(--fs,1.25rem), calc(100cqi / (var(--fit) * .5)));overflow-wrap:normal;word-break:normal;hyphens:none;text-wrap:balance}
    .big{--fs:1.9rem}
    .st{font:600 .66rem/1.2 var(--body);letter-spacing:.14em;text-transform:uppercase;overflow-wrap:anywhere}
    .layer:not(.over) .st{color:var(--dim)} .on .layer .st{color:var(--ink)}`; }
  _accent() {
    const c = this._config, a = c.accent || JB_COLOR[c.color];
    return JB_ACC[a] ? a : null;
  }
  _tap() {
    const c = this._config, d = (c.entity || "").split(".")[0];
    if (c.tap_action) return c.tap_action;
    if (d === "scene" || d === "script") return {action: "perform-action", perform_action: d + ".turn_on", data: {entity_id: c.entity}};
    if (c.entity && toggleable(c.entity)) return {action: "toggle"};
    return {action: c.entity ? "more-info" : "none"};
  }
  render(b) {
    const c = this._config, h = this._hass, s = stateObj(h, c.entity), d = (c.entity || "").split(".")[0];
    const on = !!s && s.state === "on" && JB_ON.has(d), acc = on ? null : this._accent();
    const un = !!c.entity && (!s || UNAVAILABLE.has(s.state));
    const name = c.name || friendly(h, c.entity) || "";
    const {root, face} = this.paper(c.entity || name || c.icon, {edges: "rb", depth: 3, cut: true,
      cls: "press btn" + (c.size === "big" ? " big" : ""), face: "kf" + (on ? " on" : "") + (un ? " unavail" : "")});
    root.tabIndex = 0; root.setAttribute("role", "button"); root.setAttribute("aria-label", name);
    if (s && JB_ON.has(d)) root.setAttribute("aria-pressed", on ? "true" : "false");
    bindActions(root, () => this._hass, {...c, tap_action: this._tap()}, c.entity);
    const k = el("div", "k");
    /* Font fits the longest word into the key width, so labels wrap by word and never mid-word. */
    k.style.setProperty("--fit", Math.max(4, ...String(name).split(/\s+/).map(w => w.length)));
    const layer = cls => {
      const L = el("div", "layer" + cls), i = icon(c.icon || (s && s.attributes.icon));
      if (i) { i.classList.add("ic"); L.append(i); }
      if (name) L.append(el("div", "lbl", name));
      if (c.show_state && s) L.append(el("div", "st num", fmtState(h, s)));
      return L;
    };
    if (acc) {
      root.style.setProperty("--acc", JB_ACC[acc][0]); root.style.setProperty("--acc-fg", JB_ACC[acc][1]);
      const blk = el("div", "blk"), over = layer(" over");
      blk.setAttribute("aria-hidden", "true"); over.setAttribute("aria-hidden", "true");
      k.append(blk, layer(""), over);
    } else k.append(layer(""));
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
register("jam-button", JamButton, "Jam Button", "Chunky cut-paper key for launchers, scenes, scripts and openers.");
