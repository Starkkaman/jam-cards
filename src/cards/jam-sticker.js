/* ---------- jam-sticker: a note that shows only while its condition holds (designed for the New Wave look) ----------
   {type: custom:jam-sticker, conditions: [{condition?: state | numeric_state, entity, state? (string | list), state_not?
    (string | list), above?, below?}] (all must hold; like HA's visibility conditions; without `condition` an item with
    above / below is numeric_state, else state), title, text?, severity?: info (default) | warn | alert,
    action_name? ("Open"), tap_action? (a key on the sticker runs it), entity? (the key's more-info default)}
   While a condition fails the card hides itself (host `hidden`, nothing rendered; shown anyway with card.preview, which HA
   sets in the card picker and the dashboard editor). Shown: a flat note in the severity
   colour (--sk: info teal, warn ochre, alert red; a look pack may set its own, New Wave: mint / sticker yellow / red),
   the cut corner as the peeled corner, the title in the display type, the text, and an optional key (a --slab plate with
   --fg text). The text colour is the look's dark or light text, whichever reads 4.5:1 on the resolved --sk; when neither
   does the note becomes a --slab face with a severity stripe. Screen readers hear the severity word first (role status).
   An alert sticker has a 1.3x title after a triangle mark and comes first among its siblings (host order -1, where the host
   is the grid item); the host never stretches to its row (align-self start). Tilt and shadow are look effects (New Wave
   under data-fx), never motion. */
const SK_SEV = ["info", "warn", "alert"], SK_WORD = {info: "Note", warn: "Heads up", alert: "Alert"};
const skList = v => (v === undefined || v === null ? null : (Array.isArray(v) ? v : [v]).map(String));
/* The alert mark: a warning triangle with the "!" cut out (evenodd), in the text colour (plate: the severity colour). */
function skMark() {
  const NS = "http://www.w3.org/2000/svg", svg = document.createElementNS(NS, "svg"), p = document.createElementNS(NS, "path");
  svg.setAttribute("viewBox", "0 0 24 22"); svg.setAttribute("class", "mk"); svg.setAttribute("aria-hidden", "true");
  p.setAttribute("d", "M12 0L24 22H0ZM10.6 7h2.8v8h-2.8ZM10.6 16.8h2.8v2.8h-2.8Z"); p.setAttribute("fill-rule", "evenodd");
  svg.append(p);
  return svg;
}
class JamSticker extends JamBase {
  validate(c) {
    if (!Array.isArray(c.conditions) || !c.conditions.length) throw new Error("jam-sticker: conditions is required (a list of {entity, state} / {entity, above, below})");
    for (const k of c.conditions) if (!k || typeof k.entity !== "string") throw new Error("jam-sticker: every condition needs an entity");
    if (!c.title && !c.text) throw new Error("jam-sticker: give a title or a text");
    if (c.severity !== undefined && !SK_SEV.includes(c.severity)) throw new Error("jam-sticker: severity is info, warn or alert");
  }
  watched() { return [...new Set([...this._config.conditions.map(k => k.entity), this._config.entity].filter(Boolean))]; }
  /* One condition: state (equals one of `state`, none of `state_not`) or numeric_state (above < value < below). */
  _holds(k) {
    const s = stateObj(this._hass, k.entity);
    if (!s) return false;
    const num = k.condition === "numeric_state" || (k.condition !== "state" && (k.above !== undefined || k.below !== undefined));
    if (num) {
      const v = Number(s.state);
      if (s.state === "" || !isFinite(v)) return false;
      return (k.above === undefined || v > +k.above) && (k.below === undefined || v < +k.below);
    }
    const yes = skList(k.state), no = skList(k.state_not);
    if (yes && !yes.includes(s.state)) return false;
    if (no && no.includes(s.state)) return false;
    return !!(yes || no) || s.state === "on";
  }
  /* Shown while every condition holds; always in the card picker / dashboard editor (card.preview, set by HA). */
  shown() { return !!this._hass && (!!this._preview || this._config.conditions.every(k => this._holds(k))); }
  /* No view entrance for a hidden sticker (the one-shot class would never play out on a display:none host). */
  _enter(ms) { if (!this.hidden) super._enter(ms); }
  get preview() { return !!this._preview; }
  set preview(v) { v = !!v; if (v === !!this._preview) return; this._preview = v; if (this._config && this._hass) { this._sig = null; this._render(false); } }
  css() { return `
    :host{align-self:start}
    :host([hidden]){display:none}
    :host([data-sev=alert]){order:-1}
    /* raised specificity: a look pack's card-face rules (.host > .paper[data-cut=card] > .face) must not repaint the note */
    .host > .paper[data-cut] > .face.sk{--p-t:16px;--p-r:22px;--p-b:20px;--p-l:18px;background:var(--sk);color:var(--sk-fg,var(--on-fg));display:grid;gap:8px;align-content:start}
    .host > .paper[data-cut] > .face.sk.plate{background:var(--slab);color:var(--fg);border-left:var(--stripe-w) solid var(--sk)}
    .info{--sk:var(--teal)} .warn{--sk:var(--ochre)} .alert{--sk:var(--red)}
    .sr{position:absolute;width:1px;height:1px;overflow:hidden;clip-path:inset(50%);white-space:nowrap}
    .ttl{font-size:calc(1.5rem * var(--disp-scale));margin:0;overflow-wrap:anywhere}
    .alert .ttl{font-size:calc(1.95rem * var(--disp-scale));display:flex;align-items:center;gap:10px}
    .mk{flex:none;width:1.05em;height:.96em;fill:currentColor}
    .plate .mk{fill:var(--sk)}
    .tx{margin:0;font:500 .95rem/1.4 var(--body);max-width:60ch;overflow-wrap:anywhere}
    .act{justify-self:start;margin-top:4px;min-height:44px}
    .act > .face{background:var(--slab);color:var(--fg)}`; }
  render(b) {
    const c = this._config;
    const on = this.shown();
    if (this.hidden === on) this.hidden = !on;
    if (!on) return;
    const sev = c.severity || "info";
    if (this.dataset.sev !== sev) this.dataset.sev = sev;
    const {root, face} = this.paper("note", {face: "sk " + sev});
    face.setAttribute("role", "status");
    face.append(el("span", "sr", SK_WORD[sev] + ": "));
    if (c.title) {
      const t = el("h2", "disp ttl");
      if (sev === "alert") t.append(skMark());
      t.append(el("span", "", c.title));
      face.append(t);
    }
    if (c.text) face.append(el("p", "tx", c.text));
    if (c.tap_action) {
      const k = cutKey(c.action_name || "Open", "jam-sticker|act", "act");
      bindActions(k, () => this._hass, {tap_action: c.tap_action}, c.entity);
      face.append(k);
    }
    b.append(root);
    this._face = face;
    this._wait = !this._paint();
  }
  /* Text colour on the resolved sticker colour (once in the page). */
  _paint() {
    const f = this._face;
    if (!f || !f.isConnected) return false;
    const rgb = resolveRgb(f, "var(--sk)"), t = rgb ? textOn(rgb, textColors(f)) : null;
    f.classList.toggle("plate", !t || t.plate);
    if (t && !t.plate) f.style.setProperty("--sk-fg", t.fg); else f.style.removeProperty("--sk-fg");
    return true;
  }
  connectedCallback() { super.connectedCallback(); if (this._wait) this._wait = !this._paint(); }
  /* A look / mode switch (queueLook, also right after the first attach, once the look pack is adopted): paint again. */
  _themeRefresh() { if (this._face && this._face.isConnected) this._paint(); }
  getCardSize() { return this.hidden ? 0 : 2; }
  getGridOptions() { return {columns: 12, rows: "auto", min_columns: 4}; }
}
register("jam-sticker", JamSticker, "Jam Sticker", "A sticker note that shows only while its conditions hold: alerts, reminders, a key to act on them.");
